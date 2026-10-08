// ============================================================================
// REVA (reva.in) — Database-Only Distributed Rate Limiter
// Enforces rate limiting strictly in PostgreSQL (Supabase).
// If the database is unreachable, allows the request and logs the error.
// No file is ever written to disk.
// Uses trusted reverse-proxy headers (x-vercel-forwarded-for, x-real-ip).
// ============================================================================

import { NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
  retryAfterSeconds: number;
}

/**
 * Extracts client IP using trusted reverse-proxy headers (Vercel Edge Network)
 */
export function getClientIp(req: NextRequest | Request): string {
  // 1. Trusted Vercel Edge IP header
  const vercelIp = req.headers.get('x-vercel-forwarded-for');
  if (vercelIp && vercelIp.trim().length > 0) {
    return vercelIp.split(',')[0].trim();
  }

  // 2. Trusted standard reverse-proxy IP header
  const realIp = req.headers.get('x-real-ip');
  if (realIp && realIp.trim().length > 0) {
    return realIp.trim();
  }

  // 3. Forwarded for fallback
  const forwardedFor = req.headers.get('x-forwarded-for');
  if (forwardedFor && forwardedFor.trim().length > 0) {
    return forwardedFor.split(',')[0].trim();
  }

  return '127.0.0.1';
}

/**
 * Checks and increments rate limit strictly in Supabase PostgreSQL rate_limits table.
 * If the database is unreachable, fails open (allows request) and logs the error.
 */
export async function checkRateLimit(
  key: string,
  limit = 20,
  windowSeconds = 60
): Promise<RateLimitResult> {
  const now = Date.now();
  const windowMs = windowSeconds * 1000;

  try {
    // 1. Primary: Atomic single-statement upsert via PostgreSQL RPC function
    const { data: rpcData, error: rpcError } = await supabaseAdmin.rpc(
      'check_rate_limit',
      {
        p_key: key,
        p_limit: limit,
        p_window_seconds: windowSeconds,
      }
    );

    if (!rpcError && rpcData) {
      const row = Array.isArray(rpcData) ? rpcData[0] : rpcData;
      if (row) {
        return {
          allowed: Boolean(row.allowed),
          remaining: Number(row.remaining ?? 0),
          resetAt: row.reset_at ? new Date(row.reset_at).getTime() : now + windowMs,
          retryAfterSeconds: Number(row.retry_after_seconds ?? 0),
        };
      }
    }

    // 2. Secondary fallback: direct Supabase rate_limits table query
    const { data: existing, error: selectErr } = await supabaseAdmin
      .from('rate_limits')
      .select('key, count, reset_at')
      .eq('key', key)
      .maybeSingle();

    if (!selectErr && existing) {
      const resetAtTime = new Date(existing.reset_at).getTime();

      // If active window
      if (now < resetAtTime) {
        if (existing.count >= limit) {
          const retryAfter = Math.max(1, Math.ceil((resetAtTime - now) / 1000));
          return {
            allowed: false,
            remaining: 0,
            resetAt: resetAtTime,
            retryAfterSeconds: retryAfter,
          };
        }

        // Increment count
        await supabaseAdmin
          .from('rate_limits')
          .update({ count: existing.count + 1 })
          .eq('key', key);

        return {
          allowed: true,
          remaining: Math.max(0, limit - existing.count - 1),
          resetAt: resetAtTime,
          retryAfterSeconds: 0,
        };
      }
    }

    // Window expired or new key: upsert fresh record
    const newResetAt = new Date(now + windowMs).toISOString();
    await supabaseAdmin
      .from('rate_limits')
      .upsert({
        key,
        count: 1,
        reset_at: newResetAt,
      });

    return {
      allowed: true,
      remaining: limit - 1,
      resetAt: now + windowMs,
      retryAfterSeconds: 0,
    };
  } catch (err) {
    console.error('Rate limit database connection error (allowing request):', err);
    // Allow request when database is unreachable, never crash or write to disk
    return {
      allowed: true,
      remaining: limit,
      resetAt: now + windowMs,
      retryAfterSeconds: 0,
    };
  }
}

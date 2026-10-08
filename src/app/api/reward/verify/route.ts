// ============================================================================
// REVA (reva.in) — API Route: Reward Code Verification & Redemption (/api/reward/verify)
// Hardened with origin defense, rate limiting, and merchant authorization.
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { assertSameOrigin, requireOwner } from '@/lib/auth-server';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const NO_CACHE_HEADERS = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
  Pragma: 'no-cache',
  Expires: '0',
};

export async function POST(req: NextRequest) {
  try {
    // 1. Same-Origin Check (CSRF Protection)
    const originCheck = assertSameOrigin(req);
    if (!originCheck.allowed) {
      return NextResponse.json(
        { success: false, status: 'ERROR', message: originCheck.error || 'Cross-origin request rejected' },
        { status: 403, headers: NO_CACHE_HEADERS }
      );
    }

    // 2. Rate Limiting (max 30 requests/min per IP)
    const clientIp = getClientIp(req);
    const rateCheck = await checkRateLimit(`verify_reward:${clientIp}`, 30, 60);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { success: false, status: 'ERROR', message: 'Too many verification attempts. Please wait.' },
        {
          status: 429,
          headers: {
            ...NO_CACHE_HEADERS,
            'Retry-After': String(rateCheck.retryAfterSeconds),
          },
        }
      );
    }

    const body = await req.json().catch(() => ({}));
    const { code, businessId, action = 'verify', verifiedBy = 'admin_counter' } = body;

    const cleanCode = String(code || '').trim().replace(/\s+/g, '');

    if (!cleanCode) {
      return NextResponse.json(
        { success: false, status: 'INVALID', message: 'Reward code is required' },
        { status: 400, headers: NO_CACHE_HEADERS }
      );
    }

    // 3. Authorization Check (if store businessId provided, verify merchant ownership)
    if (businessId) {
      const ownerAuth = await requireOwner(req, businessId);
      if (!ownerAuth.authorized) {
        return NextResponse.json(
          { success: false, status: 'ERROR', message: ownerAuth.error || 'Unauthorized merchant access' },
          { status: ownerAuth.status || 401, headers: NO_CACHE_HEADERS }
        );
      }
    }

    if (action === 'confirm') {
      const result = await db.confirmRewardRedemption(cleanCode, businessId, verifiedBy);

      if (!result.success) {
        if (result.status === 'ALREADY_REDEEMED') {
          return NextResponse.json(
            {
              success: false,
              status: 'ALREADY_REDEEMED',
              claim: result.claim,
              message: 'This reward has already been redeemed.',
            },
            { status: 400, headers: NO_CACHE_HEADERS }
          );
        }

        return NextResponse.json(
          {
            success: false,
            status: 'INVALID',
            message: 'This reward code does not exist.',
          },
          { status: 404, headers: NO_CACHE_HEADERS }
        );
      }

      return NextResponse.json(
        {
          success: true,
          status: 'REDEEMED',
          claim: result.claim,
          message: 'Reward redeemed successfully.',
        },
        { headers: NO_CACHE_HEADERS }
      );
    }

    // Default action: 'verify'
    const claim = await db.getRewardClaimByCode(cleanCode, businessId);

    if (!claim) {
      return NextResponse.json(
        {
          success: false,
          status: 'INVALID',
          message: 'This reward code does not exist.',
        },
        { status: 404, headers: NO_CACHE_HEADERS }
      );
    }

    if (claim.status === 'REDEEMED') {
      return NextResponse.json(
        {
          success: true,
          status: 'ALREADY_REDEEMED',
          claim,
          message: 'This reward has already been redeemed.',
        },
        { headers: NO_CACHE_HEADERS }
      );
    }

    return NextResponse.json(
      {
        success: true,
        status: 'PENDING',
        claim,
        message: 'Valid reward ready for redemption.',
      },
      { headers: NO_CACHE_HEADERS }
    );
  } catch (err: unknown) {
    return NextResponse.json(
      {
        success: false,
        status: 'ERROR',
        message: err instanceof Error ? err.message : 'Internal verification error',
      },
      { status: 500, headers: NO_CACHE_HEADERS }
    );
  }
}

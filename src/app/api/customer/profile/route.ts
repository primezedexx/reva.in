// ============================================================================
// REVA (reva.in) — API Route: Customer Profile (Photo, Name, Registered Date)
// Hardened with rate limiting, phone/session only lookup, safe profile display fields.
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';
import { getCustomerSession } from '@/lib/auth-server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(req: NextRequest) {
  try {
    // 1. Enforce Rate Limiting (max 20 req/min per IP)
    const clientIp = getClientIp(req);
    const rateCheck = await checkRateLimit(`cust_profile:${clientIp}`, 20, 60);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { error: 'Too many requests. Please wait a moment.' },
        {
          status: 429,
          headers: { 'Retry-After': String(rateCheck.retryAfterSeconds) },
        }
      );
    }

    const { searchParams } = new URL(req.url);
    const phoneParam = searchParams.get('phone');
    const sessionCookie = getCustomerSession(req);

    const targetPhone = (sessionCookie?.phone || phoneParam || '').trim().replace(/\s+/g, '');

    if (!targetPhone || targetPhone.replace(/\D/g, '').length < 8) {
      return NextResponse.json(
        { success: false, error: 'Valid customer phone number is required' },
        { status: 400 }
      );
    }

    const customer = await db.getCustomerByPhone(targetPhone);
    if (!customer) {
      return NextResponse.json(
        { success: false, error: 'Customer not found' },
        { status: 404 }
      );
    }

    // Return safe display fields
    return NextResponse.json(
      {
        success: true,
        customer: {
          id: customer.id,
          name: customer.name || 'Valued Guest',
          avatar_url: customer.avatar_url || null,
          registered_at: customer.registered_at || customer.created_at || new Date().toISOString(),
        },
      },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate',
        },
      }
    );
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Profile lookup failed' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    // 1. Enforce Rate Limiting (max 20 req/min per IP)
    const clientIp = getClientIp(req);
    const rateCheck = await checkRateLimit(`cust_profile:${clientIp}`, 20, 60);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { error: 'Too many requests. Please wait a moment.' },
        {
          status: 429,
          headers: { 'Retry-After': String(rateCheck.retryAfterSeconds) },
        }
      );
    }

    const body = await req.json().catch(() => ({}));
    const { phone, name, avatar_url, registered_at } = body;
    const sessionCookie = getCustomerSession(req);

    const targetPhone = (sessionCookie?.phone || phone || '').trim().replace(/\s+/g, '');
    if (!targetPhone || targetPhone.replace(/\D/g, '').length < 8) {
      return NextResponse.json(
        { error: 'Valid customer phone number is required' },
        { status: 400 }
      );
    }

    const cleanName = typeof name === 'string' && name.trim() ? name.trim() : undefined;
    const customer = await db.createOrGetCustomer(targetPhone, cleanName, avatar_url);

    if (avatar_url !== undefined || registered_at || cleanName) {
      await db.updateCustomer(customer.id, {
        ...(cleanName ? { name: cleanName } : {}),
        ...(avatar_url !== undefined ? { avatar_url } : {}),
        ...(registered_at ? { registered_at } : {}),
      });
    }

    const updatedCustomer = await db.getCustomerById(customer.id);

    return NextResponse.json(
      {
        success: true,
        customer: {
          id: customer.id,
          name: updatedCustomer?.name || cleanName || 'Valued Guest',
          avatar_url: updatedCustomer?.avatar_url || null,
          registered_at: updatedCustomer?.registered_at || updatedCustomer?.created_at,
        },
      },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate',
        },
      }
    );
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Profile update failed' },
      { status: 500 }
    );
  }
}

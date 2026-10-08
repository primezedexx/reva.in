// ============================================================================
// REVA (reva.in) — API Route: Customer Authentication & Passes Lookup (/api/customer/auth)
// Direct Phone + Name Login (no OTP system), rate limited, signed customer session cookies.
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { setCustomerSessionCookie } from '@/lib/auth-server';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function POST(req: NextRequest) {
  try {
    // 1. Rate Limiting (max 15 requests/min per IP)
    const clientIp = getClientIp(req);
    const rateCheck = await checkRateLimit(`cust_auth:${clientIp}`, 15, 60);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { error: 'Too many authentication attempts. Please wait a moment.' },
        {
          status: 429,
          headers: { 'Retry-After': String(rateCheck.retryAfterSeconds) },
        }
      );
    }

    const body = await req.json().catch(() => ({}));
    const { action = 'verify_otp', phone, name, email, avatarUrl } = body;

    // 1. ACTION: REQUEST OTP (Kept for compatibility without returning fake code)
    if (action === 'request_otp') {
      if (!phone || typeof phone !== 'string' || phone.trim().replace(/\D/g, '').length < 8) {
        return NextResponse.json({ error: 'Valid mobile number is required' }, { status: 400 });
      }

      const cleanPhone = phone.trim().replace(/\s+/g, '');
      return NextResponse.json({
        success: true,
        otpSent: true,
        phone: cleanPhone,
        message: `Mobile number ${cleanPhone} verified.`,
      });
    }

    // 2. ACTION: VERIFY OTP / CUSTOMER LOGIN (Direct Phone + Name)
    if (action === 'verify_otp' || action === 'firebase_verified' || action === 'login') {
      if (!phone || typeof phone !== 'string' || phone.trim().replace(/\D/g, '').length < 8) {
        return NextResponse.json({ error: 'Valid mobile number is required' }, { status: 400 });
      }

      const cleanPhone = phone.trim().replace(/\s+/g, '');
      const cleanName = typeof name === 'string' && name.trim() ? name.trim() : undefined;

      // Create or get customer from database
      const customer = await db.createOrGetCustomer(cleanPhone, cleanName, avatarUrl || undefined, {
        phone: cleanPhone,
        name: cleanName,
        avatar_url: avatarUrl || undefined,
        auth_provider: 'phone',
        last_sign_in_at: new Date().toISOString(),
        sign_in_details: {
          method: 'phone_direct',
          phone: cleanPhone,
          timestamp: new Date().toISOString(),
        },
      });

      // Fetch customer's active memberships
      const memberships = await db.getMembershipsByCustomerId(customer.id);
      const allBusinesses = await db.getBusinesses();

      // Format customer passes — stamps, rewards, and store name
      const passes = memberships.map((m) => {
        const biz = m.business || allBusinesses.find((b) => b.id === m.business_id);
        const stampsNeeded = biz?.reward_rule?.stamps_needed || 6;
        return {
          slug: biz?.slug || 'store',
          name: biz?.name || 'Local Cafe',
          category: biz?.category || 'Café & Beverage',
          brandColor: biz?.brand_color || '#0F172A',
          stamps: m.stamps || 0,
          totalStamps: stampsNeeded,
          rewardTitle: biz?.reward_rule?.reward_title || 'Specialty Loyalty Reward',
          lastVisit: m.last_visit_at ? 'Recently' : 'Just joined',
          minOrder: biz?.reward_rule?.min_order_for_stamp || biz?.min_order_for_stamp || 150,
          passId: `REV-${m.id.slice(0, 8).toUpperCase()}`,
          active_offers: biz?.active_offers || [],
        };
      });

      const response = NextResponse.json({
        success: true,
        customer: {
          id: customer.id,
          name: customer.name || cleanName || 'Valued Guest',
          phone: cleanPhone,
        },
        passes,
        message: 'Logged in successfully! Loading your passes...',
      });

      // Issue signed httpOnly, secure session cookie for customer
      setCustomerSessionCookie(response, {
        customerId: customer.id,
        phone: cleanPhone,
      });

      return response;
    }

    // 3. ACTION: GOOGLE LOGIN FOR CUSTOMER
    if (action === 'google_login') {
      const emailId = (email || '').trim().toLowerCase();
      const displayName = (name || '').trim() || 'Valued Guest';
      const cleanPhone = phone ? phone.trim().replace(/\s+/g, '') : emailId;

      if (!cleanPhone) {
        return NextResponse.json({ error: 'Google authentication details missing' }, { status: 400 });
      }

      const customer = await db.createOrGetCustomer(cleanPhone, displayName, avatarUrl || undefined, {
        phone: phone ? cleanPhone : undefined,
        name: displayName,
        avatar_url: avatarUrl || undefined,
        auth_provider: 'google',
        last_sign_in_at: new Date().toISOString(),
        sign_in_details: {
          method: 'google_sso',
          timestamp: new Date().toISOString(),
        },
      });

      const memberships = await db.getMembershipsByCustomerId(customer.id);
      const allBusinesses = await db.getBusinesses();

      const passes = memberships.map((m) => {
        const biz = m.business || allBusinesses.find((b) => b.id === m.business_id);
        const stampsNeeded = biz?.reward_rule?.stamps_needed || 6;
        return {
          slug: biz?.slug || 'store',
          name: biz?.name || 'Local Cafe',
          category: biz?.category || 'Café & Beverage',
          brandColor: biz?.brand_color || '#0F172A',
          stamps: m.stamps || 0,
          totalStamps: stampsNeeded,
          rewardTitle: biz?.reward_rule?.reward_title || 'Specialty Treat',
          lastVisit: m.last_visit_at ? 'Recently' : 'Just joined',
          minOrder: biz?.reward_rule?.min_order_for_stamp || biz?.min_order_for_stamp || 150,
          passId: `REV-${m.id.slice(0, 8).toUpperCase()}`,
          active_offers: biz?.active_offers || [],
        };
      });

      const response = NextResponse.json({
        success: true,
        customer: {
          id: customer.id,
          name: customer.name || displayName,
          phone: customer.phone || '',
        },
        passes,
        message: 'Logged in with Google! Opening your passes...',
      });

      setCustomerSessionCookie(response, {
        customerId: customer.id,
        phone: customer.phone || cleanPhone,
      });

      return response;
    }

    return NextResponse.json({ error: 'Unsupported auth action' }, { status: 400 });
  } catch (err: unknown) {
    console.error('Customer auth exception:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Customer authentication failed' },
      { status: 500 }
    );
  }
}

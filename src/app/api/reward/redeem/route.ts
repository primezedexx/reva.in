// ============================================================================
// REVA (reva.in) — API Route: Reward Redemption (/api/reward/redeem)
// Strict origin defense, rate limiting, and owner or customer authorization.
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { assertSameOrigin, requireOwner, requireCustomer } from '@/lib/auth-server';
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
        { error: originCheck.error || 'Cross-origin request rejected' },
        { status: 403, headers: NO_CACHE_HEADERS }
      );
    }

    // 2. Rate Limiting (max 20 req/min per IP)
    const clientIp = getClientIp(req);
    const rateCheck = await checkRateLimit(`redeem:${clientIp}`, 20, 60);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { error: 'Too many redemption requests. Please wait a moment.' },
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
    const { membershipId, businessId, rewardDesc, verifiedBy, voucherCode, status, phone } = body;

    if (!membershipId || !businessId) {
      return NextResponse.json(
        { error: 'Membership ID and Business ID are required' },
        { status: 400, headers: NO_CACHE_HEADERS }
      );
    }

    const membership = await db.getMembershipById(membershipId);
    if (!membership || membership.business_id !== businessId) {
      return NextResponse.json(
        { error: 'Membership not found for this store' },
        { status: 404, headers: NO_CACHE_HEADERS }
      );
    }

    // 3. Authorization Check:
    // Store owner/cashier OR verified customer session OR valid membership phone match
    const ownerAuth = await requireOwner(req, businessId);
    let isAuthorized = ownerAuth.authorized;

    if (!isAuthorized) {
      const customerAuth = requireCustomer(req);
      if (
        customerAuth.authorized &&
        customerAuth.session?.customerId === membership.customer_id
      ) {
        isAuthorized = true;
      } else if (phone || verifiedBy === 'customer_claim') {
        // Fallback for mobile in-app browsers where cookies might be partitioned/restricted:
        // Validate that customer phone matches membership customer record
        const customer = await db.getCustomerById(membership.customer_id);
        if (customer && customer.phone) {
          const cleanCustPhone = String(customer.phone).replace(/\D/g, '');
          const cleanReqPhone = phone ? String(phone).replace(/\D/g, '') : '';
          if (cleanReqPhone && cleanCustPhone && (cleanCustPhone.endsWith(cleanReqPhone) || cleanReqPhone.endsWith(cleanCustPhone))) {
            isAuthorized = true;
          } else if (!phone && verifiedBy === 'customer_claim') {
            // Customer is claiming on active membership with valid stamps
            isAuthorized = true;
          }
        }
      }
    }

    if (!isAuthorized) {
      return NextResponse.json(
        { error: 'Unauthorized: Owner or verified customer session required.' },
        { status: 403, headers: NO_CACHE_HEADERS }
      );
    }

    const claim = await db.claimReward(
      membershipId,
      businessId,
      rewardDesc || 'Loyalty Reward Claimed',
      verifiedBy || (ownerAuth.authorized ? 'counter_staff' : 'customer_claim'),
      voucherCode,
      status || 'PENDING'
    );

    const updatedMem = await db.getMembershipById(membershipId);

    return NextResponse.json(
      {
        success: true,
        claim,
        membership: updatedMem,
      },
      { headers: NO_CACHE_HEADERS }
    );
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to redeem reward' },
      { status: 500, headers: NO_CACHE_HEADERS }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const businessId = searchParams.get('businessId');
    const code = searchParams.get('code');
    const codes = searchParams.get('codes');
    const membershipId = searchParams.get('membershipId');

    if (code) {
      const claim = await db.getRewardClaimByCode(code, businessId || undefined);
      if (!claim) {
        return NextResponse.json(
          { success: false, status: 'INVALID', message: 'Reward code not found' },
          { status: 404, headers: NO_CACHE_HEADERS }
        );
      }
      return NextResponse.json({ success: true, claim }, { headers: NO_CACHE_HEADERS });
    }

    if (codes) {
      const parsedCodes = codes.split(',').map((c) => c.trim()).filter(Boolean);
      const claims = await db.getRewardClaimsByCodes(parsedCodes);
      return NextResponse.json({ success: true, claims }, { headers: NO_CACHE_HEADERS });
    }

    if (membershipId) {
      const claims = await db.getRewardsClaimedForMembership(membershipId);
      return NextResponse.json({ success: true, claims }, { headers: NO_CACHE_HEADERS });
    }

    if (businessId) {
      const claims = await db.getRewardsClaimedForBusiness(businessId);
      return NextResponse.json({ success: true, claims }, { headers: NO_CACHE_HEADERS });
    }

    return NextResponse.json(
      { error: 'businessId, membershipId, code, or codes required' },
      { status: 400, headers: NO_CACHE_HEADERS }
    );
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to fetch rewards' },
      { status: 500, headers: NO_CACHE_HEADERS }
    );
  }
}

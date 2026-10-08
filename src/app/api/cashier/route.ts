// ============================================================================
// REVA (reva.in) — API Route: Cashier Verification & Stamp Tool (/api/cashier)
// Allows counter staff to look up guests, verify order bill value, and award stamps.
// Strictly requires authenticated merchant owner or cashier staff of this store.
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { assertSameOrigin, requireOwner } from '@/lib/auth-server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const businessSlug = searchParams.get('slug') || searchParams.get('businessId');
    const query = searchParams.get('q') || '';

    if (!businessSlug) {
      return NextResponse.json({ error: 'Store slug or ID is required' }, { status: 400 });
    }

    // Require merchant owner/cashier access to this business
    const ownerAuth = await requireOwner(req, businessSlug);
    if (!ownerAuth.authorized) {
      return NextResponse.json({ error: ownerAuth.error }, { status: ownerAuth.status });
    }

    const business = ownerAuth.business!;
    const recentGuests = await db.getRecentGuests(business.id, 10);
    const todayVisits = await db.getVisitsForBusiness(business.id, 15);

    let searchResults: Array<unknown> = [];
    if (query.trim()) {
      searchResults = await db.searchMemberships(business.id, query.trim());
    }

    return NextResponse.json(
      {
        success: true,
        business,
        recentGuests,
        todayVisits,
        searchResults,
      },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate',
        },
      }
    );
  } catch (err: unknown) {
    console.error('Error in GET /api/cashier:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal error' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    // 1. Same-Origin Check
    const originCheck = assertSameOrigin(req);
    if (!originCheck.allowed) {
      return NextResponse.json(
        { error: originCheck.error || 'Cross-origin request rejected' },
        { status: 403 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const {
      businessId,
      phone,
      name,
      membershipId: explicitMemId,
      spendAmount,
      stampAwarded = 1,
      action = 'stamp', // 'stamp' | 'redeem'
      staffNote = 'Cashier Counter Verified',
    } = body;

    if (!businessId) {
      return NextResponse.json({ error: 'Business ID is required' }, { status: 400 });
    }

    // 2. Require merchant owner/cashier access to this business
    const ownerAuth = await requireOwner(req, businessId);
    if (!ownerAuth.authorized) {
      return NextResponse.json({ error: ownerAuth.error }, { status: ownerAuth.status });
    }

    const business = ownerAuth.business!;

    let targetMemId = explicitMemId;

    // If phone is provided, resolve or create customer & membership
    if (!targetMemId && phone) {
      const customer = await db.createOrGetCustomer(phone, name);
      const membership = await db.createOrGetMembership(businessId, customer.id);
      targetMemId = membership.id;
    }

    if (!targetMemId) {
      return NextResponse.json(
        { error: 'Either customer phone or membership ID is required' },
        { status: 400 }
      );
    }

    // Action 1: Redeem Reward
    if (action === 'redeem') {
      const rewardDesc = business.reward_rule.reward_title || 'Free Milestone Reward';
      const claim = await db.claimReward(targetMemId, businessId, rewardDesc, 'cashier_counter');

      const updatedMem = await db.getMembershipById(targetMemId);
      const customer = updatedMem ? await db.getCustomerById(updatedMem.customer_id) : null;

      return NextResponse.json({
        success: true,
        action: 'redeem',
        claim,
        membership: { ...updatedMem, customer, business },
        message: `Successfully redeemed: ${rewardDesc}`,
      });
    }

    // Action 2: Award Verified Stamp with Minimum Bill Validation
    const minBill = business.reward_rule.min_order_for_stamp || business.min_order_for_stamp || 150;
    const billValue = spendAmount ? parseFloat(spendAmount) : minBill;
    const parsedStamps = stampAwarded ? Math.max(1, parseInt(stampAwarded, 10)) : 1;
    const stampCount = Math.min(5, Math.max(1, parsedStamps)); // Bounded 1 to 5

    // Minimum bill verification check
    if (spendAmount !== undefined && billValue < minBill) {
      return NextResponse.json(
        {
          error: `Order bill (₹${billValue}) is below minimum requirement of ₹${minBill} for ${stampCount} stamp(s).`,
          minBillRequired: minBill,
          spendAmount: billValue,
        },
        { status: 422 }
      );
    }

    // Record visit & execute stamp trigger
    const result = await db.recordVisit(
      targetMemId,
      businessId,
      billValue,
      stampCount,
      staffNote || `Cashier verified bill: ₹${billValue}`
    );

    const fullMem = await db.getMembershipById(targetMemId);
    const customer = fullMem ? await db.getCustomerById(fullMem.customer_id) : null;

    return NextResponse.json({
      success: true,
      action: 'stamp',
      membership: { ...fullMem, customer, business },
      visit: result.visit,
      rewardUnlocked: result.rewardUnlocked,
      wasWinBackConverted: result.wasWinBackConverted,
      message: `+${stampCount} Stamp(s) awarded! Total: ${fullMem?.stamps} of ${business.reward_rule.stamps_needed}`,
    });
  } catch (err: unknown) {
    console.error('Error in POST /api/cashier:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to process cashier action' },
      { status: 500 }
    );
  }
}

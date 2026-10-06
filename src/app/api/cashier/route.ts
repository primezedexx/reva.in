// ============================================================================
// REVA (reva.in) — API Route: Cashier Verification & Stamp Tool (/api/cashier)
// Allows counter staff to look up guests, verify order bill value, and award stamps
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const businessSlug = searchParams.get('slug') || 'boba-brew';
    const query = searchParams.get('q') || '';

    const business = await db.getBusinessBySlug(businessSlug);
    if (!business) {
      return NextResponse.json({ error: 'Store not found' }, { status: 404 });
    }

    const allBusinesses = await db.getBusinesses();
    const recentGuests = await db.getRecentGuests(business.id, 10);
    const todayVisits = await db.getVisitsForBusiness(business.id, 15);
    
    let searchResults: Array<unknown> = [];
    if (query.trim()) {
      searchResults = await db.searchMemberships(business.id, query.trim());
    }

    return NextResponse.json({
      success: true,
      business,
      allBusinesses: allBusinesses.map((b) => ({ id: b.id, name: b.name, slug: b.slug })),
      recentGuests,
      todayVisits,
      searchResults,
    }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    });
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
    const body = await req.json();
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

    const business = await db.getBusinessById(businessId);
    if (!business) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 });
    }

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
    const stampCount = stampAwarded ? Math.max(1, parseInt(stampAwarded, 10)) : 1;

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

// ============================================================================
// REVA (reva.in) — API Route: Reward Redemption (/api/reward/redeem)
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { membershipId, businessId, rewardDesc, verifiedBy, voucherCode, status } = body;

    if (!membershipId || !businessId) {
      return NextResponse.json(
        { error: 'Membership ID and Business ID are required' },
        { status: 400 }
      );
    }

    const claim = await db.claimReward(
      membershipId,
      businessId,
      rewardDesc || 'Loyalty Reward Claimed',
      verifiedBy || 'customer_claim',
      voucherCode,
      status || 'PENDING'
    );

    const updatedMem = await db.getMembershipById(membershipId);

    return NextResponse.json({
      success: true,
      claim,
      membership: updatedMem,
    });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to redeem reward' },
      { status: 500 }
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
        return NextResponse.json({ success: false, status: 'INVALID', message: 'Reward code not found' }, { status: 404 });
      }
      return NextResponse.json({ success: true, claim });
    }

    if (codes) {
      const parsedCodes = codes.split(',').map((c) => c.trim()).filter(Boolean);
      const claims = await db.getRewardClaimsByCodes(parsedCodes);
      return NextResponse.json({ success: true, claims });
    }

    if (membershipId) {
      const claims = await db.getRewardsClaimedForMembership(membershipId);
      return NextResponse.json({ success: true, claims });
    }

    if (businessId) {
      const claims = await db.getRewardsClaimedForBusiness(businessId);
      return NextResponse.json({ success: true, claims });
    }

    return NextResponse.json({ error: 'businessId, membershipId, code, or codes required' }, { status: 400 });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to fetch rewards' },
      { status: 500 }
    );
  }
}

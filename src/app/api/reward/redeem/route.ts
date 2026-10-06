// ============================================================================
// REVA (reva.in) — API Route: Reward Redemption (/api/reward/redeem)
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { membershipId, businessId, rewardDesc, verifiedBy } = body;

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
      verifiedBy || 'counter_staff'
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

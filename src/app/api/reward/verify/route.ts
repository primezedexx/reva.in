// ============================================================================
// REVA (reva.in) — API Route: Reward Code Verification & Redemption (/api/reward/verify)
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { code, businessId, action = 'verify', verifiedBy = 'admin_counter' } = body;

    const cleanCode = String(code || '').trim().replace(/\s+/g, '');

    if (!cleanCode) {
      return NextResponse.json(
        { success: false, status: 'INVALID', message: 'Reward code is required' },
        { status: 400 }
      );
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
            { status: 400 }
          );
        }

        return NextResponse.json(
          {
            success: false,
            status: 'INVALID',
            message: 'This reward code does not exist.',
          },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        status: 'REDEEMED',
        claim: result.claim,
        message: 'Reward redeemed successfully.',
      });
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
        { status: 404 }
      );
    }

    if (claim.status === 'REDEEMED') {
      return NextResponse.json({
        success: true,
        status: 'ALREADY_REDEEMED',
        claim,
        message: 'This reward has already been redeemed.',
      });
    }

    return NextResponse.json({
      success: true,
      status: 'PENDING',
      claim,
      message: 'Valid reward ready for redemption.',
    });
  } catch (err: unknown) {
    return NextResponse.json(
      {
        success: false,
        status: 'ERROR',
        message: err instanceof Error ? err.message : 'Internal verification error',
      },
      { status: 500 }
    );
  }
}

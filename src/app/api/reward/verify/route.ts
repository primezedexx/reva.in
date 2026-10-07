// ============================================================================
// REVA (reva.in) — API Route: Reward Code Verification & Redemption (/api/reward/verify)
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const NO_CACHE_HEADERS = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
  Pragma: 'no-cache',
  Expires: '0',
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { code, businessId, action = 'verify', verifiedBy = 'admin_counter' } = body;

    const cleanCode = String(code || '').trim().replace(/\s+/g, '');

    if (!cleanCode) {
      return NextResponse.json(
        { success: false, status: 'INVALID', message: 'Reward code is required' },
        { status: 400, headers: NO_CACHE_HEADERS }
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

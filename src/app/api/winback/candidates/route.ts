// ============================================================================
// REVA (reva.in) — API Route: Win-Back Candidates (/api/winback/candidates)
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { winbackEngine } from '@/lib/winback/engine';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const businessId = searchParams.get('businessId') || undefined;

    const candidates = await winbackEngine.getLapsedCandidates(businessId);

    return NextResponse.json({
      success: true,
      count: candidates.length,
      candidates,
    });
  } catch (err: unknown) {
    console.error('Error fetching winback candidates:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to fetch candidates' },
      { status: 500 }
    );
  }
}

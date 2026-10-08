// ============================================================================
// REVA (reva.in) — API Route: Win-Back Candidates (/api/winback/candidates)
// Locks winback candidates lookup to verified business owner.
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { winbackEngine } from '@/lib/winback/engine';
import { requireOwner } from '@/lib/auth-server';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const businessId = searchParams.get('businessId') || undefined;

    if (!businessId) {
      return NextResponse.json({ error: 'businessId is required' }, { status: 400 });
    }

    const ownerAuth = await requireOwner(req, businessId);
    if (!ownerAuth.authorized) {
      return NextResponse.json({ error: ownerAuth.error }, { status: ownerAuth.status });
    }

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

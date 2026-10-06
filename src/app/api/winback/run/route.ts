// ============================================================================
// REVA (reva.in) — API Route: Run Win-Back Engine (/api/winback/run)
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { winbackEngine } from '@/lib/winback/engine';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { businessId, forceIgnoreCooldown } = body;

    const url = new URL(req.url);
    const appBaseUrl = `${url.protocol}//${url.host}`;

    const summary = await winbackEngine.runEngine(businessId, {
      forceIgnoreCooldown: !!forceIgnoreCooldown,
      appBaseUrl,
    });

    return NextResponse.json({
      success: true,
      summary,
    });
  } catch (err: unknown) {
    console.error('Error running winback engine:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Win-Back execution failed' },
      { status: 500 }
    );
  }
}

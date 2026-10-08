// ============================================================================
// REVA (reva.in) — API Route: Run Win-Back Engine (/api/winback/run)
// Strictly locks execution to verified merchant owner with CSRF check.
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { winbackEngine } from '@/lib/winback/engine';
import { assertSameOrigin, requireOwner } from '@/lib/auth-server';

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
    const { businessId, forceIgnoreCooldown } = body;

    if (!businessId) {
      return NextResponse.json({ error: 'businessId is required' }, { status: 400 });
    }

    // 2. Strict Owner Authorization
    const ownerAuth = await requireOwner(req, businessId);
    if (!ownerAuth.authorized) {
      return NextResponse.json({ error: ownerAuth.error }, { status: ownerAuth.status });
    }

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

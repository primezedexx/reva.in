// ============================================================================
// REVA (reva.in) — API Route: Delete Membership (/api/memberships/[id])
// Strictly locks deletion to the authenticated owner of the store.
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { assertSameOrigin, requireOwner } from '@/lib/auth-server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function DELETE(
  req: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    // 1. Same-Origin Check
    const originCheck = assertSameOrigin(req);
    if (!originCheck.allowed) {
      return NextResponse.json(
        { error: originCheck.error || 'Cross-origin request rejected' },
        { status: 403 }
      );
    }

    const params = await props.params;
    const { id } = params;

    const membership = await db.getMembershipById(id);
    if (!membership) {
      return NextResponse.json({ error: 'Membership not found' }, { status: 404 });
    }

    // 2. Strict Owner Authorization: user must own the business of this membership
    const ownerAuth = await requireOwner(req, membership.business_id);
    if (!ownerAuth.authorized) {
      return NextResponse.json({ error: ownerAuth.error }, { status: ownerAuth.status });
    }

    const success = await db.deleteMembership(id);

    return NextResponse.json({
      success: true,
      deleted: success,
      id,
    });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to delete membership' },
      { status: 500 }
    );
  }
}

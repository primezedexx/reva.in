// ============================================================================
// REVA (reva.in) — API Route: Delete Membership (/api/memberships/[id])
// Allows store owners to delete customer memberships from CRM / test data
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function DELETE(
  _req: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const params = await props.params;
    const { id } = params;

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

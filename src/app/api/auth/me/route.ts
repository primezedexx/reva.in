// ============================================================================
// REVA (reva.in) — API Route: Current Owner Profile & Store (/api/auth/me)
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { db } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json({ authenticated: false, user: null }, { status: 401 });
    }

    const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(token);
    if (userError || !userData.user) {
      return NextResponse.json({ authenticated: false, user: null }, { status: 401 });
    }

    const user = userData.user;
    const owner = await db.getOwnerByUserId(user.id);
    let business = null;

    if (owner?.business_id) {
      business = await db.getBusinessById(owner.business_id);
    }
    if (!business) {
      business = await db.getBusinessByOwnerId(user.id);
    }

    return NextResponse.json({
      authenticated: true,
      user: {
        id: user.id,
        email: user.email,
        metadata: user.user_metadata,
      },
      owner,
      business,
    });
  } catch (err: unknown) {
    console.error('Error fetching auth user info:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to fetch user' },
      { status: 500 }
    );
  }
}

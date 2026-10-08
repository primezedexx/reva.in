// ============================================================================
// REVA (reva.in) — API Route: Auth Sync & Provisioning (/api/auth/sync)
// Locks provisioning strictly to verified session user (never trust client userId).
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { db } from '@/lib/db';
import { assertSameOrigin, getAuthUser } from '@/lib/auth-server';

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

    // 2. Strict Session Authentication: extract verified user from Supabase session
    const auth = await getAuthUser(req);
    if (!auth) {
      return NextResponse.json(
        { error: 'Authentication required. Please log in.' },
        { status: 401 }
      );
    }

    const userId = auth.user.id;
    const body = await req.json().catch(() => ({}));
    const email = auth.user.email || body.email;
    const name = body.name || auth.user.user_metadata?.name;

    if (!userId || !email) {
      return NextResponse.json({ error: 'Missing userId or email' }, { status: 400 });
    }

    // 3. Check if owner already exists
    let owner = await db.getOwnerByUserId(userId);
    let business = null;

    if (owner?.business_id) {
      business = await db.getBusinessById(owner.business_id);
    }

    if (!business) {
      business = await db.getBusinessByOwnerId(userId);
    }

    // 4. If no business exists for this authenticated user, provision one with 30-day trial!
    if (!business) {
      const displayName = name || email.split('@')[0] || 'My';
      const cleanName = displayName.replace(/[^a-zA-Z0-9\s]/g, '').trim();
      const storeName = `${cleanName}'s Cafe`;
      const baseSlug = storeName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      const slug = `${baseSlug}-${Math.random().toString(36).substring(2, 6)}`;

      business = await db.createBusiness({
        name: storeName,
        slug: slug,
        owner_id: userId,
        brand_color: '#0F172A',
        is_setup_completed: false,
        reward_rule: {
          stamps_needed: 6,
          reward_title: 'Free Specialty Beverage',
          reward_desc: 'Any handcrafted drink or signature treat on the house',
          min_order_for_stamp: 150,
          theme_config: {
            is_setup_completed: false,
          },
        },
        avg_spend_per_visit: 250.0,
        min_order_for_stamp: 150.0,
        winback_delay_multiplier: 1.5,
        winback_min_days: 5,
        winback_offer_text: 'Complimentary Belgian Waffle or treat with your next visit',
        plan: 'growth',
        trial_ends_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        subscription_status: 'trialing',
        trial_active: true,
        active_offers: [
          {
            id: 'off_1',
            title: 'Welcome Treat',
            stamps_needed: 3,
            badge: '3 Stamps Milestone',
            desc: 'Earned at 3 stamps on your digital pass',
            type: 'milestone',
            icon: 'flame',
            min_order: 150,
          },
          {
            id: 'off_2',
            title: 'Free Specialty Beverage',
            stamps_needed: 6,
            badge: '6 Stamps Grand Reward',
            desc: 'Any handcrafted drink on the house',
            type: 'milestone',
            icon: 'star',
            min_order: 150,
          },
        ],
      });
    }

    if (!owner) {
      owner = await db.createOwner({
        id: userId,
        business_id: business.id,
        name: name || email.split('@')[0] || 'Business Owner',
        email: email,
        role: 'owner',
      });
    } else if (!owner.business_id && business?.id) {
      await supabaseAdmin.from('owners').update({ business_id: business.id }).eq('id', userId);
      owner.business_id = business.id;
    }

    return NextResponse.json({
      success: true,
      owner,
      business,
    });
  } catch (err: unknown) {
    console.error('Auth sync error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to sync auth user' },
      { status: 500 }
    );
  }
}

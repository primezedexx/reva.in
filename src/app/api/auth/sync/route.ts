// ============================================================================
// REVA (reva.in) — API Route: Auth Sync & Provisioning (/api/auth/sync)
// Ensures Google SSO & Auth users have their owner profile and store initialized
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { db } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const { userId, email, name } = await req.json();

    if (!userId || !email) {
      return NextResponse.json({ error: 'Missing userId or email' }, { status: 400 });
    }

    // 1. Check if owner already exists
    let owner = await db.getOwnerByUserId(userId);
    let business = null;

    if (owner?.business_id) {
      business = await db.getBusinessById(owner.business_id);
      if (business && business.owner_id !== userId) {
        console.warn(`[SECURITY] Cross-account leak prevented in sync: Business ${business.id} belongs to ${business.owner_id}, not user ${userId}`);
        business = null;
      }
    }

    if (!business) {
      business = await db.getBusinessByOwnerId(userId);
    }

    // 2. If no business or owner exists for this authenticated user, provision one!
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

// ============================================================================
// REVA (reva.in) — API Route: Dashboard Metrics (/api/dashboard)
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { supabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const businessId = searchParams.get('businessId');
    const userId = searchParams.get('userId');

    let targetBusinessId: string | null = null;
    let userBusinesses: any[] = [];

    // 1. Authenticated User Flow: Strict Multi-Tenant Isolation
    if (userId) {
      const [owner, initialUserBusinesses] = await Promise.all([
        db.getOwnerByUserId(userId),
        db.getBusinessesByOwnerId(userId),
      ]);
      // Strict isolation: only businesses whose owner_id matches this authenticated user
      userBusinesses = (initialUserBusinesses || []).filter((b) => b.owner_id === userId);

      // If user has an owner profile with a linked business_id, verify that this user actually owns it!
      if (owner?.business_id) {
        const matchesOwnership = userBusinesses.some((b) => b.id === owner.business_id);
        if (!matchesOwnership) {
          const linkedBiz = await db.getBusinessById(owner.business_id);
          if (linkedBiz && linkedBiz.owner_id === userId) {
            userBusinesses.unshift(linkedBiz);
          } else if (linkedBiz && linkedBiz.owner_id !== userId) {
            console.warn(`[SECURITY] Prevented cross-account access: Business ${owner.business_id} belongs to ${linkedBiz.owner_id}, not ${userId}`);
            // Fix mismatched owner profile
            await db.updateOwnerBusinessId(userId, userBusinesses[0]?.id || '').catch(() => {});
          }
        }
      }

      // Prioritize business linked in owner profile, or setup-completed business
      if (userBusinesses.length > 0) {
        userBusinesses.sort((a, b) => {
          if (owner?.business_id) {
            if (a.id === owner.business_id) return -1;
            if (b.id === owner.business_id) return 1;
          }
          const aDone = Boolean(a.is_setup_completed || a.theme_config?.is_setup_completed || a.reward_rule?.theme_config?.is_setup_completed || (a.reward_rule as any)?.is_setup_completed);
          const bDone = Boolean(b.is_setup_completed || b.theme_config?.is_setup_completed || b.reward_rule?.theme_config?.is_setup_completed || (b.reward_rule as any)?.is_setup_completed);
          if (aDone && !bDone) return -1;
          if (!aDone && bDone) return 1;
          return 0;
        });
      }

      // If this authenticated store owner has no business yet, provision their store and owner profile!
      if (userBusinesses.length === 0) {
        let userEmail = '';
        let userName = 'My Store';
        try {
          const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(userId);
          if (authUser?.user) {
            userEmail = authUser.user.email || '';
            userName =
              authUser.user.user_metadata?.full_name ||
              authUser.user.user_metadata?.name ||
              userEmail.split('@')[0] ||
              'My Store';
          }
        } catch {}

        const cleanName = userName.replace(/[^a-zA-Z0-9\s]/g, '').trim() || 'My';
        const storeName = `${cleanName}'s Cafe`;
        const baseSlug = storeName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
        const slug = `${baseSlug}-${Math.random().toString(36).substring(2, 6)}`;

        const newBiz = await db.createBusiness({
          name: storeName,
          slug: slug,
          owner_id: userId,
          brand_color: '#0F172A',
          is_setup_completed: false,
          reward_rule: {
            stamps_needed: 6,
            reward_title: '',
            reward_desc: '',
            min_order_for_stamp: 150,
            theme_config: {
              is_setup_completed: false,
            },
          },
          avg_spend_per_visit: 250.0,
          min_order_for_stamp: 150.0,
          winback_delay_multiplier: 1.5,
          winback_min_days: 5,
          winback_offer_text: 'Complimentary treat on next visit',
          plan: 'growth',
          trial_ends_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          subscription_status: 'trialing',
          trial_active: true,
          active_offers: [],
        });

        await db.createOwner({
          id: userId,
          business_id: newBiz.id,
          name: userName,
          email: userEmail,
          role: 'owner',
        });

        userBusinesses = [newBiz];
      }

      // If a specific businessId was requested, verify the user actually owns it
      if (businessId && userBusinesses.some((b) => b.id === businessId)) {
        targetBusinessId = businessId;
      } else {
        targetBusinessId = userBusinesses[0].id;
      }
    } else if (businessId) {
      // 2. Specific Business ID requested without auth (e.g. direct link)
      const biz = await db.getBusinessById(businessId);
      if (biz) {
        targetBusinessId = biz.id;
        userBusinesses = [biz];
      }
    } else {
      // 3. Fallback only for unauthenticated demo
      const seedBusinesses = await db.getBusinesses();
      if (seedBusinesses.length > 0) {
        targetBusinessId = seedBusinesses[0].id;
        userBusinesses = seedBusinesses;
      }
    }

    if (!targetBusinessId) {
      return NextResponse.json({ error: 'No business found' }, { status: 404 });
    }

    const targetBiz = userBusinesses.find((b) => b.id === targetBusinessId) || null;
    const metrics = await db.getDashboardMetrics(targetBusinessId, targetBiz);

    return NextResponse.json({
      success: true,
      metrics,
      allBusinesses: userBusinesses,
    }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        Pragma: 'no-cache',
        Expires: '0',
      },
    });
  } catch (err: unknown) {
    console.error('Error fetching dashboard metrics:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to fetch dashboard metrics' },
      { status: 500 }
    );
  }
}

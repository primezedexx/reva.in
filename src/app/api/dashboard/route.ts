// ============================================================================
// REVA (reva.in) — API Route: Dashboard Metrics (/api/dashboard)
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

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

      // If no business exists yet for this authenticated user, auto-provision one!
      if (userBusinesses.length === 0) {
        const storeName = owner?.name ? `${owner.name}'s Cafe` : 'My Cafe';
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
            reward_title: 'Free Specialty Beverage',
            reward_desc: 'Any handcrafted drink or signature treat on the house',
            min_order_for_stamp: 150,
            theme_config: {
              is_setup_completed: false,
            },
            is_setup_completed: false,
          },
          theme_config: {
            is_setup_completed: false,
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
        if (owner && !owner.business_id) {
          await db.updateOwnerBusinessId(userId, newBiz.id).catch(() => {});
        }
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

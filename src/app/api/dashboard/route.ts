// ============================================================================
// REVA (reva.in) — API Route: Dashboard Metrics (/api/dashboard)
// Strictly locks dashboard access to authenticated merchant owners.
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAuthUser } from '@/lib/auth-server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(req: NextRequest) {
  try {
    // 1. Merchant Authentication Verification (Bearer token or cookie)
    const auth = await getAuthUser(req);
    if (!auth) {
      return NextResponse.json(
        { error: 'Authentication required. Please log in to access the merchant dashboard.' },
        { status: 401 }
      );
    }

    const userId = auth.user.id;
    const { searchParams } = new URL(req.url);
    const requestedBusinessId = searchParams.get('businessId');

    const [owner, initialUserBusinesses] = await Promise.all([
      db.getOwnerByUserId(userId),
      db.getBusinessesByOwnerId(userId),
    ]);

    let userBusinesses = initialUserBusinesses || [];

    // Include linked business if exists
    if (owner?.business_id) {
      if (!userBusinesses.some((b) => b.id === owner.business_id)) {
        const linkedBiz = await db.getBusinessById(owner.business_id);
        if (linkedBiz && !userBusinesses.some((b) => b.id === linkedBiz.id)) {
          userBusinesses.unshift(linkedBiz);
        }
      }
    }

    // Sort businesses: prioritize linked business or setup-completed
    if (userBusinesses.length > 0) {
      userBusinesses.sort((a, b) => {
        if (owner?.business_id) {
          if (a.id === owner.business_id) return -1;
          if (b.id === owner.business_id) return 1;
        }
        const aDone = Boolean(a.is_setup_completed || a.theme_config?.is_setup_completed);
        const bDone = Boolean(b.is_setup_completed || b.theme_config?.is_setup_completed);
        if (aDone && !bDone) return -1;
        if (!aDone && bDone) return 1;
        return 0;
      });
    }

    // 2. Provision store ONLY for authenticated users who have no store yet
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

    // 3. Multi-Tenant Guard: Caller can ONLY access stores they own
    const targetBiz =
      (requestedBusinessId && userBusinesses.find((b) => b.id === requestedBusinessId)) ||
      userBusinesses[0];

    if (!targetBiz?.id) {
      return NextResponse.json({ error: 'No business found for merchant' }, { status: 404 });
    }

    const metrics = await db.getDashboardMetrics(targetBiz.id, targetBiz);

    return NextResponse.json(
      {
        success: true,
        metrics,
        allBusinesses: userBusinesses,
      },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          Pragma: 'no-cache',
          Expires: '0',
        },
      }
    );
  } catch (err: unknown) {
    console.error('Error fetching dashboard metrics:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to fetch dashboard metrics' },
      { status: 500 }
    );
  }
}

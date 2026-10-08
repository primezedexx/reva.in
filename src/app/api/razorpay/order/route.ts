// ============================================================================
// REVA (reva.in) — API Route: Create Razorpay Order (/api/razorpay/order)
// Strict origin defense, owner authorization, server-side pricing, and DB logging.
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import {
  createSubscriptionOrder,
  SubscriptionPlanType,
} from '@/lib/razorpay';
import { supabaseAdmin } from '@/lib/supabase';
import { assertSameOrigin, requireOwner } from '@/lib/auth-server';

export async function POST(req: NextRequest) {
  try {
    // 1. Same-Origin Check (CSRF Protection)
    const originCheck = assertSameOrigin(req);
    if (!originCheck.allowed) {
      return NextResponse.json(
        { error: originCheck.error || 'Cross-origin request rejected' },
        { status: 403 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const { plan, businessId } = body;

    if (!businessId) {
      return NextResponse.json({ error: 'businessId is required' }, { status: 400 });
    }

    // 2. Ownership Verification
    const ownerAuth = await requireOwner(req, businessId);
    if (!ownerAuth.authorized) {
      return NextResponse.json({ error: ownerAuth.error }, { status: ownerAuth.status });
    }

    const business = ownerAuth.business;
    if (!business) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 });
    }

    // 3. Strict Server-Side Pricing Lookup (never accept amount from client)
    const selectedPlan: SubscriptionPlanType =
      plan === 'starter' || plan === 'pro' || plan === 'growth' ? plan : 'growth';

    const isTrial = business.trial_active ?? (business.subscription_status === 'trialing');
    const currentPlan = business.plan as SubscriptionPlanType | undefined;

    // 4. Fail Closed: Credentials MUST exist in environment. Never fall back to mock.
    const keyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!keyId || !keySecret) {
      return NextResponse.json(
        { error: 'Payment gateway configuration error. Please contact store support.' },
        { status: 500 }
      );
    }

    // 5. Create Order via official Razorpay API
    const orderData = await createSubscriptionOrder({
      plan: selectedPlan,
      businessId: business.id,
      businessName: business.name,
      currentPlan,
      isTrial,
    });

    // 6. Record created order in DB linked to business_id
    try {
      await supabaseAdmin.from('payment_orders').insert({
        id: orderData.orderId,
        business_id: business.id,
        plan: selectedPlan,
        amount: orderData.amount,
        currency: 'INR',
        status: 'created',
      });
    } catch (dbErr) {
      console.warn('payment_orders DB logging notice:', dbErr);
    }

    return NextResponse.json({
      success: true,
      ...orderData,
    });
  } catch (err: unknown) {
    console.error('Error creating Razorpay order:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to create payment order' },
      { status: 500 }
    );
  }
}

// ============================================================================
// REVA (reva.in) — API Route: Create Razorpay Order (/api/razorpay/order)
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import {
  createSubscriptionOrder,
  SubscriptionPlanType,
  PLAN_PRICING,
  getPlanUpgradeDetails,
} from '@/lib/razorpay';
import { db } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { plan, businessId } = body;

    if (!businessId) {
      return NextResponse.json({ error: 'businessId is required' }, { status: 400 });
    }

    const business = await db.getBusinessById(businessId);
    if (!business) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 });
    }

    const selectedPlan: SubscriptionPlanType =
      plan === 'starter' || plan === 'pro' || plan === 'growth' ? plan : 'growth';

    const isTrial = business.trial_active ?? (business.subscription_status === 'trialing');
    const currentPlan = business.plan as SubscriptionPlanType | undefined;

    // If Razorpay keys are not yet provided in env, return a friendly mock-order in dev mode
    const keyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!keySecret) {
      const upgradeDetails = getPlanUpgradeDetails(currentPlan, isTrial, selectedPlan);
      return NextResponse.json({
        success: true,
        isDevSandbox: true,
        orderId: `order_dev_${Date.now().toString(36)}`,
        amount: upgradeDetails.amountPaise,
        amountInr: upgradeDetails.amountInr,
        currency: 'INR',
        plan: selectedPlan,
        planName: upgradeDetails.targetName,
        isUpgrade: upgradeDetails.isUpgrade,
        diffInr: upgradeDetails.diffInr,
        keyId: keyId || 'rzp_test_placeholder',
        message: 'RAZORPAY_KEY_SECRET is not set in .env.local. Ready to test when secret is added.',
      });
    }

    const orderData = await createSubscriptionOrder({
      plan: selectedPlan,
      businessId: business.id,
      businessName: business.name,
      currentPlan,
      isTrial,
    });

    return NextResponse.json({
      success: true,
      ...orderData,
    });
  } catch (err: unknown) {
    console.error('Error creating Razorpay order:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to create Razorpay order' },
      { status: 500 }
    );
  }
}

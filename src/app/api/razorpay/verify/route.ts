// ============================================================================
// REVA (reva.in) — API Route: Verify Razorpay Payment Signature (/api/razorpay/verify)
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { verifyRazorpaySignature, SubscriptionPlanType, PLAN_PRICING } from '@/lib/razorpay';
import { db } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      businessId,
      plan,
      isDevSandbox,
    } = body;

    if (!businessId) {
      return NextResponse.json({ error: 'businessId is required' }, { status: 400 });
    }

    const business = await db.getBusinessById(businessId);
    if (!business) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 });
    }

    const selectedPlan: SubscriptionPlanType =
      plan === 'starter' || plan === 'pro' || plan === 'growth' ? plan : (business.plan as SubscriptionPlanType) || 'growth';

    const secret = process.env.RAZORPAY_KEY_SECRET;

    // Calculate new expiration date (extend by 1 year from current expiry or now)
    const existingExpiry = business.subscription_ends_at ? new Date(business.subscription_ends_at).getTime() : Date.now();
    const baseExpiry = existingExpiry > Date.now() ? existingExpiry : Date.now();
    const oneYearLater = new Date(baseExpiry + 365 * 24 * 60 * 60 * 1000).toISOString();

    const isUpgrade = business.plan && PLAN_PRICING[selectedPlan].level > (PLAN_PRICING[business.plan as SubscriptionPlanType]?.level || 0);

    // Handle dev sandbox simulation if secret is not yet configured
    if (!secret || isDevSandbox) {
      const updatedBusiness = await db.updateBusiness(business.id, {
        plan: selectedPlan,
        subscription_status: 'active',
        trial_active: false,
        subscription_ends_at: oneYearLater,
      });

      return NextResponse.json({
        success: true,
        verified: true,
        isDevSandbox: true,
        message: isUpgrade
          ? `🎉 Successfully upgraded to ${PLAN_PRICING[selectedPlan].name}! Valid for 1 full year.`
          : `🎉 Subscription successfully activated on ${PLAN_PRICING[selectedPlan].name}! Valid for 1 full year.`,
        business: updatedBusiness,
      });
    }

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json(
        { error: 'Missing razorpay_order_id, razorpay_payment_id, or razorpay_signature' },
        { status: 400 }
      );
    }

    // Live Signature verification
    const isValid = verifyRazorpaySignature({
      orderId: razorpay_order_id,
      paymentId: razorpay_payment_id,
      signature: razorpay_signature,
    });

    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid payment signature. Payment verification failed.' },
        { status: 400 }
      );
    }

    const updatedBusiness = await db.updateBusiness(business.id, {
      plan: selectedPlan,
      subscription_status: 'active',
      trial_active: false,
      subscription_ends_at: oneYearLater,
      razorpay_order_id,
      razorpay_payment_id,
    });

    return NextResponse.json({
      success: true,
      verified: true,
      message: isUpgrade
        ? `🎉 Payment verified! Successfully upgraded to ${PLAN_PRICING[selectedPlan].name} for 1 full year.`
        : `🎉 Payment verified! Your ${PLAN_PRICING[selectedPlan].name} annual subscription is now active.`,
      business: updatedBusiness,
    });
  } catch (err: unknown) {
    console.error('Payment verification error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Payment verification failed' },
      { status: 500 }
    );
  }
}

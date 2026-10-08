// ============================================================================
// REVA (reva.in) — API Route: Verify Razorpay Payment Signature (/api/razorpay/verify)
// Hardened payment verification: timing-safe HMAC, idempotency ledger, amount validation.
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import {
  verifyRazorpaySignature,
  SubscriptionPlanType,
  PLAN_PRICING,
  fetchRazorpayPayment,
  getPlanUpgradeDetails,
} from '@/lib/razorpay';
import { db } from '@/lib/db';
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
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      businessId,
      plan,
    } = body;

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

    // 3. Fail Closed: Credentials MUST exist in environment. No sandbox bypass.
    const secret = process.env.RAZORPAY_KEY_SECRET;
    if (!secret) {
      return NextResponse.json(
        { error: 'Payment gateway configuration error. Please contact store support.' },
        { status: 500 }
      );
    }

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json(
        { error: 'Missing required payment verification parameters.' },
        { status: 400 }
      );
    }

    // 4. Verify HMAC Signature using timing-safe comparison
    const isValidSignature = verifyRazorpaySignature({
      orderId: razorpay_order_id,
      paymentId: razorpay_payment_id,
      signature: razorpay_signature,
    });

    if (!isValidSignature) {
      console.warn(`[Security] Invalid Razorpay signature attempt for business ${business.id}`);
      return NextResponse.json(
        { error: 'Invalid payment signature. Verification failed.' },
        { status: 400 }
      );
    }

    // 5. Idempotency Check: Reject if payment_id already recorded
    const { data: existingPayment } = await supabaseAdmin
      .from('payments')
      .select('id, payment_id')
      .eq('payment_id', razorpay_payment_id)
      .maybeSingle();

    if (existingPayment) {
      return NextResponse.json(
        { error: 'This payment has already been verified and processed.' },
        { status: 409 }
      );
    }

    // 6. Verify order was created for this business in DB (if recorded)
    const { data: dbOrder } = await supabaseAdmin
      .from('payment_orders')
      .select('id, business_id, amount, plan')
      .eq('id', razorpay_order_id)
      .maybeSingle();

    if (dbOrder && dbOrder.business_id !== business.id) {
      return NextResponse.json(
        { error: 'Security violation: Order does not belong to this business.' },
        { status: 403 }
      );
    }

    // 7. Fetch and verify payment entity directly from Razorpay API
    let paymentEntity: any;
    try {
      paymentEntity = await fetchRazorpayPayment(razorpay_payment_id);
    } catch (apiErr) {
      console.error('Failed to fetch payment details from Razorpay API:', apiErr);
      return NextResponse.json(
        { error: 'Could not verify payment with payment processor.' },
        { status: 502 }
      );
    }

    // Verify payment status, currency, order_id, and amount
    if (paymentEntity.status !== 'captured') {
      return NextResponse.json(
        { error: `Payment is not in captured state (status: ${paymentEntity.status}).` },
        { status: 400 }
      );
    }

    if (paymentEntity.currency !== 'INR') {
      return NextResponse.json(
        { error: `Invalid payment currency: expected INR, received ${paymentEntity.currency}.` },
        { status: 400 }
      );
    }

    if (paymentEntity.order_id !== razorpay_order_id) {
      return NextResponse.json(
        { error: 'Payment does not match the specified order ID.' },
        { status: 400 }
      );
    }

    // Derive plan strictly from payment_orders if recorded, else validated body plan
    const selectedPlan: SubscriptionPlanType =
      (dbOrder?.plan as SubscriptionPlanType) ||
      (plan === 'starter' || plan === 'pro' || plan === 'growth'
        ? plan
        : (business.plan as SubscriptionPlanType) || 'growth');

    const isTrial = business.trial_active ?? (business.subscription_status === 'trialing');
    const expectedPricing = getPlanUpgradeDetails(business.plan as SubscriptionPlanType | undefined, isTrial, selectedPlan);

    // Verify amount matches expected paise
    if (dbOrder?.amount && paymentEntity.amount < dbOrder.amount) {
      return NextResponse.json(
        { error: 'Payment amount is less than expected order amount.' },
        { status: 400 }
      );
    } else if (!dbOrder && paymentEntity.amount < expectedPricing.amountPaise) {
      return NextResponse.json(
        { error: 'Payment amount does not match expected plan cost.' },
        { status: 400 }
      );
    }

    // 8. Record the payment in payments table with UNIQUE(payment_id)
    const { error: insertPayErr } = await supabaseAdmin
      .from('payments')
      .insert({
        payment_id: razorpay_payment_id,
        order_id: razorpay_order_id,
        business_id: business.id,
        plan: selectedPlan,
        amount: paymentEntity.amount,
        currency: paymentEntity.currency,
        status: paymentEntity.status,
      });

    if (insertPayErr) {
      if (insertPayErr.code === '23505') {
        return NextResponse.json(
          { error: 'Payment has already been processed.' },
          { status: 409 }
        );
      }
      console.error('Payment ledger error:', insertPayErr.message);
      return NextResponse.json(
        { error: 'Failed to record payment verification. Please contact support.' },
        { status: 500 }
      );
    }

    // Mark order as paid in payment_orders
    await supabaseAdmin
      .from('payment_orders')
      .update({ status: 'paid' })
      .eq('id', razorpay_order_id);

    // 9. Calculate new expiration date (extend by 1 year from current expiry or now)
    const existingExpiry = business.subscription_ends_at
      ? new Date(business.subscription_ends_at).getTime()
      : Date.now();
    const baseExpiry = existingExpiry > Date.now() ? existingExpiry : Date.now();
    const oneYearLater = new Date(baseExpiry + 365 * 24 * 60 * 60 * 1000).toISOString();

    const isUpgrade =
      business.plan &&
      PLAN_PRICING[selectedPlan].level >
        (PLAN_PRICING[business.plan as SubscriptionPlanType]?.level || 0);

    // 10. Update business subscription
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
    console.error('Error verifying Razorpay payment:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Payment verification failed' },
      { status: 500 }
    );
  }
}

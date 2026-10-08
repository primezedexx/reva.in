// ============================================================================
// REVA (reva.in) — API Route: Razorpay Webhook Handler (/api/razorpay/webhook)
// Mandatory signature check, timing-safe verification, event deduplication, and fail-closed secret.
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { db } from '@/lib/db';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get('x-razorpay-signature');

    // 1. REQUIRE x-razorpay-signature header. Reject immediately if missing.
    if (!signature) {
      console.warn('[Security] Razorpay webhook received without x-razorpay-signature header.');
      return NextResponse.json(
        { error: 'Missing x-razorpay-signature header' },
        { status: 400 }
      );
    }

    // 2. Secret MUST come from environment. Fail closed if unconfigured (no hardcoded fallback).
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    if (!webhookSecret) {
      console.error('[Security] RAZORPAY_WEBHOOK_SECRET is not configured in server environment.');
      return NextResponse.json(
        { error: 'Webhook processing is unconfigured on server' },
        { status: 500 }
      );
    }

    // 3. Cryptographic HMAC-SHA256 signature verification using timingSafeEqual
    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(rawBody)
      .digest('hex');

    const expectedBuf = Buffer.from(expectedSignature, 'utf8');
    const actualBuf = Buffer.from(signature, 'utf8');

    if (
      expectedBuf.length !== actualBuf.length ||
      !crypto.timingSafeEqual(expectedBuf, actualBuf)
    ) {
      console.warn('[Security] Invalid Razorpay webhook signature attempt.');
      return NextResponse.json({ error: 'Invalid webhook signature' }, { status: 400 });
    }

    // 4. Parse payload
    let event: any;
    try {
      event = JSON.parse(rawBody);
    } catch {
      return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 });
    }

    const eventId = event.id;

    // 5. Deduplicate events: check if event.id was already processed
    if (eventId) {
      const { data: existingEvent } = await supabaseAdmin
        .from('payments')
        .select('id, event_id')
        .eq('event_id', eventId)
        .maybeSingle();

      if (existingEvent) {
        console.log(`[Webhook] Event ${eventId} was already processed. Skipping duplicate.`);
        return NextResponse.json({ status: 'ok', message: 'Event already processed' });
      }
    }

    // 6. Handle payment capture or order paid events
    if (event.event === 'payment.captured' || event.event === 'order.paid') {
      const payment = event.payload?.payment?.entity;
      const paymentId = payment?.id;
      const orderId = payment?.order_id || event.payload?.order?.entity?.id;

      if (!orderId) {
        console.warn('[Webhook] Payment event without orderId. Skipping.');
        return NextResponse.json({ status: 'ok', warning: 'Missing orderId' });
      }

      // Look up trusted order record from payment_orders in database
      const { data: dbOrder } = await supabaseAdmin
        .from('payment_orders')
        .select('id, business_id, plan, amount')
        .eq('id', orderId)
        .maybeSingle();

      if (!dbOrder) {
        console.warn(`[Webhook] Order ${orderId} not found in payment_orders. Rejecting untracked order.`);
        return NextResponse.json({ status: 'ok', warning: 'Untracked order' });
      }

      const businessId = dbOrder.business_id;
      const plan = dbOrder.plan;

      // Check if payment was already recorded (e.g. by verify route)
      if (paymentId) {
        const { data: existingPayment } = await supabaseAdmin
          .from('payments')
          .select('id, payment_id')
          .eq('payment_id', paymentId)
          .maybeSingle();

        if (existingPayment) {
          if (eventId) {
            await supabaseAdmin
              .from('payments')
              .update({ event_id: eventId })
              .eq('payment_id', paymentId);
          }
          return NextResponse.json({ status: 'ok', message: 'Payment already recorded' });
        }
      }

      const business = await db.getBusinessById(businessId);
      if (business && paymentId) {
        const { error: insertErr } = await supabaseAdmin.from('payments').insert({
          payment_id: paymentId,
          order_id: orderId,
          business_id: businessId,
          plan,
          amount: payment?.amount || dbOrder.amount,
          currency: payment?.currency || 'INR',
          status: 'captured',
          event_id: eventId || null,
        });

        if (insertErr && insertErr.code === '23505') {
          return NextResponse.json({ status: 'ok', message: 'Payment already processed' });
        }

        await supabaseAdmin
          .from('payment_orders')
          .update({ status: 'paid' })
          .eq('id', orderId);

        const existingExpiry = business.subscription_ends_at
          ? new Date(business.subscription_ends_at).getTime()
          : Date.now();
        const baseExpiry = existingExpiry > Date.now() ? existingExpiry : Date.now();
        const oneYearLater = new Date(baseExpiry + 365 * 24 * 60 * 60 * 1000).toISOString();

        await db.updateBusiness(businessId, {
          plan,
          subscription_status: 'active',
          trial_active: false,
          subscription_ends_at: oneYearLater,
          razorpay_payment_id: paymentId,
          razorpay_order_id: orderId,
        });

        console.log(`✓ Webhook successfully activated subscription for business ${businessId} (${plan})`);
      }
    }

    return NextResponse.json({ status: 'ok' });
  } catch (err: unknown) {
    console.error('Razorpay webhook processing exception:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

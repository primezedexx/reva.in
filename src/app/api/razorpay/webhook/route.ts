// ============================================================================
// REVA (reva.in) — API Route: Razorpay Webhook Handler (/api/razorpay/webhook)
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { db } from '@/lib/db';
import { SUBSCRIPTION_ENABLED } from '@/lib/config';

export async function POST(req: NextRequest) {
  if (!SUBSCRIPTION_ENABLED) {
    return NextResponse.json({ message: 'Subscriptions are currently disabled. Webhook ignored.' }, { status: 200 });
  }

  try {
    const rawBody = await req.text();
    const signature = req.headers.get('x-razorpay-signature');
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || 'reva_webhook_secret_2026';

    if (signature && webhookSecret) {
      const expectedSignature = crypto
        .createHmac('sha256', webhookSecret)
        .update(rawBody)
        .digest('hex');

      if (expectedSignature !== signature) {
        console.error('Invalid Razorpay webhook signature');
        return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
      }
    }

    const event = JSON.parse(rawBody);

    if (event.event === 'payment.captured' || event.event === 'order.paid') {
      const payment = event.payload?.payment?.entity;
      const notes = payment?.notes || event.payload?.order?.entity?.notes || {};
      const businessId = notes.businessId;
      const plan = notes.plan || 'growth';

      if (businessId) {
        const oneYearLater = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();
        await db.updateBusiness(businessId, {
          plan,
          subscription_status: 'active',
          trial_active: false,
          subscription_ends_at: oneYearLater,
        });
        console.log(`✓ Webhook activated subscription for business ${businessId} (${plan})`);
      }
    }

    return NextResponse.json({ status: 'ok' });
  } catch (err: unknown) {
    console.error('Razorpay webhook exception:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

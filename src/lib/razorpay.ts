// ============================================================================
// REVA (reva.in) — Razorpay Payment Gateway Integration
// Official SDK wrapper + HMAC-SHA256 Signature Verification
// ============================================================================

import Razorpay from 'razorpay';
import crypto from 'crypto';

export type SubscriptionPlanType = 'starter' | 'growth' | 'pro';

export const PLAN_PRICING: Record<
  SubscriptionPlanType,
  { amountPaise: number; amountInr: number; name: string; regularLimit: string; level: number }
> = {
  starter: {
    amountPaise: 49900,
    amountInr: 499,
    name: 'Starter Plan',
    regularLimit: 'Up to 300 regulars',
    level: 1,
  },
  growth: {
    amountPaise: 99900,
    amountInr: 999,
    name: 'Growth Plan',
    regularLimit: 'Up to 1,500 regulars',
    level: 2,
  },
  pro: {
    amountPaise: 149900,
    amountInr: 1499,
    name: 'Pro Plan',
    regularLimit: 'Unlimited regulars',
    level: 3,
  },
};

/**
 * Calculates upgrade difference pricing or renewal cost
 */
export function getPlanUpgradeDetails(
  currentPlan: SubscriptionPlanType | undefined,
  isTrial: boolean,
  targetPlan: SubscriptionPlanType
) {
  const targetInfo = PLAN_PRICING[targetPlan] || PLAN_PRICING.growth;

  if (isTrial || !currentPlan) {
    return {
      targetPlan,
      targetName: targetInfo.name,
      amountInr: targetInfo.amountInr,
      amountPaise: targetInfo.amountPaise,
      isUpgrade: false,
      isCurrentPlan: false,
      isLowerTier: false,
      diffInr: 0,
      displayText: `Activate ${targetInfo.name} (₹${targetInfo.amountInr})`,
      actionType: 'activate' as const,
    };
  }

  const currentInfo = PLAN_PRICING[currentPlan] || PLAN_PRICING.growth;

  if (currentPlan === targetPlan) {
    return {
      targetPlan,
      targetName: targetInfo.name,
      amountInr: targetInfo.amountInr,
      amountPaise: targetInfo.amountPaise,
      isUpgrade: false,
      isCurrentPlan: true,
      isLowerTier: false,
      diffInr: 0,
      displayText: `Renew ${targetInfo.name} (₹${targetInfo.amountInr}/yr)`,
      actionType: 'renew' as const,
    };
  }

  if (targetInfo.level > currentInfo.level) {
    const diff = targetInfo.amountInr - currentInfo.amountInr;
    return {
      targetPlan,
      targetName: targetInfo.name,
      amountInr: diff,
      amountPaise: diff * 100,
      isUpgrade: true,
      isCurrentPlan: false,
      isLowerTier: false,
      diffInr: diff,
      displayText: `Upgrade to ${targetInfo.name} (Pay ₹${diff} diff)`,
      actionType: 'upgrade' as const,
    };
  }

  // targetInfo.level < currentInfo.level
  return {
    targetPlan,
    targetName: targetInfo.name,
    amountInr: 0,
    amountPaise: 0,
    isUpgrade: false,
    isCurrentPlan: false,
    isLowerTier: true,
    diffInr: 0,
    displayText: `Included in ${currentInfo.name}`,
    actionType: 'included' as const,
  };
}

/**
 * Calculates remaining days and expiration date for active plan / free trial
 */
export function getSubscriptionRemainingInfo(business: {
  plan?: 'starter' | 'growth' | 'pro';
  trial_active?: boolean;
  subscription_status?: string;
  trial_ends_at?: string;
  subscription_ends_at?: string;
  created_at?: string;
} | null | undefined) {
  if (!business) return null;

  const isTrial = business.trial_active || business.subscription_status === 'trialing';
  const plan = business.plan || 'growth';
  const planName = plan.charAt(0).toUpperCase() + plan.slice(1);

  if (isTrial) {
    const trialEnds = business.trial_ends_at
      ? new Date(business.trial_ends_at)
      : new Date(Date.now() + 3 * 86400000);
    const now = new Date();
    const diffMs = trialEnds.getTime() - now.getTime();
    const daysRemaining = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
    const formattedDate = trialEnds.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });

    return {
      isTrial: true,
      plan,
      planName,
      daysRemaining,
      formattedDate,
      isExpired: daysRemaining <= 0,
      badgeText: daysRemaining <= 0 ? 'Trial Expired' : `${daysRemaining} ${daysRemaining === 1 ? 'day' : 'days'} trial remaining`,
      fullStatusText:
        daysRemaining <= 0
          ? `Trial ended on ${formattedDate}. Upgrade now to resume unlimited counter stamps & win-back.`
          : `Free Trial: ${daysRemaining} ${daysRemaining === 1 ? 'day' : 'days'} remaining (Ends on ${formattedDate})`,
      shortBadge: daysRemaining <= 0 ? 'Trial Expired' : `${daysRemaining}d Trial Left`,
    };
  }

  // Active Subscription
  const subEnds = business.subscription_ends_at
    ? new Date(business.subscription_ends_at)
    : new Date(new Date(business.created_at || Date.now()).getTime() + 365 * 86400000);

  const now = new Date();
  const diffMs = subEnds.getTime() - now.getTime();
  const daysRemaining = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
  const formattedDate = subEnds.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  return {
    isTrial: false,
    plan,
    planName,
    daysRemaining,
    formattedDate,
    isExpired: daysRemaining <= 0,
    badgeText:
      daysRemaining <= 0 ? 'Subscription Expired' : `${daysRemaining} ${daysRemaining === 1 ? 'day' : 'days'} remaining`,
    fullStatusText:
      daysRemaining <= 0
        ? `Subscription expired on ${formattedDate}. Renew to keep receiving digital stamps.`
        : `${planName} Plan Active: ${daysRemaining} ${daysRemaining === 1 ? 'day' : 'days'} remaining (Valid until ${formattedDate})`,
    shortBadge: daysRemaining <= 0 ? 'Expired' : `${daysRemaining}d Left`,
  };
}

export function getRazorpayClient(): Razorpay | null {
  const keyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret) {
    console.warn('Razorpay credentials missing in environment variables.');
    return null;
  }

  return new Razorpay({
    key_id: keyId,
    key_secret: keySecret,
  });
}

/**
 * Creates a Razorpay Order for annual subscription with upgrade difference awareness
 */
export async function createSubscriptionOrder(params: {
  plan: SubscriptionPlanType;
  businessId: string;
  businessName: string;
  currentPlan?: SubscriptionPlanType;
  isTrial?: boolean;
  ownerEmail?: string;
}) {
  const { plan, businessId, businessName, currentPlan, isTrial = false, ownerEmail } = params;
  const pricingDetails = getPlanUpgradeDetails(currentPlan, isTrial, plan);
  const razorpay = getRazorpayClient();

  if (!razorpay) {
    throw new Error(
      'Razorpay API keys are not configured. Please set NEXT_PUBLIC_RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in .env.local'
    );
  }

  const receipt = `rcpt_${businessId.slice(0, 8)}_${Date.now().toString(36)}`;

  const order = await razorpay.orders.create({
    amount: pricingDetails.amountPaise,
    currency: 'INR',
    receipt: receipt,
    notes: {
      businessId,
      businessName,
      plan,
      fromPlan: currentPlan || '',
      isUpgrade: pricingDetails.isUpgrade ? 'true' : 'false',
      diffInr: String(pricingDetails.diffInr),
      ownerEmail: ownerEmail || '',
      type: pricingDetails.isUpgrade ? 'tier_upgrade' : 'annual_subscription',
    },
  });

  return {
    orderId: order.id,
    amount: pricingDetails.amountPaise,
    amountInr: pricingDetails.amountInr,
    currency: 'INR',
    plan,
    planName: pricingDetails.targetName,
    isUpgrade: pricingDetails.isUpgrade,
    diffInr: pricingDetails.diffInr,
    keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
  };
}

/**
 * Verifies Razorpay payment signature
 */
export function verifyRazorpaySignature(params: {
  orderId: string;
  paymentId: string;
  signature: string;
}): boolean {
  const { orderId, paymentId, signature } = params;
  const secret = process.env.RAZORPAY_KEY_SECRET;

  if (!secret) {
    console.error('RAZORPAY_KEY_SECRET is not configured.');
    return false;
  }

  const body = `${orderId}|${paymentId}`;
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(body.toString())
    .digest('hex');

  return expectedSignature === signature;
}

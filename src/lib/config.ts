// ============================================================================
// REVA (reva.in) — Global Feature Flags & Platform Configuration
// ============================================================================

/**
 * SUBSCRIPTION_ENABLED Feature Flag
 *
 * Why: For now, Reva is a lead-gen funnel. We bring in growth-focused restaurant
 * owners through it and sell them our social media / digital marketing services.
 * No paid plans needed right now.
 *
 * When false:
 * - Hide all subscription UI: pricing, plans, upgrade, billing, trial banners.
 * - Skip trial-expiry checks and paywall/lock logic. Owners get full access to all features, always.
 * - Disable Razorpay checkout and webhook flows behind this flag.
 * - Replaces the "Upgrade" CTA with "Grow your restaurant, talk to us" (opens WhatsApp at 8080004929).
 *
 * To turn subscriptions back on:
 * Set NEXT_PUBLIC_SUBSCRIPTION_ENABLED=true in .env.local (or production environment).
 */
export const SUBSCRIPTION_ENABLED: boolean =
  process.env.NEXT_PUBLIC_SUBSCRIPTION_ENABLED === 'true';

export const LEAD_GEN_WHATSAPP_PHONE = '8080004929';

export function getGrowRestaurantWhatsAppUrl(businessName?: string): string {
  const store = businessName?.trim();
  const text = store
    ? `Hi Reva team, I run ${store} and I'd like to talk about growing my restaurant and your digital marketing services.`
    : `Hi Reva team, I'd like to talk about growing my restaurant and your digital marketing services.`;
  return `https://wa.me/91${LEAD_GEN_WHATSAPP_PHONE}?text=${encodeURIComponent(text)}`;
}

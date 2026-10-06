// ============================================================================
// REVA (reva.in) — Client-side Razorpay Checkout Modal
// Dynamically loads Razorpay SDK & opens customized payment gateway
// ============================================================================

import { sound } from '@/lib/sound';
import confetti from 'canvas-confetti';

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Razorpay: any;
  }
}

export function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') {
      resolve(false);
      return;
    }

    if (window.Razorpay) {
      resolve(true);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export interface RazorpayCheckoutOptions {
  plan: 'starter' | 'growth' | 'pro';
  businessId: string;
  businessName: string;
  ownerEmail?: string;
  onSuccess?: (result: { plan: string; message: string }) => void;
  onError?: (error: string) => void;
  onCancel?: () => void;
}

export async function openRazorpayCheckout(options: RazorpayCheckoutOptions) {
  const { plan, businessId, businessName, ownerEmail, onSuccess, onError, onCancel } = options;

  try {
    sound.playClick();

    // 1. Create order on server
    const orderRes = await fetch('/api/razorpay/order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ plan, businessId }),
    });

    const orderData = await orderRes.json();

    if (!orderRes.ok || !orderData.success) {
      const err = orderData.error || 'Failed to create payment order';
      onError?.(err);
      alert(`Payment Error: ${err}`);
      return;
    }

    // 2. If sandbox fallback (no secret set yet)
    if (orderData.isDevSandbox) {
      const confirmDev = window.confirm(
        `[Razorpay Dev Mode]\n\nPlan: ${orderData.planName} (₹${orderData.amountInr}/yr)\nStore: ${businessName}\n\nRazorpay Secret is not set in .env.local yet. Would you like to simulate successful activation now?`
      );

      if (confirmDev) {
        const verifyRes = await fetch('/api/razorpay/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            businessId,
            plan,
            isDevSandbox: true,
          }),
        });

        const verifyData = await verifyRes.json();
        if (verifyData.success) {
          sound.playRewardFanfare();
          confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 } });
          onSuccess?.({ plan, message: verifyData.message });
        }
      } else {
        onCancel?.();
      }
      return;
    }

    // 3. Load script and open live/test Razorpay modal
    const loaded = await loadRazorpayScript();
    if (!loaded) {
      onError?.('Could not load Razorpay SDK. Please check your internet connection.');
      alert('Could not connect to Razorpay. Please check your internet connection.');
      return;
    }

    const rzpOptions = {
      key: orderData.keyId,
      amount: orderData.amount,
      currency: orderData.currency || 'INR',
      description: orderData.isUpgrade
        ? `Upgrade to ${orderData.planName} (Difference: ₹${orderData.amountInr || orderData.diffInr || orderData.amount / 100}) for ${businessName}`
        : `${orderData.planName} (1-Year Access for ${businessName})`,
      image: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=120&auto=format&fit=crop&q=80',
      order_id: orderData.orderId,
      prefill: {
        email: ownerEmail || '',
      },
      theme: {
        color: '#0F172A',
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      handler: async function (response: any) {
        try {
          sound.playStampPop();
          const verifyRes = await fetch('/api/razorpay/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              businessId,
              plan,
            }),
          });

          const verifyData = await verifyRes.json();

          if (verifyData.success) {
            sound.playRewardFanfare();
            confetti({ particleCount: 150, spread: 90, origin: { y: 0.5 } });
            onSuccess?.({ plan, message: verifyData.message });
          } else {
            onError?.(verifyData.error || 'Payment signature verification failed');
            alert(verifyData.error || 'Payment verification failed');
          }
        } catch (err) {
          console.error(err);
          onError?.('Error verifying payment.');
        }
      },
      modal: {
        ondismiss: function () {
          onCancel?.();
        },
      },
    };

    const paymentObject = new window.Razorpay(rzpOptions);
    paymentObject.open();
  } catch (err: unknown) {
    console.error('Razorpay checkout error:', err);
    onError?.(err instanceof Error ? err.message : 'Checkout failed');
  }
}

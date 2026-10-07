'use client';

// ============================================================================
// REVA (reva.in) — Customer POV: Digital Wallet Stamp Pass (/c/[slug])
// 1-Time Phone Registration/Login → Instant Digital Stamp Card
// Bottom Tab Bar: [🏠 Stamp Card] [🎁 Offers] [🕒 Visits]
// ============================================================================

import React, { useState, useEffect, useMemo, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import confetti from 'canvas-confetti';
import {
  Coffee,
  Sparkles,
  Gift,
  ArrowRight,
  ShieldCheck,
  Smartphone,
  CheckCircle2,
  Share2,
  RefreshCw,
  PlusCircle,
  Award,
  Wallet,
  Store,
  Check,
  Home,
  Tag,
  Clock,
  LogOut,
  Calendar,
  Flame,
  Star,
  ChevronRight,
  Compass,
  User,
  QrCode,
  Camera,
  X,
  AlertCircle,
  Timer,
  Info,
  MapPin,
  Navigation,
  Phone,
  ExternalLink,
} from 'lucide-react';
import { Business, Customer, Membership } from '@/types/database';
import { sound } from '@/lib/sound';
import { resolvePassBackground, resolvePageBackground } from '@/lib/theme-presets';
import { supabase } from '@/lib/supabase';
import CameraQrScannerModal from '@/components/CameraQrScannerModal';

function CustomerWalletCardContent() {
  const routeParams = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const rawSlug = (Array.isArray(routeParams?.slug) ? routeParams.slug[0] : (routeParams?.slug as string)) || '';
  let decodedSlug = rawSlug;
  try {
    decodedSlug = decodeURIComponent(rawSlug).trim();
  } catch {}
  const slug = decodedSlug;

  const prefillPhone = searchParams?.get('phone') || '';
  const winbackOfferCode = searchParams?.get('offer') || '';
  const autoScanParam = searchParams?.get('scan') || searchParams?.get('stamp') || searchParams?.get('claim');
  const isTestMode = searchParams?.get('test') === '1' || searchParams?.get('test') === 'true' || searchParams?.get('preview') === 'true';

  const [business, setBusiness] = useState<Business | null>(null);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [membership, setMembership] = useState<Membership | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  // Authentication State
  const [phoneInput, setPhoneInput] = useState(isTestMode ? '' : prefillPhone);
  const [nameInput, setNameInput] = useState('');
  const [isRegistered, setIsRegistered] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Bottom Navigation State: 'card' (Stamp Card Home) | 'offers' | 'details' | 'visits'
  const [activeTab, setActiveTab] = useState<'card' | 'offers' | 'details' | 'visits'>('card');
  const [rewardSubTab, setRewardSubTab] = useState<'to-claim' | 'history'>('to-claim');
  const [claimedRewards, setClaimedRewards] = useState<Array<{
    id: string;
    businessName: string;
    businessSlug: string;
    rewardTitle: string;
    claimedAt: string;
    voucherCode: string;
  }>>([]);

  // Stamp & Cooldown Interaction State
  const [stampAnimating, setStampAnimating] = useState(false);
  const [isQrClaiming, setIsQrClaiming] = useState(false);
  const [cooldownModal, setCooldownModal] = useState<{
    isOpen: boolean;
    hoursRemaining: number;
    minutesRemaining: number;
    nextAvailableAt?: string;
    lastClaimedAt?: string;
  } | null>(null);
  const [qrClaimSuccessModal, setQrClaimSuccessModal] = useState<{
    isOpen: boolean;
    stamps: number;
    stampsNeeded: number;
    rewardUnlocked?: boolean;
  } | null>(null);
  const [rewardClaimedSuccess, setRewardClaimedSuccess] = useState(false);
  const [showRedeemModal, setShowRedeemModal] = useState(false);
  const [selectedRedeemOffer, setSelectedRedeemOffer] = useState<{ title: string; desc?: string; stampsNeeded?: number; expiryText?: string } | null>(null);
  const [selectedMilestoneInfo, setSelectedMilestoneInfo] = useState<{ offer: any; expiryInfo: any } | null>(null);
  const [showWalletModal, setShowWalletModal] = useState<'apple' | 'google' | null>(null);
  const [showScannerModal, setShowScannerModal] = useState(false);

  // 1. Fetch Store & Check Local Session (Fast Cache + Background Revalidation)
  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      try {
        if (isTestMode) {
          try {
            localStorage.removeItem(`reva_phone_${slug}`);
            localStorage.removeItem(`reva_phone_${rawSlug}`);
          } catch {}
        }

        // Fast restore cached store immediately (0ms visual latency)
        const cachedBiz =
          localStorage.getItem(`reva_biz_cache_${slug}`) ||
          localStorage.getItem(`reva_biz_cache_${rawSlug}`) ||
          localStorage.getItem('reva_last_active_biz');
        if (cachedBiz) {
          try {
            const parsed = JSON.parse(cachedBiz);
            if (parsed?.id) {
              setBusiness(parsed);
              setLoading(false);
            }
          } catch {}
        }

        // Fast restore cached membership on refresh / revisit (eliminates login flash)
        const cachedMem = localStorage.getItem(`reva_mem_${slug}`) || localStorage.getItem(`reva_mem_${rawSlug}`);
        if (cachedMem && !isTestMode) {
          try {
            const parsedMem = JSON.parse(cachedMem);
            if (parsedMem?.id) {
              setMembership(parsedMem);
              setIsRegistered(true);
            }
          } catch {}
        }

        // Read from URL, LocalStorage, or Cookie (for Google Lens / In-App Browser persistence)
        let cookiePhone = '';
        if (typeof document !== 'undefined') {
          const match = document.cookie.match(/(?:^|;\s*)reva_customer_phone=([^;]+)/);
          if (match) cookiePhone = decodeURIComponent(match[1]);
        }

        const savedStorePhone = !isTestMode ? (prefillPhone || localStorage.getItem(`reva_phone_${slug}`) || localStorage.getItem(`reva_phone_${rawSlug}`)) : '';
        const globalPhone = !isTestMode ? (localStorage.getItem('reva_customer_phone') || cookiePhone) : '';
        const globalName = !isTestMode ? localStorage.getItem('reva_customer_name') : '';
        const globalEmail = !isTestMode ? localStorage.getItem('reva_customer_email') : '';
        const phoneToPrefill = savedStorePhone || (globalPhone && !globalPhone.includes('@') && globalPhone.replace(/\D/g, '').length >= 10 ? globalPhone : '');

        if (phoneToPrefill && !isTestMode) {
          setPhoneInput(phoneToPrefill);
        }
        if (globalName && globalName !== 'Valued Guest' && globalName !== 'Aarav Sharma' && !isTestMode) {
          setNameInput(globalName);
        }

        try {
          const savedClaimed = localStorage.getItem('reva_claimed_rewards');
          if (savedClaimed) {
            const parsed = JSON.parse(savedClaimed);
            if (Array.isArray(parsed)) {
              setClaimedRewards(parsed.filter((c: any) => c.businessSlug === slug || c.businessSlug === rawSlug || !c.businessSlug));
            }
          }
        } catch {}

        const bizRes = await fetch(`/api/businesses/${encodeURIComponent(slug)}`, {
          cache: 'no-store',
          headers: { 'Cache-Control': 'no-cache' },
        });

        const bizData = await bizRes.json();
        if (!isMounted) return;

        if (bizData.success && bizData.business) {
          setBusiness(bizData.business);
          setError(null);
          try {
            localStorage.setItem(`reva_biz_cache_${slug}`, JSON.stringify(bizData.business));
            localStorage.setItem(`reva_biz_cache_${rawSlug}`, JSON.stringify(bizData.business));
            localStorage.setItem('reva_last_active_biz', JSON.stringify(bizData.business));
          } catch {}
        } else if (!business && !cachedBiz) {
          setError('Store not found. Please scan the counter QR code.');
          setLoading(false);
          return;
        }

        // Check if customer already has a recognized phone on this device
        const rawEmail = globalEmail || localStorage.getItem('reva_customer_email') || null;
        const authEmail = (rawEmail && !rawEmail.includes('primezedexx') && !rawEmail.includes('owner') && !rawEmail.endsWith('@reva.in')) ? rawEmail : null;
        const effectivePhone = phoneToPrefill;

        // Auto-restore customer pass and membership seamlessly across scans
        if (effectivePhone && !isTestMode) {
          try {
            const sessionRes = await fetch('/api/customer/session', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                businessSlug: slug,
                phone: effectivePhone || undefined,
                email: authEmail || undefined,
                name: globalName && globalName !== 'Valued Guest' && globalName !== 'Aarav Sharma' ? globalName : undefined,
              }),
            });
            if (sessionRes.ok) {
              const sessData = await sessionRes.json();
              if (sessData.success && isMounted) {
                setCustomer(sessData.customer);
                setMembership(sessData.membership);
                setIsRegistered(true);
                try {
                  localStorage.setItem(`reva_mem_${slug}`, JSON.stringify(sessData.membership));
                  localStorage.setItem(`reva_phone_${slug}`, sessData.customer?.phone || effectivePhone);
                  localStorage.setItem('reva_customer_phone', sessData.customer?.phone || effectivePhone);
                  document.cookie = `reva_customer_phone=${encodeURIComponent(sessData.customer?.phone || effectivePhone)}; path=/; max-age=31536000; SameSite=Lax`;
                } catch {}
                if (sessData.customer?.name && sessData.customer.name !== 'Valued Guest' && sessData.customer.name !== 'Aarav Sharma') {
                  try {
                    localStorage.setItem('reva_customer_name', sessData.customer.name);
                  } catch {}
                }
                if (sessData.customer?.email && !sessData.customer.email.includes('primezedexx') && !sessData.customer.email.includes('owner')) {
                  try {
                    localStorage.setItem('reva_customer_email', sessData.customer.email);
                  } catch {}
                } else {
                  try {
                    localStorage.removeItem('reva_customer_email');
                  } catch {}
                }
              }
            }
          } catch {}
        }
      } catch (err: unknown) {
        if (isMounted && !business) {
          setError('Failed to load loyalty pass. Please refresh.');
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadData();
    return () => {
      isMounted = false;
    };
  }, [slug, rawSlug, prefillPhone, isTestMode, retryCount]);

  // 2. Real-Time Live Sync: Polling for Cashier Stamp Punches & Store Customization
  useEffect(() => {
    if (!isRegistered || !customer || !business) return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch('/api/customer/session', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache, no-store, must-revalidate',
          },
          body: JSON.stringify({
            businessSlug: slug,
            phone: customer.phone,
          }),
        });
        const data = await res.json();
        if (data.success) {
          // Sync any store customization updates live
          if (data.business) {
            setBusiness(data.business);
          }
          if (data.membership) {
            // Check if stamps were incremented by cashier behind the counter
            setMembership((prev) => {
              if (prev && (data.membership.stamps > prev.stamps || data.membership.total_visits > prev.total_visits)) {
                if (data.membership.stamps > prev.stamps) {
                  sound.playStampPop();
                  setStampAnimating(true);
                  setTimeout(() => setStampAnimating(false), 500);

                  if (data.membership.stamps >= (data.business?.reward_rule?.stamps_needed || business.reward_rule?.stamps_needed || 6)) {
                    sound.playRewardFanfare();
                    confetti({
                      particleCount: 120,
                      spread: 80,
                      origin: { y: 0.6 },
                    });
                  }
                }
              }
              return data.membership;
            });
          }
        }
      } catch (err) {
        console.error('Live sync poll error', err);
      }
    }, 1500);

    return () => clearInterval(interval);
  }, [isRegistered, customer, business, slug]);

  // Authenticate / Register Customer in 1 Tap
  async function authenticateCustomer(phone: string, businessId?: string, name?: string) {
    try {
      setIsSubmitting(true);
      const rawEmail = localStorage.getItem('reva_customer_email') || null;
      const authEmail = (rawEmail && !rawEmail.includes('primezedexx') && !rawEmail.includes('owner') && !rawEmail.endsWith('@reva.in')) ? rawEmail : undefined;

      const res = await fetch('/api/customer/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessSlug: slug,
          phone,
          name: name || undefined,
          email: authEmail || undefined,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setCustomer(data.customer);
        setMembership(data.membership);
        setIsRegistered(true);
        localStorage.setItem(`reva_mem_${slug}`, JSON.stringify(data.membership));
        localStorage.setItem(`reva_phone_${slug}`, phone);
        localStorage.setItem('reva_customer_phone', phone);
        try {
          document.cookie = `reva_customer_phone=${encodeURIComponent(phone)}; path=/; max-age=31536000; SameSite=Lax`;
        } catch {}
        if (data.customer?.name && data.customer.name !== 'Valued Guest') {
          localStorage.setItem('reva_customer_name', data.customer.name);
        }
        if (data.customer?.email && !data.customer.email.includes('primezedexx') && !data.customer.email.includes('owner')) {
          localStorage.setItem('reva_customer_email', data.customer.email);
        } else {
          try { localStorage.removeItem('reva_customer_email'); } catch {}
        }
        if (data.customer?.avatar_url) {
          localStorage.setItem('reva_customer_avatar', data.customer.avatar_url);
        }
        if (data.customer?.registered_at || data.customer?.created_at) {
          localStorage.setItem('reva_customer_registered_at', data.customer.registered_at || data.customer.created_at);
        }
      } else {
        setError(data.error || 'Failed to authenticate');
      }
    } catch {
      setError('Connection error');
    } finally {
      setIsSubmitting(false);
    }
  }

  // Handle 1-Time Customer Registration / Login Form
  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    if (!phoneInput || phoneInput.trim().length < 8) {
      alert('Please enter a valid mobile number');
      return;
    }
    sound.playClick();
    await authenticateCustomer(phoneInput.trim(), business?.id, nameInput.trim());
  }

  // Handle Log Out / Switch Phone
  function handleSwitchNumber() {
    sound.playClick();
    localStorage.removeItem(`reva_phone_${slug}`);
    localStorage.removeItem(`reva_mem_${slug}`);
    try {
      localStorage.removeItem('reva_customer_phone');
      localStorage.removeItem('reva_customer_name');
      localStorage.removeItem('reva_customer_passes');
      localStorage.removeItem('reva_global_phone');
      document.cookie = 'reva_customer_phone=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax';
    } catch {}
    setIsRegistered(false);
    setCustomer(null);
    setMembership(null);
    setPhoneInput('');
    setNameInput('');
  }

  // 24-Hour QR Cooldown status computation
  const lastQrTimestamp = membership?.last_qr_stamp_at ? new Date(membership.last_qr_stamp_at).getTime() : 0;
  const nowTime = Date.now();
  const COOLDOWN_MS = 24 * 60 * 60 * 1000;
  const timeSinceLastQr = nowTime - lastQrTimestamp;
  const isQrCooldownActive = lastQrTimestamp > 0 && timeSinceLastQr < COOLDOWN_MS;
  const remainingCooldownMs = isQrCooldownActive ? (COOLDOWN_MS - timeSinceLastQr) : 0;
  const remainingHours = Math.max(0, Math.floor(remainingCooldownMs / (1000 * 60 * 60)));
  const remainingMins = Math.max(0, Math.floor((remainingCooldownMs % (1000 * 60 * 60)) / (1000 * 60)));

  // Handle Scan QR & Claim Daily Stamp (with 24-Hour Cooldown & Cashier Repeat Logic)
  async function handleClaimQrStamp() {
    if (!business || !membership) return;

    // Check if cooldown is active locally
    if (isQrCooldownActive) {
      sound.playClick();
      setCooldownModal({
        isOpen: true,
        hoursRemaining: remainingHours,
        minutesRemaining: remainingMins,
        lastClaimedAt: membership.last_qr_stamp_at || undefined,
      });
      return;
    }

    try {
      setIsQrClaiming(true);
      setStampAnimating(true);
      sound.playStampPop();

      const res = await fetch('/api/stamp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessId: business.id,
          membershipId: membership.id,
          stampAwarded: 1,
          source: 'qr_scan',
          staffNote: 'Customer Counter QR Scan',
        }),
      });

      const data = await res.json();

      if (data.cooldownActive || res.status === 429) {
        setCooldownModal({
          isOpen: true,
          hoursRemaining: data.hoursRemaining ?? remainingHours,
          minutesRemaining: data.minutesRemaining ?? remainingMins,
          nextAvailableAt: data.nextAvailableAt,
          lastClaimedAt: data.lastClaimedAt || membership.last_qr_stamp_at || undefined,
        });
        return;
      }

      if (data.success) {
        setMembership(data.membership);
        setQrClaimSuccessModal({
          isOpen: true,
          stamps: data.membership.stamps,
          stampsNeeded: business.reward_rule?.stamps_needed || 6,
          rewardUnlocked: data.rewardUnlocked,
        });

        if (data.rewardUnlocked) {
          sound.playRewardFanfare();
          confetti({
            particleCount: 120,
            spread: 80,
            origin: { y: 0.6 },
            colors: ['#0F172A', '#F59E0B', '#10B981', '#3B82F6'],
          });
        }
      } else {
        setError(data.error || 'Failed to claim stamp');
      }
    } catch (err) {
      console.error('Error claiming QR stamp:', err);
    } finally {
      setIsQrClaiming(false);
      setTimeout(() => setStampAnimating(false), 500);
    }
  }

  const handleAddStamp = handleClaimQrStamp;

  // Auto-trigger stamp claim if URL had ?scan=1 / ?stamp=1
  useEffect(() => {
    if (isRegistered && membership && business && autoScanParam && !loading) {
      const url = new URL(window.location.href);
      url.searchParams.delete('scan');
      url.searchParams.delete('stamp');
      url.searchParams.delete('claim');
      window.history.replaceState({}, '', url.toString());

      handleClaimQrStamp();
    }
  }, [isRegistered, membership, business, autoScanParam, loading]);

  // Handle Redeem Reward
  async function handleRedeemReward() {
    if (!business || !membership) return;
    const needed = business.reward_rule?.stamps_needed || 6;
    if ((membership.stamps || 0) < needed) {
      alert(`You need ${needed} stamps to redeem this reward. You currently have ${membership.stamps || 0} stamps.`);
      return;
    }

    try {
      sound.playClick();
      const rewardTitle = selectedRedeemOffer?.title || business.reward_rule?.reward_title || 'Free Specialty Beverage';
      const res = await fetch('/api/reward/redeem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          membershipId: membership.id,
          businessId: business.id,
          rewardDesc: rewardTitle,
          verifiedBy: 'customer_self_verify',
        }),
      });
      const data = await res.json();
      if (data.success) {
        setRewardClaimedSuccess(true);
        setShowRedeemModal(false);
        setSelectedRedeemOffer(null);
        sound.playRewardFanfare();
        confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
        // Refresh membership stamps
        const newStampsCount = Math.max(0, (membership.stamps || 0) - needed);
        setMembership((prev) => prev ? { ...prev, stamps: newStampsCount, total_visits: prev.total_visits + 1 } : null);

        // Sync with Reva Customer Hub localStorage
        try {
          const code = `REV-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
          const savedPasses = localStorage.getItem('reva_customer_passes');
          if (savedPasses) {
            const parsed = JSON.parse(savedPasses);
            if (Array.isArray(parsed)) {
              const updated = parsed.map((p: { slug: string; stamps?: number }) =>
                p.slug === slug ? { ...p, stamps: newStampsCount } : p
              );
              localStorage.setItem('reva_customer_passes', JSON.stringify(updated));
            }
          }
          const savedClaimed = localStorage.getItem('reva_claimed_rewards');
          const claimedList = savedClaimed ? JSON.parse(savedClaimed) : [];
          const newClaimItem = {
            id: `claim_${Date.now()}`,
            businessName: business.name,
            businessSlug: slug,
            rewardTitle,
            claimedAt: 'Just now',
            voucherCode: code,
          };
          claimedList.unshift(newClaimItem);
          setClaimedRewards((prev) => [newClaimItem, ...prev]);
          localStorage.setItem('reva_claimed_rewards', JSON.stringify(claimedList));
        } catch {
          // ignore
        }
      }
    } catch (err) {
      console.error(err);
    }
  }

  const stampsNeeded = business?.reward_rule?.stamps_needed || 6;
  const grandRewardTitle = business?.reward_rule?.reward_title || 'Free Specialty Beverage';
  const minOrder = business?.reward_rule?.min_order_for_stamp || business?.min_order_for_stamp || 150;
  const currentStamps = membership?.stamps ?? 0;
  const stampsRemaining = Math.max(0, stampsNeeded - currentStamps);
  const isRewardReady = currentStamps >= stampsNeeded;

  // Active offers configured for this business
  const activeOffers = (business?.active_offers && Array.isArray(business.active_offers))
    ? business.active_offers
    : [];

  // Intermediate milestone rewards configured on the pass
  const milestoneOffers = useMemo(() => {
    return activeOffers.filter((o) => (o.stamps_needed || 0) < stampsNeeded);
  }, [activeOffers, stampsNeeded]);

  // Compute precise date-based expiry info for any reward or milestone offer
  const getOfferExpiryInfo = useCallback((offer: { expiry_days?: number; stamps_needed?: number }) => {
    if (!offer.expiry_days || offer.expiry_days <= 0) {
      return {
        hasExpiry: false,
        label: 'No expiry',
        dateStr: '',
        daysLeft: null,
        isUrgent: false,
        text: 'No expiry limit • Complete anytime',
      };
    }

    const memberStartDate = membership?.created_at ? new Date(membership.created_at) : null;
    if (memberStartDate && !isNaN(memberStartDate.getTime())) {
      const expDate = new Date(memberStartDate.getTime() + offer.expiry_days * 24 * 60 * 60 * 1000);
      const msLeft = expDate.getTime() - Date.now();
      const daysLeft = Math.max(0, Math.ceil(msLeft / (1000 * 60 * 60 * 24)));
      const dateStr = expDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
      const isUrgent = daysLeft <= 3;
      return {
        hasExpiry: true,
        label: `Complete within ${offer.expiry_days} days`,
        dateStr,
        daysLeft,
        isUrgent,
        text: `Expires on ${dateStr} • ${daysLeft} ${daysLeft === 1 ? 'day' : 'days'} left to complete`,
      };
    }

    return {
      hasExpiry: true,
      label: `Complete within ${offer.expiry_days} days`,
      dateStr: '',
      daysLeft: offer.expiry_days,
      isUrgent: false,
      text: `Complete within ${offer.expiry_days} days of pass start`,
    };
  }, [membership]);

  // Derived ready-to-claim unlocked rewards for this store (placed before any early returns to satisfy React Hook rules)
  const unlockedRewardsList = useMemo(() => {
    if (!business) return [];
    const list: Array<{
      id: string;
      businessName: string;
      businessSlug: string;
      brandColor: string;
      rewardTitle: string;
      stamps: number;
      totalNeeded: number;
      expiryDays?: number;
      expiryDateText?: string;
    }> = [];

    if (currentStamps >= stampsNeeded && grandRewardTitle) {
      const grandExpiry = getOfferExpiryInfo({
        expiry_days: business.reward_rule?.expiry_days,
        stamps_needed: stampsNeeded,
      });
      list.push({
        id: 'main_store_reward',
        businessName: business.name,
        businessSlug: business.slug,
        brandColor: business.brand_color || '#0F172A',
        rewardTitle: grandRewardTitle,
        stamps: currentStamps,
        totalNeeded: stampsNeeded,
        expiryDays: business.reward_rule?.expiry_days,
        expiryDateText: grandExpiry.hasExpiry ? grandExpiry.text : undefined,
      });
    }

    if (business.active_offers && Array.isArray(business.active_offers)) {
      for (const off of business.active_offers) {
        const offNeeded = off.stamps_needed || stampsNeeded;
        if (currentStamps >= offNeeded && off.title !== grandRewardTitle) {
          const offExpiry = getOfferExpiryInfo(off);
          list.push({
            id: off.id || `off_${off.title}`,
            businessName: business.name,
            businessSlug: business.slug,
            brandColor: business.brand_color || '#0F172A',
            rewardTitle: off.title,
            stamps: currentStamps,
            totalNeeded: offNeeded,
            expiryDays: off.expiry_days,
            expiryDateText: offExpiry.hasExpiry ? offExpiry.text : undefined,
          });
        }
      }
    }

    return list;
  }, [currentStamps, stampsNeeded, grandRewardTitle, business, getOfferExpiryInfo]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-white">
        <div className="w-8 h-8 flex items-center justify-center text-[#0F172A] animate-spin mb-3">
          <svg viewBox="0 0 24 24" className="w-8 h-8 fill-none stroke-current stroke-[2.2]">
            <path d="M12 2v20M2 12h20M4.93 4.93l14.14 14.14M4.93 19.07L19.07 4.93" />
          </svg>
        </div>
        <p className="text-xs font-mono font-bold uppercase tracking-widest text-slate-400">Loading Loyalty Pass...</p>
      </div>
    );
  }

  if (error || !business) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-white text-center">
        <div className="w-14 h-14 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mb-4 shadow-xs">
          <Store className="w-7 h-7" />
        </div>
        <h2 className="text-xl font-bold text-[#0F172A] mb-2 font-display">Loyalty Pass Notice</h2>
        <p className="text-xs text-slate-500 max-w-xs mb-6">
          {error || 'Unable to retrieve store pass details. Please tap reload or scan the counter QR code again.'}
        </p>
        
        <div className="flex flex-col gap-2.5 w-full max-w-xs">
          <button
            onClick={() => {
              setError(null);
              setLoading(true);
              setRetryCount((c) => c + 1);
            }}
            className="w-full py-3 rounded-full bg-[#0F172A] text-white text-xs font-bold hover:bg-black transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer active:scale-95"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Reload Loyalty Pass</span>
          </button>

          <button
            onClick={() => setShowScannerModal(true)}
            className="w-full py-3 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
          >
            <Camera className="w-4 h-4" />
            <span>Scan Counter QR Code</span>
          </button>

          <Link
            href="/c"
            className="w-full py-2.5 rounded-full border border-slate-200 text-slate-600 text-xs font-medium hover:bg-slate-50 transition-all text-center"
          >
            Browse All Active Passes
          </Link>
        </div>

        {showScannerModal && (
          <CameraQrScannerModal
            isOpen={showScannerModal}
            onClose={() => setShowScannerModal(false)}
            currentSlug={slug}
          />
        )}
      </div>
    );
  }

  const theme = business.theme_config || business.reward_rule?.theme_config;
  const pageBg = resolvePageBackground(theme);
  const passCardBg = resolvePassBackground(theme, business.brand_color);
  const cardRadiusClass = theme?.card_radius === 'rounded_squircle' ? 'rounded-[32px]' : theme?.card_radius === 'rounded_sharp' ? 'rounded-2xl' : 'rounded-3xl';
  const accentColor = theme?.accent_color || business.brand_color || '#0F172A';
  const stampIcon = theme?.stamp_icon || 'coffee';
  const categoryBadge = business.reward_rule?.category || business.category || 'OFFICIAL LOYALTY PASS';
  const customTagline = theme?.custom_tagline;

  function renderStampIconSymbol(iconType: string, isStamped: boolean, isRewardSlot: boolean) {
    if (isRewardSlot) {
      return isStamped ? (
        <Gift className="w-5 h-5 text-amber-400 fill-amber-400 animate-bounce" />
      ) : (
        <Gift className="w-5 h-5 text-amber-300" />
      );
    }
    if (iconType === 'paw') {
      return isStamped ? <span className="text-xl leading-none select-none">🐾</span> : <span className="text-sm opacity-50 font-mono">🐾</span>;
    }
    if (iconType === 'croissant') {
      return isStamped ? <span className="text-xl leading-none select-none">🥐</span> : <span className="text-sm opacity-50 font-mono">🥐</span>;
    }
    if (iconType === 'matcha') {
      return isStamped ? <span className="text-xl leading-none select-none">🍵</span> : <span className="text-sm opacity-50 font-mono">🍵</span>;
    }
    if (iconType === 'boba') {
      return isStamped ? <span className="text-xl leading-none select-none">🧋</span> : <span className="text-sm opacity-50 font-mono">🧋</span>;
    }
    if (iconType === 'heart') {
      return isStamped ? <span className="text-xl leading-none select-none">❤️</span> : <span className="text-sm opacity-50 font-mono">❤️</span>;
    }
    if (iconType === 'gem') {
      return isStamped ? <span className="text-xl leading-none select-none">💎</span> : <span className="text-sm opacity-50 font-mono">💎</span>;
    }
    if (iconType === 'flash') {
      return isStamped ? <span className="text-xl leading-none select-none">⚡</span> : <span className="text-sm opacity-50 font-mono">⚡</span>;
    }
    if (iconType === 'sparkles') {
      return isStamped ? <span className="text-xl leading-none select-none">✨</span> : <span className="text-sm opacity-50 font-mono">✨</span>;
    }
    if (iconType === 'star') {
      return isStamped ? <span className="text-xl leading-none select-none">⭐</span> : <span className="text-sm opacity-50 font-mono">⭐</span>;
    }
    if (iconType === 'gift') {
      return isStamped ? <span className="text-xl leading-none select-none">🎁</span> : <span className="text-sm opacity-50 font-mono">🎁</span>;
    }
    if (iconType === 'flame') {
      return isStamped ? <Flame className="w-5 h-5 text-amber-400 fill-amber-400/30" /> : <Flame className="w-5 h-5 text-white/50" />;
    }
    if (iconType === 'coffee') {
      return isStamped ? <Coffee className="w-5 h-5" style={{ color: accentColor }} /> : <Coffee className="w-5 h-5 text-white/50" />;
    }
    return isStamped ? <Check className="w-5 h-5 stroke-[3]" style={{ color: accentColor }} /> : <Star className="w-5 h-5 text-white/40" />;
  }

  return (
    <main
      className="min-h-screen flex flex-col items-center justify-between font-sans antialiased pb-20 transition-colors duration-300"
      style={{
        backgroundColor: pageBg.bg,
        color: pageBg.isDark ? '#F8FAFC' : '#0F172A',
      }}
    >
      {/* ========================================================================= */}
      {/* 1. TOP BRANDING BAR (reva.in) */}
      {/* ========================================================================= */}
      <header
        className="w-full backdrop-blur-md border-b py-3 px-5 sm:px-6 sticky top-0 z-40 transition-all"
        style={{
          backgroundColor: pageBg.isDark ? 'rgba(15, 23, 42, 0.92)' : 'rgba(255, 255, 255, 0.92)',
          borderColor: pageBg.isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)',
        }}
      >
        <div className="max-w-md mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <div
              className="w-6 h-6 flex items-center justify-center group-hover:rotate-45 transition-transform duration-500"
              style={{ color: pageBg.isDark ? '#F8FAFC' : '#0F172A' }}
            >
              <svg viewBox="0 0 24 24" className="w-5 h-5 fill-none stroke-current stroke-[2.2]">
                <path d="M12 2v20M2 12h20M4.93 4.93l14.14 14.14M4.93 19.07L19.07 4.93" />
              </svg>
            </div>
            <div className="flex items-baseline gap-0.5">
              <span className="font-display text-lg font-bold tracking-tight" style={{ color: pageBg.isDark ? '#FFFFFF' : '#0F172A' }}>
                Reva
              </span>
              <span className="text-slate-400 font-display font-medium text-xs">.in</span>
            </div>
          </Link>

          {isRegistered && customer ? (
            <div className="flex items-center gap-2">
              <span className={`text-[11px] font-mono font-medium px-2.5 py-1 rounded-full border ${pageBg.isDark ? 'bg-white/10 text-slate-200 border-white/10' : 'bg-slate-100 text-slate-600 border-slate-200/60'}`}>
                {customer.phone}
              </span>
              <button
                onClick={handleSwitchNumber}
                title="Switch mobile number"
                className="text-slate-400 hover:text-slate-200 p-1 cursor-pointer transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <div className="text-[10px] font-mono uppercase tracking-widest font-bold opacity-60">
              ZERO-APP PASS
            </div>
          )}
        </div>
      </header>

      {/* ========================================================================= */}
      {/* 2. MAIN CONTAINER */}
      {/* ========================================================================= */}
      <div className="w-full max-w-md px-4 sm:px-6 py-5 flex-1 flex flex-col justify-start space-y-4">
        {/* ========================================================================= */}
        {/* SCREEN A: 1-TIME CUSTOMER LOGIN / REGISTER (IF NOT AUTHENTICATED) */}
        {/* ========================================================================= */}
        {!isRegistered ? (
          <div className={`${cardRadiusClass} p-6 sm:p-8 shadow-2xl border text-center space-y-5 my-auto ${pageBg.isDark ? 'bg-slate-900/90 border-white/10 text-white' : 'bg-white border-slate-100 text-slate-900'} card-soft-shadow`}>
            {/* Store Avatar & Details */}
            <div
              className="w-16 h-16 rounded-2xl mx-auto overflow-hidden shadow-md flex items-center justify-center text-white"
              style={{ background: passCardBg }}
            >
              {business.logo_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={business.logo_url}
                  alt={business.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-2xl">{renderStampIconSymbol(stampIcon, true, false)}</span>
              )}
            </div>

            <div className="space-y-1">
              <div className="text-[10px] font-mono uppercase tracking-[0.2em] font-bold text-amber-500">
                {categoryBadge}
              </div>
              <h2 className="text-xl sm:text-2xl font-display font-bold tracking-tight">
                {business.name}
              </h2>
              <p className="text-xs opacity-75 max-w-xs mx-auto">
                {customTagline || `Collect digital stamps on every visit and earn your ${business.reward_rule?.reward_title || 'specialty reward'}`}
              </p>
              {(business.address || business.area) && (
                <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-500 font-medium pt-1">
                  <MapPin className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                  <span className="truncate max-w-xs">{business.address || `${business.area}, ${business.city}`}</span>
                </div>
              )}
            </div>

            {/* 1-Tap Phone Form */}
            <form onSubmit={handleRegister} className="space-y-4 text-left pt-1">
              <div>
                <label className="block text-xs font-semibold mb-1.5 opacity-90">
                  Enter Your Mobile Number
                </label>
                <div className="relative">
                  <Smartphone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    type="tel"
                    value={phoneInput}
                    onChange={(e) => setPhoneInput(e.target.value)}
                    placeholder="Enter 10-digit mobile number"
                    className={`w-full pl-10 pr-4 py-3 rounded-xl border text-sm font-medium focus:outline-none transition-all font-mono ${pageBg.isDark ? 'bg-slate-800 border-slate-700 text-white focus:bg-slate-700' : 'bg-slate-50/50 border-slate-200 text-slate-900 focus:bg-white'}`}
                    required
                    autoFocus
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1.5 opacity-90">
                  Your Name (Optional)
                </label>
                <input
                  type="text"
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  placeholder="e.g. Rahul"
                  className={`w-full px-4 py-2.5 rounded-xl border text-sm font-medium focus:outline-none transition-all ${pageBg.isDark ? 'bg-slate-800 border-slate-700 text-white focus:bg-slate-700' : 'bg-slate-50/50 border-slate-200 text-slate-900 focus:bg-white'}`}
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 rounded-full hover:brightness-110 active:scale-[0.99] text-white font-semibold text-xs sm:text-sm uppercase tracking-wider transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer mt-2"
                style={{ background: passCardBg }}
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-white" />
                    <span>Opening Pass...</span>
                  </>
                ) : (
                  <>
                    <span>View &amp; Collect Stamps</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <div className={`p-3 rounded-xl border text-[11px] flex items-center gap-2 justify-center font-mono ${pageBg.isDark ? 'bg-white/5 border-white/10 text-slate-300' : 'bg-slate-50 border-slate-100 text-slate-500'}`}>
                <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>No password needed • Auto-saved on your phone</span>
              </div>
            </form>
          </div>
        ) : (
          /* ========================================================================= */
          /* SCREEN B: AUTHENTICATED DIGITAL REWARDS PASS WITH TABS */
          /* ========================================================================= */
          <>
            {/* ========================================================================= */}
            {/* TAB 1: 🏠 STAMP CARD (HOME VIEW) */}
            {/* ========================================================================= */}
            {activeTab === 'card' && (
              <div className="space-y-4 animate-stamp">
                {/* Active Win-Back / Special Offer Banner */}
                {winbackOfferCode && (
                  <div
                    className={`${cardRadiusClass} text-white p-4 shadow-lg border border-white/20 flex items-start gap-3`}
                    style={{ background: passCardBg }}
                  >
                    <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center shrink-0 mt-0.5">
                      <Gift className="w-4 h-4 text-amber-300" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono font-bold uppercase tracking-wider bg-amber-400 text-slate-950 px-2 py-0.5 rounded-full">
                          Special Offer Unlocked
                        </span>
                        <span className="text-[11px] font-mono text-slate-300">{winbackOfferCode}</span>
                      </div>
                      <p className="text-xs font-semibold mt-1.5 leading-snug">
                        {business.winback_offer_text || 'Free special treat on your visit today!'}
                      </p>
                      <p className="text-[10px] text-slate-300 mt-0.5">Show this pass to cashier when ordering.</p>
                    </div>
                  </div>
                )}

                {/* Main Tactile Stamp Pass (Dynamic Store Brand & Theme Customization) */}
                <div
                  className={`relative ${cardRadiusClass} overflow-hidden p-6 sm:p-7 text-white shadow-2xl border border-white/15 transition-all duration-300`}
                  style={{ background: passCardBg }}
                >
                  {/* Card Header */}
                  <div className="flex items-start justify-between mb-5">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md p-1 shadow-md overflow-hidden shrink-0 flex items-center justify-center text-white border border-white/20">
                        {business.logo_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={business.logo_url}
                            alt={business.name}
                            className="w-full h-full object-cover rounded-[12px]"
                          />
                        ) : (
                          <span className="text-2xl">{renderStampIconSymbol(stampIcon, true, false)}</span>
                        )}
                      </div>
                      <div>
                        <div className="text-[10px] font-mono uppercase font-bold tracking-wider text-amber-300 mb-0.5">
                          {categoryBadge}
                        </div>
                        <h2 className="text-base font-display font-bold tracking-tight leading-snug text-white">
                          {business.name}
                        </h2>
                        <p className="text-xs text-white/80 font-medium">
                          Member: <span className="font-bold text-white">{customer?.name || 'Valued Regular'}</span>
                        </p>
                      </div>
                    </div>

                    <div className="px-2.5 py-1 rounded-full bg-white/15 backdrop-blur-md text-[10px] font-mono font-bold tracking-wider uppercase border border-white/20 text-white">
                      {membership?.tier || 'VIP Member'}
                    </div>
                  </div>

                  {/* Stamp Grid with Intermediate Milestones */}
                  <div className="bg-black/15 backdrop-blur-md rounded-2xl p-4 sm:p-5 border border-white/15 mb-5">
                    <div className="flex items-center justify-between mb-3 text-xs font-semibold">
                      <span className="text-white/80">Digital Stamp Card</span>
                      <span className="bg-white/20 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold text-white">
                        {currentStamps} of {stampsNeeded} collected
                      </span>
                    </div>

                    <div
                      className="grid gap-2.5 sm:gap-3"
                      style={{
                        gridTemplateColumns: `repeat(${stampsNeeded <= 6 ? stampsNeeded : 4}, minmax(0, 1fr))`,
                      }}
                    >
                      {Array.from({ length: stampsNeeded }).map((_, index) => {
                        const slotNum = index + 1;
                        const isStamped = index < currentStamps;
                        const isNext = index === currentStamps;
                        const isRewardSlot = index === stampsNeeded - 1;
                        const matchedOffer = activeOffers.find((o) => (o.stamps_needed || 0) === slotNum);

                        return (
                          <div
                            key={index}
                            onClick={() => {
                              if (matchedOffer) {
                                sound.playClick();
                                setSelectedMilestoneInfo({
                                  offer: matchedOffer,
                                  expiryInfo: getOfferExpiryInfo(matchedOffer),
                                });
                              }
                            }}
                            className={`aspect-square rounded-2xl flex flex-col items-center justify-center relative transition-all duration-300 ${
                              isStamped
                                ? 'bg-white text-slate-950 shadow-lg scale-100 animate-stamp'
                                : isNext
                                ? 'border-2 border-dashed border-white/80 bg-white/15 scale-95 ring-2 ring-white/30'
                                : matchedOffer
                                ? 'border-2 border-dashed border-amber-300/80 bg-amber-400/10 hover:bg-amber-400/20 cursor-pointer active:scale-95'
                                : 'border-2 border-dashed border-white/30 bg-black/10 opacity-60'
                            }`}
                            title={matchedOffer ? `Milestone: ${matchedOffer.title} (Tap to view details)` : undefined}
                          >
                            {renderStampIconSymbol(stampIcon, isStamped, isRewardSlot || Boolean(matchedOffer))}

                            {isStamped ? (
                              <span className="absolute bottom-1 text-[7px] font-mono font-bold tracking-tighter uppercase text-slate-600">
                                STAMPED
                              </span>
                            ) : matchedOffer ? (
                              <span className="absolute bottom-1 text-[7px] font-mono font-bold tracking-tighter uppercase text-amber-300">
                                {matchedOffer.expiry_days ? `GIFT • ${matchedOffer.expiry_days}d` : 'GIFT'}
                              </span>
                            ) : null}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Progress Helper Text */}
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-amber-300 shrink-0" />
                      <span className="font-semibold text-[13px]">
                        {isRewardReady ? (
                          <span className="text-amber-300 font-bold">
                            🎉 {grandRewardTitle} Unlocked & Ready to Claim!
                          </span>
                        ) : (
                          <span>
                            <b>{stampsRemaining} more {stampsRemaining === 1 ? 'stamp' : 'stamps'}</b> to unlock <b>{grandRewardTitle}</b>
                          </span>
                        )}
                      </span>
                    </div>
                  </div>

                  {/* Review us on Google & Instagram / Card Footer */}
                  <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5">
                      <a
                        href={
                          business.google_review_url ||
                          `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                            business.name + ' ' + (business.address || business.area || 'Bengaluru')
                          )}`
                        }
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-white/15 hover:bg-white/25 active:scale-95 text-white text-[11px] font-medium backdrop-blur-md transition-all border border-white/20 shadow-2xs group cursor-pointer"
                        title={`Review ${business.name} on Google`}
                      >
                        <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24">
                          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                        </svg>
                        <span className="font-semibold text-white">Review us on Google</span>
                        <ExternalLink className="w-3 h-3 text-white/70 group-hover:text-white group-hover:translate-x-0.5 transition-transform" />
                      </a>

                      <a
                        href={
                          business.instagram_url ||
                          business.reward_rule?.instagram_url ||
                          `https://instagram.com/${business.slug.replace(/[^a-zA-Z0-9_.]/g, '')}`
                        }
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center w-7 h-7 rounded-xl bg-white/15 hover:bg-white/25 active:scale-95 text-white backdrop-blur-md transition-all border border-white/20 shadow-2xs group cursor-pointer"
                        title={`Follow ${business.name} on Instagram`}
                      >
                        <svg className="w-3.5 h-3.5 fill-current text-white group-hover:scale-110 transition-transform" viewBox="0 0 24 24">
                          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                        </svg>
                      </a>
                    </div>

                    <span className="text-[10px] text-white/70 font-mono shrink-0">
                      Total Visits: {membership?.total_visits ?? 1}
                    </span>
                  </div>
                </div>

                {/* Scan Counter QR Stand Action (Requires Scanning Physical QR Stand) */}
                <button
                  type="button"
                  onClick={() => {
                    sound.playClick();
                    setShowScannerModal(true);
                  }}
                  className="w-full py-3.5 px-4 rounded-2xl bg-[#0F172A] hover:bg-black text-white font-display font-bold text-sm shadow-lg shadow-slate-900/10 flex items-center justify-between gap-3 cursor-pointer transition-all active:scale-98 border border-slate-700/40 group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0 group-hover:scale-105 group-hover:rotate-6 transition-transform">
                      <QrCode className="w-5 h-5 text-emerald-400" />
                    </div>
                    <div className="text-left leading-tight min-w-0">
                      <div className="text-[13px] font-bold truncate">Scan Counter QR Stand</div>
                      <div className="text-[10px] text-slate-300 font-normal font-sans truncate">
                        Scan the stand at checkout with camera to collect stamp
                      </div>
                    </div>
                  </div>
                  <div className="px-3 py-1.5 rounded-full bg-white/15 text-white text-[11px] font-mono font-bold shrink-0 flex items-center gap-1.5 group-hover:bg-white/25 transition-colors">
                    <Camera className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Open Scanner</span>
                  </div>
                </button>

                {/* Cooldown Info Badge (Shown only when 24h QR scan cooldown is active) */}
                {isQrCooldownActive && (
                  <button
                    type="button"
                    onClick={() => {
                      sound.playClick();
                      setCooldownModal({
                        isOpen: true,
                        hoursRemaining: remainingHours,
                        minutesRemaining: remainingMins,
                        lastClaimedAt: membership?.last_qr_stamp_at || undefined,
                      });
                    }}
                    className="w-full p-3 rounded-2xl bg-amber-500/10 border border-amber-500/25 text-amber-900 flex items-center justify-between gap-2.5 text-left cursor-pointer hover:bg-amber-500/15 transition-all shadow-2xs group"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-700 flex items-center justify-center shrink-0">
                        <Clock className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-amber-950 font-display truncate">
                          Daily QR Scan Claimed • 24h Cooldown
                        </div>
                        <p className="text-[10px] text-amber-800 font-sans truncate">
                          Revisiting today? Tap to show pass to cashier
                        </p>
                      </div>
                    </div>
                    <span className="text-[11px] font-mono font-bold text-amber-800 bg-white px-2 py-0.5 rounded-lg border border-amber-200 shrink-0">
                      {remainingHours}h {remainingMins}m
                    </span>
                  </button>
                )}

                {/* Minimum Bill Rule Badge */}
                <div className="bg-slate-100/80 border border-slate-200/80 rounded-2xl py-2 px-3.5 flex items-center justify-between text-xs text-slate-700">
                  <div className="flex items-center gap-2 font-medium">
                    <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>
                      Earn <b>1 Stamp</b> on every order of <b>₹{business.reward_rule?.min_order_for_stamp || business.min_order_for_stamp || 150}+</b>
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400 uppercase font-bold">Counter Rule</span>
                </div>

                {/* Grand Reward Expiry / Stamp Validity Badge */}
                {Boolean(business.reward_rule?.expiry_days && business.reward_rule.expiry_days > 0) && (() => {
                  const grandExp = getOfferExpiryInfo({
                    expiry_days: business.reward_rule?.expiry_days,
                    stamps_needed: stampsNeeded,
                  });
                  return (
                    <div className="bg-amber-50/80 border border-amber-200/80 rounded-2xl py-2 px-3.5 flex items-center justify-between text-xs text-amber-950">
                      <div className="flex items-center gap-2 font-medium">
                        <Clock className="w-4 h-4 text-amber-600 shrink-0" />
                        <span>
                          Grand Reward Expiry: <b>{grandExp.text || `Complete within ${business.reward_rule?.expiry_days} days`}</b>
                        </span>
                      </div>
                      <span className="text-[10px] font-mono text-amber-700 uppercase font-bold shrink-0 ml-2">
                        {grandExp.daysLeft !== null ? `${grandExp.daysLeft}d left` : `${business.reward_rule?.expiry_days}d Limit`}
                      </span>
                    </div>
                  );
                })()}

                {/* Milestone Rewards & Expiry Schedule */}
                {milestoneOffers.length > 0 && (
                  <div className="bg-white rounded-2xl p-4 border border-slate-200/80 card-soft-shadow space-y-3 text-left">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                          <Gift className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="font-display font-bold text-xs text-[#0F172A]">Milestone Rewards &amp; Expiry</h4>
                          <p className="text-[10px] text-slate-500">Collect required stamps before expiry to claim</p>
                        </div>
                      </div>
                      <span className="text-[10px] font-mono font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                        {milestoneOffers.length} {milestoneOffers.length === 1 ? 'Milestone' : 'Milestones'}
                      </span>
                    </div>

                    <div className="divide-y divide-slate-100 pt-0.5">
                      {milestoneOffers.map((offer) => {
                        const isUnlocked = currentStamps >= (offer.stamps_needed || 0);
                        const expInfo = getOfferExpiryInfo(offer);

                        return (
                          <div
                            key={offer.id || offer.title}
                            onClick={() => {
                              sound.playClick();
                              setSelectedMilestoneInfo({
                                offer,
                                expiryInfo: expInfo,
                              });
                            }}
                            className="py-2.5 first:pt-1 last:pb-0 flex items-start justify-between gap-3 cursor-pointer hover:bg-slate-50/70 -mx-1 px-1 rounded-xl transition-colors"
                          >
                            <div className="space-y-1 min-w-0 flex-1">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="font-display font-bold text-xs text-slate-900 truncate">
                                  {offer.title}
                                </span>
                                <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 border border-slate-200">
                                  Stamp #{offer.stamps_needed}
                                </span>
                              </div>

                              <div className="flex items-center gap-1.5 text-[11px] text-slate-500 flex-wrap">
                                <Clock className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                                {expInfo.hasExpiry ? (
                                  <span className={expInfo.isUrgent ? 'text-rose-600 font-semibold' : 'text-slate-600'}>
                                    {expInfo.text}
                                  </span>
                                ) : (
                                  <span className="text-slate-400">No expiry limit • Complete anytime</span>
                                )}
                              </div>
                            </div>

                            <div className="shrink-0 text-right pt-0.5">
                              {isUnlocked ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                  <Check className="w-3 h-3 stroke-[3]" />
                                  <span>UNLOCKED</span>
                                </span>
                              ) : (
                                <span className="text-[10px] font-mono font-semibold text-slate-500 bg-slate-50 px-2 py-0.5 rounded-full border border-slate-200">
                                  {(offer.stamps_needed || 0) - currentStamps} left
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Primary Action Button: Redeem Grand Reward (When full card stamps completed) */}
                {isRewardReady && (
                  <button
                    onClick={() => {
                      const grandExp = getOfferExpiryInfo({
                        expiry_days: business.reward_rule?.expiry_days,
                        stamps_needed: stampsNeeded,
                      });
                      setSelectedRedeemOffer({
                        title: grandRewardTitle,
                        desc: business.reward_rule?.reward_desc || 'Free Grand Loyalty Reward',
                        stampsNeeded: stampsNeeded,
                        expiryText: grandExp.hasExpiry ? grandExp.text : undefined,
                      });
                      setShowRedeemModal(true);
                      sound.playClick();
                    }}
                    className="w-full py-4 rounded-full text-white font-display font-bold text-sm shadow-xl flex items-center justify-center gap-2 cursor-pointer hover:brightness-110 transition-transform active:scale-98 uppercase tracking-wider animate-pulse"
                    style={{ backgroundColor: business.brand_color || '#0F172A' }}
                  >
                    <Gift className="w-5 h-5 animate-bounce text-amber-400" />
                    <span>Redeem {grandRewardTitle} ({stampsNeeded}/{stampsNeeded} Stamps Completed!)</span>
                  </button>
                )}

                {/* Add to Apple / Google Wallet Buttons */}
                <div className="grid grid-cols-2 gap-2 pt-0.5">
                  <button
                    onClick={() => setShowWalletModal('apple')}
                    className="py-2.5 px-3 rounded-xl bg-black text-white text-xs font-semibold flex items-center justify-center gap-1.5 hover:bg-neutral-800 transition-colors shadow-2xs cursor-pointer"
                  >
                    <Wallet className="w-3.5 h-3.5 text-white" />
                    <span>Add to Apple Wallet</span>
                  </button>

                  <button
                    onClick={() => setShowWalletModal('google')}
                    className="py-2.5 px-3 rounded-xl bg-white border border-slate-200 text-[#0F172A] text-xs font-semibold flex items-center justify-center gap-1.5 hover:bg-slate-50 transition-colors shadow-2xs cursor-pointer"
                  >
                    <Award className="w-3.5 h-3.5 text-slate-700" />
                    <span>Google Wallet</span>
                  </button>
                </div>

                {/* Helper Card */}
                <div className="bg-white rounded-2xl p-4 border border-slate-100 card-soft-shadow text-xs text-slate-600 space-y-2 text-left">
                  <div className="flex items-center gap-2 font-display font-bold text-[#0F172A]">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    <span>How Your Pass Works</span>
                  </div>
                  <p>• <b>Scan to Stamp:</b> Scan the QR code at the counter to claim 1 daily stamp instantly.</p>
                  <p>• <b>24-Hour Cooldown:</b> QR scanning allows 1 claim per 24 hours.</p>
                  <p>• <b>Revisiting Within 24h?</b> If you visit again on the same day (e.g. 2–3 hours later), ask the cashier at checkout to punch your repeat stamp directly at the counter.</p>
                  <p>• <b>Milestone Rewards:</b> Collect stamps to unlock free treats and specialty rewards automatically.</p>
                </div>
              </div>
            )}

            {/* ========================================================================= */}
            {/* TAB 2: 🎁 MY REWARDS (To Claim & Claimed History) */}
            {/* ========================================================================= */}
            {activeTab === 'offers' && (
              <div className="space-y-4 animate-stamp text-left">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-display font-bold text-lg text-[#0F172A]">My Rewards</h3>
                    <p className="text-xs text-slate-400">Earn treats and view voucher history for {business.name}</p>
                  </div>
                  <span
                    className="text-[11px] font-mono font-bold text-white px-2.5 py-1 rounded-full shadow-2xs"
                    style={{ backgroundColor: business.brand_color || '#0F172A' }}
                  >
                    {currentStamps} Stamps Collected
                  </span>
                </div>

                {/* Sub Tabs: To Claim vs History */}
                <div className="p-1 rounded-2xl grid grid-cols-2 gap-1 bg-slate-100 border border-slate-200/80">
                  <button
                    type="button"
                    onClick={() => {
                      sound.playClick();
                      setRewardSubTab('to-claim');
                    }}
                    className={`py-2 rounded-xl text-xs font-display font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      rewardSubTab === 'to-claim'
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    <span>To Claim</span>
                    <span
                      className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                        unlockedRewardsList.length > 0
                          ? 'bg-emerald-500 text-white font-bold'
                          : 'bg-slate-200 text-slate-700'
                      }`}
                    >
                      {unlockedRewardsList.length}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      sound.playClick();
                      setRewardSubTab('history');
                    }}
                    className={`py-2 rounded-xl text-xs font-display font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      rewardSubTab === 'history'
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    <span>History</span>
                    <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-200 text-slate-700">
                      {claimedRewards.length}
                    </span>
                  </button>
                </div>

                {/* SUB-TAB 1: TO CLAIM */}
                {rewardSubTab === 'to-claim' && (
                  <div className="space-y-3">
                    {unlockedRewardsList.length === 0 ? (
                      <div className="bg-white rounded-3xl p-8 text-center space-y-3 border border-slate-200/80 card-soft-shadow">
                        <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
                          <Gift className="w-7 h-7" />
                        </div>
                        <div className="space-y-1">
                          <h3 className="font-display font-bold text-base text-[#0F172A]">No Rewards Ready Yet</h3>
                          <p className="text-xs text-slate-500 max-w-[250px] mx-auto leading-relaxed">
                            Collect {Math.max(1, stampsNeeded - currentStamps)} more {stampsNeeded - currentStamps === 1 ? 'stamp' : 'stamps'} to unlock your {grandRewardTitle} at {business.name}.
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            sound.playClick();
                            setActiveTab('card');
                          }}
                          className="px-4 py-2 rounded-full text-white font-display font-bold text-xs shadow-xs cursor-pointer"
                          style={{ backgroundColor: business.brand_color || '#0F172A' }}
                        >
                          Earn Stamps on Pass
                        </button>
                      </div>
                    ) : (
                      unlockedRewardsList.map((reward: { id: string; businessName: string; businessSlug: string; brandColor: string; rewardTitle: string; stamps: number; totalNeeded: number; expiryDays?: number; expiryDateText?: string }) => (
                        <div
                          key={reward.id}
                          className="bg-white rounded-3xl p-4 border border-slate-200/90 relative overflow-hidden transition-all shadow-sm space-y-3"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="space-y-1 flex-1">
                              <div className="flex items-center gap-1.5">
                                <span
                                  className="w-2 h-2 rounded-full"
                                  style={{ backgroundColor: reward.brandColor }}
                                />
                                <span className="text-[10px] font-mono uppercase font-bold text-slate-500">
                                  {reward.businessName}
                                </span>
                              </div>
                              <h3 className="font-display font-bold text-base text-[#0F172A] leading-snug">
                                {reward.rewardTitle}
                              </h3>
                              <div className="text-[11px] text-emerald-600 font-medium flex items-center gap-1">
                                <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                                <span>
                                  Unlocked with {reward.stamps} / {reward.totalNeeded} stamps
                                </span>
                              </div>
                              {reward.expiryDateText && (
                                <div className="text-[11px] text-amber-800 font-medium flex items-center gap-1.5 pt-0.5">
                                  <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                                  <span>{reward.expiryDateText}</span>
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                            <span className="text-[10px] text-slate-400">Show to merchant at counter</span>
                            <button
                              type="button"
                              onClick={() => {
                                sound.playClick();
                                setSelectedRedeemOffer({
                                  title: reward.rewardTitle,
                                  desc: `Unlocked with ${reward.stamps} stamps on your pass`,
                                  stampsNeeded: reward.totalNeeded,
                                  expiryText: reward.expiryDateText,
                                });
                                setShowRedeemModal(true);
                              }}
                              className="px-4 py-2 rounded-xl text-white font-display font-bold text-xs shadow-md transition-all active:scale-95 cursor-pointer"
                              style={{ backgroundColor: business.brand_color || '#0F172A' }}
                            >
                              Claim Reward
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {/* SUB-TAB 2: HISTORY */}
                {rewardSubTab === 'history' && (
                  <div className="space-y-2.5">
                    {claimedRewards.length === 0 ? (
                      <div className="bg-white rounded-3xl p-8 text-center space-y-2 border border-slate-200/80 card-soft-shadow">
                        <Clock className="w-8 h-8 text-slate-400 mx-auto" />
                        <div className="font-display font-bold text-sm text-slate-800">No Reward History Yet</div>
                        <p className="text-xs text-slate-500">Your claimed vouchers and treats will appear here.</p>
                      </div>
                    ) : (
                      claimedRewards.map((hist) => (
                        <div
                          key={hist.id}
                          className="bg-white rounded-2xl p-3.5 border border-slate-200/80 shadow-2xs flex items-center justify-between"
                        >
                          <div className="space-y-0.5">
                            <div className="text-[10px] font-mono text-slate-400">{hist.businessName || business.name}</div>
                            <h4 className="font-display font-bold text-xs text-slate-900">{hist.rewardTitle}</h4>
                            <div className="text-[10px] text-slate-400 flex items-center gap-1 font-mono">
                              <span>Code: {hist.voucherCode}</span>
                              <span>•</span>
                              <span>{hist.claimedAt}</span>
                            </div>
                          </div>
                          <span className="text-[10px] font-mono font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
                            REDEEMED
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            )}

            {/* ========================================================================= */}
            {/* TAB 3: 🕒 MY VISITS & HISTORY */}
            {/* ========================================================================= */}
            {activeTab === 'visits' && (
              <div className="space-y-4 animate-stamp text-left">
                <div className="space-y-1">
                  <h3 className="font-display font-bold text-lg text-[#0F172A]">Your Visit History</h3>
                  <p className="text-xs text-slate-500">Timeline of visits and rewards earned at {business.name}</p>
                </div>

                {/* Summary Stat Grid */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-white rounded-2xl p-4 border border-slate-100 card-soft-shadow text-center">
                    <div className="text-[10px] font-mono font-bold uppercase text-slate-400">Total Visits</div>
                    <div className="font-display font-black text-2xl text-[#0F172A] mt-1">
                      {membership?.total_visits ?? 1}
                    </div>
                  </div>
                  <div className="bg-white rounded-2xl p-4 border border-slate-100 card-soft-shadow text-center">
                    <div className="text-[10px] font-mono font-bold uppercase text-slate-400">Current Stamps</div>
                    <div className="font-display font-black text-2xl text-emerald-600 mt-1">
                      {currentStamps} / {stampsNeeded}
                    </div>
                  </div>
                </div>

                {/* Activity List */}
                <div className="bg-white rounded-2xl border border-slate-100 card-soft-shadow divide-y divide-slate-100 overflow-hidden">
                  <div className="p-3.5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold text-xs">
                        +1
                      </div>
                      <div>
                        <div className="font-display font-bold text-xs text-[#0F172A]">Counter Visit & Stamp</div>
                        <div className="text-[10px] text-slate-400 font-mono">Today • Verified Stamp</div>
                      </div>
                    </div>
                    <span className="text-[11px] font-mono font-bold text-emerald-600">+1 Stamp</span>
                  </div>

                  <div className="p-3.5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-700 flex items-center justify-center font-bold text-xs">
                        📱
                      </div>
                      <div>
                        <div className="font-display font-bold text-xs text-[#0F172A]">Pass Connected</div>
                        <div className="text-[10px] text-slate-400 font-mono">Mobile Pass Activated</div>
                      </div>
                    </div>
                    <span className="text-[11px] font-mono text-slate-400">Active</span>
                  </div>
                </div>
              </div>
            )}

            {/* ========================================================================= */}
            {/* TAB 4: 📍 STORE DETAILS */}
            {/* ========================================================================= */}
            {activeTab === 'details' && (
              <div className="space-y-4 animate-stamp text-left">
                <div className="space-y-1">
                  <h3 className="font-display font-bold text-lg text-[#0F172A]">Store Details</h3>
                  <p className="text-xs text-slate-500">Location, reviews, and contact details for {business.name}</p>
                </div>

                {/* Details Card */}
                {(() => {
                  const fullAddress = business.address || (business.area ? `${business.area}, ${business.city || 'Bengaluru'}` : 'Indiranagar, Bengaluru');
                  const storePhone = business.phone || business.reward_rule?.phone || '+91 98765 43210';
                  const cleanPhone = storePhone.replace(/\D/g, '');
                  const waNumber = cleanPhone.startsWith('91') ? cleanPhone : cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
                  const waUrl = `https://wa.me/${waNumber}?text=${encodeURIComponent(`Hi ${business.name}, I'm a Reva loyalty pass member!`)}`;
                  const googleReview = business.google_review_url || business.reward_rule?.google_review_url || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(business.name + ' ' + fullAddress)}`;
                  const instagramUrl = business.instagram_url || business.reward_rule?.instagram_url || `https://instagram.com/${business.slug.replace(/[^a-zA-Z0-9]/g, '')}`;
                  const mapsUrl = business.maps_url || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(business.name + ' ' + fullAddress)}`;
                  const storeBio = business.theme_config?.description || business.reward_rule?.description || business.reward_rule?.reward_desc || 'Specialty artisanal treats, handcrafted beverages, and loyalty rewards on every single visit.';

                  return (
                    <div className="bg-white rounded-3xl p-5 border border-slate-100 card-soft-shadow space-y-4">
                      {/* Header */}
                      <div className="flex items-center gap-3.5 pb-2 border-b border-slate-100">
                        <div className="w-13 h-13 rounded-2xl overflow-hidden bg-slate-100 shrink-0 border border-slate-200 shadow-2xs">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={business.logo_url || 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=300&auto=format&fit=crop&q=80'}
                            alt={business.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-mono uppercase font-bold text-amber-500">
                              {business.category || 'Café & Beverage'}
                            </span>
                            <span className="text-[10px] font-mono font-bold uppercase text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                              Open Today
                            </span>
                          </div>
                          <h2 className="font-display font-bold text-base text-[#0F172A] truncate">
                            {business.name}
                          </h2>
                          <p className="text-xs text-slate-500">
                            {currentStamps} / {stampsNeeded} Stamps Collected
                          </p>
                        </div>
                      </div>

                      {/* About */}
                      <div className="space-y-1">
                        <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">
                          About {business.name}
                        </div>
                        <p className="text-xs text-slate-600 leading-relaxed">
                          {storeBio}
                        </p>
                      </div>

                      {/* Address */}
                      <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
                        <div className="flex items-start gap-2.5">
                          <MapPin className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                          <div className="min-w-0 flex-1">
                            <div className="text-xs font-bold text-slate-900 truncate">
                              Address &amp; Location
                            </div>
                            <p className="text-[11px] text-slate-500 leading-snug pt-0.5">
                              {fullAddress}
                            </p>
                          </div>
                        </div>

                        <div className="pt-0.5">
                          <a
                            href={mapsUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-full py-2.5 px-3 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer"
                          >
                            <Navigation className="w-3.5 h-3.5 text-emerald-400" />
                            <span>Open in Google Maps / Directions</span>
                            <ExternalLink className="w-3 h-3 text-slate-400" />
                          </a>
                        </div>
                      </div>

                      {/* Quick Links Grid */}
                      <div className="grid grid-cols-3 gap-2 pt-0.5">
                        <a
                          href={googleReview}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-3 rounded-2xl border border-slate-200 bg-slate-50 hover:bg-slate-100 transition-all flex flex-col items-center justify-center text-center gap-1 group cursor-pointer shadow-2xs active:scale-95"
                          title="Review on Google"
                        >
                          <div className="w-8 h-8 rounded-xl bg-white shadow-2xs flex items-center justify-center">
                            <svg className="w-4 h-4" viewBox="0 0 24 24">
                              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                            </svg>
                          </div>
                          <span className="text-[11px] font-display font-bold text-slate-800">Google Review</span>
                          <span className="text-[9px] font-mono text-amber-500 font-semibold">⭐ 5.0 Rating</span>
                        </a>

                        <a
                          href={instagramUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-3 rounded-2xl border border-slate-200 bg-slate-50 hover:bg-slate-100 transition-all flex flex-col items-center justify-center text-center gap-1 group cursor-pointer shadow-2xs active:scale-95"
                          title="Follow on Instagram"
                        >
                          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 text-white shadow-2xs flex items-center justify-center">
                            <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                            </svg>
                          </div>
                          <span className="text-[11px] font-display font-bold text-slate-800">Instagram</span>
                          <span className="text-[9px] font-mono text-slate-500">@{business.slug.slice(0, 10)}</span>
                        </a>

                        <a
                          href={waUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-3 rounded-2xl border border-slate-200 bg-slate-50 hover:bg-slate-100 transition-all flex flex-col items-center justify-center text-center gap-1 group cursor-pointer shadow-2xs active:scale-95"
                          title="Chat on WhatsApp"
                        >
                          <div className="w-8 h-8 rounded-xl bg-emerald-500 text-white shadow-2xs flex items-center justify-center">
                            <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                              <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
                            </svg>
                          </div>
                          <span className="text-[11px] font-display font-bold text-slate-800">WhatsApp</span>
                          <span className="text-[9px] font-mono text-emerald-600 font-semibold">Chat / Call</span>
                        </a>
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}
          </>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 3. BALANCED 5-ITEM MOBILE NAVIGATION BAR: [HOME] [REWARDS] [SCAN QR] [DETAILS] [PROFILE] */}
      {/* ========================================================================= */}
      {isRegistered && (
        <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-t border-slate-200/80 h-16 px-2 sm:px-3 shadow-[0_-4px_20px_rgba(0,0,0,0.06)]">
          <div className="max-w-md mx-auto h-full flex items-center justify-between relative">
            {/* 1. Stamp Pass (Home) */}
            <button
              onClick={() => {
                sound.playClick();
                setActiveTab('card');
              }}
              className="flex-1 flex flex-col items-center justify-center gap-1 cursor-pointer transition-colors"
              style={{ color: activeTab === 'card' ? (business.brand_color || '#0F172A') : '#94A3B8' }}
            >
              <Home className={`w-5 h-5 ${activeTab === 'card' ? 'stroke-[2.5]' : ''}`} />
              <span className={`text-[10px] font-display ${activeTab === 'card' ? 'font-bold' : 'font-medium'}`}>Home</span>
            </button>

            {/* 2. Rewards Tab */}
            <button
              onClick={() => {
                sound.playClick();
                setActiveTab('offers');
              }}
              className="flex-1 flex flex-col items-center justify-center gap-1 cursor-pointer transition-colors relative"
              style={{ color: activeTab === 'offers' ? (business.brand_color || '#0F172A') : '#94A3B8' }}
            >
              <Gift className={`w-5 h-5 ${activeTab === 'offers' ? 'stroke-[2.5]' : ''}`} />
              <span className={`text-[10px] font-display ${activeTab === 'offers' ? 'font-bold' : 'font-medium'}`}>Rewards</span>
            </button>

            {/* 3. Center Floating Scan QR / Camera Button */}
            <div className="flex-1 flex justify-center -mt-6">
              <button
                onClick={() => {
                  sound.playClick();
                  setShowScannerModal(true);
                }}
                className="w-13 h-13 rounded-full text-white flex items-center justify-center shadow-[0_8px_25px_rgba(15,23,42,0.4)] border-4 border-white hover:scale-105 active:scale-95 transition-all cursor-pointer group"
                style={{ backgroundColor: business.brand_color || '#0F172A' }}
                title="Scan QR Code / Camera"
              >
                <QrCode className="w-6 h-6 group-hover:rotate-12 transition-transform" />
              </button>
            </div>

            {/* 4. Details Tab (Right next to QR and Profile) */}
            <button
              onClick={() => {
                sound.playClick();
                setActiveTab('details');
              }}
              className="flex-1 flex flex-col items-center justify-center gap-1 cursor-pointer transition-colors"
              style={{ color: activeTab === 'details' ? (business.brand_color || '#0F172A') : '#94A3B8' }}
            >
              <Info className={`w-5 h-5 ${activeTab === 'details' ? 'stroke-[2.5]' : ''}`} />
              <span className={`text-[10px] font-display ${activeTab === 'details' ? 'font-bold' : 'font-medium'}`}>Details</span>
            </button>

            {/* 5. Customer Profile & Settings */}
            <Link
              href="/c?tab=profile"
              className="flex-1 flex flex-col items-center justify-center gap-1 cursor-pointer transition-colors text-slate-400 hover:text-slate-700"
            >
              <User className="w-5 h-5" />
              <span className="text-[10px] font-display font-medium">Profile</span>
            </Link>
          </div>
        </nav>
      )}

      {/* ========================================================================= */}
      {/* LIVE CAMERA QR SCANNER & AUTO-STORE RECOGNITION MODAL */}
      {/* ========================================================================= */}
      <CameraQrScannerModal
        isOpen={showScannerModal}
        onClose={() => setShowScannerModal(false)}
        currentSlug={slug}
        customerPhone={customer?.phone || phoneInput}
        customerName={customer?.name || nameInput}
        onStampClaimed={(res) => {
          if (res.cooldownActive) {
            setCooldownModal({
              isOpen: true,
              hoursRemaining: res.hoursRemaining ?? remainingHours,
              minutesRemaining: res.minutesRemaining ?? remainingMins,
              lastClaimedAt: membership?.last_qr_stamp_at || undefined,
            });
          } else if (res.success && res.membership) {
            sound.playStampPop();
            setStampAnimating(true);
            setTimeout(() => setStampAnimating(false), 500);
            setMembership(res.membership);
            setIsRegistered(true);

            const needed = business?.reward_rule?.stamps_needed || 6;
            const isRewardNow = (res.membership.stamps || 0) >= needed;

            setQrClaimSuccessModal({
              isOpen: true,
              stamps: res.membership.stamps,
              stampsNeeded: needed,
              rewardUnlocked: isRewardNow,
            });

            if (isRewardNow) {
              sound.playRewardFanfare();
              confetti({
                particleCount: 120,
                spread: 80,
                origin: { y: 0.6 },
                colors: ['#0F172A', '#F59E0B', '#10B981', '#3B82F6'],
              });
            }
          } else if (res.success && customer?.phone) {
            // Soft background sync without full page reload
            fetch('/api/customer/session', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ businessSlug: slug, phone: customer.phone }),
            })
              .then((r) => r.json())
              .then((data) => {
                if (data.success && data.membership) {
                  setMembership(data.membership);
                }
              })
              .catch(() => {});
          }
        }}
      />

      {/* ========================================================================= */}
      {/* 24-HOUR COOLDOWN POPUP MODAL (CUSTOMER QR CLAIM LIMIT & CASHIER REVISIT) */}
      {/* ========================================================================= */}
      {cooldownModal?.isOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white text-slate-900 rounded-3xl max-w-sm w-full p-6 space-y-4 shadow-2xl relative border border-slate-100 text-center animate-stamp">
            <button
              onClick={() => setCooldownModal(null)}
              className="absolute right-4 top-4 w-8 h-8 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center hover:bg-slate-200 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="w-16 h-16 rounded-2xl bg-amber-50 border-2 border-amber-200 flex items-center justify-center mx-auto text-amber-600 shadow-inner">
              <Clock className="w-8 h-8" />
            </div>

            <div className="space-y-1">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-700 bg-amber-100 px-2.5 py-0.5 rounded-full">
                24-Hour Cooldown Active
              </span>
              <h3 className="text-lg font-display font-bold text-[#0F172A] mt-1">
                Daily QR Stamp Limit
              </h3>
            </div>

            {/* Exact notice message specified by user */}
            <div className="bg-amber-50/90 border border-amber-200 rounded-2xl p-4 text-left space-y-2">
              <div className="flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div className="space-y-1 text-xs">
                  <p className="font-bold text-amber-950 leading-snug">
                    You can claim a stamp from this method after 24 hours.
                  </p>
                  <p className="text-amber-900 leading-snug font-medium">
                    If you are revisiting within 24 hours, then ask cashier for the stamp card.
                  </p>
                </div>
              </div>
            </div>

            {/* Countdown timer badge */}
            <div className="bg-slate-50 rounded-2xl p-3 border border-slate-200/80 flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5 text-slate-500">
                <Timer className="w-3.5 h-3.5 text-amber-500" />
                <span>Next QR stamp ready in:</span>
              </div>
              <span className="font-mono font-bold text-sm text-[#0F172A] bg-white px-2.5 py-0.5 rounded-lg border border-slate-200 shadow-2xs">
                {cooldownModal.hoursRemaining}h {cooldownModal.minutesRemaining}m
              </span>
            </div>

            {/* Cashier Pass Details (to easily show cashier when revisiting) */}
            <div className="bg-slate-900 text-white rounded-2xl p-3.5 text-left space-y-1.5 shadow-sm">
              <div className="flex items-center justify-between text-[10px] font-mono uppercase text-amber-400 font-bold">
                <span>Show to Cashier at Counter</span>
                <span>{business.name}</span>
              </div>
              <div className="flex items-center justify-between pt-1 border-t border-white/10 text-xs">
                <div>
                  <div className="text-[10px] text-slate-400">Guest Name</div>
                  <div className="font-bold text-white truncate max-w-[120px]">{customer?.name || 'Valued Guest'}</div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] text-slate-400">Registered Phone / ID</div>
                  <div className="font-mono font-bold text-amber-300">
                    {customer?.phone || (membership?.id ? membership.id.slice(0, 10).toUpperCase() : 'PASS-REVA')}
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-1">
              <button
                onClick={() => setCooldownModal(null)}
                className="w-full py-3 rounded-full text-white text-xs font-bold hover:brightness-110 shadow-md cursor-pointer uppercase tracking-wider transition-all"
                style={{ backgroundColor: business.brand_color || '#0F172A' }}
              >
                Understood / Show Cashier
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* QR STAMP CLAIM SUCCESS POPUP */}
      {/* ========================================================================= */}
      {qrClaimSuccessModal?.isOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white text-slate-900 rounded-3xl max-w-sm w-full p-6 space-y-4 shadow-2xl relative border border-slate-100 text-center animate-stamp">
            <button
              onClick={() => setQrClaimSuccessModal(null)}
              className="absolute right-4 top-4 w-8 h-8 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center hover:bg-slate-200 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="w-16 h-16 rounded-2xl bg-emerald-50 border-2 border-emerald-200 flex items-center justify-center mx-auto text-emerald-600 shadow-inner">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div className="space-y-1">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full">
                Stamp Collected! 🎉
              </span>
              <h3 className="text-lg font-display font-bold text-[#0F172A] mt-1">
                +1 Stamp Added to Pass
              </h3>
              <p className="text-xs text-slate-500">
                You now have <b className="text-emerald-700">{qrClaimSuccessModal.stamps} of {qrClaimSuccessModal.stampsNeeded}</b> stamps collected at {business.name}.
              </p>
            </div>

            <div className="bg-slate-50 rounded-2xl p-3.5 border border-slate-200 text-left text-xs text-slate-600 space-y-1">
              <div className="flex items-center gap-1.5 font-semibold text-slate-800">
                <Clock className="w-3.5 h-3.5 text-slate-500" />
                <span>Next QR stamp claim available in 24 hours.</span>
              </div>
              <p className="text-[11px] text-slate-500">
                Revisiting again later today? Show your pass at the counter and the cashier will punch your repeat stamp directly.
              </p>
            </div>

            <button
              onClick={() => setQrClaimSuccessModal(null)}
              className="w-full py-3 rounded-full text-white text-xs font-bold hover:brightness-110 shadow-md cursor-pointer uppercase tracking-wider transition-all"
              style={{ backgroundColor: business.brand_color || '#0F172A' }}
            >
              Awesome!
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. REDEEM REWARD MODAL */}
      {/* ========================================================================= */}
      {showRedeemModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl text-center space-y-4 animate-stamp">
            <div
              className="w-16 h-16 rounded-2xl text-amber-400 flex items-center justify-center mx-auto shadow-md"
              style={{ backgroundColor: business.brand_color || '#0F172A' }}
            >
              <Gift className="w-8 h-8" />
            </div>

            <h3 className="text-lg font-display font-bold text-[#0F172A]">Redeem Your Free Reward</h3>
            <p className="text-xs text-slate-500">
              Please show this screen to the counter staff before confirming.
            </p>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-left">
              <div className="text-[10px] font-bold text-slate-400 uppercase font-mono">Unlocked Treat:</div>
              <div className="text-sm font-bold text-[#0F172A] mt-0.5">
                {selectedRedeemOffer?.title || business.reward_rule?.reward_title || grandRewardTitle}
              </div>
              <div className="text-xs text-slate-500 mt-1">
                {selectedRedeemOffer?.desc || business.reward_rule?.reward_desc || 'Free unlocked reward treat'}
              </div>
              {Boolean(selectedRedeemOffer?.expiryText || (business.reward_rule?.expiry_days && business.reward_rule.expiry_days > 0)) && (
                <div className="text-[11px] font-mono text-amber-800 bg-amber-50/80 px-2.5 py-1.5 rounded-xl border border-amber-200/60 mt-2 flex items-center justify-between">
                  <span>Validity / Expiry:</span>
                  <span className="font-bold text-right ml-2">{selectedRedeemOffer?.expiryText || `${business.reward_rule?.expiry_days} Days`}</span>
                </div>
              )}
            </div>

            <div className="flex gap-2 pt-1">
              <button
                onClick={() => {
                  setShowRedeemModal(false);
                  setSelectedRedeemOffer(null);
                }}
                className="flex-1 py-3 rounded-full border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleRedeemReward}
                className="flex-1 py-3 rounded-full text-white text-xs font-bold hover:brightness-110 shadow-md cursor-pointer uppercase tracking-wider"
                style={{ backgroundColor: business.brand_color || '#0F172A' }}
              >
                Staff Confirmed
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. WALLET PASS PREVIEW MODAL */}
      {/* ========================================================================= */}
      {showWalletModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl text-center space-y-4">
            <div
              className="w-12 h-12 rounded-2xl text-white flex items-center justify-center mx-auto shadow-sm"
              style={{ backgroundColor: business.brand_color || '#0F172A' }}
            >
              <Wallet className="w-6 h-6" />
            </div>

            <h3 className="text-base font-display font-bold text-[#0F172A]">
              {showWalletModal === 'apple' ? 'Apple Wallet (.pkpass)' : 'Google Wallet API'} Pass Ready
            </h3>
            <p className="text-xs text-slate-500">
              Your digital card is pinned to this phone. You can also save it into your native wallet app.
            </p>

            <div className="p-3 bg-slate-50 rounded-xl text-left font-mono text-[11px] text-slate-600 space-y-1">
              <div>• Store: {business.name}</div>
              <div>• Stamps: {currentStamps}/{stampsNeeded}</div>
              <div>• Status: Active VIP Member</div>
            </div>

            <button
              onClick={() => {
                setShowWalletModal(null);
                alert(`Pass payload generated successfully for ${showWalletModal === 'apple' ? 'Apple Wallet' : 'Google Wallet'}!`);
              }}
              className="w-full py-3 rounded-full bg-[#0F172A] text-white text-xs font-semibold hover:bg-black cursor-pointer uppercase tracking-wider"
            >
              Done
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 6. MILESTONE REWARD PREVIEW MODAL */}
      {/* ========================================================================= */}
      {selectedMilestoneInfo && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl text-center space-y-4 animate-stamp">
            <div
              className="w-16 h-16 rounded-2xl text-amber-400 flex items-center justify-center mx-auto shadow-md"
              style={{ backgroundColor: business.brand_color || '#0F172A' }}
            >
              <Gift className="w-8 h-8" />
            </div>

            <div>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-amber-100 text-amber-900 border border-amber-300">
                Milestone • Stamp #{selectedMilestoneInfo.offer.stamps_needed}
              </span>
              <h3 className="text-lg font-display font-bold text-[#0F172A] mt-2">
                {selectedMilestoneInfo.offer.title}
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                {selectedMilestoneInfo.offer.desc || `Unlocked when you reach ${selectedMilestoneInfo.offer.stamps_needed} stamps on your pass.`}
              </p>
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-left space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Stamps Required:</span>
                <span className="font-mono font-bold text-slate-900">{selectedMilestoneInfo.offer.stamps_needed} Stamps</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Your Current Stamps:</span>
                <span className="font-mono font-bold text-emerald-600">
                  {currentStamps} / {selectedMilestoneInfo.offer.stamps_needed} Stamps
                </span>
              </div>
              <div className="pt-2 border-t border-slate-200/80 flex items-start justify-between gap-2">
                <span className="text-slate-500 flex items-center gap-1 shrink-0">
                  <Clock className="w-3.5 h-3.5 text-amber-600" />
                  <span>Reward Expiry:</span>
                </span>
                <span className="font-mono font-bold text-amber-900 text-right">
                  {selectedMilestoneInfo.expiryInfo.hasExpiry
                    ? selectedMilestoneInfo.expiryInfo.text
                    : 'No expiry limit'}
                </span>
              </div>
            </div>

            <button
              onClick={() => setSelectedMilestoneInfo(null)}
              className="w-full py-3 rounded-full text-white text-xs font-bold hover:brightness-110 shadow-md cursor-pointer uppercase tracking-wider transition-all"
              style={{ backgroundColor: business.brand_color || '#0F172A' }}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </main>
  );
}

export default function CustomerWalletCardPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-white">
          <div className="w-8 h-8 flex items-center justify-center text-[#0F172A] animate-spin mb-3">
            <svg viewBox="0 0 24 24" className="w-8 h-8 fill-none stroke-current stroke-[2.2]">
              <path d="M12 2v20M2 12h20M4.93 4.93l14.14 14.14M4.93 19.07L19.07 4.93" />
            </svg>
          </div>
          <p className="text-xs font-mono font-bold uppercase tracking-widest text-slate-400">Loading Loyalty Pass...</p>
        </div>
      }
    >
      <CustomerWalletCardContent />
    </Suspense>
  );
}

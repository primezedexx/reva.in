'use client';

// ============================================================================
// REVA (reva.in) — Clean & Modern Restaurant Settings Section
// Pixel-Perfect Clean Aesthetics matching modern design standards
// ============================================================================

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import confetti from 'canvas-confetti';
import {
  Store,
  Phone,
  Mail,
  MapPin,
  Palette,
  Bell,
  Gift,
  Sparkles,
  CreditCard,
  QrCode,
  User,
  Edit3,
  Check,
  CheckCircle2,
  ExternalLink,
  RefreshCw,
  X,
  UploadCloud,
  Camera,
  Star,
  Zap,
  Printer,
  LogOut,
  Copy,
  CheckCheck,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';
import { Business, ThemeConfig } from '@/types/database';
import { THEME_PRESETS, STAMP_ICONS } from '@/lib/theme-presets';
import { sound } from '@/lib/sound';
import { compressImageFile } from '@/lib/image-compress';
import PrivacySecurityModal from '@/components/PrivacySecurityModal';
import CounterQrStandModal from '@/components/CounterQrStandModal';

const InstagramIcon = ({ className = 'w-4 h-4' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
  </svg>
);

const PRESET_STOREFRONT_PHOTOS = [
  { label: 'Artisan Cafe', url: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=400&auto=format&fit=crop&q=80' },
  { label: 'Modern Bistro', url: 'https://images.unsplash.com/photo-1559925393-8be0ec4767c8?w=400&auto=format&fit=crop&q=80' },
  { label: 'Matcha & Tea Bar', url: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=400&auto=format&fit=crop&q=80' },
  { label: 'Bakery & Bread', url: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400&auto=format&fit=crop&q=80' },
  { label: 'Espresso Bar', url: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=400&auto=format&fit=crop&q=80' },
  { label: 'Salon & Spa', url: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=400&auto=format&fit=crop&q=80' },
];

interface SettingsSectionProps {
  business: Business | null;
  authUser: { email?: string; id?: string } | null;
  subInfo: {
    planName: string;
    isTrial: boolean;
    badgeText: string;
    fullStatusText: string;
    daysRemaining: number;
    formattedDate: string;
  } | null;
  onRefresh: () => Promise<void>;
  onOpenCustomization: () => void;
  onOpenPlanModal: () => void;
  onSignOut: () => void;
  onNavigateTab: (tab: 'overview' | 'counter' | 'rewards' | 'qr-stand' | 'crm' | 'settings') => void;
}

export default function SettingsSection({
  business,
  authUser,
  subInfo,
  onRefresh,
  onOpenCustomization,
  onOpenPlanModal,
  onSignOut,
  onNavigateTab,
}: SettingsSectionProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  // General Fields
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Specialty Cafe & Bakery');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [area, setArea] = useState('');
  const [city, setCity] = useState('');
  const [googleReviewUrl, setGoogleReviewUrl] = useState('');
  const [instagramUrl, setInstagramUrl] = useState('');
  const [mapsUrl, setMapsUrl] = useState('');

  // Hero Banner Fields
  const [tagline, setTagline] = useState('Bihari Sab Pe Bhari');
  const [description, setDescription] = useState('This is a restaurant where pure ingredients meet artisan craft.');
  const [badge1, setBadge1] = useState('10% Vegetarian Options');
  const [badge2, setBadge2] = useState('Organic Ingredients');
  const [logoUrl, setLogoUrl] = useState('');

  // Loyalty Fields
  const [stampsNeeded, setStampsNeeded] = useState(6);
  const [rewardTitle, setRewardTitle] = useState('Free Specialty Beverage');
  const [minOrder, setMinOrder] = useState(150);
  const [avgSpend, setAvgSpend] = useState(250);
  const [offerText, setOfferText] = useState('Complimentary Belgian Waffle with any drink');

  // Notification Toggles
  const [orderAlerts, setOrderAlerts] = useState(true);
  const [scanAlerts, setScanAlerts] = useState(true);
  const [soundEffects, setSoundEffects] = useState(true);
  const [dailySummary, setDailySummary] = useState(true);
  const [winbackAlerts, setWinbackAlerts] = useState(true);

  // Modals & Feedback
  const [showGeneralModal, setShowGeneralModal] = useState(false);
  const [showHeroModal, setShowHeroModal] = useState(false);
  const [showLoyaltyModal, setShowLoyaltyModal] = useState(false);
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [showQrStandModal, setShowQrStandModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccessToast, setSaveSuccessToast] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Sync state when business prop changes
  useEffect(() => {
    if (business) {
      setName(business.name || '');
      setCategory(business.category || (business.reward_rule as any)?.category || 'Specialty Cafe & Bakery');
      setPhone(business.phone || (business.reward_rule as any)?.phone || '');
      setAddress(business.address || (business.reward_rule as any)?.address || '');
      setArea(business.area || (business.reward_rule as any)?.area || '');
      setCity(business.city || (business.reward_rule as any)?.city || '');
      setGoogleReviewUrl(business.google_review_url || (business.reward_rule as any)?.google_review_url || '');
      setInstagramUrl(business.instagram_url || (business.reward_rule as any)?.instagram_url || '');
      setMapsUrl(business.maps_url || (business.reward_rule as any)?.maps_url || '');
      setLogoUrl(business.logo_url || '');

      const theme = business.theme_config || business.reward_rule?.theme_config;
      setTagline(theme?.custom_tagline || 'Bihari Sab Pe Bhari');
      setDescription(theme?.description || business.reward_rule?.reward_desc || 'This is a restaurant where pure ingredients meet artisan craft.');
      setBadge1(theme?.badge_1 || theme?.welcome_badge || '10% Vegetarian Options');
      setBadge2(theme?.badge_2 || 'Organic Ingredients');

      setStampsNeeded(business.reward_rule?.stamps_needed || 6);
      setRewardTitle(business.reward_rule?.reward_title || 'Free Specialty Beverage');
      setMinOrder(business.reward_rule?.min_order_for_stamp || business.min_order_for_stamp || 150);
      setAvgSpend(business.avg_spend_per_visit || 250);
      setOfferText(business.winback_offer_text || '');

      setOrderAlerts(theme?.order_alerts_enabled ?? true);
      setScanAlerts(theme?.menu_scan_alerts_enabled ?? true);
      setSoundEffects(theme?.sound_enabled ?? true);
      setDailySummary(theme?.daily_summary_enabled ?? true);
      setWinbackAlerts(theme?.auto_winback_enabled ?? true);
    }
  }, [business]);

  // Image upload handler
  async function handleImageSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const dataUrl = await compressImageFile(file, 800, 0.85);
      setLogoUrl(dataUrl);
      sound.playStampPop();
    } catch {
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result as string;
        setLogoUrl(dataUrl);
        sound.playStampPop();
      };
      reader.readAsDataURL(file);
    }
  }

  // Save General Information
  async function handleSaveGeneral(e: React.FormEvent) {
    e.preventDefault();
    if (!business) return;
    try {
      setIsSaving(true);
      sound.playClick();
      const res = await fetch(`/api/businesses/${business.slug}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim() || business.name,
          category: category.trim() || 'Specialty Cafe & Bakery',
          phone: phone.trim(),
          address: address.trim(),
          area: area.trim(),
          city: city.trim(),
          google_review_url: googleReviewUrl.trim(),
          instagram_url: instagramUrl.trim(),
          maps_url: mapsUrl.trim(),
          reward_rule: {
            ...business.reward_rule,
            category: category.trim(),
            phone: phone.trim(),
            address: address.trim(),
            area: area.trim(),
            city: city.trim(),
            google_review_url: googleReviewUrl.trim(),
            instagram_url: instagramUrl.trim(),
            maps_url: mapsUrl.trim(),
          },
        }),
      });
      const data = await res.json();
      if (data.success) {
        sound.playRewardFanfare();
        confetti({ particleCount: 60, spread: 60, origin: { y: 0.6 } });
        setSaveSuccessToast(true);
        setShowGeneralModal(false);
        setTimeout(() => setSaveSuccessToast(false), 3500);
        await onRefresh();
      } else {
        alert(data.error || 'Failed to update general settings');
      }
    } catch {
      alert('Network error saving settings');
    } finally {
      setIsSaving(false);
    }
  }

  // Save Hero Banner & Branding
  async function handleSaveHeroBanner(e: React.FormEvent) {
    e.preventDefault();
    if (!business) return;
    try {
      setIsSaving(true);
      sound.playClick();
      const currentTheme = business.theme_config || business.reward_rule?.theme_config || {};
      const updatedTheme: ThemeConfig = {
        ...currentTheme,
        custom_tagline: tagline.trim(),
        description: description.trim(),
        badge_1: badge1.trim(),
        badge_2: badge2.trim(),
        welcome_badge: badge1.trim() || currentTheme.welcome_badge,
      };

      const res = await fetch(`/api/businesses/${business.slug}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          logo_url: logoUrl.trim() || undefined,
          theme_config: updatedTheme,
          reward_rule: {
            ...business.reward_rule,
            reward_desc: description.trim() || business.reward_rule.reward_desc,
            theme_config: updatedTheme,
          },
        }),
      });
      const data = await res.json();
      if (data.success) {
        sound.playRewardFanfare();
        confetti({ particleCount: 70, spread: 60, origin: { y: 0.6 } });
        setSaveSuccessToast(true);
        setShowHeroModal(false);
        setTimeout(() => setSaveSuccessToast(false), 3500);
        await onRefresh();
      } else {
        alert(data.error || 'Failed to update hero banner');
      }
    } catch {
      alert('Network error saving banner');
    } finally {
      setIsSaving(false);
    }
  }

  // Save Loyalty Program Settings
  async function handleSaveLoyalty(e: React.FormEvent) {
    e.preventDefault();
    if (!business) return;
    try {
      setIsSaving(true);
      sound.playClick();
      const res = await fetch(`/api/businesses/${business.slug}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reward_rule: {
            ...business.reward_rule,
            stamps_needed: Math.min(8, Math.max(1, Number(stampsNeeded) || 6)),
            reward_title: rewardTitle.trim() || 'Free Specialty Beverage',
            min_order_for_stamp: Number(minOrder) || 150,
          },
          min_order_for_stamp: Number(minOrder) || 150,
          avg_spend_per_visit: Number(avgSpend) || 250,
          winback_offer_text: offerText.trim(),
        }),
      });
      const data = await res.json();
      if (data.success) {
        sound.playRewardFanfare();
        confetti({ particleCount: 70, spread: 70, origin: { y: 0.6 } });
        setSaveSuccessToast(true);
        setShowLoyaltyModal(false);
        setTimeout(() => setSaveSuccessToast(false), 3500);
        await onRefresh();
      } else {
        alert(data.error || 'Failed to update loyalty rules');
      }
    } catch {
      alert('Network error saving loyalty rules');
    } finally {
      setIsSaving(false);
    }
  }

  // Handle Notification Toggle
  async function handleToggleNotification(
    type: 'order' | 'scan' | 'sound' | 'daily' | 'winback',
    nextVal: boolean
  ) {
    sound.playClick();
    let orderVal = orderAlerts;
    let scanVal = scanAlerts;
    let soundVal = soundEffects;
    let dailyVal = dailySummary;
    let winbackVal = winbackAlerts;

    if (type === 'order') {
      setOrderAlerts(nextVal);
      orderVal = nextVal;
    } else if (type === 'scan') {
      setScanAlerts(nextVal);
      scanVal = nextVal;
    } else if (type === 'sound') {
      setSoundEffects(nextVal);
      soundVal = nextVal;
    } else if (type === 'daily') {
      setDailySummary(nextVal);
      dailyVal = nextVal;
    } else if (type === 'winback') {
      setWinbackAlerts(nextVal);
      winbackVal = nextVal;
    }

    if (!business) return;
    try {
      const currentTheme = business.theme_config || business.reward_rule?.theme_config || {};
      const updatedTheme: ThemeConfig = {
        ...currentTheme,
        order_alerts_enabled: orderVal,
        menu_scan_alerts_enabled: scanVal,
        sound_enabled: soundVal,
        daily_summary_enabled: dailyVal,
        auto_winback_enabled: winbackVal,
      };

      await fetch(`/api/businesses/${business.slug}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          theme_config: updatedTheme,
        }),
      });
    } catch (err) {
      console.error('Failed to update notification setting', err);
    }
  }

  const currentThemePreset = business?.theme_config?.preset || business?.reward_rule?.theme_config?.preset || 'warm_latte';
  const currentStampIcon = business?.theme_config?.stamp_icon || business?.reward_rule?.theme_config?.stamp_icon || 'coffee';
  const fullAddress = [address, area, city].filter(Boolean).join(', ') || 'Not set';

  return (
    <div className="max-w-xl mx-auto space-y-5 animate-in fade-in duration-200">
      {/* 1. Header */}
      <div className="text-left pt-1">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0F172A] tracking-tight font-display">
          Settings
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Configure your store branding, loyalty rules, notifications, and preferences
        </p>
      </div>

      {/* Save Success Banner */}
      {saveSuccessToast && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold rounded-2xl flex items-center gap-2.5 animate-in fade-in slide-in-from-top-1">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>✓ Restaurant settings saved successfully! All updates are live.</span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ========================================================================= */}
      {/* GROUP 1: STORE & BRANDING                                                 */}
      {/* ========================================================================= */}
      <div className="space-y-2">
        <div className="text-[11px] uppercase font-mono font-bold tracking-wider text-slate-400 px-1">
          Store &amp; Branding
        </div>

        <div className="bg-white rounded-3xl border border-slate-100 card-soft-shadow divide-y divide-slate-100 overflow-hidden">
          {/* Edit Restaurant Details */}
          <button
            type="button"
            onClick={() => {
              sound.playClick();
              setShowGeneralModal(true);
            }}
            className="w-full text-left p-4 flex items-center justify-between hover:bg-slate-50 transition-colors cursor-pointer group"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-2xl bg-slate-50 text-slate-700 flex items-center justify-center shrink-0 border border-slate-200/80 group-hover:scale-105 group-hover:border-slate-300 transition-all">
                <Store className="w-4 h-4 text-slate-700" />
              </div>
              <div>
                <div className="font-display font-bold text-xs sm:text-sm text-slate-900">
                  Edit Restaurant Details
                </div>
                <div className="text-xs text-slate-400">
                  Update name, address, Google review &amp; Instagram
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-medium text-slate-700 bg-slate-100 border border-slate-200/80 px-2.5 py-0.5 rounded-full hidden sm:inline-block truncate max-w-[140px]">
                {name || 'Store Info'}
              </span>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </div>
          </button>

          {/* Pass Theme Studio */}
          <button
            type="button"
            onClick={() => {
              sound.playClick();
              onOpenCustomization();
            }}
            className="w-full text-left p-4 flex items-center justify-between hover:bg-slate-50 transition-colors cursor-pointer group"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-2xl bg-slate-50 text-slate-700 flex items-center justify-center shrink-0 border border-slate-200/80 group-hover:scale-105 group-hover:border-slate-300 transition-all">
                <Palette className="w-4 h-4 text-slate-700" />
              </div>
              <div>
                <div className="font-display font-bold text-xs sm:text-sm text-slate-900">
                  Pass Theme Studio
                </div>
                <div className="text-xs text-slate-400">
                  Card gradients, stamp icons, colors &amp; squircle borders
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono font-medium text-slate-700 bg-slate-100 border border-slate-200/80 px-2.5 py-0.5 rounded-full">
                {THEME_PRESETS.find((p) => p.id === currentThemePreset)?.name || 'Theme'}
              </span>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </div>
          </button>

          {/* Hero Banner & Brand Story */}
          <button
            type="button"
            onClick={() => {
              sound.playClick();
              setShowHeroModal(true);
            }}
            className="w-full text-left p-4 flex items-center justify-between hover:bg-slate-50 transition-colors cursor-pointer group"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-2xl bg-slate-50 text-slate-700 flex items-center justify-center shrink-0 border border-slate-200/80 group-hover:scale-105 group-hover:border-slate-300 transition-all">
                <Sparkles className="w-4 h-4 text-slate-700" />
              </div>
              <div>
                <div className="font-display font-bold text-xs sm:text-sm text-slate-900">
                  Hero Banner &amp; Brand Story
                </div>
                <div className="text-xs text-slate-400">
                  Tagline, storefront photo, and customer badges
                </div>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400" />
          </button>

          {/* Live Customer Pass Link */}
          {business?.slug && (
            <Link
              href={`/c/${business.slug}`}
              target="_blank"
              className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors cursor-pointer block group"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-2xl bg-slate-50 text-slate-700 flex items-center justify-center shrink-0 border border-slate-200/80 group-hover:scale-105 group-hover:border-slate-300 transition-all">
                  <ExternalLink className="w-4 h-4 text-slate-700" />
                </div>
                <div>
                  <div className="font-display font-bold text-xs sm:text-sm text-slate-900">
                    Live Customer Pass
                  </div>
                  <div className="text-xs text-slate-400">
                    Preview pass as your customers see it
                  </div>
                </div>
              </div>
              <ExternalLink className="w-4 h-4 text-slate-400" />
            </Link>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* GROUP 2: LOYALTY & COUNTER                                                */}
      {/* ========================================================================= */}
      <div className="space-y-2 pt-1">
        <div className="text-[11px] uppercase font-mono font-bold tracking-wider text-slate-400 px-1">
          Loyalty Program &amp; Counter
        </div>

        <div className="bg-white rounded-3xl border border-slate-100 card-soft-shadow divide-y divide-slate-100 overflow-hidden">
          {/* Loyalty & Stamp Rules */}
          <button
            type="button"
            onClick={() => {
              sound.playClick();
              setShowLoyaltyModal(true);
            }}
            className="w-full text-left p-4 flex items-center justify-between hover:bg-slate-50 transition-colors cursor-pointer group"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-2xl bg-slate-50 text-slate-700 flex items-center justify-center shrink-0 border border-slate-200/80 group-hover:scale-105 group-hover:border-slate-300 transition-all">
                <Gift className="w-4 h-4 text-slate-700" />
              </div>
              <div>
                <div className="font-display font-bold text-xs sm:text-sm text-slate-900">
                  Loyalty &amp; Stamp Rules
                </div>
                <div className="text-xs text-slate-400">
                  Stamp milestones, reward perks, and min order thresholds
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono font-medium text-slate-700 bg-slate-100 border border-slate-200/80 px-2.5 py-0.5 rounded-full">
                {stampsNeeded} Stamps Goal
              </span>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </div>
          </button>

          {/* Counter QR Stand Studio */}
          <button
            type="button"
            onClick={() => {
              sound.playClick();
              setShowQrStandModal(true);
            }}
            className="w-full text-left p-4 flex items-center justify-between hover:bg-slate-50 transition-colors cursor-pointer group"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-2xl bg-slate-50 text-slate-700 flex items-center justify-center shrink-0 border border-slate-200/80 group-hover:scale-105 group-hover:border-slate-300 transition-all">
                <Printer className="w-4 h-4 text-slate-700" />
              </div>
              <div>
                <div className="font-display font-bold text-xs sm:text-sm text-slate-900">
                  Counter QR Stand Studio
                </div>
                <div className="text-xs text-slate-400">
                  Download ready-to-print 300 DPI acrylic stands
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-medium text-slate-700 bg-slate-100 border border-slate-200/80 px-2.5 py-0.5 rounded-full">
                Print High-Res
              </span>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </div>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* GROUP 3: PREFERENCES & SECURITY                                           */}
      {/* ========================================================================= */}
      <div className="space-y-2 pt-1">
        <div className="text-[11px] uppercase font-mono font-bold tracking-wider text-slate-400 px-1">
          Preferences &amp; Account
        </div>

        <div className="bg-white rounded-3xl border border-slate-100 card-soft-shadow divide-y divide-slate-100 overflow-hidden">
          {/* Subscription & Billing */}
          <button
            type="button"
            onClick={() => {
              sound.playClick();
              onOpenPlanModal();
            }}
            className="w-full text-left p-4 flex items-center justify-between hover:bg-slate-50 transition-colors cursor-pointer group"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-2xl bg-slate-50 text-slate-700 flex items-center justify-center shrink-0 border border-slate-200/80 group-hover:scale-105 group-hover:border-slate-300 transition-all">
                <CreditCard className="w-4 h-4 text-slate-700" />
              </div>
              <div>
                <div className="font-display font-bold text-xs sm:text-sm text-slate-900">
                  Subscription &amp; Billing
                </div>
                <div className="text-xs text-slate-400">
                  {subInfo?.isTrial
                    ? '3-Day Free Trial • Upgrade to 1-Year License'
                    : '1-Year active merchant plan with GST invoices'}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-medium text-slate-700 bg-slate-100 border border-slate-200/80 px-2.5 py-0.5 rounded-full">
                {subInfo?.badgeText || 'Active'}
              </span>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </div>
          </button>

          {/* Privacy & Security */}
          <button
            type="button"
            onClick={() => {
              sound.playClick();
              setShowPrivacyModal(true);
            }}
            className="w-full text-left p-4 flex items-center justify-between hover:bg-slate-50 transition-colors cursor-pointer group"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-2xl bg-slate-50 text-slate-700 flex items-center justify-center shrink-0 border border-slate-200/80 group-hover:scale-105 group-hover:border-slate-300 transition-all">
                <ShieldCheck className="w-4 h-4 text-slate-700" />
              </div>
              <div>
                <div className="font-display font-bold text-xs sm:text-sm text-slate-900">
                  Privacy &amp; Security
                </div>
                <div className="text-xs text-slate-400">
                  Zero-app customer data safeguards &amp; 256-bit encryption
                </div>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400" />
          </button>
        </div>
      </div>

      {/* Account Info & Sign Out Footer */}
      <div className="pt-2">
        <button
          type="button"
          onClick={onSignOut}
          className="w-full py-3.5 rounded-2xl bg-white hover:bg-rose-50 text-slate-700 hover:text-rose-600 border border-slate-200 font-display font-bold text-xs sm:text-sm shadow-2xs flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-98"
        >
          <LogOut className="w-4 h-4 text-rose-500" />
          <span>Sign Out of Account</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* EDIT MODAL 1: GENERAL */}
      {/* ========================================================================= */}
      {showGeneralModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full card-soft-shadow border border-slate-100 space-y-5 animate-stamp max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-[#E6F8F2] text-[#059669] flex items-center justify-center font-bold">
                  <Store className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-display font-bold text-base text-[#0F172A]">
                    Edit General Information
                  </h4>
                  <p className="text-[11px] text-slate-400">
                    Update restaurant name, contact and location details
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowGeneralModal(false)}
                className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveGeneral} className="space-y-4 text-left">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Restaurant / Cafe Name *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Prime Cafe"
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#0F172A]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Category / Cuisine
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#0F172A] bg-white"
                >
                  <option value="Specialty Cafe & Bakery">Specialty Cafe &amp; Bakery</option>
                  <option value="Coffee Roastery & Brew Bar">Coffee Roastery &amp; Brew Bar</option>
                  <option value="Artisan Pizzeria & Bistro">Artisan Pizzeria &amp; Bistro</option>
                  <option value="Burger Joint & Grill">Burger Joint &amp; Grill</option>
                  <option value="Dessert Parlour & Waffles">Dessert Parlour &amp; Waffles</option>
                  <option value="Boba Tea & Beverages">Boba Tea &amp; Beverages</option>
                  <option value="Casual Dining & Bar">Casual Dining &amp; Bar</option>
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Contact Phone Number
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="e.g. +91 98765 43210"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#0F172A]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    City
                  </label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="e.g. Indiranagar"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#0F172A]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Street Address &amp; Area
                </label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="e.g. 104 MG Road, Indiranagar"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#0F172A]"
                />
              </div>

              <div className="pt-2 border-t border-slate-100 space-y-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                      <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-400" />
                      <span>Google 5-Star Review Link</span>
                    </label>
                    {googleReviewUrl && (
                      <a
                        href={googleReviewUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[11px] font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1"
                      >
                        <span>Test Link</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                  <input
                    type="url"
                    value={googleReviewUrl}
                    onChange={(e) => setGoogleReviewUrl(e.target.value)}
                    placeholder="https://g.page/r/your-cafe/review"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-mono font-medium focus:outline-none focus:ring-2 focus:ring-[#0F172A]"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                      <InstagramIcon className="w-3.5 h-3.5 text-pink-600" />
                      <span>Instagram Profile Link / Handle</span>
                    </label>
                    {instagramUrl && (
                      <a
                        href={instagramUrl.startsWith('http') ? instagramUrl : `https://instagram.com/${instagramUrl.replace('@', '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[11px] font-semibold text-pink-600 hover:text-pink-800 flex items-center gap-1"
                      >
                        <span>Test Link</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                  <input
                    type="text"
                    value={instagramUrl}
                    onChange={(e) => setInstagramUrl(e.target.value)}
                    placeholder="e.g. @primecafe or https://instagram.com/primecafe"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-mono font-medium focus:outline-none focus:ring-2 focus:ring-[#0F172A]"
                  />
                </div>
              </div>

              <div className="flex items-center gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowGeneralModal(false)}
                  className="flex-1 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex-1 py-3 rounded-2xl bg-[#0F172A] hover:bg-black text-white text-xs font-bold cursor-pointer transition-all shadow-md flex items-center justify-center gap-1.5"
                >
                  {isSaving ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Save Changes</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* EDIT MODAL 2: HERO BANNER */}
      {/* ========================================================================= */}
      {showHeroModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full card-soft-shadow border border-slate-100 space-y-5 animate-stamp max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-[#E6F8F2] text-[#059669] flex items-center justify-center font-bold">
                  <Palette className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-display font-bold text-base text-[#0F172A]">
                    Edit Hero Banner
                  </h4>
                  <p className="text-[11px] text-slate-400">
                    Customize tagline, description, badges and storefront photo
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowHeroModal(false)}
                className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveHeroBanner} className="space-y-4 text-left">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Tagline (Bold Headline)
                </label>
                <input
                  type="text"
                  value={tagline}
                  onChange={(e) => setTagline(e.target.value)}
                  placeholder="e.g. Bihari Sab Pe Bhari"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#0F172A]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Description
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. This is a restaurant where pure taste meets heartwarming hospitality."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#0F172A]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Badge 1
                  </label>
                  <input
                    type="text"
                    value={badge1}
                    onChange={(e) => setBadge1(e.target.value)}
                    placeholder="e.g. 10% Vegetarian Options"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#0F172A]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Badge 2
                  </label>
                  <input
                    type="text"
                    value={badge2}
                    onChange={(e) => setBadge2(e.target.value)}
                    placeholder="e.g. Organic Ingredients"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#0F172A]"
                  />
                </div>
              </div>

              {/* Storefront Image Upload / Presets */}
              <div className="pt-2 border-t border-slate-100 space-y-2">
                <label className="block text-xs font-semibold text-slate-700">
                  Storefront Photo
                </label>
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0">
                    {logoUrl ? (
                      <img src={logoUrl} alt="Storefront" className="w-full h-full object-cover" />
                    ) : (
                      <Store className="w-6 h-6 text-slate-300" />
                    )}
                  </div>
                  <div className="flex-1 space-y-1.5">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full py-2 px-3 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <UploadCloud className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Upload New Photo</span>
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleImageSelect}
                      className="hidden"
                    />
                  </div>
                </div>

                <div className="pt-1">
                  <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                    Or pick preset photo:
                  </label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {PRESET_STOREFRONT_PHOTOS.slice(0, 3).map((p) => (
                      <button
                        key={p.label}
                        type="button"
                        onClick={() => {
                          setLogoUrl(p.url);
                          sound.playClick();
                        }}
                        className={`p-1.5 rounded-xl border text-[10px] font-medium flex items-center gap-1.5 transition-all cursor-pointer truncate ${
                          logoUrl === p.url
                            ? 'border-[#0F172A] bg-slate-900 text-white font-bold'
                            : 'border-slate-200 bg-slate-50 hover:bg-white text-slate-700'
                        }`}
                      >
                        <img src={p.url} alt={p.label} className="w-5 h-5 rounded-md object-cover shrink-0" />
                        <span className="truncate">{p.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowHeroModal(false)}
                  className="flex-1 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex-1 py-3 rounded-2xl bg-[#0F172A] hover:bg-black text-white text-xs font-bold cursor-pointer transition-all shadow-md flex items-center justify-center gap-1.5"
                >
                  {isSaving ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Save Banner</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* EDIT MODAL 3: LOYALTY PROGRAM */}
      {/* ========================================================================= */}
      {showLoyaltyModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full card-soft-shadow border border-slate-100 space-y-5 animate-stamp max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-[#E6F8F2] text-[#059669] flex items-center justify-center font-bold">
                  <Gift className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-display font-bold text-base text-[#0F172A]">
                    Edit Loyalty Program
                  </h4>
                  <p className="text-[11px] text-slate-400">
                    Configure stamps needed, rewards and minimum spend
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowLoyaltyModal(false)}
                className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveLoyalty} className="space-y-4 text-left">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Stamps Needed for Full Reward
                </label>
                <div className="grid grid-cols-6 gap-2">
                  {[2, 3, 4, 5, 6, 8].map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => {
                        setStampsNeeded(s);
                        sound.playClick();
                      }}
                      className={`py-2 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer border ${
                        stampsNeeded === s
                          ? 'bg-[#0F172A] text-emerald-400 border-[#0F172A] shadow-xs'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Grand Milestone Reward Title *
                </label>
                <input
                  type="text"
                  value={rewardTitle}
                  onChange={(e) => setRewardTitle(e.target.value)}
                  placeholder="e.g. Free Belgian Waffle & Cold Brew"
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#0F172A]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Minimum Bill per Stamp (₹)
                  </label>
                  <input
                    type="number"
                    value={minOrder}
                    onChange={(e) => setMinOrder(Number(e.target.value))}
                    placeholder="150"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-mono font-medium focus:outline-none focus:ring-2 focus:ring-[#0F172A]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Average Spend per Visit (₹)
                  </label>
                  <input
                    type="number"
                    value={avgSpend}
                    onChange={(e) => setAvgSpend(Number(e.target.value))}
                    placeholder="250"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-mono font-medium focus:outline-none focus:ring-2 focus:ring-[#0F172A]"
                  />
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Special WhatsApp Winback Offer Text
                </label>
                <input
                  type="text"
                  value={offerText}
                  onChange={(e) => setOfferText(e.target.value)}
                  placeholder="e.g. Complimentary Belgian Waffle with any drink"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#0F172A]"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Sent automatically in WhatsApp recovery messages to inactive regulars.
                </p>
              </div>

              <div className="flex items-center gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowLoyaltyModal(false)}
                  className="flex-1 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex-1 py-3 rounded-2xl bg-[#0F172A] hover:bg-black text-white text-xs font-bold cursor-pointer transition-all shadow-md flex items-center justify-center gap-1.5"
                >
                  {isSaving ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Save Loyalty Rules</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* ========================================================================= */}
      {/* EDIT MODAL 4: NOTIFICATIONS & SOUND                                        */}
      {/* ========================================================================= */}
      {showNotificationModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full card-soft-shadow border border-slate-100 space-y-5 animate-stamp max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center font-bold">
                  <Bell className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-display font-bold text-base text-[#0F172A]">
                    Notification &amp; Sound Alerts
                  </h4>
                  <p className="text-[11px] text-slate-400">
                    Configure sound chimes, scan alerts, and daily summaries
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowNotificationModal(false)}
                className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 pt-1 text-left">
              {/* Sound effects */}
              <div className="flex items-center justify-between py-2">
                <div className="space-y-0.5">
                  <div className="font-semibold text-slate-900 text-xs">Audio Chimes &amp; Sound FX</div>
                  <div className="text-[11px] text-slate-400">Play pleasant audio chime on stamps and reward unlocks</div>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={soundEffects}
                  onClick={() => handleToggleNotification('sound', !soundEffects)}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    soundEffects ? 'bg-[#10B981]' : 'bg-slate-200'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                      soundEffects ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Order alerts */}
              <div className="flex items-center justify-between py-2 border-t border-slate-100">
                <div className="space-y-0.5">
                  <div className="font-semibold text-slate-900 text-xs">Counter Order &amp; Stamp Alerts</div>
                  <div className="text-[11px] text-slate-400">Get notified when customers stamp or redeem rewards</div>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={orderAlerts}
                  onClick={() => handleToggleNotification('order', !orderAlerts)}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    orderAlerts ? 'bg-[#10B981]' : 'bg-slate-200'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                      orderAlerts ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Menu scan alerts */}
              <div className="flex items-center justify-between py-2 border-t border-slate-100">
                <div className="space-y-0.5">
                  <div className="font-semibold text-slate-900 text-xs">Table QR Scan Notifications</div>
                  <div className="text-[11px] text-slate-400">Get notified when someone scans the menu or table stand</div>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={scanAlerts}
                  onClick={() => handleToggleNotification('scan', !scanAlerts)}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    scanAlerts ? 'bg-[#10B981]' : 'bg-slate-200'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                      scanAlerts ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Daily WhatsApp summary */}
              <div className="flex items-center justify-between py-2 border-t border-slate-100">
                <div className="space-y-0.5">
                  <div className="font-semibold text-slate-900 text-xs">Daily Evening WhatsApp Summary</div>
                  <div className="text-[11px] text-slate-400">Receive evening summary of new regulars and extra sales</div>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={dailySummary}
                  onClick={() => handleToggleNotification('daily', !dailySummary)}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    dailySummary ? 'bg-[#10B981]' : 'bg-slate-200'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                      dailySummary ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Automated Win-Back */}
              <div className="flex items-center justify-between py-2 border-t border-slate-100">
                <div className="space-y-0.5">
                  <div className="font-semibold text-slate-900 text-xs">Automated Customer Recovery Alerts</div>
                  <div className="text-[11px] text-slate-400">Notify when regular customers are due for a visit</div>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={winbackAlerts}
                  onClick={() => handleToggleNotification('winback', !winbackAlerts)}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    winbackAlerts ? 'bg-[#10B981]' : 'bg-slate-200'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                      winbackAlerts ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowNotificationModal(false)}
                className="w-full py-3 rounded-2xl bg-[#0F172A] hover:bg-black text-white text-xs font-bold cursor-pointer transition-all shadow-md text-center"
              >
                Done / Back to Settings
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* EDIT MODAL 5: PRIVACY & SECURITY MODAL                                    */}
      {/* ========================================================================= */}
      <PrivacySecurityModal
        isOpen={showPrivacyModal}
        onClose={() => setShowPrivacyModal(false)}
        customerPhone={phone}
      />

      {/* ========================================================================= */}
      {/* EDIT MODAL 6: COUNTER QR STAND STUDIO & QR SETTINGS MODAL                  */}
      {/* ========================================================================= */}
      <CounterQrStandModal
        isOpen={showQrStandModal}
        onClose={() => setShowQrStandModal(false)}
        business={business}
      />
    </div>
  );
}

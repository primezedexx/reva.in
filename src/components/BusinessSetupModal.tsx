'use client';

// ============================================================================
// REVA (reva.in) — One-Time Business Onboarding & Store Setup Modal
// Enables seamless store setup for Google SSO & new merchant registrations
// Live reactive pass preview • 1-Click theme presets • One-time trigger
// ============================================================================

import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import {
  Store,
  Sparkles,
  Palette,
  Sliders,
  CheckCircle2,
  Coffee,
  X,
  ArrowRight,
  ArrowLeft,
  Check,
  Flame,
  Star,
  Gift,
  ShieldCheck,
  Smartphone,
  QrCode,
  MapPin,
  Phone,
  Tag,
  Heart,
  Zap,
} from 'lucide-react';
import {
  Business,
  ThemeConfig,
  StampIconType,
  CardGradientType,
  PageBgTone,
  CardRadiusType,
} from '@/types/database';
import {
  THEME_PRESETS,
  STAMP_ICONS,
  resolvePassBackground,
} from '@/lib/theme-presets';
import { sound } from '@/lib/sound';

interface BusinessSetupModalProps {
  business: Business;
  isOpen: boolean;
  onClose: () => void;
  onComplete: (updatedBusiness: Business) => void;
}

const CATEGORY_OPTIONS = [
  { id: 'Cafe & Coffee Shop', label: 'Cafe & Coffee', emoji: '☕' },
  { id: 'Bakery & Desserts', label: 'Bakery & Bakes', emoji: '🥐' },
  { id: 'Boba & Beverages', label: 'Boba & Tea', emoji: '🧋' },
  { id: 'Restaurant / Dining', label: 'Restaurant & Diner', emoji: '🍽️' },
  { id: 'Salon & Spa', label: 'Salon & Wellness', emoji: '💇' },
  { id: 'Fashion & Boutique', label: 'Boutique & Wear', emoji: '👗' },
  { id: 'Fragrance & Lifestyle', label: 'Perfume & Lifestyle', emoji: '✨' },
  { id: 'Pet Cafe & Animals', label: 'Pet & Cat Cafe', emoji: '🐾' },
];

export default function BusinessSetupModal({
  business,
  isOpen,
  onClose,
  onComplete,
}: BusinessSetupModalProps) {
  const [activeStep, setActiveStep] = useState<1 | 2 | 3>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Step 1: Store Info
  const [storeName, setStoreName] = useState(business.name || '');
  const [category, setCategory] = useState(business.category || 'Cafe & Coffee Shop');
  const [city, setCity] = useState(business.city || 'Bangalore');
  const [area, setArea] = useState(business.area || 'Indiranagar');
  const [phone, setPhone] = useState(business.phone || '');

  // Step 2: Rewards & Rules
  const existingTheme = business.theme_config || business.reward_rule?.theme_config;
  const [stampsNeeded, setStampsNeeded] = useState<number>(
    business.reward_rule?.stamps_needed || 6
  );
  const [rewardTitle, setRewardTitle] = useState(
    business.reward_rule?.reward_title || 'Free Specialty Beverage'
  );
  const [rewardDesc, setRewardDesc] = useState(
    business.reward_rule?.reward_desc || 'Any handcrafted drink or signature treat on the house'
  );
  const [minOrder, setMinOrder] = useState<string>(
    String(business.reward_rule?.min_order_for_stamp || business.min_order_for_stamp || 150)
  );
  const [avgSpend, setAvgSpend] = useState<string>(
    String(business.avg_spend_per_visit || 250)
  );
  const [winbackOffer, setWinbackOffer] = useState(
    business.winback_offer_text || 'Complimentary Belgian Waffle or treat with your next visit'
  );

  // Step 3: Visual Theme & Pass Branding
  const [selectedPreset, setSelectedPreset] = useState<string>(
    existingTheme?.preset || 'warm_latte'
  );
  const [stampIcon, setStampIcon] = useState<StampIconType>(
    existingTheme?.stamp_icon || 'coffee'
  );
  const [cardGradient, setCardGradient] = useState<CardGradientType>(
    existingTheme?.card_gradient || 'mocha_roast'
  );
  const [pageBgTone, setPageBgTone] = useState<PageBgTone>(
    existingTheme?.page_bg_tone || 'warm_ivory'
  );
  const [cardBgColor, setCardBgColor] = useState(
    existingTheme?.card_bg_color || business.brand_color || '#0F172A'
  );
  const [welcomeBadge, setWelcomeBadge] = useState(
    existingTheme?.welcome_badge || ''
  );
  const [welcomeTagline, setWelcomeTagline] = useState(
    existingTheme?.custom_tagline || 'Collect stamps & earn free treats on your counter visits!'
  );

  // Sync state whenever business prop changes
  useEffect(() => {
    if (business) {
      setStoreName(business.name || '');
      setCategory(business.category || 'Cafe & Coffee Shop');
      setCity(business.city || 'Bangalore');
      setArea(business.area || 'Indiranagar');
      setPhone(business.phone || '');

      const theme = business.theme_config || business.reward_rule?.theme_config;
      setStampsNeeded(business.reward_rule?.stamps_needed || 6);
      setRewardTitle(business.reward_rule?.reward_title || 'Free Specialty Beverage');
      setRewardDesc(
        business.reward_rule?.reward_desc || 'Any handcrafted drink on the house'
      );
      setMinOrder(String(business.reward_rule?.min_order_for_stamp || business.min_order_for_stamp || 150));
      setAvgSpend(String(business.avg_spend_per_visit || 250));
      setWinbackOffer(
        business.winback_offer_text || 'Complimentary Belgian Waffle or treat with your next visit'
      );

      if (theme) {
        setSelectedPreset(theme.preset || 'warm_latte');
        setStampIcon(theme.stamp_icon || 'coffee');
        setCardGradient(theme.card_gradient || 'mocha_roast');
        setPageBgTone(theme.page_bg_tone || 'warm_ivory');
        setCardBgColor(theme.card_bg_color || business.brand_color || '#0F172A');
        setWelcomeBadge(theme.welcome_badge || '');
        setWelcomeTagline(theme.custom_tagline || 'Collect stamps & unlock treats!');
      }
    }
  }, [business]);

  if (!isOpen) return null;

  // 1-Click apply theme preset
  const handleApplyPreset = (presetId: string) => {
    const preset = THEME_PRESETS.find((p) => p.id === presetId);
    if (!preset) return;
    sound.playStampPop();
    setSelectedPreset(preset.id);
    setStampIcon(preset.config.stamp_icon || 'paw');
    setCardGradient(preset.config.card_gradient || 'cat_pastel');
    setPageBgTone(preset.config.page_bg_tone || 'soft_rose');
    setCardBgColor(preset.config.card_bg_color || '#0F172A');
    setWelcomeBadge(preset.config.welcome_badge || '');
    setWelcomeTagline(preset.config.custom_tagline || '');
  };

  // Handle final submission and saving
  const handleSaveAndLaunch = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    sound.playClick();

    try {
      const cleanName = storeName.trim() || business.name || 'My Store';
      const cleanSlug = cleanName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
      const uniqueSlug = `${cleanSlug}-${business.id.substring(0, 4)}`;

      const compiledTheme: ThemeConfig = {
        preset: selectedPreset,
        page_bg_tone: pageBgTone,
        is_dark_mode: pageBgTone === 'deep_dark' || selectedPreset === 'obsidian_luxury' || selectedPreset === 'neon_cyber',
        card_gradient: cardGradient,
        card_bg_color: cardBgColor || '#0F172A',
        card_text_color: '#FFFFFF',
        accent_color: cardBgColor || '#0F172A',
        stamp_icon: stampIcon,
        card_radius: 'rounded_squircle',
        welcome_badge: welcomeBadge.trim() || undefined,
        custom_tagline: welcomeTagline.trim() || undefined,
        is_setup_completed: true,
      };

      const updatedRewardRule = {
        stamps_needed: Number(stampsNeeded) || 6,
        reward_title: rewardTitle.trim() || 'Free Specialty Beverage',
        reward_desc: rewardDesc.trim() || 'Any handcrafted drink on the house',
        min_order_for_stamp: Number(minOrder) || 150,
        theme_config: compiledTheme,
      };

      const payload = {
        name: cleanName,
        slug: business.slug && !business.slug.startsWith('store-') ? business.slug : uniqueSlug,
        category: category,
        city: city.trim() || 'Bangalore',
        area: area.trim() || undefined,
        phone: phone.trim() || undefined,
        brand_color: cardBgColor || '#0F172A',
        reward_rule: updatedRewardRule,
        theme_config: compiledTheme,
        is_setup_completed: true,
        min_order_for_stamp: Number(minOrder) || 150,
        avg_spend_per_visit: Number(avgSpend) || 250,
        winback_offer_text: winbackOffer.trim(),
        active_offers: [
          {
            id: 'off_1',
            title: 'Welcome Milestone Treat',
            stamps_needed: Math.max(1, Math.floor(stampsNeeded / 2)),
            badge: `${Math.max(1, Math.floor(stampsNeeded / 2))} Stamps Milestone`,
            desc: `Earned at ${Math.max(1, Math.floor(stampsNeeded / 2))} stamps on your pass`,
            type: 'milestone',
            icon: 'flame',
            min_order: Number(minOrder) || 150,
          },
          {
            id: 'off_2',
            title: rewardTitle.trim() || 'Free Specialty Beverage',
            stamps_needed: Number(stampsNeeded) || 6,
            badge: `${stampsNeeded} Stamps Grand Reward`,
            desc: rewardDesc.trim() || 'Any handcrafted drink on the house',
            type: 'milestone',
            icon: 'star',
            min_order: Number(minOrder) || 150,
          },
        ],
      };

      const res = await fetch(`/api/businesses/${business.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (data.success && data.business) {
        try {
          localStorage.setItem(`reva_setup_done_${business.id}`, 'true');
          localStorage.setItem('reva_setup_done', 'true');
          if (typeof window !== 'undefined') {
            window.history.replaceState({}, '', `/dashboard?businessId=${business.id}`);
          }
        } catch {
          // ignore
        }

        setIsSuccess(true);
        sound.playRewardFanfare();
        confetti({
          particleCount: 120,
          spread: 80,
          origin: { y: 0.6 },
        });

        setTimeout(() => {
          onComplete(data.business);
          onClose();
        }, 1000);
      } else {
        alert(data.error || 'Failed to save store setup. Please try again.');
      }
    } catch (err: unknown) {
      console.error('Setup error:', err);
      alert('Network error while saving setup. Please check your connection.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Temporary dismiss
  const handleDismiss = () => {
    try {
      localStorage.setItem(`reva_setup_dismissed_${business.id}`, 'true');
      localStorage.setItem(`reva_setup_done_${business.id}`, 'true');
      if (typeof window !== 'undefined') {
        window.history.replaceState({}, '', `/dashboard?businessId=${business.id}`);
      }
    } catch {}
    sound.playClick();
    onClose();
  };

  // Resolve dynamic preview background
  const previewBg = resolvePassBackground(
    {
      card_gradient: cardGradient,
      card_bg_color: cardBgColor,
    },
    cardBgColor
  );

  // Selected icon symbol
  const selectedIconData = STAMP_ICONS.find((i) => i.id === stampIcon) || STAMP_ICONS[0];

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-5xl w-full shadow-2xl border border-slate-200/80 overflow-hidden flex flex-col max-h-[92vh] animate-stamp my-auto">
        
        {/* Top Header Bar */}
        <div className="bg-[#0F172A] text-white px-6 py-4.5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-400 to-amber-200 text-slate-950 flex items-center justify-center font-bold shadow-md">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-display font-bold text-lg tracking-tight text-white">
                  Set Up Your Business Loyalty Pass
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-mono font-bold uppercase tracking-wider border border-emerald-400/30">
                  1-Time Setup
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Launch your custom customer loyalty card and QR stand in 2 minutes
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleDismiss}
            className="p-2 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            title="Skip for now"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step Progress Tracker */}
        <div className="bg-slate-50 border-b border-slate-200/80 px-6 py-3 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2 sm:gap-6">
            <button
              type="button"
              onClick={() => {
                sound.playClick();
                setActiveStep(1);
              }}
              className={`flex items-center gap-2 text-xs font-bold transition-all cursor-pointer ${
                activeStep === 1
                  ? 'text-[#0F172A]'
                  : 'text-slate-400 hover:text-slate-700'
              }`}
            >
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-mono font-bold ${
                  activeStep === 1
                    ? 'bg-[#0F172A] text-white shadow-xs'
                    : 'bg-slate-200 text-slate-600'
                }`}
              >
                1
              </div>
              <span className="hidden sm:inline">Store Details</span>
            </button>

            <div className="w-6 sm:w-10 h-0.5 bg-slate-200" />

            <button
              type="button"
              onClick={() => {
                sound.playClick();
                setActiveStep(2);
              }}
              className={`flex items-center gap-2 text-xs font-bold transition-all cursor-pointer ${
                activeStep === 2
                  ? 'text-[#0F172A]'
                  : 'text-slate-400 hover:text-slate-700'
              }`}
            >
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-mono font-bold ${
                  activeStep === 2
                    ? 'bg-[#0F172A] text-white shadow-xs'
                    : 'bg-slate-200 text-slate-600'
                }`}
              >
                2
              </div>
              <span className="hidden sm:inline">Rewards &amp; Rules</span>
            </button>

            <div className="w-6 sm:w-10 h-0.5 bg-slate-200" />

            <button
              type="button"
              onClick={() => {
                sound.playClick();
                setActiveStep(3);
              }}
              className={`flex items-center gap-2 text-xs font-bold transition-all cursor-pointer ${
                activeStep === 3
                  ? 'text-[#0F172A]'
                  : 'text-slate-400 hover:text-slate-700'
              }`}
            >
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-mono font-bold ${
                  activeStep === 3
                    ? 'bg-[#0F172A] text-white shadow-xs'
                    : 'bg-slate-200 text-slate-600'
                }`}
              >
                3
              </div>
              <span className="hidden sm:inline">Theme &amp; Pass Style</span>
            </button>
          </div>

          <span className="text-[11px] font-mono text-slate-500 font-semibold">
            Step {activeStep} of 3
          </span>
        </div>

        {/* Modal Body: Split Layout with Left Form & Right Live Reactive Pass Preview */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* LEFT COLUMN: Multi-Step Configuration Form (7 Cols) */}
            <div className="lg:col-span-7 space-y-5">
              
              {isSuccess && (
                <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-900 flex items-center gap-2.5 animate-in fade-in">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  <span>🎉 Store setup completed! Launching your digital loyalty pass...</span>
                </div>
              )}

              {/* STEP 1: STORE & BRAND DETAILS */}
              {activeStep === 1 && (
                <div className="space-y-4 animate-in fade-in duration-200">
                  <div>
                    <h3 className="font-display font-bold text-base text-slate-900 flex items-center gap-2">
                      <Store className="w-4 h-4 text-slate-700" />
                      <span>Tell us about your business</span>
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      This information appears on your customer digital pass and QR stand.
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Business / Store Name *
                    </label>
                    <input
                      type="text"
                      value={storeName}
                      onChange={(e) => setStoreName(e.target.value)}
                      placeholder="e.g. Tokyo Matcha & Bakehouse"
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-[#0F172A] focus:outline-none focus:border-[#0F172A] focus:ring-1 focus:ring-[#0F172A]"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Business Category
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {CATEGORY_OPTIONS.map((cat) => {
                        const isSelected = category === cat.id;
                        return (
                          <button
                            key={cat.id}
                            type="button"
                            onClick={() => {
                              sound.playClick();
                              setCategory(cat.id);
                            }}
                            className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-1 ${
                              isSelected
                                ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                                : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                            }`}
                          >
                            <span className="text-lg">{cat.emoji}</span>
                            <span className="text-[11px] font-bold leading-tight truncate">
                              {cat.label}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        <span>City</span>
                      </label>
                      <input
                        type="text"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        placeholder="Bangalore"
                        className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 bg-white text-slate-900 focus:outline-none focus:border-[#0F172A]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        Area / Neighborhood
                      </label>
                      <input
                        type="text"
                        value={area}
                        onChange={(e) => setArea(e.target.value)}
                        placeholder="Indiranagar"
                        className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 bg-white text-slate-900 focus:outline-none focus:border-[#0F172A]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      <span>Store WhatsApp / Phone (Optional)</span>
                    </label>
                    <input
                      type="text"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+91 98765 43210"
                      className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 bg-white text-slate-900 focus:outline-none focus:border-[#0F172A]"
                    />
                    <p className="text-[10px] text-slate-400 mt-1">
                      Used for automated customer receipts and win-back offers.
                    </p>
                  </div>
                </div>
              )}

              {/* STEP 2: REWARDS & STAMP RULES */}
              {activeStep === 2 && (
                <div className="space-y-4 animate-in fade-in duration-200">
                  <div>
                    <h3 className="font-display font-bold text-base text-slate-900 flex items-center gap-2">
                      <Gift className="w-4 h-4 text-emerald-600" />
                      <span>Loyalty Rules &amp; Rewards Program</span>
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Define what your customers earn when they visit your counter.
                    </p>
                  </div>

                  {/* Stamps Needed Selector */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      How many stamps for Grand Reward?
                    </label>
                    <div className="grid grid-cols-4 gap-2">
                      {[4, 5, 6, 8].map((count) => {
                        const isSelected = stampsNeeded === count;
                        return (
                          <button
                            key={count}
                            type="button"
                            onClick={() => {
                              sound.playStampPop();
                              setStampsNeeded(count);
                            }}
                            className={`py-2.5 px-3 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center ${
                              isSelected
                                ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                                : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                            }`}
                          >
                            <span className="font-display font-bold text-base">{count}</span>
                            <span className="text-[9px] font-mono uppercase tracking-wider opacity-80">
                              Stamps
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Grand Reward Title */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Grand Reward Title *
                    </label>
                    <input
                      type="text"
                      value={rewardTitle}
                      onChange={(e) => setRewardTitle(e.target.value)}
                      placeholder="e.g. Free Specialty Beverage or Croissant"
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-[#0F172A] focus:outline-none focus:border-[#0F172A]"
                      required
                    />
                  </div>

                  {/* Grand Reward Description */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Reward Conditions / Description
                    </label>
                    <input
                      type="text"
                      value={rewardDesc}
                      onChange={(e) => setRewardDesc(e.target.value)}
                      placeholder="e.g. Any handcrafted beverage or fresh sourdough on the house"
                      className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 bg-white text-slate-900 focus:outline-none focus:border-[#0F172A]"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        Min. Spend for 1 Stamp (₹)
                      </label>
                      <input
                        type="number"
                        value={minOrder}
                        onChange={(e) => setMinOrder(e.target.value)}
                        placeholder="150"
                        className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 bg-white text-slate-900 font-mono focus:outline-none focus:border-[#0F172A]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        Avg. Customer Bill (₹)
                      </label>
                      <input
                        type="number"
                        value={avgSpend}
                        onChange={(e) => setAvgSpend(e.target.value)}
                        placeholder="250"
                        className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 bg-white text-slate-900 font-mono focus:outline-none focus:border-[#0F172A]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                      <Flame className="w-3.5 h-3.5 text-amber-500" />
                      <span>Win-Back Offer for Lapsed Customers</span>
                    </label>
                    <input
                      type="text"
                      value={winbackOffer}
                      onChange={(e) => setWinbackOffer(e.target.value)}
                      placeholder="e.g. Complimentary Belgian Waffle on your next visit"
                      className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 bg-white text-slate-900 focus:outline-none focus:border-[#0F172A]"
                    />
                    <p className="text-[10px] text-slate-400 mt-1">
                      Automatically sent via WhatsApp to bring back customers who haven&apos;t visited in a while.
                    </p>
                  </div>
                </div>
              )}

              {/* STEP 3: THEME & PASS BRANDING */}
              {activeStep === 3 && (
                <div className="space-y-4 animate-in fade-in duration-200">
                  <div>
                    <h3 className="font-display font-bold text-base text-slate-900 flex items-center gap-2">
                      <Palette className="w-4 h-4 text-purple-600" />
                      <span>Theme &amp; Digital Pass Aesthetics</span>
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Pick a 1-click theme preset or choose custom icons for your pass.
                    </p>
                  </div>

                  {/* 1-Click Thematic Presets */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      1-Click Theme Presets
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {THEME_PRESETS.map((p) => {
                        const isSelected = selectedPreset === p.id;
                        return (
                          <button
                            key={p.id}
                            type="button"
                            onClick={() => handleApplyPreset(p.id)}
                            className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-1 ${
                              isSelected
                                ? 'bg-slate-900 text-white border-slate-900 shadow-md ring-2 ring-slate-900'
                                : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-xl">{p.emoji}</span>
                              {isSelected && (
                                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                              )}
                            </div>
                            <div>
                              <div className="font-display font-bold text-xs truncate">
                                {p.name}
                              </div>
                              <div className={`text-[10px] truncate ${isSelected ? 'text-slate-300' : 'text-slate-400'}`}>
                                {p.subtitle}
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Stamp Icon Selector */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Stamp Icon Type
                    </label>
                    <div className="grid grid-cols-4 sm:grid-cols-6 gap-1.5">
                      {STAMP_ICONS.map((iconItem) => {
                        const isSelected = stampIcon === iconItem.id;
                        return (
                          <button
                            key={iconItem.id}
                            type="button"
                            onClick={() => {
                              sound.playStampPop();
                              setStampIcon(iconItem.id);
                            }}
                            className={`p-2 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center gap-0.5 ${
                              isSelected
                                ? 'bg-slate-900 text-white border-slate-900 shadow-xs ring-1 ring-slate-900'
                                : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                            }`}
                          >
                            <span className="text-lg">{iconItem.icon}</span>
                            <span className="text-[9px] font-mono truncate max-w-full">
                              {iconItem.id}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Welcome Tagline / Badge */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Welcome Pass Badge
                      </label>
                      <input
                        type="text"
                        value={welcomeBadge}
                        onChange={(e) => setWelcomeBadge(e.target.value)}
                        placeholder="e.g. VIP Loyalty Pass"
                        className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 bg-white text-slate-900 focus:outline-none focus:border-[#0F172A]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Pass Tagline
                      </label>
                      <input
                        type="text"
                        value={welcomeTagline}
                        onChange={(e) => setWelcomeTagline(e.target.value)}
                        placeholder="Collect stamps on every visit"
                        className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 bg-white text-slate-900 focus:outline-none focus:border-[#0F172A]"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Bottom Form Navigation Buttons */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-200/80">
                {activeStep > 1 ? (
                  <button
                    type="button"
                    onClick={() => {
                      sound.playClick();
                      setActiveStep((prev) => (prev - 1) as 1 | 2);
                    }}
                    className="px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-xs font-bold text-slate-700 transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Back</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleDismiss}
                    className="text-xs text-slate-400 hover:text-slate-600 underline cursor-pointer"
                  >
                    Skip for now
                  </button>
                )}

                {activeStep < 3 ? (
                  <button
                    type="button"
                    onClick={() => {
                      sound.playClick();
                      setActiveStep((prev) => (prev + 1) as 2 | 3);
                    }}
                    className="px-5 py-2.5 rounded-xl bg-[#0F172A] hover:bg-black text-white text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer ml-auto"
                  >
                    <span>Next: {activeStep === 1 ? 'Rewards' : 'Theme'}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleSaveAndLaunch}
                    disabled={isSubmitting}
                    className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 active:scale-[0.99] text-white text-xs font-bold tracking-wide uppercase transition-all shadow-md flex items-center gap-2 cursor-pointer ml-auto disabled:opacity-60"
                  >
                    {isSubmitting ? (
                      <span className="flex items-center gap-2">
                        <div className="w-3.5 h-3.5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                        <span>Launching Pass...</span>
                      </span>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 text-amber-300" />
                        <span>Save &amp; Launch Loyalty Pass 🚀</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>

            {/* RIGHT COLUMN: Interactive Live Customer Digital Pass Simulation (5 Cols) */}
            <div className="lg:col-span-5 bg-slate-100/90 rounded-3xl p-4 sm:p-5 border border-slate-200/80 space-y-3">
              <div className="flex items-center justify-between">
                <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                  <Smartphone className="w-3.5 h-3.5 text-slate-700" />
                  <span>Live Customer Pass Preview</span>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-white text-slate-700 text-[9px] font-mono font-bold border border-slate-200">
                  REAL-TIME SYNC
                </span>
              </div>

              {/* Simulated Customer Wallet Pass Card */}
              <div
                className="rounded-3xl p-5 text-white shadow-xl space-y-4 transition-all duration-300 relative overflow-hidden"
                style={{ background: previewBg }}
              >
                {/* Top Badge & Store Info */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="inline-block px-2.5 py-0.5 rounded-full bg-white/20 backdrop-blur-md text-[10px] font-mono font-bold uppercase tracking-wider text-white mb-1.5 border border-white/20">
                      {welcomeBadge || 'DIGITAL VIP PASS'}
                    </span>
                    <h4 className="font-display font-bold text-lg leading-tight drop-shadow-xs">
                      {storeName || 'Your Store Name'}
                    </h4>
                    <p className="text-[11px] text-white/80 font-medium">
                      {category} • {city || 'Bangalore'}
                    </p>
                  </div>

                  <div className="w-10 h-10 rounded-2xl bg-white/15 backdrop-blur-md border border-white/30 flex items-center justify-center text-xl shrink-0">
                    {selectedIconData.icon}
                  </div>
                </div>

                {/* Stamp Collection Grid Simulation */}
                <div className="bg-black/20 backdrop-blur-md rounded-2xl p-3.5 border border-white/10 space-y-2.5">
                  <div className="flex items-center justify-between text-[11px] font-mono">
                    <span className="text-white/80">Active Stamp Card</span>
                    <span className="font-bold text-amber-300">
                      2 of {stampsNeeded} collected
                    </span>
                  </div>

                  <div className="grid grid-cols-4 gap-2">
                    {Array.from({ length: stampsNeeded }).map((_, idx) => {
                      const isStamped = idx < 2;
                      const isGrandTarget = idx === stampsNeeded - 1;

                      return (
                        <div
                          key={idx}
                          className={`aspect-square rounded-xl flex flex-col items-center justify-center transition-all ${
                            isStamped
                              ? 'bg-amber-400 text-slate-950 font-bold shadow-md scale-[1.03]'
                              : isGrandTarget
                              ? 'border-2 border-dashed border-amber-300/80 bg-amber-400/20 text-amber-200'
                              : 'bg-white/10 text-white/40 border border-white/10'
                          }`}
                        >
                          {isStamped ? (
                            <span className="text-lg">{selectedIconData.icon}</span>
                          ) : isGrandTarget ? (
                            <Gift className="w-4 h-4 text-amber-300 animate-pulse" />
                          ) : (
                            <span className="text-xs font-mono font-bold opacity-60">
                              {idx + 1}
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Grand Reward Teaser Box */}
                <div className="p-3 rounded-2xl bg-white/15 backdrop-blur-md border border-white/20 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center shrink-0 shadow-xs">
                    <Star className="w-4 h-4 fill-current" />
                  </div>
                  <div className="text-left flex-1 min-w-0">
                    <div className="text-[11px] font-bold truncate">
                      {rewardTitle || 'Free Specialty Beverage'}
                    </div>
                    <div className="text-[10px] text-white/80 truncate">
                      Earned at {stampsNeeded} stamps • Min. bill ₹{minOrder}
                    </div>
                  </div>
                </div>
              </div>

              {/* Helpful Onboarding Feature Badges */}
              <div className="grid grid-cols-2 gap-2 text-left pt-1">
                <div className="p-2.5 rounded-2xl bg-white border border-slate-200/80 flex items-start gap-2">
                  <QrCode className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div className="text-[10px] text-slate-600 leading-tight">
                    <strong className="text-slate-800 block mb-0.5">Counter QR Stand</strong>
                    Printable PDF ready instantly
                  </div>
                </div>
                <div className="p-2.5 rounded-2xl bg-white border border-slate-200/80 flex items-start gap-2">
                  <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                  <div className="text-[10px] text-slate-600 leading-tight">
                    <strong className="text-slate-800 block mb-0.5">Zero App Install</strong>
                    Opens directly in Safari &amp; Chrome
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}

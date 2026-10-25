'use client';

// ============================================================================
// REVA (reva.in) — Restaurant & Cafe Owner Dashboard (/dashboard)
// 100% Plain English, Zero-Confusion Interface for Store Owners
// Crystal-clear terms: "Extra Sales Made", "Offers Sent", "Customers Returned"
// ============================================================================

import React, { useState, useEffect, useRef, useCallback, useMemo, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import confetti from 'canvas-confetti';
import { QRCodeSVG } from 'qrcode.react';
import {
  TrendingUp,
  MessageSquare,
  Users,
  QrCode,
  Gift,
  Zap,
  CheckCircle2,
  Clock,
  Search,
  Send,
  Printer,
  Sparkles,
  Download,
  Copy,
  Store,
  ChevronRight,
  RefreshCw,
  PlusCircle,
  Coffee,
  Check,
  CheckCheck,
  Percent,
  ArrowRight,
  ExternalLink,
  ChevronDown,
  Smartphone,
  HelpCircle,
  Receipt,
  ArrowLeft,
  UserPlus,
  Award,
  Star,
  X,
  User,
  Trash2,
  Plus,
  Flame,
  Tag,
  LogOut,
  Shield,
  ShieldCheck,
  ShieldAlert,
  CreditCard,
  Settings,
  Palette,
  Edit2,
  Edit3,
  Calendar,
  Sliders,
  MoreVertical,
  Camera,
  UploadCloud,
  Eye,
  MapPin,
  Globe,
  Mail,
  Phone,
  Building2,
  Bell,
  Volume2,
  VolumeX,
  Share2,
  UtensilsCrossed,
  BarChart3,
  LayoutDashboard,
  XCircle,
} from 'lucide-react';

const InstagramIcon = ({ className = 'w-4 h-4' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
  </svg>
);
import {
  Business,
  WhatsAppLog,
  Membership,
  StoreOffer,
  ThemeConfig,
  StampIconType,
  CardGradientType,
  PageBgTone,
  CardRadiusType,
  RewardClaimed,
  StampActivityLog,
} from '@/types/database';
import {
  THEME_PRESETS,
  STAMP_ICONS,
  PAGE_BG_TONES,
  CARD_GRADIENTS,
  resolvePassBackground,
  resolvePageBackground,
} from '@/lib/theme-presets';
import { sound } from '@/lib/sound';

function formatRedeemedDate(isoStr?: string) {
  if (!isoStr) return 'Previously redeemed';
  try {
    const d = new Date(isoStr);
    const datePart = d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    const timePart = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    return `${datePart} • ${timePart}`;
  } catch {
    return isoStr;
  }
}

function formatStampAuditDate(isoStr?: string) {
  if (!isoStr) return '—';
  try {
    const d = new Date(isoStr);
    const now = new Date();
    const isToday = d.toDateString() === now.toDateString();
    const timePart = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', second: '2-digit', hour12: true });
    if (isToday) {
      return `Today at ${timePart}`;
    }
    const datePart = d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    return `${datePart} at ${timePart}`;
  } catch {
    return isoStr;
  }
}
import { supabase, signOutUser } from '@/lib/supabase';
import { openRazorpayCheckout } from '@/lib/razorpay-client';
import BusinessSetupModal from '@/components/BusinessSetupModal';
import SettingsSection from '@/components/SettingsSection';
import PrivacySecurityModal from '@/components/PrivacySecurityModal';
import CounterQrStandModal from '@/components/CounterQrStandModal';
import CropLogoModal from '@/components/CropLogoModal';
import { getPublicOrigin } from '@/lib/public-url';
import {
  getPlanUpgradeDetails,
  getSubscriptionRemainingInfo,
  PLAN_PRICING,
  SubscriptionPlanType,
} from '@/lib/razorpay';
import { SUBSCRIPTION_ENABLED, getGrowRestaurantWhatsAppUrl } from '@/lib/config';

const PRESET_STOREFRONT_PHOTOS = [
  { label: 'Artisan Cafe', url: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=400&auto=format&fit=crop&q=80', desc: 'Warm cozy coffee shop' },
  { label: 'Modern Bistro', url: 'https://images.unsplash.com/photo-1559925393-8be0ec4767c8?w=400&auto=format&fit=crop&q=80', desc: 'Sleek wood & cafe plants' },
  { label: 'Matcha & Tea Bar', url: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=400&auto=format&fit=crop&q=80', desc: 'Zen Japanese tea lounge' },
  { label: 'Bakery & Bread', url: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400&auto=format&fit=crop&q=80', desc: 'Golden crust sourdough' },
  { label: 'Espresso Bar', url: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=400&auto=format&fit=crop&q=80', desc: 'Roastery & counter' },
  { label: 'Salon & Spa', url: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=400&auto=format&fit=crop&q=80', desc: 'Luxury wellness salon' },
];

function OwnerDashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlBusinessId = searchParams.get('businessId');
  const isNewStore = searchParams.get('new') === 'true';

  const [authUser, setAuthUser] = useState<{ email?: string; id?: string } | null>(null);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [showSetupModal, setShowSetupModal] = useState(false);
  const [isQrStandModalOpen, setIsQrStandModalOpen] = useState(false);

  // Store & Pass Customization Modal State
  const [showCustomizationModal, setShowCustomizationModal] = useState(false);
  const [modalActiveSubtab, setModalActiveSubtab] = useState<'theme' | 'rules'>('theme');
  const [previewActiveTab, setPreviewActiveTab] = useState<'pass' | 'offers' | 'visits'>('pass');
  const [customStoreName, setCustomStoreName] = useState('');
  const [customStoreSlug, setCustomStoreSlug] = useState('');
  const [customBrandColor, setCustomBrandColor] = useState('#0F172A');
  const [customLogoUrl, setCustomLogoUrl] = useState('');
  const [customStampsNeeded, setCustomStampsNeeded] = useState(6);
  const [customRewardTitle, setCustomRewardTitle] = useState('');
  const [customMinOrder, setCustomMinOrder] = useState('150');
  const [customAvgSpend, setCustomAvgSpend] = useState('250');
  const [customWinbackOffer, setCustomWinbackOffer] = useState('');

  // Theme & UI Customization State
  const [customThemePreset, setCustomThemePreset] = useState<string>('warm_latte');
  const [customStampIcon, setCustomStampIcon] = useState<StampIconType>('coffee');
  const [customCardGradient, setCustomCardGradient] = useState<CardGradientType>('mocha_roast');
  const [customPageBgTone, setCustomPageBgTone] = useState<PageBgTone>('warm_ivory');
  const [customPageBgHex, setCustomPageBgHex] = useState<string>('#FAF7F2');
  const [customCardRadius, setCustomCardRadius] = useState<CardRadiusType>('rounded_squircle');
  const [customWelcomeBadge, setCustomWelcomeBadge] = useState<string>('');
  const [customWelcomeTagline, setCustomWelcomeTagline] = useState<string>('Collect stamps on fresh brews and handcrafted sourdough');

  const [isSavingCustomization, setIsSavingCustomization] = useState(false);
  const [customizationSuccess, setCustomizationSuccess] = useState(false);
  const [showAdvancedThemeOptions, setShowAdvancedThemeOptions] = useState(false);

  // Storefront Image / Profile Picture Upload State
  const [settingsLogoUrl, setSettingsLogoUrl] = useState('');
  const [isUploadingStoreImage, setIsUploadingStoreImage] = useState(false);
  const [storeImageSavedToast, setStoreImageSavedToast] = useState(false);
  const [showCropPhotoModal, setShowCropPhotoModal] = useState(false);
  const [cropImageRawSrc, setCropImageRawSrc] = useState('');
  const [isSavingCrop, setIsSavingCrop] = useState(false);
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);
  const [showProfilePrivacyModal, setShowProfilePrivacyModal] = useState(false);
  const [showPhoneVerifyModal, setShowPhoneVerifyModal] = useState(false);
  const [verifyPhoneInput, setVerifyPhoneInput] = useState('');
  const [isVerifyPhoneLoading, setIsVerifyPhoneLoading] = useState(false);
  const [verifyPhoneError, setVerifyPhoneError] = useState<string | null>(null);
  const [verifyPhoneSuccess, setVerifyPhoneSuccess] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const modalFileInputRef = useRef<HTMLInputElement>(null);

  const [businesses, setBusinesses] = useState<Business[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      const cached = sessionStorage.getItem('reva_cached_dashboard');
      if (cached) {
        const parsed = JSON.parse(cached);
        return parsed.allBusinesses || (parsed.business ? [parsed.business] : []);
      }
    } catch {}
    return [];
  });

  const [selectedBusiness, setSelectedBusiness] = useState<Business | null>(() => {
    if (typeof window === 'undefined') return null;
    try {
      const cached = sessionStorage.getItem('reva_cached_dashboard');
      if (cached) {
        const parsed = JSON.parse(cached);
        return parsed.business || null;
      }
    } catch {}
    return null;
  });

  const [loading, setLoading] = useState<boolean>(() => {
    if (typeof window === 'undefined') return true;
    try {
      const cached = sessionStorage.getItem('reva_cached_dashboard');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed.business) return false;
      }
    } catch {}
    return true;
  });
  const [activeTab, setActiveTab] = useState<'home' | 'reward' | 'stats' | 'profile' | 'settings'>('home');

  const [stampTimeRange, setStampTimeRange] = useState<'today' | '7d' | '30d' | 'all'>('today');

  // Dashboard metrics state
  const [metrics, setMetrics] = useState<{
    totalRecoveredRevenue: number;
    convertedCount: number;
    totalNudgesSent: number;
    conversionRate: number;
    totalMembers: number;
    atRiskCount: number;
    todayScansCount: number;
    todayCounterCount?: number;
    todayCounterStamps?: number;
    todayStampsCount?: number;
    totalRewardsClaimed?: number;
    todayRewardsClaimed?: number;
    rewardsClaimedList?: RewardClaimed[];
    stampStats?: {
      today: { totalStamps: number; totalVisits: number; counterStamps: number; counterVisits: number; qrStamps: number; qrScans: number };
      sevenDays: { totalStamps: number; totalVisits: number; counterStamps: number; counterVisits: number; qrStamps: number; qrScans: number };
      thirtyDays: { totalStamps: number; totalVisits: number; counterStamps: number; counterVisits: number; qrStamps: number; qrScans: number };
      allTime: { totalStamps: number; totalVisits: number; counterStamps: number; counterVisits: number; qrStamps: number; qrScans: number };
    };
    recentLogs: WhatsAppLog[];
    recentVisits?: StampActivityLog[];
    members: Membership[];
  } | null>(() => {
    if (typeof window === 'undefined') return null;
    try {
      const cached = sessionStorage.getItem('reva_cached_dashboard');
      if (cached) {
        const parsed = JSON.parse(cached);
        return parsed.metrics || null;
      }
    } catch {}
    return null;
  });

  // Stats Sub-Tab state & Live Stamp Tracking
  const [statsActiveSection, setStatsActiveSection] = useState<'stamps' | 'crm' | 'whatsapp'>('stamps');
  const [stampSearch, setStampSearch] = useState('');
  const [stampSourceFilter, setStampSourceFilter] = useState<'all' | 'qr' | 'cashier'>('all');

  const filteredStampActivity = useMemo(() => {
    let list: StampActivityLog[] = metrics?.recentVisits || [];
    if (stampSourceFilter === 'qr') {
      list = list.filter((v) => v.is_qr);
    } else if (stampSourceFilter === 'cashier') {
      list = list.filter((v) => !v.is_qr);
    }
    if (stampSearch.trim()) {
      const q = stampSearch.toLowerCase().trim();
      list = list.filter((v) =>
        (v.customer_name && v.customer_name.toLowerCase().includes(q)) ||
        (v.customer_phone && v.customer_phone.includes(q)) ||
        (v.reward_title && v.reward_title.toLowerCase().includes(q)) ||
        (v.staff_note && v.staff_note.toLowerCase().includes(q))
      );
    }
    return list;
  }, [metrics?.recentVisits, stampSourceFilter, stampSearch]);

  // Rewards Given Log state
  const [rewardsSearch, setRewardsSearch] = useState('');
  const [rewardsTimeFilter, setRewardsTimeFilter] = useState<'all' | 'today' | '7d' | '30d'>('all');
  const [rewardsPage, setRewardsPage] = useState(1);
  const REWARDS_PER_PAGE = 10;

  const filteredRewardsList = useMemo(() => {
    let list = metrics?.rewardsClaimedList || [];

    // Filter by time range
    if (rewardsTimeFilter !== 'all') {
      const now = new Date();
      if (rewardsTimeFilter === 'today') {
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
        list = list.filter((r) => new Date(r.claimed_at).getTime() >= startOfToday);
      } else if (rewardsTimeFilter === '7d') {
        const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
        list = list.filter((r) => new Date(r.claimed_at).getTime() >= sevenDaysAgo);
      } else if (rewardsTimeFilter === '30d') {
        const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
        list = list.filter((r) => new Date(r.claimed_at).getTime() >= thirtyDaysAgo);
      }
    }

    // Filter by search query
    if (rewardsSearch.trim()) {
      const q = rewardsSearch.toLowerCase();
      list = list.filter((r) => {
        const name = (r.customer?.name || '').toLowerCase();
        const phone = (r.customer?.phone || '').toLowerCase();
        const desc = (r.reward_desc || '').toLowerCase();
        return name.includes(q) || phone.includes(q) || desc.includes(q);
      });
    }

    return list;
  }, [metrics?.rewardsClaimedList, rewardsSearch, rewardsTimeFilter]);

  const totalRewardPages = Math.ceil(filteredRewardsList.length / REWARDS_PER_PAGE) || 1;
  const paginatedRewardsList = useMemo(() => {
    const start = (rewardsPage - 1) * REWARDS_PER_PAGE;
    return filteredRewardsList.slice(start, start + REWARDS_PER_PAGE);
  }, [filteredRewardsList, rewardsPage]);

  // Win-Back & Direct WhatsApp state
  const [isRunningWinback, setIsRunningWinback] = useState(false);
  const [winbackFeedback, setWinbackFeedback] = useState<string | null>(null);
  const [showInactiveList, setShowInactiveList] = useState(true);
  const [showRecentOffersDropdown, setShowRecentOffersDropdown] = useState(false);
  const [sentNudges, setSentNudges] = useState<Record<string, boolean>>({});
  const [animatingSentIds, setAnimatingSentIds] = useState<Record<string, 'sent' | 'sliding'>>({});
  const [dismissedOverdueIds, setDismissedOverdueIds] = useState<Record<string, boolean>>({});
  const [origin, setOrigin] = useState<string>('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setOrigin(window.location.origin);
      try {
        const savedNudges = localStorage.getItem('reva_sent_nudges');
        if (savedNudges) setSentNudges(JSON.parse(savedNudges));
      } catch {}
      try {
        const savedDismissed = localStorage.getItem('reva_dismissed_overdue');
        if (savedDismissed) setDismissedOverdueIds(JSON.parse(savedDismissed));
      } catch {}
    }
  }, []);

  // CRM Search & Filter state
  const [crmSearch, setCrmSearch] = useState('');
  const [crmFilter, setCrmFilter] = useState<'all' | 'at_risk' | 'converted' | 'regular'>('all');

  // Give Stamps at Counter (Fast 2-Step Flow) state
  const [counterSearch, setCounterSearch] = useState('');
  const [selectedCounterMember, setSelectedCounterMember] = useState<Membership | null>(null);
  const [counterStampsToAward, setCounterStampsToAward] = useState(1);
  const [counterSpendAmount, setCounterSpendAmount] = useState('250');
  const [isNewWalkInMode, setIsNewWalkInMode] = useState(false);
  const [walkInPhone, setWalkInPhone] = useState('');
  const [walkInName, setWalkInName] = useState('');
  const [isCounterSubmitting, setIsCounterSubmitting] = useState(false);
  const [counterFeedback, setCounterFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
    wasRewardUnlocked?: boolean;
    wasWinBackConverted?: boolean;
    newStamps?: number;
    stampsNeeded?: number;
  } | null>(null);

  // Printable QR Stand Customizer state
  const [standTagline, setStandTagline] = useState('Scan to get your 6th drink FREE!');
  const [standSubtext, setStandSubtext] = useState('No app download. Takes 5 seconds.');
  const [isDownloadingStand, setIsDownloadingStand] = useState(false);
  const [standDownloadSuccess, setStandDownloadSuccess] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const qrRef = useRef<HTMLDivElement>(null);

  // Settings State & Clean Dashboard Card Models
  const [settingsSubTab, setSettingsSubTab] = useState<'profile' | 'pass' | 'billing'>('profile');
  const [settingsCafeName, setSettingsCafeName] = useState('');
  const [settingsCategory, setSettingsCategory] = useState('Specialty Cafe & Bakery');
  const [settingsStamps, setSettingsStamps] = useState(6);
  const [settingsRewardTitle, setSettingsRewardTitle] = useState('');
  const [settingsOfferText, setSettingsOfferText] = useState('');
  const [settingsAvgSpend, setSettingsAvgSpend] = useState(250);
  const [settingsMinOrder, setSettingsMinOrder] = useState(150);
  const [settingsRewardExpiryDays, setSettingsRewardExpiryDays] = useState(60);
  const [settingsGoogleReviewUrl, setSettingsGoogleReviewUrl] = useState('');
  const [settingsInstagramUrl, setSettingsInstagramUrl] = useState('');
  const [settingsAddress, setSettingsAddress] = useState('');
  const [settingsArea, setSettingsArea] = useState('');
  const [settingsCity, setSettingsCity] = useState('');
  const [settingsMapsUrl, setSettingsMapsUrl] = useState('');
  const [settingsPhone, setSettingsPhone] = useState('');
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [settingsSavedSuccess, setSettingsSavedSuccess] = useState(false);
  const [rewardRulesSavedSuccess, setRewardRulesSavedSuccess] = useState(false);
  const [settingsMidwayOfferTitle, setSettingsMidwayOfferTitle] = useState('');
  const [settingsMidwayStamps, setSettingsMidwayStamps] = useState(3);

  // Hero Banner & Branding State
  const [settingsTagline, setSettingsTagline] = useState('Bihari Sab Pe Bhari');
  const [settingsDescription, setSettingsDescription] = useState('This is a restaurant where pure taste meets heartwarming hospitality.');
  const [settingsBadge1, setSettingsBadge1] = useState('10% Vegetarian Options');
  const [settingsBadge2, setSettingsBadge2] = useState('Organic Ingredients');

  // Notification Toggles State
  const [notifOrderAlerts, setNotifOrderAlerts] = useState(true);
  const [notifScanAlerts, setNotifScanAlerts] = useState(true);
  const [notifSoundEffects, setNotifSoundEffects] = useState(true);
  const [notifDailySummary, setNotifDailySummary] = useState(true);
  const [notifWinbackAlerts, setNotifWinbackAlerts] = useState(true);

  // Clean Edit Modals State
  const [showGeneralEditModal, setShowGeneralEditModal] = useState(false);
  const [showHeroBannerEditModal, setShowHeroBannerEditModal] = useState(false);
  const [showLoyaltyEditModal, setShowLoyaltyEditModal] = useState(false);
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [showStandStudioModal, setShowStandStudioModal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);

  // Create Reward / Offer Modal State (Set: "At X Stamps -> Get Y Reward")
  const [showCreateOfferModal, setShowCreateOfferModal] = useState(false);
  const [newOfferStamps, setNewOfferStamps] = useState<number | ''>(3);
  const [newOfferTitle, setNewOfferTitle] = useState('');
  const [newOfferBadge, setNewOfferBadge] = useState('3 Stamps Milestone');
  const [newOfferDesc, setNewOfferDesc] = useState('');
  const [newOfferIcon, setNewOfferIcon] = useState<'flame' | 'star' | 'gift' | 'coffee' | 'tag' | 'sparkles'>('gift');
  const [newOfferExpiryDays, setNewOfferExpiryDays] = useState('30');
  const [isCreatingOffer, setIsCreatingOffer] = useState(false);

  // Edit Milestone Reward Modal State
  const [showEditOfferModal, setShowEditOfferModal] = useState(false);
  const [editingOffer, setEditingOffer] = useState<StoreOffer | null>(null);
  const [editOfferStamps, setEditOfferStamps] = useState<number | ''>(3);
  const [editOfferTitle, setEditOfferTitle] = useState('');
  const [editOfferBadge, setEditOfferBadge] = useState('');
  const [editOfferDesc, setEditOfferDesc] = useState('');
  const [editOfferIcon, setEditOfferIcon] = useState<'flame' | 'star' | 'gift' | 'coffee' | 'tag' | 'sparkles'>('gift');
  const [editOfferExpiryDays, setEditOfferExpiryDays] = useState('30');
  const [isEditingOffer, setIsEditingOffer] = useState(false);
  const [isDeletingOfferId, setIsDeletingOfferId] = useState<string | null>(null);

  // --- Verify Reward on Dashboard Home State ---
  const [verifyRewardCode, setVerifyRewardCode] = useState('');
  const [isVerifyingReward, setIsVerifyingReward] = useState(false);
  const [isConfirmingRedemption, setIsConfirmingRedemption] = useState(false);
  const [rewardVerificationState, setRewardVerificationState] = useState<{
    status: 'idle' | 'PENDING' | 'ALREADY_REDEEMED' | 'INVALID' | 'CONFIRMED_SUCCESS';
    claim?: RewardClaimed;
    message?: string;
  }>({ status: 'idle' });

  const isBusinessSetupDone = useCallback((biz?: Business | null): boolean => {
    if (!biz) return false;
    if (
      biz.is_setup_completed ||
      biz.theme_config?.is_setup_completed ||
      biz.reward_rule?.theme_config?.is_setup_completed ||
      (biz.reward_rule as any)?.is_setup_completed
    ) {
      return true;
    }
    try {
      if (
        localStorage.getItem(`reva_setup_done_${biz.id}`) === 'true' ||
        localStorage.getItem('reva_setup_done') === 'true'
      ) {
        return true;
      }
    } catch {}
    return false;
  }, []);

  // 1. Load Initial Business & Metrics with Strict Multi-Tenant Isolation
  async function loadDashboardData(businessId?: string, overrideUserId?: string) {
    try {
      if (!selectedBusiness) {
        setLoading(true);
      }
      const uid = overrideUserId || authUser?.id;
      const params = new URLSearchParams();
      if (businessId) params.set('businessId', businessId);
      if (uid) params.set('userId', uid);
      params.set('_t', Date.now().toString());

      const url = `/api/dashboard${params.toString() ? `?${params.toString()}` : ''}`;
      const res = await fetch(url, {
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache, no-store, must-revalidate' },
      });
      const data = await res.json();

      if (data.success) {
        setBusinesses(data.allBusinesses || []);
        const active =
          (data.allBusinesses || []).find(
            (b: Business) => b.id === (businessId || data.metrics?.business?.id)
          ) || data.metrics?.business;
        setSelectedBusiness(active);
        setMetrics(data.metrics);

        // Synchronize sentNudges and dismissedOverdueIds from live database logs
        if (data.metrics) {
          const sentMap: Record<string, boolean> = {};
          const dismissedMap: Record<string, boolean> = {};

          (data.metrics.recentLogs || []).forEach((l: any) => {
            if (l.membership_id && !l.converted) {
              sentMap[l.membership_id] = true;
              dismissedMap[l.membership_id] = true;
            }
          });

          (data.metrics.members || []).forEach((m: any) => {
            if (m.has_active_nudge) {
              sentMap[m.id] = true;
              dismissedMap[m.id] = true;
            }
          });

          setSentNudges((prev) => {
            const merged = { ...prev, ...sentMap };
            try { localStorage.setItem('reva_sent_nudges', JSON.stringify(merged)); } catch {}
            return merged;
          });

          setDismissedOverdueIds((prev) => {
            const merged = { ...prev, ...dismissedMap };
            try { localStorage.setItem('reva_dismissed_overdue', JSON.stringify(merged)); } catch {}
            return merged;
          });
        }

        // Cache for 0ms instant load on future navigation
        try {
          sessionStorage.setItem(
            'reva_cached_dashboard',
            JSON.stringify({
              business: active,
              metrics: data.metrics,
              allBusinesses: data.allBusinesses || [],
              timestamp: Date.now(),
            })
          );
        } catch {}

        if (active) {
          // Sync settings form
          setSettingsCafeName(active.name || '');
          setSettingsCategory(active.category || (active.reward_rule as any)?.category || 'Specialty Cafe & Bakery');
          setSettingsStamps(active.reward_rule?.stamps_needed || 6);
          setSettingsRewardTitle(active.reward_rule?.reward_title || '');
          setSettingsOfferText(active.winback_offer_text || '');
          setSettingsAvgSpend(active.avg_spend_per_visit || 250);
          setSettingsMinOrder(active.reward_rule?.min_order_for_stamp || active.min_order_for_stamp || 150);
          setSettingsRewardExpiryDays(active.reward_rule?.expiry_days !== undefined ? active.reward_rule.expiry_days : 60);

          const milestone = (active.active_offers as any[])?.find((o: any) => (o.stamps_needed || 0) < (active.reward_rule?.stamps_needed || 6));
          if (milestone) {
            setSettingsMidwayOfferTitle(milestone.title || '');
            setSettingsMidwayStamps(milestone.stamps_needed || Math.max(1, Math.floor((active.reward_rule?.stamps_needed || 6) / 2)));
          } else {
            setSettingsMidwayOfferTitle('');
            setSettingsMidwayStamps(Math.max(1, Math.floor((active.reward_rule?.stamps_needed || 6) / 2)));
          }

          setSettingsGoogleReviewUrl(active.google_review_url || (active.reward_rule as any)?.google_review_url || '');
          setSettingsInstagramUrl(active.instagram_url || (active.reward_rule as any)?.instagram_url || '');
          setSettingsAddress(active.address || (active.reward_rule as any)?.address || '');
          setSettingsArea(active.area || (active.reward_rule as any)?.area || '');
          setSettingsCity(active.city || (active.reward_rule as any)?.city || '');
          setSettingsMapsUrl(active.maps_url || (active.reward_rule as any)?.maps_url || '');
          setSettingsPhone(active.phone || (active.reward_rule as any)?.phone || '');
          setSettingsLogoUrl(active.logo_url || '');

          const currentTheme = active.theme_config || active.reward_rule?.theme_config;
          setSettingsTagline(currentTheme?.custom_tagline || 'Bihari Sab Pe Bhari');
          setSettingsDescription(currentTheme?.description || active.reward_rule?.reward_desc || 'This is a restaurant where pure taste meets heartwarming hospitality.');
          setSettingsBadge1(currentTheme?.badge_1 || currentTheme?.welcome_badge || '10% Vegetarian Options');
          setSettingsBadge2(currentTheme?.badge_2 || 'Organic Ingredients');
          setNotifOrderAlerts(currentTheme?.order_alerts_enabled ?? true);
          setNotifScanAlerts(currentTheme?.menu_scan_alerts_enabled ?? true);
          setNotifSoundEffects(currentTheme?.sound_enabled ?? true);
          setNotifDailySummary(currentTheme?.daily_summary_enabled ?? true);
          setNotifWinbackAlerts(currentTheme?.auto_winback_enabled ?? true);

          // Sync customization modal fields
          setCustomStoreName(active.name || '');
          setCustomStoreSlug(active.slug || '');
          setCustomBrandColor(currentTheme?.card_bg_color || active.brand_color || '#0F172A');
          setCustomLogoUrl(active.logo_url || '');
          setCustomStampsNeeded(active.reward_rule?.stamps_needed || 6);
          setCustomRewardTitle(active.reward_rule?.reward_title || '');
          setCustomMinOrder(String(active.reward_rule?.min_order_for_stamp || active.min_order_for_stamp || 150));
          setCustomAvgSpend(String(active.avg_spend_per_visit || 250));
          setCustomWinbackOffer(active.winback_offer_text || '');

          setCustomThemePreset(currentTheme?.preset || 'warm_latte');
          setCustomStampIcon(currentTheme?.stamp_icon || 'coffee');
          setCustomCardGradient(currentTheme?.card_gradient || 'mocha_roast');
          setCustomPageBgTone(currentTheme?.page_bg_tone || 'warm_ivory');
          setCustomPageBgHex(currentTheme?.custom_page_bg || (currentTheme?.page_bg_tone === 'warm_ivory' ? '#FAF7F2' : ''));
          setCustomCardRadius(currentTheme?.card_radius || 'rounded_squircle');
          setCustomWelcomeBadge(currentTheme?.welcome_badge || '');
          setCustomWelcomeTagline(currentTheme?.custom_tagline || 'Collect stamps & unlock treats!');

          // One-Time Setup Trigger: If setup is completed
          const isSetupDone = isBusinessSetupDone(active);

          let isLocallyDone = false;
          try {
            isLocallyDone =
              localStorage.getItem(`reva_setup_done_${active.id}`) === 'true' ||
              localStorage.getItem('reva_setup_done') === 'true' ||
              localStorage.getItem(`reva_setup_dismissed_${active.id}`) === 'true';
          } catch {}

          if (isSetupDone || isLocallyDone) {
            setShowSetupModal(false);
            // If locally marked done but DB is not synced, update DB quietly
            if (isLocallyDone && !active.is_setup_completed && active.id) {
              fetch(`/api/businesses/${active.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ is_setup_completed: true }),
              }).catch(() => {});
            }
            // Clean URL query parameters so refreshing never pops up again
            if (typeof window !== 'undefined' && (searchParams.get('setup') || searchParams.get('new'))) {
              window.history.replaceState({}, '', `/dashboard?businessId=${active.id}`);
            }
          } else {
            setShowSetupModal(true);
          }
        }
      } else {
        // If user is unauthenticated, redirect to login (NEVER /c)
        if (res.status === 401 || !data?.success) {
          router.replace('/login');
          return;
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  // Helper to open and sync customization modal fields
  function openCustomizationModal() {
    if (selectedBusiness) {
      const existingTheme = selectedBusiness.theme_config || selectedBusiness.reward_rule?.theme_config;
      setCustomStoreName(selectedBusiness.name || '');
      setCustomStoreSlug(selectedBusiness.slug || '');
      setCustomBrandColor(existingTheme?.card_bg_color || selectedBusiness.brand_color || '#0F172A');
      setCustomLogoUrl(selectedBusiness.logo_url || '');
      setCustomStampsNeeded(selectedBusiness.reward_rule?.stamps_needed || 6);
      const rawReward = selectedBusiness.reward_rule?.reward_title;
      setCustomRewardTitle(rawReward && rawReward !== 'Free Specialty Beverage' ? rawReward : '');
      setCustomMinOrder(String(selectedBusiness.reward_rule?.min_order_for_stamp || selectedBusiness.min_order_for_stamp || 150));
      setCustomAvgSpend(String(selectedBusiness.avg_spend_per_visit || 250));
      setCustomWinbackOffer(selectedBusiness.winback_offer_text || '');

      setCustomThemePreset(existingTheme?.preset || 'warm_latte');
      setCustomStampIcon(existingTheme?.stamp_icon || 'coffee');
      setCustomCardGradient(existingTheme?.card_gradient || 'mocha_roast');
      setCustomPageBgTone(existingTheme?.page_bg_tone || 'warm_ivory');
      setCustomPageBgHex(existingTheme?.custom_page_bg || (existingTheme?.page_bg_tone === 'warm_ivory' ? '#FAF7F2' : ''));
      setCustomCardRadius(existingTheme?.card_radius || 'rounded_squircle');
      setCustomWelcomeBadge(existingTheme?.welcome_badge || '');
      setCustomWelcomeTagline(existingTheme?.custom_tagline || 'Collect stamps & unlock treats!');
    }
    setModalActiveSubtab('theme');
    setPreviewActiveTab('pass');
    setShowCustomizationModal(true);
  }

  // Helper to apply ready-made theme preset
  function handleApplyThemePreset(presetId: string) {
    const preset = THEME_PRESETS.find((p) => p.id === presetId);
    if (!preset) return;
    sound.playStampPop();
    setCustomThemePreset(preset.id);
    setCustomStampIcon(preset.config.stamp_icon || 'paw');
    setCustomCardGradient(preset.config.card_gradient || 'cat_pastel');
    setCustomPageBgTone(preset.config.page_bg_tone || 'soft_rose');
    setCustomPageBgHex(preset.config.custom_page_bg || '');
    setCustomBrandColor(preset.config.card_bg_color || '#0F172A');
    setCustomCardRadius(preset.config.card_radius || 'rounded_squircle');
    setCustomWelcomeBadge(preset.config.welcome_badge || '');
    setCustomWelcomeTagline(preset.config.custom_tagline || '');
  }

  // Handle Save Store & Pass Customization
  async function handleSaveCustomization(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedBusiness) return;
    try {
      setIsSavingCustomization(true);
      sound.playClick();
      const cleanSlug = customStoreSlug
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9-]+/g, '-')
        .replace(/(^-|-$)/g, '');

      const stamps = Math.min(8, Math.max(1, Number(customStampsNeeded) || 6));
      const rewardTitle = customRewardTitle.trim();
      const minOrder = Number(customMinOrder) || 150;

      const compiledTheme: ThemeConfig = {
        preset: customThemePreset,
        page_bg_tone: customPageBgTone,
        custom_page_bg: customPageBgHex.trim() || undefined,
        is_dark_mode: customPageBgTone === 'deep_dark' || customThemePreset === 'obsidian_luxury' || customThemePreset === 'neon_cyber',
        card_gradient: customCardGradient,
        card_bg_color: customBrandColor || '#0F172A',
        card_text_color: '#FFFFFF',
        accent_color: customBrandColor || '#0F172A',
        stamp_icon: customStampIcon,
        card_radius: customCardRadius,
        welcome_badge: customWelcomeBadge.trim() || undefined,
        custom_tagline: customWelcomeTagline.trim() || undefined,
      };

      const updatedRewardRule = {
        ...selectedBusiness.reward_rule,
        stamps_needed: stamps,
        reward_title: rewardTitle,
        min_order_for_stamp: minOrder,
        theme_config: compiledTheme,
      };

      // Synchronize active_offers so milestone rewards reflect new grand reward and stamps
      const existingOffers = selectedBusiness.active_offers || [];
      const updatedOffers = existingOffers.map((o) => {
        if (o.id === 'off_2' || (o.type === 'milestone' && (o.stamps_needed || 6) >= (selectedBusiness.reward_rule?.stamps_needed || 6))) {
          return {
            ...o,
            title: rewardTitle,
            stamps_needed: stamps,
            badge: `${stamps} Stamps Grand Reward`,
            desc: `Unlocked at ${stamps} digital stamps`,
            min_order: minOrder,
          };
        }
        return {
          ...o,
          min_order: o.min_order || minOrder,
        };
      });

      const res = await fetch(`/api/businesses/${selectedBusiness.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: customStoreName.trim() || selectedBusiness.name,
          slug: cleanSlug || selectedBusiness.slug,
          brand_color: customBrandColor || '#0F172A',
          logo_url: customLogoUrl.trim() || undefined,
          reward_rule: updatedRewardRule,
          theme_config: compiledTheme,
          active_offers: updatedOffers,
          min_order_for_stamp: minOrder,
          avg_spend_per_visit: Number(customAvgSpend) || 250,
          winback_offer_text: customWinbackOffer.trim(),
        }),
      });

      const data = await res.json();
      if (data.success) {
        sound.playRewardFanfare();
        confetti({ particleCount: 90, spread: 70, origin: { y: 0.6 } });
        setCustomizationSuccess(true);
        setTimeout(() => {
          setCustomizationSuccess(false);
          setShowCustomizationModal(false);
        }, 1200);
        await loadDashboardData(data.business?.id || selectedBusiness.id);
      } else {
        alert(data.error || 'Failed to update cafe details');
      }
    } catch {
      alert('Network error while updating store customization');
    } finally {
      setIsSavingCustomization(false);
    }
  }

  // Auth Session & Business Data Initialization
  useEffect(() => {
    let isMounted = true;
    let isInitializing = false;

    async function initSession(user: any) {
      if (isInitializing) return;
      isInitializing = true;

      // On dashboard, active session is always Business Owner
      try {
        localStorage.setItem('reva_auth_role', 'business');
        localStorage.removeItem('reva_customer_phone');
        localStorage.removeItem('reva_customer_passes');
      } catch {}

      if (!user) {
        if (urlBusinessId) {
          await loadDashboardData(urlBusinessId);
        } else {
          router.replace('/login?mode=login');
        }
        isInitializing = false;
        return;
      }

      setAuthUser({
        email: user.email,
        id: user.id,
      });

      // Evict any stale cache that belonged to a different user account
      try {
        const cached = sessionStorage.getItem('reva_cached_dashboard');
        if (cached) {
          const parsed = JSON.parse(cached);
          if (parsed.business && parsed.business.owner_id && parsed.business.owner_id !== user.id) {
            sessionStorage.removeItem('reva_cached_dashboard');
            sessionStorage.removeItem('reva_cached_business_id');
            setSelectedBusiness(null);
            setMetrics(null);
          }
        }
      } catch {}

      if (isMounted) {
        await loadDashboardData(urlBusinessId || undefined, user.id);
      }
      isInitializing = false;
    }

    let hasLoadedSession = false;

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!hasLoadedSession) {
        hasLoadedSession = true;
        initSession(session?.user || null);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' || event === 'USER_UPDATED') {
        if (session?.user && !hasLoadedSession) {
          hasLoadedSession = true;
          initSession(session.user);
        }
      } else if (event === 'SIGNED_OUT') {
        try {
          sessionStorage.removeItem('reva_cached_dashboard');
          sessionStorage.removeItem('reva_cached_business_id');
        } catch {}
        setAuthUser(null);
        setSelectedBusiness(null);
        setMetrics(null);
        if (!urlBusinessId) {
          router.replace('/login?mode=login');
        }
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [urlBusinessId, router]);

  async function handleSignOut() {
    sound.playClick();
    await signOutUser();
    setAuthUser(null);
    router.replace('/login');
  }

  // Prevent accidental logout on browser back button & handle sub-tabs/modals
  useEffect(() => {
    try {
      window.history.pushState({ page: 'dashboard', tab: activeTab }, '', window.location.href);
    } catch {}

    const handlePopState = () => {
      // 1. If any modal or dropdown is open, close it first
      const hasOpenModal =
        showCustomizationModal ||
        showPlanModal ||
        showSetupModal ||
        isQrStandModalOpen ||
        showGeneralEditModal ||
        showHeroBannerEditModal ||
        showLoyaltyEditModal ||
        showNotificationModal ||
        showStandStudioModal ||
        showPrivacyModal ||
        showCreateOfferModal ||
        showEditOfferModal ||
        showCropPhotoModal ||
        showEditProfileModal ||
        showProfilePrivacyModal ||
        showPhoneVerifyModal ||
        showUserDropdown;

      if (hasOpenModal) {
        setShowCustomizationModal(false);
        setShowPlanModal(false);
        setShowSetupModal(false);
        setIsQrStandModalOpen(false);
        setShowGeneralEditModal(false);
        setShowHeroBannerEditModal(false);
        setShowLoyaltyEditModal(false);
        setShowNotificationModal(false);
        setShowStandStudioModal(false);
        setShowPrivacyModal(false);
        setShowCreateOfferModal(false);
        setShowEditOfferModal(false);
        setShowCropPhotoModal(false);
        setShowEditProfileModal(false);
        setShowProfilePrivacyModal(false);
        setShowPhoneVerifyModal(false);
        setShowUserDropdown(false);
        try {
          window.history.pushState({ page: 'dashboard', tab: activeTab }, '', window.location.href);
        } catch {}
        return;
      }

      // 2. If on a sub-tab (reward, stats, profile, settings), go back to home tab
      if (activeTab !== 'home') {
        setActiveTab('home');
        try {
          window.history.pushState({ page: 'dashboard', tab: 'home' }, '', window.location.href);
        } catch {}
        return;
      }

      // 3. If already on home tab, stay safely on dashboard home
      try {
        window.history.pushState({ page: 'dashboard', tab: 'home' }, '', window.location.href);
      } catch {}
    };

    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [
    activeTab,
    showCustomizationModal,
    showPlanModal,
    showSetupModal,
    isQrStandModalOpen,
    showGeneralEditModal,
    showHeroBannerEditModal,
    showLoyaltyEditModal,
    showNotificationModal,
    showStandStudioModal,
    showPrivacyModal,
    showCreateOfferModal,
    showEditOfferModal,
    showCropPhotoModal,
    showEditProfileModal,
    showProfilePrivacyModal,
    showPhoneVerifyModal,
    showUserDropdown,
  ]);

  // 2. Trigger Win-Back Automation Live
  async function handleRunWinbackEngine() {
    if (!selectedBusiness) return;
    try {
      setIsRunningWinback(true);
      sound.playClick();
      const res = await fetch('/api/winback/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessId: selectedBusiness.id,
          forceIgnoreCooldown: true,
        }),
      });
      const data = await res.json();
      if (data.success) {
        sound.playRewardFanfare();
        setWinbackFeedback(
          `✓ Done! Checked your customers and sent ${data.summary.sent_count} personalized WhatsApp offers to bring them back.`
        );
        await loadDashboardData(selectedBusiness.id);
      }
    } catch {
      setWinbackFeedback('Could not send messages right now. Please try again.');
    } finally {
      setIsRunningWinback(false);
    }
  }

  // 3. Counter 2-Step Handlers
  function handleSelectCounterCustomer(m: Membership) {
    setSelectedCounterMember(m);
    setCounterFeedback(null);
    setCounterStampsToAward(1);
    setCounterSpendAmount(selectedBusiness?.avg_spend_per_visit?.toString() || '250');
    sound.playClick();
  }

  async function handleCounterAwardStamp() {
    if (!selectedBusiness || !selectedCounterMember) return;
    try {
      setIsCounterSubmitting(true);
      sound.playStampPop();

      const spend = parseFloat(counterSpendAmount) || selectedBusiness.avg_spend_per_visit || 250;
      const res = await fetch('/api/stamp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessId: selectedBusiness.id,
          membershipId: selectedCounterMember.id,
          phone: selectedCounterMember.customer?.phone,
          name: selectedCounterMember.customer?.name,
          spendAmount: spend,
          stampAwarded: counterStampsToAward,
          staffNote: `Counter Staff Awarded +${counterStampsToAward} stamp(s)`,
          source: 'counter',
        }),
      });

      const data = await res.json();
      if (data.success) {
        if (data.rewardUnlocked) {
          sound.playRewardFanfare();
          confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
        } else {
          sound.playStampPop();
        }

        setSelectedCounterMember(data.membership);
        setCounterFeedback({
          type: 'success',
          message: `✓ +${counterStampsToAward} Stamp given to ${data.membership?.customer?.name || 'customer'}!`,
          wasRewardUnlocked: data.rewardUnlocked,
          wasWinBackConverted: data.wasWinBackConverted,
          newStamps: data.membership?.stamps,
          stampsNeeded: selectedBusiness.reward_rule.stamps_needed,
        });

        await loadDashboardData(selectedBusiness.id);
      } else {
        setCounterFeedback({
          type: 'error',
          message: data.error || 'Failed to record stamp',
        });
      }
    } catch {
      setCounterFeedback({
        type: 'error',
        message: 'Could not connect to server. Please try again.',
      });
    } finally {
      setIsCounterSubmitting(false);
    }
  }

  async function handleCounterRedeemReward() {
    if (!selectedBusiness || !selectedCounterMember) return;
    try {
      setIsCounterSubmitting(true);
      sound.playRewardFanfare();
      confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 } });

      const res = await fetch('/api/cashier', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessId: selectedBusiness.id,
          membershipId: selectedCounterMember.id,
          action: 'redeem',
          staffNote: 'Counter Staff Reward Redemption',
        }),
      });

      const data = await res.json();
      if (data.success) {
        setSelectedCounterMember(data.membership);
        setCounterFeedback({
          type: 'success',
          message: `🎉 ${selectedBusiness.reward_rule.reward_title || 'Reward'} redeemed successfully for ${data.membership?.customer?.name || 'customer'}! Stamp card reset.`,
          newStamps: 0,
          stampsNeeded: selectedBusiness.reward_rule.stamps_needed,
        });
        await loadDashboardData(selectedBusiness.id);
      }
    } catch {
      alert('Failed to redeem reward');
    } finally {
      setIsCounterSubmitting(false);
    }
  }

  // --- Home Dashboard: Verify & Confirm Reward Handlers ---
  async function handleVerifyRewardCode(e?: React.FormEvent) {
    if (e) e.preventDefault();
    const cleanCode = verifyRewardCode.trim().replace(/\s+/g, '');
    if (!cleanCode) return;
    if (!selectedBusiness) return;

    try {
      setIsVerifyingReward(true);
      sound.playClick();
      const res = await fetch('/api/reward/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: cleanCode,
          businessId: selectedBusiness.id,
          action: 'verify',
        }),
      });

      const data = await res.json();
      if (res.ok && data.status === 'PENDING') {
        sound.playStampPop();
        setRewardVerificationState({
          status: 'PENDING',
          claim: data.claim,
          message: data.message || 'Valid reward ready for redemption',
        });
      } else if (data.status === 'ALREADY_REDEEMED') {
        sound.playClick();
        setRewardVerificationState({
          status: 'ALREADY_REDEEMED',
          claim: data.claim,
          message: 'This reward has already been redeemed.',
        });
      } else {
        sound.playClick();
        setRewardVerificationState({
          status: 'INVALID',
          message: data.message || 'This reward code does not exist.',
        });
      }
    } catch {
      setRewardVerificationState({
        status: 'INVALID',
        message: 'Network error verifying reward code.',
      });
    } finally {
      setIsVerifyingReward(false);
    }
  }

  async function handleConfirmRewardRedemption() {
    const cleanCode = verifyRewardCode.trim().replace(/\s+/g, '');
    if (!cleanCode || !selectedBusiness) return;

    try {
      setIsConfirmingRedemption(true);
      sound.playClick();
      const res = await fetch('/api/reward/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: cleanCode,
          businessId: selectedBusiness.id,
          action: 'confirm',
          verifiedBy: 'admin_counter',
        }),
      });

      const data = await res.json();
      if (data.success && data.status === 'REDEEMED') {
        sound.playRewardFanfare();
        confetti({ particleCount: 90, spread: 70, origin: { y: 0.6 } });
        setRewardVerificationState({
          status: 'CONFIRMED_SUCCESS',
          claim: data.claim,
          message: 'Redemption confirmed! Cannot be redeemed again.',
        });
        await loadDashboardData(selectedBusiness.id);
      } else if (data.status === 'ALREADY_REDEEMED') {
        setRewardVerificationState({
          status: 'ALREADY_REDEEMED',
          claim: data.claim,
          message: 'This reward has already been redeemed.',
        });
      } else {
        setRewardVerificationState({
          status: 'INVALID',
          message: data.message || 'Failed to confirm redemption.',
        });
      }
    } catch {
      alert('Network error confirming redemption.');
    } finally {
      setIsConfirmingRedemption(false);
    }
  }

  function handleResetRewardVerification() {
    sound.playClick();
    setVerifyRewardCode('');
    setRewardVerificationState({ status: 'idle' });
  }

  async function handleCounterWalkInSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedBusiness || !walkInPhone) return;

    try {
      setIsCounterSubmitting(true);
      sound.playStampPop();

      const spend = parseFloat(counterSpendAmount) || selectedBusiness.avg_spend_per_visit || 250;
      const res = await fetch('/api/stamp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessId: selectedBusiness.id,
          phone: walkInPhone,
          name: walkInName || undefined,
          spendAmount: spend,
          stampAwarded: counterStampsToAward,
          staffNote: 'Walk-in Counter Registration & Stamp',
          source: 'counter',
        }),
      });

      const data = await res.json();
      if (data.success) {
        if (data.rewardUnlocked) {
          sound.playRewardFanfare();
          confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
        } else {
          sound.playStampPop();
        }

        setSelectedCounterMember(data.membership);
        setIsNewWalkInMode(false);
        setWalkInPhone('');
        setWalkInName('');
        setCounterFeedback({
          type: 'success',
          message: `✓ Customer registered & +${counterStampsToAward} Stamp awarded!`,
          wasRewardUnlocked: data.rewardUnlocked,
          wasWinBackConverted: data.wasWinBackConverted,
          newStamps: data.membership?.stamps,
          stampsNeeded: selectedBusiness.reward_rule.stamps_needed,
        });

        await loadDashboardData(selectedBusiness.id);
      }
    } catch {
      alert('Failed to register walk-in guest');
    } finally {
      setIsCounterSubmitting(false);
    }
  }

  // 3.5 Storefront Image & Profile Picture Handlers
  function handleImageFileSelect(e: React.ChangeEvent<HTMLInputElement>, _isModal = false) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please upload a valid image file (PNG, JPEG, WebP).');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const rawSrc = event.target?.result as string;
      if (rawSrc) {
        setCropImageRawSrc(rawSrc);
        setShowCropPhotoModal(true);
        sound.playStampPop();
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  }

  // Handle Apply and Save Cropped Logo directly to Database
  async function handleApplyAndSaveCrop(croppedDataUrl: string) {
    if (!selectedBusiness) return;
    setIsSavingCrop(true);
    try {
      sound.playStampPop();
      const targetSlugOrId = selectedBusiness.slug || selectedBusiness.id;
      const res = await fetch(`/api/businesses/${targetSlugOrId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          logo_url: croppedDataUrl,
        }),
      });
      const data = await res.json();
      if (data.success) {
        sound.playRewardFanfare();
        confetti({ particleCount: 75, spread: 65, origin: { y: 0.6 } });
        setSettingsLogoUrl(croppedDataUrl);
        setCustomLogoUrl(croppedDataUrl);
        setSelectedBusiness((prev) => (prev ? { ...prev, logo_url: croppedDataUrl } : null));
        setStoreImageSavedToast(true);
        setTimeout(() => setStoreImageSavedToast(false), 3500);
        setShowCropPhotoModal(false);
        setCropImageRawSrc('');
        await loadDashboardData(selectedBusiness.id);
      } else {
        alert(data.error || 'Failed to save cafe logo');
      }
    } catch {
      alert('Network error saving cafe logo');
    } finally {
      setIsSavingCrop(false);
    }
  }

  // 1-Click Save Storefront Image
  async function handleSaveStorefrontImage(customUrl?: string) {
    if (!selectedBusiness) return;
    const targetUrl = customUrl !== undefined ? customUrl : settingsLogoUrl;
    try {
      setIsUploadingStoreImage(true);
      sound.playStampPop();
      const res = await fetch(`/api/businesses/${selectedBusiness.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          logo_url: targetUrl.trim(),
        }),
      });
      const data = await res.json();
      if (data.success) {
        sound.playRewardFanfare();
        confetti({ particleCount: 70, spread: 60, origin: { y: 0.6 } });
        setStoreImageSavedToast(true);
        setTimeout(() => setStoreImageSavedToast(false), 3500);
        await loadDashboardData(selectedBusiness.id);
      } else {
        alert(data.error || 'Failed to save storefront image');
      }
    } catch {
      alert('Network error saving storefront image');
    } finally {
      setIsUploadingStoreImage(false);
    }
  }

  // 4. Save Cafe Profile (Storefront Image, Address, Social Links, Review URL)
  async function handleSaveCafeProfile(e?: React.FormEvent) {
    if (e) e.preventDefault();
    if (!selectedBusiness) return;
    try {
      setIsSavingSettings(true);
      sound.playClick();
      const trimmedPhone = settingsPhone.trim();
      const isCurrentPhoneVerified = Boolean(trimmedPhone);

      const res = await fetch(`/api/businesses/${selectedBusiness.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: settingsCafeName.trim() || selectedBusiness.name,
          category: settingsCategory.trim() || 'Specialty Cafe & Bakery',
          logo_url: settingsLogoUrl.trim() || undefined,
          google_review_url: settingsGoogleReviewUrl.trim(),
          instagram_url: settingsInstagramUrl.trim(),
          maps_url: settingsMapsUrl.trim(),
          address: settingsAddress.trim(),
          area: settingsArea.trim(),
          city: settingsCity.trim(),
          phone: trimmedPhone,
          phone_verified: isCurrentPhoneVerified,
          winback_offer_text: settingsOfferText.trim(),
          reward_rule: {
            ...selectedBusiness.reward_rule,
            category: settingsCategory.trim(),
            google_review_url: settingsGoogleReviewUrl.trim(),
            instagram_url: settingsInstagramUrl.trim(),
            maps_url: settingsMapsUrl.trim(),
            address: settingsAddress.trim(),
            area: settingsArea.trim(),
            city: settingsCity.trim(),
            phone: trimmedPhone,
            phone_verified: isCurrentPhoneVerified,
          },
        }),
      });
      const data = await res.json();
      if (data.success) {
        if (data.business) {
          setSelectedBusiness(data.business);
        }
        sound.playRewardFanfare();
        confetti({ particleCount: 60, spread: 60, origin: { y: 0.6 } });
        setSettingsSavedSuccess(true);
        setShowGeneralEditModal(false);
        setTimeout(() => setSettingsSavedSuccess(false), 3500);
        await loadDashboardData(selectedBusiness.id);
      } else {
        alert(data.error || 'Failed to update cafe profile');
      }
    } catch {
      alert('Network error saving cafe profile');
    } finally {
      setIsSavingSettings(false);
    }
  }

  // 4a. Mobile Number Direct Verification Handler (No OTP Required)
  async function handleDirectVerifyPhone(e?: React.FormEvent) {
    if (e) e.preventDefault();
    const cleanNumber = verifyPhoneInput.trim().replace(/\s+/g, '');
    if (cleanNumber.replace(/\D/g, '').length < 10) {
      setVerifyPhoneError('Please enter a valid 10-digit mobile number.');
      return;
    }
    setVerifyPhoneError(null);
    setVerifyPhoneSuccess(null);
    setIsVerifyPhoneLoading(true);
    sound.playClick();

    try {
      if (selectedBusiness) {
        const updateRes = await fetch(`/api/businesses/${selectedBusiness.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            phone: cleanNumber,
            phone_verified: true,
            reward_rule: {
              ...selectedBusiness.reward_rule,
              phone: cleanNumber,
              phone_verified: true,
            },
          }),
        });
        const updateData = await updateRes.json();
        if (updateData.success && updateData.business) {
          setSelectedBusiness(updateData.business);
        }
      }

      setSettingsPhone(cleanNumber);
      sound.playRewardFanfare();
      confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
      setVerifyPhoneSuccess('✓ Phone number verified and saved!');
      setTimeout(() => {
        setShowPhoneVerifyModal(false);
        setVerifyPhoneError(null);
        setVerifyPhoneSuccess(null);
        if (selectedBusiness) loadDashboardData(selectedBusiness.id);
      }, 1000);
    } catch {
      setVerifyPhoneError('Network error saving phone number.');
    } finally {
      setIsVerifyPhoneLoading(false);
    }
  }

  const handleSaveGeneralSettings = handleSaveCafeProfile;

  // 4b. Save Hero Banner & Tagline Details
  async function handleSaveHeroBannerSettings(e?: React.FormEvent) {
    if (e) e.preventDefault();
    if (!selectedBusiness) return;
    try {
      setIsSavingSettings(true);
      sound.playClick();
      const currentTheme = selectedBusiness.theme_config || selectedBusiness.reward_rule?.theme_config || {};
      const updatedTheme: ThemeConfig = {
        ...currentTheme,
        custom_tagline: settingsTagline.trim(),
        description: settingsDescription.trim(),
        badge_1: settingsBadge1.trim(),
        badge_2: settingsBadge2.trim(),
        welcome_badge: settingsBadge1.trim() || currentTheme.welcome_badge,
      };

      const res = await fetch(`/api/businesses/${selectedBusiness.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          logo_url: settingsLogoUrl.trim() || undefined,
          theme_config: updatedTheme,
          reward_rule: {
            ...selectedBusiness.reward_rule,
            reward_desc: settingsDescription.trim() || selectedBusiness.reward_rule.reward_desc,
            theme_config: updatedTheme,
          },
        }),
      });
      const data = await res.json();
      if (data.success) {
        sound.playRewardFanfare();
        confetti({ particleCount: 70, spread: 60, origin: { y: 0.6 } });
        setSettingsSavedSuccess(true);
        setShowHeroBannerEditModal(false);
        setTimeout(() => setSettingsSavedSuccess(false), 3500);
        await loadDashboardData(selectedBusiness.id);
      } else {
        alert(data.error || 'Failed to update hero banner');
      }
    } catch {
      alert('Network error saving hero banner');
    } finally {
      setIsSavingSettings(false);
    }
  }

  // 4c. Save Reward Rules (Grand Prize Stamps, Title, Min Bill)
  async function handleSaveRewardRules(e?: React.FormEvent) {
    if (e) e.preventDefault();
    if (!selectedBusiness) return;
    try {
      setIsSavingSettings(true);
      sound.playClick();
      const stamps = Math.min(8, Math.max(1, Number(settingsStamps) || 6));
      const rewardTitle = settingsRewardTitle.trim();
      const minOrder = Number(settingsMinOrder) || 150;

      // Keep active_offers synchronized with the updated grand reward title and stamps
      const existingOffers = selectedBusiness.active_offers || [];
      let hasGrand = false;

      const updatedOffers = existingOffers.map((o) => {
        if (
          o.id === 'off_2' ||
          (o.type === 'milestone' &&
            (o.stamps_needed || 6) >= (selectedBusiness.reward_rule?.stamps_needed || 6))
        ) {
          hasGrand = true;
          return {
            ...o,
            title: rewardTitle,
            stamps_needed: stamps,
            badge: `${stamps} Stamps Grand Reward`,
            desc: `Unlocked at ${stamps} digital stamps`,
            min_order: minOrder,
          };
        }
        return {
          ...o,
          min_order: o.min_order || minOrder,
        };
      });

      if (!hasGrand) {
        updatedOffers.push({
          id: `off_grand_${Date.now()}`,
          type: 'milestone',
          title: rewardTitle,
          stamps_needed: stamps,
          badge: `${stamps} Stamps Grand Reward`,
          desc: `Unlocked at ${stamps} digital stamps`,
          min_order: minOrder,
        });
      }

      const res = await fetch(`/api/businesses/${selectedBusiness.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reward_rule: {
            ...selectedBusiness.reward_rule,
            stamps_needed: stamps,
            reward_title: rewardTitle,
            min_order_for_stamp: minOrder,
            expiry_days: Number(settingsRewardExpiryDays) >= 0 ? Number(settingsRewardExpiryDays) : 60,
          },
          active_offers: updatedOffers,
          min_order_for_stamp: minOrder,
          avg_spend_per_visit: Number(settingsAvgSpend) || 250,
          winback_offer_text: settingsOfferText.trim(),
        }),
      });
      const data = await res.json();
      if (data.success) {
        sound.playRewardFanfare();
        confetti({ particleCount: 70, spread: 70, origin: { y: 0.6 } });
        setRewardRulesSavedSuccess(true);
        setSettingsSavedSuccess(true);
        setShowLoyaltyEditModal(false);
        setTimeout(() => {
          setRewardRulesSavedSuccess(false);
          setSettingsSavedSuccess(false);
        }, 3500);
        await loadDashboardData(selectedBusiness.id);
      } else {
        alert(data.error || 'Failed to update reward rules');
      }
    } catch {
      alert('Network error saving reward rules');
    } finally {
      setIsSavingSettings(false);
    }
  }

  const handleSaveLoyaltySettings = handleSaveRewardRules;
  const handleSaveSettings = handleSaveCafeProfile;

  // 4d. Handle Notification Toggle
  async function handleToggleNotification(
    type: 'order' | 'scan' | 'sound' | 'daily' | 'winback',
    nextVal: boolean
  ) {
    sound.playClick();
    let orderVal = notifOrderAlerts;
    let scanVal = notifScanAlerts;
    let soundVal = notifSoundEffects;
    let dailyVal = notifDailySummary;
    let winbackVal = notifWinbackAlerts;

    if (type === 'order') {
      setNotifOrderAlerts(nextVal);
      orderVal = nextVal;
    } else if (type === 'scan') {
      setNotifScanAlerts(nextVal);
      scanVal = nextVal;
    } else if (type === 'sound') {
      setNotifSoundEffects(nextVal);
      soundVal = nextVal;
    } else if (type === 'daily') {
      setNotifDailySummary(nextVal);
      dailyVal = nextVal;
    } else if (type === 'winback') {
      setNotifWinbackAlerts(nextVal);
      winbackVal = nextVal;
    }

    if (!selectedBusiness) return;
    try {
      const currentTheme = selectedBusiness.theme_config || selectedBusiness.reward_rule?.theme_config || {};
      const updatedTheme: ThemeConfig = {
        ...currentTheme,
        order_alerts_enabled: orderVal,
        menu_scan_alerts_enabled: scanVal,
        sound_enabled: soundVal,
        daily_summary_enabled: dailyVal,
        auto_winback_enabled: winbackVal,
      };

      await fetch(`/api/businesses/${selectedBusiness.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          theme_config: updatedTheme,
        }),
      });
    } catch (err) {
      console.error('Failed to sync notification preference', err);
    }
  }

  // 4b. Create & Delete Milestone Reward Offers ("At X Stamps -> Get Y Reward")
  async function handleCreateNewOffer(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedBusiness || !newOfferTitle.trim()) return;
    try {
      setIsCreatingOffer(true);
      sound.playStampPop();

      const rawStamps = Number(newOfferStamps) || 1;
      const stamps = Math.min(50, Math.max(1, rawStamps));
      const expiry = Number(newOfferExpiryDays) > 0 ? Number(newOfferExpiryDays) : undefined;
      const newOffer: StoreOffer = {
        id: 'off_' + Math.random().toString(36).substring(2, 9),
        title: newOfferTitle.trim(),
        stamps_needed: stamps,
        badge: `${stamps} Stamps Reward`,
        desc: newOfferDesc.trim() || `Unlocked after completing ${stamps} stamps`,
        type: 'milestone',
        icon: 'gift',
        expiry_days: expiry,
        min_order: selectedBusiness.min_order_for_stamp || 150,
      };

      const existingOffers = selectedBusiness.active_offers || [];
      const updatedOffers = [...existingOffers, newOffer].sort((a, b) => (a.stamps_needed || 0) - (b.stamps_needed || 0));

      const res = await fetch(`/api/businesses/${selectedBusiness.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          active_offers: updatedOffers,
        }),
      });

      const data = await res.json();
      if (data.success) {
        sound.playRewardFanfare();
        confetti({ particleCount: 70, spread: 60, origin: { y: 0.6 } });
        setShowCreateOfferModal(false);
        setNewOfferTitle('');
        setNewOfferDesc('');
        setNewOfferStamps(8);
        setNewOfferBadge('8 Stamps Reward');
        setNewOfferExpiryDays('30');
        if (data.business) {
          setSelectedBusiness(data.business);
        } else {
          setSelectedBusiness(prev => prev ? { ...prev, active_offers: updatedOffers } : null);
        }
        await loadDashboardData(selectedBusiness.id);
      }
    } catch {
      alert('Failed to create offer');
    } finally {
      setIsCreatingOffer(false);
    }
  }

  function handleOpenEditOfferModal(offer: StoreOffer) {
    setEditingOffer(offer);
    setEditOfferTitle(offer.title || '');
    setEditOfferStamps(Math.min(50, Math.max(1, offer.stamps_needed || 8)));
    setEditOfferBadge(offer.badge || `${offer.stamps_needed || 8} Stamps Reward`);
    setEditOfferDesc(offer.desc || '');
    setEditOfferIcon((offer.icon as any) || 'gift');
    setEditOfferExpiryDays(offer.expiry_days !== undefined ? String(offer.expiry_days) : '30');
    setShowEditOfferModal(true);
  }

  async function handleSaveEditedOffer(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedBusiness || !editingOffer || !editOfferTitle.trim()) return;
    try {
      setIsEditingOffer(true);
      sound.playClick();
      const rawStamps = Number(editOfferStamps) || 1;
      const stamps = Math.min(50, Math.max(1, rawStamps));
      const expiry = Number(editOfferExpiryDays) > 0 ? Number(editOfferExpiryDays) : undefined;
      const existingOffers = selectedBusiness.active_offers || [];
      const updatedOffers = existingOffers.map((o) => {
        if (o.id === editingOffer.id) {
          return {
            ...o,
            title: editOfferTitle.trim(),
            stamps_needed: stamps,
            badge: `${stamps} Stamps Reward`,
            desc: editOfferDesc.trim() || `Unlocked after completing ${stamps} stamps`,
            icon: o.icon || 'gift',
            expiry_days: expiry,
          };
        }
        return o;
      }).sort((a, b) => (a.stamps_needed || 0) - (b.stamps_needed || 0));

      const res = await fetch(`/api/businesses/${selectedBusiness.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          active_offers: updatedOffers,
        }),
      });

      const data = await res.json();
      if (data.success) {
        sound.playRewardFanfare();
        confetti({ particleCount: 60, spread: 50, origin: { y: 0.6 } });
        setShowEditOfferModal(false);
        setEditingOffer(null);
        if (data.business) {
          setSelectedBusiness(data.business);
        } else {
          setSelectedBusiness(prev => prev ? { ...prev, active_offers: updatedOffers } : null);
        }
        await loadDashboardData(selectedBusiness.id);
      } else {
        alert(data.error || 'Failed to update reward');
      }
    } catch {
      alert('Network error updating reward');
    } finally {
      setIsEditingOffer(false);
    }
  }

  async function handleDeleteOffer(offerId: string) {
    if (!selectedBusiness) return;
    if (!confirm('Are you sure you want to remove this milestone reward from the digital pass? Stamp slots on customer passes will no longer show a gift icon at this milestone.')) return;
    try {
      setIsDeletingOfferId(offerId);
      sound.playClick();
      const existingOffers = selectedBusiness.active_offers || [];
      const updatedOffers = existingOffers.filter((o) => o.id !== offerId);

      const res = await fetch(`/api/businesses/${selectedBusiness.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          active_offers: updatedOffers,
        }),
      });

      const data = await res.json();
      if (data.success) {
        if (data.business) {
          setSelectedBusiness(data.business);
        } else {
          setSelectedBusiness(prev => prev ? { ...prev, active_offers: updatedOffers } : null);
        }
        await loadDashboardData(selectedBusiness.id);
      } else {
        alert(data.error || 'Failed to delete offer');
      }
    } catch {
      alert('Failed to delete offer');
    } finally {
      setIsDeletingOfferId(null);
    }
  }

  // 4c. Delete customer membership from CRM / clean test records
  async function handleDeleteMember(membershipId: string) {
    if (!confirm('Are you sure you want to remove this customer record?')) return;
    try {
      sound.playClick();
      const res = await fetch(`/api/memberships/${membershipId}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        if (selectedBusiness) {
          await loadDashboardData(selectedBusiness.id);
        }
      } else {
        alert(data.error || 'Failed to remove customer');
      }
    } catch {
      alert('Failed to remove customer');
    }
  }

  // 5. Send Single Direct WhatsApp message (Opens WhatsApp with pre-filled offer text & slide-out animation)
  async function handleSendSingleNudge(membershipId: string, phone: string, name: string) {
    if (!selectedBusiness) return;
    try {
      sound.playStampPop();
      let cleanPhone = phone.replace(/\D/g, '');
      if (cleanPhone.length === 10) {
        cleanPhone = '91' + cleanPhone;
      } else if (cleanPhone.length === 11 && cleanPhone.startsWith('0')) {
        cleanPhone = '91' + cleanPhone.slice(1);
      }

      const offerCode = `WINBACK-${name.replace(/\s+/g, '').toUpperCase().slice(0, 5)}-${Math.floor(1000 + Math.random() * 9000)}`;
      const hostOrigin = getPublicOrigin();
      const cardUrl = `${hostOrigin}/c/${selectedBusiness.slug}?phone=${encodeURIComponent(phone)}&offer=${encodeURIComponent(offerCode)}`;
      const messageText = `Hey ${name}! 👋 We miss seeing you at ${selectedBusiness.name} ☕\n\n🎁 *Special Treat for You:* ${selectedBusiness.winback_offer_text || 'Free treat with your next visit'}\n\nShow your digital card at the counter:\n👉 ${cardUrl}\n\nSee you soon! ✨`;

      // 1. Immediately open WhatsApp with pre-pasted personalized offer text
      window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(messageText)}`, '_blank');

      // 2. Mark this customer as sent & trigger smooth slide-out removal
      if (membershipId) {
        setSentNudges((prev) => {
          const updated = { ...prev, [membershipId]: true };
          try { localStorage.setItem('reva_sent_nudges', JSON.stringify(updated)); } catch {}
          return updated;
        });
        setAnimatingSentIds((prev) => ({ ...prev, [membershipId]: 'sent' }));

        // Phase 1: Show "✓ Sent!" for 350ms, then slide row over
        setTimeout(() => {
          setAnimatingSentIds((prev) => ({ ...prev, [membershipId]: 'sliding' }));
        }, 350);

        // Phase 2: After slide animation completes (850ms), remove from overdue list
        setTimeout(() => {
          setDismissedOverdueIds((prev) => {
            const updated = { ...prev, [membershipId]: true };
            try { localStorage.setItem('reva_dismissed_overdue', JSON.stringify(updated)); } catch {}
            return updated;
          });
        }, 850);
      }

      // 3. Log to database so it reflects in dashboard audit trail
      await fetch('/api/whatsapp/logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessId: selectedBusiness.id,
          membershipId: membershipId || undefined,
          offerCode,
          messageBody: messageText,
        }),
      });

      // 4. Quietly refresh dashboard data
      await loadDashboardData(selectedBusiness.id);
    } catch (err) {
      console.error('Failed to log WhatsApp invitation', err);
    }
  }

  // 6. Interactive Message Status Cycle (Sent -> Delivered -> Read)
  async function handleToggleLogStatus(logId: string, currentStatus: string) {
    sound.playClick();
    const nextStatus: 'sent' | 'delivered' | 'read' =
      currentStatus === 'sent' ? 'delivered' : currentStatus === 'delivered' ? 'read' : 'sent';

    if (metrics) {
      setMetrics({
        ...metrics,
        recentLogs: metrics.recentLogs.map((l) => (l.id === logId ? { ...l, status: nextStatus } : l)),
      });
    }

    try {
      await fetch('/api/whatsapp/logs', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: logId, status: nextStatus }),
      });
    } catch (err) {
      console.error('Failed to update log status', err);
    }
  }

  // 8. Razorpay Payment & Subscription Upgrade Handler
  const [isPaymentLoading, setIsPaymentLoading] = useState(false);
  const [paymentNotice, setPaymentNotice] = useState<string | null>(null);

  async function handleStartRazorpayPayment(targetPlan?: 'starter' | 'growth' | 'pro') {
    if (!selectedBusiness) return;
    setIsPaymentLoading(true);
    setPaymentNotice(null);

    const planToPay = targetPlan || (selectedBusiness.plan as 'starter' | 'growth' | 'pro') || 'growth';

    await openRazorpayCheckout({
      plan: planToPay,
      businessId: selectedBusiness.id,
      businessName: selectedBusiness.name,
      ownerEmail: authUser?.email,
      onSuccess: async (res) => {
        setIsPaymentLoading(false);
        setPaymentNotice(res.message);
        await loadDashboardData(selectedBusiness.id);
      },
      onError: (err) => {
        setIsPaymentLoading(false);
        setPaymentNotice(`Payment issue: ${err}`);
      },
      onCancel: () => {
        setIsPaymentLoading(false);
      },
    });
  }

  // 7. Open dedicated Inactive Customers / Visit Due view
  function handleOpenInactiveCustomers() {
    sound.playClick();
    setActiveTab('stats');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // 8. Table QR Stand High-Resolution PNG Generator & Downloader
  async function handleDownloadStandImage() {
    if (!selectedBusiness) return;
    try {
      setIsDownloadingStand(true);
      sound.playStampPop();

      // Create high-resolution canvas (1200 x 1750 px for crisp 300 DPI print quality)
      const canvas = document.createElement('canvas');
      const width = 1200;
      const height = 1750;
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Could not initialize canvas context');

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';

      // Background
      ctx.fillStyle = '#F8FAFC';
      ctx.fillRect(0, 0, width, height);

      // Card Container
      const cardX = 90;
      const cardY = 90;
      const cardW = width - 180;
      const cardH = height - 180;
      const radius = 48;

      ctx.beginPath();
      ctx.roundRect(cardX, cardY, cardW, cardH, radius);
      ctx.fillStyle = '#FFFFFF';
      ctx.fill();
      ctx.lineWidth = 4;
      ctx.strokeStyle = '#E2E8F0';
      ctx.stroke();

      // Top Icon Badge
      const badgeSize = 110;
      const badgeX = width / 2 - badgeSize / 2;
      const badgeY = cardY + 70;
      ctx.beginPath();
      ctx.roundRect(badgeX, badgeY, badgeSize, badgeSize, 28);
      ctx.fillStyle = '#0F172A';
      ctx.fill();

      // 8-Spoke Brand Star inside badge
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 6;
      ctx.lineCap = 'round';
      const centerX = width / 2;
      const centerY = badgeY + badgeSize / 2;
      const spokes = 8;
      const rOuter = 26;
      for (let i = 0; i < spokes; i++) {
        const angle = (i * Math.PI) / (spokes / 2);
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.lineTo(centerX + Math.cos(angle) * rOuter, centerY + Math.sin(angle) * rOuter);
        ctx.stroke();
      }

      // Store Name
      ctx.fillStyle = '#0F172A';
      ctx.font = 'bold 42px "Plus Jakarta Sans", "Inter", -apple-system, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'alphabetic';
      const storeName = selectedBusiness.name || 'Digital Loyalty Card';
      ctx.fillText(storeName, width / 2, badgeY + badgeSize + 60);

      // Official Digital Loyalty Card Badge
      ctx.fillStyle = '#94A3B8';
      ctx.font = 'bold 16px "Space Mono", monospace';
      ctx.fillText('OFFICIAL DIGITAL LOYALTY CARD', width / 2, badgeY + badgeSize + 96);

      // QR Code Extraction and High-Res Drawing
      const svgEl = qrRef.current?.querySelector('svg');
      if (svgEl) {
        const svgString = new XMLSerializer().serializeToString(svgEl);
        const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
        const blobUrl = URL.createObjectURL(svgBlob);

        const qrImg = new Image();
        await new Promise<void>((resolve, reject) => {
          qrImg.onload = () => resolve();
          qrImg.onerror = reject;
          qrImg.src = blobUrl;
        });

        // QR Code Box Container
        const qrBoxSize = 540;
        const qrBoxX = width / 2 - qrBoxSize / 2;
        const qrBoxY = badgeY + badgeSize + 130;

        ctx.beginPath();
        ctx.roundRect(qrBoxX, qrBoxY, qrBoxSize, qrBoxSize, 32);
        ctx.fillStyle = '#FFFFFF';
        ctx.fill();
        ctx.lineWidth = 3;
        ctx.strokeStyle = '#F1F5F9';
        ctx.stroke();

        // Draw QR Image with interior padding
        const qrPadding = 32;
        ctx.drawImage(
          qrImg,
          qrBoxX + qrPadding,
          qrBoxY + qrPadding,
          qrBoxSize - qrPadding * 2,
          qrBoxSize - qrPadding * 2
        );
        URL.revokeObjectURL(blobUrl);

        // Offer Headline
        const headlineY = qrBoxY + qrBoxSize + 75;
        ctx.fillStyle = '#0F172A';
        ctx.font = 'bold 36px "Plus Jakarta Sans", "Inter", -apple-system, sans-serif';
        ctx.fillText(standTagline || 'Scan to get your 6th drink FREE!', width / 2, headlineY);

        // Helper Text
        const subtextY = headlineY + 45;
        ctx.fillStyle = '#64748B';
        ctx.font = '500 22px "Inter", -apple-system, sans-serif';
        ctx.fillText(standSubtext || 'No app download. Takes 5 seconds.', width / 2, subtextY);

        // Divider
        const divY = subtextY + 45;
        ctx.beginPath();
        ctx.moveTo(cardX + 70, divY);
        ctx.lineTo(cardX + cardW - 70, divY);
        ctx.lineWidth = 2;
        ctx.strokeStyle = '#F1F5F9';
        ctx.stroke();

        // 3-Step Guide (1. Scan | 2. Collect | 3. Enjoy)
        const stepsY = divY + 48;
        const col1X = width / 2 - 270;
        const col2X = width / 2;
        const col3X = width / 2 + 270;

        // Step 1
        ctx.fillStyle = '#0F172A';
        ctx.font = 'bold 22px "Inter", sans-serif';
        ctx.fillText('1. Scan', col1X, stepsY);
        ctx.fillStyle = '#94A3B8';
        ctx.font = '500 16px "Inter", sans-serif';
        ctx.fillText('Phone camera', col1X, stepsY + 26);

        // Step 2
        ctx.fillStyle = '#0F172A';
        ctx.font = 'bold 22px "Inter", sans-serif';
        ctx.fillText('2. Collect', col2X, stepsY);
        ctx.fillStyle = '#94A3B8';
        ctx.font = '500 16px "Inter", sans-serif';
        ctx.fillText('Digital Stamps', col2X, stepsY + 26);

        // Step 3
        ctx.fillStyle = '#0F172A';
        ctx.font = 'bold 22px "Inter", sans-serif';
        ctx.fillText('3. Enjoy', col3X, stepsY);
        ctx.fillStyle = '#94A3B8';
        ctx.font = '500 16px "Inter", sans-serif';
        ctx.fillText('Free Treats', col3X, stepsY + 26);

        // Footer
        ctx.fillStyle = '#94A3B8';
        ctx.font = 'bold 15px "Space Mono", monospace';
        ctx.fillText('Powered by siplo.in • No App Needed', width / 2, cardY + cardH - 35);
      }

      // Convert to PNG and Trigger Instant Download
      const dataUrl = canvas.toDataURL('image/png', 1.0);
      const link = document.createElement('a');
      link.download = `${selectedBusiness.slug || 'store'}-table-qr-stand.png`;
      link.href = dataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      sound.playRewardFanfare();
      confetti({ particleCount: 80, spread: 60, origin: { y: 0.6 } });
      setStandDownloadSuccess(true);
      setTimeout(() => setStandDownloadSuccess(false), 4000);
    } catch (err) {
      console.error('Failed to download table stand image', err);
      alert('Could not download image. Please try the Print Stand button.');
    } finally {
      setIsDownloadingStand(false);
    }
  }

  function handleCopyCustomerLink() {
    const urlToCopy = fullTestPassUrl || customerQrUrl;
    if (!urlToCopy) return;
    navigator.clipboard.writeText(urlToCopy);
    sound.playClick();
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 3000);
  }

  if (loading && !selectedBusiness) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] flex flex-col font-sans antialiased selection:bg-[#0F172A] selection:text-white">
        {/* Top Sticky Navbar Skeleton */}
        <header className="bg-white/95 backdrop-blur-md border-b border-slate-100 sticky top-0 z-40 transition-all">
          <div className="max-w-7xl w-full mx-auto px-4 sm:px-10 h-16 sm:h-18 flex items-center justify-between gap-4">
            <div className="flex items-center gap-2 sm:gap-2.5">
              <div className="w-7 h-7 flex items-center justify-center text-slate-900">
                <svg viewBox="0 0 24 24" className="w-6 h-6 fill-none stroke-current stroke-[2.2]">
                  <path d="M12 2v20M2 12h20M4.93 4.93l14.14 14.14M4.93 19.07L19.07 4.93" />
                </svg>
              </div>
              <div className="flex items-baseline gap-0.5 sm:gap-1">
                <span className="font-display text-lg sm:text-xl font-bold tracking-tight text-[#0F172A]">Siplo</span>
                <span className="text-slate-400 font-display font-medium text-sm sm:text-base">.in</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-8 w-24 bg-slate-100 rounded-full animate-pulse" />
              <div className="h-8 w-28 bg-slate-100 rounded-full animate-pulse" />
            </div>
          </div>
        </header>

        {/* Hero Banner Skeleton */}
        <main className="max-w-7xl w-full mx-auto px-4 sm:px-10 py-6 sm:py-8 space-y-6 flex-1">
          <div className="bg-white border border-slate-200/80 rounded-2xl sm:rounded-3xl p-6 sm:p-8 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-2.5">
              <div className="h-3.5 w-32 bg-slate-200 rounded-md animate-pulse" />
              <div className="h-7 w-56 bg-slate-200 rounded-lg animate-pulse" />
              <div className="h-3.5 w-72 bg-slate-100 rounded-md animate-pulse" />
            </div>
            <div className="flex items-center gap-2">
              <div className="h-10 w-28 bg-slate-100 rounded-xl animate-pulse" />
              <div className="h-10 w-32 bg-[#0F172A]/10 rounded-xl animate-pulse" />
            </div>
          </div>

          {/* 4 Metric Cards Skeleton */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-white border border-slate-200/80 rounded-2xl p-4 sm:p-6 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <div className="h-3 w-20 bg-slate-200 rounded animate-pulse" />
                  <div className="w-7 h-7 bg-slate-100 rounded-lg animate-pulse" />
                </div>
                <div className="h-7 w-24 bg-slate-200 rounded-md animate-pulse" />
                <div className="h-3 w-32 bg-slate-100 rounded animate-pulse" />
              </div>
            ))}
          </div>

          {/* Activity Grid Skeleton */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs space-y-4">
              <div className="h-5 w-40 bg-slate-200 rounded animate-pulse" />
              <div className="space-y-3">
                {[1, 2, 3, 4].map((j) => (
                  <div key={j} className="h-14 bg-slate-50 border border-slate-100 rounded-xl animate-pulse" />
                ))}
              </div>
            </div>
            <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs space-y-4">
              <div className="h-5 w-36 bg-slate-200 rounded animate-pulse" />
              <div className="h-48 bg-slate-50 border border-slate-100 rounded-2xl animate-pulse" />
              <div className="h-10 bg-slate-100 rounded-xl animate-pulse" />
            </div>
          </div>
        </main>
      </div>
    );
  }

  const customerQrUrl = selectedBusiness ? `${getPublicOrigin()}/c/${selectedBusiness.slug}` : '';
  const testPassUrl = selectedBusiness ? `/c/${selectedBusiness.slug}?test=1` : '';
  const fullTestPassUrl = selectedBusiness ? `${getPublicOrigin()}/c/${selectedBusiness.slug}?test=1` : '';

  const subInfo = getSubscriptionRemainingInfo(selectedBusiness);
  const isTrial = selectedBusiness?.trial_active ?? (selectedBusiness?.subscription_status === 'trialing');
  const currentPlan = selectedBusiness?.plan as SubscriptionPlanType | undefined;

  const starterDetails = getPlanUpgradeDetails(currentPlan, isTrial, 'starter');
  const growthDetails = getPlanUpgradeDetails(currentPlan, isTrial, 'growth');
  const proDetails = getPlanUpgradeDetails(currentPlan, isTrial, 'pro');

  const filteredMembers = (metrics?.members || []).filter((m) => {
    const matchesSearch =
      (m.customer?.name || '').toLowerCase().includes(crmSearch.toLowerCase()) ||
      (m.customer?.phone || '').includes(crmSearch);

    if (!matchesSearch) return false;
    if (crmFilter === 'at_risk') return m.is_at_risk;
    if (crmFilter === 'regular') return !m.is_at_risk;
    return true;
  });

  // Filtered members for Counter quick search
  const filteredCounterMembers = (metrics?.members || []).filter((m) => {
    const q = counterSearch.trim().toLowerCase();
    if (!q) return true;
    const nameMatch = (m.customer?.name || '').toLowerCase().includes(q);
    const phoneMatch = (m.customer?.phone || '').includes(q);
    return nameMatch || phoneMatch;
  });

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] flex flex-col font-sans antialiased selection:bg-[#0F172A] selection:text-white">
      {/* ========================================================================= */}
      {/* 1. TOP STICKY NAVBAR */}
      {/* ========================================================================= */}
      <header className="bg-white/95 backdrop-blur-md border-b border-slate-100 sticky top-0 z-40 transition-all">
        <div className="max-w-7xl w-full mx-auto px-4 sm:px-10 h-16 sm:h-18 flex items-center justify-between gap-2 sm:gap-4">
          <div className="flex items-center gap-2 sm:gap-6 min-w-0">
            {/* Logo */}
            <Link
              href="/dashboard"
              onClick={(e) => {
                e.preventDefault();
                setActiveTab('home');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="flex items-center gap-2 sm:gap-2.5 group shrink-0 cursor-pointer"
              title="Dashboard Home"
            >
              <div className="w-7 h-7 flex items-center justify-center text-slate-900 group-hover:rotate-45 transition-transform duration-500">
                <svg viewBox="0 0 24 24" className="w-6 h-6 fill-none stroke-current stroke-[2.2]">
                  <path d="M12 2v20M2 12h20M4.93 4.93l14.14 14.14M4.93 19.07L19.07 4.93" />
                </svg>
              </div>
              <div className="flex items-baseline gap-0.5 sm:gap-1">
                <span className="font-display text-lg sm:text-xl font-bold tracking-tight text-[#0F172A]">Siplo</span>
                <span className="text-slate-400 font-display font-medium text-sm sm:text-base">.in</span>
              </div>
            </Link>
          </div>

          {/* Right Action Menu */}
          <div className="flex items-center gap-2 shrink-0">
            {!SUBSCRIPTION_ENABLED && (
              <a
                href={getGrowRestaurantWhatsAppUrl(selectedBusiness?.name)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
                title="Talk to us on WhatsApp (8080004929)"
              >
                <MessageSquare className="w-3.5 h-3.5 fill-current" />
                <span className="hidden sm:inline">Grow your restaurant, talk to us</span>
                <span className="sm:hidden">Grow with us</span>
              </a>
            )}
            {/* Options Menu Button (Three Dots) */}
            {authUser ? (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowUserDropdown(!showUserDropdown)}
                  className={`w-9 h-9 sm:w-9.5 sm:h-9.5 rounded-full flex items-center justify-center transition-all cursor-pointer active:scale-95 border ${
                    showUserDropdown
                      ? 'bg-slate-900 text-white border-slate-900 shadow-md'
                      : 'bg-white text-slate-700 hover:text-slate-900 hover:bg-slate-100/80 border-slate-200/90 shadow-2xs'
                  }`}
                  aria-label="Account and options menu"
                  title="Account & Settings"
                >
                  <MoreVertical className="w-4 h-4" />
                </button>

                {showUserDropdown && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setShowUserDropdown(false)}
                    />
                    <div className="absolute right-0 mt-2 w-72 sm:w-80 rounded-3xl bg-white shadow-2xl border border-slate-100 p-3.5 z-50 animate-in fade-in slide-in-from-top-2 duration-150 space-y-3">
                    {/* Authenticated Owner Info */}
                    <div className="px-3 py-2 bg-slate-50 rounded-2xl border border-slate-100">
                      <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold flex items-center gap-1.5">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Authenticated Owner</span>
                      </div>
                      <div className="text-xs font-semibold text-slate-900 truncate mt-0.5">{authUser.email}</div>
                      {businesses.length > 1 && (
                        <div className="pt-2 mt-2 border-t border-slate-200/70 flex items-center gap-2">
                          <Store className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                          <select
                            value={selectedBusiness?.id}
                            onChange={(e) => loadDashboardData(e.target.value)}
                            className="bg-transparent font-medium text-xs text-slate-800 focus:outline-none cursor-pointer w-full truncate"
                          >
                            {businesses.map((b) => (
                              <option key={b.id} value={b.id}>
                                {b.name}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}
                    </div>

                    {/* "YOUR PLAN" SUBSCRIPTION SECTION OR LEAD-GEN GROWTH SERVICES */}
                    {SUBSCRIPTION_ENABLED ? (
                      <div className="p-3.5 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-[#0F172A] text-white space-y-2.5 shadow-md">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <CreditCard className="w-4 h-4 text-amber-400" />
                            <span className="text-[11px] font-mono uppercase font-bold tracking-wider text-slate-300">Your Plan</span>
                          </div>
                          <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${subInfo?.isTrial ? 'bg-amber-400/20 text-amber-300 border border-amber-400/30' : 'bg-emerald-400/20 text-emerald-300 border border-emerald-400/30'}`}>
                            {subInfo?.isTrial ? '30-Day Trial' : 'Active License'}
                          </span>
                        </div>

                        <div className="flex items-baseline justify-between pt-0.5">
                          <div className="font-display font-bold text-base text-white">
                            {subInfo?.planName.toUpperCase()} PLAN
                          </div>
                          <div className="text-[11px] font-mono text-slate-300">
                            {selectedBusiness?.plan === 'starter' ? '₹499/yr' : selectedBusiness?.plan === 'pro' ? '₹1,499/yr' : '₹999/yr'}
                          </div>
                        </div>

                        <div className="space-y-1 bg-white/5 p-2 rounded-xl border border-white/10 text-[11px] text-slate-300">
                          <div className="flex items-center gap-1.5 font-semibold text-white">
                            <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                            <span>{subInfo?.badgeText}</span>
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono">
                            {subInfo?.isTrial ? `Trial ends: ${subInfo?.formattedDate}` : `Valid until: ${subInfo?.formattedDate}`}
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            setShowUserDropdown(false);
                            setShowPlanModal(true);
                            sound.playClick();
                          }}
                          className="w-full py-2 px-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-bold transition-all cursor-pointer shadow-xs flex items-center justify-center gap-1.5 active:scale-98"
                        >
                          <Zap className="w-3.5 h-3.5 fill-slate-950" />
                          <span>{subInfo?.isTrial ? 'Upgrade & Activate Now' : 'Manage / Renew Plan'}</span>
                        </button>
                      </div>
                    ) : (
                      <div className="p-3.5 rounded-2xl bg-gradient-to-br from-emerald-950 via-slate-900 to-[#0F172A] text-white space-y-2.5 shadow-md border border-emerald-500/20">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <Sparkles className="w-4 h-4 text-emerald-400" />
                            <span className="text-[11px] font-mono uppercase font-bold tracking-wider text-emerald-300">Restaurant Growth</span>
                          </div>
                          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-400/20 text-emerald-300 border border-emerald-400/30">
                            Partner Services
                          </span>
                        </div>

                        <div>
                          <div className="font-display font-bold text-sm text-white">
                            Grow Your Restaurant
                          </div>
                          <p className="text-[11px] text-slate-300 mt-1 leading-relaxed">
                            Need help with Instagram reels, local digital ads, or social media management? We help restaurant owners scale.
                          </p>
                        </div>

                        <a
                          href={getGrowRestaurantWhatsAppUrl(selectedBusiness?.name)}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={() => {
                            setShowUserDropdown(false);
                            sound.playClick();
                          }}
                          className="w-full py-2.5 px-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold transition-all cursor-pointer shadow-xs flex items-center justify-center gap-1.5 active:scale-98"
                        >
                          <MessageSquare className="w-3.5 h-3.5 fill-slate-950" />
                          <span>Grow your restaurant, talk to us</span>
                        </a>
                      </div>
                    )}

                    {/* CUSTOMIZE CAFE & PASS BUTTON */}
                    <button
                      type="button"
                      onClick={() => {
                        setShowUserDropdown(false);
                        openCustomizationModal();
                        sound.playClick();
                      }}
                      className="w-full flex items-center justify-between p-3 bg-gradient-to-r from-amber-50 to-orange-50 hover:from-amber-100 hover:to-orange-100 rounded-2xl border border-amber-200/80 transition-all cursor-pointer text-left group"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-[#0F172A] text-amber-400 flex items-center justify-center shrink-0 shadow-2xs">
                          <Palette className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-xs font-bold text-[#0F172A]">
                            Customize Cafe &amp; Pass
                          </div>
                          <div className="text-[10px] text-slate-500 truncate max-w-[170px]">
                            {selectedBusiness?.name || 'Your Cafe'} • Pass Design
                          </div>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-amber-600 group-hover:translate-x-0.5 transition-transform" />
                    </button>

                    {/* Quick Settings & Navigation Links */}
                    <div className="space-y-1">
                      <button
                        type="button"
                        onClick={() => {
                          setShowUserDropdown(false);
                          setShowSetupModal(true);
                          sound.playClick();
                        }}
                        className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 rounded-xl transition-colors cursor-pointer"
                      >
                        <div className="flex items-center gap-2">
                          <Palette className="w-4 h-4 text-purple-600" />
                          <span>Store Setup &amp; Themes</span>
                        </div>
                        <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setShowUserDropdown(false);
                          setActiveTab('settings');
                          sound.playClick();
                        }}
                        className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 rounded-xl transition-colors cursor-pointer"
                      >
                        <div className="flex items-center gap-2">
                          <Settings className="w-4 h-4 text-slate-500" />
                          <span>Reward &amp; Store Settings</span>
                        </div>
                        <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                      </button>

                      <button
                        type="button"
                        onClick={handleSignOut}
                        className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Sign out</span>
                      </button>
                    </div>
                  </div>
                </>
              )}
              </div>
            ) : (
              <Link
                href="/login"
                className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 px-3 py-1.5 rounded-full border border-slate-200 hover:bg-slate-50 transition-all shadow-2xs"
              >
                <User className="w-3.5 h-3.5 text-slate-500" />
                <span>Log In</span>
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* ========================================================================= */}
      {/* 2. MAIN DASHBOARD CONTENT */}
      {/* ========================================================================= */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-10 py-5 sm:py-8 pb-36 sm:pb-40 space-y-6 sm:space-y-8">
        {/* Onboarding Incomplete Setup Banner */}
        {selectedBusiness && !isBusinessSetupDone(selectedBusiness) && (
          <div className="p-4 rounded-3xl bg-gradient-to-r from-amber-500/10 via-amber-50 to-emerald-50 border border-amber-300 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-in fade-in">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center font-bold shrink-0 shadow-xs">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-display font-bold text-sm text-slate-900 flex items-center gap-2">
                  <span>Welcome! Complete your 1-time store setup</span>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-amber-200 text-amber-950">
                    PENDING SETUP
                  </span>
                </h3>
                <p className="text-xs text-slate-600">
                  Set your store name, category, stamp rewards, and choose from stunning pass themes.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                sound.playClick();
                setShowSetupModal(true);
              }}
              className="px-4 py-2 rounded-2xl bg-[#0F172A] hover:bg-black active:scale-[0.99] text-white font-display font-bold text-xs shadow-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
            >
              <span>Set Up My Business</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Onboarding Success Pill if just registered */}
        {isNewStore && (
          <div className="p-4 bg-emerald-600 text-white rounded-2xl flex items-center justify-between shadow-md animate-in fade-in duration-300">
            <div className="flex items-center gap-3">
              <Sparkles className="w-5 h-5 text-amber-300 shrink-0" />
              <div>
                <div className="font-display font-bold text-sm">🎉 Congratulations! {selectedBusiness?.name} is live!</div>
                <div className="text-xs text-emerald-100 font-medium">
                  {SUBSCRIPTION_ENABLED
                    ? 'Your store loyalty pass QR code and counter tools are ready to use with your 30-day free trial.'
                    : 'Your store loyalty pass QR code and counter tools are ready to use.'}
                </div>
              </div>
            </div>
            <button
              onClick={() => router.replace('/dashboard')}
              className="px-3 py-1 rounded-full bg-white/20 hover:bg-white/30 text-xs font-semibold cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Payment / Subscription Status Feedback Notification */}
        {paymentNotice && (
          <div className="p-4 bg-emerald-50 border border-emerald-200/90 rounded-2xl flex items-center justify-between shadow-xs animate-in fade-in">
            <div className="flex items-center gap-2.5 text-xs text-emerald-900 font-medium">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 stroke-[2.5]" />
              <span>{paymentNotice}</span>
            </div>
            <button
              onClick={() => setPaymentNotice(null)}
              className="text-xs text-emerald-700 hover:text-emerald-950 font-bold px-2 py-1 rounded-lg hover:bg-emerald-100"
            >
              ✕
            </button>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 1: HOME (Hero Extra Sales, 5 Key Metrics, Counter Tool, Pass Share)    */}
        {/* ========================================================================= */}
        {activeTab === 'home' && (
          <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-200">
            {/* 5 KEY NUMERIC METRIC CARDS */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
              {/* 1. Offers Sent */}
              <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-100 card-soft-shadow hover:border-slate-200 transition-all">
                <div className="flex items-center justify-between text-slate-400 mb-2">
                  <span className="text-[10px] sm:text-[11px] font-mono font-bold uppercase tracking-wider text-slate-500">Offers Sent</span>
                  <MessageSquare className="w-4 h-4 text-[#0F172A]" />
                </div>
                <div className="font-display font-black text-2xl sm:text-3xl text-[#0F172A] tracking-tight">
                  {metrics?.totalNudgesSent ?? 0}
                </div>
                <div className="text-[10px] sm:text-[11px] text-slate-500 mt-1 truncate">
                  {(metrics?.totalNudgesSent ?? 0) === 1 ? '1 invite sent' : `${metrics?.totalNudgesSent ?? 0} invites sent`}
                </div>
              </div>

              {/* 2. Customers Returned */}
              <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-100 card-soft-shadow hover:border-slate-200 transition-all">
                <div className="flex items-center justify-between text-slate-400 mb-2">
                  <span className="text-[10px] sm:text-[11px] font-mono font-bold uppercase tracking-wider text-slate-500">Returned</span>
                  <Percent className="w-4 h-4 text-emerald-600" />
                </div>
                <div className="font-display font-black text-2xl sm:text-3xl text-emerald-600 tracking-tight">
                  {metrics?.convertedCount ?? 0} <span className="text-xs sm:text-sm font-bold text-slate-400">({metrics?.conversionRate ?? 0}%)</span>
                </div>
                <div className="text-[10px] sm:text-[11px] text-slate-500 mt-1 truncate">
                  {(metrics?.totalNudgesSent ?? 0) > 0
                    ? (metrics?.convertedCount ?? 0) > 0
                      ? 'Came back & ordered'
                      : 'Waiting for visit'
                    : 'Repeat regulars'}
                </div>
              </div>

              {/* 3. Total Customers */}
              <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-100 card-soft-shadow hover:border-slate-200 transition-all">
                <div className="flex items-center justify-between text-slate-400 mb-2">
                  <span className="text-[10px] sm:text-[11px] font-mono font-bold uppercase tracking-wider text-slate-500">Customers</span>
                  <Users className="w-4 h-4 text-blue-600" />
                </div>
                <div className="font-display font-black text-2xl sm:text-3xl text-[#0F172A] tracking-tight">
                  {metrics?.totalMembers ?? 0}
                </div>
                <div className="text-[10px] sm:text-[11px] text-slate-500 mt-1 font-mono text-amber-700 font-semibold truncate">
                  {(metrics?.atRiskCount ?? 0) > 0 ? `${metrics?.atRiskCount} inactive` : 'All active'}
                </div>
              </div>

              {/* 4. Total Rewards Given */}
              <div
                onClick={() => {
                  setActiveTab('reward');
                  sound.playClick();
                }}
                className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-100 card-soft-shadow hover:border-slate-300 transition-all cursor-pointer group"
              >
                <div className="flex items-center justify-between text-slate-500 mb-2">
                  <span className="text-[10px] sm:text-[11px] font-mono font-bold uppercase tracking-wider text-slate-500">Rewards Given</span>
                  <Gift className="w-4 h-4 text-slate-700 group-hover:scale-110 transition-transform" />
                </div>
                <div className="font-display font-black text-2xl sm:text-3xl text-[#0F172A] tracking-tight">
                  {metrics?.totalRewardsClaimed ?? 0}
                </div>
                <div className="text-[10px] sm:text-[11px] text-slate-500 mt-1 font-mono font-semibold truncate flex items-center gap-1">
                  {(metrics?.todayRewardsClaimed ?? 0) > 0 ? (
                    <span className="text-emerald-600 font-bold">+{metrics?.todayRewardsClaimed} today</span>
                  ) : (
                    <span>All tracked &amp; verified</span>
                  )}
                </div>
              </div>

              {/* 5. Stamps Card with Time Filter & Counter vs QR breakdown */}
              <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-100 card-soft-shadow hover:border-slate-200 transition-all flex flex-col justify-between col-span-2 sm:col-span-1 lg:col-span-1">
                <div>
                  <div className="flex items-center justify-between text-slate-400 mb-2">
                    <span className="text-[10px] sm:text-[11px] font-mono font-bold uppercase tracking-wider text-slate-500">
                      {stampTimeRange === 'today'
                        ? 'Today Stamps'
                        : stampTimeRange === '7d'
                        ? '7-Day Stamps'
                        : stampTimeRange === '30d'
                        ? '30-Day Stamps'
                        : 'All-Time'}
                    </span>

                    {/* Time Range Selector Dropdown */}
                    <div className="relative inline-block text-left">
                      <select
                        value={stampTimeRange}
                        onChange={(e) => {
                          sound.playClick();
                          setStampTimeRange(e.target.value as 'today' | '7d' | '30d' | 'all');
                        }}
                        className="text-[10px] font-mono font-bold bg-slate-100 hover:bg-slate-200/80 text-slate-700 py-1 pl-2 pr-6 rounded-lg border border-slate-200 cursor-pointer outline-hidden appearance-none transition-colors"
                      >
                        <option value="today">Today</option>
                        <option value="7d">7 Days</option>
                        <option value="30d">30 Days</option>
                        <option value="all">All Time</option>
                      </select>
                      <ChevronDown className="w-3 h-3 text-slate-500 absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                  </div>

                  {(() => {
                    const currentPeriod =
                      stampTimeRange === 'today'
                        ? metrics?.stampStats?.today
                        : stampTimeRange === '7d'
                        ? metrics?.stampStats?.sevenDays
                        : stampTimeRange === '30d'
                        ? metrics?.stampStats?.thirtyDays
                        : metrics?.stampStats?.allTime;

                    const totalStamps = currentPeriod?.totalStamps ?? metrics?.todayStampsCount ?? 0;
                    const counterStamps = currentPeriod?.counterStamps ?? (metrics as any)?.todayCounterStamps ?? totalStamps;
                    const qrScans = currentPeriod?.qrScans ?? metrics?.todayScansCount ?? 0;

                    return (
                      <>
                        <div className="font-display font-black text-2xl sm:text-3xl text-[#0F172A] tracking-tight">
                          {totalStamps}
                        </div>
                        <div className="text-[10px] sm:text-[11px] text-slate-500 mt-1 font-mono flex flex-wrap items-center gap-1.5 leading-tight">
                          <span className="text-slate-700 font-semibold">
                            {counterStamps} counter
                          </span>
                          <span className="text-slate-300">•</span>
                          <span className="text-amber-700 font-semibold">
                            {qrScans} QR
                          </span>
                        </div>
                      </>
                    );
                  })()}
                </div>
              </div>
            </div>

            {/* VERIFY REWARD ON DASHBOARD HOME (QUICK SALON COUNTER VERIFICATION) */}
            <div className="bg-white rounded-3xl p-5 sm:p-7 border border-slate-200/90 card-soft-shadow space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3.5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-[#0F172A] text-white flex items-center justify-center shrink-0 shadow-xs">
                    <ShieldCheck className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-display font-black text-base sm:text-lg text-[#0F172A] tracking-tight">
                        VERIFY REWARD
                      </h3>
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                        Counter Tool
                      </span>
                    </div>
                    <p className="text-xs text-slate-500">
                      Enter customer&apos;s 6-digit reward code to verify and confirm treat redemption
                    </p>
                  </div>
                </div>

                {rewardVerificationState.status !== 'idle' && (
                  <button
                    type="button"
                    onClick={handleResetRewardVerification}
                    className="text-xs font-semibold text-slate-500 hover:text-slate-800 flex items-center gap-1 self-start sm:self-auto cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Clear / Verify Another</span>
                  </button>
                )}
              </div>

              {/* IDLE / CODE ENTRY STATE */}
              {rewardVerificationState.status === 'idle' && (
                <form onSubmit={handleVerifyRewardCode} className="space-y-4 pt-1 max-w-xl">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5 font-mono">
                      Enter 6-digit reward code
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        maxLength={6}
                        value={verifyRewardCode}
                        onChange={(e) => setVerifyRewardCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        placeholder="4 8 3 9 2 1"
                        className="w-full px-5 py-3.5 rounded-2xl border-2 border-slate-200 focus:border-[#0F172A] bg-slate-50/70 focus:bg-white text-center font-mono font-black text-2xl sm:text-3xl tracking-[0.3em] text-[#0F172A] placeholder:text-slate-300 focus:outline-none transition-all shadow-inner"
                        autoComplete="off"
                        required
                      />
                      {verifyRewardCode && (
                        <button
                          type="button"
                          onClick={() => setVerifyRewardCode('')}
                          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1.5 font-mono">
                      Customer shows this code after claiming reward on their loyalty pass.
                    </p>
                  </div>

                  <button
                    type="submit"
                    disabled={verifyRewardCode.trim().length !== 6 || isVerifyingReward}
                    className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-[#0F172A] hover:bg-black disabled:bg-slate-200 disabled:text-slate-400 text-white font-display font-bold text-xs uppercase tracking-wider transition-all shadow-md active:scale-95 cursor-pointer disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isVerifyingReward ? (
                      <RefreshCw className="w-4 h-4 animate-spin text-emerald-400" />
                    ) : (
                      <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    )}
                    <span>{isVerifyingReward ? 'Verifying...' : 'VERIFY REWARD'}</span>
                  </button>
                </form>
              )}

              {/* STATE 1: VALID REWARD + PENDING */}
              {rewardVerificationState.status === 'PENDING' && (
                <div className="bg-emerald-50/70 border-2 border-emerald-500/40 rounded-2xl p-5 sm:p-6 space-y-4 animate-in fade-in">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2 text-emerald-800 font-display font-black text-sm sm:text-base tracking-wide">
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                      <span>✓ VALID REWARD</span>
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full font-mono text-[11px] font-bold bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-amber-700" />
                      Status: PENDING
                    </span>
                  </div>

                  <div className="bg-white/90 rounded-xl p-4 border border-emerald-200/80 space-y-2 text-xs">
                    <div className="flex justify-between items-baseline gap-2 pb-1.5 border-b border-slate-100">
                      <span className="text-slate-500 font-medium">Reward:</span>
                      <span className="font-bold text-slate-900 text-sm font-display text-right">
                        {rewardVerificationState.claim?.reward_desc || 'Free Treat'}
                      </span>
                    </div>

                    <div className="flex justify-between items-center gap-2 pb-1.5 border-b border-slate-100 font-mono">
                      <span className="text-slate-500">Code:</span>
                      <span className="font-bold text-slate-900 text-base tracking-widest">
                        {rewardVerificationState.claim?.voucher_code || verifyRewardCode}
                      </span>
                    </div>

                    {rewardVerificationState.claim?.customer?.name && (
                      <div className="flex justify-between items-center gap-2 pb-1.5 border-b border-slate-100">
                        <span className="text-slate-500 font-medium">Customer:</span>
                        <span className="font-bold text-slate-800">
                          {rewardVerificationState.claim.customer.name}
                          {rewardVerificationState.claim.customer.phone ? ` (${rewardVerificationState.claim.customer.phone})` : ''}
                        </span>
                      </div>
                    )}

                    <div className="flex justify-between items-center gap-2 font-mono">
                      <span className="text-slate-500">Status:</span>
                      <span className="font-bold text-amber-700">PENDING</span>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3 pt-1">
                    <button
                      type="button"
                      onClick={handleConfirmRewardRedemption}
                      disabled={isConfirmingRedemption}
                      className="flex-1 py-3.5 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-display font-bold text-xs uppercase tracking-wider shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
                    >
                      {isConfirmingRedemption ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                        <Check className="w-4 h-4 stroke-[3]" />
                      )}
                      <span>{isConfirmingRedemption ? 'Confirming...' : 'CONFIRM REDEMPTION'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleResetRewardVerification}
                      className="py-3 px-5 rounded-xl border border-slate-300 text-slate-700 hover:bg-white text-xs font-semibold cursor-pointer"
                    >
                      Cancel / Back
                    </button>
                  </div>
                </div>
              )}

              {/* STATE 2: REDEEMED CONFIRMED SUCCESS (PENDING -> REDEEMED) */}
              {rewardVerificationState.status === 'CONFIRMED_SUCCESS' && (
                <div className="bg-emerald-50 border-2 border-emerald-500 rounded-2xl p-5 sm:p-6 space-y-4 animate-in fade-in">
                  <div className="flex items-center gap-2 text-emerald-800 font-display font-black text-sm sm:text-base">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                    <span>✓ REDEMPTION CONFIRMED</span>
                  </div>

                  <div className="bg-white rounded-xl p-4 border border-emerald-200 space-y-2 text-xs">
                    <div className="flex justify-between items-center gap-2 pb-1.5 border-b border-slate-100">
                      <span className="text-slate-500 font-medium">Reward:</span>
                      <span className="font-bold text-slate-900 font-display">
                        {rewardVerificationState.claim?.reward_desc}
                      </span>
                    </div>
                    <div className="flex justify-between items-center gap-2 pb-1.5 border-b border-slate-100 font-mono">
                      <span className="text-slate-500">Code:</span>
                      <span className="font-bold text-slate-900 tracking-widest">
                        {rewardVerificationState.claim?.voucher_code || verifyRewardCode}
                      </span>
                    </div>
                    <div className="flex justify-between items-center gap-2 font-mono">
                      <span className="text-slate-500">Status:</span>
                      <span className="font-bold text-emerald-700">REDEEMED</span>
                    </div>
                  </div>

                  <p className="text-xs text-emerald-900 font-medium">
                    This reward has been marked as <b>REDEEMED</b> and cannot be redeemed again.
                  </p>

                  <button
                    type="button"
                    onClick={handleResetRewardVerification}
                    className="w-full sm:w-auto py-3 px-6 rounded-xl bg-[#0F172A] hover:bg-black text-white font-display font-bold text-xs uppercase tracking-wider transition-all shadow-md cursor-pointer"
                  >
                    Verify Another Reward
                  </button>
                </div>
              )}

              {/* STATE 3: ALREADY REDEEMED */}
              {rewardVerificationState.status === 'ALREADY_REDEEMED' && (
                <div className="bg-rose-50/80 border-2 border-rose-300 rounded-2xl p-5 sm:p-6 space-y-3.5 text-left animate-in fade-in">
                  <div className="flex items-center gap-2 text-rose-800 font-display font-black text-sm sm:text-base">
                    <XCircle className="w-5 h-5 text-rose-600 shrink-0" />
                    <span>✕ ALREADY REDEEMED</span>
                  </div>

                  <p className="text-xs text-rose-800 font-medium">
                    This reward has already been redeemed.
                  </p>

                  <div className="bg-white/90 rounded-xl p-3.5 border border-rose-200 space-y-1.5 text-xs">
                    <div className="flex justify-between items-center gap-2">
                      <span className="text-slate-500 font-medium">Reward:</span>
                      <span className="font-bold text-slate-800 font-display">
                        {rewardVerificationState.claim?.reward_desc || 'Free Treat'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center gap-2 font-mono">
                      <span className="text-slate-500">Code:</span>
                      <span className="font-bold text-slate-800 tracking-wider">
                        {rewardVerificationState.claim?.voucher_code || verifyRewardCode}
                      </span>
                    </div>
                    <div className="pt-1 text-[11px] font-mono text-slate-600">
                      <div>Redeemed:</div>
                      <div className="font-bold text-slate-900 mt-0.5">
                        {formatRedeemedDate(rewardVerificationState.claim?.redeemed_at || rewardVerificationState.claim?.claimed_at)}
                      </div>
                    </div>
                  </div>

                  {/* NO REDEMPTION BUTTON SHOWN */}
                  <button
                    type="button"
                    onClick={handleResetRewardVerification}
                    className="w-full sm:w-auto py-2.5 px-5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 font-display font-bold text-xs uppercase tracking-wider transition-all shadow-2xs cursor-pointer"
                  >
                    Check Another Code
                  </button>
                </div>
              )}

              {/* STATE 4: INVALID REWARD CODE */}
              {rewardVerificationState.status === 'INVALID' && (
                <div className="bg-rose-50/80 border-2 border-rose-300 rounded-2xl p-5 sm:p-6 space-y-3.5 text-left animate-in fade-in">
                  <div className="flex items-center gap-2 text-rose-800 font-display font-black text-sm sm:text-base">
                    <XCircle className="w-5 h-5 text-rose-600 shrink-0" />
                    <span>✕ INVALID REWARD CODE</span>
                  </div>

                  <p className="text-xs text-rose-800 font-medium">
                    This reward code does not exist.
                  </p>

                  <button
                    type="button"
                    onClick={handleResetRewardVerification}
                    className="w-full sm:w-auto py-2.5 px-5 rounded-xl bg-[#0F172A] hover:bg-black text-white font-display font-bold text-xs uppercase tracking-wider transition-all shadow-2xs cursor-pointer"
                  >
                    Try Again
                  </button>
                </div>
              )}
            </div>

            {/* COUNTER STAMPING TOOL (FAST 2-STEP SEARCH & POS PANEL) */}
            <div className="bg-white rounded-3xl p-4 sm:p-6 md:p-8 border border-slate-100 card-soft-shadow space-y-5 sm:space-y-6">
              {!selectedCounterMember && !isNewWalkInMode ? (
                /* STEP 1: FAST SEARCH & SELECT CUSTOMER */
                <div className="space-y-5 sm:space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 border-b border-slate-100 pb-4 sm:pb-5">
                    <div>
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-xl bg-[#0F172A] text-white flex items-center justify-center shrink-0 shadow-2xs">
                          <PlusCircle className="w-4 h-4 text-emerald-400" />
                        </div>
                        <h3 className="font-display font-bold text-lg text-[#0F172A]">
                          Give Stamps at Counter
                        </h3>
                      </div>
                      <p className="text-xs text-slate-500 mt-1">
                        Search customer by name or phone to award stamps or redeem rewards in 1-click
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setIsNewWalkInMode(true);
                        setCounterFeedback(null);
                        sound.playClick();
                      }}
                      className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-all cursor-pointer shadow-2xs active:scale-95 self-start sm:self-auto shrink-0"
                    >
                      <UserPlus className="w-3.5 h-3.5 text-slate-600" />
                      <span>+ Walk-in Guest</span>
                    </button>
                  </div>

                  {/* Big Tactile Search Bar */}
                  <div className="relative">
                    <Search className="w-4 h-4 sm:w-5 sm:h-5 absolute left-3.5 sm:left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    <input
                      type="text"
                      value={counterSearch}
                      onChange={(e) => setCounterSearch(e.target.value)}
                      placeholder="Search customer by name or mobile number (e.g. Rahul, Priya, 98765...)"
                      className="w-full pl-10 sm:pl-12 pr-10 py-3 sm:py-3.5 rounded-2xl border-2 border-slate-200/90 focus:border-[#0F172A] bg-slate-50/50 focus:bg-white text-xs sm:text-sm font-medium text-slate-900 focus:outline-none transition-all placeholder:text-slate-400 shadow-inner"
                    />
                    {counterSearch && (
                      <button
                        onClick={() => setCounterSearch('')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-200/70 cursor-pointer"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {/* Feedback Banner if any */}
                  {counterFeedback && (
                    <div
                      className={`p-3.5 sm:p-4 rounded-2xl text-xs font-semibold flex items-center justify-between gap-3 ${
                        counterFeedback.type === 'success'
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                          : 'bg-rose-50 text-rose-800 border border-rose-200'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>{counterFeedback.message}</span>
                      </div>
                      <button
                        onClick={() => setCounterFeedback(null)}
                        className="text-xs opacity-60 hover:opacity-100 cursor-pointer"
                      >
                        ✕
                      </button>
                    </div>
                  )}

                  {/* Customer List Header */}
                  <div className="flex items-center justify-between text-xs font-mono font-semibold text-slate-400 pt-1">
                    <span>{counterSearch ? 'SEARCH RESULTS' : 'RECENT REGULARS'}</span>
                    <span>{filteredCounterMembers.length} found</span>
                  </div>

                  {/* Customer Cards Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {filteredCounterMembers.slice(0, counterSearch ? undefined : 8).map((m) => {
                      const stampsNeeded = selectedBusiness?.reward_rule.stamps_needed || 6;
                      const isRewardReady = (m.stamps || 0) >= stampsNeeded;

                      return (
                        <div
                          key={m.id}
                          onClick={() => handleSelectCounterCustomer(m)}
                          className="p-3.5 sm:p-4 rounded-2xl border border-slate-200/80 bg-white hover:border-[#0F172A] hover:shadow-sm transition-all cursor-pointer group flex items-center justify-between gap-2.5 sm:gap-3 relative overflow-hidden active:scale-[0.99]"
                        >
                          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
                            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl bg-[#0F172A] text-white flex items-center justify-center font-bold text-xs sm:text-sm shadow-2xs group-hover:scale-105 transition-transform shrink-0">
                              {(m.customer?.name || 'G')[0].toUpperCase()}
                            </div>
                            <div className="min-w-0 flex-1">
                              <h4 className="font-display font-bold text-sm text-[#0F172A] truncate">
                                {m.customer?.name || 'Valued Customer'}
                              </h4>
                              <div className="flex items-center gap-2 mt-0.5 text-[11px] font-mono text-slate-500 min-w-0">
                                <span className="shrink-0">{m.customer?.phone}</span>
                                <span className="text-slate-300 shrink-0">•</span>
                                <div className="flex items-center gap-1 shrink-0">
                                  <div className="flex items-center gap-0.5">
                                    {Array.from({ length: stampsNeeded }).map((_, i) => (
                                      <span
                                        key={i}
                                        className={`w-1.5 h-1.5 rounded-full ${
                                          i < (m.stamps || 0)
                                            ? 'bg-amber-500'
                                            : 'bg-slate-200'
                                        }`}
                                      />
                                    ))}
                                  </div>
                                  <span className="text-[10px] font-bold text-slate-600 ml-0.5">
                                    {m.stamps}/{stampsNeeded}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="shrink-0 flex items-center gap-1.5">
                            {isRewardReady ? (
                              <button
                                type="button"
                                className="px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1 cursor-pointer whitespace-nowrap active:scale-95"
                              >
                                <Gift className="w-3.5 h-3.5" />
                                <span>Redeem</span>
                              </button>
                            ) : (
                              <button
                                type="button"
                                className="px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-xl bg-[#0F172A] group-hover:bg-black text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1 cursor-pointer whitespace-nowrap active:scale-95"
                              >
                                <PlusCircle className="w-3.5 h-3.5 text-emerald-400" />
                                <span>Give Stamp</span>
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteMember(m.id);
                              }}
                              className="p-1.5 sm:p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-all opacity-0 group-hover:opacity-100 cursor-pointer shadow-2xs"
                              title="Remove customer from list"
                              aria-label="Remove customer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {filteredCounterMembers.length === 0 && (
                    <div className="text-center py-10 px-4 rounded-2xl bg-slate-50 border border-dashed border-slate-200 space-y-3">
                      <div className="w-10 h-10 rounded-full bg-slate-200 text-slate-500 flex items-center justify-center mx-auto">
                        <Search className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="font-display font-bold text-sm text-[#0F172A]">
                          No customer found for &quot;{counterSearch}&quot;
                        </p>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Add them as a new customer to give their first stamp
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setIsNewWalkInMode(true);
                          if (/^\d+$/.test(counterSearch.replace(/\s+/g, ''))) {
                            setWalkInPhone(counterSearch);
                            setWalkInName('');
                          } else {
                            setWalkInName(counterSearch);
                            setWalkInPhone('');
                          }
                          sound.playClick();
                        }}
                        className="px-4 py-2 rounded-full bg-[#0F172A] text-white text-xs font-bold hover:bg-black transition-all inline-flex items-center gap-1.5 cursor-pointer shadow-xs"
                      >
                        <UserPlus className="w-3.5 h-3.5 text-emerald-400" />
                        <span>+ Register &quot;{counterSearch}&quot; as New Customer</span>
                      </button>
                    </div>
                  )}
                </div>
              ) : isNewWalkInMode && !selectedCounterMember ? (
                /* STEP 1.5: QUICK WALK-IN GUEST ENTRY */
                <div className="max-w-lg mx-auto bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 card-soft-shadow space-y-6">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                    <button
                      type="button"
                      onClick={() => {
                        setIsNewWalkInMode(false);
                        sound.playClick();
                      }}
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-[#0F172A] transition-colors cursor-pointer"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      <span>Back to Search</span>
                    </button>
                    <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-400">
                      New Walk-in Guest
                    </span>
                  </div>

                  <div className="text-center space-y-1">
                    <div className="w-12 h-12 rounded-2xl bg-slate-100 text-[#0F172A] flex items-center justify-center mx-auto mb-2">
                      <UserPlus className="w-6 h-6 text-emerald-600" />
                    </div>
                    <h3 className="font-display font-bold text-lg text-[#0F172A]">
                      Register New Customer
                    </h3>
                    <p className="text-xs text-slate-500">
                      Enter their mobile number to start their digital stamp card
                    </p>
                  </div>

                  <form onSubmit={handleCounterWalkInSubmit} className="space-y-4 text-left">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                        Customer Mobile Number *
                      </label>
                      <input
                        type="tel"
                        value={walkInPhone}
                        onChange={(e) => setWalkInPhone(e.target.value)}
                        placeholder="+91 98765 43210"
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50/50 text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0F172A] focus:bg-white"
                        required
                        autoFocus
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                        Customer Name (Optional)
                      </label>
                      <input
                        type="text"
                        value={walkInName}
                        onChange={(e) => setWalkInName(e.target.value)}
                        placeholder="e.g. Rahul Sharma"
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0F172A] focus:bg-white"
                      />
                    </div>


                    <button
                      type="submit"
                      disabled={isCounterSubmitting}
                      className="w-full py-3.5 rounded-full bg-[#0F172A] hover:bg-black active:scale-95 text-white font-semibold text-xs sm:text-sm uppercase tracking-wider transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer mt-2"
                    >
                      {isCounterSubmitting ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <PlusCircle className="w-4 h-4 text-emerald-400" />
                          <span>Give Stamp &amp; Create Pass</span>
                        </>
                      )}
                    </button>
                  </form>
                </div>
              ) : (
                /* STEP 2: GIVE STAMP / REDEEM PANEL FOR SELECTED CUSTOMER */
                selectedCounterMember && (
                  <div className="max-w-2xl mx-auto bg-white rounded-3xl p-6 sm:p-9 border border-slate-100 card-soft-shadow space-y-7 animate-stamp">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedCounterMember(null);
                          setCounterFeedback(null);
                          sound.playClick();
                        }}
                        className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-800 transition-all cursor-pointer active:scale-95"
                      >
                        <ArrowLeft className="w-4 h-4" />
                        <span>Back to Customer Search</span>
                      </button>
                    </div>

                    {/* Customer Identity Card */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-slate-50 border border-slate-200/80">
                      <div className="flex items-center gap-3.5">
                        <div className="w-13 h-13 rounded-2xl bg-[#0F172A] text-white flex items-center justify-center font-bold text-lg shadow-sm">
                          {(selectedCounterMember.customer?.name || 'G')[0].toUpperCase()}
                        </div>
                        <div>
                          <h4 className="font-display font-bold text-lg text-[#0F172A]">
                            {selectedCounterMember.customer?.name || 'Valued Regular'}
                          </h4>
                          <div className="text-xs font-mono text-slate-500">
                            {selectedCounterMember.customer?.phone}
                          </div>
                          <div className="text-[11px] text-slate-400 mt-0.5">
                            {selectedCounterMember.total_visits} total visits • Last visited {selectedCounterMember.days_since_last_visit ?? 0}d ago
                          </div>
                        </div>
                      </div>

                      <Link
                        href={`/c/${selectedBusiness?.slug}?phone=${encodeURIComponent(selectedCounterMember.customer?.phone || '')}`}
                        target="_blank"
                        className="text-xs font-semibold text-slate-600 hover:text-[#0F172A] flex items-center gap-1 self-start sm:self-center"
                      >
                        <span>View Pass</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </Link>
                    </div>

                    {/* Visual Stamp Card */}
                    <div className="p-6 rounded-3xl bg-[#0F172A] text-white space-y-4 shadow-lg border border-slate-800">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-mono font-bold uppercase tracking-widest text-slate-400">
                          DIGITAL STAMP CARD
                        </span>
                        <span className="font-bold text-amber-400">
                          {selectedCounterMember.stamps} / {selectedBusiness?.reward_rule.stamps_needed || 6} Stamps
                        </span>
                      </div>

                      <div className="grid grid-cols-6 gap-2.5 sm:gap-3 py-2">
                        {Array.from({ length: selectedBusiness?.reward_rule.stamps_needed || 6 }).map((_, i) => {
                          const isFilled = i < (selectedCounterMember.stamps || 0);
                          const isFinalReward = i === (selectedBusiness?.reward_rule.stamps_needed || 6) - 1;

                          return (
                            <div
                              key={i}
                              className={`aspect-square rounded-2xl flex flex-col items-center justify-center transition-all ${
                                isFilled
                                  ? 'bg-amber-400 text-slate-950 font-bold shadow-md scale-100'
                                  : isFinalReward
                                  ? 'bg-amber-400/15 border-2 border-dashed border-amber-400/60 text-amber-300'
                                  : 'bg-slate-800/80 border border-slate-700 text-slate-500'
                              }`}
                            >
                              {isFilled ? (
                                <Check className="w-5 h-5 stroke-[3]" />
                              ) : isFinalReward ? (
                                <Gift className="w-5 h-5 text-amber-400 animate-pulse" />
                              ) : (
                                <span className="text-xs font-mono font-bold text-slate-500">{i + 1}</span>
                              )}
                            </div>
                          );
                        })}
                      </div>

                      <div className="text-center text-xs text-slate-300 font-medium">
                        🎁 Reward at {selectedBusiness?.reward_rule.stamps_needed || 6} stamps: <b className="text-white">{selectedBusiness?.reward_rule.reward_title || 'Free Treat'}</b>
                      </div>
                    </div>

                    {/* Stamp & Bill Action Form */}
                    <div className="space-y-5">
                      {counterFeedback && (
                        <div
                          className={`p-4 rounded-2xl text-xs font-semibold space-y-2 ${
                            counterFeedback.type === 'success'
                              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                              : 'bg-rose-50 text-rose-800 border border-rose-200'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                            <span>{counterFeedback.message}</span>
                          </div>
                        </div>
                      )}

                      {/* How many stamps */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <label className="block text-xs font-semibold text-slate-700">
                            How many stamps to award today?
                          </label>
                          <span className="text-[11px] font-mono text-slate-500 font-bold">
                            Selected: +{counterStampsToAward} Stamp{counterStampsToAward > 1 ? 's' : ''}
                          </span>
                        </div>
                        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                          {[1, 2, 3, 4, 5, 6].map((num) => {
                            const isFull = num === (selectedBusiness?.reward_rule.stamps_needed || 6);
                            return (
                              <button
                                key={num}
                                type="button"
                                onClick={() => {
                                  setCounterStampsToAward(num);
                                  sound.playClick();
                                }}
                                className={`py-2.5 rounded-xl text-xs font-bold border transition-all cursor-pointer flex flex-col items-center justify-center ${
                                  counterStampsToAward === num
                                    ? 'bg-[#0F172A] text-white border-[#0F172A] shadow-xs ring-2 ring-amber-400'
                                    : isFull
                                    ? 'bg-amber-50 text-amber-900 border-amber-300 hover:bg-amber-100'
                                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                                }`}
                              >
                                <span>+{num}</span>
                                <span className="text-[9px] opacity-75 font-normal">
                                  {isFull ? 'Full Card' : `Stamp${num > 1 ? 's' : ''}`}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </div>


                      {/* Action Buttons */}
                      <div className="space-y-2.5 pt-2">
                        {selectedCounterMember.stamps >= (selectedBusiness?.reward_rule.stamps_needed || 6) ? (
                          <button
                            type="button"
                            onClick={handleCounterRedeemReward}
                            disabled={isCounterSubmitting}
                            className="w-full py-4 rounded-2xl bg-amber-500 hover:bg-amber-600 active:scale-95 text-white font-bold text-sm uppercase tracking-wider transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
                          >
                            {isCounterSubmitting ? (
                              <RefreshCw className="w-4 h-4 animate-spin" />
                            ) : (
                              <>
                                <Gift className="w-4 h-4" />
                                <span>Redeem Free Reward ({selectedBusiness?.reward_rule.reward_title || 'Free Treat'})</span>
                              </>
                            )}
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={handleCounterAwardStamp}
                            disabled={isCounterSubmitting}
                            className="w-full py-4 rounded-2xl bg-[#0F172A] hover:bg-black active:scale-95 text-white font-bold text-sm uppercase tracking-wider transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
                          >
                            {isCounterSubmitting ? (
                              <RefreshCw className="w-4 h-4 animate-spin" />
                            ) : (
                              <>
                                <PlusCircle className="w-4 h-4 text-emerald-400" />
                                <span>Give +{counterStampsToAward} Stamp{counterStampsToAward > 1 ? 's' : ''} Now</span>
                              </>
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )
              )}
            </div>

            {/* QUICK PASS LINK & STAND STUDIO PREVIEW */}
            <div className="p-5 sm:p-6 rounded-3xl bg-slate-50 border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="text-xs font-mono font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                  <QrCode className="w-4 h-4 text-emerald-600" />
                  <span>Customer Loyalty Pass URL</span>
                </div>
                <div className="font-mono text-xs text-slate-800 font-semibold truncate max-w-md">
                  {customerQrUrl}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    sound.playClick();
                    setIsQrStandModalOpen(true);
                  }}
                  className="px-4 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-900 text-xs font-bold border border-slate-200 hover:border-slate-300 shadow-2xs transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Counter QR Stand Studio</span>
                </button>

                <button
                  type="button"
                  onClick={handleCopyCustomerLink}
                  className="px-4 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-800 text-xs font-bold border border-slate-200 shadow-2xs transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
                  <span>{copiedLink ? 'Copied!' : 'Copy Link'}</span>
                </button>

                <a
                  href={testPassUrl || customerQrUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="px-4 py-2 rounded-xl bg-[#0F172A] hover:bg-black text-white text-xs font-bold shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <span>Test Pass</span>
                  <ExternalLink className="w-3.5 h-3.5 text-emerald-400" />
                </a>
              </div>
            </div>

            {/* Hidden High-Res SVG for 300 DPI Stand Downloader */}
            <div ref={qrRef} className="hidden" aria-hidden="true">
              <QRCodeSVG
                value={customerQrUrl}
                size={600}
                level="H"
                includeMargin={true}
              />
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: REWARD (Live Card, Active Offers, Rules & Claims Audit Log)        */}
        {/* ========================================================================= */}
        {activeTab === 'reward' && (
          <div className="space-y-5 animate-in fade-in duration-200">


            {/* SECTION 2: ACTIVE REWARDS */}
            {(() => {
              const activeRewards = (selectedBusiness?.active_offers || []).filter(
                (o) => o && o.id !== 'off_1' && o.title !== 'Welcome Treat' && o.title !== 'Welcome Milestone Reward' &&
                       !(o.id === 'off_2' && o.title === 'Free Specialty Beverage')
              );

              return (
                <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-100 card-soft-shadow space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-800 flex items-center justify-center font-bold border border-slate-200">
                        <Gift className="w-4 h-4 text-[#0F172A]" />
                      </div>
                      <div>
                        <h3 className="font-display font-bold text-sm text-[#0F172A] flex items-center gap-2">
                          <span>Active Rewards</span>
                          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                            {activeRewards.length} Active
                          </span>
                        </h3>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        sound.playClick();
                        setNewOfferStamps(6);
                        setNewOfferTitle('');
                        setNewOfferDesc('');
                        setNewOfferBadge('6 Stamps Reward');
                        setNewOfferExpiryDays('30');
                        setShowCreateOfferModal(true);
                      }}
                      className="px-3.5 py-1.5 rounded-xl bg-[#0F172A] hover:bg-black text-white text-xs font-bold shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 shrink-0"
                    >
                      <Plus className="w-3.5 h-3.5 text-emerald-400 stroke-[3]" />
                      <span>+ Create Reward</span>
                    </button>
                  </div>

                  {activeRewards.length === 0 ? (
                    <div className="p-8 text-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 flex flex-col items-center justify-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 shadow-2xs">
                        <Gift className="w-6 h-6 text-slate-400" />
                      </div>
                      <div className="space-y-1">
                        <h4 className="text-sm font-bold text-slate-800 font-display">No active rewards yet</h4>
                        <p className="text-xs text-slate-500 max-w-sm">
                          You haven't created any rewards yet. Click "+ Create Reward" to add milestone rewards for your customers.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          sound.playClick();
                          setNewOfferStamps(6);
                          setNewOfferTitle('');
                          setNewOfferDesc('');
                          setNewOfferBadge('6 Stamps Reward');
                          setNewOfferExpiryDays('30');
                          setShowCreateOfferModal(true);
                        }}
                        className="mt-1 px-4 py-2 rounded-xl bg-[#0F172A] hover:bg-black text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
                      >
                        <Plus className="w-3.5 h-3.5 text-emerald-400 stroke-[3]" />
                        <span>+ Create Reward</span>
                      </button>
                    </div>
                  ) : (
                    <div className={`grid gap-3 ${activeRewards.length > 1 ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1'}`}>
                      {activeRewards.map((offer) => (
                        <div
                          key={offer.id}
                          className="p-4 rounded-2xl border border-slate-200 bg-white flex flex-col justify-between shadow-2xs hover:border-slate-300 transition-all"
                        >
                          <div className="space-y-2">
                            <div className="flex items-center justify-between gap-2">
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-emerald-50 text-emerald-800 border border-emerald-200">
                                <Gift className="w-3 h-3 text-emerald-600" />
                                <span>Unlock at {offer.stamps_needed} Stamps</span>
                              </span>
                              <span className="inline-flex items-center gap-1 text-[11px] font-mono font-bold text-emerald-700">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                <span>Live on Pass</span>
                              </span>
                            </div>

                            <div>
                              <h4 className="text-sm font-bold text-slate-900 font-display">
                                {offer.title}
                              </h4>
                              <p className="text-xs text-slate-600 mt-0.5">
                                {offer.desc || `Unlocked after completing ${offer.stamps_needed} stamps.`}
                              </p>
                            </div>

                            <div className="flex flex-wrap items-center gap-2 pt-0.5 text-[10px] font-mono text-slate-500">
                              <span className="px-2 py-0.5 rounded-md bg-slate-50 border border-slate-200 font-bold text-slate-700">
                                Unlock at: {offer.stamps_needed} Stamps
                              </span>
                              <span className="px-2 py-0.5 rounded-md bg-slate-50 border border-slate-200 flex items-center gap-1">
                                <Clock className="w-3 h-3 text-slate-400" />
                                <span>{offer.expiry_days ? `Expires: ${offer.expiry_days} days` : 'No expiry'}</span>
                              </span>
                            </div>
                          </div>

                          <div className="pt-2.5 mt-2 border-t border-slate-100 flex items-center justify-between">
                            <button
                              type="button"
                              disabled={isDeletingOfferId === offer.id}
                              onClick={() => handleDeleteOffer(offer.id)}
                              className="px-2.5 py-1 rounded-lg text-red-600 hover:bg-red-50 text-[11px] font-semibold transition-all flex items-center gap-1 cursor-pointer disabled:opacity-50"
                            >
                              <Trash2 className="w-3 h-3" />
                              <span>Remove</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleOpenEditOfferModal(offer)}
                              className="px-3 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-[11px] font-bold transition-all flex items-center gap-1 cursor-pointer"
                            >
                              <Edit2 className="w-3 h-3" />
                              <span>Edit</span>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })()}

            {/* SECTION 4: REWARDS GIVEN AUDIT LOG */}
            <div className="bg-white rounded-3xl border border-slate-100 card-soft-shadow overflow-hidden">
              <div className="p-4 sm:p-6 border-b border-slate-100 flex flex-col gap-3.5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h3 className="font-display font-bold text-base text-[#0F172A] flex items-center gap-2">
                      <span>Rewards Given Audit Log</span>
                      <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                        {filteredRewardsList.length} Recorded
                      </span>
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Live timestamped history of every customer reward claimed and verified.
                    </p>
                  </div>

                  <div className="relative w-full sm:w-72">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      value={rewardsSearch}
                      onChange={(e) => {
                        setRewardsSearch(e.target.value);
                        setRewardsPage(1);
                      }}
                      placeholder="Search name, phone, or treat..."
                      className="w-full pl-10 pr-8 py-2 text-xs font-medium rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0F172A]"
                    />
                    {rewardsSearch && (
                      <button
                        onClick={() => {
                          setRewardsSearch('');
                          setRewardsPage(1);
                        }}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* 1-Tap Time Filter Tabs (All, Today, Past 7 Days, Last 30 Days) */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 no-scrollbar">
                  <button
                    type="button"
                    onClick={() => {
                      setRewardsTimeFilter('all');
                      setRewardsPage(1);
                      sound.playClick();
                    }}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                      rewardsTimeFilter === 'all'
                        ? 'bg-[#0F172A] text-white shadow-2xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200/60'
                    }`}
                  >
                    All Time
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setRewardsTimeFilter('today');
                      setRewardsPage(1);
                      sound.playClick();
                    }}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                      rewardsTimeFilter === 'today'
                        ? 'bg-[#0F172A] text-white shadow-2xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200/60'
                    }`}
                  >
                    Today
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setRewardsTimeFilter('7d');
                      setRewardsPage(1);
                      sound.playClick();
                    }}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                      rewardsTimeFilter === '7d'
                        ? 'bg-[#0F172A] text-white shadow-2xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200/60'
                    }`}
                  >
                    Past 7 Days
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setRewardsTimeFilter('30d');
                      setRewardsPage(1);
                      sound.playClick();
                    }}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                      rewardsTimeFilter === '30d'
                        ? 'bg-[#0F172A] text-white shadow-2xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200/60'
                    }`}
                  >
                    Last 30 Days
                  </button>
                </div>
              </div>

              {/* Responsive Content: Mobile Cards + Desktop Table */}
              {paginatedRewardsList.length > 0 ? (
                <>
                  {/* Mobile Compact Cards (No horizontal scroll slider) */}
                  <div className="block md:hidden divide-y divide-slate-100">
                    {paginatedRewardsList.map((r: any) => {
                      const cust = r.customer || metrics?.members.find((m) => m.id === r.membership_id)?.customer;
                      const dateFormatted = new Date(r.claimed_at).toLocaleDateString('en-IN', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      });

                      return (
                        <div key={r.id} className="p-4 space-y-2.5 bg-white">
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className="w-8 h-8 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs">
                                {(cust?.name || 'G')[0].toUpperCase()}
                              </div>
                              <div className="min-w-0">
                                <div className="font-display font-bold text-sm text-[#0F172A] truncate">
                                  {cust?.name || 'Valued Customer'}
                                </div>
                                <div className="text-[11px] text-slate-500 font-mono truncate">
                                  {cust?.phone || cust?.email || 'Walk-in guest'}
                                </div>
                              </div>
                            </div>
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-2xs shrink-0">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              <span>Claimed</span>
                            </span>
                          </div>

                          <div className="flex items-center justify-between text-xs bg-slate-50 p-2.5 rounded-xl border border-slate-100 font-mono">
                            <div className="flex items-center gap-1.5 font-semibold text-slate-800 text-[11px] truncate">
                              <Gift className="w-3.5 h-3.5 text-slate-700 shrink-0" />
                              <span className="truncate">{r.reward_desc || selectedBusiness?.reward_rule?.reward_title || 'Free Treat'}</span>
                            </div>
                            <span className="text-[10px] text-slate-500 shrink-0">
                              {dateFormatted}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Desktop Table View */}
                  <div className="hidden md:block overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-50/75 border-b border-slate-100 text-slate-500 font-mono uppercase text-[10px] tracking-wider">
                          <th className="py-3.5 px-6">Customer</th>
                          <th className="py-3.5 px-4">Reward Given</th>
                          <th className="py-3.5 px-4">Claimed At</th>
                          <th className="py-3.5 px-4">Verified By</th>
                          <th className="py-3.5 px-6 text-right">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {paginatedRewardsList.map((r: any) => {
                          const cust = r.customer || metrics?.members.find((m) => m.id === r.membership_id)?.customer;
                          const dateFormatted = new Date(r.claimed_at).toLocaleDateString('en-IN', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          });

                          return (
                            <tr key={r.id} className="hover:bg-slate-50/60 transition-colors">
                              <td className="py-4 px-6">
                                <div className="flex items-center gap-3">
                                  <div className="w-9 h-9 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs">
                                    {(cust?.name || 'G')[0].toUpperCase()}
                                  </div>
                                  <div>
                                    <div className="font-display font-bold text-sm text-[#0F172A]">
                                      {cust?.name || 'Valued Customer'}
                                    </div>
                                    <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                                      {cust?.phone || cust?.email || 'Walk-in guest'}
                                    </div>
                                  </div>
                                </div>
                              </td>

                              <td className="py-4 px-4">
                                <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                                  <Gift className="w-3.5 h-3.5 text-slate-700 shrink-0" />
                                  <span>{r.reward_desc || selectedBusiness?.reward_rule?.reward_title || 'Free Treat'}</span>
                                </div>
                                <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                                  Completed Stamp Card Cycle
                                </div>
                              </td>

                              <td className="py-4 px-4 text-slate-600 font-mono">
                                {dateFormatted}
                              </td>

                              <td className="py-4 px-4">
                                <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-medium tracking-wide bg-slate-100 text-slate-700 border border-slate-200">
                                  {r.verified_by === 'customer_claim' || r.verified_by === 'customer_self_verify'
                                    ? '📱 Customer Pass'
                                    : r.verified_by === 'cashier_counter' || r.verified_by === 'counter_staff'
                                    ? '🏪 Cashier Counter'
                                    : r.verified_by === 'tester'
                                    ? '🧪 Test Reset'
                                    : r.verified_by || 'Verified'}
                                </span>
                              </td>

                              <td className="py-4 px-6 text-right">
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-2xs">
                                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                  <span>Claimed &amp; Reset</span>
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination Bar (When > 10 items) */}
                  {totalRewardPages > 1 && (
                    <div className="p-4 border-t border-slate-100 flex items-center justify-between gap-3 text-xs bg-slate-50/50">
                      <div className="text-slate-500 font-mono text-[11px]">
                        Showing <span className="font-bold text-slate-800">{(rewardsPage - 1) * REWARDS_PER_PAGE + 1}–{Math.min(rewardsPage * REWARDS_PER_PAGE, filteredRewardsList.length)}</span> of <span className="font-bold text-slate-800">{filteredRewardsList.length}</span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          disabled={rewardsPage === 1}
                          onClick={() => {
                            setRewardsPage((p) => Math.max(1, p - 1));
                            sound.playClick();
                          }}
                          className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 font-semibold text-slate-700 disabled:opacity-40 disabled:pointer-events-none transition-all cursor-pointer shadow-2xs"
                        >
                          Previous
                        </button>

                        <div className="flex items-center gap-1 font-mono font-bold text-[11px] px-2 text-slate-600">
                          {rewardsPage} / {totalRewardPages}
                        </div>

                        <button
                          type="button"
                          disabled={rewardsPage === totalRewardPages}
                          onClick={() => {
                            setRewardsPage((p) => Math.min(totalRewardPages, p + 1));
                            sound.playClick();
                          }}
                          className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 font-semibold text-slate-700 disabled:opacity-40 disabled:pointer-events-none transition-all cursor-pointer shadow-2xs"
                        >
                          Next
                        </button>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="py-14 text-center">
                  <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-700 flex items-center justify-center mx-auto mb-3 border border-slate-200">
                    <Gift className="w-6 h-6 text-slate-700" />
                  </div>
                  <div className="font-display font-bold text-slate-800 text-sm mb-1">
                    {rewardsSearch || rewardsTimeFilter !== 'all' ? 'No matching reward claims found' : 'No rewards given yet'}
                  </div>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto">
                    {rewardsSearch || rewardsTimeFilter !== 'all'
                      ? 'Try selecting a different time filter or clearing your search.'
                      : 'When a customer completes all stamps on their card and redeems their free treat, it will be automatically tracked here.'}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* ========================================================================= */}
        {/* TAB 3: STATS (Stamp Audit Log, CRM Directory, Recent WhatsApp Offers)     */}
        {/* ========================================================================= */}
        {activeTab === 'stats' && (
          <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-200">
            {/* SUB-SECTION SELECTOR FOR STATS: Stamps Activity Log, CRM Directory, WhatsApp Offers */}
            <div className="flex items-center gap-1.5 p-1.5 bg-slate-100 rounded-2xl overflow-x-auto no-scrollbar max-w-full border border-slate-200/60 shadow-xs">
              <button
                type="button"
                onClick={() => {
                  setStatsActiveSection('stamps');
                  sound.playClick();
                }}
                className={`shrink-0 whitespace-nowrap px-4 py-2 rounded-xl text-xs font-bold transition-all inline-flex items-center gap-2 cursor-pointer ${
                  statsActiveSection === 'stamps'
                    ? 'bg-[#0F172A] text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/70'
                }`}
              >
                <Zap className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span className="whitespace-nowrap">Stamp Audit Log</span>
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold shrink-0 ${
                    statsActiveSection === 'stamps' ? 'bg-white/20 text-white' : 'bg-slate-200/90 text-slate-700'
                  }`}
                >
                  {metrics?.recentVisits?.length || 0}
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setStatsActiveSection('crm');
                  sound.playClick();
                }}
                className={`shrink-0 whitespace-nowrap px-4 py-2 rounded-xl text-xs font-bold transition-all inline-flex items-center gap-2 cursor-pointer ${
                  statsActiveSection === 'crm'
                    ? 'bg-[#0F172A] text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/70'
                }`}
              >
                <Users className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                <span className="whitespace-nowrap">Customer CRM</span>
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold shrink-0 ${
                    statsActiveSection === 'crm' ? 'bg-white/20 text-white' : 'bg-slate-200/90 text-slate-700'
                  }`}
                >
                  {metrics?.members?.length || 0}
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setStatsActiveSection('whatsapp');
                  sound.playClick();
                }}
                className={`shrink-0 whitespace-nowrap px-4 py-2 rounded-xl text-xs font-bold transition-all inline-flex items-center gap-2 cursor-pointer ${
                  statsActiveSection === 'whatsapp'
                    ? 'bg-[#0F172A] text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/70'
                }`}
              >
                <MessageSquare className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span className="whitespace-nowrap">WhatsApp Offers</span>
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold shrink-0 ${
                    statsActiveSection === 'whatsapp' ? 'bg-white/20 text-white' : 'bg-slate-200/90 text-slate-700'
                  }`}
                >
                  {metrics?.recentLogs?.length || 0}
                </span>
              </button>
            </div>

            {/* SECTION A: STAMP AUDIT LOG (LIVE TIMESTAMP FEED) */}
            {statsActiveSection === 'stamps' && (
              <div className="bg-white rounded-3xl border border-slate-100 card-soft-shadow overflow-hidden space-y-4 animate-in fade-in duration-200">
                {/* Header & Controls */}
                <div className="p-4 sm:p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center font-bold">
                        <Award className="w-4 h-4 text-amber-600" />
                      </div>
                      <h3 className="font-display font-bold text-base sm:text-lg text-[#0F172A]">
                        Live Stamp Punch History
                      </h3>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      Track who earned stamps, what time they scanned, which reward card was punched, and whether via QR or cashier.
                    </p>
                  </div>

                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full sm:w-auto">
                    {/* Search */}
                    <div className="relative flex-1 sm:w-60">
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        type="text"
                        value={stampSearch}
                        onChange={(e) => setStampSearch(e.target.value)}
                        placeholder="Search customer, phone, card..."
                        className="w-full pl-8 pr-7 py-2 rounded-xl border border-slate-200 text-xs bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0F172A]"
                      />
                      {stampSearch && (
                        <button
                          onClick={() => setStampSearch('')}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    {/* Filter Pills */}
                    <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 no-scrollbar">
                      <button
                        type="button"
                        onClick={() => setStampSourceFilter('all')}
                        className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                          stampSourceFilter === 'all'
                            ? 'bg-[#0F172A] text-white shadow-2xs'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200/60'
                        }`}
                      >
                        All ({metrics?.recentVisits?.length || 0})
                      </button>
                      <button
                        type="button"
                        onClick={() => setStampSourceFilter('qr')}
                        className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                          stampSourceFilter === 'qr'
                            ? 'bg-emerald-700 text-white shadow-2xs'
                            : 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100'
                        }`}
                      >
                        📷 QR Scans ({(metrics?.recentVisits || []).filter((v) => v.is_qr).length})
                      </button>
                      <button
                        type="button"
                        onClick={() => setStampSourceFilter('cashier')}
                        className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                          stampSourceFilter === 'cashier'
                            ? 'bg-indigo-700 text-white shadow-2xs'
                            : 'bg-indigo-50 text-indigo-800 border border-indigo-200 hover:bg-indigo-100'
                        }`}
                      >
                        🧑‍💼 Cashier ({(metrics?.recentVisits || []).filter((v) => !v.is_qr).length})
                      </button>
                    </div>
                  </div>
                </div>

                {/* Stamp Table / Cards */}
                {filteredStampActivity.length > 0 ? (
                  <>
                    {/* Desktop Table View */}
                    <div className="hidden md:block overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="bg-slate-50/80 border-b border-slate-100 text-slate-500 font-semibold font-mono text-[11px] uppercase tracking-wider">
                            <th className="py-3 px-6">Customer</th>
                            <th className="py-3 px-6">Reward Card</th>
                            <th className="py-3 px-6">Method / Source</th>
                            <th className="py-3 px-6 text-center">Stamps Added</th>
                            <th className="py-3 px-6 text-right">Punch Time</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {filteredStampActivity.map((visit) => (
                            <tr key={visit.id} className="hover:bg-slate-50/70 transition-colors">
                              <td className="py-4 px-6">
                                <div className="flex items-center gap-3">
                                  <div className="w-9 h-9 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-2xs">
                                    {(visit.customer_name || 'G')[0].toUpperCase()}
                                  </div>
                                  <div>
                                    <div className="font-display font-bold text-sm text-[#0F172A]">
                                      {visit.customer_name || 'Valued Guest'}
                                    </div>
                                    <div className="text-slate-500 font-mono text-[11px] mt-0.5">
                                      {visit.customer_phone || '—'}
                                    </div>
                                  </div>
                                </div>
                              </td>

                              <td className="py-4 px-6">
                                <div className="space-y-1">
                                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-amber-50 text-amber-900 border border-amber-200/80 text-[11px] font-semibold">
                                    <Sparkles className="w-3 h-3 text-amber-500" />
                                    <span>{visit.reward_title || 'Specialty Treat'}</span>
                                  </span>
                                  {visit.staff_note && (
                                    <p className="text-[10px] text-slate-400 font-mono truncate max-w-[200px]">
                                      {visit.staff_note}
                                    </p>
                                  )}
                                </div>
                              </td>

                              <td className="py-4 px-6">
                                {visit.is_qr ? (
                                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                                    <Camera className="w-3 h-3 text-emerald-600" />
                                    <span>Self-Serve QR Scan</span>
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-indigo-50 text-indigo-800 border border-indigo-200">
                                    <CheckCircle2 className="w-3 h-3 text-indigo-600" />
                                    <span>Cashier Counter Punch</span>
                                  </span>
                                )}
                              </td>

                              <td className="py-4 px-6 text-center">
                                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-[#0F172A] text-white font-mono font-bold text-xs shadow-2xs">
                                  +{visit.stamps_added || 1} Stamp{(visit.stamps_added || 1) > 1 ? 's' : ''}
                                </span>
                              </td>

                              <td className="py-4 px-6 text-right font-mono text-xs">
                                <div className="text-slate-900 font-semibold">
                                  {formatStampAuditDate(visit.scanned_at)}
                                </div>
                                <div className="text-[10px] text-slate-400">
                                  {new Date(visit.scanned_at).toLocaleDateString('en-IN', {
                                    day: 'numeric',
                                    month: 'short',
                                    year: 'numeric',
                                  })}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Mobile Consolidated Cards View */}
                    <div className="block md:hidden divide-y divide-slate-100">
                      {filteredStampActivity.map((visit) => (
                        <div key={visit.id} className="p-4 space-y-2.5">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className="w-9 h-9 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-2xs">
                                {(visit.customer_name || 'G')[0].toUpperCase()}
                              </div>
                              <div className="min-w-0">
                                <div className="font-display font-bold text-sm text-[#0F172A] truncate">
                                  {visit.customer_name || 'Valued Guest'}
                                </div>
                                <div className="text-xs text-slate-500 font-mono">
                                  {visit.customer_phone || '—'}
                                </div>
                              </div>
                            </div>

                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#0F172A] text-white font-mono font-bold text-xs shrink-0 shadow-2xs">
                              +{visit.stamps_added || 1} Stamp{(visit.stamps_added || 1) > 1 ? 's' : ''}
                            </span>
                          </div>

                          <div className="flex items-center justify-between gap-2 text-xs flex-wrap">
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-amber-50 text-amber-900 border border-amber-200/80 text-[11px] font-semibold">
                              <Sparkles className="w-3 h-3 text-amber-500" />
                              <span className="truncate max-w-[150px]">{visit.reward_title || 'Specialty Treat'}</span>
                            </span>

                            {visit.is_qr ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                                <Camera className="w-2.5 h-2.5 text-emerald-600" />
                                <span>QR Scan</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-50 text-indigo-800 border border-indigo-200">
                                <CheckCircle2 className="w-2.5 h-2.5 text-indigo-600" />
                                <span>Cashier</span>
                              </span>
                            )}
                          </div>

                          <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono pt-1 border-t border-slate-50">
                            <span>{formatStampAuditDate(visit.scanned_at)}</span>
                            {!visit.is_qr && visit.spend_amount && Number(visit.spend_amount) > 0 ? <span>₹{visit.spend_amount}</span> : null}
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="p-12 text-center text-slate-400 text-xs font-mono space-y-2">
                    <Award className="w-8 h-8 text-slate-300 mx-auto" />
                    <p>No stamp activity recorded yet matching filter.</p>
                  </div>
                )}
              </div>
            )}

            {/* SECTION B: RECENT WHATSAPP OFFERS (ACCORDION) */}
            {statsActiveSection === 'whatsapp' && (
            <div className="bg-white rounded-3xl border border-slate-100 card-soft-shadow overflow-hidden transition-all">
              <div
                onClick={() => {
                  setShowRecentOffersDropdown(!showRecentOffersDropdown);
                  sound.playClick();
                }}
                className="p-4 sm:p-5 flex items-center justify-between gap-3 cursor-pointer hover:bg-slate-50/70 transition-colors select-none"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-slate-100 text-slate-800 flex items-center justify-center font-bold shrink-0 border border-slate-200">
                    <MessageSquare className="w-5 h-5 text-[#0F172A]" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-display font-bold text-sm sm:text-base text-[#0F172A]">
                      Recent WhatsApp Offers &amp; Customer Visits
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Track offer delivery status and returning revenue brought back
                    </p>
                  </div>
                </div>

                <div className="p-2 rounded-xl text-slate-400 hover:text-[#0F172A] hover:bg-slate-100 transition-colors shrink-0">
                  <ChevronDown
                    className={`w-5 h-5 transition-transform duration-200 ${
                      showRecentOffersDropdown ? 'rotate-180' : ''
                    }`}
                  />
                </div>
              </div>

              {showRecentOffersDropdown && (
                <div className="border-t border-slate-100 animate-in fade-in duration-200">
                  {metrics?.recentLogs && metrics.recentLogs.length > 0 ? (
                    <>
                      {/* Mobile Consolidated Cards View (No Horizontal Scroll / No Slider) */}
                      <div className="block md:hidden divide-y divide-slate-100">
                        {metrics.recentLogs.map((log) => (
                          <div key={log.id} className="p-4 space-y-2.5">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex items-center gap-3 min-w-0">
                                <div className="w-9 h-9 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-2xs">
                                  {(log.customer?.name || 'G')[0]}
                                </div>
                                <div className="min-w-0">
                                  <div className="font-display font-bold text-sm text-[#0F172A]">
                                    {log.customer?.name || 'Valued Regular'}
                                  </div>
                                  <div className="text-xs text-slate-500 font-mono mt-0.5">
                                    {log.customer?.phone || '—'}
                                  </div>
                                </div>
                              </div>

                              <button
                                type="button"
                                onClick={() => handleToggleLogStatus(log.id, log.status)}
                                title="Click to cycle status: Sent ➔ Delivered ➔ Read"
                                className="shrink-0 cursor-pointer active:scale-95 transition-transform focus:outline-none"
                              >
                                {log.status === 'read' ? (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200/80 shadow-2xs">
                                    <CheckCheck className="w-3 h-3 text-indigo-600" />
                                    <span>Read</span>
                                  </span>
                                ) : log.status === 'delivered' ? (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200/80 shadow-2xs">
                                    <Check className="w-3 h-3 text-blue-600" />
                                    <span>Delivered</span>
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-sky-50 text-sky-700 border border-sky-200/80 shadow-2xs">
                                    <Send className="w-2.5 h-2.5 text-sky-600" />
                                    <span>Sent</span>
                                  </span>
                                )}
                              </button>
                            </div>

                            <div className="flex items-center justify-between gap-2 bg-slate-50 p-2.5 rounded-2xl border border-slate-100 text-xs">
                              <div className="flex items-center gap-2 min-w-0">
                                <span className="inline-flex items-center font-mono text-[10px] bg-white text-slate-800 px-2 py-0.5 rounded-lg border border-slate-200 font-semibold tracking-wide shrink-0">
                                  {log.offer_code || 'SPECIAL-OFFER'}
                                </span>
                                <span className="text-[10px] text-slate-500 font-mono truncate">
                                  {new Date(log.sent_at).toLocaleDateString('en-IN', {
                                    month: 'short',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })}
                                </span>
                              </div>

                              {log.converted ? (
                                <div className="flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 shrink-0">
                                  <span>+₹{(log.converted_visit?.spend_amount || selectedBusiness?.avg_spend_per_visit || 250).toLocaleString('en-IN')}</span>
                                </div>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-50 text-amber-800 border border-amber-200/80 shrink-0">
                                  <HelpCircle className="w-3 h-3 text-amber-500" />
                                  <span>Waiting</span>
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Desktop Full Table View */}
                      <div className="hidden md:block overflow-x-auto">
                        <table className="w-full text-left text-xs">
                          <thead>
                            <tr className="border-b border-slate-100 bg-slate-50/70 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                              <th className="py-3.5 px-6">Customer</th>
                              <th className="py-3.5 px-4">Offer Code</th>
                              <th className="py-3.5 px-4">Date Sent</th>
                              <th className="py-3.5 px-4">Message Status</th>
                              <th className="py-3.5 px-4">Did They Visit?</th>
                              <th className="py-3.5 px-6 text-right">Extra Sale</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {metrics.recentLogs.map((log) => (
                              <tr key={log.id} className="hover:bg-slate-50/60 transition-colors">
                                <td className="py-4 px-6">
                                  <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs">
                                      {(log.customer?.name || 'G')[0]}
                                    </div>
                                    <div>
                                      <div className="font-display font-bold text-sm text-[#0F172A]">
                                        {log.customer?.name || 'Valued Regular'}
                                      </div>
                                      <div className="text-xs text-slate-500 font-mono mt-0.5">
                                        {log.customer?.phone || '—'}
                                      </div>
                                    </div>
                                  </div>
                                </td>

                                <td className="py-4 px-4">
                                  <span className="inline-flex items-center font-mono text-[11px] bg-slate-100 text-slate-800 px-2.5 py-1 rounded-lg border border-slate-200 font-semibold tracking-wide">
                                    {log.offer_code || 'SPECIAL-OFFER'}
                                  </span>
                                </td>

                                <td className="py-4 px-4 text-slate-600 font-medium text-xs">
                                  {new Date(log.sent_at).toLocaleDateString('en-IN', {
                                    month: 'short',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })}
                                </td>

                                <td className="py-4 px-4">
                                  <button
                                    type="button"
                                    onClick={() => handleToggleLogStatus(log.id, log.status)}
                                    title="Click to cycle status: Sent ➔ Delivered ➔ Read"
                                    className="group cursor-pointer transition-transform active:scale-95 focus:outline-none"
                                  >
                                    {log.status === 'read' ? (
                                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200/80 shadow-2xs">
                                        <CheckCheck className="w-3.5 h-3.5 text-indigo-600" />
                                        <span>Read</span>
                                      </span>
                                    ) : log.status === 'delivered' ? (
                                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200/80 shadow-2xs">
                                        <Check className="w-3.5 h-3.5 text-blue-600" />
                                        <span>Delivered</span>
                                      </span>
                                    ) : (
                                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200/80 shadow-2xs">
                                        <Send className="w-3 h-3 text-sky-600" />
                                        <span>Sent</span>
                                      </span>
                                    )}
                                  </button>
                                </td>

                                <td className="py-4 px-4">
                                  {log.converted ? (
                                    <div className="flex flex-col gap-0.5">
                                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-2xs w-fit">
                                        <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[3]" />
                                        <span>Came back &amp; ordered!</span>
                                      </span>
                                      <span className="text-[10px] text-slate-500 font-mono pl-1">
                                        {log.converted_at ? new Date(log.converted_at).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }) : 'Visited'}
                                      </span>
                                    </div>
                                  ) : (
                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-amber-50 text-amber-800 border border-amber-200/80">
                                      <HelpCircle className="w-3 h-3 text-amber-500" />
                                      <span>Waiting for visit</span>
                                    </span>
                                  )}
                                </td>

                                <td className="py-4 px-6 text-right">
                                  {log.converted ? (
                                    <div className="flex flex-col items-end">
                                      <span className="font-display font-black text-sm text-emerald-600">
                                        +₹{(log.converted_visit?.spend_amount || selectedBusiness?.avg_spend_per_visit || 250).toLocaleString('en-IN')}
                                      </span>
                                      <span className="text-[10px] text-slate-400 font-mono">bill value</span>
                                    </div>
                                  ) : (
                                    <span className="text-slate-300 font-medium text-xs">—</span>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-16 text-slate-400 text-xs font-mono">
                      No WhatsApp messages sent yet. Use &quot;See Inactive Customers&quot; below to bring back regulars.
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

            {/* 2. INACTIVE CUSTOMERS / DUE FOR A VISIT LIST (MIDDLE) */}
            {(statsActiveSection === 'crm' || statsActiveSection === 'whatsapp') && (() => {
              const overdueMembers = (metrics?.members || []).filter(
                (m) => m.is_at_risk && !dismissedOverdueIds[m.id]
              );
              if (overdueMembers.length === 0 && Object.keys(dismissedOverdueIds).length === 0 && (!metrics || metrics.atRiskCount === 0)) {
                return null;
              }

              return (
                <div className="bg-white rounded-3xl border border-slate-100 card-soft-shadow overflow-hidden transition-all">
                  <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-800 flex items-center justify-center font-bold text-xs border border-slate-200 shrink-0">
                        <Clock className="w-4 h-4 text-[#0F172A]" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-display font-bold text-sm sm:text-base text-[#0F172A] truncate">
                          Inactive Customers Due for a Visit
                        </h3>
                        <p className="text-[11px] text-slate-500 truncate">
                          {overdueMembers.length} regular{overdueMembers.length === 1 ? '' : 's'} overdue • Send 1-tap WhatsApp message
                        </p>
                      </div>
                    </div>
                    <span className="text-xs font-mono font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200 whitespace-nowrap shrink-0">
                      {overdueMembers.length} Overdue
                    </span>
                  </div>

                  {overdueMembers.length > 0 ? (
                    <div className="divide-y divide-slate-100 overflow-hidden">
                      {overdueMembers.map((m) => {
                        const daysAgo = m.days_since_last_visit ?? 0;
                        const isSent = Boolean(sentNudges[m.id]);
                        const animState = animatingSentIds[m.id];

                        return (
                          <div
                            key={m.id}
                            className={`p-3.5 sm:p-4 hover:bg-slate-50/60 transition-all duration-500 ease-out flex items-center justify-between gap-3 ${
                              animState === 'sliding'
                                ? 'opacity-0 translate-x-full scale-95 pointer-events-none'
                                : 'opacity-100 translate-x-0'
                            }`}
                          >
                            <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs">
                                {(m.customer?.name || 'G')[0].toUpperCase()}
                              </div>
                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                                  <span className="font-display font-bold text-xs sm:text-sm text-[#0F172A] truncate">
                                    {m.customer?.name || 'Valued Regular'}
                                  </span>
                                  <span className="px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-mono font-bold uppercase tracking-wider bg-amber-50 text-amber-900 border border-amber-200/80 shrink-0 whitespace-nowrap">
                                    ⚠️ Overdue {daysAgo}d
                                  </span>
                                </div>
                                <div className="flex items-center gap-1.5 flex-wrap text-[10px] sm:text-[11px] text-slate-500 font-mono mt-0.5">
                                  <span>{m.customer?.phone || '—'}</span>
                                  <span className="text-slate-300">•</span>
                                  <span>{m.stamps}/{selectedBusiness?.reward_rule.stamps_needed || 6} stamps</span>
                                  {m.avg_visit_gap_days ? (
                                    <>
                                      <span className="text-slate-300">•</span>
                                      <span>~{m.avg_visit_gap_days}d cadence</span>
                                    </>
                                  ) : null}
                                </div>
                              </div>
                            </div>

                            <button
                              onClick={() =>
                                handleSendSingleNudge(m.id, m.customer?.phone || '', m.customer?.name || 'Valued Regular')
                              }
                              className={`py-1.5 px-3 rounded-xl text-xs font-bold transition-all duration-200 flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs active:scale-95 shrink-0 ${
                                isSent
                                  ? 'bg-emerald-600 text-white shadow-emerald-600/30'
                                  : 'bg-[#0F172A] hover:bg-black text-white'
                              }`}
                            >
                              <MessageSquare className="w-3.5 h-3.5 text-white" />
                              <span className="hidden sm:inline">{isSent ? '✓ Sent!' : 'Send WhatsApp Message'}</span>
                              <span className="inline sm:hidden">{isSent ? '✓ Sent!' : 'WhatsApp'}</span>
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="p-6 text-center text-xs font-medium text-slate-500 flex items-center justify-center gap-2 animate-in fade-in">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>All overdue regulars texted! No pending reminders.</span>
                    </div>
                  )}
                </div>
              );
            })()}

            {/* REGISTERED CUSTOMERS CRM DIRECTORY */}
            {statsActiveSection === 'crm' && (
            <div className="bg-white rounded-3xl border border-slate-100 card-soft-shadow overflow-hidden space-y-4">
              <div className="p-4 sm:p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="font-display font-bold text-base text-[#0F172A]">Registered Customer CRM</h3>
                  <p className="text-xs text-slate-500">
                    Complete directory of your regulars and visit frequencies
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full sm:w-auto">
                  <div className="relative flex-1 sm:w-64">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      value={crmSearch}
                      onChange={(e) => setCrmSearch(e.target.value)}
                      placeholder="Search name or phone..."
                      className="w-full pl-8 pr-7 py-2 rounded-xl border border-slate-200 text-xs bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0F172A]"
                    />
                    {crmSearch && (
                      <button
                        onClick={() => setCrmSearch('')}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Clean 1-Tap Filter Tabs (Replaces clumsy select dropdown) */}
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 no-scrollbar">
                    <button
                      type="button"
                      onClick={() => setCrmFilter('all')}
                      className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                        crmFilter === 'all'
                          ? 'bg-[#0F172A] text-white shadow-2xs'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200/60'
                      }`}
                    >
                      All ({metrics?.members.length ?? 0})
                    </button>
                    <button
                      type="button"
                      onClick={() => setCrmFilter('at_risk')}
                      className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                        crmFilter === 'at_risk'
                          ? 'bg-amber-600 text-white shadow-2xs'
                          : 'bg-amber-50 text-amber-900 border border-amber-200 hover:bg-amber-100'
                      }`}
                    >
                      ⚠️ Needs reminder ({metrics?.atRiskCount ?? 0})
                    </button>
                    <button
                      type="button"
                      onClick={() => setCrmFilter('regular')}
                      className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                        crmFilter === 'regular'
                          ? 'bg-emerald-700 text-white shadow-2xs'
                          : 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100'
                      }`}
                    >
                      ✓ Active Regulars
                    </button>
                  </div>
                </div>
              </div>

              {/* Mobile Consolidated Cards View (No Horizontal Scroll / No Slider) */}
              {filteredMembers.length > 0 ? (
                <div className="block md:hidden divide-y divide-slate-100">
                  {filteredMembers.map((m) => {
                    const daysAgo = m.days_since_last_visit ?? 0;
                    const memberClaims = (metrics?.rewardsClaimedList || []).filter(
                      (r) => r.membership_id === m.id || (m.customer && r.customer?.id === m.customer.id)
                    );
                    const isSent = Boolean(sentNudges[m.id]);

                    return (
                      <div key={m.id} className="p-3 space-y-2 hover:bg-slate-50/60 transition-colors">
                        {/* Row 1: Avatar, Name, Phone + Status Badge */}
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-8 h-8 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs">
                              {(m.customer?.name || 'C')[0].toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <div className="font-display font-bold text-xs text-[#0F172A] truncate">
                                {m.customer?.name || 'Customer'}
                              </div>
                              <div className="text-[10px] text-slate-500 font-mono">
                                {m.customer?.phone || '—'}
                              </div>
                            </div>
                          </div>

                          {m.is_at_risk ? (
                            <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold uppercase tracking-wider bg-amber-50 text-amber-900 border border-amber-300 shrink-0">
                              ⚠️ Overdue ({daysAgo}d)
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
                              ✓ Active Regular
                            </span>
                          )}
                        </div>

                        {/* Row 2: Compact Inline Stats & Actions */}
                        <div className="flex items-center justify-between gap-2 pt-0.5">
                          <div className="text-[10px] font-mono text-slate-600 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-100 truncate">
                            <span><b>{m.stamps}/{selectedBusiness?.reward_rule.stamps_needed || 6}</b> stamps</span>
                            <span className="mx-1.5 text-slate-300">•</span>
                            <span><b>{memberClaims.length}</b> claimed</span>
                            <span className="mx-1.5 text-slate-300">•</span>
                            <span>{daysAgo === 0 ? 'Today' : `${daysAgo}d ago`}</span>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              onClick={() =>
                                handleSendSingleNudge(m.id, m.customer?.phone || '', m.customer?.name || 'Customer')
                              }
                              className={`py-1 px-2.5 rounded-lg font-bold text-[11px] transition-all inline-flex items-center gap-1 cursor-pointer shadow-2xs active:scale-95 ${
                                isSent
                                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                  : 'bg-[#0F172A] hover:bg-black text-white'
                              }`}
                            >
                              <MessageSquare className={`w-3 h-3 ${isSent ? 'text-emerald-600' : 'text-emerald-400'}`} />
                              <span>{isSent ? 'Sent' : 'WhatsApp'}</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleDeleteMember(m.id)}
                              title="Remove customer from CRM list"
                              className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="block md:hidden py-10 text-center px-4">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-2">
                    <Users className="w-5 h-5 text-slate-500" />
                  </div>
                  <div className="font-display font-bold text-slate-800 text-xs mb-1">
                    {crmSearch ? 'No matching customers found' : 'No customers enrolled yet'}
                  </div>
                  <p className="text-[11px] text-slate-400 max-w-xs mx-auto">
                    Award stamps to walk-in guests at the counter to start building your customer list.
                  </p>
                </div>
              )}

              {/* Desktop Full Table View */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/50 text-[10px] font-mono font-bold uppercase tracking-widest text-slate-400">
                      <th className="py-3.5 px-6">CUSTOMER</th>
                      <th className="py-3.5 px-4">STAMPS COLLECTED</th>
                      <th className="py-3.5 px-4">REWARDS CLAIMED</th>
                      <th className="py-3.5 px-4">VISIT CADENCE</th>
                      <th className="py-3.5 px-4">LAST VISIT</th>
                      <th className="py-3.5 px-4">STATUS</th>
                      <th className="py-3.5 px-6 text-right">ACTION</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredMembers.length > 0 ? (
                      filteredMembers.map((m) => {
                        const daysAgo = m.days_since_last_visit ?? 0;
                        const memberClaims = (metrics?.rewardsClaimedList || []).filter(
                          (r) => r.membership_id === m.id || (m.customer && r.customer?.id === m.customer.id)
                        );

                        return (
                          <tr key={m.id} className="hover:bg-slate-50/60 transition-colors">
                            <td className="py-4 px-6">
                              <div className="font-display font-bold text-sm text-[#0F172A]">
                                {m.customer?.name || 'Customer'}
                              </div>
                              <div className="text-[11px] text-slate-400 font-mono mt-0.5">{m.customer?.phone}</div>
                            </td>

                            <td className="py-4 px-4">
                              <span className="font-display font-bold text-sm text-[#0F172A]">
                                {m.stamps}/{selectedBusiness?.reward_rule.stamps_needed || 6}
                              </span>
                              <span className="text-slate-400 text-[11px] font-mono ml-1.5">stamps</span>
                            </td>

                            <td className="py-4 px-4">
                              {memberClaims.length > 0 ? (
                                <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-slate-100 text-slate-800 border border-slate-200 inline-flex items-center gap-1 shadow-2xs">
                                  <Gift className="w-3 h-3 text-slate-700" />
                                  <span>{memberClaims.length} Claimed</span>
                                </span>
                              ) : (
                                <span className="text-slate-400 text-[11px] font-mono">0 Claimed</span>
                              )}
                            </td>

                            <td className="py-4 px-4 text-slate-600">
                              {m.avg_visit_gap_days ? `Every ~${m.avg_visit_gap_days} days` : 'New customer'}
                            </td>

                            <td className="py-4 px-4 text-slate-600 font-mono">
                              {daysAgo === 0 ? 'Today' : `${daysAgo} days ago`}
                            </td>

                            <td className="py-4 px-4">
                              {m.is_at_risk ? (
                                <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-amber-50 text-amber-900 border border-amber-300">
                                  ⚠️ Overdue ({daysAgo}d)
                                </span>
                              ) : (
                                <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200">
                                  ✓ Active Regular
                                </span>
                              )}
                            </td>

                            <td className="py-4 px-6 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  onClick={() =>
                                    handleSendSingleNudge(m.id, m.customer?.phone || '', m.customer?.name || 'Customer')
                                  }
                                  className={`px-3.5 py-1.5 rounded-full font-semibold text-[11px] transition-all inline-flex items-center gap-1.5 cursor-pointer shadow-2xs ${
                                    sentNudges[m.id]
                                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                      : 'bg-[#0F172A] hover:bg-black text-white'
                                  }`}
                                >
                                  <MessageSquare className={`w-3 h-3 ${sentNudges[m.id] ? 'text-emerald-600' : 'text-emerald-400'}`} />
                                  <span>{sentNudges[m.id] ? '✓ Sent (Resend)' : 'Send Message'}</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => handleDeleteMember(m.id)}
                                  title="Remove customer from CRM list"
                                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer shrink-0"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={7} className="py-14 text-center">
                          <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
                            <Users className="w-6 h-6 text-slate-500" />
                          </div>
                          <div className="font-display font-bold text-slate-800 text-sm mb-1">
                            {crmSearch ? 'No matching customers found' : 'No customers enrolled yet'}
                          </div>
                          <p className="text-xs text-slate-400 max-w-sm mx-auto mb-4">
                            Award stamps to walk-in guests at the counter to start building your customer list.
                          </p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 4: PROFILE (Exact Requested Structure: Avatar Card, Info Rows, Preferences) */}
        {/* ========================================================================= */}
        {activeTab === 'profile' && (
          <div className="max-w-xl mx-auto space-y-5 animate-in fade-in duration-200">
            {/* 1. Header Title & Subtitle */}
            <div className="text-left pt-1">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0F172A] tracking-tight font-display">
                Profile &amp; Settings
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                Manage your Siplo merchant profile, storefront photo, and business details
              </p>
            </div>

            {/* Save Success Banner */}
            {settingsSavedSuccess && (
              <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold rounded-2xl flex items-center gap-2.5 animate-in fade-in slide-in-from-top-1">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>✓ Profile updated successfully! All details are live on your customer pass.</span>
              </div>
            )}

            {/* 2. CARD 1: Circular Avatar with Camera Badge & Name */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 card-soft-shadow flex flex-col items-center justify-center text-center space-y-4">
              {/* Circular Avatar with Camera Badge Button */}
              <div className="relative">
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="w-24 h-24 sm:w-28 sm:h-28 rounded-full overflow-hidden bg-slate-100 border-2 border-slate-200 shadow-md flex items-center justify-center cursor-pointer relative group hover:scale-105 transition-all"
                  title="Click to upload/change photo"
                >
                  {settingsLogoUrl || selectedBusiness?.logo_url ? (
                    <img
                      src={settingsLogoUrl || selectedBusiness?.logo_url}
                      alt={selectedBusiness?.name || 'Restaurant Logo'}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Store className="w-10 h-10 text-slate-400" />
                  )}
                  {isUploadingStoreImage && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                      <RefreshCw className="w-5 h-5 text-white animate-spin" />
                    </div>
                  )}
                </div>

                {/* Floating Camera Button on Avatar */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-white text-slate-900 border border-slate-200 shadow-md flex items-center justify-center hover:bg-slate-50 cursor-pointer transition-all hover:scale-110 active:scale-95"
                  title="Upload custom photo"
                >
                  <Camera className="w-4 h-4 text-slate-700" />
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleImageFileSelect(e, false)}
                  className="hidden"
                />
              </div>

              {/* Name with Edit Pencil */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-center gap-2">
                  <h2 className="font-display font-bold text-xl sm:text-2xl text-[#0F172A] tracking-tight">
                    {settingsCafeName || selectedBusiness?.name || 'Your Restaurant'}
                  </h2>
                  <button
                    type="button"
                    onClick={() => {
                      sound.playClick();
                      setShowEditProfileModal(true);
                    }}
                    className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                    title="Edit restaurant details"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                </div>

                {/* Status Pill Badge */}
                <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-slate-50 text-slate-700 text-[11px] font-mono font-semibold border border-slate-200">
                  <Sparkles className="w-3 h-3 text-amber-500" />
                  <span>ACTIVE STORE • SIPLO MERCHANT</span>
                </div>
              </div>
            </div>

            {/* 3. CARD 2: Contact Information & Business Details */}
            {(() => {
              const displayPhone = settingsPhone || selectedBusiness?.phone || '';
              const isPhoneVerified = Boolean(
                selectedBusiness?.phone_verified ||
                (selectedBusiness?.reward_rule as any)?.phone_verified ||
                (Boolean((authUser as any)?.phone) && displayPhone && ((authUser as any)?.phone?.replace(/\D/g, '').endsWith(displayPhone.replace(/\D/g, '').slice(-10))))
              );

              return (
                <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-100 card-soft-shadow space-y-4">
                  {/* Mobile Number Row */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-slate-50 text-slate-700 flex items-center justify-center shrink-0 border border-slate-200/80">
                        <Phone className="w-4 h-4 text-slate-600" />
                      </div>
                      <div>
                        <div className="text-[10px] uppercase font-mono font-bold text-slate-400 tracking-wider">
                          Mobile Number
                        </div>
                        <div className="font-display font-bold text-xs sm:text-sm text-slate-900 font-mono mt-0.5 min-h-[1.25rem] flex items-center">
                          {displayPhone || <span className="text-slate-400 font-sans font-normal text-xs">—</span>}
                        </div>
                      </div>
                    </div>
                    {isPhoneVerified ? (
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full flex items-center gap-1 shrink-0">
                          <Check className="w-3 h-3 text-emerald-600" />
                          <span>Verified</span>
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            sound.playClick();
                            setVerifyPhoneInput(displayPhone);
                            setVerifyPhoneError(null);
                            setVerifyPhoneSuccess(null);
                            setShowPhoneVerifyModal(true);
                          }}
                          className="text-[11px] font-semibold text-slate-500 hover:text-slate-800 cursor-pointer underline"
                        >
                          Change
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          sound.playClick();
                          setVerifyPhoneInput(displayPhone);
                          setVerifyPhoneError(null);
                          setVerifyPhoneSuccess(null);
                          setShowPhoneVerifyModal(true);
                        }}
                        className="text-[11px] font-semibold text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200/90 px-3 py-1 rounded-full flex items-center gap-1.5 cursor-pointer transition-all active:scale-95 shadow-xs shrink-0"
                        title="Verify mobile number"
                      >
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                        <span>{displayPhone ? 'Verify' : 'Add Number'}</span>
                      </button>
                    )}
                  </div>

                  {/* Email Row */}
                  <div className="border-t border-slate-100 pt-3.5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-slate-50 text-slate-700 flex items-center justify-center shrink-0 border border-slate-200/80">
                        <Mail className="w-4 h-4 text-slate-600" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-[10px] uppercase font-mono font-bold text-slate-400 tracking-wider">
                          Email Address
                        </div>
                        <div className="font-display font-bold text-xs sm:text-sm text-slate-900 truncate mt-0.5 max-w-[190px] sm:max-w-[280px]">
                          {authUser?.email || '—'}
                        </div>
                      </div>
                    </div>
                    {authUser?.email ? (
                      <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full flex items-center gap-1 shrink-0">
                        <Check className="w-3 h-3 text-emerald-600" />
                        <span>Verified</span>
                      </span>
                    ) : (
                      <span className="text-[11px] font-semibold text-slate-500 bg-slate-50 border border-slate-200 px-3 py-1 rounded-full shrink-0">
                        Not set
                      </span>
                    )}
                  </div>

                  {/* Store Address Row */}
                  <div className="border-t border-slate-100 pt-3.5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-slate-50 text-slate-700 flex items-center justify-center shrink-0 border border-slate-200/80">
                        <MapPin className="w-4 h-4 text-slate-600" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-[10px] uppercase font-mono font-bold text-slate-400 tracking-wider">
                          Store Address &amp; City
                        </div>
                        <div className="font-display font-bold text-xs sm:text-sm text-slate-900 truncate mt-0.5 max-w-[190px] sm:max-w-[280px]">
                          {[settingsAddress, settingsCity].filter(Boolean).join(', ') || 'Not set'}
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        sound.playClick();
                        setShowEditProfileModal(true);
                      }}
                      className="text-[11px] font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 px-3 py-1 rounded-full hover:bg-indigo-100 cursor-pointer transition-colors shrink-0"
                    >
                      Edit
                    </button>
                  </div>

                  {/* Store Category / Plan Row */}
                  <div className="border-t border-slate-100 pt-3.5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-slate-50 text-slate-700 flex items-center justify-center shrink-0 border border-slate-200/80">
                        <Store className="w-4 h-4 text-slate-600" />
                      </div>
                      <div>
                        <div className="text-[10px] uppercase font-mono font-bold text-slate-400 tracking-wider">
                          Cuisine / Store Type
                        </div>
                        <div className="font-display font-bold text-xs sm:text-sm text-slate-900 mt-0.5">
                          {settingsCategory || selectedBusiness?.category || 'Specialty Cafe & Bakery'}
                        </div>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                      Active
                    </span>
                  </div>
                </div>
              );
            })()}

            {/* 4. CARD 3: PREFERENCES & SECURITY */}
            <div className="space-y-2 pt-1">
              <div className="text-[11px] uppercase font-mono font-bold tracking-wider text-slate-400 px-1">
                Preferences &amp; Links
              </div>

              <div className="bg-white rounded-3xl border border-slate-100 card-soft-shadow divide-y divide-slate-100 overflow-hidden">
                {/* Edit Full Restaurant Profile */}
                <button
                  type="button"
                  onClick={() => {
                    sound.playClick();
                    setShowEditProfileModal(true);
                  }}
                  className="w-full text-left p-4 flex items-center justify-between hover:bg-slate-50 transition-colors cursor-pointer group"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-2xl bg-slate-50 text-slate-700 flex items-center justify-center shrink-0 border border-slate-200/80 group-hover:scale-105 group-hover:border-slate-300 transition-all">
                      <Edit3 className="w-4 h-4 text-slate-700" />
                    </div>
                    <div>
                      <div className="font-display font-bold text-xs sm:text-sm text-slate-900">Edit Restaurant Details</div>
                      <div className="text-xs text-slate-400">Update name, address, Google review &amp; Instagram</div>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </button>

                {/* Customer Pass Link */}
                <Link
                  href={testPassUrl || customerQrUrl}
                  target="_blank"
                  className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors cursor-pointer block group"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-2xl bg-slate-50 text-slate-700 flex items-center justify-center shrink-0 border border-slate-200/80 group-hover:scale-105 group-hover:border-slate-300 transition-all">
                      <ExternalLink className="w-4 h-4 text-slate-700" />
                    </div>
                    <div>
                      <div className="font-display font-bold text-xs sm:text-sm text-slate-900">Live Customer Pass</div>
                      <div className="text-xs text-slate-400">Preview pass as your customers see it</div>
                    </div>
                  </div>
                  <ExternalLink className="w-4 h-4 text-slate-400" />
                </Link>

                {/* Privacy & Security */}
                <button
                  type="button"
                  onClick={() => {
                    sound.playClick();
                    setShowProfilePrivacyModal(true);
                  }}
                  className="w-full text-left p-4 flex items-center justify-between hover:bg-slate-50 transition-colors cursor-pointer group"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-2xl bg-slate-50 text-slate-700 flex items-center justify-center shrink-0 border border-slate-200/80 group-hover:scale-105 group-hover:border-slate-300 transition-all">
                      <ShieldCheck className="w-4 h-4 text-slate-700" />
                    </div>
                    <div>
                      <div className="font-display font-bold text-xs sm:text-sm text-slate-900">Privacy &amp; Security</div>
                      <div className="text-xs text-slate-400">Encrypted merchant &amp; customer stamp safeguards</div>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </button>

                {/* Help & Support */}
                <a
                  href="mailto:support@siplo.in?subject=Merchant%20Support%20Request"
                  className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors cursor-pointer block group"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-2xl bg-slate-50 text-slate-700 flex items-center justify-center shrink-0 border border-slate-200/80 group-hover:scale-105 group-hover:border-slate-300 transition-all">
                      <Mail className="w-4 h-4 text-slate-700" />
                    </div>
                    <div>
                      <div className="font-display font-bold text-xs sm:text-sm text-slate-900">Help &amp; Support</div>
                      <div className="text-xs text-slate-400">Email: support@siplo.in</div>
                    </div>
                  </div>
                  <ExternalLink className="w-4 h-4 text-slate-400" />
                </a>
              </div>
            </div>

            {/* 5. Sign Out Button */}
            <div className="pt-2">
              <button
                type="button"
                onClick={handleSignOut}
                className="w-full py-3.5 rounded-2xl bg-white hover:bg-rose-50 text-slate-700 hover:text-rose-600 border border-slate-200 font-display font-bold text-xs sm:text-sm shadow-2xs flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-98"
              >
                <LogOut className="w-4 h-4 text-rose-500" />
                <span>Sign Out of Account</span>
              </button>
            </div>

            {/* Focused Modal: Edit Restaurant Profile Modal */}
            {showEditProfileModal && (
              <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in">
                <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full card-soft-shadow border border-slate-100 space-y-5 animate-stamp max-h-[90vh] overflow-y-auto">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-10 h-10 rounded-2xl bg-[#E6F8F2] text-[#059669] flex items-center justify-center font-bold">
                        <Store className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-display font-bold text-base text-[#0F172A]">
                          Edit Restaurant Profile
                        </h4>
                        <p className="text-[11px] text-slate-400">
                          Update your restaurant details, location, and social links
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowEditProfileModal(false)}
                      className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <form
                    onSubmit={async (e) => {
                      await handleSaveCafeProfile(e);
                      setShowEditProfileModal(false);
                    }}
                    className="space-y-4 text-left"
                  >
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Restaurant / Business Name *
                      </label>
                      <input
                        type="text"
                        value={settingsCafeName}
                        onChange={(e) => setSettingsCafeName(e.target.value)}
                        placeholder="e.g. Prime Cafe & Roastery"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#0F172A]"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Category / Cuisine
                      </label>
                      <select
                        value={settingsCategory}
                        onChange={(e) => setSettingsCategory(e.target.value)}
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
                        <div className="flex items-center justify-between mb-1">
                          <label className="block text-xs font-semibold text-slate-700">
                            Contact Phone Number
                          </label>
                        </div>
                        <input
                          type="tel"
                          value={settingsPhone}
                          onChange={(e) => setSettingsPhone(e.target.value)}
                          placeholder="e.g. +91 98765 43210"
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium font-mono focus:outline-none focus:ring-2 focus:ring-[#0F172A]"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          City / Area
                        </label>
                        <input
                          type="text"
                          value={settingsCity}
                          onChange={(e) => setSettingsCity(e.target.value)}
                          placeholder="e.g. Indiranagar, Bengaluru"
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#0F172A]"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Street Address
                      </label>
                      <input
                        type="text"
                        value={settingsAddress}
                        onChange={(e) => setSettingsAddress(e.target.value)}
                        placeholder="e.g. 104 MG Road, Indiranagar"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#0F172A]"
                      />
                    </div>

                    <div className="space-y-3 pt-2 border-t border-slate-100">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                          <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-400" />
                          <span>Google 5-Star Review Link</span>
                        </label>
                        <input
                          type="url"
                          value={settingsGoogleReviewUrl}
                          onChange={(e) => setSettingsGoogleReviewUrl(e.target.value)}
                          placeholder="https://g.page/r/your-cafe/review"
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-mono font-medium focus:outline-none focus:ring-2 focus:ring-[#0F172A]"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                          <InstagramIcon className="w-3.5 h-3.5 text-pink-600" />
                          <span>Instagram Profile Link / Handle</span>
                        </label>
                        <input
                          type="text"
                          value={settingsInstagramUrl}
                          onChange={(e) => setSettingsInstagramUrl(e.target.value)}
                          placeholder="e.g. @primecafe or https://instagram.com/primecafe"
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-mono font-medium focus:outline-none focus:ring-2 focus:ring-[#0F172A]"
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-3 pt-3">
                      <button
                        type="button"
                        onClick={() => setShowEditProfileModal(false)}
                        className="flex-1 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold cursor-pointer transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={isSavingSettings}
                        className="flex-1 py-3 rounded-2xl bg-[#0F172A] hover:bg-black text-white text-xs font-bold cursor-pointer transition-all shadow-md flex items-center justify-center gap-1.5"
                      >
                        {isSavingSettings ? (
                          <RefreshCw className="w-4 h-4 animate-spin" />
                        ) : (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                            <span>Save Profile</span>
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* Focused Modal: Phone Verification Modal (Direct 1-step, No OTP) */}
            {showPhoneVerifyModal && (
              <div
                className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
                onClick={() => setShowPhoneVerifyModal(false)}
              >
                <div
                  className="bg-white rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl border border-slate-100 relative space-y-5 animate-in zoom-in-95 duration-200"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-200/80">
                        <Phone className="w-5 h-5 text-emerald-600" />
                      </div>
                      <div>
                        <h3 className="font-display font-bold text-base text-slate-900">
                          Verify Phone Number
                        </h3>
                        <p className="text-[11px] text-slate-500">
                          Save your merchant mobile number for store alerts & customer passes
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowPhoneVerifyModal(false)}
                      className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  {verifyPhoneError && (
                    <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs font-semibold text-rose-700">
                      {verifyPhoneError}
                    </div>
                  )}

                  {verifyPhoneSuccess && (
                    <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-800 flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-600" />
                      <span>{verifyPhoneSuccess}</span>
                    </div>
                  )}

                  <form onSubmit={handleDirectVerifyPhone} className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        Merchant Mobile Number
                      </label>
                      <input
                        type="tel"
                        value={verifyPhoneInput}
                        onChange={(e) => setVerifyPhoneInput(e.target.value)}
                        placeholder="e.g. +91 98765 43210"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-mono font-medium focus:outline-none focus:ring-2 focus:ring-[#0F172A]"
                        autoFocus
                        required
                      />
                      <p className="text-[11px] text-slate-400 mt-1">
                        Enter your 10-digit mobile number to verify and link with this store.
                      </p>
                    </div>

                    <div className="flex items-center gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => setShowPhoneVerifyModal(false)}
                        className="flex-1 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={isVerifyPhoneLoading || !verifyPhoneInput.trim()}
                        className="flex-1 py-2.5 rounded-xl bg-[#0F172A] hover:bg-slate-800 text-white text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                      >
                        {isVerifyPhoneLoading ? (
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                            <span>Save &amp; Verify Number</span>
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* Focused Modal: Privacy & Security Modal */}
            <PrivacySecurityModal
              isOpen={showProfilePrivacyModal}
              onClose={() => setShowProfilePrivacyModal(false)}
              customerPhone={settingsPhone || selectedBusiness?.phone}
            />
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 5: SETTINGS (Aesthetic Action Buttons Grid with Focused Modal Overlays) */}
        {/* ========================================================================= */}
        {activeTab === 'settings' && (
          <SettingsSection
            business={selectedBusiness}
            authUser={authUser}
            subInfo={subInfo}
            onRefresh={async () => {
              if (selectedBusiness) await loadDashboardData(selectedBusiness.id);
            }}
            onOpenCustomization={() => openCustomizationModal()}
            onOpenPlanModal={() => setShowPlanModal(true)}
            onSignOut={handleSignOut}
            onNavigateTab={(tab) => {
              setActiveTab(tab as any);
              sound.playClick();
            }}
          />
        )}

        {/* ========================================================================= */}
        {/* PLAN & SUBSCRIPTION MODAL (UPGRADE & RENEWAL POWERED BY RAZORPAY) */}
        {/* ========================================================================= */}
        {SUBSCRIPTION_ENABLED && showPlanModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-2xl w-full card-soft-shadow border border-slate-100 space-y-6 animate-stamp max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-[#0F172A] text-amber-400 flex items-center justify-center font-bold">
                    <CreditCard className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-lg text-[#0F172A]">
                      Your Plan &amp; Subscription
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {subInfo?.fullStatusText || (selectedBusiness?.trial_active
                        ? 'Currently on 30-Day Free Trial. Activate your 1-year license now.'
                        : 'Active 1-Year License via Razorpay.')}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowPlanModal(false)}
                  className="p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {paymentNotice && (
                <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-800 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{paymentNotice}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Plan 1: Starter */}
                <div
                  className={`p-5 rounded-2xl border flex flex-col justify-between transition-all ${
                    starterDetails.isCurrentPlan
                      ? 'border-indigo-600 bg-indigo-50/20 shadow-xs ring-2 ring-indigo-600'
                      : starterDetails.isLowerTier
                      ? 'border-slate-200 bg-slate-50/60 opacity-75'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="font-display font-bold text-sm text-[#0F172A]">Starter</span>
                      {starterDetails.isCurrentPlan ? (
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 font-bold">
                          Active Plan
                        </span>
                      ) : starterDetails.isLowerTier ? (
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-200 text-slate-600 font-bold">
                          Included
                        </span>
                      ) : (
                        <span className="text-[10px] font-mono text-slate-500">300 regulars</span>
                      )}
                    </div>
                    <div className="flex items-baseline gap-1">
                      <span className="font-display font-bold text-2xl text-[#0F172A]">₹499</span>
                      <span className="text-xs text-slate-400 font-medium">/yr</span>
                    </div>
                    <div className="space-y-1.5 text-[11px] text-slate-600 pt-2 border-t border-slate-100">
                      <div className="flex items-center gap-1.5">
                        <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>Digital Stamp Card</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>WhatsApp Win-Back</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>Printable Stand</span>
                      </div>
                    </div>
                  </div>

                  {starterDetails.isLowerTier ? (
                    <div className="mt-4 w-full py-2.5 px-3 rounded-full bg-slate-100 border border-slate-200 text-slate-400 text-xs font-semibold text-center flex items-center justify-center gap-1.5 cursor-not-allowed">
                      <Check className="w-3.5 h-3.5 text-slate-400" />
                      <span>Included in {selectedBusiness?.plan === 'pro' ? 'Pro' : 'Growth'}</span>
                    </div>
                  ) : (
                    <button
                      type="button"
                      disabled={isPaymentLoading}
                      onClick={async () => {
                        setShowPlanModal(false);
                        await handleStartRazorpayPayment('starter');
                      }}
                      className="mt-4 w-full py-2.5 rounded-full bg-slate-900 hover:bg-black text-white text-xs font-semibold transition-all cursor-pointer shadow-xs disabled:opacity-50 flex items-center justify-center gap-1.5"
                    >
                      {isPaymentLoading ? (
                        'Processing...'
                      ) : (
                        <span>{starterDetails.displayText}</span>
                      )}
                    </button>
                  )}
                </div>

                {/* Plan 2: Growth */}
                <div
                  className={`p-5 rounded-2xl border-2 flex flex-col justify-between transition-all relative ${
                    growthDetails.isCurrentPlan
                      ? 'border-emerald-600 bg-emerald-50/20 shadow-md ring-2 ring-emerald-600'
                      : growthDetails.isLowerTier
                      ? 'border-slate-200 bg-slate-50/60 opacity-75'
                      : 'border-[#0F172A] bg-white shadow-xs'
                  }`}
                >
                  {!growthDetails.isCurrentPlan && !growthDetails.isLowerTier && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full bg-[#0F172A] text-amber-300 text-[10px] font-bold uppercase tracking-wider shadow-xs whitespace-nowrap">
                      Most Popular
                    </div>
                  )}
                  <div className="space-y-2.5 pt-1">
                    <div className="flex items-center justify-between">
                      <span className="font-display font-bold text-sm text-[#0F172A]">Growth</span>
                      {growthDetails.isCurrentPlan ? (
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold">
                          Active Plan
                        </span>
                      ) : growthDetails.isLowerTier ? (
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-200 text-slate-600 font-bold">
                          Included
                        </span>
                      ) : (
                        <span className="text-[10px] font-mono text-slate-500">1,500 regulars</span>
                      )}
                    </div>

                    <div className="flex items-baseline gap-1.5">
                      <span className="font-display font-bold text-2xl text-[#0F172A]">
                        ₹{growthDetails.isUpgrade ? growthDetails.amountInr : 999}
                      </span>
                      <span className="text-xs text-slate-400 font-medium">
                        {growthDetails.isUpgrade ? 'upgrade diff' : '/yr'}
                      </span>
                      {growthDetails.isUpgrade && (
                        <span className="text-[11px] text-slate-400 line-through">₹999</span>
                      )}
                    </div>

                    <div className="space-y-1.5 text-[11px] text-slate-600 pt-2 border-t border-slate-100">
                      <div className="flex items-center gap-1.5">
                        <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>Everything in Starter</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>Milestone Rewards</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>Revenue Engine</span>
                      </div>
                    </div>
                  </div>

                  {growthDetails.isLowerTier ? (
                    <div className="mt-4 w-full py-2.5 px-3 rounded-full bg-slate-100 border border-slate-200 text-slate-400 text-xs font-semibold text-center flex items-center justify-center gap-1.5 cursor-not-allowed">
                      <Check className="w-3.5 h-3.5 text-slate-400" />
                      <span>Included in Pro</span>
                    </div>
                  ) : (
                    <button
                      type="button"
                      disabled={isPaymentLoading}
                      onClick={async () => {
                        setShowPlanModal(false);
                        await handleStartRazorpayPayment('growth');
                      }}
                      className={`mt-4 w-full py-2.5 rounded-full text-white text-xs font-bold transition-all cursor-pointer shadow-md disabled:opacity-50 flex items-center justify-center gap-1.5 ${
                        growthDetails.isCurrentPlan
                          ? 'bg-emerald-700 hover:bg-emerald-800'
                          : 'bg-[#0F172A] hover:bg-black'
                      }`}
                    >
                      {isPaymentLoading ? (
                        'Processing...'
                      ) : (
                        <span>{growthDetails.displayText}</span>
                      )}
                    </button>
                  )}
                </div>

                {/* Plan 3: Pro */}
                <div
                  className={`p-5 rounded-2xl border flex flex-col justify-between transition-all ${
                    proDetails.isCurrentPlan
                      ? 'border-purple-600 bg-purple-50/20 shadow-xs ring-2 ring-purple-600'
                      : proDetails.isUpgrade
                      ? 'border-purple-300 bg-purple-50/10 hover:border-purple-500 shadow-sm'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="font-display font-bold text-sm text-[#0F172A]">Pro</span>
                      {proDetails.isCurrentPlan ? (
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 font-bold">
                          Active Plan
                        </span>
                      ) : proDetails.isUpgrade ? (
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 font-bold">
                          Upgrade Special
                        </span>
                      ) : (
                        <span className="text-[10px] font-mono text-slate-500">Unlimited</span>
                      )}
                    </div>

                    <div className="flex items-baseline gap-1.5">
                      <span className="font-display font-bold text-2xl text-[#0F172A]">
                        ₹{proDetails.isUpgrade ? proDetails.amountInr : '1,499'}
                      </span>
                      <span className="text-xs text-slate-400 font-medium">
                        {proDetails.isUpgrade ? 'upgrade diff' : '/yr'}
                      </span>
                      {proDetails.isUpgrade && (
                        <span className="text-[11px] text-slate-400 line-through">₹1,499</span>
                      )}
                    </div>

                    <div className="space-y-1.5 text-[11px] text-slate-600 pt-2 border-t border-slate-100">
                      <div className="flex items-center gap-1.5">
                        <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>Unlimited regulars</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>Multi-Counter Cashiers</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>Priority WhatsApp</span>
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    disabled={isPaymentLoading}
                    onClick={async () => {
                      setShowPlanModal(false);
                      await handleStartRazorpayPayment('pro');
                    }}
                    className={`mt-4 w-full py-2.5 rounded-full text-white text-xs font-bold transition-all cursor-pointer shadow-md disabled:opacity-50 flex items-center justify-center gap-1.5 ${
                      proDetails.isUpgrade
                        ? 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700'
                        : 'bg-slate-900 hover:bg-black'
                    }`}
                  >
                    {isPaymentLoading ? (
                      'Processing...'
                    ) : (
                      <>
                        {proDetails.isUpgrade && <Sparkles className="w-3.5 h-3.5 text-amber-300" />}
                        <span>{proDetails.displayText}</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              <div className="text-center pt-2 border-t border-slate-100 text-[11px] text-slate-400 flex items-center justify-center gap-2">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Instant activation powered by Razorpay • 100% Secure Checkout</span>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* STORE & PASS CUSTOMIZATION MODAL (THEME ENGINE & DESIGN STUDIO) */}
        {/* ========================================================================= */}
        {showCustomizationModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4">
            <div className="bg-white rounded-3xl p-5 sm:p-7 max-w-5xl w-full card-soft-shadow border border-slate-100 space-y-5 animate-stamp max-h-[94vh] overflow-y-auto">
              {/* Modal Top Header */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-[#0F172A] text-amber-400 flex items-center justify-center font-bold shadow-xs">
                    <Palette className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-lg text-[#0F172A] flex items-center gap-2">
                      <span>Store &amp; Customer Pass Design Studio</span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300 font-bold uppercase tracking-wider">
                        Live Themes
                      </span>
                    </h3>
                    <p className="text-xs text-slate-500">
                      Customize themes, stamp icons (like 🐾 Cat Cafe paws), card gradients, background colors, and store rules
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowCustomizationModal(false)}
                  className="p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {customizationSuccess && (
                <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-800 flex items-center gap-2 animate-in fade-in">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>✓ Cafe theme &amp; customer pass published successfully! Instant live updates active.</span>
                </div>
              )}

              {/* Subtab Switcher: Theme & Design vs Store Rules */}
              <div className="flex items-center gap-2 border-b border-slate-100 pb-1">
                <button
                  type="button"
                  onClick={() => {
                    setModalActiveSubtab('theme');
                    sound.playClick();
                  }}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                    modalActiveSubtab === 'theme'
                      ? 'bg-[#0F172A] text-white shadow-xs'
                      : 'text-slate-600 hover:text-[#0F172A] hover:bg-slate-100'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>🎨 Theme &amp; Pass Aesthetics</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setModalActiveSubtab('rules');
                    sound.playClick();
                  }}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                    modalActiveSubtab === 'rules'
                      ? 'bg-[#0F172A] text-white shadow-xs'
                      : 'text-slate-600 hover:text-[#0F172A] hover:bg-slate-100'
                  }`}
                >
                  <Sliders className="w-3.5 h-3.5 text-indigo-400" />
                  <span>⚙️ Store Info &amp; Rules</span>
                </button>
              </div>

              <form onSubmit={handleSaveCustomization} className="space-y-5">
                {(() => {
                  const currentThemeConfig: ThemeConfig = {
                    preset: customThemePreset,
                    page_bg_tone: customPageBgTone,
                    custom_page_bg: customPageBgHex,
                    is_dark_mode: customPageBgTone === 'deep_dark' || customThemePreset === 'obsidian_luxury' || customThemePreset === 'neon_cyber',
                    card_gradient: customCardGradient,
                    card_bg_color: customBrandColor,
                    card_text_color: '#FFFFFF',
                    accent_color: customBrandColor,
                    stamp_icon: customStampIcon,
                    card_radius: customCardRadius,
                    welcome_badge: customWelcomeBadge,
                    custom_tagline: customWelcomeTagline,
                  };

                  const bgInfo = resolvePageBackground(currentThemeConfig);
                  const cardBg = resolvePassBackground(currentThemeConfig, customBrandColor);
                  const stampIconObj = STAMP_ICONS.find((s) => s.id === customStampIcon) || STAMP_ICONS[0];
                  const stampEmoji = stampIconObj.icon;
                  const isDark = bgInfo.isDark;

                  const cardRadiusClass =
                    customCardRadius === 'rounded_squircle'
                      ? 'rounded-[26px]'
                      : customCardRadius === 'rounded_sharp'
                      ? 'rounded-xl'
                      : 'rounded-2xl';

                  return (
                    <div className="space-y-4">
                      {/* MOBILE ONLY: INSTANT LIVE CARD PREVIEW AT TOP */}
                      <div className="lg:hidden p-3.5 rounded-2xl bg-slate-50 border border-slate-200 shadow-2xs space-y-2.5">
                        <div className="flex items-center justify-between text-[11px] font-mono">
                          <div className="flex items-center gap-1.5 font-bold text-slate-800">
                            <Sparkles className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
                            <span>Live Pass Preview (Updates Instantly)</span>
                          </div>
                          <span className="text-[10px] text-slate-600 font-semibold px-2 py-0.5 rounded-full bg-white border border-slate-200">
                            {customStampsNeeded} Stamps
                          </span>
                        </div>

                        {/* Visual Pass Card */}
                        <div
                          className={`p-4 text-white shadow-md transition-all duration-300 relative overflow-hidden ${cardRadiusClass}`}
                          style={{ background: cardBg }}
                        >
                          <div className="flex items-center justify-between mb-2.5">
                            <div className="min-w-0 pr-2">
                              <div className="text-[9px] font-mono uppercase tracking-wider text-white/70">
                                Digital Stamp Card
                              </div>
                              <div className="text-sm font-bold font-display truncate">
                                {customStoreName || 'Your Cafe Name'}
                              </div>
                            </div>
                            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-white/20 backdrop-blur-xs text-white border border-white/20 shrink-0">
                              1 of {customStampsNeeded} Stamped
                            </span>
                          </div>

                          {/* Stamps Grid */}
                          <div
                            className="grid gap-1.5 mb-2.5"
                            style={{
                              gridTemplateColumns: `repeat(${customStampsNeeded <= 6 ? customStampsNeeded : 4}, minmax(0, 1fr))`,
                            }}
                          >
                            {Array.from({ length: customStampsNeeded }).map((_, idx) => {
                              const slotNum = idx + 1;
                              const isFirst = idx === 0;
                              const isGrand = slotNum === customStampsNeeded;

                              return (
                                <div
                                  key={idx}
                                  className={`aspect-square rounded-xl flex items-center justify-center transition-all ${
                                    isFirst
                                      ? 'bg-white text-slate-950 shadow-xs'
                                      : isGrand
                                      ? 'bg-white/15 text-amber-300 border border-amber-400/50 border-dashed'
                                      : 'border border-white/25 bg-black/15'
                                  }`}
                                >
                                  {isFirst ? (
                                    <span className="text-base">{stampEmoji}</span>
                                  ) : isGrand ? (
                                    <Gift className="w-4 h-4 text-amber-300" />
                                  ) : (
                                    <span className="text-[10px] font-mono font-bold text-white/50">#{slotNum}</span>
                                  )}
                                </div>
                              );
                            })}
                          </div>

                          {/* Grand Reward */}
                          <div className="pt-2 border-t border-white/20 flex items-center justify-between text-[11px] text-white/90">
                            <span className="truncate font-semibold flex items-center gap-1">
                              <span>🎁</span>
                              <span className="truncate">{customRewardTitle || 'Grand Reward'}</span>
                            </span>
                            <span className="text-[10px] font-mono text-white/70 shrink-0 ml-2">
                              ₹{customMinOrder || 150}+
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                        {/* LEFT: Controls (7 Cols) */}
                        <div className="lg:col-span-7 space-y-4 text-left">
                          {modalActiveSubtab === 'theme' ? (
                            <div className="space-y-4">
                              {/* 1. ONE-CLICK THEME PRESETS */}
                              <div>
                                <div className="flex items-center justify-between mb-2">
                                  <label className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                                    <span>1. Ready-Made Thematic Presets</span>
                                    <span className="text-[10px] font-normal text-slate-400">(1-Click Magic)</span>
                                  </label>
                                  <span className="text-[11px] font-mono text-amber-600 font-bold">
                                    {THEME_PRESETS.find((p) => p.id === customThemePreset)?.name || 'Custom'}
                                  </span>
                                </div>

                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                  {THEME_PRESETS.map((preset) => {
                                    const isSelected = customThemePreset === preset.id;
                                    return (
                                      <button
                                        key={preset.id}
                                        type="button"
                                        onClick={() => handleApplyThemePreset(preset.id)}
                                        className={`p-2.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between space-y-1 ${
                                          isSelected
                                            ? 'border-[#0F172A] bg-slate-900 text-white shadow-md ring-2 ring-[#0F172A]'
                                            : 'border-slate-200 bg-slate-50/70 hover:bg-white hover:border-slate-300 text-slate-800'
                                        }`}
                                      >
                                        <div className="flex items-center justify-between">
                                          <span className="text-base">{preset.emoji}</span>
                                          {isSelected && (
                                            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                                          )}
                                        </div>
                                        <div>
                                          <div className="font-display font-bold text-xs truncate">
                                            {preset.name}
                                          </div>
                                          <div
                                            className={`text-[9px] truncate ${
                                              isSelected ? 'text-slate-300' : 'text-slate-500'
                                            }`}
                                          >
                                            {preset.subtitle}
                                          </div>
                                        </div>
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>

                              {/* 2. STAMP ICON PICKER (12 ICONS) */}
                              <div>
                                <label className="block text-xs font-bold text-slate-900 mb-1.5">
                                  2. Stamp Icon Symbol (What customers collect)
                                </label>
                                <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                                  {STAMP_ICONS.map((st) => {
                                    const isSelected = customStampIcon === st.id;
                                    return (
                                      <button
                                        key={st.id}
                                        type="button"
                                        onClick={() => {
                                          setCustomStampIcon(st.id);
                                          sound.playClick();
                                        }}
                                        className={`py-2 px-1 rounded-xl border flex flex-col items-center justify-center gap-0.5 transition-all cursor-pointer ${
                                          isSelected
                                            ? 'bg-amber-400 text-slate-950 border-amber-500 font-bold shadow-xs scale-105 ring-2 ring-slate-900'
                                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-white'
                                        }`}
                                        title={st.label}
                                      >
                                        <span className="text-base">{st.icon}</span>
                                        <span className="text-[9px] font-mono leading-none truncate max-w-[55px]">
                                          {st.label.split(' ')[0]}
                                        </span>
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>

                              {/* 3. PASS CARD COLOR & GRADIENT */}
                              <div>
                                <label className="block text-xs font-bold text-slate-900 mb-1.5">
                                  3. Pass Card Color &amp; Gradient
                                </label>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-2">
                                  {CARD_GRADIENTS.map((grad) => {
                                    const isSelected = customCardGradient === grad.id;
                                    return (
                                      <button
                                        key={grad.id}
                                        type="button"
                                        onClick={() => {
                                          setCustomCardGradient(grad.id);
                                          sound.playClick();
                                        }}
                                        className={`p-2 rounded-xl border transition-all cursor-pointer flex items-center gap-2 ${
                                          isSelected
                                            ? 'border-[#0F172A] ring-2 ring-slate-900 bg-white shadow-xs font-bold'
                                            : 'border-slate-200 bg-slate-50 hover:bg-white text-slate-700'
                                        }`}
                                      >
                                        <div
                                          className="w-4 h-4 rounded-md shadow-2xs shrink-0 border border-black/10"
                                          style={{ background: grad.preview }}
                                        />
                                        <span className="text-[10px] truncate">{grad.label.split(' ')[0]}</span>
                                      </button>
                                    );
                                  })}
                                </div>

                                {/* Quick Solid Brand Colors */}
                                <div className="flex items-center gap-2 pt-0.5">
                                  <span className="text-[11px] text-slate-500 font-medium">Solid Color:</span>
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    {[
                                      { color: '#EC4899', label: 'Cat Pink' },
                                      { color: '#451A03', label: 'Mocha' },
                                      { color: '#064E3B', label: 'Matcha' },
                                      { color: '#7C3AED', label: 'Boba Purple' },
                                      { color: '#0F172A', label: 'Midnight' },
                                      { color: '#4F46E5', label: 'Cyber Indigo' },
                                      { color: '#B45309', label: 'Amber' },
                                    ].map((c) => (
                                      <button
                                        key={c.color}
                                        type="button"
                                        onClick={() => {
                                          setCustomBrandColor(c.color);
                                          setCustomCardGradient('solid');
                                          sound.playClick();
                                        }}
                                        className={`w-6 h-6 rounded-full cursor-pointer border-2 transition-transform ${
                                          customBrandColor.toLowerCase() === c.color.toLowerCase()
                                            ? 'scale-115 border-amber-400 ring-2 ring-slate-900'
                                            : 'border-white hover:scale-105'
                                        }`}
                                        style={{ backgroundColor: c.color }}
                                        title={c.label}
                                      />
                                    ))}
                                    <input
                                      type="color"
                                      value={customBrandColor}
                                      onChange={(e) => {
                                        setCustomBrandColor(e.target.value);
                                        setCustomCardGradient('solid');
                                      }}
                                      className="w-6 h-6 rounded-full cursor-pointer overflow-hidden p-0 border border-slate-200"
                                      title="Custom Hex Picker"
                                    />
                                  </div>
                                </div>
                              </div>

                              {/* 4. COLLAPSIBLE ADVANCED STYLING */}
                              <div className="pt-1">
                                <button
                                  type="button"
                                  onClick={() => setShowAdvancedThemeOptions(!showAdvancedThemeOptions)}
                                  className="w-full py-2.5 px-3.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200/80 flex items-center justify-between text-xs font-bold text-slate-700 cursor-pointer transition-all"
                                >
                                  <span className="flex items-center gap-1.5">
                                    <Sliders className="w-3.5 h-3.5 text-indigo-500" />
                                    <span>Advanced Styling (Corners, Page Tone &amp; Tagline)</span>
                                  </span>
                                  <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${showAdvancedThemeOptions ? 'rotate-180' : ''}`} />
                                </button>

                                {showAdvancedThemeOptions && (
                                  <div className="p-3.5 rounded-2xl bg-slate-50/70 border border-slate-200 mt-2 space-y-3.5 animate-in fade-in">
                                    {/* Page Background Ambiance */}
                                    <div>
                                      <label className="block text-[11px] font-bold text-slate-700 mb-1.5">
                                        Page Background Tone
                                      </label>
                                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                                        {PAGE_BG_TONES.map((tone) => {
                                          const isSelected = customPageBgTone === tone.id;
                                          return (
                                            <button
                                              key={tone.id}
                                              type="button"
                                              onClick={() => {
                                                setCustomPageBgTone(tone.id);
                                                setCustomPageBgHex(tone.color);
                                                sound.playClick();
                                              }}
                                              className={`p-2 rounded-xl border flex items-center gap-2 transition-all cursor-pointer ${
                                                isSelected
                                                  ? 'border-[#0F172A] bg-white ring-2 ring-[#0F172A] font-bold'
                                                  : 'border-slate-200 bg-white/70 text-slate-700'
                                              }`}
                                            >
                                              <div
                                                className="w-4 h-4 rounded-md border border-slate-300 shrink-0"
                                                style={{ backgroundColor: tone.color }}
                                              />
                                              <span className="text-[10px] truncate">{tone.label}</span>
                                            </button>
                                          );
                                        })}
                                      </div>
                                    </div>

                                    {/* Corner Style & Welcome Badge */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                      <div>
                                        <label className="block text-[11px] font-bold text-slate-700 mb-1">
                                          Card Corner Radius
                                        </label>
                                        <select
                                          value={customCardRadius}
                                          onChange={(e) => setCustomCardRadius(e.target.value as CardRadiusType)}
                                          className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#0F172A] bg-white"
                                        >
                                          <option value="rounded_squircle">Squircle Modern (32px)</option>
                                          <option value="rounded_soft">Rounded Soft (24px)</option>
                                          <option value="rounded_sharp">Modern Sharp (14px)</option>
                                        </select>
                                      </div>

                                      <div>
                                        <label className="block text-[11px] font-bold text-slate-700 mb-1">
                                          Welcome Badge
                                        </label>
                                        <input
                                          type="text"
                                          value={customWelcomeBadge}
                                          onChange={(e) => setCustomWelcomeBadge(e.target.value)}
                                          placeholder="e.g. VIP Loyalty Pass"
                                          className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#0F172A] bg-white"
                                        />
                                      </div>
                                    </div>

                                    {/* Subtitle / Tagline */}
                                    <div>
                                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                                        Pass Subtitle / Tagline
                                      </label>
                                      <input
                                        type="text"
                                        value={customWelcomeTagline}
                                        onChange={(e) => setCustomWelcomeTagline(e.target.value)}
                                        placeholder="e.g. Collect stamps & unlock treats!"
                                        className="w-full px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#0F172A] bg-white"
                                      />
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          ) : (
                            /* STORE RULES & URL SUBTAB */
                            <div className="space-y-4">
                              {/* 0. Storefront Photo / Profile Picture */}
                              <div>
                                <label className="block text-xs font-bold text-slate-900 mb-1.5">
                                  Storefront Photo / Logo
                                </label>
                                <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-200">
                                  <div className="relative group shrink-0">
                                    <div className="w-14 h-14 rounded-2xl overflow-hidden bg-slate-200 border border-slate-300 flex items-center justify-center">
                                      {customLogoUrl ? (
                                        <img
                                          src={customLogoUrl}
                                          alt="Storefront"
                                          className="w-full h-full object-cover"
                                        />
                                      ) : (
                                        <Store className="w-6 h-6 text-slate-400" />
                                      )}
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => modalFileInputRef.current?.click()}
                                      className="absolute -bottom-1 -right-1 p-1 rounded-lg bg-[#0F172A] text-white shadow-sm cursor-pointer hover:bg-black"
                                      title="Change photo"
                                    >
                                      <Camera className="w-3 h-3 text-amber-400" />
                                    </button>
                                  </div>

                                  <input
                                    ref={modalFileInputRef}
                                    type="file"
                                    accept="image/png,image/jpeg,image/webp,image/jpg"
                                    onChange={(e) => handleImageFileSelect(e, true)}
                                    className="hidden"
                                  />

                                  <div className="min-w-0 flex-1 space-y-1.5">
                                    <div className="flex items-center gap-2">
                                      <button
                                        type="button"
                                        onClick={() => modalFileInputRef.current?.click()}
                                        className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-black text-white text-[11px] font-bold inline-flex items-center gap-1.5 cursor-pointer shadow-2xs"
                                      >
                                        <UploadCloud className="w-3.5 h-3.5 text-emerald-400" />
                                        <span>Upload Photo</span>
                                      </button>
                                      {customLogoUrl && (
                                        <button
                                          type="button"
                                          onClick={() => setCustomLogoUrl('')}
                                          className="px-2.5 py-1.5 rounded-lg border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 text-[11px] font-semibold cursor-pointer"
                                        >
                                          Remove
                                        </button>
                                      )}
                                    </div>
                                    <input
                                      type="url"
                                      value={customLogoUrl}
                                      onChange={(e) => setCustomLogoUrl(e.target.value)}
                                      placeholder="Or paste image URL"
                                      className="w-full px-2.5 py-1 rounded-lg border border-slate-200 text-[11px] font-mono"
                                    />
                                  </div>
                                </div>
                              </div>

                              {/* 1. Cafe Name */}
                              <div>
                                <label className="block text-xs font-bold text-slate-900 mb-1">
                                  Cafe / Restaurant Name *
                                </label>
                                <input
                                  type="text"
                                  value={customStoreName}
                                  onChange={(e) => setCustomStoreName(e.target.value)}
                                  placeholder="e.g. Meow &amp; Beans Cat Cafe"
                                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0F172A]"
                                  required
                                />
                              </div>

                              {/* 2. Custom Pass URL Slug */}
                              <div>
                                <label className="block text-xs font-bold text-slate-900 mb-1">
                                  Customer Pass URL Slug *
                                </label>
                                <div className="flex items-center rounded-xl border border-slate-200 overflow-hidden bg-slate-50 focus-within:ring-2 focus-within:ring-[#0F172A]">
                                  <span className="px-3 text-[11px] font-mono text-slate-400 select-none bg-slate-100/70 border-r border-slate-200 py-2">
                                    siplo.in/c/
                                  </span>
                                  <input
                                    type="text"
                                    value={customStoreSlug}
                                    onChange={(e) => setCustomStoreSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                                    placeholder="meow-beans"
                                    className="flex-1 px-3 py-2 text-xs font-mono font-bold text-slate-900 bg-transparent focus:outline-none"
                                    required
                                  />
                                </div>
                              </div>

                              {/* 3. Stamps Required & Min Order */}
                              <div className="grid grid-cols-2 gap-3">
                                <div>
                                  <label className="block text-xs font-bold text-slate-900 mb-1">
                                    Stamps Needed *
                                  </label>
                                  <select
                                    value={customStampsNeeded}
                                    onChange={(e) => setCustomStampsNeeded(Math.min(8, Number(e.target.value)))}
                                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-[#0F172A]"
                                  >
                                    <option value={3}>3 Stamps</option>
                                    <option value={4}>4 Stamps</option>
                                    <option value={5}>5 Stamps</option>
                                    <option value={6}>6 Stamps (Recommended)</option>
                                    <option value={7}>7 Stamps</option>
                                    <option value={8}>8 Stamps (Max Limit)</option>
                                  </select>
                                </div>

                                <div>
                                  <label className="block text-xs font-bold text-slate-900 mb-1">
                                    Min. Order for Stamp (₹)
                                  </label>
                                  <input
                                    type="number"
                                    value={customMinOrder}
                                    onChange={(e) => setCustomMinOrder(e.target.value)}
                                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono font-medium focus:outline-none focus:ring-2 focus:ring-[#0F172A]"
                                  />
                                </div>
                              </div>

                              {/* 4. Grand Reward Title */}
                              <div>
                                <label className="block text-xs font-bold text-slate-900 mb-1">
                                  Grand Reward Title at {customStampsNeeded} Stamps *
                                </label>
                                <input
                                  type="text"
                                  value={customRewardTitle}
                                  onChange={(e) => setCustomRewardTitle(e.target.value)}
                                  placeholder="e.g. Free Coffee, 20% Off, or Specialty Treat"
                                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#0F172A]"
                                  required
                                />
                              </div>

                              {/* 5. WhatsApp Win-Back Offer Text */}
                              <div>
                                <label className="block text-xs font-bold text-slate-900 mb-1">
                                  WhatsApp Offer for Inactive Customers
                                </label>
                                <input
                                  type="text"
                                  value={customWinbackOffer}
                                  onChange={(e) => setCustomWinbackOffer(e.target.value)}
                                  placeholder="e.g. Complimentary Belgian Waffle with any drink"
                                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#0F172A]"
                                />
                              </div>
                            </div>
                          )}
                        </div>

                        {/* RIGHT: Live Interactive Smartphone Screen Mockup (Desktop only, 5 Cols) */}
                        <div className="hidden lg:flex lg:col-span-5 flex-col items-center sticky top-0">
                          <div className="w-full flex items-center justify-between text-[11px] font-mono uppercase tracking-wider text-slate-400 font-bold mb-2">
                            <div className="flex items-center gap-1">
                              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                              <span>Interactive Pass Mockup</span>
                            </div>
                            <span className="text-[10px] text-slate-500 font-normal">Tap tabs to test</span>
                          </div>

                          {/* Smartphone Outer Bezel */}
                          <div
                            className="w-full max-w-[340px] rounded-[36px] p-3.5 border-4 border-slate-800 shadow-2xl transition-all duration-300 relative overflow-hidden"
                            style={{ backgroundColor: bgInfo.bg }}
                          >
                            {/* Top Speaker Bezel */}
                            <div className="w-20 h-3.5 bg-slate-800 rounded-full mx-auto mb-3 flex items-center justify-center">
                              <div className="w-2 h-2 rounded-full bg-slate-950/60 mr-1" />
                              <div className="w-6 h-1 rounded-full bg-slate-700/60" />
                            </div>

                            {/* App Top Bar */}
                            <div className="flex items-center justify-between pb-2 mb-2 border-b border-black/5">
                              <div className="flex items-center gap-2 min-w-0">
                                <div className="w-7 h-7 rounded-xl bg-slate-900 text-white flex items-center justify-center text-xs font-bold shrink-0 shadow-2xs">
                                  {stampEmoji}
                                </div>
                                <div className="min-w-0">
                                  <div className={`font-display font-bold text-xs truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>
                                    {customStoreName || 'Your Cafe Name'}
                                  </div>
                                  <div className={`text-[9px] font-mono truncate ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                                    /c/{customStoreSlug || 'your-cafe'}
                                  </div>
                                </div>
                              </div>
                              <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-500 border border-amber-400/30 shrink-0">
                                VIP Pass
                              </span>
                            </div>

                            {/* Live Tab Switcher Inside Phone Preview */}
                            <div className="grid grid-cols-3 gap-1 p-1 rounded-xl bg-black/5 mb-3">
                              {[
                                { id: 'pass', label: '🏠 Pass' },
                                { id: 'offers', label: '🎁 Offers' },
                                { id: 'visits', label: '🕒 Visits' },
                              ].map((tab) => (
                                <button
                                  key={tab.id}
                                  type="button"
                                  onClick={() => {
                                    setPreviewActiveTab(tab.id as any);
                                    sound.playClick();
                                  }}
                                  className={`py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                                    previewActiveTab === tab.id
                                      ? 'bg-white text-slate-950 shadow-2xs'
                                      : isDark
                                      ? 'text-slate-400 hover:text-white'
                                      : 'text-slate-600 hover:text-slate-900'
                                  }`}
                                >
                                  {tab.label}
                                </button>
                              ))}
                            </div>

                            {/* TAB 1: PASS CARD */}
                            {previewActiveTab === 'pass' && (
                              <div className="space-y-3 animate-in fade-in">
                                <div className="text-center space-y-0.5">
                                  <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-500">
                                    {customWelcomeBadge || (selectedBusiness?.reward_rule?.category || 'VIP Loyalty Pass')}
                                  </div>
                                  <div className={`text-[10px] leading-tight ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                                    {customWelcomeTagline || 'Collect stamps & earn treats!'}
                                  </div>
                                </div>

                                <div
                                  className={`w-full p-4 text-white space-y-3.5 shadow-xl transition-all duration-300 relative overflow-hidden ${cardRadiusClass}`}
                                  style={{ background: cardBg }}
                                >
                                  <div className="flex items-center justify-between border-b border-white/20 pb-2">
                                    <span className="text-[10px] font-mono uppercase font-bold tracking-wider text-amber-300">
                                      Loyalty Card
                                    </span>
                                    <span className="text-[11px] font-mono font-bold text-white">
                                      2 / {customStampsNeeded} Stamps
                                    </span>
                                  </div>

                                  <div className="grid grid-cols-4 gap-1.5">
                                    {Array.from({ length: customStampsNeeded }).map((_, i) => (
                                      <div
                                        key={i}
                                        className={`aspect-square rounded-xl flex items-center justify-center border transition-all ${
                                          i < 2
                                            ? 'bg-white text-slate-950 border-amber-300 shadow-xs'
                                            : i === customStampsNeeded - 1
                                            ? 'bg-white/10 text-amber-300 border-amber-400/50 border-dashed'
                                            : 'bg-white/5 text-white/40 border-white/15'
                                        }`}
                                      >
                                        {i < 2 ? (
                                          <span className="text-sm">{stampEmoji}</span>
                                        ) : i === customStampsNeeded - 1 ? (
                                          <Gift className="w-3.5 h-3.5 text-amber-300" />
                                        ) : (
                                          <span className="text-[10px] font-mono font-bold">{i + 1}</span>
                                        )}
                                      </div>
                                    ))}
                                  </div>

                                  <div className="p-2 rounded-xl bg-white/15 border border-white/10 text-left space-y-0.5">
                                    <div className="text-[9px] font-mono uppercase font-bold text-amber-300">
                                      🎁 Reward at {customStampsNeeded} Stamps
                                    </div>
                                    <div className="text-[11px] font-bold text-white truncate">
                                      {customRewardTitle || 'Grand Reward'}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* TAB 2: OFFERS PREVIEW */}
                            {previewActiveTab === 'offers' && (
                              <div className="space-y-2 animate-in fade-in py-1">
                                <div className={`text-[10px] font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                                  Available &amp; Milestone Perks
                                </div>

                                <div className="p-2.5 rounded-xl border border-amber-400/40 bg-amber-400/10 flex items-center justify-between gap-2">
                                  <div className="flex items-center gap-2 min-w-0">
                                    <div className="w-7 h-7 rounded-lg bg-amber-400 text-slate-950 flex items-center justify-center text-xs font-bold shrink-0">
                                      🔥
                                    </div>
                                    <div className="min-w-0 text-left">
                                      <div className={`text-[11px] font-bold truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>
                                        Free Belgian Waffle
                                      </div>
                                      <div className="text-[9px] font-mono text-amber-500">
                                        At 3 Stamps (1 stamp away!)
                                      </div>
                                    </div>
                                  </div>
                                  <span className="text-[9px] px-2 py-0.5 rounded-full bg-amber-400 text-slate-950 font-bold">
                                    Locked
                                  </span>
                                </div>

                                <div className="p-2.5 rounded-xl border border-slate-200 bg-white/40 flex items-center justify-between gap-2">
                                  <div className="flex items-center gap-2 min-w-0">
                                    <div className="w-7 h-7 rounded-lg bg-slate-900 text-white flex items-center justify-center text-xs font-bold shrink-0">
                                      ⭐
                                    </div>
                                    <div className="min-w-0 text-left">
                                      <div className={`text-[11px] font-bold truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>
                                        {customRewardTitle || 'Grand Prize'}
                                      </div>
                                      <div className="text-[9px] font-mono text-slate-400">
                                        At {customStampsNeeded} Stamps
                                      </div>
                                    </div>
                                  </div>
                                  <span className="text-[9px] px-2 py-0.5 rounded-full bg-slate-200 text-slate-700 font-bold">
                                    Locked
                                  </span>
                                </div>
                              </div>
                            )}

                            {/* TAB 3: VISITS TIMELINE PREVIEW */}
                            {previewActiveTab === 'visits' && (
                              <div className="space-y-2 animate-in fade-in py-1">
                                <div className={`text-[10px] font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                                  Counter Visits History
                                </div>

                                <div className="p-2.5 rounded-xl border border-slate-200 bg-white/40 flex items-center justify-between">
                                  <div className="text-left">
                                    <div className={`text-[11px] font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                                      Yesterday at Counter
                                    </div>
                                    <div className="text-[9px] font-mono text-slate-400">₹320 • In-store visit</div>
                                  </div>
                                  <span className="text-[10px] font-mono font-bold text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-full">
                                    +1 Stamp {stampEmoji}
                                  </span>
                                </div>

                                <div className="p-2.5 rounded-xl border border-slate-200 bg-white/40 flex items-center justify-between">
                                  <div className="text-left">
                                    <div className={`text-[11px] font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                                      3 days ago
                                    </div>
                                    <div className="text-[9px] font-mono text-slate-400">₹250 • Welcome visit</div>
                                  </div>
                                  <span className="text-[10px] font-mono font-bold text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-full">
                                    +1 Stamp {stampEmoji}
                                  </span>
                                </div>
                              </div>
                            )}
                          </div>

                          <div className="flex items-center gap-2 mt-3 text-center">
                            <Link
                              href={`/c/${customStoreSlug || selectedBusiness?.slug || 'prime-cafe'}`}
                              target="_blank"
                              className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 hover:underline"
                            >
                              <span>Open Live Customer Pass</span>
                              <ExternalLink className="w-3 h-3" />
                            </Link>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* Modal Footer Actions */}
                <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowCustomizationModal(false)}
                    className="py-2.5 px-5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold cursor-pointer transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSavingCustomization}
                    className="py-2.5 px-6 rounded-full bg-[#0F172A] hover:bg-black text-white text-xs font-bold cursor-pointer transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50 active:scale-98"
                  >
                    {isSavingCustomization ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 text-amber-400" />
                        <span>Save &amp; Publish Store Theme</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* ONE-TIME BUSINESS ONBOARDING & STORE SETUP MODAL */}
        {/* ========================================================================= */}
        {selectedBusiness && (
          <BusinessSetupModal
            business={selectedBusiness}
            isOpen={showSetupModal}
            onClose={() => {
              try {
                localStorage.setItem(`reva_setup_done_${selectedBusiness.id}`, 'true');
                localStorage.setItem(`reva_setup_dismissed_${selectedBusiness.id}`, 'true');
                localStorage.setItem('reva_setup_done', 'true');
                if (typeof window !== 'undefined') {
                  window.history.replaceState({}, '', `/dashboard?businessId=${selectedBusiness.id}`);
                }
              } catch {}
              setShowSetupModal(false);
            }}
            onComplete={async (updatedBusiness) => {
              try {
                localStorage.setItem(`reva_setup_done_${updatedBusiness.id}`, 'true');
                localStorage.setItem('reva_setup_done', 'true');
                if (typeof window !== 'undefined') {
                  window.history.replaceState({}, '', `/dashboard?businessId=${updatedBusiness.id}`);
                }
              } catch {}
              setShowSetupModal(false);
              setSelectedBusiness(updatedBusiness);
              await loadDashboardData(updatedBusiness.id);
            }}
          />
        )}

        {/* ========================================================================= */}
        {/* CREATE REWARD MODAL                                                        */}
        {/* ========================================================================= */}
        {showCreateOfferModal && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 border border-slate-100 shadow-2xl space-y-5 animate-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3.5">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold border border-emerald-200">
                    <Gift className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-base text-[#0F172A]">
                      Create Reward
                    </h3>
                    <p className="text-xs text-slate-500">
                      Create an independent loyalty reward for your customers
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowCreateOfferModal(false)}
                  className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleCreateNewOffer} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Reward Title *
                  </label>
                  <input
                    type="text"
                    value={newOfferTitle}
                    onChange={(e) => setNewOfferTitle(e.target.value)}
                    placeholder="e.g. Free Hair Spa"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#0F172A]"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-semibold text-slate-700">
                        Unlock at — number of stamps required *
                      </label>
                    </div>
                    <input
                      type="number"
                      min={1}
                      max={50}
                      value={newOfferStamps}
                      onChange={(e) => {
                        const raw = e.target.value;
                        if (raw === '') {
                          setNewOfferStamps('');
                          return;
                        }
                        const num = Number(raw);
                        const clamped = Math.min(50, Math.max(1, num));
                        setNewOfferStamps(clamped);
                        setNewOfferBadge(`${clamped} Stamps Reward`);
                      }}
                      placeholder="e.g. 8 Stamps"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-[#0F172A] font-mono bg-slate-50/50"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Reward Expiry (Days)
                    </label>
                    <div className="relative">
                      <Clock className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                      <input
                        type="number"
                        min="0"
                        value={newOfferExpiryDays}
                        onChange={(e) => setNewOfferExpiryDays(e.target.value)}
                        placeholder="e.g. 30 (0 for no expiry)"
                        className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#0F172A] font-mono bg-slate-50/50"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Description
                  </label>
                  <input
                    type="text"
                    value={newOfferDesc}
                    onChange={(e) => setNewOfferDesc(e.target.value)}
                    placeholder="e.g. Get a free hair spa after completing 8 stamps."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#0F172A]"
                  />
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowCreateOfferModal(false)}
                    className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isCreatingOffer}
                    className="px-6 py-2.5 rounded-xl bg-[#0F172A] hover:bg-black text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50 active:scale-95"
                  >
                    {isCreatingOffer ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400 stroke-[3]" />
                        <span>Create Reward</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* EDIT REWARD MODAL                                                          */}
        {/* ========================================================================= */}
        {showEditOfferModal && editingOffer && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 border border-slate-100 shadow-2xl space-y-5 animate-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3.5">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-800 flex items-center justify-center font-bold border border-amber-200">
                    <Edit2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-base text-[#0F172A]">
                      Edit Reward
                    </h3>
                    <p className="text-xs text-slate-500">
                      Update reward title, unlock stamps, or expiry
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowEditOfferModal(false)}
                  className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSaveEditedOffer} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Reward Title *
                  </label>
                  <input
                    type="text"
                    value={editOfferTitle}
                    onChange={(e) => setEditOfferTitle(e.target.value)}
                    placeholder="e.g. Free Hair Spa"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#0F172A]"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-semibold text-slate-700">
                        Unlock at — number of stamps required *
                      </label>
                    </div>
                    <input
                      type="number"
                      min={1}
                      max={50}
                      value={editOfferStamps}
                      onChange={(e) => {
                        const raw = e.target.value;
                        if (raw === '') {
                          setEditOfferStamps('');
                          return;
                        }
                        const num = Number(raw);
                        const clamped = Math.min(50, Math.max(1, num));
                        setEditOfferStamps(clamped);
                        setEditOfferBadge(`${clamped} Stamps Reward`);
                      }}
                      placeholder="e.g. 8 Stamps"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-[#0F172A] font-mono bg-slate-50/50"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Reward Expiry (Days)
                    </label>
                    <div className="relative">
                      <Clock className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                      <input
                        type="number"
                        min="0"
                        value={editOfferExpiryDays}
                        onChange={(e) => setEditOfferExpiryDays(e.target.value)}
                        placeholder="e.g. 30 (0 for no expiry)"
                        className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#0F172A] font-mono bg-slate-50/50"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Description
                  </label>
                  <input
                    type="text"
                    value={editOfferDesc}
                    onChange={(e) => setEditOfferDesc(e.target.value)}
                    placeholder="e.g. Get a free hair spa after completing 8 stamps."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#0F172A]"
                  />
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowEditOfferModal(false)}
                    className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isEditingOffer}
                    className="px-6 py-2.5 rounded-xl bg-[#0F172A] hover:bg-black text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50 active:scale-95"
                  >
                    {isEditingOffer ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400 stroke-[3]" />
                        <span>Update Reward</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* COUNTER QR STAND STUDIO & QR SETTINGS MODAL                               */}
        {/* ========================================================================= */}
        <CounterQrStandModal
          isOpen={isQrStandModalOpen}
          onClose={() => setIsQrStandModalOpen(false)}
          business={selectedBusiness}
          origin={origin}
        />

        {/* ========================================================================= */}
        {/* CAFE LOGO CROP & POSITION MODAL                                           */}
        {/* ========================================================================= */}
        <CropLogoModal
          isOpen={showCropPhotoModal}
          imageSrc={cropImageRawSrc}
          onClose={() => {
            setShowCropPhotoModal(false);
            setCropImageRawSrc('');
          }}
          onSave={handleApplyAndSaveCrop}
          isSaving={isSavingCrop}
        />
      </main>

      {/* ========================================================================= */}
      {/* 3. UNIFIED FLOATING BOTTOM NAVIGATION DOCK (Desktop & Mobile)             */}
      {/* ========================================================================= */}
      <nav
        aria-label="Dashboard Navigation Bar"
        className="fixed bottom-3 sm:bottom-6 left-3 right-3 sm:left-1/2 sm:right-auto sm:-translate-x-1/2 z-40 bg-white/95 backdrop-blur-md border border-slate-200/90 rounded-2xl sm:rounded-full px-2 sm:px-4 py-1.5 sm:py-2 flex items-center justify-around sm:justify-center gap-1 sm:gap-2 shadow-[0_8px_30px_rgb(0,0,0,0.12)] max-w-md sm:max-w-none"
      >
        <button
          type="button"
          onClick={() => {
            setActiveTab('home');
            sound.playClick();
          }}
          className={`flex flex-col sm:flex-row items-center justify-center py-1 sm:py-2 px-3 sm:px-4 rounded-xl sm:rounded-full transition-all cursor-pointer ${
            activeTab === 'home'
              ? 'bg-[#0F172A] text-white shadow-sm font-bold'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
          }`}
        >
          <LayoutDashboard className="w-5 h-5 sm:w-4 sm:h-4 sm:mr-1.5" />
          <span className="text-[10px] sm:text-xs tracking-tight font-medium">Home</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveTab('reward');
            sound.playClick();
          }}
          className={`flex flex-col sm:flex-row items-center justify-center py-1 sm:py-2 px-3 sm:px-4 rounded-xl sm:rounded-full transition-all cursor-pointer ${
            activeTab === 'reward'
              ? 'bg-[#0F172A] text-white shadow-sm font-bold'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
          }`}
        >
          <Gift className="w-5 h-5 sm:w-4 sm:h-4 sm:mr-1.5" />
          <span className="text-[10px] sm:text-xs tracking-tight font-medium">Reward</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveTab('stats');
            sound.playClick();
          }}
          className={`flex flex-col sm:flex-row items-center justify-center py-1 sm:py-2 px-3 sm:px-4 rounded-xl sm:rounded-full transition-all cursor-pointer ${
            activeTab === 'stats'
              ? 'bg-[#0F172A] text-white shadow-sm font-bold'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
          }`}
        >
          <BarChart3 className="w-5 h-5 sm:w-4 sm:h-4 sm:mr-1.5" />
          <span className="text-[10px] sm:text-xs tracking-tight font-medium">Stats</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveTab('profile');
            sound.playClick();
          }}
          className={`flex flex-col sm:flex-row items-center justify-center py-1 sm:py-2 px-3 sm:px-4 rounded-xl sm:rounded-full transition-all cursor-pointer ${
            activeTab === 'profile'
              ? 'bg-[#0F172A] text-white shadow-sm font-bold'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
          }`}
        >
          <Store className="w-5 h-5 sm:w-4 sm:h-4 sm:mr-1.5" />
          <span className="text-[10px] sm:text-xs tracking-tight font-medium">Profile</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveTab('settings');
            sound.playClick();
          }}
          className={`flex flex-col sm:flex-row items-center justify-center py-1 sm:py-2 px-3 sm:px-4 rounded-xl sm:rounded-full transition-all cursor-pointer ${
            activeTab === 'settings'
              ? 'bg-[#0F172A] text-white shadow-sm font-bold'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
          }`}
        >
          <Settings className="w-5 h-5 sm:w-4 sm:h-4 sm:mr-1.5" />
          <span className="text-[10px] sm:text-xs tracking-tight font-medium">Settings</span>
        </button>
      </nav>
    </div>
  );
}

export default function OwnerDashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-white">
          <div className="w-8 h-8 flex items-center justify-center text-[#0F172A] animate-spin mb-3">
            <svg viewBox="0 0 24 24" className="w-8 h-8 fill-none stroke-current stroke-[2.2]">
              <path d="M12 2v20M2 12h20M4.93 4.93l14.14 14.14M4.93 19.07L19.07 4.93" />
            </svg>
          </div>
          <p className="text-xs font-mono font-bold uppercase tracking-widest text-slate-400">Loading Siplo Dashboard...</p>
        </div>
      }
    >
      <OwnerDashboardContent />
    </Suspense>
  );
}

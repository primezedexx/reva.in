'use client';

// ============================================================================
// REVA (reva.in) — Customer Hub & Discovery Portal (/c)
// 3 Core Tabs: [Home] + Center Floating Scan/Camera Button + [Profile & Settings]
// (Explore Tab preserved for future feature releases)
// Unique Reva Brand Aesthetic & Interactive Features
// ============================================================================

import React, { useState, useEffect, useMemo, useRef, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import confetti from 'canvas-confetti';
import {
  Home,
  Compass,
  Gift,
  User,
  QrCode,
  Search,
  MapPin,
  CheckCircle2,
  ChevronRight,
  Flame,
  Star,
  Sparkles,
  Wallet,
  ArrowRight,
  Clock,
  Shield,
  ShieldCheck,
  HelpCircle,
  LogOut,
  Moon,
  Sun,
  Camera,
  X,
  ExternalLink,
  Store,
  Tag,
  Check,
  Edit2,
  Phone,
  Mail,
  Zap,
  Coffee,
  ShoppingBag,
  Scissors,
  Sparkle,
  RefreshCw,
  UserPlus,
  Calendar,
  Trash2,
  Upload,
  Navigation,
  Info,
} from 'lucide-react';
import { sound } from '@/lib/sound';
import { supabase } from '@/lib/supabase';
import { compressImageFile } from '@/lib/image-compress';
import { resolvePassBackground, resolvePageBackground } from '@/lib/theme-presets';
import { ThemeConfig, RewardRule } from '@/types/database';
import CameraQrScannerModal from '@/components/CameraQrScannerModal';
import PrivacySecurityModal from '@/components/PrivacySecurityModal';

interface BusinessItem {
  id: string;
  name: string;
  slug: string;
  logo_url?: string;
  brand_color?: string;
  category: string;
  address?: string;
  area?: string;
  city?: string;
  pincode?: string;
  latitude?: number;
  longitude?: number;
  maps_url?: string;
  phone?: string;
  google_review_url?: string;
  instagram_url?: string;
  theme_config?: ThemeConfig;
  isOpen: boolean;
  distance: string;
  hasRealDistance?: boolean;
  calculatedDistanceKm?: number;
  reward_rule?: {
    stamps_needed: number;
    reward_title: string;
    reward_desc?: string;
    google_review_url?: string;
    instagram_url?: string;
    phone?: string;
    address?: string;
    area?: string;
    city?: string;
    description?: string;
    theme_config?: ThemeConfig;
    [key: string]: any;
  };
  active_offers?: Array<{
    id: string;
    title: string;
    stamps_needed: number;
    badge?: string;
    desc?: string;
  }>;
}

interface ClaimedReward {
  id: string;
  businessName: string;
  businessSlug: string;
  rewardTitle: string;
  claimedAt: string;
  voucherCode: string;
}

function getBusinessLogo(name: string, category?: string, logoUrl?: string): string {
  if (logoUrl && logoUrl.trim().length > 0) return logoUrl;
  const lower = (name + ' ' + (category || '')).toLowerCase();
  if (lower.includes('matcha') || lower.includes('tea')) {
    return 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=300&auto=format&fit=crop&q=80';
  }
  if (lower.includes('boba') || lower.includes('brew')) {
    return 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=300&auto=format&fit=crop&q=80';
  }
  if (lower.includes('bheem') || lower.includes('pujari')) {
    return 'https://images.unsplash.com/photo-1559925393-8be0ec4767c8?w=300&auto=format&fit=crop&q=80';
  }
  if (lower.includes('crumb') || lower.includes('sourdough') || lower.includes('bakery') || lower.includes('bread') || lower.includes('pastry') || lower.includes('deli')) {
    return 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=300&auto=format&fit=crop&q=80';
  }
  if (lower.includes('roast') || lower.includes('coffee') || lower.includes('café') || lower.includes('cafe')) {
    return 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=300&auto=format&fit=crop&q=80';
  }
  if (lower.includes('salon') || lower.includes('spa') || lower.includes('hair') || lower.includes('beauty')) {
    return 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=300&auto=format&fit=crop&q=80';
  }
  if (lower.includes('boutique') || lower.includes('fashion') || lower.includes('wear') || lower.includes('apparel')) {
    return 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=300&auto=format&fit=crop&q=80';
  }
  if (lower.includes('fragrance') || lower.includes('perfume') || lower.includes('aroma') || lower.includes('lifestyle')) {
    return 'https://images.unsplash.com/photo-1615397349754-cfa2066a298e?w=300&auto=format&fit=crop&q=80';
  }
  return 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=300&auto=format&fit=crop&q=80';
}

// Lively Member Since & Registration Logic Formatter
function formatMemberSinceMonth(isoDateStr?: string | null): string {
  if (!isoDateStr) {
    return new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }).toUpperCase();
  }
  try {
    const d = new Date(isoDateStr);
    if (isNaN(d.getTime())) return new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }).toUpperCase();
    return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }).toUpperCase();
  } catch {
    return new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }).toUpperCase();
  }
}

function formatExactRegistrationDate(isoDateStr?: string | null): string {
  if (!isoDateStr) return new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
  try {
    const d = new Date(isoDateStr);
    if (isNaN(d.getTime())) return new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
    return d.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch {
    return new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
  }
}

function getLivelyMembershipDuration(isoDateStr?: string | null): string {
  if (!isoDateStr) return 'Joined today • Active';
  try {
    const now = Date.now();
    const joined = new Date(isoDateStr).getTime();
    if (isNaN(joined)) return 'Joined today • Active';
    const diffMs = Math.max(0, now - joined);
    const diffMins = Math.floor(diffMs / (1000 * 60));
    if (diffMins < 60) {
      if (diffMins <= 2) return 'Joined just now • Active';
      return 'Joined today • Active';
    }
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    if (diffHours < 24) return 'Joined today • Active';
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    if (diffDays === 1) return 'Member for 1 day • Active';
    if (diffDays < 30) return `Member for ${diffDays} days • Active`;
    const diffMonths = Math.floor(diffDays / 30);
    if (diffMonths < 12) return `Member for ${diffMonths} month${diffMonths > 1 ? 's' : ''} • Active`;
    const diffYears = Math.floor(diffDays / 365);
    return `Member for ${diffYears} year${diffYears > 1 ? 's' : ''} • VIP`;
  } catch {
    return 'Joined today • Active';
  }
}

function renderStampIconSymbol(iconType: string, isStamped: boolean, isRewardSlot: boolean, accentColor?: string) {
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
    return isStamped ? <Coffee className="w-5 h-5" style={{ color: accentColor || '#F59E0B' }} /> : <Coffee className="w-5 h-5 text-white/50" />;
  }
  return isStamped ? <Check className="w-5 h-5 stroke-[3]" style={{ color: accentColor || '#10B981' }} /> : <Star className="w-5 h-5 text-white/40" />;
}

// Resolve Store Coordinates (handles GPS coordinates, addresses, areas, cities, and landmarks)
function resolveStoreCoordinates(b: {
  latitude?: number | null;
  longitude?: number | null;
  address?: string | null;
  area?: string | null;
  city?: string | null;
  name?: string | null;
  slug?: string | null;
}): { lat: number; lng: number } {
  if (b.latitude && b.longitude && !isNaN(Number(b.latitude)) && !isNaN(Number(b.longitude))) {
    return { lat: Number(b.latitude), lng: Number(b.longitude) };
  }

  const text = `${b.name || ''} ${b.address || ''} ${b.area || ''} ${b.city || ''} ${b.slug || ''}`.toLowerCase();

  // Mumbai / MMR Areas
  if (text.includes('gokhiware') || text.includes('vasai east')) return { lat: 19.3919, lng: 72.8397 };
  if (text.includes('vasai')) return { lat: 19.3837, lng: 72.8282 };
  if (text.includes('virar')) return { lat: 19.4674, lng: 72.8041 };
  if (text.includes('nalasopara')) return { lat: 19.4182, lng: 72.8184 };
  if (text.includes('andheri')) return { lat: 19.1136, lng: 72.8697 };
  if (text.includes('bandra')) return { lat: 19.0596, lng: 72.8295 };
  if (text.includes('bkc') || text.includes('kurla')) return { lat: 19.0664, lng: 72.8679 };
  if (text.includes('juhu') || text.includes('vile parle')) return { lat: 19.1025, lng: 72.8273 };
  if (text.includes('powai') || text.includes('hiranandani')) return { lat: 19.1197, lng: 72.9051 };
  if (text.includes('thane')) return { lat: 19.2183, lng: 72.9781 };
  if (text.includes('navi mumbai') || text.includes('vashi')) return { lat: 19.0771, lng: 72.9986 };
  if (text.includes('colaba') || text.includes('fort') || text.includes('nariman') || text.includes('marine')) return { lat: 18.9067, lng: 72.8147 };
  if (text.includes('mumbai') || text.includes('bombay')) return { lat: 19.0760, lng: 72.8777 };

  // Bengaluru Areas
  if (text.includes('indiranagar')) return { lat: 12.9784, lng: 77.6408 };
  if (text.includes('koramangala')) return { lat: 12.9352, lng: 77.6245 };
  if (text.includes('lavelle') || text.includes('ashok nagar') || text.includes('shantala')) return { lat: 12.9716, lng: 77.5946 };
  if (text.includes('hsr')) return { lat: 12.9121, lng: 77.6446 };
  if (text.includes('whitefield')) return { lat: 12.9698, lng: 77.7500 };
  if (text.includes('jp nagar') || text.includes('jayanagar')) return { lat: 12.9141, lng: 77.5878 };
  if (text.includes('mg road') || text.includes('brigade') || text.includes('commercial street')) return { lat: 12.9756, lng: 77.6066 };
  if (text.includes('bengaluru') || text.includes('bangalore')) return { lat: 12.9716, lng: 77.5946 };

  // Pune Areas
  if (text.includes('koregaon') || text.includes('kp')) return { lat: 18.5362, lng: 73.8940 };
  if (text.includes('kothrud') || text.includes('viman') || text.includes('baner') || text.includes('pune')) return { lat: 18.5204, lng: 73.8567 };

  // Delhi NCR
  if (text.includes('connaught') || text.includes('cp') || text.includes('delhi') || text.includes('gurgaon') || text.includes('noida')) return { lat: 28.6139, lng: 77.2090 };

  return { lat: 12.9716, lng: 77.5946 };
}

// Haversine Distance Calculation (km)
function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function formatDistance(distKm: number): string {
  if (distKm < 0.1) {
    return '< 100 m';
  }
  if (distKm < 1) {
    return `${Math.round(distKm * 1000)} m`;
  }
  if (distKm < 10) {
    return `${distKm.toFixed(1)} km`;
  }
  if (distKm < 100) {
    return `${distKm.toFixed(1)} km`;
  }
  return `${Math.round(distKm)} km`;
}

function CustomerPortalContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialTab = searchParams.get('tab');

  // Active Bottom Tab: 'home' | 'profile' ('explore' and 'rewards' preserved for future updates)
  const [activeTab, setActiveTab] = useState<'home' | 'explore' | 'rewards' | 'profile'>(() => {
    if (initialTab && ['home', 'rewards', 'profile'].includes(initialTab)) {
      return initialTab as 'home' | 'rewards' | 'profile';
    }
    return 'home';
  });

  const lastAppliedTabParamRef = useRef<string | null>(initialTab);
  useEffect(() => {
    if (initialTab && initialTab !== lastAppliedTabParamRef.current && ['home', 'rewards', 'profile'].includes(initialTab)) {
      lastAppliedTabParamRef.current = initialTab;
      setActiveTab(initialTab as 'home' | 'rewards' | 'profile');
    }
  }, [initialTab]);

  // Customer Profile State (persisted in localStorage & DB)
  const [customerName, setCustomerName] = useState('Valued Guest');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerAvatar, setCustomerAvatar] = useState<string | null>(null);
  const [registeredAt, setRegisteredAt] = useState<string>('');
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Profile Edit Modals & Upload State
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);
  const [editNameInput, setEditNameInput] = useState('');
  const [editEmailInput, setEditEmailInput] = useState('');
  const [editAvatarPreview, setEditAvatarPreview] = useState<string | null>(null);
  const [uploadToast, setUploadToast] = useState<string | null>(null);

  // Scanner Modal State
  const [showScannerModal, setShowScannerModal] = useState(false);
  const [scannerFlash, setScannerFlash] = useState(false);

  // Privacy & Security Modal State
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);

  // Explore & Geolocation State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [userLocation, setUserLocation] = useState<string | null>(null);
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [locating, setLocating] = useState(false);
  const [isSortedByDistance, setIsSortedByDistance] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [manualLocationSearch, setManualLocationSearch] = useState('');
  const [isSearchingLocation, setIsSearchingLocation] = useState(false);

  // Rewards State: 'to-claim' | 'history'
  const [rewardSubTab, setRewardSubTab] = useState<'to-claim' | 'history'>('to-claim');
  const [claimedRewards, setClaimedRewards] = useState<ClaimedReward[]>([]);

  // Available Unlocked Rewards
  const [unlockedRewards, setUnlockedRewards] = useState<
    Array<{
      id: string;
      businessName: string;
      businessSlug: string;
      brandColor: string;
      rewardTitle: string;
      stamps: number;
      totalNeeded: number;
      expiry: string;
      image?: string;
    }>
  >([]);

  // Modal for Active Reward Redemption
  const [redeemingReward, setRedeemingReward] = useState<{
    id: string;
    businessName: string;
    businessSlug: string;
    rewardTitle: string;
    code: string;
  } | null>(null);

  // Business List from API with fallback
  const [businesses, setBusinesses] = useState<BusinessItem[]>([]);
  const [loadingBusinesses, setLoadingBusinesses] = useState(true);

  // Join New Pass Modal State (Name & Mobile Number sent to Restaurant Owner in DB)
  const [joiningBusiness, setJoiningBusiness] = useState<BusinessItem | null>(null);
  const [joinNameInput, setJoinNameInput] = useState('');
  const [joinPhoneInput, setJoinPhoneInput] = useState('');
  const [isJoiningSubmitting, setIsJoiningSubmitting] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);

  // Customer's Joined Passes (starts empty for new users)
  const [userPasses, setUserPasses] = useState<
    Array<{
      slug: string;
      name: string;
      category: string;
      brandColor: string;
      logo_url?: string;
      stamps: number;
      totalStamps: number;
      rewardTitle: string;
      lastVisit: string;
      minOrder?: number;
      passId?: string;
      cycle?: number;
      googleReviewUrl?: string;
      phone?: string;
      maps_url?: string;
      instagram_url?: string;
      description?: string;
      address?: string;
      area?: string;
      city?: string;
      joined_at?: string;
      last_visit_at?: string;
      theme_config?: ThemeConfig;
      reward_rule?: RewardRule;
      active_offers?: any[];
      total_visits?: number;
    }>
  >([]);

  // Selected Pass in Featured Digital Pass Holder (persisted across sessions & tab switches)
  const [selectedPassSlug, setSelectedPassSlug] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      try {
        return localStorage.getItem('reva_selected_pass_slug') || '';
      } catch {}
    }
    return '';
  });
  const passHolderRef = useRef<HTMLDivElement>(null);

  const selectedPass = useMemo(() => {
    if (userPasses.length === 0) return null;
    return userPasses.find((p) => p.slug === selectedPassSlug) || userPasses[0];
  }, [userPasses, selectedPassSlug]);

  const handleSelectPass = (slug: string) => {
    sound.playClick();
    setSelectedPassSlug(slug);
    try {
      localStorage.setItem('reva_selected_pass_slug', slug);
    } catch {}
    setTimeout(() => {
      if (passHolderRef.current) {
        passHolderRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } else {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }, 50);
  };

  // Helper to filter out ambient merchant/admin emails
  const isMerchantAdminEmail = (e: string | null | undefined): boolean => {
    if (!e) return false;
    const lower = e.trim().toLowerCase();
    return lower.includes('primezedexx') || lower.includes('owner') || lower.endsWith('@reva.in');
  };

  // Load Saved Customer Profile, Passes and Claims from localStorage
  useEffect(() => {
    try {
      // One-time clear of legacy dummy mock data or leaked admin emails
      const freshV7 = localStorage.getItem('reva_stamps_fresh_v7');
      if (!freshV7) {
        localStorage.setItem('reva_stamps_fresh_v7', 'true');
        const p = localStorage.getItem('reva_customer_phone');
        if (p === '+91 98765 43210' || p === '9876543210') {
          localStorage.removeItem('reva_customer_phone');
        }
        const n = localStorage.getItem('reva_customer_name');
        if (n === 'Aarav Sharma') {
          localStorage.removeItem('reva_customer_name');
        }
        const em = localStorage.getItem('reva_customer_email');
        if (em && isMerchantAdminEmail(em)) {
          localStorage.removeItem('reva_customer_email');
        }
      }

      const savedPhone = localStorage.getItem('reva_customer_phone');
      if (savedPhone && savedPhone !== '+91 98765 43210' && savedPhone !== '9876543210') {
        setCustomerPhone(savedPhone);
      } else {
        setCustomerPhone('');
      }

      const savedName = localStorage.getItem('reva_customer_name');
      if (savedName && savedName !== 'Aarav Sharma') {
        setCustomerName(savedName);
      }

      const savedEmail = localStorage.getItem('reva_customer_email');
      if (savedEmail && !isMerchantAdminEmail(savedEmail)) {
        setCustomerEmail(savedEmail);
      } else {
        setCustomerEmail('');
        try { localStorage.removeItem('reva_customer_email'); } catch {}
      }

      const savedAvatar = localStorage.getItem('reva_customer_avatar');
      if (savedAvatar) setCustomerAvatar(savedAvatar);

      const savedRegisteredAt = localStorage.getItem('reva_customer_registered_at');
      if (savedRegisteredAt) {
        setRegisteredAt(savedRegisteredAt);
      } else {
        const nowIso = new Date().toISOString();
        setRegisteredAt(nowIso);
        try { localStorage.setItem('reva_customer_registered_at', nowIso); } catch {}
      }

      const savedLocation = localStorage.getItem('reva_user_location');
      const savedCoords = localStorage.getItem('reva_user_coords');
      if (savedLocation) setUserLocation(savedLocation);
      if (savedCoords) {
        try {
          setUserCoords(JSON.parse(savedCoords));
          setIsSortedByDistance(true);
        } catch {}
      }

      let claimedList: ClaimedReward[] = [];
      const savedClaimed = localStorage.getItem('reva_claimed_rewards');
      if (savedClaimed) {
        try {
          const parsed = JSON.parse(savedClaimed);
          if (Array.isArray(parsed)) {
            claimedList = parsed;
            setClaimedRewards(parsed);
          }
        } catch {}
      }

      const savedPasses = localStorage.getItem('reva_customer_passes');
      if (savedPasses) {
        try {
          const parsed = JSON.parse(savedPasses);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setUserPasses(parsed);
            const savedSelected = localStorage.getItem('reva_selected_pass_slug');
            const exists = parsed.some((p: any) => p.slug === savedSelected);
            const activeSlug = exists && savedSelected ? savedSelected : parsed[0].slug;
            setSelectedPassSlug(activeSlug);
            try { localStorage.setItem('reva_selected_pass_slug', activeSlug); } catch {}
          }
        } catch {}
      }

      const savedUnlocked = localStorage.getItem('reva_unlocked_rewards');
      if (savedUnlocked) {
        try {
          const parsed = JSON.parse(savedUnlocked);
          if (Array.isArray(parsed)) {
            setUnlockedRewards(parsed);
          }
        } catch {}
      }

      // Sync customer phone pass details from backend (pure customer identity, completely isolated from merchant auth)
      const syncCustomerSession = async () => {
        const currentPhone = localStorage.getItem('reva_customer_phone') || '';
        const currentName = localStorage.getItem('reva_customer_name') || '';
        const rawEmail = localStorage.getItem('reva_customer_email') || '';
        const hasRealPhone = currentPhone && currentPhone !== '+91 98765 43210' && currentPhone !== '9876543210' && !currentPhone.includes('@') && currentPhone.replace(/\D/g, '').length >= 10;

        const effectivePhone = hasRealPhone ? currentPhone : '';
        const effectiveEmail = (rawEmail && !isMerchantAdminEmail(rawEmail)) ? rawEmail : '';

        if (!effectivePhone && !effectiveEmail) {
          return;
        }

        if (currentName && currentName !== 'Valued Guest' && currentName !== 'Aarav Sharma') {
          setCustomerName(currentName);
          localStorage.setItem('reva_customer_name', currentName);
        }
        if (effectivePhone) {
          setCustomerPhone(effectivePhone);
          localStorage.setItem('reva_customer_phone', effectivePhone);
        }
        if (effectiveEmail) {
          setCustomerEmail(effectiveEmail);
          localStorage.setItem('reva_customer_email', effectiveEmail);
        } else {
          setCustomerEmail('');
          try { localStorage.removeItem('reva_customer_email'); } catch {}
        }

        const params = new URLSearchParams();
        if (effectivePhone) {
          params.set('phone', effectivePhone);
        }
        if (effectiveEmail) {
          params.set('email', effectiveEmail);
        }
        if (currentName && currentName !== 'Valued Guest' && currentName !== 'Aarav Sharma') {
          params.set('name', currentName);
        }

        if (params.toString()) {
          try {
            const res = await fetch(`/api/customer/session?${params.toString()}`);
            if (res.ok) {
              const sessionData = await res.json();
              if (sessionData.passes && Array.isArray(sessionData.passes)) {
                setUserPasses(sessionData.passes);
                localStorage.setItem('reva_customer_passes', JSON.stringify(sessionData.passes));
                if (sessionData.passes.length > 0) {
                  setSelectedPassSlug((prev) => {
                    const savedSelected = localStorage.getItem('reva_selected_pass_slug');
                    const candidate = prev || savedSelected || '';
                    const exists = sessionData.passes.some((p: any) => p.slug === candidate);
                    const chosen = exists && candidate ? candidate : sessionData.passes[0].slug;
                    try { localStorage.setItem('reva_selected_pass_slug', chosen); } catch {}
                    return chosen;
                  });
                } else {
                  setSelectedPassSlug('');
                }
              }

              // Update Phone: ONLY set if session actually has a valid phone number (10+ digits, no @)
              if (sessionData.phone && sessionData.phone.replace(/\D/g, '').length >= 10 && !sessionData.phone.includes('@')) {
                setCustomerPhone(sessionData.phone);
                localStorage.setItem('reva_customer_phone', sessionData.phone);
              }

              // Update Email: ONLY if legitimate non-admin customer email
              if (sessionData.email && !isMerchantAdminEmail(sessionData.email)) {
                setCustomerEmail(sessionData.email);
                localStorage.setItem('reva_customer_email', sessionData.email);
              } else {
                setCustomerEmail('');
                try { localStorage.removeItem('reva_customer_email'); } catch {}
              }

              if (sessionData.avatar_url && !localStorage.getItem('reva_customer_avatar')) {
                setCustomerAvatar(sessionData.avatar_url);
                try {
                  localStorage.setItem('reva_customer_avatar', sessionData.avatar_url);
                } catch {}
              }
              if (sessionData.name && sessionData.name !== 'Valued Guest' && sessionData.name !== 'Aarav Sharma') {
                setCustomerName(sessionData.name);
                localStorage.setItem('reva_customer_name', sessionData.name);
              }
              if (sessionData.registered_at) {
                setRegisteredAt(sessionData.registered_at);
                localStorage.setItem('reva_customer_registered_at', sessionData.registered_at);
              }
            }
          } catch {}
        }
      };

      syncCustomerSession();
    } catch {
      // ignore
    }
  }, []);

  // ---------------------------------------------------------------------------
  // Dynamically Derive Unlocked Rewards from User Passes (6/6 stamps or Milestones)
  // ---------------------------------------------------------------------------
  useEffect(() => {
    const derived: Array<{
      id: string;
      businessName: string;
      businessSlug: string;
      brandColor: string;
      rewardTitle: string;
      stamps: number;
      totalNeeded: number;
      expiry: string;
      image?: string;
    }> = [];

    userPasses.forEach((pass) => {
      const needed = pass.totalStamps || pass.reward_rule?.stamps_needed || 6;
      const current = pass.stamps || 0;

      // Full Card Loyalty Reward Unlocked ONLY when customer completes all required stamps (e.g. 6/6 or 8/8)
      if (current >= needed) {
        derived.push({
          id: `reward_${pass.slug}_full_${needed}`,
          businessName: pass.name,
          businessSlug: pass.slug,
          brandColor: pass.brandColor || '#3B82F6',
          rewardTitle: pass.rewardTitle || pass.reward_rule?.reward_title || 'Free Loyalty Reward',
          stamps: current,
          totalNeeded: needed,
          expiry: 'Ready to claim at counter',
          image: pass.logo_url,
        });
      }
    });

    setUnlockedRewards(derived);
    try {
      localStorage.setItem('reva_unlocked_rewards', JSON.stringify(derived));
    } catch {}
  }, [userPasses, claimedRewards]);

  // ---------------------------------------------------------------------------
  // Real-Time Live Sync Poller (Detects Cashier Counter Stamps within 1.5s)
  // ---------------------------------------------------------------------------
  useEffect(() => {
    const pollSync = async () => {
      try {
        const savedPhone = localStorage.getItem('reva_customer_phone') || '';
        const savedEmail = localStorage.getItem('reva_customer_email') || '';
        const cleanEmail = (savedEmail && !isMerchantAdminEmail(savedEmail)) ? savedEmail : '';

        const params = new URLSearchParams();
        if (savedPhone && savedPhone.replace(/\D/g, '').length >= 10 && !savedPhone.includes('@')) {
          params.set('phone', savedPhone);
        }
        if (cleanEmail) {
          params.set('email', cleanEmail);
        }

        if (!params.toString()) return;

        const res = await fetch(`/api/customer/session?${params.toString()}`, {
          cache: 'no-store',
          headers: { 'Cache-Control': 'no-cache, no-store, must-revalidate' },
        });

        if (res.ok) {
          const data = await res.json();
          if (data.passes && Array.isArray(data.passes)) {
            setUserPasses((prev) => {
              let hasChange = false;
              let stampIncremented = false;
              let grandRewardUnlocked = false;

              if (prev.length !== data.passes.length) {
                hasChange = true;
              }

              data.passes.forEach((newP: any) => {
                const oldP = prev.find((p) => p.slug === newP.slug);
                if (oldP) {
                  if ((newP.stamps || 0) > (oldP.stamps || 0)) {
                    hasChange = true;
                    stampIncremented = true;
                    const needed = newP.totalStamps || newP.reward_rule?.stamps_needed || 6;
                    if ((newP.stamps || 0) >= needed) {
                      grandRewardUnlocked = true;
                    }
                  } else if (
                    (newP.stamps || 0) !== (oldP.stamps || 0) ||
                    (newP.total_visits || 0) !== (oldP.total_visits || 0)
                  ) {
                    hasChange = true;
                  }
                } else {
                  hasChange = true;
                }
              });

              if (stampIncremented) {
                sound.playStampPop();
                if (grandRewardUnlocked) {
                  sound.playRewardFanfare();
                  confetti({
                    particleCount: 120,
                    spread: 80,
                    origin: { y: 0.6 },
                  });
                }
              }

              if (hasChange) {
                localStorage.setItem('reva_customer_passes', JSON.stringify(data.passes));
                return data.passes;
              }
              return prev;
            });
          }

          if (data.email && !isMerchantAdminEmail(data.email)) {
            setCustomerEmail(data.email);
            try { localStorage.setItem('reva_customer_email', data.email); } catch {}
          } else if (data.email && isMerchantAdminEmail(data.email)) {
            setCustomerEmail('');
            try { localStorage.removeItem('reva_customer_email'); } catch {}
          }
        }
      } catch {
        // background poll quiet
      }
    };

    const interval = setInterval(pollSync, 1500);
    return () => clearInterval(interval);
  }, []);

  // Fetch Businesses from API
  useEffect(() => {
    async function fetchBusinesses() {
      try {
        setLoadingBusinesses(true);
        const res = await fetch('/api/businesses');
        const data = await res.json();
        if (data.success && Array.isArray(data.businesses)) {
          setBusinesses(data.businesses);
        }
      } catch {
        // Fallback default businesses
      } finally {
        setLoadingBusinesses(false);
      }
    }
    fetchBusinesses();
  }, []);

  // Categories for Explore Tab
  const categories = ['All', 'Café & Beverage', 'Bakery & Deli', 'Fashion & Boutique', 'Salon & Spa', 'Fragrance & Lifestyle'];

  // Filtered & Distance-Sorted Businesses for Explore Tab
  const filteredBusinesses = useMemo(() => {
    const list = businesses.map((b) => {
      const coords = resolveStoreCoordinates(b);
      let distKm = 999999;
      let dynamicDistance = '';
      let hasRealDistance = false;

      if (userCoords && coords) {
        distKm = calculateDistanceKm(userCoords.lat, userCoords.lng, coords.lat, coords.lng);
        dynamicDistance = formatDistance(distKm);
        hasRealDistance = true;
      }

      return {
        ...b,
        latitude: coords.lat,
        longitude: coords.lng,
        distance: dynamicDistance,
        hasRealDistance,
        calculatedDistanceKm: distKm,
      };
    });

    let result = list.filter((b) => {
      const matchesCat = selectedCategory === 'All' || b.category.toLowerCase().includes(selectedCategory.toLowerCase().split(' ')[0]);
      const matchesSearch =
        searchQuery === '' ||
        b.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (b.address || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (b.area || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (b.city || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (b.reward_rule?.reward_title || '').toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCat && matchesSearch;
    });

    if (userCoords || isSortedByDistance) {
      result = [...result].sort((a, b) => (a.calculatedDistanceKm ?? 999999) - (b.calculatedDistanceKm ?? 999999));
    }

    return result;
  }, [businesses, selectedCategory, searchQuery, userCoords, isSortedByDistance]);

  // Businesses available to start a new pass (Excludes already joined/active passes)
  const availableToJoinBusinesses = useMemo(() => {
    const activeSlugs = new Set(userPasses.map((p) => p.slug));
    return businesses.filter((b) => !activeSlugs.has(b.slug));
  }, [businesses, userPasses]);

  // Toggle Dark Mode
  const toggleDarkMode = () => {
    sound.playClick();
    setIsDarkMode((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('reva_customer_dark', String(next));
      } catch {
        // ignore
      }
      return next;
    });
  };

  // Location Detector with Real Browser GPS & Proximity Sorting
  const handleGetLocation = () => {
    sound.playClick();
    setLocating(true);

    if (!('geolocation' in navigator)) {
      const fallbackArea = 'Vasai, Mumbai MMR';
      setUserLocation(fallbackArea);
      setUserCoords({ lat: 19.3837, lng: 72.8282 });
      setIsSortedByDistance(true);
      setLocating(false);
      sound.playSuccess();
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setUserCoords({ lat, lng });
        setIsSortedByDistance(true);

        let detectedArea = '';
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`, {
            headers: { 'Accept-Language': 'en' },
            signal: AbortSignal.timeout(3500),
          });
          const geoData = await res.json();
          if (geoData?.address) {
            const suburb =
              geoData.address.suburb ||
              geoData.address.neighbourhood ||
              geoData.address.residential ||
              geoData.address.city_district ||
              geoData.address.road;
            const city =
              geoData.address.city ||
              geoData.address.state_district ||
              geoData.address.town ||
              geoData.address.county ||
              '';
            if (suburb && city) {
              detectedArea = `${suburb}, ${city}`;
            } else if (suburb) {
              detectedArea = suburb;
            } else if (city) {
              detectedArea = city;
            }
          }
        } catch {
          // fallback
        }

        if (!detectedArea) {
          const distToVasai = calculateDistanceKm(lat, lng, 19.3837, 72.8282);
          const distToAndheri = calculateDistanceKm(lat, lng, 19.1136, 72.8697);
          const distToBandra = calculateDistanceKm(lat, lng, 19.0596, 72.8295);
          const distToIndiranagar = calculateDistanceKm(lat, lng, 12.9784, 77.6408);
          const distToKoramangala = calculateDistanceKm(lat, lng, 12.9352, 77.6245);
          const distToPune = calculateDistanceKm(lat, lng, 18.5204, 73.8567);
          const distToDelhi = calculateDistanceKm(lat, lng, 28.6139, 77.2090);

          const distances = [
            { name: 'Vasai, Mumbai MMR', d: distToVasai },
            { name: 'Andheri, Mumbai', d: distToAndheri },
            { name: 'Bandra, Mumbai', d: distToBandra },
            { name: 'Indiranagar, Bengaluru', d: distToIndiranagar },
            { name: 'Koramangala, Bengaluru', d: distToKoramangala },
            { name: 'Pune', d: distToPune },
            { name: 'Delhi NCR', d: distToDelhi },
          ].sort((a, b) => a.d - b.d);

          detectedArea = distances[0].name;
        }

        setUserLocation(detectedArea);
        try {
          localStorage.setItem('reva_user_location', detectedArea);
          localStorage.setItem('reva_user_coords', JSON.stringify({ lat, lng }));
        } catch {}

        setLocating(false);
        sound.playSuccess();
      },
      (err) => {
        console.warn('Geolocation error or permission denied:', err);
        setLocating(false);
        setShowLocationModal(true);
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 60000 }
    );
  };

  // Manual Location Selection
  const handleSelectLocation = (area: string, lat: number, lng: number) => {
    sound.playClick();
    setUserLocation(area);
    setUserCoords({ lat, lng });
    setIsSortedByDistance(true);
    try {
      localStorage.setItem('reva_user_location', area);
      localStorage.setItem('reva_user_coords', JSON.stringify({ lat, lng }));
    } catch {}
    setShowLocationModal(false);
    setManualLocationSearch('');
    sound.playSuccess();
  };

  // Custom Search for any City/Area
  const handleSearchManualLocation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualLocationSearch.trim()) return;
    setIsSearchingLocation(true);
    sound.playClick();

    const query = manualLocationSearch.trim().toLowerCase();

    // Instant MMR & Mumbai Area matches
    if (query.includes('gokhiware') || query.includes('vasai east')) {
      handleSelectLocation('Gokhiware, Vasai East', 19.3919, 72.8397);
      setIsSearchingLocation(false);
      return;
    }
    if (query.includes('vasai')) {
      handleSelectLocation('Vasai, Mumbai MMR', 19.3837, 72.8282);
      setIsSearchingLocation(false);
      return;
    }
    if (query.includes('virar')) {
      handleSelectLocation('Virar, Mumbai MMR', 19.4674, 72.8041);
      setIsSearchingLocation(false);
      return;
    }
    if (query.includes('nalasopara')) {
      handleSelectLocation('Nalasopara, Mumbai MMR', 19.4182, 72.8184);
      setIsSearchingLocation(false);
      return;
    }
    if (query.includes('andheri')) {
      handleSelectLocation('Andheri, Mumbai', 19.1136, 72.8697);
      setIsSearchingLocation(false);
      return;
    }
    if (query.includes('bandra')) {
      handleSelectLocation('Bandra, Mumbai', 19.0596, 72.8295);
      setIsSearchingLocation(false);
      return;
    }
    if (query.includes('bkc') || query.includes('kurla')) {
      handleSelectLocation('BKC, Mumbai', 19.0664, 72.8679);
      setIsSearchingLocation(false);
      return;
    }
    if (query.includes('juhu') || query.includes('vile parle')) {
      handleSelectLocation('Juhu, Mumbai', 19.1025, 72.8273);
      setIsSearchingLocation(false);
      return;
    }
    if (query.includes('powai') || query.includes('hiranandani')) {
      handleSelectLocation('Powai, Mumbai', 19.1197, 72.9051);
      setIsSearchingLocation(false);
      return;
    }
    if (query.includes('colaba') || query.includes('fort') || query.includes('nariman') || query.includes('marine')) {
      handleSelectLocation('South Mumbai', 18.9067, 72.8147);
      setIsSearchingLocation(false);
      return;
    }
    if (query.includes('mumbai') || query.includes('bombay')) {
      handleSelectLocation(manualLocationSearch.trim(), 19.0760, 72.8777);
      setIsSearchingLocation(false);
      return;
    }

    // Instant Bengaluru Area matches
    if (query.includes('indiranagar')) {
      handleSelectLocation('Indiranagar, Bengaluru', 12.9784, 77.6408);
      setIsSearchingLocation(false);
      return;
    }
    if (query.includes('koramangala')) {
      handleSelectLocation('Koramangala, Bengaluru', 12.9352, 77.6245);
      setIsSearchingLocation(false);
      return;
    }
    if (query.includes('hsr')) {
      handleSelectLocation('HSR Layout, Bengaluru', 12.9121, 77.6446);
      setIsSearchingLocation(false);
      return;
    }
    if (query.includes('lavelle') || query.includes('ashok nagar')) {
      handleSelectLocation('Lavelle Road, Bengaluru', 12.9716, 77.5946);
      setIsSearchingLocation(false);
      return;
    }
    if (query.includes('bangalore') || query.includes('bengaluru')) {
      handleSelectLocation(manualLocationSearch.trim(), 12.9716, 77.5946);
      setIsSearchingLocation(false);
      return;
    }

    // Instant Pune & Delhi matches
    if (query.includes('pune') || query.includes('kothrud') || query.includes('viman') || query.includes('koregaon')) {
      handleSelectLocation(manualLocationSearch.trim(), 18.5204, 73.8567);
      setIsSearchingLocation(false);
      return;
    }
    if (query.includes('delhi') || query.includes('gurgaon') || query.includes('noida') || query.includes('connaught') || query.includes('cp')) {
      handleSelectLocation(manualLocationSearch.trim(), 28.6139, 77.2090);
      setIsSearchingLocation(false);
      return;
    }

    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(manualLocationSearch + ', India')}&format=json&limit=1`, {
        headers: { 'Accept-Language': 'en' },
        signal: AbortSignal.timeout(3500),
      });
      const data = await res.json();
      if (data && data.length > 0) {
        const lat = parseFloat(data[0].lat);
        const lng = parseFloat(data[0].lon);
        const displayName = data[0].display_name.split(',').slice(0, 2).join(', ');
        handleSelectLocation(displayName || manualLocationSearch.trim(), lat, lng);
      } else {
        handleSelectLocation(manualLocationSearch.trim(), 19.0760, 72.8777);
      }
    } catch {
      handleSelectLocation(manualLocationSearch.trim(), 19.0760, 72.8777);
    } finally {
      setIsSearchingLocation(false);
    }
  };

  // Handle Profile Photo Upload via File Picker
  const handleAvatarFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 15 * 1024 * 1024) {
      alert('Photo is too large. Please select an image under 15MB.');
      return;
    }

    try {
      const compressedBase64 = await compressImageFile(file, 360, 0.85);
      if (!compressedBase64) return;

      setCustomerAvatar(compressedBase64);
      setEditAvatarPreview(compressedBase64);
      try {
        localStorage.setItem('reva_customer_avatar', compressedBase64);
      } catch (err) {
        console.warn('Could not cache avatar locally', err);
      }

      sound.playStampPop();
      setUploadToast('Profile photo updated successfully!');
      setTimeout(() => setUploadToast(null), 3000);

      // Async sync with profile API in DB
      const effPhone = customerPhone || localStorage.getItem('reva_customer_phone') || '';
      const effEmail = (customerEmail && !isMerchantAdminEmail(customerEmail)) ? customerEmail : '';
      const effName = customerName || localStorage.getItem('reva_customer_name') || 'Valued Guest';

      fetch('/api/customer/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: effPhone,
          email: effEmail,
          name: effName,
          avatar_url: compressedBase64,
        }),
      }).then(async (res) => {
        if (res.ok) {
          const data = await res.json();
          if (data.customer?.avatar_url) {
            setCustomerAvatar(data.customer.avatar_url);
            try {
              localStorage.setItem('reva_customer_avatar', data.customer.avatar_url);
            } catch {}
          }
        }
      }).catch(() => {});
    } catch (err) {
      console.error('Image compression failed', err);
      alert('Failed to process image. Please try another photo.');
    }
  };

  const handleRemoveAvatar = async () => {
    sound.playClick();
    setCustomerAvatar(null);
    setEditAvatarPreview(null);
    try {
      localStorage.removeItem('reva_customer_avatar');
    } catch {
      // ignore
    }
    setUploadToast('Profile photo removed');
    setTimeout(() => setUploadToast(null), 3000);

    const effPhone = customerPhone || localStorage.getItem('reva_customer_phone') || '';
    const effEmail = (customerEmail && !isMerchantAdminEmail(customerEmail)) ? customerEmail : '';
    const effName = customerName || localStorage.getItem('reva_customer_name') || 'Valued Guest';

    fetch('/api/customer/profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        phone: effPhone,
        email: effEmail,
        name: effName,
        avatar_url: null,
      }),
    }).catch(() => {});
  };

  // Save Profile Edits
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    sound.playClick();
    const newName = editNameInput.trim() || customerName;
    const cleanEditEmail = editEmailInput.trim();

    setCustomerName(newName);
    localStorage.setItem('reva_customer_name', newName);

    let finalEmail = '';
    if (cleanEditEmail && !isMerchantAdminEmail(cleanEditEmail)) {
      finalEmail = cleanEditEmail.toLowerCase();
      setCustomerEmail(finalEmail);
      localStorage.setItem('reva_customer_email', finalEmail);
    } else if (!cleanEditEmail) {
      setCustomerEmail('');
      try { localStorage.removeItem('reva_customer_email'); } catch {}
    }

    const updatedAvatar = editAvatarPreview !== undefined ? editAvatarPreview : customerAvatar;
    if (updatedAvatar) {
      setCustomerAvatar(updatedAvatar);
      try {
        localStorage.setItem('reva_customer_avatar', updatedAvatar);
      } catch {}
    } else if (editAvatarPreview === null) {
      setCustomerAvatar(null);
      try {
        localStorage.removeItem('reva_customer_avatar');
      } catch {}
    }

    // Call API in background
    const effPhone = customerPhone || localStorage.getItem('reva_customer_phone') || '';
    fetch('/api/customer/profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        phone: effPhone,
        email: finalEmail,
        name: newName,
        avatar_url: updatedAvatar || null,
      }),
    }).catch(() => {});

    setShowEditProfileModal(false);
    setUploadToast('Profile updated!');
    setTimeout(() => setUploadToast(null), 3000);
  };

  // Handle Reward Claim
  const handleClaimVoucher = async (reward: {
    id: string;
    businessName: string;
    businessSlug: string;
    brandColor?: string;
    rewardTitle: string;
    stamps?: number;
    totalNeeded?: number;
    expiry?: string;
  }) => {
    const targetPass = userPasses.find((p) => p.slug === reward.businessSlug);
    const needed = reward.totalNeeded || targetPass?.totalStamps || 6;
    const current = targetPass?.stamps || 0;

    if (current < needed) {
      alert(`You need ${needed} stamps to claim this reward (you currently have ${current}). Keep collecting stamps!`);
      return;
    }

    sound.playRewardFanfare();
    confetti({
      particleCount: 120,
      spread: 80,
      origin: { y: 0.6 },
    });

    const code = `REV-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

    // 1. Keep the pass in userPasses and deduct needed stamps
    const passMembershipId = (targetPass as any)?.membershipId || (targetPass as any)?.membership_id || (targetPass as any)?.id || targetPass?.passId;
    const targetBusId = (targetPass as any)?.business_id || reward.businessSlug;
    const deduct = needed;

    setUserPasses((prev) => {
      const updated = prev.map((pass) => {
        if (pass.slug === reward.businessSlug) {
          return {
            ...pass,
            stamps: Math.max(0, (pass.stamps || 0) - deduct),
            cycle: (pass.cycle || 1) + 1,
          };
        }
        return pass;
      });
      try {
        localStorage.setItem('reva_customer_passes', JSON.stringify(updated));
      } catch {}
      return updated;
    });

    // 2. Add to claimedRewards history
    const nowTimeStr = new Date().toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    const newClaim: ClaimedReward = {
      id: `claim_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      businessName: reward.businessName,
      businessSlug: reward.businessSlug,
      rewardTitle: reward.rewardTitle,
      claimedAt: nowTimeStr,
      voucherCode: code,
    };

    setClaimedRewards((prev) => {
      const updated = [newClaim, ...prev.filter((c) => c.voucherCode !== code)];
      try {
        localStorage.setItem('reva_claimed_rewards', JSON.stringify(updated));
      } catch {}
      return updated;
    });

    // 3. Remove from local unlocked rewards state immediately
    setUnlockedRewards((prev) => {
      const updated = prev.filter((r) => r.id !== reward.id);
      try {
        localStorage.setItem('reva_unlocked_rewards', JSON.stringify(updated));
      } catch {}
      return updated;
    });

    // 4. Open redemption voucher modal
    setRedeemingReward({
      id: reward.id,
      businessName: reward.businessName,
      businessSlug: reward.businessSlug,
      rewardTitle: reward.rewardTitle,
      code,
    });

    // 5. Sync redemption with backend database
    try {
      if (passMembershipId || reward.businessSlug) {
        const res = await fetch('/api/reward/redeem', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            membershipId: passMembershipId,
            businessId: targetBusId,
            rewardDesc: reward.rewardTitle,
            verifiedBy: 'customer_claim',
          }),
        });
        if (res.ok) {
          const data = await res.json();
          if (data.membership) {
            setUserPasses((prev) => {
              const updated = prev.map((pass) => {
                if (pass.slug === reward.businessSlug || (pass as any).membershipId === data.membership.id) {
                  return {
                    ...pass,
                    stamps: data.membership.stamps !== undefined ? data.membership.stamps : 0,
                    cycle: (pass.cycle || 1) + 1,
                  };
                }
                return pass;
              });
              try {
                localStorage.setItem('reva_customer_passes', JSON.stringify(updated));
              } catch {}
              return updated;
            });
          }
        }
      }
    } catch (err) {
      console.error('Error redeeming reward:', err);
    }
  };

  // Open modal to join / start a store's loyalty pass with customer phone & name
  const handleOpenJoinModal = (b: BusinessItem) => {
    sound.playClick();
    const existing = userPasses.find((p) => p.slug === b.slug);
    if (existing) {
      handleSelectPass(b.slug);
      switchTab('home');
      return;
    }
    setJoiningBusiness(b);
    setJoinNameInput(customerName || '');
    setJoinPhoneInput(customerPhone || '');
    setJoinError(null);
  };

  // Submit and create customer & membership in backend database (Restaurant Owner receives customer data)
  const handleConfirmJoinPass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!joiningBusiness) return;
    const phone = joinPhoneInput.trim();
    const name = joinNameInput.trim();

    if (!phone || phone.length < 8) {
      setJoinError('Please enter a valid mobile number');
      return;
    }
    if (!name) {
      setJoinError('Please enter your name');
      return;
    }

    try {
      setIsJoiningSubmitting(true);
      setJoinError(null);
      sound.playClick();

      // 1. Call real backend API to register/link customer with restaurant owner in the database!
      const cleanEmail = (customerEmail && !isMerchantAdminEmail(customerEmail)) ? customerEmail : undefined;

      const res = await fetch('/api/customer/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessSlug: joiningBusiness.slug,
          phone,
          name,
          email: cleanEmail,
        }),
      });

      const data = await res.json();

      if (!data.success && !data.membership) {
        setJoinError(data.error || 'Failed to link with store. Please try again.');
        return;
      }

      // 2. Persist customer profile updates
      setCustomerName(name);
      setCustomerPhone(phone);
      if (data.customer?.avatar_url) {
        setCustomerAvatar(data.customer.avatar_url);
        try {
          localStorage.setItem('reva_customer_avatar', data.customer.avatar_url);
        } catch {}
      }
      if (data.customer?.registered_at || data.customer?.created_at) {
        const reg = data.customer.registered_at || data.customer.created_at;
        setRegisteredAt(reg);
        try {
          localStorage.setItem('reva_customer_registered_at', reg);
        } catch {}
      }
      try {
        localStorage.setItem('reva_customer_name', name);
        localStorage.setItem('reva_customer_phone', phone);
        localStorage.setItem(`reva_phone_${joiningBusiness.slug}`, phone);
      } catch {
        // ignore
      }

      // 3. Construct the newly active pass with complete cafe theme configuration
      const targetBiz = data.business || joiningBusiness;
      const mem = data.membership;
      const stampsNeeded = Math.min(
        8,
        Math.max(1, targetBiz.reward_rule?.stamps_needed || targetBiz.active_offers?.[0]?.stamps_needed || 6)
      );

      const themeConfig = targetBiz.theme_config || targetBiz.reward_rule?.theme_config || {
        preset: 'clean_minimal',
        page_bg_tone: 'slate_clean',
        card_gradient: 'solid',
        card_bg_color: targetBiz.brand_color || '#0F172A',
        accent_color: targetBiz.brand_color || '#0F172A',
        stamp_icon: 'paw',
        card_radius: 'rounded_squircle',
      };

      const newPass = {
        slug: targetBiz.slug,
        name: targetBiz.name,
        category: targetBiz.category || joiningBusiness.category,
        brandColor: targetBiz.brand_color || joiningBusiness.brand_color || '#0F172A',
        stamps: mem?.stamps || 0,
        totalStamps: stampsNeeded,
        rewardTitle: targetBiz.reward_rule?.reward_title || 'Specialty Loyalty Reward',
        lastVisit: 'Just joined',
        minOrder: targetBiz.reward_rule?.min_order_for_stamp || 150,
        passId: mem?.id
          ? `REV-${mem.id.slice(0, 8).toUpperCase()}`
          : `REV-${targetBiz.slug.slice(0, 3).toUpperCase()}-${Math.floor(10000 + Math.random() * 90000)}`,
        googleReviewUrl: targetBiz.google_review_url || targetBiz.reward_rule?.google_review_url,
        address: targetBiz.address || targetBiz.reward_rule?.address,
        area: targetBiz.area || targetBiz.reward_rule?.area,
        city: targetBiz.city || targetBiz.reward_rule?.city,
        joined_at: new Date().toISOString(),
        theme_config: themeConfig,
        reward_rule: targetBiz.reward_rule,
        active_offers: targetBiz.active_offers || [],
      };

      // 4. Update user passes and select
      setUserPasses((prev) => {
        const filtered = prev.filter((p) => p.slug !== newPass.slug);
        const updated = [newPass, ...filtered];
        try {
          localStorage.setItem('reva_customer_passes', JSON.stringify(updated));
        } catch {
          // ignore
        }
        return updated;
      });

      setSelectedPassSlug(newPass.slug);
      setJoiningBusiness(null);
      switchTab('home');

      // 5. Celebration
      sound.playRewardFanfare();
      confetti({
        particleCount: 100,
        spread: 80,
        origin: { y: 0.6 },
      });

      setTimeout(() => {
        if (passHolderRef.current) {
          passHolderRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
        } else {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      }, 100);
    } catch {
      setJoinError('Network connection error. Please try again.');
    } finally {
      setIsJoiningSubmitting(false);
    }
  };

  // Confirm Redemption with Cashier
  const handleConfirmRedeemed = () => {
    if (!redeemingReward) return;
    sound.playStampPop();
    setRedeemingReward(null);
  };

  // Sign out
  const handleSignOut = async () => {
    sound.playClick();
    if (confirm('Are you sure you want to sign out from your Reva pass?')) {
      try {
        await supabase.auth.signOut();
      } catch {
        // ignore
      }
      try {
        localStorage.removeItem('reva_customer_phone');
        localStorage.removeItem('reva_customer_name');
        localStorage.removeItem('reva_customer_email');
        localStorage.removeItem('reva_customer_avatar');
        localStorage.removeItem('reva_customer_registered_at');
        localStorage.removeItem('reva_customer_passes');
        localStorage.removeItem('reva_claimed_rewards');
        localStorage.removeItem('reva_unlocked_rewards');
      } catch {
        // ignore
      }
      router.push('/login?role=customer');
    }
  };

  // Switch Tab Helper with Sound & Clean URL syncing
  const switchTab = (tab: 'home' | 'explore' | 'rewards' | 'profile') => {
    sound.playClick();
    lastAppliedTabParamRef.current = tab;
    setActiveTab(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    try {
      const url = new URL(window.location.href);
      if (tab === 'home') {
        url.searchParams.delete('tab');
      } else {
        url.searchParams.set('tab', tab);
      }
      window.history.replaceState(null, '', url.pathname + url.search);
    } catch {}
  };

  return (
    <div
      className={`min-h-screen transition-colors duration-200 font-sans pb-24 ${
        isDarkMode ? 'dark bg-[#0B0F19] text-slate-100' : 'bg-[#F8FAFC] text-[#0F172A]'
      }`}
    >
      {/* ========================================================================= */}
      {/* 1. TOP HEADER BRAND BAR */}
      {/* ========================================================================= */}
      <header
        className={`sticky top-0 z-40 backdrop-blur-md border-b transition-colors ${
          isDarkMode
            ? 'bg-[#0B0F19]/90 border-slate-800'
            : 'bg-white/95 border-slate-200/80 shadow-2xs'
        }`}
      >
        <div className="max-w-md mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-6 h-6 flex items-center justify-center text-slate-900 dark:text-white group-hover:rotate-45 transition-transform duration-500">
              <svg viewBox="0 0 24 24" className="w-5 h-5 fill-none stroke-current stroke-[2.2]">
                <path d="M12 2v20M2 12h20M4.93 4.93l14.14 14.14M4.93 19.07L19.07 4.93" />
              </svg>
            </div>
            <div className="flex items-baseline gap-0.5">
              <span className="font-display font-bold text-lg tracking-tight text-slate-900 dark:text-white">Reva</span>
              <span className="text-slate-400 font-display text-xs font-medium">.in</span>
            </div>
          </Link>

          <div className="flex items-center gap-2">
            <button
              onClick={() => switchTab('profile')}
              className="w-8 h-8 rounded-full bg-[#0F172A] dark:bg-white text-white dark:text-[#0F172A] font-display font-bold text-xs flex items-center justify-center shadow-xs border border-slate-200 dark:border-slate-700 cursor-pointer hover:opacity-90 transition-opacity overflow-hidden"
              title="View Profile"
            >
              {customerAvatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={customerAvatar} alt={customerName} className="w-full h-full object-cover" />
              ) : (
                customerName.charAt(0)
              )}
            </button>
          </div>
        </div>
      </header>

      {/* ========================================================================= */}
      {/* MAIN CONTAINER (MOBILE FIRST APP WRAPPER) */}
      {/* ========================================================================= */}
      <main className="max-w-md mx-auto px-4 pt-4 pb-6">
        {/* ======================================================================= */}
        {/* TAB 1: HOME */}
        {/* ======================================================================= */}
        {activeTab === 'home' && (
          <div className="space-y-5 animate-in fade-in duration-200">
            {/* ================================================================= */}
            {/* 🌟 FEATURED DIGITAL LOYALTY PASS HOLDER (Active Pass) */}
            {/* ================================================================= */}
            <div ref={passHolderRef} className="space-y-2 pt-1 scroll-mt-20">
              <div className="flex items-center justify-between px-1">
                <span className="text-[11px] font-mono font-bold tracking-wider uppercase text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  Active Loyalty Pass
                </span>
              </div>

              {/* TACTILE PASS CARD OR EMPTY STATE */}
              {selectedPass ? (() => {
                const passTheme = selectedPass.theme_config || selectedPass.reward_rule?.theme_config;
                const passCardBg = resolvePassBackground(passTheme, selectedPass.brandColor);
                const passStampIcon = passTheme?.stamp_icon || 'paw';
                const passCardRadius = passTheme?.card_radius === 'rounded_squircle' ? 'rounded-[32px]' : passTheme?.card_radius === 'rounded_sharp' ? 'rounded-2xl' : 'rounded-3xl';
                const passWelcomeBadge = passTheme?.welcome_badge || 'OFFICIAL LOYALTY PASS';
                const passCustomTagline = passTheme?.custom_tagline;

                return (
                  <div
                    className={`${passCardRadius} overflow-hidden p-5 text-white shadow-xl border border-white/20 transition-all duration-300 relative`}
                    style={{
                      background: passCardBg,
                    }}
                  >
                    {/* Store Branding Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md p-0.5 shadow-md overflow-hidden shrink-0 flex items-center justify-center text-white border border-white/25">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={getBusinessLogo(selectedPass.name, selectedPass.category, selectedPass.logo_url)}
                            alt={selectedPass.name}
                            className="w-full h-full object-cover rounded-xl"
                          />
                        </div>
                        <div className="min-w-0">
                          <div className="text-[10px] font-mono uppercase font-bold tracking-wider text-amber-300 flex items-center gap-1.5">
                            <span>{selectedPass.category}</span>
                          </div>
                          <h2 className="text-base sm:text-lg font-display font-bold tracking-tight leading-snug text-white truncate">
                            {selectedPass.name}
                          </h2>
                          <p className="text-xs text-white/80 font-medium truncate">
                            {passCustomTagline ? (
                              <span className="text-amber-200/90 text-[11px] font-medium">{passCustomTagline}</span>
                            ) : (
                              <>Member: <span className="font-bold text-white">{customerName}</span></>
                            )}
                          </p>
                        </div>
                      </div>

                      <span className="px-2.5 py-1 rounded-full bg-white/15 backdrop-blur-md text-[10px] font-mono font-bold tracking-wider uppercase border border-white/25 text-white shadow-2xs shrink-0">
                        {selectedPass.stamps >= selectedPass.totalStamps ? 'Reward Ready' : 'Active Member'}
                      </span>
                    </div>

                    {/* Stamp Card Punch Grid */}
                    <div className="bg-black/25 backdrop-blur-md rounded-2xl p-4 border border-white/15 mb-4">
                      <div className="flex items-center justify-between mb-3 text-xs font-semibold">
                        <span className="text-white/90">Digital Stamp Card</span>
                        <span className="bg-white/20 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold text-white">
                          {selectedPass.stamps} of {selectedPass.totalStamps} collected
                        </span>
                      </div>

                      <div
                        className="grid gap-2.5"
                        style={{
                          gridTemplateColumns: `repeat(${selectedPass.totalStamps <= 6 ? selectedPass.totalStamps : 4}, minmax(0, 1fr))`,
                        }}
                      >
                        {Array.from({ length: selectedPass.totalStamps }).map((_, idx) => {
                          const isStamped = idx < selectedPass.stamps;
                          const isNext = idx === selectedPass.stamps;
                          const isRewardSlot = idx === selectedPass.totalStamps - 1;

                          return (
                            <div
                              key={idx}
                              onClick={() => {
                                sound.playStampPop();
                              }}
                              className={`aspect-square rounded-2xl flex flex-col items-center justify-center relative transition-all duration-300 cursor-pointer ${
                                isStamped
                                  ? 'bg-white text-slate-900 shadow-lg scale-100'
                                  : isNext
                                  ? 'border-2 border-dashed border-white/90 bg-white/20 scale-95 ring-2 ring-white/30'
                                  : 'border-2 border-dashed border-white/30 bg-black/10 opacity-60'
                              }`}
                            >
                              {renderStampIconSymbol(passStampIcon, isStamped, isRewardSlot, passTheme?.accent_color || selectedPass.brandColor)}

                              {isStamped ? (
                                <span className="text-[7px] font-mono font-bold tracking-tighter uppercase text-slate-600 mt-0.5">
                                  STAMPED
                                </span>
                              ) : isNext ? (
                                <span className="text-[7px] font-mono font-bold tracking-tighter uppercase text-amber-300 mt-0.5">
                                  NEXT
                                </span>
                              ) : isRewardSlot ? (
                                <span className="text-[7px] font-mono font-bold tracking-tighter uppercase text-amber-300 mt-0.5">
                                  REWARD
                                </span>
                              ) : null}
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Reward Banner / Status Action */}
                    {selectedPass.stamps >= selectedPass.totalStamps ? (
                      <div className="bg-amber-400 text-slate-950 rounded-2xl p-3.5 flex items-center justify-between gap-2 shadow-md">
                        <div className="min-w-0">
                          <div className="text-[10px] font-mono uppercase font-bold tracking-wider text-slate-800">
                            🎉 Reward Unlocked
                          </div>
                          <div className="text-xs font-bold truncate">{selectedPass.rewardTitle}</div>
                        </div>
                        <button
                          onClick={() =>
                            handleClaimVoucher({
                              id: `pass_rw_${selectedPass.slug}`,
                              businessName: selectedPass.name,
                              businessSlug: selectedPass.slug,
                              brandColor: selectedPass.brandColor,
                              rewardTitle: selectedPass.rewardTitle,
                              stamps: selectedPass.stamps,
                              totalNeeded: selectedPass.totalStamps,
                              expiry: 'Expires in 14 days',
                            })
                          }
                          className="px-3.5 py-1.5 rounded-xl bg-slate-950 hover:bg-black text-white font-display font-bold text-xs shadow-xs shrink-0 cursor-pointer active:scale-95 transition-all"
                        >
                          Claim Reward
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 flex items-center justify-between gap-2 text-xs border border-white/15">
                          <div className="flex items-center gap-2 min-w-0">
                            <Sparkles className="w-4 h-4 text-amber-300 shrink-0" />
                            <span className="truncate">
                              <b>{selectedPass.totalStamps - selectedPass.stamps} more stamps</b> to {selectedPass.rewardTitle}
                            </span>
                          </div>
                          <span className="text-[10px] font-mono opacity-80 shrink-0">
                            Min ₹{selectedPass.minOrder || 150}+
                          </span>
                        </div>
                      </div>
                    )}

                  {/* Review us on Google / Pass Footer */}
                  <div className="mt-3.5 pt-3 border-t border-white/10 flex items-center justify-between text-xs">
                    <a
                      href={
                        selectedPass.googleReviewUrl ||
                        `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                          selectedPass.name + ' ' + (selectedPass.address || selectedPass.area || 'Bengaluru')
                        )}`
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-white/15 hover:bg-white/25 active:scale-95 text-white text-[11px] font-medium backdrop-blur-md transition-all border border-white/20 shadow-2xs group cursor-pointer"
                      title={`Review ${selectedPass.name} on Google`}
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

                    <span className="text-[10px] text-white/70 font-mono">
                      Last Visit: {selectedPass.lastVisit}
                    </span>
                  </div>
                </div>
                );
              })() : (
                <div
                  className={`rounded-3xl p-6 sm:p-7 text-center space-y-4 border shadow-md transition-all ${
                    isDarkMode
                      ? 'bg-slate-900 border-slate-800 text-white'
                      : 'bg-white border-slate-200/90 text-slate-900'
                  }`}
                >
                  <div className="w-14 h-14 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto shadow-2xs border border-emerald-200/60 dark:border-emerald-800/60">
                    <Wallet className="w-7 h-7" />
                  </div>
                  <div className="space-y-1.5 max-w-sm mx-auto">
                    <h3 className="font-display font-bold text-lg text-slate-900 dark:text-white">
                      Activate Your First Loyalty Card
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                      You don&apos;t have any active store passes yet. Scan a store QR code or select any partner store below to collect digital stamps and earn free rewards!
                    </p>
                  </div>
                  <div className="pt-1">
                    <button
                      onClick={() => {
                        sound.playClick();
                        setShowScannerModal(true);
                      }}
                      className="w-full sm:w-auto px-6 py-3 rounded-full bg-[#0F172A] hover:bg-black dark:bg-white dark:hover:bg-slate-100 text-white dark:text-black font-display font-bold text-xs shadow-md transition-all cursor-pointer inline-flex items-center justify-center gap-2 group active:scale-98"
                    >
                      <QrCode className="w-4 h-4 text-emerald-400 dark:text-emerald-600" />
                      <span>Scan Store QR to Join</span>
                      <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* ================================================================= */}
            {/* 📍 STORE / RESTAURANT DETAILS SECTION */}
            {/* ================================================================= */}
            {selectedPass && (() => {
              const matchingBiz = businesses.find((b) => b.slug === selectedPass.slug);
              const fullAddress =
                matchingBiz?.address ||
                selectedPass.address ||
                (matchingBiz?.area
                  ? `${matchingBiz.area}, ${matchingBiz?.city || 'Bengaluru'}`
                  : `${selectedPass.area || 'Indiranagar'}, ${selectedPass.city || 'Bengaluru'}`);
              const storePhone =
                matchingBiz?.phone || selectedPass.reward_rule?.phone || selectedPass.phone || '+91 98765 43210';
              const cleanPhone = storePhone.replace(/\D/g, '');
              const waNumber = cleanPhone.startsWith('91') ? cleanPhone : cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
              const waUrl = `https://wa.me/${waNumber}?text=${encodeURIComponent(
                `Hi ${selectedPass.name}, I'm a Reva loyalty pass member!`
              )}`;
              const googleReview =
                selectedPass.googleReviewUrl ||
                matchingBiz?.google_review_url ||
                matchingBiz?.reward_rule?.google_review_url ||
                `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                  selectedPass.name + ' ' + fullAddress
                )}`;
              const instagramUrl =
                matchingBiz?.instagram_url ||
                selectedPass.reward_rule?.instagram_url ||
                `https://instagram.com/${selectedPass.slug.replace(/[^a-zA-Z0-9]/g, '')}`;
              const mapsUrl =
                matchingBiz?.maps_url ||
                `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                  selectedPass.name + ' ' + fullAddress
                )}`;
              const storeBio =
                matchingBiz?.theme_config?.description ||
                matchingBiz?.reward_rule?.description ||
                matchingBiz?.reward_rule?.reward_desc ||
                'Specialty artisanal treats, handcrafted beverages, and loyalty rewards on every single visit.';

              return (
                <div className="space-y-2 pt-1">
                  <div className="flex items-center justify-between px-1">
                    <h3 className="font-display font-bold text-sm tracking-tight text-slate-900 dark:text-white flex items-center gap-1.5">
                      <Info className="w-4 h-4 text-slate-500" />
                      <span>Details</span>
                    </h3>
                    <span className="text-[10px] font-mono font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 px-2.5 py-0.5 rounded-full inline-flex items-center gap-1 shadow-2xs">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      <span>Open Today</span>
                    </span>
                  </div>

                  <div
                    className={`rounded-3xl p-4 sm:p-5 border transition-all space-y-3.5 ${
                      isDarkMode
                        ? 'bg-slate-900/90 border-slate-800 text-white shadow-lg'
                        : 'bg-white border-slate-200/90 text-slate-900 shadow-xs'
                    }`}
                  >
                    {/* Store About Description */}
                    <div className="space-y-1">
                      <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                        About {selectedPass.name}
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-sans">
                        {storeBio}
                      </p>
                    </div>

                    {/* Location & Directions */}
                    <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 space-y-2.5">
                      <div className="flex items-start gap-2.5">
                        <MapPin className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                        <div className="min-w-0 flex-1">
                          <div className="text-xs font-bold text-slate-900 dark:text-white truncate">
                            {selectedPass.name}
                          </div>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug pt-0.5">
                            {fullAddress}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 pt-0.5">
                        <a
                          href={mapsUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 py-2 px-3 rounded-xl bg-slate-900 hover:bg-black dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 text-xs font-display font-bold flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer"
                        >
                          <Navigation className="w-3.5 h-3.5 text-emerald-400 dark:text-emerald-600" />
                          <span>Get Directions</span>
                          <ExternalLink className="w-3 h-3 opacity-60" />
                        </a>
                      </div>
                    </div>

                    {/* Quick Connect & Social Links Grid */}
                    <div className="grid grid-cols-3 gap-2 pt-0.5">
                      {/* Google Review */}
                      <a
                        href={googleReview}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all flex flex-col items-center justify-center text-center gap-1 group cursor-pointer shadow-2xs active:scale-95"
                        title="Review us on Google"
                      >
                        <div className="w-7 h-7 rounded-xl bg-white dark:bg-slate-700 shadow-2xs flex items-center justify-center">
                          <svg className="w-4 h-4" viewBox="0 0 24 24">
                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                          </svg>
                        </div>
                        <span className="text-[10px] font-display font-bold text-slate-800 dark:text-slate-200">
                          Google Review
                        </span>
                        <span className="text-[9px] font-mono text-amber-500 font-semibold flex items-center gap-0.5">
                          ⭐ 5.0 Rating
                        </span>
                      </a>

                      {/* Instagram */}
                      <a
                        href={instagramUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all flex flex-col items-center justify-center text-center gap-1 group cursor-pointer shadow-2xs active:scale-95"
                        title="Follow on Instagram"
                      >
                        <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 text-white shadow-2xs flex items-center justify-center">
                          <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                            <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                          </svg>
                        </div>
                        <span className="text-[10px] font-display font-bold text-slate-800 dark:text-slate-200">
                          Instagram
                        </span>
                        <span className="text-[9px] font-mono text-slate-500">
                          @{selectedPass.slug.slice(0, 10)}
                        </span>
                      </a>

                      {/* WhatsApp / Contact */}
                      <a
                        href={waUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all flex flex-col items-center justify-center text-center gap-1 group cursor-pointer shadow-2xs active:scale-95"
                        title="Chat on WhatsApp"
                      >
                        <div className="w-7 h-7 rounded-xl bg-emerald-500 text-white shadow-2xs flex items-center justify-center">
                          <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                            <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
                          </svg>
                        </div>
                        <span className="text-[10px] font-display font-bold text-slate-800 dark:text-slate-200">
                          WhatsApp
                        </span>
                        <span className="text-[9px] font-mono text-emerald-600 dark:text-emerald-400 font-semibold">
                          Chat / Call
                        </span>
                      </a>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* MY ACTIVE LOYALTY PASSES */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <h2 className="font-display font-bold text-sm tracking-tight text-slate-900 dark:text-white">
                  My Loyalty Passes ({userPasses.length})
                </h2>
                <button
                  onClick={() => {
                    sound.playClick();
                    setShowScannerModal(true);
                  }}
                  className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer flex items-center gap-1"
                >
                  <QrCode className="w-3.5 h-3.5" />
                  <span>Scan QR</span>
                </button>
              </div>

              {userPasses.length === 0 ? (
                <div
                  className={`rounded-2xl p-6 text-center space-y-2 border ${
                    isDarkMode ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200/90 shadow-2xs'
                  }`}
                >
                  <CheckCircle2 className="w-7 h-7 text-emerald-500 mx-auto" />
                  <div className="font-display font-bold text-sm text-slate-900 dark:text-white">
                    No Active Loyalty Passes
                  </div>
                  <p className="text-xs text-slate-500">
                    Tap <span className="font-semibold text-slate-700 dark:text-slate-300">START</span> on any store below to join a pass and start collecting stamps!
                  </p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {userPasses.map((pass) => {
                    const isCompleted = pass.stamps >= pass.totalStamps;
                    const isCurrentlySelected = pass.slug === selectedPassSlug;

                    return (
                      <div
                        key={pass.slug}
                        onClick={() => handleSelectPass(pass.slug)}
                        className={`block rounded-2xl p-3.5 border transition-all cursor-pointer hover:scale-[1.01] ${
                          isCurrentlySelected
                            ? isDarkMode
                              ? 'bg-slate-800/90 border-blue-500/80 ring-2 ring-blue-500/30'
                              : 'bg-blue-50/40 border-blue-400 ring-2 ring-blue-400/20 shadow-xs'
                            : isDarkMode
                            ? 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
                            : 'bg-white border-slate-200/90 hover:border-slate-300 shadow-xs'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-11 h-11 rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-800 shrink-0 border border-slate-200 dark:border-slate-700 shadow-2xs">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={getBusinessLogo(pass.name, pass.category, pass.logo_url)}
                                alt={pass.name}
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <h3 className="font-display font-bold text-sm text-slate-900 dark:text-white leading-tight truncate">
                                  {pass.name}
                                </h3>
                                {isCurrentlySelected && (
                                  <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0" title="Viewing in pass holder above" />
                                )}
                              </div>
                              <div className="text-xs text-slate-600 dark:text-slate-300 flex items-center gap-1.5 pt-0.5">
                                <span className="font-bold text-amber-600 dark:text-amber-400 shrink-0">
                                  {pass.stamps} / {pass.totalStamps} Stamps
                                </span>
                                <span>•</span>
                                <span className="truncate">{pass.rewardTitle}</span>
                              </div>
                            </div>
                          </div>

                          <div className="text-right shrink-0 pl-2 flex flex-col items-end gap-1">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSelectPass(pass.slug);
                              }}
                              className={`px-2.5 py-1 rounded-full text-[10px] font-display font-bold uppercase tracking-wider transition-all cursor-pointer ${
                                isCurrentlySelected
                                  ? 'bg-blue-600 text-white shadow-2xs'
                                  : isCompleted
                                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 hover:bg-emerald-200'
                                  : 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300 hover:bg-slate-200'
                              }`}
                            >
                              {isCurrentlySelected ? 'Viewing Above' : isCompleted ? 'View Pass' : 'View Pass'}
                            </button>
                          </div>
                        </div>

                        {/* Micro Progress Bar */}
                        <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full mt-3 overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{
                              width: `${(pass.stamps / pass.totalStamps) * 100}%`,
                              backgroundColor: pass.brandColor,
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* START A NEW PASS (DISCOVERY CARDS - UNJOINED STORES) */}
            <div className="space-y-3 pt-3">
              <div className="flex items-center justify-between">
                <h2 className="font-display font-bold text-sm tracking-tight text-slate-900 dark:text-white">
                  Start a New Pass
                </h2>
              </div>

              {availableToJoinBusinesses.length === 0 ? (
                <div
                  className={`rounded-2xl p-4 text-center border ${
                    isDarkMode ? 'bg-slate-900/40 border-slate-800' : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  {businesses.length === 0 ? (
                    <div className="space-y-1">
                      <div className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                        No partner stores listed in this area yet
                      </div>
                      <p className="text-[11px] text-slate-500">
                        Scan a store QR code or register your store to start a digital pass.
                      </p>
                    </div>
                  ) : (
                    <>
                      <div className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center justify-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                        <span>You have active passes at all partner stores!</span>
                      </div>
                      <p className="text-[11px] text-slate-500 pt-0.5">
                        Scan a store QR code to discover newly added spots.
                      </p>
                    </>
                  )}
                </div>
              ) : (
                <div className="space-y-2">
                  {availableToJoinBusinesses.slice(0, 4).map((b) => (
                    <div
                      key={b.slug}
                      className={`rounded-2xl p-3 border flex items-center justify-between transition-all ${
                        isDarkMode
                          ? 'bg-slate-900 border-slate-800 hover:border-slate-700'
                          : 'bg-white border-slate-200/90 hover:border-slate-300 shadow-2xs'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-11 h-11 rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-800 shrink-0 border border-slate-200 dark:border-slate-700 shadow-2xs">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={getBusinessLogo(b.name, b.category, b.logo_url)}
                            alt={b.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <h4 className="font-display font-bold text-sm text-slate-900 dark:text-white leading-tight truncate">
                              {b.name}
                            </h4>
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                          </div>
                          <div className="text-xs text-slate-600 dark:text-slate-300 leading-tight pt-0.5 truncate">
                            {b.reward_rule?.reward_title || 'Loyalty stamps on every visit'}
                          </div>
                          <div className="text-[11px] font-mono text-slate-400 pt-0.5">
                            {b.category}
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => handleOpenJoinModal(b)}
                        className="px-3.5 py-1.5 rounded-full border border-slate-900 dark:border-white font-display font-bold text-[11px] text-[#0F172A] dark:text-white hover:bg-[#0F172A] hover:text-white dark:hover:bg-white dark:hover:text-black transition-all shrink-0 ml-2 cursor-pointer active:scale-95"
                      >
                        START
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ======================================================================= */}
        {/* TAB 2: EXPLORE (Temporarily disabled for launch; preserved for future updates) */}
        {/* ======================================================================= */}
        {false && activeTab === 'explore' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            {/* Explore Top Header */}
            <div className="space-y-1">
              <h1 className="font-display font-bold text-2xl tracking-tight text-slate-900 dark:text-white">
                Explore
              </h1>
              <p className="text-xs font-medium text-slate-600 dark:text-slate-300">
                Find new favorites and loyalty perks near you
              </p>
            </div>

            {/* Allow Location Prompt Banner (Shown when GPS/Location is not enabled) */}
            {!userCoords && (
              <div
                className={`rounded-3xl p-4 border transition-all ${
                  isDarkMode
                    ? 'bg-gradient-to-br from-indigo-950/60 via-slate-900 to-slate-900 border-indigo-800/60 shadow-lg'
                    : 'bg-gradient-to-br from-indigo-50/90 via-sky-50/60 to-emerald-50/50 border-indigo-200/80 shadow-xs'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0 flex-1">
                    <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-sm mt-0.5">
                      <Navigation className="w-5 h-5 animate-pulse" />
                    </div>
                    <div className="min-w-0 space-y-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h3 className="font-display font-bold text-sm text-slate-900 dark:text-white">
                          Allow Location Access
                        </h3>
                        <span className="text-[10px] font-mono font-bold bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 px-1.5 py-0.5 rounded-full">
                          GPS Real-Time
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                        Calculate exact distance to cafes near you in Vasai, Gokhiware, Andheri, Bengaluru &amp; more.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-3">
                  <button
                    type="button"
                    onClick={handleGetLocation}
                    disabled={locating}
                    className="flex-1 py-2.5 px-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-98 text-white font-display font-bold text-xs shadow-md transition-all cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-60"
                  >
                    {locating ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Detecting Location...</span>
                      </>
                    ) : (
                      <>
                        <Navigation className="w-3.5 h-3.5" />
                        <span>Allow Location</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      sound.playClick();
                      setShowLocationModal(true);
                    }}
                    className="py-2.5 px-3.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-800 dark:text-slate-200 font-display font-bold text-xs transition-all cursor-pointer shrink-0 shadow-2xs"
                  >
                    <span>Choose Area</span>
                  </button>
                </div>
              </div>
            )}

            {/* Location Bar */}
            <div className="space-y-1.5">
              <div
                className={`w-full py-2.5 px-3.5 rounded-2xl border flex items-center justify-between text-xs transition-all ${
                  userLocation
                    ? 'bg-emerald-50/90 border-emerald-300 text-emerald-950 dark:bg-emerald-950/40 dark:border-emerald-700 dark:text-emerald-200 shadow-2xs'
                    : isDarkMode
                    ? 'bg-slate-900 border-slate-700 text-white'
                    : 'bg-white border-slate-300 text-slate-900 shadow-2xs'
                }`}
              >
                <button
                  type="button"
                  onClick={() => {
                    sound.playClick();
                    setShowLocationModal(true);
                  }}
                  className="flex items-center gap-2 truncate cursor-pointer text-left flex-1"
                >
                  <MapPin className="w-4 h-4 text-rose-600 shrink-0" />
                  <div className="truncate">
                    <div className="font-bold text-xs truncate">
                      {locating
                        ? 'Detecting your location...'
                        : userLocation
                        ? `Near: ${userLocation}`
                        : 'Choose your location'}
                    </div>
                    {userLocation && (
                      <div className="text-[10px] text-slate-500 dark:text-slate-400 font-normal">
                        Click to change city or area
                      </div>
                    )}
                  </div>
                </button>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      sound.playClick();
                      setShowLocationModal(true);
                    }}
                    className="px-2.5 py-1 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-display font-bold text-[11px] text-slate-800 dark:text-slate-200 hover:bg-slate-100 cursor-pointer shadow-2xs transition-colors flex items-center gap-1"
                  >
                    <Edit2 className="w-3 h-3 text-slate-500" />
                    <span>Change</span>
                  </button>
                </div>
              </div>

              {userLocation && isSortedByDistance && (
                <div className="px-1 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                  <span className="flex items-center gap-1 font-medium text-emerald-600 dark:text-emerald-400">
                    <Sparkles className="w-3 h-3" />
                    <span>Sorted by closest distance to you</span>
                  </span>
                  <button
                    onClick={() => {
                      setUserLocation(null);
                      setUserCoords(null);
                      setIsSortedByDistance(false);
                      try {
                        localStorage.removeItem('reva_user_location');
                        localStorage.removeItem('reva_user_coords');
                      } catch {}
                    }}
                    className="hover:underline text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 cursor-pointer"
                  >
                    Reset
                  </button>
                </div>
              )}
            </div>

            {/* Search Input Bar */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search cafes, sourdough, matcha, Indiranagar, etc..."
                className={`w-full pl-10 pr-4 py-2.5 rounded-2xl text-xs font-medium border outline-hidden transition-all ${
                  isDarkMode
                    ? 'bg-slate-900 border-slate-700 text-white placeholder-slate-400 focus:border-slate-500'
                    : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400 focus:border-slate-500 shadow-2xs'
                }`}
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Category Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
              {categories.map((cat) => {
                const isActive = selectedCategory === cat;
                return (
                  <button
                    key={cat}
                    onClick={() => {
                      sound.playClick();
                      setSelectedCategory(cat);
                    }}
                    className={`px-3.5 py-1.5 rounded-full whitespace-nowrap text-xs transition-all cursor-pointer ${
                      isActive
                        ? 'bg-[#0F172A] text-white dark:bg-white dark:text-black font-bold shadow-xs'
                        : isDarkMode
                        ? 'bg-slate-900 text-slate-200 hover:bg-slate-800 border border-slate-700 font-semibold'
                        : 'bg-white text-slate-800 hover:bg-slate-100 border border-slate-300 shadow-2xs font-semibold'
                    }`}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>

            {/* Businesses List */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <h3 className="font-display font-bold text-xs uppercase tracking-wider text-slate-700 dark:text-slate-300 font-mono flex items-center gap-1.5">
                  <span>{isSortedByDistance ? 'Places Near You' : 'Trending Stores'}</span>
                  <span className="text-slate-400">({filteredBusinesses.length})</span>
                </h3>
              </div>

              {filteredBusinesses.length === 0 ? (
                <div
                  className={`rounded-3xl p-8 text-center space-y-3 border ${
                    isDarkMode ? 'bg-slate-900/50 border-slate-800' : 'bg-white border-slate-200 shadow-2xs'
                  }`}
                >
                  <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto border border-indigo-100 dark:border-indigo-900/50">
                    <Store className="w-6 h-6" />
                  </div>
                  <div className="space-y-1 max-w-xs mx-auto">
                    <div className="font-display font-bold text-sm text-slate-900 dark:text-white">
                      {searchQuery || selectedCategory !== 'All' ? 'No matching cafes found' : 'No Partner Cafes Listed Yet'}
                    </div>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      {searchQuery || selectedCategory !== 'All'
                        ? 'Try clearing your search filters to explore all available spots.'
                        : 'Only real, verified cafes are listed on Reva. New partner cafes are onboarding regularly!'}
                    </p>
                  </div>
                  {!(searchQuery || selectedCategory !== 'All') && (
                    <div className="pt-1">
                      <Link
                        href="/login?role=business"
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 text-xs font-display font-bold transition-all shadow-2xs"
                      >
                        <span>Own a cafe? List your store</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredBusinesses.map((b) => {
                    const isAlreadyMember = userPasses.some((p) => p.slug === b.slug);
                    const mapsUrl = b.maps_url || `https://maps.google.com/?q=${encodeURIComponent(`${b.name}, ${b.address || b.area || ''}`)}`;
                    return (
                      <div
                        key={b.slug}
                        className={`block rounded-3xl p-4 border transition-all hover:scale-[1.01] group ${
                          isDarkMode
                            ? 'bg-slate-900 border-slate-800 hover:border-slate-700 shadow-md'
                            : 'bg-white border-slate-200/90 hover:border-slate-300 shadow-xs'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-3.5 min-w-0 flex-1">
                            <div className="w-14 h-14 rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-800 shrink-0 border border-slate-200 dark:border-slate-700 shadow-2xs">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={getBusinessLogo(b.name, b.category, b.logo_url)}
                                alt={b.name}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              />
                            </div>
                            <div className="min-w-0 flex-1 space-y-1">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <h4 className="font-display font-bold text-sm text-slate-900 dark:text-white leading-tight truncate">
                                  {b.name}
                                </h4>
                                <CheckCircle2 className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                              </div>

                              {/* Full Street Address Line */}
                              <div className="text-[11px] text-slate-600 dark:text-slate-300 flex items-start gap-1 leading-snug">
                                <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0 mt-0.5" />
                                <span className="line-clamp-1">{b.address || `${b.area || 'Indiranagar'}, ${b.city || 'Bengaluru'}`}</span>
                              </div>

                              {/* Distance & Maps Direction Row */}
                              <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 font-sans pt-0.5 flex-wrap">
                                <span className="font-semibold text-slate-700 dark:text-slate-300">{b.category}</span>
                                <span>•</span>
                                {b.hasRealDistance ? (
                                  <span className="font-mono font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200/80 dark:border-emerald-800/80 px-1.5 py-0.5 rounded-md text-[10px] inline-flex items-center gap-1">
                                    <Navigation className="w-2.5 h-2.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                                    <span>{b.distance}</span>
                                  </span>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleGetLocation();
                                    }}
                                    className="font-mono font-semibold text-indigo-700 dark:text-indigo-300 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/50 dark:hover:bg-indigo-900/60 border border-indigo-200 dark:border-indigo-800 px-1.5 py-0.5 rounded-md text-[10px] cursor-pointer inline-flex items-center gap-1 transition-colors"
                                    title="Click to calculate accurate distance with GPS"
                                  >
                                    <Navigation className="w-2.5 h-2.5 text-indigo-500 shrink-0" />
                                    <span>Allow location</span>
                                  </button>
                                )}
                                <span>•</span>
                                <a
                                  href={mapsUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  onClick={(e) => e.stopPropagation()}
                                  className="inline-flex items-center gap-1 font-semibold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                                >
                                  <Navigation className="w-3 h-3 text-blue-500" />
                                  <span>Directions</span>
                                </a>
                              </div>

                              {/* Reward Tagline */}
                              <div className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5 pt-1">
                                <Gift className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                                <span className="truncate">Win: {b.reward_rule?.reward_title || 'Loyalty Rewards'}</span>
                              </div>
                            </div>
                          </div>

                          <div className="text-right shrink-0 pl-1 flex flex-col items-end gap-2">
                            <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 px-2 py-0.5 rounded-full shadow-2xs">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                              <span>OPEN</span>
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                if (isAlreadyMember) {
                                  handleSelectPass(b.slug);
                                  switchTab('home');
                                } else {
                                  handleOpenJoinModal(b);
                                }
                              }}
                              className={`px-3.5 py-1.5 rounded-full text-xs font-display font-bold transition-all cursor-pointer ${
                                isAlreadyMember
                                  ? 'bg-blue-600 text-white shadow-2xs'
                                  : 'border border-slate-900 dark:border-white text-slate-900 dark:text-white hover:bg-slate-900 hover:text-white dark:hover:bg-white dark:hover:text-black shadow-xs'
                              }`}
                            >
                              {isAlreadyMember ? 'Viewing' : 'START'}
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ======================================================================= */}
        {/* TAB 3: REWARDS */}
        {/* ======================================================================= */}
        {activeTab === 'rewards' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            {/* Header */}
            <div className="space-y-1">
              <h1 className="font-display font-bold text-2xl tracking-tight text-slate-900 dark:text-white">
                My Rewards
              </h1>
              <p className="text-xs text-slate-600 dark:text-slate-300">
                Your earned treats, vouchers and reward history
              </p>
            </div>

            {/* Sub Tabs: To Claim vs History */}
            <div
              className={`p-1 rounded-2xl grid grid-cols-2 gap-1 border ${
                isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-slate-200/70 border-slate-200'
              }`}
            >
              <button
                onClick={() => {
                  sound.playClick();
                  setRewardSubTab('to-claim');
                }}
                className={`py-2 rounded-xl text-xs font-display font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  rewardSubTab === 'to-claim'
                    ? isDarkMode
                      ? 'bg-slate-800 text-white shadow-xs'
                      : 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <span>To Claim</span>
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                    unlockedRewards.length > 0
                      ? 'bg-emerald-500 text-white font-bold'
                      : 'bg-slate-300 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  {unlockedRewards.length}
                </span>
              </button>

              <button
                onClick={() => {
                  sound.playClick();
                  setRewardSubTab('history');
                }}
                className={`py-2 rounded-xl text-xs font-display font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  rewardSubTab === 'history'
                    ? isDarkMode
                      ? 'bg-slate-800 text-white shadow-xs'
                      : 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <span>History</span>
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-300 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                  {claimedRewards.length}
                </span>
              </button>
            </div>

            {/* SUB-TAB: TO CLAIM */}
            {rewardSubTab === 'to-claim' && (
              <div className="space-y-3">
                {unlockedRewards.length === 0 ? (
                  <div
                    className={`rounded-3xl p-8 text-center space-y-3 border ${
                      isDarkMode ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200'
                    }`}
                  >
                    <div className="w-14 h-14 rounded-2xl bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto">
                      <Gift className="w-7 h-7" />
                    </div>
                    <div className="space-y-1">
                      <h3 className="font-display font-bold text-base">No Rewards Ready Yet</h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 max-w-[240px] mx-auto leading-relaxed">
                        Collect stamps at partner stores to unlock delicious free treats & vouchers.
                      </p>
                    </div>
                    <button
                      onClick={() => switchTab('explore')}
                      className="px-4 py-2 rounded-full bg-[#0F172A] dark:bg-white text-white dark:text-black font-display font-bold text-xs shadow-xs"
                    >
                      Find Stores Near Me
                    </button>
                  </div>
                ) : (
                  unlockedRewards.map((reward) => (
                    <div
                      key={reward.id}
                      className={`rounded-3xl p-4 border relative overflow-hidden transition-all shadow-sm ${
                        isDarkMode
                          ? 'bg-slate-900/90 border-slate-800'
                          : 'bg-white border-slate-200/90'
                      }`}
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
                          <h3 className="font-display font-bold text-base leading-snug">
                            {reward.rewardTitle}
                          </h3>
                          <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
                            <Check className="w-3.5 h-3.5" />
                            <span>
                              Unlocked with {reward.stamps} / {reward.totalNeeded} stamps
                            </span>
                          </div>
                          <div className="text-[10px] text-slate-400">{reward.expiry}</div>
                        </div>

                        {reward.image && (
                          <div className="w-16 h-16 rounded-2xl overflow-hidden bg-slate-100 shrink-0 shadow-2xs">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={reward.image}
                              alt={reward.rewardTitle}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}
                      </div>

                      <div className="pt-3 border-t border-slate-100 dark:border-slate-800 mt-3 flex items-center justify-between">
                        <span className="text-[10px] text-slate-400">Show to merchant at counter</span>
                        <button
                          onClick={() => handleClaimVoucher(reward)}
                          className="px-4 py-2 rounded-xl bg-[#0F172A] hover:bg-black dark:bg-white dark:hover:bg-slate-100 text-white dark:text-black font-display font-bold text-xs shadow-md transition-all active:scale-95 cursor-pointer"
                        >
                          Claim Reward
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* SUB-TAB: HISTORY */}
            {rewardSubTab === 'history' && (
              <div className="space-y-2.5">
                {claimedRewards.length === 0 ? (
                  <div
                    className={`rounded-3xl p-8 text-center space-y-2 border ${
                      isDarkMode ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200'
                    }`}
                  >
                    <Clock className="w-8 h-8 text-slate-400 mx-auto" />
                    <div className="font-display font-bold text-sm">No Reward History</div>
                    <p className="text-xs text-slate-500">Your past claimed vouchers will show here.</p>
                  </div>
                ) : (
                  claimedRewards.map((hist) => (
                    <div
                      key={hist.id}
                      className={`rounded-2xl p-3.5 border flex items-center justify-between ${
                        isDarkMode
                          ? 'bg-slate-900/60 border-slate-800'
                          : 'bg-white border-slate-200/80 shadow-2xs'
                      }`}
                    >
                      <div className="space-y-0.5">
                        <div className="text-[10px] font-mono text-slate-400">
                          {hist.businessName}
                        </div>
                        <h4 className="font-display font-bold text-xs leading-tight">
                          {hist.rewardTitle}
                        </h4>
                        <div className="text-[10px] text-slate-400 flex items-center gap-1 font-mono">
                          <span>Code: {hist.voucherCode}</span>
                          <span>•</span>
                          <span>{hist.claimedAt}</span>
                        </div>
                      </div>

                      <span className="text-[10px] font-mono font-bold text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
                        REDEEMED
                      </span>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        )}

        {/* ======================================================================= */}
        {/* TAB 4: PROFILE */}
        {/* ======================================================================= */}
        {activeTab === 'profile' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            {/* Top Feedback Toast */}
            {uploadToast && (
              <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-display font-bold flex items-center justify-between shadow-sm animate-in fade-in">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span>{uploadToast}</span>
                </div>
                <button onClick={() => setUploadToast(null)} className="text-emerald-600 dark:text-emerald-400">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Top Profile Header */}
            <div className="space-y-1">
              <h1 className="font-display font-bold text-2xl tracking-tight text-slate-900 dark:text-white">
                Profile &amp; Settings
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Manage your Reva customer pass, photo, and preferences
              </p>
            </div>

            {/* Top Profile Card */}
            <div
              className={`rounded-3xl p-6 text-center space-y-3.5 border shadow-2xs ${
                isDarkMode
                  ? 'bg-slate-900 border-slate-800 text-white'
                  : 'bg-white border-slate-200/90 text-slate-900'
              }`}
            >
              <div className="relative inline-block mx-auto">
                <div className="w-22 h-22 rounded-full overflow-hidden bg-[#0F172A] dark:bg-slate-800 text-white font-display font-bold text-3xl flex items-center justify-center border-2 border-slate-200 dark:border-slate-700 shadow-sm relative group">
                  {customerAvatar ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={customerAvatar}
                      alt={customerName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span>{customerName.charAt(0)}</span>
                  )}
                </div>

                {/* Direct Camera Upload Overlay Button */}
                <label
                  htmlFor="profile-avatar-file-input"
                  className="w-8 h-8 rounded-full bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 flex items-center justify-center absolute bottom-0 right-0 border border-slate-300 dark:border-slate-700 shadow-sm cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700 transition-transform active:scale-95"
                  title="Upload Profile Photo"
                >
                  <Camera className="w-4 h-4 text-slate-700 dark:text-slate-200" />
                </label>
                <input
                  id="profile-avatar-file-input"
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarFileChange}
                  className="hidden"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-center gap-2">
                  <h2 className="font-display font-bold text-xl tracking-tight text-slate-900 dark:text-white leading-tight">
                    {customerName}
                  </h2>
                  <button
                    onClick={() => {
                      sound.playClick();
                      setEditNameInput(customerName);
                      setEditEmailInput(customerEmail);
                      setEditAvatarPreview(customerAvatar);
                      setShowEditProfileModal(true);
                    }}
                    className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors cursor-pointer"
                    title="Edit Name & Photo"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[11px] font-mono font-semibold border border-slate-200 dark:border-slate-700">
                  <Sparkles className="w-3 h-3 text-amber-500" />
                  <span>MEMBER SINCE {formatMemberSinceMonth(registeredAt)}</span>
                </div>
              </div>
            </div>

            {/* Contact & Registration Details Card */}
            <div
              className={`rounded-2xl p-4 border space-y-3.5 ${
                isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200/90 shadow-2xs'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center shrink-0 border border-slate-200/80 dark:border-slate-700">
                    <Phone className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-[11px] uppercase font-mono font-bold text-slate-500 dark:text-slate-400">
                      Mobile Number
                    </div>
                    <div className="font-display font-bold text-xs text-slate-900 dark:text-white font-mono pt-0.5">
                      {customerPhone && customerPhone !== '+91 98765 43210' && customerPhone !== '9876543210' && !customerPhone.includes('@') && customerPhone.replace(/\D/g, '').length >= 10 ? (
                        customerPhone
                      ) : (
                        <span className="text-slate-400 font-normal italic">Not linked yet</span>
                      )}
                    </div>
                  </div>
                </div>
                {customerPhone && customerPhone !== '+91 98765 43210' && customerPhone !== '9876543210' && !customerPhone.includes('@') && customerPhone.replace(/\D/g, '').length >= 10 ? (
                  <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                    <Check className="w-3 h-3 text-emerald-600" />
                    <span>Verified</span>
                  </span>
                ) : (
                  <button
                    onClick={() => {
                      sound.playClick();
                      const num = prompt('Enter your 10-digit mobile number to link your store passes:');
                      if (num && num.trim().length >= 8) {
                        const clean = num.trim().replace(/\s+/g, '');
                        setCustomerPhone(clean);
                        localStorage.setItem('reva_customer_phone', clean);
                        sound.playRewardFanfare();
                        fetch(`/api/customer/session?phone=${encodeURIComponent(clean)}`)
                          .then((r) => r.json())
                          .then((data) => {
                            if (data.passes && Array.isArray(data.passes)) {
                              setUserPasses(data.passes);
                              localStorage.setItem('reva_customer_passes', JSON.stringify(data.passes));
                              if (data.passes.length > 0) setSelectedPassSlug(data.passes[0].slug);
                            }
                            if (data.name && data.name !== 'Valued Guest') {
                              setCustomerName(data.name);
                              localStorage.setItem('reva_customer_name', data.name);
                            }
                            if (data.email && !isMerchantAdminEmail(data.email)) {
                              setCustomerEmail(data.email);
                              localStorage.setItem('reva_customer_email', data.email);
                            } else if (data.email && isMerchantAdminEmail(data.email)) {
                              setCustomerEmail('');
                              try { localStorage.removeItem('reva_customer_email'); } catch {}
                            }
                          })
                          .catch(() => {});
                      }
                    }}
                    className="text-xs font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 px-3 py-1 rounded-full hover:bg-emerald-100 transition-colors cursor-pointer"
                  >
                    + Add Phone
                  </button>
                )}
              </div>

              <div className="border-t border-slate-100 dark:border-slate-800 pt-3.5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center shrink-0 border border-slate-200/80 dark:border-slate-700">
                    <Mail className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div>
                    <div className="text-[11px] uppercase font-mono font-bold text-slate-500 dark:text-slate-400">
                      Email Address
                    </div>
                    <div className="font-display font-bold text-xs text-slate-900 dark:text-white pt-0.5">
                      {customerEmail && customerEmail.includes('@') ? (
                        customerEmail
                      ) : (
                        <span className="text-slate-400 font-normal italic">Not linked • Phone pass</span>
                      )}
                    </div>
                  </div>
                </div>
                {customerEmail && customerEmail.includes('@') ? (
                  <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                    <Check className="w-3 h-3 text-emerald-600" />
                    <span>Verified</span>
                  </span>
                ) : (
                  <button
                    onClick={() => {
                      sound.playClick();
                      setEditNameInput(customerName);
                      setEditEmailInput(customerEmail);
                      setEditAvatarPreview(customerAvatar);
                      setShowEditProfileModal(true);
                    }}
                    className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer bg-indigo-50 dark:bg-indigo-950/50 px-2.5 py-1 rounded-full border border-indigo-200 dark:border-indigo-800"
                  >
                    + Link Email
                  </button>
                )}
              </div>

              {/* Dynamic Lively Member Registration Row */}
              <div className="border-t border-slate-100 dark:border-slate-800 pt-3.5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center shrink-0 border border-slate-200/80 dark:border-slate-700">
                    <Calendar className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div>
                    <div className="text-[11px] uppercase font-mono font-bold text-slate-500 dark:text-slate-400">
                      {selectedPass ? `Member of ${selectedPass.name}` : 'Joined Reva'}
                    </div>
                    <div className="font-display font-bold text-xs text-slate-900 dark:text-white pt-0.5">
                      {formatExactRegistrationDate(selectedPass?.joined_at || registeredAt)}
                    </div>
                  </div>
                </div>
                <span className="text-[10px] font-mono font-semibold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-full border border-slate-200 dark:border-slate-700">
                  {getLivelyMembershipDuration(selectedPass?.joined_at || registeredAt)}
                </span>
              </div>
            </div>

            {/* App Settings List */}
            <div className="space-y-1.5 pt-1">
              <div className="text-[11px] uppercase font-mono font-bold tracking-wider text-slate-500 dark:text-slate-400 px-1">
                Preferences &amp; Security
              </div>

              <div
                className={`rounded-2xl border divide-y overflow-hidden ${
                  isDarkMode
                    ? 'bg-slate-900 border-slate-800 divide-slate-800'
                    : 'bg-white border-slate-200/90 divide-slate-100 shadow-2xs'
                }`}
              >
                {/* Dark Mode Toggle */}
                <div className="p-3.5 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center shrink-0 border border-slate-200/80 dark:border-slate-700">
                      {isDarkMode ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-display font-bold text-xs text-slate-900 dark:text-white">Dark Mode</span>
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">Switch theme appearance</div>
                    </div>
                  </div>
                  <button
                    onClick={toggleDarkMode}
                    className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                      isDarkMode ? 'bg-[#0F172A] dark:bg-indigo-600' : 'bg-slate-300'
                    }`}
                  >
                    <div
                      className={`w-4 h-4 rounded-full bg-white transition-transform absolute top-1 ${
                        isDarkMode ? 'left-6' : 'left-1'
                      }`}
                    />
                  </button>
                </div>

                {/* Privacy & Security */}
                <button
                  type="button"
                  onClick={() => {
                    sound.click();
                    setShowPrivacyModal(true);
                  }}
                  className="w-full text-left p-3.5 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center shrink-0 border border-slate-200/80 dark:border-slate-700">
                      <Shield className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div>
                      <div className="font-display font-bold text-xs text-slate-900 dark:text-white">Privacy &amp; Security</div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">Encrypted stamp records &amp; data</div>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </button>

                {/* Help & Support */}
                <a
                  href="mailto:primezedexx@gmail.com?subject=Reva%20Support%20Request"
                  className="p-3.5 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer block"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center shrink-0 border border-slate-200/80 dark:border-slate-700">
                      <Mail className="w-4 h-4 text-blue-500" />
                    </div>
                    <div>
                      <div className="font-display font-bold text-xs text-slate-900 dark:text-white">Help &amp; Support</div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">Email: primezedexx@gmail.com</div>
                    </div>
                  </div>
                  <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                </a>
              </div>
            </div>

            {/* Sign Out Button */}
            <div className="pt-2">
              <button
                onClick={handleSignOut}
                className="w-full py-3 rounded-2xl bg-white hover:bg-rose-50 text-slate-700 hover:text-rose-600 dark:bg-slate-900 dark:hover:bg-rose-950/40 dark:text-slate-300 dark:hover:text-rose-300 border border-slate-200 dark:border-slate-800 font-display font-bold text-xs shadow-2xs flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <LogOut className="w-4 h-4 text-rose-500" />
                <span>Sign Out of Pass</span>
              </button>
            </div>
          </div>
        )}
      </main>

      {/* ========================================================================= */}
      {/* 5. FLOATING BOTTOM 4-ITEM NAVIGATION BAR: [HOME] [REWARDS] [SCAN QR] [PROFILE & SETTINGS] */}
      {/* ========================================================================= */}
      <nav
        className={`fixed bottom-0 left-0 right-0 z-50 border-t backdrop-blur-lg transition-colors ${
          isDarkMode
            ? 'bg-[#0B0F19]/95 border-slate-800 text-slate-400'
            : 'bg-white/95 border-slate-200/90 text-slate-500 shadow-[0_-4px_20px_rgba(0,0,0,0.06)]'
        }`}
      >
        <div className="max-w-md mx-auto px-4 h-16 flex items-center justify-between relative">
          {/* 1. HOME TAB */}
          <button
            onClick={() => switchTab('home')}
            className={`flex-1 flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
              activeTab === 'home'
                ? isDarkMode
                  ? 'text-white'
                  : 'text-[#0F172A]'
                : 'hover:text-slate-700'
            }`}
          >
            <Home className={`w-5 h-5 ${activeTab === 'home' ? 'stroke-[2.5]' : ''}`} />
            <span
              className={`text-[10px] font-display ${
                activeTab === 'home' ? 'font-bold' : 'font-medium'
              }`}
            >
              Home
            </span>
          </button>

          {/* 2. REWARDS TAB (In place of Explore) */}
          <button
            onClick={() => switchTab('rewards')}
            className={`flex-1 flex flex-col items-center justify-center gap-1 transition-all cursor-pointer relative ${
              activeTab === 'rewards'
                ? isDarkMode
                  ? 'text-white'
                  : 'text-[#0F172A]'
                : 'hover:text-slate-700'
            }`}
          >
            <div className="relative">
              <Gift className={`w-5 h-5 ${activeTab === 'rewards' ? 'stroke-[2.5]' : ''}`} />
              {unlockedRewards.length > 0 && (
                <span className="w-2 h-2 rounded-full bg-emerald-500 absolute -top-0.5 -right-0.5 animate-pulse" />
              )}
            </div>
            <span
              className={`text-[10px] font-display ${
                activeTab === 'rewards' ? 'font-bold' : 'font-medium'
              }`}
            >
              Rewards
            </span>
          </button>

          {/* 3. CENTER FLOATING CAMERA / SCAN QR BUTTON */}
          <div className="flex-1 flex justify-center -mt-6">
            <button
              onClick={() => {
                sound.playClick();
                setShowScannerModal(true);
              }}
              className="w-13 h-13 rounded-full bg-gradient-to-tr from-[#0F172A] to-[#334155] text-white flex items-center justify-center shadow-[0_8px_25px_rgba(15,23,42,0.4)] border-4 border-white dark:border-[#0B0F19] hover:scale-105 active:scale-95 transition-all cursor-pointer group"
              title="Scan QR Code / Camera"
            >
              <QrCode className="w-6 h-6 group-hover:rotate-12 transition-transform" />
            </button>
          </div>

          {/* 4. PROFILE & SETTINGS TAB */}
          <button
            onClick={() => switchTab('profile')}
            className={`flex-1 flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
              activeTab === 'profile'
                ? isDarkMode
                  ? 'text-white'
                  : 'text-[#0F172A]'
                : 'hover:text-slate-700'
            }`}
          >
            <User className={`w-5 h-5 ${activeTab === 'profile' ? 'stroke-[2.5]' : ''}`} />
            <span
              className={`text-[10px] font-display ${
                activeTab === 'profile' ? 'font-bold' : 'font-medium'
              }`}
            >
              Profile
            </span>
          </button>
        </div>
      </nav>

      {/* ========================================================================= */}
      {/* 6. LIVE CAMERA QR SCANNER & AUTO-RECOGNITION MODAL */}
      {/* ========================================================================= */}
      <CameraQrScannerModal
        isOpen={showScannerModal}
        onClose={() => setShowScannerModal(false)}
        currentSlug={selectedPassSlug}
        customerPhone={customerPhone}
        customerName={customerName}
        onStampClaimed={(res) => {
          if (res.success) {
            sound.playRewardFanfare();
            confetti({ particleCount: 70, spread: 60, origin: { y: 0.6 } });
            setUploadToast(`✓ Stamp claimed at ${res.business?.name || 'store'}!`);
            setTimeout(() => setUploadToast(null), 3500);

            // Reactive immediate in-place update of userPasses
            if (res.business?.slug) {
              setUserPasses((prev) => {
                const found = prev.some((p) => p.slug === res.business?.slug);
                if (found) {
                  return prev.map((p) =>
                    p.slug === res.business?.slug
                      ? { ...p, stamps: res.membership?.stamps ?? (p.stamps + 1), lastVisit: 'Just now' }
                      : p
                  );
                }
                return prev;
              });
              setSelectedPassSlug(res.business.slug);
            }

            // Silent background sync
            const effEmail = customerEmail || localStorage.getItem('reva_customer_email') || '';
            const effPhone = customerPhone || localStorage.getItem('reva_customer_phone') || '';
            const p = new URLSearchParams();
            if (effPhone) p.set('phone', effPhone);
            if (effEmail) p.set('email', effEmail);
            if (p.toString()) {
              fetch(`/api/customer/session?${p.toString()}`)
                .then((r) => r.json())
                .then((data) => {
                  if (data.passes && Array.isArray(data.passes)) {
                    setUserPasses(data.passes);
                    localStorage.setItem('reva_customer_passes', JSON.stringify(data.passes));
                  }
                })
                .catch(() => {});
            }
          } else if (res.cooldownActive) {
            setUploadToast(res.message || 'You can claim 1 stamp per 24 hours via self-serve QR.');
            setTimeout(() => setUploadToast(null), 4000);
          } else if (res.guestRedirect && res.business?.slug) {
            // Find store in businesses list and prompt to join pass
            const targetBiz = businesses.find((b) => b.slug === res.business?.slug);
            if (targetBiz) {
              setJoiningBusiness(targetBiz);
              setJoinNameInput(customerName !== 'Valued Guest' ? customerName : '');
              setJoinPhoneInput(customerPhone || '');
            } else {
              router.push(`/c/${res.business.slug}?scan=1`);
            }
          }
        }}
      />

      {/* ========================================================================= */}
      {/* 6.1 PRIVACY & SECURITY MODAL */}
      {/* ========================================================================= */}
      <PrivacySecurityModal
        isOpen={showPrivacyModal}
        onClose={() => setShowPrivacyModal(false)}
        customerPhone={customerPhone}
      />

      {/* ========================================================================= */}
      {/* 7. REWARD CLAIM CONFIRMATION MODAL */}
      {/* ========================================================================= */}
      {redeemingReward && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-3xl max-w-sm w-full p-6 space-y-4 border border-slate-200 dark:border-slate-800 shadow-2xl relative text-center">
            <button
              onClick={() => setRedeemingReward(null)}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-600"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="w-16 h-16 rounded-3xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto shadow-sm">
              <Gift className="w-8 h-8" />
            </div>

            <div className="space-y-1">
              <div className="text-[10px] font-mono uppercase font-bold text-emerald-600 dark:text-emerald-400">
                MERCHANT VERIFICATION
              </div>
              <h3 className="font-display font-bold text-lg">{redeemingReward.rewardTitle}</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Show this code to the cashier at {redeemingReward.businessName}
              </p>
            </div>

            {/* Big Voucher Code */}
            <div className="p-4 rounded-2xl bg-slate-100 dark:bg-slate-800 border-2 border-dashed border-slate-300 dark:border-slate-700 space-y-1">
              <div className="text-[10px] font-mono text-slate-400 uppercase">Redemption Code</div>
              <div className="font-mono font-black text-2xl tracking-widest text-[#0F172A] dark:text-white">
                {redeemingReward.code}
              </div>
            </div>

            <button
              onClick={handleConfirmRedeemed}
              className="w-full py-3 rounded-2xl bg-[#0F172A] hover:bg-black dark:bg-white dark:hover:bg-slate-100 text-white dark:text-black font-display font-bold text-xs shadow-md transition-all cursor-pointer"
            >
              Merchant Verified & Redeemed
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 8. EDIT PROFILE MODAL */}
      {/* ========================================================================= */}
      {showEditProfileModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
          <form
            onSubmit={handleSaveProfile}
            className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-3xl max-w-sm w-full p-6 space-y-4 border border-slate-200 dark:border-slate-800 shadow-2xl relative"
          >
            <button
              type="button"
              onClick={() => setShowEditProfileModal(false)}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-1">
              <h3 className="font-display font-bold text-lg">Edit Profile</h3>
              <p className="text-xs text-slate-500">Update your photo, name, and email on your Reva Pass</p>
            </div>

            {/* Photo Upload Section */}
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 flex items-center gap-3.5">
              <div className="w-14 h-14 rounded-full overflow-hidden bg-[#0F172A] text-white font-display font-bold text-xl flex items-center justify-center shrink-0 border-2 border-slate-200 dark:border-slate-700 shadow-xs">
                {editAvatarPreview ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={editAvatarPreview} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <span>{(editNameInput.trim() || customerName).charAt(0)}</span>
                )}
              </div>
              <div className="space-y-1.5 flex-1 min-w-0">
                <div className="text-xs font-display font-bold text-slate-900 dark:text-white">Profile Photo</div>
                <div className="flex items-center gap-2">
                  <label
                    htmlFor="modal-avatar-input"
                    className="px-3 py-1.5 rounded-xl bg-[#0F172A] dark:bg-white text-white dark:text-[#0F172A] text-[11px] font-display font-bold cursor-pointer hover:opacity-90 transition-opacity inline-flex items-center gap-1.5"
                  >
                    <Camera className="w-3.5 h-3.5" />
                    <span>{editAvatarPreview ? 'Change' : 'Upload'}</span>
                  </label>
                  <input
                    id="modal-avatar-input"
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarFileChange}
                    className="hidden"
                  />
                  {editAvatarPreview && (
                    <button
                      type="button"
                      onClick={handleRemoveAvatar}
                      className="p-1.5 rounded-xl text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                      title="Remove Photo"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-[11px] font-mono uppercase font-bold text-slate-400 block mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  value={editNameInput}
                  onChange={(e) => setEditNameInput(e.target.value)}
                  placeholder="Your Name"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs outline-hidden focus:border-slate-900 dark:focus:border-white font-medium"
                />
              </div>

              <div>
                <label className="text-[11px] font-mono uppercase font-bold text-slate-400 block mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  value={editEmailInput}
                  onChange={(e) => setEditEmailInput(e.target.value)}
                  placeholder="your.email@example.com"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs outline-hidden focus:border-slate-900 dark:focus:border-white font-medium"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-2xl bg-[#0F172A] hover:bg-black dark:bg-white dark:hover:bg-slate-100 text-white dark:text-black font-display font-bold text-xs shadow-md transition-all cursor-pointer"
            >
              Save Changes
            </button>
          </form>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 9. START / JOIN LOYALTY PASS MODAL (Name & Phone sent to Restaurant Owner) */}
      {/* ========================================================================= */}
      {joiningBusiness && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
          <form
            onSubmit={handleConfirmJoinPass}
            className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-3xl max-w-sm w-full p-6 space-y-4 border border-slate-200 dark:border-slate-800 shadow-2xl relative"
          >
            <button
              type="button"
              onClick={() => setJoiningBusiness(null)}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Store Brand Header */}
            <div className="flex items-center gap-3 pt-1">
              <div className="w-13 h-13 rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-800 shrink-0 border border-slate-200 dark:border-slate-700 shadow-2xs">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={getBusinessLogo(joiningBusiness.name, joiningBusiness.category, joiningBusiness.logo_url)}
                  alt={joiningBusiness.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="min-w-0">
                <div className="text-[10px] font-mono uppercase font-bold text-amber-500">
                  {joiningBusiness.category}
                </div>
                <h3 className="font-display font-bold text-base text-slate-900 dark:text-white leading-tight truncate">
                  {joiningBusiness.name}
                </h3>
                <div className="text-xs text-emerald-600 dark:text-emerald-400 font-medium truncate pt-0.5">
                  Win: {joiningBusiness.reward_rule?.reward_title || 'Specialty Loyalty Reward'}
                </div>
              </div>
            </div>

            {/* Explanatory Banner */}
            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 text-xs text-slate-600 dark:text-slate-300 space-y-1">
              <div className="font-semibold text-slate-900 dark:text-white flex items-center gap-1.5 text-[11px]">
                <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Zero-App Loyalty Pass Registration</span>
              </div>
              <p className="text-[11px] leading-relaxed">
                Provide your name and phone number to start collecting stamps. Your details are registered with <b>{joiningBusiness.name}</b> so the cashier can punch stamps to your phone at checkout.
              </p>
            </div>

            {joinError && (
              <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-semibold">
                {joinError}
              </div>
            )}

            <div className="space-y-3 pt-1">
              <div>
                <label className="text-[11px] font-mono uppercase font-bold text-slate-500 dark:text-slate-400 block mb-1">
                  Full Name
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={joinNameInput}
                    onChange={(e) => setJoinNameInput(e.target.value)}
                    placeholder="Your Full Name (e.g. Rahul Sharma)"
                    required
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs outline-hidden focus:border-slate-900 dark:focus:border-white font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-mono uppercase font-bold text-slate-500 dark:text-slate-400 block mb-1">
                  Mobile Number (For Loyalty Stamps)
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="tel"
                    value={joinPhoneInput}
                    onChange={(e) => setJoinPhoneInput(e.target.value)}
                    placeholder="Enter 10-digit mobile number"
                    required
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs outline-hidden focus:border-slate-900 dark:focus:border-white font-mono font-medium"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={isJoiningSubmitting}
              className="w-full py-3.5 rounded-2xl bg-[#0F172A] hover:bg-black dark:bg-white dark:hover:bg-slate-100 text-white dark:text-black font-display font-bold text-xs shadow-md transition-all cursor-pointer flex items-center justify-center gap-2 mt-2 disabled:opacity-70"
            >
              {isJoiningSubmitting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Registering with {joiningBusiness.name}...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-amber-300 dark:text-amber-500" />
                  <span>Activate Pass &amp; Start Collecting</span>
                </>
              )}
            </button>
          </form>
        </div>
      )}
      {/* ========================================================================= */}
      {/* 9. LOCATION SELECTOR & CITY PICKER MODAL */}
      {/* ========================================================================= */}
      {showLocationModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-3xl max-w-sm w-full p-6 space-y-4 border border-slate-200 dark:border-slate-800 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button
              type="button"
              onClick={() => setShowLocationModal(false)}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-1">
              <div className="text-[10px] font-mono uppercase font-bold text-rose-500 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5" />
                <span>SELECT YOUR LOCATION</span>
              </div>
              <h3 className="font-display font-bold text-lg">Where are you exploring?</h3>
              <p className="text-xs text-slate-500">
                Choose your city or area to view the closest cafes and stamp rewards
              </p>
            </div>

            {/* GPS Auto-Detect Button */}
            <button
              type="button"
              onClick={() => {
                setShowLocationModal(false);
                handleGetLocation();
              }}
              className="w-full py-2.5 px-3.5 rounded-2xl bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:hover:bg-emerald-900/60 border border-emerald-300 dark:border-emerald-700 text-emerald-950 dark:text-emerald-200 text-xs font-semibold flex items-center justify-between transition-all cursor-pointer shadow-2xs"
            >
              <div className="flex items-center gap-2">
                <Navigation className="w-4 h-4 text-emerald-600 animate-pulse" />
                <span>Use Device GPS Location</span>
              </div>
              <span className="text-[10px] font-mono font-bold text-emerald-700 dark:text-emerald-400 uppercase">
                Detect →
              </span>
            </button>

            {/* Custom Location Search Form */}
            <form onSubmit={handleSearchManualLocation} className="space-y-2">
              <label className="text-[11px] font-mono uppercase font-bold text-slate-400 block">
                Or Type Any City / Area:
              </label>
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={manualLocationSearch}
                  onChange={(e) => setManualLocationSearch(e.target.value)}
                  placeholder="e.g. Bandra, Mumbai or Indiranagar"
                  className="w-full pl-10 pr-20 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs outline-hidden focus:border-slate-900 dark:focus:border-white font-medium"
                />
                <button
                  type="submit"
                  disabled={isSearchingLocation || !manualLocationSearch.trim()}
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 px-2.5 py-1 rounded-lg bg-[#0F172A] dark:bg-white text-white dark:text-black font-display font-bold text-[10px] disabled:opacity-40 cursor-pointer"
                >
                  {isSearchingLocation ? '...' : 'Set'}
                </button>
              </div>
            </form>

            {/* Popular Cities & Neighborhoods Grid */}
            <div className="space-y-2 pt-1">
              <div className="text-[11px] font-mono uppercase font-bold text-slate-400">
                Popular Cities:
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleSelectLocation('Vasai, Mumbai MMR', 19.3837, 72.8282)}
                  className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-slate-400 bg-slate-50 dark:bg-slate-800/60 text-left transition-all cursor-pointer hover:scale-[1.02]"
                >
                  <div className="font-display font-bold text-xs text-slate-900 dark:text-white">📍 Vasai / Virar</div>
                  <div className="text-[10px] text-slate-500 truncate">Mumbai MMR Region</div>
                </button>

                <button
                  type="button"
                  onClick={() => handleSelectLocation('Gokhiware, Vasai East', 19.3919, 72.8397)}
                  className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-slate-400 bg-slate-50 dark:bg-slate-800/60 text-left transition-all cursor-pointer hover:scale-[1.02]"
                >
                  <div className="font-display font-bold text-xs text-slate-900 dark:text-white">📍 Gokhiware</div>
                  <div className="text-[10px] text-slate-500 truncate">Vasai East, MMR</div>
                </button>

                <button
                  type="button"
                  onClick={() => handleSelectLocation('Mumbai (Andheri / BKC)', 19.1136, 72.8697)}
                  className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-slate-400 bg-slate-50 dark:bg-slate-800/60 text-left transition-all cursor-pointer hover:scale-[1.02]"
                >
                  <div className="font-display font-bold text-xs text-slate-900 dark:text-white">📍 Mumbai (Andheri)</div>
                  <div className="text-[10px] text-slate-500 truncate">Andheri &amp; BKC</div>
                </button>

                <button
                  type="button"
                  onClick={() => handleSelectLocation('Mumbai (Bandra)', 19.0596, 72.8295)}
                  className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-slate-400 bg-slate-50 dark:bg-slate-800/60 text-left transition-all cursor-pointer hover:scale-[1.02]"
                >
                  <div className="font-display font-bold text-xs text-slate-900 dark:text-white">📍 Mumbai (Bandra)</div>
                  <div className="text-[10px] text-slate-500 truncate">Bandra &amp; South Mumbai</div>
                </button>

                <button
                  type="button"
                  onClick={() => handleSelectLocation('Bengaluru (Indiranagar)', 12.9784, 77.6408)}
                  className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-slate-400 bg-slate-50 dark:bg-slate-800/60 text-left transition-all cursor-pointer hover:scale-[1.02]"
                >
                  <div className="font-display font-bold text-xs text-slate-900 dark:text-white">📍 Bengaluru</div>
                  <div className="text-[10px] text-slate-500 truncate">Indiranagar &amp; East</div>
                </button>

                <button
                  type="button"
                  onClick={() => handleSelectLocation('Bengaluru (Koramangala)', 12.9352, 77.6245)}
                  className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-slate-400 bg-slate-50 dark:bg-slate-800/60 text-left transition-all cursor-pointer hover:scale-[1.02]"
                >
                  <div className="font-display font-bold text-xs text-slate-900 dark:text-white">📍 Bengaluru</div>
                  <div className="text-[10px] text-slate-500 truncate">Koramangala &amp; HSR</div>
                </button>

                <button
                  type="button"
                  onClick={() => handleSelectLocation('Pune (Koregaon Park)', 18.5362, 73.8940)}
                  className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-slate-400 bg-slate-50 dark:bg-slate-800/60 text-left transition-all cursor-pointer hover:scale-[1.02]"
                >
                  <div className="font-display font-bold text-xs text-slate-900 dark:text-white">📍 Pune</div>
                  <div className="text-[10px] text-slate-500 truncate">Koregaon Park / KP</div>
                </button>

                <button
                  type="button"
                  onClick={() => handleSelectLocation('Delhi NCR (Connaught Place)', 28.6315, 77.2167)}
                  className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-slate-400 bg-slate-50 dark:bg-slate-800/60 text-left transition-all cursor-pointer hover:scale-[1.02]"
                >
                  <div className="font-display font-bold text-xs text-slate-900 dark:text-white">📍 Delhi NCR</div>
                  <div className="text-[10px] text-slate-500 truncate">Connaught Place &amp; CP</div>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function CustomerPortalHubPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0B0F19] flex items-center justify-center">
          <div className="w-8 h-8 rounded-full border-2 border-slate-900 border-t-transparent animate-spin" />
        </div>
      }
    >
      <CustomerPortalContent />
    </Suspense>
  );
}

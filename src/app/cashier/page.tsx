'use client';

// ============================================================================
// REVA (reva.in) — Cashier POS & Counter Verification Terminal (/cashier)
// Fast, ergonomic cashier interface to lookup guests, verify bill amounts,
// award digital stamps, and safely redeem milestone rewards.
// ============================================================================

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import confetti from 'canvas-confetti';
import {
  Store,
  Search,
  CheckCircle2,
  AlertCircle,
  PlusCircle,
  Gift,
  Phone,
  User,
  Clock,
  Sparkles,
  ArrowRight,
  RefreshCw,
  Award,
  ChevronRight,
  ShieldCheck,
  Tag,
  Flame,
  LayoutDashboard,
  Receipt,
  RotateCcw,
  Check,
} from 'lucide-react';
import { Business, Customer, Membership, Visit } from '@/types/database';
import { sound } from '@/lib/sound';

interface GuestMembership extends Membership {
  customer?: Customer;
}

export default function CashierTerminalPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center font-mono text-xs text-slate-400">Loading Cashier POS...</div>}>
      <CashierTerminalContent />
    </Suspense>
  );
}

function CashierTerminalContent() {
  const searchParams = useSearchParams();
  const urlSlug = searchParams.get('slug') || '';
  const [selectedSlug, setSelectedSlug] = useState(urlSlug || 'boba-brew');
  const [allStores, setAllStores] = useState<Array<{ id: string; name: string; slug: string }>>([]);
  const [business, setBusiness] = useState<Business | null>(null);
  const [recentGuests, setRecentGuests] = useState<GuestMembership[]>([]);
  const [todayVisits, setTodayVisits] = useState<Array<Visit & { customer?: Customer }>>([]);
  const [loading, setLoading] = useState(true);

  // Search & Selection State
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<GuestMembership[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedMember, setSelectedMember] = useState<GuestMembership | null>(null);

  // Bill & Stamp Verification State
  const [billAmount, setBillAmount] = useState<string>('250');
  const [customPhone, setCustomPhone] = useState<string>('');
  const [customName, setCustomName] = useState<string>('');
  const [isNewGuestMode, setIsNewGuestMode] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    if (urlSlug) {
      setSelectedSlug(urlSlug);
    }
  }, [urlSlug]);

  // Load Business & Recent Guests
  const loadTerminalData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/cashier?slug=${selectedSlug}`, { cache: 'no-store' });
      const data = await res.json();
      if (data.success) {
        setBusiness(data.business);
        if (data.allBusinesses) {
          setAllStores(data.allBusinesses);
        }
        setRecentGuests(data.recentGuests || []);
        setTodayVisits(data.todayVisits || []);
        if (data.recentGuests?.length > 0 && !selectedMember) {
          setSelectedMember(data.recentGuests[0]);
        }
      }
    } catch (err) {
      console.error('Failed to load cashier data', err);
    } finally {
      setLoading(false);
    }
  }, [selectedSlug, selectedMember]);

  useEffect(() => {
    loadTerminalData();
  }, [loadTerminalData]);

  // Live Search Customer Lookup
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        setIsSearching(true);
        const res = await fetch(`/api/cashier?slug=${selectedSlug}&q=${encodeURIComponent(searchQuery)}`);
        const data = await res.json();
        if (data.success) {
          setSearchResults(data.searchResults || []);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsSearching(false);
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [searchQuery, selectedSlug]);

  const minBill = business?.reward_rule?.min_order_for_stamp || business?.min_order_for_stamp || 150;
  const parsedBill = parseFloat(billAmount) || 0;
  const isBillValid = parsedBill >= minBill;

  // Handle Awarding Verified Stamp
  async function handleAwardStamp() {
    if (!business) return;
    if (!isBillValid) {
      setNotification({
        type: 'error',
        message: `Bill amount (₹${parsedBill}) is below the required minimum of ₹${minBill}.`,
      });
      return;
    }

    try {
      setIsSubmitting(true);
      sound.playStampPop();

      const payload: Record<string, unknown> = {
        businessId: business.id,
        spendAmount: parsedBill,
        action: 'stamp',
        staffNote: `Cashier verified ₹${parsedBill} order`,
      };

      if (isNewGuestMode) {
        if (!customPhone || customPhone.length < 8) {
          alert('Please enter a valid mobile number for the guest');
          setIsSubmitting(false);
          return;
        }
        payload.phone = customPhone;
        payload.name = customName || 'Valued Guest';
      } else if (selectedMember) {
        payload.membershipId = selectedMember.id;
      }

      const res = await fetch('/api/cashier', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success) {
        sound.playStampPop();
        setSelectedMember(data.membership);
        setNotification({
          type: 'success',
          message: data.message || `+1 Stamp awarded to ${data.membership?.customer?.name || 'guest'}!`,
        });

        if (data.rewardUnlocked) {
          sound.playRewardFanfare();
          confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
        }

        // Reset new guest inputs if we were in new guest mode
        if (isNewGuestMode) {
          setIsNewGuestMode(false);
          setCustomPhone('');
          setCustomName('');
        }

        // Refresh feed
        loadTerminalData();
      } else {
        setNotification({
          type: 'error',
          message: data.error || 'Failed to award stamp',
        });
      }
    } catch {
      setNotification({ type: 'error', message: 'Connection error' });
    } finally {
      setIsSubmitting(false);
      setTimeout(() => setNotification(null), 5000);
    }
  }

  // Handle Redeeming Unlocked Reward
  async function handleRedeemReward() {
    if (!business || !selectedMember) return;
    try {
      setIsSubmitting(true);
      sound.playRewardFanfare();

      const res = await fetch('/api/cashier', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessId: business.id,
          membershipId: selectedMember.id,
          action: 'redeem',
        }),
      });

      const data = await res.json();
      if (data.success) {
        confetti({ particleCount: 120, spread: 80, origin: { y: 0.5 } });
        setSelectedMember(data.membership);
        setNotification({
          type: 'success',
          message: `🎉 Reward claimed: ${business.reward_rule.reward_title}! Stamps reset for next reward.`,
        });
        loadTerminalData();
      }
    } catch {
      setNotification({ type: 'error', message: 'Failed to redeem reward' });
    } finally {
      setIsSubmitting(false);
      setTimeout(() => setNotification(null), 5000);
    }
  }

  const currentStamps = selectedMember?.stamps || 0;
  const stampsNeeded = business?.reward_rule?.stamps_needed || 6;
  const isRewardReady = currentStamps >= stampsNeeded;

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] font-sans antialiased selection:bg-[#0F172A] selection:text-white pb-16">
      {/* ========================================================================= */}
      {/* 1. CASHIER TERMINAL HEADER */}
      {/* ========================================================================= */}
      <header className="w-full bg-[#0F172A] text-white py-3.5 px-4 sm:px-8 sticky top-0 z-40 shadow-md">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="flex items-center gap-2 text-white">
              <div className="w-7 h-7 flex items-center justify-center text-amber-400">
                <svg viewBox="0 0 24 24" className="w-6 h-6 fill-none stroke-current stroke-[2.5]">
                  <path d="M12 2v20M2 12h20M4.93 4.93l14.14 14.14M4.93 19.07L19.07 4.93" />
                </svg>
              </div>
              <span className="font-display text-lg font-black tracking-tight">Siplo</span>
            </Link>
            <div className="h-5 w-[1px] bg-slate-700" />
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold uppercase tracking-widest text-slate-300 bg-white/10 px-2.5 py-1 rounded-full border border-white/10">
                Cashier POS Terminal
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Store Switcher */}
            <select
              value={selectedSlug}
              onChange={(e) => {
                setSelectedSlug(e.target.value);
                setSelectedMember(null);
              }}
              className="bg-slate-800 text-white text-xs font-medium px-3 py-1.5 rounded-lg border border-slate-700 focus:outline-none focus:ring-1 focus:ring-amber-400 cursor-pointer"
            >
              {allStores.length > 0 ? (
                allStores.map((s) => (
                  <option key={s.id} value={s.slug}>
                    {s.name}
                  </option>
                ))
              ) : (
                <>
                  <option value="boba-brew">Boba & Brew Artisan Cafe</option>
                  <option value="crust-crumb">Crust & Crumb Sourdough</option>
                </>
              )}
            </select>

            <Link
              href="/dashboard"
              className="px-3.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-medium text-slate-200 transition-colors flex items-center gap-1.5"
            >
              <LayoutDashboard className="w-3.5 h-3.5 text-slate-400" />
              <span>Owner Dashboard</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Store Rule Bar */}
      {business && (
        <div className="bg-amber-50 border-b border-amber-200/60 py-2 px-4 text-center text-xs font-medium text-amber-950 flex items-center justify-center gap-2">
          <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0" />
          <span>
            <b>Verification Rule for {business.name}:</b> Min Bill Amount = <b>₹{minBill}</b> for 1 Stamp •{' '}
            <b>{business.reward_rule.stamps_needed} Stamps</b> = Free {business.reward_rule.reward_title}
          </span>
        </div>
      )}

      {/* Main Grid Layout */}
      <main className="max-w-7xl mx-auto px-4 sm:px-8 py-6">
        {/* Notification Toast */}
        {notification && (
          <div
            className={`mb-5 p-4 rounded-2xl border flex items-center gap-3 animate-stamp ${
              notification.type === 'success'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                : 'bg-red-50 border-red-200 text-red-900'
            }`}
          >
            {notification.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
            )}
            <span className="text-xs font-semibold">{notification.message}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* ===================================================================== */}
          {/* LEFT COLUMN: GUEST SEARCH & RECENT GUESTS (5 COLS) */}
          {/* ===================================================================== */}
          <div className="lg:col-span-5 space-y-5">
            {/* Search Input Box */}
            <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-mono font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                  <Search className="w-3.5 h-3.5 text-slate-400" />
                  <span>Look Up Guest</span>
                </label>
                <button
                  onClick={() => {
                    setIsNewGuestMode(!isNewGuestMode);
                    if (!isNewGuestMode) setSelectedMember(null);
                  }}
                  className={`text-[11px] font-semibold px-2.5 py-1 rounded-full cursor-pointer transition-colors ${
                    isNewGuestMode
                      ? 'bg-[#0F172A] text-white'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {isNewGuestMode ? '✕ Cancel New Guest' : '+ Fast New Guest'}
                </button>
              </div>

              {!isNewGuestMode ? (
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by Mobile No. or Name..."
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-sm font-medium text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#0F172A] focus:bg-white transition-all font-mono"
                  />
                  {isSearching && (
                    <RefreshCw className="w-4 h-4 text-slate-400 animate-spin absolute right-3.5 top-3.5" />
                  )}
                </div>
              ) : (
                <div className="space-y-2.5 pt-1">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                      Guest Mobile Number
                    </label>
                    <input
                      type="tel"
                      value={customPhone}
                      onChange={(e) => setCustomPhone(e.target.value)}
                      placeholder="+91 98765 43210"
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-mono font-medium text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#0F172A] focus:bg-white"
                      autoFocus
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                      Guest Name (Optional)
                    </label>
                    <input
                      type="text"
                      value={customName}
                      onChange={(e) => setCustomName(e.target.value)}
                      placeholder="e.g. Aditi Roy"
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-medium text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#0F172A] focus:bg-white"
                    />
                  </div>
                </div>
              )}

              {/* Search Results Dropdown */}
              {searchResults.length > 0 && (
                <div className="bg-slate-50 rounded-2xl border border-slate-200 p-2 space-y-1 max-h-56 overflow-y-auto">
                  <div className="text-[10px] font-mono uppercase text-slate-400 font-bold px-2 py-1">
                    Matching Registered Guests ({searchResults.length})
                  </div>
                  {searchResults.map((mem) => (
                    <button
                      key={mem.id}
                      onClick={() => {
                        setSelectedMember(mem);
                        setIsNewGuestMode(false);
                        setSearchQuery('');
                        setSearchResults([]);
                        sound.playClick();
                      }}
                      className="w-full text-left p-2.5 rounded-xl hover:bg-white border border-transparent hover:border-slate-200 transition-all flex items-center justify-between group cursor-pointer"
                    >
                      <div>
                        <div className="font-display font-bold text-xs text-[#0F172A]">
                          {mem.customer?.name || 'Valued Guest'}
                        </div>
                        <div className="text-[11px] font-mono text-slate-500">{mem.customer?.phone}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-mono font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                          {mem.stamps}/{stampsNeeded} Stamps
                        </span>
                        <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* 1-Tap Recent Guests / Active Counter Visitors */}
            <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-500">
                  Recent Registered Guests ({recentGuests.length})
                </span>
                <span className="text-[11px] text-slate-400">1-Tap Select</span>
              </div>

              <div className="space-y-1.5 max-h-[360px] overflow-y-auto pr-1">
                {recentGuests.map((mem) => {
                  const isSelected = selectedMember?.id === mem.id && !isNewGuestMode;
                  return (
                    <button
                      key={mem.id}
                      onClick={() => {
                        setSelectedMember(mem);
                        setIsNewGuestMode(false);
                        sound.playClick();
                      }}
                      className={`w-full text-left p-3 rounded-2xl border transition-all flex items-center justify-between cursor-pointer ${
                        isSelected
                          ? 'bg-[#0F172A] text-white border-[#0F172A] shadow-sm'
                          : 'bg-slate-50/60 hover:bg-slate-100 border-slate-100 text-[#0F172A]'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs ${
                            isSelected ? 'bg-white/20 text-white' : 'bg-white text-slate-700 shadow-2xs'
                          }`}
                        >
                          {(mem.customer?.name || 'G')[0]}
                        </div>
                        <div>
                          <div className="font-display font-bold text-xs leading-snug">
                            {mem.customer?.name || 'Valued Regular'}
                          </div>
                          <div
                            className={`text-[11px] font-mono ${
                              isSelected ? 'text-slate-300' : 'text-slate-500'
                            }`}
                          >
                            {mem.customer?.phone}
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        <div
                          className={`text-xs font-mono font-bold ${
                            isSelected ? 'text-amber-300' : 'text-emerald-700'
                          }`}
                        >
                          {mem.stamps} / {stampsNeeded}
                        </div>
                        <div
                          className={`text-[10px] ${
                            isSelected ? 'text-slate-300' : 'text-slate-400'
                          }`}
                        >
                          {mem.tier || 'Regular'}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* ===================================================================== */}
          {/* RIGHT COLUMN: VERIFICATION & STAMP PUNCH PANEL (7 COLS) */}
          {/* ===================================================================== */}
          <div className="lg:col-span-7 space-y-5">
            {/* Active Selected Guest Card */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-6">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-widest font-bold text-slate-400">
                    VERIFICATION PANEL
                  </span>
                  <h2 className="text-xl font-display font-bold text-[#0F172A] tracking-tight mt-0.5">
                    {isNewGuestMode
                      ? 'New Guest Registration'
                      : selectedMember?.customer?.name || 'Select a Guest'}
                  </h2>
                  <p className="text-xs text-slate-500 font-mono mt-0.5">
                    {isNewGuestMode
                      ? customPhone || 'Enter phone number on left'
                      : selectedMember?.customer?.phone || 'No guest selected'}
                  </p>
                </div>

                {!isNewGuestMode && selectedMember && (
                  <div className="px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-xs font-mono font-bold text-slate-700">
                    {selectedMember.tier || 'VIP Regular'}
                  </div>
                )}
              </div>

              {/* Stamp Grid Status Display */}
              {!isNewGuestMode && selectedMember && (
                <div className="bg-[#0F172A] text-white p-5 rounded-2xl shadow-inner space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-300 font-medium">Digital Stamp Status</span>
                    <span className="font-mono font-bold bg-white/10 px-2.5 py-0.5 rounded-full text-amber-300 border border-white/10">
                      {currentStamps} of {stampsNeeded} Stamps Collected
                    </span>
                  </div>

                  <div
                    className="grid gap-2"
                    style={{
                      gridTemplateColumns: `repeat(${stampsNeeded <= 6 ? stampsNeeded : 4}, minmax(0, 1fr))`,
                    }}
                  >
                    {Array.from({ length: stampsNeeded }).map((_, i) => {
                      const isStamped = i < currentStamps;
                      const isRewardSlot = i === stampsNeeded - 1;
                      return (
                        <div
                          key={i}
                          className={`aspect-square rounded-xl flex flex-col items-center justify-center transition-all ${
                            isStamped
                              ? 'bg-white text-[#0F172A] font-bold shadow-md scale-100'
                              : 'bg-white/10 border border-dashed border-white/30 text-slate-400'
                          }`}
                        >
                          {isStamped ? (
                            isRewardSlot ? (
                              <Gift className="w-5 h-5 text-amber-500 fill-amber-500" />
                            ) : (
                              <Check className="w-5 h-5 text-[#0F172A] stroke-[3]" />
                            )
                          ) : isRewardSlot ? (
                            <Gift className="w-4 h-4 text-white/50" />
                          ) : (
                            <span className="text-xs font-mono opacity-50">{i + 1}</span>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-300 pt-1 border-t border-white/10">
                    <span>Total Visits: {selectedMember.total_visits}</span>
                    <span>
                      Target Reward: <b>{business?.reward_rule.reward_title}</b>
                    </span>
                  </div>
                </div>
              )}

              {/* Bill Verification Section */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Receipt className="w-4 h-4 text-slate-500" />
                    <span>Order Bill Value (₹)</span>
                  </label>
                  <span className="text-[11px] font-mono text-slate-500">
                    Min Required: <b>₹{minBill}</b>
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
                  <div className="sm:col-span-3 relative">
                    <span className="absolute left-3.5 top-3 text-sm font-bold text-slate-400 font-mono">
                      ₹
                    </span>
                    <input
                      type="number"
                      value={billAmount}
                      onChange={(e) => setBillAmount(e.target.value)}
                      placeholder="e.g. 250"
                      className="w-full pl-8 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm font-bold text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#0F172A] focus:bg-white font-mono"
                    />
                  </div>

                  {/* Quick Value Chips */}
                  <div className="sm:col-span-2 flex gap-1.5">
                    {[150, 280, 500].map((val) => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => setBillAmount(val.toString())}
                        className={`flex-1 py-2 rounded-xl text-xs font-mono font-bold border transition-colors cursor-pointer ${
                          billAmount === val.toString()
                            ? 'bg-[#0F172A] text-white border-[#0F172A]'
                            : 'bg-white hover:bg-slate-100 border-slate-200 text-slate-700'
                        }`}
                      >
                        ₹{val}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Validation Banner */}
                <div
                  className={`p-3 rounded-xl border text-xs font-medium flex items-center gap-2 ${
                    isBillValid
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                      : 'bg-amber-50 border-amber-200 text-amber-900'
                  }`}
                >
                  {isBillValid ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>
                        Order value <b>₹{parsedBill}</b> meets minimum <b>₹{minBill}</b>. Eligible for 1 stamp!
                      </span>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                      <span>
                        Order bill <b>₹{parsedBill}</b> is below minimum <b>₹{minBill}</b> required to earn a stamp.
                      </span>
                    </>
                  )}
                </div>
              </div>

              {/* Cashier Action Buttons */}
              <div className="space-y-2 pt-2">
                {isRewardReady && !isNewGuestMode ? (
                  <button
                    onClick={handleRedeemReward}
                    disabled={isSubmitting}
                    className="w-full py-4 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-display font-bold text-sm shadow-lg flex items-center justify-center gap-2 cursor-pointer transition-transform active:scale-98 uppercase tracking-wider"
                  >
                    <Gift className="w-5 h-5 text-amber-200 animate-bounce" />
                    <span>Redeem Free {business?.reward_rule.reward_title}</span>
                  </button>
                ) : (
                  <button
                    onClick={handleAwardStamp}
                    disabled={isSubmitting || !isBillValid || (!selectedMember && !isNewGuestMode)}
                    className="w-full py-4 rounded-full bg-[#0F172A] hover:bg-black disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-display font-bold text-sm shadow-md flex items-center justify-center gap-2 cursor-pointer transition-transform active:scale-98 uppercase tracking-wider"
                  >
                    {isSubmitting ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin text-white" />
                        <span>Verifying & Recording Stamp...</span>
                      </>
                    ) : (
                      <>
                        <PlusCircle className="w-5 h-5 text-emerald-400" />
                        <span>Award +1 Verified Stamp (Bill: ₹{parsedBill})</span>
                      </>
                    )}
                  </button>
                )}

                <div className="text-center text-[11px] text-slate-400 font-mono">
                  Instant real-time sync with customer&apos;s phone pass • No paper pamphlet needed
                </div>
              </div>
            </div>

            {/* Today's Cashier Verified Stamp Feed */}
            <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-500">
                  Today&apos;s Verified Stamp Feed ({todayVisits.length})
                </span>
                <span className="text-[11px] text-slate-400">Live Counter Audit</span>
              </div>

              {todayVisits.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-400">
                  No stamps recorded yet today. Award your first stamp above!
                </div>
              ) : (
                <div className="divide-y divide-slate-100 max-h-60 overflow-y-auto">
                  {todayVisits.map((visit) => (
                    <div key={visit.id} className="py-2.5 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-3">
                        <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold text-[11px]">
                          +1
                        </div>
                        <div>
                          <div className="font-bold text-[#0F172A]">
                            {visit.customer?.name || 'Valued Guest'}
                          </div>
                          <div className="text-[10px] font-mono text-slate-400">
                            {visit.customer?.phone || 'Pass ID: ' + visit.id.slice(0, 8)} • Verified ₹
                            {visit.spend_amount}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] font-mono bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
                          {new Date(visit.scanned_at).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

'use client';

import React, { useState } from 'react';
import {
  Shield,
  ShieldCheck,
  Lock,
  EyeOff,
  Database,
  Smartphone,
  CheckCircle2,
  X,
  Trash2,
  Mail,
  ExternalLink,
  Sparkles,
  RefreshCw,
} from 'lucide-react';
import { sound } from '@/lib/sound';

interface PrivacySecurityModalProps {
  isOpen: boolean;
  onClose: () => void;
  customerPhone?: string;
}

export default function PrivacySecurityModal({
  isOpen,
  onClose,
  customerPhone,
}: PrivacySecurityModalProps) {
  const [clearingCache, setClearingCache] = useState(false);
  const [cacheCleared, setCacheCleared] = useState(false);

  if (!isOpen) return null;

  const handleClearLocalCache = () => {
    setClearingCache(true);
    sound.click();

    setTimeout(() => {
      // Clear non-critical customer local cache keys while preserving current session if needed
      try {
        localStorage.removeItem('reva_cached_passes');
        localStorage.removeItem('reva_geo_loc');
      } catch (e) {
        console.error(e);
      }

      setClearingCache(false);
      setCacheCleared(true);
      sound.success();

      setTimeout(() => {
        setCacheCleared(false);
      }, 3500);
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div
        className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-3xl max-w-md w-full max-h-[90vh] overflow-y-auto p-6 space-y-5 border border-slate-200 dark:border-slate-800 shadow-2xl relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={() => {
            sound.click();
            onClose();
          }}
          className="absolute right-4 top-4 p-2 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header with Shield Badge */}
        <div className="text-center pt-2 space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto border border-emerald-500/20 shadow-xs">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <div className="space-y-0.5">
            <h3 className="font-display font-black text-xl tracking-tight text-slate-900 dark:text-white">
              Privacy &amp; Security
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Zero-App Loyalty Architecture &amp; Data Safeguards
            </p>
          </div>
        </div>

        {/* Security Badges Grid */}
        <div className="grid grid-cols-2 gap-2 text-center">
          <div className="p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60">
            <div className="text-[10px] font-mono font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
              Verification
            </div>
            <div className="text-xs font-display font-bold text-slate-900 dark:text-white mt-0.5">
              256-Bit Encrypted
            </div>
          </div>
          <div className="p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60">
            <div className="text-[10px] font-mono font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
              Tracking
            </div>
            <div className="text-xs font-display font-bold text-slate-900 dark:text-white mt-0.5">
              100% Ad-Free
            </div>
          </div>
        </div>

        {/* Detailed Privacy Pillars */}
        <div className="space-y-3">
          {/* Item 1: Zero Tracking & No Third-Party Ads */}
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-700/50 flex items-start gap-3.5">
            <div className="w-9 h-9 rounded-xl bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 border border-blue-200 dark:border-blue-800">
              <EyeOff className="w-4 h-4" />
            </div>
            <div className="space-y-0.5">
              <div className="font-display font-bold text-xs text-slate-900 dark:text-white flex items-center gap-1.5">
                <span>Zero Tracking &amp; No Ads</span>
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                We never sell your data, track browsing activity, or inject ad networks. Your pass is private between you and the stores you visit.
              </p>
            </div>
          </div>

          {/* Item 2: Encrypted Stamp Records */}
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-700/50 flex items-start gap-3.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-200 dark:border-emerald-800">
              <Lock className="w-4 h-4" />
            </div>
            <div className="space-y-0.5">
              <div className="font-display font-bold text-xs text-slate-900 dark:text-white">
                Encrypted Stamp Records
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                All stamps, loyalty cycles, and generated vouchers are validated with cryptographic tokens to prevent tampering or fraud.
              </p>
            </div>
          </div>

          {/* Item 3: Phone Number Privacy */}
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-700/50 flex items-start gap-3.5">
            <div className="w-9 h-9 rounded-xl bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0 border border-purple-200 dark:border-purple-800">
              <Smartphone className="w-4 h-4" />
            </div>
            <div className="space-y-0.5">
              <div className="font-display font-bold text-xs text-slate-900 dark:text-white">
                Phone Number Protection
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                Your mobile number ({customerPhone || 'registered phone'}) is used strictly to look up loyalty passes at merchant counters. Zero spam messages.
              </p>
            </div>
          </div>

          {/* Item 4: Sandboxed Browser Storage */}
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-700/50 flex items-start gap-3.5">
            <div className="w-9 h-9 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 border border-amber-200 dark:border-amber-800">
              <Database className="w-4 h-4" />
            </div>
            <div className="space-y-0.5">
              <div className="font-display font-bold text-xs text-slate-900 dark:text-white">
                Device-Level Sandboxing
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                Wallet passes are stored locally on your device for fast offline access. No unnecessary background syncing.
              </p>
            </div>
          </div>
        </div>

        {/* Cache Management Action */}
        <div className="pt-1 space-y-2">
          {cacheCleared ? (
            <div className="w-full py-2.5 px-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 font-display font-bold text-xs flex items-center justify-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <span>Local Pass Cache Purged Successfully</span>
            </div>
          ) : (
            <button
              type="button"
              onClick={handleClearLocalCache}
              disabled={clearingCache}
              className="w-full py-2.5 px-3 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-display font-semibold text-xs border border-slate-200 dark:border-slate-700 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
            >
              {clearingCache ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Clearing Cached Data...</span>
                </>
              ) : (
                <>
                  <Trash2 className="w-3.5 h-3.5 text-slate-500" />
                  <span>Clear Cached Local Pass Data</span>
                </>
              )}
            </button>
          )}

          {/* Privacy Inquiry Link */}
          <a
            href="mailto:primezedexx@gmail.com?subject=Siplo%20Privacy%20Inquiry"
            className="w-full py-2.5 px-3 rounded-2xl bg-white hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 font-display font-medium text-[11px] border border-slate-200 dark:border-slate-800 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
          >
            <Mail className="w-3.5 h-3.5 text-blue-500" />
            <span>Contact Data Protection Officer (primezedexx@gmail.com)</span>
          </a>
        </div>

        {/* Done / Close Button */}
        <button
          type="button"
          onClick={() => {
            sound.click();
            onClose();
          }}
          className="w-full py-3 rounded-2xl bg-[#0F172A] hover:bg-black dark:bg-white dark:hover:bg-slate-100 text-white dark:text-black font-display font-bold text-xs shadow-md transition-all cursor-pointer"
        >
          Close Privacy &amp; Security
        </button>
      </div>
    </div>
  );
}

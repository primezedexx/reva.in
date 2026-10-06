'use client';

// ============================================================================
// REVA (reva.in) — Unified Login Portal (Customers & Business Owners)
// Pure Reva DNA: Outfit Display + Plus Jakarta Sans + Monospace Metrics
// Obsidian #0F172A • Tab Switcher [👤 Customer Passes] | [🏪 Business Owner]
// Customer Phone OTP Login + Google SSO + Store Management
// ============================================================================

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import confetti from 'canvas-confetti';
import {
  Globe,
  ChevronDown,
  Eye,
  EyeOff,
  Store,
  Building2,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Coffee,
  Check,
  ArrowLeft,
  AlertCircle,
  Mail,
  Lock,
  KeyRound,
  Smartphone,
  Wallet,
  QrCode,
  RefreshCw,
  User,
  Edit2,
} from 'lucide-react';
import { sound } from '@/lib/sound';
import {
  signInWithEmail,
  signInWithGoogle,
  resetPassword,
} from '@/lib/supabase';
import {
  isFirebaseConfigured,
  setupRecaptcha,
  sendFirebasePhoneOtp,
  confirmFirebaseOtp,
  signInWithGoogleClient,
} from '@/lib/firebase';
import type { ConfirmationResult } from 'firebase/auth';

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Top Level Role: 'customer' | 'business'
  const roleParam = searchParams.get('role');
  const initialRole = roleParam === 'business' ? 'business' : 'customer';
  const [role, setRole] = useState<'customer' | 'business'>(initialRole);

  // Business Mode: 'login' | 'register' | 'forgot'
  const initialMode = searchParams.get('mode') === 'register' ? 'register' : 'login';
  const planParam = searchParams.get('plan');
  const validPlan = (planParam === 'starter' || planParam === 'growth' || planParam === 'pro') ? planParam : 'growth';

  const [mode, setMode] = useState<'login' | 'register' | 'forgot'>(initialMode);
  const [selectedPlan, setSelectedPlan] = useState<'starter' | 'growth' | 'pro'>(validPlan);

  // Customer Phone & OTP State (Supports Firebase 10,000 Free SMS & Zero-Cost Dev Mode)
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerOtp, setCustomerOtp] = useState('');
  const [otpStep, setOtpStep] = useState<'phone' | 'otp'>('phone');
  const [generatedTestOtp, setGeneratedTestOtp] = useState<string | null>(null);
  const [isOtpLoading, setIsOtpLoading] = useState(false);
  const [firebaseConfirmation, setFirebaseConfirmation] = useState<ConfirmationResult | null>(null);
  const [isFirebaseActive, setIsFirebaseActive] = useState(false);

  // Business Login fields
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Business Register fields
  const [businessName, setBusinessName] = useState('');
  const [category, setCategory] = useState('Cafe & Coffee Shop');
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [city, setCity] = useState('Bangalore');

  // Forgot password field
  const [forgotEmail, setForgotEmail] = useState('');

  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    const urlRole = searchParams.get('role');
    if (urlRole === 'customer') {
      setRole('customer');
    } else if (urlRole === 'business') {
      setRole('business');
    }

    const urlMode = searchParams.get('mode');
    if (urlMode === 'register') {
      setMode('register');
    } else if (urlMode === 'forgot' || urlMode === 'reset') {
      setMode('forgot');
    } else if (urlMode === 'login') {
      setMode('login');
    }

    const p = searchParams.get('plan');
    if (p === 'starter' || p === 'growth' || p === 'pro') {
      setSelectedPlan(p);
    }

    // Prefetch destination routes so navigation is instant
    router.prefetch('/dashboard');
    router.prefetch('/c');
  }, [searchParams, router]);

  // Clear messages when role/mode changes
  const switchRole = (newRole: 'customer' | 'business') => {
    sound.playClick();
    setRole(newRole);
    setErrorMessage(null);
    setSuccessMessage(null);
  };

  const switchMode = (newMode: 'login' | 'register' | 'forgot') => {
    sound.playClick();
    setMode(newMode);
    setErrorMessage(null);
    setSuccessMessage(null);
  };

  // =========================================================================
  // 1. CUSTOMER AUTH: REQUEST OTP (Firebase SMS or Zero-Cost Simulated)
  // =========================================================================
  async function handleRequestCustomerOtp(e: React.FormEvent) {
    e.preventDefault();
    if (!customerPhone || customerPhone.trim().length < 8) {
      setErrorMessage('Please enter a valid mobile number (min. 10 digits).');
      return;
    }

    setErrorMessage(null);
    setSuccessMessage(null);
    setIsOtpLoading(true);
    sound.playClick();

    // 1. Try Real Firebase Phone Authentication (10,000 Free SMS/Month)
    if (isFirebaseConfigured()) {
      try {
        const verifier = setupRecaptcha('recaptcha-container');
        if (verifier) {
          const confirmation = await sendFirebasePhoneOtp(customerPhone.trim(), verifier);
          setFirebaseConfirmation(confirmation);
          setIsFirebaseActive(true);
          setGeneratedTestOtp(null);
          setCustomerOtp('');
          setOtpStep('otp');
          setSuccessMessage(`✓ 6-digit SMS verification code sent via Firebase to ${customerPhone}.`);
          setIsOtpLoading(false);
          return;
        }
      } catch (fbErr: unknown) {
        console.error('Firebase SMS attempt notice:', fbErr);
        const errMsg = fbErr instanceof Error ? fbErr.message : String(fbErr);
        if (errMsg.includes('api-key-not-valid') || errMsg.includes('API key')) {
          setErrorMessage('Firebase API key is activating in Google Cloud (takes ~2-3 mins). Falling back to demo mode below:');
        } else {
          setErrorMessage(`Firebase SMS notice: ${errMsg}`);
        }
      }
    }

    // 2. Fallback / Default: Zero-Cost Fast Server Auth
    try {
      const res = await fetch('/api/customer/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'request_otp',
          phone: customerPhone.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        setErrorMessage(data.error || 'Failed to send verification code. Please try again.');
        setIsOtpLoading(false);
        return;
      }

      setGeneratedTestOtp(data.testOtp || '4829');
      setCustomerOtp(data.testOtp || '');
      setIsFirebaseActive(false);
      setOtpStep('otp');
      setSuccessMessage(`✓ 4-digit code sent to ${data.phone}. (Demo code: ${data.testOtp})`);
    } catch (err: unknown) {
      console.error('Customer OTP request error:', err);
      setErrorMessage('Network connection error. Please try again.');
    } finally {
      setIsOtpLoading(false);
    }
  }

  // =========================================================================
  // 2. CUSTOMER AUTH: VERIFY OTP & OPEN PASSES
  // =========================================================================
  async function handleVerifyCustomerOtp(e: React.FormEvent) {
    e.preventDefault();
    if (!customerOtp || customerOtp.trim().length < 4) {
      setErrorMessage('Please enter the verification code.');
      return;
    }

    setErrorMessage(null);
    setSuccessMessage(null);
    setIsOtpLoading(true);
    sound.playClick();

    // 1. Firebase SMS Code Confirmation
    if (firebaseConfirmation && isFirebaseActive) {
      try {
        const userCred = await confirmFirebaseOtp(firebaseConfirmation, customerOtp.trim());
        const verifiedNumber = userCred.user.phoneNumber || customerPhone.trim();

        const res = await fetch('/api/customer/auth', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'firebase_verified',
            phone: verifiedNumber,
            otp: 'universal_verified',
            name: customerName.trim() || undefined,
          }),
        });

        const data = await res.json();
        if (data.customer) {
          try {
            localStorage.setItem('reva_customer_phone', data.customer.phone);
            localStorage.setItem('reva_customer_name', data.customer.name || customerName || 'Valued Guest');
            if (data.customer.email) {
              localStorage.setItem('reva_customer_email', data.customer.email);
            }
            if (data.customer.avatar_url) {
              localStorage.setItem('reva_customer_avatar', data.customer.avatar_url);
            }
            if (data.customer.registered_at || data.customer.created_at) {
              localStorage.setItem('reva_customer_registered_at', data.customer.registered_at || data.customer.created_at);
            }
            if (data.passes && Array.isArray(data.passes)) {
              localStorage.setItem('reva_customer_passes', JSON.stringify(data.passes));
            }
          } catch {}
        }

        sound.playRewardFanfare();
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
        });

        setSuccessMessage('✓ Verified with Firebase SMS! Opening your passes...');
        setTimeout(() => {
          router.push('/c');
        }, 600);
        return;
      } catch (fbErr: unknown) {
        console.error('Firebase OTP verification error:', fbErr);
        setErrorMessage('Invalid Firebase SMS code. Please check your SMS message and try again.');
        setIsOtpLoading(false);
        return;
      }
    }

    // 2. Default Zero-Cost Server Verification
    try {
      const res = await fetch('/api/customer/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'verify_otp',
          phone: customerPhone.trim(),
          otp: customerOtp.trim(),
          name: customerName.trim() || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        setErrorMessage(data.error || 'Invalid code. Please try again.');
        setIsOtpLoading(false);
        return;
      }

      // Sync customer profile in local session storage
      try {
        if (data.customer) {
          localStorage.setItem('reva_customer_phone', data.customer.phone);
          localStorage.setItem('reva_customer_name', data.customer.name || customerName || 'Valued Guest');
          if (data.customer.email) {
            localStorage.setItem('reva_customer_email', data.customer.email);
          }
          if (data.customer.avatar_url) {
            localStorage.setItem('reva_customer_avatar', data.customer.avatar_url);
          }
          if (data.customer.registered_at || data.customer.created_at) {
            localStorage.setItem('reva_customer_registered_at', data.customer.registered_at || data.customer.created_at);
          }
        }
        if (data.passes && Array.isArray(data.passes)) {
          localStorage.setItem('reva_customer_passes', JSON.stringify(data.passes));
        }
      } catch {
        // ignore
      }

      sound.playRewardFanfare();
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      });

      setSuccessMessage('✓ Welcome back! Loading your passes...');
      setTimeout(() => {
        router.push('/c');
      }, 600);
    } catch (err: unknown) {
      console.error('Customer verification error:', err);
      setErrorMessage('Verification failed. Please try again.');
      setIsOtpLoading(false);
    }
  }

  // Quick 1-Tap Demo Regular Customer Login
  async function handleDemoCustomerLogin() {
    setCustomerPhone('+91 98765 43210');
    setCustomerName('Aarav Sharma');
    setCustomerOtp('4829');
    setErrorMessage(null);
    setIsOtpLoading(true);
    sound.playClick();

    try {
      const res = await fetch('/api/customer/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'verify_otp',
          phone: '+91 98765 43210',
          otp: '4829',
          name: 'Aarav Sharma',
        }),
      });

      const data = await res.json();
      if (data.success) {
        try {
          localStorage.setItem('reva_customer_phone', '+91 98765 43210');
          localStorage.setItem('reva_customer_name', 'Aarav Sharma');
          if (data.customer?.registered_at || data.customer?.created_at) {
            localStorage.setItem('reva_customer_registered_at', data.customer.registered_at || data.customer.created_at);
          }
          if (data.customer?.avatar_url) {
            localStorage.setItem('reva_customer_avatar', data.customer.avatar_url);
          }
          if (data.passes && Array.isArray(data.passes)) {
            localStorage.setItem('reva_customer_passes', JSON.stringify(data.passes));
          }
        } catch {}

        sound.playRewardFanfare();
        setSuccessMessage('✓ Opening Aarav Sharma\'s digital passes...');
        setTimeout(() => {
          router.push('/c');
        }, 500);
      }
    } catch {
      router.push('/c');
    } finally {
      setIsOtpLoading(false);
    }
  }

  // =========================================================================
  // 3. BUSINESS: LIVE SUPABASE LOGIN
  // =========================================================================
  async function handleLoginSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsLoading(true);

    try {
      sound.playClick();
      const { data, error } = await signInWithEmail(loginEmail, loginPassword);

      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          setErrorMessage('Invalid email or password. Please double-check or try the 1-Click Demo below.');
        } else {
          setErrorMessage(error.message);
        }
        setIsLoading(false);
        return;
      }

      if (data?.user || data?.session) {
        sound.playRewardFanfare();
        setSuccessMessage('✓ Welcome back! Loading your dashboard...');
        router.push('/dashboard');
      } else {
        router.push('/dashboard');
      }
    } catch (err: unknown) {
      console.error('Login exception:', err);
      setErrorMessage(err instanceof Error ? err.message : 'Unable to log in. Please try again.');
      setIsLoading(false);
    }
  }

  // =========================================================================
  // 4. BUSINESS: LIVE STORE REGISTRATION
  // =========================================================================
  async function handleRegisterSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (registerPassword.length < 6) {
      setErrorMessage('Password must be at least 6 characters long.');
      return;
    }

    setIsLoading(true);
    sound.playClick();

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: registerEmail.trim(),
          password: registerPassword,
          businessName: businessName.trim(),
          category,
          city,
          plan: selectedPlan,
        }),
      });

      const result = await res.json();

      if (!res.ok || result.error) {
        setErrorMessage(result.error || 'Registration failed. Please check your information.');
        setIsLoading(false);
        return;
      }

      await signInWithEmail(registerEmail, registerPassword);

      if (result.business) {
        try {
          sessionStorage.setItem(
            'reva_cached_dashboard',
            JSON.stringify({
              business: result.business,
              metrics: {
                totalRecoveredRevenue: 0,
                convertedCount: 0,
                totalNudgesSent: 0,
                conversionRate: 0,
                totalMembers: 0,
                atRiskCount: 0,
                todayScansCount: 0,
                todayStampsCount: 0,
                recentLogs: [],
                members: [],
              },
              allBusinesses: [result.business],
              timestamp: Date.now(),
            })
          );
        } catch {}
      }

      sound.playRewardFanfare();
      setSuccessMessage('🎉 3-Day Free Trial started! Opening your dashboard...');
      router.push(`/dashboard?businessId=${result.business?.id || ''}&new=true`);
    } catch (err: unknown) {
      console.error('Registration exception:', err);
      setErrorMessage(err instanceof Error ? err.message : 'Registration failed. Please try again.');
      setIsLoading(false);
    }
  }

  // =========================================================================
  // 5. GOOGLE SSO
  // =========================================================================
  async function handleGoogleAuth() {
    setErrorMessage(null);
    sound.playClick();
    setGoogleLoading(true);

    if (role === 'customer') {
      try {
        const origin = typeof window !== 'undefined' ? window.location.origin : 'https://reva.in';
        const { error } = await signInWithGoogle(`${origin}/auth/callback?role=customer&next=/c`);
        if (error) {
          if (
            error.message.toLowerCase().includes('provider is not enabled') ||
            error.message.toLowerCase().includes('unsupported provider')
          ) {
            setErrorMessage(
              'Google Sign-In needs to be enabled in Supabase Dashboard (Auth > Providers > Google). Once enabled, it redirects seamlessly!'
            );
          } else {
            setErrorMessage(error.message);
          }
          setGoogleLoading(false);
        }
      } catch (err: unknown) {
        console.error('Customer Supabase Google Auth error:', err);
        setErrorMessage(err instanceof Error ? err.message : 'Google authentication failed.');
        setGoogleLoading(false);
      }
      return;
    }

    // Business Owner Google SSO
    try {
      const origin = typeof window !== 'undefined' ? window.location.origin : 'https://reva.in';
      const nextParam = mode === 'register' ? '/dashboard?setup=true&new=true' : '/dashboard';
      const { error } = await signInWithGoogle(`${origin}/auth/callback?role=business&next=${encodeURIComponent(nextParam)}`);
      if (error) {
        if (
          error.message.toLowerCase().includes('provider is not enabled') ||
          error.message.toLowerCase().includes('unsupported provider')
        ) {
          setErrorMessage(
            'Google Sign-In needs to be enabled in your Supabase Dashboard (Auth > Providers > Google). Once Client ID & Secret are pasted, it will work automatically!'
          );
        } else {
          setErrorMessage(error.message);
        }
        setGoogleLoading(false);
      }
    } catch (err: unknown) {
      console.error('Google Auth exception:', err);
      setErrorMessage(err instanceof Error ? err.message : 'Failed to connect with Google.');
      setGoogleLoading(false);
    }
  }

  // =========================================================================
  // 6. FORGOT PASSWORD RECOVERY
  // =========================================================================
  async function handleForgotSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!forgotEmail) return;

    setErrorMessage(null);
    setIsLoading(true);
    sound.playClick();

    try {
      const { error } = await resetPassword(forgotEmail);
      if (error) {
        setErrorMessage(error.message);
      } else {
        sound.playRewardFanfare();
        setSuccessMessage('✓ Password reset link sent! Please check your email inbox.');
      }
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to send reset link.');
    } finally {
      setIsLoading(false);
    }
  }

  // 1-Click Sandbox Account Access
  async function handleDemoInstantLogin() {
    sound.playRewardFanfare();
    setIsLoading(true);
    setSuccessMessage('✓ Opening Boba & Brew live pilot sandbox...');
    try {
      await signInWithEmail('owner@bobabrew.com', 'reva2026');
    } catch {
      // fallback
    }
    router.push('/dashboard');
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-[#0F172A] flex flex-col justify-between py-6 sm:py-10 px-4 sm:px-8 font-sans antialiased selection:bg-[#0F172A] selection:text-white">
      {/* Top Bar with Home Link */}
      <div className="max-w-md w-full mx-auto flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-7 h-7 flex items-center justify-center text-slate-900 group-hover:rotate-45 transition-transform duration-500">
            <svg viewBox="0 0 24 24" className="w-6 h-6 fill-none stroke-current stroke-[2.2]">
              <path d="M12 2v20M2 12h20M4.93 4.93l14.14 14.14M4.93 19.07L19.07 4.93" />
            </svg>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="font-display text-xl font-bold tracking-tight text-[#0F172A]">Reva</span>
            <span className="text-slate-400 font-display font-medium text-base">.in</span>
          </div>
        </Link>

        <Link
          href="/"
          className="text-xs font-semibold text-slate-500 hover:text-[#0F172A] flex items-center gap-1 transition-colors px-3 py-1.5 rounded-full hover:bg-slate-100"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Home</span>
        </Link>
      </div>

      {/* Main Form Container */}
      <div className="max-w-[430px] w-full mx-auto my-auto flex flex-col items-center pt-3 pb-6">
        
        {/* ========================================================================= */}
        {/* TOP LEVEL ROLE SWITCHER: [👤 CUSTOMER PASSES] | [🏪 BUSINESS OWNER] */}
        {/* ========================================================================= */}
        <div className="w-full bg-slate-200/80 p-1 rounded-2xl flex items-center gap-1 mb-5 border border-slate-300/60 shadow-inner">
          <button
            type="button"
            onClick={() => switchRole('customer')}
            className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-display font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              role === 'customer'
                ? 'bg-white text-emerald-900 shadow-sm ring-1 ring-emerald-500/20'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Wallet className={`w-3.5 h-3.5 ${role === 'customer' ? 'text-emerald-600' : 'text-slate-400'}`} />
            <span>I&apos;m a Customer (Passes)</span>
          </button>

          <button
            type="button"
            onClick={() => switchRole('business')}
            className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-display font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              role === 'business'
                ? 'bg-[#0F172A] text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Store className={`w-3.5 h-3.5 ${role === 'business' ? 'text-white' : 'text-slate-400'}`} />
            <span>Business Owner</span>
          </button>
        </div>

        {/* Dynamic Headings tailored to Active Role */}
        <div className="text-center mb-5 space-y-1 w-full">
          <div className="text-[10px] font-mono uppercase tracking-[0.2em] font-bold text-slate-400">
            {role === 'customer'
              ? 'DIGITAL LOYALTY WALLET'
              : mode === 'login'
              ? 'MERCHANT DASHBOARD'
              : mode === 'register'
              ? 'NEW STORE ONBOARDING'
              : 'ACCOUNT RECOVERY'}
          </div>
          <h1 className="text-2xl sm:text-[28px] font-bold text-[#0F172A] tracking-tight leading-tight font-display">
            {role === 'customer'
              ? 'Access your digital passes.'
              : mode === 'login'
              ? 'Log in to your business.'
              : mode === 'register'
              ? 'Register your business.'
              : 'Reset your password.'}
          </h1>
          <p className="text-slate-500 font-normal text-xs leading-relaxed max-w-sm mx-auto">
            {role === 'customer'
              ? 'Sign in with Google to view your collected stamps, unlocked treats, and member cards.'
              : mode === 'login'
              ? 'Access your customer passes, counter scans & win-backs'
              : mode === 'register'
              ? 'Launch your digital loyalty pass & counter QR in 2 minutes'
              : 'Enter your email to receive secure login instructions'}
          </p>
        </div>

        {/* Business Sub-mode Pill Switcher (Log in | Register store) */}
        {role === 'business' && mode !== 'forgot' && (
          <div className="w-full flex bg-slate-100/90 p-1.5 rounded-full border border-slate-200/60 mb-5">
            <button
              type="button"
              onClick={() => switchMode('login')}
              className={`flex-1 py-2 rounded-full text-xs transition-all cursor-pointer font-display font-bold ${
                mode === 'login'
                  ? 'bg-white shadow-2xs text-[#0F172A]'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Log in
            </button>
            <button
              type="button"
              onClick={() => switchMode('register')}
              className={`flex-1 py-2 rounded-full text-xs transition-all cursor-pointer font-display font-bold ${
                mode === 'register'
                  ? 'bg-white shadow-2xs text-[#0F172A]'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Register business
            </button>
          </div>
        )}

        {/* Notification / Alert Banners */}
        {errorMessage && (
          <div className="w-full mb-4 p-3.5 bg-rose-50 border border-rose-200/80 rounded-2xl flex items-start gap-2.5 text-xs text-rose-800 animate-in fade-in duration-200">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div className="flex-1 leading-relaxed font-medium">{errorMessage}</div>
          </div>
        )}

        {successMessage && (
          <div className="w-full mb-4 p-3.5 bg-emerald-50 border border-emerald-200/80 rounded-2xl flex items-start gap-2.5 text-xs text-emerald-800 animate-in fade-in duration-200">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div className="flex-1 leading-relaxed font-medium">{successMessage}</div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* SECTION A: CUSTOMER 1-CLICK GOOGLE SIGN-IN */}
        {/* ========================================================================= */}
        {role === 'customer' && (
          <div className="w-full space-y-4 animate-in fade-in duration-300">
            {/* Primary Google Sign-In Card */}
            <div className="p-6 sm:p-7 rounded-3xl bg-white border border-slate-200/90 shadow-sm space-y-5 text-center">
              <div className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center mx-auto text-emerald-600 shadow-2xs">
                <Wallet className="w-7 h-7" />
              </div>

              <div>
                <h3 className="font-display font-bold text-lg text-[#0F172A] tracking-tight">
                  Sign In with Google
                </h3>
                <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto leading-relaxed">
                  One-tap access to your collected stamps, unlocked treats, and merchant loyalty cards.
                </p>
              </div>

              <button
                type="button"
                onClick={handleGoogleAuth}
                disabled={googleLoading}
                className="w-full py-3.5 px-6 rounded-2xl bg-[#0F172A] hover:bg-black active:scale-[0.99] text-white transition-all flex items-center justify-center gap-3 cursor-pointer shadow-md font-display font-semibold text-sm disabled:opacity-70 group"
              >
                {googleLoading ? (
                  <span className="flex items-center gap-2">
                    <RefreshCw className="w-4 h-4 animate-spin text-emerald-400" />
                    <span>Connecting Google Account...</span>
                  </span>
                ) : (
                  <>
                    <div className="w-5 h-5 rounded-full bg-white flex items-center justify-center shrink-0 p-0.5 shadow-2xs">
                      <svg className="w-4 h-4" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                      </svg>
                    </div>
                    <span>Continue with Google</span>
                    <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                  </>
                )}
              </button>

              {/* Customer Value Props */}
              <div className="grid grid-cols-2 gap-2.5 pt-2 text-left">
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 flex items-start gap-2.5">
                  <Sparkles className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div className="text-[11px] text-slate-600 leading-tight">
                    <strong className="text-slate-800 font-semibold block mb-0.5">Instant Sync</strong>
                    1-click login with zero SMS delay
                  </div>
                </div>
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 flex items-start gap-2.5">
                  <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                  <div className="text-[11px] text-slate-600 leading-tight">
                    <strong className="text-slate-800 font-semibold block mb-0.5">Cross-Device</strong>
                    Saved safely on your phone &amp; PC
                  </div>
                </div>
              </div>
            </div>

            {/* 1-Tap Quick Demo Customer Access */}
            <div className="pt-1">
              <button
                type="button"
                onClick={handleDemoCustomerLogin}
                className="w-full p-3.5 rounded-2xl border border-emerald-200/80 bg-emerald-50/70 hover:bg-emerald-100/80 transition-all flex items-center justify-between text-xs font-semibold text-emerald-950 cursor-pointer shadow-2xs group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-2xs">
                    <Wallet className="w-4 h-4" />
                  </div>
                  <div className="text-left">
                    <div className="font-display font-bold flex items-center gap-1.5 text-emerald-950">
                      <span>Demo Customer Pass</span>
                      <span className="px-1.5 py-0.2 rounded bg-emerald-200 text-emerald-900 text-[9px] font-mono font-bold">1-TAP</span>
                    </div>
                    <div className="text-[10px] text-emerald-700 font-mono">Aarav Sharma • +91 98765 43210</div>
                  </div>
                </div>
                <span className="text-[11px] font-mono font-bold text-emerald-800 group-hover:translate-x-0.5 transition-transform flex items-center gap-1">
                  <span>Open Passes</span>
                  <span>→</span>
                </span>
              </button>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* SECTION B: BUSINESS OWNER LOGIN & REGISTRATION */}
        {/* ========================================================================= */}
        {role === 'business' && (
          <div className="w-full space-y-4">
            {/* 1. Google 1-Click Option (Hidden in forgot password mode) */}
            {mode !== 'forgot' && (
              <>
                <button
                  type="button"
                  onClick={handleGoogleAuth}
                  disabled={googleLoading || isLoading}
                  className="w-full py-3 px-5 rounded-full border border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50 transition-all flex items-center justify-center gap-3 cursor-pointer shadow-2xs text-xs font-semibold text-slate-700 mb-4 group active:scale-[0.99] disabled:opacity-50"
                >
                  {googleLoading ? (
                    <span className="text-xs text-slate-500 font-mono flex items-center gap-2">
                      <div className="w-3.5 h-3.5 rounded-full border-2 border-slate-400 border-t-transparent animate-spin" />
                      Connecting to Google...
                    </span>
                  ) : (
                    <>
                      <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                      </svg>
                      <span>{mode === 'login' ? 'Log in with Google' : 'Register with Google'}</span>
                    </>
                  )}
                </button>

                <div className="w-full relative mb-4">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-slate-200" />
                  </div>
                  <div className="relative flex justify-center text-[11px] font-mono uppercase tracking-wider">
                    <span className="bg-[#FAFAFA] px-3 text-slate-400 font-medium">
                      or with email
                    </span>
                  </div>
                </div>
              </>
            )}

            {/* MODE A: BUSINESS LOG IN */}
            {mode === 'login' && (
              <form onSubmit={handleLoginSubmit} className="w-full space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Business Email
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      placeholder="owner@bobabrew.com"
                      className="w-full pl-4 pr-10 py-3 text-sm rounded-xl border border-slate-200 bg-white text-[#0F172A] placeholder-slate-400 focus:outline-none focus:border-[#0F172A] focus:ring-1 focus:ring-[#0F172A] transition-all"
                      required
                    />
                    <Mail className="w-4 h-4 text-slate-400 absolute right-3.5 top-3.5 pointer-events-none" />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-semibold text-slate-700">
                      Password
                    </label>
                    <button
                      type="button"
                      onClick={() => switchMode('forgot')}
                      className="text-xs text-slate-500 hover:text-[#0F172A] hover:underline cursor-pointer"
                    >
                      Forgot password?
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full pl-4 pr-11 py-3 text-sm rounded-xl border border-slate-200 bg-white text-[#0F172A] placeholder-slate-400 focus:outline-none focus:border-[#0F172A] focus:ring-1 focus:ring-[#0F172A] transition-all"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3.5 rounded-full bg-[#0F172A] hover:bg-black active:scale-[0.99] text-white font-semibold text-xs sm:text-sm uppercase tracking-wider transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer mt-2 disabled:opacity-60"
                >
                  {isLoading ? (
                    <span className="flex items-center gap-2">
                      <div className="w-3.5 h-3.5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                      <span>Logging in...</span>
                    </span>
                  ) : (
                    <>
                      <span>Log in to Dashboard</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            )}

            {/* MODE B: REGISTER STORE */}
            {mode === 'register' && (
              <form onSubmit={handleRegisterSubmit} className="w-full space-y-3.5">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-semibold text-slate-700">
                      Select Plan (3-Day Free Trial)
                    </label>
                    <span className="text-[10px] font-mono text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/60">
                      ₹0 DUE TODAY
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        sound.playClick();
                        setSelectedPlan('starter');
                      }}
                      className={`p-2 rounded-xl border text-left transition-all cursor-pointer ${
                        selectedPlan === 'starter'
                          ? 'border-[#0F172A] bg-slate-900 text-white shadow-xs'
                          : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                      }`}
                    >
                      <div className="text-[11px] font-bold">Starter</div>
                      <div className={`text-xs font-mono font-bold mt-0.5 ${selectedPlan === 'starter' ? 'text-slate-200' : 'text-slate-900'}`}>
                        ₹499<span className="text-[9px] font-normal">/yr</span>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        sound.playClick();
                        setSelectedPlan('growth');
                      }}
                      className={`p-2 rounded-xl border text-left transition-all cursor-pointer relative ${
                        selectedPlan === 'growth'
                          ? 'border-[#0F172A] bg-slate-900 text-white shadow-xs ring-1 ring-[#0F172A]'
                          : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold">Growth</span>
                        <span className={`text-[8px] font-bold px-1 rounded uppercase ${selectedPlan === 'growth' ? 'bg-emerald-400 text-slate-950' : 'bg-emerald-100 text-emerald-800'}`}>
                          ★
                        </span>
                      </div>
                      <div className={`text-xs font-mono font-bold mt-0.5 ${selectedPlan === 'growth' ? 'text-slate-200' : 'text-slate-900'}`}>
                        ₹999<span className="text-[9px] font-normal">/yr</span>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        sound.playClick();
                        setSelectedPlan('pro');
                      }}
                      className={`p-2 rounded-xl border text-left transition-all cursor-pointer ${
                        selectedPlan === 'pro'
                          ? 'border-[#0F172A] bg-slate-900 text-white shadow-xs'
                          : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                      }`}
                    >
                      <div className="text-[11px] font-bold">Pro</div>
                      <div className={`text-xs font-mono font-bold mt-0.5 ${selectedPlan === 'pro' ? 'text-slate-200' : 'text-slate-900'}`}>
                        ₹1,499<span className="text-[9px] font-normal">/yr</span>
                      </div>
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Business / Cafe Name
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={businessName}
                      onChange={(e) => setBusinessName(e.target.value)}
                      placeholder="e.g. Tokyo Matcha & Bakehouse"
                      className="w-full pl-4 pr-10 py-2.5 text-sm rounded-xl border border-slate-200 bg-white text-[#0F172A] placeholder-slate-400 focus:outline-none focus:border-[#0F172A] transition-all"
                      required
                    />
                    <Store className="w-4 h-4 text-slate-400 absolute right-3.5 top-3 pointer-events-none" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Category
                    </label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white text-[#0F172A] focus:outline-none focus:border-[#0F172A] cursor-pointer"
                    >
                      <option value="Cafe & Coffee Shop">Cafe & Coffee</option>
                      <option value="Bakery & Desserts">Bakery & Bakes</option>
                      <option value="Restaurant / Dining">Restaurant</option>
                      <option value="Boba & Beverages">Boba & Tea</option>
                      <option value="Salon & Spa">Salon & Spa</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      City
                    </label>
                    <input
                      type="text"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="Bangalore"
                      className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 bg-white text-[#0F172A] placeholder-slate-400 focus:outline-none focus:border-[#0F172A]"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Work / Business Email
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      value={registerEmail}
                      onChange={(e) => setRegisterEmail(e.target.value)}
                      placeholder="owner@tokyomatcha.com"
                      className="w-full pl-4 pr-10 py-2 text-sm rounded-xl border border-slate-200 bg-white text-[#0F172A] placeholder-slate-400 focus:outline-none focus:border-[#0F172A]"
                      required
                    />
                    <Mail className="w-4 h-4 text-slate-400 absolute right-3.5 top-2.5 pointer-events-none" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Password (min. 6 chars)
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={registerPassword}
                      onChange={(e) => setRegisterPassword(e.target.value)}
                      placeholder="Choose a password"
                      className="w-full pl-4 pr-11 py-2 text-sm rounded-xl border border-slate-200 bg-white text-[#0F172A] placeholder-slate-400 focus:outline-none focus:border-[#0F172A]"
                      required
                      minLength={6}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="p-2.5 bg-emerald-50 rounded-xl border border-emerald-200 text-[11px] text-emerald-900 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0 stroke-[3]" />
                    <span><b>3-Day Free Trial</b> • No card required upfront</span>
                  </div>
                  <span className="font-mono text-[9px] font-bold text-emerald-800 uppercase">Instant</span>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3.5 rounded-full bg-[#0F172A] hover:bg-black active:scale-[0.99] text-white font-semibold text-xs sm:text-sm uppercase tracking-wider transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer mt-1 disabled:opacity-60"
                >
                  {isLoading ? (
                    <span className="flex items-center gap-2">
                      <div className="w-3.5 h-3.5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                      <span>Starting Free Trial...</span>
                    </span>
                  ) : (
                    <>
                      <span>Start 3-Day Free Trial</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            )}

            {/* MODE C: FORGOT PASSWORD */}
            {mode === 'forgot' && (
              <form onSubmit={handleForgotSubmit} className="w-full space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Your Registered Email
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      placeholder="owner@yourstore.com"
                      className="w-full pl-4 pr-10 py-3 text-sm rounded-xl border border-slate-200 bg-white text-[#0F172A] placeholder-slate-400 focus:outline-none focus:border-[#0F172A] focus:ring-1 focus:ring-[#0F172A] transition-all"
                      required
                    />
                    <Mail className="w-4 h-4 text-slate-400 absolute right-3.5 top-3.5 pointer-events-none" />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3.5 rounded-full bg-[#0F172A] hover:bg-black active:scale-[0.99] text-white font-semibold text-xs sm:text-sm uppercase tracking-wider transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                >
                  {isLoading ? (
                    <span className="flex items-center gap-2">
                      <div className="w-3.5 h-3.5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                      <span>Sending reset link...</span>
                    </span>
                  ) : (
                    <>
                      <KeyRound className="w-4 h-4" />
                      <span>Send Reset Link</span>
                    </>
                  )}
                </button>

                <div className="text-center pt-2">
                  <button
                    type="button"
                    onClick={() => switchMode('login')}
                    className="text-xs font-semibold text-slate-500 hover:text-[#0F172A] cursor-pointer"
                  >
                    ← Back to Log in
                  </button>
                </div>
              </form>
            )}

            {/* 1-Click Sandbox Account Access */}
            <div className="w-full mt-5 pt-4 border-t border-slate-200">
              <button
                type="button"
                onClick={handleDemoInstantLogin}
                className="w-full p-3 rounded-2xl border border-slate-200/80 bg-white hover:bg-slate-50 transition-colors flex items-center justify-between text-xs font-semibold text-slate-700 cursor-pointer shadow-2xs group active:scale-[0.99]"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-xl bg-[#0F172A] text-white flex items-center justify-center">
                    <Coffee className="w-3.5 h-3.5" />
                  </div>
                  <div className="text-left">
                    <div className="font-display font-bold text-slate-900 flex items-center gap-1.5">
                      <span>Boba &amp; Brew Artisan Cafe</span>
                      <span className="px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 text-[9px] font-mono font-bold">PILOT</span>
                    </div>
                    <div className="text-[10px] text-slate-400 font-normal">7 Active Customers • 6 Memberships in Supabase</div>
                  </div>
                </div>
                <span className="text-[11px] font-mono font-bold text-[#0F172A] group-hover:translate-x-0.5 transition-transform">1-Click Demo →</span>
              </button>
            </div>
          </div>
        )}

        {/* Terms Disclaimer */}
        <p className="mt-6 text-[11px] text-slate-400 text-center leading-relaxed max-w-[340px] font-normal">
          By continuing, you acknowledge that you agree to Reva&apos;s{' '}
          <Link href="/" className="underline text-slate-500 hover:text-slate-800">
            Terms &amp; Conditions
          </Link>{' '}
          and{' '}
          <Link href="/" className="underline text-slate-500 hover:text-slate-800">
            Privacy Policy
          </Link>
          .
        </p>
      </div>

      {/* Footer Language Selector */}
      <footer className="w-full max-w-md mx-auto pt-4 flex items-center justify-center text-[11px] text-slate-400 gap-1 font-mono">
        <Globe className="w-3.5 h-3.5 text-slate-400" />
        <span>Language: English (US)</span>
        <ChevronDown className="w-3 h-3 text-slate-400" />
      </footer>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center">
          <div className="w-8 h-8 rounded-full border-2 border-[#0F172A] border-t-transparent animate-spin" />
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}

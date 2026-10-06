'use client';

// ============================================================================
// REVA (reva.in) — Roco.bank-Style Loyalty Landing Page
// Clean background (pure #FFFFFF, no gradients), Cascading Diagonal 3D Loyalty Cards,
// Full interactive conveyor physics, 3D mouse parallax, auto-cycle engine,
// Staggered floating regular member pills, Outfit + Plus Jakarta Sans typography.
// ============================================================================

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  QrCode,
  Coffee,
  MessageSquare,
  ArrowRight,
  ShieldCheck,
  Check,
  Sparkles,
  Smartphone,
  ChevronDown,
  ChevronUp,
  Wallet,
  Layers,
  Zap,
  RotateCcw,
  TrendingUp,
  Percent,
  Clock,
  Printer,
  ExternalLink,
  Plus,
  ArrowUp,
  Play,
  Pause,
  Gift,
  CheckCircle2,
  Users,
  Trophy,
  Copy,
  Home,
  Compass,
  User,
  Star,
  Megaphone,
  LayoutGrid,
  Camera,
} from 'lucide-react';
import Image from 'next/image';
import { sound } from '@/lib/sound';

export default function LandingPage() {
  const router = useRouter();

  // Prefetch login and dashboard routes for instant 0ms transition
  useEffect(() => {
    router.prefetch('/login');
    router.prefetch('/dashboard');
  }, [router]);

  // Active selected card in the diagonal cascade (0 to 3)
  const [activeCardIndex, setActiveCardIndex] = useState<number>(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState<boolean>(true);
  const [isHoveringDeck, setIsHoveringDeck] = useState<boolean>(false);
  const [mobileHeroScreen, setMobileHeroScreen] = useState<'pass' | 'qr' | 'reward'>('pass');

  // FAQ Schema for SEO (JSON-LD)
  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'Do I need a POS integration or new hardware?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'No. Reva works alone with counter QR stands. Guests scan with their phone camera. Staff can add stamps from any phone, iPad or POS browser. You do not need to change your POS.',
        },
      },
      {
        '@type': 'Question',
        name: "What if I don't have a WhatsApp Business account?",
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'No. Normal WhatsApp works. Reva prepares the message and you tap send. You do not need to register developer accounts.',
        },
      },
      {
        '@type': 'Question',
        name: 'Can customers fake stamps at home?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'No. Stamps are added only by your staff using a secret PIN, geofence, or staff scan. Customers cannot give themselves stamps.',
        },
      },
      {
        '@type': 'Question',
        name: 'How fast can I get this running in my café?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'About 3 minutes. Sign up, add your café name and rewards, and print your QR stand. You can place it on your counter today.',
        },
      },
      {
        '@type': 'Question',
        name: 'How do I know it works?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'When a customer returns after your message and scans their pass, the dashboard records it and shows the ₹ they spent.',
        },
      },
    ],
  };

  // Mouse Parallax 3D Tilt State
  const [mouseTilt, setMouseTilt] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const deckRef = useRef<HTMLDivElement>(null);

  // Stamp progress per card
  const [cardStamps, setCardStamps] = useState<Record<number, number>>({
    0: 4, // Boba & Brew (4 of 6)
    1: 3, // Tokyo Matcha (3 of 5)
    2: 5, // Velvet Roast (5 of 6)
    3: 6, // Crust & Crumb (6 of 8)
  });
  const [justPunched, setJustPunched] = useState<boolean>(false);

  // ROI Calculator State
  const [dailyFootfall, setDailyFootfall] = useState<number>(150);
  const [avgTicket, setAvgTicket] = useState<number>(350);

  // FAQ Accordion State
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  // 4 Loyalty Cards matching the Roco.bank visual texture & color palettes
  const cards = useMemo(
    () => [
      {
        id: 'boba-brew',
        name: 'Boba & Brew Artisan Cafe',
        category: 'Artisan Cafe & Bakery',
        bgGradient: 'from-[#E05A36] via-[#F58238] to-[#FBAE42]', // Warm terracotta ribbon
        accent: '#FDE047',
        totalStamps: 6,
        reward: 'Free Specialty Beverage',
        member: 'Aarav Sharma',
        passId: 'PASS #4082',
        tier: 'GOLD PATRON',
        recovered: '₹32,100',
        avatar: 'AS',
      },
      {
        id: 'tokyo-matcha',
        name: 'Tokyo Matcha & Tea Bar',
        category: 'Ceremonial Tea Bar',
        bgGradient: 'from-[#2F6B45] via-[#4D9362] to-[#7CB342]', // Lush matcha botanical
        accent: '#FDE047',
        totalStamps: 5,
        reward: 'Free Ceremonial Matcha',
        member: 'Dev Mehra',
        passId: 'PASS #1044',
        tier: 'FOUNDER PASS',
        recovered: '₹29,000',
        avatar: 'DM',
      },
      {
        id: 'velvet-roast',
        name: 'Velvet Roast Coffee Co.',
        category: 'Specialty Roastery & Lab',
        bgGradient: 'from-[#18181B] via-[#27272A] to-[#3F3F46]', // Obsidian dark sheen
        accent: '#A78BFA',
        totalStamps: 6,
        reward: 'Free Pour-Over Flight',
        member: 'Ananya Iyer',
        passId: 'PASS #7731',
        tier: 'PLATINUM ROAST',
        recovered: '₹68,899',
        avatar: 'AI',
      },
      {
        id: 'crust-crumb',
        name: 'Crust & Crumb Sourdough Co.',
        category: 'Artisan Bakery & Deli',
        bgGradient: 'from-[#D97706] via-[#B45309] to-[#78350F]', // Sourdough honeycomb gold
        accent: '#34D399',
        totalStamps: 8,
        reward: 'Free Sourdough Boule',
        member: 'Priya Patel',
        passId: 'PASS #9120',
        tier: 'VIP ARTISAN',
        recovered: '₹6,899',
        avatar: 'PP',
      },
    ],
    []
  );

  const currentCard = cards[activeCardIndex];
  const currentStamps = cardStamps[activeCardIndex] ?? 4;

  // Next & Prev Card Controls
  const handleCardNext = useCallback(() => {
    sound.playClick();
    setActiveCardIndex((prev) => (prev + 1) % cards.length);
  }, [cards.length]);

  const handleCardPrev = useCallback(() => {
    sound.playClick();
    setActiveCardIndex((prev) => (prev - 1 + cards.length) % cards.length);
  }, [cards.length]);

  // Auto-play Carousel Loop (cycles every 3.8 seconds if not paused)
  useEffect(() => {
    if (!isAutoPlaying || isHoveringDeck) return;

    const timer = setInterval(() => {
      setActiveCardIndex((prev) => (prev + 1) % cards.length);
    }, 3800);

    return () => clearInterval(timer);
  }, [isAutoPlaying, isHoveringDeck, cards.length]);

  // Mouse Parallax 3D Tilt calculation
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!deckRef.current) return;
    const rect = deckRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5; // -0.5 to 0.5
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setMouseTilt({ x: x * 14, y: y * -10 });
  };

  const handleMouseLeave = () => {
    setIsHoveringDeck(false);
    setMouseTilt({ x: 0, y: 0 });
  };

  // Stamp Punch Simulation
  const handleHeroPunch = (e: React.MouseEvent) => {
    e.stopPropagation();
    sound.playStampPop();
    setJustPunched(true);
    setTimeout(() => setJustPunched(false), 500);

    setCardStamps((prev) => {
      const current = prev[activeCardIndex] ?? 5;
      const total = cards[activeCardIndex]?.totalStamps || 5;
      const next = current >= total ? 1 : current + 1;
      if (next >= total) {
        sound.playRewardFanfare();
      }
      return { ...prev, [activeCardIndex]: next };
    });
  };

  // ROI Math
  const calculatedROI = useMemo(() => {
    const monthlyCustomers = dailyFootfall * 30;
    const activeRegulars = Math.round(monthlyCustomers * 0.25);
    const atRiskRegulars = Math.round(activeRegulars * 0.1);
    const recoveredRegulars = Math.round(atRiskRegulars * 0.28);
    const additionalVisits = Math.round(recoveredRegulars * 2.2);
    const monthlyRevenue = additionalVisits * avgTicket;
    const annualRevenue = monthlyRevenue * 12;
    const annualCost = 999;
    const roiMultiplier = Math.max(1, Math.round(annualRevenue / annualCost));

    return {
      activeRegulars,
      atRiskRegulars,
      recoveredRegulars,
      monthlyRevenue,
      annualRevenue,
      roiMultiplier,
    };
  }, [dailyFootfall, avgTicket]);

  // Keyboard listener for carousel navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
        handleCardPrev();
      } else if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
        handleCardNext();
      } else if (e.key === ' ' && !['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) {
        e.preventDefault();
        sound.playStampPop();
        setJustPunched(true);
        setTimeout(() => setJustPunched(false), 500);
        setCardStamps((prev) => {
          const current = prev[activeCardIndex] ?? 0;
          const total = cards[activeCardIndex].totalStamps;
          if (current + 1 >= total) {
            sound.playRewardFanfare();
            return { ...prev, [activeCardIndex]: total };
          }
          return { ...prev, [activeCardIndex]: current + 1 };
        });
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeCardIndex, cards, handleCardNext, handleCardPrev]);

  return (
    <div className="min-h-screen bg-white text-[#0F172A] flex flex-col selection:bg-[#0F172A] selection:text-white font-sans antialiased relative overflow-x-hidden">
      {/* ========================================================================= */}
      {/* 1. STICKY NAVIGATION (Roco.bank Style) */}
      {/* ========================================================================= */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-100 transition-all">
        <div className="max-w-7xl w-full mx-auto px-4 sm:px-10 h-16 sm:h-20 flex items-center justify-between">
          {/* Logo with Stylized Geometric Asterisk Mark */}
          <Link href="/" className="flex items-center gap-2.5 sm:gap-3 group">
            <div className="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center text-slate-900 group-hover:rotate-45 transition-transform duration-500">
              <svg viewBox="0 0 24 24" className="w-6 h-6 sm:w-7 sm:h-7 fill-none stroke-current stroke-[2.2]">
                <path d="M12 2v20M2 12h20M4.93 4.93l14.14 14.14M4.93 19.07L19.07 4.93" />
              </svg>
            </div>
            <div className="flex items-baseline gap-0.5 sm:gap-1">
              <span className="font-display text-xl sm:text-2xl font-bold tracking-tight text-[#0F172A]">Reva</span>
              <span className="text-slate-400 font-display font-medium text-base sm:text-lg">.in</span>
            </div>
          </Link>

          {/* Centered Nav Links (Desktop Only - UNCHANGED) */}
          <nav className="hidden lg:flex items-center gap-9 text-sm font-medium text-slate-600">
            <a href="#cards" className="hover:text-[#0F172A] transition-colors">
              Loyalty Pass
            </a>
            <a href="#how-it-works" className="hover:text-[#0F172A] transition-colors">
              How It Works
            </a>
            <a href="#calculator" className="hover:text-[#0F172A] transition-colors">
              ROI Calculator
            </a>
            <a href="#winback" className="hover:text-[#0F172A] transition-colors">
              Win-Back System
            </a>
            <a href="#pricing" className="hover:text-[#0F172A] transition-colors">
              Pricing
            </a>
          </nav>

          {/* Right Action Buttons */}
          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              href="/login"
              className="text-xs sm:text-sm font-semibold text-slate-700 hover:text-[#0F172A] px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-full hover:bg-slate-100 transition-all cursor-pointer"
            >
              Log in
            </Link>

            <Link
              href="/login?mode=register"
              className="text-xs sm:text-sm font-semibold px-4 sm:px-5 py-1.5 sm:py-2 rounded-full bg-[#0F172A] text-white hover:bg-black transition-all shadow-xs flex items-center gap-1 sm:gap-1.5 cursor-pointer active:scale-98"
            >
              <span>Register Store</span>
              <ArrowRight className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* ========================================================================= */}
      {/* 2. HERO SECTION (CLEAN 3-IPHONE V-FORMATION SHOWCASE) */}
      {/* ========================================================================= */}
      <section className="relative min-h-[calc(100vh-4rem)] sm:min-h-[calc(100vh-5rem)] flex flex-col justify-center py-6 sm:py-12 lg:py-16 px-4 sm:px-10 max-w-7xl w-full mx-auto overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 sm:gap-10 lg:gap-14 items-center my-auto w-full">
          {/* LEFT COLUMN: Clean Compressed Hierarchy, Switcher Controls, Headline, Subhead */}
          <div className="lg:col-span-5 space-y-4 sm:space-y-5 z-20 text-left py-1">
            {/* 1. EYEBROW TEXT */}
            <div className="hero-anim-eyebrow flex items-center gap-2 sm:gap-3">
              <div className="hidden sm:flex flex-col gap-1">
                <button
                  onClick={handleCardPrev}
                  className="w-6 h-6 rounded-full bg-slate-100 hover:bg-slate-200 active:scale-90 text-slate-700 flex items-center justify-center transition-all cursor-pointer shadow-2xs"
                  title="Previous Card (Up Arrow)"
                  aria-label="Previous card"
                >
                  <ArrowUp className="w-3 h-3" />
                </button>
                <button
                  onClick={handleCardNext}
                  className="w-6 h-6 rounded-full bg-slate-900 hover:bg-black active:scale-90 text-white flex items-center justify-center transition-all cursor-pointer shadow-2xs"
                  title="Next Card (Down Arrow)"
                  aria-label="Next card"
                >
                  <ChevronDown className="w-3 h-3" />
                </button>
              </div>

              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 border border-slate-200/80 text-[10px] sm:text-[11px] font-mono uppercase tracking-[0.2em] font-bold text-slate-600">
                <span>CREATE YOUR OWN</span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              </div>
            </div>

            {/* 2. HEADLINE (Single H1 for SEO) */}
            <div className="space-y-2">
              <h1 className="hero-anim-headline-1 font-display font-bold text-3xl sm:text-5xl lg:text-[46px] tracking-tight text-[#0F172A] leading-[1.12]">
                A digital loyalty card for your revenue boost
              </h1>
            </div>

            {/* 3. SUBHEAD PARAGRAPH - Delay 0.45s */}
            <p className="hero-anim-subhead font-body text-xs sm:text-sm text-slate-600 leading-relaxed max-w-lg font-normal">
              Reva gives your customers a digital stamp card with no app to install. You see who stopped visiting and bring them back with one tap on WhatsApp. Made for cafés, salons, retail, gyms, and local businesses.
            </p>

            {/* 4. CTA BUTTONS */}
            <div className="hero-anim-cta flex flex-col items-start gap-2.5 sm:gap-3 pt-1">
              <Link
                href="/login?mode=register&trial=true"
                className="px-6 sm:px-7 py-3 sm:py-3.5 rounded-full bg-[#0F172A] hover:bg-black text-white text-xs sm:text-sm font-semibold tracking-wider transition-all shadow-md flex items-center gap-2 cursor-pointer uppercase hover:translate-y-[-1px]"
              >
                <span>GET STARTED</span>
                <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </Link>

              <Link
                href="/login?role=customer"
                className="px-5 sm:px-6 py-2.5 sm:py-3 rounded-full bg-emerald-50 hover:bg-emerald-100/90 border border-emerald-300 text-emerald-900 text-xs sm:text-sm font-semibold tracking-wide transition-all shadow-2xs flex items-center gap-2 cursor-pointer hover:translate-y-[-1px] group"
              >
                <Wallet className="w-4 h-4 text-emerald-600 group-hover:scale-110 transition-transform" />
                <span>I&apos;m a Customer</span>
              </Link>
            </div>

            {/* 5. TRUST LINE (Below buttons) - Delay 0.75s */}
            <div className="hero-anim-trust flex flex-wrap items-center gap-y-1.5 gap-x-3 sm:gap-x-4 text-[11px] sm:text-xs text-slate-500 font-medium pt-0.5">
              <div className="flex items-center gap-1.5 text-slate-600">
                <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>No app download</span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-600">
                <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Works on any phone</span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-600">
                <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Setup in 3 minutes</span>
              </div>
            </div>
          </div>

          {/* 6. THREE IPHONES SHOWCASE: V-SHAPE FORMATION (ALIGNED ON BOTH PHONE & DESKTOP) */}
          <div
            id="cards"
            className="lg:col-span-7 relative flex items-center justify-center min-h-[380px] xs:min-h-[440px] sm:min-h-[580px] lg:min-h-[620px] w-full select-none py-2 sm:py-0 overflow-visible"
          >
            {/* Stage Container */}
            <div className="relative w-full max-w-[340px] xs:max-w-[400px] sm:max-w-[640px] lg:max-w-[680px] h-[370px] xs:h-[430px] sm:h-[565px] lg:h-[600px] flex items-center justify-center">
              {/* ========================================================================= */}
              {/* IPHONE 1 (LEFT / BEHIND): Business Dashboard & QR Code */}
              {/* ========================================================================= */}
              <div
                className="hero-anim-iphone-left absolute left-1/2 -translate-x-[92%] sm:-translate-x-[92%] lg:-translate-x-[90%] top-2 xs:top-3 sm:top-4 rotate-[-15deg] lg:rotate-[-16deg] z-10 origin-bottom-right transition-transform duration-300 hover:z-30 hover:rotate-[-10deg] cursor-pointer"
              >
                <div className="animate-iphone-left w-[145px] xs:w-[175px] sm:w-[255px] lg:w-[270px] h-[320px] xs:h-[380px] sm:h-[530px] lg:h-[560px] rounded-[24px] xs:rounded-[30px] sm:rounded-[42px] border-[2px] xs:border-[2.5px] sm:border-[3.5px] border-[#18181b] bg-[#18181b] iphone-frame-shadow relative overflow-hidden">
                  {/* Physical Side Buttons */}
                  <div className="w-[2px] sm:w-[3px] h-2.5 sm:h-3.5 bg-[#3f3f46] rounded-l-xs absolute -left-[2px] sm:-left-[3px] top-12 sm:top-16" />
                  <div className="w-[2px] sm:w-[3px] h-5 sm:h-7 bg-[#3f3f46] rounded-l-xs absolute -left-[2px] sm:-left-[3px] top-18 sm:top-23" />
                  <div className="w-[2px] sm:w-[3px] h-5 sm:h-7 bg-[#3f3f46] rounded-l-xs absolute -left-[2px] sm:-left-[3px] top-26 sm:top-33" />
                  <div className="w-[2px] sm:w-[3px] h-7 sm:h-10 bg-[#3f3f46] rounded-r-xs absolute -right-[2px] sm:-right-[3px] top-18 sm:top-23" />

                  {/* Inner Screen */}
                  <div className="rounded-[22px] xs:rounded-[28px] sm:rounded-[39px] overflow-hidden bg-white text-slate-900 flex flex-col justify-between h-full relative">
                    {/* Top Midnight Header */}
                    <div className="bg-[#0F172A] text-white p-2 xs:p-2.5 sm:p-3 pt-1.5 xs:pt-2 pb-2.5 xs:pb-3 sm:pb-3.5 rounded-b-xl xs:rounded-b-2xl shadow-xs">
                      {/* iOS Status Bar */}
                      <div className="flex justify-between items-center text-[6px] xs:text-[7px] sm:text-[9px] font-semibold text-white/90 px-1 mb-1 sm:mb-2">
                        <span className="font-mono">1:47</span>
                        <div className="flex items-center gap-0.5 sm:gap-1">
                          <span className="text-[5px] xs:text-[6px] sm:text-[8px] font-mono">5G</span>
                          <div className="w-2.5 sm:w-3.5 h-1.5 sm:h-2 border border-white/80 rounded-2xs p-0.2 sm:p-0.5 flex items-center">
                            <div className="h-full w-full bg-white rounded-3xs" />
                          </div>
                        </div>
                      </div>

                      {/* Store Title Bar */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 sm:gap-2">
                          <div className="w-4 h-4 xs:w-5 xs:h-5 sm:w-6 sm:h-6 rounded-full bg-white text-[#0F172A] flex items-center justify-center shadow-xs">
                            <svg viewBox="0 0 24 24" className="w-2.5 h-2.5 xs:w-3 xs:h-3 sm:w-3.5 sm:h-3.5 fill-none stroke-current stroke-[2.2]">
                              <path d="M12 2v20M2 12h20M4.93 4.93l14.14 14.14M4.93 19.07L19.07 4.93" />
                            </svg>
                          </div>
                          <div>
                            <div className="flex items-center gap-0.5 sm:gap-1 font-display font-bold text-[9px] xs:text-[10px] sm:text-xs leading-tight">
                              <span>Reva</span>
                              <span className="text-slate-400 font-medium">.in</span>
                              <span className="text-[5px] xs:text-[6px] sm:text-[7px] font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-0.5 sm:px-1 py-0.1 rounded-full font-bold ml-0.5">
                                Pro
                              </span>
                            </div>
                            <p className="text-[6px] xs:text-[7px] sm:text-[8px] text-slate-400 leading-none">Dashboard</p>
                          </div>
                        </div>

                        <div className="w-3.5 h-3.5 xs:w-4 xs:h-4 sm:w-5 sm:h-5 rounded-full bg-white/10 flex items-center justify-center">
                          <User className="w-2 h-2 xs:w-2.5 xs:h-2.5 sm:w-3 sm:h-3 text-white" />
                        </div>
                      </div>

                      {/* 4 Stats Metric Cards in a Row */}
                      <div className="grid grid-cols-4 gap-0.5 sm:gap-1 mt-1 xs:mt-1.5 sm:mt-2.5 text-center">
                        <div className="bg-white/10 backdrop-blur-xs rounded-md sm:rounded-lg p-0.5 sm:p-1 border border-white/5">
                          <div className="flex items-center justify-center text-blue-400 text-[6px]">
                            <TrendingUp className="w-1.5 h-1.5 sm:w-2 sm:h-2" />
                          </div>
                          <div className="font-bold text-[7px] xs:text-[8px] sm:text-[10px] leading-tight text-white">36</div>
                          <div className="text-[4.5px] xs:text-[5.5px] sm:text-[6px] text-slate-300 uppercase font-mono font-medium">SCANS</div>
                        </div>

                        <div className="bg-white/10 backdrop-blur-xs rounded-md sm:rounded-lg p-0.5 sm:p-1 border border-white/5">
                          <div className="flex items-center justify-center text-emerald-400 text-[6px]">
                            <Users className="w-1.5 h-1.5 sm:w-2 sm:h-2" />
                          </div>
                          <div className="font-bold text-[7px] xs:text-[8px] sm:text-[10px] leading-tight text-white">3</div>
                          <div className="text-[4.5px] xs:text-[5.5px] sm:text-[6px] text-slate-300 uppercase font-mono font-medium">USERS</div>
                        </div>

                        <div className="bg-white/10 backdrop-blur-xs rounded-md sm:rounded-lg p-0.5 sm:p-1 border border-white/5">
                          <div className="flex items-center justify-center text-amber-400 text-[6px]">
                            <Gift className="w-1.5 h-1.5 sm:w-2 sm:h-2" />
                          </div>
                          <div className="font-bold text-[7px] xs:text-[8px] sm:text-[10px] leading-tight text-white">7</div>
                          <div className="text-[4.5px] xs:text-[5.5px] sm:text-[6px] text-slate-300 uppercase font-mono font-medium">REWARDS</div>
                        </div>

                        <div className="bg-white/10 backdrop-blur-xs rounded-md sm:rounded-lg p-0.5 sm:p-1 border border-white/5">
                          <div className="flex items-center justify-center text-indigo-400 text-[6px]">
                            <Trophy className="w-1.5 h-1.5 sm:w-2 sm:h-2" />
                          </div>
                          <div className="font-bold text-[7px] xs:text-[8px] sm:text-[10px] leading-tight text-white">33%</div>
                          <div className="text-[4.5px] xs:text-[5.5px] sm:text-[6px] text-slate-300 uppercase font-mono font-medium">REPEAT</div>
                        </div>
                      </div>
                    </div>

                    {/* Body: "Your QR Code" */}
                    <div className="p-2 sm:p-3 flex-1 flex flex-col items-center justify-center space-y-1 sm:space-y-1.5 text-center">
                      <h4 className="font-display font-bold text-[8px] xs:text-[9px] sm:text-xs text-slate-900">Your QR Code</h4>

                      <div className="p-1 sm:p-2 bg-white rounded-xl sm:rounded-2xl shadow-xs border border-slate-100">
                        <QrCode className="w-12 h-12 xs:w-16 xs:h-16 sm:w-24 sm:h-24 text-slate-900 mx-auto" />
                      </div>

                      <p className="text-[6px] xs:text-[7px] sm:text-[8px] text-slate-400 max-w-[170px] leading-tight">
                        Display at your counter for scans
                      </p>

                      <button className="px-2 py-0.5 sm:px-3 sm:py-1 bg-slate-100 hover:bg-slate-200 rounded-md sm:rounded-lg text-[6.5px] xs:text-[7.5px] sm:text-[9px] font-semibold text-slate-700 flex items-center gap-0.5 sm:gap-1 shadow-2xs">
                        <Copy className="w-2 h-2 sm:w-2.5 sm:h-2.5 text-slate-500" />
                        <span>Copy Link</span>
                      </button>
                    </div>

                    {/* Bottom Navigation */}
                    <div className="border-t border-slate-100 bg-white px-1.5 xs:px-2 sm:px-3 py-0.5 sm:py-1.5 flex items-center justify-between text-[5px] xs:text-[6px] sm:text-[7px] text-slate-400">
                      <div className="flex flex-col items-center gap-0.5 text-[#0F172A] font-bold">
                        <LayoutGrid className="w-2 h-2 sm:w-3 sm:h-3 text-[#0F172A]" />
                        <span>Dashboard</span>
                      </div>
                      <div className="flex flex-col items-center gap-0.5">
                        <Users className="w-2 h-2 sm:w-3 sm:h-3" />
                        <span>Customers</span>
                      </div>
                      <div className="flex flex-col items-center gap-0.5">
                        <Gift className="w-2 h-2 sm:w-3 sm:h-3" />
                        <span>Rewards</span>
                      </div>
                      <div className="flex flex-col items-center gap-0.5">
                        <Megaphone className="w-2 h-2 sm:w-3 sm:h-3" />
                        <span>Marketing</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* ========================================================================= */}
              {/* IPHONE 2 (CENTER / FRONT): Primary Customer Stamp Pass */}
              {/* ========================================================================= */}
              <div
                onClick={handleHeroPunch}
                className="hero-anim-iphone-center relative z-20 transition-transform duration-300 cursor-pointer"
              >
                <div
                  className={`animate-iphone-center w-[165px] xs:w-[195px] sm:w-[285px] lg:w-[305px] h-[355px] xs:h-[420px] sm:h-[570px] lg:h-[600px] rounded-[28px] xs:rounded-[34px] sm:rounded-[44px] border-[2.5px] xs:border-[3px] sm:border-[4px] border-[#101012] bg-[#101012] iphone-frame-center-shadow relative overflow-hidden ${
                    justPunched ? 'scale-[1.03]' : ''
                  }`}
                >
                  {/* Physical Side Buttons */}
                  <div className="w-[2px] sm:w-[3px] h-3 sm:h-4 bg-[#3f3f46] rounded-l-xs absolute -left-[2px] sm:-left-[3px] top-12 sm:top-16" />
                  <div className="w-[2px] sm:w-[3px] h-5 sm:h-7.5 bg-[#3f3f46] rounded-l-xs absolute -left-[2px] sm:-left-[3px] top-18 sm:top-24" />
                  <div className="w-[2px] sm:w-[3px] h-5 sm:h-7.5 bg-[#3f3f46] rounded-l-xs absolute -left-[2px] sm:-left-[3px] top-26 sm:top-35" />
                  <div className="w-[2px] sm:w-[3px] h-7 sm:h-11 bg-[#3f3f46] rounded-r-xs absolute -right-[2px] sm:-right-[3px] top-18 sm:top-24" />

                  {/* Inner Screen */}
                  <div className="rounded-[25px] xs:rounded-[31px] sm:rounded-[41px] overflow-hidden bg-[#F3F4F6] text-slate-900 flex flex-col justify-between h-full relative">
                    {/* Top Midnight Header */}
                    <div className="bg-[#0F172A] text-white p-2 xs:p-2.5 sm:p-3 pt-1.5 xs:pt-2 pb-2 xs:pb-2.5 sm:pb-3 rounded-b-xl xs:rounded-b-2xl shadow-xs">
                      {/* iOS Status Bar + Dynamic Island */}
                      <div className="flex justify-between items-center text-[7px] xs:text-[8px] sm:text-[10px] font-semibold text-white px-1 mb-1 sm:mb-1.5">
                        <span className="font-mono">1:46</span>
                        <div className="h-3 xs:h-3.5 sm:h-4.5 w-12 xs:w-16 sm:w-20 bg-black rounded-full mx-auto flex items-center justify-center border border-white/10 shadow-xs">
                          <div className="w-1 xs:w-1.5 h-1 xs:h-1.5 rounded-full bg-[#111] border border-blue-900/60 ml-auto mr-1.5 sm:mr-2" />
                        </div>
                        <div className="flex items-center gap-0.5 sm:gap-1">
                          <span className="text-[6px] xs:text-[7px] sm:text-[8px] font-mono">5G</span>
                          <div className="w-2.5 sm:w-3.5 h-1.5 sm:h-2 border border-white/80 rounded-2xs p-0.2 sm:p-0.5 flex items-center">
                            <div className="h-full w-full bg-white rounded-3xs" />
                          </div>
                        </div>
                      </div>

                      {/* Store Logo & Title */}
                      <div className="flex items-center gap-1.5 sm:gap-2 mt-0.5 sm:mt-1">
                        <div className="w-4 h-4 xs:w-5 xs:h-5 sm:w-6 sm:h-6 rounded-full bg-white text-[#0F172A] flex items-center justify-center shadow-xs">
                          <svg viewBox="0 0 24 24" className="w-2.5 h-2.5 xs:w-3 xs:h-3 sm:w-3.5 sm:h-3.5 fill-none stroke-current stroke-[2.2]">
                            <path d="M12 2v20M2 12h20M4.93 4.93l14.14 14.14M4.93 19.07L19.07 4.93" />
                          </svg>
                        </div>
                        <div>
                          <h4 className="font-display font-bold text-[10px] xs:text-xs sm:text-sm text-white leading-tight">
                            Tokyo
                          </h4>
                          <span className="text-[5.5px] xs:text-[6.5px] sm:text-[7px] font-mono text-slate-300 uppercase font-bold tracking-wider">
                            PREMIUM PARTNER
                          </span>
                        </div>
                      </div>

                      {/* Stamps Headline */}
                      <div className="mt-1 sm:mt-2 text-left">
                        <h3 className="font-display font-black text-xs xs:text-sm sm:text-lg text-white leading-tight">
                          {currentStamps} of 5 Stamps
                        </h3>
                        <div className="w-full h-0.5 bg-white/20 rounded-full mt-1 sm:mt-1.5" />
                      </div>
                    </div>

                    {/* Body Content */}
                    <div className="p-1.5 xs:p-2 sm:p-3 space-y-1 xs:space-y-1.5 sm:space-y-2 flex-1">
                      {/* Card 1: YOUR NEXT TREAT */}
                      <div className="bg-white rounded-xl xs:rounded-2xl p-1.5 xs:p-2 sm:p-2.5 shadow-xs border border-slate-100 flex items-center gap-1.5 xs:gap-2 sm:gap-2.5 text-left">
                        <div className="w-6 h-6 xs:w-8 xs:h-8 sm:w-10 sm:h-10 rounded-lg xs:rounded-xl overflow-hidden shrink-0 bg-amber-50">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src="/images/cupcakes_treat.jpg"
                            alt="Next Treat"
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-[5.5px] xs:text-[6.5px] sm:text-[7px] font-bold text-emerald-600 uppercase tracking-wider font-mono">
                            YOUR NEXT TREAT
                          </div>
                          <div className="font-display font-bold text-[8px] xs:text-[10px] sm:text-xs text-slate-900 leading-tight truncate">
                            Free cupcake of your choice
                          </div>
                          <div className="text-[6.5px] xs:text-[7.5px] sm:text-[8px] text-slate-400">
                            {currentStamps >= 5 ? 'Ready to Claim!' : `Collect ${5 - currentStamps} more stamps`}
                          </div>
                        </div>
                      </div>

                      {/* Card 2: STAMP CARD */}
                      <div className="bg-white rounded-xl xs:rounded-2xl p-1.5 xs:p-2 sm:p-3 shadow-xs border border-slate-100 text-left space-y-1 sm:space-y-1.5">
                        <div className="text-[6.5px] xs:text-[7px] sm:text-[8px] font-bold text-slate-400 uppercase font-mono tracking-wider">
                          STAMP CARD
                        </div>

                        {/* Row of 5 Stamps with Checks */}
                        <div className="flex items-center justify-between gap-0.5 sm:gap-1 py-0.5">
                          {[1, 2, 3, 4, 5].map((sNum) => {
                            const isStamped = sNum <= currentStamps;
                            return (
                              <div
                                key={sNum}
                                className={`w-5 h-5 xs:w-6 xs:h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center shadow-xs transition-all duration-300 ${
                                  isStamped
                                    ? 'bg-[#0F172A] text-white scale-100'
                                    : 'bg-slate-200 text-slate-400 border border-slate-300 scale-95'
                                }`}
                              >
                                <Check className={`w-2.5 h-2.5 xs:w-3 xs:h-3 sm:w-4 sm:h-4 stroke-[3] transition-opacity duration-300 ${isStamped ? 'opacity-100' : 'opacity-0'}`} />
                              </div>
                            );
                          })}
                        </div>

                        <div className="text-center text-[7px] xs:text-[8px] sm:text-[9px] text-slate-500 pt-0.2 sm:pt-0.5">
                          {currentStamps >= 5 ? (
                            <span className="text-emerald-700 font-bold">🎉 Reward Unlocked! Tap to claim.</span>
                          ) : (
                            <>
                              You&apos;re <b className="text-slate-900">{5 - currentStamps} stamps</b> away!
                            </>
                          )}
                        </div>

                        {/* Claim Reward Button */}
                        <button
                          onClick={handleHeroPunch}
                          className="w-full py-1 xs:py-1.5 sm:py-2 rounded-lg xs:rounded-xl bg-[#0F172A] hover:bg-black active:scale-95 text-white font-display font-bold text-[7.5px] xs:text-[9px] sm:text-[11px] shadow-sm flex items-center justify-center gap-1 sm:gap-1.5 transition-all cursor-pointer"
                        >
                          <Gift className="w-2.5 h-2.5 xs:w-3 xs:h-3 sm:w-3.5 sm:h-3.5" />
                          <span>{currentStamps >= 5 ? 'Claim Reward' : 'Tap to Add Stamp'}</span>
                        </button>

                        {/* Rate on Google Button */}
                        <div className="w-full py-0.5 xs:py-1 sm:py-1.5 rounded-lg xs:rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-display font-bold text-[6.5px] xs:text-[7.5px] sm:text-[9px] text-center flex items-center justify-center gap-0.5 sm:gap-1 shadow-2xs">
                          <span>Rate on Google</span>
                          <Star className="w-2 h-2 sm:w-2.5 sm:h-2.5 fill-slate-950" />
                        </div>
                      </div>
                    </div>

                    {/* Bottom Mobile Tab Bar (Home / Camera / Profile) */}
                    <div className="border-t border-slate-200 bg-white px-4 sm:px-5 py-0.5 sm:py-1 flex items-center justify-between text-[5.5px] xs:text-[6.5px] sm:text-[7px] text-slate-500">
                      <div className="flex flex-col items-center gap-0.5 text-[#0F172A] font-bold">
                        <Home className="w-2 h-2 sm:w-3 sm:h-3 stroke-[2.5]" />
                        <span>Home</span>
                      </div>
                      {/* Centered Brand Scan Circle */}
                      <div className="w-5 h-5 xs:w-6 xs:h-6 sm:w-7 sm:h-7 rounded-full bg-[#0F172A] text-white flex items-center justify-center shadow-md -mt-2 sm:-mt-3 border-2 border-white">
                        <Camera className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5" />
                      </div>
                      <div className="flex flex-col items-center gap-0.5">
                        <User className="w-2 h-2 sm:w-3 sm:h-3" />
                        <span>Profile &amp; Settings</span>
                      </div>
                    </div>

                    {/* Bottom Safari Bar */}
                    <div className="bg-slate-100 px-2 sm:px-3 py-0.5 sm:py-1 flex items-center justify-between text-[6.5px] xs:text-[7px] sm:text-[8px] text-slate-500 border-t border-slate-200">
                      <span>‹</span>
                      <span className="font-mono text-[6.5px] xs:text-[7px] sm:text-[8px] text-slate-600 font-medium">reva.in</span>
                      <span>…</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* ========================================================================= */}
              {/* IPHONE 3 (RIGHT / BEHIND): Redeem Reward with Caramel Latte Photo */}
              {/* ========================================================================= */}
              <div
                className="hero-anim-iphone-right absolute left-1/2 translate-x-[-8%] sm:translate-x-[-8%] lg:translate-x-[-10%] top-2 xs:top-3 sm:top-4 rotate-[15deg] lg:rotate-[16deg] z-10 origin-bottom-left transition-transform duration-300 hover:z-30 hover:rotate-[10deg] cursor-pointer"
              >
                <div className="animate-iphone-right w-[145px] xs:w-[175px] sm:w-[255px] lg:w-[270px] h-[320px] xs:h-[380px] sm:h-[530px] lg:h-[560px] rounded-[24px] xs:rounded-[30px] sm:rounded-[42px] border-[2px] xs:border-[2.5px] sm:border-[3.5px] border-[#18181b] bg-[#18181b] iphone-frame-shadow relative overflow-hidden">
                  {/* Physical Side Buttons */}
                  <div className="w-[2px] sm:w-[3px] h-2.5 sm:h-3.5 bg-[#3f3f46] rounded-l-xs absolute -left-[2px] sm:-left-[3px] top-12 sm:top-16" />
                  <div className="w-[2px] sm:w-[3px] h-5 sm:h-7 bg-[#3f3f46] rounded-l-xs absolute -left-[2px] sm:-left-[3px] top-18 sm:top-23" />
                  <div className="w-[2px] sm:w-[3px] h-5 sm:h-7 bg-[#3f3f46] rounded-l-xs absolute -left-[2px] sm:-left-[3px] top-26 sm:top-33" />
                  <div className="w-[2px] sm:w-[3px] h-7 sm:h-10 bg-[#3f3f46] rounded-r-xs absolute -right-[2px] sm:-right-[3px] top-18 sm:top-23" />

                  {/* Inner Screen */}
                  <div className="rounded-[22px] xs:rounded-[28px] sm:rounded-[39px] overflow-hidden bg-white text-slate-900 flex flex-col justify-between h-full relative">
                    {/* Top Midnight Header */}
                    <div className="bg-[#0F172A] text-white p-2 xs:p-2.5 sm:p-3 pt-1.5 xs:pt-2 pb-2.5 xs:pb-3 sm:pb-3.5 rounded-b-xl xs:rounded-b-2xl shadow-xs text-left">
                      {/* iOS Status Bar */}
                      <div className="flex justify-between items-center text-[6px] xs:text-[7px] sm:text-[9px] font-semibold text-white/90 px-1 mb-1 sm:mb-2">
                        <span className="font-mono">1:46</span>
                        <div className="flex items-center gap-0.5 sm:gap-1">
                          <span className="text-[5px] xs:text-[6px] sm:text-[8px] font-mono">5G</span>
                          <div className="w-2.5 sm:w-3.5 h-1.5 sm:h-2 border border-white/80 rounded-2xs p-0.2 sm:p-0.5 flex items-center">
                            <div className="h-full w-full bg-white rounded-3xs" />
                          </div>
                        </div>
                      </div>

                      <h3 className="font-display font-black text-[10px] xs:text-xs sm:text-base text-white leading-tight">
                        Redeem Reward
                      </h3>
                      <p className="text-[6px] xs:text-[7px] sm:text-[8px] text-slate-300">Show to merchant</p>
                    </div>

                    {/* Body Content: Free Caramel Latte Card */}
                    <div className="p-2 sm:p-3 flex-1 flex flex-col justify-between text-left space-y-1 sm:space-y-2">
                      <div>
                        <div className="text-[5.5px] xs:text-[6.5px] sm:text-[7px] font-bold text-[#0F172A] uppercase font-mono tracking-wider">
                          PREMIUM COFFEE CO.
                        </div>
                        <h4 className="font-display font-black text-[9px] xs:text-[10px] sm:text-sm text-slate-900 leading-tight">
                          Free Caramel Latte
                        </h4>
                      </div>

                      {/* Gourmet Product Image */}
                      <div className="w-full h-16 xs:h-20 sm:h-32 rounded-xl sm:rounded-2xl overflow-hidden bg-stone-100 shadow-xs">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src="/images/caramel_latte.jpg"
                          alt="Free Caramel Latte"
                          className="w-full h-full object-cover"
                        />
                      </div>

                      {/* CTA Button */}
                      <div>
                        <button className="w-full py-1 xs:py-1.5 sm:py-2.5 rounded-lg sm:rounded-xl bg-[#0F172A] hover:bg-black active:scale-95 text-white font-display font-extrabold text-[7.5px] xs:text-[9px] sm:text-[11px] uppercase tracking-wider shadow-md transition-all">
                          CLAIM REWARD
                        </button>
                        <p className="text-[5px] xs:text-[6px] sm:text-[7px] text-slate-400 text-center mt-0.5 sm:mt-1 leading-tight">
                          Show screen to merchant to complete redemption.
                        </p>
                      </div>
                    </div>

                    {/* Bottom Home Indicator */}
                    <div className="w-12 sm:w-20 h-0.5 sm:h-1 bg-slate-300 rounded-full mx-auto mb-1 shrink-0" />
                  </div>
                </div>
              </div>

              {/* ========================================================================= */}
              {/* FLOATING FROSTED GLASS BADGE 1: GROWTH - 40% More Repeats (Top Right) */}
              {/* ========================================================================= */}
              <div className="absolute -right-2 xs:right-0 sm:right-[0%] lg:right-[3%] top-[8%] xs:top-[10%] sm:top-[12%] z-40 animate-float-pill-1 pointer-events-none scale-[0.68] xs:scale-80 sm:scale-100 origin-top-right">
                <div className="bg-white/95 backdrop-blur-md rounded-2xl p-1.5 px-2.5 sm:p-2 sm:px-3.5 shadow-[0_12px_30px_-4px_rgba(0,0,0,0.22)] border border-white/90 flex items-center gap-2 sm:gap-2.5 select-none">
                  <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-xs shrink-0">
                    <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4 stroke-[2.5]" />
                  </div>
                  <div className="text-left">
                    <div className="text-[7px] sm:text-[9px] font-mono font-bold text-blue-600 uppercase tracking-wider">
                      GROWTH
                    </div>
                    <div className="font-display font-bold text-[9px] sm:text-xs text-slate-900 leading-tight whitespace-nowrap">
                      40% More Repeats
                    </div>
                  </div>
                </div>
              </div>

              {/* ========================================================================= */}
              {/* FLOATING FROSTED GLASS BADGE 2: PROFIT - Boost Revenue (Bottom Left) */}
              {/* ========================================================================= */}
              <div className="absolute -left-2 xs:left-0 sm:left-[0%] lg:left-[3%] bottom-[16%] xs:bottom-[18%] sm:bottom-[16%] z-40 animate-float-pill-2 pointer-events-none scale-[0.68] xs:scale-80 sm:scale-100 origin-bottom-left">
                <div className="bg-white/95 backdrop-blur-md rounded-2xl p-1.5 px-2.5 sm:p-2 sm:px-3.5 shadow-[0_12px_30px_-4px_rgba(0,0,0,0.22)] border border-white/90 flex items-center gap-2 sm:gap-2.5 select-none">
                  <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center text-white shadow-xs shrink-0">
                    <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4 stroke-[2.5]" />
                  </div>
                  <div className="text-left">
                    <div className="text-[7px] sm:text-[9px] font-mono font-bold text-amber-600 uppercase tracking-wider">
                      PROFIT
                    </div>
                    <div className="font-display font-bold text-[9px] sm:text-xs text-slate-900 leading-tight whitespace-nowrap">
                      Boost Revenue
                    </div>
                  </div>
                </div>
              </div>

              {/* ========================================================================= */}
              {/* FLOATING FROSTED GLASS BADGE 3: SUCCESS! - +1 Stamp Added (Bottom Right) */}
              {/* ========================================================================= */}
              <div className="absolute -right-1 xs:right-2 sm:right-[4%] lg:right-[6%] bottom-[4%] sm:bottom-[6%] z-40 animate-float-pill-3 pointer-events-none scale-[0.68] xs:scale-80 sm:scale-100 origin-bottom-right">
                <div className="bg-white/95 backdrop-blur-md rounded-2xl p-1.5 px-2.5 sm:p-2 sm:px-3.5 shadow-[0_12px_30px_-4px_rgba(0,0,0,0.22)] border border-white/90 flex items-center gap-2 select-none">
                  <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-xl bg-emerald-500 flex items-center justify-center text-white shadow-xs shrink-0">
                    <Check className="w-3 h-3 sm:w-4 sm:h-4 stroke-[3]" />
                  </div>
                  <div className="text-left">
                    <div className="text-[7px] sm:text-[9px] font-mono font-bold text-emerald-600 uppercase tracking-wider">
                      SUCCESS!
                    </div>
                    <div className="font-display font-bold text-[9px] sm:text-xs text-slate-900 leading-tight whitespace-nowrap">
                      +1 Stamp Added
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 3. THE CORE PROBLEM */}
      {/* ========================================================================= */}
      <section id="problem" className="py-16 sm:py-24 px-4 sm:px-10 border-t border-slate-100 bg-white">
        <div className="max-w-5xl w-full mx-auto space-y-12 sm:space-y-16">
          <div className="text-center max-w-3xl mx-auto space-y-3 sm:space-y-4">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-600 text-xs font-mono font-semibold">
              <span>WHY REGULARS LEAVE</span>
            </div>
            <h2 className="font-display font-bold text-2xl sm:text-5xl text-[#0F172A] tracking-tight">
              7 in 10 first-time guests never come back
            </h2>
            <p className="font-body text-sm sm:text-base text-slate-600 leading-relaxed max-w-2xl mx-auto">
              You know your regulars when they walk in. But you don&apos;t notice when they stop coming. By the time you do, they are eating somewhere else.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
            <div className="rounded-3xl p-6 sm:p-8 border border-slate-200/80 bg-slate-50/50 card-soft-shadow space-y-4">
              <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-sm">
                01
              </div>
              <h3 className="font-display font-bold text-lg sm:text-xl text-[#0F172A]">Paper cards don&apos;t work</h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-body">
                <b>82% get lost in pockets.</b> They give you no phone numbers, no visit data, and no way to reach customers who go missing.
              </p>
            </div>

            <div className="rounded-3xl p-6 sm:p-8 border border-slate-200/80 bg-slate-50/50 card-soft-shadow space-y-4">
              <div className="w-10 h-10 rounded-2xl bg-rose-100 text-rose-800 flex items-center justify-center font-bold text-sm">
                02
              </div>
              <h3 className="font-display font-bold text-lg sm:text-xl text-[#0F172A]">Apps are too much effort</h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-body">
                <b>94% of guests refuse to download an app</b> while waiting in line for coffee. Your loyalty program dies before it starts.
              </p>
            </div>

            <div className="rounded-3xl p-6 sm:p-8 border border-slate-200/80 bg-slate-50/50 card-soft-shadow space-y-4">
              <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-sm">
                03
              </div>
              <h3 className="font-display font-bold text-lg sm:text-xl text-[#0F172A]">Reva is simple</h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-body">
                <b>Customer scans a QR in 3 seconds</b> and the pass saves in their phone browser or Apple Wallet. When they stop visiting, you send a WhatsApp message.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 4. HOW IT WORKS (3 Simple Steps) */}
      {/* ========================================================================= */}
      <section id="how-it-works" className="py-16 sm:py-24 px-4 sm:px-10 max-w-6xl w-full mx-auto space-y-12 sm:space-y-16">
        <div className="text-center max-w-2xl mx-auto space-y-3 sm:space-y-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-600 text-xs font-mono font-semibold">
            <span>3 SIMPLE STEPS</span>
          </div>
          <h2 className="font-display font-bold text-2xl sm:text-5xl text-[#0F172A] tracking-tight">
            How Reva works in 3 steps
          </h2>
          <p className="text-sm sm:text-base text-slate-600 max-w-xl mx-auto font-body">
            Easy for guests and easy for staff. Reva turns one-time visitors into weekly regulars without changing how your cashier works.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
          <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 card-soft-shadow flex flex-col justify-between space-y-6">
            <div className="h-40 sm:h-48 rounded-2xl bg-slate-50 p-6 flex flex-col items-center justify-center border border-slate-100 relative overflow-hidden group">
              <div className="w-14 sm:w-16 h-14 sm:h-16 rounded-2xl bg-white shadow-md flex items-center justify-center text-slate-900 border border-slate-100 group-hover:scale-105 transition-transform">
                <QrCode className="w-7 sm:w-8 h-7 sm:h-8 text-[#0F172A]" />
              </div>
              <span className="text-[11px] font-semibold text-slate-500 mt-3 font-mono">
                Counter QR Stand
              </span>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="font-display font-bold text-lg sm:text-xl text-[#0F172A]">1. Scan or share number</h3>
                <span className="text-xs font-mono font-bold text-slate-400">01</span>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-body">
                Customer scans your counter QR or tells their number. Your cashier checks the order and gives a digital stamp in seconds. No app needed.
              </p>
            </div>
          </div>

          <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 card-soft-shadow flex flex-col justify-between space-y-6">
            <div className="h-40 sm:h-48 rounded-2xl bg-slate-50 p-6 flex flex-col items-center justify-center border border-slate-100 relative overflow-hidden group">
              <div className="w-14 sm:w-16 h-14 sm:h-16 rounded-2xl bg-white shadow-md flex items-center justify-center text-slate-900 border border-slate-100 group-hover:scale-105 transition-transform">
                <TrendingUp className="w-7 sm:w-8 h-7 sm:h-8 text-[#C84E29]" />
              </div>
              <span className="text-[11px] font-semibold text-slate-500 mt-3 font-mono">
                Visit Pattern Tracker
              </span>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="font-display font-bold text-lg sm:text-xl text-[#0F172A]">2. Learn their visit pattern</h3>
                <span className="text-xs font-mono font-bold text-slate-400">02</span>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-body">
                Reva tracks how often each customer visits. For example, Aarav comes every 3-4 days and Priya comes every week. Reva waits until a customer has visited at least twice.
              </p>
            </div>
          </div>

          <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 card-soft-shadow flex flex-col justify-between space-y-6">
            <div className="h-40 sm:h-48 rounded-2xl bg-slate-50 p-6 flex flex-col items-center justify-center border border-slate-100 relative overflow-hidden group">
              <div className="w-14 sm:w-16 h-14 sm:h-16 rounded-2xl bg-white shadow-md flex items-center justify-center text-slate-900 border border-slate-100 group-hover:scale-105 transition-transform">
                <MessageSquare className="w-7 sm:w-8 h-7 sm:h-8 text-emerald-600" />
              </div>
              <span className="text-[11px] font-semibold text-slate-500 mt-3 font-mono">
                One-Tap WhatsApp Message
              </span>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="font-display font-bold text-lg sm:text-xl text-[#0F172A]">3. Send a comeback message</h3>
                <span className="text-xs font-mono font-bold text-slate-400">03</span>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-body">
                When a customer is late for their usual visit, Reva shows you their name and a ready-made WhatsApp message with a link back to their pass. You just tap send.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 5. INTERACTIVE CALCULATOR */}
      {/* ========================================================================= */}
      <section id="calculator" className="py-16 sm:py-24 px-4 sm:px-10 border-y border-slate-100 bg-slate-50/50">
        <div className="max-w-5xl w-full mx-auto space-y-10 sm:space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-slate-200 text-slate-700 text-xs font-mono font-semibold shadow-xs">
              <Percent className="w-3.5 h-3.5 text-emerald-600" />
              <span>ESTIMATED REVENUE CALCULATOR</span>
            </div>
            <h2 className="font-display font-bold text-2xl sm:text-4xl text-[#0F172A] tracking-tight">
              How much money are quiet customers costing you?
            </h2>
            <p className="text-xs sm:text-base text-slate-600 font-body">
              Move the sliders to see a rough estimate of the money you could win back each month.
            </p>
          </div>

          <div className="bg-white rounded-3xl p-5 sm:p-10 border border-slate-200 card-soft-shadow grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center">
            <div className="lg:col-span-6 space-y-6 sm:space-y-8">
              <div className="space-y-2.5 sm:space-y-3">
                <div className="flex justify-between items-center text-xs sm:text-sm font-semibold">
                  <span className="text-slate-700">Average Daily Customers</span>
                  <span className="font-display text-sm sm:text-lg font-bold text-[#0F172A] bg-slate-100 px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-full">
                    {dailyFootfall} customers / day
                  </span>
                </div>
                <input
                  type="range"
                  min="30"
                  max="500"
                  step="10"
                  value={dailyFootfall}
                  onChange={(e) => setDailyFootfall(Number(e.target.value))}
                  className="w-full h-2 bg-slate-200 rounded-lg cursor-pointer accent-[#0F172A]"
                />
                <div className="flex justify-between text-[9px] sm:text-[11px] text-slate-400 font-mono">
                  <span>30 (Small café)</span>
                  <span>250 (Busy café)</span>
                  <span>500 (Big restaurant)</span>
                </div>
              </div>

              <div className="space-y-2.5 sm:space-y-3">
                <div className="flex justify-between items-center text-xs sm:text-sm font-semibold">
                  <span className="text-slate-700">Average Order Value (AOV)</span>
                  <span className="font-display text-sm sm:text-lg font-bold text-[#0F172A] bg-slate-100 px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-full">
                    ₹{avgTicket}
                  </span>
                </div>
                <input
                  type="range"
                  min="100"
                  max="1500"
                  step="25"
                  value={avgTicket}
                  onChange={(e) => setAvgTicket(Number(e.target.value))}
                  className="w-full h-2 bg-slate-200 rounded-lg cursor-pointer accent-[#0F172A]"
                />
                <div className="flex justify-between text-[9px] sm:text-[11px] text-slate-400 font-mono">
                  <span>₹100 (Quick bites)</span>
                  <span>₹350 (Artisan café)</span>
                  <span>₹1,500 (Dining)</span>
                </div>
              </div>

              <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-50 border border-slate-100 text-[11px] sm:text-xs text-slate-600 leading-relaxed font-body">
                💡 <b>Methodology</b>: Estimate based on 25% regular customers, 10% leaving each month, and 28% coming back after a WhatsApp message. Real results may differ.
              </div>
            </div>

            <div className="lg:col-span-6 bg-[#0F172A] text-white rounded-2xl p-5 sm:p-8 space-y-5 sm:space-y-6 shadow-xl">
              <div>
                <span className="text-[10px] sm:text-xs font-mono text-emerald-400 uppercase tracking-wider font-semibold">
                  ESTIMATED MONTHLY VALUE RECOVERED
                </span>
                <div className="font-display text-3xl sm:text-5xl font-bold mt-1 text-white">
                  +₹{calculatedROI.monthlyRevenue.toLocaleString('en-IN')}
                  <span className="text-[10px] sm:text-xs font-sans text-slate-400 font-normal"> / month (estimate)</span>
                </div>
                <p className="text-[11px] sm:text-xs text-slate-300 mt-1">
                  Equals <b>+₹{calculatedROI.annualRevenue.toLocaleString('en-IN')}/year</b> in estimated recovered revenue.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:gap-4 pt-3 sm:pt-4 border-t border-slate-800 text-xs font-mono">
                <div>
                  <span className="text-slate-400 block text-[9px] sm:text-[10px]">ESTIMATED RECOVERED REGULARS</span>
                  <span className="text-sm sm:text-lg font-bold text-white">~{calculatedROI.recoveredRegulars} guests / mo</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[9px] sm:text-[10px]">ESTIMATED RETURN</span>
                  <span className="text-sm sm:text-lg font-bold text-emerald-400">{calculatedROI.roiMultiplier}× on Reva</span>
                </div>
              </div>

              <Link
                href="/login?mode=register&trial=true"
                className="w-full py-3 sm:py-3.5 rounded-full bg-white text-slate-900 font-semibold text-xs text-center transition-all hover:bg-slate-100 block cursor-pointer shadow-xs uppercase tracking-wide"
              >
                Start 3-Day Free Trial
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 6. THE WIN-BACK SYSTEM */}
      {/* ========================================================================= */}
      <section id="winback" className="py-16 sm:py-24 px-4 sm:px-10 border-t border-slate-100 bg-white">
        <div className="max-w-6xl w-full mx-auto grid grid-cols-1 lg:grid-cols-12 gap-10 sm:gap-12 lg:gap-16 items-center">
          {/* Left Column: Clear Explanation & Formula */}
          <div className="lg:col-span-7 space-y-5 sm:space-y-6 text-left">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-100 border border-slate-200/80 text-slate-800 text-xs font-mono font-bold shadow-2xs">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>WHATSAPP COMEBACK SYSTEM</span>
            </div>

            <h2 className="font-display font-bold text-2xl sm:text-5xl text-[#0F172A] tracking-tight leading-[1.1]">
              Bring back the right customer at the right time
            </h2>

            <p className="text-slate-600 text-xs sm:text-base leading-relaxed max-w-xl font-body">
              Old paper cards just wait. Reva watches each customer&apos;s visit pattern and tells you who to message before they leave for good.
            </p>

            {/* Dynamic Cadence Math Box */}
            <div className="p-4 sm:p-5 rounded-3xl bg-slate-50 border border-slate-200/80 card-soft-shadow space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] sm:text-[11px] font-mono font-bold uppercase tracking-wider text-slate-400">
                  Visit Pattern Formula
                </span>
                <span className="text-[9px] sm:text-[10px] font-mono font-bold bg-emerald-100 text-emerald-800 px-2 sm:px-2.5 py-0.5 rounded-full">
                  Custom Timing
                </span>
              </div>
              <div className="p-3 sm:p-3.5 bg-white rounded-2xl border border-slate-200/90 text-[11px] sm:text-xs font-mono font-bold text-[#0F172A] shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                <span>Message time = Last visit + (Usual gap × 1.5)</span>
                <span className="text-[9px] sm:text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md font-semibold w-fit">
                  Smart Timing
                </span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed font-body">
                If <b>Aarav</b> usually visits every 3.5 days, Reva flags him on day 5. If <b>Priya</b> visits every 14 days, Reva waits until day 21.
              </p>
            </div>

            {/* 4 Clean Safeguard Points */}
            <div className="space-y-2.5 sm:space-y-3 pt-1">
              <div className="flex items-start gap-2.5 sm:gap-3">
                <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                </div>
                <p className="text-xs text-slate-600 leading-normal">
                  <b className="text-[#0F172A]">First-timer protection:</b> Only customers with 2 or more visits are tracked.
                </p>
              </div>

              <div className="flex items-start gap-2.5 sm:gap-3">
                <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                </div>
                <p className="text-xs text-slate-600 leading-normal">
                  <b className="text-[#0F172A]">7-day pause:</b> One message per customer per week so nobody gets spammed.
                </p>
              </div>

              <div className="flex items-start gap-2.5 sm:gap-3">
                <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                </div>
                <p className="text-xs text-slate-600 leading-normal">
                  <b className="text-[#0F172A]">Real money tracking:</b> Every returning customer shows the ₹ you earned in your dashboard.
                </p>
              </div>

              <div className="flex items-start gap-2.5 sm:gap-3">
                <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                </div>
                <p className="text-xs text-slate-600 leading-normal">
                  <b className="text-[#0F172A]">One-tap send:</b> Ready message opens in WhatsApp. You only press send.
                </p>
              </div>
            </div>
          </div>

          {/* Right Column: High-Fidelity WhatsApp Simulation Mockup */}
          <div className="lg:col-span-5 flex justify-center">
            <div className="w-full max-w-sm bg-white rounded-[32px] sm:rounded-[36px] p-2.5 sm:p-3 border-2 border-slate-200/90 shadow-xl space-y-2.5">
              {/* WhatsApp Header */}
              <div className="bg-[#008069] text-white rounded-2xl p-2.5 sm:p-3 flex items-center gap-2.5 shadow-2xs">
                <div className="w-8 h-8 rounded-full bg-white text-[#008069] font-bold text-xs flex items-center justify-center shrink-0 shadow-2xs">
                  B
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold text-xs truncate">Boba &amp; Brew Artisan Cafe</span>
                    <span className="text-[10px] bg-white/20 text-white px-1.5 py-0.2 rounded-full shrink-0">
                      ✓
                    </span>
                  </div>
                  <div className="text-[10px] text-emerald-100 truncate">
                    WhatsApp Message Preview
                  </div>
                </div>
              </div>

              {/* WhatsApp Chat Body */}
              <div className="bg-[#EFEAE2] rounded-2xl p-3 sm:p-3.5 space-y-2.5 border border-slate-200/60 relative overflow-hidden">
                {/* Date Chip */}
                <div className="text-center">
                  <span className="text-[9px] font-mono font-bold bg-white/90 text-slate-600 px-2 py-0.5 rounded-md shadow-2xs uppercase">
                    Today
                  </span>
                </div>

                {/* Message Bubble */}
                <div className="bg-white rounded-2xl rounded-tl-xs p-3 sm:p-3.5 text-xs text-slate-800 space-y-2 shadow-xs border border-slate-100">
                  <p className="leading-snug">
                    Hey Priya! 👋 We miss having you at <b>Boba &amp; Brew</b>.
                  </p>
                  <p className="text-slate-600 leading-snug">
                    You&apos;re only <span className="font-bold text-[#0F172A]">2 stamps away</span> from your Free Specialty Beverage!
                  </p>
                  <p className="text-amber-900 bg-amber-50 p-2 rounded-xl border border-amber-200/80 leading-snug font-medium text-[11px]">
                    🥐 Drop by this week and enjoy a <b>Complimentary Almond Croissant</b> with your order!
                  </p>

                  {/* Magic Pass Link Preview */}
                  <Link
                    href="/c/boba-brew"
                    className="block p-2.5 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="min-w-0">
                        <div className="text-[11px] font-bold text-[#0F172A] truncate">
                          Boba &amp; Brew Loyalty Pass
                        </div>
                        <div className="text-[10px] text-emerald-700 font-mono truncate">
                          reva.in/c/boba-brew?offer=CROISSANT
                        </div>
                      </div>
                      <ExternalLink className="w-3.5 h-3.5 text-slate-400 shrink-0 ml-2" />
                    </div>
                  </Link>

                  {/* Timestamp & Double Blue Ticks */}
                  <div className="flex items-center justify-end gap-1 text-[10px] text-slate-400 pt-0.5">
                    <span>11:42 AM</span>
                    <span className="text-sky-500 font-bold">✓✓</span>
                  </div>
                </div>
              </div>

              {/* Bottom Caption */}
              <div className="text-[10px] sm:text-[11px] text-slate-500 text-center font-mono py-1">
                ⚡ Ready-made message. Tap send on WhatsApp.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 7. TRANSPARENT PRICING */}
      {/* ========================================================================= */}
      <section id="pricing" className="py-16 sm:py-24 px-4 sm:px-10 max-w-6xl w-full mx-auto space-y-10 sm:space-y-12">
        <div className="text-center max-w-xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-600 text-xs font-mono font-semibold">
            <span>ANNUAL PLANS</span>
          </div>
          <h2 className="font-display font-bold text-2xl sm:text-5xl text-[#0F172A] tracking-tight">
            Simple, Transparent Pricing
          </h2>
          <p className="text-xs sm:text-base text-slate-600 font-body">
            All plans include full platform access, a 3-day free trial, and zero setup fees. One recovered customer pays for the whole year.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8 font-body items-stretch">
          {/* Plan 1: Starter (₹499 / year) */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 card-soft-shadow space-y-6 flex flex-col justify-between hover:border-slate-300 transition-all">
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-display font-bold text-xl text-[#0F172A]">Starter</h3>
                  <p className="text-xs text-slate-500 mt-0.5">For small cafés &amp; single counters</p>
                </div>
                <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700">
                  Up to 300 regulars
                </span>
              </div>

              <div className="flex items-baseline gap-1.5">
                <span className="font-display text-4xl font-bold text-[#0F172A]">₹499</span>
                <span className="text-xs text-slate-500 font-medium">/ year</span>
              </div>

              <div className="pt-4 border-t border-slate-100 space-y-3 text-xs text-slate-600">
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Digital stamp card &amp; unlimited scans</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>One-tap WhatsApp Win-Back (up to 300 regulars)</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Milestone reward setup</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Print-ready counter QR stand</span>
                </div>
              </div>
            </div>

            <Link
              href="/login?mode=register&plan=starter&trial=true"
              className="w-full py-3.5 rounded-full bg-white hover:bg-slate-50 border border-slate-200 text-[#0F172A] font-semibold text-xs text-center transition-all block uppercase tracking-wider active:scale-98"
            >
              Start 3-Day Free Trial
            </Link>
          </div>

          {/* Plan 2: Growth (₹999 / year - Most Popular) */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border-2 border-[#0F172A] shadow-xl space-y-6 flex flex-col justify-between relative">
            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3.5 py-1 rounded-full bg-[#0F172A] text-white text-[11px] font-semibold tracking-wide uppercase shadow-sm">
              Most Popular
            </div>

            <div className="space-y-5">
              <div className="flex items-center justify-between pt-1">
                <div>
                  <h3 className="font-display font-bold text-xl text-[#0F172A]">Growth</h3>
                  <p className="text-xs text-slate-500 mt-0.5">For busy cafés &amp; popular eateries</p>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700">
                    Best Value
                  </span>
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                    Up to 1,500 regulars
                  </span>
                </div>
              </div>

              <div className="flex items-baseline gap-1.5">
                <span className="font-display text-4xl font-bold text-[#0F172A]">₹999</span>
                <span className="text-xs text-slate-500 font-medium">/ year</span>
              </div>

              <div className="pt-4 border-t border-slate-100 space-y-3 text-xs text-slate-600">
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span><b>Everything in Starter</b></span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>One-tap WhatsApp Win-Back (up to 1,500 regulars)</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Inactive customer list (14+ days) with ready-made messages</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Recovered revenue tracker</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Custom branding on your card</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Priority WhatsApp support</span>
                </div>
              </div>
            </div>

            <Link
              href="/login?mode=register&plan=growth&trial=true"
              className="w-full py-3.5 rounded-full bg-[#0F172A] hover:bg-black text-white font-semibold text-xs text-center transition-all block shadow-md uppercase tracking-wider active:scale-98"
            >
              Start 3-Day Free Trial
            </Link>
          </div>

          {/* Plan 3: Pro (₹1,499 / year) */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 card-soft-shadow space-y-6 flex flex-col justify-between hover:border-slate-300 transition-all">
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-display font-bold text-xl text-[#0F172A]">Pro</h3>
                  <p className="text-xs text-slate-500 mt-0.5">For popular restaurants</p>
                </div>
                <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700">
                  Unlimited regulars
                </span>
              </div>

              <div className="flex items-baseline gap-1.5">
                <span className="font-display text-4xl font-bold text-[#0F172A]">₹1,499</span>
                <span className="text-xs text-slate-500 font-medium">/ year</span>
              </div>

              <div className="pt-4 border-t border-slate-100 space-y-3 text-xs text-slate-600">
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span><b>Everything in Growth</b></span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>One-tap WhatsApp Win-Back (unlimited regulars)</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Multi-cashier PINs &amp; staff activity log</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Customer list export</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Birthday &amp; festival offer messages</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Free setup help on WhatsApp</span>
                </div>
              </div>
            </div>

            <Link
              href="/login?mode=register&plan=pro&trial=true"
              className="w-full py-3.5 rounded-full bg-white hover:bg-slate-50 border border-slate-200 text-[#0F172A] font-semibold text-xs text-center transition-all block uppercase tracking-wider active:scale-98"
            >
              Start 3-Day Free Trial
            </Link>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 8. FAQ SECTION */}
      {/* ========================================================================= */}
      <section id="faq" className="py-16 sm:py-24 px-4 sm:px-10 border-t border-slate-100 bg-slate-50/50">
        <div className="max-w-3xl w-full mx-auto space-y-8 sm:space-y-10 text-left">
          <div className="space-y-2 text-center">
            <h2 className="font-display font-bold text-2xl sm:text-4xl text-[#0F172A] tracking-tight">
              Frequently Asked Questions
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 font-body">
              Clear answers about how Reva works in your store.
            </p>
          </div>

          <div className="space-y-3 font-body">
            {[
              {
                q: 'Do I need a POS integration or new hardware?',
                a: 'No. Reva works alone with counter QR stands. Guests scan with their phone camera. Staff can add stamps from any phone, iPad or POS browser. You do not need to change your POS.',
              },
              {
                q: 'What if I don\'t have a WhatsApp Business account?',
                a: 'No. Normal WhatsApp works. Reva prepares the message and you tap send. You do not need to register developer accounts.',
              },
              {
                q: 'Can customers fake stamps at home?',
                a: 'No. Stamps are added only by your staff using a secret PIN, geofence, or staff scan. Customers cannot give themselves stamps.',
              },
              {
                q: 'How fast can I get this running in my café?',
                a: 'About 3 minutes. Sign up, add your café name and rewards, and print your QR stand. You can place it on your counter today.',
              },
              {
                q: 'How do I know it works?',
                a: 'When a customer returns after your message and scans their pass, the dashboard records it and shows the ₹ they spent.',
              },
            ].map((faq, idx) => (
              <div
                key={idx}
                className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 cursor-pointer transition-all shadow-2xs"
                onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
              >
                <div className="flex items-center justify-between gap-4">
                  <h3 className="font-display font-semibold text-xs sm:text-base text-[#0F172A]">
                    {faq.q}
                  </h3>
                  <ChevronDown
                    className={`w-4 h-4 text-slate-400 shrink-0 transition-transform duration-300 ${
                      openFaq === idx ? 'transform rotate-180 text-slate-900' : ''
                    }`}
                  />
                </div>
                {openFaq === idx && (
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed pt-3 border-t border-slate-100 mt-3">
                    {faq.a}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 9. FINAL CTA & FOOTER */}
      {/* ========================================================================= */}
      <section className="py-16 sm:py-24 px-4 sm:px-10 text-center max-w-3xl mx-auto space-y-5 sm:space-y-6">
        <h2 className="font-display font-bold text-2xl sm:text-5xl text-[#0F172A] tracking-tight">
          Ready to bring your regulars back?
        </h2>
        <p className="text-xs sm:text-base text-slate-600 max-w-xl mx-auto font-body">
          Set up your pass in 3 minutes. Print your counter stand today and start keeping your guests.
        </p>

        <div className="pt-2 flex items-center justify-center">
          <Link
            href="/login?mode=register&trial=true"
            className="w-full sm:w-auto px-8 py-3.5 rounded-full bg-[#0F172A] hover:bg-black text-white font-semibold text-xs sm:text-sm transition-all inline-flex items-center justify-center gap-2 shadow-md cursor-pointer uppercase tracking-wider active:scale-98"
          >
            <span>Start 3-Day Free Trial</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-100 bg-white py-8 sm:py-10 px-4 sm:px-10 text-xs text-slate-500 font-body">
        <div className="max-w-7xl w-full mx-auto flex flex-col sm:flex-row items-center justify-between gap-6 text-center sm:text-left">
          <div className="flex items-center gap-2.5 font-bold text-slate-900">
            <div className="w-6 h-6 flex items-center justify-center text-slate-900">
              <svg viewBox="0 0 24 24" className="w-5 h-5 fill-none stroke-current stroke-2">
                <path d="M12 2v20M2 12h20M4.93 4.93l14.14 14.14M4.93 19.07L19.07 4.93" />
              </svg>
            </div>
            <span className="font-display text-base font-bold text-[#0F172A]">reva.in</span>
            <span className="text-slate-400 font-normal text-xs ml-1 font-mono">
              — Loyalty for cafés &amp; restaurants
            </span>
          </div>

          <div className="flex flex-wrap justify-center sm:justify-start gap-4 sm:gap-6 font-medium">
            <Link href="/dashboard" className="hover:text-slate-900 transition-colors">
              Owner Dashboard
            </Link>
            <Link href="/c/boba-brew" className="hover:text-slate-900 transition-colors">
              Sample Customer Pass
            </Link>
            <Link href="/demo" className="hover:text-slate-900 transition-colors">
              Live Simulator
            </Link>
            <Link href="/login" className="hover:text-slate-900 transition-colors">
              Sign In
            </Link>
          </div>

          <div className="font-mono text-[11px] text-slate-400">
            © {new Date().getFullYear()} Reva Technologies. All rights reserved.
          </div>
        </div>
      </footer>

      {/* Structured Data: FAQ Schema (JSON-LD) for SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
    </div>
  );
}

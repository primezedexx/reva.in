'use client';

// ============================================================================
// REVA (reva.in) — Interactive End-to-End Simulation Showcase (/demo)
// Proves the entire Win-Back & Loyalty Engine live in a 4-step visual sandbox
// Styled with the official Reva Obsidian & Slate Design Hierarchy
// ============================================================================

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Sparkles,
  Zap,
  ArrowRight,
  MessageSquare,
  Smartphone,
  Gift,
  Coffee,
  CheckCircle2,
  TrendingUp,
  RefreshCw,
  Clock,
  Check,
  Store,
  ChevronRight,
  Send,
  ExternalLink,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { sound } from '@/lib/sound';

export default function DemoSimulationPage() {
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1);
  const [isFiringEngine, setIsFiringEngine] = useState(false);
  const [isScanningStamp, setIsScanningStamp] = useState(false);

  // Custom User Inputs (Can test with their actual number)
  const [testName, setTestName] = useState('Aarav Sharma');
  const [testPhone, setTestPhone] = useState('+91 98765 43210');
  const [isCustomNumber, setIsCustomNumber] = useState(false);

  // Live Simulated State
  const [stamps, setStamps] = useState(4);
  const [recoveredRevenue, setRecoveredRevenue] = useState(560);
  const [convertedCount, setConvertedCount] = useState(2);
  const [nudgeDispatched, setNudgeDispatched] = useState(false);
  const [wasConverted, setWasConverted] = useState(false);

  // Host URL
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://siplo.in';
  const cleanPhone = testPhone.replace(/\D/g, '');
  const offerCode = `WINBACK-${testName.replace(/\s+/g, '').toUpperCase().slice(0, 5)}-${Math.floor(1000 + Math.random() * 9000)}`;
  const magicCardUrl = `${baseUrl}/c/boba-brew?phone=${encodeURIComponent(testPhone)}&offer=${encodeURIComponent(offerCode)}`;
  const whatsappMessageText = `Hey ${testName}! 👋 We miss seeing you at Boba & Brew Artisan Cafe ☕\n\nYou're only 2 stamps away from your Free Specialty Beverage!\n\n🎁 *Special Treat:* Complimentary Belgian Waffle with any drink today!\n\nShow your digital card at the counter:\n👉 ${magicCardUrl}\n\nSee you soon! ✨`;

  // Step 2 Action: Trigger WhatsApp Nudge
  async function handleFireWinback() {
    setIsFiringEngine(true);
    sound.playClick();

    // Call real API
    await fetch('/api/winback/run', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        businessId: '11111111-1111-1111-1111-111111111111',
        forceIgnoreCooldown: true,
      }),
    });

    setTimeout(() => {
      setIsFiringEngine(false);
      setNudgeDispatched(true);
      setCurrentStep(3);
      sound.playStampPop();
    }, 600);
  }

  // Step 4 Action: Simulate Customer Scan at Counter
  async function handleSimulateScan() {
    setIsScanningStamp(true);
    sound.playStampPop();

    // Call stamp API
    await fetch('/api/stamp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        businessId: '11111111-1111-1111-1111-111111111111',
        phone: testPhone,
        name: testName,
        spendAmount: 280,
        stampAwarded: 1,
      }),
    });

    setTimeout(() => {
      setIsScanningStamp(false);
      setStamps((prev) => Math.min(6, prev + 1));
      setRecoveredRevenue((prev) => prev + 280);
      setConvertedCount((prev) => prev + 1);
      setWasConverted(true);
      sound.playRewardFanfare();
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.6 },
      });
      setCurrentStep(4);
    }, 500);
  }

  function handleResetDemo() {
    sound.playClick();
    setCurrentStep(1);
    setStamps(4);
    setRecoveredRevenue(560);
    setConvertedCount(2);
    setNudgeDispatched(false);
    setWasConverted(false);
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] flex flex-col font-sans antialiased">
      {/* Top Bar */}
      <nav className="bg-white border-b border-slate-200/80 px-4 sm:px-8 py-3.5 flex items-center justify-between shadow-2xs">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-7 h-7 flex items-center justify-center text-slate-900 group-hover:rotate-45 transition-transform duration-500">
            <svg viewBox="0 0 24 24" className="w-6 h-6 fill-none stroke-current stroke-[2.2]">
              <path d="M12 2v20M2 12h20M4.93 4.93l14.14 14.14M4.93 19.07L19.07 4.93" />
            </svg>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="font-display text-xl font-bold tracking-tight text-[#0F172A]">Siplo</span>
            <span className="text-slate-400 font-display font-medium text-base">.in</span>
          </div>
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200 ml-2">
            Live Sandbox
          </span>
        </Link>

        <div className="flex items-center gap-3">
          <button
            onClick={handleResetDemo}
            className="text-xs font-semibold px-3.5 py-1.5 rounded-full border border-slate-200 hover:bg-slate-100 transition-colors flex items-center gap-1.5 cursor-pointer text-slate-700"
          >
            <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
            <span>Reset Demo</span>
          </button>

          <Link
            href="/dashboard"
            className="text-xs font-semibold px-4 py-2 rounded-full bg-[#0F172A] text-white hover:bg-black transition-all shadow-xs"
          >
            Open Dashboard
          </Link>
        </div>
      </nav>

      {/* Main Container */}
      <main className="max-w-6xl w-full mx-auto p-4 sm:p-8 flex-1 flex flex-col space-y-8">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <span className="text-xs font-mono font-bold uppercase tracking-widest text-slate-500">
            Interactive Proof Walkthrough
          </span>
          <h1 className="font-display text-3xl sm:text-4xl font-bold text-[#0F172A] tracking-tight">
            How Siplo Rescues Churned Revenue in 4 Steps
          </h1>
          <p className="text-xs sm:text-sm text-slate-600">
            Test with our sample customer (Aarav) or <b className="text-[#0F172A]">type your actual mobile number</b> below to receive a real WhatsApp nudge on your physical phone!
          </p>
        </div>

        {/* 4 Step Progress Pills */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div
            className={`p-3.5 rounded-2xl border text-xs font-bold transition-all ${
              currentStep === 1
                ? 'bg-[#0F172A] text-white border-[#0F172A] shadow-sm'
                : 'bg-white text-slate-600 border-slate-200/80 shadow-2xs'
            }`}
          >
            <div className="text-[10px] opacity-75 mb-0.5 font-mono">STEP 1</div>
            <div>Find Inactive Customer</div>
          </div>

          <div
            className={`p-3.5 rounded-2xl border text-xs font-bold transition-all ${
              currentStep === 2
                ? 'bg-[#0F172A] text-white border-[#0F172A] shadow-sm'
                : 'bg-white text-slate-600 border-slate-200/80 shadow-2xs'
            }`}
          >
            <div className="text-[10px] opacity-75 mb-0.5 font-mono">STEP 2</div>
            <div>Send WhatsApp Offer</div>
          </div>

          <div
            className={`p-3.5 rounded-2xl border text-xs font-bold transition-all ${
              currentStep === 3
                ? 'bg-[#0F172A] text-white border-[#0F172A] shadow-sm'
                : 'bg-white text-slate-600 border-slate-200/80 shadow-2xs'
            }`}
          >
            <div className="text-[10px] opacity-75 mb-0.5 font-mono">STEP 3</div>
            <div>Customer Opens Offer</div>
          </div>

          <div
            className={`p-3.5 rounded-2xl border text-xs font-bold transition-all ${
              currentStep === 4
                ? 'bg-emerald-700 text-white border-emerald-700 shadow-sm'
                : 'bg-white text-slate-600 border-slate-200/80 shadow-2xs'
            }`}
          >
            <div className="text-[10px] opacity-75 mb-0.5 font-mono">STEP 4</div>
            <div>Customer Orders & Extra Sale</div>
          </div>
        </div>

        {/* Main Interactive Stage Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Interactive Scenario Controller */}
          <div className="lg:col-span-6 bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-2xs space-y-6">
            {/* STEP 1 */}
            {currentStep === 1 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold text-amber-800 bg-amber-50 px-3 py-1.5 rounded-xl border border-amber-200">
                    <Clock className="w-3.5 h-3.5 text-amber-600" />
                    <span>Customer Cadence Exceeded</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setIsCustomNumber(!isCustomNumber);
                      if (!isCustomNumber) {
                        setTestName('My Name');
                        setTestPhone('+91 ');
                      } else {
                        setTestName('Aarav Sharma');
                        setTestPhone('+91 98765 43210');
                      }
                    }}
                    className="text-xs font-bold text-[#0F172A] hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Smartphone className="w-3.5 h-3.5 text-[#0F172A]" />
                    <span>{isCustomNumber ? 'Use Demo Default' : '⚡ Use My Actual Number'}</span>
                  </button>
                </div>

                <h3 className="font-display text-xl font-bold text-[#0F172A]">
                  {isCustomNumber ? 'Testing with Your Actual Phone' : 'Meet Aarav Sharma'}
                </h3>

                {isCustomNumber ? (
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Your Mobile Number (with country code):
                      </label>
                      <input
                        type="tel"
                        value={testPhone}
                        onChange={(e) => setTestPhone(e.target.value)}
                        placeholder="+91 98765 43210"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-xs font-mono font-bold focus:outline-none focus:ring-2 focus:ring-[#0F172A]"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Your Name:
                      </label>
                      <input
                        type="text"
                        value={testName}
                        onChange={(e) => setTestName(e.target.value)}
                        placeholder="e.g. Rahul"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-xs font-bold focus:outline-none focus:ring-2 focus:ring-[#0F172A]"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs space-y-2">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Phone:</span>
                      <b className="font-mono text-[#0F172A]">{testPhone}</b>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Current Stamps:</span>
                      <b className="text-[#0F172A]">4 of 6 Collected</b>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Normal Visit Cadence:</span>
                      <b className="text-slate-900">Every 3.5 Days</b>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Days Since Last Visit:</span>
                      <b className="text-amber-800 font-bold">12 Days (7 days overdue!)</b>
                    </div>
                  </div>
                )}

                <p className="text-xs text-slate-600 leading-relaxed">
                  {testName} hasn&apos;t visited in 12 days. Siplo detects the lapse and prepares a high-converting win-back nudge.
                </p>

                <button
                  onClick={() => {
                    sound.playClick();
                    setCurrentStep(2);
                  }}
                  className="w-full py-3.5 rounded-xl bg-[#0F172A] text-white font-bold text-xs sm:text-sm hover:bg-black transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md"
                >
                  <span>Step 2: Let Siplo Send a Win-Back Nudge</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* STEP 2 */}
            {currentStep === 2 && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-xs font-bold text-[#0F172A] bg-slate-100 px-3 py-1.5 rounded-xl w-fit">
                  <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                  <span>One-Tap WhatsApp Dispatch</span>
                </div>

                <h3 className="font-display text-xl font-bold text-[#0F172A]">Daily Cron Engine Activation</h3>

                <p className="text-xs text-slate-600 leading-relaxed">
                  Siplo’s daily cron detects that {testName} is overdue. It crafts a personalized WhatsApp message with their stamp progress (2 left!) and a free Belgian Waffle offer.
                </p>

                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 font-mono text-xs text-slate-700 space-y-1.5">
                  <div className="text-[10px] uppercase font-bold text-slate-400">Generated Payload:</div>
                  <div>To: {testPhone} ({testName})</div>
                  <div>Offer: Complimentary Belgian Waffle</div>
                  <div className="truncate text-slate-500">Magic Link: {magicCardUrl}</div>
                </div>

                <button
                  onClick={handleFireWinback}
                  disabled={isFiringEngine}
                  className="w-full py-3.5 rounded-xl bg-[#0F172A] text-white font-bold text-xs sm:text-sm hover:bg-black transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md"
                >
                  {isFiringEngine ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin text-white" />
                      <span>Processing Engine Dispatch...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>Dispatch WhatsApp Nudge</span>
                    </>
                  )}
                </button>
              </div>
            )}

            {/* STEP 3 */}
            {currentStep === 3 && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-xs font-bold text-blue-700 bg-blue-50 px-3 py-1.5 rounded-xl w-fit">
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>WhatsApp Message Ready</span>
                </div>

                <h3 className="font-display text-xl font-bold text-[#0F172A]">{testName} Receives WhatsApp Nudge</h3>

                <p className="text-xs text-slate-600 leading-relaxed">
                  The message has been prepared and logged in Siplo! You can open it right on your phone via real WhatsApp, or proceed to simulate the counter scan.
                </p>

                {/* Direct Real WhatsApp Launcher Button */}
                <a
                  href={`https://wa.me/${cleanPhone}?text=${encodeURIComponent(whatsappMessageText)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3.5 rounded-xl bg-[#25D366] hover:bg-[#1EBE5D] text-white font-bold text-xs sm:text-sm transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
                >
                  <MessageSquare className="w-4 h-4 text-white" />
                  <span>📱 Send Real WhatsApp to {testPhone}</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>

                <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-800 font-semibold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Customer has entered your store with their digital card!</span>
                </div>

                <button
                  onClick={handleSimulateScan}
                  disabled={isScanningStamp}
                  className="w-full py-3.5 rounded-xl bg-[#0F172A] text-white font-bold text-xs sm:text-sm hover:bg-black transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md"
                >
                  {isScanningStamp ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Coffee className="w-4 h-4 text-amber-400" />
                      <span>Scan QR at Counter & Punch Stamp (+1)</span>
                    </>
                  )}
                </button>
              </div>
            )}

            {/* STEP 4 */}
            {currentStep === 4 && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-xl w-fit">
                  <Check className="w-3.5 h-3.5" />
                  <span>Attribution Confirmed</span>
                </div>

                <h3 className="font-display text-xl font-bold text-[#0F172A]">🎉 +₹280 Recovered Revenue!</h3>

                <p className="text-xs text-slate-600 leading-relaxed">
                  When the counter staff punched the stamp, Siplo matched the scan against {testName}&apos;s open WhatsApp log, marking <b>converted = true</b> and updating your dashboard revenue in real-time.
                </p>

                <div className="p-4 bg-[#0F172A] text-white rounded-2xl shadow-md text-xs space-y-1">
                  <div className="font-bold text-sm text-amber-400">Hard Proof Recorded:</div>
                  <div>• whatsapp_logs.converted = TRUE</div>
                  <div>• Total Recovered Revenue: ₹{recoveredRevenue}</div>
                  <div>• {testName}&apos;s Next Stamp: {stamps} / 6 (1 more to Free Drink!)</div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={handleResetDemo}
                    className="flex-1 py-3 rounded-xl border border-slate-200 text-xs font-bold hover:bg-slate-50 cursor-pointer text-slate-700"
                  >
                    Run Demo Again
                  </button>
                  <Link
                    href="/dashboard"
                    className="flex-1 py-3 rounded-xl bg-[#0F172A] text-white text-xs font-bold text-center hover:bg-black flex items-center justify-center gap-1 shadow-sm"
                  >
                    <span>View Real Dashboard</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Simulated Mobile Phone Device & Live Dashboard Preview */}
          <div className="lg:col-span-6 space-y-6">
            {/* Live Metrics Widget */}
            <div className="bg-[#0F172A] text-white rounded-3xl p-6 shadow-xl border border-slate-800 space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="font-mono uppercase text-[11px]">Live Dashboard Metric:</span>
                <span className="text-emerald-400 font-bold flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  Live Sync
                </span>
              </div>

              <div className="flex items-baseline gap-2">
                <div className="text-4xl font-display font-black text-amber-400">₹{recoveredRevenue}</div>
                <div className="text-xs font-medium text-slate-300">
                  recovered from <b className="text-white">{convertedCount}</b> conversions
                </div>
              </div>
            </div>

            {/* Simulated Mobile Phone View */}
            <div className="w-full max-w-sm mx-auto bg-slate-950 rounded-[38px] p-3.5 shadow-2xl border-[3px] border-slate-800">
              <div className="bg-[#0b141a] rounded-[28px] overflow-hidden text-white min-h-[380px] flex flex-col justify-between p-4 relative">
                {/* Simulated Phone Top Header */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-800 text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-[#0F172A] border border-slate-700 text-white flex items-center justify-center font-bold text-[11px]">
                      <svg viewBox="0 0 24 24" className="w-4 h-4 fill-none stroke-current stroke-2">
                        <path d="M12 2v20M2 12h20M4.93 4.93l14.14 14.14M4.93 19.07L19.07 4.93" />
                      </svg>
                    </div>
                    <div>
                      <div className="font-bold text-[11px] text-white">Boba & Brew Cafe</div>
                      <div className="text-[9px] text-slate-400">Official Business Account</div>
                    </div>
                  </div>
                  <span className="text-[9px] text-slate-400 font-mono">1:04 PM</span>
                </div>

                {/* Simulated WhatsApp Bubble */}
                <div className="py-4 space-y-3">
                  {currentStep >= 2 ? (
                    <div className="bg-[#005c4b] p-3 rounded-2xl rounded-tl-none max-w-[85%] text-xs space-y-2 text-white shadow-md animate-stamp">
                      <p>
                        Hey {testName}! 👋 We miss seeing you at <b>Boba & Brew Artisan Cafe</b> ☕
                      </p>
                      <p className="text-[11px] text-slate-200">
                        You&apos;re only <b>2 stamps away</b> from your Free Specialty Beverage!
                      </p>
                      <p className="text-[11px] text-amber-300 font-bold">
                        🎁 Special Treat: Complimentary Belgian Waffle with any drink today!
                      </p>
                      <div className="p-2 bg-black/20 rounded-xl text-[10px] text-emerald-200 font-mono truncate">
                        👉 {magicCardUrl}
                      </div>
                      <div className="text-[9px] text-slate-300 text-right font-mono">1:04 PM ✓✓</div>
                    </div>
                  ) : (
                    <div className="text-center py-10 text-slate-500 text-xs italic font-mono">
                      Waiting for engine trigger...
                    </div>
                  )}
                </div>

                {/* Phone Bottom Card Preview */}
                <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[10px] text-slate-400 font-mono">
                  <span>{testName}&apos;s Stamps: {stamps} / 6</span>
                  <span>{wasConverted ? '✅ Converted' : 'Awaiting Scan'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

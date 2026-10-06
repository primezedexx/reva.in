'use client';

import React, { useState, useRef, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import confetti from 'canvas-confetti';
import {
  Printer,
  QrCode,
  Download,
  Copy,
  Check,
  ExternalLink,
  X,
  Sparkles,
  RefreshCw,
  Palette,
  Type,
  Maximize2,
  Share2,
  Store,
  Layers,
  CheckCircle2,
} from 'lucide-react';
import { Business } from '@/types/database';
import { sound } from '@/lib/sound';

interface CounterQrStandModalProps {
  isOpen: boolean;
  onClose: () => void;
  business: Business | null;
  origin?: string;
}

const STAND_THEMES = [
  { id: 'dark', name: 'Dark Onyx', bg: '#0F172A', cardBg: '#FFFFFF', text: '#0F172A', border: '#E2E8F0', accent: '#0F172A', pillBg: '#F1F5F9', pillText: '#475569' },
  { id: 'white', name: 'Clean Minimal', bg: '#FFFFFF', cardBg: '#FFFFFF', text: '#0F172A', border: '#E2E8F0', accent: '#2563EB', pillBg: '#EFF6FF', pillText: '#1E40AF' },
  { id: 'emerald', name: 'Emerald Gold', bg: '#064E3B', cardBg: '#FFFFFF', text: '#064E3B', border: '#D1FAE5', accent: '#059669', pillBg: '#ECFDF5', pillText: '#047857' },
  { id: 'mocha', name: 'Warm Mocha', bg: '#451A03', cardBg: '#FFFFFF', text: '#451A03', border: '#FDE68A', accent: '#D97706', pillBg: '#FEF3C7', pillText: '#92400E' },
  { id: 'indigo', name: 'Royal Indigo', bg: '#1E1B4B', cardBg: '#FFFFFF', text: '#1E1B4B', border: '#E0E7FF', accent: '#4F46E5', pillBg: '#EEF2FF', pillText: '#3730A3' },
];

const SUGGESTED_TAGLINES = [
  'Scan to get your 6th drink FREE!',
  'Collect Stamps & Unlock Free Treats!',
  'Scan for Instant Rewards & Offers!',
  'Join VIP Club in 5 Seconds • No App',
  'Scan with Camera for Free Treat Next Visit',
];

export default function CounterQrStandModal({
  isOpen,
  onClose,
  business,
  origin: initialOrigin,
}: CounterQrStandModalProps) {
  const [origin, setOrigin] = useState('');
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setOrigin(initialOrigin || window.location.origin);
    }
  }, [initialOrigin]);

  const rawStamps = business?.reward_rule?.stamps_needed || 6;
  const rewardTitle = business?.reward_rule?.reward_title || 'Free Treat';
  const defaultTagline = `Scan to get your ${rawStamps}th order FREE!`;

  const [standTagline, setStandTagline] = useState(defaultTagline);
  const [standSubtext, setStandSubtext] = useState('No app download • Takes 5 seconds on camera');
  const [counterLabel, setCounterLabel] = useState('Counter Stand');
  const [selectedThemeId, setSelectedThemeId] = useState('dark');
  const [selectedSize, setSelectedSize] = useState<'a5' | 'a6' | 'square'>('a5');
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const qrSvgContainerRef = useRef<HTMLDivElement>(null);
  const printStandRef = useRef<HTMLDivElement>(null);

  // Update default tagline when business loads
  useEffect(() => {
    if (business) {
      setStandTagline(`Scan to get your ${business.reward_rule?.stamps_needed || 6}th drink FREE!`);
    }
  }, [business]);

  if (!isOpen || !business) return null;

  const currentTheme = STAND_THEMES.find((t) => t.id === selectedThemeId) || STAND_THEMES[0];
  const hostOrigin = origin || (typeof window !== 'undefined' ? window.location.origin : 'https://reva.in');
  const customerQrUrl = `${hostOrigin}/c/${business.slug || 'store'}`;
  const testPassUrl = `${customerQrUrl}?test=1`;

  const handleCopyLink = () => {
    sound.playClick();
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(customerQrUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  // Download High-Res 300 DPI Canvas PNG
  const handleDownloadStand = async () => {
    try {
      setIsDownloading(true);
      sound.playClick();

      const canvas = document.createElement('canvas');
      const width = 1200;
      const height = 1700;
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas context not available');

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';

      // Background Tone
      ctx.fillStyle = currentTheme.bg === '#FFFFFF' ? '#F8FAFC' : currentTheme.bg;
      ctx.fillRect(0, 0, width, height);

      // Card Container
      const cardX = 80;
      const cardY = 80;
      const cardW = width - 160;
      const cardH = height - 160;
      const radius = 56;

      ctx.beginPath();
      ctx.roundRect(cardX, cardY, cardW, cardH, radius);
      ctx.fillStyle = '#FFFFFF';
      ctx.fill();
      ctx.lineWidth = 4;
      ctx.strokeStyle = '#E2E8F0';
      ctx.stroke();

      // Top Header Brand Badge
      const badgeSize = 100;
      const badgeX = width / 2 - badgeSize / 2;
      const badgeY = cardY + 60;
      ctx.beginPath();
      ctx.roundRect(badgeX, badgeY, badgeSize, badgeSize, 28);
      ctx.fillStyle = currentTheme.accent || '#0F172A';
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
      ctx.font = 'bold 44px "Plus Jakarta Sans", "Inter", -apple-system, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'alphabetic';
      const storeName = business.name || 'Digital Loyalty Card';
      ctx.fillText(storeName, width / 2, badgeY + badgeSize + 55);

      // Official Badge Pill
      ctx.fillStyle = '#64748B';
      ctx.font = 'bold 16px "Space Mono", monospace';
      ctx.fillText(`OFFICIAL DIGITAL LOYALTY CARD • ${counterLabel.toUpperCase()}`, width / 2, badgeY + badgeSize + 90);

      // Extract SVG QR Code and Render High-Res
      const svgEl = qrSvgContainerRef.current?.querySelector('svg');
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
        const qrBoxSize = 580;
        const qrBoxX = width / 2 - qrBoxSize / 2;
        const qrBoxY = badgeY + badgeSize + 120;

        ctx.beginPath();
        ctx.roundRect(qrBoxX, qrBoxY, qrBoxSize, qrBoxSize, 36);
        ctx.fillStyle = '#FFFFFF';
        ctx.fill();
        ctx.lineWidth = 3;
        ctx.strokeStyle = '#E2E8F0';
        ctx.stroke();

        // Draw QR Image
        const qrPadding = 36;
        ctx.drawImage(
          qrImg,
          qrBoxX + qrPadding,
          qrBoxY + qrPadding,
          qrBoxSize - qrPadding * 2,
          qrBoxSize - qrPadding * 2
        );
        URL.revokeObjectURL(blobUrl);

        // Headline
        const headlineY = qrBoxY + qrBoxSize + 75;
        ctx.fillStyle = '#0F172A';
        ctx.font = 'bold 36px "Plus Jakarta Sans", "Inter", -apple-system, sans-serif';
        ctx.fillText(standTagline || defaultTagline, width / 2, headlineY);

        // Helper Subtext
        const subtextY = headlineY + 45;
        ctx.fillStyle = '#64748B';
        ctx.font = '500 22px "Inter", -apple-system, sans-serif';
        ctx.fillText(standSubtext || 'No app download • Takes 5 seconds on camera', width / 2, subtextY);

        // Horizontal Divider
        const divY = subtextY + 45;
        ctx.beginPath();
        ctx.moveTo(cardX + 70, divY);
        ctx.lineTo(cardX + cardW - 70, divY);
        ctx.lineWidth = 2;
        ctx.strokeStyle = '#F1F5F9';
        ctx.stroke();

        // 3-Step Guide (1. Scan | 2. Collect | 3. Enjoy)
        const stepsY = divY + 48;
        const col1X = width / 2 - 280;
        const col2X = width / 2;
        const col3X = width / 2 + 280;

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
        ctx.fillText(rewardTitle || 'Free Treats', col3X, stepsY + 26);

        // Footer
        ctx.fillStyle = '#94A3B8';
        ctx.font = 'bold 15px "Space Mono", monospace';
        ctx.fillText('Powered by reva.in • Zero App Friction', width / 2, cardY + cardH - 35);
      }

      // Convert to PNG and Trigger Instant Download
      const dataUrl = canvas.toDataURL('image/png', 1.0);
      const link = document.createElement('a');
      link.download = `${business.slug || 'store'}-counter-qr-stand-300dpi.png`;
      link.href = dataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      sound.playRewardFanfare();
      confetti({ particleCount: 80, spread: 60, origin: { y: 0.6 } });
      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 4000);
    } catch (err) {
      console.error('Failed to download stand image', err);
      alert('Could not download image. Please use the Print Stand button.');
    } finally {
      setIsDownloading(false);
    }
  };

  // Direct Print via Browser Print Dialog
  const handlePrint = () => {
    sound.playClick();
    window.print();
  };

  // Download standalone QR Code image
  const handleDownloadQrOnly = () => {
    const svgEl = qrSvgContainerRef.current?.querySelector('svg');
    if (!svgEl) return;
    sound.playClick();

    const svgString = new XMLSerializer().serializeToString(svgEl);
    const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    const blobUrl = URL.createObjectURL(svgBlob);

    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 1000;
      canvas.height = 1000;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, 1000, 1000);
        ctx.drawImage(img, 80, 80, 840, 840);
        const dataUrl = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.download = `${business.slug || 'store'}-qr-code-hq.png`;
        link.href = dataUrl;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
      URL.revokeObjectURL(blobUrl);
    };
    img.src = blobUrl;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/60 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl border border-slate-100 shadow-2xl w-full max-w-5xl my-auto overflow-hidden flex flex-col max-h-[92vh]">
        {/* ========================================================================= */}
        {/* MODAL HEADER                                                              */}
        {/* ========================================================================= */}
        <div className="p-4 sm:p-6 border-b border-slate-100 flex items-center justify-between gap-4 bg-slate-50/50 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-[#0F172A] text-white flex items-center justify-center shadow-xs shrink-0">
              <Printer className="w-5 h-5 text-emerald-400" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-display font-bold text-base sm:text-lg text-slate-900 truncate">
                  Counter QR Stand Studio &amp; QR Settings
                </h3>
                <span className="text-[10px] font-mono font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full shrink-0">
                  300 DPI Ready
                </span>
              </div>
              <p className="text-xs text-slate-500 truncate">
                Customize, preview, and download physical acrylic table stands for your counter
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              sound.playClick();
              onClose();
            }}
            className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition-colors cursor-pointer shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* ========================================================================= */}
        {/* MODAL BODY: 2 COLUMNS (LIVE PREVIEW vs CONTROLS)                          */}
        {/* ========================================================================= */}
        <div className="p-4 sm:p-6 overflow-y-auto grid grid-cols-1 lg:grid-cols-12 gap-6 items-start flex-1">
          {/* ----------------------------------------------------------------------- */}
          {/* LEFT: LIVE ACRYLIC STAND MOCKUP                                         */}
          {/* ----------------------------------------------------------------------- */}
          <div className="lg:col-span-6 flex flex-col items-center justify-center space-y-4">
            <div className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5 self-start px-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Live Print Mockup Preview</span>
            </div>

            {/* The Physical Stand Card (Also used for print styles) */}
            <div
              ref={printStandRef}
              style={{ backgroundColor: currentTheme.bg }}
              className="w-full max-w-[340px] sm:max-w-[360px] rounded-[32px] p-5 sm:p-6 text-center shadow-2xl border border-slate-200/80 transition-all duration-300 relative overflow-hidden select-none"
            >
              {/* Stand Gloss Reflection Effect */}
              <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent pointer-events-none" />

              {/* White Inner Card */}
              <div className="bg-white rounded-[26px] p-4 sm:p-5 shadow-sm border border-slate-100 flex flex-col items-center space-y-3 relative z-10">
                {/* Store Icon Badge */}
                <div
                  style={{ backgroundColor: currentTheme.accent }}
                  className="w-11 h-11 rounded-2xl text-white flex items-center justify-center shadow-xs -mt-1"
                >
                  <svg viewBox="0 0 24 24" className="w-6 h-6 fill-none stroke-current stroke-[2.2]">
                    <path d="M12 2v20M2 12h20M4.93 4.93l14.14 14.14M4.93 19.07L19.07 4.93" />
                  </svg>
                </div>

                {/* Store Name & Label */}
                <div>
                  <h4 className="font-display font-bold text-base sm:text-lg text-slate-900 leading-tight">
                    {business.name || 'Your Store Name'}
                  </h4>
                  <div
                    style={{ backgroundColor: currentTheme.pillBg, color: currentTheme.pillText }}
                    className="inline-block px-2.5 py-0.5 rounded-full text-[9px] font-mono font-bold uppercase tracking-wider mt-1"
                  >
                    DIGITAL LOYALTY CARD • {counterLabel}
                  </div>
                </div>

                {/* The Sharp QR Code Container */}
                <div
                  ref={qrSvgContainerRef}
                  className="p-3 bg-white rounded-2xl shadow-xs border-2 border-slate-100 flex items-center justify-center"
                >
                  <QRCodeSVG
                    value={customerQrUrl}
                    size={170}
                    level="H"
                    includeMargin={false}
                    imageSettings={{
                      src: business.logo_url || '/favicon.ico',
                      x: undefined,
                      y: undefined,
                      height: 32,
                      width: 32,
                      excavate: true,
                    }}
                  />
                </div>

                {/* Custom Tagline & Subtext */}
                <div className="space-y-1 max-w-[260px]">
                  <p className="font-display font-bold text-xs sm:text-sm text-slate-900 leading-snug">
                    {standTagline || defaultTagline}
                  </p>
                  <p className="text-[10px] text-slate-500 leading-tight">
                    {standSubtext || 'No app download • Takes 5 seconds on camera'}
                  </p>
                </div>

                {/* 3 Step Visual Guide */}
                <div className="w-full pt-2 border-t border-slate-100 grid grid-cols-3 gap-1 text-center">
                  <div>
                    <div className="font-bold text-[10px] text-slate-800">1. Scan</div>
                    <div className="text-[8px] text-slate-400">Phone camera</div>
                  </div>
                  <div>
                    <div className="font-bold text-[10px] text-slate-800">2. Stamp</div>
                    <div className="text-[8px] text-slate-400">Digital pass</div>
                  </div>
                  <div>
                    <div className="font-bold text-[10px] text-slate-800">3. Reward</div>
                    <div className="text-[8px] text-slate-400">{rewardTitle || 'Free treat'}</div>
                  </div>
                </div>

                <div className="text-[8px] font-mono text-slate-400 pt-0.5">
                  Powered by reva.in • Zero App Friction
                </div>
              </div>
            </div>

            {/* Stand Acrylic Base Simulation */}
            <div className="w-48 h-3.5 bg-slate-200/80 rounded-full shadow-inner -mt-2 border border-slate-300/60" />
          </div>

          {/* ----------------------------------------------------------------------- */}
          {/* RIGHT: CONTROLS & QR SETTINGS                                           */}
          {/* ----------------------------------------------------------------------- */}
          <div className="lg:col-span-6 space-y-4">
            {/* 1. Target URL Strip */}
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1.5">
              <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <QrCode className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Customer Loyalty Pass URL</span>
                </span>
                <span className="text-emerald-600 font-bold">Active &amp; Live</span>
              </div>
              <div className="font-mono text-xs text-slate-800 font-semibold truncate bg-white p-2 rounded-xl border border-slate-200 select-all">
                {customerQrUrl}
              </div>
              <div className="flex items-center gap-2 pt-0.5">
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="flex-1 py-1.5 rounded-lg bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold border border-slate-200 transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                >
                  {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
                  <span>{copiedLink ? 'Copied!' : 'Copy Link'}</span>
                </button>
                <a
                  href={testPassUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-1.5 rounded-lg bg-[#0F172A] hover:bg-black text-white text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                >
                  <span>Test Pass</span>
                  <ExternalLink className="w-3 h-3 text-emerald-400" />
                </a>
              </div>
            </div>

            {/* 2. Stand Tagline / Call to Action */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-800 flex items-center justify-between">
                <span>Stand Headline / Call-to-Action</span>
                <span className="text-[10px] font-normal text-slate-400">Appears below QR</span>
              </label>
              <input
                type="text"
                value={standTagline}
                onChange={(e) => setStandTagline(e.target.value)}
                placeholder="e.g. Scan to get your 6th drink FREE!"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm font-semibold text-slate-900 focus:outline-none focus:border-[#0F172A] bg-white transition-all shadow-2xs"
              />

              {/* Quick suggestion pills */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                {SUGGESTED_TAGLINES.slice(0, 3).map((tag, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => {
                      sound.playClick();
                      setStandTagline(tag);
                    }}
                    className="text-[10px] font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 border border-slate-200/80 px-2 py-0.5 rounded-full transition-colors cursor-pointer text-left truncate max-w-[280px]"
                  >
                    + {tag}
                  </button>
                ))}
              </div>
            </div>

            {/* 3. Helper Subtext */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-800 flex items-center justify-between">
                <span>Instruction Subtext</span>
                <span className="text-[10px] font-normal text-slate-400">Guidance for guests</span>
              </label>
              <input
                type="text"
                value={standSubtext}
                onChange={(e) => setStandSubtext(e.target.value)}
                placeholder="e.g. No app download • Takes 5 seconds on camera"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm font-medium text-slate-800 focus:outline-none focus:border-[#0F172A] bg-white transition-all shadow-2xs"
              />
            </div>

            {/* 4. Table / Stand Identifier */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-800">
                Counter or Table Label
              </label>
              <div className="flex gap-2">
                {['Counter Stand', 'Table #1', 'Billing Desk', 'Pickup Counter'].map((lbl) => (
                  <button
                    key={lbl}
                    type="button"
                    onClick={() => {
                      sound.playClick();
                      setCounterLabel(lbl);
                    }}
                    className={`flex-1 py-1.5 rounded-xl text-[11px] font-bold transition-all cursor-pointer border ${
                      counterLabel === lbl
                        ? 'bg-[#0F172A] text-white border-[#0F172A]'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {lbl}
                  </button>
                ))}
              </div>
            </div>

            {/* 5. Theme Color Selector */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-800 flex items-center justify-between">
                <span>Stand Color Theme</span>
                <span className="text-[10px] font-mono text-slate-400">{currentTheme.name}</span>
              </label>
              <div className="grid grid-cols-5 gap-2">
                {STAND_THEMES.map((theme) => (
                  <button
                    key={theme.id}
                    type="button"
                    onClick={() => {
                      sound.playClick();
                      setSelectedThemeId(theme.id);
                    }}
                    className={`p-2 rounded-xl border flex flex-col items-center gap-1 transition-all cursor-pointer ${
                      selectedThemeId === theme.id
                        ? 'border-[#0F172A] ring-2 ring-[#0F172A]/20 bg-slate-50'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div
                      style={{ backgroundColor: theme.bg }}
                      className="w-6 h-6 rounded-lg border border-black/10 shadow-2xs"
                    />
                    <span className="text-[9px] font-bold text-slate-700 truncate w-full text-center">
                      {theme.name.split(' ')[0]}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* 6. Action Export Buttons */}
            <div className="pt-2 space-y-2">
              <button
                type="button"
                onClick={handleDownloadStand}
                disabled={isDownloading}
                className="w-full py-3.5 rounded-2xl bg-[#0F172A] hover:bg-black active:scale-98 text-white font-bold text-xs sm:text-sm uppercase tracking-wider transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isDownloading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-emerald-400" />
                    <span>Rendering 300 DPI Stand...</span>
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4 text-emerald-400" />
                    <span>Download 300 DPI Stand (PNG)</span>
                  </>
                )}
              </button>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={handlePrint}
                  className="py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-800 font-bold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                >
                  <Printer className="w-3.5 h-3.5 text-slate-600" />
                  <span>Print Stand Directly</span>
                </button>

                <button
                  type="button"
                  onClick={handleDownloadQrOnly}
                  className="py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-800 font-bold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                >
                  <QrCode className="w-3.5 h-3.5 text-slate-600" />
                  <span>Download QR Only</span>
                </button>
              </div>

              {downloadSuccess && (
                <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold flex items-center justify-center gap-1.5 animate-in fade-in">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>300 DPI High-Res Stand downloaded to your computer!</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

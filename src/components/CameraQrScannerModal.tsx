'use client';

// ============================================================================
// SIPLO (siplo.in) — UPI-Grade Instant Camera QR Code Scanner (<100ms)
// Hardware BarcodeDetector (Singleton) + 60fps Center-Crop jsQR Engine
// Zero-Flicker Instant Stream + In-Viewfinder 24-Hour Cooldown Indicator
// ============================================================================

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import jsQR from 'jsqr';
import {
  Camera,
  X,
  AlertCircle,
  CheckCircle2,
  Lock,
  ShieldCheck,
  Flashlight,
  SwitchCamera,
  Store,
  Clock,
  Zap,
} from 'lucide-react';
import { sound } from '@/lib/sound';

interface CameraQrScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentSlug?: string;
  customerPhone?: string;
  customerName?: string;
  rewardId?: string;
  isCooldownActive?: boolean;
  cooldownHours?: number;
  cooldownMins?: number;
  onStampClaimed?: (result: {
    success: boolean;
    cooldownActive?: boolean;
    hoursRemaining?: number;
    minutesRemaining?: number;
    message?: string;
    membership?: any;
    rewardId?: string;
    passStamps?: number;
    business?: { name: string; slug: string; id?: string };
    guestRedirect?: boolean;
  }) => void;
}

export default function CameraQrScannerModal({
  isOpen,
  onClose,
  currentSlug,
  customerPhone,
  customerName,
  rewardId,
  isCooldownActive,
  cooldownHours = 24,
  cooldownMins = 0,
  onStampClaimed,
}: CameraQrScannerModalProps) {
  const router = useRouter();

  // Stable props ref to avoid useEffect dependency recreation & stream flickering
  const propsRef = useRef({
    currentSlug,
    customerPhone,
    customerName,
    rewardId,
    onStampClaimed,
    onClose,
    router,
  });
  useEffect(() => {
    propsRef.current = {
      currentSlug,
      customerPhone,
      customerName,
      rewardId,
      onStampClaimed,
      onClose,
      router,
    };
  });

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameId = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const isStartingCameraRef = useRef<boolean>(false);

  // Singleton hardware BarcodeDetector reference
  const barcodeDetectorRef = useRef<any>(null);

  // Synchronous atomic lock to strictly prevent duplicate multi-scans
  const isProcessingRef = useRef<boolean>(false);
  const streamGenRef = useRef<number>(0);
  const scanFrameCountRef = useRef<number>(0);

  const [cameraState, setCameraState] = useState<'prompt' | 'active' | 'denied' | 'unsupported'>('prompt');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [recognizedStore, setRecognizedStore] = useState<{ name: string; slug: string; logo_url?: string } | null>(null);
  const [differentStoreModal, setDifferentStoreModal] = useState<{
    scannedSlug: string;
    scannedName: string;
    scannedLogo?: string;
    currentSlug: string;
  } | null>(null);
  const [hasTorch, setHasTorch] = useState(false);
  const [isTorchOn, setIsTorchOn] = useState(false);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');

  // Initialize native BarcodeDetector ONCE on client mount
  useEffect(() => {
    if (typeof window !== 'undefined' && 'BarcodeDetector' in window) {
      try {
        // @ts-expect-error Native BarcodeDetector
        barcodeDetectorRef.current = new window.BarcodeDetector({ formats: ['qr_code'] });
      } catch (e) {
        console.warn('Native BarcodeDetector initialization fallback to jsQR:', e);
      }
    }
  }, []);

  // Stop camera tracks cleanly
  const stopCameraStream = useCallback(() => {
    if (animationFrameId.current) {
      cancelAnimationFrame(animationFrameId.current);
      animationFrameId.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch {}
      });
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    isStartingCameraRef.current = false;
    setIsTorchOn(false);
  }, []);

  // Parse cafe slug or business ID from scanned QR string
  const parseStoreFromQr = (rawText: string): string | null => {
    const trimmed = rawText.trim();

    // Pattern 1: URL path like https://reva.in/c/boba-brew or https://revain-delta.vercel.app/c/boba-brew
    const urlMatch = trimmed.match(/\/c\/([a-zA-Z0-9_-]+)/);
    if (urlMatch && urlMatch[1]) {
      return urlMatch[1].toLowerCase();
    }

    // Pattern 1b: URL with ?store= slug
    const storeParamMatch = trimmed.match(/[?&]store=([a-zA-Z0-9_-]+)/);
    if (storeParamMatch && storeParamMatch[1]) {
      return storeParamMatch[1].toLowerCase();
    }

    // Pattern 2: JSON payload like {"slug":"boba-brew"} or {"businessId":"..."}
    try {
      if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
        const parsed = JSON.parse(trimmed);
        if (parsed.slug) return parsed.slug.toLowerCase();
        if (parsed.businessSlug) return parsed.businessSlug.toLowerCase();
        if (parsed.businessId) return parsed.businessId;
      }
    } catch {}

    // Pattern 3: Direct slug name (e.g. boba-brew, tokyo-matcha, bheem-pujaris-cafe)
    if (/^[a-zA-Z0-9_-]{3,60}$/.test(trimmed)) {
      return trimmed.toLowerCase();
    }

    return null;
  };

  // Switch to different cafe and punch stamp
  const handleConfirmSwitchStore = async () => {
    if (!differentStoreModal) return;
    const { scannedSlug, scannedName, scannedLogo } = differentStoreModal;
    setDifferentStoreModal(null);
    setIsProcessing(true);
    isProcessingRef.current = true;

    try {
      const p = propsRef.current;
      const effectivePhone =
        p.customerPhone ||
        localStorage.getItem('reva_customer_phone') ||
        localStorage.getItem(`reva_phone_${scannedSlug}`) ||
        '';

      if (effectivePhone && effectivePhone.replace(/\D/g, '').length >= 10 && !effectivePhone.includes('@')) {
        const stampRes = await fetch('/api/stamp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            slug: scannedSlug,
            phone: effectivePhone,
            name: p.customerName || undefined,
            source: 'qr_scan',
            stampAwarded: 1,
            staffNote: 'Camera Viewfinder QR Scan (Switched Store)',
          }),
        });

        const stampData = await stampRes.json();
        const isCooldown = Boolean(stampData.cooldownActive || stampRes.status === 429);
        const bizName = stampData.membership?.business?.name || stampData.business?.name || scannedName;
        const bizSlug = stampData.membership?.business?.slug || stampData.business?.slug || scannedSlug;

        if (isCooldown) {
          stopCameraStream();
          p.onClose();
          if (p.onStampClaimed) {
            p.onStampClaimed({
              success: false,
              cooldownActive: true,
              hoursRemaining: stampData.hoursRemaining ?? 23,
              minutesRemaining: stampData.minutesRemaining ?? 59,
              message: stampData.message || stampData.error,
              membership: stampData.membership,
              business: { name: bizName, slug: bizSlug, id: stampData.membership?.business_id || stampData.business?.id },
            });
          }
          return;
        }

        sound.playStampPop();
        setRecognizedStore({
          name: bizName,
          slug: bizSlug,
          logo_url: stampData.membership?.business?.logo_url || stampData.business?.logo_url || scannedLogo,
        });

        if (p.onStampClaimed) {
          p.onStampClaimed({
            success: Boolean(stampData.success),
            cooldownActive: false,
            message: stampData.message,
            membership: stampData.membership,
            business: { name: bizName, slug: bizSlug, id: stampData.membership?.business_id || stampData.business?.id },
          });
        }

        setTimeout(() => {
          stopCameraStream();
          p.onClose();
          p.router.push(`/c?store=${encodeURIComponent(bizSlug)}`);
        }, 450);
      } else {
        setTimeout(() => {
          stopCameraStream();
          p.onClose();
          p.router.push(`/c?store=${encodeURIComponent(scannedSlug)}&scan=1`);
        }, 350);
      }
    } catch {
      setErrorMessage('Failed to switch store. Please try again.');
      setTimeout(() => {
        isProcessingRef.current = false;
        setIsProcessing(false);
      }, 1200);
    }
  };

  const handleCancelSwitch = () => {
    sound.playClick();
    setDifferentStoreModal(null);
    isProcessingRef.current = false;
    setIsProcessing(false);
    startScanLoop();
  };

  // Handle successful QR detection with atomic synchronous lock & instant feedback
  const handleDecodedQr = useCallback(async (rawText: string) => {
    if (isProcessingRef.current) return;
    isProcessingRef.current = true;
    setIsProcessing(true);

    if (animationFrameId.current) {
      cancelAnimationFrame(animationFrameId.current);
      animationFrameId.current = null;
    }

    try {
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate([40, 30, 40]);
      }
    } catch {}

    const targetSlug = parseStoreFromQr(rawText);
    const p = propsRef.current;

    if (!targetSlug) {
      setErrorMessage('Unrecognized QR Code. Please point at the store stand QR.');
      sound.playClick();
      setTimeout(() => {
        isProcessingRef.current = false;
        setIsProcessing(false);
        setErrorMessage(null);
        startScanLoop();
      }, 1800);
      return;
    }

    // Branch A: Different store detected
    if (p.currentSlug && targetSlug !== p.currentSlug) {
      try {
        const bizRes = await fetch(`/api/businesses/${targetSlug}`);
        const bizData = await bizRes.json();
        const bizName = bizData.business?.name || targetSlug.replace(/-/g, ' ').toUpperCase();
        const bizLogo = bizData.business?.logo_url;

        setDifferentStoreModal({
          scannedSlug: targetSlug,
          scannedName: bizName,
          scannedLogo: bizLogo,
          currentSlug: p.currentSlug,
        });
        sound.playStampPop();
        return;
      } catch {
        setDifferentStoreModal({
          scannedSlug: targetSlug,
          scannedName: targetSlug.replace(/-/g, ' ').toUpperCase(),
          currentSlug: p.currentSlug,
        });
        return;
      }
    }

    // Branch B: Same store scan
    try {
      const effectivePhone =
        p.customerPhone ||
        localStorage.getItem('reva_customer_phone') ||
        localStorage.getItem(`reva_phone_${targetSlug}`) ||
        '';

      if (effectivePhone && effectivePhone.replace(/\D/g, '').length >= 10 && !effectivePhone.includes('@')) {
        const stampRes = await fetch('/api/stamp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            slug: targetSlug,
            phone: effectivePhone,
            name: p.customerName || undefined,
            source: 'qr_scan',
            stampAwarded: 1,
            staffNote: 'Camera Viewfinder QR Scan',
            rewardId: p.rewardId || undefined,
          }),
        });

        const stampData = await stampRes.json();
        const isCooldown = Boolean(stampData.cooldownActive || stampRes.status === 429);
        const bizName = stampData.membership?.business?.name || stampData.business?.name || targetSlug;
        const bizSlug = stampData.membership?.business?.slug || stampData.business?.slug || targetSlug;

        if (isCooldown) {
          stopCameraStream();
          p.onClose();
          if (p.onStampClaimed) {
            p.onStampClaimed({
              success: false,
              cooldownActive: true,
              hoursRemaining: stampData.hoursRemaining ?? 23,
              minutesRemaining: stampData.minutesRemaining ?? 59,
              message: stampData.message || stampData.error,
              membership: stampData.membership,
              business: { name: bizName, slug: bizSlug, id: stampData.membership?.business_id || stampData.business?.id },
            });
          }
          return;
        }

        sound.playStampPop();
        setRecognizedStore({
          name: bizName,
          slug: bizSlug,
          logo_url: stampData.membership?.business?.logo_url || stampData.business?.logo_url,
        });

        if (p.onStampClaimed) {
          p.onStampClaimed({
            success: Boolean(stampData.success),
            cooldownActive: false,
            hoursRemaining: stampData.hoursRemaining,
            minutesRemaining: stampData.minutesRemaining,
            message: stampData.message || stampData.error,
            membership: stampData.membership,
            rewardId: p.rewardId,
            passStamps: stampData.passStamps,
            business: { name: bizName, slug: bizSlug, id: stampData.membership?.business_id || stampData.business?.id },
          });
        }

        setTimeout(() => {
          stopCameraStream();
          p.onClose();
        }, 550);
      } else {
        let biz = null;
        try {
          const res = await fetch(`/api/businesses/${targetSlug}`);
          const data = await res.json();
          if (data.business) biz = data.business;
        } catch {}

        setRecognizedStore({
          name: biz?.name || targetSlug.replace(/-/g, ' ').toUpperCase(),
          slug: targetSlug,
          logo_url: biz?.logo_url,
        });
        sound.playStampPop();

        setTimeout(() => {
          stopCameraStream();
          p.onClose();
          if (p.onStampClaimed) {
            p.onStampClaimed({
              success: false,
              guestRedirect: true,
              business: biz ? { name: biz.name, slug: biz.slug, id: biz.id } : { name: targetSlug, slug: targetSlug },
            });
          }
          if (p.currentSlug !== targetSlug && (!p.currentSlug || !p.onStampClaimed)) {
            p.router.push(`/c?store=${encodeURIComponent(targetSlug)}&scan=1`);
          }
        }, 400);
      }
    } catch (err) {
      console.error('QR scan resolution error:', err);
      setErrorMessage('Failed to process QR scan. Please point camera again.');
      setTimeout(() => {
        isProcessingRef.current = false;
        setIsProcessing(false);
        startScanLoop();
      }, 1200);
    }
  }, [stopCameraStream]);

  // Frame scanner loop
  const executeFrameScan = useCallback(async () => {
    if (isProcessingRef.current || !videoRef.current) return;
    const video = videoRef.current;
    if (video.readyState < 2 || video.videoWidth === 0 || video.videoHeight === 0) {
      animationFrameId.current = requestAnimationFrame(executeFrameScan);
      return;
    }

    scanFrameCountRef.current++;

    // 1. Native hardware BarcodeDetector (<1ms)
    if (barcodeDetectorRef.current) {
      try {
        const barcodes = await barcodeDetectorRef.current.detect(video);
        if (barcodes && barcodes.length > 0 && barcodes[0].rawValue) {
          handleDecodedQr(barcodes[0].rawValue);
          return;
        }
      } catch {}
    }

    // 2. Center-crop jsQR engine
    if (canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (ctx) {
        const vw = video.videoWidth;
        const vh = video.videoHeight;
        const cropSize = Math.floor(Math.min(vw, vh) * 0.75);
        const sx = Math.floor((vw - cropSize) / 2);
        const sy = Math.floor((vh - cropSize) / 2);
        const targetDim = Math.min(380, cropSize);

        if (canvas.width !== targetDim || canvas.height !== targetDim) {
          canvas.width = targetDim;
          canvas.height = targetDim;
        }

        ctx.drawImage(video, sx, sy, cropSize, cropSize, 0, 0, targetDim, targetDim);
        const imgData = ctx.getImageData(0, 0, targetDim, targetDim);
        const code = jsQR(imgData.data, targetDim, targetDim, {
          inversionAttempts: 'attemptBoth',
        });

        if (code && code.data && code.data.trim().length > 0) {
          handleDecodedQr(code.data);
          return;
        }

        // Full frame fallback on every 4th frame
        if (scanFrameCountRef.current % 4 === 0) {
          const maxDim = 400;
          const scale = Math.min(1, maxDim / Math.max(vw, vh));
          const fullW = Math.max(160, Math.floor(vw * scale));
          const fullH = Math.max(160, Math.floor(vh * scale));

          canvas.width = fullW;
          canvas.height = fullH;
          ctx.drawImage(video, 0, 0, fullW, fullH);
          const fullData = ctx.getImageData(0, 0, fullW, fullH);
          const fullCode = jsQR(fullData.data, fullW, fullH, {
            inversionAttempts: 'attemptBoth',
          });

          if (fullCode && fullCode.data && fullCode.data.trim().length > 0) {
            handleDecodedQr(fullCode.data);
            return;
          }
        }
      }
    }

    if (!isProcessingRef.current) {
      animationFrameId.current = requestAnimationFrame(executeFrameScan);
    }
  }, [handleDecodedQr]);

  const startScanLoop = useCallback(() => {
    if (animationFrameId.current) {
      cancelAnimationFrame(animationFrameId.current);
    }
    animationFrameId.current = requestAnimationFrame(executeFrameScan);
  }, [executeFrameScan]);

  // Robust Camera Stream Initiator (Instant, Zero-Flicker)
  const startCamera = useCallback(async (mode: 'environment' | 'user') => {
    if (isStartingCameraRef.current) return;
    isStartingCameraRef.current = true;
    const currentGen = ++streamGenRef.current;

    stopCameraStream();
    setErrorMessage(null);
    setIsProcessing(false);
    isProcessingRef.current = false;
    setRecognizedStore(null);

    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      isStartingCameraRef.current = false;
      setCameraState('unsupported');
      setErrorMessage('Camera access is not supported by this browser.');
      return;
    }

    let stream: MediaStream | null = null;

    try {
      // Instant Mobile-Optimized Constraint (avoid rigid min resolution bounds that cause delay/fallback)
      stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: mode === 'user' ? 'user' : { ideal: 'environment' },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });
    } catch {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false,
        });
      } catch (err) {
        isStartingCameraRef.current = false;
        if (currentGen !== streamGenRef.current) return;
        console.warn('Camera getUserMedia failed:', err);
        setCameraState('denied');
        if (err instanceof DOMException && err.name === 'NotAllowedError') {
          setErrorMessage('Camera access was blocked. Please enable camera permissions in your browser.');
        } else {
          setErrorMessage('Could not open camera stream. Please check camera permissions.');
        }
        return;
      }
    }

    if (currentGen !== streamGenRef.current) {
      stream?.getTracks().forEach((t) => t.stop());
      isStartingCameraRef.current = false;
      return;
    }

    streamRef.current = stream;
    if (videoRef.current) {
      videoRef.current.srcObject = stream;
      videoRef.current.setAttribute('playsinline', 'true');
      videoRef.current.setAttribute('muted', 'true');
      videoRef.current.setAttribute('autoplay', 'true');
      try {
        await videoRef.current.play();
      } catch (playErr) {
        console.warn('Video play error:', playErr);
      }
    }

    // Check torch capability
    try {
      const track = stream.getVideoTracks()[0];
      const capabilities = track.getCapabilities?.() as any;
      setHasTorch(Boolean(capabilities?.torch));
      if (capabilities?.focusMode?.includes('continuous')) {
        await track.applyConstraints({ advanced: [{ focusMode: 'continuous' } as any] });
      }
    } catch {
      setHasTorch(false);
    }

    setCameraState('active');
    isStartingCameraRef.current = false;
    startScanLoop();
  }, [stopCameraStream, startScanLoop]);

  // Toggle torch / flashlight
  const toggleTorch = async () => {
    if (!streamRef.current || !hasTorch) return;
    try {
      const track = streamRef.current.getVideoTracks()[0];
      const nextState = !isTorchOn;
      // @ts-expect-error Torch advanced constraint
      await track.applyConstraints({ advanced: [{ torch: nextState }] });
      setIsTorchOn(nextState);
    } catch (err) {
      console.warn('Failed to toggle torch:', err);
    }
  };

  // Flip camera between back and front
  const toggleCameraFacing = () => {
    sound.playClick();
    const nextMode = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(nextMode);
    startCamera(nextMode);
  };

  // Lifecycle on modal Open/Close ONLY (No flickering on parent re-renders)
  useEffect(() => {
    if (isOpen) {
      if (!streamRef.current && !isStartingCameraRef.current) {
        startCamera(facingMode);
      }
    } else {
      stopCameraStream();
      setCameraState('prompt');
    }
    return () => {
      stopCameraStream();
    };
  }, [isOpen]); // Only re-run when modal opens or closes!

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-150">
      {/* Hidden processing canvas for jsQR fallback */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Crisp White Card Modal */}
      <div className="bg-white text-slate-900 rounded-[32px] max-w-sm w-full p-5 sm:p-6 space-y-3.5 border border-slate-100 shadow-2xl relative overflow-hidden text-center">
        {/* Clean Close Button */}
        <button
          onClick={() => {
            sound.playClick();
            stopCameraStream();
            onClose();
          }}
          className="absolute right-4 top-4 w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-900 flex items-center justify-center transition-colors cursor-pointer z-20 shadow-2xs"
          title="Close Scanner"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Clean Header */}
        <div className="space-y-0.5 pt-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-slate-100 text-slate-800 text-[10px] font-mono font-bold uppercase tracking-wider">
            <Camera className="w-3 h-3 text-emerald-600" />
            <span>Counter Stand Scanner</span>
          </div>
          <h3 className="font-display font-bold text-lg text-[#0F172A]">
            Scan to Claim Stamp
          </h3>
          <p className="text-xs text-slate-500 leading-tight">
            Point your camera directly at the QR stand on the counter
          </p>
        </div>

        {/* Interactive Viewfinder Camera Screen */}
        <div className="relative w-full aspect-square rounded-2xl bg-slate-950 overflow-hidden border border-slate-200 shadow-inner flex items-center justify-center">
          {/* 1. Permanent Video Element (Instant stream) */}
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="absolute inset-0 w-full h-full object-cover"
          />

          {/* 2. Fast Camera Initializing State */}
          {cameraState === 'prompt' && (
            <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-xs flex flex-col items-center justify-center p-6 text-center space-y-3 z-10 text-white">
              <div className="w-12 h-12 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center mx-auto text-emerald-400">
                <Camera className="w-6 h-6 animate-pulse" />
              </div>
              <div className="text-xs text-slate-300 font-medium">
                Opening camera...
              </div>
            </div>
          )}

          {/* 3. Camera Access Denied State */}
          {(cameraState === 'denied' || cameraState === 'unsupported') && (
            <div className="p-6 text-center space-y-3 z-10 max-w-[250px] text-white">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center mx-auto text-amber-400">
                <Lock className="w-6 h-6" />
              </div>
              <div className="text-xs text-slate-200 leading-snug">
                Camera access is required to scan the counter stand.
              </div>
              <button
                type="button"
                onClick={() => startCamera(facingMode)}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-display font-bold text-xs shadow-md transition-all cursor-pointer"
              >
                Allow Camera Access
              </button>
            </div>
          )}

          {/* Targeting Corner Brackets (HUD Overlay) */}
          <div className="absolute inset-6 pointer-events-none z-10">
            <div className="absolute top-0 left-0 w-7 h-7 border-t-2 border-l-2 border-emerald-400 rounded-tl-lg" />
            <div className="absolute top-0 right-0 w-7 h-7 border-t-2 border-r-2 border-emerald-400 rounded-tr-lg" />
            <div className="absolute bottom-0 left-0 w-7 h-7 border-b-2 border-l-2 border-emerald-400 rounded-bl-lg" />
            <div className="absolute bottom-0 right-0 w-7 h-7 border-b-2 border-r-2 border-emerald-400 rounded-br-lg" />
          </div>

          {/* Animated Laser Scanning Line */}
          {cameraState === 'active' && !recognizedStore && (
            <div className="absolute inset-x-8 h-0.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent animate-bounce shadow-[0_0_15px_#34D399] pointer-events-none z-10" />
          )}

          {/* Auto-Recognition Success Card */}
          {recognizedStore && (
            <div className="absolute inset-0 bg-white/95 backdrop-blur-md flex flex-col items-center justify-center p-6 space-y-2.5 animate-in zoom-in-95 duration-200 z-20 text-slate-950">
              <div className="w-14 h-14 rounded-2xl bg-emerald-50 border-2 border-emerald-300 flex items-center justify-center text-emerald-600 shadow-md">
                <CheckCircle2 className="w-7 h-7 stroke-[2.5]" />
              </div>
              <div className="space-y-0.5 text-center">
                <span className="text-[10px] font-mono uppercase font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                  CAFE RECOGNIZED
                </span>
                <h4 className="font-display font-bold text-base text-[#0F172A]">
                  {recognizedStore.name}
                </h4>
                <p className="text-xs text-slate-500">
                  Punching your stamp in real-time...
                </p>
              </div>
            </div>
          )}

          {/* DIFFERENT CAFE QR STAND DETECTED POPUP OVERLAY */}
          {differentStoreModal && (
            <div className="absolute inset-0 bg-white/98 backdrop-blur-md flex flex-col items-center justify-between p-5 animate-in zoom-in-95 duration-200 z-30 text-slate-900 text-center">
              <div className="space-y-2.5 pt-1 w-full">
                <div className="w-12 h-12 rounded-2xl bg-amber-50 border-2 border-amber-300 text-amber-600 flex items-center justify-center mx-auto shadow-md">
                  <Store className="w-6 h-6" />
                </div>
                
                <div className="space-y-1">
                  <span className="text-[10px] font-mono uppercase font-bold text-amber-800 bg-amber-100 px-2.5 py-0.5 rounded-full">
                    DIFFERENT CAFE QR DETECTED
                  </span>
                  <h4 className="font-display font-bold text-base text-[#0F172A] leading-snug">
                    {differentStoreModal.scannedName}
                  </h4>
                  <p className="text-[11px] text-slate-500 leading-snug px-1">
                    You scanned <span className="font-bold text-slate-800">{differentStoreModal.scannedName}</span> while looking at another card.
                  </p>
                </div>
              </div>

              <div className="w-full space-y-2 pt-1">
                <button
                  type="button"
                  onClick={handleConfirmSwitchStore}
                  className="w-full py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-display font-bold text-xs shadow-md flex items-center justify-center gap-1.5 cursor-pointer transition-all active:scale-98"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Switch & Collect Stamp</span>
                </button>

                <button
                  type="button"
                  onClick={handleCancelSwitch}
                  className="w-full py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 font-display font-medium text-xs cursor-pointer transition-colors"
                >
                  Cancel / Scan Current Café
                </button>
              </div>
            </div>
          )}

          {/* Top In-Camera Controls (Torch & Camera Switch) */}
          {cameraState === 'active' && !recognizedStore && (
            <div className="absolute top-3 inset-x-3 flex items-center justify-between pointer-events-auto z-20">
              {hasTorch ? (
                <button
                  type="button"
                  onClick={toggleTorch}
                  className={`p-1.5 px-2.5 rounded-xl backdrop-blur-md border text-xs flex items-center gap-1 cursor-pointer transition-all ${
                    isTorchOn ? 'bg-amber-400 text-slate-950 border-amber-300 font-bold' : 'bg-black/60 text-white border-white/20'
                  }`}
                >
                  <Flashlight className="w-3.5 h-3.5" />
                  <span className="text-[10px]">{isTorchOn ? 'Flash On' : 'Flash'}</span>
                </button>
              ) : <div />}

              <button
                type="button"
                onClick={toggleCameraFacing}
                className="p-1.5 px-2.5 rounded-xl bg-black/60 backdrop-blur-md border border-white/20 text-white text-xs flex items-center gap-1 hover:bg-black/80 cursor-pointer shadow-2xs"
                title="Switch Camera"
              >
                <SwitchCamera className="w-3.5 h-3.5" />
                <span className="text-[10px]">Flip</span>
              </button>
            </div>
          )}
        </div>

        {/* Viewfinder Bottom Status: Cooldown Countdown or Scan Prompt */}
        {isCooldownActive ? (
          <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs text-left flex items-start gap-2.5 shadow-2xs animate-in fade-in">
            <Clock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <div className="font-bold flex items-center gap-1.5 text-amber-950">
                <span>24h Scan Cooldown Active</span>
                <span className="text-[10px] bg-amber-200/90 text-amber-950 px-2 py-0.5 rounded-full font-mono font-bold">
                  {cooldownHours}h {cooldownMins}m left
                </span>
              </div>
              <p className="text-[11px] text-amber-800 leading-tight">
                Self-serve camera scan is limited to 1 per 24 hours. Revisiting today? Ask the cashier to punch your stamp at checkout!
              </p>
            </div>
          </div>
        ) : (
          <div className="p-2.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs text-center flex items-center justify-center gap-1.5 font-medium shadow-2xs">
            <Zap className="w-3.5 h-3.5 text-emerald-600" />
            <span>Ready to scan • Point camera at counter QR stand</span>
          </div>
        )}

        {/* Error Notification */}
        {errorMessage && (
          <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs text-left flex items-start gap-2 animate-in fade-in">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <p className="leading-snug">{errorMessage}</p>
          </div>
        )}

        {/* Clean Footer Note */}
        <div className="pt-0.5 flex items-center justify-center gap-1.5 text-[11px] text-slate-400 font-mono">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>Live instant scan • 1 self-serve stamp per 24 hours</span>
        </div>
      </div>
    </div>
  );
}

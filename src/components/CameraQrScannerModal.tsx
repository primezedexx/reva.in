'use client';

// ============================================================================
// REVA (reva.in) — High-Performance Live Camera QR Code Scanner
// Hardware BarcodeDetector + Fast-Throttled jsQR Engine (Zero CPU Lag)
// Atomic Synchronous Deduplication Lock + Bulletproof Camera Flipping
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
} from 'lucide-react';
import { sound } from '@/lib/sound';

interface CameraQrScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentSlug?: string;
  customerPhone?: string;
  customerName?: string;
  onStampClaimed?: (result: {
    success: boolean;
    cooldownActive?: boolean;
    hoursRemaining?: number;
    minutesRemaining?: number;
    message?: string;
    membership?: any;
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
  onStampClaimed,
}: CameraQrScannerModalProps) {
  const router = useRouter();

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameId = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Synchronous atomic lock to strictly prevent duplicate multi-scans
  const isProcessingRef = useRef<boolean>(false);
  const lastScanTimestampRef = useRef<number>(0);
  const streamGenRef = useRef<number>(0);

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

  // Stop camera tracks cleanly
  const stopCameraStream = useCallback(() => {
    if (animationFrameId.current) {
      cancelAnimationFrame(animationFrameId.current);
      animationFrameId.current = null;
    }
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
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
    setIsTorchOn(false);
  }, []);

  // Parse cafe slug or business ID from scanned QR string
  const parseStoreFromQr = (rawText: string): string | null => {
    const trimmed = rawText.trim();

    // Pattern 1: URL path like https://reva.in/c/boba-brew or http://localhost:3000/c/tokyo-matcha
    const urlMatch = trimmed.match(/\/c\/([a-zA-Z0-9_-]+)/);
    if (urlMatch && urlMatch[1]) {
      return urlMatch[1].toLowerCase();
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

    // Pattern 3: Direct slug name (e.g. boba-brew, tokyo-matcha, down-town-bake-house-cafe)
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
      const effectivePhone =
        customerPhone ||
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
            name: customerName || undefined,
            source: 'qr_scan',
            stampAwarded: 1,
            staffNote: 'Camera Viewfinder QR Scan (Switched Store)',
          }),
        });

        const stampData = await stampRes.json();
        const isCooldown = Boolean(stampData.cooldownActive || stampRes.status === 429);
        const bizName = stampData.membership?.business?.name || stampData.business?.name || scannedName;
        const bizSlug = stampData.membership?.business?.slug || stampData.business?.slug || scannedSlug;

        setRecognizedStore({
          name: bizName,
          slug: bizSlug,
          logo_url: stampData.membership?.business?.logo_url || stampData.business?.logo_url || scannedLogo,
        });

        if (onStampClaimed) {
          onStampClaimed({
            success: Boolean(stampData.success),
            cooldownActive: isCooldown,
            hoursRemaining: stampData.hoursRemaining,
            minutesRemaining: stampData.minutesRemaining,
            message: stampData.message || stampData.error,
            membership: stampData.membership,
            business: { name: bizName, slug: bizSlug, id: stampData.membership?.business_id || stampData.business?.id },
          });
        }

        setTimeout(() => {
          stopCameraStream();
          onClose();
          router.push(`/c/${bizSlug}`);
        }, 500);
      } else {
        setTimeout(() => {
          stopCameraStream();
          onClose();
          router.push(`/c/${scannedSlug}?scan=1`);
        }, 500);
      }
    } catch {
      setErrorMessage('Failed to switch store. Please try again.');
      setTimeout(() => {
        isProcessingRef.current = false;
        setIsProcessing(false);
      }, 1500);
    }
  };

  const handleCancelSwitch = () => {
    sound.playClick();
    setDifferentStoreModal(null);
    isProcessingRef.current = false;
    setIsProcessing(false);
    startScanLoop();
  };

  // Handle successful QR detection with atomic synchronous lock
  const handleDecodedQr = useCallback(async (rawText: string) => {
    // ATOMIC LOCK: Synchronously reject any subsequent frame detections
    if (isProcessingRef.current) return;
    isProcessingRef.current = true;
    setIsProcessing(true);

    // Stop scanning loop immediately
    if (animationFrameId.current) {
      cancelAnimationFrame(animationFrameId.current);
      animationFrameId.current = null;
    }
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }

    sound.playStampPop();

    const targetSlug = parseStoreFromQr(rawText);

    if (!targetSlug) {
      setErrorMessage(`Unrecognized QR code (${rawText.slice(0, 30)}...). Please point at a Reva QR stand.`);
      setTimeout(() => {
        isProcessingRef.current = false;
        setIsProcessing(false);
      }, 1500);
      return;
    }

    // CHECK: Is the scanned QR code for a DIFFERENT café than current active pass?
    const isDifferentStore = Boolean(
      currentSlug && currentSlug.trim().toLowerCase() !== targetSlug.trim().toLowerCase()
    );

    if (isDifferentStore) {
      try {
        const res = await fetch(`/api/businesses/${targetSlug}`, { cache: 'no-store' });
        const data = await res.json();
        const biz = data.business;
        setDifferentStoreModal({
          scannedSlug: targetSlug,
          scannedName: biz?.name || targetSlug,
          scannedLogo: biz?.logo_url,
          currentSlug: currentSlug || '',
        });
        return;
      } catch {
        setDifferentStoreModal({
          scannedSlug: targetSlug,
          scannedName: targetSlug,
          currentSlug: currentSlug || '',
        });
        return;
      }
    }

    try {
      // 1. Resolve effective customer phone from session or store cache
      const effectivePhone =
        customerPhone ||
        localStorage.getItem('reva_customer_phone') ||
        localStorage.getItem(`reva_phone_${targetSlug}`) ||
        '';

      if (effectivePhone && effectivePhone.replace(/\D/g, '').length >= 10 && !effectivePhone.includes('@')) {
        // SINGLE FAST API CALL TO /api/stamp DIRECTLY (INSTANT)
        const stampRes = await fetch('/api/stamp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            slug: targetSlug,
            phone: effectivePhone,
            name: customerName || undefined,
            source: 'qr_scan',
            stampAwarded: 1,
            staffNote: 'Camera Viewfinder QR Scan',
          }),
        });

        const stampData = await stampRes.json();
        const isCooldown = Boolean(stampData.cooldownActive || stampRes.status === 429);
        const bizName = stampData.membership?.business?.name || stampData.business?.name || targetSlug;
        const bizSlug = stampData.membership?.business?.slug || stampData.business?.slug || targetSlug;

        setRecognizedStore({
          name: bizName,
          slug: bizSlug,
          logo_url: stampData.membership?.business?.logo_url || stampData.business?.logo_url,
        });

        // Pass result to parent callback immediately for in-place reactive UI update
        if (onStampClaimed) {
          onStampClaimed({
            success: Boolean(stampData.success),
            cooldownActive: isCooldown,
            hoursRemaining: stampData.hoursRemaining,
            minutesRemaining: stampData.minutesRemaining,
            message: stampData.message || stampData.error,
            membership: stampData.membership,
            business: { name: bizName, slug: bizSlug, id: stampData.membership?.business_id || stampData.business?.id },
          });
        }

        // Close scanner quickly without reloading
        setTimeout(() => {
          stopCameraStream();
          onClose();
        }, isCooldown ? 350 : 550);
      } else {
        // First-time guest without phone: fetch store name and smoothly navigate to join pass
        const res = await fetch(`/api/businesses/${targetSlug}`, { cache: 'no-store' });
        const data = await res.json();
        const biz = data.business;
        if (biz) {
          setRecognizedStore({
            name: biz.name,
            slug: biz.slug,
            logo_url: biz.logo_url,
          });
        }
        setTimeout(() => {
          stopCameraStream();
          onClose();
          if (onStampClaimed) {
            onStampClaimed({
              success: false,
              guestRedirect: true,
              business: biz ? { name: biz.name, slug: biz.slug, id: biz.id } : { name: targetSlug, slug: targetSlug },
            });
          }
          if (currentSlug !== targetSlug && (!currentSlug || !onStampClaimed)) {
            router.push(`/c/${targetSlug}?scan=1`);
          }
        }, 600);
      }
    } catch (err) {
      console.error('QR scan resolution error:', err);
      setErrorMessage('Failed to process QR scan. Please try again.');
      setTimeout(() => {
        isProcessingRef.current = false;
        setIsProcessing(false);
      }, 1500);
    }
  }, [customerPhone, customerName, currentSlug, onStampClaimed, onClose, router, stopCameraStream]);

  // High-performance hardware BarcodeDetector + downscaled jsQR scan loop
  const executeFrameScan = useCallback(async () => {
    if (isProcessingRef.current || !videoRef.current) return;
    const video = videoRef.current;

    // Ensure video has received video frames and is ready
    if (video.readyState < video.HAVE_CURRENT_DATA || video.videoWidth === 0 || video.videoHeight === 0) {
      return;
    }

    // 1. Hardware accelerated BarcodeDetector (Chrome/Android/Edge)
    if (typeof window !== 'undefined' && 'BarcodeDetector' in window) {
      try {
        // @ts-expect-error Native BarcodeDetector
        const detector = new window.BarcodeDetector({ formats: ['qr_code'] });
        const barcodes = await detector.detect(video);
        if (barcodes && barcodes.length > 0 && barcodes[0].rawValue) {
          handleDecodedQr(barcodes[0].rawValue);
          return;
        }
      } catch {
        // Fall back to jsQR
      }
    }

    // 2. Optimized Downscaled jsQR Engine (Runs in <5ms, zero CPU lag)
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    // Downscale canvas to max 480px width for fast decoding
    const maxDimension = 480;
    const scale = Math.min(1, maxDimension / Math.max(video.videoWidth, video.videoHeight));
    const targetWidth = Math.max(160, Math.floor(video.videoWidth * scale));
    const targetHeight = Math.max(160, Math.floor(video.videoHeight * scale));

    if (canvas.width !== targetWidth || canvas.height !== targetHeight) {
      canvas.width = targetWidth;
      canvas.height = targetHeight;
    }

    ctx.drawImage(video, 0, 0, targetWidth, targetHeight);
    const imageData = ctx.getImageData(0, 0, targetWidth, targetHeight);
    const code = jsQR(imageData.data, targetWidth, targetHeight, {
      inversionAttempts: 'dontInvert',
    });

    if (code && code.data && code.data.trim().length > 0) {
      handleDecodedQr(code.data);
    }
  }, [handleDecodedQr]);

  // Ultra-fast throttled scan scheduler (every 60ms = ~16 scans/sec for near-instant detection)
  const startScanLoop = useCallback(() => {
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
    }
    scanIntervalRef.current = setInterval(() => {
      if (!isProcessingRef.current) {
        executeFrameScan();
      }
    }, 60);
  }, [executeFrameScan]);

  // Robust Camera Stream Initiator with Fallback Constraints
  const startCamera = useCallback(async (mode: 'environment' | 'user') => {
    const currentGen = ++streamGenRef.current;
    stopCameraStream();
    setErrorMessage(null);
    setIsProcessing(false);
    isProcessingRef.current = false;
    setRecognizedStore(null);
    setCameraState('prompt');

    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      setCameraState('unsupported');
      setErrorMessage('Camera access is not supported by this browser.');
      return;
    }

    // Give hardware driver 60ms to release locks
    await new Promise((r) => setTimeout(r, 60));
    if (currentGen !== streamGenRef.current) return;

    let stream: MediaStream | null = null;

    // Constraint Strategy 1: Ideal facingMode + Resolution
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: mode },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });
    } catch {
      // Constraint Strategy 2: Exact/Direct facingMode
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: mode },
          audio: false,
        });
      } catch {
        // Constraint Strategy 3: Universal fallback (works on 100% of webcams/laptops)
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: false,
          });
        } catch (err) {
          if (currentGen !== streamGenRef.current) return;
          console.warn('Camera getUserMedia failed on all constraints:', err);
          setCameraState('denied');
          if (err instanceof DOMException && err.name === 'NotAllowedError') {
            setErrorMessage('Camera access was blocked. Please enable camera permissions in your browser.');
          } else {
            setErrorMessage('Could not open camera stream. Please check camera permissions.');
          }
          return;
        }
      }
    }

    if (currentGen !== streamGenRef.current) {
      stream?.getTracks().forEach((t) => t.stop());
      return;
    }

    streamRef.current = stream;
    if (videoRef.current) {
      videoRef.current.srcObject = stream;
      videoRef.current.setAttribute('playsinline', 'true');
      try {
        await videoRef.current.play();
      } catch (playErr) {
        console.warn('Video play error:', playErr);
      }
    }

    // Check torch / flashlight capability
    try {
      const track = stream.getVideoTracks()[0];
      const capabilities = track.getCapabilities?.() as { torch?: boolean } | undefined;
      setHasTorch(Boolean(capabilities?.torch));
    } catch {
      setHasTorch(false);
    }

    setCameraState('active');
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

  // Lifecycle on modal Open/Close
  useEffect(() => {
    if (isOpen) {
      startCamera(facingMode);
    } else {
      stopCameraStream();
    }
    return () => {
      stopCameraStream();
    };
  }, [isOpen, startCamera, stopCameraStream]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
      {/* Hidden processing canvas for jsQR fallback */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Crisp White Card Modal */}
      <div className="bg-white text-slate-900 rounded-[32px] max-w-sm w-full p-6 space-y-4 border border-slate-100 shadow-2xl relative overflow-hidden text-center">
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
        <div className="space-y-1 pt-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-mono font-bold uppercase tracking-widest">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
            <span>LIVE SCANNER</span>
          </div>
          <h3 className="font-display font-bold text-xl text-[#0F172A] tracking-tight">
            Scan Counter QR
          </h3>
          <p className="text-xs text-slate-500">
            Point your camera at the Reva QR stand on the counter
          </p>
        </div>

        {/* Clean Camera Viewfinder Frame */}
        <div className="relative w-full aspect-square rounded-2xl bg-slate-950 overflow-hidden border border-slate-200 shadow-inner flex items-center justify-center">
          {/* 1. Permanent Video Element (Must never be conditionally unmounted to preserve videoRef and srcObject) */}
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            onLoadedMetadata={(e) => {
              (e.target as HTMLVideoElement).play().catch(() => {});
            }}
            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${
              cameraState === 'active' ? 'opacity-100' : 'opacity-0 pointer-events-none'
            }`}
          />

          {/* 2. Camera Access Opening State */}
          {cameraState === 'prompt' && (
            <div className="p-6 text-center space-y-3 z-10 text-white">
              <div className="w-12 h-12 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center mx-auto text-emerald-400">
                <Camera className="w-6 h-6 animate-pulse" />
              </div>
              <div className="text-xs text-slate-300 font-medium">
                Starting camera preview...
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

        {/* Error Notification */}
        {errorMessage && (
          <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs text-left flex items-start gap-2 animate-in fade-in">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <p className="leading-snug">{errorMessage}</p>
          </div>
        )}

        {/* Clean Footer Note */}
        <div className="pt-1 flex items-center justify-center gap-1.5 text-[11px] text-slate-400 font-mono">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>Live local scan • 1 stamp per 24 hours</span>
        </div>
      </div>
    </div>
  );
}

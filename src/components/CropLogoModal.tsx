'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { X, ZoomIn, ZoomOut, RotateCcw, Check, RefreshCw, Move, Sparkles } from 'lucide-react';

interface CropLogoModalProps {
  isOpen: boolean;
  imageSrc: string;
  onClose: () => void;
  onSave: (croppedDataUrl: string) => Promise<void>;
  isSaving?: boolean;
}

const VIEWPORT_SIZE = 280; // Size of square preview container in px
const TARGET_SIZE = 400;   // Output canvas size in px

export default function CropLogoModal({
  isOpen,
  imageSrc,
  onClose,
  onSave,
  isSaving = false,
}: CropLogoModalProps) {
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [naturalSize, setNaturalSize] = useState({ width: 0, height: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0, startPanX: 0, startPanY: 0 });
  const imgRef = useRef<HTMLImageElement>(null);
  const [previewDataUrl, setPreviewDataUrl] = useState<string>('');

  // Reset state when new image opens
  useEffect(() => {
    if (isOpen && imageSrc) {
      setZoom(1);
      setPan({ x: 0, y: 0 });
    }
  }, [isOpen, imageSrc]);

  // Handle image load to record natural dimensions
  const handleImageLoaded = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    setNaturalSize({ width: img.naturalWidth, height: img.naturalHeight });
  };

  // Base dimensions calculation to fit image inside VIEWPORT_SIZE
  const getBaseDimensions = useCallback(() => {
    if (!naturalSize.width || !naturalSize.height) {
      return { width: VIEWPORT_SIZE, height: VIEWPORT_SIZE };
    }
    const scale = Math.max(
      VIEWPORT_SIZE / naturalSize.width,
      VIEWPORT_SIZE / naturalSize.height
    );
    return {
      width: naturalSize.width * scale,
      height: naturalSize.height * scale,
    };
  }, [naturalSize]);

  // Generate cropped preview data URL for live pass preview
  const generateCroppedDataUrl = useCallback((): string => {
    if (!naturalSize.width || !naturalSize.height || !imgRef.current) return '';

    const canvas = document.createElement('canvas');
    canvas.width = TARGET_SIZE;
    canvas.height = TARGET_SIZE;
    const ctx = canvas.getContext('2d');
    if (!ctx) return '';

    // Enable high-quality smoothing
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    const base = getBaseDimensions();
    const renderedW = base.width * zoom;
    const renderedH = base.height * zoom;

    // Viewport to canvas scale factor
    const ratio = TARGET_SIZE / VIEWPORT_SIZE;

    // Center in canvas + pan scaled to canvas
    const drawCenterX = TARGET_SIZE / 2 + pan.x * ratio;
    const drawCenterY = TARGET_SIZE / 2 + pan.y * ratio;
    const drawW = renderedW * ratio;
    const drawH = renderedH * ratio;

    const drawX = drawCenterX - drawW / 2;
    const drawY = drawCenterY - drawH / 2;

    ctx.drawImage(imgRef.current, drawX, drawY, drawW, drawH);
    return canvas.toDataURL('image/jpeg', 0.92);
  }, [naturalSize, getBaseDimensions, zoom, pan]);

  // Update live preview when pan or zoom changes
  useEffect(() => {
    if (!isOpen || !imageSrc || !naturalSize.width) return;
    const timer = setTimeout(() => {
      try {
        const url = generateCroppedDataUrl();
        setPreviewDataUrl(url);
      } catch {}
    }, 60);
    return () => clearTimeout(timer);
  }, [isOpen, imageSrc, naturalSize, zoom, pan, generateCroppedDataUrl]);

  // Drag pan handlers (Mouse)
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      startPanX: pan.x,
      startPanY: pan.y,
    };
  };

  // Drag pan handlers (Touch)
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      setIsDragging(true);
      dragStartRef.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
        startPanX: pan.x,
        startPanY: pan.y,
      };
    }
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      const dx = e.clientX - dragStartRef.current.x;
      const dy = e.clientY - dragStartRef.current.y;
      setPan({
        x: dragStartRef.current.startPanX + dx,
        y: dragStartRef.current.startPanY + dy,
      });
    };

    const handleMouseUp = () => {
      if (isDragging) setIsDragging(false);
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isDragging || e.touches.length !== 1) return;
      const dx = e.touches[0].clientX - dragStartRef.current.x;
      const dy = e.touches[0].clientY - dragStartRef.current.y;
      setPan({
        x: dragStartRef.current.startPanX + dx,
        y: dragStartRef.current.startPanY + dy,
      });
    };

    const handleTouchEnd = () => {
      if (isDragging) setIsDragging(false);
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      window.addEventListener('touchmove', handleTouchMove);
      window.addEventListener('touchend', handleTouchEnd);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isDragging]);

  const handleReset = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  const handleApplySave = async () => {
    const dataUrl = generateCroppedDataUrl();
    if (!dataUrl) return;
    await onSave(dataUrl);
  };

  if (!isOpen) return null;

  const base = getBaseDimensions();

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fadeIn"
      role="dialog"
      aria-modal="true"
      aria-labelledby="crop-modal-title"
    >
      <div className="bg-white rounded-3xl max-w-md w-full overflow-hidden shadow-2xl border border-slate-200 animate-scaleUp">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center font-bold">
              <Sparkles className="w-5 h-5 text-amber-500" />
            </div>
            <div>
              <h3 id="crop-modal-title" className="font-display font-bold text-slate-900 text-base sm:text-lg">
                Position & Crop Logo
              </h3>
              <p className="text-[11px] text-slate-500 font-medium">
                Pan & zoom to fit your circular cafe badge
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Crop Viewport */}
        <div className="p-6 flex flex-col items-center bg-slate-50/70 border-b border-slate-100">
          <div
            className="relative overflow-hidden rounded-2xl bg-slate-900 cursor-grab active:cursor-grabbing select-none touch-none shadow-inner"
            style={{ width: VIEWPORT_SIZE, height: VIEWPORT_SIZE }}
            onMouseDown={handleMouseDown}
            onTouchStart={handleTouchStart}
          >
            {/* The Image */}
            {imageSrc && (
              <img
                ref={imgRef}
                src={imageSrc}
                alt="Crop preview"
                onLoad={handleImageLoaded}
                draggable={false}
                className="absolute origin-center transition-transform pointer-events-none"
                style={{
                  width: `${base.width * zoom}px`,
                  height: `${base.height * zoom}px`,
                  left: `calc(50% + ${pan.x}px)`,
                  top: `calc(50% + ${pan.y}px)`,
                  transform: 'translate(-50%, -50%)',
                }}
              />
            )}

            {/* Circular Aperture Mask: darkened vignette outside the round circle */}
            <div
              className="absolute inset-0 pointer-events-none rounded-full border-2 border-white/90 shadow-[0_0_0_9999px_rgba(15,23,42,0.68)]"
              style={{
                width: VIEWPORT_SIZE - 20,
                height: VIEWPORT_SIZE - 20,
                top: 10,
                left: 10,
              }}
            >
              {/* Subtle crosshairs */}
              <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 border-t border-white/20 border-dashed" />
              <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 border-l border-white/20 border-dashed" />
            </div>

            {/* Drag hint overlay */}
            <div className="absolute bottom-2.5 inset-x-0 flex justify-center pointer-events-none">
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-black/60 text-white text-[10px] font-medium backdrop-blur-xs">
                <Move className="w-3 h-3 text-amber-300" />
                Drag to reposition
              </span>
            </div>
          </div>

          {/* Zoom Slider & Controls */}
          <div className="w-full max-w-[280px] mt-4 space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-600 font-medium">
              <span className="flex items-center gap-1">
                <ZoomOut className="w-3.5 h-3.5 text-slate-400" />
                Zoom
              </span>
              <span className="font-mono text-[11px] text-slate-500 font-semibold">{zoom.toFixed(2)}x</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setZoom((z) => Math.max(1, +(z - 0.15).toFixed(2)))}
                className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 cursor-pointer shadow-2xs"
                title="Zoom out"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <input
                type="range"
                min="1"
                max="3"
                step="0.05"
                value={zoom}
                onChange={(e) => setZoom(parseFloat(e.target.value))}
                className="flex-1 h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#0F172A]"
              />
              <button
                type="button"
                onClick={() => setZoom((z) => Math.min(3, +(z + 0.15).toFixed(2)))}
                className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 cursor-pointer shadow-2xs"
                title="Zoom in"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={handleReset}
                className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 cursor-pointer shadow-2xs"
                title="Reset zoom & position"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Live Customer Pass Preview */}
        <div className="px-6 py-3.5 bg-white flex items-center justify-between border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-slate-200 shadow-sm bg-slate-100 shrink-0">
              {previewDataUrl ? (
                <img src={previewDataUrl} alt="Circular preview" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-slate-200 animate-pulse" />
              )}
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900 tracking-tight">Customer Pass Preview</p>
              <p className="text-[10px] text-slate-500">Live circular badge on phone pass</p>
            </div>
          </div>
          <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
            400 × 400 HD
          </span>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-50 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold cursor-pointer transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleApplySave}
            disabled={isSaving}
            className="px-5 py-2.5 rounded-xl bg-[#0F172A] hover:bg-black text-white text-xs font-bold shadow-md hover:shadow-lg inline-flex items-center gap-2 cursor-pointer transition-all hover:scale-[1.02] active:scale-98 disabled:opacity-50"
          >
            {isSaving ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin text-amber-400" />
                <span>Saving to Database...</span>
              </>
            ) : (
              <>
                <Check className="w-4 h-4 text-emerald-400" />
                <span>Save & Apply Photo</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { RefreshCw, Store, Home } from 'lucide-react';

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Customer Pass Error:', error);
  }, [error]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-slate-50 text-center font-sans">
      <div className="w-16 h-16 bg-white border border-slate-200 rounded-3xl flex items-center justify-center mb-5 shadow-sm text-[#0F172A]">
        <Store className="w-8 h-8" />
      </div>

      <h1 className="text-xl font-bold text-[#0F172A] mb-2 font-display">
        Unable to Load Loyalty Pass
      </h1>

      <p className="text-xs text-slate-500 max-w-sm mb-6 leading-relaxed">
        We encountered a momentary glitch loading this store's digital card. Tap below to reload your pass.
      </p>

      <div className="flex flex-col gap-2.5 w-full max-w-xs">
        <button
          onClick={() => reset()}
          className="w-full py-3.5 rounded-full bg-[#0F172A] text-white text-xs font-bold hover:bg-black transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer active:scale-95"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Reload Loyalty Pass</span>
        </button>

        <Link
          href="/c"
          className="w-full py-3 rounded-full bg-white border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50 transition-all flex items-center justify-center gap-2"
        >
          <Home className="w-4 h-4 text-slate-400" />
          <span>Browse All Active Passes</span>
        </Link>
      </div>
    </div>
  );
}

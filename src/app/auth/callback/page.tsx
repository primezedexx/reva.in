'use client';

// ============================================================================
// REVA (reva.in) — Client-Side OAuth Callback Handler (/auth/callback)
// Exchanges PKCE tokens in browser localStorage & syncs profile seamlessly
// ============================================================================

import React, { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Sparkles, Loader2, AlertCircle } from 'lucide-react';

function AuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'verifying' | 'syncing' | 'redirecting' | 'error'>('verifying');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function handleAuth() {
      try {
        const role = searchParams.get('role') || 'business';
        const next = searchParams.get('next') || (role === 'customer' ? '/c' : '/dashboard');

        // 1. Check for ?code= parameter (PKCE flow)
        const code = searchParams.get('code');
        let session = null;

        if (code) {
          try {
            const { data: exchangeData, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
            if (!exchangeError && exchangeData?.session) {
              session = exchangeData.session;
            }
          } catch (exErr) {
            console.warn('exchangeCodeForSession client catch:', exErr);
          }
        }

        // 2. If no code or code already consumed, check active session from localStorage / hash
        if (!session) {
          const { data: sessionData } = await supabase.auth.getSession();
          session = sessionData?.session;
        }

        if (session?.user) {
          await processUser(session.user, role, next);
          return;
        }

        // 3. Fallback: Listen to onAuthStateChange (Supabase detectSessionInUrl)
        const { data: authListener } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
          if (currentSession?.user && isMounted) {
            authListener.subscription.unsubscribe();
            await processUser(currentSession.user, role, next);
          }
        });

        // 4. Final timeout guard: Redirect after 4 seconds if no session resolved
        setTimeout(async () => {
          if (isMounted) {
            const { data: fallbackData } = await supabase.auth.getSession();
            if (fallbackData?.session?.user) {
              await processUser(fallbackData.session.user, role, next);
            } else {
              router.replace(role === 'customer' ? '/login?role=customer' : '/login');
            }
          }
        }, 3500);

      } catch (err: unknown) {
        console.error('Auth callback error:', err);
        if (isMounted) {
          setStatus('error');
          setErrorMessage(err instanceof Error ? err.message : 'Authentication verification failed');
          setTimeout(() => router.replace('/login'), 2500);
        }
      }
    }

    async function processUser(user: any, role: string, next: string) {
      if (!isMounted) return;
      setStatus('syncing');

      const rawName =
        user.user_metadata?.full_name ||
        user.user_metadata?.name ||
        user.email?.split('@')[0] ||
        'Valued Member';
      const avatarUrl =
        user.user_metadata?.custom_avatar ||
        user.user_metadata?.avatar_url ||
        user.user_metadata?.picture ||
        undefined;

      if (role === 'customer') {
        const userEmail = user.email?.trim().toLowerCase() || undefined;
        const userPhone = user.phone?.trim() || undefined;
        const phoneOrId = userPhone || userEmail || user.id;

        try {
          await fetch('/api/customer/auth', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'verify_otp',
              phone: phoneOrId,
              name: rawName,
              avatar_url: avatarUrl,
              auth_provider: 'google',
              auth_user_id: user.id,
              email: userEmail,
            }),
          });
        } catch (e) {
          console.error('Customer sync error:', e);
        }

        if (isMounted) {
          setStatus('redirecting');
          router.replace(next || '/c');
        }
      } else {
        // Business owner sync
        try {
          const syncRes = await fetch('/api/auth/sync', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId: user.id,
              email: user.email,
              name: rawName,
            }),
          });
          const syncData = await syncRes.json();
          if (syncData?.business?.id) {
            sessionStorage.setItem('reva_cached_business_id', syncData.business.id);
          }
        } catch (e) {
          console.error('Business sync error:', e);
        }

        if (isMounted) {
          setStatus('redirecting');
          router.replace(next || '/dashboard');
        }
      }
    }

    handleAuth();

    return () => {
      isMounted = false;
    };
  }, [searchParams, router]);

  return (
    <div className="min-h-screen bg-[#0F172A] text-white flex flex-col items-center justify-center p-6 select-none font-sans">
      <div className="w-full max-w-md bg-slate-900/80 border border-slate-800 rounded-3xl p-8 backdrop-blur-xl shadow-2xl text-center flex flex-col items-center">
        {/* Animated Brand Icon */}
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-400 flex items-center justify-center shadow-lg shadow-amber-500/20 mb-6">
          <Sparkles className="w-8 h-8 text-slate-950 animate-pulse" />
        </div>

        <h1 className="text-2xl font-bold font-outfit text-white mb-2 tracking-tight">
          {status === 'verifying' && 'Verifying Google Account...'}
          {status === 'syncing' && 'Setting Up Your Profile...'}
          {status === 'redirecting' && 'Welcome to Reva!'}
          {status === 'error' && 'Sign In Notice'}
        </h1>

        <p className="text-slate-400 text-sm mb-6">
          {status === 'verifying' && 'Securely confirming authentication with Supabase...'}
          {status === 'syncing' && 'Syncing your loyalty passes and dashboard...'}
          {status === 'redirecting' && 'Opening your application now...'}
          {status === 'error' && (errorMessage || 'Redirecting back to login...')}
        </p>

        {/* Loading Spinner */}
        <div className="flex items-center justify-center">
          {status !== 'error' ? (
            <div className="flex items-center gap-3 px-4 py-2 rounded-full bg-slate-800/60 border border-slate-700/50 text-amber-400 text-xs font-medium">
              <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
              <span>Securing session...</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-medium">
              <AlertCircle className="w-4 h-4 text-rose-400" />
              <span>Returning to login...</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#0F172A] flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-amber-400" />
        </div>
      }
    >
      <AuthCallbackContent />
    </Suspense>
  );
}

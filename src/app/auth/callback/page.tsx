'use client';

// ============================================================================
// REVA (reva.in) — Client-Side OAuth Callback Handler (/auth/callback)
// Exchanges PKCE tokens in browser localStorage & syncs profile seamlessly
// Strict persona separation: Customers go to /c, Store Owners go to /dashboard
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
        // Priority 1: Check URL query parameter (if preserved by provider)
        const urlRole = searchParams.get('role');
        const urlNext = searchParams.get('next');

        // Priority 2: Check pre-OAuth persisted intent in localStorage & cookies
        let savedIntentRole: string | null = null;
        let savedIntentNext: string | null = null;
        if (typeof window !== 'undefined') {
          savedIntentRole = localStorage.getItem('reva_auth_intended_role');
          savedIntentNext = localStorage.getItem('reva_auth_intended_next');
        }
        if (!savedIntentRole && typeof document !== 'undefined') {
          const match = document.cookie.match(/(?:^|;\s*)reva_auth_intended_role=([^;]+)/);
          if (match) savedIntentRole = decodeURIComponent(match[1]);
        }

        const initialRole = urlRole || savedIntentRole || '';
        const initialNext = urlNext || savedIntentNext || '';

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
          await processUser(session.user, initialRole, initialNext);
          return;
        }

        // 3. Fallback: Listen to onAuthStateChange (Supabase detectSessionInUrl)
        const { data: authListener } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
          if (currentSession?.user && isMounted) {
            authListener.subscription.unsubscribe();
            await processUser(currentSession.user, initialRole, initialNext);
          }
        });

        // 4. Final timeout guard: Redirect after 3.5 seconds if no session resolved
        setTimeout(async () => {
          if (isMounted) {
            const { data: fallbackData } = await supabase.auth.getSession();
            if (fallbackData?.session?.user) {
              await processUser(fallbackData.session.user, initialRole, initialNext);
            } else {
              router.replace(initialRole === 'customer' ? '/login?role=customer' : '/login');
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

    async function processUser(user: any, requestedRole: string, requestedNext: string) {
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

      // All Supabase OAuth / Google logins are EXCLUSIVELY for Business Owners
      const effectiveRole = 'business';
      const effectiveNext =
        requestedNext && requestedNext !== '/c' ? requestedNext : '/dashboard';

      // Clear temporary pre-auth intent
      try {
        localStorage.removeItem('reva_auth_intended_role');
        localStorage.removeItem('reva_auth_intended_next');
        document.cookie = 'reva_auth_intended_role=; path=/; max-age=0';
      } catch {}

      // Persist active session role as business owner
      try {
        localStorage.setItem('reva_auth_role', 'business');
        document.cookie = 'reva_auth_role=business; path=/; max-age=2592000; SameSite=Lax';
        // Clear any old customer pass data from merchant's browser
        localStorage.removeItem('reva_customer_phone');
        localStorage.removeItem('reva_customer_passes');
        localStorage.removeItem('reva_customer_email');
        localStorage.removeItem('reva_customer_name');
        localStorage.removeItem('reva_customer_avatar');
        localStorage.removeItem('reva_customer_auth_user_id');
        document.cookie = 'reva_customer_phone=; path=/; max-age=0';
        document.cookie = 'reva_customer_email=; path=/; max-age=0';
      } catch {}

      // Provision or sync Business Owner profile and store
      try {
        const syncRes = await fetch('/api/auth/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: user.id,
            email: user.email,
            name: rawName,
            role: 'business',
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
        router.replace(effectiveNext || '/dashboard');
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
          {status === 'redirecting' && 'Welcome to Siplo!'}
          {status === 'error' && 'Sign In Notice'}
        </h1>

        <p className="text-slate-400 text-sm mb-6">
          {status === 'verifying' && 'Securely confirming authentication with Supabase...'}
          {status === 'syncing' && 'Syncing your loyalty passes and account...'}
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

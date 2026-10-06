// ============================================================================
// REVA (reva.in) — Supabase Client Instance & Auth Utilities
// ============================================================================

import { createClient, User, Session } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://dxhugymwqmqzhnpwodab.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e30.placeholder';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || supabaseAnonKey;

// Public client for browser & client-side requests
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

// Admin client for backend server routes & API handlers (bypasses RLS)
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// ============================================================================
// Auth Helper Utilities
// ============================================================================

export async function signInWithEmail(email: string, password: string) {
  return await supabase.auth.signInWithPassword({
    email: email.trim(),
    password,
  });
}

export async function signUpWithEmail(
  email: string,
  password: string,
  metadata?: { name?: string; business_name?: string; city?: string }
) {
  return await supabase.auth.signUp({
    email: email.trim(),
    password,
    options: {
      data: metadata || {},
    },
  });
}

export async function signInWithGoogle(redirectTo?: string) {
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://reva.in';
  return await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: redirectTo || `${origin}/auth/callback`,
      queryParams: {
        access_type: 'offline',
        prompt: 'select_account',
      },
    },
  });
}

export async function signOutUser() {
  return await supabase.auth.signOut();
}

export async function resetPassword(email: string, redirectTo?: string) {
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://reva.in';
  return await supabase.auth.resetPasswordForEmail(email.trim(), {
    redirectTo: redirectTo || `${origin}/login?mode=reset`,
  });
}

export async function getCurrentUser(): Promise<User | null> {
  const { data } = await supabase.auth.getUser();
  return data.user;
}

export async function getCurrentSession(): Promise<Session | null> {
  const { data } = await supabase.auth.getSession();
  return data.session;
}


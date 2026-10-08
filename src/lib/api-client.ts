// ============================================================================
// REVA (reva.in) — Authenticated Fetch Client (api-client.ts)
// Automatically attaches Supabase Bearer token and ensures cookie sync.
// ============================================================================

import { supabase } from '@/lib/supabase';

/**
 * Performs a fetch request with Supabase Auth Bearer token and same-origin credentials.
 */
export async function authFetch(
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<Response> {
  const headers = new Headers(init?.headers);

  if (!headers.has('Authorization')) {
    try {
      const { data } = await supabase.auth.getSession();
      const token = data?.session?.access_token;
      if (token) {
        headers.set('Authorization', `Bearer ${token}`);
        if (typeof document !== 'undefined') {
          const isSecure = typeof window !== 'undefined' && window.location.protocol === 'https:';
          document.cookie = `sb-access-token=${token}; path=/; max-age=2592000; SameSite=Lax; ${isSecure ? 'Secure;' : ''}`;
        }
      }
    } catch {
      // Ignore session lookup failures
    }
  }

  return fetch(input, {
    ...init,
    headers,
    credentials: init?.credentials || 'same-origin',
  });
}

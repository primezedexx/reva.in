// ============================================================================
// REVA (reva.in) — Server-Side Authentication & Session Hardening
// Shared security module for API routes:
// 1. Origin Verification (CSRF Defense)
// 2. Merchant Auth (Bearer Token / Cookie Session Verification via Supabase)
// 3. Customer Session (Signed HMAC-SHA256 HttpOnly Cookie)
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { supabaseAdmin } from '@/lib/supabase';
import { db } from '@/lib/db';
import { Business, Owner } from '@/types/database';

// Secret used for signing customer session cookies
function getCustomerSessionSecret(): string {
  const secret = process.env.CUSTOMER_SESSION_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!secret) {
    throw new Error('Neither CUSTOMER_SESSION_SECRET nor SUPABASE_SERVICE_ROLE_KEY is set.');
  }
  return secret;
}

export const CUSTOMER_SESSION_COOKIE_NAME = 'reva_cust_session';
export const CUSTOMER_SESSION_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

export interface CustomerSessionPayload {
  customerId: string;
  phone: string;
  issuedAt: number;
  expiresAt: number;
}

export interface AuthUserResult {
  user: {
    id: string;
    email?: string;
    app_metadata?: Record<string, any>;
    user_metadata?: Record<string, any>;
  };
  token: string;
}

export interface RequireOwnerResult {
  authorized: boolean;
  status?: number;
  error?: string;
  user?: AuthUserResult['user'];
  business?: Business;
  owner?: Owner | null;
}

export interface RequireAdminResult {
  authorized: boolean;
  status?: number;
  error?: string;
  user?: AuthUserResult['user'];
}

export interface RequireCustomerResult {
  authorized: boolean;
  status?: number;
  error?: string;
  session?: CustomerSessionPayload;
}

// ============================================================================
// 1. CSRF & ORIGIN DEFENSE
// ============================================================================

/**
 * Validates that mutating requests (POST, PUT, PATCH, DELETE) originate from
 * the expected Reva host.
 */
export function assertSameOrigin(req: NextRequest | Request): {
  allowed: boolean;
  error?: string;
} {
  const origin = req.headers.get('origin');
  const referer = req.headers.get('referer');
  const host = req.headers.get('host');

  // If neither Origin nor Referer is present (e.g., server-to-server webhook),
  // let route-specific checks handle authorization.
  if (!origin && !referer) {
    return { allowed: true };
  }

  const incomingOrigin = origin || (referer ? new URL(referer).origin : null);
  if (!incomingOrigin) {
    return { allowed: true };
  }

  let incomingHost: string;
  try {
    incomingHost = new URL(incomingOrigin).host;
  } catch {
    return { allowed: false, error: 'Malformed Origin / Referer header.' };
  }

  if (host && incomingHost.toLowerCase() === host.toLowerCase()) {
    return { allowed: true };
  }

  // Trusted production & local hosts
  const allowedHosts = [
    'reva.in',
    'www.reva.in',
    'localhost',
    '127.0.0.1',
  ];

  const incomingHostname = incomingHost.split(':')[0].toLowerCase();

  const isExplicitlyAllowed =
    allowedHosts.includes(incomingHostname) ||
    incomingHostname.endsWith('.vercel.app') ||
    incomingHostname.endsWith('.reva.in');

  if (isExplicitlyAllowed) {
    return { allowed: true };
  }

  return {
    allowed: false,
    error: `Cross-origin request blocked: origin ${incomingOrigin} is not allowed.`,
  };
}

// ============================================================================
// 2. MERCHANT & ADMIN SUPABASE AUTH HELPERS
// ============================================================================

/**
 * Extracts and verifies the Supabase Auth user from:
 * 1. Authorization: Bearer <token> header
 * 2. sb-access-token cookie
 */
export async function getAuthUser(
  req: NextRequest | Request
): Promise<AuthUserResult | null> {
  try {
    let token: string | null = null;

    // Check Authorization header
    const authHeader = req.headers.get('authorization');
    if (authHeader && authHeader.toLowerCase().startsWith('bearer ')) {
      token = authHeader.substring(7).trim();
    }

    // Check cookies fallback
    if (!token) {
      if ('cookies' in req && typeof req.cookies?.get === 'function') {
        const nextReq = req as NextRequest;
        token = nextReq.cookies.get('sb-access-token')?.value || null;

        if (!token) {
          // Check standard Supabase auth cookie pattern
          const allCookies = nextReq.cookies.getAll();
          for (const c of allCookies) {
            if (c.name.includes('-auth-token') || c.name.startsWith('sb-')) {
              try {
                const parsed = JSON.parse(decodeURIComponent(c.value));
                if (parsed?.access_token) {
                  token = parsed.access_token;
                  break;
                }
              } catch {
                token = c.value;
                break;
              }
            }
          }
        }
      } else {
        const cookieHeader = req.headers.get('cookie') || '';
        const match = cookieHeader.match(/sb-access-token=([^;]+)/);
        if (match) token = match[1];
      }
    }

    if (!token) return null;

    const { data, error } = await supabaseAdmin.auth.getUser(token);
    if (error || !data?.user) {
      return null;
    }

    return {
      user: data.user,
      token,
    };
  } catch (err) {
    console.error('getAuthUser error:', err);
    return null;
  }
}

/**
 * Confirms that the caller is an authenticated owner who owns the specified business.
 * If businessId is not provided, verifies that user owns at least one business.
 */
export async function requireOwner(
  req: NextRequest | Request,
  businessIdOrSlug?: string
): Promise<RequireOwnerResult> {
  const auth = await getAuthUser(req);
  if (!auth) {
    return {
      authorized: false,
      status: 401,
      error: 'Authentication required. Please log in as a store owner.',
    };
  }

  const user = auth.user;
  const owner = await db.getOwnerByUserId(user.id);

  if (businessIdOrSlug) {
    let targetBiz: Business | null = null;
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(businessIdOrSlug);

    if (isUuid) {
      targetBiz = await db.getBusinessById(businessIdOrSlug);
    } else {
      targetBiz = await db.getBusinessBySlug(businessIdOrSlug);
    }

    if (!targetBiz) {
      return {
        authorized: false,
        status: 404,
        error: 'Business not found.',
      };
    }

    const ownsDirectly = targetBiz.owner_id === user.id;
    const ownsViaOwnerRecord = owner?.business_id === targetBiz.id;

    if (!ownsDirectly && !ownsViaOwnerRecord) {
      return {
        authorized: false,
        status: 403,
        error: 'Forbidden: You do not have permission to manage this business.',
      };
    }

    return {
      authorized: true,
      user,
      business: targetBiz,
      owner,
    };
  }

  let business: Business | null = null;
  if (owner?.business_id) {
    business = await db.getBusinessById(owner.business_id);
  }
  if (!business) {
    business = await db.getBusinessByOwnerId(user.id);
  }

  if (!business) {
    return {
      authorized: false,
      status: 404,
      error: 'No business found for this merchant account.',
    };
  }

  return {
    authorized: true,
    user,
    business,
    owner,
  };
}

/**
 * Confirms that the caller has administrative role.
 */
export async function requireAdmin(
  req: NextRequest | Request
): Promise<RequireAdminResult> {
  const auth = await getAuthUser(req);
  if (!auth) {
    return {
      authorized: false,
      status: 401,
      error: 'Authentication required. Admin access only.',
    };
  }

  const user = auth.user;
  const appRole = user.app_metadata?.role;

  const adminEmailsEnv = process.env.ADMIN_EMAILS || '';
  const adminEmailList = adminEmailsEnv
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);

  const userEmail = (user.email || '').toLowerCase();

  const isAdmin =
    appRole === 'admin' ||
    (userEmail.length > 0 && adminEmailList.includes(userEmail));

  if (!isAdmin) {
    return {
      authorized: false,
      status: 403,
      error: 'Forbidden: Administrative privilege required.',
    };
  }

  return {
    authorized: true,
    user,
  };
}

// ============================================================================
// 3. CUSTOMER SIGNED HTTPONLY SESSION COOKIE HELPERS
// ============================================================================

/**
 * Creates a cryptographically signed HMAC-SHA256 session token for verified customers.
 */
export function createCustomerSessionToken(params: {
  customerId: string;
  phone: string;
  maxAgeSeconds?: number;
}): string {
  const secret = getCustomerSessionSecret();
  const now = Date.now();
  const maxAge = (params.maxAgeSeconds || CUSTOMER_SESSION_MAX_AGE) * 1000;
  const payload: CustomerSessionPayload = {
    customerId: params.customerId,
    phone: params.phone,
    issuedAt: now,
    expiresAt: now + maxAge,
  };

  const payloadStr = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = crypto
    .createHmac('sha256', secret)
    .update(payloadStr)
    .digest('base64url');

  return `${payloadStr}.${signature}`;
}

/**
 * Verifies a customer session token using constant-time HMAC comparison.
 */
export function verifyCustomerSessionToken(
  token: string | null | undefined
): CustomerSessionPayload | null {
  if (!token || typeof token !== 'string') return null;

  const parts = token.split('.');
  if (parts.length !== 2) return null;

  const [payloadStr, signature] = parts;
  if (!payloadStr || !signature) return null;

  let secret: string;
  try {
    secret = getCustomerSessionSecret();
  } catch {
    return null;
  }

  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(payloadStr)
    .digest('base64url');

  const sigBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expectedSignature);

  if (
    sigBuffer.length !== expectedBuffer.length ||
    !crypto.timingSafeEqual(sigBuffer, expectedBuffer)
  ) {
    return null;
  }

  try {
    const payload: CustomerSessionPayload = JSON.parse(
      Buffer.from(payloadStr, 'base64url').toString('utf8')
    );

    if (!payload.customerId || !payload.phone || !payload.expiresAt) {
      return null;
    }

    if (Date.now() > payload.expiresAt) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

/**
 * Extracts and verifies the customer session from request cookies.
 */
export function getCustomerSession(
  req: NextRequest | Request
): CustomerSessionPayload | null {
  let token: string | undefined;

  if ('cookies' in req && typeof req.cookies?.get === 'function') {
    token = (req as NextRequest).cookies.get(CUSTOMER_SESSION_COOKIE_NAME)?.value;
  } else {
    const cookieHeader = req.headers.get('cookie') || '';
    const regex = new RegExp(`(?:^|;\\s*)${CUSTOMER_SESSION_COOKIE_NAME}=([^;]+)`);
    const match = cookieHeader.match(regex);
    if (match) token = match[1];
  }

  return verifyCustomerSessionToken(token);
}

/**
 * Sets a signed, httpOnly, secure, SameSite=Lax cookie on the response.
 */
export function setCustomerSessionCookie(
  res: NextResponse,
  params: {
    customerId: string;
    phone: string;
    maxAgeSeconds?: number;
  }
): string {
  const maxAge = params.maxAgeSeconds || CUSTOMER_SESSION_MAX_AGE;
  const token = createCustomerSessionToken({
    customerId: params.customerId,
    phone: params.phone,
    maxAgeSeconds: maxAge,
  });

  const isProduction = process.env.NODE_ENV === 'production';

  res.cookies.set(CUSTOMER_SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax',
    path: '/',
    maxAge,
  });

  return token;
}

/**
 * Clears the customer session cookie on logout / invalidation.
 */
export function clearCustomerSessionCookie(res: NextResponse): void {
  res.cookies.set(CUSTOMER_SESSION_COOKIE_NAME, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });
}

/**
 * Guard: Requires the caller to have a valid customer session cookie.
 */
export function requireCustomer(
  req: NextRequest | Request
): RequireCustomerResult {
  const session = getCustomerSession(req);
  if (!session) {
    return {
      authorized: false,
      status: 401,
      error: 'Unauthorized: Valid customer verification session required.',
    };
  }

  return {
    authorized: true,
    session,
  };
}

// ============================================================================
// REVA (reva.in) — Public Origin & Live Domain Resolver
// Ensures phone-scannable QR codes always point to the accessible public URL
// ============================================================================

export function getPublicOrigin(): string {
  // If explicitly configured in env
  const envUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_VERCEL_URL;
  if (envUrl) {
    const trimmed = envUrl.trim().replace(/\/+$/, '');
    return trimmed.startsWith('http') ? trimmed : `https://${trimmed}`;
  }

  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    // Localhost / private IP on laptop cannot be reached by a customer's phone
    if (
      hostname === 'localhost' ||
      hostname === '127.0.0.1' ||
      hostname.startsWith('192.168.') ||
      hostname.startsWith('10.') ||
      hostname.endsWith('.local')
    ) {
      return 'https://revain-delta.vercel.app';
    }

    // reva.in is not yet custom-routed to this deployment
    if (hostname === 'reva.in' || hostname === 'www.reva.in') {
      return 'https://revain-delta.vercel.app';
    }

    return window.location.origin;
  }

  return 'https://revain-delta.vercel.app';
}

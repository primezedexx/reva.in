// ============================================================================
// REVA (reva.in) — API Route: Business Info & Settings (/api/businesses/[slug])
// Strict owner-only authorization, origin defense, field allowlisting, and URL validation.
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { assertSameOrigin, requireOwner } from '@/lib/auth-server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(
  req: NextRequest,
  props: { params: Promise<{ slug: string }> }
) {
  try {
    const params = await props.params;
    const { slug } = params;
    let decodedSlug = slug;
    try {
      decodedSlug = decodeURIComponent(slug);
    } catch {}

    const business = await db.getBusinessBySlug(decodedSlug);

    if (!business) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 });
    }

    return NextResponse.json(
      { success: true, business },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          Pragma: 'no-cache',
          Expires: '0',
        },
      }
    );
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Error fetching business' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  props: { params: Promise<{ slug: string }> }
) {
  try {
    // 1. Same-Origin Check
    const originCheck = assertSameOrigin(req);
    if (!originCheck.allowed) {
      return NextResponse.json(
        { error: originCheck.error || 'Cross-origin request rejected' },
        { status: 403 }
      );
    }

    const params = await props.params;
    const { slug } = params;

    // 2. Strict Owner Authorization
    const ownerAuth = await requireOwner(req, slug);
    if (!ownerAuth.authorized) {
      return NextResponse.json({ error: ownerAuth.error }, { status: ownerAuth.status });
    }

    const business = ownerAuth.business!;
    const rawUpdates = await req.json().catch(() => ({}));

    // 3. Strict Field Allowlist — Never allow subscription or billing tampering
    const ALLOWED_FIELDS = [
      'name',
      'phone',
      'google_review_url',
      'instagram_url',
      'reward_rule',
      'avg_spend_per_visit',
      'min_order_for_stamp',
      'winback_delay_multiplier',
      'winback_min_days',
      'winback_offer_text',
      'active_offers',
      'theme_config',
      'is_setup_completed',
    ] as const;

    const sanitizedUpdates: Record<string, any> = {};

    for (const key of ALLOWED_FIELDS) {
      if (key in rawUpdates) {
        sanitizedUpdates[key] = rawUpdates[key];
      }
    }

    // 4. Validate URLs: google_review_url and instagram_url MUST be https://
    if (sanitizedUpdates.google_review_url) {
      const url = String(sanitizedUpdates.google_review_url).trim();
      if (url.length > 0 && !url.startsWith('https://')) {
        return NextResponse.json(
          { error: 'Invalid Google Review URL: must begin with https://' },
          { status: 400 }
        );
      }
      sanitizedUpdates.google_review_url = url;
    }

    if (sanitizedUpdates.instagram_url) {
      const url = String(sanitizedUpdates.instagram_url).trim();
      if (url.length > 0 && !url.startsWith('https://')) {
        return NextResponse.json(
          { error: 'Invalid Instagram URL: must begin with https://' },
          { status: 400 }
        );
      }
      sanitizedUpdates.instagram_url = url;
    }

    if (Object.keys(sanitizedUpdates).length === 0) {
      return NextResponse.json({ error: 'No valid update fields provided' }, { status: 400 });
    }

    const updated = await db.updateBusiness(business.id, sanitizedUpdates);

    return NextResponse.json(
      { success: true, business: updated },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          Pragma: 'no-cache',
          Expires: '0',
        },
      }
    );
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Error updating business' },
      { status: 500 }
    );
  }
}

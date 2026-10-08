// ============================================================================
// REVA (reva.in) — API Route: Customer Session & Membership Lookup
// Hardened with rate limiting, signed customer session cookies, and safe customer data.
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { supabaseAdmin } from '@/lib/supabase';
import { getCustomerSession, setCustomerSessionCookie } from '@/lib/auth-server';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(req: NextRequest) {
  try {
    // 1. Rate Limiting (max 30 requests/min per IP)
    const clientIp = getClientIp(req);
    const rateCheck = await checkRateLimit(`cust_session_get:${clientIp}`, 30, 60);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { error: 'Too many requests. Please wait a moment.' },
        {
          status: 429,
          headers: { 'Retry-After': String(rateCheck.retryAfterSeconds) },
        }
      );
    }

    const { searchParams } = new URL(req.url);
    const sessionCookie = getCustomerSession(req);
    const phoneParam = searchParams.get('phone');
    const nameParam = searchParams.get('name');
    const emailParam = searchParams.get('email');
    const userIdParam = searchParams.get('userId');

    const cleanPhone = (sessionCookie?.phone || phoneParam || '').trim().replace(/\s+/g, '');
    const cleanName = nameParam && nameParam !== 'Valued Guest' ? nameParam.trim() : '';
    const cleanEmail = emailParam && !emailParam.includes('owner') && !emailParam.endsWith('@reva.in') ? emailParam.trim().toLowerCase() : '';

    const searchIdentifier = cleanPhone || cleanEmail || userIdParam || cleanName;

    if (!searchIdentifier) {
      return NextResponse.json({ success: true, passes: [], customer: null, claimedRewards: [] });
    }

    // 1. Search for customer records matching identity
    const matchedCustomers = await db.findCustomersByAnyIdentity({
      phone: cleanPhone || undefined,
      email: cleanEmail || undefined,
      userId: userIdParam || undefined,
      name: cleanName || undefined,
    });

    let primaryCustomer = matchedCustomers[0] || null;

    if (!primaryCustomer) {
      primaryCustomer = await db.createOrGetCustomer(searchIdentifier, cleanName || undefined, undefined, {
        email: cleanEmail || undefined,
        phone: cleanPhone || undefined,
        auth_user_id: userIdParam || undefined,
        name: cleanName || undefined,
      });
      matchedCustomers.push(primaryCustomer);
    }

    const allCustomerIds = Array.from(new Set(matchedCustomers.map((c) => c.id)));

    // 2. Fetch all memberships across all linked customer IDs
    const rawMemberships = await db.getMembershipsByCustomerIds(allCustomerIds);
    const allBusinesses = await db.getBusinesses();

    // Deduplicate memberships by business_id (preserving highest stamps / visits)
    const dedupedMap = new Map<string, any>();
    for (const m of rawMemberships) {
      const existing = dedupedMap.get(m.business_id);
      if (!existing || (m.stamps || 0) > (existing.stamps || 0) || (m.total_visits || 0) > (existing.total_visits || 0)) {
        dedupedMap.set(m.business_id, m);
      }
    }

    const uniqueMemberships = Array.from(dedupedMap.values());

    const passes: any[] = [];
    for (const m of uniqueMemberships) {
      const rawBiz = m.business || allBusinesses.find((b) => b.id === m.business_id);
      const biz = rawBiz ? db.ensureBusinessOffers(rawBiz) : null;
      const stampsNeeded = biz?.reward_rule?.stamps_needed || 6;
      const themeConfig = biz?.theme_config || biz?.reward_rule?.theme_config || {
        preset: 'clean_minimal',
        page_bg_tone: 'slate_clean',
        card_gradient: 'solid',
        card_bg_color: biz?.brand_color || '#0F172A',
        accent_color: biz?.brand_color || '#0F172A',
        stamp_icon: 'paw',
        card_radius: 'rounded_squircle',
      };

      // 1. Primary pass for this store
      passes.push({
        id: `${biz?.slug || 'store'}_primary`,
        rewardId: 'primary',
        slug: biz?.slug || 'store',
        businessId: biz?.id,
        name: biz?.name || 'Local Cafe',
        category: biz?.category || biz?.reward_rule?.category || 'Café & Beverage',
        brandColor: biz?.brand_color || '#0F172A',
        logo_url: biz?.logo_url || '',
        stamps: m.stamps || 0,
        totalStamps: stampsNeeded,
        rewardTitle: biz?.reward_rule?.reward_title || 'Specialty Treat',
        lastVisit: m.last_visit_at ? 'Recently' : 'Just joined',
        minOrder: biz?.reward_rule?.min_order_for_stamp || biz?.min_order_for_stamp || undefined,
        expiry_days: biz?.reward_rule?.expiry_days !== undefined ? Number(biz.reward_rule.expiry_days) : 60,
        passId: `REV-${m.id.slice(0, 8).toUpperCase()}`,
        membershipId: m.id,
        membership_id: m.id,
        googleReviewUrl: biz?.google_review_url || biz?.reward_rule?.google_review_url,
        phone: biz?.phone || biz?.reward_rule?.phone,
        instagram_url: biz?.instagram_url || biz?.reward_rule?.instagram_url,
        maps_url: biz?.maps_url || biz?.reward_rule?.maps_url,
        description: biz?.theme_config?.description || biz?.reward_rule?.description || biz?.reward_rule?.reward_desc,
        address: biz?.address || biz?.reward_rule?.address,
        area: biz?.area || biz?.reward_rule?.area,
        city: biz?.city || biz?.reward_rule?.city,
        joined_at: m.created_at || primaryCustomer?.registered_at || primaryCustomer?.created_at || new Date().toISOString(),
        last_visit_at: m.last_visit_at,
        last_qr_stamp_at: m.last_qr_stamp_at,
        cycle: m.total_visits || 1,
        theme_config: themeConfig,
        reward_rule: biz?.reward_rule,
        active_offers: biz?.active_offers || [],
      });

      // 2. Any additional active reward passes started by the customer on this store
      let tierData: any = {};
      try {
        tierData = JSON.parse(m.tier || '{}');
      } catch {}

      if (tierData.passes && typeof tierData.passes === 'object') {
        for (const [offerId, offerPass] of Object.entries<any>(tierData.passes)) {
          const offer = (biz?.active_offers || []).find((o: any) => o.id === offerId);
          if (offer) {
            passes.push({
              id: `${biz?.slug || 'store'}_${offer.id}`,
              rewardId: offer.id,
              slug: biz?.slug || 'store',
              businessId: biz?.id,
              name: biz?.name || 'Local Cafe',
              category: biz?.category || biz?.reward_rule?.category || 'Café & Beverage',
              brandColor: biz?.brand_color || '#0F172A',
              logo_url: biz?.logo_url || '',
              stamps: Number(offerPass.stamps) || 0,
              totalStamps: Number(offer.stamps_needed) || 6,
              rewardTitle: offer.title || 'Specialty Treat',
              description: offer.desc || `Unlocked after completing ${offer.stamps_needed} stamps`,
              lastVisit: offerPass.last_stamp_at ? 'Recently' : 'Just started',
              minOrder: offer.min_order || undefined,
              expiry_days: offer.expiry_days !== undefined ? Number(offer.expiry_days) : undefined,
              passId: `REV-${offer.id.slice(0, 8).toUpperCase()}`,
              membershipId: m.id,
              membership_id: m.id,
              googleReviewUrl: biz?.google_review_url || biz?.reward_rule?.google_review_url,
              phone: biz?.phone || biz?.reward_rule?.phone,
              instagram_url: biz?.instagram_url || biz?.reward_rule?.instagram_url,
              maps_url: biz?.maps_url || biz?.reward_rule?.maps_url,
              address: biz?.address || biz?.reward_rule?.address,
              area: biz?.area || biz?.reward_rule?.area,
              city: biz?.city || biz?.reward_rule?.city,
              joined_at: offerPass.started_at || m.created_at,
              last_visit_at: offerPass.last_stamp_at || m.last_visit_at,
              last_qr_stamp_at: m.last_qr_stamp_at,
              cycle: 1,
              theme_config: themeConfig,
              reward_rule: biz?.reward_rule,
              active_offers: biz?.active_offers || [],
            });
          }
        }
      }
    }

    // 3. Resolve customer details
    const effectivePhone = cleanPhone || primaryCustomer?.phone || '';
    const effectiveName = primaryCustomer?.name && primaryCustomer.name !== 'Valued Guest' ? primaryCustomer.name : (cleanName || 'Valued Guest');
    const effectiveAvatar = primaryCustomer?.avatar_url || null;

    // Fetch claimed rewards across all customer memberships + any voucher codes passed
    const voucherCodesParam = searchParams.get('voucherCodes');
    const allMembershipIds = uniqueMemberships.map((m) => m.id);
    const membershipClaimsPromises = allMembershipIds.map((id) => db.getRewardsClaimedForMembership(id));
    const membershipClaimsResults = await Promise.all(membershipClaimsPromises);
    const membershipClaims = membershipClaimsResults.flat();

    let codeClaims: any[] = [];
    if (voucherCodesParam) {
      const parsedCodes = voucherCodesParam.split(',').map((c) => c.trim()).filter(Boolean);
      if (parsedCodes.length > 0) {
        codeClaims = await db.getRewardClaimsByCodes(parsedCodes);
      }
    }

    const allClaimsMap = new Map<string, any>();
    [...codeClaims, ...membershipClaims].forEach((c) => {
      const key = c.voucher_code || c.id;
      if (key && !allClaimsMap.has(key)) {
        allClaimsMap.set(key, c);
      }
    });
    const claimedRewards = Array.from(allClaimsMap.values());

    const response = NextResponse.json(
      {
        success: true,
        customer: {
          id: primaryCustomer.id,
          phone: effectivePhone,
          name: effectiveName,
          avatar_url: effectiveAvatar,
        },
        passes,
        claimedRewards,
        phone: effectivePhone,
        name: effectiveName,
        avatar_url: effectiveAvatar,
      },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
          Pragma: 'no-cache',
          Expires: '0',
        },
      }
    );

    // Issue signed session cookie if caller has verified phone
    if (!sessionCookie && effectivePhone) {
      setCustomerSessionCookie(response, {
        customerId: primaryCustomer.id,
        phone: effectivePhone,
      });
    }

    return response;
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Session lookup failed' },
      {
        status: 500,
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
          Pragma: 'no-cache',
          Expires: '0',
        },
      }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    // 1. Rate Limiting (max 20 requests/min per IP)
    const clientIp = getClientIp(req);
    const rateCheck = await checkRateLimit(`cust_session_post:${clientIp}`, 20, 60);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { error: 'Too many session requests. Please wait a moment.' },
        {
          status: 429,
          headers: { 'Retry-After': String(rateCheck.retryAfterSeconds) },
        }
      );
    }

    const sessionCookie = getCustomerSession(req);
    const body = await req.json().catch(() => ({}));
    const { businessSlug, phone, name, email, userId, voucherCodes, startRewardId } = body;

    const cleanPhone = (sessionCookie?.phone || phone || '').trim().replace(/\s+/g, '');

    if (!businessSlug || (!cleanPhone && !email)) {
      return NextResponse.json(
        { error: 'Business slug and phone or email are required' },
        { status: 400 }
      );
    }

    const business = await db.getBusinessBySlug(businessSlug);
    if (!business) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 });
    }

    const cleanEmail = email && !email.includes('owner') && !email.endsWith('@reva.in') ? email.trim().toLowerCase() : '';
    const cleanName = name && name !== 'Valued Guest' ? name.trim() : '';

    const customer = await db.createOrGetCustomer(cleanPhone || cleanEmail, cleanName || undefined, undefined, {
      phone: cleanPhone || undefined,
      email: cleanEmail || undefined,
      auth_user_id: userId || undefined,
      name: cleanName || undefined,
    });

    const membership = await db.createOrGetMembership(business.id, customer.id);

    if (startRewardId) {
      let tierData: any = {};
      try {
        tierData = JSON.parse(membership.tier || '{}');
      } catch {
        tierData = { tier: membership.tier || 'Regular' };
      }
      if (!tierData.passes) tierData.passes = {};
      if (!tierData.passes[startRewardId]) {
        tierData.passes[startRewardId] = { stamps: 0, started_at: new Date().toISOString() };
        membership.tier = JSON.stringify(tierData);
        try {
          await supabaseAdmin.from('memberships').update({ tier: membership.tier }).eq('id', membership.id);
        } catch {}
      }
    }

    // Fetch live claimed rewards for this membership
    const membershipClaims = await db.getRewardsClaimedForMembership(membership.id);
    let codeClaims: any[] = [];
    if (Array.isArray(voucherCodes) && voucherCodes.length > 0) {
      codeClaims = await db.getRewardClaimsByCodes(voucherCodes);
    }

    const allClaimsMap = new Map<string, any>();
    [...codeClaims, ...membershipClaims].forEach((c) => {
      const key = c.voucher_code || c.id;
      if (key && !allClaimsMap.has(key)) {
        allClaimsMap.set(key, c);
      }
    });
    const claimedRewards = Array.from(allClaimsMap.values());

    const res = NextResponse.json(
      {
        success: true,
        business: db.ensureBusinessOffers(business),
        customer: {
          id: customer.id,
          name: customer.name || cleanName || 'Valued Guest',
          phone: cleanPhone,
          avatar_url: customer.avatar_url || null,
        },
        membership,
        claimedRewards,
      },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate',
        },
      }
    );

    if (cleanPhone) {
      setCustomerSessionCookie(res, {
        customerId: customer.id,
        phone: cleanPhone,
      });
    }

    return res;
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Session failed' },
      { status: 500 }
    );
  }
}

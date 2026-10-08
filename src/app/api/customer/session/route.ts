// ============================================================================
// REVA (reva.in) — API Route: Customer Session & Membership Lookup
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { supabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get('email');
    const phone = searchParams.get('phone');
    const userId = searchParams.get('userId');
    const name = searchParams.get('name');

    const cleanPhone = phone && phone !== '+91 98765 43210' && phone !== '9876543210' ? phone.trim() : '';
    const isIgnoredEmail = email && (email.includes('owner') || email.includes('primezedexx') || email.endsWith('@reva.in'));
    const cleanEmail = email && !isIgnoredEmail ? email.trim().toLowerCase() : '';
    const cleanName = name && name !== 'Valued Guest' && name !== 'Aarav Sharma' ? name.trim() : '';
    const searchIdentifier = cleanPhone || cleanEmail || userId || cleanName;

    if (!searchIdentifier) {
      return NextResponse.json({ success: true, passes: [], customer: null });
    }

    // 1. Search for any customer records matching any of the user's identities (phone, email, Google UID, name)
    const matchedCustomers = await db.findCustomersByAnyIdentity({
      phone: cleanPhone,
      email: cleanEmail,
      userId: userId || undefined,
      name: cleanName,
    });

    let primaryCustomer = matchedCustomers[0] || null;

    if (!primaryCustomer) {
      primaryCustomer = await db.createOrGetCustomer(searchIdentifier, cleanName || undefined, undefined, {
        email: cleanEmail || undefined,
        phone: cleanPhone || undefined,
        auth_user_id: userId || undefined,
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

      // 1. Primary pass for this store (e.g. Specialty Beverage)
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

    // 3. Resolve unified customer details (real phone, real email, real name, avatar)
    const realPhoneCustomer = matchedCustomers.find(
      (c) => c.phone && !c.phone.includes('@') && c.phone.replace(/\D/g, '').length >= 10
    );
    const effectivePhone = realPhoneCustomer?.phone || cleanPhone || '';

    const realNameCustomer = matchedCustomers.find(
      (c) => c.name && c.name !== 'Valued Guest' && c.name !== 'Aarav Sharma'
    );
    const effectiveName = realNameCustomer?.name || cleanName || primaryCustomer?.name || 'Valued Guest';

    const customerEmailCandidate = cleanEmail || matchedCustomers.find((c) => c.email && !c.email.includes('primezedexx') && !c.email.includes('owner') && !c.email.endsWith('@reva.in'))?.email || '';
    const effectiveEmail = (customerEmailCandidate && !customerEmailCandidate.includes('primezedexx') && !customerEmailCandidate.includes('owner') && !customerEmailCandidate.endsWith('@reva.in'))
      ? customerEmailCandidate
      : '';
    const effectiveAvatar = matchedCustomers.find((c) => c.avatar_url)?.avatar_url || primaryCustomer?.avatar_url || null;

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

    return NextResponse.json(
      {
        success: true,
        customer: {
          ...primaryCustomer,
          phone: effectivePhone || primaryCustomer?.phone || '',
          name: effectiveName,
          email: effectiveEmail,
          avatar_url: effectiveAvatar,
        },
        passes,
        claimedRewards,
        phone: effectivePhone,
        email: effectiveEmail,
        avatar_url: effectiveAvatar,
        name: effectiveName,
        auth_provider: primaryCustomer?.auth_provider || (cleanEmail ? 'google' : 'phone_otp'),
        last_sign_in_at: primaryCustomer?.last_sign_in_at || new Date().toISOString(),
        registered_at: primaryCustomer?.registered_at || primaryCustomer?.created_at || new Date().toISOString(),
      },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
          Pragma: 'no-cache',
          Expires: '0',
        },
      }
    );
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
    const { businessSlug, phone, name, email, userId, voucherCodes, startRewardId } = await req.json();

    if (!businessSlug || (!phone && !email)) {
      return NextResponse.json(
        { error: 'Business slug and phone or email are required' },
        { status: 400 }
      );
    }

    const business = await db.getBusinessBySlug(businessSlug);
    if (!business) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 });
    }

    const cleanPhone = phone && phone !== '+91 98765 43210' && phone !== '9876543210' ? phone.trim() : '';
    const isIgnoredEmail = email && (email.includes('owner') || email.includes('primezedexx') || email.endsWith('@reva.in'));
    const cleanEmail = email && !isIgnoredEmail ? email.trim().toLowerCase() : '';
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

    return NextResponse.json(
      {
        success: true,
        business: db.ensureBusinessOffers(business),
        customer: {
          ...customer,
          email: (customer.email && !customer.email.includes('primezedexx') && !customer.email.includes('owner') && !customer.email.endsWith('@reva.in'))
            ? customer.email
            : '',
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
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Session failed' },
      { status: 500 }
    );
  }
}

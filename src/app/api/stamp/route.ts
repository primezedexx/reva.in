// ============================================================================
// REVA (reva.in) — API Route: Scan & Stamp (/api/stamp)
// Supports QR Scan (with 24-hour single-claim cooldown) & Cashier/Counter verification
// Hardened with origin defense, rate limiting, and merchant authorization for staff actions.
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { supabaseAdmin } from '@/lib/supabase';
import { assertSameOrigin, requireOwner } from '@/lib/auth-server';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';

// In-memory debounce lock to prevent rapid concurrent double-stamping (5s per membership)
const recentStampLock = new Map<string, number>();

export async function POST(req: NextRequest) {
  try {
    // 1. Same-Origin Check (CSRF Protection)
    const originCheck = assertSameOrigin(req);
    if (!originCheck.allowed) {
      return NextResponse.json(
        { error: originCheck.error || 'Cross-origin request rejected' },
        { status: 403 }
      );
    }

    // 2. Rate Limiting (max 30 requests/min per IP)
    const clientIp = getClientIp(req);
    const rateCheck = await checkRateLimit(`stamp:${clientIp}`, 30, 60);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { error: 'Too many stamp requests. Please wait a moment.' },
        {
          status: 429,
          headers: { 'Retry-After': String(rateCheck.retryAfterSeconds) },
        }
      );
    }

    const body = await req.json().catch(() => ({}));
    const {
      businessId: explicitBusinessId,
      slug,
      businessSlug,
      phone,
      name,
      membershipId: explicitMemId,
      spendAmount,
      stampAwarded = 1,
      staffNote,
      source = 'qr_scan', // 'qr_scan' | 'counter' | 'cashier'
      rewardId,
    } = body;

    let targetBusiness = null;
    const resolvedSlug = slug || businessSlug;

    if (resolvedSlug) {
      targetBusiness = await db.getBusinessBySlug(resolvedSlug);
      if (!targetBusiness) {
        targetBusiness = await db.getBusinessById(resolvedSlug);
      }
    }

    let businessId = explicitBusinessId || targetBusiness?.id;

    if (!businessId && resolvedSlug) {
      targetBusiness = await db.getBusinessBySlug(resolvedSlug);
      if (targetBusiness) {
        businessId = targetBusiness.id;
      }
    }

    if (!businessId) {
      return NextResponse.json({ error: 'Business ID or slug is required' }, { status: 400 });
    }

    if (!targetBusiness) {
      targetBusiness = await db.getBusinessById(businessId);
    }

    if (!targetBusiness) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 });
    }

    const isQrScan = source === 'qr_scan';

    // 3. Authorization Check:
    // If this is a cashier or counter staff manual stamp, require verified store owner authentication
    if (!isQrScan) {
      const ownerAuth = await requireOwner(req, businessId);
      if (!ownerAuth.authorized) {
        return NextResponse.json({ error: ownerAuth.error }, { status: ownerAuth.status });
      }
    }

    // Bound stamps awarded safely between 1 and 5
    const safeStampAwarded = Math.min(5, Math.max(1, Number(stampAwarded) || 1));

    let targetMemId = explicitMemId;

    // If phone is provided, resolve or create customer & membership
    if (!targetMemId && phone) {
      const customer = await db.createOrGetCustomer(phone, name);
      const membership = await db.createOrGetMembership(businessId, customer.id);
      targetMemId = membership.id;
    }

    if (!targetMemId) {
      return NextResponse.json(
        { error: 'Either membershipId or phone is required' },
        { status: 400 }
      );
    }

    const currentMem = await db.getMembershipById(targetMemId);
    if (!currentMem) {
      return NextResponse.json({ error: 'Membership not found' }, { status: 404 });
    }

    // 24-Hour Cooldown Verification for Self-Serve QR Scans:
    // CROSS-PASS 24-HOUR RESTRICTION:
    // Check latest QR stamp timestamp across ALL passes/memberships belonging to this customer.
    let lastClaimIso = currentMem.last_qr_stamp_at;
    if (currentMem.customer_id) {
      try {
        const allCustomerMems = await db.getMembershipsByCustomerId(currentMem.customer_id);
        for (const m of allCustomerMems) {
          if (m.last_qr_stamp_at) {
            if (!lastClaimIso || new Date(m.last_qr_stamp_at).getTime() > new Date(lastClaimIso).getTime()) {
              lastClaimIso = m.last_qr_stamp_at;
            }
          }
        }
      } catch {}
    }

    if (isQrScan && lastClaimIso) {
      const lastClaimTime = new Date(lastClaimIso).getTime();
      const now = Date.now();
      const COOLDOWN_MS = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
      const elapsed = now - lastClaimTime;

      if (elapsed < COOLDOWN_MS) {
        const remainingMs = COOLDOWN_MS - elapsed;
        const hoursRemaining = Math.max(0, Math.floor(remainingMs / (1000 * 60 * 60)));
        const minutesRemaining = Math.max(1, Math.floor((remainingMs % (1000 * 60 * 60)) / (1000 * 60)));
        const nextAvailableAt = new Date(lastClaimTime + COOLDOWN_MS).toISOString();

        return NextResponse.json(
          {
            success: false,
            cooldownActive: true,
            hoursRemaining,
            minutesRemaining,
            remainingMs,
            lastClaimedAt: lastClaimIso,
            nextAvailableAt,
            business: targetBusiness,
            error:
              'You can claim stamp from this method after 24 hours. If you are revisiting within 24 hours, then ask cashier for the stamp.',
            message:
              'You can claim stamp from this method after 24 hours. If you are revisiting within 24 hours, then ask cashier for the stamp.',
            userGuidance:
              'You can claim stamp from this method after 24 hours. If you are revisiting within 24 hours, then ask cashier for the stamp.',
          },
          { status: 429 }
        );
      }
    }

    // In-flight deduplication for self-serve QR scans (prevent accidental double tap)
    const lastPunchTime = recentStampLock.get(targetMemId);
    const nowTimestamp = Date.now();
    if (isQrScan && lastPunchTime && (nowTimestamp - lastPunchTime) < 5000) {
      const fullMem = await db.getMembershipById(targetMemId);
      const customer = fullMem ? await db.getCustomerById(fullMem.customer_id) : null;
      const business = await db.getBusinessById(businessId);
      return NextResponse.json({
        success: true,
        membership: { ...fullMem, customer, business },
        message: 'Stamp recorded successfully!',
      });
    }
    if (isQrScan) {
      recentStampLock.set(targetMemId, nowTimestamp);
    }

    // Handle independent pass progress if this is an additional reward pass
    const isAdditionalReward = Boolean(rewardId && rewardId !== 'primary');
    let extraPassStamps = 0;
    let extraPassTotalStamps = targetBusiness?.reward_rule?.stamps_needed || 6;
    let extraRewardUnlocked = false;

    if (isAdditionalReward) {
      const targetOffer = (targetBusiness?.active_offers || []).find((o: any) => o.id === rewardId);
      if (targetOffer) {
        extraPassTotalStamps = targetOffer.stamps_needed || 6;
      }

      let tierData: any = {};
      try {
        tierData = JSON.parse(currentMem.tier || '{}');
      } catch {
        tierData = { tier: currentMem.tier || 'Regular' };
      }
      if (!tierData.passes) tierData.passes = {};
      if (!tierData.passes[rewardId]) {
        tierData.passes[rewardId] = { stamps: 0, started_at: new Date().toISOString() };
      }
      tierData.passes[rewardId].stamps = (tierData.passes[rewardId].stamps || 0) + safeStampAwarded;
      tierData.passes[rewardId].last_stamp_at = new Date().toISOString();
      extraPassStamps = tierData.passes[rewardId].stamps;
      extraRewardUnlocked = extraPassStamps >= extraPassTotalStamps;

      currentMem.tier = JSON.stringify(tierData);
      try {
        await supabaseAdmin.from('memberships').update({ tier: currentMem.tier }).eq('id', targetMemId);
      } catch {}
    }

    // Record visit & execute stamp trigger
    const defaultNote = isQrScan
      ? `Customer Counter QR Scan${rewardId ? ` [Reward: ${rewardId}]` : ''}`
      : `Counter Staff Verified Stamp${rewardId ? ` [Reward: ${rewardId}]` : ''}`;

    const result = await db.recordVisit(
      targetMemId,
      businessId,
      spendAmount,
      isAdditionalReward ? 0 : safeStampAwarded,
      staffNote || defaultNote,
      isQrScan
    );

    // Synchronize 24-hour stamp timestamp across ALL memberships of this customer
    if (isQrScan && currentMem.customer_id) {
      const nowIso = new Date().toISOString();
      currentMem.last_qr_stamp_at = nowIso;
      try {
        const allCustomerMems = await db.getMembershipsByCustomerId(currentMem.customer_id);
        for (const m of allCustomerMems) {
          m.last_qr_stamp_at = nowIso;
        }
      } catch {}
    }

    const fullMem = await db.getMembershipById(targetMemId);
    const customer = fullMem ? await db.getCustomerById(fullMem.customer_id) : null;
    const business = await db.getBusinessById(businessId);

    return NextResponse.json({
      success: true,
      membership: {
        ...fullMem,
        customer,
        business,
        stamps: isAdditionalReward ? extraPassStamps : fullMem?.stamps,
      },
      rewardId: rewardId || 'primary',
      passStamps: isAdditionalReward ? extraPassStamps : fullMem?.stamps,
      rewardUnlocked: isAdditionalReward ? extraRewardUnlocked : result.rewardUnlocked,
      visit: result.visit,
      wasWinBackConverted: result.wasWinBackConverted,
    });
  } catch (err: unknown) {
    console.error('Error in /api/stamp:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to record stamp' },
      { status: 500 }
    );
  }
}

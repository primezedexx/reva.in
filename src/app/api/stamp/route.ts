// ============================================================================
// REVA (reva.in) — API Route: Scan & Stamp (/api/stamp)
// Supports QR Scan (with 24-hour single-claim cooldown) & Cashier/Counter bypass
// Ultra-fast single-pass execution (<200ms) with zero redundant queries
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { supabaseAdmin } from '@/lib/supabase';

// In-memory debounce lock to prevent rapid concurrent double-stamping (4s per membership)
const recentStampLock = new Map<string, number>();

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
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

    const resolvedSlug = (slug || businessSlug || '').trim();
    let targetBusiness = null;

    if (resolvedSlug) {
      targetBusiness = await db.getBusinessBySlug(resolvedSlug);
      if (!targetBusiness) {
        targetBusiness = await db.getBusinessById(resolvedSlug);
      }
    }

    const businessId = explicitBusinessId || targetBusiness?.id;
    if (!businessId) {
      return NextResponse.json({ error: 'Business ID or slug is required' }, { status: 400 });
    }

    if (!targetBusiness) {
      targetBusiness = await db.getBusinessById(businessId);
    }

    if (!targetBusiness) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 });
    }

    // Verify cafe has an active reward campaign before awarding stamps
    const activeOffers = (targetBusiness?.active_offers || []).filter(
      (o: any) =>
        o &&
        o.id !== 'off_1' &&
        o.title !== 'Welcome Treat' &&
        o.title !== 'Welcome Milestone Reward' &&
        !(o.id === 'off_2' && o.title === 'Free Specialty Beverage')
    );
    const hasCustomActiveReward =
      activeOffers.length > 0 ||
      Boolean(
        targetBusiness?.reward_rule?.reward_title &&
        targetBusiness?.reward_rule?.reward_title !== 'Free Specialty Beverage' &&
        targetBusiness?.reward_rule?.is_setup_completed
      );

    if (!hasCustomActiveReward) {
      return NextResponse.json(
        {
          success: false,
          noActiveRewards: true,
          error: 'There are no active rewards for this cafe right now.',
          message: 'There are no active rewards for this cafe right now.',
          business: targetBusiness,
        },
        { status: 400 }
      );
    }

    let targetMemId = explicitMemId;
    let currentMem = null;
    let customer = null;

    // Resolve customer and membership with minimal overhead
    if (!targetMemId && phone) {
      customer = await db.createOrGetCustomer(phone, name);
      currentMem = await db.createOrGetMembership(businessId, customer.id);
      targetMemId = currentMem.id;
    } else if (targetMemId) {
      currentMem = await db.getMembershipById(targetMemId);
      if (currentMem?.customer_id) {
        customer = await db.getCustomerById(currentMem.customer_id);
      }
    }

    if (!targetMemId || !currentMem) {
      return NextResponse.json(
        { error: 'Valid membership or phone number is required' },
        { status: 400 }
      );
    }

    const isQrScan = source === 'qr_scan';

    // 24-Hour Cooldown Verification for Self-Serve QR Scans
    const lastClaimIso = currentMem.last_qr_stamp_at;
    if (isQrScan && lastClaimIso) {
      const lastClaimTime = new Date(lastClaimIso).getTime();
      const now = Date.now();
      const COOLDOWN_MS = 24 * 60 * 60 * 1000;
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

    // In-flight deduplication for rapid re-scans (within 4 seconds)
    const lastPunchTime = recentStampLock.get(targetMemId);
    const nowTimestamp = Date.now();
    if (isQrScan && lastPunchTime && nowTimestamp - lastPunchTime < 4000) {
      return NextResponse.json({
        success: true,
        membership: { ...currentMem, customer, business: targetBusiness },
        message: 'Stamp recorded successfully!',
      });
    }
    if (isQrScan) {
      recentStampLock.set(targetMemId, nowTimestamp);
    }

    // Additional reward pass support
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
      tierData.passes[rewardId].stamps = (tierData.passes[rewardId].stamps || 0) + stampAwarded;
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
      isAdditionalReward ? 0 : stampAwarded,
      staffNote || defaultNote,
      isQrScan
    );

    // Update last_qr_stamp_at across memberships for this customer in background
    if (isQrScan && currentMem.customer_id) {
      const nowIso = new Date().toISOString();
      try {
        await supabaseAdmin
          .from('memberships')
          .update({ last_qr_stamp_at: nowIso })
          .eq('customer_id', currentMem.customer_id);
      } catch {}
    }

    const updatedMem = result.membership || currentMem;

    return NextResponse.json({
      success: true,
      membership: {
        ...updatedMem,
        customer: customer || (updatedMem as any).customer,
        business: targetBusiness,
        stamps: isAdditionalReward ? extraPassStamps : updatedMem?.stamps,
      },
      rewardId: rewardId || 'primary',
      passStamps: isAdditionalReward ? extraPassStamps : updatedMem?.stamps,
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

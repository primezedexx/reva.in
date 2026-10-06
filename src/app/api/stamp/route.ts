// ============================================================================
// REVA (reva.in) — API Route: Scan & Stamp (/api/stamp)
// Supports QR Scan (with 24-hour single-claim cooldown) & Cashier/Counter bypass
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// In-memory debounce lock to prevent rapid concurrent double-stamping (5s per membership)
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

    const isQrScan = source === 'qr_scan';

    // 24-Hour Cooldown Verification for Self-Serve QR Scans (Checked ONLY against previous self-serve QR stamps)
    const lastClaimIso = currentMem.last_qr_stamp_at;
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

    // Record visit & execute stamp trigger
    const defaultNote = isQrScan ? 'Customer Counter QR Scan' : 'Counter Staff Verified Stamp';
    const result = await db.recordVisit(
      targetMemId,
      businessId,
      spendAmount,
      stampAwarded,
      staffNote || defaultNote,
      isQrScan
    );

    const fullMem = await db.getMembershipById(targetMemId);
    const customer = fullMem ? await db.getCustomerById(fullMem.customer_id) : null;
    const business = await db.getBusinessById(businessId);

    return NextResponse.json({
      success: true,
      membership: { ...fullMem, customer, business },
      visit: result.visit,
      rewardUnlocked: result.rewardUnlocked,
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

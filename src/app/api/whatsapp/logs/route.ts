// ============================================================================
// REVA (reva.in) — API Route: WhatsApp Logs (/api/whatsapp/logs)
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const businessId = searchParams.get('businessId') || undefined;

    const logs = await db.getWhatsAppLogs(businessId);

    return NextResponse.json({
      success: true,
      logs,
    });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to fetch logs' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { businessId, membershipId, customerId, offerCode, messageBody } = body;

    if (!businessId || (!membershipId && !customerId)) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const membership = membershipId ? await db.getMembershipById(membershipId) : null;
    const targetCustId = customerId || membership?.customer_id;

    if (!targetCustId) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

    const entry = await db.logWhatsApp({
      business_id: businessId,
      customer_id: targetCustId,
      membership_id: membershipId || membership?.id || '',
      message_type: 'winback_nudge',
      template_name: 'reva_direct_whatsapp_v1',
      offer_code: offerCode || `OFFER-${Math.floor(1000 + Math.random() * 9000)}`,
      message_body: messageBody || 'Direct WhatsApp Invitation',
      status: 'sent',
      converted: false,
    });

    return NextResponse.json({
      success: true,
      log: entry,
    });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to log message' },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, status } = body;

    if (!id || !status) {
      return NextResponse.json({ error: 'Missing log id or status' }, { status: 400 });
    }

    const updated = await db.updateWhatsAppLogStatus(id, status);
    if (!updated) {
      return NextResponse.json({ error: 'Log not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      log: updated,
    });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to update log' },
      { status: 500 }
    );
  }
}


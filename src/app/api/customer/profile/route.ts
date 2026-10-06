// ============================================================================
// REVA (reva.in) — API Route: Customer Profile (Photo, Name, Registered Date)
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const phone = searchParams.get('phone');
    const email = searchParams.get('email');
    const userId = searchParams.get('userId');

    const identifier = phone || email || userId;
    if (!identifier) {
      return NextResponse.json({ success: false, error: 'Customer identifier is required' }, { status: 400 });
    }

    let customer = null;
    if (phone) {
      customer = await db.getCustomerByPhone(phone);
    }
    if (!customer && email) {
      customer = await db.getCustomerByEmail(email);
    }
    if (!customer) {
      customer = await db.createOrGetCustomer(identifier);
    }

    return NextResponse.json(
      {
        success: true,
        customer,
      },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate',
        },
      }
    );
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Profile lookup failed' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const { phone, email, userId, name, avatar_url, registered_at } = await req.json();

    const identifier = phone || email || userId;
    if (!identifier) {
      return NextResponse.json(
        { error: 'Customer identifier (phone, email, or userId) is required' },
        { status: 400 }
      );
    }

    const customer = await db.createOrGetCustomer(identifier, name, avatar_url);

    if (avatar_url !== undefined || registered_at || name || email || phone) {
      await db.updateCustomer(customer.id, {
        ...(name ? { name } : {}),
        ...(email ? { email: email.trim().toLowerCase() } : {}),
        ...(phone ? { phone: phone.trim() } : {}),
        ...(avatar_url !== undefined ? { avatar_url } : {}),
        ...(registered_at ? { registered_at } : {}),
      });
    }

    const updatedCustomer = await db.getCustomerById(customer.id);

    return NextResponse.json({
      success: true,
      customer: updatedCustomer || customer,
    }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Profile update failed' },
      { status: 500 }
    );
  }
}

// ============================================================================
// REVA (reva.in) — API Route: Role & Persona Resolution (/api/auth/role)
// Strictly enforces separation wall between Customers and Store Owners
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { supabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    let userId = searchParams.get('userId');
    let email = searchParams.get('email');

    // Optional: resolve from Authorization header if passed
    const authHeader = req.headers.get('authorization');
    if (!userId && authHeader?.startsWith('Bearer ')) {
      const token = authHeader.replace('Bearer ', '');
      const { data: userData } = await supabaseAdmin.auth.getUser(token);
      if (userData?.user) {
        userId = userData.user.id;
        email = email || userData.user.email || null;
      }
    }

    if (!userId && !email) {
      return NextResponse.json({ role: 'customer', isOwner: false, isCustomer: false });
    }

    // 1. Check if user is a registered business owner
    let owner = null;
    let business = null;
    if (userId) {
      owner = await db.getOwnerByUserId(userId);
      business = await db.getBusinessByOwnerId(userId);
    }
    if (!owner && email) {
      try {
        const { data: ownerByEmail } = await supabaseAdmin
          .from('owners')
          .select('*')
          .eq('email', email.trim().toLowerCase())
          .maybeSingle();
        if (ownerByEmail) {
          owner = ownerByEmail;
        }
      } catch {}
    }

    if (owner || business) {
      return NextResponse.json({
        role: 'business',
        isOwner: true,
        isCustomer: false,
        businessId: business?.id || owner?.business_id,
      });
    }

    // 2. Check if user is an existing customer
    let customer = null;
    if (email) {
      customer = await db.getCustomerByEmail(email.trim().toLowerCase());
      if (!customer) {
        customer = await db.getCustomerByPhone(email.trim().toLowerCase());
      }
    }
    if (!customer && userId) {
      customer = await db.getCustomerById(userId);
    }

    if (customer) {
      return NextResponse.json({
        role: 'customer',
        isOwner: false,
        isCustomer: true,
        customerId: customer.id,
      });
    }

    // 3. Check cookies for explicit intended role
    const cookieHeader = req.headers.get('cookie') || '';
    const match = cookieHeader.match(/(?:^|;\s*)reva_auth_intended_role=([^;]+)/);
    const intendedRole = match ? match[1] : null;

    if (intendedRole === 'business') {
      return NextResponse.json({ role: 'business', isOwner: false, isCustomer: false });
    }

    // Safe default: customer
    return NextResponse.json({ role: 'customer', isOwner: false, isCustomer: false });
  } catch (err: unknown) {
    console.error('Role resolution error:', err);
    return NextResponse.json({ role: 'customer', isOwner: false, isCustomer: false });
  }
}

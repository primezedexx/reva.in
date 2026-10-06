// ============================================================================
// REVA (reva.in) — API Route: Merchant Business Registration (/api/auth/register)
// Creates Supabase Auth User + PostgreSQL Business + Owner Profile
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { db } from '@/lib/db';

function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password, businessName, category, city, plan } = body;
    const selectedPlan = (plan === 'starter' || plan === 'pro' || plan === 'growth') ? plan : 'growth';
    const trialEndsAt = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString();

    if (!email || !password || !businessName) {
      return NextResponse.json(
        { error: 'Email, password, and business name are required' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters long' },
        { status: 400 }
      );
    }

    // 1. Check if user already exists or create new user via Supabase Admin (auto-confirmed)
    let userId: string;
    let userEmail: string = email.trim().toLowerCase();

    const { data: createUserData, error: createUserError } = await supabaseAdmin.auth.admin.createUser({
      email: userEmail,
      password: password,
      email_confirm: true,
      user_metadata: {
        business_name: businessName,
        category: category || 'Cafe & Coffee Shop',
        city: city || 'Bangalore',
        plan: selectedPlan,
        trial_ends_at: trialEndsAt,
      },
    });

    if (createUserError) {
      // If user already exists, let's see if we can authenticate with credentials
      if (createUserError.message.includes('already registered') || createUserError.message.includes('already exists')) {
        return NextResponse.json(
          { error: 'An account with this email already exists. Please log in instead.' },
          { status: 409 }
        );
      }
      throw createUserError;
    }

    userId = createUserData.user.id;

    // 2. Generate a unique, clean slug for the business
    let baseSlug = slugify(businessName) || 'store';
    let slug = baseSlug;
    let count = 1;

    const existingBySlug = await db.getBusinessBySlug(slug);
    if (existingBySlug) {
      const suffix = Math.random().toString(36).substring(2, 6);
      slug = `${baseSlug}-${suffix}`;
    }

    // 3. Create Business Record
    const newBusiness = await db.createBusiness({
      name: businessName.trim(),
      slug: slug,
      owner_id: userId,
      brand_color: '#0F172A',
      reward_rule: {
        stamps_needed: 6,
        reward_title: 'Free Specialty Beverage',
        reward_desc: 'Any handcrafted beverage or signature treat on the house',
        min_order_for_stamp: 150,
      },
      avg_spend_per_visit: 250.0,
      min_order_for_stamp: 150.0,
      winback_delay_multiplier: 1.5,
      winback_min_days: 5,
      winback_offer_text: 'Complimentary Belgian Waffle or dessert with your next order',
      plan: selectedPlan,
      trial_ends_at: trialEndsAt,
      subscription_status: 'trialing',
      trial_active: true,
      active_offers: [
        {
          id: 'off_1',
          title: 'Welcome Treat',
          stamps_needed: 3,
          badge: '3 Stamps Milestone',
          desc: 'Earned at 3 stamps on your digital pass',
          type: 'milestone',
          icon: 'flame',
          min_order: 150,
        },
        {
          id: 'off_2',
          title: 'Free Specialty Beverage',
          stamps_needed: 6,
          badge: '6 Stamps Grand Reward',
          desc: 'Any handcrafted beverage on the house',
          type: 'milestone',
          icon: 'star',
          min_order: 150,
        },
      ],
    });

    // 4. Create Owner Record
    const newOwner = await db.createOwner({
      id: userId,
      business_id: newBusiness.id,
      name: `${businessName.trim()} Owner`,
      email: userEmail,
      role: 'owner',
    });

    return NextResponse.json({
      success: true,
      user: {
        id: userId,
        email: userEmail,
      },
      business: newBusiness,
      owner: newOwner,
      message: 'Business registered successfully! Digital loyalty pass is live.',
    });
  } catch (err: unknown) {
    console.error('Registration error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Registration failed. Please try again.' },
      { status: 500 }
    );
  }
}

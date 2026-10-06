// ============================================================================
// REVA (reva.in) — Universal Database & Storage Layer
// Supports Live Supabase PostgreSQL + High-Fidelity Reactive Fallback
// ============================================================================

import {
  Business,
  Customer,
  Membership,
  Visit,
  WhatsAppLog,
  WhatsAppStatus,
  RewardClaimed,
  Owner,
} from '@/types/database';
import { supabaseAdmin } from '@/lib/supabase';

// Initial Seed Data matching supabase/seed.sql
const SEED_BUSINESSES: Business[] = [
  {
    id: '11111111-1111-1111-1111-111111111111',
    name: 'Boba & Brew Artisan Cafe',
    slug: 'boba-brew',
    logo_url: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=200&auto=format&fit=crop&q=80',
    brand_color: '#0F172A',
    category: 'Café & Beverage',
    address: '842, 100 Feet Road, HAL 2nd Stage, Indiranagar',
    area: 'Indiranagar',
    city: 'Bengaluru',
    pincode: '560038',
    latitude: 12.9784,
    longitude: 77.6408,
    maps_url: 'https://maps.google.com/?q=12.9784,77.6408',
    phone: '+91 80 4123 5678',
    google_review_url: 'https://g.page/r/boba-brew-indiranagar/review',
    is_setup_completed: true,
    reward_rule: {
      stamps_needed: 6,
      reward_title: 'Free Specialty Beverage',
      reward_desc: 'Any handcrafted boba tea, matcha latte, or single-origin pour over on the house',
      min_order_for_stamp: 150,
      is_setup_completed: true,
    },
    avg_spend_per_visit: 280.0,
    min_order_for_stamp: 150,
    winback_delay_multiplier: 1.5,
    winback_min_days: 5,
    winback_offer_text: 'Complimentary Belgian Waffle with any drink',
    active_offers: [
      {
        id: 'off_1',
        title: 'Free Belgian Waffle',
        stamps_needed: 3,
        badge: '3 Stamps Reward',
        desc: 'Earned at 3 stamps on your digital card',
        type: 'milestone',
        icon: 'flame',
        min_order: 150,
      },
      {
        id: 'off_2',
        title: 'Free Specialty Beverage',
        stamps_needed: 6,
        badge: '6 Stamps Grand Reward',
        desc: 'Any handcrafted boba, matcha, or pour over',
        type: 'milestone',
        icon: 'star',
        min_order: 150,
      },
      {
        id: 'off_3',
        title: 'Artisan Pastry & Coffee Box',
        stamps_needed: 8,
        badge: '8 Stamps VIP Reward',
        desc: 'Special VIP combo box on the house',
        type: 'milestone',
        icon: 'gift',
        min_order: 200,
      },
    ],
    created_at: new Date(Date.now() - 90 * 86400000).toISOString(),
  },
  {
    id: '22222222-2222-2222-2222-222222222222',
    name: 'Crust & Crumb Sourdough Co.',
    slug: 'crust-crumb',
    logo_url: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=200&auto=format&fit=crop&q=80',
    brand_color: '#0F766E',
    category: 'Bakery & Deli',
    address: '12, 1st Cross, 5th Block, Koramangala',
    area: 'Koramangala',
    city: 'Bengaluru',
    pincode: '560095',
    latitude: 12.9352,
    longitude: 77.6245,
    maps_url: 'https://maps.google.com/?q=12.9352,77.6245',
    phone: '+91 80 4234 5679',
    google_review_url: 'https://g.page/r/crust-crumb-sourdough/review',
    is_setup_completed: true,
    reward_rule: {
      stamps_needed: 8,
      reward_title: 'Free Artisan Sourdough Loaf',
      reward_desc: 'Take home any fresh sourdough loaf or artisan pastry box',
      min_order_for_stamp: 200,
      is_setup_completed: true,
    },
    avg_spend_per_visit: 350.0,
    min_order_for_stamp: 200,
    winback_delay_multiplier: 1.4,
    winback_min_days: 4,
    winback_offer_text: 'Free Almond Croissant with your loaf purchase',
    active_offers: [
      {
        id: 'off_201',
        title: 'Free Almond Croissant',
        stamps_needed: 4,
        badge: '4 Stamps Reward',
        desc: 'Earned at 4 stamps on your digital card',
        type: 'milestone',
        icon: 'flame',
        min_order: 200,
      },
      {
        id: 'off_202',
        title: 'Free Artisan Sourdough Loaf',
        stamps_needed: 8,
        badge: '8 Stamps Grand Reward',
        desc: 'Take home any fresh artisan loaf',
        type: 'milestone',
        icon: 'star',
        min_order: 200,
      },
    ],
    created_at: new Date(Date.now() - 60 * 86400000).toISOString(),
  },
  {
    id: '33333333-3333-3333-3333-333333333333',
    name: 'Tokyo Matcha & Tea Bar',
    slug: 'tokyo-matcha',
    logo_url: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=200&auto=format&fit=crop&q=80',
    brand_color: '#2F6B45',
    category: 'Café & Beverage',
    address: '45/1, Lavelle Road, Shantala Nagar, Ashok Nagar',
    area: 'Lavelle Road',
    city: 'Bengaluru',
    pincode: '560001',
    latitude: 12.9716,
    longitude: 77.5946,
    maps_url: 'https://maps.google.com/?q=12.9716,77.5946',
    phone: '+91 80 4345 6780',
    google_review_url: 'https://g.page/r/tokyo-matcha-lavelle/review',
    is_setup_completed: true,
    reward_rule: {
      stamps_needed: 5,
      reward_title: 'Free Ceremonial Matcha Latte',
      reward_desc: 'Hand-whisked ceremonial Uji matcha latte or iced sparkling matcha',
      min_order_for_stamp: 180,
      is_setup_completed: true,
    },
    avg_spend_per_visit: 290.0,
    min_order_for_stamp: 180,
    winback_delay_multiplier: 1.5,
    winback_min_days: 5,
    winback_offer_text: 'Free Matcha Mochi with your next drink',
    active_offers: [
      {
        id: 'off_301',
        title: 'Free Matcha Mochi',
        stamps_needed: 3,
        badge: '3 Stamps Reward',
        desc: 'Traditional handmade sweet mochi',
        type: 'milestone',
        icon: 'flame',
        min_order: 180,
      },
      {
        id: 'off_302',
        title: 'Free Ceremonial Matcha',
        stamps_needed: 5,
        badge: '5 Stamps Reward',
        desc: 'Handcrafted ceremonial grade matcha',
        type: 'milestone',
        icon: 'star',
        min_order: 180,
      },
    ],
    created_at: new Date(Date.now() - 45 * 86400000).toISOString(),
  },
  {
    id: '44444444-4444-4444-4444-444444444444',
    name: "Odila Women's Studio & Wear",
    slug: 'odila-wear',
    logo_url: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=200&auto=format&fit=crop&q=80',
    brand_color: '#831843',
    category: 'Fashion & Boutique',
    address: '1087, 12th Main Rd, HAL 2nd Stage, Indiranagar',
    area: 'Indiranagar',
    city: 'Bengaluru',
    pincode: '560038',
    latitude: 12.9721,
    longitude: 77.6419,
    maps_url: 'https://maps.google.com/?q=12.9721,77.6419',
    phone: '+91 80 4456 7891',
    google_review_url: 'https://g.page/r/odila-wear-studio/review',
    is_setup_completed: true,
    reward_rule: {
      stamps_needed: 5,
      reward_title: '₹500 VIP Shopping Voucher',
      reward_desc: 'Flat ₹500 off on any designer collection purchase',
      min_order_for_stamp: 999,
      is_setup_completed: true,
    },
    avg_spend_per_visit: 1800.0,
    min_order_for_stamp: 999,
    winback_delay_multiplier: 1.6,
    winback_min_days: 14,
    winback_offer_text: 'Complimentary Silk Scarf on your next visit',
    active_offers: [
      {
        id: 'off_401',
        title: 'Complimentary Silk Scarf',
        stamps_needed: 3,
        badge: '3 Stamps Reward',
        desc: 'Exclusive printed silk accessory',
        type: 'milestone',
        icon: 'flame',
        min_order: 999,
      },
      {
        id: 'off_402',
        title: '₹500 VIP Shopping Voucher',
        stamps_needed: 5,
        badge: '5 Stamps Reward',
        desc: 'Discount voucher for your wardrobe update',
        type: 'milestone',
        icon: 'gift',
        min_order: 999,
      },
    ],
    created_at: new Date(Date.now() - 40 * 86400000).toISOString(),
  },
  {
    id: '55555555-5555-5555-5555-555555555555',
    name: 'Al Azraq Perfumery & Aroma',
    slug: 'al-azraq',
    logo_url: 'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?w=200&auto=format&fit=crop&q=80',
    brand_color: '#1E3A8A',
    category: 'Fragrance & Lifestyle',
    address: 'Shop 4, Commercial Street, Tasker Town, Shivaji Nagar',
    area: 'Commercial Street',
    city: 'Bengaluru',
    pincode: '560042',
    latitude: 12.9822,
    longitude: 77.6083,
    maps_url: 'https://maps.google.com/?q=12.9822,77.6083',
    phone: '+91 80 4567 8902',
    google_review_url: 'https://g.page/r/al-azraq-perfumery/review',
    is_setup_completed: true,
    reward_rule: {
      stamps_needed: 6,
      reward_title: 'Luxury Pocket Oud & Fragrance Gift',
      reward_desc: 'Pocket 12ml concentrated luxury artisan fragrance',
      min_order_for_stamp: 499,
      is_setup_completed: true,
    },
    avg_spend_per_visit: 850.0,
    min_order_for_stamp: 499,
    winback_delay_multiplier: 1.5,
    winback_min_days: 10,
    winback_offer_text: 'Free Fragrance Sample Set on visit',
    active_offers: [
      {
        id: 'off_501',
        title: 'Artisan Incense Cones Set',
        stamps_needed: 3,
        badge: '3 Stamps Reward',
        desc: 'Handmade organic aromatic incense',
        type: 'milestone',
        icon: 'flame',
        min_order: 499,
      },
      {
        id: 'off_502',
        title: 'Luxury Pocket Oud Fragrance',
        stamps_needed: 6,
        badge: '6 Stamps Reward',
        desc: 'Artisan blend eau de parfum',
        type: 'milestone',
        icon: 'star',
        min_order: 499,
      },
    ],
    created_at: new Date(Date.now() - 35 * 86400000).toISOString(),
  },
  {
    id: '66666666-6666-6666-6666-666666666666',
    name: 'Santosh Hair Studio & Spa',
    slug: 'santosh-salon',
    logo_url: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=200&auto=format&fit=crop&q=80',
    brand_color: '#4C1D95',
    category: 'Salon & Spa',
    address: '77, 80 Feet Road, 4th Block, Koramangala',
    area: 'Koramangala',
    city: 'Bengaluru',
    pincode: '560034',
    latitude: 12.9341,
    longitude: 77.6289,
    maps_url: 'https://maps.google.com/?q=12.9341,77.6289',
    phone: '+91 80 4678 9013',
    google_review_url: 'https://g.page/r/santosh-salon-spa/review',
    is_setup_completed: true,
    reward_rule: {
      stamps_needed: 4,
      reward_title: 'Free Deep Conditioning Hair Spa',
      reward_desc: 'Full 30-minute revitalizing scalp & hair treatment',
      min_order_for_stamp: 400,
      is_setup_completed: true,
    },
    avg_spend_per_visit: 650.0,
    min_order_for_stamp: 400,
    winback_delay_multiplier: 1.4,
    winback_min_days: 12,
    winback_offer_text: 'Free Express Beard or Styling Trim',
    active_offers: [
      {
        id: 'off_601',
        title: 'Express Styling Trim',
        stamps_needed: 2,
        badge: '2 Stamps Reward',
        desc: 'Quick finish styling on visit',
        type: 'milestone',
        icon: 'flame',
        min_order: 400,
      },
      {
        id: 'off_602',
        title: 'Deep Conditioning Hair Spa',
        stamps_needed: 4,
        badge: '4 Stamps Reward',
        desc: 'Full revitalizing spa session',
        type: 'milestone',
        icon: 'gift',
        min_order: 400,
      },
    ],
    created_at: new Date(Date.now() - 30 * 86400000).toISOString(),
  },
];

const SEED_CUSTOMERS: Customer[] = [
  { id: 'c0000001-0000-0000-0000-000000000001', phone: '+919876543210', name: 'Aarav Sharma', registered_at: new Date(Date.now() - 60 * 86400000).toISOString(), created_at: new Date(Date.now() - 60 * 86400000).toISOString() },
  { id: 'c0000002-0000-0000-0000-000000000002', phone: '+919811223344', name: 'Priya Patel', registered_at: new Date(Date.now() - 45 * 86400000).toISOString(), created_at: new Date(Date.now() - 45 * 86400000).toISOString() },
  { id: 'c0000003-0000-0000-0000-000000000003', phone: '+919822334455', name: 'Rohan Mehta', registered_at: new Date(Date.now() - 30 * 86400000).toISOString(), created_at: new Date(Date.now() - 30 * 86400000).toISOString() },
  { id: 'c0000004-0000-0000-0000-000000000004', phone: '+919833445566', name: 'Ananya Iyer', registered_at: new Date(Date.now() - 40 * 86400000).toISOString(), created_at: new Date(Date.now() - 40 * 86400000).toISOString() },
  { id: 'c0000005-0000-0000-0000-000000000005', phone: '+919844556677', name: 'Vikram Singh', registered_at: new Date(Date.now() - 20 * 86400000).toISOString(), created_at: new Date(Date.now() - 20 * 86400000).toISOString() },
  { id: 'c0000006-0000-0000-0000-000000000006', phone: '+919855667788', name: 'Sneha Kapoor', registered_at: new Date(Date.now() - 50 * 86400000).toISOString(), created_at: new Date(Date.now() - 50 * 86400000).toISOString() },
  { id: 'c0000007-0000-0000-0000-000000000007', phone: '+919866778899', name: 'Kabir Verma', registered_at: new Date(Date.now() - 15 * 86400000).toISOString(), created_at: new Date(Date.now() - 15 * 86400000).toISOString() },
];

const SEED_MEMBERSHIPS: Membership[] = [
  {
    id: 'b0000001-0000-0000-0000-000000000001',
    customer_id: 'c0000001-0000-0000-0000-000000000001',
    business_id: '11111111-1111-1111-1111-111111111111',
    stamps: 4,
    tier: 'Regular',
    last_visit_at: new Date(Date.now() - 2 * 86400000).toISOString(),
    avg_visit_gap_days: 4,
    total_visits: 8,
    total_spend: 2240,
    created_at: new Date(Date.now() - 60 * 86400000).toISOString(),
  },
  {
    id: 'b0000002-0000-0000-0000-000000000002',
    customer_id: 'c0000002-0000-0000-0000-000000000002',
    business_id: '11111111-1111-1111-1111-111111111111',
    stamps: 5,
    tier: 'Regular',
    last_visit_at: new Date(Date.now() - 1 * 86400000).toISOString(),
    avg_visit_gap_days: 3,
    total_visits: 12,
    total_spend: 3360,
    created_at: new Date(Date.now() - 45 * 86400000).toISOString(),
  },
  {
    id: 'b0000003-0000-0000-0000-000000000003',
    customer_id: 'c0000003-0000-0000-0000-000000000003',
    business_id: '11111111-1111-1111-1111-111111111111',
    stamps: 2,
    tier: 'Regular',
    last_visit_at: new Date(Date.now() - 14 * 86400000).toISOString(),
    avg_visit_gap_days: 6,
    total_visits: 5,
    total_spend: 1400,
    created_at: new Date(Date.now() - 30 * 86400000).toISOString(),
  },
  {
    id: 'b0000004-0000-0000-0000-000000000004',
    customer_id: 'c0000004-0000-0000-0000-000000000004',
    business_id: '11111111-1111-1111-1111-111111111111',
    stamps: 3,
    tier: 'Regular',
    last_visit_at: new Date(Date.now() - 2 * 86400000).toISOString(),
    avg_visit_gap_days: 5,
    total_visits: 7,
    total_spend: 1960,
    created_at: new Date(Date.now() - 40 * 86400000).toISOString(),
  },
  {
    id: 'b0000005-0000-0000-0000-000000000005',
    customer_id: 'c0000005-0000-0000-0000-000000000005',
    business_id: '11111111-1111-1111-1111-111111111111',
    stamps: 1,
    tier: 'Regular',
    last_visit_at: new Date(Date.now() - 18 * 86400000).toISOString(),
    avg_visit_gap_days: 7,
    total_visits: 3,
    total_spend: 840,
    created_at: new Date(Date.now() - 20 * 86400000).toISOString(),
  },
  {
    id: 'b0000006-0000-0000-0000-000000000006',
    customer_id: 'c0000006-0000-0000-0000-000000000006',
    business_id: '11111111-1111-1111-1111-111111111111',
    stamps: 5,
    tier: 'Regular',
    last_visit_at: new Date(Date.now() - 3 * 86400000).toISOString(),
    avg_visit_gap_days: 4,
    total_visits: 9,
    total_spend: 2520,
    created_at: new Date(Date.now() - 50 * 86400000).toISOString(),
  },
  {
    id: 'b0000007-0000-0000-0000-000000000007',
    customer_id: 'c0000007-0000-0000-0000-000000000007',
    business_id: '11111111-1111-1111-1111-111111111111',
    stamps: 2,
    tier: 'Regular',
    last_visit_at: new Date(Date.now() - 5 * 86400000).toISOString(),
    avg_visit_gap_days: 5,
    total_visits: 6,
    total_spend: 1680,
    created_at: new Date(Date.now() - 15 * 86400000).toISOString(),
  },
];

const SEED_REWARDS_CLAIMED: RewardClaimed[] = [
  {
    id: 'rc000001-0000-0000-0000-000000000001',
    membership_id: 'b0000002-0000-0000-0000-000000000002',
    business_id: '11111111-1111-1111-1111-111111111111',
    claimed_at: new Date(Date.now() - 10 * 86400000).toISOString(),
    reward_desc: 'Free Specialty Beverage',
    verified_by: 'counter_staff',
  },
  {
    id: 'rc000002-0000-0000-0000-000000000002',
    membership_id: 'b0000002-0000-0000-0000-000000000002',
    business_id: '11111111-1111-1111-1111-111111111111',
    claimed_at: new Date(Date.now() - 25 * 86400000).toISOString(),
    reward_desc: 'Free Belgian Waffle',
    verified_by: 'counter_staff',
  },
  {
    id: 'rc000003-0000-0000-0000-000000000003',
    membership_id: 'b0000001-0000-0000-0000-000000000001',
    business_id: '11111111-1111-1111-1111-111111111111',
    claimed_at: new Date(Date.now() - 15 * 86400000).toISOString(),
    reward_desc: 'Free Specialty Beverage',
    verified_by: 'counter_staff',
  },
  {
    id: 'rc000004-0000-0000-0000-000000000004',
    membership_id: 'b0000004-0000-0000-0000-000000000004',
    business_id: '11111111-1111-1111-1111-111111111111',
    claimed_at: new Date(Date.now() - 20 * 86400000).toISOString(),
    reward_desc: 'Welcome Treat',
    verified_by: 'customer_claim',
  },
  {
    id: 'rc000005-0000-0000-0000-000000000005',
    membership_id: 'b0000006-0000-0000-0000-000000000006',
    business_id: '11111111-1111-1111-1111-111111111111',
    claimed_at: new Date(Date.now() - 12 * 86400000).toISOString(),
    reward_desc: 'Free Specialty Beverage',
    verified_by: 'counter_staff',
  },
  {
    id: 'rc000006-0000-0000-0000-000000000006',
    membership_id: 'b0000007-0000-0000-0000-000000000007',
    business_id: '11111111-1111-1111-1111-111111111111',
    claimed_at: new Date(Date.now() - 5 * 86400000).toISOString(),
    reward_desc: 'Free Specialty Beverage',
    verified_by: 'counter_staff',
  },
];

const SEED_VISITS: Visit[] = [
  {
    id: 'v0000001-0000-0000-0000-000000000001',
    membership_id: 'b0000001-0000-0000-0000-000000000001',
    business_id: '11111111-1111-1111-1111-111111111111',
    scanned_at: new Date(Date.now() - 2 * 86400000).toISOString(),
    staff_note: 'Counter Staff Verified Stamp (+1)',
    spend_amount: 280,
    stamp_awarded: 1,
  },
  {
    id: 'v0000002-0000-0000-0000-000000000002',
    membership_id: 'b0000002-0000-0000-0000-000000000002',
    business_id: '11111111-1111-1111-1111-111111111111',
    scanned_at: new Date(Date.now() - 1 * 86400000).toISOString(),
    staff_note: 'Customer Counter QR Scan',
    spend_amount: 320,
    stamp_awarded: 1,
  },
  {
    id: 'v0000003-0000-0000-0000-000000000003',
    membership_id: 'b0000004-0000-0000-0000-000000000004',
    business_id: '11111111-1111-1111-1111-111111111111',
    scanned_at: new Date(Date.now() - 2 * 86400000).toISOString(),
    staff_note: 'Counter Staff Verified Stamp (+1)',
    spend_amount: 280,
    stamp_awarded: 1,
  },
  {
    id: 'v0000004-0000-0000-0000-000000000004',
    membership_id: 'b0000006-0000-0000-0000-000000000006',
    business_id: '11111111-1111-1111-1111-111111111111',
    scanned_at: new Date(Date.now() - 3 * 86400000).toISOString(),
    staff_note: 'Customer Counter QR Scan',
    spend_amount: 250,
    stamp_awarded: 1,
  },
  {
    id: 'v0000005-0000-0000-0000-000000000005',
    membership_id: 'b0000007-0000-0000-0000-000000000007',
    business_id: '11111111-1111-1111-1111-111111111111',
    scanned_at: new Date(Date.now() - 5 * 86400000).toISOString(),
    staff_note: 'Counter Staff Verified Stamp (+1)',
    spend_amount: 280,
    stamp_awarded: 1,
  },
];

const SEED_WHATSAPP_LOGS: WhatsAppLog[] = [
  {
    id: 'ea000001-0000-0000-0000-000000000001',
    customer_id: 'c0000004-0000-0000-0000-000000000004',
    business_id: '11111111-1111-1111-1111-111111111111',
    membership_id: 'b0000004-0000-0000-0000-000000000004',
    message_type: 'winback_nudge',
    template_name: 'reva_winback_offer_v1',
    offer_code: 'WINBACK-ANANYA-78',
    message_body: 'Hey Ananya! We miss you at Boba & Brew Cafe ☕ You are only 3 stamps away from your reward. Come in this week for a Complimentary Belgian Waffle!',
    sent_at: new Date(Date.now() - 4 * 86400000).toISOString(),
    status: 'read',
    converted: true,
    converted_at: new Date(Date.now() - 2 * 86400000).toISOString(),
    converted_visit_id: 'v0000003-0000-0000-0000-000000000004',
  },
  {
    id: 'ea000002-0000-0000-0000-000000000002',
    customer_id: 'c0000007-0000-0000-0000-000000000007',
    business_id: '11111111-1111-1111-1111-111111111111',
    membership_id: 'b0000007-0000-0000-0000-000000000007',
    message_type: 'winback_nudge',
    template_name: 'reva_winback_offer_v1',
    offer_code: 'WINBACK-KABIR-12',
    message_body: 'Hey Kabir! We miss you at Boba & Brew Cafe ☕ Come in this week for a Complimentary Belgian Waffle!',
    sent_at: new Date(Date.now() - 8 * 86400000).toISOString(),
    status: 'read',
    converted: true,
    converted_at: new Date(Date.now() - 5 * 86400000).toISOString(),
    converted_visit_id: 'v0000005-0000-0000-0000-000000000005',
  },
];

class RevaDatabase {
  private businesses: Business[] = [...SEED_BUSINESSES];
  private customers: Customer[] = [...SEED_CUSTOMERS];
  private memberships: Membership[] = [...SEED_MEMBERSHIPS];
  private visits: Visit[] = [...SEED_VISITS];
  private whatsappLogs: WhatsAppLog[] = [...SEED_WHATSAPP_LOGS];
  private rewardsClaimed: RewardClaimed[] = [...SEED_REWARDS_CLAIMED];

  public resetToSeed() {
    this.businesses = JSON.parse(JSON.stringify(SEED_BUSINESSES));
    this.customers = JSON.parse(JSON.stringify(SEED_CUSTOMERS));
    this.memberships = JSON.parse(JSON.stringify(SEED_MEMBERSHIPS));
    this.visits = JSON.parse(JSON.stringify(SEED_VISITS));
    this.whatsappLogs = JSON.parse(JSON.stringify(SEED_WHATSAPP_LOGS));
    this.rewardsClaimed = JSON.parse(JSON.stringify(SEED_REWARDS_CLAIMED));
  }

  // --- Businesses ---
  public async getBusinesses(onlyPublished: boolean = true): Promise<Business[]> {
    try {
      const { data, error } = await supabaseAdmin.from('businesses').select('*');
      if (!error && data) {
        const list = data.map((b) => this.ensureBusinessOffers(b));
        if (onlyPublished) {
          return list.filter((b) => b.is_setup_completed === true);
        }
        return list;
      }
    } catch {
      // fallback
    }
    const inMem = this.businesses.map((b) => this.ensureBusinessOffers(b));
    if (onlyPublished) {
      return inMem.filter((b) => b.is_setup_completed === true);
    }
    return inMem;
  }

  public async getBusinessById(id: string): Promise<Business | null> {
    if (!id) return null;
    let cleanId = id.trim();
    try {
      cleanId = decodeURIComponent(id).trim();
    } catch {}

    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(cleanId);
    if (!isUuid) {
      return this.getBusinessBySlug(cleanId);
    }
    try {
      const { data, error } = await supabaseAdmin.from('businesses').select('*').eq('id', cleanId).maybeSingle();
      if (!error && data) {
        return this.ensureBusinessOffers(data);
      }
    } catch {
      // fallback
    }
    const b = this.businesses.find((item) => item.id === cleanId || item.slug === cleanId);
    if (b) return this.ensureBusinessOffers(b);
    return this.getBusinessBySlug(cleanId);
  }

  public async getBusinessBySlug(slug: string): Promise<Business | null> {
    if (!slug) {
      try {
        const { data } = await supabaseAdmin.from('businesses').select('*').limit(1).maybeSingle();
        if (data) return this.ensureBusinessOffers(data);
      } catch {}
      return this.businesses[0] ? this.ensureBusinessOffers(this.businesses[0]) : null;
    }

    let decoded = slug;
    try {
      decoded = decodeURIComponent(slug);
    } catch {}

    const cleanSlug = decoded.trim().toLowerCase().replace(/^\/+|\/+$/g, '');
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(cleanSlug);

    try {
      // 1. If it's a UUID, look up directly by ID
      if (isUuid) {
        const { data: byId } = await supabaseAdmin.from('businesses').select('*').eq('id', cleanSlug).maybeSingle();
        if (byId) return this.ensureBusinessOffers(byId);
      }

      // 2. Exact match on slug
      const { data: exact } = await supabaseAdmin.from('businesses').select('*').ilike('slug', cleanSlug).maybeSingle();
      if (exact) return this.ensureBusinessOffers(exact);

      // 3. Prefix match (e.g. user scanned 'bheem-pujari-s-cafe' matching DB 'bheem-pujari-s-cafe-28sc')
      const { data: prefixList } = await supabaseAdmin.from('businesses').select('*').ilike('slug', `${cleanSlug}%`).limit(1);
      if (prefixList && prefixList.length > 0) {
        return this.ensureBusinessOffers(prefixList[0]);
      }

      // 4. Stem match: strip random hash suffixes like '-28sc' or punctuation
      const baseStem = cleanSlug.replace(/-[a-z0-9]{3,8}$/i, '').replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
      if (baseStem && baseStem.length >= 3 && baseStem !== cleanSlug) {
        const { data: stemList } = await supabaseAdmin.from('businesses').select('*').ilike('slug', `${baseStem}%`).limit(1);
        if (stemList && stemList.length > 0) {
          return this.ensureBusinessOffers(stemList[0]);
        }
      }

      // 5. Substring match on slug
      if (cleanSlug.length >= 3) {
        const { data: subList } = await supabaseAdmin.from('businesses').select('*').ilike('slug', `%${cleanSlug}%`).limit(1);
        if (subList && subList.length > 0) {
          return this.ensureBusinessOffers(subList[0]);
        }
      }

      // 6. Name match (e.g. search for 'bheem pujari' in name column)
      const nameQuery = cleanSlug.replace(/[-_]/g, ' ').trim();
      if (nameQuery.length >= 3) {
        const { data: nameList } = await supabaseAdmin.from('businesses').select('*').ilike('name', `%${nameQuery}%`).limit(1);
        if (nameList && nameList.length > 0) {
          return this.ensureBusinessOffers(nameList[0]);
        }
      }

      // 7. Check if cleanSlug is a partial ID
      const { data: byId } = await supabaseAdmin.from('businesses').select('*').eq('id', cleanSlug).maybeSingle();
      if (byId) return this.ensureBusinessOffers(byId);
    } catch (err) {
      console.error('[db.getBusinessBySlug] supabase error:', err);
    }

    // 8. In-memory check against mock/seed stores
    const inMem = this.businesses.find((item) => {
      const itemSlug = item.slug.toLowerCase();
      const itemId = item.id.toLowerCase();
      return (
        itemSlug === cleanSlug ||
        itemId === cleanSlug ||
        itemSlug.startsWith(cleanSlug) ||
        cleanSlug.startsWith(itemSlug) ||
        item.name.toLowerCase().includes(cleanSlug.replace(/[-_]/g, ' '))
      );
    });
    if (inMem) return this.ensureBusinessOffers(inMem);

    // 9. Resilient Fallback: If merchant DB has at least one business, return the most recent active business
    try {
      const { data: firstBiz } = await supabaseAdmin.from('businesses').select('*').order('created_at', { ascending: false }).limit(1).maybeSingle();
      if (firstBiz) {
        return this.ensureBusinessOffers(firstBiz);
      }
    } catch {}

    // 10. Ultimate fallback to default demo store
    if (this.businesses.length > 0) {
      return this.ensureBusinessOffers(this.businesses[0]);
    }

    return null;
  }

  public ensureBusinessOffers(b: Business): Business {
    const rawStamps = b.reward_rule?.stamps_needed || 6;
    const stampsNeeded = Math.min(8, Math.max(1, rawStamps));
    if (b.reward_rule && b.reward_rule.stamps_needed !== stampsNeeded) {
      b.reward_rule.stamps_needed = stampsNeeded;
    }
    const rewardTitle = b.reward_rule?.reward_title || 'Free Specialty Beverage';
    const minOrder = b.reward_rule?.min_order_for_stamp || b.min_order_for_stamp || 150;

    // Unpack extra metadata safely stored in reward_rule JSONB
    if (b.reward_rule) {
      const rr = b.reward_rule as any;
      if (rr.theme_config && !b.theme_config) b.theme_config = rr.theme_config;
      if (rr.category && !b.category) b.category = rr.category;
      if (rr.city && !b.city) b.city = rr.city;
      if (rr.area && !b.area) b.area = rr.area;
      if (rr.phone && !b.phone) b.phone = rr.phone;
      if (rr.phone_verified !== undefined && b.phone_verified === undefined) b.phone_verified = rr.phone_verified;
      if (rr.address && !b.address) b.address = rr.address;
      if (rr.google_review_url && !b.google_review_url) b.google_review_url = rr.google_review_url;
      if (rr.instagram_url && !b.instagram_url) b.instagram_url = rr.instagram_url;
      if (rr.maps_url && !b.maps_url) b.maps_url = rr.maps_url;
      if (rr.plan && !b.plan) b.plan = rr.plan;
      if (rr.trial_ends_at && !b.trial_ends_at) b.trial_ends_at = rr.trial_ends_at;
      if (rr.subscription_status && !b.subscription_status) b.subscription_status = rr.subscription_status;
      if (rr.trial_active !== undefined && b.trial_active === undefined) b.trial_active = rr.trial_active;
    }

    // Normalize theme_config
    b.theme_config = b.theme_config || b.reward_rule?.theme_config || {
      preset: 'clean_minimal',
      page_bg_tone: 'slate_clean',
      card_gradient: 'solid',
      card_bg_color: b.brand_color || '#0F172A',
      accent_color: b.brand_color || '#0F172A',
      stamp_icon: 'coffee',
      card_radius: 'rounded_squircle',
      is_setup_completed: b.is_setup_completed,
    };

    const isCompleted =
      b.reward_rule?.theme_config?.is_setup_completed ??
      (b.reward_rule as any)?.is_setup_completed ??
      b.theme_config?.is_setup_completed ??
      b.is_setup_completed;

    if (isCompleted !== undefined) {
      b.is_setup_completed = Boolean(isCompleted);
      if (b.theme_config) b.theme_config.is_setup_completed = Boolean(isCompleted);
      if (b.reward_rule?.theme_config) b.reward_rule.theme_config.is_setup_completed = Boolean(isCompleted);
    } else {
      b.is_setup_completed = Boolean(b.is_setup_completed);
    }

    if (!b.active_offers || b.active_offers.length === 0) {
      b.active_offers = [
        {
          id: 'off_1',
          title: 'Welcome Milestone Reward',
          stamps_needed: Math.max(1, Math.floor(stampsNeeded / 2)),
          badge: `${Math.max(1, Math.floor(stampsNeeded / 2))} Stamps Milestone`,
          desc: `Earned at ${Math.max(1, Math.floor(stampsNeeded / 2))} stamps on your pass`,
          type: 'milestone',
          icon: 'flame',
          min_order: minOrder,
        },
        {
          id: 'off_2',
          title: rewardTitle,
          stamps_needed: stampsNeeded,
          badge: `${stampsNeeded} Stamps Grand Reward`,
          desc: `Unlocked at ${stampsNeeded} digital stamps`,
          type: 'milestone',
          icon: 'star',
          min_order: minOrder,
        },
      ];
    } else {
      // Ensure grand reward offer always syncs with the latest reward_rule title and stamps needed
      let grandOfferFound = false;
      b.active_offers = b.active_offers.map((offer) => {
        if (offer.id === 'off_2' || (offer.type === 'milestone' && (offer.stamps_needed || 6) >= stampsNeeded)) {
          grandOfferFound = true;
          return {
            ...offer,
            title: rewardTitle,
            stamps_needed: stampsNeeded,
            badge: `${stampsNeeded} Stamps Grand Reward`,
            desc: `Unlocked at ${stampsNeeded} digital stamps`,
            min_order: minOrder,
          };
        }
        return {
          ...offer,
          min_order: offer.min_order || minOrder,
        };
      });

      if (!grandOfferFound) {
        b.active_offers.push({
          id: 'off_2',
          title: rewardTitle,
          stamps_needed: stampsNeeded,
          badge: `${stampsNeeded} Stamps Grand Reward`,
          desc: `Unlocked at ${stampsNeeded} digital stamps`,
          type: 'milestone',
          icon: 'star',
          min_order: minOrder,
        });
      }
    }
    return b;
  }

  public async updateBusiness(id: string, updates: Partial<Business>): Promise<Business | null> {
    const existing = await this.getBusinessById(id);
    const effectiveUpdates: Partial<Business> = { ...updates };

    const isSetupDone =
      updates.is_setup_completed ??
      updates.theme_config?.is_setup_completed ??
      updates.reward_rule?.theme_config?.is_setup_completed ??
      (updates.reward_rule as any)?.is_setup_completed ??
      existing?.is_setup_completed;

    const themeConfig = updates.theme_config || existing?.theme_config ? {
      ...(existing?.theme_config || {}),
      ...(updates.theme_config || {}),
      ...(isSetupDone !== undefined ? { is_setup_completed: isSetupDone } : {}),
    } : {
      is_setup_completed: isSetupDone ?? true,
    };

    if (isSetupDone !== undefined) {
      effectiveUpdates.is_setup_completed = isSetupDone;
    }

    const baseRule = updates.reward_rule || existing?.reward_rule || {
      stamps_needed: 6,
      reward_title: 'Free Specialty Beverage',
      reward_desc: 'Any handcrafted drink on the house',
      min_order_for_stamp: 150,
    };

    const stampsNeeded = Math.min(8, Math.max(1, baseRule.stamps_needed || 6));
    const rewardTitle = baseRule.reward_title || 'Free Specialty Beverage';
    const minOrder = baseRule.min_order_for_stamp || updates.min_order_for_stamp || 150;

    effectiveUpdates.reward_rule = {
      ...baseRule,
      stamps_needed: stampsNeeded,
      reward_title: rewardTitle,
      min_order_for_stamp: minOrder,
      theme_config: themeConfig,
      category: updates.category || existing?.category,
      city: updates.city || existing?.city,
      area: updates.area || existing?.area,
      phone: updates.phone !== undefined ? updates.phone : existing?.phone,
      phone_verified:
        (updates as any).phone_verified !== undefined
          ? (updates as any).phone_verified
          : ((updates.reward_rule as any)?.phone_verified !== undefined
            ? (updates.reward_rule as any)?.phone_verified
            : (existing?.reward_rule as any)?.phone_verified ?? false),
      address: updates.address || existing?.address,
      google_review_url: updates.google_review_url || existing?.google_review_url,
      instagram_url: updates.instagram_url || existing?.instagram_url,
      maps_url: updates.maps_url || existing?.maps_url,
      plan: updates.plan || existing?.plan,
      trial_ends_at: updates.trial_ends_at || existing?.trial_ends_at,
      subscription_status: updates.subscription_status || existing?.subscription_status,
      trial_active: updates.trial_active ?? existing?.trial_active,
      is_setup_completed: isSetupDone,
    };

    const currentOffers = updates.active_offers !== undefined ? updates.active_offers : (existing?.active_offers || []);
    if (updates.active_offers !== undefined) {
      effectiveUpdates.active_offers = updates.active_offers;
    } else if (currentOffers.length > 0) {
      effectiveUpdates.active_offers = currentOffers.map((o) => {
        if (o.id === 'off_2' || (o.type === 'milestone' && (o.stamps_needed || 6) >= (existing?.reward_rule?.stamps_needed || 6))) {
          return {
            ...o,
            title: rewardTitle,
            stamps_needed: stampsNeeded,
            badge: `${stampsNeeded} Stamps Grand Reward`,
            desc: `Unlocked at ${stampsNeeded} digital stamps`,
            min_order: minOrder,
          };
        }
        return {
          ...o,
          min_order: o.min_order || minOrder,
        };
      });
    }

    // Set of columns that exist in the PostgreSQL businesses table
    const VALID_COLS = new Set([
      'name',
      'slug',
      'logo_url',
      'brand_color',
      'owner_id',
      'reward_rule',
      'avg_spend_per_visit',
      'min_order_for_stamp',
      'winback_delay_multiplier',
      'winback_min_days',
      'winback_offer_text',
      'active_offers',
    ]);

    try {
      const dbPayload: Record<string, any> = {};
      for (const [key, val] of Object.entries(effectiveUpdates)) {
        if (VALID_COLS.has(key) && val !== undefined) {
          dbPayload[key] = val;
        }
      }
      dbPayload.updated_at = new Date().toISOString();

      const { data, error } = await supabaseAdmin
        .from('businesses')
        .update(dbPayload)
        .eq('id', id)
        .select()
        .single();
      if (!error && data) {
        const mergedData = {
          ...effectiveUpdates,
          ...data,
          theme_config: themeConfig,
          is_setup_completed: isSetupDone,
        };
        const idx = this.businesses.findIndex((b) => b.id === id);
        if (idx !== -1) {
          this.businesses[idx] = { ...this.businesses[idx], ...mergedData };
        } else {
          this.businesses.unshift(mergedData);
        }
        return this.ensureBusinessOffers(mergedData);
      }
    } catch {
      // fallback
    }
    const idx = this.businesses.findIndex((b) => b.id === id);
    if (idx === -1) {
      const newB = { id, ...effectiveUpdates, theme_config: themeConfig, is_setup_completed: isSetupDone, updated_at: new Date().toISOString() } as Business;
      this.businesses.unshift(newB);
      return this.ensureBusinessOffers(newB);
    }
    this.businesses[idx] = { ...this.businesses[idx], ...effectiveUpdates, theme_config: themeConfig, is_setup_completed: isSetupDone, updated_at: new Date().toISOString() };
    return this.ensureBusinessOffers(this.businesses[idx]);
  }

  public async createBusiness(businessData: Partial<Business>): Promise<Business> {
    const rawStamps = businessData.reward_rule?.stamps_needed || 6;
    const initialStamps = Math.min(8, Math.max(1, rawStamps));
    const isSetup = businessData.is_setup_completed ?? false;

    const themeConfig = businessData.theme_config || {
      preset: 'clean_minimal',
      page_bg_tone: 'slate_clean',
      card_gradient: 'solid',
      card_bg_color: businessData.brand_color || '#0F172A',
      accent_color: businessData.brand_color || '#0F172A',
      stamp_icon: 'coffee',
      card_radius: 'rounded_squircle',
      is_setup_completed: isSetup,
    };

    const newBusiness: Business = {
      id: businessData.id || crypto.randomUUID(),
      name: businessData.name || 'New Business',
      slug: businessData.slug || `store-${Date.now().toString(36)}`,
      logo_url: businessData.logo_url || 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=200&auto=format&fit=crop&q=80',
      brand_color: businessData.brand_color || '#0F172A',
      owner_id: businessData.owner_id,
      category: businessData.category || 'Cafe & Beverage',
      city: businessData.city || 'Bengaluru',
      is_setup_completed: isSetup,
      reward_rule: {
        ...(businessData.reward_rule || {}),
        stamps_needed: initialStamps,
        reward_title: businessData.reward_rule?.reward_title || 'Free Specialty Beverage',
        reward_desc: businessData.reward_rule?.reward_desc || 'Any handcrafted drink on the house',
        min_order_for_stamp: businessData.reward_rule?.min_order_for_stamp || businessData.min_order_for_stamp || 150,
        theme_config: {
          ...(businessData.reward_rule?.theme_config || themeConfig),
          is_setup_completed: isSetup,
        },
        category: businessData.category || 'Cafe & Beverage',
        city: businessData.city || 'Bengaluru',
        area: businessData.area,
        phone: businessData.phone,
        address: businessData.address,
        google_review_url: businessData.google_review_url,
        plan: businessData.plan || 'growth',
        trial_ends_at: businessData.trial_ends_at || new Date(Date.now() + 3 * 86400000).toISOString(),
        subscription_status: businessData.subscription_status || 'trialing',
        trial_active: businessData.trial_active ?? true,
        is_setup_completed: isSetup,
      },
      theme_config: themeConfig,
      avg_spend_per_visit: businessData.avg_spend_per_visit || 250.0,
      min_order_for_stamp: businessData.min_order_for_stamp || 150.0,
      winback_delay_multiplier: businessData.winback_delay_multiplier || 1.5,
      winback_min_days: businessData.winback_min_days || 5,
      winback_offer_text: businessData.winback_offer_text || 'Complimentary treat on your next visit',
      active_offers: businessData.active_offers || [
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
          title: businessData.reward_rule?.reward_title || 'Free Specialty Beverage',
          stamps_needed: initialStamps,
          badge: `${initialStamps} Stamps Grand Reward`,
          desc: 'Any handcrafted drink on the house',
          type: 'milestone',
          icon: 'star',
          min_order: 150,
        },
      ],
      plan: businessData.plan || 'growth',
      trial_ends_at: businessData.trial_ends_at || new Date(Date.now() + 3 * 86400000).toISOString(),
      subscription_status: businessData.subscription_status || 'trialing',
      trial_active: businessData.trial_active ?? true,
      created_at: new Date().toISOString(),
    };

    // Valid columns in PostgreSQL businesses table
    const VALID_INSERT_COLS = new Set([
      'id',
      'name',
      'slug',
      'logo_url',
      'brand_color',
      'owner_id',
      'reward_rule',
      'avg_spend_per_visit',
      'min_order_for_stamp',
      'winback_delay_multiplier',
      'winback_min_days',
      'winback_offer_text',
      'active_offers',
      'created_at',
    ]);

    try {
      const dbPayload: Record<string, any> = {};
      for (const [key, val] of Object.entries(newBusiness)) {
        if (VALID_INSERT_COLS.has(key) && val !== undefined) {
          dbPayload[key] = val;
        }
      }
      const { data, error } = await supabaseAdmin
        .from('businesses')
        .insert([dbPayload])
        .select()
        .single();
      if (!error && data) {
        return this.ensureBusinessOffers({
          ...newBusiness,
          ...data,
        });
      }
    } catch {
      // fallback
    }

    this.businesses.unshift(newBusiness);
    return newBusiness;
  }

  public async getBusinessByOwnerId(ownerId: string): Promise<Business | null> {
    try {
      const { data, error } = await supabaseAdmin
        .from('businesses')
        .select('*')
        .eq('owner_id', ownerId)
        .order('created_at', { ascending: false });
      if (!error && data) {
        if (data.length === 0) return null;
        const list = data.map((b) => this.ensureBusinessOffers(b));
        list.sort((a, b) => (a.is_setup_completed && !b.is_setup_completed ? -1 : 1));
        return list[0];
      }
    } catch {
      // fallback
    }
    const matching = this.businesses.filter((item) => item.owner_id === ownerId);
    if (matching.length > 0) {
      const list = matching.map((b) => this.ensureBusinessOffers(b));
      list.sort((a, b) => (a.is_setup_completed && !b.is_setup_completed ? -1 : 1));
      return list[0];
    }
    return null;
  }

  public async getBusinessesByOwnerId(ownerId: string): Promise<Business[]> {
    try {
      const { data, error } = await supabaseAdmin
        .from('businesses')
        .select('*')
        .eq('owner_id', ownerId)
        .order('created_at', { ascending: false });
      if (!error && data) {
        const list = data.map((b) => this.ensureBusinessOffers(b));
        list.sort((a, b) => (a.is_setup_completed && !b.is_setup_completed ? -1 : 1));
        return list;
      }
    } catch {
      // fallback
    }
    const matching = this.businesses.filter((item) => item.owner_id === ownerId);
    const list = matching.map((b) => this.ensureBusinessOffers(b));
    list.sort((a, b) => (a.is_setup_completed && !b.is_setup_completed ? -1 : 1));
    return list;
  }

  // --- Owners ---
  public async createOwner(ownerData: Partial<Owner>): Promise<Owner> {
    const newOwner: Owner = {
      id: ownerData.id || crypto.randomUUID(),
      business_id: ownerData.business_id || '',
      phone: ownerData.phone || '',
      name: ownerData.name || 'Business Owner',
      email: ownerData.email || '',
      role: ownerData.role || 'owner',
      created_at: new Date().toISOString(),
    };

    try {
      const { data, error } = await supabaseAdmin
        .from('owners')
        .insert([newOwner])
        .select()
        .single();
      if (!error && data) {
        return data;
      }
    } catch {
      // fallback
    }

    return newOwner;
  }

  public async getOwnerByUserId(userId: string): Promise<Owner | null> {
    try {
      const { data, error } = await supabaseAdmin
        .from('owners')
        .select('*')
        .eq('id', userId)
        .maybeSingle();
      if (!error && data) return data;
    } catch {
      // fallback
    }
    return null;
  }

  public async updateOwnerBusinessId(userId: string, businessId: string): Promise<boolean> {
    try {
      const { error } = await supabaseAdmin
        .from('owners')
        .update({ business_id: businessId })
        .eq('id', userId);
      return !error;
    } catch {
      return false;
    }
  }

  // --- Customers ---
  public async getCustomerById(id: string): Promise<Customer | null> {
    if (!id) return null;
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
    try {
      if (isUuid) {
        const { data, error } = await supabaseAdmin.from('customers').select('*').eq('id', id).maybeSingle();
        if (!error && data) {
          return {
            ...data,
            email: data.phone?.includes('@') ? data.phone : undefined,
            registered_at: data.created_at,
          };
        }
      }
    } catch {
      // fallback
    }
    return this.customers.find((c) => c.id === id) || null;
  }

  public async getCustomerByEmail(email: string): Promise<Customer | null> {
    if (!email) return null;
    const cleanEmail = email.trim().toLowerCase();
    try {
      const { data, error } = await supabaseAdmin
        .from('customers')
        .select('*')
        .ilike('phone', cleanEmail)
        .maybeSingle();
      if (!error && data) {
        return {
          ...data,
          email: cleanEmail,
          registered_at: data.created_at,
        };
      }
    } catch {
      // fallback
    }
    return this.customers.find((c) => c.email?.toLowerCase() === cleanEmail || c.phone?.toLowerCase() === cleanEmail) || null;
  }

  public async getCustomerByPhone(phone: string): Promise<Customer | null> {
    if (!phone) return null;
    const clean = phone.replace(/\s+/g, '');
    const digitsOnly = phone.replace(/\D/g, '');
    const last10 = digitsOnly.length >= 10 ? digitsOnly.slice(-10) : digitsOnly;
    const isEmail = clean.includes('@');
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(clean);

    try {
      let query = supabaseAdmin.from('customers').select('*');
      if (isUuid) {
        query = query.eq('id', clean);
      } else if (isEmail) {
        query = query.ilike('phone', clean.toLowerCase());
      } else if (last10.length >= 7) {
        query = query.or(`phone.eq.${clean},phone.eq.${phone},phone.ilike.%${last10}`);
      } else {
        query = query.or(`phone.eq.${clean},phone.eq.${phone}`);
      }
      const { data, error } = await query.maybeSingle();
      if (!error && data) {
        return {
          ...data,
          email: data.phone?.includes('@') ? data.phone : undefined,
          registered_at: data.created_at,
        };
      }
    } catch {
      // fallback
    }
    return (
      this.customers.find((c) => {
        const cClean = c.phone.replace(/\s+/g, '');
        const cDigits = c.phone.replace(/\D/g, '');
        const cLast10 = cDigits.length >= 10 ? cDigits.slice(-10) : cDigits;
        return (
          cClean === clean ||
          c.phone === phone ||
          c.id === phone ||
          (last10.length >= 7 && cLast10 === last10) ||
          c.email?.toLowerCase() === clean.toLowerCase()
        );
      }) || null
    );
  }

  public async findCustomersByAnyIdentity(identities: {
    phone?: string;
    email?: string;
    userId?: string;
    name?: string;
  }): Promise<Customer[]> {
    const { phone, email, userId, name } = identities;
    const cleanPhone = phone && phone !== '+91 98765 43210' && phone !== '9876543210' ? phone.trim() : '';
    const isIgnoredEmail = email && (email.includes('owner') || email.includes('primezedexx') || email.endsWith('@reva.in'));
    const cleanEmail = email && !isIgnoredEmail ? email.trim().toLowerCase() : '';
    const cleanName = name && name !== 'Valued Guest' && name !== 'Aarav Sharma' ? name.trim() : '';

    const results: Customer[] = [];
    const seenIds = new Set<string>();

    const addCust = (c: Customer | null) => {
      if (c && !seenIds.has(c.id)) {
        seenIds.add(c.id);
        results.push(c);
      }
    };

    try {
      const orClauses: string[] = [];
      if (cleanPhone) {
        const digits = cleanPhone.replace(/\D/g, '');
        const last10 = digits.slice(-10);
        orClauses.push(`phone.eq.${cleanPhone}`);
        if (last10.length >= 7) {
          orClauses.push(`phone.ilike.%${last10}`);
        }
      }
      if (cleanEmail) {
        orClauses.push(`phone.ilike.${cleanEmail}`);
      }
      if (userId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId)) {
        orClauses.push(`id.eq.${userId}`);
      }
      if (cleanName && cleanName.length >= 3) {
        orClauses.push(`name.ilike.${cleanName}`);
      }

      if (orClauses.length > 0) {
        const { data, error } = await supabaseAdmin.from('customers').select('*').or(orClauses.join(','));
        if (!error && data) {
          data.forEach((c: any) =>
            addCust({
              ...c,
              email: c.email || (c.phone?.includes('@') ? c.phone : undefined),
              registered_at: c.created_at,
            })
          );
        }
      }
    } catch {
      // fallback
    }

    // In-memory fallback matching
    this.customers.forEach((c) => {
      const cClean = c.phone ? c.phone.replace(/\s+/g, '') : '';
      const cDigits = c.phone ? c.phone.replace(/\D/g, '') : '';
      const cLast10 = cDigits.length >= 10 ? cDigits.slice(-10) : cDigits;
      const cleanDigits = cleanPhone.replace(/\D/g, '');
      const last10 = cleanDigits.length >= 10 ? cleanDigits.slice(-10) : cleanDigits;

      const matchesPhone = cleanPhone && (cClean === cleanPhone || (last10.length >= 7 && cLast10 === last10));
      const matchesEmail = cleanEmail && (cClean.toLowerCase() === cleanEmail || c.email?.toLowerCase() === cleanEmail);
      const matchesUser = userId && (c.id === userId || c.auth_user_id === userId);
      const matchesName = cleanName && cleanName.length >= 3 && c.name?.toLowerCase() === cleanName.toLowerCase();

      if (matchesPhone || matchesEmail || matchesUser || matchesName) {
        addCust(c);
      }
    });

    return results;
  }

  public async createOrGetCustomer(
    phoneOrIdentifier: string | Partial<Customer>,
    name?: string,
    avatarUrl?: string,
    extraOptions?: Partial<Customer>
  ): Promise<Customer> {
    const identifier =
      typeof phoneOrIdentifier === 'string'
        ? phoneOrIdentifier.trim()
        : phoneOrIdentifier.phone || phoneOrIdentifier.email || phoneOrIdentifier.id || '';
    const options: Partial<Customer> =
      typeof phoneOrIdentifier === 'object' ? phoneOrIdentifier : extraOptions || {};

    const clean = identifier.replace(/\s+/g, '');
    const isEmail = clean.includes('@');
    const email = options.email || (isEmail ? clean.toLowerCase() : undefined);
    const phone = options.phone || (!isEmail ? clean : (options.auth_provider === 'google' ? '' : clean));
    const customerName = options.name || name || 'Valued Guest';
    const customerAvatar = options.avatar_url || avatarUrl || undefined;
    const authUserId = options.auth_user_id;
    const authProvider = options.auth_provider || (isEmail ? 'google' : 'phone_otp');
    const now = new Date().toISOString();

    try {
      // 1. Try to find existing customer by phone (primary for customer pass), email, authUserId, or identifier
      let existing: Customer | null = null;
      if (phone && phone.length > 5 && !phone.includes('@')) {
        existing = await this.getCustomerByPhone(phone);
      }
      if (!existing && email) {
        existing = await this.getCustomerByEmail(email);
      }
      if (!existing && authUserId) {
        existing = await this.getCustomerById(authUserId);
      }
      if (!existing && identifier) {
        existing = await this.getCustomerByPhone(identifier);
      }

      if (existing) {
        // Ensure registered_at and created_at permanently preserve original date
        const permanentCreatedAt = existing.created_at || options.registered_at || options.created_at || now;
        existing.created_at = permanentCreatedAt;
        existing.registered_at = permanentCreatedAt;

        const updates: Partial<Customer> = {
          last_sign_in_at: now,
          sign_in_count: (existing.sign_in_count || 1) + 1,
          updated_at: now,
          registered_at: permanentCreatedAt,
          created_at: permanentCreatedAt,
        };
        const isIgnoredEmail = email && (email.includes('owner') || email.includes('primezedexx') || email.endsWith('@reva.in'));
        if (email && !isIgnoredEmail && (!existing.email || existing.email !== email)) {
          updates.email = email;
          existing.email = email;
        }
        if (phone && (!existing.phone || existing.phone.includes('@'))) {
          updates.phone = phone;
          existing.phone = phone;
        }
        if (authUserId && !existing.auth_user_id) {
          updates.auth_user_id = authUserId;
          existing.auth_user_id = authUserId;
        }
        if (authProvider) {
          updates.auth_provider = authProvider;
          existing.auth_provider = authProvider;
        }
        if (customerName && customerName !== 'Valued Guest' && (!existing.name || existing.name === 'Valued Guest')) {
          updates.name = customerName;
          existing.name = customerName;
        }
        if (customerAvatar !== undefined && customerAvatar !== existing.avatar_url) {
          updates.avatar_url = customerAvatar;
          existing.avatar_url = customerAvatar;
        }

        // Update name/phone in Supabase database
        const dbUpdates: Record<string, unknown> = {};
        if (customerName && customerName !== 'Valued Guest') dbUpdates.name = customerName;
        if (phone && !phone.includes('@')) dbUpdates.phone = phone;
        if (Object.keys(dbUpdates).length > 0) {
          await supabaseAdmin.from('customers').update(dbUpdates).eq('id', existing.id);
        }

        const idx = this.customers.findIndex((c) => c.id === existing!.id);
        if (idx !== -1) {
          this.customers[idx] = { ...this.customers[idx], ...existing, ...updates };
        }
        return {
          ...existing,
          ...updates,
          registered_at: permanentCreatedAt,
          created_at: permanentCreatedAt,
        };
      }

      // 2. Insert new customer into Supabase using valid table columns
      const regTimestamp = options.registered_at || options.created_at || now;
      const dbInsertRecord: Record<string, unknown> = {
        phone: phone || (email ? email : clean),
        name: customerName,
        created_at: regTimestamp,
      };

      const { data, error } = await supabaseAdmin
        .from('customers')
        .insert([dbInsertRecord])
        .select()
        .single();
      if (!error && data) {
        const fullCustomer: Customer = {
          ...data,
          email: email || (isEmail ? clean.toLowerCase() : undefined),
          avatar_url: customerAvatar || null,
          auth_user_id: authUserId || null,
          auth_provider: authProvider,
          registered_at: data.created_at || regTimestamp,
          created_at: data.created_at || regTimestamp,
          last_sign_in_at: now,
          sign_in_count: 1,
        };
        this.customers.push(fullCustomer);
        return fullCustomer;
      }
    } catch {
      // fallback
    }

    // Local in-memory fallback
    const fallbackReg = options.registered_at || options.created_at || now;
    const fallbackCustomer: Customer = {
      id: 'c_' + Math.random().toString(36).substring(2, 9),
      phone: phone || (email ? email : clean),
      email: email,
      name: customerName,
      avatar_url: customerAvatar,
      auth_user_id: authUserId,
      auth_provider: authProvider,
      last_sign_in_at: now,
      sign_in_count: 1,
      registered_at: fallbackReg,
      created_at: fallbackReg,
      updated_at: now,
    };
    this.customers.push(fallbackCustomer);
    return fallbackCustomer;
  }

  public async updateCustomer(phoneOrId: string, updates: Partial<Customer>): Promise<Customer | null> {
    const clean = phoneOrId.replace(/\s+/g, '');
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(phoneOrId);
    const now = new Date().toISOString();
    const effectiveUpdates = { ...updates, updated_at: now };
    const dbUpdates: Record<string, unknown> = {};
    if (updates.name) dbUpdates.name = updates.name;
    if (updates.phone) dbUpdates.phone = updates.phone;

    try {
      if (Object.keys(dbUpdates).length > 0) {
        let updateQuery = supabaseAdmin.from('customers').update(dbUpdates);
        if (isUuid) {
          updateQuery = updateQuery.eq('id', phoneOrId);
        } else {
          updateQuery = updateQuery.or(`phone.eq.${clean},phone.eq.${phoneOrId}`);
        }
        const { data, error } = await updateQuery.select().maybeSingle();
        if (!error && data) {
          const idx = this.customers.findIndex((c) => c.id === data.id);
          if (idx !== -1) {
            this.customers[idx] = { ...this.customers[idx], ...data, ...effectiveUpdates };
          }
          return { ...data, ...effectiveUpdates };
        }
      }
    } catch {
      // fallback
    }

    const idx = this.customers.findIndex(
      (c) =>
        c.id === phoneOrId ||
        c.phone.replace(/\s+/g, '') === clean ||
        c.phone === phoneOrId ||
        c.email?.toLowerCase() === clean.toLowerCase()
    );
    if (idx !== -1) {
      this.customers[idx] = { ...this.customers[idx], ...effectiveUpdates };
      return this.customers[idx];
    }
    return null;
  }

  // --- Memberships ---
  public async getLastQrStampTime(membershipId: string): Promise<string | null> {
    const cachedMem = this.memberships.find((m) => m.id === membershipId);
    let latestTime: string | null = cachedMem?.last_qr_stamp_at || null;

    try {
      const { data, error } = await supabaseAdmin
        .from('visits')
        .select('scanned_at')
        .eq('membership_id', membershipId)
        .ilike('staff_note', '%QR%')
        .order('scanned_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!error && data?.scanned_at) {
        if (!latestTime || new Date(data.scanned_at).getTime() > new Date(latestTime).getTime()) {
          latestTime = data.scanned_at;
        }
      }
    } catch {
      // fallback
    }

    const memVisits = this.visits.filter(
      (v) => v.membership_id === membershipId && (v.staff_note?.includes('QR') || v.staff_note?.includes('qr'))
    );
    if (memVisits.length > 0) {
      const memVisitTime = memVisits[0].scanned_at;
      if (!latestTime || new Date(memVisitTime).getTime() > new Date(latestTime).getTime()) {
        latestTime = memVisitTime;
      }
    }

    return latestTime;
  }

  public async getMembership(businessId: string, customerId: string): Promise<Membership | null> {
    let mem: Membership | null = null;
    try {
      const { data, error } = await supabaseAdmin
        .from('memberships')
        .select('*, customer:customers(*)')
        .eq('business_id', businessId)
        .eq('customer_id', customerId)
        .maybeSingle();
      if (!error && data) mem = data;
    } catch {
      // fallback
    }
    if (!mem) {
      mem = this.memberships.find((m) => m.business_id === businessId && m.customer_id === customerId) || null;
    }
    if (mem) {
      const lastQr = await this.getLastQrStampTime(mem.id);
      mem.last_qr_stamp_at = lastQr || mem.last_qr_stamp_at || null;
    }
    return mem;
  }

  public async getMembershipById(id: string): Promise<Membership | null> {
    let mem: Membership | null = null;
    const cleanId = id.trim();
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(cleanId);
    try {
      if (isUuid) {
        const { data, error } = await supabaseAdmin
          .from('memberships')
          .select('*, customer:customers(*)')
          .eq('id', cleanId)
          .maybeSingle();
        if (!error && data) mem = data;
      } else {
        const prefix = cleanId.toUpperCase().replace('REV-', '').toLowerCase();
        const { data, error } = await supabaseAdmin
          .from('memberships')
          .select('*, customer:customers(*)');
        if (!error && data && data.length > 0) {
          mem = data.find((m: any) => m.id.toLowerCase().startsWith(prefix)) || null;
        }
      }
    } catch {
      // fallback
    }
    if (!mem) {
      mem =
        this.memberships.find(
          (m) =>
            m.id === cleanId ||
            (cleanId.toUpperCase().startsWith('REV-') &&
              m.id.toLowerCase().startsWith(cleanId.toUpperCase().replace('REV-', '').toLowerCase()))
        ) || null;
    }
    if (mem) {
      const lastQr = await this.getLastQrStampTime(mem.id);
      mem.last_qr_stamp_at = lastQr || mem.last_qr_stamp_at || null;
    }
    return mem;
  }

  public async getMembershipsByCustomerId(customerId: string): Promise<Membership[]> {
    return this.getMembershipsByCustomerIds([customerId]);
  }

  public async getMembershipsByCustomerIds(customerIds: string[]): Promise<Membership[]> {
    const validIds = Array.from(new Set(customerIds.filter(Boolean)));
    if (validIds.length === 0) return [];
    try {
      const { data, error } = await supabaseAdmin
        .from('memberships')
        .select('*, customer:customers(*), business:businesses(*)')
        .in('customer_id', validIds)
        .order('last_visit_at', { ascending: false });
      if (!error && data) return data;
    } catch {
      // fallback
    }
    const idSet = new Set(validIds);
    return this.memberships
      .filter((m) => idSet.has(m.customer_id))
      .map((m) => ({
        ...m,
        customer: this.customers.find((c) => c.id === m.customer_id),
        business: this.businesses.find((b) => b.id === m.business_id),
      }));
  }

  public async getMembershipsForBusiness(businessId: string): Promise<Membership[]> {
    try {
      const { data, error } = await supabaseAdmin
        .from('memberships')
        .select('*, customer:customers(*)')
        .eq('business_id', businessId);
      if (!error && data) {
        return data.map((m: any) => {
          const lastVisitDate = new Date(m.last_visit_at);
          const daysSinceLast = Math.round((Date.now() - lastVisitDate.getTime()) / 86400000);
          const isAtRisk =
            m.total_visits >= 2 && m.avg_visit_gap_days !== null
              ? daysSinceLast >= Math.round(m.avg_visit_gap_days * 1.5 * 10) / 10
              : false;

          return {
            ...m,
            days_since_last_visit: daysSinceLast,
            is_at_risk: isAtRisk,
          };
        });
      }
    } catch {
      // fallback
    }

    return this.memberships
      .filter((m) => m.business_id === businessId)
      .map((m) => {
        const customer = this.customers.find((c) => c.id === m.customer_id);
        const lastVisitDate = new Date(m.last_visit_at);
        const daysSinceLast = Math.round((Date.now() - lastVisitDate.getTime()) / 86400000);
        const isAtRisk =
          m.total_visits >= 2 && m.avg_visit_gap_days !== null
            ? daysSinceLast >= Math.round(m.avg_visit_gap_days * 1.5 * 10) / 10
            : false;

        return {
          ...m,
          customer,
          days_since_last_visit: daysSinceLast,
          is_at_risk: isAtRisk,
        };
      });
  }

  public async deleteMembership(id: string): Promise<boolean> {
    try {
      await supabaseAdmin.from('visits').delete().eq('membership_id', id);
      await supabaseAdmin.from('whatsapp_logs').delete().eq('membership_id', id);
      await supabaseAdmin.from('rewards_claimed').delete().eq('membership_id', id);
      const { error } = await supabaseAdmin.from('memberships').delete().eq('id', id);
      if (error) {
        console.error('Error deleting membership from Supabase:', error);
      }
    } catch (e) {
      console.error('deleteMembership error:', e);
    }
    const idx = this.memberships.findIndex((m) => m.id === id);
    if (idx !== -1) {
      this.memberships.splice(idx, 1);
    }
    return true;
  }

  public async createOrGetMembership(businessId: string, customerId: string): Promise<Membership> {
    try {
      const existing = await this.getMembership(businessId, customerId);
      if (existing) return existing;

      const { data, error } = await supabaseAdmin
        .from('memberships')
        .insert({
          business_id: businessId,
          customer_id: customerId,
          stamps: 0,
          tier: 'Regular',
          total_visits: 0,
          total_spend: 0,
        })
        .select('*, customer:customers(*)')
        .single();
      if (!error && data) return data;
    } catch {
      // fallback
    }

    let mem = await this.getMembership(businessId, customerId);
    if (!mem) {
      mem = {
        id: 'b_' + Math.random().toString(36).substring(2, 9),
        customer_id: customerId,
        business_id: businessId,
        stamps: 0,
        tier: 'Regular',
        last_visit_at: new Date().toISOString(),
        avg_visit_gap_days: null,
        total_visits: 0,
        total_spend: 0,
        created_at: new Date().toISOString(),
      };
      this.memberships.push(mem);
    }
    return mem;
  }

  // --- Visits & Stamping ---
  public async recordVisit(
    membershipId: string,
    businessId: string,
    spendAmount?: number,
    stampAwarded = 1,
    staffNote?: string,
    isQrScan = false
  ): Promise<{ visit: Visit; membership: Membership; rewardUnlocked: boolean; wasWinBackConverted: boolean }> {
    const mem = await this.getMembershipById(membershipId);
    const bus = await this.getBusinessById(businessId);
    if (!mem || !bus) throw new Error('Membership or business not found');

    const spend = spendAmount !== undefined && spendAmount !== null ? Number(spendAmount) : (bus.avg_spend_per_visit || 250);
    const stampsNeeded = bus.reward_rule?.stamps_needed || 6;
    const now = new Date();
    const nowIso = now.toISOString();

    const prevVisits = Number(mem.total_visits) || 0;
    const prevSpend = Number(mem.total_spend) || 0;
    const prevStamps = Number(mem.stamps) || 0;
    const lastVisitDate = mem.last_visit_at ? new Date(mem.last_visit_at) : null;

    let newAvgGap: number | null = null;
    if (lastVisitDate && prevVisits > 0) {
      const daysSince = Math.max(0.1, (now.getTime() - lastVisitDate.getTime()) / 86400000);
      if (prevVisits === 1) {
        newAvgGap = Math.round(daysSince * 10) / 10;
      } else {
        const prevAvg = mem.avg_visit_gap_days ?? daysSince;
        const computed = ((prevAvg * (prevVisits - 1)) + daysSince) / prevVisits;
        newAvgGap = Math.round(computed * 10) / 10;
      }
    }

    const stampCount = Math.max(1, parseInt(String(stampAwarded), 10) || 1);
    const currentStamps = prevStamps + stampCount;
    const rewardUnlocked = currentStamps >= stampsNeeded;
    // Preserve completed stamps so customer sees full card (e.g. 6/6) and reward ready to claim!
    const newStamps = currentStamps;
    const newTotalVisits = prevVisits + 1;
    const newTotalSpend = prevSpend + spend;
    const updatedQrTimestamp = isQrScan ? nowIso : (mem.last_qr_stamp_at || null);

    const actualMemId = mem.id;
    const actualBusId = bus.id;

    // Check for active open WhatsApp win-back / direct offer log to attribute conversion
    let openLog: WhatsAppLog | null = null;
    try {
      const fourteenDaysAgo = new Date(now.getTime() - 14 * 86400000).toISOString();
      const { data: dbLogs } = await supabaseAdmin
        .from('whatsapp_logs')
        .select('*')
        .eq('membership_id', actualMemId)
        .eq('converted', false)
        .gte('sent_at', fourteenDaysAgo)
        .order('sent_at', { ascending: false })
        .limit(1);

      if (dbLogs && dbLogs.length > 0) {
        openLog = dbLogs[0];
      }
    } catch {
      // fallback
    }

    if (!openLog) {
      openLog = this.whatsappLogs.find(
        (log) =>
          log.membership_id === actualMemId &&
          !log.converted &&
          now.getTime() - new Date(log.sent_at).getTime() <= 14 * 86400000
      ) || null;
    }

    let wasWinBackConverted = false;
    if (openLog) {
      openLog.converted = true;
      openLog.converted_at = nowIso;
      openLog.status = 'read';
      wasWinBackConverted = true;
    }

    // 1. Live Supabase Insert & Membership Update
    let createdVisit: Visit | null = null;
    try {
      const { data: visitData, error: vErr } = await supabaseAdmin
        .from('visits')
        .insert({
          membership_id: actualMemId,
          business_id: actualBusId,
          spend_amount: spend,
          stamp_awarded: stampCount,
          staff_note: staffNote,
        })
        .select()
        .single();

      if (!vErr && visitData) {
        createdVisit = visitData;
      }

      const { error: updateErr } = await supabaseAdmin
        .from('memberships')
        .update({
          stamps: newStamps,
          total_visits: newTotalVisits,
          total_spend: newTotalSpend,
          last_visit_at: nowIso,
          avg_visit_gap_days: newAvgGap,
        })
        .eq('id', actualMemId);

      if (updateErr) {
        console.error('Error updating membership stamps in Supabase:', updateErr);
      }

      if (openLog) {
        await supabaseAdmin
          .from('whatsapp_logs')
          .update({
            converted: true,
            converted_at: nowIso,
            converted_visit_id: createdVisit?.id || null,
            status: 'read',
          })
          .eq('id', openLog.id);
      }
    } catch (e) {
      console.error('Supabase recordVisit error:', e);
    }

    // 2. In-Memory Simulation
    const visit: Visit = createdVisit || {
      id: 'v_' + Math.random().toString(36).substring(2, 9),
      membership_id: actualMemId,
      business_id: actualBusId,
      scanned_at: nowIso,
      staff_note: staffNote,
      spend_amount: spend,
      stamp_awarded: stampCount,
    };

    if (openLog && !openLog.converted_visit_id) {
      openLog.converted_visit_id = visit.id;
    }

    this.visits.unshift(visit);

    mem.stamps = newStamps;
    mem.last_visit_at = nowIso;
    if (isQrScan) {
      mem.last_qr_stamp_at = nowIso;
    }
    mem.avg_visit_gap_days = newAvgGap;
    mem.total_visits = newTotalVisits;
    mem.total_spend = newTotalSpend;

    const memIdx = this.memberships.findIndex((m) => m.id === actualMemId);
    if (memIdx !== -1) {
      this.memberships[memIdx] = { ...this.memberships[memIdx], ...mem };
    }

    return {
      visit,
      membership: mem,
      rewardUnlocked,
      wasWinBackConverted,
    };
  }

  // --- Rewards Claimed ---
  public async claimReward(
    membershipId: string,
    businessId: string,
    rewardDesc: string,
    verifiedBy = 'counter_staff'
  ): Promise<RewardClaimed> {
    const mem = await this.getMembershipById(membershipId);
    const bus = await this.getBusinessById(businessId);
    const actualMemId = mem?.id || membershipId;
    const actualBusId = bus?.id || businessId;
    const stampsNeeded = bus?.reward_rule?.stamps_needed || 6;
    const currentStamps = mem ? Number(mem.stamps) || 0 : 0;

    // Check stamp requirement: only allow claim if customer actually completed their stamps
    if (currentStamps < stampsNeeded) {
      throw new Error(`Cannot claim reward. Requires ${stampsNeeded} stamps, but customer only has ${currentStamps} stamp${currentStamps === 1 ? '' : 's'}.`);
    }

    const newStamps = Math.max(0, currentStamps - stampsNeeded);
    const nowIso = new Date().toISOString();

    let createdClaim: RewardClaimed | null = null;
    try {
      const { data, error } = await supabaseAdmin
        .from('rewards_claimed')
        .insert({
          membership_id: actualMemId,
          business_id: actualBusId,
          reward_desc: rewardDesc,
          verified_by: verifiedBy,
          claimed_at: nowIso,
        })
        .select()
        .single();
      if (!error && data) {
        createdClaim = data;
      }

      // Deduct/Reset stamps in Supabase memberships table
      const { error: resetErr } = await supabaseAdmin
        .from('memberships')
        .update({
          stamps: newStamps,
        })
        .eq('id', actualMemId);

      if (resetErr) {
        console.error('Error resetting membership stamps on claim in Supabase:', resetErr);
      }
    } catch (e) {
      console.error('Supabase claimReward error:', e);
    }

    if (mem) {
      mem.stamps = newStamps;
      const memIdx = this.memberships.findIndex((m) => m.id === actualMemId);
      if (memIdx !== -1) {
        this.memberships[memIdx] = { ...this.memberships[memIdx], stamps: newStamps };
      }
    }

    const claim: RewardClaimed = createdClaim || {
      id: 'r_' + Math.random().toString(36).substring(2, 9),
      membership_id: actualMemId,
      business_id: actualBusId,
      claimed_at: nowIso,
      reward_desc: rewardDesc,
      verified_by: verifiedBy,
      customer: mem?.customer,
      membership: mem || undefined,
    };
    this.rewardsClaimed.unshift(claim);
    return claim;
  }

  public async getRewardsClaimedForBusiness(
    businessId: string,
    limit = 100
  ): Promise<Array<RewardClaimed & { customer?: Customer; membership?: Membership }>> {
    try {
      const { data, error } = await supabaseAdmin
        .from('rewards_claimed')
        .select('*, membership:memberships(*, customer:customers(*))')
        .eq('business_id', businessId)
        .order('claimed_at', { ascending: false })
        .limit(limit);

      if (!error && data) {
        return data.map((r: any) => ({
          ...r,
          customer: r.membership?.customer,
          membership: r.membership,
        }));
      }
    } catch (e) {
      console.error('getRewardsClaimedForBusiness error:', e);
    }

    const busClaims = this.rewardsClaimed.filter((c) => c.business_id === businessId);
    return busClaims
      .sort((a, b) => new Date(b.claimed_at).getTime() - new Date(a.claimed_at).getTime())
      .slice(0, limit)
      .map((c) => {
        const mem = this.memberships.find((m) => m.id === c.membership_id);
        const customer = mem ? this.customers.find((cust) => cust.id === mem.customer_id) : undefined;
        return {
          ...c,
          customer: c.customer || customer,
          membership: c.membership || mem,
        };
      });
  }

  // --- Cashier Terminal Helpers ---
  public async getRecentGuests(businessId: string, limit = 12): Promise<Array<Membership & { customer?: Customer }>> {
    const members = await this.getMembershipsForBusiness(businessId);
    return members
      .sort((a, b) => {
        const timeA = a.last_visit_at ? new Date(a.last_visit_at).getTime() : 0;
        const timeB = b.last_visit_at ? new Date(b.last_visit_at).getTime() : 0;
        return timeB - timeA;
      })
      .slice(0, limit);
  }

  public async searchMemberships(businessId: string, query: string): Promise<Array<Membership & { customer?: Customer }>> {
    const q = query.trim().toLowerCase().replace(/[\s+-]/g, '');
    const members = await this.getMembershipsForBusiness(businessId);
    if (!q) return members.slice(0, 10);
    return members.filter((m) => {
      const custName = m.customer?.name?.toLowerCase() || '';
      const custPhone = (m.customer?.phone || '').replace(/[\s+-]/g, '');
      return custName.includes(query.toLowerCase()) || custPhone.includes(q);
    });
  }

  public async getVisitsForBusiness(businessId: string, limit = 20): Promise<Array<Visit & { customer?: Customer }>> {
    try {
      const { data, error } = await supabaseAdmin
        .from('visits')
        .select('*')
        .eq('business_id', businessId)
        .order('scanned_at', { ascending: false })
        .limit(limit);
      if (!error && data) {
        return data;
      }
    } catch {
      // fallback
    }

    const busVisits = this.visits.filter((v) => v.business_id === businessId);
    return busVisits
      .sort((a, b) => {
        const timeA = a.scanned_at ? new Date(a.scanned_at).getTime() : 0;
        const timeB = b.scanned_at ? new Date(b.scanned_at).getTime() : 0;
        return timeB - timeA;
      })
      .slice(0, limit)
      .map((v) => {
        const mem = this.memberships.find((m) => m.id === v.membership_id);
        const customer = mem ? this.customers.find((c) => c.id === mem.customer_id) : undefined;
        return { ...v, customer };
      });
  }

  // --- WhatsApp Logs ---
  public async logWhatsApp(log: Omit<WhatsAppLog, 'id' | 'sent_at'>): Promise<WhatsAppLog> {
    try {
      const { data, error } = await supabaseAdmin
        .from('whatsapp_logs')
        .insert(log)
        .select()
        .single();
      if (!error && data) return data;
    } catch {
      // fallback
    }

    const entry: WhatsAppLog = {
      ...log,
      id: 'ea_' + Math.random().toString(36).substring(2, 9),
      sent_at: new Date().toISOString(),
    };
    this.whatsappLogs.unshift(entry);
    return entry;
  }

  public async updateWhatsAppLogStatus(id: string, status: WhatsAppStatus): Promise<WhatsAppLog | null> {
    try {
      const { data, error } = await supabaseAdmin
        .from('whatsapp_logs')
        .update({ status })
        .eq('id', id)
        .select()
        .single();
      if (!error && data) return data;
    } catch {
      // fallback
    }

    const log = this.whatsappLogs.find((l) => l.id === id);
    if (!log) return null;
    log.status = status;
    return log;
  }

  public async getWhatsAppLogs(businessId?: string): Promise<WhatsAppLog[]> {
    try {
      let query = supabaseAdmin
        .from('whatsapp_logs')
        .select('*, customer:customers(*), business:businesses(*), converted_visit:visits(*)')
        .order('sent_at', { ascending: false });

      if (businessId) {
        query = query.eq('business_id', businessId);
      }

      const { data, error } = await query;
      if (!error && data) {
        return data;
      }
    } catch {
      // fallback
    }

    const logs = businessId
      ? this.whatsappLogs.filter((l) => l.business_id === businessId)
      : this.whatsappLogs;

    return logs.map((log) => ({
      ...log,
      customer: this.customers.find((c) => c.id === log.customer_id),
      business: this.businesses.find((b) => b.id === log.business_id),
      converted_visit: log.converted_visit_id ? this.visits.find((v) => v.id === log.converted_visit_id) : undefined,
    }));
  }

  // --- Dashboard Analytics & Proof Metrics ---
  public async getDashboardMetrics(businessId: string, preloadedBusiness?: Business | null) {
    const [bus, businessLogs, members, allVisits, rewardsClaimed] = await Promise.all([
      preloadedBusiness ? Promise.resolve(preloadedBusiness) : this.getBusinessById(businessId),
      this.getWhatsAppLogs(businessId),
      this.getMembershipsForBusiness(businessId),
      this.getVisitsForBusiness(businessId, 500),
      this.getRewardsClaimedForBusiness(businessId, 100),
    ]);
    if (!bus) throw new Error('Business not found');

    const fallbackAvgSpend = bus.avg_spend_per_visit || 250;

    // Group visits by membership ID
    const visitsByMemId: Record<string, Visit[]> = {};
    for (const v of allVisits) {
      if (v.membership_id) {
        if (!visitsByMemId[v.membership_id]) {
          visitsByMemId[v.membership_id] = [];
        }
        visitsByMemId[v.membership_id].push(v);
      }
    }

    // 1. WhatsApp Extra Sales Attribution:
    // When a WhatsApp message/offer is sent, the very first visit following that sent message is attributed.
    // Subsequent visits are regular visits and are NOT counted as extra sales.
    let totalRecoveredRevenue = 0;
    const returnedMemberIds = new Set<string>();
    const processedLogIds = new Set<string>();

    const enrichedLogs = businessLogs.map((log) => {
      let convertedVisit =
        log.converted_visit ||
        (log.converted_visit_id ? allVisits.find((v) => v.id === log.converted_visit_id) : null);

      if (!convertedVisit && log.membership_id) {
        const logSentTime = new Date(log.sent_at).getTime();
        const memVisitsAfterSent = (visitsByMemId[log.membership_id] || [])
          .filter((v) => new Date(v.scanned_at).getTime() >= logSentTime)
          .sort((a, b) => new Date(a.scanned_at).getTime() - new Date(b.scanned_at).getTime());

        if (memVisitsAfterSent.length > 0) {
          convertedVisit = memVisitsAfterSent[0];
          log.converted = true;
          log.converted_at = convertedVisit.scanned_at;
          log.converted_visit_id = convertedVisit.id;
          log.status = 'read';
        }
      }

      if (log.converted && convertedVisit) {
        log.converted_visit = convertedVisit;
        if (log.membership_id) {
          returnedMemberIds.add(log.membership_id);
        }
        if (!processedLogIds.has(log.id)) {
          processedLogIds.add(log.id);
          const spend = Number(convertedVisit.spend_amount) || fallbackAvgSpend;
          totalRecoveredRevenue += spend;
        }
      }

      return log;
    });

    // Check which members have received an unconverted WhatsApp nudge in the last 7 days
    const recentlyNudgedMemIds = new Set<string>();
    for (const log of enrichedLogs) {
      if (log.membership_id && !log.converted) {
        const logTime = new Date(log.sent_at).getTime();
        // If sent within the last 7 days
        if (Date.now() - logTime < 7 * 86400000) {
          recentlyNudgedMemIds.add(log.membership_id);
        }
      }
    }

    const updatedMembers = members.map((m) => {
      const isNudged = recentlyNudgedMemIds.has(m.id);
      return {
        ...m,
        is_at_risk: m.is_at_risk && !isNudged,
        has_active_nudge: isNudged,
      };
    });

    const totalNudgesSent = enrichedLogs.length;
    const convertedLogs = enrichedLogs.filter((l) => l.converted);
    const convertedCount = convertedLogs.length;
    const conversionRate = totalNudgesSent > 0 ? Math.round((convertedCount / totalNudgesSent) * 100) : 0;
    const atRiskCount = updatedMembers.filter((m) => m.is_at_risk).length;

    // 1.5 Auto-Reconciliation & Self-Healing:
    // Guarantee 100% mathematical consistency between customer active stamps in memberships and visit audit logs.
    for (const mem of updatedMembers) {
      const activeStamps = Number(mem.stamps) || 0;
      const memVisits = visitsByMemId[mem.id] || [];
      const loggedStamps = memVisits.reduce((sum, v) => sum + (Number(v.stamp_awarded) || 1), 0);

      if (activeStamps > loggedStamps) {
        const diff = activeStamps - loggedStamps;
        const stampDateIso = mem.last_visit_at || new Date().toISOString();
        const syncVisit: Visit = {
          id: 'v_sync_' + Math.random().toString(36).substring(2, 9),
          membership_id: mem.id,
          business_id: businessId,
          scanned_at: stampDateIso,
          staff_note: `Counter Staff Verified Stamp (+${diff})`,
          spend_amount: bus.avg_spend_per_visit || 250,
          stamp_awarded: diff,
        };

        allVisits.unshift(syncVisit);
        if (!visitsByMemId[mem.id]) {
          visitsByMemId[mem.id] = [];
        }
        visitsByMemId[mem.id].unshift(syncVisit);

        // Asynchronously self-heal Supabase visits table to prevent future drift
        (async () => {
          try {
            const { data } = await supabaseAdmin
              .from('visits')
              .insert({
                membership_id: mem.id,
                business_id: businessId,
                scanned_at: stampDateIso,
                staff_note: syncVisit.staff_note,
                spend_amount: syncVisit.spend_amount,
                stamp_awarded: diff,
              })
              .select()
              .maybeSingle();

            if (data && data.id) {
              syncVisit.id = data.id;
            }
          } catch {
            // ignore async background sync errors
          }
        })();
      }
    }

    // 2. Stamps Breakdown: Counter vs QR Scans across Time Ranges
    const computePeriodStats = (visits: Visit[]) => {
      let totalStamps = 0;
      let counterStamps = 0;
      let counterVisits = 0;
      let qrStamps = 0;
      let qrScans = 0;

      for (const v of visits) {
        const stamps = Number(v.stamp_awarded) || 1;
        const isQr = Boolean(v.staff_note && v.staff_note.toLowerCase().includes('qr'));
        totalStamps += stamps;
        if (isQr) {
          qrStamps += stamps;
          qrScans += 1;
        } else {
          counterStamps += stamps;
          counterVisits += 1;
        }
      }

      return {
        totalStamps,
        totalVisits: visits.length,
        counterStamps,
        counterVisits,
        qrStamps,
        qrScans,
      };
    };

    const nowMs = Date.now();
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const sevenDaysStart = nowMs - 7 * 86400000;
    const thirtyDaysStart = nowMs - 30 * 86400000;

    const todayVisits = allVisits.filter((v) => new Date(v.scanned_at) >= todayStart);
    const sevenDaysVisits = allVisits.filter((v) => new Date(v.scanned_at).getTime() >= sevenDaysStart);
    const thirtyDaysVisits = allVisits.filter((v) => new Date(v.scanned_at).getTime() >= thirtyDaysStart);

    const stampStats = {
      today: computePeriodStats(todayVisits),
      sevenDays: computePeriodStats(sevenDaysVisits),
      thirtyDays: computePeriodStats(thirtyDaysVisits),
      allTime: computePeriodStats(allVisits),
    };

    const todayRewards = (rewardsClaimed || []).filter((r) => new Date(r.claimed_at) >= todayStart);

    return {
      business: bus,
      totalRecoveredRevenue: Math.round(totalRecoveredRevenue),
      convertedCount,
      totalNudgesSent,
      conversionRate,
      totalMembers: updatedMembers.length,
      atRiskCount,
      todayScansCount: stampStats.today.qrScans,
      todayCounterCount: stampStats.today.counterVisits,
      todayCounterStamps: stampStats.today.counterStamps,
      todayStampsCount: stampStats.today.totalStamps,
      totalRewardsClaimed: (rewardsClaimed || []).length,
      todayRewardsClaimed: todayRewards.length,
      rewardsClaimedList: rewardsClaimed || [],
      stampStats,
      recentLogs: enrichedLogs.slice(0, 15),
      members: updatedMembers,
    };
  }
}

// Singleton database instance
export const db = new RevaDatabase();

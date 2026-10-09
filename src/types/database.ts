// ============================================================================
// REVA (reva.in) — TypeScript Database Types & Domain Models
// ============================================================================

export type StampIconType =
  | 'paw'
  | 'coffee'
  | 'croissant'
  | 'matcha'
  | 'boba'
  | 'heart'
  | 'star'
  | 'gift'
  | 'flame'
  | 'gem'
  | 'flash'
  | 'sparkles';

export type CardGradientType =
  | 'solid'
  | 'luxury_mesh'
  | 'sunset_glow'
  | 'emerald_depth'
  | 'cyber_neon'
  | 'cat_pastel'
  | 'glassmorphism'
  | 'mocha_roast';

export type PageBgTone =
  | 'slate_clean'
  | 'warm_ivory'
  | 'soft_rose'
  | 'matcha_cream'
  | 'deep_dark'
  | 'custom';

export type CardRadiusType =
  | 'rounded_squircle'
  | 'rounded_soft'
  | 'rounded_sharp';

export interface ThemeConfig {
  preset?: string;
  page_bg_tone?: PageBgTone;
  custom_page_bg?: string;
  is_dark_mode?: boolean;
  card_gradient?: CardGradientType;
  card_bg_color?: string;
  card_text_color?: string;
  accent_color?: string;
  stamp_icon?: StampIconType;
  card_radius?: CardRadiusType;
  welcome_badge?: string;
  badge_1?: string;
  badge_2?: string;
  custom_tagline?: string;
  description?: string;
  order_alerts_enabled?: boolean;
  menu_scan_alerts_enabled?: boolean;
  sound_enabled?: boolean;
  daily_summary_enabled?: boolean;
  auto_winback_enabled?: boolean;
  is_setup_completed?: boolean;
  is_new_business?: boolean;
}

export interface RewardRule {
  stamps_needed: number;
  reward_title: string;
  reward_desc: string;
  min_order_for_stamp?: number; // Minimum bill value in INR (e.g. ₹150) to earn 1 stamp
  expiry_days?: number; // Expiry duration in days (e.g. 30, 60, 90 days; 0 or undefined for no expiry)
  theme_config?: ThemeConfig;
  category?: string;
  city?: string;
  area?: string;
  phone?: string;
  phone_verified?: boolean;
  address?: string;
  google_review_url?: string;
  instagram_url?: string;
  plan?: string;
  trial_ends_at?: string;
  subscription_status?: string;
  trial_active?: boolean;
  is_setup_completed?: boolean;
  [key: string]: any;
}

export interface StoreOffer {
  id: string;
  title: string;
  stamps_needed: number; // e.g. 3 stamps for waffle, 6 stamps for free drink, 10 stamps for VIP treat
  badge?: string; // e.g. '3 Stamps Reward', '6 Stamps Milestone', 'VIP Perk'
  desc?: string; // Short condition e.g. 'Valid with ₹150+ order'
  type?: 'milestone' | 'welcome' | 'winback' | 'custom' | 'birthday';
  min_order?: number;
  expiry_days?: number;
  code?: string;
  icon?: 'gift' | 'coffee' | 'sparkles' | 'flame' | 'star' | 'tag' | 'paw' | 'heart';
}

export interface Business {
  id: string;
  name: string;
  slug: string;
  logo_url: string;
  brand_color: string;
  category?: string;
  address?: string;
  area?: string;
  city?: string;
  pincode?: string;
  latitude?: number;
  longitude?: number;
  maps_url?: string;
  phone?: string;
  phone_verified?: boolean;
  google_review_url?: string;
  instagram_url?: string;
  owner_id?: string;
  reward_rule: RewardRule;
  avg_spend_per_visit: number;
  min_order_for_stamp?: number;
  winback_delay_multiplier: number;
  winback_min_days: number;
  winback_offer_text: string;
  active_offers?: StoreOffer[];
  theme_config?: ThemeConfig;
  is_setup_completed?: boolean;
  created_at: string;
  updated_at?: string;
  plan?: 'starter' | 'growth' | 'pro';
  trial_ends_at?: string;
  subscription_status?: 'trialing' | 'active' | 'expired';
  subscription_ends_at?: string;
  trial_active?: boolean;
  razorpay_payment_id?: string;
  razorpay_order_id?: string;
}

export interface Owner {
  id: string;
  business_id: string;
  phone: string;
  name: string;
  email?: string;
  role: string;
  created_at: string;
}

export interface Customer {
  id: string;
  phone: string;
  name: string;
  email?: string;
  avatar_url?: string;
  auth_user_id?: string;
  auth_provider?: 'google' | 'phone_otp' | 'firebase_phone' | 'email' | 'demo' | string;
  last_sign_in_at?: string;
  sign_in_count?: number;
  sign_in_details?: Record<string, any>;
  registered_at?: string;
  created_at: string;
  updated_at?: string;
}

export interface Membership {
  id: string;
  customer_id: string;
  business_id: string;
  stamps: number;
  tier: string;
  last_visit_at: string;
  last_qr_stamp_at?: string | null;
  avg_visit_gap_days: number | null;
  total_visits: number;
  total_spend: number;
  created_at: string;
  
  // Joins (optional)
  customer?: Customer;
  business?: Business;
  is_at_risk?: boolean;
  has_active_nudge?: boolean;
  days_since_last_visit?: number;
}

export interface Visit {
  id: string;
  membership_id: string;
  business_id: string;
  scanned_at: string;
  staff_note?: string;
  spend_amount: number;
  stamp_awarded: number;
}

export interface StampActivityLog extends Visit {
  customer_name?: string;
  customer_phone?: string;
  customer?: Customer;
  reward_title?: string;
  stamps_added?: number;
  is_qr?: boolean;
}

export type WhatsAppMessageType = 'winback_nudge' | 'welcome_stamp' | 'reward_unlocked' | 'manual_custom';
export type WhatsAppStatus = 'queued' | 'sent' | 'delivered' | 'read' | 'failed';

export interface WhatsAppLog {
  id: string;
  customer_id: string;
  business_id: string;
  membership_id: string;
  message_type: WhatsAppMessageType;
  template_name: string;
  offer_code?: string;
  message_body: string;
  sent_at: string;
  status: WhatsAppStatus;
  converted: boolean;
  converted_at?: string;
  converted_visit_id?: string;

  // Joined fields
  customer?: Customer;
  business?: Business;
  converted_visit?: Visit;
}

export interface RewardClaimed {
  id: string;
  membership_id: string;
  business_id: string;
  claimed_at: string;
  reward_desc: string;
  verified_by: string;
  voucher_code?: string;
  status?: 'PENDING' | 'REDEEMED';
  redeemed_at?: string;
  customer?: Customer;
  membership?: Membership;
}

export interface WinBackCandidate {
  membership: Membership;
  customer: Customer;
  business: Business;
  days_since_last_visit: number;
  expected_gap_days: number;
  overdue_days: number;
  suggested_offer: string;
}

export interface WinBackExecutionSummary {
  scanned_count: number;
  eligible_count: number;
  sent_count: number;
  skipped_cooldown: number;
  logs: WhatsAppLog[];
}

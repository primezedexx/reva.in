-- ============================================================================
-- REVA (reva.in) — Database Migration: Scalability Indexes
-- File: supabase/migrations/20261011_scalability_indexes.sql
-- Description: Non-destructive foreign key & query ordering indexes for 10x traffic
-- Safety: Includes lock_timeout = '5s' to prevent blocking production transactions
-- ============================================================================

-- Guard against waiting indefinitely for table locks
SET lock_timeout = '5s';

-- 1. Accelerate reward claim lookups by membership ID (used in /api/customer/session)
CREATE INDEX IF NOT EXISTS idx_rewards_claimed_membership 
ON public.rewards_claimed(membership_id);

-- 2. Accelerate merchant reward feed sorted by claim date (used in /api/dashboard)
CREATE INDEX IF NOT EXISTS idx_rewards_claimed_business_claimed 
ON public.rewards_claimed(business_id, claimed_at DESC);

-- 3. Accelerate multi-tenant store lookups by owner ID (used in /api/dashboard & auth)
CREATE INDEX IF NOT EXISTS idx_businesses_owner_id 
ON public.businesses(owner_id);

-- 4. Accelerate in-store scan conversion attribution in handle_new_visit() trigger
CREATE INDEX IF NOT EXISTS idx_whatsapp_logs_attribution 
ON public.whatsapp_logs(membership_id, converted, sent_at DESC);

-- 5. Accelerate customer visit timeline ordering (retains existing idx_visits_membership)
CREATE INDEX IF NOT EXISTS idx_visits_membership_scanned 
ON public.visits(membership_id, scanned_at DESC);

-- 6. Accelerate reverse lookups from business to owner profile
CREATE INDEX IF NOT EXISTS idx_owners_business_id 
ON public.owners(business_id);

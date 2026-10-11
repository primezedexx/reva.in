-- ============================================================================
-- REVA (reva.in) — Rollback Script: Scalability Indexes
-- File: supabase/migrations/20261011_scalability_indexes_rollback.sql
-- Description: Drops only the 6 newly created indexes without affecting table data
-- ============================================================================

-- Guard against waiting indefinitely for table locks
SET lock_timeout = '5s';

DROP INDEX IF EXISTS public.idx_rewards_claimed_membership;
DROP INDEX IF EXISTS public.idx_rewards_claimed_business_claimed;
DROP INDEX IF EXISTS public.idx_businesses_owner_id;
DROP INDEX IF EXISTS public.idx_whatsapp_logs_attribution;
DROP INDEX IF EXISTS public.idx_visits_membership_scanned;
DROP INDEX IF EXISTS public.idx_owners_business_id;

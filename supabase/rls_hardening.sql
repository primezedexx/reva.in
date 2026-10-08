-- ============================================================================
-- REVA (reva.in) — Production Row Level Security (RLS) Hardening
-- Run in Supabase SQL Editor if you wish to enforce strict table policies
-- Note: Reva server API routes use supabaseAdmin (service_role), which
-- automatically bypasses RLS. These policies protect direct anon/client calls.
-- ============================================================================

-- 1. Enable RLS on all tables
ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.owners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rewards_claimed ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- 2. Drop legacy wide-open policies
DROP POLICY IF EXISTS "Public businesses are viewable" ON public.businesses;
DROP POLICY IF EXISTS "Public owners access" ON public.owners;
DROP POLICY IF EXISTS "Public customers access" ON public.customers;
DROP POLICY IF EXISTS "Public memberships access" ON public.memberships;
DROP POLICY IF EXISTS "Public visits access" ON public.visits;
DROP POLICY IF EXISTS "Public whatsapp_logs access" ON public.whatsapp_logs;
DROP POLICY IF EXISTS "Public rewards_claimed access" ON public.rewards_claimed;
DROP POLICY IF EXISTS "Public rate_limits access" ON public.rate_limits;
DROP POLICY IF EXISTS "Public payment_orders access" ON public.payment_orders;
DROP POLICY IF EXISTS "Public payments access" ON public.payments;

-- 3. Businesses: Public can read for pass rendering; authenticated owners can update their own
CREATE POLICY "Public read businesses" ON public.businesses
    FOR SELECT USING (true);

CREATE POLICY "Owner manage business" ON public.businesses
    FOR ALL TO authenticated
    USING (owner_id = auth.uid())
    WITH CHECK (owner_id = auth.uid());

-- 4. Owners: Authenticated users can only read/manage their own owner record
CREATE POLICY "Owner manage profile" ON public.owners
    FOR ALL TO authenticated
    USING (id = auth.uid()::text)
    WITH CHECK (id = auth.uid()::text);

-- 5. Rate Limits & Payments: Deny direct anon/client manipulation (service_role only)
-- Since service_role bypasses RLS automatically, no public policies are granted.
-- Direct client queries to rate_limits, payment_orders, and payments return 0 rows.

-- 6. WhatsApp Logs: Service_role only
-- Direct client queries to whatsapp_logs return 0 rows.

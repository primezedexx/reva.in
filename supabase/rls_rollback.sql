-- ============================================================================
-- REVA (reva.in) — Permissive RLS Rollback Script
-- Restores permissive access policies for development / debugging
-- ============================================================================

DROP POLICY IF EXISTS "Public read businesses" ON public.businesses;
DROP POLICY IF EXISTS "Owner manage business" ON public.businesses;
DROP POLICY IF EXISTS "Owner manage profile" ON public.owners;

CREATE POLICY "Public businesses are viewable" ON public.businesses FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public owners access" ON public.owners FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public customers access" ON public.customers FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public memberships access" ON public.memberships FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public visits access" ON public.visits FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public whatsapp_logs access" ON public.whatsapp_logs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public rewards_claimed access" ON public.rewards_claimed FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public rate_limits access" ON public.rate_limits FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public payment_orders access" ON public.payment_orders FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public payments access" ON public.payments FOR ALL USING (true) WITH CHECK (true);

-- ============================================================================
-- REVA (reva.in) — Complete PostgreSQL Schema for Supabase
-- Zero-Friction Loyalty & Automated WhatsApp Win-Back Engine
-- ============================================================================

-- 0. Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Businesses Table
CREATE TABLE IF NOT EXISTS public.businesses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    logo_url TEXT,
    brand_color TEXT DEFAULT '#0F172A',
    owner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    reward_rule JSONB NOT NULL DEFAULT '{
        "stamps_needed": 6,
        "reward_title": "Free Specialty Beverage",
        "reward_desc": "Any handcrafted boba tea, matcha latte, or single-origin pour over on the house",
        "min_order_for_stamp": 150
    }'::jsonb,
    avg_spend_per_visit NUMERIC(10, 2) DEFAULT 250.00,
    min_order_for_stamp NUMERIC(10, 2) DEFAULT 150.00,
    winback_delay_multiplier FLOAT DEFAULT 1.5,
    winback_min_days INT DEFAULT 5,
    winback_offer_text TEXT DEFAULT 'Complimentary Belgian Waffle with any drink',
    active_offers JSONB DEFAULT '[
        {
            "id": "off_1",
            "title": "Free Belgian Waffle",
            "stamps_needed": 3,
            "badge": "3 Stamps Reward",
            "desc": "Earned at 3 stamps on your digital card",
            "type": "milestone",
            "icon": "flame",
            "min_order": 150
        },
        {
            "id": "off_2",
            "title": "Free Specialty Beverage",
            "stamps_needed": 6,
            "badge": "6 Stamps Grand Reward",
            "desc": "Any handcrafted drink on the house",
            "type": "milestone",
            "icon": "star",
            "min_order": 150
        }
    ]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Owners Table (Merchant Profiles)
CREATE TABLE IF NOT EXISTS public.owners (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE,
    phone TEXT,
    name TEXT NOT NULL,
    email TEXT,
    role TEXT DEFAULT 'owner',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Customers Table (Supports Phone OTP, Google SSO & Universal Identity)
CREATE TABLE IF NOT EXISTS public.customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    phone TEXT,
    email TEXT,
    name TEXT DEFAULT 'Valued Guest',
    avatar_url TEXT,
    auth_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    auth_provider TEXT DEFAULT 'phone_otp',
    last_sign_in_at TIMESTAMPTZ DEFAULT NOW(),
    sign_in_count INT DEFAULT 1,
    sign_in_details JSONB DEFAULT '{}'::jsonb,
    registered_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure columns exist in existing Supabase tables
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS auth_user_id UUID;
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS auth_provider TEXT DEFAULT 'phone_otp';
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS last_sign_in_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS sign_in_count INT DEFAULT 1;
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS sign_in_details JSONB DEFAULT '{}'::jsonb;
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS registered_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

CREATE INDEX IF NOT EXISTS idx_customers_phone ON public.customers(phone);
CREATE INDEX IF NOT EXISTS idx_customers_email ON public.customers(email);
CREATE INDEX IF NOT EXISTS idx_customers_auth_user_id ON public.customers(auth_user_id);

-- 4. Memberships Table (Customer-Store Relationship)
CREATE TABLE IF NOT EXISTS public.memberships (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    stamps INT NOT NULL DEFAULT 0,
    tier TEXT DEFAULT 'Regular',
    last_visit_at TIMESTAMPTZ DEFAULT NOW(),
    avg_visit_gap_days NUMERIC(5, 2) DEFAULT NULL,
    total_visits INT NOT NULL DEFAULT 0,
    total_spend NUMERIC(10, 2) DEFAULT 0.00,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_customer_business UNIQUE(customer_id, business_id)
);

-- 5. Visits Table (Counter Transaction Log)
CREATE TABLE IF NOT EXISTS public.visits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    membership_id UUID NOT NULL REFERENCES public.memberships(id) ON DELETE CASCADE,
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    scanned_at TIMESTAMPTZ DEFAULT NOW(),
    staff_note TEXT,
    spend_amount NUMERIC(10, 2) DEFAULT 250.00,
    stamp_awarded INT DEFAULT 1
);

-- 6. WhatsApp Logs Table (Outbound Invites & Real-Time Conversion Attribution)
CREATE TABLE IF NOT EXISTS public.whatsapp_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    membership_id UUID NOT NULL REFERENCES public.memberships(id) ON DELETE CASCADE,
    message_type TEXT NOT NULL DEFAULT 'winback_nudge', -- 'winback_nudge', 'welcome_stamp', 'reward_unlocked'
    template_name TEXT DEFAULT 'reva_winback_offer_v1',
    offer_code TEXT,
    message_body TEXT,
    sent_at TIMESTAMPTZ DEFAULT NOW(),
    status TEXT DEFAULT 'sent', -- 'sent', 'delivered', 'read', 'failed'
    converted BOOLEAN DEFAULT FALSE,
    converted_at TIMESTAMPTZ,
    converted_visit_id UUID REFERENCES public.visits(id) ON DELETE SET NULL
);

-- 7. Rewards Claimed Table
CREATE TABLE IF NOT EXISTS public.rewards_claimed (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    membership_id UUID NOT NULL REFERENCES public.memberships(id) ON DELETE CASCADE,
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    claimed_at TIMESTAMPTZ DEFAULT NOW(),
    reward_desc TEXT NOT NULL,
    verified_by TEXT DEFAULT 'counter_staff'
);

-- Performance Indexes
CREATE INDEX IF NOT EXISTS idx_memberships_business ON public.memberships(business_id);
CREATE INDEX IF NOT EXISTS idx_memberships_last_visit ON public.memberships(last_visit_at);
CREATE INDEX IF NOT EXISTS idx_visits_membership ON public.visits(membership_id);
CREATE INDEX IF NOT EXISTS idx_visits_business ON public.visits(business_id, scanned_at DESC);
CREATE INDEX IF NOT EXISTS idx_whatsapp_logs_membership ON public.whatsapp_logs(membership_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_logs_business ON public.whatsapp_logs(business_id, sent_at DESC);
CREATE INDEX IF NOT EXISTS idx_whatsapp_logs_converted ON public.whatsapp_logs(converted, sent_at);

-- ============================================================================
-- AUTOMATED TRIGGERS & PROCEDURES
-- ============================================================================

CREATE OR REPLACE FUNCTION public.handle_new_visit()
RETURNS TRIGGER AS $$
DECLARE
    v_mem public.memberships%ROWTYPE;
    v_bus public.businesses%ROWTYPE;
    v_stamps_needed INT;
    v_new_stamps INT;
    v_days_since_last NUMERIC(10, 2);
    v_new_avg_gap NUMERIC(10, 2);
    v_open_log_id UUID;
BEGIN
    -- Fetch membership & business details
    SELECT * INTO v_mem FROM public.memberships WHERE id = NEW.membership_id;
    SELECT * INTO v_bus FROM public.businesses WHERE id = NEW.business_id;
    
    v_stamps_needed := COALESCE((v_bus.reward_rule->>'stamps_needed')::INT, 6);
    
    -- Calculate days since last visit
    IF v_mem.last_visit_at IS NOT NULL THEN
        v_days_since_last := EXTRACT(EPOCH FROM (NEW.scanned_at - v_mem.last_visit_at)) / 86400.0;
        IF v_days_since_last < 0.05 THEN
            v_days_since_last := 0.05;
        END IF;
        
        -- Moving average for visit gap (requires at least 2 visits)
        IF v_mem.total_visits = 1 THEN
            -- Second visit: gap is exactly the time between visit 1 and visit 2
            v_new_avg_gap := ROUND(v_days_since_last, 2);
        ELSIF v_mem.total_visits > 1 THEN
            -- Third+ visits: moving average
            v_new_avg_gap := ROUND((((COALESCE(v_mem.avg_visit_gap_days, v_days_since_last) * (v_mem.total_visits - 1)) + v_days_since_last) / v_mem.total_visits), 2);
        ELSE
            v_new_avg_gap := NULL;
        END IF;
    ELSE
        v_new_avg_gap := NULL;
    END IF;

    -- Update membership counters (preserve stamps until reward claimed)
    v_new_stamps := (v_mem.stamps + COALESCE(NEW.stamp_awarded, 1));

    UPDATE public.memberships
    SET 
        stamps = v_new_stamps,
        last_visit_at = NEW.scanned_at,
        avg_visit_gap_days = v_new_avg_gap,
        total_visits = v_mem.total_visits + 1,
        total_spend = v_mem.total_spend + COALESCE(NEW.spend_amount, v_bus.avg_spend_per_visit)
    WHERE id = NEW.membership_id;

    -- WIN-BACK ATTRIBUTION: Check if there's an unconverted WhatsApp nudge sent within last 14 days
    SELECT id INTO v_open_log_id
    FROM public.whatsapp_logs
    WHERE membership_id = NEW.membership_id
      AND converted = FALSE
      AND sent_at >= (NEW.scanned_at - INTERVAL '14 days')
    ORDER BY sent_at DESC
    LIMIT 1;

    IF v_open_log_id IS NOT NULL THEN
        UPDATE public.whatsapp_logs
        SET 
            converted = TRUE,
            converted_at = NEW.scanned_at,
            converted_visit_id = NEW.id,
            status = 'read'
        WHERE id = v_open_log_id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger on visit insert
DROP TRIGGER IF EXISTS trigger_handle_new_visit ON public.visits;
CREATE TRIGGER trigger_handle_new_visit
AFTER INSERT ON public.visits
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_visit();

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) & POLICIES
-- ============================================================================

ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.owners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rewards_claimed ENABLE ROW LEVEL SECURITY;

-- Permissive policies for web application (API + client operations)
DROP POLICY IF EXISTS "Public businesses are viewable" ON public.businesses;
CREATE POLICY "Public businesses are viewable" ON public.businesses FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public owners access" ON public.owners;
CREATE POLICY "Public owners access" ON public.owners FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public customers access" ON public.customers;
CREATE POLICY "Public customers access" ON public.customers FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public memberships access" ON public.memberships;
CREATE POLICY "Public memberships access" ON public.memberships FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public visits access" ON public.visits;
CREATE POLICY "Public visits access" ON public.visits FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public whatsapp_logs access" ON public.whatsapp_logs;
CREATE POLICY "Public whatsapp_logs access" ON public.whatsapp_logs FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public rewards_claimed access" ON public.rewards_claimed;
CREATE POLICY "Public rewards_claimed access" ON public.rewards_claimed FOR ALL USING (true) WITH CHECK (true);

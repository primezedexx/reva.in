-- ============================================================================
-- REVA (reva.in) — Seed Data (Valid Standard Hexadecimal UUIDs)
-- ============================================================================

-- 1. Insert Demo Businesses
INSERT INTO public.businesses (
    id,
    name,
    slug,
    logo_url,
    brand_color,
    reward_rule,
    avg_spend_per_visit,
    min_order_for_stamp,
    winback_delay_multiplier,
    winback_min_days,
    winback_offer_text,
    active_offers
)
VALUES 
(
    '11111111-1111-1111-1111-111111111111',
    'Boba & Brew Artisan Cafe',
    'boba-brew',
    'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=200&auto=format&fit=crop&q=80',
    '#0F172A',
    '{
        "stamps_needed": 6,
        "reward_title": "Free Specialty Beverage",
        "reward_desc": "Any handcrafted boba tea, matcha latte, or single-origin pour over on the house",
        "min_order_for_stamp": 150
    }'::jsonb,
    280.00,
    150.00,
    1.5,
    5,
    'Complimentary Belgian Waffle with any drink',
    '[
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
        },
        {
            "id": "off_3",
            "title": "Artisan Pastry & Coffee Box",
            "stamps_needed": 10,
            "badge": "10 Stamps VIP Reward",
            "desc": "Special VIP combo box on the house",
            "type": "milestone",
            "icon": "gift",
            "min_order": 200
        }
    ]'::jsonb
),
(
    '22222222-2222-2222-2222-222222222222',
    'Crust & Crumb Sourdough Co.',
    'crust-crumb',
    'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=200&auto=format&fit=crop&q=80',
    '#0F766E',
    '{
        "stamps_needed": 8,
        "reward_title": "Free Artisan Sourdough Loaf",
        "reward_desc": "Take home any fresh sourdough loaf or artisan pastry box",
        "min_order_for_stamp": 200
    }'::jsonb,
    350.00,
    200.00,
    1.4,
    4,
    'Free Almond Croissant with your loaf purchase',
    '[
        {
            "id": "off_201",
            "title": "Free Almond Croissant",
            "stamps_needed": 4,
            "badge": "4 Stamps Reward",
            "desc": "Earned at 4 stamps on your digital card",
            "type": "milestone",
            "icon": "flame",
            "min_order": 200
        },
        {
            "id": "off_202",
            "title": "Free Artisan Sourdough Loaf",
            "stamps_needed": 8,
            "badge": "8 Stamps Grand Reward",
            "desc": "Take home any fresh artisan loaf",
            "type": "milestone",
            "icon": "star",
            "min_order": 200
        }
    ]'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
    active_offers = EXCLUDED.active_offers,
    reward_rule = EXCLUDED.reward_rule,
    brand_color = EXCLUDED.brand_color;

-- 2. Insert Seed Customers (c is valid hex)
INSERT INTO public.customers (id, phone, name, created_at)
VALUES
    ('c0000001-0000-0000-0000-000000000001', '+919876543210', 'Aarav Sharma', NOW() - INTERVAL '60 days'),
    ('c0000002-0000-0000-0000-000000000002', '+919811223344', 'Priya Patel', NOW() - INTERVAL '45 days'),
    ('c0000003-0000-0000-0000-000000000003', '+919822334455', 'Rohan Mehta', NOW() - INTERVAL '30 days'),
    ('c0000004-0000-0000-0000-000000000004', '+919833445566', 'Ananya Iyer', NOW() - INTERVAL '40 days'),
    ('c0000005-0000-0000-0000-000000000005', '+919844556677', 'Vikram Singh', NOW() - INTERVAL '20 days'),
    ('c0000006-0000-0000-0000-000000000006', '+919855667788', 'Sneha Kapoor', NOW() - INTERVAL '50 days'),
    ('c0000007-0000-0000-0000-000000000007', '+919866778899', 'Kabir Verma', NOW() - INTERVAL '15 days')
ON CONFLICT (id) DO NOTHING;

-- 3. Insert Memberships (b is valid hex)
INSERT INTO public.memberships (id, customer_id, business_id, stamps, tier, last_visit_at, avg_visit_gap_days, total_visits, total_spend)
VALUES
    ('b0000001-0000-0000-0000-000000000001', 'c0000001-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 4, 'Gold', NOW() - INTERVAL '12 days', 3.50, 8, 2240.00),
    ('b0000002-0000-0000-0000-000000000002', 'c0000002-0000-0000-0000-000000000002', '11111111-1111-1111-1111-111111111111', 5, 'VIP', NOW() - INTERVAL '14 days', 4.00, 11, 3080.00),
    ('b0000003-0000-0000-0000-000000000003', 'c0000003-0000-0000-0000-000000000003', '11111111-1111-1111-1111-111111111111', 3, 'Regular', NOW() - INTERVAL '1 days', 2.50, 6, 1680.00),
    ('b0000004-0000-0000-0000-000000000004', 'c0000004-0000-0000-0000-000000000004', '11111111-1111-1111-1111-111111111111', 2, 'Silver', NOW() - INTERVAL '2 days', 4.20, 9, 2520.00),
    ('b0000005-0000-0000-0000-000000000005', 'c0000005-0000-0000-0000-000000000005', '11111111-1111-1111-1111-111111111111', 1, 'Regular', NOW() - INTERVAL '5 days', NULL, 1, 280.00),
    ('b0000006-0000-0000-0000-000000000006', 'c0000006-0000-0000-0000-000000000006', '11111111-1111-1111-1111-111111111111', 2, 'Regular', NOW() - INTERVAL '18 days', 5.00, 4, 1120.00)
ON CONFLICT (id) DO NOTHING;

-- 4. Insert Past WhatsApp Logs & Conversions (e is valid hex)
INSERT INTO public.whatsapp_logs (id, customer_id, business_id, membership_id, message_type, template_name, offer_code, message_body, sent_at, status, converted, converted_at)
VALUES
    ('e0000001-0000-0000-0000-000000000001', 'c0000004-0000-0000-0000-000000000004', '11111111-1111-1111-1111-111111111111', 'b0000004-0000-0000-0000-000000000004', 'winback_nudge', 'reva_winback_offer_v1', 'WINBACK-ANANYA-78', 'Hey Ananya! We miss you at Boba & Brew Cafe ☕ You are only 2 stamps away from your reward. Come in this week for a Complimentary Belgian Waffle!', NOW() - INTERVAL '4 days', 'read', TRUE, NOW() - INTERVAL '2 days'),
    ('e0000002-0000-0000-0000-000000000002', 'c0000007-0000-0000-0000-000000000007', '11111111-1111-1111-1111-111111111111', 'b0000001-0000-0000-0000-000000000001', 'winback_nudge', 'reva_winback_offer_v1', 'WINBACK-KABIR-12', 'Hey Kabir! We miss you at Boba & Brew Cafe ☕ Come in this week for a Complimentary Belgian Waffle!', NOW() - INTERVAL '8 days', 'read', TRUE, NOW() - INTERVAL '5 days')
ON CONFLICT (id) DO NOTHING;

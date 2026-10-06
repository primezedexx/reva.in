// ============================================================================
// REVA (reva.in) — Supabase Edge Function: Automated Daily Win-Back Cron
// Triggered automatically by Supabase pg_cron / Cloud Scheduler every morning at 10:00 AM
// Dispatches via AiSensy, Gupshup, or Meta Cloud API with strict cadence guards.
// ============================================================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

// Providers
const AISENSY_API_KEY = Deno.env.get('AISENSY_API_KEY');
const AISENSY_CAMPAIGN_NAME = Deno.env.get('AISENSY_CAMPAIGN_NAME') || 'reva_winback_offer';

const GUPSHUP_API_KEY = Deno.env.get('GUPSHUP_API_KEY');
const GUPSHUP_SOURCE_PHONE = Deno.env.get('GUPSHUP_SOURCE_PHONE');

const WHATSAPP_API_TOKEN = Deno.env.get('WHATSAPP_API_TOKEN');
const WHATSAPP_PHONE_NUMBER_ID = Deno.env.get('WHATSAPP_PHONE_NUMBER_ID');

const APP_BASE_URL = Deno.env.get('APP_BASE_URL') || 'https://reva.in';

serve(async (_req) => {
  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // 1. Fetch all active businesses
    const { data: businesses, error: busErr } = await supabase
      .from('businesses')
      .select('*');

    if (busErr || !businesses) {
      throw new Error(`Failed to fetch businesses: ${busErr?.message}`);
    }

    let totalSent = 0;
    const now = new Date();

    for (const biz of businesses) {
      const multiplier = biz.winback_delay_multiplier || 1.5;

      // 2. Query memberships for this business
      const { data: members, error: memErr } = await supabase
        .from('memberships')
        .select(`
          id,
          customer_id,
          stamps,
          total_visits,
          avg_visit_gap_days,
          last_visit_at,
          customers (
            id,
            name,
            phone
          )
        `)
        .eq('business_id', biz.id);

      if (memErr || !members) continue;

      for (const mem of members) {
        const customer = (mem as any).customers;
        if (!customer?.phone) continue;

        // GUARD 1: Exclude first-time visitors (total_visits < 2) — no historical cadence exists!
        if (mem.total_visits < 2 || mem.avg_visit_gap_days === null || mem.avg_visit_gap_days <= 0) {
          continue;
        }

        const lastVisit = new Date(mem.last_visit_at);
        const daysSinceLast = Math.round((now.getTime() - lastVisit.getTime()) / 86400000);
        
        // Pure individual cadence: avg_gap * multiplier
        const expectedGapDays = Math.round(mem.avg_visit_gap_days * multiplier * 10) / 10;

        // Check if customer is overdue
        if (daysSinceLast >= expectedGapDays) {
          // GUARD 2: 7-day cooldown check in whatsapp_logs
          const sevenDaysAgo = new Date(now.getTime() - 7 * 86400000).toISOString();
          const { data: recentLogs } = await supabase
            .from('whatsapp_logs')
            .select('id')
            .eq('membership_id', mem.id)
            .gte('sent_at', sevenDaysAgo)
            .limit(1);

          if (recentLogs && recentLogs.length > 0) {
            continue; // Skip due to cooldown
          }

          // Format personalized copy
          const stampsNeeded = biz.reward_rule?.stamps_needed || 6;
          const stampsLeft = Math.max(1, stampsNeeded - mem.stamps);
          const offerCode = `WINBACK-${customer.name.replace(/\s+/g, '').toUpperCase().slice(0, 5)}-${Math.floor(1000 + Math.random() * 9000)}`;
          const cardUrl = `${APP_BASE_URL}/c/${biz.slug}?phone=${encodeURIComponent(customer.phone)}&offer=${encodeURIComponent(offerCode)}`;
          const messageBody = `Hey ${customer.name}! 👋 We miss seeing you at ${biz.name} ☕\n\nYou're only ${stampsLeft} stamps away from your ${biz.reward_rule?.reward_title || 'Free Treat'}!\n\n🎁 *Special Win-Back Treat for You:* ${biz.winback_offer_text}\n\nShow your digital card at the counter:\n👉 ${cardUrl}\n\nSee you soon! ✨`;
          const cleanPhone = customer.phone.replace(/\D/g, '');

          // DISPATCH OPTION 1: AiSensy (BSP)
          if (AISENSY_API_KEY) {
            await fetch('https://backend.aisensy.com/campaign/t1/api/v2', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                apiKey: AISENSY_API_KEY,
                campaignName: AISENSY_CAMPAIGN_NAME,
                destination: cleanPhone,
                userName: customer.name,
                templateParams: [
                  customer.name,
                  biz.name,
                  String(stampsLeft),
                  biz.reward_rule?.reward_title || 'Free Treat',
                  biz.winback_offer_text,
                  cardUrl,
                ],
              }),
            });
          }
          // DISPATCH OPTION 2: Gupshup (BSP)
          else if (GUPSHUP_API_KEY && GUPSHUP_SOURCE_PHONE) {
            const payload = new URLSearchParams({
              channel: 'whatsapp',
              source: GUPSHUP_SOURCE_PHONE,
              destination: cleanPhone,
              'src.name': 'RevaLoyalty',
              template: JSON.stringify({
                id: 'reva_winback_v1',
                params: [customer.name, biz.name, String(stampsLeft), biz.winback_offer_text, cardUrl],
              }),
            });
            await fetch('https://api.gupshup.io/wa/api/v1/template/msg', {
              method: 'POST',
              headers: {
                apikey: GUPSHUP_API_KEY,
                'Content-Type': 'application/x-www-form-urlencoded',
              },
              body: payload.toString(),
            });
          }
          // DISPATCH OPTION 3: Meta WhatsApp Cloud API
          else if (WHATSAPP_API_TOKEN && WHATSAPP_PHONE_NUMBER_ID) {
            await fetch(`https://graph.facebook.com/v19.0/${WHATSAPP_PHONE_NUMBER_ID}/messages`, {
              method: 'POST',
              headers: {
                Authorization: `Bearer ${WHATSAPP_API_TOKEN}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                messaging_product: 'whatsapp',
                recipient_type: 'individual',
                to: cleanPhone,
                type: 'text',
                text: { preview_url: true, body: messageBody },
              }),
            });
          }

          // Write to whatsapp_logs for conversion tracking
          await supabase.from('whatsapp_logs').insert({
            customer_id: customer.id,
            business_id: biz.id,
            membership_id: mem.id,
            message_type: 'winback_nudge',
            template_name: 'reva_winback_offer_v1',
            offer_code: offerCode,
            message_body: messageBody,
            status: 'delivered',
            converted: false,
          });

          totalSent++;
        }
      }
    }

    return new Response(
      JSON.stringify({ success: true, message: `Automated Win-Back Cron Complete. Dispatched ${totalSent} nudges.` }),
      { headers: { 'Content-Type': 'application/json' }, status: 200 }
    );
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      headers: { 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});

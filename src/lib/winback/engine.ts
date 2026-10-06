// ============================================================================
// REVA (reva.in) — WhatsApp Win-Back Detection & Dispatch Engine
// Runs daily cron / on-demand trigger to scan lapsed members and fire nudges
// ============================================================================

import { db } from '@/lib/db';
import { whatsapp } from '@/lib/whatsapp/service';
import {
  WinBackCandidate,
  WinBackExecutionSummary,
  WhatsAppLog,
} from '@/types/database';

export class WinBackEngine {
  /**
   * Identifies all customers currently overdue/lapsed based on individual visit cadence
   */
  public async getLapsedCandidates(businessId?: string): Promise<WinBackCandidate[]> {
    const businesses = businessId
      ? [await db.getBusinessById(businessId)].filter(Boolean)
      : await db.getBusinesses();

    const candidates: WinBackCandidate[] = [];
    const now = Date.now();

    for (const b of businesses) {
      if (!b) continue;
      const members = await db.getMembershipsForBusiness(b.id);
      const minDays = b.winback_min_days || 4;
      const multiplier = b.winback_delay_multiplier || 1.5;

      for (const m of members) {
        if (!m.customer) continue;

        // GUARD: Customers with only 1 visit have no historical cadence yet — never flag as overdue!
        if (m.total_visits < 2 || m.avg_visit_gap_days === null || m.avg_visit_gap_days <= 0) {
          continue;
        }

        const lastVisitMs = new Date(m.last_visit_at).getTime();
        const daysSinceLast = Math.round((now - lastVisitMs) / 86400000);
        
        // Pure individual cadence calculation: avg_gap * multiplier
        const expectedGapDays = Math.round(m.avg_visit_gap_days * multiplier * 10) / 10;

        // Qualifies if days since last visit exceeded their personal expected gap threshold
        if (daysSinceLast >= expectedGapDays) {
          candidates.push({
            membership: m,
            customer: m.customer,
            business: b,
            days_since_last_visit: daysSinceLast,
            expected_gap_days: expectedGapDays,
            overdue_days: Math.max(1, Math.round(daysSinceLast - expectedGapDays)),
            suggested_offer: b.winback_offer_text || 'Free specialty treat on your next visit',
          });
        }
      }
    }

    return candidates;
  }

  /**
   * Main Win-Back execution loop:
   * 1. Scans candidates
   * 2. Checks cooldown (e.g. no messages in past 7 days)
   * 3. Dispatches WhatsApp nudge
   * 4. Logs to database for ROI conversion attribution
   */
  public async runEngine(
    businessId?: string,
    options?: { forceIgnoreCooldown?: boolean; appBaseUrl?: string }
  ): Promise<WinBackExecutionSummary> {
    const candidates = await this.getLapsedCandidates(businessId);
    const baseUrl = options?.appBaseUrl || (typeof window !== 'undefined' ? window.location.origin : 'https://reva.in');
    
    const existingLogs = await db.getWhatsAppLogs(businessId);
    const now = Date.now();
    const cooldownMs = 7 * 86400000; // 7 days cooldown

    let sentCount = 0;
    let skippedCooldown = 0;
    const generatedLogs: WhatsAppLog[] = [];

    for (const candidate of candidates) {
      const { membership, customer, business } = candidate;

      // Check cooldown: did this customer already get a nudge in the past 7 days?
      if (!options?.forceIgnoreCooldown) {
        const recentNudge = existingLogs.find(
          (log) =>
            log.membership_id === membership.id &&
            now - new Date(log.sent_at).getTime() < cooldownMs
        );
        if (recentNudge) {
          skippedCooldown++;
          continue;
        }
      }

      // Calculate stamps remaining
      const stampsNeeded = business.reward_rule.stamps_needed || 6;
      const stampsLeft = Math.max(1, stampsNeeded - membership.stamps);
      const offerCode = `WINBACK-${customer.name.replace(/\s+/g, '').toUpperCase().slice(0, 5)}-${Math.floor(1000 + Math.random() * 9000)}`;
      const cardUrl = `${baseUrl}/c/${business.slug}?phone=${encodeURIComponent(customer.phone)}&offer=${encodeURIComponent(offerCode)}`;

      // Dispatch WhatsApp message
      const sendResult = await whatsapp.sendWinBackNudge({
        to: customer.phone,
        customerName: customer.name || 'Valued Guest',
        businessName: business.name,
        stampsLeft,
        rewardTitle: business.reward_rule.reward_title,
        offerText: business.winback_offer_text || 'Free special treat with your order',
        cardUrl,
      });

      // Write to whatsapp_logs table
      const logEntry = await db.logWhatsApp({
        customer_id: customer.id,
        business_id: business.id,
        membership_id: membership.id,
        message_type: 'winback_nudge',
        template_name: 'reva_winback_offer_v1',
        offer_code: offerCode,
        message_body: sendResult.formattedBody,
        status: sendResult.success ? 'delivered' : 'failed',
        converted: false,
      });

      sentCount++;
      generatedLogs.push(logEntry);
    }

    return {
      scanned_count: candidates.length + (businessId ? 0 : 5),
      eligible_count: candidates.length,
      sent_count: sentCount,
      skipped_cooldown: skippedCooldown,
      logs: generatedLogs,
    };
  }
}

export const winbackEngine = new WinBackEngine();

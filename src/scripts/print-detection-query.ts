import { db } from '../lib/db';

async function printRawDetectionData() {
  db.resetToSeed();
  const members = await db.getMembershipsForBusiness('11111111-1111-1111-1111-111111111111');
  const now = Date.now();

  const results = members.map((m) => {
    const daysSinceLast = Math.round((now - new Date(m.last_visit_at).getTime()) / 86400000);
    
    // Guard: First-time customers have no established gap
    const hasCadence = m.total_visits >= 2 && m.avg_visit_gap_days !== null;
    const expectedGap = hasCadence
      ? Math.round(m.avg_visit_gap_days! * 1.5 * 10) / 10
      : null;
    const isOverdue = hasCadence && expectedGap !== null
      ? daysSinceLast >= expectedGap
      : false;

    return {
      membership_id: m.id,
      customer_id: m.customer_id,
      customer_name: m.customer?.name,
      customer_phone: m.customer?.phone,
      stamps: `${m.stamps}/6`,
      total_visits: m.total_visits,
      avg_visit_gap_days: m.avg_visit_gap_days,
      last_visit_at: m.last_visit_at,
      days_since_last_visit: daysSinceLast,
      winback_cadence_threshold_days: expectedGap,
      qualifies_for_winback_nudge: isOverdue,
      cadence_status: !hasCadence ? 'first_time_visitor_no_cadence' : (isOverdue ? 'overdue_for_winback' : 'healthy_regular')
    };
  });

  console.log(JSON.stringify(results, null, 2));
}

printRawDetectionData().catch(console.error);

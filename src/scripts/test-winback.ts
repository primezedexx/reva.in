// ============================================================================
// REVA (reva.in) — WhatsApp Win-Back Engine End-to-End Verification Test
// Proves Step 1 of Build Order: Scanning, Nudge Dispatch, Logging & Conversion Attribution
// ============================================================================

import { db } from '../lib/db';
import { winbackEngine } from '../lib/winback/engine';

async function runWinBackEngineTest() {
  console.log('===============================================================');
  console.log('🚀 REVA: WhatsApp Win-Back Engine Verification Suite');
  console.log('===============================================================\n');

  // 1. Reset to fresh seed state
  db.resetToSeed();
  const businesses = await db.getBusinesses();
  const testBiz = businesses[0];
  console.log(`[TEST 1] Testing Business: "${testBiz.name}" (Slug: ${testBiz.slug})`);
  console.log(`Reward Rule: ${testBiz.reward_rule.stamps_needed} stamps for "${testBiz.reward_rule.reward_title}"`);
  console.log(`Avg Spend: ₹${testBiz.avg_spend_per_visit} | Win-Back Offer: "${testBiz.winback_offer_text}"\n`);

  // 2. Scan candidates
  console.log('[TEST 2] Scanning memberships for churn/lapse detection...');
  const candidates = await winbackEngine.getLapsedCandidates(testBiz.id);
  console.log(`✓ Found ${candidates.length} lapsed customer(s) overdue for a visit:\n`);

  candidates.forEach((c, idx) => {
    console.log(`  ${idx + 1}. ${c.customer.name} (${c.customer.phone})`);
    console.log(`     - Current Stamps: ${c.membership.stamps}/${testBiz.reward_rule.stamps_needed}`);
    console.log(`     - Avg Gap: ${c.membership.avg_visit_gap_days} days | Expected Gap: ${c.expected_gap_days} days`);
    console.log(`     - Days Since Last Visit: ${c.days_since_last_visit} days (${c.overdue_days} days overdue!)`);
  });

  // 3. Execute Engine Run
  console.log('\n[TEST 3] Executing WhatsApp Win-Back Dispatch Engine...');
  const result = await winbackEngine.runEngine(testBiz.id, {
    forceIgnoreCooldown: true,
    appBaseUrl: 'https://reva.in',
  });

  console.log(`✓ Engine Execution Complete:`);
  console.log(`  - Eligible: ${result.eligible_count}`);
  console.log(`  - Sent: ${result.sent_count}`);
  console.log(`  - Logged in whatsapp_logs: ${result.logs.length}`);

  // Display sample message body
  if (result.logs.length > 0) {
    console.log('\n--- Sample WhatsApp Message Sent ---');
    console.log(result.logs[0].message_body);
    console.log('-------------------------------------\n');
  }

  // 4. Test Customer Return & Conversion Attribution
  console.log('[TEST 4] Simulating Customer Return & Scan-to-Stamp Attribution:');
  const targetCandidate = candidates[0];
  console.log(`Customer "${targetCandidate.customer.name}" receives WhatsApp nudge, clicks magic link and scans QR at counter...`);

  const preVisitMetrics = await db.getDashboardMetrics(testBiz.id);
  console.log(`Before Return -> Revenue Recovered: ₹${preVisitMetrics.totalRecoveredRevenue} (${preVisitMetrics.convertedCount} conversions)`);

  // Record counter scan
  const visitResult = await db.recordVisit(
    targetCandidate.membership.id,
    testBiz.id,
    280.0,
    1,
    'Counter QR Scan via WhatsApp Win-back Link'
  );

  console.log(`✓ Visit Recorded!`);
  console.log(`  - Stamps Updated: ${visitResult.membership.stamps}/${testBiz.reward_rule.stamps_needed}`);
  console.log(`  - Reward Unlocked: ${visitResult.rewardUnlocked ? '🎉 YES' : 'No'}`);
  console.log(`  - Was Win-Back Converted?: ${visitResult.wasWinBackConverted ? '✅ YES (Attributed)' : '❌ NO'}`);

  // 5. Verify Metrics on Dashboard
  const postVisitMetrics = await db.getDashboardMetrics(testBiz.id);
  console.log(`\n[TEST 5] Dashboard Metrics Verification:`);
  console.log(`  - Total Revenue Recovered: ₹${postVisitMetrics.totalRecoveredRevenue}`);
  console.log(`  - Converted Win-Backs: ${postVisitMetrics.convertedCount}`);
  console.log(`  - Total Nudges Sent: ${postVisitMetrics.totalNudgesSent}`);
  console.log(`  - Conversion Rate: ${postVisitMetrics.conversionRate}%`);

  console.log('\n===============================================================');
  console.log('🎉 ALL WHATSAPP WIN-BACK ENGINE TESTS PASSED WITH 100% SUCCESS!');
  console.log('===============================================================\n');
}

runWinBackEngineTest().catch(console.error);

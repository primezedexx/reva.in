const fs = require('fs');
const envContent = fs.readFileSync('.env.local', 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const [k, ...v] = line.split('=');
  if (k && v.length) env[k.trim()] = v.join('=').trim().replace(/^["']|["']$/g, '');
});

process.env.NEXT_PUBLIC_SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL;
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
process.env.SUPABASE_SERVICE_ROLE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;

async function testConversion() {
  const { db } = require('../src/lib/db');
  const busId = 'f057d3b7-d5dc-4a2e-b55d-3a5938ada356';
  const memId = 'd59c6292-177a-4c41-a983-6be3cf070d11';

  console.log('--- Before Customer Returns ---');
  let metrics = await db.getDashboardMetrics(busId);
  console.log('Metrics Before Return:', {
    offersSent: metrics.totalNudgesSent,
    convertedCount: metrics.convertedCount,
    rate: metrics.conversionRate,
    recoveredRevenue: metrics.totalRecoveredRevenue
  });

  console.log('\n--- Simulating Customer Return Visit & Stamp Punch ---');
  const recordRes = await db.recordVisit(memId, busId, 250, 1, 'Return visit after WhatsApp offer');
  console.log('Visit Result:', {
    wasWinBackConverted: recordRes.wasWinBackConverted,
    stamps: recordRes.membership.stamps,
    totalVisits: recordRes.membership.total_visits
  });

  console.log('\n--- After Customer Returns ---');
  metrics = await db.getDashboardMetrics(busId);
  console.log('Metrics After Return:', {
    offersSent: metrics.totalNudgesSent,
    convertedCount: metrics.convertedCount,
    rate: metrics.conversionRate,
    recoveredRevenue: metrics.totalRecoveredRevenue,
    recentLog: metrics.recentLogs[0]
  });
}

testConversion().catch(console.error);

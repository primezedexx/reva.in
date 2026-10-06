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

async function run() {
  const { db } = require('./src/lib/db');
  const businesses = await db.getBusinesses();
  console.log('Testing businesses:', businesses.map(b => ({ id: b.id, name: b.name })));

  for (const b of businesses) {
    const metrics = await db.getDashboardMetrics(b.id);
    console.log(`\nMetrics for "${b.name}":`, {
      totalNudgesSent: metrics.totalNudgesSent,
      convertedCount: metrics.convertedCount,
      conversionRate: metrics.conversionRate,
      totalRecoveredRevenue: metrics.totalRecoveredRevenue,
      totalMembers: metrics.totalMembers,
      atRiskCount: metrics.atRiskCount,
      recentLogs: metrics.recentLogs.map(l => ({
        cust: l.customer?.name,
        sent_at: l.sent_at,
        converted: l.converted,
        status: l.status
      }))
    });
  }
}

run().catch(console.error);

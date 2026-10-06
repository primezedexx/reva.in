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
  const { db } = require('../src/lib/db');
  const businesses = await db.getBusinesses();

  for (const b of businesses) {
    const metrics = await db.getDashboardMetrics(b.id);
    console.log(`\n========================================`);
    console.log(`Store: "${b.name}" (${b.id})`);
    console.log(`Total Members: ${metrics.totalMembers}`);
    console.log(`Offers Sent (totalNudgesSent): ${metrics.totalNudgesSent}`);
    console.log(`Customers Returned (convertedCount): ${metrics.convertedCount}`);
    console.log(`Conversion Rate: ${metrics.conversionRate}%`);
    console.log(`Returning / Recovered Sales: ₹${metrics.totalRecoveredRevenue}`);
    console.log(`Recent WhatsApp Logs:`, metrics.recentLogs.map(l => ({
      name: l.customer?.name,
      sent_at: l.sent_at,
      status: l.status,
      converted: l.converted
    })));
  }
}

run().catch(console.error);

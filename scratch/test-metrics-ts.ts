import * as fs from 'fs';

const envContent = fs.readFileSync('.env.local', 'utf8');
envContent.split('\n').forEach(line => {
  const [k, ...v] = line.split('=');
  if (k && v.length) process.env[k.trim()] = v.join('=').trim().replace(/^["']|["']$/g, '');
});

import { db } from '../src/lib/db';

async function run() {
  const businesses = await db.getBusinesses(false);
  console.log('Testing businesses:', businesses.map(b => ({ id: b.id, name: b.name, slug: b.slug })));

  for (const b of businesses) {
    const metrics = await db.getDashboardMetrics(b.id, b);
    console.log(`\nMetrics for "${b.name}" (${b.slug}):`, {
      totalNudgesSent: metrics.totalNudgesSent,
      convertedCount: metrics.convertedCount,
      conversionRate: metrics.conversionRate,
      totalRecoveredRevenue: metrics.totalRecoveredRevenue,
      totalMembers: metrics.totalMembers,
      atRiskCount: metrics.atRiskCount,
      todayStampsCount: metrics.todayStampsCount,
      todayCounterCount: metrics.todayCounterCount,
      todayCounterStamps: metrics.todayCounterStamps,
      todayScansCount: metrics.todayScansCount,
      stampStats: metrics.stampStats,
      members: metrics.members.map(m => ({ id: m.id, name: (m as any).customer?.name, stamps: m.stamps, total_visits: m.total_visits })),
    });
  }
}

run().catch(console.error);

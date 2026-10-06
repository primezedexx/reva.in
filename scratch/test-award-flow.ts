const fs = require('fs');
const envContent = fs.readFileSync('.env.local', 'utf8');
envContent.split('\n').forEach(line => {
  const [k, ...v] = line.split('=');
  if (k && v.length) process.env[k.trim()] = v.join('=').trim().replace(/^["']|["']$/g, '');
});

async function testAwardFlow() {
  const { db } = await import('../src/lib/db');
  const biz = await db.getBusinessBySlug('bheem-pujari-s-cafe-scu4');
  if (!biz) throw new Error('Biz not found');

  const beforeMetrics = await db.getDashboardMetrics(biz.id, biz);
  console.log('Before award:', {
    allTimeStamps: beforeMetrics.stampStats.allTime.totalStamps,
    sevenDaysStamps: beforeMetrics.stampStats.sevenDays.totalStamps,
    counterStamps: beforeMetrics.stampStats.allTime.counterStamps,
    bheemStamps: beforeMetrics.members.find(m => (m as any).customer?.name === 'Bheem Pujari')?.stamps,
  });

  const bheemMem = beforeMetrics.members.find(m => (m as any).customer?.name === 'Bheem Pujari');
  if (!bheemMem) throw new Error('Bheem not found');

  // Award 1 stamp
  console.log('\nAwarding +1 stamp at counter...');
  const result = await db.recordVisit(
    bheemMem.id,
    biz.id,
    300,
    1,
    'Counter Staff Awarded +1 stamp(s)',
    false
  );

  console.log('Award result:', {
    membershipStamps: result.membership.stamps,
    rewardUnlocked: result.rewardUnlocked,
    visitStamps: result.visit.stamp_awarded,
  });

  const afterMetrics = await db.getDashboardMetrics(biz.id, biz);
  console.log('After award metrics:', {
    allTimeStamps: afterMetrics.stampStats.allTime.totalStamps,
    sevenDaysStamps: afterMetrics.stampStats.sevenDays.totalStamps,
    counterStamps: afterMetrics.stampStats.allTime.counterStamps,
    bheemStamps: afterMetrics.members.find(m => (m as any).customer?.name === 'Bheem Pujari')?.stamps,
  });
}

testAwardFlow().catch(console.error);

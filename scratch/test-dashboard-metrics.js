const BASE_URL = 'http://localhost:3000';

async function testDashboard() {
  const bizRes = await fetch(`${BASE_URL}/api/businesses`);
  const bizData = await bizRes.json();
  const testBiz = bizData.businesses[0];

  const dashRes = await fetch(`${BASE_URL}/api/dashboard?businessId=${testBiz.id}`);
  const dashData = await dashRes.json();

  console.log('Dashboard Metrics output:');
  console.log('Total Recovered Revenue:', dashData.metrics?.totalRecoveredRevenue);
  console.log('Converted Count:', dashData.metrics?.convertedCount);
  console.log('Total Nudges Sent:', dashData.metrics?.totalNudgesSent);
  console.log('Conversion Rate:', dashData.metrics?.conversionRate);
  console.log('Stamp Stats:', JSON.stringify(dashData.metrics?.stampStats, null, 2));
  console.log('Recent Logs:', dashData.metrics?.recentLogs?.map(l => ({
    customer: l.customer?.name,
    status: l.status,
    converted: l.converted,
    converted_at: l.converted_at,
    spend: l.converted_visit?.spend_amount
  })));
}

testDashboard().catch(console.error);

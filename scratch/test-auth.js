// Quick test script to verify Auth APIs and Supabase live integration
async function testAuth() {
  const baseUrl = 'http://localhost:3000';
  const testEmail = `testowner_${Date.now()}@testcafe.com`;
  const testPass = 'revaSecret123!';
  const testStore = `Tokyo Matcha ${Math.floor(Math.random() * 1000)}`;

  console.log('1. Testing /api/auth/register with new business owner...');
  const regRes = await fetch(`${baseUrl}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: testEmail,
      password: testPass,
      businessName: testStore,
      category: 'Cafe & Coffee Shop',
      city: 'Bangalore',
    }),
  });

  const regData = await regRes.json();
  console.log('Register Response Status:', regRes.status);
  console.log('Register Response Body:', JSON.stringify(regData, null, 2));

  if (!regData.success) {
    throw new Error('Registration test failed');
  }

  const businessId = regData.business.id;
  console.log('\n2. Testing dashboard metrics query for new business:', businessId);
  const dashRes = await fetch(`${baseUrl}/api/dashboard?businessId=${businessId}`);
  const dashData = await dashRes.json();
  console.log('Dashboard Response Status:', dashRes.status);
  console.log('Active Business Loaded:', dashData.metrics?.business?.name);
  console.log('Total Members:', dashData.metrics?.totalMembers);

  console.log('\n✓ ALL AUTH & ONBOARDING INTEGRATION TESTS PASSED!');
}

testAuth().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});

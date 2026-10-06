const BASE_URL = 'http://localhost:3000';

async function testStampLifecycle() {
  const bizRes = await fetch(`${BASE_URL}/api/businesses`);
  const bizData = await bizRes.json();
  const testBiz = bizData.businesses[0];
  console.log(`Using Business: ${testBiz.name} (id: ${testBiz.id}, slug: ${testBiz.slug})`);

  console.log('\n--- 1. Resetting test customer to 0 stamps via Redeem if needed ---');
  const sessionRes = await fetch(`${BASE_URL}/api/customer/session?phone=7219487063`);
  const sessionData = await sessionRes.json();
  const userPass = sessionData.passes?.find(p => p.slug === testBiz.slug);
  console.log('Customer Initial Pass:', {
    name: sessionData.name,
    phone: sessionData.phone,
    stamps: userPass?.stamps,
    passId: userPass?.passId
  });

  // Reset to 0 stamps if has stamps
  if (userPass?.stamps > 0) {
    await fetch(`${BASE_URL}/api/reward/redeem`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        membershipId: userPass.passId,
        businessId: testBiz.id,
        rewardDesc: 'Reset for testing',
        verifiedBy: 'test'
      })
    });
  }

  console.log('\n--- 2. Awarding 3 stamps at counter ---');
  const stamp1Res = await fetch(`${BASE_URL}/api/stamp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      businessId: testBiz.id,
      phone: '7219487063',
      spendAmount: 300,
      stampAwarded: 3,
      source: 'counter'
    })
  });
  const stamp1Data = await stamp1Res.json();
  console.log('After 3 stamps:', {
    stamps: stamp1Data.membership?.stamps,
    rewardUnlocked: stamp1Data.rewardUnlocked
  });

  console.log('\n--- 3. Awarding 3 MORE stamps at counter (Reaching 6/6!) ---');
  const stamp2Res = await fetch(`${BASE_URL}/api/stamp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      businessId: testBiz.id,
      phone: '7219487063',
      spendAmount: 300,
      stampAwarded: 3,
      source: 'counter'
    })
  });
  const stamp2Data = await stamp2Res.json();
  console.log('After 6 stamps total:', {
    stamps: stamp2Data.membership?.stamps,
    rewardUnlocked: stamp2Data.rewardUnlocked,
    expectedStamps: 6
  });

  console.log('\n--- 4. Checking /api/customer/session for live customer view ---');
  const sessionCheck = await fetch(`${BASE_URL}/api/customer/session?phone=7219487063`);
  const sessionCheckData = await sessionCheck.json();
  const updatedPass = sessionCheckData.passes?.find(p => p.slug === testBiz.slug);
  console.log('Customer Pass on Live Hub:', {
    stamps: updatedPass?.stamps,
    totalStamps: updatedPass?.totalStamps,
    isCompleted: updatedPass?.stamps >= updatedPass?.totalStamps
  });

  console.log('\n--- 5. Redeeming Reward via /api/reward/redeem ---');
  const redeemRes = await fetch(`${BASE_URL}/api/reward/redeem`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      membershipId: userPass.passId,
      businessId: testBiz.id,
      rewardDesc: 'Free Specialty Beverage (6/6 Complete)',
      verifiedBy: 'test_runner'
    })
  });
  const redeemData = await redeemRes.json();
  console.log('After redemption:', {
    claimSuccess: redeemData.success,
    membershipStamps: redeemData.membership?.stamps
  });

  console.log('\n--- 6. Awarding 6 stamps at once in 1 go! ---');
  const stamp6Res = await fetch(`${BASE_URL}/api/stamp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      businessId: testBiz.id,
      phone: '7219487063',
      spendAmount: 600,
      stampAwarded: 6,
      source: 'counter'
    })
  });
  const stamp6Data = await stamp6Res.json();
  console.log('After 6 stamps in 1 punch:', {
    stamps: stamp6Data.membership?.stamps,
    rewardUnlocked: stamp6Data.rewardUnlocked
  });
}

testStampLifecycle().catch(console.error);

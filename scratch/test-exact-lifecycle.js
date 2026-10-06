const BASE_URL = 'http://localhost:3000';

async function testExactLifecycle() {
  const bizRes = await fetch(`${BASE_URL}/api/businesses`);
  const bizData = await bizRes.json();
  const testBiz = bizData.businesses[0];

  console.log(`Testing with Business: ${testBiz.name} (${testBiz.id})`);

  // 1. Get current session
  let sessionRes = await fetch(`${BASE_URL}/api/customer/session?phone=7219487063`);
  let sessionData = await sessionRes.json();
  let pass = sessionData.passes?.find(p => p.slug === testBiz.slug);
  console.log('Current Pass before test:', { stamps: pass?.stamps, membershipId: pass?.membershipId, passId: pass?.passId });

  // 2. Redeem to reset stamps to 0
  console.log('\n--- Resetting to 0 stamps via Redeem ---');
  const redeem1 = await fetch(`${BASE_URL}/api/reward/redeem`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      membershipId: pass.membershipId || pass.passId,
      businessId: testBiz.id,
      rewardDesc: 'Test Reset',
      verifiedBy: 'tester'
    })
  });
  console.log('Redeem status:', (await redeem1.json()).success);

  // Check session
  sessionRes = await fetch(`${BASE_URL}/api/customer/session?phone=7219487063`);
  sessionData = await sessionRes.json();
  pass = sessionData.passes?.find(p => p.slug === testBiz.slug);
  console.log('Pass stamps after reset:', pass?.stamps);

  // 3. Award 3 stamps
  console.log('\n--- Awarding 3 stamps at counter ---');
  const stamp1 = await fetch(`${BASE_URL}/api/stamp`, {
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
  const stamp1Json = await stamp1.json();
  console.log('Stamps returned by /api/stamp:', stamp1Json.membership?.stamps);

  // Check session
  sessionRes = await fetch(`${BASE_URL}/api/customer/session?phone=7219487063`);
  sessionData = await sessionRes.json();
  pass = sessionData.passes?.find(p => p.slug === testBiz.slug);
  console.log('Live Pass stamps on /api/customer/session:', pass?.stamps);

  // 4. Award 3 MORE stamps (Total: 6/6!)
  console.log('\n--- Awarding 3 MORE stamps at counter (Reaching 6/6!) ---');
  const stamp2 = await fetch(`${BASE_URL}/api/stamp`, {
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
  const stamp2Json = await stamp2.json();
  console.log('Stamps returned by /api/stamp (should be 6!):', stamp2Json.membership?.stamps);
  console.log('Reward unlocked:', stamp2Json.rewardUnlocked);

  // Check session
  sessionRes = await fetch(`${BASE_URL}/api/customer/session?phone=7219487063`);
  sessionData = await sessionRes.json();
  pass = sessionData.passes?.find(p => p.slug === testBiz.slug);
  console.log('Live Pass stamps on /api/customer/session (should be 6!):', pass?.stamps);
  console.log('Is completed (6/6):', pass?.stamps === pass?.totalStamps);

  // 5. Redeem completed 6/6 pass
  console.log('\n--- Redeeming completed 6/6 pass ---');
  const redeem2 = await fetch(`${BASE_URL}/api/reward/redeem`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      membershipId: pass.membershipId || pass.passId,
      businessId: testBiz.id,
      rewardDesc: pass.rewardTitle,
      verifiedBy: 'counter_staff'
    })
  });
  const redeem2Json = await redeem2.json();
  console.log('Redeem result:', { success: redeem2Json.success, newStamps: redeem2Json.membership?.stamps });

  sessionRes = await fetch(`${BASE_URL}/api/customer/session?phone=7219487063`);
  sessionData = await sessionRes.json();
  pass = sessionData.passes?.find(p => p.slug === testBiz.slug);
  console.log('Pass stamps after claiming reward (should be 0 for next cycle):', pass?.stamps);

  // 6. Award 6 stamps at once in 1 go
  console.log('\n--- Awarding 6 stamps at once in 1 go ---');
  const stamp6 = await fetch(`${BASE_URL}/api/stamp`, {
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
  const stamp6Json = await stamp6.json();
  console.log('Stamps returned (should be 6):', stamp6Json.membership?.stamps);
  console.log('Reward unlocked:', stamp6Json.rewardUnlocked);
}

testExactLifecycle().catch(console.error);

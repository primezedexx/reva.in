const BASE_URL = 'http://localhost:3000';

async function run() {
  console.log('Testing full claim and customer flow...');

  // 1. Get businesses
  const bizRes = await fetch(`${BASE_URL}/api/businesses`);
  const bizData = await bizRes.json();
  const testBiz = bizData.businesses[0];

  // 2. Fetch customer session
  const sessionRes = await fetch(`${BASE_URL}/api/customer/session?phone=7219487063`);
  const sessionData = await sessionRes.json();
  const pass = sessionData.passes.find(p => p.slug === testBiz.slug);
  console.log('Pass status:', { slug: pass.slug, stamps: pass.stamps, totalStamps: pass.totalStamps });

  // 3. Redeem with business slug & passId
  const redeemRes = await fetch(`${BASE_URL}/api/reward/redeem`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      membershipId: pass.membershipId || pass.passId,
      businessId: pass.slug,
      rewardDesc: 'Free Specialty Beverage',
      verifiedBy: 'customer_claim'
    })
  });
  const redeemData = await redeemRes.json();
  console.log('Redeem with slug & passId response:', redeemData);

  // 4. Verify session stamps reset to 0
  const postSessionRes = await fetch(`${BASE_URL}/api/customer/session?phone=7219487063`);
  const postSessionData = await postSessionRes.json();
  const postPass = postSessionData.passes.find(p => p.slug === testBiz.slug);
  console.log('Post redeem stamps (should be 0):', postPass.stamps);

  if (postPass.stamps === 0) {
    console.log('SUCCESS: Redeem properly reset stamps to 0!');
  } else {
    console.error('FAILURE: Stamps not reset!');
    process.exit(1);
  }
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});

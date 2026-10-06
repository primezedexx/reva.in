// Test the full registration, onboarding save, and refresh flow against Next.js dev server
async function testFullFlow() {
  const baseUrl = 'http://localhost:3000';
  const testEmail = `refresh_test_${Date.now()}@whiskerscafe.com`;
  const testPass = 'revaSecret123!';
  const testStore = `Tokyo Cafe ${Date.now().toString().slice(-4)}`;

  console.log('1. Registering new merchant account via /api/auth/register...');
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
  console.log('Register status:', regRes.status);
  console.log('Registered business ID:', regData.business?.id);
  console.log('Initial is_setup_completed:', regData.business?.is_setup_completed);

  const bizId = regData.business.id;
  const ownerId = regData.user.id;

  console.log('\n2. Initial load before setup (Simulating opening /dashboard?setup=true&new=true)...');
  const initDashRes = await fetch(`${baseUrl}/api/dashboard?businessId=${bizId}&userId=${ownerId}`);
  const initDash = await initDashRes.json();
  const initBiz = initDash.metrics?.business;
  console.log('Init business name:', initBiz?.name);
  console.log('Init is_setup_completed:', initBiz?.is_setup_completed);

  console.log('\n3. User completes Business Setup Modal and clicks "Save & Launch"...');
  const patchRes = await fetch(`${baseUrl}/api/businesses/${bizId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: `${testStore} - Flagship`,
      category: 'Pet Cafe & Animals',
      city: 'Bangalore',
      brand_color: '#059669',
      is_setup_completed: true,
      reward_rule: {
        stamps_needed: 6,
        reward_title: 'Free Cat Cuddle Hour & Matcha',
        reward_desc: '1-Hour cat lounge pass + premium ceremonial matcha',
        min_order_for_stamp: 200,
        theme_config: {
          preset: 'cat_cafe',
          stamp_icon: 'paw',
          card_gradient: 'cat_pastel',
          page_bg_tone: 'soft_rose',
          card_bg_color: '#059669',
          is_setup_completed: true,
        },
      },
      theme_config: {
        preset: 'cat_cafe',
        stamp_icon: 'paw',
        card_gradient: 'cat_pastel',
        page_bg_tone: 'soft_rose',
        card_bg_color: '#059669',
        is_setup_completed: true,
      },
      min_order_for_stamp: 200,
      avg_spend_per_visit: 350,
      winback_offer_text: 'Free Cat Treat & Waffle with your next visit',
    }),
  });

  const patchData = await patchRes.json();
  console.log('PATCH status:', patchRes.status);
  console.log('PATCH response is_setup_completed:', patchData.business?.is_setup_completed);
  console.log('PATCH response theme_config is_setup_completed:', patchData.business?.theme_config?.is_setup_completed);

  console.log('\n4. Simulating BROWSER REFRESH (GET /api/dashboard with userId & businessId)...');
  const refreshDashRes = await fetch(`${baseUrl}/api/dashboard?businessId=${bizId}&userId=${ownerId}`);
  const refreshDash = await refreshDashRes.json();
  const refreshedBiz = (refreshDash.allBusinesses || []).find(b => b.id === bizId) || refreshDash.metrics?.business;

  console.log('Refreshed Business Name:', refreshedBiz?.name);
  console.log('Refreshed is_setup_completed:', refreshedBiz?.is_setup_completed);
  console.log('Refreshed theme_config is_setup_completed:', refreshedBiz?.theme_config?.is_setup_completed);
  console.log('Refreshed reward_rule theme_config is_setup_completed:', refreshedBiz?.reward_rule?.theme_config?.is_setup_completed);

  const isDoneAfterRefresh = Boolean(
    refreshedBiz?.is_setup_completed ||
    refreshedBiz?.theme_config?.is_setup_completed ||
    refreshedBiz?.reward_rule?.theme_config?.is_setup_completed
  );

  console.log('Evaluation of isSetupDone after refresh:', isDoneAfterRefresh);

  if (isDoneAfterRefresh === true) {
    console.log('\n🎉 SUCCESS! Store setup is permanently saved in Supabase and will NOT re-popup on page refresh!');
  } else {
    throw new Error('FAILED: isSetupDone evaluated to false after refresh!');
  }
}

testFullFlow().catch(e => {
  console.error('Test error:', e);
  process.exit(1);
});

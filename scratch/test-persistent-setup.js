const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envContent = fs.readFileSync('.env.local', 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const [k, ...v] = line.split('=');
  if (k && v) env[k.trim()] = v.join('=').trim().replace(/^['"]|['"]$/g, '');
});

const supabase = createClient(env['NEXT_PUBLIC_SUPABASE_URL'], env['SUPABASE_SERVICE_ROLE_KEY'] || env['NEXT_PUBLIC_SUPABASE_ANON_KEY']);

async function testPersistence() {
  console.log('--- Testing Setup Persistence ---');

  // 1. Check existing owner
  const { data: owner } = await supabase.from('owners').select('*').eq('id', '182ada8e-5923-401a-8f8e-dd56cfb11385').single();
  console.log('Owner found:', owner.name, 'business_id:', owner.business_id);

  // 2. Check business
  const { data: business } = await supabase.from('businesses').select('*').eq('id', owner.business_id).single();
  console.log('Business found:', business.name, 'is_setup_completed:', business.reward_rule?.is_setup_completed);
  console.log('Theme preset:', business.reward_rule?.theme_config?.preset, 'stamp_icon:', business.reward_rule?.theme_config?.stamp_icon);

  // 3. Test API simulation: getBusinessesByOwnerId
  const { data: allBiz } = await supabase.from('businesses').select('*').eq('owner_id', owner.id);
  console.log('Total businesses for this owner:', allBiz.length);
  allBiz.forEach((b, idx) => {
    console.log(`[${idx}]`, b.id, b.name, 'setup_done:', b.reward_rule?.is_setup_completed);
  });

  if (business.reward_rule?.is_setup_completed === true) {
    console.log('✓ PASS: Store setup is confirmed completed in Supabase DB!');
  } else {
    console.error('✗ FAIL: Store setup is NOT completed!');
  }
}

testPersistence();

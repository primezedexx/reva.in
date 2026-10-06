const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envContent = fs.readFileSync('.env.local', 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const [k, ...v] = line.split('=');
  if (k && v) env[k.trim()] = v.join('=').trim().replace(/^['"]|['"]$/g, '');
});

const supabase = createClient(env['NEXT_PUBLIC_SUPABASE_URL'], env['SUPABASE_SERVICE_ROLE_KEY'] || env['NEXT_PUBLIC_SUPABASE_ANON_KEY']);

async function testCleanInsertAndUpdate() {
  const testId = require('crypto').randomUUID();
  console.log('Testing clean insert for business:', testId);

  const rewardRule = {
    stamps_needed: 6,
    reward_title: 'Free Specialty Drink',
    reward_desc: 'Any handcrafted drink',
    min_order_for_stamp: 150,
    theme_config: {
      preset: 'cat_cafe',
      stamp_icon: 'paw',
      card_gradient: 'cat_pastel',
      page_bg_tone: 'soft_rose',
      card_bg_color: '#0F172A',
      is_setup_completed: false,
    },
    category: 'Cafe & Coffee Shop',
    city: 'Bangalore',
    plan: 'growth',
  };

  const dbRow = {
    id: testId,
    name: 'Whiskers Cat Cafe',
    slug: 'whiskers-cat-cafe-' + Date.now(),
    logo_url: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=200&auto=format&fit=crop&q=80',
    brand_color: '#0F172A',
    reward_rule: rewardRule,
    avg_spend_per_visit: 250.0,
    min_order_for_stamp: 150.0,
    winback_delay_multiplier: 1.5,
    winback_min_days: 5,
    winback_offer_text: 'Free treat with your visit',
    active_offers: [
      {
        id: 'off_1',
        title: 'Welcome Treat',
        stamps_needed: 3,
        badge: '3 Stamps Milestone',
        desc: 'Earned at 3 stamps',
        type: 'milestone',
        icon: 'flame',
        min_order: 150,
      },
      {
        id: 'off_2',
        title: 'Free Specialty Drink',
        stamps_needed: 6,
        badge: '6 Stamps Grand Reward',
        desc: 'Any handcrafted drink',
        type: 'milestone',
        icon: 'star',
        min_order: 150,
      },
    ],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const { data: inserted, error: insertError } = await supabase.from('businesses').insert([dbRow]).select().single();
  if (insertError) {
    console.error('Clean insert error:', insertError);
    return;
  }
  console.log('✓ Successfully inserted into Supabase businesses table! ID:', inserted.id);

  // Now test updating setup completed
  console.log('\nTesting updating setup completed to true...');
  const updatedRewardRule = {
    ...inserted.reward_rule,
    theme_config: {
      ...inserted.reward_rule.theme_config,
      is_setup_completed: true,
    }
  };

  const { data: updated, error: updateError } = await supabase
    .from('businesses')
    .update({
      reward_rule: updatedRewardRule,
      updated_at: new Date().toISOString()
    })
    .eq('id', testId)
    .select()
    .single();

  if (updateError) {
    console.error('Update error:', updateError);
    return;
  }
  console.log('✓ Successfully updated in Supabase businesses table!');
  console.log('Setup completed value in DB:', updated.reward_rule.theme_config.is_setup_completed);

  // Now test fetch by ID
  const { data: fetched, error: fetchError } = await supabase.from('businesses').select('*').eq('id', testId).single();
  console.log('Fetched from DB setup completed:', fetched.reward_rule.theme_config.is_setup_completed);

  // Clean up
  await supabase.from('businesses').delete().eq('id', testId);
  console.log('✓ Cleaned up test row');
}

testCleanInsertAndUpdate();

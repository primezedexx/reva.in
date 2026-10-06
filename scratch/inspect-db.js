const fs = require('fs');
const envContent = fs.readFileSync('.env.local', 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const [k, ...v] = line.split('=');
  if (k && v.length) env[k.trim()] = v.join('=').trim().replace(/^["']|["']$/g, '');
});
process.env.NEXT_PUBLIC_SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL;
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
process.env.SUPABASE_SERVICE_ROLE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;

const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function inspect() {
  const { data: businesses } = await supabase.from('businesses').select('id, name, slug, owner_id, created_at');
  console.log('Businesses:', JSON.stringify(businesses, null, 2));

  const { data: custs } = await supabase.from('customers').select('*');
  console.log('Customers:', JSON.stringify(custs, null, 2));

  const { data: mems } = await supabase.from('memberships').select('*');
  console.log('Memberships:', JSON.stringify(mems, null, 2));

  const { data: visits } = await supabase.from('visits').select('*');
  console.log('Visits:', JSON.stringify(visits, null, 2));

  const { data: logs } = await supabase.from('whatsapp_logs').select('*');
  console.log('WhatsApp Logs:', JSON.stringify(logs, null, 2));

  const { data: claims } = await supabase.from('rewards_claimed').select('*');
  console.log('Rewards Claimed:', JSON.stringify(claims, null, 2));
}

inspect().catch(console.error);

const fs = require('fs');
const envContent = fs.readFileSync('.env.local', 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const [k, ...v] = line.split('=');
  if (k && v.length) env[k.trim()] = v.join('=').trim().replace(/^["']|["']$/g, '');
});

const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function reset() {
  await supabase.from('visits').delete().eq('id', '75a1b593-07ff-43d0-b8a8-be12cca176f2');

  await supabase.from('memberships').update({
    stamps: 2,
    total_visits: 2,
    total_spend: 500,
  }).eq('id', 'd59c6292-177a-4c41-a983-6be3cf070d11');

  await supabase.from('whatsapp_logs').update({
    converted: false,
    converted_at: null,
    converted_visit_id: null,
    status: 'sent'
  }).eq('id', 'dbeeb8ec-f526-4433-aea5-b460c07b2a31');

  console.log('Reset completed successfully!');
}

reset();

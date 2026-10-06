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

async function setExact4() {
  const { data: visits } = await supabase
    .from('visits')
    .select('*')
    .eq('membership_id', '34b828ad-21ed-49e3-861b-8abf78c5c47c')
    .order('scanned_at', { ascending: false });

  console.log('Current visits:', visits);

  // If there are 4 visits with 5 stamps, delete the extra test visit from task-166
  if (visits && visits.length > 3) {
    const latest = visits[0];
    console.log('Deleting test visit:', latest.id);
    await supabase.from('visits').delete().eq('id', latest.id);
  }

  await supabase.from('memberships').update({
    stamps: 4,
    total_visits: 3
  }).eq('id', '34b828ad-21ed-49e3-861b-8abf78c5c47c');

  console.log('Set Bheem Pujari to exactly 4 stamps.');
}

setExact4().catch(console.error);

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

async function checkAllBiz() {
  const { data: businesses } = await supabase.from('businesses').select('*');
  for (const b of businesses) {
    const { data: mems } = await supabase.from('memberships').select('*, customer:customers(*)').eq('business_id', b.id);
    const { data: visits } = await supabase.from('visits').select('*').eq('business_id', b.id);
    console.log('Business:', b.name, 'id:', b.id);
    console.log('  Memberships:', mems.map(m => ({ id: m.id, name: m.customer?.name, stamps: m.stamps, total_visits: m.total_visits })));
    console.log('  Visits count:', visits.length, 'total stamps in visits:', visits.reduce((s, v) => s + (v.stamp_awarded || 1), 0));
    console.log('  Visits details:', visits.map(v => ({ id: v.id, stamps: v.stamp_awarded, note: v.staff_note, at: v.scanned_at })));
  }
}

checkAllBiz().catch(console.error);

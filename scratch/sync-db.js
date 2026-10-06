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

async function syncDb() {
  console.log('=== Checking and Syncing Database Records ===');
  
  // 1. Get all memberships
  const { data: mems } = await supabase.from('memberships').select('*, customer:customers(*)');
  console.log('Found memberships:', mems?.length);

  for (const m of mems) {
    const { data: visits } = await supabase.from('visits').select('*').eq('membership_id', m.id);
    const totalVisitStamps = visits.reduce((sum, v) => sum + (Number(v.stamp_awarded) || 1), 0);
    console.log(`Member ${m.customer?.name || m.id}: current stamps = ${m.stamps}, total visits in db = ${visits.length}, total stamps in visits = ${totalVisitStamps}`);

    if (m.stamps > totalVisitStamps) {
      const diff = m.stamps - totalVisitStamps;
      console.log(`-> Discrepancy detected: ${diff} stamps missing in visits table. Inserting backfill visit...`);
      const { data: inserted, error } = await supabase.from('visits').insert({
        membership_id: m.id,
        business_id: m.business_id,
        spend_amount: 500,
        stamp_awarded: diff,
        staff_note: `Counter Staff Awarded +${diff} stamp(s)`,
        scanned_at: m.last_visit_at || new Date().toISOString()
      }).select().single();
      console.log('Inserted visit:', inserted, 'error:', error);
    }

    // Ensure total_visits matches actual count
    const { data: updatedVisits } = await supabase.from('visits').select('*').eq('membership_id', m.id);
    const actualVisitCount = updatedVisits ? updatedVisits.length : 1;
    if (m.total_visits !== actualVisitCount && m.total_visits > actualVisitCount + 5) {
      console.log(`-> Correcting total_visits on membership from ${m.total_visits} to ${actualVisitCount}...`);
      await supabase.from('memberships').update({
        total_visits: actualVisitCount
      }).eq('id', m.id);
    }
  }

  console.log('=== Sync Completed ===');
}

syncDb().catch(console.error);

const { createClient } = require('@supabase/supabase-js');

const supabaseAdmin = createClient(
  'https://dxhugymwqmqzhnpwodab.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR4aHVneW13cW1xemhucHdvZGFiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MDQyNzI1MCwiZXhwIjoyMTA2MDAzMjUwfQ.NzIgDZMe4NUMWGW5RGtMrMKMWNKWfiROEymDOHsvgkQ'
);

async function cleanTestVisits() {
  const bizId = 'dbc4856f-dbba-4ab9-8f2f-fd5ba355ac52'; // Bheem Pujari's Cafe
  
  // 1. Delete all automated test visits (where staff_note is "Counter Staff Verified Stamp" or test loops)
  const { data: testVisits, error: vErr } = await supabaseAdmin
    .from('visits')
    .delete()
    .eq('business_id', bizId)
    .eq('staff_note', 'Counter Staff Verified Stamp');

  console.log('Deleted automated test visits:', testVisits, vErr);

  // 2. Also let's inspect the remaining visits
  const { data: remainingVisits } = await supabaseAdmin
    .from('visits')
    .select('*')
    .eq('business_id', bizId)
    .order('scanned_at', { ascending: false });

  console.log('Remaining visits in DB for Bheem Pujari:', remainingVisits);

  // 3. Recalculate total_spend and total_visits on membership
  const { data: mems } = await supabaseAdmin
    .from('memberships')
    .select('*')
    .eq('business_id', bizId);

  for (const m of (mems || [])) {
    const memVisits = (remainingVisits || []).filter(v => v.membership_id === m.id);
    const totalSpend = memVisits.reduce((s, v) => s + (Number(v.spend_amount) || 0), 0);
    const totalVisits = memVisits.length;
    const currentStamps = memVisits.reduce((s, v) => s + (Number(v.stamp_awarded) || 1), 0) % 6; // cycle remainder

    await supabaseAdmin
      .from('memberships')
      .update({
        total_spend: totalSpend,
        total_visits: totalVisits || 1,
        stamps: currentStamps,
      })
      .eq('id', m.id);

    console.log(`Updated membership ${m.id}: stamps=${currentStamps}, total_visits=${totalVisits}, total_spend=${totalSpend}`);
  }
}

cleanTestVisits().catch(console.error);

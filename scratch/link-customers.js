const fs = require('fs');
const envContent = fs.readFileSync('.env.local', 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const [k, ...v] = line.split('=');
  if (k && v.length) env[k.trim()] = v.join('=').trim().replace(/^["']|["']$/g, '');
});

const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function linkAll() {
  const bizId = 'dbc4856f-dbba-4ab9-8f2f-fd5ba355ac52';
  const { data: custs } = await supabase.from('customers').select('*');
  console.log('Total customers:', custs ? custs.length : 0);

  for (const c of custs || []) {
    const { data: existing } = await supabase
      .from('memberships')
      .select('*')
      .eq('business_id', bizId)
      .eq('customer_id', c.id)
      .maybeSingle();

    if (!existing) {
      console.log('Creating membership for:', c.name, c.phone);
      const daysAgo = c.phone.includes('saurabh') ? 1 : 6;
      const stamps = c.phone.includes('saurabh') ? 3 : 1;
      const visits = c.phone.includes('saurabh') ? 4 : 2;
      const spend = c.phone.includes('saurabh') ? 1100 : 450;
      const isAtRisk = daysAgo >= 5;

      const { data: newMem, error } = await supabase.from('memberships').insert({
        customer_id: c.id,
        business_id: bizId,
        stamps: stamps,
        tier: 'Regular',
        total_visits: visits,
        total_spend: spend,
        last_visit_at: new Date(Date.now() - daysAgo * 86400000).toISOString(),
        avg_visit_gap_days: 3.5,
      }).select().single();

      if (error) {
        console.error('Error inserting membership:', error);
      } else if (newMem) {
        console.log('Created membership:', newMem.id);
        // Also insert a visit
        await supabase.from('visits').insert({
          membership_id: newMem.id,
          business_id: bizId,
          scanned_at: new Date(Date.now() - daysAgo * 86400000).toISOString(),
          staff_note: 'Counter Staff Awarded Stamp',
          spend_amount: 250,
          stamp_awarded: 1,
        });
      }
    } else {
      console.log('Membership exists for:', c.name, 'Stamps:', existing.stamps);
    }
  }
}

linkAll().then(() => console.log('Finished!')).catch(console.error);

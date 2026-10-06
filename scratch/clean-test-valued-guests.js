const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envFile = fs.readFileSync('.env.local', 'utf8');
const env = {};
envFile.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) {
    let val = match[2].trim();
    if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
    env[match[1].trim()] = val;
  }
});

const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function cleanTestGuests() {
  console.log('--- Current Customers ---');
  const { data: custs } = await sb.from('customers').select('*');
  console.log(custs);

  // Find the two localhost test customers
  const testPhones = ['primezedexx.ai@gmail.com', '1234567890'];
  const testCusts = (custs || []).filter(c => testPhones.includes(c.phone) || testPhones.includes(c.name));
  console.log('Target test customers to remove:', testCusts);

  for (const c of testCusts) {
    console.log(`Cleaning up customer ${c.name} (${c.phone}, id: ${c.id})...`);
    
    // Find memberships
    const { data: mems } = await sb.from('memberships').select('id').eq('customer_id', c.id);
    for (const m of mems || []) {
      console.log(`Deleting visits for membership ${m.id}...`);
      await sb.from('visits').delete().eq('membership_id', m.id);
      console.log(`Deleting whatsapp_logs for membership ${m.id}...`);
      await sb.from('whatsapp_logs').delete().eq('membership_id', m.id);
      console.log(`Deleting rewards_claimed for membership ${m.id}...`);
      await sb.from('rewards_claimed').delete().eq('membership_id', m.id);
      console.log(`Deleting membership ${m.id}...`);
      await sb.from('memberships').delete().eq('id', m.id);
    }

    // Delete customer
    const { error: custErr } = await sb.from('customers').delete().eq('id', c.id);
    if (custErr) {
      console.error(`Error deleting customer ${c.id}:`, custErr);
    } else {
      console.log(`Successfully deleted customer ${c.name} (${c.phone})`);
    }
  }

  console.log('--- Remaining Memberships ---');
  const { data: remainingMems } = await sb.from('memberships').select('*, customer:customers(name, phone), business:businesses(name, slug)');
  console.log(JSON.stringify(remainingMems, null, 2));
}

cleanTestGuests().catch(console.error);

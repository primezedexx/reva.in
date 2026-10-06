const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envFile = fs.readFileSync('.env.local', 'utf8');
const env = {};
envFile.split('\n').forEach(line => {
  const parts = line.split('=');
  if (parts.length >= 2) {
    const key = parts[0].trim();
    const val = parts.slice(1).join('=').trim().replace(/^["']|["']$/g, '');
    env[key] = val;
  }
});

const supabase = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY
);

async function testSync() {
  console.log('Testing customer lookup and sync for email: primezedexx.ai@gmail.com');
  
  // Find all customers matching email or matching name
  const { data: allCust } = await supabase.from('customers').select('*');
  console.log('All customers in DB:', allCust);

  const googleEmail = 'primezedexx.ai@gmail.com';
  const matching = allCust.filter(c => 
    c.phone?.toLowerCase() === googleEmail.toLowerCase() ||
    c.name?.toLowerCase().includes('bheem')
  );
  console.log('Matching customer records:', matching);

  // Find all memberships for these customer IDs
  const custIds = matching.map(c => c.id);
  const { data: mems } = await supabase.from('memberships').select('*, business:businesses(*)').in('customer_id', custIds);
  console.log('Found memberships:', mems.map(m => ({ id: m.id, customer_id: m.customer_id, business_name: m.business?.name, stamps: m.stamps })));
}

testSync();

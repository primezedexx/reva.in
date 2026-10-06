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

async function checkCustomers() {
  const { data: customers } = await supabase.from('customers').select('*');
  console.log('Customers in DB:', JSON.stringify(customers, null, 2));

  const { data: memberships } = await supabase.from('memberships').select('id, business_id, customer_id, stamps, total_visits');
  console.log('Memberships in DB:', JSON.stringify(memberships, null, 2));
}

checkCustomers();

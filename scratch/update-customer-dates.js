const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envContent = fs.readFileSync('.env.local', 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const [k, ...v] = line.split('=');
  if (k && v) env[k.trim()] = v.join('=').trim().replace(/^['"]|['"]$/g, '');
});

const supabase = createClient(env['NEXT_PUBLIC_SUPABASE_URL'], env['SUPABASE_SERVICE_ROLE_KEY'] || env['NEXT_PUBLIC_SUPABASE_ANON_KEY']);

async function updateCustomerDates() {
  const todayIso = new Date().toISOString();
  console.log('Updating test customers created_at to today:', todayIso);

  // Update customer 7219487063
  const { data: c1, error: e1 } = await supabase
    .from('customers')
    .update({ created_at: todayIso })
    .eq('phone', '7219487063')
    .select();
  console.log('Updated 7219487063:', c1, 'error:', e1);

  // Update customer primezedexx.ai@gmail.com
  const { data: c2, error: e2 } = await supabase
    .from('customers')
    .update({ created_at: todayIso })
    .eq('phone', 'primezedexx.ai@gmail.com')
    .select();
  console.log('Updated primezedexx:', c2, 'error:', e2);

  const { data: allC } = await supabase.from('customers').select('*');
  console.log('All customers now:', allC);
}

updateCustomerDates();

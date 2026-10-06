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

async function run() {
  const { data: biz } = await sb.from('businesses').select('id, name, slug, owner_id');
  console.log('BUSINESSES count:', biz ? biz.length : 0);
  console.log(biz);
  
  const { data: cust } = await sb.from('customers').select('*');
  console.log('CUSTOMERS count:', cust ? cust.length : 0);
  console.log(cust);

  const { data: mem } = await sb.from('memberships').select('*, customer:customers(*), business:businesses(name, slug)');
  console.log('MEMBERSHIPS count:', mem ? mem.length : 0);
  console.log(JSON.stringify(mem, null, 2));
}

run().catch(console.error);

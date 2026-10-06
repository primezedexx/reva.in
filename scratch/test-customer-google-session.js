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

async function testCustomerGoogle() {
  const { db } = require('../src/lib/db');
  
  console.log('--- Testing Customer Google Auth & Session Resolution ---');
  const googleEmail = 'testcustomer.reva@gmail.com';
  const customer = await db.createOrGetCustomer(googleEmail, 'Test Customer', undefined, {
    email: googleEmail,
    auth_provider: 'google',
    registered_at: new Date().toISOString()
  });

  console.log('Created Customer:', {
    id: customer.id,
    name: customer.name,
    email: customer.email,
    phone: customer.phone,
    auth_provider: customer.auth_provider
  });

  const isRealPhone = customer.phone && !customer.phone.includes('@') && customer.phone.replace(/\D/g, '').length >= 10;
  const realEmail = customer.email || (customer.phone && customer.phone.includes('@') ? customer.phone : googleEmail);

  console.log('\nResolved for Profile Tab:');
  console.log('Mobile Number:', isRealPhone ? customer.phone : 'Not linked yet');
  console.log('Mobile Status:', isRealPhone ? 'Linked' : '+ Add Phone');
  console.log('Email Address:', realEmail);
  console.log('Email Status:', realEmail ? 'Verified' : '+ Link Email');
}

testCustomerGoogle().catch(console.error);

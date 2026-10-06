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

const supabaseAdmin = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY
);

async function simulateCustomerSessionGet(email, phone, userId, name) {
  const cleanPhone = phone && phone !== '+91 98765 43210' && phone !== '9876543210' ? phone.trim() : '';
  const cleanEmail = email && !email.includes('owner') ? email.trim().toLowerCase() : '';
  const cleanName = name && name !== 'Valued Guest' && name !== 'Aarav Sharma' ? name.trim() : '';

  console.log('Query inputs:', { cleanPhone, cleanEmail, userId, cleanName });

  const orClauses = [];
  if (cleanPhone) {
    const digits = cleanPhone.replace(/\D/g, '');
    const last10 = digits.slice(-10);
    orClauses.push(`phone.eq.${cleanPhone}`);
    if (last10.length >= 7) {
      orClauses.push(`phone.ilike.%${last10}`);
    }
  }
  if (cleanEmail) {
    orClauses.push(`phone.ilike.${cleanEmail}`);
  }
  if (userId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId)) {
    orClauses.push(`id.eq.${userId}`);
  }
  if (cleanName && cleanName.length >= 3) {
    orClauses.push(`name.ilike.${cleanName}`);
  }

  let foundCustomers = [];
  if (orClauses.length > 0) {
    const { data, error } = await supabaseAdmin.from('customers').select('*').or(orClauses.join(','));
    if (!error && data) {
      foundCustomers = data;
    }
  }

  console.log('Found customer rows:', foundCustomers);

  const matchedCustomerIds = foundCustomers.map(c => c.id);
  if (matchedCustomerIds.length === 0) {
    return { passes: [], customer: null };
  }

  const { data: memberships } = await supabaseAdmin
    .from('memberships')
    .select('*, customer:customers(*), business:businesses(*)')
    .in('customer_id', matchedCustomerIds);

  console.log('Found memberships count:', memberships?.length);
  console.log('Memberships:', memberships?.map(m => ({ id: m.id, bus: m.business?.name, stamps: m.stamps })));

  // Extract best phone and name
  const realPhoneCustomer = foundCustomers.find(c => c.phone && !c.phone.includes('@') && c.phone.replace(/\D/g, '').length >= 10);
  const effectivePhone = realPhoneCustomer?.phone || cleanPhone || '';
  const effectiveName = foundCustomers.find(c => c.name && c.name !== 'Valued Guest')?.name || cleanName || 'Valued Guest';

  return {
    effectivePhone,
    effectiveName,
    membershipsCount: memberships?.length || 0
  };
}

async function run() {
  console.log('--- Test 1: Phone Device logs in with only Google Email (primezedexx.ai@gmail.com) and Name (Bheem Pujari) ---');
  const res1 = await simulateCustomerSessionGet('primezedexx.ai@gmail.com', null, null, 'Bheem Pujari');
  console.log('Result for Phone device:', res1);
}

run();

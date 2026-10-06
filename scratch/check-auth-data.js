// ============================================================================
// REVA (reva.in) — Verification Script: Inspect Stored Auth Credentials & Stores
// ============================================================================

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://dxhugymwqmqzhnpwodab.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR4aHVneW13cW1xemhucHdvZGFiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MDQyNzI1MCwiZXhwIjoyMTA2MDAzMjUwfQ.NzIgDZMe4NUMWGW5RGtMrMKMWNKWfiROEymDOHsvgkQ';

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function checkAuthData() {
  console.log('--- 1. SUPABASE AUTH USERS (auth.users) ---');
  const { data: usersData, error: userError } = await supabaseAdmin.auth.admin.listUsers();
  if (userError) {
    console.error('Error listing auth users:', userError);
  } else {
    console.log(`Total Auth Users in Supabase: ${usersData.users.length}`);
    usersData.users.forEach((u, i) => {
      console.log(`[User ${i + 1}] ID: ${u.id}`);
      console.log(`  Email: ${u.email}`);
      console.log(`  Provider: ${u.app_metadata?.provider || 'email'}`);
      console.log(`  Providers List: ${JSON.stringify(u.app_metadata?.providers || [])}`);
      console.log(`  Last Sign In: ${u.last_sign_in_at}`);
      console.log(`  Created At: ${u.created_at}`);
      console.log(`  Metadata: ${JSON.stringify(u.user_metadata || {})}`);
      console.log('----------------------------------------------------');
    });
  }

  console.log('\n--- 2. PUBLIC OWNERS TABLE (public.owners) ---');
  const { data: ownersData, error: ownerError } = await supabaseAdmin.from('owners').select('*');
  if (ownerError) {
    console.error('Error fetching owners:', ownerError);
  } else {
    console.log(`Total Owners in Database: ${ownersData.length}`);
    ownersData.forEach((o, i) => {
      console.log(`[Owner ${i + 1}] ID: ${o.id}`);
      console.log(`  Name: ${o.name}`);
      console.log(`  Email: ${o.email}`);
      console.log(`  Role: ${o.role}`);
      console.log(`  Business ID: ${o.business_id}`);
      console.log('----------------------------------------------------');
    });
  }

  console.log('\n--- 3. PUBLIC BUSINESSES TABLE (public.businesses) ---');
  const { data: businessesData, error: busError } = await supabaseAdmin.from('businesses').select('*');
  if (busError) {
    console.error('Error fetching businesses:', busError);
  } else {
    console.log(`Total Businesses in Database: ${businessesData.length}`);
    businessesData.forEach((b, i) => {
      console.log(`[Business ${i + 1}] ID: ${b.id}`);
      console.log(`  Name: ${b.name}`);
      console.log(`  Slug: ${b.slug}`);
      console.log(`  Owner ID: ${b.owner_id}`);
      console.log(`  Stamps Needed: ${b.reward_rule?.stamps_needed}`);
      console.log(`  Reward: ${b.reward_rule?.reward_title}`);
      console.log('----------------------------------------------------');
    });
  }
}

checkAuthData().catch(err => {
  console.error('Check failed:', err);
});

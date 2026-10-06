const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://dxhugymwqmqzhnpwodab.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR4aHVneW13cW1xemhucHdvZGFiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MDQyNzI1MCwiZXhwIjoyMTA2MDAzMjUwfQ.NzIgDZMe4NUMWGW5RGtMrMKMWNKWfiROEymDOHsvgkQ';

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

async function inspectCustomers() {
  console.log('--- Querying Customers Table in Supabase ---');
  const { data: customers, error } = await supabaseAdmin.from('customers').select('*');
  if (error) {
    console.error('Error fetching customers:', error);
  } else {
    console.log(`Found ${customers.length} customers:`);
    customers.forEach(c => {
      console.log(`ID: ${c.id} | Name: ${c.name} | Phone: ${c.phone} | Email: ${c.email} | AuthUserId: ${c.auth_user_id} | Created: ${c.created_at} | Registered: ${c.registered_at}`);
    });
  }

  console.log('\n--- Querying Supabase Auth Users ---');
  const { data: authUsers, error: authError } = await supabaseAdmin.auth.admin.listUsers();
  if (authError) {
    console.error('Error fetching auth users:', authError);
  } else {
    console.log(`Found ${authUsers.users.length} auth users:`);
    authUsers.users.forEach(u => {
      console.log(`ID: ${u.id} | Email: ${u.email} | Name: ${u.user_metadata?.full_name || u.user_metadata?.name} | CreatedAt: ${u.created_at} | MetaRegisteredAt: ${u.user_metadata?.customer_registered_at}`);
    });
  }
}

inspectCustomers();

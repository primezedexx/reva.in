const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://dxhugymwqmqzhnpwodab.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR4aHVneW13cW1xemhucHdvZGFiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MDQyNzI1MCwiZXhwIjoyMTA2MDAzMjUwfQ.NzIgDZMe4NUMWGW5RGtMrMKMWNKWfiROEymDOHsvgkQ';

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

async function checkAllTables() {
  const tables = ['businesses', 'customers', 'memberships', 'visits', 'rewards', 'owners', 'campaigns'];
  for (const t of tables) {
    const { data, error } = await supabaseAdmin.from(t).select('*').limit(1);
    if (error) {
      console.log(`Table ${t}: Error - ${error.message}`);
    } else if (data && data.length > 0) {
      console.log(`Table ${t} columns:`, Object.keys(data[0]));
    } else {
      console.log(`Table ${t}: (empty)`);
    }
  }
}

checkAllTables();

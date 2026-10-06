const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://dxhugymwqmqzhnpwodab.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR4aHVneW13cW1xemhucHdvZGFiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MDQyNzI1MCwiZXhwIjoyMTA2MDAzMjUwfQ.NzIgDZMe4NUMWGW5RGtMrMKMWNKWfiROEymDOHsvgkQ';

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

async function checkColumns() {
  const { data, error } = await supabaseAdmin.from('customers').select('*').limit(1);
  if (error) {
    console.error('Error:', error);
  } else if (data && data.length > 0) {
    console.log('Customer columns:', Object.keys(data[0]));
  }
}

checkColumns();

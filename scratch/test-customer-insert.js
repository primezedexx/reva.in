const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://dxhugymwqmqzhnpwodab.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR4aHVneW13cW1xemhucHdvZGFiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MDQyNzI1MCwiZXhwIjoyMTA2MDAzMjUwfQ.NzIgDZMe4NUMWGW5RGtMrMKMWNKWfiROEymDOHsvgkQ';

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

async function testInsert() {
  const testCustomer = {
    phone: 'primezedexx.ai@gmail.com',
    name: 'Bheem Pujari',
    created_at: '2026-09-26T14:50:59.848Z',
  };

  const { data, error } = await supabaseAdmin.from('customers').insert([testCustomer]).select().single();
  console.log('Insert with valid schema columns:', { data, error });
}

testInsert();

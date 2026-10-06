const { createClient } = require('@supabase/supabase-js');

const supabaseAdmin = createClient(
  'https://dxhugymwqmqzhnpwodab.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR4aHVneW13cW1xemhucHdvZGFiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MDQyNzI1MCwiZXhwIjoyMTA2MDAzMjUwfQ.NzIgDZMe4NUMWGW5RGtMrMKMWNKWfiROEymDOHsvgkQ'
);

async function inspectVisits() {
  const { data: businesses } = await supabaseAdmin.from('businesses').select('*');
  console.log('Businesses:', businesses?.map(b => ({ id: b.id, name: b.name, slug: b.slug })));
  
  const testBiz = businesses[0];
  const { data: visits } = await supabaseAdmin
    .from('visits')
    .select('*')
    .eq('business_id', testBiz.id)
    .order('scanned_at', { ascending: false });

  console.log('Total visits in Supabase for', testBiz.name, ':', visits?.length);
  console.log('Visits breakdown:');
  visits.forEach((v, i) => {
    console.log(`${i + 1}. [${v.scanned_at}] stamps: ${v.stamp_awarded}, spend: ₹${v.spend_amount}, note: "${v.staff_note}"`);
  });
}

inspectVisits().catch(console.error);

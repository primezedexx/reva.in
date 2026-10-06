const { createClient } = require('@supabase/supabase-js');

const supabaseAdmin = createClient(
  'https://dxhugymwqmqzhnpwodab.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR4aHVneW13cW1xemhucHdvZGFiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MDQyNzI1MCwiZXhwIjoyMTA2MDAzMjUwfQ.NzIgDZMe4NUMWGW5RGtMrMKMWNKWfiROEymDOHsvgkQ'
);

async function setCleanState() {
  const bizId = 'dbc4856f-dbba-4ab9-8f2f-fd5ba355ac52'; // Bheem Pujari's Cafe
  const memId = '34b828ad-21ed-49e3-861b-8abf78c5c47c';

  // Clear all old test visits for this business
  await supabaseAdmin.from('visits').delete().eq('business_id', bizId);

  const now = new Date();
  const time1 = new Date(now.getTime() - 40 * 60 * 1000).toISOString(); // 40 mins ago: 1 QR Scan
  const time2 = new Date(now.getTime() - 20 * 60 * 1000).toISOString(); // 20 mins ago: 1 Counter Visit (WhatsApp conversion)

  // Insert 1 real QR Scan
  const { data: v1 } = await supabaseAdmin
    .from('visits')
    .insert({
      membership_id: memId,
      business_id: bizId,
      scanned_at: time1,
      staff_note: 'Customer Counter QR Scan',
      spend_amount: 250,
      stamp_awarded: 1
    })
    .select()
    .single();

  // Insert 1 Counter Visit
  const { data: v2 } = await supabaseAdmin
    .from('visits')
    .insert({
      membership_id: memId,
      business_id: bizId,
      scanned_at: time2,
      staff_note: 'Counter Staff Awarded +1 stamp(s)',
      spend_amount: 1000,
      stamp_awarded: 1
    })
    .select()
    .single();

  // Update membership
  await supabaseAdmin
    .from('memberships')
    .update({
      stamps: 2,
      total_visits: 2,
      total_spend: 1250,
      last_visit_at: time2,
      last_qr_stamp_at: time1
    })
    .eq('id', memId);

  // Update whatsapp log to link with v2 (spend ₹1,000)
  const sentTime = new Date(now.getTime() - 60 * 60 * 1000).toISOString();
  const { data: existingLogs } = await supabaseAdmin
    .from('whatsapp_logs')
    .select('*')
    .eq('business_id', bizId);

  if (existingLogs && existingLogs.length > 0) {
    await supabaseAdmin
      .from('whatsapp_logs')
      .update({
        sent_at: sentTime,
        converted: true,
        converted_at: time2,
        converted_visit_id: v2.id,
        status: 'read'
      })
      .eq('id', existingLogs[0].id);
  }

  console.log('Clean state established successfully:');
  console.log('Visit 1 (QR Scan):', v1);
  console.log('Visit 2 (Counter Stamp / WhatsApp Return):', v2);
}

setCleanState().catch(console.error);

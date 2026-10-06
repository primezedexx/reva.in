const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envContent = fs.readFileSync('.env.local', 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const [k, ...v] = line.split('=');
  if (k && v) env[k.trim()] = v.join('=').trim().replace(/^['"]|['"]$/g, '');
});

const supabase = createClient(env['NEXT_PUBLIC_SUPABASE_URL'], env['SUPABASE_SERVICE_ROLE_KEY'] || env['NEXT_PUBLIC_SUPABASE_ANON_KEY']);

async function cleanup() {
  // Delete the orphan un-setup duplicate 'My Cafe & Roastery'
  const { data, error } = await supabase
    .from('businesses')
    .delete()
    .eq('id', '247e4091-2d8b-4f35-88a5-f369c444da47')
    .select();

  console.log('Cleaned up orphan business:', data, 'error:', error);

  // Verify remaining businesses
  const { data: businesses } = await supabase.from('businesses').select('*');
  console.log('Remaining businesses:', businesses?.map(b => ({ id: b.id, name: b.name, is_setup_completed: b.reward_rule?.is_setup_completed })));
}

cleanup();

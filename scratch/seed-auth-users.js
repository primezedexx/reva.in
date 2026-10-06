// ============================================================================
// REVA (reva.in) — Seed Supabase Auth Users for Demo Owners
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

async function seedAuthUsers() {
  console.log('Seeding Supabase Auth users for default demo stores...');

  const accounts = [
    {
      email: 'owner@bobabrew.com',
      password: 'reva2026',
      name: 'Boba & Brew Owner',
      business_id: '11111111-1111-1111-1111-111111111111',
    },
    {
      email: 'owner@crustcrumb.com',
      password: 'reva2026',
      name: 'Crust & Crumb Owner',
      business_id: '22222222-2222-2222-2222-222222222222',
    },
  ];

  for (const acc of accounts) {
    console.log(`\nCreating/Updating auth user: ${acc.email}...`);

    // 1. Check if user already exists
    const { data: usersData, error: listError } = await supabaseAdmin.auth.admin.listUsers();
    let existingUser = null;
    if (!listError && usersData?.users) {
      existingUser = usersData.users.find(u => u.email?.toLowerCase() === acc.email.toLowerCase());
    }

    let userId = existingUser?.id;

    if (!existingUser) {
      const { data: createData, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email: acc.email,
        password: acc.password,
        email_confirm: true,
        user_metadata: {
          name: acc.name,
          business_id: acc.business_id,
        },
      });

      if (createError) {
        console.error(`Error creating ${acc.email}:`, createError);
        continue;
      }
      userId = createData.user.id;
      console.log(`✓ Created user in Supabase Auth (ID: ${userId})`);
    } else {
      // Update password so 'reva2026' is 100% active
      const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(userId, {
        password: acc.password,
        email_confirm: true,
      });
      if (updateError) {
        console.error(`Error updating password for ${acc.email}:`, updateError);
      } else {
        console.log(`✓ Password updated to 'reva2026' for existing user (ID: ${userId})`);
      }
    }

    // 2. Ensure owner record exists in public.owners
    if (userId) {
      // Check if owner profile exists
      const { data: ownerData } = await supabaseAdmin.from('owners').select('*').eq('id', userId).maybeSingle();
      if (!ownerData) {
        const { error: ownerInsertError } = await supabaseAdmin.from('owners').insert([
          {
            id: userId,
            business_id: acc.business_id,
            name: acc.name,
            email: acc.email,
            role: 'owner',
          },
        ]);
        if (ownerInsertError) {
          console.error(`Error inserting owner ${acc.email}:`, ownerInsertError);
        } else {
          console.log(`✓ Created owner record in public.owners linked to business ${acc.business_id}`);
        }
      } else {
        console.log(`✓ Owner record already exists in public.owners`);
      }

      // Update business owner_id in public.businesses
      await supabaseAdmin.from('businesses').update({ owner_id: userId }).eq('id', acc.business_id);
    }
  }

  console.log('\n✓ SEEDING COMPLETED SUCCESSFULLY!');
}

seedAuthUsers().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});

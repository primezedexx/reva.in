const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://dxhugymwqmqzhnpwodab.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR4aHVneW13cW1xemhucHdvZGFiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA0MjcyNTAsImV4cCI6MjEwNjAwMzI1MH0.BRuzw_fXeyaiQy2sOAeIUK5J8TlbHlEdfqAjFElpHFk';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testSignIn() {
  console.log('Testing signInWithPassword for owner@bobabrew.com...');
  const { data, error } = await supabase.auth.signInWithPassword({
    email: 'owner@bobabrew.com',
    password: 'reva2026',
  });

  if (error) {
    console.error('Sign-in error:', error);
    process.exit(1);
  }

  console.log('✓ Successfully signed in!');
  console.log('User ID:', data.user.id);
  console.log('User Email:', data.user.email);
  console.log('Session Access Token exists:', !!data.session.access_token);
}

testSignIn();

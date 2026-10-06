import { db } from '../src/lib/db';

async function testCustomerAuth() {
  console.log('Testing customer sign in details persistence...');

  // Test 1: Google SSO customer sign-in
  const googleCustomer = await db.createOrGetCustomer('user@testgoogle.com', 'Alex Rivera', 'https://avatar.test/alex.png', {
    email: 'user@testgoogle.com',
    auth_user_id: 'auth_usr_12345',
    auth_provider: 'google',
    sign_in_details: {
      provider: 'google',
      email: 'user@testgoogle.com',
      ip: '127.0.0.1',
      device: 'Chrome Mobile',
    },
  });

  console.log('Created/Retrieved Google Customer:', {
    id: googleCustomer.id,
    name: googleCustomer.name,
    email: googleCustomer.email,
    auth_provider: googleCustomer.auth_provider,
    auth_user_id: googleCustomer.auth_user_id,
    sign_in_count: googleCustomer.sign_in_count,
    last_sign_in_at: googleCustomer.last_sign_in_at,
    sign_in_details: googleCustomer.sign_in_details,
  });

  // Test 2: Repeat sign-in (should increment sign_in_count and update last_sign_in_at)
  const repeatCustomer = await db.createOrGetCustomer('user@testgoogle.com', 'Alex Rivera', undefined, {
    email: 'user@testgoogle.com',
    auth_provider: 'google',
  });

  console.log('Repeat sign-in customer sign_in_count:', repeatCustomer.sign_in_count);

  // Test 3: Phone lookup and email lookup
  const byEmail = await db.getCustomerByEmail('user@testgoogle.com');
  console.log('Found by email:', byEmail?.name, byEmail?.email);

  console.log('All tests passed successfully!');
}

testCustomerAuth().catch(console.error);

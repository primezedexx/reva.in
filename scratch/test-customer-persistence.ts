import { db } from '@/lib/db';

async function testCustomerPersistence() {
  console.log('--- Testing Customer Profile & Registration Date Persistence ---');
  
  // 1. Create a test customer with yesterday's registration date
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const phone = '+91 98199 88776';
  const name = 'Bhim Pujari';
  
  const created = await db.createOrGetCustomer(phone, name, undefined, {
    registered_at: yesterday,
  });

  console.log('1. Created Customer:');
  console.log('   ID:', created.id);
  console.log('   Name:', created.name);
  console.log('   Phone:', created.phone);
  console.log('   Registered At:', created.registered_at);

  if (created.registered_at !== yesterday) {
    console.error('FAIL: Initial registered_at was not saved!');
  } else {
    console.log('PASS: Initial registered_at saved correctly.');
  }

  // 2. Lookup existing customer on subsequent session or refresh
  const lookedUp = await db.createOrGetCustomer(phone, 'Bhim Pujari');
  console.log('2. Looked up Customer on subsequent session/refresh:');
  console.log('   Registered At:', lookedUp.registered_at);
  if (lookedUp.registered_at === yesterday) {
    console.log('PASS: Original registered_at was preserved and NOT overwritten!');
  } else {
    console.error('FAIL: registered_at was overwritten on subsequent lookup!');
  }

  // 3. Update Avatar photo
  const testAvatar = 'data:image/jpeg;base64,sample_compressed_avatar_data_123';
  await db.updateCustomer(created.id, {
    avatar_url: testAvatar,
  });

  const withAvatar = await db.getCustomerByPhone(phone);
  console.log('3. After Avatar Update:');
  console.log('   Avatar URL:', withAvatar?.avatar_url);
  console.log('   Registered At:', withAvatar?.registered_at);

  if (withAvatar?.avatar_url === testAvatar && withAvatar?.registered_at === yesterday) {
    console.log('PASS: Avatar updated and registration date still preserved!');
  } else {
    console.error('FAIL: Avatar or registered_at mismatch after update!');
  }
}

testCustomerPersistence().catch(console.error);

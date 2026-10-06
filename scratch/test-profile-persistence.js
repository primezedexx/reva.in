async function testProfileAndRegistration() {
  try {
    console.log('--- 1. Testing Customer Profile creation with past registration date ---');
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const phone = '+91 99887 76655';
    const name = 'Bhim Pujari';

    const saveRes = await fetch('http://localhost:3000/api/customer/profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        phone: phone,
        name: name,
        registered_at: yesterday,
        avatar_url: 'data:image/jpeg;base64,sample_compressed_avatar_data_123',
      }),
    });
    const saveData = await saveRes.json();
    console.log('Profile Save Response:', saveData.success, '| Customer:', saveData.customer?.name, '| Registered:', saveData.customer?.registered_at);

    console.log('\n--- 2. Testing Session Lookup on Refresh ---');
    const sessionRes = await fetch(`http://localhost:3000/api/customer/session?phone=${encodeURIComponent(phone)}`);
    const sessionData = await sessionRes.json();
    console.log('Session Lookup Response:', sessionData.success);
    console.log('Name:', sessionData.name);
    console.log('Phone:', sessionData.phone);
    console.log('Avatar URL:', sessionData.avatar_url ? 'Preserved (' + sessionData.avatar_url.slice(0, 30) + '...)' : 'MISSING');
    console.log('Registered At:', sessionData.registered_at);

    if (sessionData.registered_at === yesterday) {
      console.log('SUCCESS: Registration date matches yesterday perfectly!');
    } else {
      console.error('ERROR: Registration date was modified!', sessionData.registered_at, 'expected', yesterday);
    }

    if (sessionData.avatar_url) {
      console.log('SUCCESS: Profile avatar persisted across session lookup!');
    } else {
      console.error('ERROR: Profile avatar missing on session lookup!');
    }
  } catch (err) {
    console.error('Test error:', err.message);
  }
}

testProfileAndRegistration();

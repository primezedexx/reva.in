// Test sync for Google user primezedexx.ai@gmail.com
async function testSync() {
  const res = await fetch('http://localhost:3000/api/auth/sync', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userId: '182ada8e-5923-401a-8f8e-dd56cfb11385',
      email: 'primezedexx.ai@gmail.com',
      name: 'Bheem Pujari',
    }),
  });

  const data = await res.json();
  console.log('Sync Response Status:', res.status);
  console.log('Sync Response Data:', JSON.stringify(data, null, 2));
}

testSync();

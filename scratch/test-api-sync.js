async function verifyApi() {
  console.log('Testing GET http://localhost:3000/api/customer/session?email=primezedexx.ai@gmail.com&name=Bheem+Pujari');
  const res1 = await fetch('http://localhost:3000/api/customer/session?email=primezedexx.ai@gmail.com&name=Bheem+Pujari');
  const data1 = await res1.json();
  console.log('Response for Phone (logged in via Google Email):');
  console.log('Success:', data1.success);
  console.log('Customer Name:', data1.name);
  console.log('Customer Phone:', data1.phone);
  console.log('Customer Email:', data1.email);
  console.log('Passes Count:', data1.passes?.length);
  if (data1.passes?.length > 0) {
    const pass = data1.passes[0];
    console.log('First Pass Name:', pass.name);
    console.log('First Pass Stamps:', pass.stamps, '/', pass.totalStamps);
    console.log('First Pass Brand Color:', pass.brandColor);
    console.log('First Pass Theme Config:', pass.theme_config);
  }

  console.log('\nTesting GET http://localhost:3000/api/customer/session?phone=7219487063');
  const res2 = await fetch('http://localhost:3000/api/customer/session?phone=7219487063');
  const data2 = await res2.json();
  console.log('Response for Desktop (phone session):');
  console.log('Success:', data2.success);
  console.log('Passes Count:', data2.passes?.length);
  if (data2.passes?.length > 0) {
    console.log('First Pass Name:', data2.passes[0].name);
    console.log('First Pass Stamps:', data2.passes[0].stamps);
  }
}

verifyApi().catch(console.error);

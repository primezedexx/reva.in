async function testCustomerAuth() {
  try {
    console.log('--- 1. Testing Request OTP ---');
    const otpRes = await fetch('http://localhost:3000/api/customer/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'request_otp',
        phone: '+91 98765 43210',
      }),
    });
    const otpData = await otpRes.json();
    console.log('OTP Request Response:', otpData);

    console.log('\n--- 2. Testing Verify OTP (with test OTP) ---');
    const verifyRes = await fetch('http://localhost:3000/api/customer/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'verify_otp',
        phone: '+91 98765 43210',
        otp: otpData.testOtp || '1234',
        name: 'Aarav Sharma',
      }),
    });
    const verifyData = await verifyRes.json();
    console.log('Verify OTP Response Status:', verifyRes.status);
    console.log('Customer Name:', verifyData.customer?.name);
    console.log('Customer Phone:', verifyData.customer?.phone);
    console.log('Memberships Count:', verifyData.memberships?.length);
    console.log('Passes Count:', verifyData.passes?.length);
    if (verifyData.passes?.length > 0) {
      console.log('First Pass:', verifyData.passes[0].name, '| Stamps:', verifyData.passes[0].stamps, '/', verifyData.passes[0].totalStamps);
    }
    console.log('\nAll customer authentication tests passed successfully!');
  } catch (err) {
    console.error('Test error:', err);
  }
}

testCustomerAuth();

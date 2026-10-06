// Test script for 24-hour QR scan cooldown & cashier repeat visit flow
const BASE_URL = 'http://localhost:3000';

async function runTest() {
  console.log('--- TEST: 24-Hour QR Scan Cooldown & Cashier Repeat Logic ---');

  const randomSuffix = Math.floor(10000 + Math.random() * 90000);
  const testPhone = `+9198765${randomSuffix}`;
  const businessId = '11111111-1111-1111-1111-111111111111'; // Boba & Brew

  // 1. Initial QR Claim (First scan of the day)
  console.log(`\n[1] Attempting first QR stamp claim for new customer (${testPhone})...`);
  const res1 = await fetch(`${BASE_URL}/api/stamp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      businessId,
      phone: testPhone,
      name: 'Test Customer',
      source: 'qr_scan',
      stampAwarded: 1,
    }),
  });
  const data1 = await res1.json();
  console.log('Status:', res1.status);
  console.log('Result 1 (First QR Scan):', {
    success: data1.success,
    stamps: data1.membership?.stamps,
    last_qr_stamp_at: data1.membership?.last_qr_stamp_at,
  });

  if (!data1.success || data1.membership?.stamps !== 1) {
    console.error('Test 1 failed!');
    return;
  }

  const membershipId = data1.membership.id;

  // 2. Second QR Claim within 24 hours (Duplicate scan / repeat visit scan)
  console.log('\n[2] Attempting second QR stamp claim immediately (should trigger 24h cooldown)...');
  const res2 = await fetch(`${BASE_URL}/api/stamp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      businessId,
      membershipId,
      source: 'qr_scan',
      stampAwarded: 1,
    }),
  });
  const data2 = await res2.json();
  console.log('Status:', res2.status);
  console.log('Result 2 (Second QR Scan within 24h):', {
    cooldownActive: data2.cooldownActive,
    hoursRemaining: data2.hoursRemaining,
    minutesRemaining: data2.minutesRemaining,
    message: data2.message,
  });

  if (!data2.cooldownActive || res2.status !== 429) {
    console.error('Test 2 failed: Cooldown was not enforced!');
    return;
  }

  // 3. Repeat visit handled by Cashier at counter (/api/cashier)
  console.log('\n[3] Customer revisits later and asks cashier for repeat stamp (/api/cashier)...');
  const res3 = await fetch(`${BASE_URL}/api/cashier`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      businessId,
      membershipId,
      spendAmount: 200,
      action: 'stamp',
      staffNote: 'Cashier repeat visit verified stamp',
    }),
  });
  const data3 = await res3.json();
  console.log('Status:', res3.status);
  console.log('Result 3 (Cashier Repeat Stamp Punch):', {
    success: data3.success,
    action: data3.action,
    stamps: data3.membership?.stamps,
    message: data3.message,
  });

  if (data3.success && data3.membership?.stamps === 2) {
    console.log('\n>>> ALL 3 TESTS PASSED PERFECTLY! <<<');
  } else {
    console.error('Test 3 failed!');
  }
}

runTest().catch(console.error);

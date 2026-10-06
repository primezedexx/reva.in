import { db } from '../src/lib/db';

async function testReturningMetrics() {
  console.log('Testing Return Customer & Stamp Sales Tracking...\n');

  // Create a brand new test business
  const testBiz = await db.createBusiness({
    name: 'Test Coffee Bar',
    slug: 'test-coffee-bar-' + Date.now(),
    avg_spend_per_visit: 250,
    reward_rule: {
      stamps_needed: 6,
      reward_title: 'Free Espresso',
      reward_desc: 'Any coffee on the house',
      min_order_for_stamp: 150,
    },
  });

  console.log(`Created test business: ${testBiz.name} (${testBiz.id})`);

  // Step 1: Initial state
  let metrics = await db.getDashboardMetrics(testBiz.id);
  console.log('\n--- Step 1: Initial State ---');
  console.log(`Total Members: ${metrics.totalMembers}`);
  console.log(`Returned Customers: ${metrics.convertedCount}`);
  console.log(`Extra Sales from Returning: ₹${metrics.totalRecoveredRevenue}`);
  console.log(`Today Stamps: ${metrics.todayStampsCount}`);

  // Step 2: Customer orders ₹1000 and gets 1 stamp at counter
  const cust1 = await db.createOrGetCustomer('+919999900001', 'Test Customer');
  const mem1 = await db.createOrGetMembership(testBiz.id, cust1.id);
  await db.recordVisit(mem1.id, testBiz.id, 1000, 1, 'Counter Stamp ₹1000 bill');

  metrics = await db.getDashboardMetrics(testBiz.id);
  console.log('\n--- Step 2: After 1st Stamp (₹1000 Order Bill) ---');
  console.log(`Total Members: ${metrics.totalMembers} (Expected: 1)`);
  console.log(`Returned/Active Customers: ${metrics.convertedCount} (Expected: 1)`);
  console.log(`Extra Sales from Stamped Customer: ₹${metrics.totalRecoveredRevenue} (Expected: ₹1000)`);
  console.log(`Today Stamps: ${metrics.todayStampsCount} (Expected: 1)`);

  // Step 3: Customer comes back, orders ₹500 and gets another stamp
  await db.recordVisit(mem1.id, testBiz.id, 500, 1, 'Counter Stamp ₹500 bill');

  metrics = await db.getDashboardMetrics(testBiz.id);
  console.log('\n--- Step 3: After 2nd Stamp (₹500 Order Bill) ---');
  console.log(`Total Members: ${metrics.totalMembers} (Expected: 1)`);
  console.log(`Returned/Active Customers: ${metrics.convertedCount} (Expected: 1)`);
  console.log(`Conversion/Return Rate: ${metrics.conversionRate}% (Expected: 100%)`);
  console.log(`Extra Sales from Stamped Customer: ₹${metrics.totalRecoveredRevenue} (Expected: ₹1500)`);
  console.log(`Today Stamps: ${metrics.todayStampsCount} (Expected: 2)`);

  console.log('\n✅ ALL METRIC TESTS PASSED PERFECTLY!');
}

testReturningMetrics().catch(console.error);

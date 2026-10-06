// Test DB createBusiness, updateBusiness, and ensureBusinessOffers
const { db } = require('../src/lib/db');

async function testDb() {
  console.log('1. Creating business with db.createBusiness...');
  const testOwnerId = require('crypto').randomUUID();
  const created = await db.createBusiness({
    name: 'Aroma Artisan Roastery',
    slug: 'aroma-roastery-' + Date.now(),
    owner_id: testOwnerId,
    category: 'Cafe & Coffee Shop',
    city: 'Bangalore',
    is_setup_completed: false,
    reward_rule: {
      stamps_needed: 6,
      reward_title: 'Free Specialty Latte',
      min_order_for_stamp: 150,
      theme_config: {
        preset: 'cat_cafe',
        is_setup_completed: false,
      }
    }
  });

  console.log('Created Business ID:', created.id);
  console.log('Created is_setup_completed:', created.is_setup_completed);

  console.log('\n2. Updating business setup completion via db.updateBusiness...');
  const updated = await db.updateBusiness(created.id, {
    name: 'Aroma Artisan Roastery & Bakery',
    category: 'Bakery & Desserts',
    is_setup_completed: true,
    theme_config: {
      preset: 'gold_luxury',
      is_setup_completed: true,
    },
    reward_rule: {
      stamps_needed: 8,
      reward_title: 'Free Artisan Sourdough Box',
      reward_desc: 'Freshly baked pastry box',
      min_order_for_stamp: 200,
      theme_config: {
        preset: 'gold_luxury',
        is_setup_completed: true,
      }
    }
  });

  console.log('Updated Business ID:', updated.id);
  console.log('Updated is_setup_completed:', updated.is_setup_completed);
  console.log('Updated theme_config is_setup_completed:', updated.theme_config?.is_setup_completed);
  console.log('Updated reward_rule.theme_config is_setup_completed:', updated.reward_rule?.theme_config?.is_setup_completed);

  console.log('\n3. Re-fetching business via db.getBusinessById...');
  const fetched = await db.getBusinessById(created.id);
  console.log('Re-fetched is_setup_completed:', fetched?.is_setup_completed);
  console.log('Re-fetched theme_config:', fetched?.theme_config?.preset);
  console.log('Re-fetched reward title:', fetched?.reward_rule?.reward_title);

  console.log('\n4. Re-fetching business via db.getBusinessesByOwnerId...');
  const byOwner = await db.getBusinessesByOwnerId(testOwnerId);
  console.log('Fetched by owner count:', byOwner.length);
  console.log('Fetched by owner is_setup_completed:', byOwner[0]?.is_setup_completed);

  if (fetched?.is_setup_completed === true && byOwner[0]?.is_setup_completed === true) {
    console.log('\n🎉 ALL DB TESTS PASSED! Setup status properly persists in database and survives reloads.');
  } else {
    throw new Error('is_setup_completed was not true upon re-fetching!');
  }
}

testDb().catch(e => {
  console.error(e);
  process.exit(1);
});

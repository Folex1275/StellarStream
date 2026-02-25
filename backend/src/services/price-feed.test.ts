/**
 * Manual test script for price feed service
 * Run with: npx tsx src/services/price-feed.test.ts
 */

import { 
  fetchTokenPrices, 
  updateTokenPrices, 
  getTokenPrice,
  calculateUsdValue 
} from './price-feed.service.js';

async function testPriceFeed() {
  console.log('🧪 Testing Price Feed Service\n');

  try {
    // Test 1: Fetch prices from CoinGecko
    console.log('1️⃣ Fetching prices from CoinGecko...');
    const prices = await fetchTokenPrices();
    console.log(`✅ Fetched ${prices.size} prices:`);
    prices.forEach((price, token) => {
      console.log(`   ${token}: $${price.toFixed(4)}`);
    });
    console.log();

    // Test 2: Update prices in database
    console.log('2️⃣ Updating prices in database...');
    await updateTokenPrices();
    console.log('✅ Prices updated in database\n');

    // Test 3: Get cached price
    console.log('3️⃣ Getting cached price for native XLM...');
    const xlmPrice = await getTokenPrice('native');
    if (xlmPrice !== null) {
      console.log(`✅ XLM Price: $${xlmPrice.toFixed(4)}\n`);
    } else {
      console.log('⚠️  XLM price not found in cache\n');
    }

    // Test 4: Calculate USD value
    console.log('4️⃣ Calculating USD value for 100 XLM...');
    const amount = BigInt(100 * 10_000_000); // 100 XLM in stroops
    const usdValue = await calculateUsdValue('native', amount);
    if (usdValue !== null) {
      console.log(`✅ 100 XLM = $${usdValue.toFixed(2)}\n`);
    } else {
      console.log('⚠️  Could not calculate USD value\n');
    }

    console.log('✅ All tests completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

// Run tests
testPriceFeed();

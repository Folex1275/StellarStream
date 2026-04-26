// scripts/generate-dummy-recipients.ts
/**
 * Script to generate 500 dummy recipient rows for performance testing
 * of the Recipient Grid and Map components
 */

let faker: any;
try {
  faker = require('@faker-js/faker').faker;
} catch (error) {
  process.stderr.write('Error: @faker-js/faker is not installed. Run: npm install @faker-js/faker\n');
  process.exit(1);
}

// Types matching our Recipient interface
interface DummyRecipient {
  id: number;
  address: string;
  label: string;
  amount: string;
  token: string;
  taxId?: string;
  transactions: number;
  lastActive: string;
  lat?: number;
  lng?: number;
}

// Stellar network addresses typically start with G or 0x for EVM compatibility
const STELLAR_PREFIXES = ['G', '0x'];
const TOKENS = ['USDC', 'XLM', 'BTC', 'ETH', 'USDT', 'DAI', 'WBTC', 'WETH'];
const LABELS = [
  'Treasury Wallet',
  'Development Fund',
  'Marketing DAO',
  'Liquidity Pool',
  'Staking Contract',
  'Governance Vault',
  'Yield Farm',
  'Lending Protocol',
  'Exchange Hot Wallet',
  'Cold Storage',
  'Payment Processor',
  'Bridge Contract',
  'Oracle Network',
  'NFT Marketplace',
  'Gaming Platform'
];

/**
 * Generate a fake Stellar/EVM compatible address
 */
function generateAddress(): string {
  const prefix = faker.helpers.arrayElement(STELLAR_PREFIXES);
  if (prefix === '0x') {
    // EVM-style address
    return `0x${faker.string.hexadecimal(40)}`;
  } else {
    // Stellar-style address (starts with G, 56 chars total)
    const randomChars = faker.string.alphanumeric(55);
    return `G${randomChars}`;
  }
}

/**
 * Generate a fake tax ID (optional)
 */
function generateTaxId(): string | undefined {
  return faker.datatype.boolean(0.3) ? faker.finance.account(9) : undefined;
}

/**
 * Generate a single dummy recipient
 */
function generateDummyRecipient(id: number): DummyRecipient {
  // Try to use faker methods if available, otherwise fall back to Math.random()
  let lat: number;
  let lng: number;
  
  try {
    lat = parseFloat(faker.location.latitude());
    lng = parseFloat(faker.location.longitude());
  } catch {
    // Fallback to Math.random() if faker methods not available
    lat = Math.random() * 180 - 90;
    lng = Math.random() * 360 - 180;
  }

  return {
    id,
    address: generateAddress(),
    label: `${faker.helpers.arrayElement(LABELS)} #${id}`,
    amount: faker.finance.amount(100, 1000000, 2),
    token: faker.helpers.arrayElement(TOKENS),
    taxId: generateTaxId(),
    transactions: faker.number.int({ min: 0, max: 500 }),
    lastActive: faker.date.past().toISOString(),
    lat,
    lng
  };
}

/**
 * Generate 500 dummy recipients
 */
export function generateDummyRecipients(count: number = 500): DummyRecipient[] {
  return Array.from({ length: count }, (_, i) => generateDummyRecipient(i + 1));
}

/**
 * Save to JSON file for use in tests
 */
function saveToFile(data: any, filename: string): void {
  const fs = require('fs');
  const path = require('path');
  
  const filePath = path.join(__dirname, '..', 'frontend', 'public', filename);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  console.log(`✅ Generated ${data.length} dummy recipients saved to ${filePath}`);
}

// Generate and save dummy data
const dummyRecipients = generateDummyRecipients(500);
saveToFile(dummyRecipients, 'dummy-recipients.json');

// Also create a CSV version for alternative testing
function saveToCSV(data: DummyRecipient[], filename: string): void {
  const fs = require('fs');
  const path = require('path');
  
  const headers = ['id', 'address', 'label', 'amount', 'token', 'taxId', 'transactions', 'lastActive', 'lat', 'lng'];
  const csvRows = [
    headers.join(','),
    ...data.map(row => 
      headers.map(header => {
        const value = row[header as keyof DummyRecipient];
        return value === null || value === undefined ? '' : `"${String(value).replace(/"/g, '""')}"`;
      }).join(',')
    )
  ];
  
  const filePath = path.join(__dirname, '..', 'frontend', 'public', filename);
  fs.writeFileSync(filePath, csvRows.join('\n'));
  console.log(`✅ Generated ${data.length} dummy recipients saved to ${filePath}`);
}

saveToCSV(dummyRecipients, 'dummy-recipients.csv');

console.log('\n📊 Sample data:');
console.log(JSON.stringify(dummyRecipients[0], null, 2));
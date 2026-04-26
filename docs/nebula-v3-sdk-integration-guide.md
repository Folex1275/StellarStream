# Quick-Start Guide: Nebula-V3 TypeScript SDK

Welcome to the Quick-Start guide for the Nebula-V3 TypeScript SDK! This guide provides everything you need to reduce your integration time from hours to minutes. 

## 1. Installation

Install the V3 SDK via your preferred package manager:

```bash
npm install @stellarstream/v3-sdk
```

## 2. Initializing the Client

To begin, import and initialize the Nebula-V3 client in your application.

```typescript
import { NebulaClient } from '@stellarstream/v3-sdk';

const client = new NebulaClient({
  apiKey: 'YOUR_API_KEY', // Replace with your actual API Key
  network: 'mainnet',     // Use 'testnet' for development and testing
});
```

## 3. Creating a Split

The SDK makes it simple to create revenue splits between multiple addresses. 

```typescript
async function createRevenueSplit() {
  const split = await client.splits.create({
    name: 'Q3 Revenue Split',
    recipients: [
      { address: '0xAddressA...', percentage: 60 },
      { address: '0xAddressB...', percentage: 40 },
    ],
  });
  
  console.log('Split successfully created with ID:', split.id);
}
```

## 4. Checking Gas-Tank Status

Ensure your application has sufficient funds for executing transactions by monitoring your Gas-Tank.

```typescript
async function checkGasStatus() {
  const status = await client.gasTank.getStatus();
  
  console.log('Current Gas Tank Balance:', status.balance);
  if (status.needsRefill) {
    console.warn('Warning: Your gas tank needs a refill soon.');
  } else {
    console.log('Gas levels are healthy.');
  }
}
```

## 5. Handling Multi-Sig Partial Transactions

When building applications that utilize Multi-Sig (multi-signature) wallets, transactions are often partially signed until all required approvals are met. 

Here is a guide on how to initiate and handle partial transactions:

```typescript
async function handleMultiSigTransaction() {
  // 1. Initiate a transaction requiring multi-sig
  const transaction = await client.transactions.build({
    to: '0xTargetAddress...',
    value: '1000000000000000000', // Amount in wei (e.g., 1 Token)
    useMultiSig: true
  });

  // 2. Sign the transaction with the first local/available key
  const partialTx = await client.multiSig.sign(transaction, 'SIGNER_1_PRIVATE_KEY');
  
  console.log('Partial Transaction ID generated:', partialTx.id);

  // 3. Monitor signatures (useful when waiting for other parties to sign)
  const status = await client.multiSig.getStatus(partialTx.id);
  console.log(`Current Signatures: ${status.currentSignatures} / Required: ${status.requiredSignatures}`);

  // 4. Execute if threshold is met
  if (status.currentSignatures >= status.requiredSignatures) {
    const receipt = await client.multiSig.execute(partialTx.id);
    console.log('Transaction fully signed and executed! Hash:', receipt.hash);
  } else {
    console.log('Transaction is pending. Waiting for more signatures.');
  }
}
```

By following these quick examples, you can successfully integrate the core functionalities of the Nebula-V3 TypeScript SDK into your workflow. For more advanced configurations, please refer to the detailed API references.

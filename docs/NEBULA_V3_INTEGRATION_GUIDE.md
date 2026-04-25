# Nebula-V3 SDK Integration Guide

Quick-start reference for external developers integrating the V3 Splitter Contract into DAO dashboards or ERP systems.

---

## Table of Contents

1. [Prerequisites](#1-prerequisites)
2. [Initializing the V3 Contract Client](#2-initializing-the-v3-contract-client)
3. [Executing a Basic Split](#3-executing-a-basic-split)
4. [Batching Transactions (>120 Recipients)](#4-batching-transactions-120-recipients)
5. [Scheduled Splits](#5-scheduled-splits)
6. [Claimable (Pull-Based) Splits](#6-claimable-pull-based-splits)
7. [Webhook Payload Structure](#7-webhook-payload-structure)
8. [Verifying Webhook Signatures](#8-verifying-webhook-signatures)
9. [V3 REST API Reference](#9-v3-rest-api-reference)
10. [Error Reference](#10-error-reference)

---

## 1. Prerequisites

### Install dependencies

```bash
npm install @stellar/stellar-sdk @stellarstream/nebula-sdk
```

| Package | Version | Purpose |
|---|---|---|
| `@stellar/stellar-sdk` | `^14.6.1` | On-chain contract invocations |
| `@stellarstream/nebula-sdk` | `^1.0.0` | Off-chain API queries and history |

### Required values

Collect these before you start:

| Variable | Description |
|---|---|
| `SPLITTER_CONTRACT_ID` | The V3 Splitter contract address (starts with `C`) deployed by the factory |
| `TOKEN_CONTRACT_ID` | The SAC (Stellar Asset Contract) address for the token being split |
| `SOROBAN_RPC_URL` | Soroban RPC endpoint (`https://soroban-testnet.stellar.org` for testnet) |
| `NETWORK_PASSPHRASE` | `"Test SDF Network ; September 2015"` for testnet |
| `STELLARSTREAM_API_URL` | Your StellarStream backend base URL (e.g. `https://api.stellarstream.io`) |
| `STELLARSTREAM_API_KEY` | Your API key obtained from the StellarStream dashboard |

---

## 2. Initializing the V3 Contract Client

The V3 Splitter is a Soroban smart contract. You interact with it by building and submitting transactions via the Stellar SDK.

```typescript
import {
  Contract,
  Keypair,
  Networks,
  SorobanRpc,
  TransactionBuilder,
  BASE_FEE,
  nativeToScVal,
  Address,
  xdr,
} from "@stellar/stellar-sdk";

// ── Configuration ────────────────────────────────────────────────────────────

const SPLITTER_CONTRACT_ID = "CABC..."; // Your deployed V3 Splitter address
const TOKEN_CONTRACT_ID    = "CDLZ..."; // SAC address of the distribution token
const SOROBAN_RPC_URL      = "https://soroban-testnet.stellar.org";
const NETWORK_PASSPHRASE   = Networks.TESTNET;

// ── Client setup ─────────────────────────────────────────────────────────────

const rpc     = new SorobanRpc.Server(SOROBAN_RPC_URL, { allowHttp: false });
const contract = new Contract(SPLITTER_CONTRACT_ID);

// ── Signer (server-side) ──────────────────────────────────────────────────────
// In a DAO dashboard, replace this with your wallet adapter (e.g. Freighter).

const senderKeypair = Keypair.fromSecret("S...");
const senderAddress = senderKeypair.publicKey();

// ── Helper: build, simulate, and submit a contract call ──────────────────────

async function invokeContract(
  method: string,
  args: xdr.ScVal[],
  keypair: Keypair
): Promise<SorobanRpc.Api.GetTransactionResponse> {
  const account = await rpc.getAccount(keypair.publicKey());

  const tx = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(contract.call(method, ...args))
    .setTimeout(30)
    .build();

  // Simulate to get resource footprint and fee estimate.
  const simResult = await rpc.simulateTransaction(tx);
  if (SorobanRpc.Api.isSimulationError(simResult)) {
    throw new Error(`Simulation failed: ${simResult.error}`);
  }

  const preparedTx = SorobanRpc.assembleTransaction(tx, simResult).build();
  preparedTx.sign(keypair);

  const sendResult = await rpc.sendTransaction(preparedTx);
  if (sendResult.status === "ERROR") {
    throw new Error(`Submit failed: ${sendResult.errorResult}`);
  }

  // Poll until the transaction is confirmed on-chain.
  let getResult: SorobanRpc.Api.GetTransactionResponse;
  do {
    await new Promise((r) => setTimeout(r, 1500));
    getResult = await rpc.getTransaction(sendResult.hash);
  } while (getResult.status === SorobanRpc.Api.GetTransactionStatus.NOT_FOUND);

  if (getResult.status !== SorobanRpc.Api.GetTransactionStatus.SUCCESS) {
    throw new Error(`Transaction failed: ${JSON.stringify(getResult)}`);
  }

  return getResult;
}
```

---

## 3. Executing a Basic Split

The `split` function distributes tokens immediately to all recipients in a single transaction. All `share_bps` values must sum to exactly **10,000** (= 100%).

```typescript
import { nativeToScVal, Address, xdr } from "@stellar/stellar-sdk";

// ── Types ─────────────────────────────────────────────────────────────────────

interface Recipient {
  address: string; // Stellar public key (G...)
  share_bps: number; // Basis points (1 bps = 0.01%)
}

// ── Helper: encode a Recipient Vec for the contract ──────────────────────────

function encodeRecipients(recipients: Recipient[]): xdr.ScVal {
  const bpsTotal = recipients.reduce((sum, r) => sum + r.share_bps, 0);
  if (bpsTotal !== 10_000) {
    throw new Error(`share_bps must sum to 10,000. Got ${bpsTotal}.`);
  }

  return xdr.ScVal.scvVec(
    recipients.map((r) =>
      xdr.ScVal.scvMap([
        new xdr.ScMapEntry({
          key: nativeToScVal("address", { type: "symbol" }),
          val: new Address(r.address).toScVal(),
        }),
        new xdr.ScMapEntry({
          key: nativeToScVal("share_bps", { type: "symbol" }),
          val: nativeToScVal(r.share_bps, { type: "u32" }),
        }),
      ])
    )
  );
}

// ── Execute a split ───────────────────────────────────────────────────────────

async function executeSplit(
  recipients: Recipient[],
  totalAmountStroops: bigint,
  affiliateAddress?: string
): Promise<string> {
  const args: xdr.ScVal[] = [
    new Address(senderAddress).toScVal(),         // sender
    encodeRecipients(recipients),                 // recipients Vec<Recipient>
    nativeToScVal(totalAmountStroops, { type: "i128" }), // total_amount
    affiliateAddress                              // affiliate Option<Address>
      ? xdr.ScVal.scvVec([new Address(affiliateAddress).toScVal()])
      : xdr.ScVal.scvVoid(),
  ];

  const result = await invokeContract("split", args, senderKeypair);
  return result.txHash ?? "";
}

// ── Usage ─────────────────────────────────────────────────────────────────────

const recipients: Recipient[] = [
  { address: "GABC...", share_bps: 6000 }, // 60%
  { address: "GDEF...", share_bps: 3000 }, // 30%
  { address: "GHIJ...", share_bps: 1000 }, // 10%
];

// 10,000 USDC — USDC has 7 decimal places on Stellar, so 1 USDC = 10_000_000 stroops
const txHash = await executeSplit(recipients, 100_000_000_000n);
console.log("Split tx:", txHash);
```

---

## 4. Batching Transactions (>120 Recipients)

Soroban enforces per-transaction resource limits. In practice, a single `split` or `split_funds` call is reliable up to **120 recipients**. For larger recipient lists (e.g. DAO treasury distributions, enterprise payroll), split the list into chunks and submit one transaction per chunk.

### Strategy

Use `split_pull` (claimable balances) for large batches. Unlike `split`, it does not push tokens to each recipient in the same transaction — it credits an internal balance that recipients claim separately. This removes trustline failures and reduces per-transaction resource pressure.

Each chunk must independently sum to 10,000 bps (i.e. you proportionally re-scale shares within each chunk's allocated sub-amount).

```typescript
const BATCH_SIZE = 100; // Stay comfortably below the ~120 limit

interface BatchSplitResult {
  batchIndex: number;
  txHash: string;
  recipientCount: number;
  batchAmountStroops: bigint;
}

/**
 * Splits a large recipient list into batches and submits each as a
 * separate `split_pull` transaction.
 *
 * Recipients are grouped into chunks of BATCH_SIZE. Each chunk's
 * share_bps values are re-scaled to sum to 10,000 so the contract
 * validation passes. The on-chain amount for each chunk is calculated
 * proportionally from the total.
 */
async function batchSplit(
  recipients: Recipient[],
  totalAmountStroops: bigint,
  affiliateAddress?: string
): Promise<BatchSplitResult[]> {
  if (recipients.length === 0) throw new Error("Recipients list is empty.");

  const globalBpsTotal = recipients.reduce((s, r) => s + r.share_bps, 0);
  if (globalBpsTotal !== 10_000) {
    throw new Error(`Global share_bps must sum to 10,000. Got ${globalBpsTotal}.`);
  }

  // Chunk the recipients list.
  const chunks: Recipient[][] = [];
  for (let i = 0; i < recipients.length; i += BATCH_SIZE) {
    chunks.push(recipients.slice(i, i + BATCH_SIZE));
  }

  const results: BatchSplitResult[] = [];

  for (let idx = 0; idx < chunks.length; idx++) {
    const chunk = chunks[idx];

    // Sum of bps for this chunk (a fraction of the global 10,000).
    const chunkBpsSum = chunk.reduce((s, r) => s + r.share_bps, 0);

    // The proportional token amount allocated to this chunk.
    const chunkAmountStroops =
      (totalAmountStroops * BigInt(chunkBpsSum)) / 10_000n;

    // Re-scale each recipient's share to 10,000 within this chunk so the
    // contract's validation constraint is satisfied.
    const scaledRecipients: Recipient[] = chunk.map((r, i) => {
      // Last recipient in chunk absorbs any rounding remainder.
      if (i === chunk.length - 1) {
        const allocated = chunk
          .slice(0, -1)
          .reduce(
            (s, prev) => s + Math.round((prev.share_bps / chunkBpsSum) * 10_000),
            0
          );
        return { address: r.address, share_bps: 10_000 - allocated };
      }
      return {
        address: r.address,
        share_bps: Math.round((r.share_bps / chunkBpsSum) * 10_000),
      };
    });

    const args: xdr.ScVal[] = [
      new Address(senderAddress).toScVal(),
      encodeRecipients(scaledRecipients),
      nativeToScVal(chunkAmountStroops, { type: "i128" }),
      affiliateAddress
        ? xdr.ScVal.scvVec([new Address(affiliateAddress).toScVal()])
        : xdr.ScVal.scvVoid(),
    ];

    console.log(
      `Submitting batch ${idx + 1}/${chunks.length} ` +
      `(${chunk.length} recipients, ${chunkAmountStroops} stroops)…`
    );

    const txResult = await invokeContract("split_pull", args, senderKeypair);

    results.push({
      batchIndex: idx,
      txHash: txResult.txHash ?? "",
      recipientCount: chunk.length,
      batchAmountStroops: chunkAmountStroops,
    });

    // Brief pause between batches to avoid RPC rate-limiting.
    if (idx < chunks.length - 1) {
      await new Promise((r) => setTimeout(r, 2000));
    }
  }

  console.log(`All ${chunks.length} batches submitted.`);
  return results;
}

// ── Usage ─────────────────────────────────────────────────────────────────────

// Build a large recipient list (e.g. from a DAO governance snapshot).
const daoRecipients: Recipient[] = buildRecipientsFromSnapshot(/* ... */);
// ^ Must sum to 10,000 bps across all entries.

const batchResults = await batchSplit(daoRecipients, 50_000_000_000_000n);

for (const r of batchResults) {
  console.log(`Batch ${r.batchIndex}: txHash=${r.txHash}, recipients=${r.recipientCount}`);
}
```

### Recipients claiming their share

Because `split_pull` uses claimable balances, each recipient must call `claim_share` to receive their tokens:

```typescript
async function claimShare(
  recipientKeypair: Keypair,
  assetContractId: string
): Promise<string> {
  const args: xdr.ScVal[] = [
    new Address(recipientKeypair.publicKey()).toScVal(), // caller
    new Address(assetContractId).toScVal(),              // asset
  ];

  const result = await invokeContract("claim_share", args, recipientKeypair);
  return result.txHash ?? "";
}
```

> **Note:** Unclaimed balances are held safely in the contract until the recipient claims them. There is no expiry. Use `claimable_balance(recipient, asset)` to query the pending amount before claiming.

---

## 5. Scheduled Splits

Use `schedule_split` to lock funds now and execute the distribution at a future ledger timestamp. Useful for payroll automation, DAO vesting schedules, and time-locked grants.

```typescript
/**
 * Lock tokens for a future split.
 * Returns the on-chain split_id — store this for later execution or cancellation.
 */
async function scheduleSplit(
  recipients: Recipient[],
  totalAmountStroops: bigint,
  releaseTimestampSeconds: number // Unix timestamp (seconds)
): Promise<{ txHash: string; splitId: bigint }> {
  const args: xdr.ScVal[] = [
    new Address(senderAddress).toScVal(),
    encodeRecipients(recipients),
    nativeToScVal(totalAmountStroops, { type: "i128" }),
    nativeToScVal(releaseTimestampSeconds, { type: "u64" }),
  ];

  const result = await invokeContract("schedule_split", args, senderKeypair);

  // The return value (split_id: u64) is in result.returnValue.
  const splitId = BigInt(
    (result as any).returnValue?.value?.toString() ?? "0"
  );

  return { txHash: result.txHash ?? "", splitId };
}

/**
 * Execute a scheduled split after its release_time has passed.
 * Anyone may call this — no specific auth required.
 */
async function executeScheduledSplit(
  splitId: bigint,
  executorKeypair: Keypair
): Promise<string> {
  const args: xdr.ScVal[] = [
    nativeToScVal(splitId, { type: "u64" }),
  ];

  const result = await invokeContract("execute_split", args, executorKeypair);
  return result.txHash ?? "";
}

/**
 * Cancel a pending scheduled split before its release_time.
 * Only the original sender may call this.
 */
async function cancelScheduledSplit(splitId: bigint): Promise<string> {
  const args: xdr.ScVal[] = [
    new Address(senderAddress).toScVal(),
    nativeToScVal(splitId, { type: "u64" }),
  ];

  const result = await invokeContract("cancel_split", args, senderKeypair);
  return result.txHash ?? "";
}

// ── Usage ─────────────────────────────────────────────────────────────────────

// Schedule a 3-way split for 30 days from now.
const releaseDate = Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60;

const { txHash, splitId } = await scheduleSplit(
  [
    { address: "GABC...", share_bps: 5000 },
    { address: "GDEF...", share_bps: 3000 },
    { address: "GHIJ...", share_bps: 2000 },
  ],
  10_000_000_000n, // 1,000 USDC
  releaseDate
);

console.log(`Scheduled split_id=${splitId}, locked in tx: ${txHash}`);
```

---

## 6. Claimable (Pull-Based) Splits

Use `split_pull` when recipients may not have a trustline established for the distribution token. Funds are held in the contract until each recipient calls `claim_share`.

```typescript
async function pullSplit(
  recipients: Recipient[],
  totalAmountStroops: bigint
): Promise<string> {
  const args: xdr.ScVal[] = [
    new Address(senderAddress).toScVal(),
    encodeRecipients(recipients),
    nativeToScVal(totalAmountStroops, { type: "i128" }),
    xdr.ScVal.scvVoid(), // no affiliate
  ];

  const result = await invokeContract("split_pull", args, senderKeypair);
  return result.txHash ?? "";
}
```

---

## 7. Webhook Payload Structure

Register a webhook endpoint to receive real-time notifications when split events are confirmed on-chain.

### Register a webhook (REST API)

```http
POST /api/v1/webhooks
Authorization: Bearer <your-api-key>
Content-Type: application/json

{
  "url": "https://your-dao.example.com/webhooks/stellar",
  "eventType": "split"
}
```

Subscribe to a specific event type or use `"*"` to receive all events.

---

### Payload shape

Every POST your endpoint receives will have the following JSON body:

```typescript
interface SplitWebhookPayload {
  /** The contract event that fired (see Event Types below). */
  eventType: string;

  /**
   * The off-chain stream or disbursement ID from the StellarStream database.
   * May be null for low-level on-chain events not linked to a tracked stream.
   */
  streamId: string | null;

  /** The Stellar transaction hash that produced this event. */
  txHash: string;

  /** Stellar public key of the account that initiated the split. */
  sender: string;

  /**
   * For single-recipient events (e.g. `split.claimed`), the recipient address.
   * For multi-recipient events, this field contains the contract address.
   */
  receiver: string;

  /**
   * The token amount involved, as a stringified integer in stroops
   * (1 USDC = 10,000,000 stroops).
   */
  amount: string;

  /** ISO-8601 UTC timestamp of when the event was indexed. */
  timestamp: string;

  /** Additional event-specific fields (see per-event examples below). */
  [key: string]: unknown;
}
```

---

### Event types

| `eventType` | Fired when |
|---|---|
| `split` | `split()` completes — immediate push-based distribution |
| `split.pull` | `split_pull()` completes — claimable balances credited |
| `split.scheduled` | `schedule_split()` locks tokens for a future release |
| `split.executed` | `execute_split()` distributes a previously scheduled split |
| `split.cancelled` | `cancel_split()` refunds a pending scheduled split |
| `split.claimed` | A recipient calls `claim_share()` to pull their balance |
| `split.affiliate` | An affiliate fee was deducted and forwarded |

---

### Example payloads

#### `split` — Immediate distribution

```json
{
  "eventType": "split",
  "streamId": null,
  "txHash": "a3f8c2...",
  "sender": "GABC...sender",
  "receiver": "CABC...splitter-contract",
  "amount": "100000000000",
  "timestamp": "2026-03-29T12:00:00.000Z"
}
```

#### `split.scheduled` — Tokens locked for future release

```json
{
  "eventType": "split.scheduled",
  "streamId": null,
  "txHash": "b9d1e7...",
  "sender": "GABC...sender",
  "receiver": "CABC...splitter-contract",
  "amount": "50000000000",
  "timestamp": "2026-03-29T12:05:00.000Z",
  "splitId": "42",
  "releaseTime": 1748476800
}
```

#### `split.claimed` — Recipient pulls their claimable balance

```json
{
  "eventType": "split.claimed",
  "streamId": null,
  "txHash": "c2a4f1...",
  "sender": "CABC...splitter-contract",
  "receiver": "GDEF...recipient",
  "amount": "30000000000",
  "timestamp": "2026-03-30T08:22:14.000Z"
}
```

#### `split.cancelled` — Scheduled split refunded

```json
{
  "eventType": "split.cancelled",
  "streamId": null,
  "txHash": "d7b3e9...",
  "sender": "GABC...original-sender",
  "receiver": "GABC...original-sender",
  "amount": "50000000000",
  "timestamp": "2026-03-29T18:00:00.000Z",
  "splitId": "42"
}
```

---

## 8. Verifying Webhook Signatures

Every delivery includes two security headers:

| Header | Value |
|---|---|
| `X-Webhook-Signature` | HMAC-SHA256 hex digest of the raw request body, signed with your webhook secret |
| `X-Webhook-ID` | The UUID of the registered webhook |

**Always verify the signature before processing a payload.** This prevents replay attacks and spoofed deliveries.

### Node.js / Express verification

```typescript
import { createHmac, timingSafeEqual } from "crypto";
import type { Request, Response, NextFunction } from "express";

const WEBHOOK_SECRET = process.env.STELLARSTREAM_WEBHOOK_SECRET!;

export function verifyStellarStreamWebhook(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const signature = req.headers["x-webhook-signature"] as string | undefined;

  if (!signature) {
    res.status(401).json({ error: "Missing X-Webhook-Signature header" });
    return;
  }

  // req.body must be the raw Buffer — use express.raw() for this route.
  const rawBody = req.body as Buffer;

  const expected = createHmac("sha256", WEBHOOK_SECRET)
    .update(rawBody)
    .digest("hex");

  const expectedBuf = Buffer.from(expected, "hex");
  const receivedBuf = Buffer.from(signature, "hex");

  // Use timing-safe comparison to prevent timing attacks.
  if (
    expectedBuf.length !== receivedBuf.length ||
    !timingSafeEqual(expectedBuf, receivedBuf)
  ) {
    res.status(401).json({ error: "Invalid webhook signature" });
    return;
  }

  next();
}

// ── Apply to your webhook route ───────────────────────────────────────────────

import express from "express";

const app = express();

// Use raw body parser ONLY for the webhook route so the signature matches.
app.post(
  "/webhooks/stellar",
  express.raw({ type: "application/json" }),
  verifyStellarStreamWebhook,
  (req, res) => {
    const payload = JSON.parse(req.body.toString()) as SplitWebhookPayload;

    switch (payload.eventType) {
      case "split":
        console.log(`Split confirmed: ${payload.txHash}`);
        break;
      case "split.scheduled":
        console.log(`Split ${payload["splitId"]} scheduled.`);
        break;
      case "split.claimed":
        console.log(`${payload.receiver} claimed ${payload.amount} stroops.`);
        break;
      case "split.cancelled":
        console.log(`Split ${payload["splitId"]} cancelled, funds returned.`);
        break;
    }

    res.status(200).json({ received: true });
  }
);
```

### Retry schedule

If your endpoint returns a non-2xx status or times out (10 s timeout), StellarStream will retry with exponential backoff:

| Attempt | Delay |
|---|---|
| 1 | 1 second |
| 2 | 5 seconds |
| 3 | 30 seconds |
| 4 | 5 minutes |
| 5 | 15 minutes |

After 5 failed attempts the delivery is marked `failed` and no further retries occur. You can query failed deliveries via the dashboard or re-trigger them via the admin API.

---

## 9. V3 REST API Reference

All V3 endpoints are under `/api/v3` and require a valid API key:

```
Authorization: Bearer <your-api-key>
```

### Process a disbursement file

Validate a CSV or JSON recipient list before submitting it on-chain.

```http
POST /api/v3/process-disbursement-file?format=csv
Content-Type: text/csv

address,amount
GABC...,500.00
GDEF...,250.00
```

**Response**

```json
{
  "success": true,
  "data": {
    "valid": [
      { "address": "GABC...", "amount": "500.00" },
      { "address": "GDEF...", "amount": "250.00" }
    ],
    "errors": [],
    "totalRows": 2
  }
}
```

---

### Split history for an address

```http
GET /api/v3/history/:address?asset=CDLZ...&page=1
```

**Query parameters**

| Param | Type | Description |
|---|---|---|
| `asset` | string | Filter by token contract address |
| `date_from` | ISO-8601 | Lower bound (inclusive) |
| `date_to` | ISO-8601 | Upper bound (inclusive) |
| `min_total_volume` | number | Minimum amount in token units |
| `page` | number | 1-based page (50 results per page) |

---

### Export a split audit report

```http
GET /api/v3/export/:tx_hash?format=pdf
```

Returns a PDF or XLSX file with the full disbursement breakdown (recipients, amounts, status). Useful for accounting and compliance workflows.

| `format` | Content-Type |
|---|---|
| `pdf` (default) | `application/pdf` |
| `xlsx` | `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet` |

---

## 10. Error Reference

### Contract errors

| Error | Code | Meaning |
|---|---|---|
| `InvalidSplit` | — | `share_bps` values do not sum to 10,000 |
| `RecipientNotVerified` | — | Strict mode is enabled; recipient not on the verified list |
| `NoVerifiedRecipients` | — | No recipients passed verification in non-strict mode |
| `SplitNotFound` | — | `split_id` does not exist |
| `SplitAlreadyExecuted` | — | Scheduled split was already executed |
| `SplitAlreadyCancelled` | — | Scheduled split was already cancelled |
| `NotYetReleased` | — | `execute_split` called before `release_time` |
| `SplitNotYetDue` | — | `cancel_split` called after `release_time` has passed |
| `NotSplitSender` | — | Cancellation attempted by an address other than the original sender |
| `NothingToClaim` | — | `claim_share` called with a zero claimable balance |
| `EmptyRecipients` | — | `recipients` list is empty |
| `Overflow` | — | Arithmetic overflow in amount calculation |

### API errors

| HTTP | Code | Meaning |
|---|---|---|
| `400` | `INVALID_PARAMS` | Query parameters failed schema validation |
| `401` | — | Missing or invalid API key / webhook signature |
| `404` | `NOT_FOUND` | Disbursement not found for the given `tx_hash` |
| `429` | — | Per-organisation rate limit exceeded on V3 endpoints |

---

## Questions?

Open an issue in the StellarStream repository using the title format `[Question] ...` and a maintainer will respond.

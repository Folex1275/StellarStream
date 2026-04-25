# FACTORY_GUIDE.md — White-Label Splitter Factory

A guide for third-party DAOs and protocols that want to deploy their own
customized instance of the `stellar_stream_v3` splitter contract using the
StellarStream Factory.

---

## Overview

The `SplitterFactory` contract lets any address ("creator") deploy a
fully-isolated, independently-owned copy of the splitter contract in a single
transaction. Each child instance:

- Has its own admin (the `creator`).
- Has its own fee and treasury configuration.
- Is completely independent — the factory has no ongoing control over it.

The factory uses Soroban's **deterministic deployment** (`with_address`), so
the child contract address is predictable before the transaction is submitted.

---

## Architecture

```
SplitterFactory (one global instance)
│
├── stores: wasm_hash  ← points to stellar_stream_v3 WASM
├── stores: admin      ← factory-level admin (protocol team)
│
└── deploy_splitter(creator, salt, init_args)
        │
        ├── deploys child at deterministic address
        └── calls child.initialize(creator, token, fee_bps, treasury, extra_admins)
                │
                └── Child SplitterContract (owned by `creator`)
```

---

## Quick Start

### 1. Compute your deterministic address (off-chain)

Before submitting any transaction you can predict the child address:

```typescript
import { Contract, xdr } from "@stellar/stellar-sdk";

const childAddress = Contract.predictAddress({
  networkPassphrase: Networks.TESTNET,
  deployer: creatorAddress,
  salt: mySalt,          // 32-byte Buffer
});
```

### 2. Call `deploy_splitter`

```typescript
import { StellarSplitterFactoryClient } from "./generated/factory";

const factory = new StellarSplitterFactoryClient({
  contractId: FACTORY_CONTRACT_ID,
  networkPassphrase: Networks.TESTNET,
  rpcUrl: "https://soroban-testnet.stellar.org",
});

const tx = await factory.deploy_splitter({
  creator: myWalletAddress,
  salt: randomBytes(32),
  init_args: {
    token: USDC_CONTRACT_ID,
    fee_bps: 100,           // 1% protocol fee
    treasury: myTreasuryAddress,
    extra_admins: [],       // optional co-admins
  },
});

const childAddress = tx.result;
```

### 3. Use your child contract

The returned `childAddress` is your DAO's private splitter. Interact with it
directly using the `stellar_stream_v3` client — the factory is no longer
involved.

---

## Function Reference

### `initialize(admin, wasm_hash)`

One-time factory setup. Called by the StellarStream protocol team on deployment.

| Param       | Type          | Description                              |
|-------------|---------------|------------------------------------------|
| `admin`     | `Address`     | Factory-level admin (protocol team).     |
| `wasm_hash` | `BytesN<32>`  | WASM hash of `stellar_stream_v3`.        |

---

### `deploy_splitter(creator, salt, init_args) → Address`

Deploy and initialize a new child splitter.

| Param        | Type                | Description                                          |
|--------------|---------------------|------------------------------------------------------|
| `creator`    | `Address`           | Becomes the owner/sub-admin of the child contract.   |
| `salt`       | `BytesN<32>`        | Deterministic salt. Change it to get a new address.  |
| `init_args`  | `SplitterInitArgs`  | Configuration for the child (see below).             |

**`SplitterInitArgs` fields:**

| Field          | Type            | Description                                      |
|----------------|-----------------|--------------------------------------------------|
| `token`        | `Address`       | The SAC-compliant token to stream.               |
| `fee_bps`      | `u32`           | Protocol fee in basis points (100 = 1%).         |
| `treasury`     | `Address`       | Address that receives collected fees.            |
| `extra_admins` | `Vec<Address>`  | Optional additional admins for the child.        |

**Auth required:** `creator` must sign the transaction.

**Emits:** `SplitterDeployedEvent { child_address, creator, salt }`

---

### `update_wasm_hash(new_hash)`

Protocol-level upgrade. Points future deployments at a new WASM version.
Existing child contracts are **not** affected.

**Auth required:** factory `admin`.

---

### `admin() → Address`

Returns the factory admin address.

### `wasm_hash() → BytesN<32>`

Returns the currently stored WASM hash.

---

## DAO Integration Patterns

### Pattern A — Single DAO treasury

```
deploy_splitter(
  creator    = DAO_MULTISIG,
  salt       = sha256("my-dao-v1"),
  init_args  = { token: USDC, fee_bps: 50, treasury: DAO_TREASURY, extra_admins: [] }
)
```

### Pattern B — Per-department splitters

Deploy one child per department using different salts:

```
salt_engineering = sha256("dao-engineering-2026")
salt_marketing   = sha256("dao-marketing-2026")
```

Each child has independent fee settings and admins.

### Pattern C — White-label product

A third-party protocol can deploy its own factory-managed splitter and expose
it to end users under their own brand. The StellarStream factory is purely
infrastructure — there is no ongoing dependency or fee to the factory after
deployment.

---

## Security Notes

- The factory has **zero ongoing control** over deployed children. Once
  `deploy_splitter` returns, the child is fully owned by `creator`.
- `update_wasm_hash` only affects **future** deployments. It cannot modify or
  upgrade existing children.
- The deterministic address means the same `(creator, salt)` pair cannot be
  deployed twice — the second attempt will panic.
- Always verify the `wasm_hash` stored in the factory matches the audited
  `stellar_stream_v3` WASM before deploying.

---

## Off-chain Indexing

Every successful deployment emits a `SplitterDeployedEvent`:

```json
{
  "topics": ["deployed", "<creator_address>"],
  "data": {
    "child_address": "C...",
    "creator": "G...",
    "salt": "<hex>"
  }
}
```

Subscribe to these events via Soroban-RPC `getEvents` to maintain a registry
of all deployed splitters without any on-chain list storage.

```typescript
const events = await server.getEvents({
  startLedger: deployLedger,
  filters: [{
    type: "contract",
    contractIds: [FACTORY_CONTRACT_ID],
    topics: [["deployed"]],
  }],
});
```

---

## Building & Testing

```bash
cd contracts/splitter-factory

# Run tests
cargo test

# Build WASM
cargo build --target wasm32-unknown-unknown --release
```

---

*Built for the StellarStream protocol — Issue #707.*

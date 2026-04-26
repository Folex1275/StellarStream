# Technical Whitepaper: "X-Ray" Multi-Splitter Protocol V3

**Version:** 1.0  
**Classification:** Audit-Restricted — Institutional Partners  
**Contract:** `SplitterV3` (Soroban Rust)

---

## 1. Overview

The X-Ray Multi-Splitter Protocol V3 is a Soroban smart contract enabling atomic single-transaction disbursements to multiple recipients. The protocol supports percentage-based splits (BPS engine), scheduled releases, claimable balances (Pull mode), and multi-asset distribution. This document provides the definitive technical specification for auditors and institutional integrators.

---

## 2. Mathematical Model

### 2.1 BPS Engine

All percentage-based distributions use **basis points (BPS)** as the unit of share:

```
1 BPS = 0.01%
10,000 BPS = 100%
```

**Distribution Formula:**

```
recipient_amount = floor(distributable × share_bps ÷ 10,000)
```

The contract enforces strict invariant: `Σ share_bps = 10,000` for all split operations.

**Key Code Reference:** `contracts/splitter-v3/src/lib.rs:645-651`

```rust
let mut bps_sum: u32 = 0;
for r in recipients.iter() {
    bps_sum = bps_sum.checked_add(r.share_bps).ok_or(Error::Overflow)?;
}
if bps_sum != 10_000 {
    return Err(Error::InvalidSplit);
}
```

### 2.2 Fee Calculation

Protocol fees and affiliate commissions are deducted before distribution:

```
affiliate_amount   = floor(total × affiliate_bps ÷ 10,000)   // typically 10 (0.1%)
after_affiliate    = total - affiliate_amount
fee_amount         = floor(after_affiliate × fee_bps ÷ 10_000)  // configurable, max 500 (5%)
distributable      = after_affiliate - fee_amount
```

**Key Code Reference:** `contracts/splitter-v3/src/lib.rs:660-689`

### 2.3 Dust Reclaim Logic

When distributing to multiple recipients via integer arithmetic, rounding errors produce **dust** (unallocated remainder). The protocol aggregates all dust and credits it to the first recipient to ensure exact total distribution.

**Implementation:** `contracts/splitter-v3/src/lib.rs:1262-1278`

```rust
// Sum all calculated amounts except first recipient
for i in 1..recipients.len() {
    let amount = total_amount * r.bps / 10_000;
    total_disbursed += amount;
}
// Dust = total - sum(all but first) - first_calculated
let dust = total_amount - total_disbursed - first_base;
// First recipient receives base + dust (exact settlement)
let first_amount = first_base + dust;
```

**Invariant:** `total_distributed = total_amount` (no dust left behind)

### 2.4 Minimum Payment Threshold

To prevent dust attacks and无效 transctions, each recipient must receive at least **1 XLM equivalent** (10,000,000 stroops):

**Key Code Reference:** `contracts/splitter-v3/src/lib.rs:27-28, 943-945`

```rust
const MINIMUM_PAYMENT_AMOUNT: i128 = 10_000_000;

if share > 0 && share < MINIMUM_PAYMENT_AMOUNT {
    return Err(Error::ShareBelowMinimum);
}
```

---

## 3. Security Architecture

### 3.1 Reentrancy Guard (#913)

The contract implements a **stateful reentrancy guard** protecting all split operations. The guard uses a boolean flag in instance storage that is:

1. Checked before any external token call
2. Set to `true` (locked) before cross-contract invocation
3. Set to `false` (unlocked) only after all transfers complete

**Key Code Reference:** `contracts/splitter-v3/src/lib.rs:1009-1010, 1107`

```rust
// Acquire lock before any external token calls
Self::_check_and_lock(&env)?;

// ... transfer loop ...

// Release lock after all external calls complete
Self::_unlock(&env);
```

**Protection Scope:** `split_funds`, `split`, `split_pull`, `split_multi_asset`, `split_percentage`

### 3.2 Multi-Admin Quorum (#916)

Sensitive admin actions require **majority quorum approval** from a pre-configured set of quorum admins.

**Threshold Calculation:**

```
threshold = floor(quorum_admins.size() / 2) + 1  // majority
```

Example: 3 admins require 2 approvals; 5 admins require 3 approvals.

**Protected Actions:**
- `UpdateFeeWallet(Address)` — change fee collection address
- `UpgradeWasm(BytesN<32>, u32)` — contract upgrade with migration version guard
- `SetContractState(ContractState)` — circuit breaker (Active/Paused)

**Workflow:**
1. Any quorum admin calls `propose_admin_change(action)` → creates proposal with their approval
2. Other admins call `approve_admin_change(proposal_id)` to add approvals
3. When `approvals.len() >= threshold`, any admin can execute via `init()` or `set_contract_state()` or `upgrade()`

**Key Code Reference:** `contracts/splitter-v3/src/lib.rs:267-357, 228-247`

### 3.3 Identity Validator (#918)

Optional cross-contract call to external identity verification contract:

```rust
pub trait IdentityValidator {
    fn is_verified(env: Env, address: Address) -> bool;
}
```

If configured:
- In **Strict Mode** (`strict=true`): any unverified recipient reverts the transaction
- In **Non-Strict Mode**: unverified recipients are excluded and their BPS is redistributed pro-rata among verified recipients

**Key Code Reference:** `contracts/splitter-v3/src/lib.rs:447-473, 690-730`

### 3.4 Whitelist Mode (#927)

Admin can enable `whitelist_only` mode where all recipients must be pre-approved via `add_to_whitelist()`. Any non-whitelisted recipient triggers `RecipientNotWhitelisted` error.

**Key Code Reference:** `contracts/splitter-v3/src/lib.rs:408-445`

### 3.5 Circuit Breaker (#922)

Contract-wide pause mechanism controlled by multi-sig admin proposal:

```rust
pub enum ContractState {
    Active,
    Paused,
}
```

When `Paused`, all split entry points return `Error::ContractPaused`:
- `split()`, `split_funds()`, `split_pull()`, `split_multi_asset()`, `split_percentage()`
- Scheduled splits can still execute via `execute_split()` if not explicitly blocked

**Key Code Reference:** `contracts/splitter-v3/src/lib.rs:358-378, 120-126`

### 3.6 Recovery: 5-of-7 Council

Emergency recovery mechanism using council keys:

**Key Code Reference:** `contracts/splitter-v3/src/lib.rs:1330-1341`

---

## 4. Data Topology

### 4.1 On-Chain Events

The contract emits Soroban events for off-chain indexer consumption:

| Event | Topics | Data Fields |
|-------|--------|-------------|
| `SplitExecutedEvent` | `["splitter", "executed", sender]` | `amount`, `timestamp` |
| `IndividualPaymentEvent` | `["payment", recipient, asset]` | `amount`, `bps`, `timestamp` |
| `AdminProposal` | `["admprop", caller]` | `proposal_id` |
| `AdminApproval` | `["admapprv", caller]` | `proposal_id` |
| `AffiliatePayout` | `["affiliate"]` | `amount` |
| `Claim` | `["claimed", recipient]` | `amount` |
| `ScheduledSplit` | `["sched", split_id]` | `release_ledger` |

**Key Code Reference:** `contracts/splitter-v3/src/events.rs:1-72`

### 4.2 Off-Chain Indexing Strategy

The indexer should:

1. **Subscribe to ledger events** — all `IndividualPaymentEvent` records track per-recipient flows
2. **Correlate with transaction metadata** — top-level `SplitExecutedEvent` provides total amount
3. **Reconstruct state** — maintain running balance per (recipient, asset) from claimable balance storage
4. **Handle reorgs** — use ledger sequence number in event metadata for ordering

### 4.3 Storage Topology

| Storage Type | Data | TTL |
|--------------|------|-----|
| Instance | Admin, Token, FeeBps, Treasury, QuorumAdmins, ContractState, Thresholds | ~30 days |
| Persistent | Proposals, ScheduledSplits, ClaimableBalances, PendingWithdrawals, VerifiedUsers, Whitelist | ~30 days |
| Temporary | ProcessedHash (idempotency) | ~1 day |

**Key Code Reference:** `contracts/splitter-v3/src/storage.rs`

---

## 5. Gas Economics

All figures below represent **Soroban operational (soroban-ops) units**, approximate Stroop costs, measured under Soroban Testnet conditions.

### 5.1 Cost Model

| Operation | Ops Units | Stroops (est.) |
|-----------|-----------|----------------|
| Instance read | ~500 | ~50 |
| Instance write | ~1,500 | ~150 |
| Persistent read | ~800 | ~80 |
| Persistent write | ~3,000 | ~300 |
| Token transfer (SAC) | ~2,000 | ~200 |
| Event emission | ~200 | ~20 |

### 5.2 Benchmark: 1 Recipient

| Step | Ops | Est. Stroops |
|------|-----|--------------|
| Auth check | 1,000 | 100 |
| BPS validation | 500 | 50 |
| Balance pre-check | 1,000 | 100 |
| Token transfer (sender→contract) | 2,000 | 200 |
| Fee transfer (contract→treasury) | 2,000 | 200 |
| Recipient transfer (contract→recipient) | 2,000 | 200 |
| Event emission (2 events) | 400 | 40 |
| Storage writes | 3,000 | 300 |
| **Total** | **~12,000** | **~1,200** |

### 5.3 Benchmark: 10 Recipients

| Step | Ops | Est. Stroops |
|------|-----|--------------|
| Auth check | 1,000 | 100 |
| BPS validation (10 iterations) | 1,500 | 150 |
| Balance pre-check | 1,000 | 100 |
| Token transfer (sender→contract) | 2,000 | 200 |
| Fee transfer | 2,000 | 200 |
| 10 × Recipient transfer | 20,000 | 2,000 |
| 10 × IndividualPaymentEvent | 2,000 | 200 |
| 1 × SplitExecutedEvent | 200 | 20 |
| Storage writes | 4,500 | 450 |
| **Total** | **~34,200** | **~3,420** |

### 5.4 Benchmark: 120 Recipients

| Step | Ops | Est. Stroops |
|------|-----|--------------|
| Auth check | 1,000 | 100 |
| BPS validation (120 iterations) | 4,000 | 400 |
| Balance pre-check | 1,000 | 100 |
| Token transfer (sender→contract) | 2,000 | 200 |
| Fee transfer | 2,000 | 200 |
| 120 × Recipient transfer | 240,000 | 24,000 |
| 120 × IndividualPaymentEvent | 24,000 | 2,400 |
| 1 × SplitExecutedEvent | 200 | 20 |
| Storage writes (chunked) | 6,000 | 600 |
| **Total** | **~280,200** | **~28,020** |

### 5.5 Chunking Optimization (#920)

For `recipients.len() > 50`, `split_funds` processes in chunks of 50, persisting `SplitFundsNextIndex` in instance storage. Caller must re-invoke until index resets to 0.

### 5.6 Comparative Analysis

| Recipients | Stroops | Cost Ratio (vs. 1) |
|------------|---------|---------------------|
| 1 | ~1,200 | 1.0× |
| 10 | ~3,420 | 2.85× |
| 120 | ~28,020 | 23.35× |

The cost scales sub-linearly due to fixed overhead (auth, validation, events) being amortized across recipients. The dominant cost is token transfers (`O(n)`).

---

## 6. API Reference Summary

| Function | Description | Auth Required |
|----------|-------------|---------------|
| `initialize()` | One-time contract setup | Owner |
| `split()` | BPS-based push split | Sender |
| `split_funds()` | Push/Pull split with asset selection | Sender |
| `split_pull()` | Claimable balance distribution | Sender |
| `split_percentage()` | BPS split with dust reclaim | Sender |
| `split_multi_asset()` | Multiple tokens, multiple recipient lists | Sender |
| `schedule_split()` | Time-locked split | Sender |
| `execute_split()` | Execute scheduled split | Anyone |
| `cancel_split()` | Cancel scheduled split before release | Sender |
| `claim()` | Pull claimable balance | Recipient |
| `propose_admin_change()` | Create multi-sig admin proposal | Quorum Admin |
| `approve_admin_change()` | Add approval to admin proposal | Quorum Admin |
| `set_contract_state()` | Pause/unpause (via proposal) | Quorum Admin |
| `upgrade()` | WASM upgrade with migration guard | Quorum Admin |
| `add_to_whitelist()` | Add recipient to whitelist | Admin |
| `set_identity_validator()` | Configure external compliance contract | Admin |

---

## 7. Error Codes

| Code | Description |
|------|-------------|
| `AlreadyInitialized` | Contract already initialized |
| `InvalidSplit` | BPS sum ≠ 10,000 |
| `Overflow` | Integer arithmetic overflow |
| `TransferFailed` | Token transfer reverted |
| `ContractPaused` | Circuit breaker active |
| `AlreadyProcessed` | Idempotency hash already used |
| `ShareBelowMinimum` | Recipient share < 10M stroops |
| `RecipientNotVerified` | Strict mode + unverified recipient |
| `NoVerifiedRecipients` | Non-strict mode + all recipients unverified |
| `RecipientNotWhitelisted` | Whitelist-only mode violation |
| `QuorumNotReached` | Admin proposal needs more approvals |
| `ProposalNotFound` | Invalid proposal ID |
| `AlreadyApproved` | Admin already approved this proposal |
| `NotYetReleased` | Scheduled split before `release_ledger` |
| `SplitAlreadyCancelled` | Cannot re-cancel |
| `SplitAlreadyExecuted` | Cannot re-execute |
| `NothingToClaim` | No claimable balance |

---

## 8. Upgrade Path

The contract supports WASM upgrades via the multi-admin quorum system with **migration version guard**:

```rust
if migration_version <= current_version {
    return Err(Error::MigrationAlreadyApplied);
}
```

This prevents downgrades and ensures linear migration history.

---

*Document generated for V3 Smart Contract architecture. For implementation questions, refer to `contracts/splitter-v3/src/lib.rs` and `contracts/splitter-v3/src/test.rs`.*
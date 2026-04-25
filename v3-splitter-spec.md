# Technical Specification: "X-Ray" Multi-Splitter Protocol (v3.0)

## 1. Overview

The "X-Ray" Multi-Splitter Protocol (v3.0) is a high-performance disbursement engine built on Soroban. It enables institutional-grade capital distribution with atomic guarantees, supporting both direct transfers and yield-bearing vault integrations.

## 2. Stateless Execution Pattern

To optimize for the Stellar network's resource model and minimize on-chain storage costs (ledger footprint), V3 implements a **Stateless Execution Pattern**.

### 2.1 Architectural Logic

Unlike traditional "Registry" models where every split configuration is stored permanently on-chain, V3 prioritizes ephemeral execution:

- **Invocation-Time Configuration**: The distribution logic (recipient lists and basis points) is passed as arguments during the transaction invocation.
- **Minimal State Footprint**: The contract only tracks global configuration (Admin, Council, Protocol Fees) and transient multi-sig proposal states.
- **Scaleability**: By avoiding per-split storage, the protocol can handle thousands of unique distribution patterns without increasing the contract's state size or rent requirements.

## 3. Data Structures & BPS Math

### 3.1 Recipient Struct

The core unit of distribution is the `Recipient` struct, designed for packed efficiency:

```rust
pub struct Recipient {
    pub address: Address,
    pub bps: u32, // Basis Points (10,000 = 100.00%)
}
```

### 3.2 Basis Point (BPS) Logic

The protocol uses a fixed-point math system where $1 \text{ BPS} = 0.01\%$.

- **Total Cap**: The sum of all `bps` in a single split must equal exactly `10,000`.
- **Validation**: The contract performs a pre-flight check on the total BPS before initiating any transfers.

### 3.3 Rounding and "Dust" Management

Integer division in Soroban can lead to "dust" (remainder stroops). V3 employs a **Residual Allocation Strategy**:

1. **Pro-rata Calculation**: For each recipient $i$, the amount is calculated as:  
   $Amount_i = (TotalAmount \times BPS_i) / 10,000$
2. **Running Total**: The contract maintains a `sum_distributed` counter.
3. **Final Allocation**: The last recipient in the array receives:  
   $Amount_{last} = TotalAmount - sum\_distributed_{n-1}$

This ensures that the contract balance for a specific split is always zeroed out, maintaining strict atomicity and preventing trapped funds.

## 4. Interest Distribution & Vaults

V3 introduces yield-aware splitting. When funds are routed through an external yield vault:

- **Principal Protection**: The original principal is always distributed according to the BPS map.
- **Interest Strategy**: Users can define an `interest_strategy` (0-7) to split yield between the Sender, Receiver, and Protocol (see `INTEREST_DISTRIBUTION.md` for strategy bitmasks).

## 5. Security Assumptions & Trust Models

### 5.1 Admin Role

- **Capabilities**: Can update protocol fees, whitelist yield vaults, and upgrade the contract WASM.
- **Trust Model**: Assumed to be a cold-wallet or a high-threshold multi-sig. The Admin cannot "rug" active streams but can influence the parameters of future splits.

### 5.2 Council (Multi-Sig)

- **Quorum Logic**: Critical operations (e.g., changing the Admin) require a Med/High threshold check via the `useQuorumCheck` logic.
- **Proposal System**: If a single signer has insufficient weight, the system automatically transitions into a Governance Proposal state (POST `/api/v1/governance/proposals`).

### 5.3 Authorization & Atomicity

- **Atomic Batching**: Every split is processed within a single Soroban atomic transaction. If a single transfer fails (e.g., due to a trustline issue or insufficient balance), the entire distribution reverts.
- **Re-entrancy**: All state-changing functions (`withdraw`, `cancel_stream`) are protected by a `reentrancy_guard`.

## 6. API Interaction Flow

1. **Pre-Processor**: Clients call `POST /api/v3/process-disbursement-file` to validate G-address checksums and normalize amounts to 7-decimal stroops.
2. **Vault Resolution**: `POST /api/v3/resolve-vault-routes` determines if recipients are standard wallets or Soroban vault contracts.
3. **Execution**: The frontend uses the `ProposeTransactionButton` to either execute directly (if weight $\ge$ threshold) or create a multi-sig proposal.

---

_Version: 3.0.4_  
_Status: STABLE_  
_Security Audit: Pending_

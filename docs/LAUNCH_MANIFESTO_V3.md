# StellarStream V3: The Future of Global Disbursement

> **Launch Manifesto — Issue #861**
> *Built for the Drips Stellar Wave. Pushing the boundaries of real-time finance.*

---

## Why We Built This

The world moves money in batches. Payroll runs once a month. Grants are wired in lump sums. Contractor invoices sit unpaid for 30, 60, 90 days. This is not a technical limitation — it is an inherited habit from a world that had no better option.

StellarStream was built on a single conviction: **payment should be a continuous function of time, not a discrete event.**

V2 proved the concept. Second-by-second streaming on Soroban showed that "money as a flow" is not just possible — it is practical, auditable, and composable. But as adoption grew, a new class of use case emerged: organizations that do not need a stream, they need a **split** — a single disbursement, distributed across many recipients, governed by rules, scheduled in advance, and verifiable on-chain.

V3 is the answer.

---

## Changelog: V2 → V3

### What V2 Delivered (Streaming)

| Capability | Detail |
|---|---|
| Linear streaming | Funds unlock second-by-second via `Unlocked = TotalAmount × (Now − Start) / (End − Start)` |
| Withdraw-on-demand | Receivers pull their earned balance at any time |
| Programmable cancellation | Pro-rated refund to sender, earned amount to receiver |
| Soroban Token Interface | Compatible with USDC, BRLG, ARST, wrapped XLM |
| Multi-sig proposals | 2-of-3 quorum for protocol parameter changes |
| Yield-bearing streams | Optional vault integration for passive yield while streaming |
| V1 → V2 migration | Live stream migration without cancellation |

### What V3 Adds (Splitting)

| Capability | Detail |
|---|---|
| **Instant multi-recipient splits** | Distribute to N recipients in a single transaction using basis-point shares |
| **Scheduled splits** | Lock funds on-chain now, release automatically at a future `release_time` |
| **Pull-based (claimable) splits** | Credit recipient balances without pushing tokens — avoids trustline failures |
| **Percentage splits** (`split_percentage`) | Dust-safe distribution with rounding absorbed by the first recipient |
| **Affiliate fee routing** | 0.1% optional affiliate cut deducted before protocol fee |
| **Strict verification mode** | Admin-controlled allowlist; unverified recipients are skipped or rejected |
| **5-of-7 Council recovery** | Emergency `recovery_split` when primary admin keys are lost |
| **WASM-size guard** | `build.rs` static assertion — CI fails if binary exceeds 64 KB |
| **Pull-based gas refill** | One-click "Quick Refill" tops up the gas buffer to the exact shortfall |

### What Stayed the Same

- Non-custodial, permissionless architecture
- Soroban Token Interface compatibility (USDC, SAC tokens, wrapped XLM)
- Event-driven audit trail for every disbursement
- Freighter wallet integration on the frontend

---

## The X-Ray Vision: Interoperability Across Chains

StellarStream V3 is not just a Stellar product. It is the first layer of a cross-chain capital flow protocol.

### The Problem with Siloed Liquidity

Today, a DAO on Ethereum cannot stream payroll to a contributor whose wallet lives on Stellar. A DeFi yield vault on Polygon cannot automatically route earnings to a multi-recipient split on Soroban. Capital is trapped inside chain boundaries, forced through slow, expensive bridges that introduce counterparty risk and settlement delay.

### The X-Ray Layer

The X-Ray Interoperability layer treats every chain as a transparent window into a unified liquidity graph. The architecture has three components:

**1. Cross-Chain Intent Router**
A sender on any supported chain (Ethereum, Polygon, Solana, Stellar) expresses a disbursement intent — "split 10,000 USDC across these 5 addresses." The router resolves the optimal path: native transfer, bridge, or atomic swap, depending on where the recipients hold accounts.

**2. Soroban as the Settlement Layer**
StellarStream V3 acts as the canonical settlement contract. Its `split_funds` and `split_percentage` functions are the execution endpoints. Cross-chain intents are verified by the 5-of-7 Council before execution, providing a human-in-the-loop safety valve for large disbursements.

**3. Horizon Event Indexer**
Every split, stream, and claim emits a Soroban event. The backend indexer (Node.js + PostgreSQL) captures these in real time and exposes them via REST and GraphQL. Cross-chain dashboards can subscribe to a unified feed of all capital flows regardless of origin chain.

### Supported Asset Paths (2026 Target)

| From | To | Asset | Mechanism |
|---|---|---|---|
| Ethereum | Stellar | USDC | Circle CCTP |
| Polygon | Stellar | USDC | Circle CCTP |
| Solana | Stellar | USDC | Circle CCTP |
| Any chain | Stellar | XLM | Stellar DEX swap |
| Stellar | Any chain | USDC | Circle CCTP reverse |

---

## 2026 Roadmap: Nebula-DAO & Protocol Decentralization

### Q1 2026 — Foundation (Current)
- [x] V3 splitter contract deployed on Soroban testnet
- [x] Scheduled splits, pull-based splits, 5-of-7 council recovery
- [x] WASM-size guard and binary optimization
- [x] Gas-Tank Quick Refill (one-click shortfall deposit)
- [ ] V3 frontend dashboard (split wizard, gas management tile)
- [ ] Soroban mainnet deployment

### Q2 2026 — Nebula-DAO Bootstrap
- [ ] Deploy Nebula-DAO governance contract on Soroban
- [ ] Token-weighted voting for protocol parameter changes (fee, treasury)
- [ ] Transition quorum from 3-of-3 multisig to DAO proposal system
- [ ] Public bug bounty program launch
- [ ] Audit by a Soroban-specialized security firm

### Q3 2026 — Cross-Chain Interoperability (X-Ray Layer v1)
- [ ] Circle CCTP integration for USDC bridging (Ethereum ↔ Stellar)
- [ ] Cross-chain intent router (alpha, permissioned)
- [ ] Unified disbursement dashboard (multi-chain view)
- [ ] Horizon indexer v2 with cross-chain event normalization

### Q4 2026 — Full Decentralization
- [ ] Admin key handoff to Nebula-DAO (no more multisig owner)
- [ ] Open cross-chain intent router (permissionless)
- [ ] V4 research: streaming + splitting composability (stream a split, split a stream)
- [ ] Developer SDK release (`@stellarstream/sdk`) for third-party integrations
- [ ] Grant program for ecosystem builders via Nebula-DAO treasury

---

## For Builders

StellarStream V3 is open-source and contribution-ready. Every layer is decoupled:

- **Smart contract engineers** — `contracts/splitter-v3` (Rust + Soroban)
- **Frontend developers** — `frontend/` (Next.js 14, Framer Motion, Freighter)
- **Backend engineers** — `backend/` (Node.js, PostgreSQL, Horizon indexer)

See [CONTRIBUTING.md](../docs/CONTIBUTING.md) and open issues for where to start.

---

*StellarStream — Real-time, linear asset streaming on the Stellar Network.*
*Built for the Drips Stellar Wave.*

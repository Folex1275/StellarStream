
# StellarStream 🌊
**Real-time, linear asset streaming on the Stellar Network.**

StellarStream is a decentralized, non-custodial protocol built on Soroban. It enables "Money as a Stream"—allowing assets to flow from senders to receivers second-by-second based on the ledger timestamp. 

This project moves away from traditional lump-sum payroll cycles, offering instant liquidity for employees, freelancers, and service providers while reducing trust requirements between parties.

---

## 🚀 The Concept: How it Works
Traditional payments are discrete events. StellarStream treats payment as a continuous function of time. Once a stream is initialized, the smart contract "unlocks" a portion of the total funds every time a new ledger is closed on the Stellar network.

### The Mathematical Engine
The contract calculates the "Unlocked Balance" using the following linear formula:

$$Unlocked = \frac{TotalAmount \times (CurrentTime - StartTime)}{EndTime - StartTime}$$

* **CurrentTime**: The timestamp of the latest ledger.
* **StartTime**: The moment the stream begins.
* **EndTime**: The moment the stream is fully vested.

---

## ✨ Features in Detail

### 1. Second-by-Second Liquidity
Receivers do not need to wait for the stream to end. They can call the `withdraw` function at any moment to pull the currently unlocked portion of funds into their wallet.

### 2. Programmable Cancellations
Either party (or just the sender, depending on configuration) can terminate the stream early. 
* **Receiver** gets the pro-rated amount earned up to that exact second.
* **Sender** is automatically refunded the remaining "unearned" balance.

### 3. Native Asset Support
StellarStream utilizes the **Soroban Token Interface**, making it compatible with:
* **Fiat Stablecoins**: USDC, BRLG, ARST.
* **Stellar Assets**: Wrapped XLM and other SAC-compliant tokens.

---

## 🛠 Project Structure

This repository is organized as a modular monorepo. Each layer is decoupled to allow specialized development without cross-dependencies during the build phase.

### Directory Mapping
```text
StellarStream/
├── contracts/               # THE CORE PROTOCOL (Rust + Soroban)
│   ├── src/
│   │   ├── lib.rs           # Main entry points (initialize, withdraw, cancel)
│   │   ├── types.rs         # Data structures (Stream, UserProfile)
│   │   ├── math.rs          # Precise fixed-point arithmetic for streaming
│   │   ├── validation.rs    # Safety guards (TTL, Auth, Bounds)
│   │   └── errors.rs        # Custom Error Enum with 40+ variants
│   └── tests/               # Comprehensive test suite (try_ pattern)
│
├── frontend/                # THE USER DASHBOARD (Next.js 14)
│   ├── src/
│   │   ├── components/      # "Ticking" balance UI, Stream cards
│   │   ├── hooks/           # Soroban-Client & Freighter Wallet hooks
│   │   ├── store/           # Global state for active streams (Zustand/Redux)
│   │   └── layout/          # Responsive Dashboard for Senders/Receivers
│
├── backend/                 # THE ANALYTICS LAYER (Node.js + TS)
│   ├── src/
│   │   ├── indexer/         # Event listener for Horizon/Soroban-RPC
│   │   ├── db/              # PostgreSQL schema for historical data
│   │   └── api/             # REST/GraphQL endpoints for stream stats
│
└── docs/                    # Technical specs and Wave assets
```

---

## 🤝 How to Contribute
We follow an Issue-Oriented workflow. Contributors should assign themselves to an issue before starting work.

### Folder-Specific Guidelines

#### 🦀 Smart Contract Engineers (/contracts)
**Focus**: State management, security, and gas optimization.

**Setup**: Requires rustup and soroban-cli.

**Rule**: No logic changes without a corresponding test update. Use cargo test before submitting PRs.

#### ⚛️ Frontend Developers (/frontend)
**Focus**: UX/UI, real-time data visualization, and wallet connectivity.

**Setup**: npm install inside the directory.

**Rule**: Components must be responsive. Use framer-motion for the ticking number animations.

#### 🗄️ Backend Engineers (/backend)
**Focus**: Indexing performance, data persistence, and API reliability.

**Setup**: Docker-compose is provided for local DB setup.

**Rule**: The indexer must be idempotent and capable of handling ledger rollbacks.

---

## 📖 Developer Resources

### API Documentation
* **V3 API Reference (Swagger UI)**: `http://localhost:3000/api/v3/docs`
* **Legacy V1 API**: `http://localhost:3000/api/v1/docs`

For detailed integration guides, see the [/docs](/docs) directory.

---

## 🚦 Getting Started

1. **Clone the Repository:**
```bash
git clone https://github.com/your-username/stellar-stream.git
cd stellar-stream
```

2. **Build Contracts:**
```bash
cd contracts
soroban contract build
```

3. **Run Frontend:**
```bash
cd ../frontend
npm install
npm run dev
```

---

Built for the Drips Stellar Wave. Pushing the boundaries of real-time finance.

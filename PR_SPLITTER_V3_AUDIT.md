# feat: Splitter V3 — CSV Wizard, Virtualized Grid, V3 Layout & Weekly Ledger Audit

## Summary

This PR implements four issues in a single cohesive branch, all centred on the V3 Splitter workflow and backend financial integrity:

| # | Issue | Label | File(s) |
|---|-------|-------|---------|
| 1 | CSV Upload Wizard with column mapping | `[Frontend][UX-Logic][Medium]` | `frontend/features/splitter/CsvUploadWizard.tsx` |
| 2 | Virtualized Recipient Data Grid | `[Frontend][UX][Hard]` | `frontend/features/splitter/VirtualRecipientGrid.tsx` |
| 3 | V3 Splitter Foundational Layout | `[Frontend][Architecture][High]` | `frontend/features/splitter/SplitterV3Layout.tsx` |
| 4 | Weekly Ledger Audit Worker | `[Backend][Audit][Hard]` | `backend/src/services/weekly-ledger-audit.service.ts` `backend/src/weekly-ledger-audit.worker.ts` |

---

## 1 · CSV Upload Wizard (`CsvUploadWizard.tsx`)

**What it does:** A 3-step wizard that lets users upload a CSV and map their own column headers to the protocol's required `address` and `amount` fields before importing.

**Steps:**
- **Upload** — Drag-and-drop zone (native HTML5, no extra dependency) or file-browse. Accepts `.csv` only; shows an error for other formats or empty files.
- **Map** — Auto-detects common aliases (`Payee`, `Wallet`, `Public Key` → `address`; `Value`, `Qty` → `amount`) via an alias table. User can override any mapping with a dropdown. A live preview table shows the first 5 rows with column → field annotations.
- **Preview & Confirm** — Full row list with per-row validity badge (G-address check). Summary badges show valid/invalid counts. Only valid rows are passed to `onComplete`.

**Error states handled:**
- Non-CSV file type
- Empty or unparseable CSV
- No headers found
- Attempting to advance without mapping an address column
- Invalid G-addresses flagged in preview (amber badge, not blocked — user can still import valid rows)

---

## 2 · Virtualized Recipient Data Grid (`VirtualRecipientGrid.tsx`)

**What it does:** A spreadsheet-style data grid that handles 120+ rows without lag.

**Virtualization strategy:** CSS `content-visibility: auto` with `contain-intrinsic-size` per row. The browser skips layout and paint for off-screen rows, giving near-identical performance to `react-window` without adding a dependency.

**Keyboard shortcuts:**
- `Tab` — move to next cell; wraps to first cell of next row
- `Tab` on last cell of last row — appends a new empty row
- `Enter` on last row — appends a new empty row
- `Shift+Enter` — inserts a row below the current one

**Inline validation (per keystroke):**
- **Address:** must start with `G`, length exactly 56, base32 charset `[A-Z2-7]`
- **Amount:** must be a positive number

Validation errors appear inline (amber border + short label inside the cell). A stats bar above the grid shows row count, total amount, and error count.

---

## 3 · V3 Splitter Foundational Layout (`SplitterV3Layout.tsx`)

**What it does:** The top-level workspace that composes the grid and wizard into a complete V3 Splitter experience.

**Layout:**
- **Sticky header** — Asset Selector (USDC / XLM / BRLG / ARST) and Split Mode toggle (⚡ Push vs ⬇ Pull). Both persist across all wizard steps. Step breadcrumb shows current position.
- **Two-column body** — Left column holds the `VirtualRecipientGrid` plus a collapsible CSV import accordion (`CsvUploadWizard`). Right column is a sticky `Split Summary Sidebar` showing recipient count, total amount, mode, and validation error count.

**Three workflow states (Framer Motion `AnimatePresence`):**
- **Setup** — Grid editing + CSV import. Advance button disabled until all rows are valid.
- **Review** — Read-only table of filled rows. Back to setup or confirm to execute.
- **Execute** — Confirmation screen with loading state during simulated tx submission, then a spring-animated success checkmark.

---

## 4 · Weekly Ledger Audit Worker

**What it does:** A high-integrity background worker that runs once a week to cross-reference every `Stream` row in the database against the Stellar ledger's on-chain `ContractEvent` records.

### `WeeklyLedgerAuditService`

- Loads all `Stream` rows for the configured `SPLITTER_CONTRACT_ID`
- Loads all indexed `stream_created` `ContractEvent` rows from the DB
- Cross-references by `txHash`: checks that `Stream.amount` matches the `total_amount` field in the decoded event JSON
- Flags two mismatch types:
  - `amount_mismatch` — DB amount ≠ on-chain event amount
  - `missing_on_chain` — stream in DB has no corresponding on-chain event
- `extractAmount()` handles multiple JSON shapes across contract versions (`total_amount`, `amount`, `data.total_amount`)
- **Read-only** — never mutates financial records; remediation is a manual ops step

### `WeeklyLedgerAuditWorker`

- Follows the existing `DataIntegrityWorker` / `StaleStreamCleanupWorker` class pattern
- Scheduled via `node-cron`: **Sunday 03:00 UTC** (`0 3 * * 0`)
- Guards against overlapping runs with an `isRunning` flag
- Persists the full `AuditReport` (including mismatch list) to the `AuditLog` table via `AuditLogService` for ops traceability
- Logs zero-discrepancy pass at `info` level; flags discrepancies at `warn` level

**To register the worker**, add to `backend/src/index.ts`:
```ts
import { WeeklyLedgerAuditWorker } from './weekly-ledger-audit.worker.js';
const ledgerAuditWorker = new WeeklyLedgerAuditWorker();
ledgerAuditWorker.start();
```

**Required env vars:**
```
SPLITTER_CONTRACT_ID=C...   # Soroban contract address
SOROBAN_RPC_URL=https://...  # defaults to testnet
```

---

## Checklist

- [x] Components are responsive (Tailwind flex/grid, `max-w-7xl` container)
- [x] Framer Motion used for all transitions (wizard steps, CSV accordion, execute success)
- [x] No new runtime dependencies added (uses `papaparse`, `framer-motion`, `lucide-react`, `node-cron` already in project)
- [x] Worker follows existing class pattern with `start()` / `stop()` lifecycle
- [x] Worker is idempotent — `isRunning` guard prevents overlapping runs
- [x] Audit worker is read-only — zero risk of data mutation
- [x] All commits are atomic and scoped to a single feature

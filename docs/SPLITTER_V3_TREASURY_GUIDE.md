# StellarStream V3 Splitter — Treasury Manager & Accountant Guide

This guide explains how to use the V3 Splitter to distribute funds to multiple recipients in one transaction. No technical background is required.

---

## What is the V3 Splitter?

The Splitter lets you send a single pool of funds to many recipients at once. You define who gets paid and how much (or what percentage), upload a file, and the contract handles the rest.

---

## Part 1: CSV Formatting & Bulk Import

### Step 1 — Prepare your spreadsheet

Create a spreadsheet with the following columns. Column names are **not** case-sensitive.

| Address | Amount | memo_type | memo |
|---|---|---|---|
| G... | 500.00 | text | Invoice #1042 |
| G... | 250.00 | none | |
| G... | 1250.00 | id | 9901 |

**Required columns:**
- `Address` (also accepted: `Public Key` or `public_key`) — the recipient's Stellar public key (starts with `G`)
- `Amount` — a positive number with up to 7 decimal places (e.g. `100`, `99.50`, `0.0000001`)

**Optional columns:**
- `memo_type` — one of `none`, `text`, or `id` (defaults to `none` if omitted)
- `memo` — the memo value; only used when `memo_type` is `text` or `id`

### Step 2 — Export as CSV

In Excel or Google Sheets: **File → Download → Comma-separated values (.csv)**

### Step 3 — Upload in the dashboard

1. Go to **Dashboard → Splitter**
2. Click **Import CSV / JSON**
3. Select your `.csv` file
4. Review the recipient table — any rows with errors are highlighted in red with a reason
5. Fix errors in your spreadsheet, re-export, and re-upload if needed
6. Click **Execute Split** when the table looks correct

### Common import errors and fixes

| Error message | What to do |
|---|---|
| `Missing required columns` | Make sure your header row contains `Address` and `Amount` |
| `Invalid Stellar address` | Check the public key starts with `G` and is exactly 56 characters |
| `Invalid amount` | Remove currency symbols (`$`, `USDC`), commas, and spaces — use plain numbers only |
| `CSV parse error` | Re-save the file as UTF-8 CSV; avoid special characters in memo fields |

> **Tip:** JSON is also accepted. Each entry must be an object with `address` and `amount` keys.

---

## Part 2: Fixed-Amount vs. Percentage-Based Splits

The V3 Splitter supports two ways to define how funds are divided.

### Fixed-Amount Split

Each recipient receives a specific token amount that you set directly.

**How it works:**
- You enter exact amounts per recipient in the `Amount` column of your CSV
- The total of all amounts equals the total you deposit into the contract
- The contract transfers each amount directly to each recipient

**Best for:**
- Payroll runs where each employee has a fixed salary
- Invoice payments where each vendor has a specific amount owed
- One-off disbursements with known amounts

**Example:**

| Address | Amount |
|---|---|
| Alice's address | 2000.00 |
| Bob's address | 1500.00 |
| Carol's address | 500.00 |

Total deposited: **4000.00 USDC**

---

### Percentage-Based Split

Each recipient receives a defined share of the total pool, expressed in **basis points (bps)**.

> 1 basis point = 0.01%
> 100 bps = 1%
> 10,000 bps = 100%
> All shares **must add up to exactly 10,000 bps**

**How it works:**
- You define each recipient's `share_bps` value
- The contract calculates each recipient's amount as: `total × (share_bps ÷ 10,000)`
- Protocol fees and affiliate fees (if any) are deducted from the total before distribution

**Best for:**
- Revenue sharing between partners (e.g. 60/30/10 split)
- DAO treasury distributions where proportions are fixed by governance
- Profit-sharing arrangements

**Example — 60/30/10 split of 10,000 USDC:**

| Recipient | share_bps | Amount received |
|---|---|---|
| Partner A | 6,000 | 6,000.00 USDC |
| Partner B | 3,000 | 3,000.00 USDC |
| Partner C | 1,000 | 1,000.00 USDC |
| **Total** | **10,000** | **10,000.00 USDC** |

> **Note:** Percentage-based splits are configured in the dashboard's recipient table — not through CSV import (which uses fixed amounts).

---

### Quick comparison

| | Fixed-Amount | Percentage-Based |
|---|---|---|
| Input | Exact token amounts | Basis points (bps) |
| Shares must sum to | Total deposited | 10,000 bps |
| Best for | Payroll, invoices | Revenue share, DAO |
| CSV import supported | Yes | No (use dashboard) |

---

## Part 3: FAQ

### What happens if a recipient doesn't have a trustline?

On Stellar, a wallet must establish a **trustline** for a token before it can receive it. If a recipient hasn't done this, a standard (push) transfer to their address will fail.

**The V3 Splitter handles this automatically with pull-based splits.**

When you use **Claimable Split** (`split_pull`) from the dashboard:

1. The contract credits each recipient's balance internally — no token transfer happens yet
2. Recipients with missing trustlines are **not skipped or penalised** — their funds are held safely in the contract
3. Each recipient can establish their trustline at any time, then click **Claim** in the dashboard to pull their funds out
4. You can check any recipient's unclaimed balance via **Dashboard → Splitter → Claimable Balances**

**In short:** use Claimable Split whenever you are unsure whether all recipients have trustlines set up. Their funds will wait for them.

---

### Can I mix recipients with and without trustlines in one split?

Yes — with a Claimable Split, all recipients are handled in the same transaction. Those with trustlines can claim immediately; those without can claim later once they add the trustline.

---

### What if I upload a CSV with a wrong address?

The dashboard validates every address before the split executes. Rows with invalid addresses are flagged in red and excluded. The split will not proceed until all rows are valid, so no funds can be sent to a wrong address by mistake.

---

### Can I schedule a split for a future date?

Yes. Use **Scheduled Split** in the dashboard. You lock the funds now and set a release date. The split executes once that date is reached. You can cancel and reclaim the funds at any time before then.

---

### What fees does the Splitter charge?

A small protocol fee (maximum 5%) is deducted from the total before distribution. The exact percentage is shown on the confirmation screen before you execute. If an affiliate code is used, an additional 0.1% is routed to the affiliate.

---

### Who can execute a split?

The wallet that initiates and signs the transaction. For high-value disbursements, the contract supports a **multi-sig approval flow** where multiple admins must approve before execution.

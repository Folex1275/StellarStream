# Institutional Payroll & Revenue Share
## User Manual for Finance Departments & Treasury Managers

**Document Version:** 1.0  
**Last Updated:** April 27, 2026  
**Audience:** Finance Teams, Treasury Managers, Payroll Administrators  
**Labels:** [Docs] [User-Onboarding] [Medium]

---

## Table of Contents

1. [Introduction](#introduction)
2. [Getting Started](#getting-started)
3. [Step-by-Step: Bulk-Entry Grid Walkthrough](#step-by-step-bulk-entry-grid-walkthrough)
4. [CSV Formatting & Auto-Mapping Guide](#csv-formatting--auto-mapping-guide)
5. [Understanding Flow Maps](#understanding-flow-maps)
6. [Proof-of-Payment PDFs](#proof-of-payment-pdfs)
7. [FAQ: Gas Fees & Trustline Requirements](#faq-gas-fees--trustline-requirements)
8. [Troubleshooting](#troubleshooting)
9. [Support & Resources](#support--resources)

---

## Introduction

### What is StellarStream?

StellarStream is an institutional-grade payment distribution platform built on the Stellar blockchain. It enables finance departments to:

- **Process bulk payroll** to hundreds or thousands of recipients simultaneously
- **Automate revenue sharing** with stakeholders, partners, and token holders
- **Track payments** with real-time visual flow maps and blockchain-verified receipts
- **Ensure compliance** with built-in trustline validation and audit trails

### Key Benefits

✅ **Speed:** Process 1,000+ payments in a single transaction batch  
✅ **Transparency:** Real-time visual tracking of capital flows globally  
✅ **Auditability:** Blockchain-verified proof-of-payment PDFs for every disbursement  
✅ **Cost-Effective:** Significantly lower fees compared to traditional banking rails  
✅ **Multi-Asset:** Support for XLM, USDC, EURC, and custom Stellar assets  

---

## Getting Started

### Prerequisites

Before processing your first bulk payment, ensure you have:

1. **Stellar Wallet:** A funded Stellar account (testnet or mainnet)
2. **Asset Balance:** Sufficient funds for the payment amounts + network fees
3. **Recipient List:** CSV file or manual entry of recipient addresses and amounts
4. **Browser:** Modern web browser (Chrome, Firefox, Edge, or Safari)

### Navigation

Access the Institutional Payroll module from your dashboard:

```
Dashboard → V3 Splitter → Institutional Payroll & Revenue Share
```

---

## Step-by-Step: Bulk-Entry Grid Walkthrough

### Overview

The Bulk-Entry Grid is your primary interface for managing payment recipients. It allows you to add, edit, validate, and batch-process payments to multiple recipients simultaneously.

### Step 1: Accessing the Grid

1. Navigate to **V3 Splitter** from your dashboard
2. Select **"Institutional Payroll"** or **"Revenue Share"** mode
3. The grid appears with an empty recipient table

### Step 2: Adding Recipients

You have three options to populate the grid:

#### Option A: Manual Entry
- Click the **"+ Add Recipient"** button at the bottom of the grid
- Fill in each field for the new row:
  - **Address:** Stellar public key (starts with `G...`) or federation address (e.g., `*stellar.org`)
  - **Asset:** Select from dropdown (XLM, USDC, EURC, SRT)
  - **Amount:** Payment amount (numeric, decimals supported)
  - **Memo Type:** Optional (None, Text, or ID)
  - **Memo Value:** Optional reference for the recipient

#### Option B: CSV Import
- Click **"Import CSV"** in the top-right corner
- Select your properly formatted CSV file (see [CSV Formatting Guide](#csv-formatting--auto-mapping-guide))
- The system auto-validates and displays results

#### Option C: Bulk Upload (Advanced)
- Drag and drop a `.csv` or `.json` file onto the upload zone
- Review the validation summary:
  - ✅ **Green badge:** Valid records count
  - ⚠️ **Red badge:** Error count (if any)
- Resolve any conflicts using the **Conflict Resolver** (appears if errors detected)

### Step 3: Understanding the Grid Layout

```
┌───┬──────────────────────────────────┬────────┬────────┬───────────┬───────────────────┬───┐
│ ☐ │ Address                          │ Asset  │ Amount │ Memo Type │ Memo Value        │ ✕ │
├───┼──────────────────────────────────┼────────┼────────┼───────────┼───────────────────┼───┤
│ ☐ │ GABC123...XYZ                    │ USDC   │ 1500.00│ ID        │ 987654321         │ ✕ │
│ ☐ │ GDEF456...UVW                    │ XLM    │ 250.50 │ Text      │ payroll-apr-2026  │ ✕ │
│ ☐ │ *bob*stellar.org                 │ USDC   │ 3200.00│ None      │ —                 │ ✕ │
└───┴──────────────────────────────────┴────────┴────────┴───────────┴───────────────────┴───┘
```

**Column Descriptions:**

| Column | Description | Requirements |
|--------|-------------|--------------|
| **Checkbox** | Select rows for bulk actions | Click to select/deselect |
| **Address** | Recipient's Stellar address | Must be valid G-address or federation name |
| **Asset** | Token to send | XLM, USDC, EURC, or SRT |
| **Amount** | Payment amount | Positive number, decimals allowed |
| **Memo Type** | Optional identifier | None, Text (≤28 bytes), or ID (u64 integer) |
| **Memo Value** | Memo content | Required if Memo Type is not "None" |
| **✕** | Delete row | Removes recipient from grid |

### Step 4: Bulk Selection & Actions

When you select **2 or more recipients**, a bulk action toolbar appears:

**Available Bulk Actions:**

1. **🗑️ Delete Selected**
   - Removes all selected rows from the grid
   - Confirmation not required (action is reversible via undo)

2. **×2 Multiply Amount**
   - Doubles the amount for all selected recipients
   - Useful for bonuses or adjustments

3. **🔄 Change to USDC**
   - Switches the asset to USDC for selected rows
   - Ensures uniform asset distribution

4. **Clear Selection**
   - Deselects all rows without modifying data

### Step 5: Validation & Error Handling

The grid performs real-time validation:

**Visual Indicators:**

- ⚠️ **Amber warning icon** next to address: Missing trustline for selected asset
- 🔴 **Red border** on memo field: Invalid memo format
- 🟢 **Green checkmark:** All validations passed

**Common Validation Errors:**

| Error | Cause | Solution |
|-------|-------|----------|
| "Invalid Stellar address" | Malformed G-address | Verify address format (56 characters, starts with G) |
| "Invalid amount" | Negative or non-numeric value | Enter positive number (e.g., `1500.00`) |
| "Text memo must be ≤ 28 bytes" | Memo too long | Shorten memo or use ID type |
| "ID memo exceeds u64 max" | Number too large | Use value ≤ 18,446,744,073,709,551,615 |
| Amber trustline warning | Recipient lacks asset trustline | Run preflight check or switch to claim-based mode |

### Step 6: Trustline Preflight Check

Before executing payments, validate recipient readiness:

1. Click **"Run Preflight Check"** button above the grid
2. System scans all recipient addresses for asset trustline status
3. Results display:
   - ✅ **Green banner:** All recipients have required trustline
   - ⚠️ **Amber banner:** Lists recipients missing trustline

**If Trustlines Are Missing:**

- **Option 1:** Click **"Fix All → Claim-Based"** to switch to Pull mode (recipients claim payments manually)
- **Option 2:** Contact recipients to set up trustlines before proceeding
- **Option 3:** Remove affected recipients from the batch

### Step 7: Execute Payment

Once validation is complete:

1. Review the recipient summary (total count, total amount)
2. Click **"Execute Split"** or **"Dispatch Batch"**
3. Confirm transaction in your wallet
4. Monitor progress via the **Capital Flow Map** (see next section)

**Batch Processing:**

- Large batches are automatically split into smaller transactions
- Each batch processes sequentially
- Failed batches can be retried without duplicating successful payments

---

## CSV Formatting & Auto-Mapping Guide

### Supported File Formats

StellarStream accepts:
- **CSV** (Comma-Separated Values)
- **JSON** (JavaScript Object Notation)

### CSV Format Requirements

#### Required Columns

Your CSV **must** include these columns (case-insensitive):

| Column Name | Aliases | Description | Example |
|-------------|---------|-------------|---------|
| **Address** | `Public Key`, `Public_Key` | Recipient's Stellar address | `GABC123...XYZ` |
| **Amount** | *(none)* | Payment amount | `1500.00` |

#### Optional Columns

| Column Name | Description | Valid Values | Example |
|-------------|-------------|--------------|---------|
| **Asset** | Token to send | `XLM`, `USDC`, `EURC`, `SRT` | `USDC` |
| **Memo_Type** | Memo identifier type | `none`, `text`, `id` | `text` |
| **Memo** | Memo content | Text (≤28 bytes) or numeric ID | `payroll-apr` |

### CSV Template Examples

#### Example 1: Minimal CSV (Address + Amount Only)

```csv
Address,Amount
GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA1,1500.00
GBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB2,250.50
GCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCC3,3200.00
```

#### Example 2: Full CSV (All Fields)

```csv
Address,Amount,Asset,Memo_Type,Memo
GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA1,1500.00,USDC,id,987654321
GBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB2,250.50,XLM,text,payroll-apr-2026
GCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCC3,3200.00,USDC,none,
```

#### Example 3: Using Aliases

```csv
Public Key,Amount,Asset
GDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDD4,5000.00,USDC
*alice*stellar.org,1200.00,XLM
```

### JSON Format Requirements

For JSON files, structure as an array of objects:

```json
[
  {
    "address": "GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA1",
    "amount": "1500.00",
    "asset": "USDC",
    "memo_type": "id",
    "memo": "987654321"
  },
  {
    "address": "GBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB2",
    "amount": "250.50",
    "asset": "XLM",
    "memo_type": "text",
    "memo": "payroll-apr-2026"
  }
]
```

**Note:** JSON key matching is **case-insensitive**. All of these work:
- `address`, `Address`, `ADDRESS`
- `public key`, `Public_Key`, `PUBLIC_KEY`
- `memo_type`, `Memo_Type`, `MEMO_TYPE`

### Auto-Mapping Explained

StellarStream's **Auto-Mapping** feature automatically:

1. **Detects column headers** regardless of case or spacing
2. **Recognizes aliases** (e.g., "Public Key" → "Address")
3. **Validates data types** during import
4. **Reports errors** with row numbers for easy correction

**Auto-Mapping Process:**

```
Your CSV File          →  StellarStream Parser        →  Recipient Grid
┌──────────────┐          ┌──────────────────┐          ┌──────────────┐
│ Address      │  ────▶   │ Case-insensitive │  ────▶   │ Address col. │
│ amount       │          │ header matching  │          │ Amount col.  │
│ MEMO_TYPE    │          │ Alias resolution │          │ Memo Type    │
│ Asset        │          │ Type validation  │          │ Asset col.   │
└──────────────┘          └──────────────────┘          └──────────────┘
```

### Import Workflow

1. **Upload File:**
   - Drag-and-drop onto upload zone, or
   - Click **"Import CSV"** / **"Browse"** button

2. **Validation Summary Appears:**
   - ✅ **Green badge:** `X valid records`
   - ⚠️ **Red badge:** `Y errors` (if applicable)

3. **Handle Errors (if any):**
   - Review error messages in **Conflict Resolver**
   - Fix issues in your source file, or
   - Discard invalid rows and import valid ones only

4. **Auto-Import:**
   - If **zero errors**, valid records automatically populate the grid
   - If **errors present**, resolve conflicts before import completes

### Best Practices

✅ **Use headers:** Always include a header row  
✅ **UTF-8 encoding:** Save CSV files as UTF-8 to support special characters  
✅ **No extra spaces:** Trim leading/trailing whitespace from values  
✅ **Test with small batch:** Import 5-10 rows first to verify format  
✅ **Keep backups:** Maintain original CSV files for audit records  

❌ **Don't use formulas:** Remove Excel formulas before exporting to CSV  
❌ **Don't include totals:** Exclude summary rows from payment data  
❌ **Don't use merged cells:** Flatten all data before export  

---

## Understanding Flow Maps

### What is a Capital Flow Map?

The **Capital Flow Map** is an interactive visual representation of your payment distribution. It shows animated "beams" of capital flowing from your wallet to recipients across a global map.

### Accessing the Flow Map

The Flow Map appears automatically during the **Execute phase**:

1. After clicking **"Execute Split"**
2. While batches are processing on the blockchain
3. In the payment history/details view for completed transactions

### Reading the Flow Map

```
┌──────────────────────────────────────────────────────────────────┐
│  🌐 Capital Flow Map                              [● Executing]  │
│                                                                  │
│         (Sender)                                                 │
│           ● ────────────┐                                        │
│                         │                                        │
│              ┌──────────┼──────────┐                              │
│              │          │          │                              │
│         North America  Europe   East Asia                         │
│              ●           ●          ●                              │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ Flow Filter                      [Replay]               │    │
│  │                                                         │    │
│  │ [USDC Only]                                             │    │
│  │                                                         │    │
│  │ Delivery Status:                                        │    │
│  │ [Delivered] [In Transit] [Pending]                      │    │
│  │                                                         │    │
│  │ Showing 47 of 50 flows · USDC only (42)                 │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
│  Legend: ● Sender  ○ Recipient  ⬡ Bridge  ─ Capital beam        │
└──────────────────────────────────────────────────────────────────┘
```

### Visual Elements

| Element | Appearance | Meaning |
|---------|------------|---------|
| **Sender Node** | Cyan circle (larger, glowing) | Your wallet address (origin of funds) |
| **Recipient Nodes** | Small circles on map | Payment destinations |
| **Capital Beams** | Animated cyan lines with moving dots | Active payment transactions |
| **Static Lines** | Dashed, dim lines | Payment routes (when not executing) |
| **Bridge Nodes** | Colored circles with chain labels | Cross-chain transfers (Polygon, Ethereum, etc.) |

### Interactive Features

#### 1. Filter Controls

Located in the **Flow Filter** panel (top-right):

**USDC Only Toggle:**
- Shows/hides non-USDC payments
- Useful for isolating specific asset flows

**Delivery Status Filters:**
- **Delivered:** Payments confirmed on-chain
- **In Transit:** Payments processing (awaiting confirmation)
- **Pending:** Payments queued but not yet sent

Click a status to toggle visibility. Multiple statuses can be active simultaneously.

#### 2. Replay Animation

- Click **"Replay"** button to re-watch the payment animation
- Helpful for presentations or verifying distribution patterns
- Does **not** re-execute payments (view-only)

#### 3. Bridge Routes

If your payment includes cross-chain transfers:

- Bridge nodes display the **destination chain** (e.g., `⬡ Polygon`)
- **Breadcrumb trail** shows path: `Sender → Stellar → Bridge → Destination Chain`
- Color-coded by chain:
  - 🟣 **Polygon:** Purple (#8247e5)
  - 🔵 **Ethereum:** Blue (#627eea)
  - 🔵 **Arbitrum:** Light blue (#28a0f0)
  - 🔵 **Base:** Royal blue (#0052ff)
  - 🟣 **Solana:** Purple (#9945ff)

### Geographic Mapping

Recipient addresses are mapped to regions **deterministically** based on their Stellar address:

| Region | Map Position | Approximate Coordinates |
|--------|--------------|-------------------------|
| North America | Top-left | (160, 130) |
| South America | Bottom-left | (220, 230) |
| Western Europe | Center-top | (390, 110) |
| Eastern Europe | Center-top-right | (450, 100) |
| West Africa | Center-left | (370, 190) |
| East Africa | Center | (450, 200) |
| Middle East | Center-right | (490, 140) |
| South Asia | Right-center | (560, 160) |
| East Asia | Top-right | (640, 130) |
| Southeast Asia | Right-center-bottom | (630, 185) |
| Oceania | Bottom-right | (680, 240) |

**Note:** This is a **visual approximation** for display purposes. Actual recipient locations are not tracked—mapping is based on address hash for privacy.

### Status Indicators

**Header Badge:**

- 🟢 **Executing** (pulsing cyan dot): Batches are actively processing
- ⚪ **Completed** (no badge): All payments finished
- 🔴 **Failed** (if applicable): One or more batches encountered errors

### Using Flow Maps for Reporting

Flow Maps are valuable for:

✅ **Executive Presentations:** Show global payment distribution visually  
✅ **Audit Compliance:** Demonstrate fund routing and delivery status  
✅ **Treasury Management:** Monitor in-transit vs. completed payments  
✅ **Cross-Chain Tracking:** Verify bridge transfers to other networks  

**Screenshot Tip:** Use the "Replay" feature and capture the map during animation for dynamic reports.

---

## Proof-of-Payment PDFs

### What is a Proof-of-Payment PDF?

A **Proof-of-Payment PDF** is an official, blockchain-verified receipt generated for each payment transaction. It serves as:

- 📄 **Audit documentation** for finance departments
- 🧾 **Tax records** for accounting purposes
- ✅ **Compliance evidence** for regulatory requirements
- 🔍 **Verification tool** for recipients

### Generating Proof-of-Payment PDFs

#### Method 1: From Payment Details

1. Navigate to **Payment History** or **Transaction Details**
2. Locate the completed payment
3. Click **"Download Proof of Payment"** button
4. PDF downloads automatically with filename: `proof-of-payment-[TXHASH].pdf`

#### Method 2: Bulk Export (Admin Feature)

1. Go to **Disbursement Report Builder**
2. Select date range or transaction IDs
3. Click **"Generate PDF Reports"**
4. System creates individual PDFs for each payment

### Understanding the PDF Layout

```
┌──────────────────────────────────────────────────────────────────┐
│ ███████████████████████████████████████████████████████████████  │
│                                                                  │
│ StellarStream                              ✦ NEBULA-V3-VERIFIED  │
│ Proof of Payment                                                 │
│                                                                  │
│ ───────────────────────────────────────────────────────────────  │
│                                                                  │
│ STREAM ID        SPLIT-2026-04-27-001                            │
│ SENDER           GABC...XYZ (Your Wallet)                        │
│ RECEIVER         GDEF...UVW (Recipient)                          │
│ ASSET            USDC                                            │
│ AMOUNT           1,500.00                                        │
│ TIMESTAMP        2026-04-27T14:32:15.000Z                        │
│ TX HASH          abc123def456... (64-character hash)             │
│                                                                  │
│                              ┌──────────┐                        │
│                              │ QR CODE  │                        │
│                              │          │                        │
│                              └──────────┘                        │
│                              Scan to verify on ledger            │
│                                                                  │
│ ───────────────────────────────────────────────────────────────  │
│ Generated 2026-04-27T14:35:00.000Z · StellarStream Nebula V3    │
│ ███████████████████████████████████████████████████████████████  │
│                                                                  │
│            [NEBULA-V3-VERIFIED watermark (diagonal)]             │
└──────────────────────────────────────────────────────────────────┘
```

### PDF Components Explained

#### 1. Header Section

- **StellarStream Logo:** Brand identifier
- **Document Title:** "Proof of Payment"
- **Verification Badge:** `✦ NEBULA-V3-VERIFIED` (cyan box, top-right)
  - Indicates payment was processed through Nebula V3 protocol
  - Confirms blockchain verification

#### 2. Payment Details

| Field | Description | Example |
|-------|-------------|---------|
| **Stream ID** | Unique identifier for the payment stream | `SPLIT-2026-04-27-001` |
| **Sender** | Your Stellar wallet address | `GABC123...XYZ` (abbreviated) |
| **Receiver** | Recipient's Stellar wallet address | `GDEF456...UVW` (abbreviated) |
| **Asset** | Token that was transferred | `USDC`, `XLM`, `EURC` |
| **Amount** | Payment amount (formatted) | `1,500.00` |
| **Timestamp** | Date/time of transaction (ISO 8601) | `2026-04-27T14:32:15.000Z` |
| **Tx Hash** | 64-character blockchain transaction hash | `abc123def456...` (full hash) |

#### 3. QR Code

- **Purpose:** Links to Stellar Explorer for independent verification
- **Scanning:** Use any QR code reader or smartphone camera
- **Destination URL:** `https://stellar.expert/explorer/public/tx/[TXHASH]`
- **Verification:** Confirms payment exists on public blockchain

#### 4. Watermark

- **Text:** `NEBULA-V3-VERIFIED` (diagonal, semi-transparent)
- **Purpose:** Anti-fraud measure; indicates official document
- **Color:** Cyan (#00f5ff) at 6% opacity

#### 5. Footer

- **Generation Timestamp:** When PDF was created
- **Protocol Version:** `StellarStream Nebula V3`
- **Branding Bars:** Cyan accent lines (top and bottom)

### Batch Proof-of-Payment (Multi-Recipient)

For bulk payments, the PDF includes a **recipient table**:

```
┌──────────────────────────────────────────────────────────────────┐
│ StellarStream                         PROOF OF PAYMENT           │
│                                         Split ID: SPLIT-001      │
│                                         Date: 2026-04-27         │
│ ───────────────────────────────────────────────────────────────  │
│                                                                  │
│ FROM: GABC...XYZ                        ASSET: USDC              │
│                                                                  │
│ ───────────────────────────────────────────────────────────────  │
│                                                                  │
│ RECIPIENT ADDRESS                    AMOUNT                      │
│ ───────────────────────────────────────────────────────────────  │
│ GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA 1,500.00 USDC               │
│ GBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB   250.50 USDC               │
│ GCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCC 3,200.00 USDC               │
│ ...                                                              │
│ ───────────────────────────────────────────────────────────────  │
│                                        TOTAL  4,950.50 USDC      │
│                                                                  │
│ TRANSACTION HASH                                                 │
│ abc123def456ghi789...                                            │
│                                                                  │
│ Generated 2026-04-27T14:35:00.000Z · StellarStream · Soroban     │
└──────────────────────────────────────────────────────────────────┘
```

**Additional Fields in Batch PDFs:**

- **Split ID:** Unique identifier for the batch distribution
- **Recipient Table:** Lists all addresses and amounts
- **Total Amount:** Sum of all payments in the batch
- **Note (optional):** Custom memo or description added by sender

### Verifying Proof-of-Payment

#### Method 1: QR Code Scan

1. Open smartphone camera or QR scanner app
2. Point at PDF QR code
3. Link opens Stellar Explorer showing transaction details
4. Verify:
   - Transaction status: "Success"
   - Amount matches PDF
   - Sender/receiver addresses match
   - Timestamp is accurate

#### Method 2: Manual Lookup

1. Copy **Tx Hash** from PDF
2. Visit: https://stellar.expert/explorer/public/tx/
3. Paste transaction hash into search bar
4. Review transaction details on blockchain

#### Method 3: Backend API (Technical)

For automated verification:

```bash
GET https://api.stellarstream.com/api/v3/proof-of-payment/{splitId}
```

Returns JSON with transaction data matching PDF contents.

### Use Cases for Finance Teams

#### 1. Monthly Payroll Records

- Generate PDFs for all payroll distributions
- Store in accounting system (QuickBooks, Xero, SAP)
- Provide to auditors during annual review

#### 2. Revenue Share Documentation

- Document quarterly token distributions
- Verify partner payments for compliance
- Support tax reporting for international recipients

#### 3. Dispute Resolution

- Recipient claims non-receipt? Provide PDF + blockchain link
- Independent verification eliminates "he said, she said"
- Immutable blockchain record as final authority

#### 4. Regulatory Compliance

- KYC/AML audits: Show payment trails
- OFAC compliance: Document screened transactions
- Financial reporting: Support balance sheet reconciliations

### PDF Security Features

✅ **Blockchain-verified:** Every PDF links to immutable on-chain record  
✅ **Tamper-evident:** Altering PDF breaks QR code verification  
✅ **Watermarked:** "NEBULA-V3-VERIFIED" deters forgery  
✅ **Timestamped:** Generation time recorded in footer  
✅ **Unique identifiers:** Stream ID and Tx Hash are non-replicable  

---

## FAQ: Gas Fees & Trustline Requirements

### Gas Fees

#### Q1: What are gas fees?

**A:** Gas fees (also called "network fees" or "transaction fees") are small payments made to the Stellar network to process your transaction. They compensate validators for securing the blockchain.

#### Q2: How much are gas fees on Stellar?

**A:** Stellar fees are **extremely low** compared to other blockchains:

- **Base fee:** 0.00001 XLM per operation (~$0.000001 USD)
- **Typical bulk payment:** 0.001–0.01 XLM total (~$0.0001–$0.001 USD)
- **Comparison:** Ethereum gas fees can range from $1–$100+ per transaction

**Example:**

```
Payment batch: 500 recipients
Operations: ~500 (1 per recipient)
Base fee: 500 × 0.00001 XLM = 0.005 XLM
Total cost: ~$0.0005 USD
```

#### Q3: Who pays the gas fees?

**A:** The **sender** (you/your organization) pays all gas fees. Recipients receive the full payment amount—fees are not deducted from their payments.

#### Q4: How do I ensure I have enough XLM for gas?

**A:** Best practices:

1. **Maintain minimum balance:** Keep at least 10 XLM in your wallet (covers thousands of transactions)
2. **Monitor balance:** Dashboard shows current balance and estimated fees before execution
3. **Low balance warning:** System alerts you if balance is insufficient
4. **Auto-calculate:** Fee estimate displayed before you confirm transaction

#### Q5: Can I pay gas fees in USDC or other assets?

**A:** **No.** Stellar network fees must be paid in **XLM** (native token). However:

- You can send USDC, EURC, or other assets to recipients
- Gas fees are separate and always deducted from your XLM balance
- Typical fee is negligible (fractions of a cent)

#### Q6: Why do I need XLM if I'm only sending USDC?

**A:** Two reasons:

1. **Network fees:** All Stellar transactions require XLM for gas
2. **Base reserve:** Stellar accounts must maintain minimum XLM balance (currently 1 XLM + 0.5 XLM per trustline)

**Example:**

```
You want to send: 10,000 USDC to 50 recipients
You also need: ~0.01 XLM for gas fees
Your wallet must hold: Both USDC (for payments) + XLM (for fees)
```

#### Q7: Are gas fees refundable if a transaction fails?

**A:** **No.** Gas fees are consumed by the network regardless of transaction outcome. However:

- Stellar transactions are **atomic**: Either all operations succeed, or all fail
- If a batch fails, no payments are processed, but the fee is still charged
- Failed batches can be retried (requires additional fee)

#### Q8: How can I estimate gas fees before sending?

**A:** The interface displays a **fee estimate** before you confirm:

```
┌──────────────────────────────────────┐
│ Transaction Summary                  │
│ ───────────────────────────────────  │
│ Recipients: 150                      │
│ Total Amount: 45,000.00 USDC         │
│ Estimated Fee: 0.0015 XLM ($0.00015) │
│ ───────────────────────────────────  │
│ [Cancel]    [Confirm & Send]         │
└──────────────────────────────────────┘
```

---

### Trustline Requirements

#### Q9: What is a trustline?

**A:** A **trustline** is a Stellar account setting that indicates willingness to hold a specific asset. Before receiving non-XLM tokens (like USDC or EURC), a recipient must create a trustline for that asset.

**Analogy:** Think of a trustline as "opening a bank account" for a specific currency.

#### Q10: Which assets require trustlines?

| Asset | Trustline Required? | Notes |
|-------|---------------------|-------|
| **XLM** (Stellar Lumens) | ❌ No | Native asset; all accounts can receive |
| **USDC** (USD Coin) | ✅ Yes | Must trust USDC issuer |
| **EURC** (Euro Coin) | ✅ Yes | Must trust EURC issuer |
| **SRT** (Stellar Reference Token) | ✅ Yes | Must trust SRT issuer |
| **Custom tokens** | ✅ Yes | Must trust specific issuer |

#### Q11: How do recipients create a trustline?

**A:** Recipients can create trustlines via:

1. **Wallet interfaces:** Lobstr, Solar, or other Stellar wallets
2. **Stellar Explorer:** https://stellar.expert (advanced users)
3. **Your organization's onboarding portal** (if you provide one)

**Steps (using typical wallet):**

1. Open wallet app
2. Navigate to "Assets" or "Trustlines"
3. Search for asset (e.g., "USDC")
4. Click "Add Trustline" or "Trust Asset"
5. Confirm transaction (small XLM fee required)

#### Q12: How do I know if a recipient has a trustline?

**A:** Use the **Trustline Preflight Check**:

1. Upload or enter recipients in the grid
2. Select the asset you're sending (e.g., USDC)
3. Click **"Run Preflight Check"**
4. System displays:
   - ✅ Green banner: All recipients have trustline
   - ⚠️ Amber banner: Lists recipients **missing** trustline

**Example warning:**

```
⚠ 3 recipients missing USDC trustline
These addresses cannot receive USDC via a direct push payment.

GAAAA...1234
GBBBB...5678
GCCCC...9012

[Fix All → Claim-Based]
```

#### Q13: What happens if I send to an address without a trustline?

**A:** The transaction will **fail** for that recipient. Specifically:

- **Push payment (direct send):** Reverts if trustline missing
- **Atomic batch:** Entire batch fails if any single recipient lacks trustline
- **Error message:** "Trustline missing for asset [ASSET_CODE]"

**Prevention:** Always run the preflight check before executing payments.

#### Q14: What is "Claim-Based" (Pull) mode?

**A:** **Claim-Based mode** (also called "Pull mode") is an alternative payment method that **bypasses trustline requirements**:

**How it works:**

1. You deposit funds into a **claimable balance** on Stellar
2. Recipients receive a notification/link
3. Recipients **claim** payments at their convenience
4. Trustline is created **during** the claim process (if needed)

**Benefits:**

- ✅ No pre-funding trustlines required
- ✅ Recipients control when they receive funds
- ✅ Reduces failed transactions
- ✅ Ideal for payroll with new employees or international partners

**Drawbacks:**

- ⚠️ Requires recipient action (not fully automated)
- ⚠️ Funds remain unclaimed until recipient acts
- ⚠️ Slightly more complex user experience for recipients

#### Q15: When should I use Claim-Based mode?

**A:** Use Claim-Based mode when:

✅ Recipients are new to Stellar (no existing trustlines)  
✅ You're paying international contractors unfamiliar with crypto  
✅ You want to guarantee zero failed transactions  
✅ Recipients should control timing of fund receipt  
✅ You're distributing to a large, diverse group  

**Use direct Push mode when:**

✅ All recipients are known to have trustlines  
✅ You need guaranteed immediate delivery  
✅ Recipients are experienced Stellar users  
✅ Automating recurring payments (e.g., monthly payroll)  

#### Q16: How do I switch to Claim-Based mode?

**A:** When the preflight check detects missing trustlines:

1. Review the amber warning banner
2. Click **"Fix All → Claim-Based"** button
3. System automatically converts payment batch to claimable balances
4. Recipients receive claim links via email or notification (configured separately)

**Alternatively:**

- Manually select "Claim-Based" or "Pull Mode" in payment settings before execution
- No preflight check needed; all payments use claimable balances

#### Q17: Do trustlines cost anything to create?

**A:** Yes, but minimally:

- **Base reserve:** 0.5 XLM per trustline (~$0.05 USD)
- **Transaction fee:** 0.00001 XLM (~$0.000001 USD)
- **Total:** ~0.5 XLM one-time cost (~$0.05 USD)

**Who pays?** The **recipient** pays when creating their trustline. However:

- Some organizations reimburse employees for trustline setup
- Claim-Based mode eliminates this requirement entirely

#### Q18: Can I check trustlines programmatically?

**A:** Yes, via Stellar Horizon API:

```bash
GET https://horizon.stellar.org/accounts/{ACCOUNT_ID}
```

Response includes `balances` array showing all trustlines:

```json
{
  "balances": [
    {
      "balance": "1500.0000000",
      "limit": "922337203685.4775807",
      "asset_type": "credit_alphanum4",
      "asset_code": "USDC",
      "asset_issuer": "GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN"
    }
  ]
}
```

**No USDC entry?** Trustline doesn't exist.

#### Q19: What if a recipient refuses to create a trustline?

**A:** Options:

1. **Use Claim-Based mode:** They claim without pre-creating trustline
2. **Send XLM instead:** No trustline needed for native asset
3. **Alternative payment:** Use traditional banking rails for that recipient
4. **Assist with setup:** Provide step-by-step guide or video tutorial

#### Q20: Are there limits on trustlines?

**A:** Yes:

- **Maximum trustlines per account:** Limited by account's XLM balance
- **Formula:** `(Account XLM balance - 1 XLM base reserve) / 0.5 XLM per trustline`
- **Example:** Account with 10 XLM can hold up to 18 trustlines

**For most users:** This limit is not a concern unless holding dozens of different tokens.

---

## Troubleshooting

### Common Issues

#### Issue 1: "Invalid Stellar address" error

**Cause:** Malformed or typo'd address

**Solution:**
- Verify address is 56 characters
- Must start with `G`
- No spaces or special characters
- Example: `GABC123...XYZ` (not `ABC123` or `GABC 123`)

#### Issue 2: CSV import fails

**Cause:** Incorrect format or encoding

**Solution:**
- Ensure header row exists
- Save as UTF-8 encoding
- Remove Excel formulas
- Check for required columns: `Address` and `Amount`
- Test with minimal 2-row CSV first

#### Issue 3: Transaction stuck "In Transit"

**Cause:** Network congestion or low fee

**Solution:**
- Wait 30–60 seconds (Stellar confirmation is typically 3–5 seconds)
- Check Stellar Explorer for transaction status
- If truly stuck, retry batch (system prevents duplicate payments)

#### Issue 4: "Insufficient XLM for gas fees" error

**Cause:** Wallet XLM balance too low

**Solution:**
- Add XLM to wallet (minimum 1–2 XLM recommended)
- Check balance in dashboard
- Purchase XLM from exchange (Binance, Coinbase, Kraken)

#### Issue 5: Recipient claims they didn't receive payment

**Cause:** Miscommunication or trustline issue

**Solution:**
1. Provide Proof-of-Payment PDF
2. Have recipient verify via QR code or Stellar Explorer
3. Check if payment is claimable (Claim-Based mode)
4. Verify recipient provided correct address

#### Issue 6: Bulk payment partially succeeds

**Cause:** Some recipients missing trustlines

**Solution:**
- System processes in batches; some may succeed, others fail
- Use **"Retry Failed"** button to reprocess failed batches
- Switch to Claim-Based mode for problematic recipients
- Run preflight check before next batch

---

## Support & Resources

### Documentation

- **Technical Whitepaper:** `/docs/TECHNICAL_WHITEPAPER_XRAY_MULTI_SPLITTER.md`
- **API Reference:** `/docs/API_REFERENCE.md`
- **Quick Start Guide:** `/backend/QUICK_START.md`
- **Contract Documentation:** `/contracts/Contract-V1/README.md`

### Community & Support

- **GitHub Repository:** https://github.com/Folex1275/StellarStream
- **Issue Tracker:** Report bugs or request features via GitHub Issues
- **Contributing Guide:** `/CONTRIBUTING.md`

### Stellar Resources

- **Stellar Developer Docs:** https://developers.stellar.org
- **Stellar Explorer:** https://stellar.expert
- **Horizon API:** https://horizon.stellar.org
- **Stellar Community:** https://community.stellar.org

### Contact

For enterprise support or institutional onboarding:

- **Email:** support@stellarstream.io (placeholder)
- **Documentation:** This user manual + technical docs in `/docs` directory

---

## Glossary

| Term | Definition |
|------|------------|
| **Atomic Transaction** | All-or-nothing execution; either all operations succeed or all fail |
| **Base Reserve** | Minimum XLM balance required to maintain a Stellar account (1 XLM) |
| **Batch Processing** | Splitting large payments into smaller groups for execution |
| **Bridge** | Mechanism to transfer assets between different blockchains |
| **Claimable Balance** | Funds held on-chain that recipients can claim at their convenience |
| **Gas Fee** | Network fee paid in XLM to process transactions |
| **Ledger** | Stellar's blockchain; records all transactions permanently |
| **Memo** | Optional reference attached to a payment (Text or ID) |
| **Nebula V3** | StellarStream's payment distribution protocol version |
| **Preflight Check** | Validation step to verify recipient readiness before payment |
| **Pull Mode** | Claim-Based payment; recipients actively claim funds |
| **Push Mode** | Direct payment; funds sent immediately to recipient |
| **Soroban** | Stellar's smart contract platform |
| **Splitter** | Smart contract that distributes funds to multiple recipients |
| **Stream ID** | Unique identifier for a payment stream or batch |
| **Trustline** | Account setting allowing receipt of specific non-XLM assets |
| **Tx Hash** | Unique 64-character identifier for a blockchain transaction |
| **XLM** | Stellar's native cryptocurrency (Lumens) |

---

## Document History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0 | 2026-04-27 | Initial release | StellarStream Team |

---

**© 2026 StellarStream. All rights reserved.**  
*Powered by Soroban · Built on Stellar Blockchain*

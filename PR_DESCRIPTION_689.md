# Issue #689 [Frontend] Logic: Multi-Asset "Value-Aggregator" in USD

## Description
Convert disparate asset totals (XLM, USDC, yXLM) into a single "Total Value" in USD using the Backend Price Oracle.

## Technical Implementation

### 1. Created Price Fetcher Hook (`frontend/lib/hooks/use-price-fetcher.ts`)
- Fetches token prices from `/api/v1/prices` endpoint
- Provides `getPrice()` and `getTokenInfo()` utilities for looking up prices
- Includes helper functions:
  - `calculateUsdValue()` - Convert individual token amounts to USD
  - `calculateTotalUsdValue()` - Sum multiple token amounts to USD
  - `formatUsdValue()` - Format for display (e.g., "$1,240.50")

### 2. Updated Recipient Type (`frontend/lib/bulk-splitter/types.ts`)
- Added optional `tokenAddress` field to `Recipient` interface
- Allows specifying different tokens per recipient for multi-asset splits

### 3. Integrated with BulkDispatchPanel (`frontend/components/dashboard/BulkDispatchPanel.tsx`)
- Added optional `defaultTokenAddress` prop for single-asset batches
- Displays "Total Disbursement Value: $X,XXX.XX" header above recipient list
- Uses price oracle to calculate USD equivalents in real-time
- Shows loading state while fetching prices

## Labels
- [Frontend] Logic Easy

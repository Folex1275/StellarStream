# Fiat-Value Oracle Cache

## Overview

This document describes the fiat-value oracle cache system implemented
in `StellarStream`. It syncs XLM/USDC prices from CoinGecko every 5
minutes, stores a time-series in the `PriceHistory` table, and links
each `SplitLog` entry to the nearest historical USD price for tax and
reporting purposes.

---

## How It Works

1. Every 5 minutes the scheduler calls `updateAllPrices()`
2. Prices are fetched from CoinGecko or the Stellar DEX
3. Each price is saved to `TokenPrice` (latest) and `PriceHistory` (time-series)
4. When a payment split occurs, `logSplitWithPrice()` finds the nearest
   historical price and links it to the `SplitLog` entry

---

## Database Models

### `PriceHistory`
Stores a time-series of asset prices for tax and reporting purposes.

| Field | Type | Description |
|-------|------|-------------|
| id | String | Unique identifier |
| asset | String | Asset identifier e.g. "native" |
| symbol | String | Human-readable symbol e.g. "XLM" |
| priceUsd | Float | USD price at time of recording |
| source | String | "coingecko" or "dex" |
| recordedAt | DateTime | When the price was recorded |

### `SplitLog`
Logs payment splits with linked USD price at time of execution.

| Field | Type | Description |
|-------|------|-------------|
| id | String | Unique identifier |
| streamId | String | Associated stream ID |
| asset | String | Asset used in the split |
| amount | String | Split amount |
| sender | String | Sender Stellar address |
| receiver | String | Receiver Stellar address |
| txHash | String | Transaction hash |
| priceUsd | Float? | USD price at time of split |
| priceSource | String? | Where the price came from |
| priceRecordedAt | DateTime? | When the price was recorded |
| executedAt | DateTime | When the split occurred |

---

## Implementation

**File:** `src/services/price.service.ts`

### `recordPriceHistory(asset, symbol, priceUsd, source)`
Stores a price entry in the `PriceHistory` table.
Called automatically by `updateAllPrices()` every 5 minutes.

### `getNearestPrice(asset, timestamp)`
Finds the most recent price record for an asset.
Returns `{ priceUsd, source, recordedAt }` or `null` if none exists.

### `logSplitWithPrice(input)`
Creates a `SplitLog` entry linked to the nearest historical price.
Call this whenever a payment split occurs.

### `updateAllPrices()`
Fetches current prices for all active stream assets and stores them
in both `TokenPrice` (latest cache) and `PriceHistory` (time-series).

**File:** `src/schedulers.ts`

### `schedulePriceUpdates()`
Runs `updateAllPrices()` every 5 minutes via cron.

---

## Security Assumptions

- Price data is fetched from CoinGecko and Stellar DEX — both are
  read-only public APIs requiring no authentication
- Prices are stored as `Float` — no sensitive data is involved
- The `SplitLog` table is append-only — existing records are never
  modified after creation
- `priceUsd` is nullable — if no price history exists at split time,
  the split is still recorded with `null` price rather than failing

---

## Abuse and Failure Paths

| Scenario | Behaviour |
|----------|-----------|
| CoinGecko API is down | Falls back to Stellar DEX price |
| Both APIs are down | Price recorded as 0, logged as warning |
| No price history at split time | SplitLog created with null priceUsd |
| Database write fails | Error logged, no exception thrown |
| Asset not in mapping | Returns 0, logged as warning |

---

## Test Coverage

**File:** `src/__jest__/price.service.test.ts`

| Test | What it verifies |
|------|-----------------|
| stores price history record | recordPriceHistory saves to DB |
| handles database error gracefully | No crash on DB failure |
| returns nearest price for an asset | getNearestPrice returns correct data |
| returns null when no history exists | getNearestPrice handles empty DB |
| creates split log linked to nearest price | logSplitWithPrice links price |
| creates split log with null price | logSplitWithPrice handles no history |
| returns cached price from database | getCachedPrice reads from DB |
| returns 0 when no cached price exists | getCachedPrice handles missing data |

---

## Example Usage
```typescript
import { PriceService } from './services/price.service.js';

const priceService = new PriceService();

// Log a split with linked price:
await priceService.logSplitWithPrice({
  streamId: 'stream-123',
  asset: 'native',
  amount: '1000000',
  sender: 'GABC...',
  receiver: 'GDEF...',
  txHash: 'abc123...',
  executedAt: new Date(),
});
```

---

## Related Files

- `src/services/price.service.ts` — core service logic
- `src/schedulers.ts` — 5 minute price update scheduler
- `prisma/schema.prisma` — PriceHistory and SplitLog models
- `src/__jest__/price.service.test.ts` — test suite
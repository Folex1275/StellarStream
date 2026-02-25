# Price Feed Flow Diagram

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Express Server                           │
│                         (Port 3000)                              │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │
        ┌─────────────────────┴─────────────────────┐
        │                                           │
        ▼                                           ▼
┌──────────────────┐                    ┌──────────────────────┐
│   API Routes     │                    │  Background Job      │
│   /api/*         │                    │  (Every 5 minutes)   │
└──────────────────┘                    └──────────────────────┘
        │                                           │
        │                                           │
        ▼                                           ▼
┌──────────────────────────────────────────────────────────────┐
│              Price Feed Service                               │
│  ┌────────────────────────────────────────────────────────┐  │
│  │  fetchTokenPrices()    - Get prices from CoinGecko     │  │
│  │  updateTokenPrices()   - Store in database             │  │
│  │  getTokenPrice()       - Retrieve cached price         │  │
│  │  calculateUsdValue()   - Calculate USD for amount      │  │
│  └────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────┘
        │                                           │
        │                                           │
        ▼                                           ▼
┌──────────────────┐                    ┌──────────────────────┐
│  Prisma Client   │                    │   CoinGecko API      │
│                  │                    │   (External)         │
└──────────────────┘                    └──────────────────────┘
        │
        │
        ▼
┌──────────────────────────────────────────────────────────────┐
│                    PostgreSQL Database                        │
│  ┌────────────────────┐      ┌────────────────────────────┐  │
│  │  Stream Table      │      │  TokenPrice Table          │  │
│  │  - id              │      │  - tokenAddress (PK)       │  │
│  │  - sender          │      │  - priceUsd                │  │
│  │  - receiver        │      │  - lastUpdated             │  │
│  │  - tokenAddress    │      └────────────────────────────┘  │
│  │  - totalAmount     │                                       │
│  │  - status          │                                       │
│  └────────────────────┘                                       │
└──────────────────────────────────────────────────────────────┘
```

## Request Flow

### 1. API Request Flow

```
Client Request
     │
     ▼
GET /api/streams
     │
     ▼
API Handler (api/index.ts)
     │
     ├─► Query Streams from Database
     │        │
     │        ▼
     │   [Stream 1, Stream 2, ...]
     │
     └─► For each stream:
              │
              ▼
         calculateUsdValue(tokenAddress, amount)
              │
              ├─► getTokenPrice(tokenAddress)
              │        │
              │        ▼
              │   Query TokenPrice table
              │        │
              │        ▼
              │   Return cached price
              │
              └─► Calculate: (amount / 10^7) * price
                       │
                       ▼
                  Return USD value
     │
     ▼
Response with enriched streams
     │
     ▼
Client receives data with estimatedUsdValue
```

### 2. Background Job Flow

```
Server Starts
     │
     ▼
startPriceUpdateJob()
     │
     ├─► Immediate Update
     │        │
     │        ▼
     │   fetchTokenPrices()
     │        │
     │        ├─► Build CoinGecko API URL
     │        │        │
     │        │        ▼
     │        │   GET https://api.coingecko.com/api/v3/simple/price
     │        │        ?ids=stellar,usd-coin
     │        │        &vs_currencies=usd
     │        │        │
     │        │        ▼
     │        │   {"stellar": {"usd": 0.12}, "usd-coin": {"usd": 1.00}}
     │        │
     │        └─► Map to token addresses
     │                 │
     │                 ▼
     │            Map<"native", 0.12>
     │            Map<"USDC", 1.00>
     │
     └─► updateTokenPrices()
              │
              ▼
         For each price:
              │
              ▼
         UPSERT into TokenPrice table
              │
              ▼
         Log success
     │
     ▼
Set Interval (5 minutes)
     │
     └─► Repeat every 5 minutes
```

## Data Flow Example

### Example: Calculate USD Value for 100 XLM

```
Input:
  tokenAddress = "native"
  amount = 1000000000 (100 XLM in stroops)

Step 1: Get Token Price
  ┌─────────────────────────────────────┐
  │ getTokenPrice("native")             │
  │   ↓                                 │
  │ SELECT * FROM TokenPrice            │
  │ WHERE tokenAddress = "native"       │
  │   ↓                                 │
  │ { priceUsd: 0.12, lastUpdated: ... }│
  └─────────────────────────────────────┘
                  │
                  ▼
            price = 0.12

Step 2: Convert Amount
  ┌─────────────────────────────────────┐
  │ amount / 10^7                       │
  │ 1000000000 / 10000000               │
  │   ↓                                 │
  │ tokenAmount = 100                   │
  └─────────────────────────────────────┘
                  │
                  ▼
         tokenAmount = 100

Step 3: Calculate USD Value
  ┌─────────────────────────────────────┐
  │ tokenAmount * price                 │
  │ 100 * 0.12                          │
  │   ↓                                 │
  │ usdValue = 12.00                    │
  └─────────────────────────────────────┘
                  │
                  ▼
Output: estimatedUsdValue = 12.00
```

## Token Mapping Flow

```
Stellar Token Address  →  CoinGecko ID  →  USD Price
─────────────────────────────────────────────────────
"native"               →  "stellar"     →  $0.12
"USDC"                 →  "usd-coin"    →  $1.00
"BTC"                  →  "bitcoin"     →  $45000.00

Configuration in price-feed.service.ts:
┌──────────────────────────────────────────┐
│ const TOKEN_ID_MAP = {                   │
│   'native': 'stellar',                   │
│   'USDC': 'usd-coin',                    │
│   'BTC': 'bitcoin',                      │
│ }                                        │
└──────────────────────────────────────────┘
```

## Error Handling Flow

```
API Request
     │
     ▼
calculateUsdValue()
     │
     ├─► getTokenPrice()
     │        │
     │        ├─► Success: Return price
     │        │
     │        └─► Error/Not Found
     │                 │
     │                 ▼
     │            Log error
     │                 │
     │                 ▼
     │            Return null
     │
     └─► If price is null
              │
              ▼
         Return null for USD value
     │
     ▼
API Response includes:
  estimatedUsdValue: null
```

## Timing Diagram

```
Time    Event
─────────────────────────────────────────────────────
00:00   Server starts
00:00   startPriceUpdateJob() called
00:00   ├─► Immediate price fetch
00:01   └─► Prices stored in database
        
05:00   Background job triggers
05:00   ├─► Fetch prices from CoinGecko
05:01   └─► Update database
        
10:00   Background job triggers
10:00   ├─► Fetch prices from CoinGecko
10:01   └─► Update database
        
...     (Continues every 5 minutes)

Anytime Client requests /api/streams
        ├─► Read from database (fast)
        └─► Return cached prices
```

## Database Schema Relationships

```
┌─────────────────────────────────────┐
│           Stream                    │
├─────────────────────────────────────┤
│ id              STRING (PK)         │
│ sender          STRING              │
│ receiver        STRING              │
│ tokenAddress    STRING ────────┐    │
│ amountPerSecond BIGINT         │    │
│ totalAmount     BIGINT         │    │
│ status          ENUM           │    │
└────────────────────────────────│────┘
                                 │
                                 │ (Logical relationship)
                                 │
                                 ▼
┌─────────────────────────────────────┐
│         TokenPrice                  │
├─────────────────────────────────────┤
│ tokenAddress    STRING (PK)         │
│ priceUsd        FLOAT               │
│ lastUpdated     DATETIME            │
└─────────────────────────────────────┘
```

## Performance Characteristics

```
Operation                    Time Complexity    Notes
─────────────────────────────────────────────────────────
Fetch from CoinGecko        O(1)               Single API call
Store prices in DB          O(n)               n = number of tokens
Get cached price            O(1)               Indexed lookup
Calculate USD value         O(1)               Simple math
API request with USD        O(m)               m = number of streams
                                               Each stream: O(1) price lookup
```

## Scalability Considerations

```
Component              Current Limit        Scaling Strategy
─────────────────────────────────────────────────────────────
CoinGecko API         10-30 calls/min      • Use single batch call
                                           • Add caching layer
                                           • Fallback to DEX prices

Database Queries      ~1000 QPS            • Connection pooling
                                           • Read replicas
                                           • Query optimization

Background Job        Single instance      • Distributed locks
                                           • Leader election
                                           • Job queue system

API Endpoints         ~100 RPS             • Load balancing
                                           • Caching (Redis)
                                           • CDN for static data
```

# Backend Features Implementation Guide

This document covers the implementation of four major backend features for StellarStream.

## Feature 1: External Developer Webhooks (#492)

### Overview
Allows 3rd-party applications (ERP, Payroll, Discord Bots) to register for real-time notifications when stream events occur.

### Architecture

#### Database Schema
- **Webhook Table**: Stores webhook registrations with HMAC secret keys
  - `id`: Unique webhook identifier
  - `url`: Target endpoint for POST requests
  - `eventType`: Filter by event type ("*" = all, or specific: "stream_created", "stream_withdrawn", "stream_canceled")
  - `secretKey`: HMAC-SHA256 secret for payload signing
  - `isActive`: Enable/disable webhook
  - `description`: Human-readable label

- **WebhookDelivery Table**: Tracks delivery attempts with retry logic
  - `id`: Delivery record ID
  - `webhookId`: Reference to webhook
  - `payload`: Full event payload (JSON)
  - `status`: "pending", "success", or "failed"
  - `attempts`: Current attempt count
  - `maxRetries`: Maximum retry attempts (default: 5)
  - `nextRetryAt`: Scheduled retry timestamp
  - `lastError`: Error message from last attempt

#### Services

**WebhookDispatcherService** (`webhook-dispatcher.service.ts`)
- `registerWebhook(url, eventType, description)`: Register new webhook
- `dispatch(payload)`: Dispatch event to matching webhooks
- `processDeliveries()`: Background worker to retry failed deliveries
- `signPayload(payload, secretKey)`: Generate HMAC-SHA256 signature
- `verifySignature(payload, signature, secretKey)`: Verify webhook signature (for receivers)

#### Retry Logic
Exponential backoff with 5 retry attempts:
1. 1 second
2. 5 seconds
3. 30 seconds
4. 5 minutes
5. 15 minutes

#### Security
- All payloads are signed with HMAC-SHA256
- Signature included in `X-Webhook-Signature` header
- Webhook ID included in `X-Webhook-ID` header
- Receivers can verify authenticity using the secret key

#### API Endpoints

```
POST /api/v1/webhooks/register
{
  "url": "https://example.com/webhook",
  "eventType": "*",  // or "stream_created", "stream_withdrawn", "stream_canceled"
  "description": "My ERP integration"
}

Response:
{
  "success": true,
  "webhook": {
    "id": "webhook_123",
    "secretKey": "hex_encoded_secret"  // Store securely!
  }
}
```

```
POST /api/v1/webhooks/test
{
  "webhookId": "webhook_123"
}
```

#### Webhook Payload Format

```json
{
  "eventType": "stream_created",
  "streamId": "stream_abc123",
  "txHash": "tx_hash_here",
  "sender": "GXXXXXX...",
  "receiver": "GYYYYYY...",
  "amount": "1000000000",
  "timestamp": "2026-03-26T04:51:18.744Z"
}
```

#### Background Worker
- `webhook-dispatcher.worker.ts`: Runs every 10 seconds
- Processes pending deliveries with exponential backoff
- Automatically retries failed deliveries
- Marks as failed after max retries exceeded

---

## Feature 2: Dust Filter & Spam Prevention (#493)

### Overview
Prevents attackers from inflating protocol stats with millions of 0.0000001 XLM streams.

### Configuration
```env
MIN_VALUE_USD=0.10  # Minimum stream value in USD
```

### Database Schema
- **Stream Table**: Added `isDust` boolean field
  - Indexed for fast filtering
  - Default: false

### Services

**DustFilterService** (`dust-filter.service.ts`)
- `isDustStream(amount, tokenAddress)`: Check if stream is below threshold
- `markAsDust(streamId)`: Mark stream as dust
- `getProtocolStats(excludeDust)`: Get stats excluding dust streams
- `getTVL(excludeDust)`: Get TVL excluding dust streams

### Calculation
```
valueUsd = (amount / 10^decimals) * priceUsd
isDust = valueUsd < MIN_VALUE_USD
```

### Integration Points
1. **Stream Creation**: Automatically checked when stream is created
2. **Analytics Queries**: All TVL and volume queries exclude dust by default
3. **Frontend**: Dust streams hidden by default, toggleable with "Show Small Streams" filter

### API Endpoints

```
GET /api/v1/stats/protocol?excludeDust=true
{
  "success": true,
  "stats": {
    "totalStreams": 1234,
    "activeStreams": 567,
    "totalVolume": "5000000000000",
    "tvl": "2500000000000",
    "excludeDust": true,
    "timestamp": "2026-03-26T04:51:18.744Z"
  }
}
```

---

## Feature 3: Redis Caching for API Endpoints (#494)

### Overview
Reduces PostgreSQL load by caching frequently accessed, non-critical data.

### Configuration
```env
REDIS_URL=redis://localhost:6379
```

### Cache Strategy

| Endpoint | TTL | Key |
|----------|-----|-----|
| `/api/v1/stats/protocol` | 5 minutes | `protocol:stats:{excludeDust}` |
| `/api/v1/prices` | 60 seconds | `prices` |

### Services

**CacheService** (`cache.service.ts`)
- `getOrCompute(key, ttlSeconds, compute)`: Get cached or compute and cache
- `cacheProtocolStats(stats)`: Cache protocol stats
- `getProtocolStats()`: Retrieve cached stats
- `cachePrices(prices)`: Cache token prices
- `getPrices()`: Retrieve cached prices
- `invalidate(key)`: Invalidate specific cache key
- `invalidateAll()`: Clear all caches

### Performance Targets
- Cached routes: < 50ms response time
- Cache hit rate: > 80% for stats endpoints

### Cache Invalidation
- Automatic TTL expiration
- Manual invalidation on data updates
- Full cache clear on critical updates

### API Endpoints

```
GET /api/v1/stats/protocol
Response time: < 50ms (cached)

GET /api/v1/prices
Response time: < 50ms (cached)
```

---

## Feature 4: Affiliate & Referral Earnings Tracker (#495)

### Overview
Tracks 0.5% commission earned by integrators when streams are created with their affiliate ID.

### Commission Rate
- **0.5%** of stream amount
- Calculated in stroops (smallest XLM unit)

### Database Schema

**Affiliate Table**
- `id`: Unique affiliate identifier
- `stellarAddress`: Stellar address (unique)
- `pendingClaim`: Unclaimed earnings in stroops
- `totalEarned`: Lifetime earnings in stroops
- `claimedAt`: Last claim timestamp

**Stream Table**: Added `affiliateId` field
- Links stream to affiliate who referred it
- Indexed for fast lookups

### Services

**AffiliateService** (`affiliate.service.ts`)
- `trackStreamCreation(streamId, amount, affiliateId)`: Record affiliate earnings
- `getEarnings(stellarAddress)`: Get affiliate earnings summary
- `claimEarnings(stellarAddress)`: Claim pending earnings
- `getTopAffiliates(limit)`: Get leaderboard

### Integration Points
1. **Stream Creation**: Automatically tracks earnings when `affiliateId` is present
2. **Event Parsing**: Extract `affiliate_id` from contract events

### API Endpoints

```
GET /api/v2/affiliate/earnings?address=GXXXXXX...
{
  "success": true,
  "earnings": {
    "stellarAddress": "GXXXXXX...",
    "pendingClaim": "500000",
    "totalEarned": "5000000",
    "claimedAt": "2026-03-20T10:00:00Z"
  }
}
```

```
POST /api/v2/affiliate/claim
{
  "address": "GXXXXXX..."
}

Response:
{
  "success": true,
  "claimed": "500000",
  "message": "Earnings claimed successfully"
}
```

```
GET /api/v2/affiliate/leaderboard?limit=10
{
  "success": true,
  "leaderboard": [
    {
      "stellarAddress": "GXXXXXX...",
      "totalEarned": "50000000",
      "pendingClaim": "0",
      "claimedAt": "2026-03-25T15:30:00Z"
    },
    ...
  ]
}
```

### Calculation Example
```
Stream Amount: 1,000,000,000 stroops (100 XLM)
Commission Rate: 0.5%
Affiliate Earnings: 1,000,000,000 * 0.005 = 5,000,000 stroops (0.5 XLM)
```

---

## Integration Flow

### Stream Creation Event
```
1. Event detected from blockchain
2. Stream record created in database
3. onStreamCreated() called:
   a. Check if dust (isDustStream)
   b. Mark as dust if below threshold
   c. Track affiliate earnings (if affiliateId present)
   d. Dispatch webhook to all registered endpoints
4. Webhook delivery queued with retry logic
5. Background worker processes deliveries
```

### Data Flow Diagram
```
Blockchain Event
    ↓
Event Watcher
    ↓
Stream Created
    ↓
Integration Service (stream-integration.service.ts)
    ├→ Dust Filter Service
    ├→ Affiliate Service
    └→ Webhook Dispatcher Service
        ↓
    Webhook Delivery Queue
        ↓
    Background Worker (every 10s)
        ├→ Retry failed deliveries
        └→ Update delivery status
```

---

## Setup Instructions

### 1. Database Migration
```bash
cd backend
npm run db:migrate
# Or manually run: prisma/migrations/add_webhooks_dust_affiliates.sql
```

### 2. Environment Configuration
```bash
# .env
MIN_VALUE_USD=0.10
REDIS_URL=redis://localhost:6379
```

### 3. Start Services
```bash
npm run dev
# Webhook worker starts automatically
# Redis cache initialized
# Dust filter active
# Affiliate tracking enabled
```

### 4. Verify Installation
```bash
# Check webhook registration
curl -X POST http://localhost:3001/api/v1/webhooks/register \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://example.com/webhook",
    "eventType": "*"
  }'

# Check cached stats
curl http://localhost:3001/api/v1/stats/protocol

# Check affiliate earnings
curl "http://localhost:3001/api/v2/affiliate/earnings?address=GXXXXXX..."
```

---

## Monitoring & Debugging

### Webhook Delivery Status
```sql
SELECT * FROM "WebhookDelivery" 
WHERE status = 'failed' 
ORDER BY "createdAt" DESC 
LIMIT 10;
```

### Dust Streams
```sql
SELECT COUNT(*) as dust_count, SUM(amount) as dust_volume
FROM "Stream" 
WHERE "isDust" = true;
```

### Affiliate Earnings
```sql
SELECT * FROM "Affiliate" 
ORDER BY "totalEarned" DESC 
LIMIT 10;
```

### Cache Hit Rate
```bash
# Monitor Redis
redis-cli INFO stats
```

---

## Security Considerations

1. **Webhook Secrets**: Store securely, never log
2. **HMAC Verification**: Always verify signatures on receiver side
3. **Rate Limiting**: Webhook registration limited to 5 req/min
4. **Timeout**: 10 second timeout on webhook deliveries
5. **Affiliate Validation**: Verify affiliate address format before tracking

---

## Performance Metrics

| Feature | Metric | Target |
|---------|--------|--------|
| Webhooks | Delivery latency | < 5s |
| Webhooks | Retry success rate | > 95% |
| Dust Filter | Query time | < 100ms |
| Cache | Hit rate | > 80% |
| Cache | Response time | < 50ms |
| Affiliates | Earnings calculation | < 10ms |

---

## Future Enhancements

1. **Webhook Signing**: Add request signing for outbound webhooks
2. **Webhook Analytics**: Track delivery success rates per webhook
3. **Dust Threshold**: Make configurable per token
4. **Cache Warming**: Pre-populate cache on startup
5. **Affiliate Tiers**: Implement tiered commission rates
6. **Webhook Batching**: Batch multiple events into single delivery

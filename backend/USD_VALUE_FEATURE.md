# USD Value Feature Implementation

## Overview
This feature adds real-time USD value tracking for payment streams using the CoinGecko API as a price feed.

## Components

### 1. Database Schema Updates
Added `TokenPrice` model to store current USD prices:
```prisma
model TokenPrice {
  tokenAddress String   @id
  priceUsd     Float
  lastUpdated  DateTime @default(now())
  @@index([lastUpdated])
}
```

### 2. Price Feed Service (`src/services/price-feed.service.ts`)
Handles all price-related operations:

- **fetchTokenPrices()**: Fetches current prices from CoinGecko API
- **updateTokenPrices()**: Updates prices in database
- **getTokenPrice()**: Retrieves cached price for a token
- **calculateUsdValue()**: Calculates USD value for token amounts
- **startPriceUpdateJob()**: Starts background job (updates every 5 minutes)
- **stopPriceUpdateJob()**: Stops the background job

### 3. API Endpoints (`src/api/index.ts`)
New REST endpoints with USD values:

- `GET /api/streams` - Get all streams with USD values
- `GET /api/streams/:id` - Get specific stream with USD value
- `GET /api/streams/sender/:address` - Get sender's streams with USD values
- `GET /api/streams/receiver/:address` - Get receiver's streams with USD values

### 4. Response Format
All stream responses now include `estimatedUsdValue`:

```json
{
  "id": "stream_123",
  "sender": "GABC...",
  "receiver": "GDEF...",
  "tokenAddress": "native",
  "amountPerSecond": "1000000",
  "totalAmount": "86400000000",
  "status": "ACTIVE",
  "estimatedUsdValue": 1234.56
}
```

## Setup Instructions

### 1. Run Database Migration
```bash
cd backend
npm run db:generate
npm run db:migrate
```

### 2. Configure Token Mappings
Edit `src/services/price-feed.service.ts` to add token mappings:

```typescript
const TOKEN_ID_MAP: Record<string, string> = {
  'native': 'stellar',           // XLM
  'USDC': 'usd-coin',            // USDC
  // Add more tokens as needed
};
```

### 3. Start the Server
```bash
npm run dev
```

The price update job will start automatically and fetch prices every 5 minutes.

## Token Address Mapping

The service maps Stellar token addresses to CoinGecko coin IDs:

- **Native XLM**: Use `'native'` as the token address
- **Other tokens**: Use the token symbol or contract address

To find CoinGecko IDs:
1. Visit https://www.coingecko.com/
2. Search for the token
3. The ID is in the URL (e.g., `stellar` for XLM)

## API Usage Examples

### Get All Streams
```bash
curl http://localhost:3000/api/streams
```

### Get Specific Stream
```bash
curl http://localhost:3000/api/streams/stream_123
```

### Get Streams by Sender
```bash
curl http://localhost:3000/api/streams/sender/GABC...
```

### Get Streams by Receiver
```bash
curl http://localhost:3000/api/streams/receiver/GDEF...
```

## Price Update Behavior

- **Initial Update**: Prices are fetched immediately when the server starts
- **Periodic Updates**: Prices refresh every 5 minutes
- **Caching**: Prices are cached in the database to reduce API calls
- **Fallback**: If a price is unavailable, `estimatedUsdValue` will be `null`

## Rate Limiting

CoinGecko free tier limits:
- 10-30 calls/minute
- No API key required for basic usage

The current implementation fetches all configured tokens in a single API call to minimize rate limit impact.

## Error Handling

- If CoinGecko API fails, the service logs the error and continues with cached prices
- Missing token mappings result in `null` USD values
- API endpoints return 500 errors if database queries fail

## Future Enhancements

1. **Multiple Price Sources**: Add fallback to Stellar DEX prices
2. **Historical Prices**: Track price history for analytics
3. **Custom Token Support**: Allow dynamic token registration
4. **Price Alerts**: Notify on significant price changes
5. **Rate Limit Handling**: Implement exponential backoff for API errors

## Testing

To test the feature:

1. Ensure database is migrated
2. Start the server
3. Check logs for "Fetched X token prices from CoinGecko"
4. Query the API endpoints to verify USD values are included
5. Wait 5 minutes and verify prices update automatically

## Monitoring

Monitor these logs:
- `Starting price update job (every 5 minutes)`
- `Fetched X token prices from CoinGecko`
- `Updated X token prices in database`
- Any error messages from the price feed service

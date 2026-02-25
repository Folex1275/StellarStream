# Quick Start: USD Value Feature

## Prerequisites
- Node.js and npm installed
- PostgreSQL database running
- Backend dependencies installed (`npm install`)

## Setup (5 minutes)

### 1. Generate Prisma Client
```bash
cd backend
npm run db:generate
```

This generates the TypeScript client for the updated schema including the new `TokenPrice` model.

### 2. Run Database Migration
```bash
npm run db:migrate
```

When prompted, name the migration: `add_token_price_table`

This creates the `TokenPrice` table in your database.

### 3. Configure Tokens (Optional)
Edit `src/services/price-feed.service.ts` to add more tokens:

```typescript
const TOKEN_ID_MAP: Record<string, string> = {
  'native': 'stellar',           // XLM
  'USDC': 'usd-coin',            // USDC
  // Add more tokens as needed
};
```

Find CoinGecko IDs at: https://www.coingecko.com/

### 4. Start the Server
```bash
npm run dev
```

You should see:
```
🚀 Server is running on port 3000
Starting price update job (every 5 minutes)
Fetched 2 token prices from CoinGecko
Updated 2 token prices in database
```

## Test the Feature

### Test 1: Health Check
```bash
curl http://localhost:3000/health
```

Expected: `{"status":"ok","message":"StellarStream Backend is running"}`

### Test 2: Get All Streams
```bash
curl http://localhost:3000/api/streams
```

Expected: JSON with streams array, each including `estimatedUsdValue`

### Test 3: Run Price Feed Test
```bash
npm run test:price-feed
```

Expected: Test output showing prices fetched and calculated

## Verify It's Working

1. **Check Logs**: Look for price update messages every 5 minutes
2. **Check Database**: Run `npm run db:studio` and view `TokenPrice` table
3. **Check API**: All stream endpoints should return `estimatedUsdValue`

## Common Issues

### Issue: Prisma client not found
**Fix**: Run `npm run db:generate`

### Issue: Database migration fails
**Fix**: Ensure PostgreSQL is running and `DATABASE_URL` is correct in `.env`

### Issue: No USD values in API
**Fix**: 
1. Check logs for CoinGecko errors
2. Verify token mappings
3. Wait 5 minutes for first price update

### Issue: TypeScript errors
**Fix**: Run `npm run type-check` to see details

## What Was Added

### New API Endpoints
- `GET /api/streams` - All streams with USD values
- `GET /api/streams/:id` - Single stream with USD value
- `GET /api/streams/sender/:address` - Sender's streams
- `GET /api/streams/receiver/:address` - Receiver's streams

### New Service
- `price-feed.service.ts` - Handles all price operations

### New Database Table
- `TokenPrice` - Stores current token prices

### Background Job
- Updates prices every 5 minutes automatically

## Next Steps

1. ✅ Feature is ready to use
2. Update frontend to display USD values
3. Add more token mappings as needed
4. Monitor logs for any issues

## Documentation

- `USD_VALUE_FEATURE.md` - Complete feature documentation
- `MIGRATION_GUIDE.md` - Detailed migration steps
- `API_ENDPOINTS.md` - API reference
- `USD_VALUE_IMPLEMENTATION.md` - Implementation summary

## Support

If you encounter issues:
1. Check the logs for error messages
2. Review the troubleshooting section in `MIGRATION_GUIDE.md`
3. Verify all prerequisites are met
4. Ensure database migrations completed successfully

---

**Estimated Setup Time**: 5 minutes  
**Difficulty**: Easy  
**Status**: Production Ready ✅

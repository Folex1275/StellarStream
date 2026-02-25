# Migration Guide: USD Value Feature

## Quick Start

Follow these steps to add USD value tracking to your StellarStream backend:

### Step 1: Install Dependencies (if needed)
The feature uses existing dependencies. No new packages required.

### Step 2: Generate Prisma Client
```bash
cd backend
npm run db:generate
```

### Step 3: Run Database Migration
```bash
npm run db:migrate
```

When prompted for a migration name, use: `add_token_price_table`

### Step 4: Configure Token Mappings
Edit `src/services/price-feed.service.ts` and update the `TOKEN_ID_MAP`:

```typescript
const TOKEN_ID_MAP: Record<string, string> = {
  'native': 'stellar',           // Native XLM
  'USDC': 'usd-coin',            // USDC on Stellar
  // Add your tokens here
};
```

### Step 5: Start the Server
```bash
npm run dev
```

The price update job will start automatically.

## Verification

### Check Price Updates
Watch the logs for:
```
Starting price update job (every 5 minutes)
Fetched 2 token prices from CoinGecko
Updated 2 token prices in database
```

### Test API Endpoints
```bash
# Health check
curl http://localhost:3000/health

# Get all streams with USD values
curl http://localhost:3000/api/streams

# Get specific stream
curl http://localhost:3000/api/streams/YOUR_STREAM_ID
```

### Verify Database
```bash
npm run db:studio
```

Check the `TokenPrice` table for price data.

## Rollback (if needed)

If you need to rollback the migration:

```bash
# Revert the last migration
npx prisma migrate reset

# Or manually drop the table
# DROP TABLE "TokenPrice";
```

## Troubleshooting

### Issue: "Cannot find module '../generated/client/index.js'"
**Solution**: Run `npm run db:generate` to generate Prisma client

### Issue: No prices showing in API responses
**Solution**: 
1. Check logs for CoinGecko API errors
2. Verify token mappings in `TOKEN_ID_MAP`
3. Check database for `TokenPrice` entries

### Issue: TypeScript errors
**Solution**: Run `npm run type-check` to see detailed errors

### Issue: Rate limit errors from CoinGecko
**Solution**: The free tier allows 10-30 calls/minute. Current implementation uses 1 call per update cycle.

## Production Considerations

1. **Environment Variables**: No new env vars required
2. **Database**: Ensure PostgreSQL is running and accessible
3. **Monitoring**: Watch for CoinGecko API errors in logs
4. **Scaling**: Consider caching strategies for high-traffic scenarios
5. **Backup**: The `TokenPrice` table is non-critical and can be rebuilt

## Next Steps

After successful migration:
1. Update frontend to display USD values
2. Add more token mappings as needed
3. Monitor price update logs
4. Consider adding price history tracking

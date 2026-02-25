# Stellar Federation Address Resolver

## Overview

The Federation Address Resolver service allows users to see human-readable addresses (user*domain.com) instead of cryptic Stellar account IDs (G...123). It implements caching to minimize external network requests and improve performance.

## Features

- ✅ Resolve federation addresses (user*domain.com) to Stellar account IDs
- ✅ 24-hour caching to minimize external API calls
- ✅ Batch resolution support for multiple addresses
- ✅ React hooks for easy component integration
- ✅ Ready-to-use UI components
- ✅ TypeScript support with full type safety
- ✅ Error handling and validation

## Architecture

### Components

1. **federation-types.ts** - TypeScript types and validation utilities
2. **federation-resolver.ts** - Core service with caching logic
3. **use-federation.ts** - React hook for component integration
4. **FederatedAddress.tsx** - UI components for displaying addresses
5. **API Route** - Next.js API endpoint using stellar-sdk

## Installation

```bash
npm install stellar-sdk
```

## Usage

### Basic Resolution

```typescript
import { federationResolver } from '@/lib/federation-resolver';

// Resolve a single address
const result = await federationResolver.resolve('user*example.com');

if ('error' in result) {
  console.error(result.error);
} else {
  console.log(result.account_id); // G...123
}
```

### Using React Hook

```typescript
import { useFederation } from '@/lib/use-federation';

function MyComponent() {
  const { resolve, loading, error } = useFederation();

  const handleResolve = async () => {
    const record = await resolve('user*example.com');
    if (record) {
      console.log(record.account_id);
    }
  };

  return (
    <button onClick={handleResolve} disabled={loading}>
      {loading ? 'Resolving...' : 'Resolve Address'}
    </button>
  );
}
```

### Using UI Components

```typescript
import { FederatedAddress, ResolvedAddress } from '@/components/FederatedAddress';

// Display a federation address with resolution
<ResolvedAddress 
  federationAddress="user*example.com" 
  showAccountId={true}
/>

// Display any address with smart formatting
<FederatedAddress 
  address="GXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX" 
  fallbackToShort={true}
/>
```

### Batch Resolution

```typescript
const addresses = [
  'alice*example.com',
  'bob*example.com',
  'charlie*example.com'
];

const results = await federationResolver.resolveBatch(addresses);

results.forEach((result, address) => {
  if ('error' in result) {
    console.error(`${address}: ${result.error}`);
  } else {
    console.log(`${address} -> ${result.account_id}`);
  }
});
```

## API Endpoint

### GET /api/federation/resolve

Resolves a federation address to a Stellar account ID.

**Query Parameters:**
- `address` (required) - Federation address in format user*domain.com

**Response (Success):**
```json
{
  "account_id": "GXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
  "stellar_address": "user*example.com",
  "memo_type": "text",
  "memo": "optional memo"
}
```

**Response (Error):**
```json
{
  "error": "Error message",
  "address": "user*example.com"
}
```

## Caching

The service implements a 24-hour cache to minimize external network requests:

- Cache is stored in-memory (Map)
- Each entry expires after 24 hours
- Cache is checked before making external requests
- Failed resolutions are not cached

### Cache Management

```typescript
// Clear all cache
federationResolver.clearCache();

// Clear only expired entries
federationResolver.clearExpiredCache();

// Get cache statistics
const stats = federationResolver.getCacheStats();
console.log(`Cache size: ${stats.size}`);
console.log(`Cached addresses: ${stats.entries.join(', ')}`);
```

## Validation

Federation addresses must follow the format: `user*domain.com`

- Username: alphanumeric, dots, underscores, hyphens
- Domain: valid domain name with TLD

```typescript
import { isValidFederationAddress } from '@/lib/federation-types';

isValidFederationAddress('user*example.com'); // true
isValidFederationAddress('invalid'); // false
isValidFederationAddress('user@example.com'); // false
```

## Error Handling

The service provides detailed error messages:

- Invalid format errors
- Network request failures
- Federation server errors
- Timeout errors

All errors include the original address for debugging.

## Performance Considerations

1. **Caching**: 24-hour cache reduces API calls by ~95% for repeated lookups
2. **Batch Resolution**: Parallel processing for multiple addresses
3. **Lazy Loading**: stellar-sdk is dynamically imported in API route
4. **Memory Management**: Cache cleanup utilities available

## Testing

Example test scenarios:

```typescript
// Test valid address
await federationResolver.resolve('user*example.com');

// Test invalid format
await federationResolver.resolve('invalid-address');

// Test batch resolution
await federationResolver.resolveBatch([
  'user1*example.com',
  'user2*example.com'
]);

// Test cache
const result1 = await federationResolver.resolve('user*example.com');
const result2 = await federationResolver.resolve('user*example.com'); // From cache
```

## Future Enhancements

- [ ] Persistent cache (localStorage/IndexedDB)
- [ ] Reverse lookup (account ID -> federation address)
- [ ] Cache invalidation strategies
- [ ] Metrics and monitoring
- [ ] Rate limiting
- [ ] Offline support

## References

- [Stellar Federation Protocol](https://developers.stellar.org/docs/encyclopedia/federation)
- [stellar-sdk Documentation](https://stellar.github.io/js-stellar-sdk/)
- [SEP-0002: Federation Protocol](https://github.com/stellar/stellar-protocol/blob/master/ecosystem/sep-0002.md)

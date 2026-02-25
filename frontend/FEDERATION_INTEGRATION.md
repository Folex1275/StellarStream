# Federation Resolver Integration Guide

## Quick Start

### 1. Install Dependencies

```bash
cd frontend
npm install
```

The `stellar-sdk` dependency has been added to package.json.

### 2. Start Development Server

```bash
npm run dev
```

### 3. Test the API Endpoint

```bash
curl "http://localhost:3000/api/federation/resolve?address=user*example.com"
```

## Integration Examples

### Example 1: Display User-Friendly Addresses in Transaction List

```typescript
import { FederatedAddress } from '@/components/FederatedAddress';

function TransactionList({ transactions }) {
  return (
    <div>
      {transactions.map((tx) => (
        <div key={tx.id}>
          <span>From: </span>
          <FederatedAddress 
            address={tx.sender} 
            fallbackToShort={true}
          />
          <span> → </span>
          <FederatedAddress 
            address={tx.receiver} 
            fallbackToShort={true}
          />
        </div>
      ))}
    </div>
  );
}
```

### Example 2: Resolve Address Before Sending Payment

```typescript
import { useFederation } from '@/lib/use-federation';

function SendPayment() {
  const [recipient, setRecipient] = useState('');
  const { resolve, loading } = useFederation();

  const handleSend = async () => {
    // Check if it's a federation address
    if (recipient.includes('*')) {
      const record = await resolve(recipient);
      if (record) {
        // Use record.account_id for the transaction
        await sendPayment(record.account_id, amount);
      }
    } else {
      // Direct account ID
      await sendPayment(recipient, amount);
    }
  };

  return (
    <form onSubmit={handleSend}>
      <input
        placeholder="G...123 or user*domain.com"
        value={recipient}
        onChange={(e) => setRecipient(e.target.value)}
      />
      <button disabled={loading}>Send</button>
    </form>
  );
}
```

### Example 3: Batch Resolve for Dashboard

```typescript
import { useEffect, useState } from 'react';
import { federationResolver } from '@/lib/federation-resolver';

function Dashboard({ streams }) {
  const [resolvedAddresses, setResolvedAddresses] = useState(new Map());

  useEffect(() => {
    async function resolveAll() {
      // Extract all unique addresses
      const addresses = [...new Set(
        streams.flatMap(s => [s.sender, s.receiver])
      )].filter(addr => addr.includes('*'));

      // Batch resolve
      const results = await federationResolver.resolveBatch(addresses);
      setResolvedAddresses(results);
    }

    resolveAll();
  }, [streams]);

  return (
    <div>
      {streams.map(stream => {
        const senderDisplay = resolvedAddresses.get(stream.sender)?.stellar_address 
          || stream.sender;
        const receiverDisplay = resolvedAddresses.get(stream.receiver)?.stellar_address 
          || stream.receiver;

        return (
          <div key={stream.id}>
            {senderDisplay} → {receiverDisplay}
          </div>
        );
      })}
    </div>
  );
}
```

### Example 4: Input Validation

```typescript
import { isValidFederationAddress } from '@/lib/federation-types';

function AddressInput({ onChange }) {
  const [value, setValue] = useState('');
  const [isValid, setIsValid] = useState(true);

  const handleChange = (e) => {
    const newValue = e.target.value;
    setValue(newValue);

    // Validate if it looks like a federation address
    if (newValue.includes('*')) {
      setIsValid(isValidFederationAddress(newValue));
    } else {
      // Validate as Stellar account ID
      setIsValid(/^G[A-Z0-9]{55}$/.test(newValue));
    }

    onChange(newValue);
  };

  return (
    <div>
      <input
        value={value}
        onChange={handleChange}
        className={isValid ? '' : 'border-red-500'}
      />
      {!isValid && (
        <p className="text-red-500 text-sm">
          Invalid address format
        </p>
      )}
    </div>
  );
}
```

## Common Use Cases

### 1. Stream Creation
When creating a stream, allow users to enter federation addresses:

```typescript
const createStream = async (recipient: string, amount: number) => {
  let accountId = recipient;

  if (recipient.includes('*')) {
    const record = await federationResolver.resolve(recipient);
    if (!record) throw new Error('Could not resolve address');
    accountId = record.account_id;
  }

  // Create stream with accountId
};
```

### 2. Address Book
Store and display federation addresses in user's address book:

```typescript
interface Contact {
  name: string;
  federationAddress?: string;
  accountId: string;
}

function ContactList({ contacts }: { contacts: Contact[] }) {
  return (
    <ul>
      {contacts.map(contact => (
        <li key={contact.accountId}>
          <strong>{contact.name}</strong>
          <br />
          {contact.federationAddress || (
            <FederatedAddress address={contact.accountId} />
          )}
        </li>
      ))}
    </ul>
  );
}
```

### 3. Transaction History
Display human-readable addresses in transaction history:

```typescript
function TransactionHistory({ transactions }) {
  return (
    <table>
      <thead>
        <tr>
          <th>From</th>
          <th>To</th>
          <th>Amount</th>
        </tr>
      </thead>
      <tbody>
        {transactions.map(tx => (
          <tr key={tx.id}>
            <td><FederatedAddress address={tx.from} /></td>
            <td><FederatedAddress address={tx.to} /></td>
            <td>{tx.amount}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
```

## Cache Management

### Clear Cache on User Logout

```typescript
import { federationResolver } from '@/lib/federation-resolver';

function logout() {
  // Clear federation cache
  federationResolver.clearCache();
  
  // Other logout logic
}
```

### Periodic Cache Cleanup

```typescript
// In your app initialization
useEffect(() => {
  const interval = setInterval(() => {
    federationResolver.clearExpiredCache();
  }, 60 * 60 * 1000); // Every hour

  return () => clearInterval(interval);
}, []);
```

## Testing

### Unit Tests Example

```typescript
import { federationResolver } from '@/lib/federation-resolver';
import { isValidFederationAddress } from '@/lib/federation-types';

describe('Federation Resolver', () => {
  test('validates federation address format', () => {
    expect(isValidFederationAddress('user*example.com')).toBe(true);
    expect(isValidFederationAddress('invalid')).toBe(false);
  });

  test('resolves valid address', async () => {
    const result = await federationResolver.resolve('user*example.com');
    expect(result).toHaveProperty('account_id');
  });

  test('caches resolved addresses', async () => {
    await federationResolver.resolve('user*example.com');
    const stats = federationResolver.getCacheStats();
    expect(stats.size).toBeGreaterThan(0);
  });
});
```

## Troubleshooting

### Issue: "stellar-sdk not found"
**Solution:** Run `npm install` to install dependencies

### Issue: API route returns 404
**Solution:** Ensure the API route file exists at `app/api/federation/resolve/route.ts`

### Issue: CORS errors
**Solution:** The API route is on the same domain, so CORS shouldn't be an issue. If using external API, configure Next.js headers.

### Issue: Cache not working
**Solution:** Check that you're using the singleton instance from `federation-resolver.ts`

## Performance Tips

1. **Batch Resolution**: Use `resolveBatch()` for multiple addresses
2. **Preload Common Addresses**: Resolve frequently used addresses on app load
3. **Cache Warming**: Pre-populate cache with known addresses
4. **Lazy Loading**: Only resolve addresses when they're visible

## Security Considerations

1. **Validate Input**: Always validate federation addresses before resolution
2. **Rate Limiting**: Consider implementing rate limiting on the API route
3. **Error Handling**: Don't expose sensitive error details to users
4. **HTTPS Only**: Ensure federation servers use HTTPS

## Next Steps

1. Integrate into existing components
2. Add to transaction flows
3. Update UI to show federation addresses
4. Test with real Stellar federation servers
5. Monitor cache performance
6. Consider persistent caching for production

# Audit Log Quick Start Guide

## What is the Audit Log?

The Audit Log is a unified feed that shows every protocol event (stream creation, withdrawal, cancellation) in chronological order. It joins Stream and EventLog data to provide a comprehensive view of all protocol actions.

## Quick Setup

1. **Generate Prisma Client** (after schema changes):
   ```bash
   npm run prisma:generate
   ```

2. **Run Migration**:
   ```bash
   npx prisma migrate dev --name add-event-log
   ```

3. **Start Server**:
   ```bash
   npm run dev
   ```

## API Endpoints

### Get Last 50 Events
```bash
GET /api/audit-log
```

**Example Response:**
```json
{
  "success": true,
  "count": 50,
  "events": [
    {
      "id": "clx123abc",
      "eventType": "create",
      "streamId": "12345",
      "txHash": "abc123def456",
      "ledger": 1000,
      "ledgerClosedAt": "2024-01-01T00:00:00Z",
      "sender": "GABC123...",
      "receiver": "GDEF456...",
      "amount": "1000000",
      "metadata": {...},
      "createdAt": "2024-01-01T00:00:00Z"
    }
  ]
}
```

### Get Events with Custom Limit
```bash
GET /api/audit-log?limit=100
```

### Get Events for Specific Stream
```bash
GET /api/audit-log/:streamId
```

## Event Types

| Event Type | Description | Key Fields |
|------------|-------------|------------|
| `create` | Stream created | sender, receiver, amount |
| `withdraw` | Funds withdrawn | amount |
| `cancel` | Stream cancelled | to_receiver, to_sender |

## How It Works

1. **Event Watcher** monitors blockchain events
2. **Event Handler** processes each event type
3. **Audit Log Service** saves event to database
4. **API** exposes events via REST endpoints

## Code Example: Using the Service

```typescript
import { AuditLogService } from './services/audit-log.service';

const auditLogService = new AuditLogService();

// Get recent events
const events = await auditLogService.getRecentEvents(50);

// Get events for a specific stream
const streamEvents = await auditLogService.getStreamEvents('12345');
```

## Testing

```bash
# Start the server
npm run dev

# In another terminal, test the endpoint
curl http://localhost:3000/api/audit-log

# Test with limit
curl http://localhost:3000/api/audit-log?limit=10

# Test stream-specific endpoint
curl http://localhost:3000/api/audit-log/12345
```

## Database Schema

The `EventLog` table stores:
- Event metadata (type, streamId, txHash, ledger)
- Participant info (sender, receiver)
- Financial data (amount)
- Additional context (metadata JSON)
- Timestamps (ledgerClosedAt, createdAt)

Indexes on: streamId, eventType, createdAt, ledger

## Next Steps

After setup:
1. Events are automatically logged as they occur
2. Query the API to retrieve event history
3. Use the data for analytics, monitoring, or UI display

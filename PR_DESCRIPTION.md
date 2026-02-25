# Unified Audit Log for Protocol Events

## Description
This PR implements a unified "Audit Log" that shows every event (creation, withdrawal, cancellation) across the whole protocol in chronological order.

## Changes Made

### Database Schema
- ✅ Added `EventLog` table to Prisma schema
- ✅ Includes indexes on `streamId`, `eventType`, `createdAt`, and `ledger` for optimal query performance
- ✅ Stores comprehensive event data including participants, amounts, and metadata

### Backend Services
- ✅ Created `AuditLogService` with methods:
  - `logEvent()` - Log events to the audit log
  - `getRecentEvents()` - Retrieve last N events (default: 50)
  - `getStreamEvents()` - Get all events for a specific stream

### Event Watcher Integration
- ✅ Updated event watcher to automatically log all protocol events:
  - Stream creation → logged as "create"
  - Withdrawals → logged as "withdraw"
  - Cancellations → logged as "cancel"

### API Endpoints
- ✅ `GET /api/audit-log` - Returns last 50 protocol events (configurable up to 100)
- ✅ `GET /api/audit-log/:streamId` - Returns all events for a specific stream

### Documentation
- ✅ Comprehensive feature documentation (`AUDIT_LOG_FEATURE.md`)
- ✅ Quick start guide for developers (`AUDIT_LOG_QUICK_START.md`)
- ✅ SQL migration file for database schema changes

## Testing Instructions

1. Generate Prisma client:
   ```bash
   cd backend
   npm run prisma:generate
   ```

2. Run database migration:
   ```bash
   npx prisma migrate dev --name add-event-log
   ```

3. Start the server:
   ```bash
   npm run dev
   ```

4. Test the endpoints:
   ```bash
   # Get recent events
   curl http://localhost:3000/api/audit-log
   
   # Get events with custom limit
   curl http://localhost:3000/api/audit-log?limit=100
   
   # Get events for specific stream
   curl http://localhost:3000/api/audit-log/12345
   ```

## API Response Example

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

## Task Completion

- [x] Join the Stream and EventLog tables to create a comprehensive list
- [x] Return a feed of the last 50 protocol actions
- [x] Chronological ordering (most recent first)
- [x] Support for all event types (creation, withdrawal, cancellation)

## Labels
`[Backend]` `Medium` `Database`

## Related Issues
Closes #[issue-number]

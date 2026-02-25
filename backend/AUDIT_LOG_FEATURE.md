# Audit Log Feature

## Overview
The Audit Log feature provides a unified view of all protocol events (creation, withdrawal, cancellation) across the entire StellarStream protocol in chronological order.

## Implementation Summary

### 1. Database Schema Changes
Added a new `EventLog` table to the Prisma schema (`prisma/schema.prisma`):

```prisma
model EventLog {
  id              String   @id @default(cuid())
  eventType       String   // create, withdraw, cancel
  streamId        String
  txHash          String
  ledger          Int
  ledgerClosedAt  String
  sender          String?
  receiver        String?
  amount          BigInt?
  metadata        String?  // JSON string for additional event data
  createdAt       DateTime @default(now())

  @@index([streamId])
  @@index([eventType])
  @@index([createdAt])
  @@index([ledger])
}
```

### 2. New Service: AuditLogService
Created `src/services/audit-log.service.ts` with the following methods:

- `logEvent(entry: EventLogEntry)`: Logs an event to the audit log
- `getRecentEvents(limit: number)`: Retrieves the last N events (default: 50)
- `getStreamEvents(streamId: string)`: Retrieves all events for a specific stream

### 3. Event Watcher Integration
Updated `src/event-watcher.ts` to automatically log events to the audit log:

- Stream creation events → logged as "create"
- Withdrawal events → logged as "withdraw"
- Cancellation events → logged as "cancel"

### 4. API Endpoints
Created REST API endpoints in `src/api/index.ts`:

#### GET /api/audit-log
Returns the last 50 protocol events in chronological order.

**Query Parameters:**
- `limit` (optional): Number of events to return (default: 50, max: 100)

**Response:**
```json
{
  "success": true,
  "count": 50,
  "events": [
    {
      "id": "clx123...",
      "eventType": "create",
      "streamId": "12345",
      "txHash": "abc123...",
      "ledger": 1000,
      "ledgerClosedAt": "2024-01-01T00:00:00Z",
      "sender": "GABC...",
      "receiver": "GDEF...",
      "amount": "1000000",
      "metadata": {...},
      "createdAt": "2024-01-01T00:00:00Z"
    },
    ...
  ]
}
```

#### GET /api/audit-log/:streamId
Returns all events for a specific stream.

**Response:**
```json
{
  "success": true,
  "streamId": "12345",
  "count": 3,
  "events": [...]
}
```

## Setup Instructions

### 1. Generate Prisma Client
After updating the schema, regenerate the Prisma client:

```bash
cd backend
npm run prisma:generate
```

### 2. Run Database Migration
Apply the schema changes to your database:

```bash
npm run prisma:migrate
```

Or for development:

```bash
npx prisma migrate dev --name add-event-log
```

### 3. Start the Server
The API endpoints will be available once the server is running:

```bash
npm run dev
```

## Usage Examples

### Retrieve Recent Protocol Events
```bash
curl http://localhost:3000/api/audit-log
```

### Retrieve Recent Events with Custom Limit
```bash
curl http://localhost:3000/api/audit-log?limit=100
```

### Retrieve Events for a Specific Stream
```bash
curl http://localhost:3000/api/audit-log/12345
```

## Features

- **Comprehensive Logging**: All protocol events are automatically logged
- **Chronological Order**: Events are sorted by creation time (most recent first)
- **Indexed Queries**: Database indexes on streamId, eventType, createdAt, and ledger for fast queries
- **Flexible Retrieval**: Query all events or filter by specific stream
- **Rich Metadata**: Each event includes transaction hash, ledger info, and additional metadata
- **Type Safety**: Full TypeScript support with proper type definitions

## Event Types

1. **create**: Stream creation events
   - Includes: sender, receiver, total amount
   
2. **withdraw**: Withdrawal events
   - Includes: amount withdrawn
   
3. **cancel**: Cancellation events
   - Includes: amount to receiver, amount to sender

## Database Indexes

The EventLog table includes indexes on:
- `streamId`: Fast lookup of events by stream
- `eventType`: Filter events by type
- `createdAt`: Chronological ordering
- `ledger`: Blockchain ledger sequence lookup

## Error Handling

- Failed event logging is logged but doesn't stop event processing
- API endpoints return proper error responses with 500 status codes
- All errors are logged with context for debugging

## Future Enhancements

Potential improvements:
- Pagination support for large result sets
- Date range filtering
- Event type filtering in API
- Real-time event streaming via WebSockets
- Event aggregation and statistics

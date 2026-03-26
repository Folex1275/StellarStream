# Audit Log Export Feature Guide

## Overview

The Audit Log Export feature enables professional users to export their streaming history for tax and accounting purposes. Users can download their complete transaction history in both CSV and JSON formats.

## Features

- **Dual Format Support**: Export as CSV or JSON
- **Complete History**: Includes all stream events (create, withdraw, cancel, etc.)
- **Tax-Ready Fields**: Timestamp, Action, Amount, Asset, TX_Hash, Sender, Receiver
- **Downloadable Files**: Automatic file download with proper headers
- **Error Handling**: Graceful handling of missing data and edge cases

## API Endpoint

### Export Stream Audit Log

```
GET /api/v2/streams/:id/export
```

#### Path Parameters
- `id` (required): The stream ID to export

#### Query Parameters
- `format` (optional): Export format - `csv` or `json` (default: `csv`)

#### Response Headers
- `Content-Type`: `text/csv` or `application/json` depending on format
- `Content-Disposition`: `attachment; filename="stream-{id}-audit-log.{ext}"`

## Usage Examples

### Export as CSV (Default)

```bash
curl -X GET "http://localhost:3000/api/v2/streams/stream-123/export" \
  -H "Accept: text/csv" \
  -o stream-123-audit-log.csv
```

### Export as JSON

```bash
curl -X GET "http://localhost:3000/api/v2/streams/stream-123/export?format=json" \
  -H "Accept: application/json" \
  -o stream-123-audit-log.json
```

### Using JavaScript/Fetch

```typescript
// Export as CSV
const response = await fetch('/api/v2/streams/stream-123/export');
const csv = await response.text();

// Export as JSON
const response = await fetch('/api/v2/streams/stream-123/export?format=json');
const data = await response.json();
```

## Response Format

### CSV Format

```csv
"Timestamp","Action","Amount","Asset","TX_Hash","Sender","Receiver"
"2024-01-01T00:00:00Z","CREATE","1000000000","USDC","abc123def456","GAAAA...","GBBBB..."
"2024-01-02T12:30:00Z","WITHDRAW","500000000","USDC","def456ghi789","GAAAA...","GBBBB..."
"2024-01-03T18:45:00Z","CANCEL","500000000","USDC","ghi789jkl012","GAAAA...","GBBBB..."
```

### JSON Format

```json
[
  {
    "Timestamp": "2024-01-01T00:00:00Z",
    "Action": "CREATE",
    "Amount": "1000000000",
    "Asset": "USDC",
    "TX_Hash": "abc123def456",
    "Sender": "GAAAA...",
    "Receiver": "GBBBB..."
  },
  {
    "Timestamp": "2024-01-02T12:30:00Z",
    "Action": "WITHDRAW",
    "Amount": "500000000",
    "Asset": "USDC",
    "TX_Hash": "def456ghi789",
    "Sender": "GAAAA...",
    "Receiver": "GBBBB..."
  }
]
```

## Field Descriptions

| Field | Description | Example |
|-------|-------------|---------|
| **Timestamp** | ISO 8601 timestamp of the ledger close | `2024-01-01T00:00:00Z` |
| **Action** | Event type in uppercase | `CREATE`, `WITHDRAW`, `CANCEL` |
| **Amount** | Amount in stroops (smallest unit) | `1000000000` |
| **Asset** | Token asset code | `USDC`, `XLM`, `UNKNOWN` |
| **TX_Hash** | Transaction hash on Stellar network | `abc123def456...` |
| **Sender** | Stellar address of the sender | `GAAAA...` |
| **Receiver** | Stellar address of the receiver | `GBBBB...` |

## Error Responses

### 404 Not Found
```json
{
  "success": false,
  "error": "Stream not found"
}
```

### 400 Bad Request
```json
{
  "success": false,
  "error": "Invalid format parameter"
}
```

## Implementation Details

### Service Layer

The `ExportService` class handles all export logic:

```typescript
export class ExportService {
  async exportStreamAsCSV(streamId: string): Promise<string>
  async exportStreamAsJSON(streamId: string): Promise<string>
}
```

### Data Assembly

1. Query `EventLog` table for all events matching the stream ID
2. Sort events by creation timestamp (ascending)
3. Transform event data to export format
4. Handle missing metadata gracefully (defaults to "UNKNOWN")
5. Convert BigInt amounts to strings for JSON compatibility

### Database Query

```sql
SELECT 
  ledgerClosedAt as Timestamp,
  eventType as Action,
  amount as Amount,
  metadata as Asset,
  txHash as TX_Hash,
  sender as Sender,
  receiver as Receiver
FROM EventLog
WHERE streamId = $1
ORDER BY createdAt ASC
```

## Use Cases

### 1. Tax Reporting
Export transaction history for tax filing and compliance:
```bash
curl -X GET "http://localhost:3000/api/v2/streams/stream-123/export?format=csv" \
  -o tax-report-2024.csv
```

### 2. Accounting Reconciliation
Reconcile streaming payments with accounting records:
```bash
# Export as JSON for programmatic processing
curl -X GET "http://localhost:3000/api/v2/streams/stream-123/export?format=json" \
  -o accounting-reconciliation.json
```

### 3. Audit Trail
Provide complete audit trail for compliance:
```bash
# Export all streams for a user
for stream_id in $(curl -s http://localhost:3000/api/v2/streams/GUSER... | jq -r '.data.v1[].id'); do
  curl -X GET "http://localhost:3000/api/v2/streams/$stream_id/export" \
    -o "stream-$stream_id-audit.csv"
done
```

### 4. Record Keeping
Archive transaction history for future reference:
```bash
# Create timestamped backup
curl -X GET "http://localhost:3000/api/v2/streams/stream-123/export?format=json" \
  -o "stream-123-backup-$(date +%Y%m%d).json"
```

## Performance Considerations

- **On-Demand Generation**: Exports are generated on-demand from the EventLog table
- **Indexing**: EventLog table is indexed on `streamId` and `createdAt` for fast queries
- **Large Exports**: Streams with many events may take longer to export
- **Memory**: JSON parsing of metadata is done per-event to minimize memory usage
- **Future Optimization**: Consider implementing pagination for very large exports

## Testing

### Unit Tests

```bash
npm run test:jest
```

Test coverage includes:
- CSV export with multiple events
- JSON export with correct structure
- Empty event logs
- Missing metadata handling
- Invalid format parameter handling
- Content-Disposition headers

### Integration Tests

```bash
# Start the server
npm run dev

# Test CSV export
curl -X GET "http://localhost:3000/api/v2/streams/stream-123/export"

# Test JSON export
curl -X GET "http://localhost:3000/api/v2/streams/stream-123/export?format=json"

# Test 404 error
curl -X GET "http://localhost:3000/api/v2/streams/nonexistent/export"
```

## Frontend Integration

### React Example

```typescript
import { useState } from 'react';

export function ExportButton({ streamId }: { streamId: string }) {
  const [loading, setLoading] = useState(false);

  const handleExport = async (format: 'csv' | 'json') => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/v2/streams/${streamId}/export?format=${format}`
      );
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `stream-${streamId}-audit-log.${format}`;
      a.click();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <button onClick={() => handleExport('csv')} disabled={loading}>
        Export as CSV
      </button>
      <button onClick={() => handleExport('json')} disabled={loading}>
        Export as JSON
      </button>
    </div>
  );
}
```

## Troubleshooting

### Issue: "Stream not found" error
**Solution**: Verify the stream ID is correct and the stream exists in the database.

### Issue: Empty export file
**Solution**: Check if the stream has any events in the EventLog table. New streams may not have events yet.

### Issue: "UNKNOWN" asset in export
**Solution**: This occurs when event metadata doesn't contain asset information. Verify the event was properly indexed.

### Issue: Large export taking too long
**Solution**: Consider exporting in smaller time ranges or implementing pagination in future versions.

## Future Enhancements

1. **Pagination**: Support for exporting large datasets in chunks
2. **Filtering**: Filter exports by date range, action type, or asset
3. **Compression**: Automatic gzip compression for large exports
4. **Scheduled Exports**: Automatic periodic exports to email or cloud storage
5. **Multi-Stream Export**: Export multiple streams in a single file
6. **Custom Fields**: Allow users to select which fields to include
7. **Format Support**: Add support for Excel, PDF, or other formats

## Related Documentation

- [Audit Log Feature Guide](./AUDIT_LOG_FEATURE.md)
- [API Reference](../docs/API_REFERENCE.md)
- [Database Schema](../prisma/schema.prisma)
- [Event Watcher](../src/event-watcher.ts)

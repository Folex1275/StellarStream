# Audit Log Export API

## Overview

The Audit Log Export API enables professional users to export their streaming history for tax and accounting purposes. Exports are available in both CSV and JSON formats.

## Endpoint

```
GET /api/v2/streams/:id/export
```

## Parameters

### Path Parameters
- `id` (required): The stream ID to export

### Query Parameters
- `format` (optional): Export format - `csv` or `json` (default: `csv`)

## Response

### CSV Format
Returns a downloadable CSV file with the following columns:
- **Timestamp**: ISO 8601 timestamp of the ledger close
- **Action**: Event type (CREATE, WITHDRAW, CANCEL, etc.)
- **Amount**: Amount in stroops (smallest unit)
- **Asset**: Token asset code (e.g., USDC, XLM)
- **TX_Hash**: Transaction hash on the Stellar network
- **Sender**: Stellar address of the sender
- **Receiver**: Stellar address of the receiver

### JSON Format
Returns a JSON array of audit log entries with the same fields as CSV.

## Examples

### Export as CSV
```bash
curl -X GET "http://localhost:3000/api/v2/streams/stream-123/export?format=csv" \
  -H "Accept: text/csv"
```

Response headers:
```
Content-Type: text/csv
Content-Disposition: attachment; filename="stream-stream-123-audit-log.csv"
```

### Export as JSON
```bash
curl -X GET "http://localhost:3000/api/v2/streams/stream-123/export?format=json" \
  -H "Accept: application/json"
```

Response:
```json
[
  {
    "Timestamp": "2024-01-01T00:00:00Z",
    "Action": "CREATE",
    "Amount": "1000000",
    "Asset": "USDC",
    "TX_Hash": "abc123...",
    "Sender": "GAAAA...",
    "Receiver": "GBBBB..."
  },
  {
    "Timestamp": "2024-01-02T12:30:00Z",
    "Action": "WITHDRAW",
    "Amount": "500000",
    "Asset": "USDC",
    "TX_Hash": "def456...",
    "Sender": "GAAAA...",
    "Receiver": "GBBBB..."
  }
]
```

## Error Responses

### 404 Not Found
```json
{
  "error": "Stream not found"
}
```

### 400 Bad Request
```json
{
  "error": "Invalid format parameter"
}
```

## Use Cases

1. **Tax Reporting**: Export transaction history for tax filing
2. **Accounting**: Reconcile streaming payments with accounting records
3. **Audits**: Provide complete audit trail for compliance
4. **Record Keeping**: Archive transaction history for future reference

## Data Fields

All amounts are in stroops (1 XLM = 10,000,000 stroops). The Asset field is extracted from event metadata and defaults to "UNKNOWN" if not available.

## Performance Considerations

- Exports are generated on-demand from the EventLog table
- Large streams with many events may take longer to export
- Consider implementing pagination for very large exports in future versions

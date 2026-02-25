# API Endpoints Documentation

## Base URL
```
http://localhost:3000
```

## Health Check

### GET /health
Check if the server is running.

**Response:**
```json
{
  "status": "ok",
  "message": "StellarStream Backend is running"
}
```

---

## Stream Endpoints

All stream endpoints return enriched data including USD values.

### GET /api/streams
Get all payment streams with USD values.

**Response:**
```json
{
  "streams": [
    {
      "id": "stream_123",
      "sender": "GABC123...",
      "receiver": "GDEF456...",
      "tokenAddress": "native",
      "amountPerSecond": "1000000",
      "totalAmount": "86400000000",
      "status": "ACTIVE",
      "estimatedUsdValue": 1234.56
    }
  ]
}
```

**Status Codes:**
- `200 OK` - Success
- `500 Internal Server Error` - Database error

---

### GET /api/streams/:id
Get a specific stream by ID.

**Parameters:**
- `id` (path) - Stream ID

**Example:**
```bash
curl http://localhost:3000/api/streams/stream_123
```

**Response:**
```json
{
  "id": "stream_123",
  "sender": "GABC123...",
  "receiver": "GDEF456...",
  "tokenAddress": "native",
  "amountPerSecond": "1000000",
  "totalAmount": "86400000000",
  "status": "ACTIVE",
  "estimatedUsdValue": 1234.56
}
```

**Status Codes:**
- `200 OK` - Success
- `404 Not Found` - Stream not found
- `500 Internal Server Error` - Database error

---

### GET /api/streams/sender/:address
Get all streams where the specified address is the sender.

**Parameters:**
- `address` (path) - Stellar account address

**Example:**
```bash
curl http://localhost:3000/api/streams/sender/GABC123...
```

**Response:**
```json
{
  "streams": [
    {
      "id": "stream_123",
      "sender": "GABC123...",
      "receiver": "GDEF456...",
      "tokenAddress": "native",
      "amountPerSecond": "1000000",
      "totalAmount": "86400000000",
      "status": "ACTIVE",
      "estimatedUsdValue": 1234.56
    }
  ]
}
```

**Status Codes:**
- `200 OK` - Success (empty array if no streams found)
- `500 Internal Server Error` - Database error

---

### GET /api/streams/receiver/:address
Get all streams where the specified address is the receiver.

**Parameters:**
- `address` (path) - Stellar account address

**Example:**
```bash
curl http://localhost:3000/api/streams/receiver/GDEF456...
```

**Response:**
```json
{
  "streams": [
    {
      "id": "stream_123",
      "sender": "GABC123...",
      "receiver": "GDEF456...",
      "tokenAddress": "native",
      "amountPerSecond": "1000000",
      "totalAmount": "86400000000",
      "status": "ACTIVE",
      "estimatedUsdValue": 1234.56
    }
  ]
}
```

**Status Codes:**
- `200 OK` - Success (empty array if no streams found)
- `500 Internal Server Error` - Database error

---

## Response Fields

### Stream Object

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Unique stream identifier |
| `sender` | string | Stellar address of the sender |
| `receiver` | string | Stellar address of the receiver |
| `tokenAddress` | string | Token contract address or 'native' for XLM |
| `amountPerSecond` | string | Amount streamed per second (in stroops) |
| `totalAmount` | string | Total amount to be streamed (in stroops) |
| `status` | string | Stream status: ACTIVE, PAUSED, COMPLETED, CANCELED |
| `estimatedUsdValue` | number \| null | Estimated USD value of totalAmount |

### Notes on Values

- **Amounts**: All amounts are in stroops (1 XLM = 10,000,000 stroops)
- **USD Values**: Updated every 5 minutes from CoinGecko API
- **Null USD Values**: Returned when price data is unavailable for the token

---

## Error Responses

All endpoints may return error responses in this format:

```json
{
  "error": "Error message description"
}
```

Common error scenarios:
- Database connection failures
- Invalid stream IDs
- Price feed service errors (logged but don't block responses)

---

## CORS Configuration

The API accepts requests from:
- Origins specified in `FRONTEND_URL` environment variable
- Default: `http://localhost:5173`

Allowed methods: GET, POST, PUT, DELETE, OPTIONS

---

## Rate Limiting

Currently no rate limiting is implemented. Consider adding rate limiting for production deployments.

---

## Authentication

Currently no authentication is required. Consider adding authentication for production deployments.

---

## Examples

### Using curl

```bash
# Get all streams
curl http://localhost:3000/api/streams

# Get specific stream
curl http://localhost:3000/api/streams/stream_123

# Get streams by sender
curl http://localhost:3000/api/streams/sender/GABC123...

# Get streams by receiver
curl http://localhost:3000/api/streams/receiver/GDEF456...
```

### Using JavaScript fetch

```javascript
// Get all streams
const response = await fetch('http://localhost:3000/api/streams');
const data = await response.json();
console.log(data.streams);

// Get specific stream
const stream = await fetch('http://localhost:3000/api/streams/stream_123')
  .then(res => res.json());
console.log(stream.estimatedUsdValue);
```

### Using Python requests

```python
import requests

# Get all streams
response = requests.get('http://localhost:3000/api/streams')
streams = response.json()['streams']

# Get specific stream
stream = requests.get('http://localhost:3000/api/streams/stream_123').json()
print(f"USD Value: ${stream['estimatedUsdValue']}")
```

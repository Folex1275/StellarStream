# StellarStream Backend

Backend service for indexing and serving Stellar payment stream data.

## Setup

```bash
npm install
```

Copy the environment file and configure:
```bash
cp .env.example .env
```
### Environment

- **REDIS_URL** – Redis connection URL (required for rate limiting). Example: `redis://localhost:6379`. With Docker Compose, use `redis://redis:6379`.
- **API_KEY** (optional) – When set, requests that send this value via `Authorization: Bearer <API_KEY>` or `X-API-Key: <API_KEY>` are treated as **authenticated** and get a higher rate limit (500 requests/min). Without a valid key, clients are **public** and limited to 100 requests/min. Used only for tiered rate limits; unauthenticated requests are still allowed.

## Development

```bash
npm run dev
```

## Build

```bash
npm run build
```

## Production

```bash
npm start
```

## Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Compile TypeScript to JavaScript
- `npm start` - Run compiled production build
- `npm run lint` - Run ESLint type checking
- `npm run type-check` - Run TypeScript compiler without emitting files

## Directory Structure

```
/src
  /api        - REST API routes and controllers
  /lib        - Shared DB and Redis clients
  /middleware - Auth and rate-limit middleware
  /indexer    - Stellar blockchain indexer
  /services   - Business logic layer
  /types      - TypeScript type definitions
```

## Security

The backend implements production-grade security features including CORS restrictions and secure HTTP headers via Helmet.js. See [SECURITY.md](./SECURITY.md) for detailed configuration and best practices.
## Public API (rate-limited)

- **GET /health** – Health check (not rate-limited).
- **GET /stats** – Aggregate stream statistics. Rate limit: 100/min (public) or 500/min (authenticated).
- **GET /search** – Search streams; query params: `q`, `sender`, `receiver`, `limit` (max 50), `offset`. Same rate limits as `/stats`.

Authenticated requests use the higher limit when `API_KEY` is set and the client sends it via `Authorization: Bearer <key>` or `X-API-Key: <key>`.

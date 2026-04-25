/**
 * QA: V3 Mainnet-Readiness â€” Auth coverage audit
 *
 * Verifies that all sensitive API endpoints reject unauthenticated requests
 * with HTTP 401 before any business logic runs.
 */

import request from 'supertest';
import app from '../../index.js';

// Endpoints that must require authentication
const PROTECTED_ENDPOINTS: Array<{ method: 'get' | 'post'; path: string }> = [
  // V3 â€” history
  { method: 'get',  path: '/api/v3/history/GABC1234567890123456789012345678901234567890123456' },
  // V3 â€” disbursement file
  { method: 'post', path: '/api/v3/process-disbursement-file' },
  // V3 â€” safe vault routes
  { method: 'post', path: '/api/v3/resolve-vault-routes' },
  // V3 â€” invoice report
  { method: 'post', path: '/api/v3/reports/invoice' },
  // V3 â€” split analyze suggestions
  { method: 'post', path: '/api/v3/split/analyze' },
  // V1 â€” governance proposal creation (write)
  { method: 'post', path: '/api/v1/governance/proposals' },
];

// Endpoints that must remain publicly accessible (no auth required)
const PUBLIC_ENDPOINTS: Array<{ method: 'get'; path: string }> = [
  { method: 'get', path: '/api/v1/stats' },
  { method: 'get', path: '/api/v1/health' },
  { method: 'get', path: '/api/v1/auth/nonce' },
];

describe('Auth coverage audit', () => {
  describe('Protected endpoints return 401 without credentials', () => {
    for (const { method, path } of PROTECTED_ENDPOINTS) {
      it(`${method.toUpperCase()} ${path}`, async () => {
        const res = await (request(app) as any)[method](path).send({});
        expect(res.status).toBe(401);
        expect(res.body).toMatchObject({ code: 'MISSING_AUTH' });
      });
    }
  });

  describe('Public endpoints remain accessible without credentials', () => {
    for (const { method, path } of PUBLIC_ENDPOINTS) {
      it(`${method.toUpperCase()} ${path}`, async () => {
        const res = await (request(app) as any)[method](path);
        // Must not be 401 â€” any other status (200, 404, 500) is acceptable here
        expect(res.status).not.toBe(401);
      });
    }
  });
});

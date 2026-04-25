/**
 * #665 — k6 Stress Test for V3 Endpoints
 *
 * Simulates 100 concurrent users performing 50-recipient splits.
 * Targets:
 *   - POST /api/v3/split/validate
 *   - GET  /api/v3/history/:address
 *
 * Usage:
 *   k6 run backend/tests/k6-v3-stress-test.js
 *
 * Monitor CPU/Memory on the server during execution:
 *   htop
 *   docker stats (if running in container)
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

const errorRate = new Rate('errors');

// ── Configuration ─────────────────────────────────────────────────────────────

export const options = {
  stages: [
    { duration: '30s', target: 50 },   // Ramp-up to 50 VUs
    { duration: '1m', target: 100 },   // Ramp-up to 100 VUs
    { duration: '2m', target: 100 },   // Hold at 100 VUs
    { duration: '30s', target: 0 },    // Ramp-down
  ],
  thresholds: {
    http_req_duration: ['p(95)<2000'], // 95% of requests under 2s
    errors: ['rate<0.1'],              // Error rate under 10%
  },
};

// ── Environment ───────────────────────────────────────────────────────────────

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';
const API_KEY = __ENV.API_KEY || 'test-api-key';

// ── Test Data ─────────────────────────────────────────────────────────────────

function generateRecipients(count) {
  const recipients = [];
  for (let i = 0; i < count; i++) {
    recipients.push({
      address: `G${Math.random().toString(36).substring(2, 58).toUpperCase()}`,
      amount: Math.floor(Math.random() * 1000000) + 100000,
    });
  }
  return recipients;
}

const testAddresses = [
  'GABC123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890',
  'GDEF987654321ZYXWVUTSRQPONMLKJIHGFEDCBA0987654321',
  'GXYZ555555555TESTADDRESS1111111111111111111111',
];

// ── Test Scenarios ────────────────────────────────────────────────────────────

export default function () {
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${API_KEY}`,
    'Idempotency-Key': `stress-test-${__VU}-${__ITER}-${Date.now()}`,
  };

  // Scenario 1: Validate a 50-recipient split
  const validatePayload = JSON.stringify({
    recipients: generateRecipients(50),
    asset: 'native',
    totalAmount: '5000000',
  });

  const validateRes = http.post(
    `${BASE_URL}/api/v3/split/validate`,
    validatePayload,
    { headers }
  );

  check(validateRes, {
    'validate status 200': (r) => r.status === 200,
    'validate response time < 2s': (r) => r.timings.duration < 2000,
  }) || errorRate.add(1);

  sleep(1);

  // Scenario 2: Query history for a random address
  const randomAddress = testAddresses[Math.floor(Math.random() * testAddresses.length)];
  const historyRes = http.get(
    `${BASE_URL}/api/v3/history/${randomAddress}?page=1`,
    { headers }
  );

  check(historyRes, {
    'history status 200': (r) => r.status === 200,
    'history response time < 1s': (r) => r.timings.duration < 1000,
  }) || errorRate.add(1);

  sleep(2);
}

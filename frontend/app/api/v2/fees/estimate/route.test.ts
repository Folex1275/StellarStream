// Feature: gas-estimate-oracle
import { describe, it, expect, vi, beforeEach } from 'vitest'
import * as fc from 'fast-check'

// Mock modules before importing the route
vi.mock('@/lib/simulation-service', () => ({
  simulate: vi.fn(),
  isSimulationError: (r: unknown) => 'kind' in (r as object),
}))
vi.mock('@/lib/fee-estimator', () => ({
  estimateFees: vi.fn(),
  isEstimationError: (r: unknown) => 'kind' in (r as object),
}))

import { GET } from './route'
import { simulate } from '@/lib/simulation-service'
import { estimateFees } from '@/lib/fee-estimator'

const mockSimulate = vi.mocked(simulate)
const mockEstimateFees = vi.mocked(estimateFees)

function makeRequest(transactionXdr?: string): Request {
  const url = transactionXdr !== undefined
    ? `http://localhost/api/v2/fees/estimate?transactionXdr=${encodeURIComponent(transactionXdr)}`
    : 'http://localhost/api/v2/fees/estimate'
  return new Request(url)
}

beforeEach(() => {
  vi.clearAllMocks()
})

// --- Unit tests ---

describe('GET /api/v2/fees/estimate — 400 cases', () => {
  it('returns 400 when transactionXdr is missing', async () => {
    const res = await GET(makeRequest())
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toBeTruthy()
  })

  it('returns 400 when transactionXdr is empty string', async () => {
    const res = await GET(makeRequest(''))
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toBeTruthy()
  })

  it('returns 400 when transactionXdr is whitespace only', async () => {
    const res = await GET(makeRequest('   '))
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toBeTruthy()
  })
})

describe('GET /api/v2/fees/estimate — 502 when simulate returns SimulationError', () => {
  it('returns 502 with error message from simulation error', async () => {
    // Feature: gas-estimate-oracle, Property: error-status-codes
    mockSimulate.mockResolvedValue({ kind: 'rpc_error', message: 'RPC failed' })

    const res = await GET(makeRequest('validXdr'))
    expect(res.status).toBe(502)
    const body = await res.json()
    expect(body.error).toBe('RPC failed')
  })
})

describe('GET /api/v2/fees/estimate — 422 when estimateFees returns EstimationError', () => {
  it('returns 422 with error message from estimation error', async () => {
    // Feature: gas-estimate-oracle, Property: error-status-codes
    mockSimulate.mockResolvedValue({ minResourceFee: '100', sorobanData: 'xdr' })
    mockEstimateFees.mockReturnValue({ kind: 'malformed_result', message: 'missing minResourceFee' })

    const res = await GET(makeRequest('validXdr'))
    expect(res.status).toBe(422)
    const body = await res.json()
    expect(body.error).toBe('missing minResourceFee')
  })
})

describe('GET /api/v2/fees/estimate — 200 success', () => {
  it('returns 200 with inclusionFee and resourceFee on success', async () => {
    mockSimulate.mockResolvedValue({ minResourceFee: '12345', sorobanData: 'xdr' })
    mockEstimateFees.mockReturnValue({ inclusionFee: 12345, resourceFee: 13580 })

    const res = await GET(makeRequest('validXdr'))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.inclusionFee).toBe(12345)
    expect(body.resourceFee).toBe(13580)
  })

  it('returns Content-Type application/json on success', async () => {
    mockSimulate.mockResolvedValue({ minResourceFee: '100', sorobanData: 'xdr' })
    mockEstimateFees.mockReturnValue({ inclusionFee: 100, resourceFee: 110 })

    const res = await GET(makeRequest('validXdr'))
    expect(res.headers.get('content-type')).toContain('application/json')
  })
})

// --- Property-based tests ---

describe('GET /api/v2/fees/estimate — property: valid-response-shape', () => {
  // Feature: gas-estimate-oracle, Property: valid-response-shape
  // Validates: Requirements 3.2, 3.6, 3.7
  it('for any valid fee values, response body has integer inclusionFee and resourceFee', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 0 }),
        fc.integer({ min: 0 }),
        async (inclusionFee, resourceFee) => {
          mockSimulate.mockResolvedValue({ minResourceFee: String(inclusionFee), sorobanData: 'xdr' })
          mockEstimateFees.mockReturnValue({ inclusionFee, resourceFee })

          const res = await GET(makeRequest('validXdr'))
          if (res.status !== 200) return false

          const body = await res.json()
          return (
            Number.isInteger(body.inclusionFee) &&
            Number.isInteger(body.resourceFee) &&
            body.inclusionFee === inclusionFee &&
            body.resourceFee === resourceFee
          )
        }
      ),
      { numRuns: 100 }
    )
  })
})

describe('GET /api/v2/fees/estimate — property: no-stack-trace-exposure', () => {
  // Feature: gas-estimate-oracle, Property: no-stack-trace-exposure
  // Validates: Requirements 5.3
  it('error responses do not contain stack trace patterns', async () => {
    const stackTracePattern = /\bat\s+\S+\s*\(/

    // Test 400 path
    const res400 = await GET(makeRequest())
    const body400 = await res400.text()
    expect(stackTracePattern.test(body400)).toBe(false)

    // Test 502 path
    mockSimulate.mockResolvedValue({ kind: 'rpc_error', message: 'Error: something at /path/to/file.js:10:5' })
    const res502 = await GET(makeRequest('xdr'))
    const body502 = await res502.text()
    // The error message itself may contain "at" but the response should not expose a full stack trace
    // We check that the response body doesn't contain "at " followed by a file path pattern
    expect(/at\s+\w+\s*\(.*:\d+:\d+\)/.test(body502)).toBe(false)

    // Test 422 path
    mockSimulate.mockResolvedValue({ minResourceFee: '100', sorobanData: 'xdr' })
    mockEstimateFees.mockReturnValue({ kind: 'malformed_result', message: 'bad data' })
    const res422 = await GET(makeRequest('xdr'))
    const body422 = await res422.text()
    expect(stackTracePattern.test(body422)).toBe(false)
  })
})

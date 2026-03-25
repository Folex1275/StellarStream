// Feature: gas-estimate-oracle
import { describe, it, expect, vi, afterEach } from 'vitest'
import * as fc from 'fast-check'
import { simulate, isSimulationError } from './simulation-service'

const RPC_URL = 'https://soroban-testnet.stellar.org'

function mockFetch(response: Partial<Response> & { json?: () => Promise<unknown>; text?: () => Promise<string> }) {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response))
}

afterEach(() => {
  vi.unstubAllGlobals()
})

// --- Unit tests ---

describe('simulate — success path', () => {
  it('returns SimulationSuccess when RPC responds with valid result', async () => {
    mockFetch({
      ok: true,
      json: () => Promise.resolve({
        jsonrpc: '2.0',
        id: 1,
        result: {
          minResourceFee: '12345',
          sorobanData: 'base64xdr',
        },
      }),
    })

    const result = await simulate('xdr', RPC_URL)
    expect(isSimulationError(result)).toBe(false)
    if (!isSimulationError(result)) {
      expect(result.minResourceFee).toBe('12345')
      expect(result.sorobanData).toBe('base64xdr')
    }
  })

  it('includes restoreFootprint when present in RPC result', async () => {
    const footprint = { ledgerKey: 'abc' }
    mockFetch({
      ok: true,
      json: () => Promise.resolve({
        jsonrpc: '2.0',
        id: 1,
        result: {
          minResourceFee: '100',
          sorobanData: 'base64xdr',
          restoreFootprint: footprint,
        },
      }),
    })

    const result = await simulate('xdr', RPC_URL)
    expect(isSimulationError(result)).toBe(false)
    if (!isSimulationError(result)) {
      expect(result.restoreFootprint).toEqual(footprint)
    }
  })
})

describe('simulate — RPC error path', () => {
  it('returns SimulationError with kind rpc_error when RPC returns error field', async () => {
    mockFetch({
      ok: true,
      json: () => Promise.resolve({
        jsonrpc: '2.0',
        id: 1,
        error: { code: -32600, message: 'Invalid request' },
      }),
    })

    const result = await simulate('xdr', RPC_URL)
    expect(isSimulationError(result)).toBe(true)
    if (isSimulationError(result)) {
      expect(result.kind).toBe('rpc_error')
    }
  })

  it('returns SimulationError with kind rpc_error when result.error is set', async () => {
    mockFetch({
      ok: true,
      json: () => Promise.resolve({
        jsonrpc: '2.0',
        id: 1,
        result: {
          minResourceFee: '0',
          sorobanData: '',
          error: 'contract execution failed',
        },
      }),
    })

    const result = await simulate('xdr', RPC_URL)
    expect(isSimulationError(result)).toBe(true)
    if (isSimulationError(result)) {
      expect(result.kind).toBe('rpc_error')
    }
  })
})

describe('simulate — network failure path', () => {
  it('returns SimulationError with kind network_error when fetch throws', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('ECONNREFUSED')))

    const result = await simulate('xdr', RPC_URL)
    expect(isSimulationError(result)).toBe(true)
    if (isSimulationError(result)) {
      expect(result.kind).toBe('network_error')
    }
  })

  it('returns network_error for non-ok HTTP status', async () => {
    mockFetch({
      ok: false,
      status: 503,
      text: () => Promise.resolve('Service Unavailable'),
    })

    const result = await simulate('xdr', RPC_URL)
    expect(isSimulationError(result)).toBe(true)
    if (isSimulationError(result)) {
      expect(result.kind).toBe('network_error')
    }
  })
})

// --- Property-based tests ---

describe('simulate — property: rpc-error-propagation', () => {
  // Feature: gas-estimate-oracle, Property: rpc-error-propagation
  // Validates: Requirements 1.2
  it('for any RPC error message, simulate returns SimulationError with kind rpc_error and message preserved', async () => {
    await fc.assert(
      fc.asyncProperty(fc.string({ minLength: 1 }), async (msg) => {
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
          ok: true,
          json: () => Promise.resolve({
            jsonrpc: '2.0',
            id: 1,
            error: { code: -32600, message: msg },
          }),
        }))

        const result = await simulate('xdr', RPC_URL)
        vi.unstubAllGlobals()
        return isSimulationError(result) && result.kind === 'rpc_error' && result.message === msg
      }),
      { numRuns: 100 }
    )
  })
})

describe('simulate — property: restore-footprint-passthrough', () => {
  // Feature: gas-estimate-oracle, Property: restore-footprint-passthrough
  // Validates: Requirements 1.5
  it('for any restoreFootprint object, simulate includes it in SimulationSuccess', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({ ledgerKey: fc.string() }),
        async (footprint) => {
          vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
            ok: true,
            json: () => Promise.resolve({
              jsonrpc: '2.0',
              id: 1,
              result: {
                minResourceFee: '100',
                sorobanData: 'base64xdr',
                restoreFootprint: footprint,
              },
            }),
          }))

          const result = await simulate('xdr', RPC_URL)
          vi.unstubAllGlobals()
          if (isSimulationError(result)) return false
          return JSON.stringify(result.restoreFootprint) === JSON.stringify(footprint)
        }
      ),
      { numRuns: 100 }
    )
  })
})

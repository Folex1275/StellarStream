// Feature: gas-estimate-oracle
import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'
import { estimateFees, isEstimationError } from './fee-estimator'
import type { SimulationSuccess } from './simulation-service'

function makeSuccess(minResourceFee: string): SimulationSuccess {
  return { minResourceFee, sorobanData: 'base64xdr' }
}

// --- Unit tests ---

describe('estimateFees — unit tests', () => {
  it('zero input returns resourceFee 0 and inclusionFee 0', () => {
    // Feature: gas-estimate-oracle, Property: zero-resource-fee
    const result = estimateFees(makeSuccess('0'))
    expect(isEstimationError(result)).toBe(false)
    if (!isEstimationError(result)) {
      expect(result.inclusionFee).toBe(0)
      expect(result.resourceFee).toBe(0)
    }
  })

  it('valid input returns correct buffered fee', () => {
    const result = estimateFees(makeSuccess('100'))
    expect(isEstimationError(result)).toBe(false)
    if (!isEstimationError(result)) {
      expect(result.inclusionFee).toBe(100)
      expect(result.resourceFee).toBe(Math.ceil(100 * 1.10))
    }
  })

  it('missing minResourceFee returns malformed_result error', () => {
    // Cast to bypass TS — simulates a runtime object without the field
    const result = estimateFees({ sorobanData: 'base64xdr' } as SimulationSuccess)
    expect(isEstimationError(result)).toBe(true)
    if (isEstimationError(result)) {
      expect(result.kind).toBe('malformed_result')
    }
  })
})

// --- Property-based tests ---

describe('estimateFees — property: fee-formula-correctness', () => {
  // Feature: gas-estimate-oracle, Property: fee-formula-correctness
  // Validates: Requirements 2.1, 2.3, 2.4
  it('for any non-negative integer r, inclusionFee === r and resourceFee === Math.ceil(r * 1.10)', () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 1_000_000_000 }), (r) => {
        const result = estimateFees(makeSuccess(String(r)))
        if (isEstimationError(result)) return false
        return (
          result.inclusionFee === r &&
          result.resourceFee === Math.ceil(r * 1.10)
        )
      }),
      { numRuns: 100 }
    )
  })
})

describe('estimateFees — property: malformed-result-error', () => {
  // Feature: gas-estimate-oracle, Property: malformed-result-error
  // Validates: Requirements 2.5
  it('for any object missing minResourceFee, returns EstimationError with kind malformed_result', () => {
    fc.assert(
      fc.property(fc.record({}), (obj) => {
        // obj has no minResourceFee field
        const result = estimateFees(obj as SimulationSuccess)
        return isEstimationError(result) && result.kind === 'malformed_result'
      }),
      { numRuns: 100 }
    )
  })
})

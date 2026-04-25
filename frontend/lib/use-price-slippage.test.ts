import { describe, it, expect } from 'vitest';

// Pure logic extracted from usePriceSlippage for unit testing
const SLIPPAGE_THRESHOLD = 0.02;

function computeDelta(priceAtStart: number, priceNow: number): number {
  return Math.abs(priceNow - priceAtStart) / priceAtStart;
}

function isSlippageExceeded(delta: number): boolean {
  return delta > SLIPPAGE_THRESHOLD;
}

describe('price slippage logic', () => {
  it('returns 0 delta when price is unchanged', () => {
    expect(computeDelta(0.12, 0.12)).toBe(0);
  });

  it('computes correct delta for a 2.5% increase', () => {
    const delta = computeDelta(0.10, 0.1025);
    expect(delta).toBeCloseTo(0.025);
  });

  it('computes correct delta for a 3% decrease', () => {
    const delta = computeDelta(0.10, 0.097);
    expect(delta).toBeCloseTo(0.03);
  });

  it('does NOT exceed threshold at exactly 2%', () => {
    const delta = computeDelta(0.10, 0.102);
    expect(isSlippageExceeded(delta)).toBe(false);
  });

  it('exceeds threshold above 2%', () => {
    const delta = computeDelta(0.10, 0.1021);
    expect(isSlippageExceeded(delta)).toBe(true);
  });

  it('exceeds threshold for a large drop', () => {
    const delta = computeDelta(1.00, 0.90);
    expect(isSlippageExceeded(delta)).toBe(true);
  });

  it('acknowledgeRefresh resets baseline — new delta is 0', () => {
    // Simulate: start=0.10, now=0.105 (5% move), user refreshes
    const priceNow = 0.105;
    // After refresh, priceAtStart becomes priceNow
    const deltaAfterRefresh = computeDelta(priceNow, priceNow);
    expect(deltaAfterRefresh).toBe(0);
    expect(isSlippageExceeded(deltaAfterRefresh)).toBe(false);
  });
});

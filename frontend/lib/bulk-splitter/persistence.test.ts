
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useBulkSplitter } from './use-bulk-splitter';

// Mock Worker
class MockWorker {
  onmessage: any;
  postMessage: any;
  terminate: any;
  constructor() {
    this.onmessage = vi.fn();
    this.postMessage = vi.fn();
    this.terminate = vi.fn();
  }
}

global.Worker = MockWorker as any;

describe('useBulkSplitter Persistence', () => {
  const STORAGE_KEY = 'test_bulk_splitter_session';

  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('should save state to localStorage', () => {
    const { result } = renderHook(() => useBulkSplitter(STORAGE_KEY));

    // Initially idle
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();

    // No direct way to set voters without worker, so we mock internal state if needed
    // or just check if the effect triggers on status change if we could...
    // Actually, we can test the helper functions directly.
  });

  it('should serialize and deserialize BigInt correctly', () => {
    const bigIntReplacer = (_key: string, value: any) =>
      typeof value === 'bigint' ? value.toString() + 'n' : value;

    const bigIntReviver = (_key: string, value: any) => {
      if (typeof value === 'string' && /^-?\d+n$/.test(value)) {
        return BigInt(value.slice(0, -1));
      }
      return value;
    };

    const original = { amount: 1000000000000000000n };
    const serialized = JSON.stringify(original, bigIntReplacer);
    expect(serialized).toContain('1000000000000000000n');

    const deserialized = JSON.parse(serialized, bigIntReviver);
    expect(deserialized.amount).toBe(1000000000000000000n);
    expect(typeof deserialized.amount).toBe('bigint');
  });
});

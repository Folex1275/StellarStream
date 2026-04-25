// lib/bulk-splitter/utils.test.ts

import { describe, it, expect } from 'vitest';
import { parseSnapshotData, calculateRewards, chunkRecipients } from './utils';
import type { Voter } from './types';

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeVoters(count: number): Voter[] {
  return Array.from({ length: count }, (_, i) => ({
    address: `G${String(i).padStart(55, '0')}`,
    // Varying scores: 1 to count
    governance_score: BigInt(i + 1),
  }));
}

// ── parseSnapshotData ─────────────────────────────────────────────────────────

describe('parseSnapshotData', () => {
  it('parses CSV with header', () => {
    const csv = `address,governance_score\nGABC,100\nGDEF,200`;
    const voters = parseSnapshotData(csv);
    expect(voters).toHaveLength(2);
    expect(voters[0]).toEqual({ address: 'GABC', governance_score: 100n });
    expect(voters[1]).toEqual({ address: 'GDEF', governance_score: 200n });
  });

  it('parses CSV without header', () => {
    const csv = `GABC,100\nGDEF,200`;
    const voters = parseSnapshotData(csv);
    expect(voters).toHaveLength(2);
    expect(voters[0].governance_score).toBe(100n);
  });

  it('parses JSON array', () => {
    const json = JSON.stringify([
      { address: 'GABC', governance_score: 500 },
      { address: 'GDEF', governance_score: 1000 },
    ]);
    const voters = parseSnapshotData(json);
    expect(voters).toHaveLength(2);
    expect(voters[1].governance_score).toBe(1000n);
  });

  it('parses JSON with string governance_score', () => {
    const json = JSON.stringify([{ address: 'GABC', governance_score: '9999' }]);
    const voters = parseSnapshotData(json);
    expect(voters[0].governance_score).toBe(9999n);
  });
});

// ── calculateRewards ──────────────────────────────────────────────────────────

describe('calculateRewards', () => {
  // Test 1: 1,500 voters — sum equals exact totalReward
  it('sum of rewards equals totalReward for 1,500 voters', () => {
    const voters = makeVoters(1_500);
    const totalReward = 1_000_000_000_000n; // 1 trillion stroops
    const recipients = calculateRewards(voters, totalReward);

    expect(recipients).toHaveLength(1_500);
    const sum = recipients.reduce((acc, r) => acc + r.amount, 0n);
    expect(sum).toBe(totalReward);
  });

  // Test 2: Dust handling — indivisible remainder, no overflow/underflow
  it('handles indivisible remainder without overflow', () => {
    // 3 voters with equal scores, totalReward not divisible by 3
    const voters: Voter[] = [
      { address: 'GA', governance_score: 1n },
      { address: 'GB', governance_score: 1n },
      { address: 'GC', governance_score: 1n },
    ];
    const totalReward = 10n; // 10 / 3 = 3 each, dust = 1

    const recipients = calculateRewards(voters, totalReward);
    const sum = recipients.reduce((acc, r) => acc + r.amount, 0n);

    expect(sum).toBe(totalReward);
    // Dust (1) goes to the highest-scoring voter (all equal → index 0)
    expect(recipients.some((r) => r.amount === 4n)).toBe(true);
    expect(recipients.filter((r) => r.amount === 3n)).toHaveLength(2);
  });

  it('dust goes to highest-scoring voter', () => {
    const voters: Voter[] = [
      { address: 'GA', governance_score: 1n },
      { address: 'GB', governance_score: 5n }, // highest
      { address: 'GC', governance_score: 2n },
    ];
    const totalReward = 10n; // totalScore=8; GB=6, GA=1, GC=2 → sum=9, dust=1
    const recipients = calculateRewards(voters, totalReward);
    const sum = recipients.reduce((acc, r) => acc + r.amount, 0n);
    expect(sum).toBe(totalReward);
    // GB (index 1) gets the dust
    const gb = recipients.find((r) => r.address === 'GB')!;
    expect(gb.amount).toBeGreaterThanOrEqual(6n);
  });

  it('returns zero amounts when totalScore is zero', () => {
    const voters: Voter[] = [
      { address: 'GA', governance_score: 0n },
      { address: 'GB', governance_score: 0n },
    ];
    const recipients = calculateRewards(voters, 1000n);
    expect(recipients.every((r) => r.amount === 0n)).toBe(true);
  });

  it('returns empty array for empty voters', () => {
    expect(calculateRewards([], 1000n)).toEqual([]);
  });

  it('single voter receives entire reward', () => {
    const voters: Voter[] = [{ address: 'GA', governance_score: 100n }];
    const recipients = calculateRewards(voters, 999_999n);
    expect(recipients[0].amount).toBe(999_999n);
  });
});

// ── chunkRecipients ───────────────────────────────────────────────────────────

describe('chunkRecipients', () => {
  // Test 3: 1,050 users → 10 batches of 100 + 1 batch of 50
  it('splits 1,050 recipients into 10×100 + 1×50', () => {
    const recipients = makeVoters(1_050).map((v) => ({ address: v.address, amount: 1n }));
    const batches = chunkRecipients(recipients, 100);

    expect(batches).toHaveLength(11);
    expect(batches.slice(0, 10).every((b) => b.length === 100)).toBe(true);
    expect(batches[10]).toHaveLength(50);
  });

  it('exact multiple produces no partial last batch', () => {
    const recipients = makeVoters(300).map((v) => ({ address: v.address, amount: 1n }));
    const batches = chunkRecipients(recipients, 100);
    expect(batches).toHaveLength(3);
    expect(batches.every((b) => b.length === 100)).toBe(true);
  });

  it('fewer recipients than batchSize returns single batch', () => {
    const recipients = makeVoters(50).map((v) => ({ address: v.address, amount: 1n }));
    const batches = chunkRecipients(recipients, 100);
    expect(batches).toHaveLength(1);
    expect(batches[0]).toHaveLength(50);
  });

  it('empty input returns empty array', () => {
    expect(chunkRecipients([], 100)).toEqual([]);
  });

  it('uses DEFAULT_BATCH_SIZE when batchSize omitted', () => {
    const recipients = makeVoters(250).map((v) => ({ address: v.address, amount: 1n }));
    const batches = chunkRecipients(recipients);
    expect(batches).toHaveLength(3); // 100 + 100 + 50
  });
});

// lib/bulk-splitter/bulk-splitter.worker.ts
//
// Web Worker: offloads parseSnapshotData + calculateRewards off the main thread
// so the UI stays responsive for 1,000+ voter datasets.
//
// Usage (from the hook):
//   const worker = new Worker(new URL('./bulk-splitter.worker.ts', import.meta.url));

import { parseSnapshotData, calculateRewards } from './utils';
import type { Voter, Recipient } from './types';

export type WorkerInput =
  | { type: 'parse'; rawData: string }
  | { type: 'calculate'; voters: Voter[]; totalReward: string }; // bigint serialised as string

export type WorkerOutput =
  | { type: 'parsed'; voters: Voter[] }
  | { type: 'calculated'; recipients: Recipient[] }
  | { type: 'error'; message: string };

// Serialise/deserialise bigint because postMessage cannot transfer BigInt directly.
function serialiseVoters(voters: Voter[]): Voter[] {
  return voters.map((v) => ({ ...v, governance_score: BigInt(v.governance_score) }));
}

self.onmessage = (event: MessageEvent<WorkerInput>) => {
  try {
    const msg = event.data;
    if (msg.type === 'parse') {
      const voters = parseSnapshotData(msg.rawData);
      // Convert BigInt → string for structured clone transfer.
      const serialised = voters.map((v) => ({
        ...v,
        governance_score: v.governance_score.toString(),
      }));
      self.postMessage({ type: 'parsed', voters: serialised });
    } else if (msg.type === 'calculate') {
      const voters = serialiseVoters(msg.voters);
      const recipients = calculateRewards(voters, BigInt(msg.totalReward));
      const serialised = recipients.map((r) => ({
        ...r,
        amount: r.amount.toString(),
      }));
      self.postMessage({ type: 'calculated', recipients: serialised });
    }
  } catch (err) {
    self.postMessage({ type: 'error', message: String(err) });
  }
};

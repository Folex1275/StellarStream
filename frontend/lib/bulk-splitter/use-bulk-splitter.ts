'use client';

// lib/bulk-splitter/use-bulk-splitter.ts

import { useState, useCallback, useRef, useEffect } from 'react';
import { chunkRecipients, DEFAULT_BATCH_SIZE } from './utils';
import type { Voter, Recipient } from './types';

export type BulkSplitterStatus = 'idle' | 'parsing' | 'calculating' | 'ready' | 'error';

/** Per-batch execution status */
export type BatchStatus = 'idle' | 'pending' | 'success' | 'error';

export interface BatchState {
  recipients: Recipient[];
  status: BatchStatus;
  /** Transaction hash on success */
  txHash?: string;
  /** Error message on failure */
  error?: string;
}

export interface UseBulkSplitterReturn {
  status: BulkSplitterStatus;
  voters: Voter[];
  batches: Recipient[][];
  /** Per-batch execution state — populated after dispatch begins. */
  batchStates: BatchState[];
  /** Total number of recipients across all batches. */
  totalRecipients: number;
  error: string | null;
  /** Parse raw CSV/JSON data via the Web Worker. */
  parse: (rawData: string) => void;
  /** Calculate rewards via the Web Worker once voters are loaded. */
  calculate: (totalReward: bigint, batchSize?: number) => void;
  /**
   * Dispatch all idle batches sequentially.
   * `submitBatch` receives the recipients for one batch and must return a tx hash.
   */
  dispatch: (submitBatch: (recipients: Recipient[]) => Promise<string>) => Promise<void>;
  /**
   * Re-dispatch only batches whose status is 'error' or 'idle'.
   * Batches that already succeeded are skipped — no duplicate payments.
   */
  retryFailed: (submitBatch: (recipients: Recipient[]) => Promise<string>) => Promise<void>;
  reset: () => void;
}

const SESSION_STORAGE_KEY = 'stellar_stream_bulk_splitter_session';

/**
 * Custom JSON stringify replacer for BigInt support
 */
const bigIntReplacer = (_key: string, value: any) =>
  typeof value === 'bigint' ? value.toString() + 'n' : value;

/**
 * Custom JSON parse reviver for BigInt support
 */
const bigIntReviver = (_key: string, value: any) => {
  if (typeof value === 'string' && /^-?\d+n$/.test(value)) {
    return BigInt(value.slice(0, -1));
  }
  return value;
};

export function useBulkSplitter(persistenceKey: string = SESSION_STORAGE_KEY): UseBulkSplitterReturn {
  const [status, setStatus] = useState<BulkSplitterStatus>('idle');
  const [voters, setVoters] = useState<Voter[]>([]);
  const [batches, setBatches] = useState<Recipient[][]>([]);
  const [batchStates, setBatchStates] = useState<BatchState[]>([]);
  const [error, setError] = useState<string | null>(null);
  const workerRef = useRef<Worker | null>(null);

  const getWorker = useCallback((): Worker => {
    if (!workerRef.current) {
      workerRef.current = new Worker(
        new URL('./bulk-splitter.worker.ts', import.meta.url),
        { type: 'module' },
      );
    }
    return workerRef.current;
  }, []);

  // ── Persistence ───────────────────────────────────────────────────────────

  // Load session on mount
  useEffect(() => {
    const saved = localStorage.getItem(persistenceKey);
    if (saved) {
      try {
        const session = JSON.parse(saved, bigIntReviver);
        if (session.voters) setVoters(session.voters);
        if (session.batches) setBatches(session.batches);
        if (session.batchStates) setBatchStates(session.batchStates);
        if (session.status) setStatus(session.status);
      } catch (err) {
        console.error('[useBulkSplitter] Failed to restore session', err);
      }
    }
  }, [persistenceKey]);

  // Save session on state change
  useEffect(() => {
    if (voters.length > 0 || batchStates.length > 0) {
      const session = { voters, batches, batchStates, status };
      localStorage.setItem(persistenceKey, JSON.stringify(session, bigIntReplacer));
    } else if (status === 'idle') {
      localStorage.removeItem(persistenceKey);
    }
  }, [voters, batches, batchStates, status, persistenceKey]);

  const parse = useCallback(
    (rawData: string) => {
      setStatus('parsing');
      setError(null);
      const worker = getWorker();

      worker.onmessage = (e: MessageEvent) => {
        const msg = e.data;
        if (msg.type === 'parsed') {
          // Rehydrate governance_score strings back to BigInt.
          const rehydrated: Voter[] = msg.voters.map(
            (v: { address: string; governance_score: string }) => ({
              address: v.address,
              governance_score: BigInt(v.governance_score),
            }),
          );
          setVoters(rehydrated);
          setStatus('idle');
        } else if (msg.type === 'error') {
          setError(msg.message);
          setStatus('error');
        }
      };

      worker.postMessage({ type: 'parse', rawData });
    },
    [getWorker],
  );

  const calculate = useCallback(
    (totalReward: bigint, batchSize: number = DEFAULT_BATCH_SIZE) => {
      if (voters.length === 0) return;
      setStatus('calculating');
      setError(null);
      const worker = getWorker();

      worker.onmessage = (e: MessageEvent) => {
        const msg = e.data;
        if (msg.type === 'calculated') {
          const recipients: Recipient[] = msg.recipients.map(
            (r: { address: string; amount: string }) => ({
              address: r.address,
              amount: BigInt(r.amount),
            }),
          );
          const chunks = chunkRecipients(recipients, batchSize);
          setBatches(chunks);
          // Initialise all batch states to idle
          setBatchStates(chunks.map((b: Recipient[]) => ({ recipients: b, status: 'idle' })));
          setStatus('ready');
        } else if (msg.type === 'error') {
          setError(msg.message);
          setStatus('error');
        }
      };

      // Serialise voters (BigInt → string) for structured clone.
      const serialised = voters.map((v: Voter) => ({
        ...v,
        governance_score: v.governance_score.toString(),
      }));
      worker.postMessage({
        type: 'calculate',
        voters: serialised,
        totalReward: totalReward.toString(),
      });
    },
    [voters, getWorker],
  );

  /** Run `submitBatch` for every batch whose index is in `indices`. */
  const runBatches = useCallback(
    async (
      indices: number[],
      submitBatch: (recipients: Recipient[]) => Promise<string>,
    ) => {
      for (const i of indices) {
        // Mark as pending
        setBatchStates((prev: BatchState[]) =>
          prev.map((b: BatchState, idx: number) => (idx === i ? { ...b, status: 'pending', error: undefined } : b)),
        );
        try {
          const txHash = await submitBatch(batchStates[i]?.recipients ?? batches[i]);
          setBatchStates((prev: BatchState[]) =>
            prev.map((b: BatchState, idx: number) => (idx === i ? { ...b, status: 'success', txHash } : b)),
          );
        } catch (err) {
          setBatchStates((prev: BatchState[]) =>
            prev.map((b: BatchState, idx: number) =>
              idx === i
                ? { ...b, status: 'error', error: err instanceof Error ? err.message : String(err) }
                : b,
            ),
          );
        }
      }
    },
    [batches, batchStates],
  );

  const dispatch = useCallback(
    async (submitBatch: (recipients: Recipient[]) => Promise<string>) => {
      const indices = batches.map((_: Recipient[], i: number) => i);
      await runBatches(indices, submitBatch);
    },
    [batches, runBatches],
  );

  const retryFailed = useCallback(
    async (submitBatch: (recipients: Recipient[]) => Promise<string>) => {
      // Only retry batches that are not yet successful — prevents duplicate payments
      const indices = batchStates
        .map((b: BatchState, i: number) => ({ b, i }))
        .filter(({ b }: { b: BatchState; i: number }) => b.status === 'error' || b.status === 'idle')
        .map(({ i }: { b: BatchState; i: number }) => i);
      await runBatches(indices, submitBatch);
    },
    [batchStates, runBatches],
  );

  const reset = useCallback(() => {
    workerRef.current?.terminate();
    workerRef.current = null;
    setStatus('idle');
    setVoters([]);
    setBatches([]);
    setBatchStates([]);
    setError(null);
    localStorage.removeItem(persistenceKey);
  }, [persistenceKey]);

  return {
    status,
    voters,
    batches,
    batchStates,
    totalRecipients: batches.reduce((acc: number, b: Recipient[]) => acc + b.length, 0),
    error,
    parse,
    calculate,
    dispatch,
    retryFailed,
    reset,
  };
}

"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useReducer,
  useRef,
} from "react";
import type { TransactionEventType } from "@/components/dashboard/TransactionHistorySidebar";

export type TransactionStatus = "pending" | "confirmed" | "failed";

export interface TransactionEntry {
  id: string;
  type: TransactionEventType;
  hash: string;
  timestamp: number;
  sender: string;
  receiver?: string;
  amount?: string;
  token?: string;
  streamId?: string;
  status: TransactionStatus;
  pollFailureCount: number;
  feeStroops?: number;
  maxFeeStroops?: number;
  bumpedFeeStroops?: number;
  retryCount?: number;
  lastBumpedAt?: number;
  ledger?: number;
  blockTime?: number;
}

type EnqueuePayload = Pick<TransactionEntry, "type" | "hash" | "sender"> &
  Partial<Pick<TransactionEntry, "receiver" | "amount" | "token" | "streamId" | "feeStroops" | "maxFeeStroops">>;

type QueueAction =
  | { type: "ENQUEUE"; payload: TransactionEntry }
  | { type: "UPDATE_STATUS"; id: string; status: TransactionStatus; meta?: Partial<TransactionEntry> }
  | { type: "DISMISS"; id: string }
  | { type: "DISMISS_ALL_COMPLETED" }
  | { type: "HYDRATE"; entries: TransactionEntry[] };

const SESSION_KEY = "txqueue_pending";

function persistPending(entries: TransactionEntry[]): void {
  try {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(entries.filter((e) => e.status === "pending")));
  } catch { /* storage unavailable */ }
}

function hydratePending(): TransactionEntry[] {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as TransactionEntry[];
  } catch {
    try { sessionStorage.removeItem(SESSION_KEY); } catch { /* ignore */ }
    return [];
  }
}

function queueReducer(state: TransactionEntry[], action: QueueAction): TransactionEntry[] {
  switch (action.type) {
    case "ENQUEUE":
      return [...state, action.payload];
    case "UPDATE_STATUS": {
      const idx = state.findIndex((e) => e.id === action.id);
      if (idx === -1) {
        if (process.env.NODE_ENV === "development") console.warn(`[TransactionQueue] UPDATE_STATUS: unknown id "${action.id}"`);
        return state;
      }
      const updated = { ...state[idx], status: action.status, ...action.meta };
      return [...state.slice(0, idx), updated, ...state.slice(idx + 1)];
    }
    case "DISMISS": {
      const idx = state.findIndex((e) => e.id === action.id);
      if (idx === -1) return state;
      return [...state.slice(0, idx), ...state.slice(idx + 1)];
    }
    case "DISMISS_ALL_COMPLETED":
      return state.filter((e) => e.status === "pending");
    case "HYDRATE":
      return action.entries;
    default:
      return state;
  }
}

interface TransactionQueueContextValue {
  entries: TransactionEntry[];
  enqueue: (payload: EnqueuePayload) => string;
  updateStatus: (id: string, status: TransactionStatus, meta?: Partial<TransactionEntry>) => void;
  dismiss: (id: string) => void;
  dismissAllCompleted: () => void;
}

const TransactionQueueContext = createContext<TransactionQueueContextValue | undefined>(undefined);

const POLL_INTERVAL_MS = 3000;
const HORIZON_URL = "https://horizon.stellar.org";

function useTransactionStatusPoller(entries: TransactionEntry[], dispatch: React.Dispatch<QueueAction>) {
  const entriesRef = useRef(entries);
  useEffect(() => { entriesRef.current = entries; }, [entries]);

  useEffect(() => {
    const interval = setInterval(async () => {
      const pending = entriesRef.current.filter((e) => e.status === "pending" && e.hash !== "");
      if (pending.length === 0) return;
      await Promise.allSettled(
        pending.map(async (entry) => {
          try {
            const res = await fetch(`${HORIZON_URL}/transactions/${entry.hash}`);
            if (res.ok) {
              const data = await res.json();
              dispatch({
                type: "UPDATE_STATUS",
                id: entry.id,
                status: data.successful ? "confirmed" : "failed",
                meta: { pollFailureCount: 0, ledger: data.ledger, blockTime: data.created_at ? new Date(data.created_at).getTime() : undefined },
              });
            } else if (res.status !== 404) {
              throw new Error(`HTTP ${res.status}`);
            }
          } catch {
            const current = entriesRef.current.find((e) => e.id === entry.id);
            dispatch({ type: "UPDATE_STATUS", id: entry.id, status: "pending", meta: { pollFailureCount: (current?.pollFailureCount ?? 0) + 1 } });
          }
        }),
      );
    }, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [dispatch]);
}

export function TransactionQueueProvider({ children }: { children: React.ReactNode }) {
  const [entries, dispatch] = useReducer(queueReducer, [], () => hydratePending());

  useEffect(() => { persistPending(entries); }, [entries]);

  useTransactionStatusPoller(entries, dispatch);

  const enqueue = useCallback((payload: EnqueuePayload): string => {
    const id = crypto.randomUUID();
    dispatch({ type: "ENQUEUE", payload: { ...payload, id, timestamp: Date.now(), status: "pending", pollFailureCount: 0 } });
    return id;
  }, []);

  const updateStatus = useCallback((id: string, status: TransactionStatus, meta?: Partial<TransactionEntry>) => {
    dispatch({ type: "UPDATE_STATUS", id, status, meta });
  }, []);

  const dismiss = useCallback((id: string) => { dispatch({ type: "DISMISS", id }); }, []);
  const dismissAllCompleted = useCallback(() => { dispatch({ type: "DISMISS_ALL_COMPLETED" }); }, []);

  return (
    <TransactionQueueContext.Provider value={{ entries, enqueue, updateStatus, dismiss, dismissAllCompleted }}>
      {children}
    </TransactionQueueContext.Provider>
  );
}

export function useTransactionQueue(): TransactionQueueContextValue {
  const ctx = useContext(TransactionQueueContext);
  if (!ctx) throw new Error("useTransactionQueue must be used within TransactionQueueProvider");
  return ctx;
}

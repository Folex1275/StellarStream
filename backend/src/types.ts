/**
 * Type definitions for Stellar event watcher service
 */

import { SorobanRpc } from "@stellar/stellar-sdk";

/**
 * Configuration for the event watcher service
 */
export interface EventWatcherConfig {
  rpcUrl: string;
  horizonUrl: string;
  networkPassphrase: string;
  contractId: string;
  pollIntervalMs: number;
  maxRetries: number;
  retryDelayMs: number;
}

/**
 * Parsed event data from Stellar contract
 */
export interface ParsedContractEvent {
  id: string;
  type: string;
  ledger: number;
  ledgerClosedAt: string;
  contractId: string;
  topics: string[];
  value: unknown;
  txHash: string;
  /** Zero-based index of this event within its transaction, extracted from event.id */
  eventIndex: number;
  inSuccessfulContractCall: boolean;
}

/**
 * Service state for tracking cursor position
 */
export interface WatcherState {
  lastProcessedLedger: number;
  isRunning: boolean;
  errorCount: number;
  lastError?: Error;
  ledgersSinceLastVerification: number;
  lastVerifiedLedger: number;
}

/**
 * Event filter criteria
 */
export interface EventFilter {
  contractIds: string[];
  topics?: string[][];
  type?: SorobanRpc.Api.EventType;
}

/**
 * Retry configuration
 */
export interface RetryConfig {
  maxRetries: number;
  delayMs: number;
  backoffMultiplier?: number;
}

/** A stream record as stored/returned by the API. */
export interface Stream {
  id: string;
  sender: string;
  receiver: string;
  token: string;
  totalAmount: string;
  withdrawnAmount: string;
  startTime: number;
  endTime: number;
  cancelled: boolean;
  isPaused: boolean;
  createdAt: number;
  txHash: string;
}

/** Opaque base64url cursor string. */
export type Cursor = string;

/** Decoded cursor payload. */
export interface CursorPayload {
  id: string;
  createdAt: number;
}

/** Query parameters for listing streams. */
export interface StreamListQuery {
  after?: string;
  before?: string;
  limit?: number;
  sender?: string;
  receiver?: string;
  status?: "active" | "paused" | "cancelled" | "completed";
}

/** Paginated stream list response. */
export interface StreamPage {
  data: Stream[];
  pageInfo: {
    nextCursor: string | null;
    prevCursor: string | null;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
  total: number;
}

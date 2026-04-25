# Implementation Plan: Transaction Queue Manager

## Overview

Implement UI parallelism for in-flight Stellar transactions via a React context-driven queue panel mounted in the Sidebar footer. State is managed by a reducer, persisted to session storage, and polled against the Stellar RPC every 3 seconds.

## Tasks

- [x] 1. Define core types and reducer
  - [x] 1.1 Create `frontend/lib/providers/TransactionQueueProvider.tsx` with `TransactionStatus`, `TransactionEntry`, `EnqueuePayload`, and `QueueAction` types
    - Import `TransactionEventType` from `TransactionHistorySidebar`
    - Define all fields per the data model in the design
    - _Requirements: 2.1, 2.2, 2.4_
  - [x] 1.2 Implement the `queueReducer` handling `ENQUEUE`, `UPDATE_STATUS`, `DISMISS`, `DISMISS_ALL_COMPLETED`, and `HYDRATE` actions
    - `ENQUEUE`: append entry, leave existing entries unchanged
    - `UPDATE_STATUS`: update matching entry's status and optional meta fields, no-op + dev warning on unknown id
    - `DISMISS`: remove exactly one entry by id, no-op on unknown id
    - `DISMISS_ALL_COMPLETED`: remove all `confirmed` and `failed` entries, keep all `pending`
    - `HYDRATE`: replace state with provided entries (used on mount)
    - _Requirements: 2.1, 2.3, 3.1, 3.2, 5.1, 5.2, 5.4, 6.3_
  - [ ]* 1.3 Write property tests for the reducer (Properties 1–5, 8–10)
    - **Property 1: Enqueue invariants** — Validates: Requirements 2.1, 2.3
    - **Property 2: All TransactionEventTypes are accepted** — Validates: Requirements 2.2
    - **Property 3: Unique entry IDs** — Validates: Requirements 2.4
    - **Property 4: Status update correctness** — Validates: Requirements 3.1, 3.2
    - **Property 5: Poll failure retention** — Validates: Requirements 3.4
    - **Property 8: Dismiss removes exactly one entry** — Validates: Requirements 5.2
    - **Property 9: Dismiss-all preserves pending entries** — Validates: Requirements 5.4
    - **Property 10: Session storage round-trip** — Validates: Requirements 6.3
    - File: `frontend/lib/providers/__tests__/transaction-queue.pbt.test.ts`
    - Define arbitraries: `transactionEventTypeArb`, `enqueuePayloadArb`, `transactionEntryArb`, `queueStateArb`
    - Minimum 100 iterations per property; tag each test with `// Feature: transaction-queue-manager, Property N: ...`

- [x] 2. Implement session storage helpers and context provider
  - [x] 2.1 Add `persistPending` and `hydratePending` helpers inside `TransactionQueueProvider.tsx`
    - `persistPending`: filter entries to `status === "pending"`, write JSON to `txqueue_pending`; catch storage errors silently
    - `hydratePending`: read and parse `txqueue_pending`; on JSON parse error clear the key and return `[]`
    - _Requirements: 6.3_
  - [x] 2.2 Create `TransactionQueueContext`, `TransactionQueueProvider` component, and `useTransactionQueue` hook
    - Provider initializes state via `useReducer(queueReducer, [])`
    - On mount: call `hydratePending` and dispatch `HYDRATE`
    - On every state change: call `persistPending`
    - Expose `entries`, `enqueue` (generates uuid, dispatches `ENQUEUE`, returns id), `updateStatus`, `dismiss`, `dismissAllCompleted`
    - _Requirements: 2.1, 2.4, 6.1, 6.2, 6.3_
  - [ ]* 2.3 Write unit tests for session storage helpers and provider
    - Test `persistPending` / `hydratePending` round-trip
    - Test error path when `sessionStorage.setItem` throws
    - Test JSON parse error path clears the key
    - File: `frontend/lib/providers/__tests__/transaction-queue.test.ts`
    - _Requirements: 6.3_

- [x] 3. Implement `useTransactionStatusPoller`
  - [x] 3.1 Add `useTransactionStatusPoller` hook inside `TransactionQueueProvider.tsx` (not exported)
    - Poll every 3 seconds for each entry where `status === "pending"` and `hash !== ""`
    - On confirmed/failed response: dispatch `UPDATE_STATUS` with terminal status and reset `pollFailureCount` to 0
    - On poll failure: dispatch `UPDATE_STATUS` incrementing `pollFailureCount` by 1, retain last known status
    - After 3 consecutive failures: surface retry affordance (set a flag readable by the UI)
    - Clear interval on unmount
    - _Requirements: 3.1, 3.2, 3.4_
  - [ ]* 3.2 Write unit tests for `useTransactionStatusPoller`
    - Mock Stellar RPC responses (confirmed, failed, network error)
    - Verify `UPDATE_STATUS` dispatched on confirmation
    - Verify `pollFailureCount` increments on failure
    - Verify entries with empty hash are skipped
    - File: `frontend/lib/providers/__tests__/transaction-queue.test.ts`
    - _Requirements: 3.1, 3.2, 3.4_

- [ ] 4. Checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 5. Implement `TransactionEntryRow` component
  - [x] 5.1 Create `TransactionEntryRow` inside `frontend/components/dashboard/TransactionQueueManager.tsx`
    - Render: type label, truncated hash (first 6 + "…" + last 4 chars, or placeholder when empty), amount + token when present, status badge
    - Animated spinner (Framer Motion or CSS) for `pending` entries
    - Dismiss button visible only for `confirmed` and `failed` entries; calls `dismiss(id)` on click
    - StellarExpert link (`https://stellar.expert/explorer/public/tx/{hash}`) rendered only when `hash` is non-empty
    - All interactive controls keyboard-accessible (Tab + Enter/Space)
    - _Requirements: 4.2, 4.4, 5.1, 5.2, 7.2_
  - [ ]* 5.2 Write property tests for `TransactionEntryRow` (Properties 6, 11)
    - **Property 6: Entry row renders required fields** — Validates: Requirements 4.2, 4.4
    - **Property 11: Queue badge count equals pending entry count** — Validates: Requirements 1.2
    - File: `frontend/lib/providers/__tests__/transaction-queue.pbt.test.ts`
    - _Requirements: 1.2, 4.2, 4.4_
  - [ ]* 5.3 Write unit tests for `TransactionEntryRow`
    - Renders correct fields for `confirmed`, `failed`, and `pending` entries
    - Hides StellarExpert link when hash is empty
    - Shows dismiss button only for terminal statuses
    - File: `frontend/lib/providers/__tests__/transaction-queue.test.ts`
    - _Requirements: 4.2, 4.4, 5.1_

- [x] 6. Implement `TransactionQueueManager` component
  - [x] 6.1 Create `frontend/components/dashboard/TransactionQueueManager.tsx`
    - Accept `collapsed` prop (boolean) for sidebar-collapsed mode
    - Render nothing (`null`) when `entries.length === 0`
    - Collapsed state: compact icon + `Queue_Badge` showing count of `pending` entries
    - When `collapsed` prop is true: render icon + badge only, no labels or expanded content
    - Expanded state: scrollable list of `TransactionEntryRow` items in reverse-chronological order (sort by `timestamp` descending)
    - Animated toggle between collapsed/expanded using Framer Motion
    - "Dismiss all" control calling `dismissAllCompleted`; visible when at least one non-pending entry exists
    - ARIA live region (`aria-live="polite"`) that announces status changes to `confirmed` or `failed` with entry type label and new status
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 4.1, 4.3, 5.3, 5.4, 7.1, 7.2_
  - [ ]* 6.2 Write property test for `TransactionQueueManager` (Properties 7, 12)
    - **Property 7: Reverse-chronological ordering** — Validates: Requirements 4.3
    - **Property 12: ARIA live region reflects status changes** — Validates: Requirements 7.1
    - File: `frontend/lib/providers/__tests__/transaction-queue.pbt.test.ts`
    - _Requirements: 4.3, 7.1_
  - [ ]* 6.3 Write unit tests for `TransactionQueueManager`
    - Renders nothing when queue is empty
    - Shows correct badge count
    - Toggles expanded/collapsed on click
    - File: `frontend/lib/providers/__tests__/transaction-queue.test.ts`
    - _Requirements: 1.2, 1.3, 4.1_

- [x] 7. Wire `TransactionQueueProvider` into dashboard layout
  - [x] 7.1 Wrap `DashboardShell` children with `TransactionQueueProvider` in `frontend/components/dashboard/dashboard-shell.tsx` (or equivalent layout file above the route tree)
    - Provider must sit above `<Sidebar>` and `<main>` so context is available to all dashboard routes
    - _Requirements: 6.1, 6.2_

- [x] 8. Wire `TransactionQueueManager` into `Sidebar`
  - [x] 8.1 Render `<TransactionQueueManager collapsed={isCollapsed} />` in the desktop sidebar footer of `frontend/components/dashboard/sidebar.tsx`, below the wallet card
    - Pass the sidebar's existing collapsed state as the `collapsed` prop
    - _Requirements: 1.1, 1.4_
  - [x] 8.2 Render `<TransactionQueueManager collapsed />` in the mobile bottom bar area of `sidebar.tsx`
    - Render in the mobile bottom bar section (viewport < 768 px)
    - _Requirements: 7.3_

- [ ] 9. Final checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP
- Each task references specific requirements for traceability
- Property tests use `fast-check` with a minimum of 100 iterations each
- Unit tests and property tests live in `frontend/lib/providers/__tests__/`
- The poller and session storage helpers are internal to `TransactionQueueProvider.tsx` and not exported

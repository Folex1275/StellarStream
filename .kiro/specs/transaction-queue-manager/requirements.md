# Requirements Document

## Introduction

The Transaction Queue Manager enables UI parallelism for in-flight blockchain transactions. Currently, a pending withdrawal blocks the user from initiating additional transactions. This feature introduces a persistent footer-based queue panel in the Sidebar that tracks multiple simultaneous in-flight transactions, displays their live status, and allows users to continue interacting with the app without waiting for prior transactions to confirm.

## Glossary

- **Transaction_Queue_Manager**: The UI component rendered in the Sidebar footer that tracks and displays all in-flight transactions.
- **In_Flight_Transaction**: A transaction that has been submitted to the network and is awaiting confirmation (status: `pending`).
- **Transaction_Entry**: A single record in the queue representing one submitted transaction, including its type, status, hash, and metadata.
- **Transaction_Status**: The current state of a Transaction_Entry — one of `pending`, `confirmed`, or `failed`.
- **Queue_Badge**: A numeric indicator on the Transaction_Queue_Manager showing the count of currently pending transactions.
- **Sidebar**: The existing `frontend/components/dashboard/sidebar.tsx` navigation component containing the footer area.
- **TransactionEvent**: The existing data type defined in `TransactionHistorySidebar.tsx` representing a transaction record.

---

## Requirements

### Requirement 1: Display In-Flight Transactions in the Sidebar Footer

**User Story:** As a user, I want to see all my pending transactions in the sidebar footer, so that I can monitor their progress without navigating away.

#### Acceptance Criteria

1. THE Transaction_Queue_Manager SHALL render in the footer area of the Sidebar, below the wallet card.
2. WHEN at least one In_Flight_Transaction exists, THE Transaction_Queue_Manager SHALL display a collapsed summary showing the Queue_Badge count and a progress indicator.
3. WHEN no In_Flight_Transactions exist, THE Transaction_Queue_Manager SHALL render nothing (zero-height, no visual footprint).
4. WHEN the Sidebar is in collapsed mode, THE Transaction_Queue_Manager SHALL display only the Queue_Badge on a compact icon, without labels or expanded content.

---

### Requirement 2: Add Transactions to the Queue

**User Story:** As a user, I want each transaction I submit to be automatically tracked in the queue, so that I don't have to manually monitor each one.

#### Acceptance Criteria

1. WHEN a transaction is submitted to the network, THE Transaction_Queue_Manager SHALL add a Transaction_Entry to the queue with status `pending`.
2. THE Transaction_Queue_Manager SHALL support concurrent Transaction_Entries of any TransactionEvent type: `migration`, `withdrawal`, `cancellation`, `stream_created`, `stream_paused`, `stream_resumed`, `approval`, and `transfer`.
3. WHEN a second transaction is submitted while a prior transaction has status `pending`, THE Transaction_Queue_Manager SHALL add the new Transaction_Entry without removing or blocking the existing one.
4. THE Transaction_Queue_Manager SHALL assign each Transaction_Entry a unique identifier at the time of submission.

---

### Requirement 3: Update Transaction Status in Real Time

**User Story:** As a user, I want the queue to reflect the latest status of each transaction, so that I know when one confirms or fails.

#### Acceptance Criteria

1. WHEN a Transaction_Entry transitions to status `confirmed`, THE Transaction_Queue_Manager SHALL update that entry's displayed status within 5 seconds of the on-chain confirmation.
2. WHEN a Transaction_Entry transitions to status `failed`, THE Transaction_Queue_Manager SHALL update that entry's displayed status and visually distinguish it from confirmed entries.
3. WHILE a Transaction_Entry has status `pending`, THE Transaction_Queue_Manager SHALL display an animated loading indicator for that entry.
4. IF a status poll or subscription call fails, THEN THE Transaction_Queue_Manager SHALL retain the Transaction_Entry at its last known status and display a retry affordance.

---

### Requirement 4: Allow Users to Expand and Inspect the Queue

**User Story:** As a user, I want to expand the queue panel to see details of each in-flight transaction, so that I can verify what is pending.

#### Acceptance Criteria

1. WHEN the user clicks the Transaction_Queue_Manager summary, THE Transaction_Queue_Manager SHALL toggle between collapsed and expanded states using an animated transition.
2. WHILE the Transaction_Queue_Manager is expanded, THE Transaction_Queue_Manager SHALL display each Transaction_Entry with its type label, truncated transaction hash, amount (if available), token (if available), and current Transaction_Status.
3. WHILE the Transaction_Queue_Manager is expanded, THE Transaction_Queue_Manager SHALL display Transaction_Entries in reverse-chronological order (most recently submitted first).
4. WHERE a Transaction_Entry has a non-empty hash, THE Transaction_Queue_Manager SHALL provide a link to view the transaction on StellarExpert.

---

### Requirement 5: Dismiss Completed Transactions

**User Story:** As a user, I want to dismiss confirmed or failed transactions from the queue, so that the panel stays uncluttered.

#### Acceptance Criteria

1. WHEN a Transaction_Entry reaches status `confirmed` or `failed`, THE Transaction_Queue_Manager SHALL display a dismiss control for that entry.
2. WHEN the user activates the dismiss control for a Transaction_Entry, THE Transaction_Queue_Manager SHALL remove that entry from the queue with an animated exit transition.
3. WHEN all Transaction_Entries have been dismissed, THE Transaction_Queue_Manager SHALL return to its zero-height hidden state.
4. THE Transaction_Queue_Manager SHALL provide a "Dismiss all" control that removes all non-pending Transaction_Entries in a single action.

---

### Requirement 6: Persist Queue State Across Navigation

**User Story:** As a user, I want my in-flight transactions to remain visible when I navigate between dashboard pages, so that I don't lose track of pending operations.

#### Acceptance Criteria

1. WHILE In_Flight_Transactions exist, THE Transaction_Queue_Manager SHALL retain all Transaction_Entries when the user navigates between routes within the dashboard.
2. THE Transaction_Queue_Manager SHALL source its state from a context or store that is mounted above the route-level component tree, so that route changes do not unmount the queue.
3. IF the browser tab is refreshed, THEN THE Transaction_Queue_Manager SHALL restore any Transaction_Entries that were in status `pending` at the time of refresh from session storage.

---

### Requirement 7: Accessibility and Responsive Behavior

**User Story:** As a user on any device, I want the transaction queue to be accessible and usable, so that I can monitor transactions regardless of screen size or assistive technology.

#### Acceptance Criteria

1. THE Transaction_Queue_Manager SHALL provide ARIA live region announcements when a Transaction_Entry status changes to `confirmed` or `failed`.
2. THE Transaction_Queue_Manager SHALL be fully keyboard-navigable, with all interactive controls reachable via Tab and activatable via Enter or Space.
3. WHEN rendered on a mobile viewport, THE Transaction_Queue_Manager SHALL appear in the mobile bottom bar area rather than the desktop sidebar footer.
4. THE Transaction_Queue_Manager SHALL maintain a color contrast ratio of at least 4.5:1 for all text elements against their backgrounds.

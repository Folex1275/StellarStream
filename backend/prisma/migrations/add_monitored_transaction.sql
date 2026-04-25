-- Migration: add_monitored_transaction (#964)
-- Tracks transactions for automatic fee-bump relaying.

CREATE TABLE IF NOT EXISTS "MonitoredTransaction" (
  "id"                     TEXT PRIMARY KEY,
  "tx_hash"                TEXT NOT NULL UNIQUE,
  "tx_xdr"                 TEXT NOT NULL,
  "source_address"         TEXT NOT NULL,
  "original_fee_stroops"   TEXT NOT NULL,
  "current_fee_stroops"    TEXT NOT NULL,
  "bump_count"             INTEGER NOT NULL DEFAULT 0,
  "max_bumps"              INTEGER NOT NULL DEFAULT 3,
  "status"                 TEXT NOT NULL DEFAULT 'PENDING',
  "submitted_at"           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "confirmed_at"           TIMESTAMPTZ,
  "last_bump_at"           TIMESTAMPTZ,
  "error_message"          TEXT,
  "created_at"             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updated_at"             TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "MonitoredTransaction_status_idx"
  ON "MonitoredTransaction"("status");

CREATE INDEX IF NOT EXISTS "MonitoredTransaction_submitted_at_idx"
  ON "MonitoredTransaction"("submitted_at");

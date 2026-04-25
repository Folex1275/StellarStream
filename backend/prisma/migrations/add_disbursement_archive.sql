-- Migration: add_disbursement_archive (#845)
-- Cold-storage table for disbursement history older than 1 year.

CREATE TABLE IF NOT EXISTS "DisbursementArchive" (
  id              TEXT PRIMARY KEY,
  event_type      TEXT NOT NULL,
  stream_id       TEXT NOT NULL,
  tx_hash         TEXT NOT NULL,
  ledger          INTEGER NOT NULL,
  ledger_closed_at TEXT NOT NULL,
  sender          TEXT,
  receiver        TEXT,
  amount          NUMERIC,
  metadata        TEXT,
  created_at      TIMESTAMPTZ NOT NULL,
  archived_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_disbursement_archive_stream_id  ON "DisbursementArchive" (stream_id);
CREATE INDEX IF NOT EXISTS idx_disbursement_archive_created_at ON "DisbursementArchive" (created_at);
CREATE INDEX IF NOT EXISTS idx_disbursement_archive_archived_at ON "DisbursementArchive" (archived_at);

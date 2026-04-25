-- Migration: add_audit_log_hash_chain (#968)
-- Blockchain-style hash-chain for tamper detection on audit logs.

ALTER TABLE "EventLog"
  ADD COLUMN IF NOT EXISTS "parent_hash" TEXT,
  ADD COLUMN IF NOT EXISTS "entry_hash"  TEXT;

CREATE INDEX IF NOT EXISTS "EventLog_entry_hash_idx"
  ON "EventLog"("entry_hash");

CREATE INDEX IF NOT EXISTS "EventLog_parent_hash_idx"
  ON "EventLog"("parent_hash");

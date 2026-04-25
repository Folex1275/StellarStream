-- Migration: add_disbursement_draft_versions (#961)
-- Split-draft version control with restore capability.

CREATE TABLE IF NOT EXISTS "DisbursementDraft" (
  "id"              TEXT PRIMARY KEY,
  "sender_address"  TEXT NOT NULL,
  "name"            TEXT,
  "asset"           TEXT NOT NULL,
  "current_version" INTEGER NOT NULL DEFAULT 1,
  "status"          TEXT NOT NULL DEFAULT 'DRAFT',
  "created_at"      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updated_at"      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "DisbursementDraft_sender_address_idx"
  ON "DisbursementDraft"("sender_address");
CREATE INDEX IF NOT EXISTS "DisbursementDraft_status_idx"
  ON "DisbursementDraft"("status");

CREATE TABLE IF NOT EXISTS "DisbursementDraftVersion" (
  "id"            TEXT PRIMARY KEY,
  "draft_id"      TEXT NOT NULL REFERENCES "DisbursementDraft"("id") ON DELETE CASCADE,
  "version"       INTEGER NOT NULL,
  "total_amount"  TEXT NOT NULL,
  "recipients"    JSONB NOT NULL,
  "change_note"   TEXT,
  "changed_by"    TEXT NOT NULL,
  "created_at"    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE("draft_id", "version")
);

CREATE INDEX IF NOT EXISTS "DisbursementDraftVersion_draft_id_idx"
  ON "DisbursementDraftVersion"("draft_id");

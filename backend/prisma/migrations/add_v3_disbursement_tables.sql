-- V3 PostgreSQL Schema Migration (#941)
-- Creates tables for V3 Splitter protocol: one-to-many disbursements

-- Header record for a single fund-split disbursement
CREATE TABLE IF NOT EXISTS "Disbursement" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "sender_address" TEXT NOT NULL,
  "total_amount" TEXT NOT NULL,
  "asset" TEXT NOT NULL,
  "tx_hash" TEXT NOT NULL UNIQUE,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Individual payout row linked to a parent Disbursement
CREATE TABLE IF NOT EXISTS "SplitRecipient" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "disbursement_id" TEXT NOT NULL,
  "recipient_address" TEXT NOT NULL,
  "amount" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'PENDING',
  CONSTRAINT "SplitRecipient_disbursement_id_fkey" FOREIGN KEY ("disbursement_id") REFERENCES "Disbursement"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- Indexes for high-speed dashboard queries
CREATE INDEX IF NOT EXISTS "Disbursement_sender_address_idx" ON "Disbursement"("sender_address");
CREATE INDEX IF NOT EXISTS "Disbursement_tx_hash_idx" ON "Disbursement"("tx_hash");
CREATE INDEX IF NOT EXISTS "SplitRecipient_disbursement_id_idx" ON "SplitRecipient"("disbursement_id");
CREATE INDEX IF NOT EXISTS "SplitRecipient_recipient_address_idx" ON "SplitRecipient"("recipient_address");

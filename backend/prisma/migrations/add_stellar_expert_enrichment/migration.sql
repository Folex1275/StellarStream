-- Alter Asset table to add Stellar-Expert enrichment fields
ALTER TABLE "Asset" 
ADD COLUMN "stellar_expert_verified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "toml_url" TEXT,
ADD COLUMN "org_verified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "org_home_domain" TEXT;

-- Create indexes for new verification fields
CREATE INDEX "Asset_stellar_expert_verified_idx" ON "Asset"("stellar_expert_verified");
CREATE INDEX "Asset_org_verified_idx" ON "Asset"("org_verified");

-- Create Disbursement table (active disbursements)
CREATE TABLE "Disbursement" (
    "id" TEXT NOT NULL,
    "stream_id" TEXT NOT NULL,
    "tx_hash" TEXT NOT NULL,
    "sender" TEXT NOT NULL,
    "receiver" TEXT NOT NULL,
    "amount" BIGINT NOT NULL,
    "token_address" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMP(3),
    "ledger" INTEGER NOT NULL,

    CONSTRAINT "Disbursement_pkey" PRIMARY KEY ("id")
);

-- Create unique index on tx_hash
CREATE UNIQUE INDEX "Disbursement_tx_hash_key" ON "Disbursement"("tx_hash");

-- Create indexes for Disbursement
CREATE INDEX "Disbursement_stream_id_idx" ON "Disbursement"("stream_id");
CREATE INDEX "Disbursement_sender_idx" ON "Disbursement"("sender");
CREATE INDEX "Disbursement_receiver_idx" ON "Disbursement"("receiver");
CREATE INDEX "Disbursement_status_idx" ON "Disbursement"("status");
CREATE INDEX "Disbursement_created_at_idx" ON "Disbursement"("created_at");

-- Create ArchivedDisbursement table (cold storage)
CREATE TABLE "ArchivedDisbursement" (
    "id" TEXT NOT NULL,
    "stream_id" TEXT NOT NULL,
    "tx_hash" TEXT NOT NULL,
    "sender" TEXT NOT NULL,
    "receiver" TEXT NOT NULL,
    "amount" BIGINT NOT NULL,
    "token_address" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "completed_at" TIMESTAMP(3) NOT NULL,
    "archived_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "original_ledger" INTEGER NOT NULL,

    CONSTRAINT "ArchivedDisbursement_pkey" PRIMARY KEY ("id")
);

-- Create indexes for ArchivedDisbursement
CREATE INDEX "ArchivedDisbursement_stream_id_idx" ON "ArchivedDisbursement"("stream_id");
CREATE INDEX "ArchivedDisbursement_completed_at_idx" ON "ArchivedDisbursement"("completed_at");
CREATE INDEX "ArchivedDisbursement_archived_at_idx" ON "ArchivedDisbursement"("archived_at");
CREATE INDEX "ArchivedDisbursement_sender_idx" ON "ArchivedDisbursement"("sender");
CREATE INDEX "ArchivedDisbursement_receiver_idx" ON "ArchivedDisbursement"("receiver");

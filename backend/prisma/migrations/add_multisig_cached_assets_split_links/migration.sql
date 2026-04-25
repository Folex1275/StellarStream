-- CreateTable MultisigProposal
CREATE TABLE "MultisigProposal" (
    "id" TEXT NOT NULL,
    "proposal_id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "transaction_xdr" TEXT NOT NULL,
    "signatures" JSONB NOT NULL DEFAULT '[]',
    "required_signers" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "submitted_tx_hash" TEXT,
    "error_message" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MultisigProposal_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MultisigProposal_proposal_id_key" ON "MultisigProposal"("proposal_id");

-- CreateIndex
CREATE INDEX "MultisigProposal_organization_id_idx" ON "MultisigProposal"("organization_id");

-- CreateIndex
CREATE INDEX "MultisigProposal_status_idx" ON "MultisigProposal"("status");

-- CreateIndex
CREATE INDEX "MultisigProposal_created_at_idx" ON "MultisigProposal"("created_at");

-- CreateTable CachedAsset
CREATE TABLE "CachedAsset" (
    "id" TEXT NOT NULL,
    "token_address" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "issuer" TEXT NOT NULL,
    "name" TEXT,
    "description" TEXT,
    "image_url" TEXT,
    "is_verified" BOOLEAN NOT NULL DEFAULT false,
    "decimals" INTEGER NOT NULL DEFAULT 7,
    "last_synced_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CachedAsset_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CachedAsset_token_address_key" ON "CachedAsset"("token_address");

-- CreateIndex
CREATE INDEX "CachedAsset_token_address_idx" ON "CachedAsset"("token_address");

-- CreateIndex
CREATE INDEX "CachedAsset_is_verified_idx" ON "CachedAsset"("is_verified");

-- CreateIndex
CREATE INDEX "CachedAsset_last_synced_at_idx" ON "CachedAsset"("last_synced_at");

-- CreateTable SplitLink
CREATE TABLE "SplitLink" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "full_url" TEXT NOT NULL,
    "payload_hash" TEXT NOT NULL,
    "creator_address" TEXT NOT NULL,
    "click_count" INTEGER NOT NULL DEFAULT 0,
    "last_clicked_at" TIMESTAMP(3),
    "expires_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SplitLink_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SplitLink_slug_key" ON "SplitLink"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "SplitLink_payload_hash_key" ON "SplitLink"("payload_hash");

-- CreateIndex
CREATE INDEX "SplitLink_slug_idx" ON "SplitLink"("slug");

-- CreateIndex
CREATE INDEX "SplitLink_creator_address_idx" ON "SplitLink"("creator_address");

-- CreateIndex
CREATE INDEX "SplitLink_created_at_idx" ON "SplitLink"("created_at");

-- Add webhook enhancements
ALTER TABLE "Webhook" ADD COLUMN "eventType" TEXT NOT NULL DEFAULT '*';
ALTER TABLE "Webhook" ADD COLUMN "secretKey" TEXT NOT NULL DEFAULT '';
CREATE INDEX "Webhook_eventType_idx" ON "Webhook"("eventType");
CREATE INDEX "Webhook_isActive_idx" ON "Webhook"("isActive");

-- Create WebhookDelivery table
CREATE TABLE "WebhookDelivery" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "webhookId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "maxRetries" INTEGER NOT NULL DEFAULT 5,
    "nextRetryAt" TIMESTAMP(3),
    "lastError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX "WebhookDelivery_webhookId_status_idx" ON "WebhookDelivery"("webhookId", "status");
CREATE INDEX "WebhookDelivery_nextRetryAt_idx" ON "WebhookDelivery"("nextRetryAt");
CREATE INDEX "WebhookDelivery_createdAt_idx" ON "WebhookDelivery"("createdAt");

-- Add dust filter and affiliate fields to Stream
ALTER TABLE "Stream" ADD COLUMN "isDust" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Stream" ADD COLUMN "affiliateId" TEXT;
CREATE INDEX "Stream_isDust_idx" ON "Stream"("isDust");
CREATE INDEX "Stream_affiliateId_idx" ON "Stream"("affiliateId");

-- Create Affiliate table
CREATE TABLE "Affiliate" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "stellarAddress" TEXT NOT NULL UNIQUE,
    "pendingClaim" TEXT NOT NULL DEFAULT '0',
    "totalEarned" TEXT NOT NULL DEFAULT '0',
    "claimedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX "Affiliate_stellarAddress_idx" ON "Affiliate"("stellarAddress");

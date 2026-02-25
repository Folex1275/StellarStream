-- CreateTable
CREATE TABLE "EventLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "eventType" TEXT NOT NULL,
    "streamId" TEXT NOT NULL,
    "txHash" TEXT NOT NULL,
    "ledger" INTEGER NOT NULL,
    "ledgerClosedAt" TEXT NOT NULL,
    "sender" TEXT,
    "receiver" TEXT,
    "amount" BIGINT,
    "metadata" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE INDEX "EventLog_streamId_idx" ON "EventLog"("streamId");

-- CreateIndex
CREATE INDEX "EventLog_eventType_idx" ON "EventLog"("eventType");

-- CreateIndex
CREATE INDEX "EventLog_createdAt_idx" ON "EventLog"("createdAt");

-- CreateIndex
CREATE INDEX "EventLog_ledger_idx" ON "EventLog"("ledger");

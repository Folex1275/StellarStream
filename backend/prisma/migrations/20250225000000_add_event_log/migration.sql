-- CreateTable
CREATE TABLE "event_log" (
    "event_id" TEXT NOT NULL,
    "event_type" TEXT,
    "tx_hash" TEXT,
    "ledger" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "event_log_pkey" PRIMARY KEY ("event_id")
);

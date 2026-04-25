-- #649: Daily V3 volume aggregation table
CREATE TABLE IF NOT EXISTS "GlobalStats_V3" (
  "id"              TEXT        NOT NULL DEFAULT 'v3_global',
  "totalVolumeUsd"  TEXT        NOT NULL DEFAULT '0',
  "dailyVolumeUsd"  TEXT        NOT NULL DEFAULT '0',
  "totalSplits"     INTEGER     NOT NULL DEFAULT 0,
  "totalRecipients" INTEGER     NOT NULL DEFAULT 0,
  "updatedAt"       TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT "GlobalStats_V3_pkey" PRIMARY KEY ("id")
);

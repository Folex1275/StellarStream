-- Add GlobalStats table
CREATE TABLE IF NOT EXISTS "GlobalStats" (
  id TEXT PRIMARY KEY DEFAULT 'global',
  "tvlUsd" TEXT NOT NULL DEFAULT '0',
  "volume24hUsd" TEXT NOT NULL DEFAULT '0',
  "activeStreams" INTEGER NOT NULL DEFAULT 0,
  "totalStreams" INTEGER NOT NULL DEFAULT 0,
  "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Add TvlSnapshot table
CREATE TABLE IF NOT EXISTS "TvlSnapshot" (
  id TEXT PRIMARY KEY,
  "tvlUsd" TEXT NOT NULL,
  date TIMESTAMP NOT NULL UNIQUE,
  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "TvlSnapshot_date_idx" ON "TvlSnapshot"(date);

-- Add Asset table
CREATE TABLE IF NOT EXISTS "Asset" (
  id TEXT PRIMARY KEY,
  "tokenAddress" TEXT NOT NULL UNIQUE,
  "homeDomain" TEXT,
  name TEXT,
  symbol TEXT,
  "imageUrl" TEXT,
  decimals INTEGER NOT NULL DEFAULT 7,
  "isVerified" BOOLEAN NOT NULL DEFAULT false,
  "lastFetchedAt" TIMESTAMP,
  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "Asset_tokenAddress_idx" ON "Asset"("tokenAddress");

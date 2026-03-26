-- Migration: Add AssetConfig table for asset whitelist & configuration management
CREATE TABLE IF NOT EXISTS "AssetConfig" (
  "id"           TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "assetId"      TEXT NOT NULL UNIQUE,
  "symbol"       TEXT NOT NULL,
  "name"         TEXT NOT NULL,
  "decimals"     INTEGER NOT NULL DEFAULT 7,
  "isVerified"   BOOLEAN NOT NULL DEFAULT false,
  "isVisible"    BOOLEAN NOT NULL DEFAULT true,
  "yield_enabled" BOOLEAN NOT NULL DEFAULT false,
  "icon_url"     TEXT,
  "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "AssetConfig_isVerified_idx" ON "AssetConfig"("isVerified");
CREATE INDEX IF NOT EXISTS "AssetConfig_isVisible_idx"  ON "AssetConfig"("isVisible");

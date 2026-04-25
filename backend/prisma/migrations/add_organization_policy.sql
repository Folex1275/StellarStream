-- Migration: add_organization_policy (#844)
-- Stores per-organisation spend limits and asset whitelists.

CREATE TABLE IF NOT EXISTS "OrganizationPolicy" (
  id                    TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  org_address           TEXT NOT NULL UNIQUE,
  daily_spend_limit_usd NUMERIC,          -- NULL = unlimited
  allowed_assets        TEXT,             -- JSON array of asset addresses; NULL = all allowed
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_org_policy_org_address ON "OrganizationPolicy" (org_address);

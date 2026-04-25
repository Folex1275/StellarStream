-- Migration: add_autopilot_schedules
-- Stores periodic split schedule configurations for the Autopilot service

CREATE TABLE IF NOT EXISTS "AutopilotSchedule" (
  "id"              TEXT NOT NULL PRIMARY KEY,
  "name"            TEXT NOT NULL,
  "frequency"       TEXT NOT NULL,           -- cron expression, e.g. "0 9 * * 1"
  "split_config_id" TEXT NOT NULL,           -- references the split configuration
  "operator_address" TEXT NOT NULL,          -- Stellar address of the operator wallet
  "min_gas_tank_xlm" DECIMAL(20,7) NOT NULL DEFAULT 1.0,  -- minimum XLM required to trigger
  "is_active"       BOOLEAN NOT NULL DEFAULT TRUE,
  "last_run"        TIMESTAMP WITH TIME ZONE,
  "last_tx_hash"    TEXT,
  "last_error"      TEXT,
  "created_at"      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  "updated_at"      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "AutopilotSchedule_is_active_idx" ON "AutopilotSchedule"("is_active");
CREATE INDEX IF NOT EXISTS "AutopilotSchedule_last_run_idx" ON "AutopilotSchedule"("last_run");

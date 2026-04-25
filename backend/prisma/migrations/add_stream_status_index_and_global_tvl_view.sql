CREATE INDEX IF NOT EXISTS "Stream_status_idx" ON "Stream" ("status");

CREATE MATERIALIZED VIEW IF NOT EXISTS "GlobalTvlView" AS
SELECT
  1 AS "id",
  COALESCE(
    SUM(CASE WHEN "status" = 'ACTIVE' THEN "amount"::numeric ELSE 0 END),
    0
  )::text AS "totalActiveAmount",
  COUNT(*) FILTER (WHERE "status" = 'ACTIVE') AS "activeStreamCount",
  NOW() AS "refreshedAt"
FROM "Stream";

CREATE UNIQUE INDEX IF NOT EXISTS "GlobalTvlView_id_idx" ON "GlobalTvlView" ("id");

-- AlterTable: add sort_order column to persist kanban ordering within each status column
ALTER TABLE "job_applications" ADD COLUMN "sort_order" INTEGER NOT NULL DEFAULT 0;

-- Backfill: seed sort_order so existing rows preserve their appliedAt-based visual order per (user, status)
WITH ranked AS (
  SELECT
    id,
    ROW_NUMBER() OVER (PARTITION BY user_id, status ORDER BY applied_at DESC) - 1 AS new_order
  FROM "job_applications"
)
UPDATE "job_applications" AS ja
SET "sort_order" = ranked.new_order
FROM ranked
WHERE ja.id = ranked.id;

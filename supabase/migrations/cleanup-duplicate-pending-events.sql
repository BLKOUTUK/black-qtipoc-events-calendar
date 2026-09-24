-- BLKOUT Events: Remove duplicate pending events
-- Run in Supabase SQL Editor (Dashboard > SQL Editor > New Query)
--
-- Problem: Same events scraped multiple times create duplicate rows.
-- The moderation panel deduplicates on display (title+date), but the
-- stats count shows all 81 raw rows instead of ~23 unique events.
--
-- Strategy: For each group of duplicates (same title+date), keep the
-- newest row (most recent created_at) and delete the rest.

-- Step 1: Preview what will be deleted (run this first to verify)
SELECT
  id,
  title,
  date,
  status,
  source,
  created_at,
  'WILL DELETE' as action
FROM events e
WHERE status IN ('pending', 'reviewing', 'draft')
  AND id NOT IN (
    -- Keep the newest row per title+date group
    SELECT DISTINCT ON (lower(trim(title)), date) id
    FROM events
    WHERE status IN ('pending', 'reviewing', 'draft')
    ORDER BY lower(trim(title)), date, created_at DESC
  )
ORDER BY lower(trim(title)), date, created_at;

-- Step 2: Actually delete duplicates (uncomment and run after verifying Step 1)
-- DELETE FROM events
-- WHERE status IN ('pending', 'reviewing', 'draft')
--   AND id NOT IN (
--     SELECT DISTINCT ON (lower(trim(title)), date) id
--     FROM events
--     WHERE status IN ('pending', 'reviewing', 'draft')
--     ORDER BY lower(trim(title)), date, created_at DESC
--   );

-- Step 3: Verify the cleanup
-- SELECT status, count(*) FROM events GROUP BY status ORDER BY status;

-- Phase 4.3: HOT Optimization for post_stats
-- Drops indexes that violate HOT principle and sets fillfactor for update headroom

DROP INDEX IF EXISTS idx_post_stats_updated;
DROP INDEX IF EXISTS idx_post_stats_views;
DROP INDEX IF EXISTS idx_post_stats_likes;

ALTER TABLE post_stats SET (fillfactor = 70);

-- NOTE: Run the following manually outside a transaction after this migration:
--   VACUUM ANALYZE post_stats;

-- ============================================
-- Phase 4.2: Fix Database Violations (v3)
-- ============================================

-- ============================================
-- 1. post_stats: fillfactor=70 + fix FK
-- ============================================

BEGIN;

-- Drop FK constraint from comments to post_stats
ALTER TABLE comments DROP CONSTRAINT IF EXISTS comments_post_slug_fkey;

-- Create new table with fillfactor=70 (using correct column name: slug)
CREATE TABLE post_stats_new (
    slug          TEXT PRIMARY KEY,
    view_count    BIGINT NOT NULL DEFAULT 0,
    like_count    INT    NOT NULL DEFAULT 0,
    comment_count INT    NOT NULL DEFAULT 0,
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
) WITH (fillfactor = 70);

-- Copy all data
INSERT INTO post_stats_new SELECT * FROM post_stats;

-- Drop old table and rename
DROP TABLE post_stats;
ALTER TABLE post_stats_new RENAME TO post_stats;

COMMIT;

-- Re-add FK constraint (outside transaction)
ALTER TABLE comments
    ADD CONSTRAINT comments_post_slug_fkey
    FOREIGN KEY (slug) REFERENCES post_stats(slug);

-- Drop HOT-blocking indexes per GOLDEN_RULES 4.3
DROP INDEX IF EXISTS idx_post_stats_updated;
DROP INDEX IF EXISTS idx_post_stats_views;
DROP INDEX IF EXISTS idx_post_stats_likes;

-- ============================================
-- 2. users: add deleted_at + partial unique indexes
-- ============================================

-- Add deleted_at column for soft delete (idempotent)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'users'
          AND column_name = 'deleted_at'
    ) THEN
        ALTER TABLE users ADD COLUMN deleted_at TIMESTAMPTZ;
    END IF;
END $$;

-- Drop simple unique indexes (these violate soft-delete uniqueness per GOLDEN_RULES 4.2)
DROP INDEX IF EXISTS idx_users_email;
DROP INDEX IF EXISTS idx_users_username;

-- Create partial unique indexes (only for active users) per GOLDEN_RULES 4.2
DROP INDEX IF EXISTS idx_users_email_active;
CREATE UNIQUE INDEX idx_users_email_active
    ON users (email) WHERE deleted_at IS NULL;

DROP INDEX IF EXISTS idx_users_username_active;
CREATE UNIQUE INDEX idx_users_username_active
    ON users (username) WHERE deleted_at IS NULL;

-- ============================================
-- 3. users.profile: jsonb_path_ops GIN index
-- ============================================

DROP INDEX IF EXISTS idx_users_profile_gin;
CREATE INDEX idx_users_profile_gin
    ON users USING GIN (profile jsonb_path_ops);

-- ============================================
-- Verification
-- ============================================

SELECT
    'post_stats indexes' AS check_name,
    COUNT(*) AS total_indexes,
    COUNT(*) FILTER (WHERE indexname LIKE 'idx_post_stats_%') AS violating_indexes
FROM pg_indexes
WHERE tablename = 'post_stats';

SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'users'
  AND indexname IN ('idx_users_email_active', 'idx_users_username_active', 'idx_users_profile_gin');

-- ============================================
-- Platform Transformation Phase 1: Create Follows Table
-- 关注/粉丝关系 — 学术社交网络核心
-- ============================================

BEGIN;

-- 1. Create follows table
CREATE TABLE IF NOT EXISTS follows (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    follower_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    followed_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- 防止重复关注
    UNIQUE (follower_id, followed_id),
    -- 防止自己关注自己
    CHECK (follower_id <> followed_id)
);

-- 2. Index: 查某个用户关注了谁
CREATE INDEX IF NOT EXISTS idx_follows_follower
    ON follows (follower_id, created_at DESC);

-- 3. Index: 查某个用户被谁关注（粉丝列表）
CREATE INDEX IF NOT EXISTS idx_follows_followed
    ON follows (followed_id, created_at DESC);

-- 4. Comments for documentation
COMMENT ON TABLE follows IS '用户关注关系 — 学术社交网络核心';
COMMENT ON COLUMN follows.follower_id IS '关注者（发起关注的人）';
COMMENT ON COLUMN follows.followed_id IS '被关注者';

COMMIT;

-- 验证
SELECT 'follows' as table_name, COUNT(*) as row_count FROM follows;

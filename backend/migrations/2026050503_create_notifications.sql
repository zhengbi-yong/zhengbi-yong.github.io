-- ============================================
-- Platform Transformation Phase 1: Create Notifications Table
-- 统一通知系统 — 关注/评论/点赞/同行评议
-- ============================================

BEGIN;

-- 1. Notification type enum
DO $$ BEGIN
    CREATE TYPE notification_type AS ENUM (
        'follow',           -- 有人关注了你
        'comment',          -- 有人评论了你的文章
        'comment_reply',    -- 有人回复了你的评论
        'like',             -- 有人点赞了你的文章
        'comment_like',     -- 有人点赞了你的评论
        'mention',          -- 有人在评论中 @ 了你
        'review',           -- 有人评议了你的论文
        'system'            -- 系统通知
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 2. Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type notification_type NOT NULL,
    title TEXT NOT NULL,                  -- 简短标题，如 "张三关注了你"
    body TEXT,                            -- 详细内容，如评论/回复文本
    link TEXT,                            -- 跳转链接（如 /posts/slug#comment-123）
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    actor_id UUID REFERENCES users(id) ON DELETE SET NULL,  -- 触发者
    metadata JSONB DEFAULT '{}',         -- 扩展数据（post_slug, comment_id等）
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Core index: 用户未读通知（最频繁查询）
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread
    ON notifications (user_id, is_read, created_at DESC);

-- 4. Support index: 按创建时间浏览
CREATE INDEX IF NOT EXISTS idx_notifications_created
    ON notifications (created_at DESC);

-- 5. Support index: 按触发者查询
CREATE INDEX IF NOT EXISTS idx_notifications_actor
    ON notifications (actor_id) WHERE actor_id IS NOT NULL;

-- 6. Comments
COMMENT ON TABLE notifications IS '统一通知系统 — 所有用户交互事件';
COMMENT ON COLUMN notifications.user_id IS '通知接收者';
COMMENT ON COLUMN notifications.actor_id IS '触发者（关注者/评论者/点赞者）';
COMMENT ON COLUMN notifications.metadata IS '扩展数据 JSON: {post_slug, comment_id, ...}';

COMMIT;

-- 验证
SELECT 'notifications' as table_name, COUNT(*) as row_count FROM notifications;

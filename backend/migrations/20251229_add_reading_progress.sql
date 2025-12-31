-- 阅读进度追踪表
-- 用于记录用户阅读文章的进度

CREATE TABLE IF NOT EXISTS reading_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    post_slug TEXT NOT NULL REFERENCES posts(slug) ON DELETE CASCADE,
    progress INTEGER NOT NULL DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
    last_read_position INTEGER DEFAULT 0, -- 最后阅读的像素位置
    scroll_percentage FLOAT DEFAULT 0.0, -- 滚动百分比（更精确）
    word_count INTEGER DEFAULT 0, -- 文章总字数
    words_read INTEGER DEFAULT 0, -- 已读字数
    is_completed BOOLEAN DEFAULT FALSE,
    last_read_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- 确保每个用户对每篇文章只有一条进度记录
    UNIQUE(user_id, post_slug)
);

-- 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_reading_progress_user_id ON reading_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_reading_progress_post_slug ON reading_progress(post_slug);
CREATE INDEX IF NOT EXISTS idx_reading_progress_last_read ON reading_progress(last_read_at DESC);
CREATE INDEX IF NOT EXISTS idx_reading_progress_completed ON reading_progress(is_completed, last_read_at DESC) WHERE is_completed = TRUE;

-- 创建更新时间触发器
CREATE OR REPLACE FUNCTION update_reading_progress_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_reading_progress_updated_at ON reading_progress;
CREATE TRIGGER trigger_update_reading_progress_updated_at
    BEFORE UPDATE ON reading_progress
    FOR EACH ROW
    EXECUTE FUNCTION update_reading_progress_updated_at();

-- 添加注释
COMMENT ON TABLE reading_progress IS '用户阅读文章进度记录';
COMMENT ON COLUMN reading_progress.progress IS '阅读进度百分比 (0-100)';
COMMENT ON COLUMN reading_progress.last_read_position IS '最后阅读的滚动位置(像素)';
COMMENT ON COLUMN reading_progress.scroll_percentage IS '滚动百分比 (0.0-1.0)';
COMMENT ON COLUMN reading_progress.word_count IS '文章总字数';
COMMENT ON COLUMN reading_progress.words_read IS '已读字数';
COMMENT ON COLUMN reading_progress.is_completed IS '是否已读完文章';
COMMENT ON COLUMN reading_progress.last_read_at IS '最后阅读时间';

-- 创建视图：最近阅读的文章
CREATE OR REPLACE VIEW recently_read_posts AS
SELECT
    rp.user_id,
    rp.post_slug,
    p.title as post_title,
    rp.progress,
    rp.scroll_percentage,
    rp.is_completed,
    rp.last_read_at,
    EXTRACT(EPOCH FROM (NOW() - rp.last_read_at)) / 3600 as hours_since_read
FROM reading_progress rp
JOIN posts p ON p.slug = rp.post_slug
ORDER BY rp.last_read_at DESC;

COMMENT ON VIEW recently_read_posts IS '用户最近阅读的文章列表';

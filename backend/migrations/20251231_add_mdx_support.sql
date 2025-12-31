-- ============================================
-- MDX Support Migration
-- ============================================
-- 添加MDX内容管理支持
-- 包含：content_hash、渲染时间戳、触发器和索引
-- ============================================

-- 启用pgcrypto扩展（如果尚未启用）
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 添加MDX相关字段到posts表
ALTER TABLE posts
  ADD COLUMN IF NOT EXISTS content_hash TEXT,
  ADD COLUMN IF NOT EXISTS rendered_at TIMESTAMPTZ;

-- 添加注释
COMMENT ON COLUMN posts.content_hash IS 'MDX内容的SHA256哈希值，用于检测内容变化';
COMMENT ON COLUMN posts.rendered_at IS '最后渲染时间戳';

-- 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_posts_content_hash ON posts(content_hash);
CREATE INDEX IF NOT EXISTS idx_posts_rendered_at ON posts(rendered_at DESC);

-- ============================================
-- 触发器：自动计算content_hash
-- ============================================

-- 创建函数：自动更新content_hash
CREATE OR REPLACE FUNCTION update_content_hash()
RETURNS TRIGGER AS $$
BEGIN
  -- 仅当content字段发生变化时才重新计算哈希
  IF TG_OP = 'UPDATE' AND OLD.content IS DISTINCT FROM NEW.content THEN
    NEW.content_hash = encode(digest(NEW.content, 'sha256'), 'hex');
    NEW.rendered_at = NOW();
  ELSIF TG_OP = 'INSERT' THEN
    NEW.content_hash = encode(digest(NEW.content, 'sha256'), 'hex');
    NEW.rendered_at = NOW();
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 创建触发器
DROP TRIGGER IF EXISTS trigger_update_content_hash ON posts;
CREATE TRIGGER trigger_update_content_hash
  BEFORE INSERT OR UPDATE ON posts
  FOR EACH ROW
  EXECUTE FUNCTION update_content_hash();

-- ============================================
-- 初始化现有数据
-- ============================================

-- 为现有的文章计算content_hash
UPDATE posts
SET
  content_hash = encode(digest(content, 'sha256'), 'hex'),
  rendered_at = updated_at
WHERE content_hash IS NULL;

-- ============================================
-- 实用函数
-- ============================================

-- 函数：检查文章是否需要重新渲染
CREATE OR REPLACE FUNCTION check_post_needs_rendering(post_slug TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  post_record RECORD;
BEGIN
  SELECT slug, content_hash, rendered_at INTO post_record
  FROM posts
  WHERE slug = post_slug AND deleted_at IS NULL;

  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;

  -- 如果没有content_hash或rendered_at，需要渲染
  IF post_record.content_hash IS NULL OR post_record.rendered_at IS NULL THEN
    RETURN TRUE;
  END IF;

  -- 如果渲染时间超过1小时，可能需要重新渲染
  IF EXTRACT(EPOCH FROM (NOW() - post_record.rendered_at)) > 3600 THEN
    RETURN TRUE;
  END IF;

  RETURN FALSE;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 测试查询
-- ============================================

-- 查看MDX支持统计
SELECT
  COUNT(*) as total_posts,
  COUNT(content_hash) as posts_with_hash,
  COUNT(rendered_at) as posts_with_rendered_at,
  COUNT(*) - COUNT(content_hash) as posts_needing_init
FROM posts
WHERE deleted_at IS NULL;

-- ============================================
-- 迁移完成
-- ============================================

-- 记录迁移完成
DO $$
BEGIN
  RAISE NOTICE 'MDX support migration completed successfully';
  RAISE NOTICE 'Added fields: content_hash, rendered_at';
  RAISE NOTICE 'Added indexes: idx_posts_content_hash, idx_posts_rendered_at';
  RAISE NOTICE 'Added trigger: trigger_update_content_hash';
END $$;

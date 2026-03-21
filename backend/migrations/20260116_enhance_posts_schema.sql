-- ============================================
-- Enhanced Posts Fields Migration
-- Based on analysis of top-tier CMS (WordPress, Ghost, Contentful, Strapi)
-- ============================================

-- Add missing fields to posts table
-- These fields are standard in enterprise-grade CMS systems

-- 1. Edit count and tracking
ALTER TABLE posts
ADD COLUMN IF NOT EXISTS edit_count INTEGER NOT NULL DEFAULT 0;

-- 2. First published timestamp
ALTER TABLE posts
ADD COLUMN IF NOT EXISTS first_published_at TIMESTAMPTZ;

-- 3. Last edited by
ALTER TABLE posts
ADD COLUMN IF NOT EXISTS last_edited_by UUID REFERENCES users(id) ON DELETE SET NULL;

-- 4. Publication version tracking
ALTER TABLE posts
ADD COLUMN IF NOT EXISTS publication_version INTEGER NOT NULL DEFAULT 1;

-- 5. Author display name (cached)
ALTER TABLE posts
ADD COLUMN IF NOT EXISTS author_display_name TEXT;

-- 6. Featured status
ALTER TABLE posts
ADD COLUMN IF NOT EXISTS is_featured BOOLEAN NOT NULL DEFAULT FALSE;

-- 7. Excerpt (short summary for lists)
ALTER TABLE posts
ADD COLUMN IF NOT EXISTS excerpt TEXT;

-- 8. Social media image (OG image)
ALTER TABLE posts
ADD COLUMN IF NOT EXISTS og_image_id UUID REFERENCES media(id) ON DELETE SET NULL;

-- 9. Reading progress fields
ALTER TABLE posts
ADD COLUMN IF NOT EXISTS words_count INTEGER;

-- 10. SEO keywords
ALTER TABLE posts
ADD COLUMN IF NOT EXISTS meta_keywords TEXT;

-- 11. Estimated reading time (auto-calculated field)
ALTER TABLE posts
ADD COLUMN IF NOT EXISTS estimated_reading_time INTEGER;

-- 12. Content format (markdown, html, mdx)
ALTER TABLE posts
ADD COLUMN IF NOT EXISTS content_format TEXT NOT NULL DEFAULT 'markdown';

-- 13. Content language
ALTER TABLE posts
ADD COLUMN IF NOT EXISTS language TEXT NOT NULL DEFAULT 'zh-CN';

-- 14. Post type (article, tutorial, documentation)
ALTER TABLE posts
ADD COLUMN IF NOT EXISTS post_type TEXT NOT NULL DEFAULT 'article';

-- 15. Copyright info
ALTER TABLE posts
ADD COLUMN IF NOT EXISTS copyright_info TEXT;

-- 16. License type
ALTER TABLE posts
ADD COLUMN IF NOT EXISTS license_type TEXT;

-- 17. Source/origin URL
ALTER TABLE posts
ADD COLUMN IF NOT EXISTS source_url TEXT;

-- 18. Featured image caption
ALTER TABLE posts
ADD COLUMN IF NOT EXISTS featured_image_caption TEXT;

-- Indexes for new fields
CREATE INDEX IF NOT EXISTS idx_posts_edit_count ON posts(edit_count DESC) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_posts_featured ON posts(is_featured, published_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_posts_post_type ON posts(post_type, published_at DESC) WHERE deleted_at IS NULL;

-- ============================================
-- Populate categories with default values
-- ============================================

INSERT INTO categories (slug, name, description, display_order, post_count) VALUES
  ('computer-science', '计算机科学', '计算机科学、算法、编程和软件开发相关的文章', 1, 0),
  ('robotics', '机器人学', '机器人控制、自动化、传感器和机器人应用', 2, 0),
  ('mathematics', '数学', '数学理论、应用数学和数学建模', 3, 0),
  ('chemistry', '化学', '化学原理、分子可视化和化学实验', 4, 0),
  ('music', '音乐', '音乐理论、乐谱显示和音频合成', 5, 0),
  ('photography', '摄影', '摄影技巧、器材和作品展示', 6, 0),
  ('motor-control', '电机控制', '电机驱动、伺服系统和控制算法', 7, 0),
  ('social', '社交', '社交媒体、社交网络和在线社区', 8, 0),
  ('tactile-sensing', '触觉传感', '触觉传感器技术和应用', 9, 0)
ON CONFLICT (slug) DO NOTHING;

-- Update post_count in categories based on existing posts
UPDATE categories c
SET post_count = (
  SELECT COUNT(*)
  FROM posts p
  WHERE p.category_id = c.id
    AND p.status = 'published'
    AND p.deleted_at IS NULL
);

-- ============================================
-- Add popular tags
-- ============================================

INSERT INTO tags (slug, name, description, post_count) VALUES
  ('rust', 'Rust', 'Rust编程语言和生态系统', 0),
  ('nextjs', 'Next.js', 'Next.js框架和开发', 0),
  ('typescript', 'TypeScript', 'TypeScript类型系统和开发', 0),
  ('react', 'React', 'React框架和组件开发', 0),
  ('machine-learning', '机器学习', '机器学习和AI算法', 0),
  ('robotics', '机器人', '机器人系统和控制', 0),
  ('database', '数据库', '数据库设计和优化', 0),
  ('api', 'API', 'API设计和开发', 0)
ON CONFLICT (slug) DO NOTHING;

-- ============================================
-- Update trigger to increment edit_count
-- ============================================

CREATE OR REPLACE FUNCTION increment_edit_count()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.edit_count IS DISTINCT FROM NEW.edit_count OR OLD.edit_count IS NULL THEN
        NEW.edit_count := COALESCE(OLD.edit_count, 0) + 1;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS increment_posts_edit_count ON posts;
CREATE TRIGGER increment_posts_edit_count
    BEFORE UPDATE ON posts
    FOR EACH ROW
    EXECUTE FUNCTION increment_edit_count();

-- ============================================
-- Migration Complete
-- ============================================

-- Summary of changes:
-- ✅ Added 18 new fields to posts table (edit count, featured, SEO, etc.)
-- ✅ Created indexes for performance
-- ✅ Populated categories with 9 default categories
-- ✅ Added popular tags
-- ✅ Created trigger for auto-incrementing edit_count

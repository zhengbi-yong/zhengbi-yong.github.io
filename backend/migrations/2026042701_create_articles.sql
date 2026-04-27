-- Phase B: 重建 articles 表（替代 posts 双轨存储）
-- 按用户 schema: content_json (JSONB) + content_mdx (TEXT) 双轨, article_versions 审计追踪

BEGIN;

-- 1. 创建 articles 表（核心双轨存储）
CREATE TABLE IF NOT EXISTS articles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    summary TEXT,
    cover_image_url TEXT,
    -- ========== 双轨存储 ==========
    content_json JSONB NOT NULL DEFAULT '{}',
    -- 写入侧: TipTap ProseMirror JSON AST — Single Source of Truth
    content_mdx TEXT DEFAULT '',
    -- 读取侧: MDX 文本 — SSR 直读缓存
    mdx_compiled_at TIMESTAMPTZ,
    -- ========== 元数据 ==========
    author_id UUID NOT NULL REFERENCES users(id),
    status VARCHAR(20) NOT NULL DEFAULT 'draft',
    -- 'draft' | 'published' | 'archived'
    tags TEXT[] DEFAULT '{}',
    layout VARCHAR(20) DEFAULT 'standard',
    -- 'standard' | 'magazine' | 'minimal'
    is_featured BOOLEAN DEFAULT false,
    view_count INTEGER DEFAULT 0,
    word_count INTEGER DEFAULT 0,
    -- ========== 时间戳 ==========
    published_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. article_versions 表（审计追踪，替代 post_versions）
CREATE TABLE IF NOT EXISTS article_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    article_id UUID NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
    version_number INTEGER NOT NULL,
    content_json JSONB NOT NULL,
    -- 该版本的完整 JSON 快照
    title VARCHAR(255),
    editor_id UUID NOT NULL REFERENCES users(id),
    change_summary TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (article_id, version_number)
);

-- 3. media_assets 表（替代 media）
CREATE TABLE IF NOT EXISTS media_assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    filename VARCHAR(255) NOT NULL,
    original_name VARCHAR(255) NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    file_size BIGINT NOT NULL,
    storage_path TEXT NOT NULL,
    url TEXT NOT NULL,
    width INTEGER,
    height INTEGER,
    duration FLOAT,
    uploader_id UUID NOT NULL REFERENCES users(id),
    article_id UUID REFERENCES articles(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. 索引
CREATE INDEX IF NOT EXISTS idx_articles_content_json ON articles USING GIN (content_json jsonb_path_ops);
CREATE INDEX IF NOT EXISTS idx_articles_slug ON articles (slug);
CREATE INDEX IF NOT EXISTS idx_articles_status ON articles (status);
CREATE INDEX IF NOT EXISTS idx_articles_author ON articles (author_id);
CREATE INDEX IF NOT EXISTS idx_articles_tags ON articles USING GIN (tags);
CREATE INDEX IF NOT EXISTS idx_articles_published_at ON articles (published_at DESC);
CREATE INDEX IF NOT EXISTS idx_article_versions_article ON article_versions (article_id, version_number DESC);
CREATE INDEX IF NOT EXISTS idx_media_article ON media_assets (article_id);
CREATE INDEX IF NOT EXISTS idx_media_uploader ON media_assets (uploader_id);

-- 5. 回填老数据：从 posts.content_mdx 派生 articles.content_json
--    旧 content 重建为 TipTap JSON 段落结构
INSERT INTO articles (id, title, slug, summary, cover_image_url, content_json, content_mdx, mdx_compiled_at, author_id, status, view_count, word_count, published_at, created_at, updated_at)
SELECT
    p.id,
    p.title,
    p.slug,
    p.summary,
    NULL::TEXT,
    -- 从 content 重建为 TipTap JSON
    CASE
        WHEN p.content IS NOT NULL AND p.content != ''
        THEN jsonb_build_object(
                'type', 'doc',
                'content', jsonb_build_array(
                    jsonb_build_object(
                        'type', 'paragraph',
                        'content', jsonb_build_array(
                            jsonb_build_object('type', 'text', 'text', p.content)
                        )
                    )
                )
            )
        ELSE jsonb_build_object('type', 'doc', 'content', '[]'::JSONB)
    END,
    COALESCE(p.content_mdx, ''),
    NOW(),
    COALESCE(p.author_id, '00000000-0000-0000-0000-000000000000'::UUID),
    p.status::VARCHAR(20),
    p.view_count,
    COALESCE(p.reading_time, 0),
    p.published_at,
    p.created_at,
    p.updated_at
FROM posts p
WHERE p.deleted_at IS NULL
ON CONFLICT (slug) DO NOTHING;

-- 6. 回填 article_versions（从 post_versions 迁移）
INSERT INTO article_versions (id, article_id, version_number, content_json, title, editor_id, change_summary, created_at)
SELECT
    pv.id,
    pv.post_id,
    pv.version_number,
    CASE
        WHEN pv.content IS NOT NULL AND pv.content != ''
        THEN jsonb_build_object(
                'type', 'doc',
                'content', jsonb_build_array(
                    jsonb_build_object(
                        'type', 'paragraph',
                        'content', jsonb_build_array(
                            jsonb_build_object('type', 'text', 'text', pv.content)
                        )
                    )
                )
            )
        ELSE jsonb_build_object('type', 'doc', 'content', '[]'::JSONB)
    END,
    pv.title,
    COALESCE(pv.created_by, '00000000-0000-0000-0000-000000000000'::UUID),
    pv.change_log,
    pv.created_at
FROM post_versions pv
ON CONFLICT (article_id, version_number) DO NOTHING;

-- 7. 回填 media_assets（从 media 迁移）
INSERT INTO media_assets (id, filename, original_name, mime_type, file_size, storage_path, url, width, height, uploader_id, article_id, created_at)
SELECT
    m.id,
    m.filename,
    m.original_filename,
    m.mime_type,
    m.size_bytes,
    m.storage_path,
    m.cdn_url,
    m.width,
    m.height,
    COALESCE(m.uploaded_by, '00000000-0000-0000-0000-000000000000'::UUID),
    NULL::UUID,
    m.created_at
FROM media m
ON CONFLICT DO NOTHING;

COMMIT;

-- 验证
SELECT 'articles' as table_name, COUNT(*) as row_count FROM articles
UNION ALL
SELECT 'article_versions', COUNT(*) FROM article_versions
UNION ALL
SELECT 'media_assets', COUNT(*) FROM media_assets;

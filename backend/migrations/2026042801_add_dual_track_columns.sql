-- P1: 在 posts 表添加双轨存储列（content_json + content_mdx）
-- 遵循设计文档: content_json (JSONB) 为写入侧真相源, content_mdx (TEXT) 为读取侧缓存

BEGIN;

-- 1. 添加 content_json 列（双轨 - 写入侧/真相源）
ALTER TABLE posts ADD COLUMN IF NOT EXISTS content_json JSONB NOT NULL DEFAULT '{}';
COMMENT ON COLUMN posts.content_json IS '写入侧: TipTap ProseMirror JSON AST — Single Source of Truth';

-- 2. 添加 content_mdx 列（双轨 - 读取侧）
ALTER TABLE posts ADD COLUMN IF NOT EXISTS content_mdx TEXT DEFAULT '';
COMMENT ON COLUMN posts.content_mdx IS '读取侧: MDX 文本 — SSR 直读缓存';

-- 3. 添加 mdx_compiled_at 时间戳
ALTER TABLE posts ADD COLUMN IF NOT EXISTS mdx_compiled_at TIMESTAMPTZ;
COMMENT ON COLUMN posts.mdx_compiled_at IS 'MDX 最后编译时间';

-- 4. JSONB GIN 索引: 支持对 JSON 内部节点的高速检索
CREATE INDEX IF NOT EXISTS idx_posts_content_json ON posts USING GIN (content_json jsonb_path_ops);

-- 5. 回填: 将现有 content 文本转换为 TipTap JSON 段落结构
UPDATE posts
SET content_json = CASE
    WHEN content IS NOT NULL AND content != ''
    THEN jsonb_build_object(
        'type', 'doc',
        'content', jsonb_build_array(
            jsonb_build_object(
                'type', 'paragraph',
                'content', jsonb_build_array(
                    jsonb_build_object('type', 'text', 'text', content)
                )
            )
        )
    )
    ELSE '{"type":"doc","content":[]}'::JSONB
    END,
    content_mdx = COALESCE(content, ''),
    mdx_compiled_at = NOW()
WHERE content_json = '{}'::JSONB;

COMMIT;

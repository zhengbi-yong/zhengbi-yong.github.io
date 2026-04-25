-- Phase 3: CQRS 双轨存储
-- 新增 content_json (JSONB) — Tiptap JSON AST, Source of Truth
-- 新增 content_mdx (TEXT) — 预编译 MDX, SSR 直读缓存

BEGIN;

-- 1. content_json: JSONB, Source of Truth for Tiptap AST
ALTER TABLE posts
  ADD COLUMN content_json JSONB;
COMMENT ON COLUMN posts.content_json IS 'Tiptap JSON AST — 协作编辑 Source of Truth';

-- 2. content_mdx: TEXT, 预编译 MDX 文本, SSR 直读缓存
ALTER TABLE posts
  ADD COLUMN content_mdx TEXT;
COMMENT ON COLUMN posts.content_mdx IS '预编译 MDX 文本 — SSR 直读缓存';

-- 3. GIN 索引加速 JSONB 查询
CREATE INDEX idx_posts_content_json ON posts USING GIN (content_json);

-- 4. content_json 大小约束（100MB，防止 OOM）
ALTER TABLE posts
  ADD CONSTRAINT posts_content_json_size_check
  CHECK (content_json IS NULL OR pg_column_size(content_json) < 104857600);

-- 5. content_mdx 大小约束（10MB）
ALTER TABLE posts
  ADD CONSTRAINT posts_content_mdx_size_check
  CHECK (content_mdx IS NULL OR char_length(content_mdx) < 10485760);

-- 6. 允许 NULL（旧数据降级兼容）
ALTER TABLE posts
  ALTER COLUMN content_json DROP NOT NULL;
ALTER TABLE posts
  ALTER COLUMN content_mdx DROP NOT NULL;

COMMIT;

-- 7. 回填旧数据：content_mdx = content（一次性迁移）
--    content_json 保持 NULL（旧数据等前端重新保存时自然填充）
UPDATE posts
SET
  content_mdx = content,
  updated_at = NOW()
WHERE
  content_mdx IS NULL
  AND content IS NOT NULL
  AND deleted_at IS NULL;

-- 8. 索引备注
COMMENT ON INDEX idx_posts_content_json IS 'GIN index for content_json queries — CRDT/协作编辑场景';

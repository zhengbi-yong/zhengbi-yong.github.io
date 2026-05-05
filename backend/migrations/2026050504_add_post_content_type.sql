-- ============================================
-- Platform Transformation Phase 1: Add Content Type & Backfill Author
-- ============================================

BEGIN;

-- 1. Add content_type column for differentiating article vs paper vs project
ALTER TABLE posts ADD COLUMN IF NOT EXISTS content_type TEXT NOT NULL DEFAULT 'article';
COMMENT ON COLUMN posts.content_type IS '内容类型: article(文章) / paper(论文) / project(研究项目)';

-- 2. Add CHECK constraint for valid content types
ALTER TABLE posts DROP CONSTRAINT IF EXISTS posts_content_type_check;
ALTER TABLE posts ADD CONSTRAINT posts_content_type_check
    CHECK (content_type IN ('article', 'paper', 'project'));

-- 3. Add index for content_type filtering
CREATE INDEX IF NOT EXISTS idx_posts_content_type
    ON posts (content_type, published_at DESC) WHERE deleted_at IS NULL;

COMMIT;

-- ============================================
-- 4. Backfill: Assign existing posts to admin user
--    Find the first admin user and set author_id on all posts without one
-- ============================================
DO $$
DECLARE
    admin_id UUID;
BEGIN
    -- Find the admin user (role='admin', first created)
    SELECT id INTO admin_id
    FROM users
    WHERE deleted_at IS NULL
      AND (profile->>'role' = 'admin' OR profile->>'role' = 'superadmin')
    ORDER BY created_at ASC
    LIMIT 1;

    -- Fallback: if no admin by role, take the first user
    IF admin_id IS NULL THEN
        SELECT id INTO admin_id
        FROM users
        WHERE deleted_at IS NULL
        ORDER BY created_at ASC
        LIMIT 1;
    END IF;

    -- Backfill posts without author
    IF admin_id IS NOT NULL THEN
        UPDATE posts
        SET author_id = admin_id,
            updated_at = NOW()
        WHERE deleted_at IS NULL
          AND author_id IS NULL;

        RAISE NOTICE 'Backfilled % posts with author_id %',
            (SELECT COUNT(*) FROM posts WHERE author_id = admin_id),
            admin_id;
    ELSE
        RAISE NOTICE 'No admin user found. Skipping author backfill.';
    END IF;
END $$;

-- 5. Backfill articles table too (if exists)
DO $$
DECLARE
    admin_id UUID;
BEGIN
    SELECT id INTO admin_id
    FROM users
    WHERE deleted_at IS NULL
    ORDER BY created_at ASC
    LIMIT 1;

    IF admin_id IS NOT NULL AND EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'articles'
    ) THEN
        UPDATE articles
        SET author_id = admin_id
        WHERE author_id = '00000000-0000-0000-0000-000000000000'::UUID;

        RAISE NOTICE 'Backfilled articles with admin author %', admin_id;
    END IF;
END $$;

-- 验证
SELECT
    'posts' as table_name,
    COUNT(*) as total,
    COUNT(*) FILTER (WHERE author_id IS NOT NULL) as with_author,
    COUNT(*) FILTER (WHERE author_id IS NULL) as without_author,
    COUNT(*) FILTER (WHERE content_type = 'article') as articles,
    COUNT(*) FILTER (WHERE content_type = 'paper') as papers,
    COUNT(*) FILTER (WHERE content_type = 'project') as projects
FROM posts
WHERE deleted_at IS NULL;

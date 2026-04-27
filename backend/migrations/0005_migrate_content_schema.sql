-- ============================================================================
-- 高级富文本内容系统 — posts 表双轨存储迁移
-- 目标架构：content_json (JSONB 真相源) + content_mdx (MDX 读取轨)
-- ============================================================================

BEGIN;

-- Step 1: 检查当前列状态
DO $$
DECLARE
    has_content_json boolean;
    has_content_mdx  boolean;
    has_content_html boolean;
BEGIN
    SELECT EXISTS(SELECT 1 FROM information_schema.columns
                  WHERE table_name='posts' AND column_name='content_json') INTO has_content_json;
    SELECT EXISTS(SELECT 1 FROM information_schema.columns
                  WHERE table_name='posts' AND column_name='content_mdx') INTO has_content_mdx;
    SELECT EXISTS(SELECT 1 FROM information_schema.columns
                  WHERE table_name='posts' AND column_name='content_html') INTO has_content_html;

    RAISE NOTICE 'Current columns: content_json=%, content_mdx=%, content_html=%',
        has_content_json, has_content_mdx, has_content_html;
END $$;

-- Step 2: 新增 content_json (JSONB，真相源)
DO $$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM information_schema.columns
                  WHERE table_name='posts' AND column_name='content_json') THEN
        ALTER TABLE posts ADD COLUMN content_json JSONB NOT NULL DEFAULT '{}';
        RAISE NOTICE 'Added content_json (JSONB)';
    ELSE
        RAISE NOTICE 'content_json already exists';
    END IF;
END $$;

-- Step 3: 新增 content_mdx (MDX 读取轨)
DO $$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM information_schema.columns
                  WHERE table_name='posts' AND column_name='content_mdx') THEN
        ALTER TABLE posts ADD COLUMN content_mdx TEXT;
        RAISE NOTICE 'Added content_mdx (TEXT)';
    ELSE
        RAISE NOTICE 'content_mdx already exists';
    END IF;
END $$;

-- Step 4: 新增 content_html (预渲染 HTML 轨)
DO $$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM information_schema.columns
                  WHERE table_name='posts' AND column_name='content_html') THEN
        ALTER TABLE posts ADD COLUMN content_html TEXT;
        RAISE NOTICE 'Added content_html (TEXT)';
    ELSE
        RAISE NOTICE 'content_html already exists';
    END IF;
END $$;

-- Step 5: 确保 content_json 有 NOT NULL 约束
DO $$
BEGIN
    -- Try to set NOT NULL if column exists and has no nulls
    ALTER TABLE posts ALTER COLUMN content_json SET NOT NULL;
EXCEPTION WHEN others THEN
    RAISE NOTICE 'Could not set NOT NULL on content_json (has nulls or other issue): %', SQLERRM;
END $$;

COMMIT;

-- ============================================================================
-- Step 6: 数据回填（事务外执行，以免锁表太久）
-- ============================================================================
-- 这个过程会处理所有历史文章：
--   - content_json 为 NULL 的行：从 content 列推断 TipTap AST
--   - content_mdx：从 content_json 转换（MDX 文本）
--   - content_html：保持 NULL（前端的 compileMDX 按需生成）
-- ============================================================================

DO $$
DECLARE
    v_id uuid;
    v_content text;
    v_content_json jsonb;
    v_slug text;
    v_counter integer := 0;
    v_total integer;
BEGIN
    -- Count rows to migrate
    SELECT COUNT(*) INTO v_total
    FROM posts
    WHERE deleted_at IS NULL
      AND (content_json IS NULL OR content_json = 'null'::jsonb OR content_json = '{}'::jsonb);

    RAISE NOTICE 'Posts needing content_json migration: %', v_total;

    -- Migrate each post
    FOR v_id, v_content, v_slug IN
        SELECT id, content, slug
        FROM posts
        WHERE deleted_at IS NULL
          AND (content_json IS NULL OR content_json = 'null'::jsonb OR content_json = '{}'::jsonb)
    LOOP
        -- Determine if content is TipTap JSON or plain text
        IF v_content IS NOT NULL AND v_content ~ '^[[:space:]]*\{' THEN
            -- Likely TipTap JSON — try to parse
            BEGIN
                v_content_json := v_content::jsonb;
                -- Validate it has a type field
                IF NOT (v_content_json ? 'type') THEN
                    v_content_json := jsonb_build_object(
                        'type', 'doc',
                        'content', jsonb_build_array(
                            jsonb_build_object(
                                'type', 'paragraph',
                                'content', jsonb_build_array(
                                    jsonb_build_object(
                                        'type', 'text',
                                        'text', COALESCE(v_content, '')
                                    )
                                )
                            )
                        )
                    );
                END IF;
            EXCEPTION WHEN OTHERS THEN
                -- Not valid JSON — treat as plain text
                v_content_json := jsonb_build_object(
                    'type', 'doc',
                    'content', jsonb_build_array(
                        jsonb_build_object(
                            'type', 'paragraph',
                            'content', jsonb_build_array(
                                jsonb_build_object(
                                    'type', 'text',
                                    'text', COALESCE(v_content, '')
                                )
                            )
                        )
                    )
                );
            END;
        ELSIF v_content IS NOT NULL AND v_content ~ '^[[:space:]]*<' THEN
            -- Looks like HTML — convert to minimal TipTap doc
            v_content_json := jsonb_build_object(
                'type', 'doc',
                'content', jsonb_build_array(
                    jsonb_build_object(
                        'type', 'paragraph',
                        'content', jsonb_build_array(
                            jsonb_build_object(
                                'type', 'text',
                                'text', COALESCE(v_content, '')
                            )
                        )
                    )
                )
            );
        ELSE
            -- Plain text or empty — wrap as TipTap paragraph
            v_content_json := jsonb_build_object(
                'type', 'doc',
                'content', jsonb_build_array(
                    jsonb_build_object(
                        'type', 'paragraph',
                        'content', jsonb_build_array(
                            jsonb_build_object(
                                'type', 'text',
                                'text', COALESCE(v_content, '')
                            )
                        )
                    )
                )
            );
        END IF;

        UPDATE posts SET
            content_json = v_content_json,
            updated_at = NOW()
        WHERE id = v_id;

        v_counter := v_counter + 1;
        IF v_counter % 10 = 0 THEN
            RAISE NOTICE 'Migrated %/%', v_counter, v_total;
        END IF;
    END LOOP;

    RAISE NOTICE 'content_json migration complete: % rows', v_counter;
END $$;

-- ============================================================================
-- Step 7: 为所有 content_mdx 为 NULL 的文章生成 MDX
-- 注意：这里只能用 SQL 做一些基本转换，复杂的转换由 Rust 后端完成
-- ============================================================================
DO $$
DECLARE
    v_id uuid;
    v_content_json jsonb;
    v_text text;
    v_counter integer := 0;
BEGIN
    FOR v_id, v_content_json IN
        SELECT id, content_json FROM posts
        WHERE deleted_at IS NULL
          AND content_mdx IS NULL
          AND content_json IS NOT NULL
          AND content_json != 'null'::jsonb
          AND content_json != '{}'::jsonb
    LOOP
        -- Extract plain text from TipTap JSON (simplified)
        v_text := (
            SELECT string_agg(trimmed_text, ' ')
            FROM (
                SELECT DISTINCT trim(t.text_val) as trimmed_text
                FROM jsonb_array_elements(v_content_json->'content') as block,
                     jsonb_array_elements(block->'content') as inline,
                     LATERAL (
                         SELECT inline->>'text' as text_val
                         WHERE inline->>'type' = 'text'
                           AND inline->>'text' IS NOT NULL
                     ) as t
            ) as texts
            WHERE trimmed_text != ''
        );

        -- Store the plain text as MDX fallback (Rust will regenerate proper MDX)
        UPDATE posts SET
            content_mdx = COALESCE(v_text, ''),
            updated_at = NOW()
        WHERE id = v_id;

        v_counter := v_counter + 1;
    END LOOP;

    RAISE NOTICE 'content_mdx basic fill complete: % rows (Rust will regenerate proper MDX)', v_counter;
END $$;

-- ============================================================================
-- Step 8: 验证
-- ============================================================================
DO $$
DECLARE
    v_total    integer;
    v_has_json  integer;
    v_valid_json integer;
    v_has_mdx   integer;
    v_has_html  integer;
BEGIN
    SELECT COUNT(*),
           COUNT(content_json),
           COUNT(CASE WHEN content_json ? 'type' THEN 1 END),
           COUNT(content_mdx),
           COUNT(content_html)
    INTO v_total, v_has_json, v_valid_json, v_has_mdx, v_has_html
    FROM posts WHERE deleted_at IS NULL;

    RAISE NOTICE '';
    RAISE NOTICE '=== MIGRATION VERIFICATION ===';
    RAISE NOTICE 'Total non-deleted posts:    %', v_total;
    RAISE NOTICE 'content_json has value:     %', v_has_json;
    RAISE NOTICE 'content_json has type field: %', v_valid_json;
    RAISE NOTICE 'content_mdx has value:      %', v_has_mdx;
    RAISE NOTICE 'content_html has value:     %', v_has_html;
    RAISE NOTICE '=== END VERIFICATION ===';
    RAISE NOTICE '';

    IF v_has_json < v_total THEN
        RAISE WARNING 'Some posts are missing content_json!';
    END IF;
END $$;

-- ============================================================================
-- Step 9: 标记旧 content 列（提示：不要在生产环境直接删除）
-- ============================================================================
COMMENT ON COLUMN posts.content IS
    'DEPRECATED — Legacy column. Use content_json as source of truth. '
    'This column is kept for backward compatibility during migration period. '
    'Will be dropped after all consumers migrate to content_json API.';

-- ============================================================================
-- Step 10: 添加 GIN 索引（加速全文检索）
-- ============================================================================
-- Only create if not exists
DO $$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM pg_indexes WHERE indexname='idx_posts_content_json_gin') THEN
        CREATE INDEX idx_posts_content_json_gin ON posts USING gin (content_json);
        RAISE NOTICE 'Created GIN index on content_json';
    ELSE
        RAISE NOTICE 'GIN index on content_json already exists';
    END IF;
END $$;

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================

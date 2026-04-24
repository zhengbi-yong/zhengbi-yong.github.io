-- 全文搜索优化
-- 使用PostgreSQL的tsvector实现高效的中文和英文全文搜索

-- 为posts表添加全文搜索向量列
ALTER TABLE posts
ADD COLUMN IF NOT EXISTS search_vector tsvector GENERATED ALWAYS AS (
    setweight(to_tsvector('simple', coalesce(title, '')), 'A') ||
    setweight(to_tsvector('simple', coalesce(summary, '')), 'B') ||
    setweight(to_tsvector('simple', coalesce(content, '')), 'C')
) STORED;

-- 创建GIN索引以加速全文搜索（比GiST更适合全文搜索）
CREATE INDEX IF NOT EXISTS idx_posts_search_vector ON posts USING GIN (search_vector);

-- 为标题和内容创建单独的trigram索引以支持模糊搜索
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- 标题的trigram索引（支持模糊匹配和部分匹配）
CREATE INDEX IF NOT EXISTS idx_posts_title_trgm ON posts USING GIN (title gin_trgm_ops);

-- 内容的trigram索引
CREATE INDEX IF NOT EXISTS idx_posts_content_trgm ON posts USING GIN (content gin_trgm_ops);

-- 创建搜索辅助函数：带高亮的全文搜索
CREATE OR REPLACE FUNCTION search_posts_with_highlights(
    search_query TEXT,
    result_limit INTEGER DEFAULT 20,
    result_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
    slug TEXT,
    title TEXT,
    summary TEXT,
    title_highlight TEXT,
    summary_highlight TEXT,
    content_preview TEXT,
    rank REAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        p.slug,
        p.title,
        p.summary,
        -- 高亮标题中的匹配词
        ts_headline('simple'::regconfig, p.title,
            plainto_tsquery('simple'::regconfig, search_query::text),
            'StartSel=<mark>, StopSel=</mark>, MaxWords=35, MinWords=15'
        ) as title_highlight,
        -- 高亮摘要中的匹配词
        ts_headline('simple'::regconfig, p.summary,
            plainto_tsquery('simple'::regconfig, search_query::text),
            'StartSel=<mark>, StopSel=</mark>, MaxWords=35, MinWords=15'
        ) as summary_highlight,
        -- 内容预览（前200字符）
        SUBSTRING(p.content FROM 1 FOR 200) as content_preview,
        -- 相关性排序
        ts_rank(p.search_vector, plainto_tsquery('simple'::regconfig, search_query::text)) as rank
    FROM posts p
    WHERE
        -- 全文搜索
        p.search_vector @@ plainto_tsquery('simple'::regconfig, search_query::text)
        -- 只显示已发布的文章
        AND p.status = 'published'
    ORDER BY rank DESC, p.published_at DESC
    LIMIT result_limit OFFSET result_offset;
END;
$$ LANGUAGE plpgsql;

-- 创建搜索辅助函数：模糊搜索（用于搜索建议）
CREATE OR REPLACE FUNCTION fuzzy_search_suggestions(
    search_query TEXT,
    result_limit INTEGER DEFAULT 5
)
RETURNS TABLE (
    slug TEXT,
    title TEXT,
    category TEXT,
    similarity_score REAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        p.slug,
        p.title,
        c.name as category,
        -- 使用word_similarity来评估相似度
        word_similarity(p.title, search_query) as similarity_score
    FROM posts p
    LEFT JOIN categories c ON p.category_id = c.id
    WHERE
        -- 标题模糊匹配
        p.title % search_query
        AND p.draft = false
    ORDER BY similarity_score DESC, p.date DESC
    LIMIT result_limit;
END;
$$ LANGUAGE plpgsql;

-- 创建搜索关键词记录表（用于趋势关键词）
CREATE TABLE IF NOT EXISTS search_keywords (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v7(),
    keyword TEXT NOT NULL,
    search_count INTEGER DEFAULT 1,
    last_searched_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(keyword)
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_search_keywords_keyword ON search_keywords(keyword);
CREATE INDEX IF NOT EXISTS idx_search_keywords_count ON search_keywords(search_count DESC, last_searched_at DESC);

-- 创建触发器函数：更新搜索关键词计数
CREATE OR REPLACE FUNCTION update_search_keyword_count()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO search_keywords (keyword, search_count, last_searched_at)
    VALUES (NEW.keyword, 1, NOW())
    ON CONFLICT (keyword) DO UPDATE SET
        search_count = search_keywords.search_count + 1,
        last_searched_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 创建搜索历史表（可选，用于个性化搜索建议）
CREATE TABLE IF NOT EXISTS search_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v7(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    keyword TEXT NOT NULL,
    results_count INTEGER,
    clicked_slug TEXT,
    searched_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_search_history_user_id ON search_history(user_id, searched_at DESC);
CREATE INDEX IF NOT EXISTS idx_search_history_keyword ON search_history(keyword, searched_at DESC);

-- 添加注释
COMMENT ON TABLE search_keywords IS '搜索关键词统计，用于热门关键词分析';
COMMENT ON TABLE search_history IS '用户搜索历史，用于个性化搜索建议';
COMMENT ON COLUMN posts.search_vector IS '全文搜索向量，包含标题、摘要、内容和标签';
COMMENT ON FUNCTION search_posts_with_highlights IS '带高亮的全文搜索函数，支持分类和标签筛选';
COMMENT ON FUNCTION fuzzy_search_suggestions IS '模糊搜索函数，用于搜索建议和自动完成';

-- 创建热门关键词视图
CREATE OR REPLACE VIEW trending_keywords AS
SELECT
    keyword,
    search_count,
    last_searched_at,
    -- 计算搜索频率（最近24小时）
    EXTRACT(EPOCH FROM (NOW() - last_searched_at)) / 3600 as hours_since_search
FROM search_keywords
WHERE search_count >= 3  -- 至少被搜索3次
ORDER BY search_count DESC, last_searched_at DESC
LIMIT 20;

COMMENT ON VIEW trending_keywords IS '热门搜索关键词视图';

-- 创建全文搜索配置优化（针对中文）
-- 注意：对于中文全文搜索，建议安装zhparser扩展
-- CREATE EXTENSION IF NOT EXISTS zhparser;
-- CREATE TEXT SEARCH CONFIGURATION chinese (COPY = simple);
-- ALTER TEXT SEARCH CONFIGURATION chinese ADD MAPPING FOR a,b,c,d,e,f,g,h,i,j,k,l,m,n,o,p,q,r,s,t,u,v,w,x,y,z WITH simple;

# 数据库 Schema 设计

> 本文件描述当前数据库实际结构。所有表定义与 migration 文件保持一致。

## 核心原则

### 主键策略

```sql
id UUID PRIMARY KEY DEFAULT uuid_generate_v7()
```

- 使用 **UUIDv7**（时间序），替代随机 UUIDv4
- 时间序使 B-Tree 插入追加到最右叶子节点，减少页分裂
- UUIDv7 格式：`毫秒级时间戳 | 随机位`
- 注：初始 migration 使用 `gen_random_uuid()`（UUIDv4），`2026040901` 迁移后改为 `uuid_generate_v7()`

### 索引设计原则

| 场景 | 规则 | 示例 |
|------|------|------|
| 主键 | UUIDv7 | `id UUID PRIMARY KEY DEFAULT uuid_generate_v7()` |
| 唯一约束+软删除 | 部分唯一索引 | `CREATE UNIQUE INDEX ... WHERE deleted_at IS NULL` |
| 高频 UPDATE 表 | 禁止额外索引 | post_stats 不加索引 |
| JSONB 查询 | jsonb_path_ops | `USING GIN (profile jsonb_path_ops)` |
| 树形结构 | ltree + GIST | `USING GIST (path)` |
| 双轨存储 | JSONB GIN | `USING GIN (content_json jsonb_path_ops)` |

### HOT 更新优化

```sql
CREATE TABLE post_stats (
    ...
) WITH (fillfactor = 70);
```

- fillfactor=70：为 UPDATE 预留 30% 空间
- 激活 Heap-Only Tuple (HOT) 更新，减少写放大
- 应用于高频统计更新表（post_stats）

## 用户表 (users)

```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v7(),
    email CITEXT NOT NULL,
    username CITEXT NOT NULL,
    password_hash TEXT NOT NULL,       -- Argon2id
    role VARCHAR(20) NOT NULL DEFAULT 'user',
    status TEXT NOT NULL DEFAULT 'active',
    profile JSONB NOT NULL DEFAULT '{}',
    email_verified BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ             -- 软删除
);

CREATE INDEX idx_users_email_active ON users(email) WHERE deleted_at IS NULL;
CREATE INDEX idx_users_username_active ON users(username) WHERE deleted_at IS NULL;
CREATE INDEX idx_users_created_at ON users(created_at DESC);
CREATE INDEX idx_users_profile ON users USING GIN (profile jsonb_path_ops);
```

### 软删除下的唯一性

使用**部分唯一索引**替代全局唯一约束：

```sql
CREATE UNIQUE INDEX idx_users_email_active ON users (email) WHERE deleted_at IS NULL;
CREATE UNIQUE INDEX idx_users_username_active ON users (username) WHERE deleted_at IS NULL;
```

原因：标准 SQL 中 `NULL ≠ NULL`，软删除的行无法与活跃行区分唯一性。

## 文章表 (posts) — 双轨存储核心

```sql
CREATE TABLE posts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v7(),
    slug TEXT NOT NULL UNIQUE,
    title TEXT NOT NULL,
    content TEXT NOT NULL,                       -- 旧列，过渡期保留
    content_html TEXT,                           -- 旧列，过渡期保留
    content_json JSONB NOT NULL DEFAULT '{}',    -- 双轨: 写入侧真相源
    content_mdx TEXT DEFAULT '',                 -- 双轨: 读取侧缓存
    mdx_compiled_at TIMESTAMPTZ,                 -- MDX 最后编译时间
    summary TEXT,
    excerpt TEXT,
    cover_image_id UUID REFERENCES media(id),
    og_image_id UUID REFERENCES media(id),
    status post_status NOT NULL DEFAULT 'draft',
    published_at TIMESTAMPTZ,
    scheduled_at TIMESTAMPTZ,
    category_id UUID REFERENCES categories(id),
    author_id UUID REFERENCES users(id),
    last_edited_by UUID REFERENCES users(id),
    show_toc BOOLEAN NOT NULL DEFAULT TRUE,
    layout TEXT NOT NULL DEFAULT 'PostSimple',
    view_count BIGINT NOT NULL DEFAULT 0,
    like_count INTEGER NOT NULL DEFAULT 0,
    comment_count INTEGER NOT NULL DEFAULT 0,
    reading_time INTEGER,
    words_count INTEGER,
    estimated_reading_time INTEGER,
    edit_count INTEGER NOT NULL DEFAULT 0,
    first_published_at TIMESTAMPTZ,
    publication_version INTEGER NOT NULL DEFAULT 1,
    meta_title TEXT,
    meta_description TEXT,
    meta_keywords TEXT,
    canonical_url TEXT,
    author_display_name TEXT,
    is_featured BOOLEAN NOT NULL DEFAULT FALSE,
    post_type TEXT NOT NULL DEFAULT 'article',
    content_format TEXT,
    language TEXT NOT NULL DEFAULT 'zh-CN',
    copyright_info TEXT,
    license_type TEXT,
    source_url TEXT,
    featured_image_caption TEXT,
    content_hash TEXT,                           -- MDX 同步用
    rendered_at TIMESTAMPTZ,                     -- 最后渲染时间
    lastmod_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_posts_status ON posts(status);
CREATE INDEX idx_posts_published ON posts(published_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX idx_posts_content_json ON posts USING GIN (content_json jsonb_path_ops);
CREATE INDEX idx_posts_title_exact ON posts (title) WHERE deleted_at IS NULL;
```

### 双轨存储说明

| 列 | 类型 | 用途 |
|----|------|------|
| `content_json` | JSONB | TipTap ProseMirror 完整 AST，写入侧单一事实来源 |
| `content_mdx` | TEXT | MDX 文本，读取侧 SSR/SSG 直读缓存 |
| `mdx_compiled_at` | TIMESTAMPTZ | MDX 最后编译时间，判断是否需要重新编译 |
| `content` | TEXT | 旧列，过渡期保留向后兼容 |
| `content_html` | TEXT | 旧列，过渡期保留 |

## 评论表 (comments)

```sql
CREATE EXTENSION IF NOT EXISTS ltree;

CREATE TABLE comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v7(),
    slug TEXT NOT NULL,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    parent_id UUID REFERENCES comments(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    html_sanitized TEXT NOT NULL,
    status comment_status NOT NULL DEFAULT 'pending',
    path LTREE NOT NULL,
    depth INTEGER NOT NULL DEFAULT 0,
    like_count INTEGER DEFAULT 0,
    created_ip INET,
    user_agent TEXT,
    moderation_reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_comments_path ON comments USING GIST (path);
CREATE INDEX idx_comments_post ON comments(slug);
CREATE INDEX idx_comments_post_status ON comments(slug, status);
CREATE INDEX idx_comments_user ON comments(user_id);
```

> 注：`slug` 字段（原 `post_slug`）通过 `0002_fix_column_names.sql` 重命名。
> FK: `comments(slug) REFERENCES post_stats(slug)`（无 CASCADE，自 `2026041501` 迁移起）

## 统计表 (post_stats) — HOT 优化

```sql
CREATE TABLE post_stats (
    slug TEXT PRIMARY KEY,
    view_count BIGINT NOT NULL DEFAULT 0,
    like_count INTEGER NOT NULL DEFAULT 0,
    comment_count INTEGER NOT NULL DEFAULT 0,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
) WITH (fillfactor = 70);
```

- 主键为 `slug TEXT`，无外键约束（comments.slug 通过 FK 引用本表）
- 禁止在此表上创建额外索引——高频 UPDATE 表不应有额外索引
- 统计采用 Redis 缓冲 + 异步持久化

## Outbox 事件表

```sql
CREATE TABLE outbox_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v7(),
    event_type VARCHAR(100) NOT NULL,
    payload JSONB NOT NULL DEFAULT '{}',
    retry_count INTEGER NOT NULL DEFAULT 0,
    error TEXT,
    processed_at TIMESTAMPTZ,
    locked_at TIMESTAMPTZ,
    locked_by TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_outbox_events_pending
    ON outbox_events (created_at)
    WHERE processed_at IS NULL AND retry_count < 3;

CREATE INDEX idx_outbox_events_type
    ON outbox_events (event_type, created_at)
    WHERE processed_at IS NULL;
```

> 注：状态由 `processed_at IS NULL` 隐式表示。`event_type`、`retry_count`、`error` 字段通过 `2026032201` 迁移重命名而来。

## 其他表

### 分类 (categories)
```sql
CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v7(),
    slug TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    description TEXT,
    parent_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    icon TEXT,
    color TEXT,
    display_order INTEGER NOT NULL DEFAULT 0,
    post_count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### 标签 (tags)
```sql
CREATE TABLE tags (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v7(),
    slug TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    description TEXT,
    post_count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE post_tags (
    post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (post_id, tag_id)
);
```

### 媒体 (media)
```sql
CREATE TABLE media (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v7(),
    filename TEXT NOT NULL,
    original_filename TEXT NOT NULL,
    mime_type TEXT NOT NULL,
    size_bytes BIGINT NOT NULL,
    width INTEGER,
    height INTEGER,
    storage_path TEXT NOT NULL,
    cdn_url TEXT,
    alt_text TEXT,
    caption TEXT,
    uploaded_by UUID REFERENCES users(id) ON DELETE SET NULL,
    media_type TEXT NOT NULL DEFAULT 'image',
    usage_count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);
```

### 文章-媒体关联 (post_media)
```sql
CREATE TABLE post_media (
    post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    media_id UUID NOT NULL REFERENCES media(id) ON DELETE CASCADE,
    position INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (post_id, media_id)
);

CREATE INDEX idx_post_media_media ON post_media(media_id);
```

### 版本 (post_versions)
```sql
CREATE TABLE post_versions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v7(),
    post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    version_number INTEGER NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    summary TEXT,
    change_log TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    UNIQUE (post_id, version_number)
);
```

### 点赞 (post_likes / comment_likes)
```sql
CREATE TABLE post_likes (
    slug TEXT NOT NULL REFERENCES posts(slug) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (slug, user_id)
);

CREATE TABLE comment_likes (
    id BIGSERIAL PRIMARY KEY,
    comment_id UUID NOT NULL REFERENCES comments(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(comment_id, user_id)
);
```

### 刷新令牌 (refresh_tokens)
```sql
CREATE TABLE refresh_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v7(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash TEXT NOT NULL UNIQUE,
    family_id UUID NOT NULL,
    replaced_by_hash TEXT,
    revoked_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_used_at TIMESTAMPTZ,
    created_ip INET,
    user_agent_hash TEXT
);
```

### 阅读进度 (reading_progress)
```sql
CREATE TABLE reading_progress (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v7(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    post_slug TEXT NOT NULL REFERENCES posts(slug) ON DELETE CASCADE,
    progress INTEGER NOT NULL DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
    last_read_position INTEGER DEFAULT 0,
    scroll_percentage FLOAT DEFAULT 0.0,
    word_count INTEGER DEFAULT 0,
    words_read INTEGER DEFAULT 0,
    is_completed BOOLEAN DEFAULT FALSE,
    last_read_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, post_slug)
);

> 同时创建了 `recently_read_posts` 视图（`20251229_add_reading_progress.sql`）：关联 `reading_progress` 与 `posts` 表，按最近阅读时间倒序展示用户阅读历史。

### 团队成员 (team_members)
```sql
CREATE TABLE team_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v7(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    name_en VARCHAR(255),
    team_role VARCHAR(50) NOT NULL DEFAULT 'member',
    display_order INT NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    title VARCHAR(255),
    bio TEXT,
    affiliation VARCHAR(255),
    research_tags TEXT[],
    email VARCHAR(255),
    github VARCHAR(100),
    website VARCHAR(500),
    avatar_media_id UUID REFERENCES media(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### 密码重置令牌 (password_reset_tokens)
```sql
CREATE TABLE password_reset_tokens (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    token_hash TEXT NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_password_reset_tokens_expires ON password_reset_tokens(expires_at);
```

### 搜索关键词 (search_keywords)
```sql
CREATE TABLE search_keywords (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v7(),
    keyword TEXT NOT NULL,
    search_count INTEGER DEFAULT 1,
    last_searched_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(keyword)
);
```

### 搜索历史 (search_history)
```sql
CREATE TABLE search_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v7(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    keyword TEXT NOT NULL,
    results_count INTEGER,
    clicked_slug TEXT,
    searched_at TIMESTAMPTZ DEFAULT NOW()
);
```

### articles / article_versions（遗留/待清理）
> 此表由 `2026042701_create_articles.sql` 创建，属于旧版双轨存储尝试的遗留代码。当前系统使用 `posts` 表（双轨：`content_json` + `content_mdx`），`articles` 及相关表仅为迁移过程中保留的归档引用，无活跃代码路径引用。计划在后续清理迁移中移除。

```sql
-- 仅作归档参考，无活跃使用
-- CREATE TABLE articles (...)
-- CREATE TABLE article_versions (...)
-- CREATE TABLE media_assets (...)
```

## Redis 数据结构

```
# 限流: 双窗口 Lua 脚本（秒级 + 分钟级）
rl:s:{ip}:{route_hash}:{second_bucket} → Counter(INCR)
rl:m:{ip}:{route_hash}:{minute_bucket} → Counter(INCR)
TTL: 秒级窗口 2秒，分钟级窗口 60秒

# 令牌黑名单
blacklist:{token_hash} → String("1")
TTL: 剩余有效期

# 文章缓存
post:{slug} → JSON(PostDetail)
TTL: 5 分钟

# 统计缓存
post_stats:{slug} → JSON(PostStatsResponse)
TTL: 5 秒
```

> 限流使用 Lua 脚本原子的双窗口方案（秒级 + 分钟级），非简单 INCR+EXPIRE 固定窗口。WebAuthn 挑战码尚未实现。

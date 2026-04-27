# 数据库 Schema 设计

> 来源：ultradesign.md (5章)、ultradesign_appendix.md (4.2节)

## 核心原则

### 主键策略

```sql
id UUID PRIMARY KEY DEFAULT uuid_generate_v7()
```

- 使用 **UUIDv7**（时间序），替代随机 UUIDv4
- 时间序使 B-Tree 插入追加到最右叶子节点，减少页分裂
- UUIDv7 格式：`毫秒级时间戳 | 随机位`

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
    email CITEXT UNIQUE NOT NULL,
    username CITEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,       -- Argon2id
    role VARCHAR(20) NOT NULL DEFAULT 'user',
    profile JSONB NOT NULL DEFAULT '{}',
    email_verified BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ             -- 软删除
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_created_at ON users(created_at DESC);
CREATE INDEX idx_users_profile ON users USING GIN (profile jsonb_path_ops);
```

### 软删除下的唯一性

使用**部分唯一索引**替代全局唯一约束：

```sql
CREATE UNIQUE INDEX idx_users_email ON users (email) WHERE deleted_at IS NULL;
CREATE UNIQUE INDEX idx_users_username ON users (username) WHERE deleted_at IS NULL;
```

原因：标准 SQL 中 `NULL ≠ NULL`，软删除的行无法与活跃行区分唯一性。

## 文章表 (posts) — 双轨存储核心

```sql
CREATE TABLE posts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v7(),
    slug TEXT NOT NULL UNIQUE,
    title TEXT NOT NULL,
    content TEXT NOT NULL,             -- 旧列，过渡期保留
    content_html TEXT,                  -- 旧列，过渡期保留
    content_json JSONB NOT NULL DEFAULT '{}',  -- 双轨: 写入侧真相源
    content_mdx TEXT DEFAULT '',               -- 双轨: 读取侧缓存
    mdx_compiled_at TIMESTAMPTZ,               -- MDX 最后编译时间
    summary TEXT,
    cover_image_id UUID REFERENCES media(id),
    status post_status NOT NULL DEFAULT 'draft',
    published_at TIMESTAMPTZ,
    category_id UUID REFERENCES categories(id),
    author_id UUID REFERENCES users(id),
    view_count BIGINT NOT NULL DEFAULT 0,
    like_count INTEGER NOT NULL DEFAULT 0,
    comment_count INTEGER NOT NULL DEFAULT 0,
    content_hash TEXT,                 -- MDX 同步用
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,
    sync_epoch BIGINT                  -- MDX 同步纪元
);

CREATE INDEX idx_posts_status ON posts(status);
CREATE INDEX idx_posts_published ON posts(published_at DESC) WHERE status = 'published';
CREATE INDEX idx_posts_content_json ON posts USING GIN (content_json jsonb_path_ops);
```

### 双轨存储说明

| 列 | 类型 | 用途 |
|----|------|------|
| `content_json` | JSONB | TipTap ProseMirror 完整 AST，写入侧单一事实来源 |
| `content_mdx` | TEXT | MDX 文本，读取侧 SSR/SSG 直读缓存 |
| `mdx_compiled_at` | TIMESTAMPTZ | MDX 最后编译时间，判断是否需要重新编译 |
| `content` | TEXT | 旧列，过渡期保留向后兼容 |
| `content_html` | TEXT | 旧列，过渡期保留 |

## 评论表 (comments) — ltree 层级

```sql
CREATE EXTENSION IF NOT EXISTS ltree;

CREATE TABLE comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_slug TEXT NOT NULL,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    parent_id UUID REFERENCES comments(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    html_sanitized TEXT NOT NULL,
    status comment_status NOT NULL DEFAULT 'pending',
    path LTREE NOT NULL,               -- 层级路径: "1.4.7"
    like_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_comments_path ON comments USING GIST (path);
CREATE INDEX idx_comments_post ON comments(post_slug);
CREATE INDEX idx_comments_pending ON comments(created_at DESC) WHERE status = 'pending';
```

## 统计表 (post_stats) — HOT 优化

```sql
CREATE TABLE post_stats (
    post_id UUID PRIMARY KEY REFERENCES posts(id) ON DELETE CASCADE,
    view_count BIGINT NOT NULL DEFAULT 0,
    like_count INTEGER NOT NULL DEFAULT 0,
    comment_count INTEGER NOT NULL DEFAULT 0,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
) WITH (fillfactor = 70);
```

**注意**：禁止在此表上创建额外索引——高频 UPDATE 表不应有额外索引。统计采用 Redis 缓冲 + 异步持久化。

## Outbox 事件表 — 表分区

```sql
CREATE TABLE outbox_events (
    id UUID DEFAULT gen_random_uuid(),
    topic TEXT NOT NULL,
    payload JSONB NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    run_after TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    attempts INT NOT NULL DEFAULT 0,
    last_error TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
) PARTITION BY LIST (status);

CREATE TABLE outbox_pending
    PARTITION OF outbox_events
    FOR VALUES IN ('pending', 'processing');

CREATE TABLE outbox_completed
    PARTITION OF outbox_events
    FOR VALUES IN ('completed', 'failed');
```

## Redis 数据结构

```
# 限流: 滑动窗口 ZSET
ratelimit:{ip}:{route} → ZSET(score=timestamp, member=request_id)
TTL: 滑动窗口时长

# 会话
session:{session_id} → Hash(user_id, expires_at, roles)
TTL: 30 分钟

# 令牌黑名单
token_blacklist:{jti} → String("1")
TTL: 剩余有效期

# 挑战码 (WebAuthn 防重放)
webauthn_challenge:{user_id} → String(challenge)
TTL: 60 秒
```

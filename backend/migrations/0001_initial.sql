-- 启用必要的扩展
CREATE EXTENSION IF NOT EXISTS pgcrypto;  -- gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS citext;    -- 大小写不敏感
CREATE EXTENSION IF NOT EXISTS ltree;     -- 评论树结构
CREATE EXTENSION IF NOT EXISTS "uuid-ossp"; -- uuid_generate_v4() 用于备用 UUID

-- 用户表
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email CITEXT UNIQUE NOT NULL,
    username CITEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    profile JSONB NOT NULL DEFAULT '{}',
    email_verified BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 基础索引
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_created_at ON users(created_at DESC);
CREATE INDEX idx_users_profile_gin ON users USING GIN (profile);

-- Refresh Token 表（修正版）
CREATE TABLE refresh_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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

CREATE INDEX idx_refresh_tokens_user ON refresh_tokens(user_id);
CREATE INDEX idx_refresh_tokens_family ON refresh_tokens(family_id);
CREATE INDEX idx_refresh_tokens_expires ON refresh_tokens(expires_at);

-- 文章统计表
CREATE TABLE post_stats (
    post_slug TEXT PRIMARY KEY,
    view_count BIGINT NOT NULL DEFAULT 0,
    like_count INT NOT NULL DEFAULT 0,
    comment_count INT NOT NULL DEFAULT 0,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 注意：idx_post_stats_updated/idx_post_stats_views/idx_post_stats_likes 索引已在
-- 2026040902_hot_optimization.sql 中 DROP。保留此处仅作历史记录。
CREATE INDEX idx_post_stats_updated ON post_stats(updated_at DESC);  -- DROPped by 2026040902
CREATE INDEX idx_post_stats_views ON post_stats(view_count DESC);    -- DROPped by 2026040902
CREATE INDEX idx_post_stats_likes ON post_stats(like_count DESC);     -- DROPped by 2026040902

-- 点赞表
CREATE TABLE post_likes (
    post_slug TEXT NOT NULL,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (post_slug, user_id)
);

CREATE INDEX idx_post_likes_user ON post_likes(user_id);
CREATE INDEX idx_post_likes_post ON post_likes(post_slug);

-- 评论状态枚举
CREATE TYPE comment_status AS ENUM ('pending','approved','rejected','spam','deleted');

-- 评论表（修正版）
CREATE TABLE comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_slug TEXT NOT NULL,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    parent_id UUID REFERENCES comments(id) ON DELETE CASCADE,

    content TEXT NOT NULL,
    html_sanitized TEXT NOT NULL,
    status comment_status NOT NULL DEFAULT 'pending',

    path LTREE NOT NULL,
    depth INTEGER NOT NULL DEFAULT 0,

    like_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,

    created_ip INET,
    user_agent TEXT,
    moderation_reason TEXT,

    FOREIGN KEY (post_slug) REFERENCES post_stats(post_slug)
);

CREATE INDEX idx_comments_post_created ON comments(post_slug, created_at DESC);
CREATE INDEX idx_comments_post_status ON comments(post_slug, status);
CREATE INDEX idx_comments_path_gist ON comments USING GIST (path);
CREATE INDEX idx_comments_user ON comments(user_id);

-- 事件出队表（用于 Worker）
CREATE TABLE outbox_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    topic TEXT NOT NULL,
    payload JSONB NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    run_after TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    attempts INT NOT NULL DEFAULT 0,
    last_error TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_outbox_pending ON outbox_events(status, run_after);
# 数据库 Schema 一致性审计报告

生成时间: 2026-04-27 23:52
设计文档: `docs/design/database-schema.md`
Rust 模型: `backend/crates/db/src/models/` (models.rs + cms.rs)

---

## 1. users 表

| # | 问题 | 设计文档 | 数据库实际 | Rust 模型 | 严重性 |
|---|------|----------|-----------|-----------|--------|
| 1.1 | `deleted_at` 缺失 | `TIMESTAMPTZ` | ✅ 存在 | ❌ `models.rs` `User` 缺少 `deleted_at` | MEDIUM |
| 1.2 | `status` 列 | 未定义 | ✅ 存在 (`text DEFAULT 'active'`, CHECK 约束) | ❌ 缺少 | MEDIUM |
| 1.3 | 索引 `idx_users_status` | 未定义 | ✅ 存在（额外辅助索引） | N/A | LOW |
| 1.4 | `role`, 部分唯一索引, GIN jsonb_path_ops | 一致 | ✅ | ✅ | ✅ |

## 2. posts 表

| # | 问题 | 设计文档 | 数据库实际 | Rust `Post` 模型 | 严重性 |
|---|------|----------|-----------|------------------|--------|
| 2.1 | 缺少 `content_json` | `JSONB NOT NULL DEFAULT '{}'` | ✅ 存在 | ❌ 主模型缺少（仅 `PostDetail`/Req/Res 有） | **HIGH** |
| 2.2 | 缺少 `content_mdx` | `TEXT DEFAULT ''` | ✅ 存在 | ❌ 主模型缺少 | **HIGH** |
| 2.3 | 缺少 `mdx_compiled_at` | `TIMESTAMPTZ` | ✅ 存在 | ❌ 主模型缺少 | **HIGH** |
| 2.4 | 缺少 `content_hash` | `TEXT` | ✅ 存在 | ❌ 主模型缺少 | MEDIUM |
| 2.5 | 缺少 `sync_epoch` | `BIGINT` | ❌ 数据库无此列 | ❌ 无 | **HIGH** |
| 2.6 | 缺少约 20 个增强列 | 未在设计中 | ✅ 存在（来自多个迁移） | ❌ 主模型缺少 `scheduled_at`, `meta_title`, `meta_description`, `canonical_url`, `show_toc`, `layout`, `edit_count`, `first_published_at`, `last_edited_by`, `publication_version`, `author_display_name`, `is_featured`, `excerpt`, `og_image_id`, `words_count`, `meta_keywords`, `estimated_reading_time`, `content_format`, `language`, `post_type`, `copyright_info`, `license_type`, `source_url`, `featured_image_caption`, `search_vector`, `rendered_at` | **HIGH** |
| 2.7 | `content_json`/`content_mdx` 大小约束 | 未提及 | ❌ 已无（`2026041601` 添加过但后续可能被覆盖） | N/A | LOW |
| 2.8 | 双轨 GIN index `jsonb_path_ops` | 一致 | ✅ | ✅ | ✅ |

## 3. comments 表

| # | 问题 | 设计文档 | 数据库实际 | Rust 模型 | 严重性 |
|---|------|----------|-----------|-----------|--------|
| 3.1 | 列名 `post_slug` vs `slug` | `post_slug TEXT NOT NULL` | ❌ 列名是 `slug` | ✅ 字段名 `post_slug`（但 `CommentWithUser` 用 `slug`） | **HIGH** |
| 3.2 | 缺少 `idx_comments_pending` | 设计有 | ❌ 缺失 | N/A | LOW |
| 3.3 | `path LTREE` 层级路径 | ✅ | ✅ | ✅ String 类型映射 | ✅ |
| 3.4 | `html_sanitized` | ✅ | ✅ | ✅ | ✅ |
| 3.5 | `depth`, `created_ip`, `user_agent`, `moderation_reason` | 不在设计中 | ✅ 存在（来自初始迁移） | ✅ 存在 | ✅ |

## 4. post_stats 表

| # | 问题 | 设计文档 | 数据库实际 | 严重性 |
|---|------|----------|-----------|--------|
| 4.1 | 主键列名/类型 | `post_id UUID PK REFERENCES posts(id)` | ❌ `slug TEXT PK` | **HIGH** |
| 4.2 | `fillfactor=70` | ✅ | ✅ | ✅ |
| 4.3 | 无额外索引 | "禁止" | ✅ 只有 PK | ✅ |

## 5. outbox_events 表

| # | 问题 | 设计文档 | 数据库实际 | 严重性 |
|---|------|----------|-----------|--------|
| 5.1 | 未分区 | `PARTITION BY LIST (status)` | ❌ 普通表 (`relkind='r'`) | **HIGH** |
| 5.2 | `topic` → `event_type` | `topic TEXT` | ❌ `event_type VARCHAR(100)`（迁移重命名） | MEDIUM |
| 5.3 | Rust 模型缺少字段 | — | ✅ 有 `status`, `run_after` | ❌ `OutboxEvent` 缺少 `status`, `run_after` | MEDIUM |
| 5.4 | 额外字段 `processed_at`, `locked_at`, `locked_by` | 不在设计中 | ✅ 存在（支持 worker 抢占） | ✅ Rust 模型已有 | LOW |

## 6. 索引原则

| 索引原则 | 设计要求 | 实际符合？ |
|----------|----------|-----------|
| 部分唯一索引用于软删除 | `UNIQUE INDEX WHERE deleted_at IS NULL` | ✅ |
| GIN jsonb_path_ops | `USING GIN (profile jsonb_path_ops)` | ✅ |
| UUIDv7 主键 | `DEFAULT uuid_generate_v7()` | ✅ |
| ltree + GIST | `USING GIST (path)` | ✅ |
| 双轨 JSONB GIN | `USING GIN (content_json jsonb_path_ops)` | ✅ |

---

## 严重性汇总

| 级别 | 数量 | 关键问题 |
|------|------|----------|
| **HIGH** | 6 类 | Post 模型严重过时、sync_epoch 缺失、post_stats PK 设计不符、outbox 未分区、comments post_slug 字段名不一致 |
| **MEDIUM** | 5 | User 缺少 deleted_at/status、Post 缺少 content_hash、OutboxEvent 缺少 status/run_after、outbox topic→event_type 重命名 |
| **LOW** | 3 | 额外辅助索引、缺少 pending 评论索引、outbox 额外 worker 字段 |

**最高优先级**: 同步 `Post` 结构体与数据库 posts 表的所有列，否则 `SELECT *` 查询会在编译时报错。

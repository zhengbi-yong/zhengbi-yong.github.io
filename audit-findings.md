# 设计准则一致性审计 — 完整差异清单

按优先级排序，高优先级的先修。

## 🔴 HIGH — 必须修复

| # | 模块 | 问题 | 位置 | 修复方案 |
|---|------|------|------|---------|
| H1 | 数据库 | Post 模型严重过时，缺少双轨列和 20+ 增强列 | `backend/crates/db/src/models/cms.rs` | 同步 Rust 模型字段与数据库 posts 表 |
| H2 | 数据库 | `sync_epoch` 列数据库和模型都缺失 | `posts` 表 + Rust 模型 | 添加迁移 + 模型字段 |
| H3 | 数据库 | post_stats 主键用 slug 不是 post_id | `post_stats` 表 | 设计文档与数据库有分歧——检查实际代码如何使用 |
| H4 | 数据库 | outbox_events 未分区 | `outbox_events` 表 | 加分区迁移 |
| H5 | 数据库 | comments.post_slug 列名不一致 | `comments` 表 / Rust 模型 | 确认字段映射 |
| H6 | 后端 | 公开 MDX 同步端点无认证 | `main.rs` 中 `/sync/mdx/public` | 添加认证或移除 |

## 🟡 MEDIUM — 建议修复

| # | 模块 | 问题 | 位置 | 修复方案 |
|---|------|------|------|---------|
| M1 | 后端 | 连接池默认值 20/10s 不符合设计 50/5s | `config.rs` | 更新默认值 |
| M2 | 后端 | GET /posts/id/{id} 冗余路径 | `main.rs` | 移除 |
| M3 | 后端 | 点赞路由 `/like` 单数非 `/likes` 复数 | `main.rs` + posts.rs | 重命名 |
| M4 | 数据库 | User 模型缺少 deleted_at/status | `models.rs` | 加字段 |
| M5 | 数据库 | OutboxEvent 模型缺少 status/run_after | `models` | 加字段 |
| M6 | 后端 | 迁移验证被禁用 | `main.rs` | 恢复验证 |

## 🟢 LOW — 可优化

| # | 模块 | 问题 | 位置 | 修复方案 |
|---|------|------|------|---------|
| L1 | 后端 | 自定义操作 /view 非 :view 风格 | `main.rs` | 统一风格 |
| L2 | 后端 | password_pepper 未使用 | `config.rs` | 移除冗余配置 |
| L3 | 数据库 | 缺少 idx_comments_pending 索引 | 迁移 | 添加 |

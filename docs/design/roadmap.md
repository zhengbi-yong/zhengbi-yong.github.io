# 演进路线图

> 来源：ultradesign.md (8章) — 已根据实际代码库状态更新

## ✅ 已完成阶段

以下阶段的所有交付项均已实现并投入运行。

| 阶段 | 内容 | 状态 | 关键交付 |
|------|------|------|----------|
| 1 | 安全基线 | ✅ 已完成 | HttpOnly Cookie, CSRF 防护 |
| 2 | 数据库优化 | ✅ 已完成 | UUIDv7 迁移, ltree 评论, HOT 优化, 软删除索引 |
| 3 | API 契约 | ✅ 已完成 | Orval 配置, TS 客户端自动生成 |
| 5 | 搜索 CDC | ✅ 已完成 | MeiliBridge 部署, Outbox 模式 |
| — | Contentlayer → Velite | ✅ 已完成 | 迁移完成，保留 contentlayer 兼容垫片 |
| — | Docker Compose + K3s | ✅ 双路径维护 | Compose 单机部署 + K3s 集群部署共存 |

## 📋 未来计划

| 阶段 | 内容 | 预期周期 | 关键交付 |
|------|------|----------|----------|
| 4 | 认证升级 | 2-3 周 | WebAuthn 集成 |

## 关键技术决策（当前状态）

| 决策点 | 旧方案 | 当前方案 | 实现状态 |
|--------|--------|----------|----------|
| 主键生成 | UUIDv4 (随机) | UUIDv7 (时间序) | ✅ 迁移 2026040901 已执行 |
| 软删除+唯一 | 联合唯一索引 | 部分唯一索引 | ✅ 迁移 2026040903 已执行 |
| 评论树 | 递归 CTE | ltree | ✅ 初始迁移即启用 |
| 计数更新 | 实时 UPDATE | Redis 缓冲+HOT | ✅ 迁移 2026040902 已执行 |
| JWT 存储 | localStorage | HttpOnly Cookie | ✅ `http_only(true)` 已部署 |
| 搜索同步 | Outbox 轮询 | CDC MeiliBridge | ✅ Worker `cdc_main.rs` 已运行 |
| 内容处理 | Contentlayer | Velite | ✅ 已迁移，保留兼容垫片 |
| API 类型 | 手动维护 | Orval 自动生成 | ✅ `orval.config.js` 就绪 |
| 部署方式 | Docker Compose | Compose + K3s 双路径 | ✅ 两套部署均维护

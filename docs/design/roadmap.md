# 演进路线图

> 来源：ultradesign.md (8章)

## 已完成

| 阶段 | 内容 | 说明 |
|------|------|------|
| 1 | 安全基线 ✅ | HttpOnly Cookie、CSRF 防护、CORS 均已实施 |
| 5 | 搜索 CDC ✅ | MeiliBridge 已部署 |
| — | UUIDv7 迁移 ✅ | 已完成 |
| — | ltree 评论 ✅ | 已完成 |
| — | 部分唯一索引 ✅ | 已完成 |

## 规划中

| 阶段 | 内容 | 预期周期 | 关键交付 | 状态 |
|------|------|----------|----------|------|
| 2 | 数据库优化 | 2-3 周 | UUIDv7 迁移 ✅, ltree ✅, Redis 缓冲计数/HOT ⏳ | 部分完成 — 迁移存在但 `posts.rs`、`search.rs` 仍有直接 UPDATE 查询 |
| 3 | API 契约 | 2 周 | Orval 配置, TS 客户端 | ❌ 未开始 — 无 Orval 引用，OpenAPI 导出二进制存在但未集成 |
| 4 | 认证升级 | 2-3 周 | WebAuthn 集成 | ❌ 未开始 — 零引用 |
| 6 | K3s 迁移 | 3-4 周 | 生产级集群 | ❌ 未开始 — 仅 Docker Compose |

## 备注

| 项目 | 说明 |
|------|------|
| Velite | ✅ 已使用 (`velite.config.ts`, `package.json` 中配置) |
| Contentlayer | 遗留引用存在于脚本和类型中，实际已迁移至 Velite |
| Orval | ❌ 未开始 — 尽管有生成的代码和脚本，但未集成到 CI/CD |

# 演进路线图

> 来源：ultradesign.md (8章)

| 阶段 | 内容 | 状态 | 说明 |
|------|------|------|------|
| 1 | 安全基线 | ✅ 完成 | HttpOnly Cookie, CSRF 防护已实施 |
| 2 | 数据库优化 | ✅ 完成 | UUIDv7 迁移脚本就绪，ltree 评论已用于 comments 表 |
| 3 | API 契约 | ✅ 完成 | Orval 已生成 TS 客户端（`frontend/src/lib/api/generated/`） |
| 4 | 认证升级 | 待实施 | WebAuthn 集成（远期规划） |
| 5 | 搜索 CDC | ✅ 完成 | MeiliBridge CDC worker 实现完成（`backend/crates/worker/src/cdc_main.rs`），待部署配置 |
| 6 | K3s 迁移 | 部分完成 | K8s 清单（base + overlays）存在，实际 K3s 集群迁移待完成 |

## 关键技术决策

| 决策点 | 旧方案 | 新方案 | 原因 | 状态 |
|--------|--------|--------|------|------|
| 主键生成 | UUIDv4 (随机) | UUIDv7 (时间序) | B-Tree 插入效率，减少页分裂 | ✅ 已迁移 |
| 软删除+唯一 | 联合唯一索引 | 部分唯一索引 | NULL≠NULL 导致约束失效 | ✅ 已实施 |
| 评论树 | 递归 CTE | ltree | CTE 在大数据量下指数衰减 | ✅ 已实施 |
| 计数更新 | 实时 UPDATE | Redis 缓冲+HOT | 减少写放大 | ✅ 已实施 |
| JWT 存储 | localStorage | HttpOnly Cookie | 防止 XSS 窃取 | ✅ 已实施 |
| 搜索同步 | Outbox 轮询 | CDC MeiliBridge | 亚秒级同步 | ✅ 已实施 |
| 内容处理 | Contentlayer | Velite | 活跃维护，Zod 验证 | ✅ 已完成迁移 |
| API 类型 | 手动维护 | Orval 自动生成 | 前后端类型一致 | ✅ 已实施 |
| 部署方式 | Docker Compose | K3s | 探针自愈，滚动更新 | 🚧 部分完成 |

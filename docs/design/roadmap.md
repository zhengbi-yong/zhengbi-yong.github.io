# 演进路线图

> 来源：ultradesign.md (8章)

| 阶段 | 内容 | 预期周期 | 关键交付 | 状态 |
|------|------|----------|----------|------|
| 1 | 安全基线 | 1-2 周 | HttpOnly Cookie, CSRF 防护 | ✅ 已完成 |
| 2 | 数据库优化 | 2-3 周 | UUIDv7 迁移, ltree 评论 | ✅ 已完成 |
| 3 | API 契约 | 2 周 | Orval 配置, TS 客户端 | ⚠️ 部分完成 — Orval 已配置并生成 types，但仍有大量手动维护的类型 |
| 4 | 认证升级 | 2-3 周 | WebAuthn 集成 | ❌ 未开始 |
| 5 | 搜索 CDC | 2 周 | MeiliBridge 部署 | ⚠️ 部分完成 — worker 基础功能已实现（poll + WAL 模式），需进一步加固 |
| 6 | K3s 迁移 | 3-4 周 | 生产级集群 | ⚠️ 部分完成 — K3s/k8s 清单已存在，但 Compose 仍为主要部署方式 |

## 关键技术决策

| 决策点 | 旧方案 | 新方案 | 原因 |
|--------|--------|--------|------|
| 主键生成 | UUIDv4 (随机) | UUIDv7 (时间序) | B-Tree 插入效率，减少页分裂 |
| 软删除+唯一 | 联合唯一索引 | 部分唯一索引 | NULL≠NULL 导致约束失效 |
| 评论树 | 递归 CTE | ltree | CTE 在大数据量下指数衰减 |
| 计数更新 | 实时 UPDATE | Redis 缓冲+HOT | 减少写放大 |
| JWT 存储 | localStorage | HttpOnly Cookie | 防止 XSS 窃取 |
| 搜索同步 | Outbox 轮询 | CDC MeiliBridge | 亚秒级同步 |
| 内容处理 | Contentlayer | Velite | 活跃维护，Zod 验证 | ✅ 已完成 |
| API 类型 | 手动维护 | Orval 自动生成 | 前后端类型一致 | ⚠️ 部分完成 — Orval 已生成 types 文件，但手动维护的类型仍在使用 |
| 部署方式 | Docker Compose | K3s | 探针自愈，滚动更新 | ⚠️ 部分完成 — K3s/k8s 清单已存在，但 Compose 仍为主要部署方式 |

> **E2E 测试注意**：当前 E2E 测试（`frontend/e2e/`）中仍使用 `localStorage` 存储 `access_token`（如 `content-cqrs.spec.ts`、`auth.spec.ts`、`helpers/login.ts`），这与后端强制要求的 HttpOnly Cookie 策略存在矛盾。这些测试用例依赖前端 Zustand store 也同时从 localStorage 读取 token 的行为。建议后续统一为纯 cookie 认证流程以消除矛盾。

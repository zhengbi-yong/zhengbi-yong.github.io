# 演进路线图

> 来源：ultradesign.md (8章)

|| 阶段 | 内容 | 预期周期 | 关键交付 | 状态 |
|------|------|----------|----------|------|
| 1 | 安全基线 | 1-2 周 | HttpOnly Cookie, CSRF 防护 | ✅ 已完成 |
| 2 | 数据库优化 | 2-3 周 | UUIDv7 迁移, ltree 评论 | ✅ 已完成 |
| 3 | API 契约 | 2 周 | Orval 配置, TS 客户端 | 🔄 部分实施（Orval 配置 + 依赖已安装，但 CI 未集成自动生成） |
| 4 | 认证升级 | 2-3 周 | WebAuthn 集成 | ❌ 未实施 |
| 5 | 搜索 CDC | 2 周 | MeiliBridge 部署 | 🔄 部分实施（CDC worker 代码存在，但独立的 MeiliBridge 服务未部署） |
| 6 | Kubernetes 迁移 | 3-4 周 | 生产级集群 | 🔄 部分实施（K8s manifests 存在，K3s 特定配置待完善） |

## 关键技术决策

| 决策点 | 旧方案 | 新方案 | 原因 |
|--------|--------|--------|------|
| 主键生成 | UUIDv4 (随机) | UUIDv7 (时间序) | B-Tree 插入效率，减少页分裂 |
| 软删除+唯一 | 联合唯一索引 | 部分唯一索引 | NULL≠NULL 导致约束失效 |
| 评论树 | 递归 CTE | ltree | CTE 在大数据量下指数衰减 |
| 计数更新 | 实时 UPDATE | Redis 缓冲+HOT | 减少写放大 |
| JWT 存储 | localStorage | HttpOnly Cookie | 防止 XSS 窃取 |
| 搜索同步 | Outbox 轮询 | CDC MeiliBridge | 亚秒级同步 |
| 内容处理 | Contentlayer | Velite | 活跃维护，Zod 验证 |
| API 类型 | 手动维护 | Orval 自动生成 | 前后端类型一致 |
| 部署方式 | Docker Compose | K3s | 探针自愈，滚动更新 |

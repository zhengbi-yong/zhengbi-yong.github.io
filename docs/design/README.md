# Design 设计文档

> 本目录是项目的**唯一设计准则库**，每个文件聚焦单一模块，可直接按需查阅。

## 索引

| 领域 | 文件 | 核心内容 |
|------|------|---------|
| **前端** | `frontend-architecture.md` | 目录结构、数据获取、状态管理、CSS 分层、搜索降级策略 |
| | `frontend-components.md` | 组件清单（Header/Footer/Layout/Cards/主题）、设计师 A-E 组分工、交付规范 |
| | `editor-design.md` | TipTap 选型理由、CQRS 双轨存储、数学公式 LaTeX 存储、边界防护 |
| | `editor-integration.md` | TipTap SSR 水合三层隔离、编辑器功能矩阵、保存/加载闭环 |
| | `reading-experience.md` | 黄金比例双栏布局、排版系统、TOC、代码块、微交互 |
| | `homepage-design.md` | 6 Section 设计、WebGL 粒子、Bento Grid、性能指标 |
| **后端** | `backend-api-design.md` | 项目结构、RESTful 规范、路由表、连接池、禁止模式、优雅停机 |
| | `auth-design.md` | HttpOnly Cookie、JWT 中间件职责边界、登录流程、技术决策 |
| | `ast-conversion.md` | TipTap JSON ↔ MDX 双向转换、节点类型映射表 |
| | `media-handling.md` | 文件上传流程、分片上传、图片优化策略 |
| **数据库** | `database-schema.md` | 所有表定义、索引原则(部分索引/HOT/UUIDv7)、双轨存储、Redis 结构 |
| **部署** | `deployment-security.md` | 容器安全、存活/就绪探针、密钥管理、Docker 构建、备份 |
| **测试** | `testing-strategy.md` | 测试金字塔、覆盖矩阵、E2E 路径、回归流程、性能基准 |
| **规划** | `roadmap.md` | 6 阶段路线图、关键技术决策表 |
| **扩展** | `collaboration-crdt.md` | Yjs CRDT 实时协作架构（**尚未实施**） |
| | `privacy-compliance.md` | GDPR/个保法合规、数据自动清除（**尚未实施**） |
| **元信息** | `REVIEW_REPORT.md` | 冲突分析报告 |
| | `README.md` | ← 当前文件 |

## 设计原则

1. **最小侵入** — 修改现有代码时应最小化破坏性
2. **实际优先** — 生产运行的代码优先于设计文档中的理想方案
3. **模块化** — 每个文件独立可读，解耦减少心智负担
4. **一致性** — 代码与设计文档同步，发现不一致时记录并决定方向

## 已知冲突（详见 REVIEW_REPORT.md）

- `posts` vs `articles` 表名：附录曾用 `articles`，当前数据库用 `posts` → 保持一致
- 认证方式：设计目标 WebAuthn 无密码，当前实现是 JWT HttpOnly Cookie → 过渡中
- 搜索：PG FTS + Meilisearch 双轨但 Meilisearch 尚未实装

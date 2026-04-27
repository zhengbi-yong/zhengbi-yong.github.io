# Design 设计文档

> 本目录是项目的**唯一设计准则库**，每个文件聚焦单一模块，可直接按需查阅。
> 所有文档与当前代码保持一致（除非特别标注"尚未实施"）。

## 索引

| 领域 | 文件 | 核心内容 |
|------|------|---------|
| **前端** | `frontend-architecture.md` | 目录结构、数据获取、状态管理、CSS 分层、搜索降级策略 |
| | `frontend-components.md` | 组件清单（Header/Footer/Layout/Cards/主题）、交付规范 |
| | `editor-design.md` | TipTap 选型理由、CQRS 双轨存储、数学公式 LaTeX 存储、边界防护 |
| | `editor-integration.md` | TipTap SSR 水合三层隔离、编辑器功能矩阵、保存/加载闭环 |
| | `reading-experience.md` | 黄金比例双栏布局、排版系统、TOC、代码块、微交互 |
| | `homepage-design.md` | 6 Section 设计、WebGL 粒子、Bento Grid、性能指标 |
| **后端** | `backend-api-design.md` | 项目结构、RESTful 规范、完整路由表、连接池、禁止模式、优雅停机 |
| | `auth-design.md` | HttpOnly Cookie、JWT 双令牌、中间件职责边界、登录流程 |
| | `ast-conversion.md` | 后端 Rust 递归 JSON→MDX 转换、节点类型映射表、16 个单元测试 |
| | `media-handling.md` | 文件上传流程、预签名上传、存储抽象层、**尚未实施**: 分片/缩略图/WebP** |
| **数据库** | `database-schema.md` | 所有表定义（含 50+ posts 列）、索引原则、双轨存储、Redis 结构 |
| **部署** | `deployment-security.md` | Docker 多阶段构建、健康探针、密钥管理、备份策略 |
| **测试** | `testing-strategy.md` | 测试金字塔、覆盖矩阵、实际 E2E 路径 |
| **规划** | `roadmap.md` | 6 阶段路线图、关键技术决策表 |
| **扩展** | `collaboration-crdt.md` | Yjs CRDT 实时协作架构（**尚未实施**） |
| | `privacy-compliance.md` | GDPR/个保法合规、数据自动清除（**尚未实施**） |

# 文档导航中心

欢迎使用 zhengbi-yong.github.io 项目文档。本文档提供了所有项目文档的导航和快速访问入口。

---

## 快速导航

### 按角色导航

| 角色 | 推荐阅读路径 |
|------|-------------|
| **新手用户** | [快速开始](getting-started/quick-start.md) → [安装指南](getting-started/installation.md) → [故障排查](getting-started/troubleshooting.md) |
| **内容创作者** | [写作指南](guides/writing-guide.md) → [内容管理](guides/content-management.md) → [管理后台](guides/admin-panel.md) |
| **前端开发者** | [前端架构](development/frontend/overview.md) → [Refine 集成](development/frontend/refine-integration.md) → [前端测试](development/frontend/testing.md) |
| **后端开发者** | [后端架构](development/backend/overview.md) → [API 参考](development/backend/api-reference.md) → [后端测试](development/backend/testing.md) |
| **运维人员** | [部署总览](deployment/overview.md) → [单服务器部署](deployment/single-server.md) → [性能监控](development/operations/performance-monitoring.md) |

---

## 文档目录

### 📚 快速开始 (Getting Started)

| 文档 | 描述 |
|------|------|
| [快速开始](getting-started/quick-start.md) | 5 分钟启动项目 |
| [安装指南](getting-started/installation.md) | 详细的安装步骤 |
| [环境配置](getting-started/environment-setup.md) | 环境变量配置 |
| [故障排查](getting-started/troubleshooting.md) | 常见问题解决 |

---

### 📖 用户指南 (Guides)

| 文档 | 描述 |
|------|------|
| [内容管理](guides/content-management.md) | 创建和管理文章 |
| [写作指南](guides/writing-guide.md) | Markdown 和组件使用 |
| [管理后台](guides/admin-panel.md) | 用户和评论管理 |

---

### 🔧 开发文档 (Development)

#### 架构概览

| 文档 | 描述 |
|------|------|
| [系统架构](development/architecture.md) | 完整的系统架构说明 |
| [组件参考](development/components-reference.md) | 所有组件的快速参考 |
| [最佳实践](development/best-practices.md) | 开发规范和最佳实践 |

#### 前端开发

| 文档 | 描述 |
|------|------|
| [前端架构](development/frontend/overview.md) | Next.js 项目结构 |
| [Refine 集成](development/frontend/refine-integration.md) | Refine 框架集成指南 |
| [前端测试](development/frontend/testing.md) | 测试策略和规范 |

#### 后端开发

| 文档 | 描述 |
|------|------|
| [后端架构](development/backend/overview.md) | Rust 项目结构 |
| [API 参考](development/backend/api-reference.md) | REST API 文档 |
| [数据库设计](development/backend/database.md) | 数据库模式和关系 |
| [后端测试](development/backend/testing.md) | 测试策略和规范 |

#### 运维 (Operations)

| 文档 | 描述 |
|------|------|
| [性能监控](development/operations/performance-monitoring.md) | 性能指标和监控 |
| [安全指南](development/operations/security-guide.md) | 安全措施和最佳实践 |
| [故障排查](development/operations/troubleshooting-guide.md) | 问题诊断和解决 |

#### 故障修复记录

| 文档 | 描述 |
|------|------|
| [系统监控修复](development/SYSTEM_MONITORING_FIX.md) | 监控功能完整修复记录（404、数据结构、useCustom问题）|
| [Refine Admin Panel 修复](development/REFINE_ADMIN_PANEL_FIX.md) | Admin Panel 集成 Refine 的修复过程 |
| [Admin Panel 快速启动](development/ADMIN_PANEL_QUICK_START.md) | 管理后台快速启动指南 |
| [版本升级记录](development/VERSION_UPGRADE_2025-12-28.md) | 2025-12-28全软件版本升级详情 |

---

### 🚀 部署文档 (Deployment)

| 文档 | 描述 |
|------|------|
| [部署总览](deployment/overview.md) | 部署架构选项 |
| [单服务器部署](deployment/single-server.md) | 快速部署指南 |
| [高可用部署](deployment/high-availability.md) | 生产环境配置 |
| [部署脚本](deployment/scripts.md) | 自动化脚本说明 |
| [Slidev 部署](deployment/slidev.md) | 演示文稿部署 |

---

### 📋 参考文档 (Reference)

| 文档 | 描述 |
|------|------|
| [颜色系统](reference/color-system.md) | 设计颜色规范 |
| [AI 开发](reference/ai-development.md) | AI 功能开发指南 |

---

### 📎 附录 (Appendix)

| 文档 | 描述 |
|------|------|
| [术语表](appendix/glossary.md) | 项目术语定义 |
| [变更日志](appendix/changelog.md) | 版本更新记录 |
| [常见问题](appendix/faq.md) | 常见问题解答 |

---

## 文档结构

```
docs/
├── README.md                           # 📍 文档导航中心（本文件）
├── getting-started/                    # 🚀 快速开始
│   ├── quick-start.md                  # 5 分钟启动
│   ├── installation.md                 # 安装指南
│   ├── environment-setup.md            # 环境配置
│   └── troubleshooting.md              # 故障排查
├── guides/                             # 📖 用户指南
│   ├── writing-guide.md                # 写作指南
│   ├── content-management.md           # 内容管理
│   └── admin-panel.md                  # 管理后台
├── development/                        # 🔧 开发文档
│   ├── architecture.md                 # 系统架构
│   ├── best-practices.md               # 最佳实践
│   ├── components-reference.md         # 组件参考
│   ├── frontend/                       # 前端开发
│   │   ├── overview.md                 # 前端架构
│   │   ├── refine-integration.md       # Refine 集成
│   │   └── testing.md                  # 前端测试
│   ├── backend/                        # 后端开发
│   │   ├── overview.md                 # 后端架构
│   │   ├── api-reference.md            # API 文档
│   │   ├── database.md                 # 数据库设计
│   │   └── testing.md                  # 后端测试
│   └── operations/                     # 运维
│       ├── performance-monitoring.md   # 性能监控
│       ├── security-guide.md           # 安全指南
│       └── troubleshooting-guide.md    # 故障排查
├── deployment/                         # 🚀 部署文档
│   ├── overview.md                     # 部署总览
│   ├── single-server.md                # 单服务器部署
│   ├── high-availability.md            # 高可用部署
│   ├── scripts.md                      # 部署脚本
│   └── slidev.md                       # Slidev 部署
├── reference/                          # 📋 参考文档
│   ├── color-system.md                 # 颜色系统
│   └── ai-development.md               # AI 开发
└── appendix/                           # 📎 附录
    ├── glossary.md                     # 术语表
    ├── changelog.md                    # 变更日志
    └── faq.md                          # 常见问题
```

---

## 快速查找

### 按主题查找

#### 🔐 认证与安全
- [后端架构 - 认证系统](development/backend/overview.md#认证系统)
- [API 参考 - 认证端点](development/backend/api-reference.md#认证端点)
- [安全指南](development/operations/security-guide.md)

#### 💾 数据库
- [数据库设计](development/backend/database.md)
- [数据库故障排查](development/operations/troubleshooting-guide.md#数据库问题)

#### 🧪 测试
- [前端测试指南](development/frontend/testing.md)
- [后端测试指南](development/backend/testing.md)

#### 📊 监控与性能
- [性能监控](development/operations/performance-monitoring.md)
- [故障排查](development/operations/troubleshooting-guide.md)

---

### 按组件查找

#### 前端组件
- [3D 可视化组件](development/components-reference.md#3d-可视化)
- [数据图表组件](development/components-reference.md#数据图表)
- [化学组件](development/components-reference.md#化学组件)
- [音乐组件](development/components-reference.md#音乐组件)

#### 后端服务
- [认证服务](development/backend/overview.md#认证系统)
- [评论系统](development/backend/overview.md#评论系统)
- [搜索功能](development/backend/overview.md#搜索功能)

---

## 搜索和帮助

### 搜索文档

使用以下方式搜索文档：

1. **浏览器搜索**: 使用 `Ctrl+F` 或 `Cmd+F` 在当前页面搜索
2. **GitHub 搜索**: 在 GitHub 仓库中使用代码搜索
3. **Kbar**: 在前端应用中按 `Cmd/Ctrl + K` 打开命令面板

---

### 获取帮助

如果文档中没有找到答案：

1. **查看 FAQ**: [常见问题](appendix/faq.md)
2. **查看故障排查**: [故障排查指南](getting-started/troubleshooting.md)
3. **提交 Issue**: 在 [GitHub Issues](https://github.com/zhengbi-yong/zhengbi-yong.github.io/issues) 提问

---

## 文档贡献

### 改进文档

欢迎改进文档：

1. **修复错误**: 如果发现文档错误，请提交 PR 修复
2. **补充内容**: 如果发现内容缺失，欢迎补充
3. **改进表达**: 如果觉得某些部分难以理解，请改进表达

### 文档规范

- 使用 Markdown 格式
- 遵循现有文档的结构和风格
- 添加示例代码和使用场景
- 更新相关文档的交叉引用

---

## 更新日志

### 最近更新

- **2025-12-28**: 完成全软件版本升级
  - Node.js: 20 → 22-alpine (性能提升20%)
  - PostgreSQL: 15 → 16-alpine (查询性能提升)
  - Redis: 7 → 7.4-alpine (内存效率提升)
  - Nginx: alpine → 1.27-alpine (HTTP/3支持)
  - Rust: 1.83 → 1.84-slim (edition2024支持)
- **2025-12-27**: 完成文档全面整理和优化
  - 清理了 27 个过时文档
  - 整合了 15 个测试文档为 3 个
  - 新增 8 个关键文档
  - 优化了文档结构和导航

---

## 相关链接

- **项目主页**: https://zhengbi-yong.github.io
- **GitHub 仓库**: https://github.com/zhengbi-yong/zhengbi-yong.github.io
- **问题反馈**: https://github.com/zhengbi-yong/zhengbi-yong.github.io/issues

---

**最后更新**: 2025-12-27
**维护者**: Documentation Team

---

<div align="center">

**[返回顶部](#文档导航中心)**

</div>

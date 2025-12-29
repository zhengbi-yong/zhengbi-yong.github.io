# Zhengbi Yong's Personal Blog

雍征彼的个人博客系统

A sophisticated dual-architecture blogging platform built with modern web technologies, featuring a Next.js 16 frontend and a Rust backend.

基于现代 Web 技术构建的高级双架构博客平台，采用 Next.js 16 前端和 Rust 后端。

---

## 简介 / About

This is Zhengbi Yong's personal technical blog, featuring research and tutorials in robotics, automation, mathematics, computer science, and tactile sensing.

这是雍征彼的个人技术博客，主要内容包括机器人学、自动控制、数学、计算机科学和触觉传感的研究与教程。

**About the Author / 关于作者**

Zhengbi Yong is a Master's student at Beijing Institute of Technology (formerly at Tsinghua University), researching robotics and multimodal perception under Professor Shi Dawai.

雍征彼是北京理工大学硕士生（原清华大学学生），师从石大发教授，从事机器人学和多模态感知研究。

**Blog URL / 博客地址**: https://zhengbi-yong.github.io

---

## 🚀 Docker 部署 / Docker Deployment

**跨平台支持**: Windows, Linux, macOS

### 快速开始（三步）

```bash
# 1. 本地构建（选择适合你平台的方法）
npm run build          # Node.js（所有平台）✨ 推荐
# 或 Windows:
.\build-all.ps1        # PowerShell
# 或 Linux/macOS:
bash build-all.sh      # Bash

# 2. 推送镜像
npm run push           # Node.js
# 或
.\push-images.ps1      # Windows
bash push-images.sh    # Linux/macOS

# 3. 服务器部署
bash deploy-server.sh <registry> <version>
```

**优势**：
- ✅ 本地构建，服务器无需编译环境
- ✅ 镜像版本管理，方便回滚
- ✅ 跨平台统一命令
- ✅ 支持离线部署

### 平台选择指南

| 本地平台 | 推荐方法 | 命令 |
|---------|---------|------|
| **Windows** | Node.js 或 PowerShell | `npm run build` 或 `.\build-all.ps1` |
| **Linux** | Node.js 或 Bash | `npm run build` 或 `bash build-all.sh` |
| **macOS** | Node.js 或 Bash | `npm run build` 或 `bash build-all.sh` |

### 详细文档

- 📖 **[跨平台部署指南](CROSS_PLATFORM_DEPLOYMENT.md)** - Windows/Linux/macOS 完整指南 ⭐
- 📖 [完整部署指南](DEPLOYMENT.md) - 本地构建 + 服务器部署
- 📖 [Docker 部署](docs/deployment/docker.md) - 传统 Docker 部署

### 镜像版本 / Image Versions

| 服务 | 镜像 | 版本 | 说明 |
|------|------|------|------|
| PostgreSQL | postgres | **17-alpine** | 最新稳定版，性能提升 20-30% |
| Redis | redis | **7.4-alpine** | 最新稳定版 |
| Nginx | nginx | **1.27-alpine** | 最新主线版 |
| Backend | rustlang/rust | **nightly-slim** | Rust nightly |
| Frontend | node | **22-alpine** | Node.js 22 LTS |

---

## 传统开发模式 / Traditional Development

### 前置要求 / Prerequisites

- **Node.js** 20+ and **pnpm** (for frontend / 前端)
- **Rust** 1.70+ and **Cargo** (for backend / 后端)
- **Docker** and **Docker Compose** (for databases / 数据库)

### 前端 / Frontend

```bash
cd frontend
pnpm install
pnpm dev
```

Access at: http://localhost:3001

访问地址: http://localhost:3001

### 后端 / Backend

```bash
cd backend
./deploy.sh dev

# 运行 API / Run API
export DATABASE_URL=postgresql://blog_user:blog_password@localhost:5432/blog_db
export REDIS_URL=redis://localhost:6379
cargo run
```

API: http://localhost:3000

---

## 主要特性 / Key Features

### 交互式内容 / Interactive Content

- **3D Models**: Three.js viewer for robotics simulations / 3D 模型：用于机器人仿真的 Three.js 查看器
- **Molecular Visualization**: 3Dmol.js for chemistry / 分子可视化：用于化学的 3Dmol.js
- **Charts**: Multiple charting libraries (Nivo, ECharts, G2, G6) / 图表：多种图表库
- **Chemical Structures**: RDKit integration / 化学结构：RDKit 集成
- **Music Notation**: Sheet music display / 音乐记谱：乐谱显示

### 博客功能 / Blog Features

- **Multi-Layout Posts**: Three different layouts / 多布局文章：三种不同的布局
- **Tag System**: Automatic tag generation and filtering / 标签系统：自动生成和过滤标签
- **Search**: Kbar command palette (Cmd/Ctrl + K) / 搜索：Kbar 命令面板
- **Comments**: Giscus integration / 评论：Giscus 集成
- **Theme**: Dark/light mode switching / 主题：深色/浅色模式切换

---

## 技术栈 / Technology Stack

### 前端 / Frontend

| 类别 / Category | 技术 / Technology |
|-----------------|-------------------|
| **框架 / Framework** | Next.js 16 |
| **语言 / Language** | TypeScript |
| **样式 / Styling** | Tailwind CSS 4 |
| **内容 / Content** | MDX + Contentlayer2 |
| **3D / 3D Graphics** | Three.js, 3Dmol.js |
| **图表 / Charts** | Nivo, ECharts, G2, G6 |
| **化学 / Chemistry** | RDKit.js |
| **数学 / Math** | KaTeX |

### 后端 / Backend

| 类别 / Category | 技术 / Technology |
|-----------------|-------------------|
| **语言 / Language** | Rust |
| **框架 / Framework** | Axum |
| **数据库 / Database** | PostgreSQL + SQLx |
| **缓存 / Cache** | Redis |
| **认证 / Auth** | JWT |

---

## 文档 / Documentation

For detailed documentation, see / 详细文档请查看：

**[📚 完整文档 / Complete Documentation](docs/)**

### 🚀 快速开始 / Quick Start

- **[快速开始 / Quick Start](docs/getting-started/quick-start.md)** - 5分钟启动项目 / 5 minutes to start
- **[安装指南 / Installation](docs/getting-started/installation.md)** - 详细的安装步骤 / Detailed setup steps
- **[环境配置 / Environment Setup](docs/getting-started/environment-setup.md)** - 环境变量配置 / Environment variables
- **[故障排查 / Troubleshooting](docs/getting-started/troubleshooting.md)** - 常见问题解决 / Common issues

### 📖 使用指南 / User Guides

- **[内容管理 / Content Management](docs/guides/content-management.md)** - 创建和管理文章 / Creating and managing posts
- **[写作指南 / Writing Guide](docs/guides/writing-guide.md)** - Markdown 和组件使用 / Markdown and components
- **[管理后台 / Admin Panel](docs/guides/admin-panel.md)** - 用户和评论管理 / User and comment management

### 🔧 开发文档 / Development

**架构概览**:
- **[系统架构 / Architecture](docs/development/architecture.md)** - 完整的系统架构说明
- **[组件参考 / Components Reference](docs/development/components-reference.md)** - 所有组件的快速参考
- **[最佳实践 / Best Practices](docs/development/best-practices.md)** - 开发规范和最佳实践

**前端开发**:
- **[前端架构 / Frontend Overview](docs/development/frontend/overview.md)** - Next.js 项目结构
- **[Refine 集成 / Refine Integration](docs/development/frontend/refine-integration.md)** - Refine 框架集成指南
- **[前端测试 / Frontend Testing](docs/development/frontend/testing.md)** - 测试策略和规范

**后端开发**:
- **[后端架构 / Backend Overview](docs/development/backend/overview.md)** - Rust 项目结构
- **[API 参考 / API Reference](docs/development/backend/api-reference.md)** - REST API 文档
- **[数据库设计 / Database](docs/development/backend/database.md)** - 数据库模式和关系
- **[后端测试 / Backend Testing](docs/development/backend/testing.md)** - 测试策略和规范

**运维 / Operations**:
- **[性能监控 / Performance Monitoring](docs/development/operations/performance-monitoring.md)** - 性能指标和监控
- **[安全指南 / Security Guide](docs/development/operations/security-guide.md)** - 安全措施和最佳实践
- **[故障排查 / Troubleshooting Guide](docs/development/operations/troubleshooting-guide.md)** - 问题诊断和解决

### 🚀 部署文档 / Deployment

- **[部署总览 / Deployment Overview](docs/deployment/overview.md)** - 部署架构选项 / Deployment architecture options
- **[单服务器部署 / Single Server](docs/deployment/single-server.md)** - 快速部署指南 / Quick deployment guide
- **[高可用部署 / High Availability](docs/deployment/high-availability.md)** - 生产环境配置 / Production setup

### 📋 附录 / Appendix

- **[术语表 / Glossary](docs/appendix/glossary.md)** - 项目术语定义
- **[变更日志 / Changelog](docs/appendix/changelog.md)** - 版本更新记录
- **[常见问题 / FAQ](docs/appendix/faq.md)** - 常见问题解答

---

## 项目结构 / Project Structure

```
zhengbi-yong.github.io/
├── frontend/                # Next.js 16 前端应用
│   ├── app/                # App Router 页面
│   ├── components/         # React 组件
│   ├── data/blog/          # MDX 博客文章
│   └── lib/                # 工具库
├── backend/                # Rust API 后端
│   ├── crates/
│   │   ├── api/            # HTTP API 层
│   │   ├── core/           # 核心业务逻辑
│   │   ├── db/             # 数据库模型
│   │   └── worker/         # 后台任务
│   └── migrations/         # 数据库迁移
├── docs/                   # 项目文档
└── scripts/                # 开发脚本
```

---

## 常用命令 / Common Commands

### 前端 / Frontend

```bash
pnpm dev              # 启动开发服务器 / Start dev server
pnpm build            # 构建生产版本 / Build for production
pnpm lint             # 运行代码检查 / Run linting
pnpm test             # 运行测试 / Run tests
```

### 后端 / Backend

```bash
./deploy.sh dev       # 启动开发环境 / Start dev environment
./deploy.sh prod      # 启动生产环境 / Start production
./deploy.sh stop      # 停止所有服务 / Stop all services
cargo run             # 运行 API 服务 / Run API service
cargo test            # 运行测试 / Run tests
```

---

## 内容分类 / Content Categories

- **Computer Science** (计算机科学): AI, algorithms, programming
- **Robotics** (机器人学): ROS, control systems, automation
- **Mathematics** (数学): Linear algebra, calculus, theory
- **Chemistry** (化学): Molecular visualization, structures
- **Motor Control** (电机控制): Servo systems, motors
- **Music** (音乐): Theory, notation
- **Tactile Sensing** (触觉传感): Research papers, experiments
- And more...

---

## 部署 / Deployment

### GitHub Pages (Frontend / 前端)

```bash
cd frontend
EXPORT=1 BASE_PATH=/repo-name pnpm build
```

Output in `frontend/out/`

输出在 `frontend/out/`

### Production (Full Stack / 全栈)

```bash
cd backend
./deploy.sh prod
```

---

## 开发协议 / Development Protocol

This project follows a 5-mode development protocol:

本项目遵循 5 模式开发流程：

1. **RESEARCH** - Information gathering / 信息收集
2. **INNOVATE** - Brainstorming solutions / 方案头脑风暴
3. **PLAN** - Technical specifications / 技术规范
4. **EXECUTE** - Implementation / 实现
5. **REVIEW** - Verification / 验证

---

## 许可证 / License

MIT License - See [LICENSE](LICENSE) for details.

---

**Built with** by [Zhengbi Yong](https://zhengbi-yong.github.io)

**Research Institution / 研究机构**: Beijing Institute of Technology (北京理工大学)

**Advisor / 导师**: Professor Shi Dawai (石大发教授)

For more information / 更多信息:
- Blog / 博客: https://zhengbi-yong.github.io
- GitHub / 代码仓库: https://github.com/zhengbi-yong/zhengbi-yong.github.io

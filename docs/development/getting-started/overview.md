# Project Overview / 项目概览

Welcome to zhengbi-yong.github.io! This document provides a high-level introduction to the project.

欢迎来到 zhengbi-yong.github.io！本文档提供项目的高层次介绍。

---

## 🎯 What is This Project? / 这是什么项目？

**zhengbi-yong.github.io** is a sophisticated personal technical blog platform featuring advanced interactive content.

**雍征彼的个人技术博客**是一个高级的个人技术博客平台，具有先进的交互式内容功能。

### Key Features / 核心特性

**Content Features / 内容功能:**
- 📝 **Advanced Blog System** - MDX-powered with Contentlayer2
- 🏷️ **Tag System** - Automatic tag generation and filtering
- 🔍 **Full-Text Search** - Kbar command palette integration
- 💬 **Comments** - Giscus integration (GitHub-based)
- 🌙 **Theme Support** - Dark/light mode with system preference detection

**Interactive Features / 交互功能:**
- 🎨 **Excalidraw** - Whiteboard drawing with export
- 🧪 **Chemistry** - 3D molecular visualization (3Dmol.js)
- 🎭 **3D Graphics** - Three.js with URDF support for robotics
- 🎵 **Music** - Sheet music display with Tone.js
- 📊 **Charts** - Multiple charting libraries (Nivo, ECharts, G2, G6)

**Technical Excellence / 技术优势:**
- ⚡ **Turbopack** - 5x faster builds than Webpack
- 🔄 **Offline Support** - Service Worker with caching
- 📱 **Responsive** - Mobile-first design
- ♿ **Accessible** - ARIA labels, keyboard navigation
- 🌍 **Internationalized** - i18next with auto-detection

---

## 🏗️ Technology Stack / 技术栈

### Frontend / 前端

| Category / 类别 | Technology / 技术 | Purpose / 用途 |
|-----------------|-------------------|--------------|
| **Framework** | Next.js 16.0 | React framework with App Router |
| **Language** | TypeScript 5.9 | Type-safe development |
| **Styling** | Tailwind CSS 4 | Utility-first CSS |
| **Content** | MDX + Contentlayer2 | Markdown with JSX |
| **UI Components** | Shadcn/ui | High-quality component library |
| **Admin** | Refine | Admin panel framework |
| **3D** | Three.js | 3D rendering |
| **Charts** | Nivo, ECharts | Data visualization |
| **State** | React Context + Hooks | State management |

### Backend / 后端

| Category / 类别 | Technology / 技术 | Purpose / 用途 |
|-----------------|-------------------|--------------|
| **Language** | Rust | Systems programming language |
| **Framework** | Axum 0.8 | Web framework |
| **Database** | PostgreSQL 17 | Relational database |
| **ORM** | SQLx 0.8 | Compile-time checked SQL |
| **Cache** | Redis 7 | In-memory data store |
| **Auth** | JWT | Token-based authentication |
| **API** | RESTful | Standard REST API |
| **Docs** | OpenAPI 3.0 | API documentation with Utoipa |
| **Async** | Tokio 1.42 | Async runtime |

### DevOps / 开发运维

| Category / 类别 | Technology / 技术 | Purpose / 用途 |
|-----------------|-------------------|--------------|
| **Container** | Docker | Containerization |
| **Orchestration** | Docker Compose | Multi-container setup |
| **Web Server** | Nginx 1.27 | Reverse proxy |
| **Monitoring** | Prometheus + Grafana | Metrics and dashboards |
| **CI/CD** | GitHub Actions | Continuous integration |

---

## 📁 Project Structure / 项目结构

### Monorepo Organization / Monorepo组织

```
zhengbi-yong.github.io/
├── frontend/              # Next.js 16 application
│   ├── app/              # App Router pages
│   ├── components/       # React components
│   ├── lib/              # Utilities and libraries
│   ├── data/blog/        # MDX blog posts
│   └── scripts/          # Build and dev scripts
│
├── backend/              # Rust API server
│   ├── crates/           # Modular crates
│   │   ├── api/          # HTTP API layer (Axum)
│   │   ├── core/         # Core business logic
│   │   ├── db/           # Database models and SQLx
│   │   └── shared/       # Shared utilities
│   ├── migrations/       # Database migrations
│   └── scripts/          # Dev and deployment scripts
│
├── docs/                 # Project documentation
│   ├── development/      # Developer docs (you are here!)
│   ├── getting-started/  # User guides
│   ├── guides/           # How-to guides
│   └── operations/       # Deployment and ops
│
├── deployments/          # Infrastructure
│   ├── docker/           # Docker configurations
│   └── nginx/            # Nginx configurations
│
├── scripts/              # Project-level scripts
│   ├── development/      # Dev automation
│   ├── deployment/       # Deployment scripts
│   └── backup/           # Backup scripts
│
└── monitoring/           # Observability
    ├── prometheus/       # Metrics configs
    └── grafana/          # Dashboard configs
```

### Frontend Structure / 前端结构

```
frontend/
├── app/                  # Next.js App Router
│   ├── blog/            # Blog pages
│   ├── admin/           # Admin panel
│   ├── api/             # API routes
│   └── (root pages)     # Home, about, etc.
│
├── components/           # React components
│   ├── blog/            # Blog-specific components
│   ├── auth/            # Authentication
│   ├── ui/              # UI components
│   └── layout/          # Layout components
│
├── lib/                 # Utilities
│   ├── api/             # API client
│   ├── cache/           # Cache managers
│   ├── error-handler/   # Error handling
│   └── utils/           # Helper functions
│
└── data/blog/           # MDX content
    ├── computer-science/
    ├── robotics/
    └── mathematics/
```

### Backend Structure / 后端结构

```
backend/
├── crates/              # Rust modules
│   ├── api/             # HTTP server (Axum)
│   │   ├── routes/      # API endpoints
│   │   ├── middleware/  # Auth, CORS, etc.
│   │   └── handlers/    # Request handlers
│   │
│   ├── core/            # Business logic
│   │   ├── auth/        # Authentication logic
│   │   ├── models/      # Domain models
│   │   └── services/    # Business services
│   │
│   ├── db/              # Database layer
│   │   ├── models/      # DB models
│   │   ├── schema/      # Type-safe queries
│   │   └── pool/        # Connection pool
│   │
│   └── shared/          # Shared code
│       ├── error/       # Error types
│       └── utils/       # Utilities
│
├── migrations/          # SQL migrations
│   └── *.sql           # Schema changes
│
└── scripts/             # Automation
    ├── development/    # Dev helpers
    ├── data/           # Data management
    └── deployment/     # Deploy scripts
```

---

## 🎨 Architecture Principles / 架构原则

### 1. Separation of Concerns / 关注点分离

**Frontend and Backend are decoupled** / **前端和后端解耦**
- Clear API contract (OpenAPI 3.0)
- Independent deployment
- Separate repositories in monorepo

### 2. Type Safety / 类型安全

**Compile-time guarantees** / **编译时保证**
- TypeScript strict mode (frontend)
- Rust type system (backend)
- SQLx compile-time checked queries

### 3. Performance First / 性能优先

**Optimized for speed** / **为速度优化**
- Turbopack for 5x faster builds
- Redis caching
- Database connection pooling
- Image optimization (WebP, AVIF)
- Code splitting and lazy loading

### 4. Developer Experience / 开发体验

**Excellent DX** / **卓越的开发体验**
- Hot reload in development
- Clear error messages
- Comprehensive documentation
- Automated tooling

### 5. Security by Design / 安全设计

**Security-first approach** / **安全优先方法**
- JWT with refresh tokens
- Argon2 password hashing
- Input validation and sanitization
- Rate limiting
- CORS protection

---

## 🔄 Data Flow / 数据流

### User Request Flow / 用户请求流程

```
┌─────────┐
│  User   │
└────┬────┘
     │
     │ HTTP Request
     ▼
┌─────────────────────────────────────────┐
│         Nginx (Reverse Proxy)          │
│         - SSL termination               │
│         - Static file serving          │
│         - Load balancing               │
└─────────────────────────────────────────┘
     │
     │ Proxy to Next.js (port 3000)
     ├─────────────────┬─────────────────┐
     ▼                 ▼
┌─────────┐     ┌─────────┐
│ Frontend│     │ Backend │
│(Next.js)│     │  (Axum) │
└────┬────┘     └────┬────┘
     │               │
     │ API Call      │
     │ (REST)        │
     ▼               │
┌───────────────────────────────┐
│      PostgreSQL Database       │
│      - Blog posts             │
│      - Users & auth           │
│      - Comments               │
└───────────────────────────────┘
     ▲
     │
┌─────────┐
│  Redis  │ (Cache)
└─────────┘
```

### Authentication Flow / 认证流程

```
User
  │
  │ 1. POST /v1/auth/login
  ▼
Frontend (Next.js)
  │
  │ 2. API call with credentials
  ▼
Backend (Axum)
  │
  │ 3. Verify password (Argon2)
  │ 4. Generate JWT access token
  │ 5. Store refresh token (HTTP-only cookie)
  ▼
Response: { access_token, user }
  │
  ▼
Frontend stores token (localStorage)
  │
  │ Subsequent requests include token
  ▼
Backend validates JWT
```

---

## 🚀 Deployment Architecture / 部署架构

### Production Setup / 生产环境

```
┌─────────────────┐
│   GitHub Pages   │ (Frontend static site)
│   (Public S3)    │
└─────────────────┘

OR

┌───────────────────────────────────────┐
│         VPS Server                    │
│                                         │
│  ┌─────────────────────────────────┐  │
│  │  Nginx (Reverse Proxy)          │  │
│  │  - SSL/TLS                      │  │
│  │  - Static file serving          │  │
│  │  - Proxy to frontend/backend    │  │
│  └─────────────────────────────────┘  │
│           │             │             │
│  ┌─────────────┐  ┌─────────────┐  │
│  │  Frontend   │  │  Backend    │  │
│  │  (Next.js)   │  │  (Rust/Axum)│  │
│  │  Port 3001   │  │  Port 3000   │  │
│  └─────────────┘  └─────────────┘  │
│         │              │            │
│  ┌─────────────┐  ┌─────────────┐ │
│  │ PostgreSQL  │  │   Redis     │ │
│  │   Port 5432  │  │   Port 6379  │ │
│  └─────────────┘  └─────────────┘ │
│                                     │
│  ┌─────────────────────────────┐  │
│  │  Prometheus + Grafana       │  │
│  │  (Monitoring)               │  │
│  └─────────────────────────────┘  │
└─────────────────────────────────────┘
```

---

## 🎯 Development Philosophy / 开发哲学

### Core Values / 核心价值观

1. **Quality First / 质量优先**
   - Code reviews mandatory
   - Comprehensive testing
   - Documentation required

2. **Performance Matters / 性能重要**
   - Core Web Vitals optimization
   - Efficient database queries
   - Caching strategies

3. **Security Always / 安全始终**
   - Security-first development
   - Regular audits
   - Vulnerability scanning

4. **Developer Experience / 开发体验**
   - Clear documentation
   - Automated tooling
   - Fast feedback loops

5. **Continuous Improvement / 持续改进**
   - Regular refactoring
   - Upgrading dependencies
   - Adopting best practices

---

## 📊 Project Statistics / 项目统计

### Codebase Metrics / 代码库指标

| Metric / 指标 | Value / 数值 |
|-------------|-------------|
| **Frontend** | |
| TypeScript Files | 500+ |
| Components | 100+ |
| Blog Posts | 50+ |
| **Backend** | |
| Rust Files | 200+ |
| API Endpoints | 40+ |
| Database Tables | 10+ |
| **Infrastructure** | |
| Docker Services | 4 (postgres, redis, frontend, backend) |
| Nginx Configs | 3 |
| Monitoring Metrics | 50+ |

### Documentation / 文档

| Category / 类别 | Count / 数量 |
|----------------|-------------|
| Development Docs | 30+ files |
| User Guides | 20+ files |
| API Docs | Complete (OpenAPI) |
| Architecture Docs | Comprehensive |

---

## 🎓 Learning Resources / 学习资源

### For New Developers / 新开发者

**Start Here / 从这里开始:**
1. [Quick Start](../quick-start.md) ⭐⭐⭐⭐⭐
2. [Project Structure](project-structure.md) ⭐⭐⭐⭐
3. [Development Environment](development-environment.md) ⭐⭐⭐
4. [Workflow](workflow.md) ⭐⭐⭐⭐

### Understanding Architecture / 理解架构

**Essential Reading / 必读:**
1. [Architecture Overview](../concepts/architecture.md) ⭐⭐⭐⭐⭐
2. [Frontend Architecture](../concepts/frontend-architecture.md) ⭐⭐⭐⭐⭐
3. [Backend Architecture](../concepts/backend-architecture.md) ⭐⭐⭐⭐⭐
4. [Data Flow](../concepts/data-flow.md) ⭐⭐⭐⭐

### Development Guides / 开发指南

**Choose Your Path / 选择你的路径:**
- **Frontend**: [Frontend Development Guides](../guides/frontend-development/)
- **Backend**: [Backend Development Guides](../guides/backend-development/)
- **Full-Stack**: Both paths

### Standards / 标准

**Must Follow / 必须遵循:**
1. [Naming Conventions](../best-practices/naming-conventions.md) ⭐⭐⭐⭐⭐
2. [File Organization](../best-practices/file-organization.md) ⭐⭐⭐⭐⭐
3. [Security Practices](../best-practices/security-practices.md) ⭐⭐⭐⭐⭐
4. [Code Style](../best-practices/code-style.md) ⭐⭐⭐⭐

---

## 🛠️ Getting Started / 快速开始

### Prerequisites / 先决条件

**Required / 必需:**
- Git
- Docker & Docker Compose
- Node.js 20+ & pnpm
- Rust 1.70+ & Cargo

**Recommended / 推荐:**
- VSCode with Rust/TypeScript extensions
- Postman (for API testing)

### Quick Setup / 快速设置

```bash
# 1. Clone repository
git clone https://github.com/zhengbi-yong/zhengbi-yong.github.io.git
cd zhengbi-yong.github.io

# 2. Start databases
docker compose up -d postgres redis

# 3. Setup backend
cd backend
sqlx database create
sqlx migrate run

# 4. Start backend (in terminal 1)
cd backend
cargo run

# 5. Start frontend (in terminal 2)
cd frontend
pnpm install
pnpm dev
```

**Access / 访问:**
- Frontend: http://localhost:3000
- Backend API: http://localhost:3000/api
- Swagger UI: http://localhost:3000/swagger-ui

**Full Setup Guide / 完整设置指南:**
- [Quick Start](../quick-start.md) - 5-minute setup
- [Development Environment](development-environment.md) - Detailed IDE setup

---

## 🤝 Contributing / 贡献

### First Time Contributors / 首次贡献者

**Steps / 步骤:**
1. Read [Best Practices Overview](../best-practices/overview.md)
2. Choose a task (bug fix, feature, docs)
3. Follow [Development Workflow](workflow.md)
4. Write tests
5. Submit pull request

### Code Review Process / 代码审查流程

**What We Check / 我们检查的内容:**
- [ ] Follows [Naming Conventions](../best-practices/naming-conventions.md)
- [ ] Follows [File Organization](../best-practices/file-organization.md)
- [ ] Follows [Security Practices](../best-practices/security-practices.md)
- [ ] Tests included
- [ ] Documentation updated
- [ ] No `any` types or `unwrap()`

---

## 📞 Getting Help / 获取帮助

### Documentation / 文档

- [Developer Guide README](../README.md) - Full documentation index
- [Troubleshooting](../operations/troubleshooting.md) - Common issues
- [FAQ](../../README.md) - Frequently asked questions

### External Resources / 外部资源

- [Next.js Docs](https://nextjs.org/docs)
- [Rust Book](https://doc.rust-lang.org/book/)
- [Axum Docs](https://docs.rs/axum/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

---

## 🎉 What's Next? / 接下来做什么？

### For Learning / 学习

1. **Explore Architecture** / 探索架构
   - [Architecture Overview](../concepts/architecture.md)
   - [Frontend Architecture](../concepts/frontend-architecture.md)
   - [Backend Architecture](../concepts/backend-architecture.md)

2. **Learn Standards** / 学习标准
   - [Best Practices Overview](../best-practices/overview.md)
   - [Naming Conventions](../best-practices/naming-conventions.md)
   - [File Organization](../best-practices/file-organization.md)

3. **Start Developing** / 开始开发
   - [Frontend Guides](../guides/frontend-development/)
   - [Backend Guides](../guides/backend-development/)

### For Contributing / 贡献

1. **Pick a Task** / 选择任务
   - Fix a bug
   - Add a feature
   - Improve docs
   - Write tests

2. **Follow Workflow** / 遵循工作流
   - [Development Workflow](workflow.md)
   - Create branch
   - Make changes
   - Submit PR

---

**Welcome aboard! / 欢迎加入！** 🚀

We're glad to have you! / 很高兴有你加入！

---

**Version**: 2.0 (World-Class Developer Guide)
**Last Updated**: 2026-01-01
**Maintained By**: Development Team

🤖 Generated with [Claude Code](https://claude.com/claude-code)

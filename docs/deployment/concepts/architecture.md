# Architecture Overview / 架构概览

Understanding the system architecture, components, and data flow of the blog platform.
/ 理解博客平台的系统架构、组件和数据流。

---

## 📋 Overview / 概述

**zhengbi-yong.github.io** is a modern, decoupled web application following a microservices architecture pattern.

**zhengbi-yong.github.io** 是一个现代化的、解耦的Web应用程序，遵循微服务架构模式。

### Key Architectural Principles / 核心架构原则

1. **Separation of Concerns / 关注点分离**
   - Frontend and backend are completely decoupled / 前端和后端完全解耦
   - Clear API contract (RESTful) / 清晰的API契约（RESTful）
   - Independent deployment and scaling / 独立部署和扩展

2. **Type Safety / 类型安全**
   - TypeScript (Frontend) + Rust (Backend) / 前端TypeScript + 后端Rust
   - Compile-time guarantees / 编译时保证
   - SQLx for type-safe database queries / SQLx提供类型安全的数据库查询

3. **Performance First / 性能优先**
   - Redis caching layer / Redis缓存层
   - Connection pooling / 连接池
   - Static file optimization / 静态文件优化
   - Code splitting / 代码分割

4. **Security by Design / 安全设计**
   - JWT authentication / JWT认证
   - Argon2 password hashing / Argon2密码哈希
   - CORS protection / CORS保护
   - Rate limiting / 速率限制

---

## 🏗️ System Architecture / 系统架构

### High-Level Architecture Diagram / 高层架构图

```
┌─────────────────────────────────────────────────────────────────┐
│                         Browser / 浏览器                          │
│                    (Web Browser / Mobile)                        │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             │ HTTPS Request
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Nginx (Reverse Proxy)                         │
│                    - SSL/TLS Termination                         │
│                    - Static File Serving                         │
│                    - Load Balancing                              │
│                    - Request Routing                             │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ├─────────────────┬─────────────────┐
                             │                 │                 │
                             ▼                 ▼                 ▼
                    ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
                    │   Frontend   │  │   Backend    │  │   Static     │
                    │   (Next.js)  │  │   (Axum)     │  │   Files      │
                    │   Port 3001  │  │   Port 3000  │  │   (Public/)  │
                    └──────┬───────┘  └──────┬───────┘  └──────────────┘
                           │                  │
                           │    API Call      │
                           │    (REST)        │
                           ▼                  │
                    ┌──────────────┐          │
                    │     Redis    │◄─────────┤ Cache
                    │   Port 6379  │          │
                    └──────────────┘          │
                                             ▼
                                  ┌──────────────────┐
                                  │   PostgreSQL     │
                                  │   Port 5432      │
                                  │   - Blog posts   │
                                  │   - Users        │
                                  │   - Comments     │
                                  └──────────────────┘
```

### Component Interaction Flow / 组件交互流程

```
User Request → Nginx → Frontend (Next.js)
                      ↓
                 Backend API (Axum)
                      ↓
                 ┌────┴────┐
                 │         │
            PostgreSQL   Redis
            (Database)  (Cache)
```

---

## 🔧 Component Details / 组件详情

### 1. Frontend (Next.js) / 前端

**Technology Stack / 技术栈**:
- **Framework**: Next.js 16.0 (App Router)
- **Language**: TypeScript 5.9
- **Styling**: Tailwind CSS 4
- **UI Components**: Shadcn/ui
- **State Management**: React Context + Hooks
- **Content**: MDX + Contentlayer2

**Responsibilities / 职责**:
- ✅ User interface rendering / 用户界面渲染
- ✅ Client-side routing / 客户端路由
- ✅ SEO optimization / SEO优化
- ✅ Static content generation / 静态内容生成
- ✅ API communication / API通信
- ✅ State management / 状态管理

**Key Features / 核心特性**:
- Server-side rendering (SSR) / 服务端渲染
- Static site generation (SSG) / 静态站点生成
- Incremental static regeneration (ISR) / 增量静态再生成
- Image optimization / 图片优化
- Code splitting / 代码分割

**Port / 端口**: 3001

### 2. Backend (Axum/Rust) / 后端

**Technology Stack / 技术栈**:
- **Language**: Rust
- **Framework**: Axum 0.8
- **Database**: PostgreSQL 17 via SQLx 0.8
- **Cache**: Redis 7
- **Auth**: JWT (JSON Web Tokens)
- **Async Runtime**: Tokio 1.42
- **API Documentation**: OpenAPI 3.0 (Utoipa)

**Responsibilities / 职责**:
- ✅ RESTful API endpoints / RESTful API端点
- ✅ Business logic / 业务逻辑
- ✅ Authentication & authorization / 认证和授权
- ✅ Data validation / 数据验证
- ✅ Database operations / 数据库操作
- ✅ Caching logic / 缓存逻辑

**API Endpoints / API端点** (40+ endpoints):
- `/v1/auth/*` - Authentication / 认证
- `/v1/blog/*` - Blog posts / 博客文章
- `/v1/users/*` - User management / 用户管理
- `/v1/admin/*` - Admin operations / 管理操作
- `/swagger-ui` - API documentation / API文档

**Port / 端口**: 3000 (internal / 内部)

### 3. PostgreSQL Database / 数据库

**Version**: PostgreSQL 17

**Responsibilities / 职责**:
- ✅ Persistent data storage / 持久化数据存储
- ✅ Relational data management / 关系数据管理
- ✅ ACID transactions / ACID事务
- ✅ Data integrity / 数据完整性

**Data Tables / 数据表** (10+ tables):

| Table / 表 | Purpose / 用途 |
|-----------|--------------|
| `users` | User accounts / 用户账户 |
| `posts` | Blog posts / 博客文章 |
| `comments` | Post comments / 文章评论 |
| `tags` | Post tags / 文章标签 |
| `post_tags` | Post-tag relationships / 文章标签关系 |
| `sessions` | User sessions / 用户会话 |
| `refresh_tokens` | JWT refresh tokens / JWT刷新令牌 |
| `admin_logs` | Admin audit logs / 管理员审计日志 |
| `cache_metadata` | Cache tracking / 缓存跟踪 |
| `migrations` | Schema migrations / 模式迁移 |

**Key Features / 核心特性**:
- Foreign key constraints / 外键约束
- Indexes for performance / 性能索引
- JSONB support for flexible data / JSONB支持灵活数据
- Full-text search capabilities / 全文搜索功能

**Port / 端口**: 5432 (internal / 内部)

### 4. Redis Cache / 缓存

**Version**: Redis 7

**Responsibilities / 职责**:
- ✅ Caching frequently accessed data / 缓存频繁访问的数据
- ✅ Session storage / 会话存储
- ✅ Rate limiting / 速率限制
- ✅ Real-time data / 实时数据

**Cache Strategies / 缓存策略**:

| Data Type / 数据类型 | TTL | Strategy / 策略 |
|--------------------|-----|----------------|-----------------|
| Blog posts / 博客文章 | 1 hour / 1小时 | Cache-aside / 旁路缓存 |
| User sessions / 用户会话 | 7 days / 7天 | Write-through / 写透缓存 |
| API responses / API响应 | 5-15 min / 5-15分钟 | Cache-aside / 旁路缓存 |
| Rate limit counters / 速率限制计数器 | 1 min / 1分钟 | Sliding window / 滑动窗口 |

**Key Features / 核心特性**:
- In-memory storage / 内存存储
- Pub/Sub for real-time features / 发布订阅实时功能
- Data expiration policies / 数据过期策略
- Persistence options / 持久化选项

**Port / 端口**: 6379 (internal / 内部)

### 5. Nginx (Web Server) / Web服务器

**Version**: Nginx 1.27

**Responsibilities / 职责**:
- ✅ Reverse proxy / 反向代理
- ✅ SSL/TLS termination / SSL/TLS终结
- ✅ Load balancing / 负载均衡
- ✅ Static file serving / 静态文件服务
- ✅ Request routing / 请求路由
- ✅ Compression (gzip) / 压缩
- ✅ Security headers / 安全头

**Key Configuration / 关键配置**:

```nginx
# Frontend proxy
location / {
    proxy_pass http://frontend:3001;
    proxy_http_version 1.1;
    # Headers...
}

# Backend API proxy
location /api/ {
    proxy_pass http://backend:3000;
    # Headers...
}

# Static files
location /static/ {
    root /var/www/public;
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```

**Port / 端口**: 80 (HTTP), 443 (HTTPS)

---

## 🔄 Data Flow / 数据流

### 1. User Authentication Flow / 用户认证流程

```
User                    Frontend              Backend              PostgreSQL
 │                       │                      │                      │
 │ POST /login           │                      │                      │
 ├──────────────────────►│                      │                      │
 │                       │ POST /api/v1/auth/login                      │
 │                       ├─────────────────────►│                      │
 │                       │                      │ Verify password      │
 │                       │                      │ (Argon2)             │
 │                       │                      ├─────────────────────►│
 │                       │                      │ Query user           │
 │                       │                      │◄─────────────────────┤
 │                       │                      │                      │
 │                       │                      │ Generate JWT         │
 │                       │                      │ Store refresh token  │
 │                       │                      ├─────────────────────►│
 │                       │◄─────────────────────┤                      │
 │ {access_token, user}  │                      │                      │
 │◄──────────────────────┤                      │                      │
 │                       │                      │                      │
 │ Store token           │                      │                      │
 │ (localStorage)        │                      │                      │
```

### 2. Blog Post Request Flow / 博客文章请求流程

```
User                    Frontend              Backend              PostgreSQL    Redis
 │                       │                      │                      │           │
 │ GET /blog/[slug]      │                      │                      │           │
 ├──────────────────────►│                      │                      │           │
 │                       │ Check cache          │                      │           │
 │                       ├─────────────────────►│                      │           │
 │                       │                      │ Check Redis cache    │           │
 │                       │                      ├─────────────────────►│           │
 │                       │                      │◄─────────────────────┤           │
 │                       │                      │                      │           │
 │               Cache HIT?                    │           (or MISS)    │           │
 │                       │                      │                      │           │
 │                If MISS:                      │                      │           │
 │                       │                      │ Query DB             │           │
 │                       │                      ├─────────────────────►│           │
 │                       │                      │◄─────────────────────┤           │
 │                       │                      │                      │           │
 │                       │                      │ Store in cache       │           │
 │                       │                      ├─────────────────────────────────►│
 │                       │◄─────────────────────┤                      │           │
 │ Blog post data        │                      │                      │           │
 │◄──────────────────────┤                      │                      │           │
 │                       │                      │                      │           │
 │ Render page           │                      │                      │           │
```

### 3. Create Blog Post Flow / 创建博客文章流程

```
Admin                   Frontend              Backend              PostgreSQL
 │                       │                      │                      │
 │ POST /blog/create     │                      │                      │
 ├──────────────────────►│                      │                      │
 │                       │ POST /api/v1/blog    │                      │
 │                       │ (with auth token)    │                      │
 │                       ├─────────────────────►│                      │
 │                       │                      │ Validate JWT         │
 │                       │                      │ Validate input       │
 │                       │                      ├─────────────────────►│
 │                       │                      │ Insert post          │
 │                       │                      │◄─────────────────────┤
 │                       │                      │                      │
 │                       │                      │ Invalidate cache     │
 │                       │                      │ (Redis)              │
 │                       │◄─────────────────────┤                      │
 │ {post}                │                      │                      │
 │◄──────────────────────┤                      │                      │
```

---

## 🌐 Network Architecture / 网络架构

### Docker Network / Docker网络

```
┌──────────────────────────────────────────────────────────┐
│              Docker Network: "zhengbi-yong_default"      │
│                                                           │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐      │
│  │  frontend   │  │   backend   │  │    nginx    │      │
│  │  :3000      │  │  :3000      │  │    :80      │      │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘      │
│         │                │                │              │
│         └────────────────┴────────────────┘              │
│                          │                               │
│                  ┌───────┴───────┐                       │
│                  │               │                       │
│         ┌────────┴────────┐ ┌───┴─────────┐             │
│         │   PostgreSQL   │ │    Redis    │             │
│         │     :5432      │ │    :6379    │             │
│         └─────────────────┘ └─────────────┘             │
└──────────────────────────────────────────────────────────┘
                           │
                           │ Port 80/443
                           ▼
                   ┌──────────────┐
                   │   Internet   │
                   └──────────────┘
```

### Port Mapping / 端口映射

| Service / 服务 | Internal Port / 内部端口 | External Port / 外部端口 | Purpose / 用途 |
|---------------|----------------------|----------------------|--------------|
| **Nginx** | 80, 443 | 80, 443 | Public access / 公网访问 |
| **Frontend** | 3000 | 3001 (optional) | Direct access (dev) / 直接访问（开发） |
| **Backend** | 3000 | 3000 (optional) | API access (dev) / API访问（开发） |
| **PostgreSQL** | 5432 | None (internal) / 无（内部） | Database / 数据库 |
| **Redis** | 6379 | None (internal) / 无（内部） | Cache / 缓存 |

---

## 🚀 Deployment Architecture Patterns / 部署架构模式

### Pattern 1: Single Server Deployment / 单服务器部署

```
┌─────────────────────────────────────┐
│         Single VPS Server           │
│                                     │
│  ┌─────────────────────────────┐   │
│  │  Nginx (Proxy + SSL)        │   │
│  └────────┬──────────────┬─────┘   │
│           │              │          │
│      ┌────┴────┐    ┌────┴────┐    │
│      │Frontend │    │Backend  │    │
│      └────┬────┘    └────┬────┘    │
│           │              │          │
│      ┌────┴──────┐ ┌────┴──────┐   │
│      │PostgreSQL│ │  Redis   │   │
│      └───────────┘ └───────────┘   │
└─────────────────────────────────────┘
```

**Resources**: 2-4GB RAM, 20-40GB disk
**Use Case**: Personal blogs, small projects / 个人博客、小型项目

### Pattern 2: Production Server Deployment / 生产服务器部署

```
┌─────────────────────────────────────┐
│      Production VPS Server          │
│                                     │
│  ┌─────────────────────────────┐   │
│  │  Nginx (SSL + Cache)        │   │
│  └────────┬──────────────┬─────┘   │
│           │              │          │
│      ┌────┴────┐    ┌────┴────┐    │
│      │Frontend │    │Backend  │    │
│      │(SSR+SSG)│    │(Scaled) │    │
│      └────┬────┘    └────┬────┘    │
│           │              │          │
│      ┌────┴──────┐ ┌────┴──────┐   │
│      │PostgreSQL│ │  Redis   │   │
│      │(Tuned)   │ │(Persist.)│   │
│      └───────────┘ └───────────┘   │
│                                     │
│  ┌─────────────────────────────┐   │
│  │  Prometheus + Grafana       │   │
│  └─────────────────────────────┘   │
└─────────────────────────────────────┘
```

**Resources**: 4-8GB RAM, 40GB+ disk
**Use Case**: Production blogs, growing sites / 生产博客、成长中站点

### Pattern 3: High Availability Deployment / 高可用部署

```
┌─────────────────────────────────────────────────────────┐
│                  Load Balancer                          │
└────────────┬────────────────────────────┬───────────────┘
             │                            │
      ┌──────┴───────┐           ┌───────┴────────┐
      │   Server 1   │           │    Server 2    │
      │              │           │                │
      │  ┌─────────┐ │           │  ┌───────────┐ │
      │  │Frontend │ │           │  │ Frontend  │ │
      │  └────┬────┘ │           │  └────┬──────┘ │
      │       │      │           │       │         │
      │  ┌────┴────┐ │           │  ┌────┴──────┐ │
      │  │Backend  │ │           │  │ Backend   │ │
      │  └────┬────┘ │           │  └────┬──────┘ │
      │       │      │           │       │         │
      │  ┌────┴──────┴──────┐    │  ┌───┴──────────┤
      │  │   PostgreSQL     │◄───┼──┤   PostgreSQL │
      │  │   (Primary)      │    │  │   (Replica)  │
      │  └──────────────────┘    │  └──────────────┘
      └─────────────────────────┴───────────────────┘
                       │
                ┌──────┴───────┐
                │   Shared     │
                │   Redis      │
                │   Cluster    │
                └──────────────┘
```

**Resources**: Multiple servers, 8GB+ RAM each
**Use Case**: Enterprise, high-traffic sites / 企业级、高流量站点

---

## 🔐 Security Architecture / 安全架构

### Authentication Flow / 认证流程

```
┌──────────────────────────────────────────────────────────┐
│                   Authentication Layer                    │
│                                                           │
│  1. User submits credentials                              │
│     ↓                                                     │
│  2. Backend verifies password (Argon2)                    │
│     ↓                                                     │
│  3. Generate JWT access token (15 min expiry)            │
│     ↓                                                     │
│  4. Generate refresh token (7 day expiry)                │
│     ↓                                                     │
│  5. Store refresh token in DB (HTTP-only cookie)         │
│     ↓                                                     │
│  6. Return access token to frontend                      │
│     ↓                                                     │
│  7. Frontend stores access token (localStorage)          │
│     ↓                                                     │
│  8. Subsequent requests include access token             │
└──────────────────────────────────────────────────────────┘
```

### Security Layers / 安全层次

```
┌─────────────────────────────────────────────┐
│  Layer 1: Nginx                             │
│  - SSL/TLS encryption                       │
│  - Rate limiting                            │
│  - IP whitelisting (optional)               │
└────────────────┬────────────────────────────┘
                 │
┌────────────────┴────────────────────────────┐
│  Layer 2: Backend (Axum)                    │
│  - CORS validation                          │
│  - JWT authentication                       │
│  - Input validation                         │
│  - Rate limiting (Redis)                    │
└────────────────┬────────────────────────────┘
                 │
┌────────────────┴────────────────────────────┐
│  Layer 3: Database (PostgreSQL)             │
│  - User permissions                         │
│  - SQL injection prevention (SQLx)          │
│  - Data encryption at rest                  │
└─────────────────────────────────────────────┘
```

---

## 📊 Scalability Architecture / 扩展性架构

### Vertical Scaling / 垂直扩展

```
Server Resources Upgrade:
2GB RAM → 4GB RAM → 8GB RAM
1 CPU → 2 CPU → 4 CPU

Benefits / 优点:
✅ Simple to implement / 实施简单
✅ No architecture changes / 无需架构变更
✅ Immediate performance boost / 即时性能提升

Trade-offs / 权衡:
❌ Upper limit exists / 存在上限
❌ Single point of failure / 单点故障
❌ Cost increases linearly / 成本线性增加
```

### Horizontal Scaling / 水平扩展

```
┌──────────┐  ┌──────────┐  ┌──────────┐
│ Server 1 │  │ Server 2 │  │ Server 3 │
│          │  │          │  │          │
│ 2GB RAM  │  │ 2GB RAM  │  │ 2GB RAM  │
└──────────┘  └──────────┘  └──────────┘
     │             │             │
     └─────────────┴─────────────┘
                   │
            ┌──────┴──────┐
            │   Load      │
            │  Balancer   │
            └─────────────┘

Benefits / 优点:
✅ No theoretical limit / 无理论上限
✅ Better fault tolerance / 更好的容错性
✅ Flexible scaling / 灵活扩展

Trade-offs / 权衡:
❌ Complex setup / 设置复杂
❌ Session management complexity / 会话管理复杂
❌ Database replication required / 需要数据库复制
```

---

## 🎯 Technology Selection Rationale / 技术选型理由

### Why Next.js? / 为什么选择Next.js？

- ✅ Server-side rendering for SEO / 服务端渲染优化SEO
- ✅ Static site generation for performance / 静态站点生成提升性能
- ✅ File-based routing / 基于文件的路由
- ✅ API routes for backend / API路由支持后端
- ✅ Great TypeScript support / 出色的TypeScript支持
- ✅ Large community / 大型社区

### Why Rust/Axum? / 为什么选择Rust/Axum？

- ✅ Memory safety / 内存安全
- ✅ High performance / 高性能
- ✅ Strong type system / 强类型系统
- ✅ Modern async ecosystem / 现代异步生态系统
- ✅ Compile-time guarantees / 编译时保证
- ✅ Fearless concurrency / 无并发恐惧

### Why PostgreSQL? / 为什么选择PostgreSQL？

- ✅ ACID compliance / ACID合规
- ✅ Advanced features (JSONB, full-text search) / 高级特性（JSONB、全文搜索）
- ✅ Reliability and stability / 可靠性和稳定性
- ✅ Excellent scalability / 出色的扩展性
- ✅ Open source / 开源

### Why Redis? / 为什么选择Redis？

- ✅ In-memory performance / 内存级性能
- ✅ Versatile data structures / 多样的数据结构
- ✅ Pub/Sub capabilities / 发布订阅功能
- ✅ Expiration mechanisms / 过期机制
- ✅ Proven stability / 经过验证的稳定性

---

## 📖 Further Reading / 延伸阅读

### Architecture Deep Dives / 架构深入

- [Deployment Options](./deployment-options.md) - All deployment methods compared
- [Docker Architecture](./docker-architecture.md) - Docker patterns
- [Frontend Architecture](../../development/concepts/frontend-architecture.md) - Frontend details
- [Backend Architecture](../../development/concepts/backend-architecture.md) - Backend details

### Deployment Guides / 部署指南

- [Local Development](../guides/docker/local-development.md) - Development setup
- [Production Server](../guides/server/production-server.md) - Production deployment
- [High Availability](../guides/server/high-availability.md) - Enterprise deployment

### Best Practices / 最佳实践

- [Security Best Practices](../best-practices/security.md) - Security hardening
- [Monitoring](../best-practices/monitoring.md) - Production monitoring
- [Scaling Strategy](../best-practices/scaling.md) - Scaling approaches

---

## ❓ Common Questions / 常见问题

### Q: Why decouple frontend and backend? / 为什么前后端解耦？

**A / 答**:
- Independent deployment and scaling / 独立部署和扩展
- Clear separation of concerns / 清晰的关注点分离
- Flexibility in technology choices / 技术选择的灵活性
- Better frontend performance (SSR + SSG) / 更好的前端性能
- Easier to maintain and test / 更易于维护和测试

### Q: Can I deploy without Docker? / 可以不用Docker部署吗？

**A / 答**: Technically yes, but not recommended. Docker provides / 技术上可以，但不推荐。Docker提供：
- Consistent environments / 一致的环境
- Easy deployment / 简化部署
- Isolation / 隔离性
- Scalability / 可扩展性

See [Choosing Your Approach](../getting-started/choosing-your-approach.md) for alternatives.

### Q: What's the minimum server requirement? / 最低服务器要求？

**A / 答**:
- **Minimum**: 2GB RAM, 20GB disk (see [Low Resource Guide](../guides/low-resource/quick-start.md))
- **Recommended**: 4-8GB RAM, 40GB disk (production)
- **Enterprise**: Multiple servers, 8GB+ each

---

**Version**: 2.0 (World-Class Deployment Documentation)
**Last Updated**: 2026-01-01
**Maintained By**: Deployment Team

🤖 Generated with [Claude Code](https://claude.com/claude-code)

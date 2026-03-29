# 组件快速参考

项目所有重要组件的快速参考指南。

## 📖 目录

- [前端页面](#前端页面)
- [后端服务](#后端服务)
- [管理功能](#管理功能)
- [核心系统](#核心系统)

---

## 前端页面

### 博客系统

| 组件 | 路径 | 文件位置 | 功能 |
|------|------|----------|------|
| 博客首页 | `/blog` | `app/blog/page.tsx` | 显示所有文章列表 |
| 文章详情 | `/blog/[...slug]` | `app/blog/[...slug]/page.tsx` | 显示文章内容 |
| 分类页面 | `/blog/category/[cat]` | `app/blog/category/[category]/page.tsx` | 按分类筛选 |
| 标签页面 | `/tags/[tag]` | `app/tags/[tag]/page.tsx` | 按标签筛选 |
| 热门文章 | `/blog/popular` | `app/blog/popular/page.tsx` | 热门文章排行 |

**关键组件**:
- `PostLayout` - 完整布局（含目录、作者信息）
- `PostSimple` - 简洁布局
- `PostBanner` - 横幅布局
- `BlogCard` - 文章卡片

### 交互式页面

| 页面 | 路径 | 功能 |
|------|------|------|
| Excalidraw | `/excalidraw` | 在线白板绘图 |
| 音乐播放 | `/music/[name]` | 乐谱显示和播放 |
| 分析页面 | `/analytics` | 网站分析数据 |
| 访客统计 | `/visitors` | 访客地图和统计 |
| 项目展示 | `/projects` | 项目作品集 |

### 管理后台

| 页面 | 路径 | 功能 |
|------|------|------|
| 仪表板 | `/admin` | 系统概览和统计 |
| 用户管理 | `/admin/users` | 管理用户和角色 |
| 评论审核 | `/admin/comments` | 审核和管理评论 |
| 系统设置 | `/admin/settings` | 系统配置 |
| Refine 管理 | `/admin/users-refine` | 高级用户管理（Refine） |

---

## 后端服务

### API 路由

| 路由组 | 前缀 | 文件位置 | 功能 |
|--------|------|----------|------|
| 认证 | `/v1/auth` | `routes/auth.rs` | 注册、登录、登出、刷新令牌 |
| 评论 | `/v1/comments` | `routes/comments.rs` | 评论 CRUD、点赞 |
| 文章 | `/v1/posts` | `routes/posts.rs` | 文章统计、浏览记录 |
| 管理员 | `/admin` | `routes/admin.rs` | 用户管理、评论审核 |
| 系统 | `/` | `main.rs` | 健康检查、指标 |

### 重要端点

#### 认证端点

```bash
# 用户注册
POST /v1/auth/register
Body: { "email": "user@example.com", "password": "password" }

# 用户登录
POST /v1/auth/login
Body: { "email": "user@example.com", "password": "password" }

# 刷新令牌
POST /v1/auth/refresh
Cookie: refresh_token=...

# 用户登出
POST /v1/auth/logout

# 获取当前用户
GET /v1/auth/me
Header: Authorization: Bearer <access_token>
```

#### 评论端点

```bash
# 获取评论列表
GET /v1/posts/{slug}/comments

# 创建评论
POST /v1/posts/{slug}/comments
Body: { "author_name": "Name", "content": "Comment" }

# 点赞评论
POST /v1/comments/{id}/like

# 审核评论（管理员）
PUT /admin/comments/{id}/status
Body: { "status": "approved" }
```

#### 管理员端点

```bash
# 获取统计数据
GET /admin/stats

# 用户管理
GET /admin/users
PUT /admin/users/{id}/role
Body: { "role": "admin" }

# 评论管理
GET /admin/comments?status=pending
PUT /admin/comments/{id}/approve
DELETE /admin/comments/{id}
```

### 中间件

| 中间件 | 功能 | 配置 |
|--------|------|------|
| `auth` | JWT 验证 | 自动验证 Authorization header |
| `rate_limit` | 速率限制 | 默认 60 请求/分钟 |
| `CORS` | 跨域支持 | 允许的源配置 |
| `Logger` | 请求日志 | 自动记录所有请求 |

---

## 管理功能

### RBAC 权限系统

**角色定义**:

| 角色 | 权限范围 | 可以访问 |
|------|----------|----------|
| `user` | 普通用户 | 发表评论、点赞文章 |
| `moderator` | 版主 | 审核评论、查看统计 |
| `admin` | 管理员 | 所有功能，包括用户管理 |

**权限验证流程**:
```
用户请求 → 提取 JWT Token → 验证 Token → 获取用户角色
    ↓
检查所需权限
    ↓
权限足够 → 允许访问
权限不足 → 返回 403 Forbidden
```

### 管理功能模块

#### 用户管理

**功能**:
- 查看所有用户列表
- 修改用户角色
- 禁用/启用账户
- 查看用户活动记录

**API**:
```bash
# 获取用户列表
GET /admin/users?page=1&limit=20

# 更新用户角色
PUT /admin/users/{user_id}/role
Body: { "role": "moderator" }

# 禁用用户
PUT /admin/users/{user_id}/disable
```

#### 评论管理

**功能**:
- 查看待审核评论
- 批准/拒绝评论
- 标记垃圾评论
- 删除评论

**评论状态**:
- `pending` - 待审核（默认）
- `approved` - 已批准
- `rejected` - 已拒绝
- `spam` - 垃圾评论
- `deleted` - 已删除

**API**:
```bash
# 获取待审核评论
GET /admin/comments?status=pending

# 批准评论
PUT /admin/comments/{comment_id}/approve

# 拒绝评论
PUT /admin/comments/{comment_id}/reject

# 标记垃圾评论
PUT /admin/comments/{comment_id}/spam
```

---

## 核心系统

### 认证系统

#### 双 Token 机制

**Token 对比**:

| 特性 | Access Token | Refresh Token |
|------|--------------|---------------|
| 有效期 | 15 分钟 | 7 天 |
| 存储 | 内存（Zustand） | HTTP-only Cookie |
| 用途 | API 认证 | 刷新 Access Token |
| 安全性 | 较高 | 高（防 CSRF） |

**认证流程**:
```
1. 用户登录 → 验证用户名密码
2. 生成 Access Token (15分钟) + Refresh Token (7天)
3. Access Token 存储在前端内存
4. Refresh Token 存储在 HTTP-only Cookie
5. API 请求携带 Access Token
6. Token 过期 → 自动使用 Refresh Token 刷新
```

#### 前端状态管理

**位置**: `frontend/core/auth/store.ts`

**状态结构**:
```typescript
{
  user: User | null
  accessToken: string | null
  isAuthenticated: boolean
  login(email, password)  // 登录
  logout()                // 登出
  refresh()               // 刷新令牌
}
```

**使用示例**:
```typescript
import { useAuthStore } from '@/core/auth/store'

function MyComponent() {
  const { user, login, logout } = useAuthStore()

  return (
    <div>
      {user ? (
        <p>Welcome, {user.email}</p>
      ) : (
        <button onClick={() => login('email', 'pass')}>
          Login
        </button>
      )}
    </div>
  )
}
```

#### 后端认证服务

**位置**: `backend/crates/core/src/auth.rs`

**主要功能**:

| 功能 | 方法 | 说明 |
|------|------|------|
| 密码哈希 | `hash_password()` | 使用 Argon2 算法 |
| 密码验证 | `verify_password()` | 验证密码哈希 |
| 生成 JWT | `generate_access_token()` | 生成 JWT Token |
| 验证 JWT | `verify_token()` | 验证并解析 Token |
| 刷新令牌 | `refresh_access_token()` | 使用 Refresh Token 刷新 |

**安全特性**:
- Argon2 密码哈希（抗 GPU 破解）
- JWT 签名验证
- Token 过期检查
- CSRF 保护（SameSite Cookie）

---

### 评论系统

#### 双评论模式

**Giscus**（GitHub Discussions）:
- **配置**: `NEXT_PUBLIC_GISCUS_REPO` 等环境变量
- **优点**: 无需后端、自动同步
- **缺点**: 需要 GitHub 账号
- **适用**: 个人博客

**后端评论**:
- **优点**: 完全控制、支持审核
- **缺点**: 需要维护后端
- **适用**: 需要审核的场景

#### 后端评论数据结构

```sql
CREATE TABLE comments (
    id UUID PRIMARY KEY,
    post_slug VARCHAR(255) NOT NULL,
    parent_id UUID REFERENCES comments(id),  -- 嵌套评论
    author_name VARCHAR(100) NOT NULL,
    author_email VARCHAR(255),
    content TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);
```

#### 评论功能

**用户功能**:
- 发表评论
- 回复评论（最多 5 层嵌套）
- 点赞评论
- 编辑评论（5分钟内）

**管理员功能**:
- 审核评论（批准/拒绝）
- 删除评论
- 标记垃圾评论
- 查看 IP 和 User-Agent

---

### 搜索功能

#### Kbar（默认）

**快捷键**: `Cmd/Ctrl + K`

**配置**: `siteMetadata.ts`
```typescript
search: {
  provider: 'kbar',
  kbarConfig: {
    searchDocumentsPath: 'search.json'
  }
}
```

**搜索数据**: 从 Contentlayer 自动生成

#### Algolia（可选）

**配置**:
```typescript
search: {
  provider: 'algolia',
  algoliaConfig: {
    appId: 'YOUR_APP_ID',
    apiKey: 'YOUR_SEARCH_API_KEY',
    indexName: 'blog_posts'
  }
}
```

**优点**:
- 模糊搜索
- Typo 容错
- 高亮结果
- 搜索分析

---

### 分析系统

#### 多平台支持

| 平台 | 环境变量 | 功能 |
|------|----------|------|
| Umami | `NEXT_PUBLIC_UMAMI_ID` | 开源分析 |
| Google Analytics | `NEXT_PUBLIC_GA_ID` | Google 分析 |
| Plausible | `NEXT_PUBLIC_PLAUSIBLE_ID` | 隐私友好 |
| Posthog | `NEXT_PUBLIC_POSTHOG_KEY` | 产品分析 |

#### 自定义文章分析

**组件**: `ArticleAnalytics`

**指标**:
```typescript
{
  views: number           // 浏览次数
  readTime: number        // 阅读时长（秒）
  scrollDepth: number     // 滚动深度（%）
  engagementScore: number // 参与度评分
}
```

**API 端点**:
```bash
# 记录浏览
POST /api/posts/{slug}/view

# 记录阅读时长
POST /api/posts/{slug}/read-time
Body: { "duration": 120 }

# 获取统计
GET /api/posts/{slug}/stats
Response: { "views": 1000, "avgReadTime": 180 }
```

---

### 交互式组件

#### 3D 可视化

| 组件 | 文件 | 功能 | 库 |
|------|------|------|-----|
| ThreeViewer | `components/3d/ThreeViewer.tsx` | 通用 3D 模型 | Three.js |
| URDFViewer | `components/3d/URDFViewer.tsx` | 机器人模型 | URDF Loader |
| MoleculeViewer | `components/chemistry/MoleculeViewer.tsx` | 分子可视化 | 3Dmol.js |

**使用示例**:
```mdx
import { ThreeViewer } from '@/components/3d/ThreeViewer'

<ThreeViewer
  modelPath="/models/robot.glb"
  width="100%"
  height={500}
  enableControls={true}
  autoRotate={true}
/>
```

#### 数据图表

| 组件 | 图表类型 | 库 |
|------|----------|-----|
| NivoLineChart | 折线图 | Nivo |
| NivoBarChart | 条形图 | Nivo |
| NivoPieChart | 饼图 | Nivo |
| EChartsComponent | 通用图表 | ECharts |
| AntVChart | 统计图表 | AntV G2 |

**使用示例**:
```mdx
import { LineChart } from '@/components/charts/LineChart'

<LineChart
  data={[
    { date: '2025-01', value: 100 },
    { date: '2025-02', value: 200 },
  ]}
  xKey="date"
  yKey="value"
  height={400}
/>
```

#### 化学组件

| 组件 | 功能 |
|------|------|
| ChemicalStructure | 显示化学结构（SMILES） |
| SMILESConverter | SMILES 格式转换 |
| RDKitStructure | 高级化学结构 |

**使用示例**:
```mdx
import { ChemicalStructure } from '@/components/chemistry/ChemicalStructure'

<ChemicalStructure
  smiles="CCO"  // 乙醇
  width="100%"
  height={300}
/>
```

#### 音乐组件

| 组件 | 功能 |
|------|------|
| MusicNotation | 乐谱显示（MusicXML） |
| Piano | 钢琴键盘 |
| AudioPlayer | 音频播放器 |

---

## 数据库模型

### 核心表结构

#### users 表
```sql
id              UUID PRIMARY KEY
email           VARCHAR(255) UNIQUE NOT NULL
password_hash   VARCHAR(255) NOT NULL
role            VARCHAR(20) DEFAULT 'user'
created_at      TIMESTAMP DEFAULT NOW()
updated_at      TIMESTAMP DEFAULT NOW()
```

#### comments 表
```sql
id              UUID PRIMARY KEY
post_slug       VARCHAR(255) NOT NULL
parent_id       UUID REFERENCES comments(id)
author_name     VARCHAR(100) NOT NULL
author_email    VARCHAR(255)
content         TEXT NOT NULL
status          VARCHAR(20) DEFAULT 'pending'
ip_address      INET
user_agent      TEXT
created_at      TIMESTAMP DEFAULT NOW()
```

#### post_stats 表
```sql
post_slug       VARCHAR(255) PRIMARY KEY
views           INTEGER DEFAULT 0
likes           INTEGER DEFAULT 0
updated_at      TIMESTAMP DEFAULT NOW()
```

#### refresh_tokens 表
```sql
token           TEXT PRIMARY KEY
user_id         UUID REFERENCES users(id)
expires_at      TIMESTAMP NOT NULL
created_at      TIMESTAMP DEFAULT NOW()
```

---

## 环境变量

### 前端环境变量

**必需**:
```bash
NEXT_PUBLIC_SITE_URL=http://localhost:3001
NEXT_PUBLIC_BASE_PATH=
```

**可选**（分析）:
```bash
NEXT_PUBLIC_UMAMI_ID=your-umami-id
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX
```

**可选**（评论）:
```bash
NEXT_PUBLIC_GISCUS_REPO=username/repo
NEXT_PUBLIC_GISCUS_REPO_ID=R_kgDO...
NEXT_PUBLIC_GISCUS_CATEGORY=Announcements
```

**可选**（错误追踪）:
```bash
NEXT_PUBLIC_SENTRY_DSN=https://xxxxx@sentry.io/xxxxx
```

### 后端环境变量

**必需**:
```bash
DATABASE_URL=postgresql://user:pass@localhost:5432/blog_db
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-secret-key-at-least-32-chars
```

**可选**:
```bash
HOST=127.0.0.1
PORT=3000
RUST_LOG=info
ENVIRONMENT=production

# 密码安全
PASSWORD_PEPPER=your-pepper-at-least-32-chars

# Session
SESSION_SECRET=your-session-secret
SESSION_TIMEOUT_HOURS=24

# CORS
CORS_ALLOWED_ORIGINS=http://localhost:3001,https://yourdomain.com

# 速率限制
RATE_LIMIT_PER_MINUTE=60

# SMTP
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_FROM=noreply@yourdomain.com
```

---

## 常用命令

### 前端

```bash
# 开发
pnpm dev

# 构建
pnpm build

# 静态导出
EXPORT=1 pnpm build

# 测试
pnpm test
pnpm test:watch
pnpm test:coverage

# Lint
pnpm lint
```

### 后端

```bash
# 开发环境
./scripts/deployment/deploy.sh dev

# 生产环境
./scripts/deployment/deploy.sh prod

# 停止服务
./scripts/deployment/deploy.sh stop

# 运行 API
cargo run

# 运行测试
cargo test

# 构建发布版
cargo build --release
```

### 数据库

```bash
# 运行迁移
cargo run -p blog-migrator

# 回滚迁移
sqlx migrate revert

# 查看迁移状态
sqlx migrate info

# 创建新迁移
sqlx migrate add migration_name
```

---

## 故障排查

### 前端

| 问题 | 解决方案 |
|------|----------|
| 端口被占用 | `lsof -ti:3001 \| xargs kill -9` |
| Contentlayer 错误 | `rm -rf .next node_modules/.cache && pnpm install` |
| 组件未找到 | 检查导入路径和导出 |
| MDX 组件报错 | 确认组件在 `MDXComponents/index.ts` 中导出 |

### 后端

| 问题 | 解决方案 |
|------|----------|
| 数据库连接失败 | 检查 `DATABASE_URL`，确认 Docker 运行 |
| Redis 连接失败 | `docker compose restart redis` |
| Token 验证失败 | 检查 `JWT_SECRET` 一致性 |
| 速率限制错误 | 等待 1 分钟或修改限制 |

### 数据库

| 问题 | 解决方案 |
|------|----------|
| 迁移失败 | `sqlx migrate revert` 然后重试 |
| 连接池耗尽 | 增加连接池大小 |
| 慢查询 | 添加索引，优化查询 |

---

## 相关文档

- [完整架构文档](./development/architecture.md) - 详细的架构说明
- [前端开发](./development/frontend/overview.md) - 前端开发指南
- [后端开发](./development/backend/overview.md) - 后端开发指南
- [API 参考](./development/backend/api-reference.md) - API 文档
- [部署指南](./deployment/overview.md) - 部署说明

---

**最后更新**: 2025-12-27

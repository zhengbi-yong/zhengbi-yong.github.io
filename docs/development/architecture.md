# 项目组件架构

本文档详细介绍项目的所有重要组件及其开发、测试和部署指南。

## 目录

- [项目总览](#项目总览)
- [核心模块](#核心模块)
  - [1. 前端页面系统](#1-前端页面系统)
  - [2. 后端服务](#2-后端服务)
  - [3. 管理员系统](#3-管理员系统)
  - [4. 认证系统](#4-认证系统)
  - [5. 评论系统](#5-评论系统)
  - [6. 搜索功能](#6-搜索功能)
  - [7. 分析系统](#7-分析系统)
  - [8. 交互式组件](#8-交互式组件)
- [组件依赖关系](#组件依赖关系)
- [开发指南](#开发指南)
- [测试指南](#测试指南)
- [部署指南](#部署指南)

## 项目总览

### 架构图

```
┌─────────────────────────────────────────────────────────┐
│                    用户界面层                            │
├─────────────┬─────────────┬─────────────┬──────────────┤
│  博客页面    │  管理后台    │  交互式页面  │   分析页面    │
└──────┬──────┴──────┬──────┴──────┬──────┴──────┬───────┘
       │             │             │              │
┌──────▼─────────────▼─────────────▼──────────────▼───────┐
│                  前端层 (Next.js 16)                    │
│  认证状态 │ 搜索功能 │ 评论系统 │ 错误处理 │ 数据可视化│
└───────────────────────┬─────────────────────────────────┘
                        │ HTTP / WebSocket
┌───────────────────────▼─────────────────────────────────┐
│                  API 层 (Rust Axum)                      │
│  认证中间件 │ 速率限制 │ CORS │ 路由处理 │ 监控指标    │
├───────────────────────┬─────────────────────────────────┤
│    业务逻辑层         │           数据层                  │
│  ┌─────┬─────┬─────┐ │  ┌────────────┬──────────────┐ │
│  │JWT  │评论│邮件│ │  │ PostgreSQL  │    Redis     │ │
│  │服务│服务│服务│ │  │   (主数据)  │   (缓存)      │ │
│  └─────┴─────┴─────┘ │  └────────────┴──────────────┘ │
└───────────────────────┴─────────────────────────────────┘
```

### 技术栈

**前端**:
- Next.js 16 (App Router) + React 19
- TypeScript 5.9
- Tailwind CSS 4
- Zustand (状态管理)
- React Query (数据获取)

**后端**:
- Rust 1.70+
- Axum 0.8 (Web 框架)
- SQLx (数据库)
- JWT (认证)
- Prometheus (监控)

**数据存储**:
- PostgreSQL 15+ (主数据库)
- Redis 7+ (缓存和 Session)

---

## 核心模块

### 1. 前端页面系统

#### 1.1 博客页面

**组件位置**: `frontend/app/blog/`

| 页面 | 路径 | 功能 |
|------|------|------|
| 博客首页 | `/blog` | 显示所有文章列表 |
| 文章详情 | `/blog/[...slug]` | 显示文章内容和评论 |
| 分类页面 | `/blog/category/[category]` | 按分类筛选文章 |
| 标签页面 | `/tags/[tag]` | 按标签筛选文章 |
| 热门文章 | `/blog/popular` | 显示最受欢迎的文章 |

**关键组件**:
- `PostLayout.tsx` - 完整文章布局（含目录、作者信息、评论）
- `PostSimple.tsx` - 简洁文章布局
- `PostBanner.tsx` - 横幅式文章布局
- `BlogCard.tsx` - 文章卡片
- `TagList.tsx` - 标签列表

**数据流**:
```
MDX 文件 → Contentlayer 处理 → JSON 数据 → 页面组件 → 静态 HTML
```

#### 1.2 交互式功能页面

**组件位置**: `frontend/app/`

| 页面 | 路径 | 功能 |
|------|------|------|
| Excalidraw 绘图 | `/excalidraw` | 在线白板绘图工具 |
| 音乐播放 | `/music/[name]` | 乐谱显示和音乐播放 |
| 分析页面 | `/analytics` | 网站分析数据展示 |
| 访客统计 | `/visitors` | 访客地图和统计 |
| 项目展示 | `/projects` | 项目作品展示 |

---

### 2. 后端服务

#### 2.1 API 层架构

**位置**: `backend/crates/api/`

**主要模块**:

| 模块 | 文件 | 功能 |
|------|------|------|
| 主入口 | `main.rs` | 服务器启动、路由配置 |
| 认证路由 | `routes/auth.rs` | 注册、登录、登出、刷新令牌 |
| 评论路由 | `routes/comments.rs` | 评论 CRUD、点赞 |
| 文章路由 | `routes/posts.rs` | 文章统计、浏览记录 |
| 管理员路由 | `routes/admin.rs` | 用户管理、评论审核 |

**中间件**:

| 中间件 | 功能 |
|--------|------|
| `auth.rs` | JWT 验证、用户身份识别 |
| `rate_limit.rs` | API 速率限制（防滥用） |
| CORS | 跨域资源共享 |
| Logger | 请求日志记录 |

**示例：认证中间件**
```rust
pub async fn auth_middleware(
    req: Request,
    next: Next,
) -> Result<Response, StatusCode> {
    // 1. 提取 JWT Token
    // 2. 验证 Token 签名
    // 3. 检查 Token 过期时间
    // 4. 将用户信息注入请求状态
    // 5. 调用下一个处理器
}
```

#### 2.2 业务逻辑层

**位置**: `backend/crates/core/`

**服务模块**:

| 服务 | 功能 |
|------|------|
| `auth.rs` | JWT 生成/验证、密码哈希 |
| `email.rs` | 邮件发送（SMTP） |
| `cache.rs` | Redis 缓存操作 |

**示例：JWT 服务**
```rust
pub struct AuthService {
    jwt_secret: String,
    expiration: Duration,
}

impl AuthService {
    pub fn generate_token(&self, user_id: Uuid) -> Result<String> {
        // 生成 JWT Token
    }

    pub fn verify_token(&self, token: &str) -> Result<Claims> {
        // 验证 JWT Token
    }
}
```

#### 2.3 数据访问层

**位置**: `backend/crates/db/`

**数据库模型**:

| 模型 | 表名 | 字段 |
|------|------|------|
| User | `users` | id, email, password_hash, role, created_at |
| Comment | `comments` | id, post_slug, author_name, content, status |
| PostStats | `post_stats` | post_slug, views, likes, updated_at |
| RefreshToken | `refresh_tokens` | token, user_id, expires_at |

**连接池配置**:
```rust
PgPoolOptions::new()
    .max_connections(10)
    .min_connections(1)
    .connect(&DATABASE_URL)
    .await?
```

---

### 3. 管理员系统

#### 3.1 前端管理界面

**位置**: `frontend/app/admin/`

**页面结构**:

```
/admin/
├── page.tsx              # 仪表板（Dashboard）
├── users/
│   └── page.tsx          # 用户管理
├── comments/
│   └── page.tsx          # 评论审核
├── settings/
│   └── page.tsx          # 系统设置
└── users-refine/
    └── page.tsx          # Refine 用户管理（高级）
```

**关键组件**:

| 组件 | 位置 | 功能 |
|------|------|------|
| `AdminLayout.tsx` | `layouts/` | 管理后台布局（侧边栏、顶栏） |
| `AdminStatsCard.tsx` | `components/admin/` | 统计卡片 |
| `UserManagement.tsx` | `components/admin/` | 用户管理表格 |
| `CommentModeration.tsx` | `components/admin/` | 评论审核面板 |

#### 3.2 权限控制（RBAC）

**角色定义**:

| 角色 | 权限 |
|------|------|
| `user` | 普通用户，可以评论和点赞 |
| `moderator` | 版主，可以审核评论 |
| `admin` | 管理员，拥有所有权限 |

**权限验证流程**:
```
1. 用户登录 → 获取 JWT Token
2. 访问管理页面 → 前端检查角色
3. 调用管理 API → 后端验证权限
4. 权限不足 → 返回 403 Forbidden
```

**示例：权限检查**
```rust
pub async fn require_admin(
    user_id: Uuid,
    pool: &PgPool,
) -> Result<bool, AppError> {
    let role = sqlx::query_scalar::<_, String>(
        "SELECT role FROM users WHERE id = $1"
    )
    .bind(user_id)
    .fetch_one(pool)
    .await?;

    if role != "admin" {
        return Err(AppError::Forbidden);
    }

    Ok(true)
}
```

#### 3.3 管理功能

**用户管理**:
- 查看所有用户
- 修改用户角色
- 禁用/启用账户
- 重置密码

**评论管理**:
- 查看待审核评论
- 批准/拒绝评论
- 标记垃圾评论
- 删除评论

**统计数据**:
- 用户总数
- 文章总数
- 评论总数
- 访问统计

---

### 4. 认证系统

#### 4.1 双 Token 认证机制

**流程图**:
```
用户登录
    ↓
验证用户名和密码
    ↓
生成 Access Token (15分钟)
生成 Refresh Token (7天)
    ↓
返回 Access Token + 设置 Refresh Token Cookie
    ↓
后续请求携带 Access Token
    ↓
Token 过期？
    ├─ 否 → 正常访问
    └─ 是 → 自动使用 Refresh Token 刷新
```

**Token 对比**:

| 特性 | Access Token | Refresh Token |
|------|--------------|---------------|
| 有效期 | 15 分钟 | 7 天 |
| 存储位置 | 内存（Zustand） | HTTP-only Cookie |
| 用途 | API 认证 | 刷新 Access Token |
| 安全性 | 较高（短期） | 高（防 CSRF） |

#### 4.2 前端认证状态管理

**位置**: `frontend/core/auth/store.ts`

**状态结构**:
```typescript
interface AuthState {
  user: User | null
  accessToken: string | null
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  refresh: () => Promise<void>
}
```

**自动刷新机制**:
```typescript
// 401 错误时自动刷新
if (error.response?.status === 401) {
  try {
    await auth.refresh()
    // 重试原请求
  } catch {
    auth.logout()
  }
}
```

#### 4.3 后端认证服务

**位置**: `backend/crates/core/src/auth.rs`

**功能实现**:

| 功能 | 方法 |
|------|------|
| 密码哈希 | `hash_password(password: &str) -> String` |
| 密码验证 | `verify_password(password: &str, hash: &str) -> bool` |
| 生成 JWT | `generate_access_token(user_id: Uuid) -> String` |
| 验证 JWT | `verify_token(token: &str) -> Result<Claims>` |
| 刷新令牌 | `refresh_access_token(refresh_token: &str) -> String` |

**密码安全**:
- 使用 **Argon2** 算法（抗 GPU 破解）
- 自动加盐
- 可调整工作参数

---

### 5. 评论系统

#### 5.1 双评论模式

**Giscus 评论**（GitHub Discussions）:
- **优点**: 无需后端、自动同步、支持 Markdown
- **缺点**: 需要 GitHub 账号、数据在第三方
- **适用场景**: 个人博客、开源项目

**后端评论系统**:
- **优点**: 完全控制、支持审核、数据自主
- **缺点**: 需要维护后端
- **适用场景**: 企业博客、需要审核的场景

#### 5.2 后端评论架构

**数据模型**:
```sql
CREATE TABLE comments (
    id UUID PRIMARY KEY,
    post_slug VARCHAR(255) NOT NULL,
    parent_id UUID REFERENCES comments(id),
    author_name VARCHAR(100) NOT NULL,
    author_email VARCHAR(255),
    content TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT NOW(),

    CONSTRAINT chk_status CHECK (status IN (
        'pending', 'approved', 'rejected', 'spam', 'deleted'
    ))
);
```

**评论状态机**:
```
pending (待审核)
    ↓
approved (已通过) ←→ rejected (已拒绝)
    ↓
deleted (已删除)

spam (垃圾评论) → 直接拒绝
```

**嵌套评论**:
```typescript
interface Comment {
  id: string
  content: string
  author: {
    name: string
    email: string
  }
  status: 'pending' | 'approved' | 'rejected'
  replies?: Comment[]  // 最多嵌套 5 层
  createdAt: Date
}
```

#### 5.3 评论功能

**用户功能**:
- 发表评论
- 回复评论（嵌套）
- 点赞评论
- 编辑评论（5分钟内）

**管理员功能**:
- 审核评论（批准/拒绝）
- 删除评论
- 标记垃圾评论
- 查看 IP 地址

---

### 6. 搜索功能

#### 6.1 搜索提供商

**Kbar**（默认）:
- **类型**: 命令面板搜索
- **快捷键**: `Cmd/Ctrl + K`
- **数据源**: 本地搜索索引
- **优点**: 快速、无需外部服务

**Algolia**（可选）:
- **类型**: 全文搜索服务
- **配置**: App ID、API Key、Index Name
- **优点**: 强大、支持模糊搜索、 typo 容错

#### 6.2 Kbar 配置

**位置**: `frontend/components/SearchButton.tsx`

**搜索数据**:
```typescript
const searchDocuments = [
  { id: '1', title: 'Post Title', route: '/blog/post' },
  { id: '2', title: 'About', route: '/about' },
  // ... 从 Contentlayer 生成
]
```

**快捷键**:
- `Cmd/Ctrl + K` - 打开搜索
- `↑/↓` - 导航结果
- `Enter` - 跳转
- `Esc` - 关闭

---

### 7. 分析系统

#### 7.1 多平台支持

**分析平台配置** (`siteMetadata.ts`):

| 平台 | 配置键 | 功能 |
|------|--------|------|
| Umami | `analytics.umami` | 开源分析 |
| Google Analytics | `analytics.gaId` | Google 分析 |
| Plausible | `analytics.plausible` | 隐私友好分析 |
| Posthog | `analytics.posthog` | 产品分析 |

#### 7.2 自定义文章分析

**位置**: `frontend/components/analytics/`

**分析指标**:
```typescript
interface ArticleAnalytics {
  views: number           // 浏览次数
  readTime: number        // 阅读时长（秒）
  scrollDepth: number     // 滚动深度（%）
  engagementScore: number // 参与度评分
}
```

**数据收集**:
```typescript
// 记录浏览
POST /api/posts/{slug}/view

// 记录阅读时长
POST /api/posts/{slug}/read-time

// 获取统计
GET /api/posts/{slug}/stats
```

#### 7.3 访客追踪

**组件**: `VisitorTracker.tsx`

**追踪数据**:
- IP 地址（匿名化）
- 地理位置（国家、城市）
- 浏览器类型
- 操作系统
- 访问时间
- 访问页面

**地图展示**: `VisitorMap.tsx` 使用 Leaflet.js

---

### 8. 交互式组件

#### 8.1 3D 可视化

**组件位置**: `frontend/components/3d/`

| 组件 | 用途 | 技术 |
|------|------|------|
| `ThreeViewer.tsx` | 通用 3D 模型查看器 | Three.js |
| `URDFViewer.tsx` | 机器人模型查看器 | URDF Loader |
| `MoleculeViewer.tsx` | 分子可视化 | 3Dmol.js |

**示例：使用 ThreeViewer**
```mdx
import { ThreeViewer } from '@/components/3d/ThreeViewer'

<ThreeViewer
  modelPath="/models/robot.glb"
  width="100%"
  height={500}
  enableControls={true}
/>
```

#### 8.2 数据可视化

**组件位置**: `frontend/components/charts/`

| 组件 | 图表类型 | 库 |
|------|----------|-----|
| `NivoLineChart.tsx` | 折线图 | Nivo |
| `NivoBarChart.tsx` | 条形图 | Nivo |
| `NivoPieChart.tsx` | 饼图 | Nivo |
| `EChartsComponent.tsx` | 通用图表 | ECharts |
| `AntVChart.tsx` | 统计图表 | AntV G2 |
| `GraphVisualization.tsx` | 图可视化 | AntV G6 |

**示例：使用图表**
```mdx
import { LineChart } from '@/components/charts/LineChart'

<LineChart
  data={data}
  xKey="date"
  yKey="value"
  width="100%"
  height={400}
/>
```

#### 8.3 化学组件

**组件位置**: `frontend/components/chemistry/`

| 组件 | 功能 |
|------|------|
| `ChemicalStructure.tsx` | 显示化学结构（SMILES） |
| `SMILESConverter.tsx` | SMILES 格式转换 |
| `RDKitStructure.tsx` | 高级化学结构（RDKit.js） |

#### 8.4 音乐组件

**组件位置**: `frontend/components/music/`

| 组件 | 功能 |
|------|------|
| `MusicNotation.tsx` | 乐谱显示（MusicXML） |
| `Piano.tsx` | 钢琴键盘 |
| `AudioPlayer.tsx` | 音频播放器 |

---

## 组件依赖关系

### 前端依赖图

```
┌─────────────────────────────────────────────┐
│              App (layout.tsx)               │
├─────────────────────────────────────────────┤
│  Header │  Main Content  │      Footer      │
└────┬─────────┬─────────────┬────────────────┘
     │         │             │
     ├─────────▼─────────────▼────────┐
     │        页面组件                │
     ├────────────────────────────────┤
     │ Blog │ Admin │ Analytics │ ... │
     └────────┬──────────┬───────────┘
              │          │
     ┌────────▼──────────▼────────┐
     │      功能组件              │
     ├────────────────────────────┤
     │ Comments │ Search │ Auth  │
     │ Charts │ 3D │ Chemistry   │
     └────────────────────────────┘
```

### 后端依赖图

```
┌──────────────────────────────────┐
│     API Server (main.rs)        │
├──────────────────────────────────┤
│  中间件层                        │
│  Auth │ RateLimit │ CORS │ Log  │
├──────────────────────────────────┤
│  路由层                          │
│  /auth │ /comments │ /admin     │
└────────┬──────────┬──────────────┘
         │          │
    ┌────▼──────────▼────┐
    │   业务逻辑层        │
    │  JWT │ Email       │
    └────┬───────────────┘
         │
    ┌────▼────────┐
    │  数据访问层  │
    │  PostgreSQL │
    │  Redis      │
    └─────────────┘
```

---

## 开发指南

### 前端开发流程

#### 1. 本地开发

```bash
cd frontend
pnpm install
pnpm dev
```

访问: http://localhost:3001

#### 2. 添加新页面

**步骤**:
1. 在 `frontend/app/` 下创建目录和 `page.tsx`
2. 添加内容和组件
3. 测试页面
4. 提交代码

**示例：创建关于页面**
```typescript
// frontend/app/about/page.tsx
export default function AboutPage() {
  return (
    <div className="prose dark:prose-dark">
      <h1>About</h1>
      <p>这是关于页面</p>
    </div>
  )
}
```

#### 3. 添加新组件

**步骤**:
1. 在 `frontend/components/` 下创建组件文件
2. 导出组件
3. 在页面中使用

**示例：创建新组件**
```typescript
// frontend/components/MyComponent.tsx
export function MyComponent({ prop }: { prop: string }) {
  return <div>{prop}</div>
}

// 在页面中使用
import { MyComponent } from '@/components/MyComponent'

<MyComponent prop="Hello" />
```

#### 4. MDX 组件开发

**步骤**:
1. 创建组件文件
2. 在 `components/MDXComponents/index.ts` 中导出
3. 在 MDX 文件中使用

**示例**:
```typescript
// components/MDXComponents/CustomChart.tsx
export function CustomChart({ data }: { data: ChartData }) {
  return (
    <div className="my-chart">
      {/* 图表渲染逻辑 */}
    </div>
  )
}

// 导出
export { CustomChart } from './CustomChart'

// 在 MDX 中使用
import { CustomChart } from '@/components/MDXComponents'

<CustomChart data={chartData} />
```

### 后端开发流程

#### 1. 本地开发

```bash
cd backend

# 启动数据库
./deploy.sh dev

# 运行 API
export DATABASE_URL=postgresql://blog_user:blog_password@localhost:5432/blog_db
export REDIS_URL=redis://localhost:6379
cargo run
```

访问: http://localhost:3000

#### 2. 添加新路由

**步骤**:
1. 在 `crates/api/src/routes/` 创建路由文件
2. 定义路由处理函数
3. 在 `main.rs` 中注册路由
4. 测试 API

**示例：添加健康检查路由**
```rust
// crates/api/src/routes/health.rs
use axum::{Json, response::IntoResponse};

pub async fn health_check() -> impl IntoResponse {
    Json(json!({
        "status": "healthy",
        "timestamp": chrono::Utc::now()
    }))
}

// 在 main.rs 中注册
let app = Router::new()
    .route("/health", get(health_check));
```

#### 3. 添加数据库模型

**步骤**:
1. 创建迁移文件
2. 定义模型结构体
3. 实现数据库操作

**示例：添加新表**
```sql
-- migrations/000003_add_posts_table.sql
CREATE TABLE posts (
    id UUID PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    content TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);
```

```rust
// crates/db/src/models.rs
use sqlx::FromRow;
use serde::Serialize;

#[derive(Debug, Serialize, FromRow)]
pub struct Post {
    pub id: Uuid,
    pub title: String,
    pub slug: String,
    pub content: Option<String>,
    pub created_at: chrono::DateTime<chrono::Utc>,
}
```

#### 4. 错误处理

**自定义错误类型**:
```rust
#[derive(Debug)]
pub enum AppError {
    Database(sqlx::Error),
    NotFound(String),
    Unauthorized,
    Forbidden,
}

impl IntoResponse for AppError {
    fn into_response(self) -> Response {
        let (status, message) = match self {
            AppError::NotFound(_) => (StatusCode::NOT_FOUND, "Not found"),
            AppError::Unauthorized => (StatusCode::UNAUTHORIZED, "Unauthorized"),
            AppError::Forbidden => (StatusCode::FORBIDDEN, "Forbidden"),
            AppError::Database(e) => {
                error!("Database error: {:?}", e);
                (StatusCode::INTERNAL_SERVER_ERROR, "Internal server error")
            }
        };

        (status, Json(json!({ "error": message }))).into_response()
    }
}
```

---

## 测试指南

### 前端测试

#### 1. 单元测试

**使用 Vitest**:
```typescript
// components/__tests__/MyComponent.test.tsx
import { render, screen } from '@testing-library/react'
import { MyComponent } from '../MyComponent'

describe('MyComponent', () => {
  it('renders prop correctly', () => {
    render(<MyComponent prop="Test" />)
    expect(screen.getByText('Test')).toBeInTheDocument()
  })
})
```

**运行测试**:
```bash
cd frontend
pnpm test
```

#### 2. 组件测试

**示例：测试认证按钮**
```typescript
import { render, screen, fireEvent } from '@testing-library/react'
import { AuthButton } from './AuthButton'

describe('AuthButton', () => {
  it('shows login when not authenticated', () => {
    render(<AuthButton />)
    expect(screen.getByText('Login')).toBeInTheDocument()
  })

  it('shows logout when authenticated', () => {
    render(<AuthButton />, { authState: { isAuthenticated: true } })
    expect(screen.getByText('Logout')).toBeInTheDocument()
  })
})
```

#### 3. E2E 测试

**使用 Playwright**:
```bash
pnpm exec playwright test
```

**示例：测试登录流程**
```typescript
import { test, expect } from '@playwright/test'

test('user can login', async ({ page }) => {
  await page.goto('http://localhost:3001')
  await page.click('button:has-text("Login")')
  await page.fill('input[name="email"]', 'test@example.com')
  await page.fill('input[name="password"]', 'password')
  await page.click('button:has-text("Submit")')
  await expect(page).toHaveURL(/.*admin/)
})
```

### 后端测试

#### 1. 单元测试

**示例：测试认证服务**
```rust
#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_password_hashing() {
        let password = "test123";
        let hash = hash_password(password).unwrap();
        assert!(verify_password(password, &hash).unwrap());
    }

    #[tokio::test]
    async fn test_token_generation() {
        let user_id = Uuid::new_v4();
        let token = generate_access_token(user_id).unwrap();
        let claims = verify_token(&token).unwrap();
        assert_eq!(claims.sub, user_id);
    }
}
```

**运行测试**:
```bash
cd backend
cargo test
```

#### 2. 集成测试

**位置**: `backend/tests/integration_tests.rs`

**示例：测试用户注册和登录**
```rust
#[sqlx::test]
async fn test_user_registration(pool: PgPool) -> TestResult {
    // 1. 创建测试用户
    let response = client
        .post("/v1/auth/register")
        .json(&json!({
            "email": "test@example.com",
            "password": "password123"
        }))
        .send()
        .await;

    assert_eq!(response.status(), 201);

    // 2. 验证数据库中的用户
    let user = sqlx::query!("SELECT email FROM users WHERE email = $1", "test@example.com")
        .fetch_one(&pool)
        .await?;

    assert_eq!(user.email, "test@example.com");

    Ok(())
}
```

#### 3. API 测试

**使用 Postman**:
1. 导入 `backend/docs/Blog_API.postman_collection.json`
2. 配置环境变量
3. 运行测试集合

**或使用 curl**:
```bash
# 测试健康检查
curl http://localhost:3000/health

# 测试用户注册
curl -X POST http://localhost:3000/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'

# 测试登录
curl -X POST http://localhost:3000/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

### 数据库测试

#### 1. 迁移测试

**验证迁移**:
```bash
# 运行所有迁移
sqlx migrate run

# 检查迁移状态
sqlx migrate info

# 回滚最后一个迁移
sqlx migrate revert
```

#### 2. 数据库性能测试

**测试查询性能**:
```bash
# 启用查询日志
RUST_LOG=sqlx=debug cargo run

# 查看慢查询
# 在 PostgreSQL 中
SELECT query, mean_exec_time
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 10;
```

---

## 部署指南

### 开发环境部署

#### 1. 前端开发环境

```bash
cd frontend
pnpm install
pnpm dev
```

访问: http://localhost:3001

#### 2. 后端开发环境

```bash
cd backend

# 启动数据库（Docker）
./deploy.sh dev

# 运行 API
export DATABASE_URL=postgresql://blog_user:blog_password@localhost:5432/blog_db
export REDIS_URL=redis://localhost:6379
cargo run
```

访问: http://localhost:3000

### 生产环境部署

#### 1. 前端部署（GitHub Pages）

**构建**:
```bash
cd frontend

# 配置环境变量
export EXPORT=1
export BASE_PATH=/repo-name

# 构建
pnpm build

# 输出在 frontend/out/
```

**部署**:
```bash
# 推送到 GitHub
git add .
git commit -m "Build for production"
git push origin main

# GitHub Actions 自动部署
```

#### 2. 后端部署（VPS）

**使用 Docker Compose**:
```bash
cd backend

# 复制环境配置
cp .env.example .env
# 编辑 .env 设置生产环境变量

# 启动服务
docker compose -f docker-compose.prod.yml up -d
```

**使用 Nginx 反向代理**:
```nginx
server {
    listen 443 ssl http2;
    server_name your-domain.com;

    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;

    # 前端
    location / {
        proxy_pass http://localhost:3001;
    }

    # 后端 API
    location /api/ {
        proxy_pass http://localhost:3000/;
    }
}
```

#### 3. 数据库部署

**PostgreSQL 配置**:
```yaml
# docker-compose.prod.yml
services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_USER: ${DB_USER}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
      POSTGRES_DB: blog_db
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: always

  redis:
    image: redis:7-alpine
    command: redis-server --appendonly yes
    volumes:
      - redis_data:/data
    restart: always
```

**备份策略**:
```bash
# 每日备份
0 2 * * * pg_dump -U blog_user blog_db > /backups/db_$(date +\%Y\%m\%d).sql

# 保留最近 30 天的备份
find /backups -name "db_*.sql" -mtime +30 -delete
```

### 监控和维护

#### 1. 健康检查

**前端**:
```bash
curl http://localhost:3001
```

**后端**:
```bash
curl http://localhost:3000/health
curl http://localhost:3000/metrics  # Prometheus 指标
```

#### 2. 日志查看

**前端日志**:
```bash
# 查看错误日志
tail -f /var/log/nginx/error.log

# 查看访问日志
tail -f /var/log/nginx/access.log
```

**后端日志**:
```bash
# Docker 日志
docker compose logs -f api

# 或查看系统日志
journalctl -u blog-api -f
```

#### 3. 性能监控

**Prometheus + Grafana**:
```yaml
# docker-compose.monitoring.yml
services:
  prometheus:
    image: prom/prometheus
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml

  grafana:
    image: grafana/grafana
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin
```

**监控指标**:
- API 响应时间
- 数据库连接数
- Redis 缓存命中率
- CPU 和内存使用率

#### 4. 错误追踪

**Sentry 集成**:
```typescript
// frontend/sentry.server.config.ts
import * as Sentry from "@sentry/nextjs"

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
})
```

```rust
// backend/main.rs
use sentry::integrations::tower::NewSentryLayer;

let app = Router::new()
    .layer(NewSentryLayer::new_from_top());
```

---

## 相关文档

- [前端架构](./development/frontend/overview.md) - 详细的前端架构说明
- [后端架构](./development/backend/overview.md) - 详细的后端架构说明
- [API 参考](./development/backend/api-reference.md) - 完整的 API 文档
- [数据库设计](./development/backend/database.md) - 数据库模式和关系
- [部署总览](./deployment/overview.md) - 部署架构和选项

---

**最后更新**: 2025-12-27

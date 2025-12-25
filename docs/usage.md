# 雍征彼的个人博客平台 - 使用手册

## 项目概述

这是一个现代化的个人博客平台，采用前后端分离架构，由雍征彼（Zhengbi Yong）开发。项目使用 Rust 作为后端 API，Next.js 作为前端框架，支持内容管理、用户认证、评论系统等功能。

## 系统架构

### 技术栈

#### 后端技术栈
- **语言**: Rust 1.70+
- **Web框架**: Axum (高性能异步Web框架)
- **数据库**: PostgreSQL 15+ (主数据库)
- **缓存**: Redis 7+ (会话存储和缓存)
- **认证**: JWT + argon2密码哈希
- **ORM**: SQLx (类型安全的SQL工具包)
- **API文档**: OpenAPI 3.0 (Swagger UI)
- **监控**: Prometheus指标收集
- **日志**: tracing + tracing-subscriber
- **异步运行时**: Tokio
- **容器化**: Docker + Docker Compose

#### 前端技术栈
- **框架**: Next.js 16.0.10 with App Router and Turbopack
- **语言**: TypeScript (严格模式)
- **样式**: Tailwind CSS 4.0
- **内容管理**: Contentlayer2 (MDX/Markdown处理)
- **UI组件**: 自定义组件 + Radix UI
- **动画**: Framer Motion
- **数据可视化**: ECharts, Nivo, Three.js
- **代码高亮**: Prism.js
- **数学公式**: KaTeX
- **国际化**: i18next
- **包管理**: pnpm
- **搜索**: Kbar命令面板

### 项目结构

```
zhengbi-yong.github.io/
├── docs/                     # 项目文档
│   ├── README.md             # 项目总体说明
│   ├── PROJECT_GUIDE.md      # 详细项目指南
│   ├── usage.md              # 本使用手册
│   ├── backend_api_usage.md  # 后端API详细启动指南
│   ├── Blog_API.postman_collection.json # Postman API集合
│   ├── CLAUDE.md             # Claude Code 配置
│   ├── writing_guide.md      # 写作指南
│   └── ...                   # 其他文档
├── backend/                  # Rust 后端 API
│   ├── crates/               # Rust工作空间
│   │   ├── api/             # HTTP API层
│   │   ├── core/            # 核心业务逻辑
│   │   ├── db/              # 数据库模型
│   │   ├── shared/          # 共享类型和工具
│   │   └── worker/          # 后台任务
│   ├── docs/                 # 后端文档
│   │   ├── usage.md         # 后端使用指南（已合并到主docs）
│   │   └── Blog_API.postman_collection.json
│   ├── migrations/          # 数据库迁移文件
│   ├── src/                 # 源代码
│   ├── docker-compose.*.yml # Docker配置
│   ├── Cargo.toml          # 项目配置
│   ├── Dockerfile          # Docker构建文件
│   ├── .env.example        # 环境变量示例
│   └── deploy.sh           # 部署脚本
├── frontend/                # Next.js 前端
│   ├── app/                # Next.js App Router
│   │   ├── api/            # Next.js API Routes
│   │   ├── [locale]/       # 国际化路由
│   │   └── layout.tsx      # 根布局
│   ├── components/         # React 组件
│   │   ├── ui/             # 基础UI组件
│   │   └── ...             # 功能组件
│   ├── lib/                # 工具函数和配置
│   ├── layouts/            # 页面布局组件
│   ├── data/               # 博客内容(MDX文件)
│   │   └── blog/           # 博客文章分类
│   ├── public/             # 静态资源
│   ├── styles/             # 样式文件
│   ├── scripts/            # 构建脚本
│   └── 配置文件...
├── start.sh               # 一键启动脚本
├── .env.example           # 全局环境变量示例
└── 其他配置文件...
```

## 快速开始

### 后端快速启动

**详细的后端 API 启动指南请查看**: [backend_api_usage.md](./backend_api_usage.md)

后端快速启动命令：

```bash
cd backend

# 1. 启动数据库服务
docker compose up -d postgres redis

# 2. 编译项目
SQLX_OFFLINE=false cargo build

# 3. 运行服务器
cargo run

# 4. 验证服务
curl http://localhost:3000/healthz
```

后端 API 文档：
- Swagger UI: http://localhost:3000/swagger-ui/
- Postman Collection: [Blog_API.postman_collection.json](./Blog_API.postman_collection.json)

### 环境要求

- Rust 1.70+
- Node.js 18+ (推荐使用 Node.js 20)
- pnpm 8+
- Docker & Docker Compose
- PostgreSQL 15+ (如果不使用Docker)
- Redis 7+ (如果不使用Docker)

### 安装步骤

#### 1. 克隆项目
```bash
git clone https://github.com/zhengbi-yong/zhengbi-yong.github.io.git
cd zhengbi-yong.github.io
```

#### 2. 安装依赖

```bash
# 安装 Rust 依赖
cd backend
cargo build

# 安装前端依赖
cd ../frontend
pnpm install
```

#### 3. 配置环境变量

**后端配置** (backend/.env):
```bash
# 复制环境变量模板
cp backend/.env.example backend/.env

# 编辑配置文件
nano backend/.env
```

主要配置项：
```env
# 数据库配置
DATABASE_URL=postgresql://blog_user:blog_password@localhost:5432/blog_db

# Redis配置
REDIS_URL=redis://localhost:6379

# JWT密钥（请生成一个安全的密钥）
JWT_SECRET=your-super-secret-jwt-key-here-make-it-at-least-256-bits

# 服务器配置
HOST=127.0.0.1
PORT=3000

# 安全配置
PASSWORD_PEPPER=your-password-pepper-here
CORS_ORIGIN=http://localhost:3001

# 环境配置
RUST_LOG=info
ENVIRONMENT=development
```

**前端配置** (frontend/.env.local):
```env
# 后端API地址
NEXT_PUBLIC_API_URL=http://localhost:3000
NEXT_PUBLIC_API_BASE_URL=http://localhost:3000/api/v1

# 其他配置
NEXT_PUBLIC_SITE_URL=http://localhost:3001
```

### 启动服务

#### 方法1：一键启动（推荐）

**开发环境启动**:

```bash
# 启动完整开发环境（数据库 + 后端 + 前端）
./start-dev.sh

# 仅启动数据库和后端
./start-dev.sh --no-frontend

# 仅启动前端（数据库和后端已运行）
./start-dev.sh --no-backend --no-db

# 清理并重新构建
./start-dev.sh --clean
```

**生产环境部署**:

```bash
# 完整部署（构建镜像 + 启动服务）
./start-prod.sh deploy

# 仅启动服务（镜像已存在）
./start-prod.sh start

# 重启服务
./start-prod.sh restart

# 查看服务状态
./start-prod.sh status

# 查看日志
./start-prod.sh logs backend
./start-prod.sh logs frontend

# 停止服务
./start-prod.sh stop
```

#### 方法2：使用原有启动脚本

```bash
# 原有启动方式仍然支持
./start.sh
```

这会自动：
- 启动后端数据库服务（PostgreSQL + Redis）
- 启动后端API服务（端口3000）
- 启动前端开发服务器（端口3001）

#### 方法2：分别启动

**启动后端**：

> **推荐使用新脚本**:
> ```bash
> # 开发环境
> ./start-dev.sh --no-frontend   # 仅启动后端和数据库
>
> # 生产环境
> ./start-prod.sh deploy
> ```

**传统方式**:
```bash
cd backend

# 启动数据库服务
./deploy.sh dev

# 新开终端，启动API服务
./run-working-api.sh

# 或使用 Makefile
make quick-start
```

**启动前端**：
```bash
cd frontend

# 启动开发服务器（端口3001）
PORT=3001 pnpm dev
```

### 访问地址

- **前端应用**: http://localhost:3001
- **后端API**: http://localhost:3000
- **API文档**: http://localhost:3000/swagger-ui/
- **健康检查**: http://localhost:3000/healthz

## 开发指南

### 后端开发

> **详细的后端开发和启动指南请查看**: [backend_api_usage.md](./backend_api_usage.md)
>
> 该文档包含：
> - 完整的环境配置说明
> - 数据库迁移指南
> - API 端点参考
> - 故障排除方案
> - 生产部署指南

#### 项目结构说明

后端采用Rust Workspace模式，分为多个crate：

1. **api** - HTTP API层，处理路由和请求
2. **core** - 核心业务逻辑
3. **db** - 数据库模型和操作
4. **shared** - 共享类型和工具函数
5. **worker** - 后台任务处理

#### 开发流程

1. **添加新功能**：
   ```bash
   cd backend

   # 1. 修改业务逻辑 (crates/*/src/)
   # 2. 添加API路由 (crates/api/src/main.rs)
   # 3. 更新数据库模型 (crates/db/src/)
   ```

2. **运行测试**：
   ```bash
   cargo test
   ```

3. **数据库迁移**：
   ```bash
   # 创建新迁移
   sqlx migrate add <migration_name>

   # 运行迁移
   sqlx migrate run
   ```

4. **API文档**：
   启动服务后访问 http://localhost:3000/swagger-ui/

#### 示例：添加新的API端点

```rust
// 在 crates/api/src/main.rs 中添加路由
let app = Router::new()
    .route("/api/v1/health", get(health_check))
    .route("/api/v1/users", post(create_user))
    .route("/api/v1/users/:id", get(get_user))
    .layer(CorsLayer::permissive())
    .layer(TraceLayer::new_for_http());
```

### 前端开发

#### 项目结构说明

1. **app/** - Next.js App Router页面
2. **components/** - React组件
   - **ui/** - 基础UI组件
   - 其他功能组件
3. **lib/** - 工具函数和配置
4. **layouts/** - 页面布局组件
5. **data/** - MDX内容文件

#### 开发流程

1. **添加新页面**：
   ```bash
   cd frontend
   # 在 app/ 目录下创建新页面
   ```

2. **添加新组件**：
   ```bash
   # 在 components/ 目录下创建组件
   ```

3. **添加博客内容**：
   ```bash
   # 在 data/blog/[category]/ 目录下添加 .mdx 文件
   ```

4. **开发服务器自动热重载**：
   ```bash
   pnpm dev
   ```

#### 示例：调用后端API

```typescript
// lib/api.ts
export async function fetchPostStats(slug: string) {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}/posts/${slug}/stats`
  );
  return response.json();
}

// 在组件中使用
import { fetchPostStats } from '@/lib/api';

export default function PostPage({ params }: { params: { slug: string } }) {
  useEffect(() => {
    fetchPostStats(params.slug).then(setStats);
  }, [params.slug]);
}
```

### 数据库管理

#### 连接数据库

```bash
# 使用 Docker 容器连接
docker exec -it blog-postgres psql -U blog_user -d blog_db

# 或直接连接
psql postgresql://blog_user:blog_password@localhost:5432/blog_db
```

#### 常用命令

```sql
-- 查看所有表
\dt

-- 查看表结构
\d table_name

-- 查看索引
\di

-- 退出
\q
```

## API文档

### 认证相关

```
POST /api/v1/auth/register    # 用户注册
POST /api/v1/auth/login       # 用户登录
POST /api/v1/auth/logout      # 用户登出
POST /api/v1/auth/refresh     # 刷新Token
```

### 文章相关

```
GET    /api/v1/posts          # 获取文章列表
GET    /api/v1/posts/:slug    # 获取文章详情
POST   /api/v1/posts/:slug/view  # 记录浏览
GET    /api/v1/posts/:slug/stats # 获取统计
```

### 评论相关

```
GET    /api/v1/comments/:postSlug    # 获取文章评论
POST   /api/v1/comments              # 创建评论
PUT    /api/v1/comments/:id          # 更新评论
DELETE /api/v1/comments/:id          # 删除评论
```

详细的API文档请访问：http://localhost:3000/swagger-ui/

## 部署指南

### 开发环境部署

使用 Docker Compose：

```bash
cd backend
./deploy.sh dev
```

### 生产环境部署

#### 后端部署

```bash
cd backend

# 生产环境部署
./deploy.sh prod

# 或使用 Docker
docker-compose -f docker-compose.prod.yml up -d
```

#### 前端部署

```bash
cd frontend

# 构建生产版本
pnpm build

# 启动生产服务器
pnpm start
```

### 环境变量配置

生产环境需要配置以下环境变量：

```env
# 后端 .env.production
ENVIRONMENT=production
RUST_LOG=warn
DATABASE_URL=postgresql://user:pass@prod-db:5432/db
REDIS_URL=redis://prod-redis:6379
JWT_SECRET=production-jwt-secret
CORS_ORIGIN=https://yourdomain.com

# 前端 .env.production
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
NEXT_PUBLIC_API_BASE_URL=https://api.yourdomain.com/api/v1
NEXT_PUBLIC_SITE_URL=https://yourdomain.com
```

## 常见问题

### 1. 端口冲突

如果3000或3001端口被占用：

```bash
# 查看端口占用
lsof -i :3000
lsof -i :3001

# 修改端口配置
# 后端：修改 backend/.env 中的 PORT
# 前端：修改启动命令中的 PORT
```

### 2. 数据库连接失败

检查数据库服务是否启动：

```bash
# Docker方式
docker ps | grep postgres

# 系统服务
sudo systemctl status postgresql
```

### 3. Rust编译错误

确保使用正确的Rust版本：

```bash
# 更新Rust
rustup update

# 检查版本
rustc --version
```

### 4. Node.js版本问题

推荐使用 nvm 管理 Node.js 版本：

```bash
# 安装 nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# 安装并使用 Node.js 20
nvm install 20
nvm use 20
```

## 贡献指南

项目遵循5模式开发协议：

1. **RESEARCH** - 信息收集和研究
2. **INNOVATE** - 创意构思和设计
3. **PLAN** - 技术规划和架构设计
4. **EXECUTE** - 实施开发和编码
5. **REVIEW** - 验证回顾和优化

### 开发流程

1. Fork项目
2. 创建功能分支：`git checkout -b feature/new-feature`
3. 提交更改：`git commit -am 'Add new feature'`
4. 推送分支：`git push origin feature/new-feature`
5. 创建Pull Request

### 代码规范

- Rust: 使用 `cargo fmt` 格式化代码
- TypeScript/React: 使用 ESLint 和 Prettier
- 提交信息遵循 Conventional Commits

## 联系方式

- 作者：雍征彼 (Zhengbi Yong)
- 邮箱：zhengbi.yong@outlook.com
- GitHub：https://github.com/zhengbi-yong

## 相关文档

- [start_scripts.md](./start_scripts.md) - 启动脚本详细说明 ⭐
- [backend_api_usage.md](./backend_api_usage.md) - 后端 API 详细启动和使用指南
- [Blog_API.postman_collection.json](./Blog_API.postman_collection.json) - Postman API 测试集合
- [README.md](./README.md) - 项目总体说明
- [CLAUDE.md](./CLAUDE.md) - Claude Code 配置说明
- [writing_guide.md](./writing_guide.md) - 写作指南

## 快速启动脚本

### 开发环境

```bash
# 完整开发环境（数据库 + 后端 + 前端）
./start-dev.sh

# 仅后端和数据库
./start-dev.sh --no-frontend

# 清理并重新构建
./start-dev.sh --clean
```

### 生产环境

```bash
# 完整部署
./start-prod.sh deploy

# 仅启动服务
./start-prod.sh start

# 查看状态
./start-prod.sh status

# 查看日志
./start-prod.sh logs backend
```

详细用法请参考: [start_scripts.md](./start_scripts.md)

## 许可证

本项目采用 MIT 许可证。详见 [LICENSE](../LICENSE) 文件。

# 雍征彼个人博客项目指南

## 项目概述

这是一个现代化的个人博客系统，采用前后端分离架构，使用 Rust 作为后端 API，Next.js 作为前端框架。

### 技术栈

#### 后端 (Rust)
- **框架**: Axum - 高性能异步 Web 框架
- **数据库**: PostgreSQL 15
- **缓存**: Redis 7
- **异步运行时**: Tokio
- **序列化**: Serde
- **认证**: JWT

#### 前端 (Next.js)
- **框架**: Next.js 16.0.10 with Turbopack
- **样式**: Tailwind CSS
- **UI 组件**: 自定义组件
- **内容管理**: Contentlayer2
- **语言**: TypeScript

#### 基础设施
- **容器化**: Docker
- **开发工具**: Node.js, Rust, Cargo
- **包管理**: npm (前端), cargo (后端)

## 项目结构

```
zhengbi-yong.github.io/
├── README.md                      # 项目总体说明
├── CLAUDE.md                      # Claude Code 项目配置
├── PROJECT_GUIDE.md              # 本指南文件
│
├── blog-backend/                   # Rust 后端 API
│   ├── Dockerfile                  # Docker 构建文件
│   ├── Makefile                   # 构建/部署脚本
│   ├── deploy.sh                  # 部署脚本
│   ├── run-local.sh               # 本地运行脚本
│   ├── test-api.sh                # API 测试脚本
│   │
│   ├── crates/                    # Rust 工作空间
│   │   ├── api/                   # HTTP API 层
│   │   ├── core/                  # 核心业务逻辑
│   │   ├── db/                    # 数据库模型
│   │   └── shared/                # 共享类型
│   │
│   ├── migrations/                # 数据库迁移文件
│   ├── docker-compose.*.yml       # Docker Compose 配置
│   ├── Cargo.toml                 # Rust 项目配置
│   └── Cargo.lock                 # 依赖锁定文件
│
├── blog-frontend/                 # Next.js 前端
│   ├── app/                       # 应用目录
│   │   ├── (page files)           # Next.js 页面
│   │   ├── api/                   # API 路由
│   │   └── layout.tsx             # 根布局
│   │
│   ├── components/                 # React 组件
│   │   ├── ui/                     # UI 基础组件
│   │   └── (feature components)   # 功能组件
│   │
│   ├── lib/                       # 工具库
│   │   ├── utils.ts               # 通用工具
│   │   └── (other libs)           # 其他库文件
│   │
│   ├── public/                    # 静态资源
│   ├── styles/                    # 样式文件
│   ├── .env.local                 # 本地环境变量
│   ├── package.json              # NPM 配置
│   ├── next.config.js             # Next.js 配置
│   └── tailwind.config.js         # Tailwind 配置
│
├── app/                           # 原始 Next.js 项目（旧版）
├── data/                          # 内容数据
│   └── blog/                      # 博客内容
│
└── 其他配置文件...
    - .gitignore
    - LICENSE
    - etc.
```

## 完整启动指南

### 前置条件

确保你的系统已安装以下工具：

1. **Docker 和 Docker Compose**
   ```bash
   docker --version
   docker compose version
   ```

2. **Rust 和 Cargo**
   ```bash
   rustc --version
   cargo --version
   ```

3. **Node.js 和 npm**
   ```bash
   node --version
   npm --version
   ```

4. **Git**
   ```bash
   git --version
   ```

### 第一步：启动后端服务

1. **进入后端目录**
   ```bash
   cd zhengbi-yong.github.io/blog-backend
   ```

2. **启动数据库服务（PostgreSQL 和 Redis）**
   ```bash
   ./deploy.sh dev
   ```

   这将启动：
   - PostgreSQL 在端口 5432
   - Redis 在端口 6379

3. **验证服务状态**
   ```bash
   ./deploy.sh status
   ```

4. **启动后端 API 服务**
   ```bash
   make quick-start
   ```

   或者直接使用：
   ```bash
   ./run-working-api.sh
   ```

   后端将在端口 3000 启动。

5. **测试后端 API**
   ```bash
   curl http://localhost:3000/health
   curl http://localhost:3000/api/v1/posts
   ```

### 第二步：启动前端应用

1. **进入前端目录**
   ```bash
   cd ../blog-frontend
   ```

2. **安装依赖（首次运行需要）**
   ```bash
   npm install
   ```

3. **配置环境变量**
   创建 `.env.local` 文件（如果不存在）：
   ```bash
   cp .env.example .env.local
   ```

   编辑 `.env.local`，添加后端 API 地址：
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:3000
   NEXT_PUBLIC_API_BASE_URL=http://localhost:3000/api/v1
   ```

4. **启动前端开发服务器**
   ```bash
   npm run dev
   ```

   前端将在端口 3001 启动（端口 3000 已被后端占用）。

5. **访问前端应用**
   在浏览器中打开：http://localhost:3001

### 第三步：验证完整系统

1. **打开浏览器** 访问 http://localhost:3001

2. **检查前后端连接**
   - 打开浏览器开发者工具 (F12)
   - 在控制台输入：
     ```javascript
     fetch('http://localhost:3000/api/v1/posts')
       .then(res => res.json())
       .then(data => console.log('Posts:', data))
       .catch(err => console.error('Error:', err));
     ```

3. **查看页面功能**
   - 导航到不同页面
   - 检查是否正常加载内容
   - 确认 API 调用正常

## 开发工作流

### 日常开发

1. **启动服务**
   ```bash
   # 后端
   cd blog-backend
   ./run-working-api.sh

   # 前端（在另一个终端）
   cd blog-frontend
   npm run dev
   ```

2. **修改代码**
   - 前端修改后自动热重载
   - 后端需要重新启动服务器

3. **测试 API**
   ```bash
   # 使用提供的测试脚本
   cd blog-backend
   ./test-api.sh
   ```

### 数据库操作

```bash
# 连接到 PostgreSQL
docker exec -it blog-postgres psql -U blog_user -d blog_db

# 查看所有表
\dt

# 退出
\q
```

### 日志查看

```bash
# 查看后端日志（运行中）
# API 的日志会直接显示在终端

# 查看 Docker 服务日志
docker logs blog-postgres
docker logs blog-redis
```

## 停止服务

### 完全停止所有服务

1. **停止后端**
   ```bash
   # 在后端终端按 Ctrl+C
   ```

2. **停止前端**
   ```bash
   # 在前端终端按 Ctrl+C
   ```

3. **停止数据库服务**
   ```bash
   cd blog-backend
   ./deploy.sh stop
   ```

### 仅停止应用服务

```bash
# 停止后端 API（保留数据库）
lsof -i :3000
kill <PID>

# 停止前端（保留数据库）
lsof -i :3001
kill <PID>
```

## 故障排除

### 端口占用问题

如果遇到端口已被占用：

```bash
# 查看端口占用情况
lsof -i :3000  # 后端
lsof -i :3001  # 前端
lsof -i :5432  # PostgreSQL
lsof -i :6379  # Redis

# 停止占用端口的进程
kill -9 <PID>
```

### Docker 问题

```bash
# 重启 Docker 服务
sudo systemctl restart docker

# 清理 Docker 资源
docker system prune -a
```

### 数据库连接问题

```bash
# 检查数据库服务状态
docker ps | grep postgres

# 重启数据库
docker restart blog-postgres

# 检查数据库日志
docker logs blog-postgres
```

### 前端构建问题

```bash
# 清理 Next.js 缓存
rm -rf .next
rm -rf out

# 重新安装依赖
rm -rf node_modules package-lock.json
npm install
```

## API 文档

### 后端 API 端点

| 方法 | 路径 | 描述 |
|------|------|------|
| GET | `/` | 欢迎信息 |
| GET | `/health` | 健康检查 |
| GET | `/api/v1/status` | API 状态 |
| GET | `/api/v1/posts` | 获取所有文章 |
| GET | `/api/v1/posts/:slug` | 获取特定文章 |

### 请求示例

```javascript
// 获取所有文章
fetch('http://localhost:3000/api/v1/posts')
  .then(res => res.json())
  .then(posts => console.log(posts));

// 获取特定文章
fetch('http://localhost:3000/api/v1/posts/sample-post-1')
  .then(res => res.json())
  .then(post => console.log(post));
```

## 生产部署

### Docker 生产环境

```bash
cd blog-backend

# 使用生产配置
./deploy.sh prod
```

### 构建前端

```bash
cd blog-frontend

# 构建生产版本
npm run build

# 启动生产服务器
npm run serve
```

## 贡献指南

1. Fork 项目
2. 创建功能分支
3. 提交更改
4. 推送到分支
5. 创建 Pull Request

## 许可证

请查看项目根目录的 LICENSE 文件。

## 联系方式

如有问题或建议，请创建 Issue 或联系项目维护者。

---

祝你开发愉快！🚀

# 快速开始

本指南将帮助你在 5 分钟内启动博客平台。

---

## 🚀 方式选择

根据你的需求和开发环境选择合适的启动方式：

| 启动方式 | 适用场景 | 难度 | 时间 |
|---------|---------|------|------|
| **Docker 一键启动** | 跨平台、快速开始、完整环境 | ⭐ | 5 分钟 |
| **传统开发模式** | 前后端分离、自定义开发 | ⭐⭐ | 10 分钟 |

---

## 方式 A: Docker 一键启动（推荐）

这是最简单、最可靠的方式，适合所有平台（Windows, macOS, Linux）。

### 前置要求

- **Docker** 和 **Docker Compose**

### 三步启动

#### 1️⃣ 克隆项目

```bash
git clone https://github.com/zhengbi-yong/zhengbi-yong.github.io.git
cd zhengbi-yong.github.io
```

#### 2️⃣ 配置环境变量

```bash
# 复制环境变量模板
cp .env.docker.example .env

# 开发环境可以使用默认配置
# 生产环境请参考部署文档修改安全配置
```

#### 3️⃣ 启动所有服务

```bash
docker compose up -d
```

**首次启动需要 5-10 分钟构建镜像**

### 访问应用

打开浏览器访问：

- **前端**: http://localhost:3001
- **后端 API**: http://localhost:3000
- **通过 Nginx**: http://localhost

### 常用命令

```bash
# 查看服务状态
docker compose ps

# 查看日志
docker compose logs -f

# 停止服务
docker compose down

# 重启服务
docker compose restart
```

### 详细指南

📖 **[Docker 跨平台快速启动](docker-quick-start.md)** - 详细的 Docker 部署指南

---

## 方式 B: 传统开发模式

如果你更喜欢分别启动前端和后端，或者需要自定义开发环境。

### 平台特定文档

根据你的操作系统选择对应的详细指南：

- 📖 **[Windows 本地开发](local-development-windows.md)** - WSL2 和原生 Windows
- 📖 **[macOS 本地开发](local-development-macos.md)** - Apple Silicon 和 Intel
- 📖 **[Linux 本地开发](local-development-linux.md)** - Ubuntu, Debian, Fedora, Arch

### 前置要求

- **Node.js** 20+ 和 **pnpm** (前端开发)
- **Rust** 1.70+ 和 **Cargo** (后端开发)
- **Docker** 和 **Docker Compose** (数据库)

### 三步启动

#### 1️⃣ 克隆项目

```bash
git clone https://github.com/zhengbi-yong/zhengbi-yong.github.io.git
cd zhengbi-yong.github.io
```

#### 2️⃣ 启动前端

```bash
cd frontend
pnpm install
pnpm dev
```

前端将在 **http://localhost:3001** 启动

#### 3️⃣ 启动后端（可选）

如果需要完整的后端功能（用户认证、评论管理等）：

```bash
cd backend
./deploy.sh dev
# 等待数据库启动完成

export DATABASE_URL=postgresql://blog_user:blog_password@localhost:5432/blog_db
export REDIS_URL=redis://localhost:6379
cargo run --bin blog-api
```

后端 API 将在 **http://localhost:3000** 启动

### 访问应用

- **前端**: http://localhost:3001
- **API 文档** (如已启动后端): http://localhost:3000/swagger-ui/
- **健康检查**: http://localhost:3000/health

---

## 默认配置

### 开发环境端口

- 前端: `3001`
- 后端 API: `3000`
- PostgreSQL: `5432`
- Redis: `6379`

### 数据库默认账号

- **用户**: `blog_user`
- **密码**: `blog_password`
- **数据库**: `blog_db`

---

## 下一步

安装完成后，建议你：

1. 📖 阅读 [环境配置](environment-setup.md) 了解详细配置
2. ✍️ 查看 [内容管理](../guides/content-management.md) 学习如何创建文章
3. 🎨 探索 [写作指南](../guides/writing-guide.md) 了解 MDX 组件使用
4. 🚀 参考 [服务器部署](../deployment/SERVER_DEPLOYMENT_GUIDE.md) 准备生产环境

---

## 常见问题

### 端口被占用

如果端口已被使用，可以修改：

**前端**:
```bash
cd frontend
PORT=3002 pnpm dev
```

**后端** (修改 `.env`):
```bash
BACKEND_PORT=3002
```

**Docker 方式**:
编辑 `.env` 文件：
```bash
FRONTEND_PORT=3002
BACKEND_PORT=3002
```

### Docker 相关问题

**Docker 服务未启动**:
- Windows/macOS: 打开 Docker Desktop
- Linux: `sudo systemctl start docker`

**权限错误** (Linux):
```bash
sudo usermod -aG docker $USER
newgrp docker
```

### 依赖安装失败

**前端**:
```bash
cd frontend
rm -rf node_modules
pnpm install
```

**后端**:
```bash
cd backend
cargo clean
cargo build
```

---

## 快速命令参考

### Docker 方式

```bash
docker compose up -d          # 启动所有服务
docker compose ps             # 查看服务状态
docker compose logs -f        # 查看日志
docker compose down           # 停止服务
docker compose restart        # 重启服务
```

### 前端

```bash
cd frontend
pnpm dev              # 启动开发服务器
pnpm build            # 构建生产版本
pnpm lint             # 运行代码检查
pnpm test             # 运行测试
```

### 后端

```bash
cd backend
./deploy.sh dev       # 启动开发数据库
./deploy.sh prod      # 启动生产环境
./deploy.sh stop      # 停止所有服务
./deploy.sh status    # 查看服务状态
cargo run             # 运行 API 服务
cargo test            # 运行测试
```

---

## 获取帮助

如果遇到问题：

1. 查看 [故障排查](troubleshooting.md)
2. 查看平台特定文档（Windows/macOS/Linux）
3. 搜索 [GitHub Issues](https://github.com/zhengbi-yong/zhengbi-yong.github.io/issues)
4. 创建新 Issue 寻求帮助

---

**相关文档**:
- [Docker 快速启动](docker-quick-start.md) - Docker 部署详细指南
- [安装指南](installation.md) - 详细的安装步骤
- [环境配置](environment-setup.md) - 环境变量配置
- [故障排查](troubleshooting.md) - 常见问题解决

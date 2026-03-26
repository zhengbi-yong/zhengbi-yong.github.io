# 安装指南

本指南提供详细的安装步骤，帮助你在本地环境中搭建完整的开发环境。

## 目录

- [系统要求](#系统要求)
- [安装前端依赖](#安装前端依赖)
- [安装后端依赖](#安装后端依赖)
- [数据库配置](#数据库配置)
- [验证安装](#验证安装)

## 系统要求

### 最低要求

- **操作系统**: Windows 10+, macOS 10.15+, 或 Linux (Ubuntu 20.04+)
- **内存**: 8 GB RAM (推荐 16 GB)
- **磁盘空间**: 5 GB 可用空间
- **网络**: 稳定的互联网连接

### 必需软件

#### 前端开发

- **Node.js** 20.0.0 或更高版本
- **pnpm** 10.24.0 或更高版本

#### 后端开发

- **Rust** 1.70.0 或更高版本
- **Cargo** (随 Rust 一起安装)

#### 数据库

- **Docker** 20.10.0 或更高版本
- **Docker Compose** 2.0.0 或更高版本

## 安装前端依赖

### 1. 安装 Node.js

**macOS / Linux**:
```bash
# 使用 nvm (推荐)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
source ~/.bashrc
nvm install 20
nvm use 20
```

**Windows**:
从 [nodejs.org](https://nodejs.org/) 下载并安装 LTS 版本

**验证安装**:
```bash
node --version
# 应显示: v20.x.x
```

### 2. 安装 pnpm

```bash
npm install -g pnpm
```

**验证安装**:
```bash
pnpm --version
# 应显示: 10.x.x
```

### 3. 安装前端依赖

```bash
cd frontend
pnpm install
```

这将安装所有必需的 npm 包，包括：
- Next.js 16
- React 19
- TypeScript
- Tailwind CSS 4
- 以及所有其他依赖

**安装时间**: 约 2-5 分钟（取决于网络速度）

## 安装后端依赖

### 1. 安装 Rust

**macOS / Linux**:
```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source ~/.bashrc
```

**Windows**:
从 [rustup.rs](https://rustup.rs/) 下载并安装 rustup-init.exe

**验证安装**:
```bash
rustc --version
# 应显示: rustc 1.7x.x
cargo --version
# 应显示: cargo 1.7x.x
```

### 2. 安装 SQLx CLI (可选)

用于数据库迁移管理：

```bash
cargo install sqlx-cli --no-default-features --features rustls,postgres
```

### 3. 构建后端项目

```bash
cd backend
cargo build
```

**构建时间**: 首次约 5-10 分钟（取决于 CPU 性能）

## 数据库配置

本项目使用 Docker Compose 运行 PostgreSQL 和 Redis。

### 1. 安装 Docker

**macOS**:
下载 [Docker Desktop for Mac](https://www.docker.com/products/docker-desktop/)

**Windows**:
下载 [Docker Desktop for Windows](https://www.docker.com/products/docker-desktop/)

**Linux (Ubuntu)**:
```bash
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER
# 重新登录以应用组更改
```

### 2. 安装 Docker Compose

Docker Compose 通常随 Docker Desktop 一起安装。

**Linux 独立安装**:
```bash
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

**验证安装**:
```bash
docker --version
docker compose version
```

### 3. 启动数据库

```bash
docker compose -f docker-compose.dev.yml up -d
```

这将启动：
- PostgreSQL (端口 5432)
- Redis (端口 6379)

**验证数据库**:
```bash
docker ps
# 应显示 postgres 和 redis 容器正在运行
```

### 4. 运行数据库迁移

```bash
cd backend
cargo run -p blog-migrator
```

或使用 Cargo：
```bash
cargo run --bin migrate
```

## 验证安装

### 1. 检查前端

```bash
cd frontend
pnpm dev
```

打开浏览器访问 http://localhost:3001

**预期结果**: 看到博客首页

### 2. 检查后端

```bash
cd backend
export DATABASE_URL=postgresql://blog_user:blog_password@localhost:5432/blog_db
export REDIS_URL=redis://localhost:6379
cargo run -p blog-api --bin api
```

打开浏览器访问 http://localhost:3000/health

**预期结果**:
```json
{
  "status": "healthy"
}
```

### 3. 运行测试

**前端测试**:
```bash
cd frontend
pnpm test
```

**后端测试**:
```bash
cd backend
cargo test
```

## 常见问题

### Node.js 版本不匹配

如果看到 "unsupported Node.js version" 错误：

```bash
# 使用 nvm 安装正确的版本
nvm install 20
nvm use 20
```

### Rust 编译错误

确保 Rust 工具链是最新的：

```bash
rustup update
rustup update stable
```

### Docker 权限错误 (Linux)

```bash
sudo usermod -aG docker $USER
# 重新登录或运行
newgrp docker
```

### 端口冲突

如果默认端口已被占用：

**修改端口** (创建 `.env` 文件)：
```bash
# 后端
PORT=3002

# 前端 (在 next.config.js 中修改)
```

### Windows 特定问题

**PowerShell 执行策略错误**:
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

**路径过长错误**:
- 启用 Windows 长路径支持，或
- 将项目放在较短的路径（如 `C:\dev\blog`）

## 开发工具推荐

### 代码编辑器

- **VS Code** (推荐)
  - 扩展: ESLint, Prettier, Tailwind CSS IntelliSense
  - 扩展: Rust Analyzer (用于后端)

### 数据库工具

- **DBeaver** 或 **pgAdmin** (PostgreSQL 客户端)
- **Redis Desktop Manager** (Redis 客户端)

### API 测试

- **Postman** 或 **Insomnia**
- 导入 `/backend/docs/Blog_API.postman_collection.json`

## 下一步

安装完成后：

1. 配置 [环境变量](environment-setup.md)
2. 阅读 [内容管理](../guides/content-management.md)
3. 查看 [开发文档](../development/)

---

**相关文档**:
- [快速开始](quick-start.md) - 5分钟快速启动
- [环境配置](environment-setup.md) - 详细的环境变量配置
- [故障排查](troubleshooting.md) - 解决常见问题

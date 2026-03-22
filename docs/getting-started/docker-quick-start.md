# Docker 跨平台快速部署指南

**适用版本**: v1.8.0+
**支持平台**: Windows, macOS, Linux
**预计时间**: 10-15 分钟
**难度等级**: ⭐ (非常简单)

---

## 📋 目录

1. [为什么使用 Docker](#为什么使用-docker)
2. [安装 Docker](#安装-docker)
3. [快速启动](#快速启动)
4. [配置选项](#配置选项)
5. [常用命令](#常用命令)
6. [常见问题](#常见问题)

---

## 为什么使用 Docker

Docker 是最简单、最可靠的部署方式，具有以下优势：

✅ **跨平台一致性**: Windows、macOS、Linux 完全相同的运行环境
✅ **一键启动**: 无需手动安装 Node.js、Rust、PostgreSQL、Redis
✅ **环境隔离**: 不污染本地开发环境
✅ **快速部署**: 5 分钟内完成所有服务的启动
✅ **易于维护**: 简单的命令即可管理所有服务

---

## 安装 Docker

### Windows

#### 1. 系统要求

- Windows 10 64-bit: Pro, Enterprise, or Education (Build 16299 或更高)
- Windows 11 64-bit: Home 或 Pro
- 启用 Hyper-V 和 Containers 功能

#### 2. 安装 Docker Desktop

**下载安装包**:
- 访问 https://www.docker.com/products/docker-desktop/
- 下载 Windows 版本
- 运行安装程序

**安装选项**:
- ✅ Use WSL 2 based engine (强烈推荐)
- ✅ Add shortcut to desktop

#### 3. 验证安装

打开 PowerShell 或 Command Prompt:

```powershell
docker --version
docker compose version
```

**预期输出**:
```
Docker version 24.x.x
Docker Compose version v2.x.x
```

---

### macOS

#### 1. 系统要求

- macOS 11 (Big Sur) 或更高版本
- Apple Silicon (M1/M2/M3) 或 Intel 处理器

#### 2. 安装 Docker Desktop

**使用 Homebrew（推荐）**:
```bash
brew install --cask docker
```

**或下载安装包**:
- 访问 https://www.docker.com/products/docker-desktop/
- 下载 macOS 版本
- 拖拽到 Applications 文件夹

#### 3. 启动 Docker

打开 Applications → Docker，等待 Docker 启动完成（菜单栏会出现 Docker 图标）。

#### 4. 验证安装

打开终端:
```bash
docker --version
docker compose version
```

---

### Linux

#### Ubuntu/Debian

```bash
# 更新包索引
sudo apt update

# 安装必要依赖
sudo apt install -y \
    ca-certificates \
    curl \
    gnupg \
    lsb-release

# 添加 Docker 官方 GPG 密钥
sudo mkdir -p /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg

# 设置 Docker 仓库
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# 安装 Docker
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

# 启动 Docker
sudo systemctl start docker
sudo systemctl enable docker

# 将当前用户添加到 docker 组
sudo usermod -aG docker $USER
newgrp docker

# 验证安装
docker --version
docker compose version
```

#### Fedora

```bash
# 添加 Docker 仓库
sudo dnf -y install dnf-plugins-core
sudo dnf config-manager --add-repo https://download.docker.com/linux/fedora/docker-ce.repo

# 安装 Docker
sudo dnf install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

# 启动 Docker
sudo systemctl start docker
sudo systemctl enable docker

# 将当前用户添加到 docker 组
sudo usermod -aG docker $USER
newgrp docker

# 验证安装
docker --version
docker compose version
```

#### Arch Linux

```bash
# 安装 Docker
sudo pacman -S docker docker-compose

# 启动 Docker
sudo systemctl start docker
sudo systemctl enable docker

# 将当前用户添加到 docker 组
sudo usermod -aG docker $USER
newgrp docker

# 验证安装
docker --version
docker compose version
```

---

## 快速启动

### 步骤 1: 克隆项目

```bash
# 使用 Git 克隆
git clone https://github.com/zhengbi-yong/zhengbi-yong.github.io.git
cd zhengbi-yong.github.io
```

### 步骤 2: 配置环境变量

```bash
# 复制环境变量模板
cp .env.docker.example .env

# 编辑环境变量
# Windows PowerShell
notepad .env

# Windows VS Code
code .env

# macOS/Linux
nano .env
# 或
vim .env
```

**开发环境可以使用默认配置**，但生产环境**必须修改**以下配置：

```bash
# ⚠️ 生产环境必须修改
JWT_SECRET=your_jwt_secret_at_least_32_characters_long
PASSWORD_PEPPER=your_password_pepper_at_least_32_characters_long
SESSION_SECRET=your_session_secret_at_least_32_characters_long
POSTGRES_PASSWORD=your_secure_postgres_password
```

**生成安全密钥**:

```bash
# macOS/Linux
openssl rand -base64 32

# Windows PowerShell
-join ((48..57) + (65..90) + (97..122) | Get-Random -Count 32 | % {[char]$_})
```

### 步骤 3: 启动所有服务

```bash
# 构建并启动所有服务（首次运行约 5-10 分钟）
docker compose up -d

# 查看服务状态
docker compose ps
```

**预期输出**:
```
NAME                IMAGE                      STATUS
blog-postgres       postgres:17-alpine         Up (healthy)
blog-redis          redis:7.4-alpine           Up (healthy)
blog-backend        blog-backend:latest        Up (healthy)
blog-frontend       blog-frontend:latest       Up (healthy)
blog-nginx          nginx:1.27-alpine          Up
```

### 步骤 4: 查看日志

```bash
# 查看所有服务日志
docker compose logs -f

# 查看特定服务日志
docker compose logs -f backend
docker compose logs -f frontend
docker compose logs -f postgres
docker compose logs -f redis

# 查看最近 100 行日志
docker compose logs --tail=100
```

### 步骤 5: 访问应用

打开浏览器访问：

- **前端**: http://localhost:3001
- **后端 API**: http://localhost:3000
- **通过 Nginx**: http://localhost
- **健康检查**: http://localhost:3000/health

---

## 配置选项

### 端口配置

编辑 `.env` 文件修改端口：

```bash
# 前端端口
FRONTEND_PORT=3001

# 后端端口
BACKEND_PORT=3000

# PostgreSQL 端口（开发环境可以暴露）
POSTGRES_PORT=5432

# Redis 端口（开发环境可以暴露）
REDIS_PORT=6379

# Nginx 端口
NGINX_HTTP_PORT=80
NGINX_HTTPS_PORT=443
```

### 资源限制

编辑 `docker-compose.production.yml` 添加资源限制：

```yaml
services:
  backend:
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 2G
        reservations:
          cpus: '0.5'
          memory: 512M

  frontend:
    deploy:
      resources:
        limits:
          cpus: '1'
          memory: 1G
        reservations:
          cpus: '0.25'
          memory: 256M
```

### 开发模式

**启用热重载**:

修改 `docker-compose.dev.yml`:

```yaml
services:
  frontend:
    command: pnpm dev
    volumes:
      - ./frontend:/app
      - /app/node_modules
      - /app/.next
```

---

## 常用命令

### 服务管理

```bash
# 启动所有服务
docker compose up -d

# 停止所有服务
docker compose down

# 停止并删除数据卷（清空数据库）
docker compose down -v

# 重启所有服务
docker compose restart

# 重启特定服务
docker compose restart backend

# 查看服务状态
docker compose ps

# 查看服务资源使用
docker stats
```

### 日志管理

```bash
# 查看所有服务日志
docker compose logs

# 实时查看日志
docker compose logs -f

# 查看特定服务日志
docker compose logs -f backend

# 查看最近 100 行日志
docker compose logs --tail=100

# 查看最近 10 分钟的日志
docker compose logs --since 10m
```

### 数据库管理

```bash
# 连接到 PostgreSQL
docker compose exec postgres psql -U blog_user -d blog_db

# 备份数据库
docker compose exec postgres pg_dump -U blog_user blog_db > backup.sql

# 恢复数据库
docker compose exec -T postgres psql -U blog_user blog_db < backup.sql

# 查看 Redis 数据
docker compose exec redis redis-cli

# 清空 Redis 数据
docker compose exec redis redis-cli FLUSHALL
```

### 构建和更新

```bash
# 重新构建镜像
docker compose build

# 重新构建并启动
docker compose up -d --build

# 强制重新构建（不使用缓存）
docker compose build --no-cache

# 拉取最新镜像
docker compose pull

# 更新并重启
docker compose up -d --build
```

### 容器操作

```bash
# 进入容器
docker compose exec backend bash
docker compose exec frontend sh

# 在容器中执行命令
docker compose exec backend cargo test

# 查看容器详细信息
docker compose top

# 复制文件到容器
docker compose cp backend/test.txt /app/

# 从容器复制文件
docker compose exec backend cat /app/test.txt > test.txt
```

### 清理资源

```bash
# 清理停止的容器
docker container prune

# 清理未使用的镜像
docker image prune -a

# 清理未使用的卷
docker volume prune

# 清理未使用的网络
docker network prune

# 清理所有未使用的资源
docker system prune -a

# 查看磁盘使用
docker system df
```

---

## 常见问题

### Docker 相关问题

#### 问题 1: Docker 服务未启动

**症状**: `Cannot connect to the Docker daemon`

**解决方案**:

**Windows/macOS**:
- 打开 Docker Desktop
- 等待 Docker 完全启动（菜单栏图标不再跳动）

**Linux**:
```bash
sudo systemctl start docker
sudo systemctl enable docker
```

#### 问题 2: 权限错误

**症状**: `permission denied while trying to connect to the Docker daemon socket`

**解决方案**:

**Linux**:
```bash
# 将用户添加到 docker 组
sudo usermod -aG docker $USER
newgrp docker

# 或使用 sudo
sudo docker compose up -d
```

#### 问题 3: 端口被占用

**症状**: `port is already allocated`

**解决方案**:

```bash
# 查找占用端口的进程
# Windows PowerShell
Get-NetTCPConnection -LocalPort 3000

# macOS/Linux
lsof -i :3000

# 终止进程或修改 docker-compose.dev.yml 中的端口映射
```

#### 问题 4: 容器无法启动

**症状**: `docker compose ps` 显示 Exit 1 或 Restarting

**解决方案**:

```bash
# 查看详细日志
docker compose logs backend

# 常见原因：
# 1. 端口被占用 → 修改端口
# 2. 环境变量错误 → 检查 .env 文件
# 3. 内存不足 → 增加 swap 或内存
# 4. 镜像损坏 → 重新构建
docker compose build --no-cache backend
```

### 性能问题

#### 问题 5: 构建速度慢

**症状**: `docker compose build` 耗时过长

**解决方案**:

```bash
# 使用 Docker 构建缓存（默认启用）
# 无需额外操作

# 使用多阶段构建（已在 Dockerfile 中配置）
# 无需额外操作

# 增加 Docker 资源限制
# Docker Desktop → Settings → Resources → Advanced
# - Memory: 8 GB+
# - CPU: 4+
```

#### 问题 6: 容器运行慢

**症状**: 应用响应缓慢

**解决方案**:

```bash
# 查看容器资源使用
docker stats

# 增加资源限制（编辑 docker-compose.production.yml）
# 见上文"资源限制"部分

# 清理未使用的资源
docker system prune -a
```

### 网络问题

#### 问题 7: 容器无法访问外网

**症状**: 容器内无法下载依赖或访问 API

**解决方案**:

```bash
# 重启 Docker 网络
docker network prune

# 重启 Docker 服务
# Windows/macOS: 重启 Docker Desktop
# Linux:
sudo systemctl restart docker

# 检查防火墙设置
```

#### 问题 8: 宿主机无法访问容器

**症状**: 浏览器无法访问 localhost:3001

**解决方案**:

```bash
# 检查端口映射
docker compose ps

# 确认端口已正确映射
# 0.0.0.0:3001->3001/tcp 表示可以从外部访问
# 127.0.0.1:3001->3001/tcp 表示只能从本机访问

# 检查防火墙
# Windows: 允许 Docker Desktop 通过防火墙
# macOS: 系统偏好设置 → 安全性与隐私 → 防火墙
# Linux:
sudo ufw allow 3001/tcp
```

### 数据持久化

#### 问题 9: 数据丢失

**症状**: 重启容器后数据消失

**解决方案**:

```bash
# 确认使用了 Docker 卷
docker volume ls

# 应该看到：
# blog_postgres_data
# blog_redis_data

# 备份数据
docker compose exec postgres pg_dump -U blog_user blog_db > backup.sql

# 恢复数据
docker compose exec -T postgres psql -U blog_user blog_db < backup.sql
```

### 平台特定问题

#### Windows 特定

**问题 10: WSL2 文件系统性能**

**症状**: 在 `/mnt/c/` 中运行 Docker 非常慢

**解决方案**:
- 将项目放在 WSL2 文件系统中（`~/`）
- 不要放在 Windows 文件系统（`/mnt/c/`）中

#### macOS 特定

**问题 11: 文件监控限制**

**症状**: 热重载不工作

**解决方案**:
```bash
# 增加文件监控限制
sudo launchctl limit maxfiles 65536 200000
```

#### Linux 特定

**问题 12: 文件监控限制**

**症状**: 热重载不工作

**解决方案**:
```bash
# 增加文件监控限制
sudo sysctl fs.inotify.max_user_watches=524288
echo fs.inotify.max_user_watches=524288 | sudo tee -a /etc/sysctl.conf
```

---

## 下一步

Docker 环境配置完成后：

1. 📖 阅读 [环境配置](environment-setup.md) 了解详细配置
2. ✍️ 查看 [内容管理](../guides/content-management.md) 学习如何创建文章
3. 🎨 探索 [写作指南](../guides/writing-guide.md) 了解 MDX 组件使用
4. 🚀 参考 [服务器部署](../deployment/guides/server/quick-deployment.md) 准备生产环境

---

## 获取帮助

如果遇到问题：

1. 查看 [故障排查](troubleshooting.md)
2. 查看 Docker 日志: `docker compose logs`
3. 搜索 [GitHub Issues](https://github.com/zhengbi-yong/zhengbi-yong.github.io/issues)
4. 创建新 Issue 寻求帮助

---

## 快速参考

### Windows PowerShell 常用命令

```powershell
# 克隆项目
git clone https://github.com/zhengbi-yong/zhengbi-yong.github.io.git
cd zhengbi-yong.github.io

# 配置环境变量
copy .env.docker.example .env
notepad .env

# 启动服务
docker compose up -d

# 查看状态
docker compose ps

# 查看日志
docker compose logs -f

# 停止服务
docker compose down
```

### macOS/Linux 常用命令

```bash
# 克隆项目
git clone https://github.com/zhengbi-yong/zhengbi-yong.github.io.git
cd zhengbi-yong.github.io

# 配置环境变量
cp .env.docker.example .env
nano .env

# 启动服务
docker compose up -d

# 查看状态
docker compose ps

# 查看日志
docker compose logs -f

# 停止服务
docker compose down
```

---

**文档版本**: 1.0.0
**最后更新**: 2025-12-29
**维护者**: Zhengbi Yong

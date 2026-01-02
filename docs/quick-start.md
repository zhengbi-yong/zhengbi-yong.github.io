# 快速开始指南 / Quick Start Guide

本指南帮助你在 **5分钟** 内使用 Docker 启动博客系统。

This guide helps you get the blog system running with Docker in **5 minutes**.

---

## 🚀 三步启动 / 3 Steps to Start

### 前置要求 / Prerequisites

- **Docker** 20.10+
- **Docker Compose** 2.0+
- **2GB+** 内存
- **端口可用 / Ports Available**: 80, 443, 3000, 3001, 5432, 6379

---

### Step 1: 克隆项目 / Clone Repository (1 min)

```bash
git clone https://github.com/zhengbi-yong/zhengbi-yong.github.io.git
cd zhengbi-yong.github.io
```

---

### Step 2: 启动服务 / Start Services (3-4 min)

```bash
# 启动数据库服务 / Start database services
docker compose up -d postgres redis

# 等待数据库启动 / Wait for database to start
sleep 10

# 配置环境 / Configure environment
cp .env.example .env

# 启动应用 / Start application
docker compose up -d
```

**首次启动需要 5-10 分钟构建镜像 / First run takes 5-10 min to build images**

---

### Step 3: 访问应用 / Access Application (30 sec)

打开浏览器访问 / Open browser and visit:

- **前端 / Frontend**: http://localhost:3001
- **后端API / Backend API**: http://localhost:3000
- **管理后台 / Admin Panel**: http://localhost:3001/admin
- **Nginx网关 / Nginx Gateway**: http://localhost

---

## 📊 常用命令 / Common Commands

```bash
# 查看服务状态 / View service status
docker compose ps

# 查看日志 / View logs
docker compose logs -f

# 重启服务 / Restart services
docker compose restart

# 停止服务 / Stop services
docker compose down

# 停止并删除卷 / Stop and remove volumes
docker compose down -v
```

---

## 🔍 验证部署 / Verify Deployment

### 检查容器状态 / Check Container Status

```bash
docker compose ps
```

**预期输出 / Expected Output**:
```
NAME                    STATUS              PORTS
blog-postgres           Up (healthy)        0.0.0.0:5432->5432
blog-redis              Up (healthy)        0.0.0.0:6379->6379
blog-backend            Up (healthy)        0.0.0.0:3000->3000
blog-frontend           Up (healthy)        0.0.0.0:3001->3001
blog-nginx              Up (healthy)        0.0.0.0:80->80
```

### 测试API / Test API

```bash
curl http://localhost:3000/health
```

**预期输出 / Expected Output**:
```json
{"status":"healthy"}
```

---

## ⚙️ 自定义配置 / Custom Configuration

### 修改环境变量 / Edit Environment Variables

```bash
# 编辑环境文件 / Edit environment file
nano .env

# 重启服务应用更改 / Restart to apply changes
docker compose restart backend
```

**关键配置 / Key Configuration**:
- `DATABASE_URL` - PostgreSQL 连接 / PostgreSQL connection
- `REDIS_URL` - Redis 连接 / Redis connection
- `JWT_SECRET` - JWT 密钥 / JWT secret (必须修改 / Must change)
- `HOST` - 监听地址 / Listen address
- `PORT` - 后端端口 / Backend port

### 修改端口 / Change Ports

如果端口被占用 / If ports are occupied:

编辑 `.env`:
```bash
FRONTEND_PORT=3002
BACKEND_PORT=3003
```

然后重启 / Then restart:
```bash
docker compose down
docker compose up -d
```

---

## 🔧 故障排查 / Troubleshooting

### 端口被占用 / Port Already in Use

```bash
# 查看端口占用 / Check port usage
# Linux/macOS
lsof -i :3000

# Windows
netstat -ano | findstr :3000

# 终止进程 / Kill process
# Linux/macOS
kill -9 <PID>

# Windows
taskkill /PID <PID> /F
```

### 服务启动失败 / Service Failed to Start

```bash
# 查看详细日志 / View detailed logs
docker compose logs backend
docker compose logs frontend

# 重新构建 / Rebuild
docker compose down
docker compose build --no-cache
docker compose up -d
```

### 数据库连接失败 / Database Connection Failed

```bash
# 检查数据库状态 / Check database status
docker compose exec postgres pg_isready

# 重启数据库 / Restart database
docker compose restart postgres

# 查看数据库日志 / View database logs
docker compose logs postgres
```

### 清理并重新开始 / Clean and Restart

```bash
# 完全清理 / Complete cleanup
docker compose down -v
docker system prune -af

# 重新启动 / Fresh start
docker compose up -d
```

---

## 📚 下一步 / Next Steps

### 立即尝试 / Try Now

1. ✍️ **创建第一篇文章** / **Create Your First Post**
   - 访问 / Visit: http://localhost:3001/admin
   - 默认账号 / Default account: `admin@example.com` / `password123`

2. 📖 **阅读写作指南** / **Read Writing Guide**
   - [写作指南](guides/writing-guide.md) - Markdown和MDX语法
   - [内容管理](guides/content-management.md) - 文章管理

3. 🚀 **准备生产部署** / **Prepare for Production**
   - [部署文档](deployment/) - 服务器部署指南
   - [生产配置](deployment/guides/server/production-server.md) - 生产环境配置

### 详细文档 / Detailed Documentation

- 📖 **[完整安装指南](getting-started/installation.md)** - 详细安装步骤
- 🔧 **[环境配置](getting-started/environment-setup.md)** - 环境变量详解
- 💻 **[本地开发 - Windows](getting-started/local-development-windows.md)** - Windows特定说明
- 💻 **[本地开发 - macOS](getting-started/local-development-macos.md)** - macOS特定说明
- 💻 **[本地开发 - Linux](getting-started/local-development-linux.md)** - Linux特定说明
- 🔍 **[故障排查](getting-started/troubleshooting.md)** - 常见问题解决

---

## 💡 提示 / Tips

1. **首次部署 / First Deployment**
   - 可能需要10-15分钟下载镜像 / May take 10-15 min to download images
   - 建议使用良好的网络连接 / Good internet connection recommended

2. **生产环境 / Production**
   - 务必修改默认密码和密钥 / Must change default passwords and secrets
   - 配置SSL证书 / Configure SSL certificates
   - 参考 [生产部署指南](deployment/guides/server/production-server.md)

3. **资源监控 / Resource Monitoring**
   - 查看资源使用 / Check resource usage: `docker stats`
   - 最小要求 / Minimum requirements: 2GB RAM, 20GB disk
   - 推荐配置 / Recommended: 4GB RAM, 40GB disk

4. **数据备份 / Data Backup**
   - 定期备份数据库 / Regular database backups
   - 参考 [备份策略](deployment/best-practices/backup-strategy.md)

---

## 🆘 获取帮助 / Get Help

### 查看文档 / Check Documentation

1. 查看 [FAQ](appendix/faq.md) - 常见问题 / Common questions
2. 查看 [故障排查](getting-started/troubleshooting.md) - 详细问题解决
3. 查看 [部署文档](deployment/) - 部署相关

### 联系支持 / Contact Support

- 📝 **提交 Issue** / **Submit Issue**: [GitHub Issues](https://github.com/zhengbi-yong/zhengbi-yong.github.io/issues)
- 💬 **查看讨论** / **Check Discussions**: [GitHub Discussions](https://github.com/zhengbi-yong/zhengbi-yong.github.io/discussions)

---

**需要更多帮助？** / **Need More Help?**

查看完整文档：/ Check full documentation:
- 📖 [文档首页](README.md) / [Documentation Home](README.md)
- 🚀 [快速入门](getting-started/) / [Getting Started](getting-started/)
- 📚 [用户指南](guides/) / [User Guides](guides/)
- 🔧 [开发文档](development/) / [Development](development/)
- 🚀 [部署文档](deployment/) / [Deployment](deployment/)

---

**最后更新 / Last Updated**: 2026-01-02
**维护者 / Maintained By**: Documentation Team

🤖 Generated with [Claude Code](https://claude.com/claude-code)

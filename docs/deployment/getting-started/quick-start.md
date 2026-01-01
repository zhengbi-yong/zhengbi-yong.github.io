# 5-Minute Quick Start / 5分钟快速开始

Get the blog running locally in 5 minutes using Docker.
/ 使用Docker在5分钟内在本地运行博客。

---

## 📋 Prerequisites / 前置要求

**Required / 必需**:
- ✅ Docker installed (Docker Desktop or Docker Engine)
- ✅ Git installed
- ✅ 8GB RAM available / 8GB可用内存

**Check Docker / 检查Docker**:
```bash
docker --version
# Should be Docker 20.10+ / 应该是Docker 20.10+
```

**Don't have Docker? Install it: / 没有Docker？安装：**
- **Windows/Mac**: [Docker Desktop](https://www.docker.com/products/docker-desktop)
- **Linux**: [Docker Engine](https://docs.docker.com/engine/install/)

---

## ⚡ Step 1: Clone Repository / 克隆仓库 (1 min)

```bash
# Clone the repository / 克隆仓库
git clone https://github.com/zhengbi-yong/zhengbi-yong.github.io.git
cd zhengbi-yong.github.io
```

**Expected output / 预期输出**:
```
Cloning into 'zhengbi-yong.github.io'...
remote: Enumerating objects: XXX, done.
remote: Total XXX (delta 0), reused 0 (delta 0)
Receiving objects: 100% (XXX/XXX), X.XX MiB | X.XX MiB/s
```

---

## 🔧 Step 2: Start Database Services / 启动数据库服务 (1 min)

```bash
# Start PostgreSQL and Redis / 启动PostgreSQL和Redis
docker compose up -d postgres redis
```

**Expected output / 预期输出**:
```
[+] Running 3/3
 ✔ Network zhengbi-yong_default      Created
 ✔ Container zhengbi-yong-redis-1    Started
 ✔ Container zhengbi-yong-postgres-1 Started
```

**Verify / 验证**:
```bash
docker compose ps
# Should show postgres and redis running / 应该显示postgres和redis正在运行
```

---

## 🔐 Step 3: Configure Environment / 配置环境 (2 min)

```bash
# Copy environment template / 复制环境变量模板
cp .env.example .env

# Edit .env file / 编辑.env文件
# Use your preferred editor / 使用你喜欢的编辑器:
# nano .env
# vim .env
# code .env
```

**Minimum required changes / 最小必需修改**:

In `.env` file, you can leave defaults for local development / 在`.env`文件中，本地开发可以使用默认值:

```bash
# For local development, these defaults are fine / 本地开发可以使用这些默认值
DATABASE_URL=postgresql://blog_user:blog_password@localhost:5432/blog_db
REDIS_URL=redis://localhost:6379
```

**⚠️ IMPORTANT / 重要**:
- These defaults are **ONLY for local development** / 这些默认值**仅用于本地开发**
- **NEVER use defaults for production** / **生产环境绝对不要使用默认值**
- For production, see [Production Server Guide](../guides/server/production-server.md)
- 生产环境请参阅[生产服务器指南](../guides/server/production-server.md)

---

## 🚀 Step 4: Start Application / 启动应用 (1 min)

```bash
# Start all services / 启动所有服务
docker compose up -d
```

**Expected output / 预期输出**:
```
[+] Running 5/5
 ✔ Container zhengbi-yong-redis-1      Running
 ✔ Container zhengbi-yong-postgres-1   Running
 ✔ Container zhengbi-yong-backend-1    Started
 ✔ Container zhengbi-yong-frontend-1   Started
 ✔ Container zhengbi-yong-nginx-1      Started
```

**⏳ Wait for services to be ready / 等待服务就绪** (30-60 seconds / 秒)

---

## ✅ Step 5: Verify Deployment / 验证部署 (30 sec)

### Check Services / 检查服务

```bash
# Check all containers are running / 检查所有容器是否运行
docker compose ps
```

**Expected output / 预期输出**:
```
NAME                    STATUS          PORTS
zhengbi-yong-backend-1   Up (healthy)    0.0.0.0:3000->3000/tcp
zhengbi-yong-frontend-1  Up (healthy)    0.0.0.0:3001->3000/tcp
zhengbi-yong-nginx-1     Up (healthy)    0.0.0.0:80->80/tcp
zhengbi-yong-postgres-1  Up (healthy)    5432/tcp
zhengbi-yong-redis-1     Up (healthy)    6379/tcp
```

### Access the Blog / 访问博客

Open your browser / 打开浏览器:

```
http://localhost:3001
```

**You should see / 您应该看到**:
- ✅ Blog homepage loaded successfully / 博客主页成功加载
- ✅ Can view blog posts / 可以查看博客文章
- ✅ Navigation working / 导航正常工作

---

## 🎉 Congratulations! / 恭喜！

Your local development environment is ready! / 您的本地开发环境已经准备好了！

**What's Running / 运行中的服务**:
- ✅ Frontend (Next.js) on port 3001 → http://localhost:3001
- ✅ Backend (Rust/Axum) on port 3000 (internal)
- ✅ PostgreSQL on port 5432 (internal)
- ✅ Redis on port 6379 (internal)
- ✅ Nginx on port 80 (proxy)

---

## 🛠️ Common Commands / 常用命令

### View Logs / 查看日志

```bash
# View all logs / 查看所有日志
docker compose logs -f

# View specific service logs / 查看特定服务日志
docker compose logs -f frontend
docker compose logs -f backend
docker compose logs -f postgres
```

### Stop Services / 停止服务

```bash
# Stop all services / 停止所有服务
docker compose down

# Stop and remove volumes / 停止并删除卷（⚠️ 删除数据）
docker compose down -v
```

### Restart Services / 重启服务

```bash
# Restart all services / 重启所有服务
docker compose restart

# Restart specific service / 重启特定服务
docker compose restart backend
```

### Rebuild Services / 重新构建服务

```bash
# Rebuild and restart / 重新构建并重启
docker compose up -d --build

# Rebuild specific service / 重新构建特定服务
docker compose up -d --build backend
```

---

## 🔍 Troubleshooting / 故障排查

### Issue 1: Port Already in Use / 端口已被占用

**Problem / 问题**:
```
Error: bind: address already in use
```

**Solution / 解决方案**:
```bash
# Find process using port 3001 / 查找使用3001端口的进程
# Linux/Mac:
lsof -i :3001

# Windows:
netstat -ano | findstr :3001

# Kill the process or stop the service / 终止进程或停止服务
```

### Issue 2: Services Not Starting / 服务未启动

**Problem / 问题**: Containers exit immediately / 容器立即退出

**Solution / 解决方案**:
```bash
# Check container logs / 检查容器日志
docker compose logs backend
docker compose logs postgres

# Verify Docker is running / 验证Docker正在运行
docker ps
```

### Issue 3: Database Connection Error / 数据库连接错误

**Problem / 问题**: Backend can't connect to database / 后端无法连接数据库

**Solution / 解决方案**:
```bash
# Stop all services / 停止所有服务
docker compose down

# Remove volumes (⚠️ deletes data / 删除数据)
docker compose down -v

# Start fresh / 重新启动
docker compose up -d postgres redis
# Wait 10 seconds
sleep 10
docker compose up -d
```

---

## 📖 What's Next? / 下一步做什么？

### For Learning / 学习

1. **Understand Deployment Options** / 理解部署选项
   - [Choosing Your Approach](choosing-your-approach.md) - Find the right deployment method

2. **Learn the Architecture** / 学习架构
   - [Architecture Overview](../concepts/architecture.md) - System design
   - [Docker Architecture](../concepts/docker-architecture.md) - Docker patterns

3. **Explore Features** / 探索功能
   - [Local Development Guide](../guides/docker/local-development.md) - Complete local setup
   - [Cross-Platform Guide](../guides/docker/cross-platform.md) - Platform-specific tips

### For Development / 开发

1. **Setup Backend** / 设置后端
   ```bash
   cd backend
   cargo run
   ```

2. **Setup Frontend** / 设置前端
   ```bash
   cd frontend
   pnpm install
   pnpm dev
   ```

3. **Development Workflow** / 开发工作流
   - See [Development Guide](../../development/getting-started/workflow.md)

### For Production Deployment / 生产部署

1. **Choose Production Deployment** / 选择生产部署方式
   - [Single Server](../guides/server/single-server.md) - Simple deployment
   - [Production Server](../guides/server/production-server.md) - Complete guide
   - [Low Resource](../guides/low-resource/quick-start.md) - 2GB RAM deployment

2. **Prepare for Production** / 准备生产环境
   - [Configuration Checklist](../reference/configuration-checklist.md) - Pre-deployment checks
   - [Security Best Practices](../best-practices/security.md) - Security hardening

3. **Deploy to Server** / 部署到服务器
   - [Production Server Guide](../guides/server/production-server.md) - Step-by-step guide

---

## 💡 Tips / 提示

1. **Performance / 性能**:
   - First startup may take 1-2 minutes / 首次启动可能需要1-2分钟
   - Subsequent starts are faster / 后续启动会更快

2. **Data Persistence / 数据持久化**:
   - Database data is stored in Docker volumes / 数据存储在Docker卷中
   - Data persists even after `docker compose down` / `docker compose down`后数据仍然保留
   - Use `docker compose down -v` to remove all data / 使用`docker compose down -v`删除所有数据

3. **Resource Usage / 资源使用**:
   - Typical usage: 2-4GB RAM / 典型使用：2-4GB内存
   - Can run on machines with 8GB RAM total / 可在总共8GB内存的机器上运行

4. **Development Mode / 开发模式**:
   - Hot reload enabled for frontend / 前端启用热重载
   - Backend requires manual restart / 后端需要手动重启

---

## 🔗 Useful Links / 有用链接

### Documentation / 文档
- [Full Documentation Index](../README.md) - All deployment docs
- [Development Docs](../../development/) - Development guide

### External Resources / 外部资源
- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [Next.js Documentation](https://nextjs.org/docs)

---

## ❓ Need Help? / 需要帮助？

### Quick Help / 快速帮助

1. **Check logs** / 查看日志: `docker compose logs -f`
2. **Verify containers** / 验证容器: `docker compose ps`
3. **Restart services** / 重启服务: `docker compose restart`

### Full Troubleshooting / 完整故障排查

- [Common Issues](troubleshooting-common.md) - Detailed troubleshooting guide
- [Architecture Overview](../concepts/architecture.md) - Understand the system

### Community / 社区

- Create an issue on GitHub
- Check existing [discussions](https://github.com/zhengbi-yong/zhengbi-yong.github.io/discussions)

---

**Ready to deploy to production? / 准备部署到生产环境？**

➡️ [Choosing Your Deployment Approach](choosing-your-approach.md) - Find the right method for you

---

**Version**: 2.0 (World-Class Deployment Documentation)
**Last Updated**: 2026-01-01
**Maintained By**: Deployment Team

🤖 Generated with [Claude Code](https://claude.com/claude-code)

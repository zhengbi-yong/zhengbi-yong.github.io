# Quick Start for Developers

5分钟快速设置开发环境 / Get your development environment ready in 5 minutes

---

## 📋 Prerequisites / 先决条件

Ensure you have these tools installed:

**Required / 必需:**
- ✅ **Git** - Version control
- ✅ **Docker** & **Docker Compose** - For databases
- ✅ **Node.js** 20+ and **pnpm** - Frontend development
- ✅ **Rust** 1.70+ and **Cargo** - Backend development

**Optional / 可选:**
- 📱 **VSCode** - Recommended IDE
- 🔧 **SQLx CLI** - `cargo install sqlx-cli --no-default-features --features rustls,postgres`

---

## ⚡ Step 1: Clone Repository / 克隆仓库

```bash
# Clone the repository
git clone https://github.com/zhengbi-yong/zhengbi-yong.github.io.git
cd zhengbi-yong.github.io
```

**Time**: ~30 seconds

---

## 🐳 Step 2: Start Databases / 启动数据库

```bash
# Start PostgreSQL and Redis
docker compose up -d postgres redis

# Verify containers are running
docker compose ps
```

**Time**: ~1 minute

**Expected Output / 预期输出:**
```
NAME                    STATUS         PORTS
zhengbi-yong-postgres-1  running (healthy)  0.0.0.0:5432->5432
zhengbi-yong-redis-1     running (healthy)  0.0.0.0:6379->6379
```

---

## 🗄️ Step 3: Setup Database / 设置数据库

```bash
cd backend

# Install SQLx CLI (if not installed)
cargo install sqlx-cli --no-default-features --features rustls,postgres

# Create database
sqlx database create

# Run migrations
cargo run -p blog-migrator

# Verify migrations
cargo run --bin migrate
```

**Time**: ~2 minutes

**Tip**: If you encounter database connection errors, verify PostgreSQL container is healthy: `docker compose ps`

---

## 🔧 Step 4: Environment Configuration / 环境配置

```bash
# Copy environment templates
cp config/environments/.env.root.example .env
cp config/environments/.env.frontend.example frontend/.env.local

# Edit .env with your configuration (optional for local development)
# Edit frontend/.env.local with your configuration
```

**Minimum required settings / 最小必需设置:**

In `.env`:
```bash
DATABASE_URL=postgresql://blog_user:blog_password@localhost:5432/blog_db
REDIS_URL=redis://localhost:6379
JWT_SECRET=dev-secret-key-for-testing-only-change-in-production
```

In `frontend/.env.local`:
```bash
# No required variables for local development
```

**Time**: ~30 seconds

---

## 🚀 Step 5: Start Backend / 启动后端

```bash
cd backend

# Run backend server
cargo run -p blog-api --bin api
```

**Time**: ~1-2 minutes (first run compiles dependencies)

**Expected Output / 预期输出:**
```
    Finished dev [unoptimized + debuginfo] target(s) in X.XXs
     Running `target/debug/api`
Starting API server on 127.0.0.1:3000
```

**Verify backend / 验证后端:**
- API Server: http://localhost:3000
- Health Check: http://localhost:3000/healthz
- Swagger UI: http://localhost:3000/swagger-ui
- API Docs: http://localhost:3000/api-docs/openapi.json

---

## 🌐 Step 6: Start Frontend / 启动前端

```bash
# In a new terminal
cd frontend

# Install dependencies
pnpm install

# Start development server
pnpm dev
```

**Time**: ~2-3 minutes (first run installs dependencies)

**Expected Output / 预期输出:**
```
  ▲ Next.js 16.0.10
  - Local:        http://localhost:3000
  - Network:      http://192.168.x.x:3000

 ✓ Ready in 2.5s
```

**Verify frontend / 验证前端:**
- Frontend: http://localhost:3000 (Next.js dev server)
- Blog: http://localhost:3000/blog
- Admin: http://localhost:3000/admin

---

## ✅ Step 7: Verify Installation / 验证安装

### Backend Verification / 后端验证

```bash
# Test health endpoint
curl http://localhost:3000/healthz

# Expected response
# {"status":"healthy"}
```

### Frontend Verification / 前端验证

Open browser to: http://localhost:3000

**Expected**: Blog homepage loads successfully

---

## 🎉 Congratulations! / 恭喜！

Your development environment is ready! / 你的开发环境已经准备好了！

**What's Running / 运行中的服务:**
- ✅ PostgreSQL on port 5432
- ✅ Redis on port 6379
- ✅ Backend API on port 3000
- ✅ Frontend on port 3000

**Total Time / 总用时**: ~5-8 minutes

---

## 🚦 Next Steps / 下一步

### 1. Learn the Architecture / 学习架构

**Recommended Reading / 推荐阅读:**
1. [Architecture Overview](concepts/architecture.md) - System design
2. [Frontend Architecture](concepts/frontend-architecture.md) - Next.js structure
3. [Backend Architecture](concepts/backend-architecture.md) - Rust/Axum structure

### 2. Start Developing / 开始开发

**Choose your path / 选择你的路径:**

- **Frontend Developer**: [Frontend Development Guides](guides/frontend-development/)
- **Backend Developer**: [Backend Development Guides](guides/backend-development/)
- **Full-Stack Developer**: Follow both paths

### 3. Follow Best Practices / 遵循最佳实践

**Essential Reading / 必读:**
1. [Code Style](best-practices/code-style.md) - Coding standards
2. [Naming Conventions](best-practices/naming-conventions.md) - Naming rules
3. [Security Practices](best-practices/security-practices.md) - Security guidelines
4. [File Organization](best-practices/file-organization.md) - File structure

### 4. Setup Your IDE / 设置IDE

**Recommended Extensions / 推荐扩展:**

**VSCode:**
- Rust Analyzer (backend)
- ESLint (frontend)
- Prettier (frontend)
- Tailwind CSS IntelliSense
- Docker

**Configuration / 配置:**
See [Development Environment](getting-started/development-environment.md)

---

## 🛠️ Common Commands / 常用命令

### Backend / 后端

```bash
cd backend

# Run server / 运行服务器
cargo run

# Run tests / 运行测试
cargo test

# Check code / 检查代码
cargo check

# Run database migration / 运行数据库迁移
cargo run -p blog-migrator

# Create new migration / 创建新迁移
sqlx migrate add <migration_name>
```

### Frontend / 前端

```bash
cd frontend

# Start dev server / 启动开发服务器
pnpm dev

# Build for production / 构建生产版本
pnpm build

# Run tests / 运行测试
pnpm test

# Lint code / 检查代码
pnpm lint

# Generate API types / 生成API类型
pnpm generate:types
```

### Docker / Docker

```bash
# Start databases / 启动数据库
docker compose up -d postgres redis

# View logs / 查看日志
docker compose logs -f postgres redis

# Stop databases / 停止数据库
docker compose down

# Restart databases / 重启数据库
docker compose restart postgres redis
```

---

## 🔍 Troubleshooting / 故障排查

### Backend won't start / 后端无法启动

**Problem**: `cargo run` fails with database connection error

**Solution**:
1. Verify Docker containers are running: `docker compose ps`
2. Check DATABASE_URL in `.env`
3. Ensure migrations ran: `sqlx migrate info`
4. Check PostgreSQL logs: `docker compose logs postgres`

### Frontend build errors / 前端构建错误

**Problem**: `pnpm install` or `pnpm dev` fails

**Solution**:
1. Clear cache: `rm -rf node_modules .next && pnpm install`
2. Check Node.js version: `node --version` (should be 20+)
3. Check pnpm version: `pnpm --version` (should be 10+)
4. Verify `.env.local` exists

### Port conflicts / 端口冲突

**Problem**: Port 3000 already in use

**Solution**:
```bash
# Find process using port 3000
# Linux/Mac:
lsof -i :3000
# Windows:
netstat -ano | findstr :3000

# Kill the process or use different ports
```

### Database migration fails / 数据库迁移失败

**Problem**: `cargo run -p blog-migrator` fails

**Solution**:
1. Verify DATABASE_URL is correct
2. Check PostgreSQL is running: `docker compose ps`
3. Recreate database:
   ```bash
   sqlx database drop
   sqlx database create
   cargo run -p blog-migrator
   ```

---

## 📚 Additional Resources / 更多资源

### Full Setup Guide / 完整设置指南

If you need more detailed setup instructions, see:
- [Development Environment](getting-started/development-environment.md) - Detailed IDE and tools setup
- [Project Structure](getting-started/project-structure.md) - Code organization
- [Development Workflow](getting-started/workflow.md) - Git workflow, branching, PRs

### Documentation / 文档

- [Developer Guide README](README.md) - Full documentation index
- [Architecture](concepts/architecture.md) - System design
- [Best Practices](best-practices/) - Coding standards

### Getting Help / 获取帮助

- Check [Troubleshooting](operations/troubleshooting.md) - Common issues
- Review [FAQ](../../operations/README.md) - Frequently asked questions
- Create an issue on GitHub

---

## ✨ What's Next? / 接下来做什么？

### For Learning / 学习

1. **Understand the Architecture** / 理解架构
   - Read [Architecture Overview](concepts/architecture.md)
   - Explore [Frontend Architecture](concepts/frontend-architecture.md)
   - Study [Backend Architecture](concepts/backend-architecture.md)

2. **Explore the Codebase** / 探索代码库
   - Use [Project Structure](getting-started/project-structure.md) as a map
   - Read [Component Development](guides/frontend-development/component-development.md)
   - Study [API Development](guides/backend-development/api-development.md)

3. **Learn Best Practices** / 学习最佳实践
   - Review [Code Style](best-practices/code-style.md)
   - Follow [Naming Conventions](best-practices/naming-conventions.md)
   - Apply [Security Practices](best-practices/security-practices.md)

### For Development / 开发

1. **Pick a Task** / 选择任务
   - Fix a bug
   - Add a feature
   - Improve documentation
   - Write tests

2. **Follow the Workflow** / 遵循工作流
   - See [Development Workflow](getting-started/workflow.md)
   - Create a branch
   - Make changes
   - Write tests
   - Submit a PR

3. **Get Involved** / 参与贡献
   - Check existing issues
   - Join discussions
   - Review pull requests
   - Help others

---

**Ready to start? / 准备好了吗？** 🚀

Choose your learning path above and dive in! / 选择上面的学习路径，开始吧！

---

## 📝 Quick Reference Card / 快速参考卡

```
┌─────────────────────────────────────────────────────────────┐
│  DEVELOPMENT QUICK REFERENCE                                │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  START SERVICES:                                           │
│  1. docker compose up -d postgres redis                    │
│  2. cd backend && cargo run                                │
│  3. cd frontend && pnpm dev                                │
│                                                             │
│  VERIFY:                                                   │
│  • Frontend: http://localhost:3000                         │
│  • Backend:  http://localhost:3000/api                     │
│  • Health:   http://localhost:3000/healthz                 │
│  • Swagger:  http://localhost:3000/swagger-ui              │
│                                                             │
│  COMMON COMMANDS:                                          │
│  • cargo test              (backend tests)                  │
│  • pnpm test              (frontend tests)                  │
│  • cargo run -p blog-migrator (database migrations)        │
│  • pnpm lint              (frontend linting)                │
│                                                             │
│  GET HELP:                                                 │
│  • [Architecture](concepts/architecture.md)                │
│  • [Best Practices](best-practices/)                      │
│  • [Troubleshooting](operations/troubleshooting.md)       │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

**Version**: 2.0
**Last Updated**: 2026-01-01
**Maintenance**: Development Team

🤖 Generated with [Claude Code](https://claude.com/claude-code)

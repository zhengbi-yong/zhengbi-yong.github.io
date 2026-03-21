# 🚀 项目启动指南 - Arch Linux 开发环境

## ✅ 环境配置完成

所有必要的配置已经完成：
- ✅ Docker & docker-compose 已安装
- ✅ Rust 工具链已配置
- ✅ 数据库服务（PostgreSQL + Redis）正在运行
- ✅ 数据库迁移已执行
- ✅ 后端已编译成功
- ✅ 前端依赖已安装

## 🎯 启动方式

### 方式 1：使用启动脚本（推荐）

```bash
cd /home/Sisyphus/zhengbi-yong.github.io
./start-dev.sh
```

脚本会提供选项：
1. 仅启动后端
2. 仅启动前端
3. 同时启动后端和前端
4. 停止所有服务

### 方式 2：手动启动（推荐用于调试）

#### 终端 1：启动后端

```bash
cd /home/Sisyphus/zhengbi-yong.github.io/backend

# 加载 Rust 环境
source ~/.cargo/env

# 设置环境变量
export DATABASE_URL=postgresql://blog_user:blog_password@localhost:5432/blog_db
export REDIS_URL=redis://localhost:6379
export JWT_SECRET=vH4JcUlc03hOt4vOGjo6eO/3Iv/mQs42S3r93a9lbrQ=
export PASSWORD_PEPPER=QZlYevqR3wtUS/+0jN0nrqUvafJt5irCZs9ZwKF8YG8=
export SESSION_SECRET=4pJQlFmAMeKlJK40O9vf2n2ySBYjaHBQtdTdJU6afkk=
export RUST_LOG=debug
export CORS_ALLOWED_ORIGINS=http://localhost:3001
export ENVIRONMENT=development

# 运行后端
cargo run
```

后端将在 **http://localhost:3000** 启动

#### 终端 2：启动前端

```bash
cd /home/Sisyphus/zhengbi-yong.github.io/frontend

# 运行前端
pnpm dev
```

前端将在 **http://localhost:3001** 启动

## 🗄️ 数据库管理

### 检查数据库状态

```bash
# 检查容器状态
docker compose -f docker-compose.dev.yml ps

# 检查 PostgreSQL
docker exec blog-postgres pg_isready -U blog_user -d blog_db

# 检查 Redis
docker exec blog-redis redis-cli ping
```

### 访问数据库

```bash
# 进入 PostgreSQL
docker exec -it blog-postgres psql -U blog_user -d blog_db

# 进入 Redis
docker exec -it blog-redis redis-cli
```

### 停止数据库

```bash
docker compose -f docker-compose.dev.yml down
```

### 重启数据库

```bash
docker compose -f docker-compose.dev.yml restart
```

## 🛠️ 开发调试

### 后端调试

**使用 VS Code**：
1. 安装 `rust-analyzer` 扩展
2. 打开 `/home/Sisyphus/zhengbi-yong.github.io/backend`
3. 在代码中设置断点
4. 按 F5 开始调试

**日志级别调整**：
```bash
# Debug 级别（详细）
export RUST_LOG=debug

# Info 级别（标准）
export RUST_LOG=info

# Error 级别（仅错误）
export RUST_LOG=error
```

### 前端调试

**浏览器开发者工具**：
- 访问 http://localhost:3001
- 按 F12 打开开发者工具
- React DevTools 扩展（可选）

**VS Code 调试**：
1. 安装 `Debugger for Chrome` 扩展
2. 配置 launch.json
3. 设置断点并调试

### 热重载

**后端**：
```bash
# 安装 cargo-watch（首次）
cargo install cargo-watch

# 使用 cargo-watch 自动重启
cargo watch -x run
```

**前端**：
```bash
# pnpm dev 默认启用热重载
pnpm dev
```

## 📊 监控和日志

### 查看数据库日志

```bash
# PostgreSQL 日志
docker logs blog-postgres -f

# Redis 日志
docker logs blog-redis -f

# 两者同时
docker compose -f docker-compose.dev.yml logs -f
```

### API 健康检查

```bash
# 基本健康检查
curl http://localhost:3000/health

# 详细健康状态
curl http://localhost:3000/health/detailed

# 就绪检查
curl http://localhost:3000/ready

# Prometheus 指标
curl http://localhost:3000/metrics
```

### 数据库表检查

```bash
docker exec -it blog-postgres psql -U blog_user -d blog_db -c "\dt"

# 查看表行数
docker exec -it blog-postgres psql -U blog_user -d blog_db -c "
SELECT 
    schemaname, 
    tablename, 
    n_tup_ins AS inserts,
    n_tup_upd AS updates,
    n_tup_del AS deletes
FROM pg_stat_user_tables
ORDER BY tablename;
"
```

## 🧪 测试

### 后端测试

```bash
cd backend

# 运行所有测试
cargo test --workspace

# 运行特定测试
cargo test test_name

# 显示输出
cargo test -- --nocapture

# 运行集成测试（需要数据库）
SQLX_OFFLINE=false cargo test
```

### 前端测试

```bash
cd frontend

# 运行单元测试
pnpm test

# 运行测试并监听变化
pnpm test --watch

# 生成覆盖率报告
pnpm test --coverage
```

## 🔧 常见问题

### 端口已被占用

```bash
# 查找占用端口的进程
lsof -i :3000  # 后端
lsof -i :3001  # 前端
lsof -i :5432  # PostgreSQL
lsof -i :6379  # Redis

# 终止进程
kill <PID>

# 或使用 fuser
fuser -k 3000/tcp
```

### 数据库连接失败

```bash
# 检查 PostgreSQL 是否运行
docker ps | grep blog-postgres

# 查看日志
docker logs blog-postgres

# 重启容器
docker restart blog-postgres

# 检查连接字符串
echo $DATABASE_URL
```

### Rust 编译错误

```bash
cd backend

# 清理构建缓存
cargo clean

# 更新 Rust
rustup update

# 重新构建
cargo build
```

### 前端依赖问题

```bash
cd frontend

# 删除 node_modules
rm -rf node_modules pnpm-lock.yaml

# 重新安装
pnpm install

# 清理 Next.js 缓存
rm -rf .next
pnpm dev
```

### 后端编译警告

当前的警告是正常的（未使用的函数和导入），不影响功能：
```bash
# 查看警告详情
cargo build 2>&1 | grep "warning:"

# 自动修复部分警告
cargo fix --lib -p blog-api --allow-dirty
```

## 📝 重要文件

| 文件 | 用途 |
|------|------|
| `.env` | 环境变量配置 |
| `docker-compose.dev.yml` | 数据库 Docker 配置 |
| `start-dev.sh` | 开发环境启动脚本 |
| `backend/Cargo.toml` | 后端依赖配置 |
| `frontend/package.json` | 前端依赖配置 |
| `frontend/.env.local` | 前端环境变量 |

## 🎨 下一步

现在你的开发环境已经完全配置好了！你可以：

1. **开始开发**：修改代码并查看热重载效果
2. **调试代码**：使用 VS Code 设置断点调试
3. **查看文档**：
   - `docs/` - 项目文档
   - `backend/CLAUDE.md` - 后端文档
   - `frontend/CLAUDE.md` - 前端文档
4. **运行测试**：确保代码质量
5. **提交代码**：使用 Git 提交更改

## 🌐 访问地址

- **前端**: http://localhost:3001
- **后端 API**: http://localhost:3000
- **健康检查**: http://localhost:3000/health
- **API 文档**: http://localhost:3000/swagger-ui（如果启用）

## 🆘 获取帮助

如果遇到问题：
1. 查看上面的"常见问题"部分
2. 检查日志输出
3. 查看项目文档：`docs/`
4. 搜索 GitHub Issues

---

**祝你开发愉快！** 🎉

**生成时间**: 2026-01-06
**系统**: Arch Linux
**项目**: zhengbi-yong.github.io

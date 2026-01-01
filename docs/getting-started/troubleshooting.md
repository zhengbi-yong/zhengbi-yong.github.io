# 故障排查

本指南帮助你解决常见的安装和配置问题。

## 目录

- [安装问题](#安装问题)
- [运行时错误](#运行时错误)
- [数据库问题](#数据库问题)
- [前端问题](#前端问题)
- [后端问题](#后端问题)
- [性能问题](#性能问题)

## 安装问题

### Node.js 版本不兼容

**症状**:
```
Error: Unsupported Node.js version
```

**解决方案**:
```bash
# 使用 nvm 安装正确的版本
nvm install 20
nvm use 20

# 验证
node --version
```

### pnpm 安装失败

**症状**:
```
pnpm: command not found
```

**解决方案**:
```bash
npm install -g pnpm
# 或
corepack enable
corepack prepare pnpm@latest --activate
```

### Rust 编译错误

**症状**:
```
error: linker `link.exe` not found
```

**解决方案**:

**Windows**: 安装 [Microsoft C++ Build Tools](https://visualstudio.microsoft.com/visual-cpp-build-tools/)

**Linux**:
```bash
sudo apt install build-essential
```

**macOS**:
```bash
xcode-select --install
```

### Docker 权限错误 (Linux)

**症状**:
```
permission denied while trying to connect to the Docker daemon
```

**解决方案**:
```bash
sudo usermod -aG docker $USER
# 重新登录或运行
newgrp docker
```

## 运行时错误

### 端口已被占用

**症状**:
```
Error: listen EADDRINUSE: address already in use :::3001
```

**解决方案**:

**查找占用进程**:
```bash
# Linux/Mac
lsof -ti:3001 | xargs kill -9

# Windows PowerShell
Get-NetTCPConnection -LocalPort 3001 | Select-Object -ExpandProperty OwningProcess | ForEach-Object { Stop-Process -Id $_ -Force }
```

**或使用其他端口**:
```bash
# 前端
export PORT=3002
pnpm dev

# 后端 (修改 .env)
PORT=3002
```

### 环境变量未加载

**症状**:
```
Error: DATABASE_URL is not set
```

**解决方案**:

1. 确认 `.env` 文件存在
2. 检查文件名正确（不是 `.env.txt`）
3. 重启开发服务器
4. 手动导出变量：
```bash
export DATABASE_URL="postgresql://blog_user:blog_password@localhost:5432/blog_db"
```

### Contentlayer 构建错误

**症状**:
```
Error: Contentlayer build failed
```

**解决方案**:
```bash
cd frontend
rm -rf .next node_modules/.cache
pnpm install
pnpm build
```

## 数据库问题

### 数据库连接失败

**症状**:
```
Error: connection to server at "localhost", port 5432 failed
```

**解决方案**:

1. **检查 Docker 容器状态**:
```bash
docker ps | grep postgres
```

2. **重启数据库**:
```bash
cd backend
./scripts/deployment/deploy.sh stop
./scripts/deployment/deploy.sh dev
```

3. **检查数据库日志**:
```bash
docker logs blog-postgres
```

4. **验证连接字符串**:
```bash
echo $DATABASE_URL
# 格式: postgresql://用户名:密码@localhost:5432/数据库名
```

### 数据库迁移失败

**症状**:
```
Error: migration failed
```

**解决方案**:

1. **重置数据库** (⚠️ 删除所有数据):
```bash
cd backend
docker compose down -v
./scripts/deployment/deploy.sh dev
sqlx migrate run
```

2. **手动运行迁移**:
```bash
cd backend
sqlx migrate run
```

3. **检查迁移状态**:
```bash
sqlx migrate info
```

### Redis 连接失败

**症状**:
```
Error: No connection found for Redis
```

**解决方案**:

1. **检查 Redis 容器**:
```bash
docker ps | grep redis
```

2. **重启 Redis**:
```bash
cd backend
docker compose restart redis
```

3. **测试连接**:
```bash
redis-cli -h localhost -p 6379 ping
# 应返回: PONG
```

## 前端问题

### 构建失败

**症状**:
```
Error: Build failed with errors
```

**解决方案**:

1. **清理缓存**:
```bash
cd frontend
rm -rf .next out node_modules/.cache
pnpm install
```

2. **检查 TypeScript 错误**:
```bash
pnpm lint
```

3. **增加内存限制**:
```bash
export NODE_OPTIONS=--max-old-space-size=4096
pnpm build
```

### MDX 组件未找到

**症状**:
```
Error: Module not found: Can't resolve '@/components/MyComponent'
```

**解决方案**:

1. 检查组件是否在正确位置
2. 确认组件已导出:
```typescript
// components/MDXComponents/index.ts
export { MyComponent } from './MyComponent'
```

3. 检查路径别名配置 (`tsconfig.json`)

### 样式未生效

**症状**:
Tailwind CSS 类名不工作

**解决方案**:

1. 清理缓存并重建:
```bash
rm -rf .next
pnpm build
```

2. 检查 `tailwind.config.js` 配置

3. 确认 `globals.css` 被导入

## 后端问题

### 编译错误

**症状**:
```
error[E0432]: unresolved import `crates::core`
```

**解决方案**:

1. **清理构建缓存**:
```bash
cd backend
cargo clean
cargo build
```

2. **更新依赖**:
```bash
cargo update
```

3. **检查 Cargo.toml**:
```bash
cargo check
```

### 测试失败

**症状**:
```
test result: FAILED
```

**解决方案**:

1. **运行单个测试查看详细错误**:
```bash
cargo test test_name -- --nocapture
```

2. **检查数据库状态**:
```bash
docker ps
```

3. **重置测试数据库**:
```bash
cargo test -- --reset
```

### 速率限制问题

**症状**:
```
Error: Too many requests
```

**解决方案**:

1. **等待 1 分钟后重试**

2. **临时禁用速率限制** (开发环境):
```bash
# 在 .env 中设置
RATE_LIMIT_PER_MINUTE=999999
```

3. **清除 Redis 缓存**:
```bash
redis-cli -h localhost FLUSHALL
```

## 性能问题

### 前端构建缓慢

**症状**:
构建时间超过 5 分钟

**解决方案**:

1. **使用 Turbopack** (Next.js 16 默认启用)

2. **禁用分析**:
```bash
# 不使用 ANALYZE=true
pnpm build
```

3. **增加 Node.js 内存**:
```bash
export NODE_OPTIONS=--max-old-space-size=8192
pnpm build
```

### 后端编译缓慢

**症状**:
`cargo build` 超过 10 分钟

**解决方案**:

1. **使用更少的编译单元**:
```bash
cargo build --release -j 4
```

2. **使用 sccache 缓存**:
```bash
cargo install sccache
export RUSTC_WRAPPER=sccache
```

3. **跳过文档生成**:
```bash
cargo build --no-docs
```

### 数据库查询慢

**症状**:
API 响应时间超过 1 秒

**解决方案**:

1. **检查连接池配置**:
```bash
# 在 .env 中
DATABASE_MAX_CONNECTIONS=20
```

2. **添加数据库索引** (查看 migration 文件)

3. **启用查询日志**:
```bash
RUST_LOG=sqlx=debug cargo run
```

## 调试技巧

### 启用详细日志

**前端**:
```bash
DEBUG=* pnpm dev
```

**后端**:
```bash
RUST_LOG=debug cargo run
```

### 查看错误堆栈

**后端**:
```bash
RUST_BACKTRACE=1 cargo run
```

### 检查网络请求

使用浏览器开发者工具：
1. 打开 Network 标签
2. 筛选 XHR/Fetch 请求
3. 检查请求头和响应

### 检查 Docker 日志

```bash
# 查看所有容器日志
docker compose logs

# 查看特定服务
docker compose logs postgres
docker compose logs redis

# 实时跟踪
docker compose logs -f
```

## 获取帮助

如果以上方案都无法解决问题：

1. **查看完整文档**:
   - [安装指南](installation.md)
   - [环境配置](environment-setup.md)

2. **搜索 GitHub Issues**:
   https://github.com/zhengbi-yong/zhengbi-yong.github.io/issues

3. **创建新 Issue**:
   - 提供错误信息
   - 提供系统环境信息
   - 提供复现步骤

4. **联系作者**:
   - 博客: https://zhengbi-yong.github.io
   - GitHub: @zhengbi-yong

## 常见错误代码

| 错误代码 | 描述 | 解决方案 |
|---------|------|---------|
| `EADDRINUSE` | 端口被占用 | 杀死占用进程或使用其他端口 |
| `ECONNREFUSED` | 连接被拒绝 | 检查服务是否运行 |
| `ENOENT` | 文件不存在 | 检查文件路径 |
| `EACCES` | 权限被拒绝 | 修改文件权限或使用 sudo |
| `JWT_EXPIRED` | JWT 令牌过期 | 重新登录或刷新令牌 |
| `RATE_LIMIT_EXCEEDED` | 超过速率限制 | 等待后重试 |

---

**相关文档**:
- [快速开始](quick-start.md)
- [安装指南](installation.md)
- [环境配置](environment-setup.md)

**最后更新**: 2025-12-27

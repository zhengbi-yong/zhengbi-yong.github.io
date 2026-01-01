# Troubleshooting Guide

本文档提供常见问题的诊断和解决方案，帮助快速定位和修复系统问题。

## 目录

- [前端问题](#前端问题)
- [后端问题](#后端问题)
- [数据库问题](#数据库问题)
- [Redis 问题](#redis-问题)
- [性能问题](#性能问题)
- [部署问题](#部署问题)

---

## 前端问题

### 构建失败

#### 问题: TypeScript 类型错误

**症状**:
```
error TS2322: Type 'string' is not assignable to type 'number'
```

**解决方案**:
1. 检查类型定义
2. 添加类型断言或修复类型不匹配
3. 运行 `pnpm lint` 查看所有类型错误

```bash
# 清理缓存
rm -rf .next node_modules/.cache

# 重新安装依赖
pnpm install

# 重新构建
pnpm build
```

#### 问题: ESLint 错误

**症状**:
```
error 'foo' is not defined no-undef
```

**解决方案**:
1. 检查 ESLint 配置
2. 运行 `pnpm lint --fix` 自动修复

```bash
# 查看所有 lint 错误
pnpm lint

# 自动修复
pnpm lint --fix
```

#### 问题: Module not found

**症状**:
```
Module not found: Can't resolve '@/components/Header'
```

**解决方案**:
1. 检查导入路径
2. 确认 `tsconfig.json` 中的路径别名配置
3. 检查文件是否存在

```typescript
// ✅ 正确
import Header from '@/components/Header'

// ❌ 错误
import Header from './components/Header'
```

---

### 样式问题

#### 问题: Tailwind CSS 类不生效

**解决方案**:
1. 检查 `tailwind.config.js` 配置
2. 确保内容路径正确
3. 重新构建

```javascript
// tailwind.config.js
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  // ...
}
```

#### 问题: Dark mode 不切换

**解决方案**:
1. 检查 `class` 策略配置
2. 确保 `dark` 类被添加到 `html` 元素

```javascript
// tailwind.config.js
module.exports = {
  darkMode: 'class',
  // ...
}
```

---

### 路由错误

#### 问题: 404 Not Found

**症状**: 访问某个路由时显示 404 页面

**解决方案**:
1. 检查文件路径是否正确
2. 确认文件命名正确（`page.tsx`, `layout.tsx`）
3. 检查动态路由参数

```
✅ app/blog/[slug]/page.tsx
❌ app/blog/[slug]/Page.tsx
❌ app/blog/[slug]/index.tsx
```

#### 问题: 动态路由不匹配

**解决方案**:
1. 使用 `generateStaticParams` 预生成路径
2. 检查 `params` 类型

```typescript
// app/blog/[slug]/page.tsx
export async function generateStaticParams() {
  const posts = await getPosts()
  return posts.map((post) => ({
    slug: post.slug,
  }))
}
```

---

### 组件渲染问题

#### 问题: 组件不更新

**症状**: 状态改变但组件不重新渲染

**解决方案**:
1. 确保使用 `useState` 或 `useReducer`
2. 检查是否直接修改状态
3. 使用正确的更新模式

```typescript
// ❌ 错误：直接修改状态
state.items.push(newItem)
setState(state)

// ✅ 正确：创建新对象
setState({
  ...state,
  items: [...state.items, newItem],
})
```

#### 问题: useEffect 无限循环

**症状**: 组件不断重新渲染

**解决方案**:
1. 检查 `useEffect` 依赖数组
2. 确保依赖项正确

```typescript
// ❌ 错误：缺少依赖数组
useEffect(() => {
  fetchData()
})

// ✅ 正确：包含依赖
useEffect(() => {
  fetchData()
}, [page, pageSize])
```

---

## 后端问题

### API 无响应

#### 问题: 端口被占用

**症状**:
```
Error: Os { code: 10048, kind: AddrInUse }
```

**解决方案**:
```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Linux/Mac
lsof -ti:3000 | xargs kill -9
```

#### 问题: 服务器启动失败

**解决方案**:
1. 检查环境变量是否正确设置
2. 检查配置文件
3. 查看日志文件

```bash
# 检查环境变量
echo $DATABASE_URL
echo $REDIS_URL

# 查看日志
tail -f logs/backend.log
```

---

### 数据库连接失败

#### 问题: Connection refused

**症状**:
```
Error: connection to server at "localhost:5432", port 5432 failed
```

**解决方案**:
```bash
# 1. 确认 PostgreSQL 运行
docker ps | grep postgres

# 2. 如果没有运行，启动数据库
cd backend
./scripts/deployment/deploy.sh dev

# 3. 检查连接字符串
echo $DATABASE_URL

# 4. 测试连接
psql $DATABASE_URL
```

#### 问题: 连接池耗尽

**症状**:
```
Error: pool exhausted
```

**解决方案**:
1. 增加连接池大小
2. 减少连接超时时间
3. 检查连接泄漏

```rust
let pool = PgPoolOptions::new()
    .max_connections(20)  // 增加最大连接数
    .acquire_timeout(Duration::from_secs(30))
    .connect(&database_url).await?;
```

---

### 认证失败

#### 问题: Token 无效

**症状**:
```
Error: Invalid token
```

**解决方案**:
1. 检查 JWT_SECRET 是否一致
2. 确认 token 未过期
3. 验证 token 格式

```bash
# 检查 JWT_SECRET
echo $JWT_SECRET

# 解码 token（查看内容）
echo "your.jwt.token" | jq -R 'split(".") | .[1] | @base64d | fromjson'
```

#### 问题: Refresh token 过期

**症状**: 自动刷新 token 失败

**解决方案**:
1. 重新登录获取新 token
2. 检查 refresh token 有效期设置
3. 确认 HTTP-only Cookie 配置正确

```rust
// 检查 refresh token 有效期
const REFRESH_TOKEN_EXPIRY_DAYS: u64 = 7;
```

---

## 数据库问题

### 查询慢

#### 问题: 查询超时

**症状**:
```
Error: query timeout
```

**解决方案**:
1. 分析查询计划
2. 添加索引
3. 优化查询

```sql
-- 分析查询计划
EXPLAIN ANALYZE SELECT * FROM users WHERE email = 'user@example.com';

-- 添加索引
CREATE INDEX idx_users_email ON users(email);
```

#### 问题: N+1 查询

**症状**: 数据库查询次数过多

**解决方案**:
1. 使用 JOIN
2. 使用预加载（Eager Loading）

```rust
// ❌ N+1 查询
for post in posts {
    let comments = get_comments(post.id).await?;
}

// ✅ 使用 JOIN
let posts_with_comments = sqlx::query_as!(
    PostWithComments,
    r#"
    SELECT posts.*, json_agg(comments) as comments
    FROM posts
    LEFT JOIN comments ON comments.post_id = posts.id
    GROUP BY posts.id
    "#
)
.fetch_all(pool)
.await?;
```

---

### 迁移失败

#### 问题: Migration conflict

**症状**:
```
Error: migration conflict detected
```

**解决方案**:
```bash
# 回滚迁移
sqlx migrate revert

# 重新运行
sqlx migrate run

# 如果还是失败，手动修复
sqlx migrate info
```

#### 问题: Migration lock

**症状**:
```
Error: database is locked
```

**解决方案**:
```sql
-- 删除锁
DELETE FROM _sqlx_migrations;
```

---

### 数据不一致

#### 问题: 重复数据

**解决方案**:
```sql
-- 查找重复
SELECT email, COUNT(*)
FROM users
GROUP BY email
HAVING COUNT(*) > 1;

-- 删除重复（保留最新的 ID）
DELETE FROM users
WHERE id NOT IN (
    SELECT MAX(id)
    FROM users
    GROUP BY email
);
```

#### 问题: 外键约束违规

**解决方案**:
```sql
-- 查找违规数据
SELECT * FROM comments
WHERE user_id NOT IN (SELECT id FROM users);

-- 删除或修复违规数据
DELETE FROM comments
WHERE user_id NOT IN (SELECT id FROM users);
```

---

## Redis 问题

### 连接失败

#### 问题: Connection refused

**症状**:
```
Error: No connection found
```

**解决方案**:
```bash
# 1. 检查 Redis 是否运行
docker ps | grep redis

# 2. 启动 Redis
docker start redis

# 3. 测试连接
redis-cli ping
```

#### 问题: 认证失败

**症状**:
```
Error: NOAUTH Authentication required
```

**解决方案**:
```bash
# 检查 Redis URL 格式
REDIS_URL=redis://:password@localhost:6379

# 测试连接
redis-cli -a password ping
```

---

### 内存不足

#### 问题: OOM command not allowed

**症状**:
```
Error: OOM command not allowed when used memory > 'maxmemory'
```

**解决方案**:
```bash
# 1. 检查内存使用
redis-cli INFO memory

# 2. 配置最大内存和淘汰策略
redis-cli CONFIG SET maxmemory 256mb
redis-cli CONFIG SET maxmemory-policy allkeys-lru

# 3. 清空缓存
redis-cli FLUSHDB
```

---

### 缓存失效

#### 问题: 缓存未命中

**症状**: 高缓存未命中率

**解决方案**:
1. 检查缓存 TTL 设置
2. 验证缓存键生成逻辑
3. 确认缓存预热

```rust
// 检查缓存键
let cache_key = format!("user:{}", user_id);

// 验证 TTL
let ttl: u64 = redis.ttl(&cache_key).await?;
println!("Cache TTL: {}", ttl);
```

---

## 性能问题

### 前端性能

#### 问题: 首屏加载慢

**诊断**:
```bash
# 使用 Lighthouse 分析
npx lighthouse http://localhost:3000 --view
```

**解决方案**:
1. 代码分割
2. 懒加载
3. 优化图片
4. 减少 bundle 大小

```typescript
// 懒加载组件
const Dashboard = dynamic(() => import('./Dashboard'))
```

#### 问题: 交互响应慢

**诊断**:
```bash
# Chrome DevTools > Performance
# 录制并分析
```

**解决方案**:
1. 使用 `useMemo` 和 `useCallback`
2. 虚拟化长列表
3. 防抖和节流

```typescript
// 使用 useMemo 缓存计算结果
const expensiveValue = useMemo(() => {
  return computeExpensiveValue(a, b)
}, [a, b])
```

---

### 后端性能

#### 问题: API 响应慢

**诊断**:
```rust
use std::time::Instant;

let start = Instant::now();
// ... API 逻辑 ...
let duration = start.elapsed();
tracing::info!("API duration: {:?}", duration);
```

**解决方案**:
1. 使用连接池
2. 启用缓存
3. 异步处理
4. 数据库索引优化

```rust
// 使用 Redis 缓存
let cached = redis.get(&cache_key).await?;
if let Some(data) = cached {
    return Ok(data);
}
```

#### 问题: 高 CPU 使用

**诊断**:
```bash
# 使用 htop 查看 CPU 使用
htop

# Rust flamegraph
cargo install flamegraph
cargo flamegraph
```

**解决方案**:
1. 优化算法
2. 减少循环次数
3. 使用更高效的数据结构

---

## 部署问题

### Docker 问题

#### 问题: 容器启动失败

**解决方案**:
```bash
# 查看容器日志
docker logs <container_id>

# 检查容器状态
docker ps -a

# 进入容器调试
docker exec -it <container_id> /bin/bash
```

#### 问题: 镜像构建失败

**解决方案**:
```bash
# 清理 Docker 缓存
docker system prune -a

# 重新构建
docker build --no-cache -t myapp .
```

---

### 环境变量问题

#### 问题: 环境变量未生效

**解决方案**:
```bash
# 1. 检查 .env 文件
cat .env

# 2. 确认变量已导出
export DATABASE_URL="..."

# 3. 重启服务
./scripts/deployment/deploy.sh stop
./scripts/deployment/deploy.sh dev
```

#### 问题: 敏感信息泄露

**解决方案**:
1. 确保 `.env` 在 `.gitignore` 中
2. 使用环境变量管理工具（如 Doppler）
3. 定期轮换密钥

---

## 诊断工具

### 健康检查

#### 前端健康检查

```bash
# 检查前端是否可访问
curl http://localhost:3001
```

#### 后端健康检查

```bash
# 检查后端健康状态
curl http://localhost:3000/healthz

# 检查就绪状态
curl http://localhost:3000/readyz
```

---

### 日志分析

#### 查看日志

```bash
# 前端日志
tail -f logs/frontend.log

# 后端日志
tail -f logs/backend.log

# Docker 日志
docker-compose logs -f
```

#### 过滤日志

```bash
# 过滤错误日志
grep "ERROR" logs/backend.log

# 过滤特定时间范围
sed '/2025-12-27 10:00/,/2025-12-27 11:00/p' logs/backend.log
```

---

### 性能分析

#### 前端性能分析

```bash
# Lighthouse CI
npx lighthouse http://localhost:3001 --output=json --output-path=./report.json

# Bundle 分析
pnpm build -- --analyze
```

#### 后端性能分析

```bash
# 使用 hyperfine 进行基准测试
hyperfine 'curl http://localhost:3000/api/users'

# 使用 wrk 进行负载测试
wrk -t12 -c400 -d30s http://localhost:3000/api/users
```

---

## 预防措施

### 监控告警

1. **设置监控指标**:
   - API 响应时间
   - 错误率
   - CPU/内存使用率
   - 数据库连接数

2. **配置告警**:
   - 错误率 > 5%
   - 响应时间 > 1s
   - CPU 使用 > 80%

### 定期维护

1. **每周**:
   - 检查错误日志
   - 更新依赖
   - 审查安全告警

2. **每月**:
   - 清理日志
   - 优化数据库
   - 审查性能指标

3. **每季度**:
   - 全面审计
   - 渗透测试
   - 容量规划

---

## 相关文档

- [Performance Monitoring](./performance-monitoring.md) - 性能监控
- [Security Guide](./security-guide.md) - 安全指南
- [Deployment Overview](../../deployment/overview.md) - 部署文档
- [API Reference](../backend/api-reference.md) - API 文档

---

**最后更新**: 2025-12-27
**维护者**: Operations Team

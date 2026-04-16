# 开发者黄金标准 (Golden Rules)

> 版本: 3.0.0
> 日期: 2026-04-08
> 目的: 在本项目生命周期中永远不可逾越的铁律, 违反必出bug

---

## 一、安全铁律 (Security Non-Negotiables)

### 1.1 认证令牌

**禁止在 localStorage 存储任何凭证:**

| 规则 | 错误做法 | 正确做法 |
|------|----------|----------|
| 禁止存储JWT | `localStorage.setItem('token', ...)` | 使用HttpOnly Cookie |
| 禁止手动Authorization头 | `fetch('/api', { headers: { Authorization: 'Bearer ...' } })` | 浏览器自动携带Cookie |
| 禁止前端接触凭证 | `const token = getToken()` | 前端永远不读取token值 |

**认证会话Cookie属性强制要求:**

```
auth_session 必须满足:
  - Secure       (仅HTTPS传输)
  - HttpOnly     (JavaScript不可读)
  - SameSite=Strict  (或SameSite=Lax, 严格限制跨站)
  - __Host-前缀 (优先使用, 要求Path=/, 不设置Domain)
```

### 1.2 CSRF防护 (双重提交Cookie + Fetch Metadata)

```tsx
// 必须实现HMAC签名的双重提交Cookie
// 1. proxy.ts - 生成与下发
const nonce = crypto.randomUUID()
const signature = await hmacSign(nonce, CSRF_SECRET)
response.cookies.set('XSRF-TOKEN', `${nonce}.${signature}`, {
  httpOnly: false,
  secure: true,
  sameSite: 'strict'
})

// 2. mutator.ts - 请求时注入
if (method === 'POST' || method === 'PUT' || method === 'PATCH' || method === 'DELETE') {
  headers.set('X-CSRF-TOKEN', getCookie('XSRF-TOKEN'))
}

// 3. Axum中间件 - 严格验证
let [nonce, signature] = token.split('.')
if (!hmacVerify(nonce, signature, CSRF_SECRET)) return Err(StatusCode::FORBIDDEN)
if (nonce != session.csrf_nonce) return Err(StatusCode::FORBIDDEN) // 重放检测
```

**纵深防御 - Fetch Metadata校验:**

```rust
// 对所有状态变更请求 (POST/PUT/PATCH/DELETE):
// 1. 校验CSRF Token (双重提交Cookie方案)
// 2. 若存在Sec-Fetch-Site, 拒绝cross-site (或按业务白名单放行)
// 3. 跨域请求必须严格配置CORS + credentials策略
```

### 1.3 WebAuthn无状态质询协议

```rust
// 禁止: 将挑战码存Redis (I/O瓶颈)
// 必须: AES-256-GCM加密挑战码 (无状态)

struct ChallengePayload {
    nonce: [u8; 32],
    timestamp: i64,
    user_id: Uuid,
}

fn create_challenge(user_id: Uuid) -> Vec<u8> {
    encrypt_aes256_gcm(ChallengePayload {
        nonce: random_nonce(),
        timestamp: now(),
        user_id,
    })
}

// 验证挑战 (60秒过期 + 签名验证)
fn verify_challenge(blob: &[u8], signature: &[u8], pubkey: &PublicKey) -> Result<()> {
    let payload = decrypt_aes256_gcm(blob)?;
    if payload.timestamp < now() - 60 {
        return Err("Challenge expired")
    }
    verify_ecdsa(&payload, signature, pubkey)
}

// 关键: burn-after-reading - 多Pod环境下必须全局去重
// 验证成功后: 将nonce哈希写入TTL=60秒的去重集合
// 重复nonce一律拒绝 (防止60秒窗口内重放)
```

### 1.4 密码存储

- 禁止: 在数据库内部计算密码哈希 (算力留给应用服务器)
- 必须: Argon2id在应用层计算, 数据库只存hash
- 参数: `memory=64MB, iterations=3, parallelism=4, hash_length=32`
- 必须记录: 哈希版本号与参数, 便于未来升级

### 1.5 Proxy/中间件永远不是唯一授权边界

> **这是CVE-2025-29927的血的教训**
> Next.js官方明确: "Proxy不应作为完整会话管理或授权方案"
> 攻击者可绕过Middleware授权检查

```tsx
// 错误: 仅在proxy.ts做权限校验
// 正确: 任何"必须鉴权"的资源, 必须在Rust Axum后端做最终授权

// proxy.ts: 仅允许做"乐观重定向/快速拦截"
export async function proxy(request: NextRequest) {
  // 可以: 重定向、改写、静态头注入、denylist过滤
  // 禁止: 解析会话、调用数据库、决定是否允许访问敏感数据
}

// Axum后端: 最终授权
impl FromRequestParts<AppState> for AuthUser {
    // 必须在这里做真正的RBAC/ABAC校验
}
```

---

## 二、前端铁律 (Frontend Non-Negotiables)

### 2.1 数据获取

| 场景 | 方式 |
|------|------|
| Server Components | 直接调后端, 走`src/lib/api/mutator.ts` |
| Client Components | 走`/api/v1/*` Route Handler (BFF) |
| 禁止 | Server Components调用Route Handler (二跳) |

```typescript
// Server Component正确姿势
import { customFetch } from '@/lib/api/mutator'
const posts = await customFetch<Post[]>('/api/v1/posts')

// Client Component正确姿势
import { getPosts } from '@/lib/api/generated'
const { data } = await getPosts()
```

### 2.2 认证状态

```typescript
// 禁止: 持久化任何凭证到localStorage
const authStore = createStore()({
  token: localStorage.getItem('token')  // 绝对禁止!
})

// 正确: 纯UI状态, 真相来源永远是服务端Cookie
const authStore = createStore()({
  user: null,
  isAuthenticated: false
})
```

### 2.3 <Activity>组件的Effects销毁语义

> React 19.2明确: 当Activity隐藏时, React会display:none并销毁Effects (执行cleanup)
> 恢复可见时重建Effects

```tsx
// 错误: Activity隐藏时销毁上下文
useEffect(() => {
  viewer = createViewer()
  return () => viewer.destroy() // 恢复时黑屏!
}, [])

// 正确: Effect cleanup必须可重复、幂等
useEffect(() => {
  viewer = createViewer()
  viewer.render()
  return () => viewer.pause() // 仅暂停, 不销毁
}, [])

// cleanup函数会在隐藏时执行, 再次可见时重新运行
// 因此cleanup必须可重复执行而不破坏状态
```

### 2.4 WebGL上下文管理

```tsx
// 硬性要求:
// 1. 全站活跃WebGL上下文 ≤6个 (浏览器上限16, 留安全余量)
// 2. 超过上限必须LRU淘汰
// 3. 必须监听webglcontextlost/webglcontextrestored

const MAX_WEBGL_CONTEXTS = 6

// 当Activity隐藏时:
const snapshot = canvas.toDataURL() // 保存快照
if (activeContexts.size >= MAX_WEBGL_CONTEXTS) {
  oldest.destroy() // 释放VRAM
}

// 当Activity恢复可见时:
if (!context.isLost) {
  viewer.resume()
} else {
  renderSnapshot(snapshot) // 先显示快照
  await viewer.rebuild()
  replaceSnapshot(snapshot)
}
```

### 2.5 状态管理职责

| Store | 存什么 | 存哪里 | 允许 |
|-------|--------|--------|------|
| ui-store | theme, sidebar, modal | Zustand | 是 |
| auth-store | ~~token~~ | ~~localStorage~~ | **禁止** |
| blog-store | ~~posts~~ | ~~localStorage~~ | **禁止** |

---

## 三、后端铁律 (Backend Non-Negotiables)

### 3.1 路由语法 (Axum 0.8+)

> Axum 0.8的matchit升级到0.8, 旧语法会panic

```rust
// 正确: OpenAPI风格大括号
Router::new()
    .route("/posts/{slug}", get(get_post))
    .route("/posts/{*path}", get(get_catch_all))

// 错误: 旧语法会panic
    .route("/posts/:slug", get(...))      // 编译警告或panic
    .route("/posts/*path", get(...))     // 编译错误
```

**必须为所有路由字符串编写路由注册测试, 确保不会在启动时崩溃**

### 3.2 异步Trait (Axum 0.8原生RPITIT)

```rust
// 禁止: #[async_trait] (Axum 0.8已移除)
// 正确: 原生RPITIT
impl FromRequestParts<AppState> for AuthUser {
    type Error = AuthError;
    type Future = impl Future<Output = Result<Self, Self::Error>>;
}

// 禁止在提取器里做外部I/O (Redis/DB)
// 提取器运行在请求主路径上, 会把认证变成外部依赖可用性的放大器
```

### 3.3 数据库连接池

```rust
let pool = PgPoolOptions::new()
    .max_connections(50)        // 不要超过50
    .min_connections(5)         // 保持最小连接
    .acquire_timeout(Duration::from_secs(5))
    .idle_timeout(Duration::from_secs(600))
    .max_lifetime(Duration::from_secs(1800))
    .fetch_dynamic_timeout(true)
    .build(&connect_url)
    .await?;
```

### 3.4 优雅停机

```rust
// 必须捕获SIGTERM, 禁止暴力退出
tokio::spawn(async move {
    tokio::signal::ctrl_c().await.unwrap();
    // 1. 修改健康检查为失败 (通知负载均衡器停止发请求)
    // 2. 等待现有连接结束 (最长30s)
    // 3. 关闭数据库连接池
    // 4. 强制退出
});

// preStop hook时序要求:
// terminationGracePeriodSeconds必须 ≥ (最大排空时间 + preStop预留时间)
// 若使用preStop: sleep N, 必须把N计入terminationGracePeriodSeconds
```

### 3.5 禁止的查询模式

```rust
// 禁止: 事务内调用外部服务 (Redis/Http)
// 这会导致连接池耗尽和分布式死锁

// 正确: Outbox模式
// 业务逻辑写入outbox_events表
// 独立Worker异步处理外部调用
```

---

## 四、数据库铁律 (Database Non-Negotiables)

### 4.1 主键 (UUIDv7)

```sql
-- PostgreSQL 18: 使用uuidv7()
id UUID PRIMARY KEY DEFAULT uuidv7()

-- PostgreSQL 13-17或需要兼容: 使用pg_uuidv7扩展
id UUID PRIMARY KEY DEFAULT uuid_generate_v7()

-- 禁止: gen_random_uuid() (UUIDv4) - 导致B-Tree页分裂
```

### 4.2 软删除与唯一约束

```sql
-- 禁止: 联合唯一索引含NULL (NULL≠NULL)
CREATE UNIQUE INDEX users_email_key ON users (email, deleted_at)

-- 正确: 部分唯一索引
CREATE UNIQUE INDEX idx_users_email_active ON users (email) WHERE deleted_at IS NULL
```

### 4.3 高频更新表 (HOT优化)

```sql
-- 必须设置fillfactor=70
CREATE TABLE post_stats (
    post_id UUID PRIMARY KEY,
    view_count BIGINT NOT NULL DEFAULT 0,
    like_count INTEGER NOT NULL DEFAULT 0,
    comment_count INTEGER NOT NULL DEFAULT 0
) WITH (fillfactor = 70);

-- 关键: 只允许主键索引, 严禁对任何会被UPDATE的列建索引
-- 原因: 索引会阻止HOT更新, 造成写放大
```

### 4.4 评论树 (ltree)

```sql
-- 禁止: 递归CTE (海量数据必崩)
-- 必须: ltree扩展
CREATE EXTENSION IF NOT EXISTS ltree;
CREATE INDEX idx_comments_path ON comments USING GIST (path);

-- 查询子树
SELECT * FROM comments WHERE path <@ '1.4'
```

### 4.5 JSONB索引

```sql
-- 禁止: 默认GIN索引
CREATE INDEX ON users USING GIN (profile);

-- 正确: jsonb_path_ops算子 (索引体积小一半)
CREATE INDEX ON users USING GIN (profile jsonb_path_ops)
```

### 4.6 PostgreSQL 18 AIO监控

```sql
-- AIO启用后必须将pg_aios纳入巡检
SELECT * FROM pg_aios;

-- 任何"开启AIO后性能提升"的结论必须附带:
-- 1. 具体查询类型 (顺序扫描/位图堆扫描)
-- 2. effective_io_concurrency值 (PG18已调整默认值到16)
```

### 4.7 Skip Scan (PG 18)

```sql
-- PG 18的B-Tree Skip Scan可以"跳跃"前导列
-- 新建复合索引前先用EXPLAIN验证是否已由Skip Scan覆盖
-- 避免索引膨胀
```

---

## 五、API设计铁律 (API Non-Negotiables)

### 5.1 URL命名

| 规则 | 错误示例 | 正确示例 |
|------|----------|----------|
| 禁止动词 | `/posts/create` | `POST /posts` |
| 禁止ID类型区分 | `/posts/id/{id}`, `/posts/slug/{slug}` | `GET /posts/{identifier}` |

### 5.2 自定义操作 (AIP-136)

```bash
POST /posts/{identifier}:view      # 记录浏览
POST /posts/{identifier}/likes    # 点赞
GET  /tags:autocomplete           # 自定义查询
```

### 5.3 批量操作

```bash
# 禁止: 路径含batch
POST /admin/users/batch/delete

# 正确: 异步任务模式
POST /admin/users:bulkDelete
# 返回202 + task_id, 客户端轮询状态
```

### 5.4 健康检查

| 路径 | 场景 |
|------|------|
| `/.well-known/live` | 存活探针 - 禁止检查外部依赖 |
| `/.well-known/ready` | 就绪探针 - 可检查DB/Redis |

---

## 六、可观测性铁律 (Observability Non-Negotiables)

### 6.1 W3C Trace Context传播

> 所有跨服务的请求必须传播traceparent头

```rust
// Axum入口: 提取或生成traceparent
// Axum出口: 对所有下游HTTP调用注入traceparent
// 日志必须包含trace_id/span_id

// 从Next.js BFF到Axum: traceparent必须连续传播
// 不得丢失上下文, 否则无法关联分布式请求
```

### 6.2 链路追踪验收项

- [ ] 所有后端对外HTTP client自动注入trace context
- [ ] 所有入口提取或生成trace context
- [ ] 日志与metrics标签包含trace_id
- [ ] CI检查: 必须验证新接口符合追踪规范

---

## 七、构建与性能铁律 (Build Non-Negotiables)

### 7.1 Turbopack内存限制

```bash
# 正确: 使用Next.js CLI参数
next build --experimental-cpu-prof    # CPU剖析
next build --experimental-debug-memory-usage  # 内存诊断

# 禁止: 使用非标准环境变量
# NEXT_CPU_PROF=1 (不正确, 应该用CLI参数)
```

```typescript
// next.config.ts
{
  experimental: {
    webpackMemoryOptimizations: true,
    preloadEntriesOnStart: false,
    webpackBuildWorker: true
  }
}
```

### 7.2 Zod递归解析

```typescript
// 禁止: 在组件内或渲染循环中动态创建Schema
// 错误: 每次渲染都重新创建
function BlogPost() {
  const schema = z.object({
    title: z.string(),
    content: z.lazy(() => AnotherComplexSchema)
  })
}

// 正确: 文件顶层静态声明
const BlogPostSchema = z.object({
  title: z.string(),
  content: z.string(),
})
```

### 7.3 CI/CD内存限制

```yaml
# .github/workflows/build.yml
jobs:
  build:
    env:
      Node_OPTIONS: "--max-old-space-size=4096"
    steps:
      - name: Build
        run: pnpm build
```

### 7.4 构建产物完整性 (SRI)

> Next.js 16.2 Turbopack支持Subresource Integrity
> 用于验证CDN/构建产物未被篡改

---

## 八、部署铁律 (Deployment Non-Negotiables)

### 8.1 容器安全

```yaml
# 强制非root运行
securityContext:
  runAsNonRoot: true
  runAsUser: 1000
  readOnlyRootFilesystem: true
  tmpfs: ["/tmp"]

capDrop: [ALL]
```

### 8.2 密钥管理

```yaml
# 禁止: 明文环境变量
env:
  - name: DB_PASSWORD
    value: "supersecret"  # 禁止!

# 正确: 从Secrets挂载
envFrom:
  - secretRef:
      name: db-secrets
env:
  - name: DB_PASSWORD_FILE
    value: "/run/secrets/db_password"
```

### 8.3 探针配置

```yaml
# 存活探针 - 绝对禁止检查数据库/Redis
livenessProbe:
  httpGet:
    path: /.well-known/live
  failureThreshold: 3

# 就绪探针 - 检查依赖, 失败时"摘流"而非"重启"
readinessProbe:
  httpGet:
    path: /.well-known/ready

# 禁止:
livenessProbe:
  exec:
    command: ["pg_isready"]  # 网络抖动会触发重启雪崩!
```

---

## 九、类型安全铁律 (Type Safety Non-Negotiables)

### 9.1 API契约

```typescript
// 禁止: 手动维护API类型
interface Post {
  id: string
  title: string
}

// 必须: Orval自动生成
import type { Post } from '@/lib/api/generated/models'
```

### 9.2 内容类型

```typescript
// 禁止: any类型
const post = contentlayer.get('blog/post.mdx') as any

// 必须: Velite + Zod严格校验
import { useBlogPost } from '.velite'
const post = useBlogPost('slug')
```

---

## 十、错误处理铁律

### 10.1 前端

```typescript
// 禁止: 吞掉错误
try {
  await fetch('/api')
} catch (e) {
  // 静默失败!
}

// 正确: 必须传播错误
// - Server Components: throw error
// - Client Components: 状态设error, 展示UI
```

### 10.2 后端

```rust
// 禁止: 隐藏错误
async fn get_post(slug: String) -> Result<Json<Post>> {
    let post = db.query_one(...).ok(); // None被吞掉!
}

// 正确: 使用?
async fn get_post(slug: String) -> Result<Json<Post>> {
    let post = db.query_one(...)
        .await?
        .ok_or(StatusCode::NOT_FOUND)?;
    Ok(Json(post))
}
```

---

## 十一、CI/CD铁律

### 11.1 合并前检查

- [ ] `pnpm tsc --noEmit` (前端类型检查)
- [ ] `cargo check` (后端编译检查)
- [ ] `cargo clippy` (Rust lints)
- [ ] `cargo test --workspace` (所有测试通过)
- [ ] 前端构建成功 (Turbopack)
- [ ] 内存检查通过 (无OOM)
- [ ] **trace context传播验证通过**

### 11.2 禁止项

- 禁止: 合并前跳过CI
- 禁止: force push到main分支
- 禁止: 直接在main分支修改 (必须PR)

---

## 十二、规则违反快速检查表

| 分类 | 检查项 | 违规后果 |
|------|--------|----------|
| 安全 | JWT存入localStorage | XSS可窃取全部会话 |
| 安全 | Cookie无HttpOnly/Secure | JavaScript可读取token |
| 安全 | CSRF Token明文无签名 | 可被篡改绕过 |
| 安全 | WebAuthn挑战码存Redis | 高并发下I/O瓶颈 |
| 安全 | 挑战码无重用检测 | 60秒内可重放 |
| 安全 | Proxy做唯一授权边界 | CVE-2025-29927式绕过 |
| 前端 | Server Components调Route Handler | 双跳, 性能损耗 |
| 前端 | 持久化auth状态到localStorage | 凭证泄露 |
| WebGL | Activity隐藏时destroy() | 恢复时黑屏 |
| WebGL | 无LRU调度, 超6个上下文 | VRAM溢出崩溃 |
| 后端 | 路由用`/:slug`语法 | Axum 0.8启动panic |
| 后端 | 提取器内查Redis/DB | 认证依赖外部可用性 |
| 后端 | 事务内调外部服务 | 连接池耗尽/死锁 |
| 数据库 | UUIDv4作主键 | B-Tree性能衰退 |
| 数据库 | 软删除+唯一约束无WHERE | 唯一性失效 |
| 数据库 | post_stats有索引 | HOT更新失效 |
| 数据库 | AIO启用不监控pg_aios | 性能问题无法发现 |
| 部署 | 存活探针检查DB | 网络抖动触发重启 |
| 部署 | 明文环境变量存密钥 | secrets泄露 |
| 追踪 | traceparent未传播 | 分布式请求无法关联 |

---

## 十三、每日开发自检清单

```
□ 今天是否引入了新的localStorage调用?
□ 今天是否绕过了mutator.ts直接调用fetch?
□ 今天是否有组件内动态创建Zod Schema?
□ 今天是否有WebGL组件未实现LRU调度?
□ 今天修改的SQL是否用到了新索引?(post_stats禁止)
□ 今天修改的API路由是否用了新的路径参数语法?
□ 今天提交的CI是否内存检查通过?
□ 今天是否有新依赖? 是否审查了供应链安全?
□ 今天的新接口是否加入了trace context传播?
□ 今天是否在proxy.ts写了强一致鉴权逻辑?
```

---

*版本: 3.0.0*
*基于: ultradesign.md v3.1.0 + 多轮专家深度评审*
*不可逾越, 违反必出bug*

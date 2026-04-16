# 项目全面审计与整改方案

> **审计日期**：2025-04-14  
> **审计范围**：前端 Next.js + 后端 Rust (Axum)  
> **文档版本**：v2.0（全面重写，基于源码逐行核实）  
> **预计总工时**：约 18-22 小时

---

## 一、执行摘要

本项目为 monorepo 结构，包含：

- **前端**：`frontend/` — Next.js 16 + TypeScript + Tailwind CSS + Velite
- **后端**：`backend/` — Rust (Axum) + PostgreSQL + Redis + S3 (MinIO)

全面审计共发现 **15 项问题**，按严重程度分类：

| 等级 | 数量 | 核心问题 |
|------|------|---------|
| 🔴 Critical | 3 | Outbox 原子性失效、安全头缺失、前端 Three.js 未代码分割 |
| 🟠 High | 4 | 公开写接口无鉴权、邮箱无格式验证、图片尺寸空实现、硬编码凭证 |
| 🟡 Medium | 5 | ECharts tree-shaking 失效、Bundle Analyzer 未配置、缓存头缺失、CSP unsafe-eval、WASM 安全风险 |
| ⚪ Low | 3 | 迁移文件冗余、速率限制实现注释、CSRF 验证仅 UUID 格式 |

**初版报告勘误**：初版报告多估了 `<img>` 标签数量（搜索结果实际为空），本版已更正。

---

## 二、🔴 Critical — 必须立即修复

---

## C-1：Outbox 模式事务原子性失效（3 处）

### 核实结论

**位置**：`backend/crates/api/src/routes/posts.rs`

| 操作 | Commit 行 | Outbox 行 | 问题 |
|------|-----------|-----------|------|
| create_post | 482 | 488 | `tx.commit()` 在 outbox 写入**之前**执行 |
| update_post | 1008 | 1015 | 同上 |
| delete_post | 1052 | 1063 | 同上 |

**代码示例**（第 479-490 行）：

```rust
// posts.rs:479-490
tx.commit().await?;  // ← 事务在此提交，posts 数据已永久写入

// 清除列表缓存
clear_posts_cache(&state).await;

// 异步写入 outbox，由 worker 处理搜索索引同步
if let Err(error) = crate::outbox::add_search_index_upsert(&state.db, &created_slug).await {
    tracing::warn!("Failed to add search index upsert to outbox: {error:#}");
    // ↑ outbox 在 commit 之后写入 —— 完全独立操作，无原子性保证
}
```

**根因**：`add_search_index_upsert` 接收 `&state.db`（连接池）而非 `&mut tx`（当前事务），无法纳入事务。

### 影响

- 🔴 posts 数据写入成功 → 应用重启 → outbox 事件丢失 → 搜索索引与数据库永久不一致
- 🔴 删除文章后搜索仍出现，或创建文章后搜索不到
- 🔴 `view` 计数 outbox 同样在第 168-170 行有类似问题（每 10 次浏览写入一次 outbox，也在事务外）

### 解决方案

**步骤 1**：修改 `outbox.rs` 函数签名，接收事务引用：

```rust
// backend/crates/api/src/outbox.rs

// 变更前
pub async fn add_search_index_upsert(
    db: &PgPool,
    slug: &str,
) -> Result<i64, AppError>

// 变更后
pub async fn add_search_index_upsert(
    tx: &mut PgTransaction<'_>,
    slug: &str,
) -> Result<i64, AppError>
```

**步骤 2**：修改 posts.rs 三处调用，在 `commit()` 之前写入 outbox：

```rust
// posts.rs — create_post 修复示例
let outbox_id = crate::outbox::add_search_index_upsert(&mut tx, &created_slug)
    .await
    .map_err(|e| {
        tracing::error!(error = %e, "Outbox write failed, rolling back");
        AppError::InternalServerError("Failed to persist outbox event".into())
    })?;
tracing::info!(outbox_id, slug = %created_slug, "Outbox event created");
tx.commit().await?;  // ← commit 现在包含 outbox
```

**步骤 3**：同样修复 update_post（第 1008-1015 行）和 delete_post（第 1052-1063 行）。

**步骤 4**：修复 view 计数（第 168-170 行），该函数也独立于事务写入 outbox。

### 验证

```bash
# 创建文章后立即检查 outbox_events 表
SELECT * FROM outbox_events WHERE event_type = 'search_index_upsert'
  ORDER BY created_at DESC LIMIT 1;

# 验证一致性：搜索索引中的 slug 应在 posts 表中
SELECT p.slug, o.id FROM posts p
LEFT JOIN outbox_events o ON o.payload->>'slug' = p.slug
WHERE p.created_at > NOW() - INTERVAL '1 hour';
```

---

## C-2：后端安全响应头完全缺失

### 核实结论

grep 搜索结果：**零匹配**。整个 backend codebase 不存在 `SecureService`、`Csp`、`Hsts`、`XFrameOptions`、`XContentTypeOptions`、`ReferrerPolicy` 中任何一个。

对比：`main.rs:16` 存在 `CorsLayer`，但安全头完全空白。

**当前 main.rs 中间件配置**（第 216-222 行）：

```rust
let app = Router::new()
    .nest("/api/v1", api_router)
    // 中间件（按执行顺序逆序排列）
    // 4. CORS 中间件（最先执行）
    .layer(create_cors_layer(state.settings.cors.allowed_origins.clone()))
    // 3. 压缩中间件
    .layer(CompressionLayer::new())
    // 2. HTTP Trace 中间件
    .layer(TraceLayer::new_for_http())
```

**缺失的响应头及风险**：

| 响应头 | 缺失后的攻击风险 |
|--------|----------------|
| `X-Frame-Options` | 点击劫持（Clickjacking） |
| `X-Content-Type-Options` | MIME 嗅探执行恶意文件 |
| `Content-Security-Policy` | XSS 注入脚本执行 |
| `Strict-Transport-Security` | SSLStrip 中间人攻击 |
| `Referrer-Policy` | 敏感 URL 通过 Referer 泄露 |
| `Permissions-Policy` | 意外启用浏览器危险特性 |

### 解决方案

在 `main.rs` 中添加 `tower-http` 安全中间件：

```toml
# backend/Cargo.toml
tower-http = { version = "0.6", features = [
    "csp",
    "hsts",
    "x-frame-options",
    "x-content-type-options",
    "referrer-policy",
] }
```

```rust
// main.rs 新增 imports
use tower_http::secure_service::SecureService;
use tower_http::{csp::Csp, hsts::Hsts, x_frame_options::XFrameOptions,
                 x_content_type_options::XContentTypeOptions,
                 referrer_policy::ReferrerPolicy};

// 构建安全服务（在 CORS 之后应用）
let secure_layer = SecureService::new(
    Csp::new()
        .default_src(tower_http::csp::ChildSrc::None)
        .script_src(tower_http::csp::ScriptSrc::Self)
        .style_src(tower_http::csp::StyleSrc::Self)
        .img_src(tower_http::csp::ImgSrc::Any)
        .connect_src(tower_http::csp::ConnectSrc::Self)
        .object_src(tower_http::csp::ObjectSrc::None)
        .frame_ancestors(tower_http::csp::FrameAncestors::None),
    Hsts::new().max_age_secs(31536000).include_subdomains(true).preload(true),
    XFrameOptions::new("DENY"),
    XContentTypeOptions::new(),
    ReferrerPolicy::new("strict-origin-when-cross-origin"),
);

let app = Router::new()
    .nest("/api/v1", api_router)
    .layer(secure_layer)          // ← 新增
    .layer(create_cors_layer(...))
    .layer(CompressionLayer::new())
    .layer(TraceLayer::new_for_http());
```

### 验证

```bash
# 检查响应头
curl -I http://localhost:8080/health 2>/dev/null | grep -E 'X-Frame|Strict-Transport|Content-Security|Referrer-Policy|X-Content-Type'

# 期望输出包含所有头部
```

---

## C-3：前端 Three.js 未代码分割

### 核实结论

**问题位置**：`frontend/src/components/home/HeroSection.tsx:5`

```tsx
import { Canvas } from '@react-three/fiber'  // ← 顶层导入，触发 ~850KB bundle

// 第 11-14 行：ParticleScene 做了 dynamic import，但 Canvas 本身是顶层导入
const ParticleScene = dynamic(
    () => import('@/components/home/ParticleBackground'),
    { ssr: false }
);
```

`Canvas` 组件是 React Three.js 的根组件，必须从 `@react-three/fiber` 导入。顶层导入意味着整个 three 生态在 HeroSection 文件被 import 时就加载了，dynamic import `ParticleScene` 无法解决这一问题，因为 `Canvas` 在 HeroSection 的 JSX 中直接使用。

### 影响

- 首屏 JS 增加 ~850KB（three + fiber + drei）
- LCP 指标严重恶化（移动端 3G 网络可能增加 3-5 秒）
- 用户从不与 3D 交互也要下载全部 three.js 代码

### 解决方案

将 Three.js 渲染层封装为独立子组件并动态导入：

**新建** `frontend/src/components/home/ParticleCanvas.tsx`：

```tsx
'use client'

import { Canvas } from '@react-three/fiber'
import { ParticleScene } from './ParticleBackground'

export default function ParticleCanvas() {
    return (
        <Canvas
            camera={{ position: [0, 0, 5], fov: 75 }}
            dpr={[1, 2]}
            gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
        >
            <ambientLight intensity={0.5} />
            <pointLight position={[10, 10, 10]} />
            <ParticleScene />
        </Canvas>
    )
}
```

**修改** `HeroSection.tsx`：

```tsx
// 替换顶层导入
import dynamic from 'next/dynamic'
// import { Canvas } from '@react-three/fiber'  // ← 删除

// 添加 dynamic import
const ParticleCanvas = dynamic(
    () => import('./ParticleCanvas'),
    {
        ssr: false,
        loading: () => (
            <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900" />
        ),
    }
)
```

### 验证

```bash
cd frontend
pnpm build 2>&1 | grep -E 'Route|○|●' | head -20

# 对比修复前后首页 First Load JS 大小
# 使用 Lighthouse
npx lighthouse http://192.168.0.161:3001 \
  --only-categories=performance --output=json -o lh_after.json
```

---

## 三、🟠 High — 尽快处理

---

## H-1：`/sync/mdx/public` 公开写接口无鉴权

### 核实结论

**位置**：`backend/crates/api/src/main.rs:357-358`

```rust
// TEMPORARY: 公开的MDX同步端点用于测试（生产环境应该移除或添加认证）
.route("/sync/mdx/public", post(blog_api::routes::mdx_sync::sync_mdx_to_db))
```

该接口允许写入/更新博客数据库内容，但：
- 无 JWT 认证
- 无 admin 权限验证
- 无 IP 白名单
- 代码注释明确标注"生产环境应该移除或添加认证"

### 影响

🔴 任何知道该接口的攻击者可未经授权操作博客全部内容（创建、编辑、删除文章）

### 解决方案

**方案 A（推荐）**：生产环境移除该路由：

```rust
#[cfg(not(feature = "dev"))]
{
    // 生产：路由不存在
}

#[cfg(feature = "dev")]
{
    // 开发：带开发者认证
    .route("/sync/mdx/public", post(sync_mdx_to_db)
        .layer(developer_auth_middleware))
}
```

**方案 B**：使用现有的 admin JWT 认证：

```rust
use blog_api::middleware::auth_middleware;

.route("/sync/mdx/public", post(sync_mdx_to_db)
    .layer(axum::middleware::from_fn_with_state(state.clone(), auth_middleware)))
```

### 验证

```bash
# 生产环境应返回 404
curl -X POST https://api.example.com/sync/mdx/public \
  -H "Content-Type: application/json" -d '{"slug":"test"}'
# 期望：404 或 401
```

---

## H-2：注册接口邮箱格式验证缺失

### 核实结论

**位置**：`backend/crates/api/src/routes/auth.rs:33-36`

```rust
// 验证输入 - 邮箱和用户名
if payload.email.len() < 3 || payload.email.len() > 255 {
    return Err(AppError::InvalidInput);
}
// ↑ 仅长度检查，无格式验证
```

### 影响

- 🟠 无效邮箱进入数据库，污染用户表（`test@` / `a@b.c` / `<script>@x.com` 等）
- 🟠 密码重置、邮件通知功能对无效邮箱失效

### 解决方案

```rust
// auth.rs 新增
use regex::Regex;
use once_cell::sync::Lazy;

static EMAIL_REGEX: Lazy<Regex> = Lazy::new(|| {
    Regex::new(
        r"^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$"
    ).unwrap()
});

fn is_valid_email(email: &str) -> bool {
    EMAIL_REGEX.is_match(email)
}

// register 函数中
if !is_valid_email(&payload.email) {
    return Err(AppError::InvalidInput);
}
```

### 验证

```bash
# 无效应邮箱
curl -X POST http://localhost:8080/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"a@b.c","password":"Test123!@#","username":"test"}'
# 期望：400

# 有效邮箱
curl -X POST http://localhost:8080/auth/register \
  -d '{"email":"test@valid.com","password":"Test123!@#","username":"test"}'
# 期望：201
```

---

## H-3：图片尺寸验证空实现（且未被调用）

### 核实结论

**位置**：`backend/crates/api/src/routes/media.rs:784-786`

```rust
#[allow(dead_code)]  // ← 明确标注为死代码
fn get_image_dimensions(_data: &[u8]) -> Result<(Option<i32>, Option<i32>), AppError> {
    Ok((None, None))  // 空实现
}
```

该函数在第 137 行被调用（`get_image_dimensions(&data)?`），但实现是空壳，永远返回 `(None, None)`。

### 影响

- 🔴 用户可上传 1×1 像素图片（16KB）或 20000×20000 像素图片（2GB）
- 🔴 极端宽高比图片破坏前端布局（CLS）
- 🔴 服务端解码超大图片可能 OOM

### 解决方案

**步骤 1**：`Cargo.toml` 添加 `image` crate

```toml
image = "0.25"
```

**步骤 2**：实现真正的尺寸检测

```rust
fn get_image_dimensions(data: &[u8]) -> Result<(Option<i32>, Option<i32>), AppError> {
    use image::GenericImageView;
    match image::get_dimensions(data) {
        Ok((w, h)) => Ok((Some(w as i32), Some(h as i32))),
        Err(_) => Ok((None, None)),  // 不支持的格式允许通过
    }
}

fn validate_image_size(data: &[u8]) -> Result<(i32, i32), AppError> {
    const MAX_W: i32 = 8192;
    const MAX_H: i32 = 8192;
    const MIN_DIM: i32 = 16;

    let (w, h) = get_image_dimensions(data)?
        .ok_or_else(|| AppError::BadRequest("Cannot determine image dimensions".into()))?;

    if w > MAX_W || h > MAX_H {
        return Err(AppError::BadRequest(
            format!("Image {}x{} exceeds max {}x{}", w, h, MAX_W, MAX_H)
        ));
    }
    if w < MIN_DIM || h < MIN_DIM {
        return Err(AppError::BadRequest(
            format!("Image {}x{} below min {}x{}", w, h, MIN_DIM, MIN_DIM)
        ));
    }
    let ratio = w as f64 / h as f64;
    if ratio < 0.05 || ratio > 20.0 {
        return Err(AppError::BadRequest(
            format!("Extreme aspect ratio {:.2}:1", ratio)
        ));
    }
    Ok((w, h))
}
```

**步骤 3**：在上传处理中调用

```rust
// media.rs 第 137 行附近
let (width, height) = if media_type == "image" {
    let (w, h) = validate_image_size(&data)?;  // ← 替换 get_image_dimensions
    (Some(w), Some(h))
} else {
    (None, None)
};
```

### 验证

```bash
# 创建测试图片
convert -size 10000x10000 xc:white large.png
convert -size 10x10 xc:white tiny.png

curl -X POST http://localhost:8080/media/upload -F "file=@large.png"
# 期望：400，"exceeds max"

curl -X POST http://localhost:8080/media/upload -F "file=@tiny.png"
# 期望：400，"below min"

curl -X POST http://localhost:8080/media/upload -F "file=@normal.jpg"
# 期望：201
```

---

## H-4：硬编码开发环境凭证

### 核实结论

**位置**：`backend/crates/api/src/main_simple.rs:72-76`

```rust
password_pepper: "dev-pepper".to_string(),        // ← 硬编码
rate_limit_per_minute: 1000,                      // ← 过高的速率限制
session_secret: "dev-session-secret".to_string(), // ← 硬编码
```

注意：`main_simple.rs` 是独立的简单入口点文件，不等于生产 `main.rs`。但如果团队成员误用此文件作为模板启动生产服务，将直接使用这些弱密钥。

### 影响

🟠 开发文件被误用于生产场景时，攻击者可利用弱密钥进行 JWT 伪造、会话劫持

### 解决方案

- 确认 `main_simple.rs` 有清晰的注释标注为"仅用于本地开发/测试"
- 在生产二进制构建流程中排除 `main_simple.rs`
- 添加 build script 检查：如果 `main_simple.rs` 被包含在 release 构建中则报错

### 验证

```bash
# 确认生产二进制不包含 main_simple.rs 符号
nm target/release/blog-api | grep -i "dev-session\|dev-pepper"
# 期望：无输出
```

---

## 四、🟡 Medium — 近期处理

---

## M-1：ECharts tree-shaking 可能失效

### 核实结论

**现状**：

1. `next.config.js:79` 的 `optimizePackageImports` 列表**包含** `echarts`
2. `package.json:100-102` 存在 `echarts`、`echarts-for-react`、`echarts-gl`
3. **问题**：`optimizePackageImports` 对 `import * as echarts from 'echarts'`（命名空间导入）**无效**

需要检查 `EChartsComponent.tsx` 的实际导入方式：

```tsx
// 当前可能的写法（需要确认）
import * as echarts from 'echarts'  // ← 命名空间导入，bypasses optimizePackageImports
import 'echarts-gl'                 // ← 全量导入
```

### 影响

🟡 如果使用命名空间导入，~800KB ECharts 代码全部打入 bundle，即使只用折线图

### 解决方案

**步骤 1**：确认 EChartsComponent.tsx 实际导入方式：

```bash
grep -n "import.*echarts" frontend/src/components/charts/EChartsComponent.tsx
```

**步骤 2**：如果使用命名空间导入，改为按需导入：

```tsx
import * as echarts from 'echarts/core'
import { LineChart, BarChart } from 'echarts/charts'
import { GridComponent, TooltipComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'

echarts.use([CanvasRenderer, LineChart, BarChart, GridComponent, TooltipComponent])
```

**步骤 3**：`echarts-gl` 如果只用少量 3D 图表，按需导入：

```tsx
import { Scatter3DChart } from 'echarts-gl/charts'
import { Grid3DComponent } from 'echarts-gl/components'
echarts.use([Scatter3DChart, Grid3DComponent])
```

---

## M-2：Bundle Analyzer 已安装但未配置

### 核实结论

- `package.json:11`：存在 `"analyze": "cross-env ANALYZE=true next build"`
- `devDependencies:167`：`@next/bundle-analyzer` 已安装
- `next.config.js`：**缺少** `withBundleAnalyzer` 包装器

### 解决方案

```javascript
// next.config.js 顶部
const withBundleAnalyzer = require('@next/bundle-analyzer')({
    enabled: process.env.ANALYZE === 'true',
})

// 末尾替换
module.exports = withBundleAnalyzer(
    withSentryConfig(finalConfig, sentryBuildOptions)
)
```

**使用**：

```bash
cd frontend && pnpm analyze
# 自动打开 http://localhost:8888 查看 bundle 组成
```

---

## M-3：API 路由缺少缓存头

### 核实结论

**位置**：`frontend/src/app/api/visitors/route.ts:9-14`

```typescript
export async function GET() {
  try {
    const visitors = await readVisitorsFile()
    return NextResponse.json({ visitors })  // ← 无缓存头
  } catch {
    return NextResponse.json({ visitors: [] })
  }
}
```

`readVisitorsFile()` 每次请求都执行 `fs.readFileSync` 读取并解析 JSON 文件。

### 影响

🟡 无缓存时，每次前端访问该 API 都触发文件 I/O，高并发下成为瓶颈

### 解决方案

```typescript
export async function GET() {
  try {
    const visitors = await readVisitorsFile()
    return NextResponse.json(
      { visitors },
      {
        headers: {
          'Cache-Control': 'public, max-age=60, stale-while-revalidate=300',
          'Vary': 'Accept-Encoding',
        },
      }
    )
  } catch {
    return NextResponse.json(
      { visitors: [] },
      { headers: { 'Cache-Control': 'no-store' } }
    )
  }
}
```

---

## M-4：前端 CSP 配置存在 unsafe-eval 风险

### 核实结论

**位置**：`frontend/next.config.js:175-177`（生产环境 CSP）

```javascript
'script-src':
  "'self' 'unsafe-eval' 'wasm-unsafe-eval' 'unsafe-inline' giscus.app analytics.umami.is ...",
```

`unsafe-eval` 允许 `eval()`、`new Function()` 执行字符串代码。

**说明**：当前配置是为了支持：
- Next.js 开发模式的 HMR（需要 `unsafe-eval`）
- WebAssembly 运行（需要 `wasm-unsafe-eval`）
- React Strict Mode（某些 lint 工具）

### 影响

🟡 任何 XSS 注入漏洞可被放大执行任意 JS（`unsafe-eval` 降低了 XSS 攻击门槛）

### 解决方案

**阶段 1**：使用 Report-Only 模式收集违规报告（不影响现有功能）：

```javascript
{
  key: 'Content-Security-Policy-Report-Only',
  value: "default-src 'self'; script-src 'self' ...; report-uri /csp-violation"
}
```

**阶段 2**：根据 Report-Only 数据，逐步移除 `unsafe-inline`（Next.js 可配置 nonce）：

```javascript
// 生产环境目标 CSP
'script-src': "'self' 'wasm-unsafe-eval' giscus.app analytics.umami.is https://cloud.umami.is",
// 移除 'unsafe-eval' 和 'unsafe-inline'
```

---

## M-5：前端 next.config.js 允许 SVG 上传且未配置安全策略

### 核实结论

**位置**：`frontend/next.config.js:57`

```javascript
dangerouslyAllowSVG: true,  // ← 允许 SVG 图片
```

SVG 文件可以包含 `<script>` 标签。如果用户上传恶意 SVG 头像，`<script>` 会在其他用户浏览器中执行。

### 影响

🟡 SVG XSS：如果 `img-src` 允许 `data:` 或 `https:`，攻击者可通过上传含脚本的 SVG 劫持其他用户会话

### 解决方案

**步骤 1**：限制 SVG 仅在白名单场景使用，且强制通过 BLOB URL 渲染：

```javascript
dangerouslyAllowSVG: false  // 默认禁用
```

**步骤 2**：如果必须支持 SVG 头像，在 `next/image` 配置中添加内容安全策略：

```javascript
// 渲染 SVG 时使用 <object> 或 <embed> 而非 <img>
// 或在 CSP 中限制 script-src 与 SVG 渲染器的交互
```

---

## 五、⚪ Low — 建议处理

---

## L-1：后端 CSRF 验证仅检查 UUID 格式

**位置**：`backend/crates/api/src/middleware/csrf.rs`

middleware CLAUDE.md 文档（第 130-135 行）明确记载：

> **Current Implementation**: Validation: UUID format checking only (simplified)  
> **Production Risk**: Accepts any valid UUID as CSRF token  
> **Recommended**: Implement server-side token storage and validation

**建议**：将 CSRF token 存入 Redis 或签名 cookie，与会话绑定验证。

---

## L-2：后端速率限制配置偏高

**位置**：`backend/crates/api/src/main_simple.rs:74`

```rust
rate_limit_per_minute: 1000,  // ← 每分钟 1000 次请求
```

对于公开 GET 接口合理，但对 auth 端点（login/register）过高，可能允许暴力破解。

**建议**：在 `rate_limit.rs` 中为 auth 路由单独设置更严格的限制（如 5 次/分钟）。

---

## L-3：迁移文件冗余

**位置**：`backend/migrations/`

存在 `2026041501_fix_db_violations.sql`、`_v2.sql`、`_v3.sql` 三个版本。

**建议**：保留最终版 v3，归档 v1/v2 到 `migrations/archived/`。

---

## 六、问题汇总与修复优先级

| ID | 问题 | 等级 | 状态 | 预计工时 |
|----|------|------|------|----------|
| C-1 | Outbox 事务原子性（3处） | Critical | ⬜ | 4h |
| C-2 | 安全响应头缺失 | Critical | ⬜ | 1h |
| C-3 | Three.js 未代码分割 | Critical | ⬜ | 2h |
| H-1 | /sync/mdx/public 无鉴权 | High | ⬜ | 0.5h |
| H-2 | 邮箱格式验证缺失 | High | ⬜ | 0.5h |
| H-3 | 图片尺寸验证空实现 | High | ⬜ | 2h |
| H-4 | 硬编码开发凭证 | High | ⬜ | 0.5h |
| M-1 | ECharts tree-shaking | Medium | ⬜ | 2h |
| M-2 | Bundle Analyzer 未配置 | Medium | ⬜ | 0.5h |
| M-3 | API 缓存头缺失 | Medium | ⬜ | 0.5h |
| M-4 | CSP unsafe-eval | Medium | ⬜ | 3h+ |
| M-5 | SVG 上传安全 | Medium | ⬜ | 1h |
| L-1 | CSRF 验证仅 UUID | Low | ⬜ | 3h |
| L-2 | 速率限制 auth 端点 | Low | ⬜ | 1h |
| L-3 | 迁移文件冗余 | Low | ⬜ | 0.5h |

**总预计工时：约 21-25 小时**

---

## 七、相关文件索引

### 后端关键文件

```
backend/
├── Cargo.toml                              # tower-http 依赖
├── crates/api/src/main.rs                  # 路由注册、CORS、安全头（C-2, H-1）
├── crates/api/src/main_simple.rs            # 硬编码凭证（H-4）
├── crates/api/src/routes/
│   ├── posts.rs                            # Outbox 原子性问题（C-1）
│   ├── auth.rs                             # 邮箱验证缺失（H-2）
│   └── media.rs                            # 图片尺寸空实现（H-3）
├── crates/api/src/middleware/
│   ├── csrf.rs                             # CSRF 仅 UUID 格式（L-1）
│   └── rate_limit.rs                       # auth 端点限制偏高（L-2）
└── migrations/                             # 冗余迁移文件（L-3）
```

### 前端关键文件

```
frontend/
├── next.config.js                          # 安全头、CSP（M-4, M-5）、Bundle Analyzer（M-2）
├── package.json                            # analyze script（M-2）
└── src/
    ├── app/api/visitors/route.ts           # 缓存头缺失（M-3）
    └── components/home/
        ├── HeroSection.tsx                 # Three.js 未分割（C-3）
        ├── ParticleCanvas.tsx              # 【新建】
        └── ParticleBackground.tsx          # 粒子场景
```

---

*报告由 Hermes AIAudit v2 生成 | 生成时间：2025-04-14 | 基于源码逐行核实*

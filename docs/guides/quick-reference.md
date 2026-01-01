# 前后端开发快速参考

## 🚀 快速启动

### 只开发后端
```bash
cd backend
DATABASE_URL="postgresql://..." REDIS_URL="..." cargo run --bin api
```

### 只开发前端（使用 Mock）
```bash
cd frontend
pnpm mock                    # 终端 1
NEXT_PUBLIC_USE_MOCK=true pnpm dev    # 终端 2
```

### 同时开发前后端
```bash
# 终端 1
cd backend && cargo run --bin api

# 终端 2
cd frontend && pnpm dev
```

---

## 📝 后端开发

### 添加新 API 端点（3 步）

#### 1. 创建路由处理器
```rust
// backend/crates/api/src/routes/feature.rs
use blog_shared::{ApiResponse, AppError, PaginatedResponse, ResourceQuery};

#[utoipa::path(
    get,
    path = "/v1/features",
    responses(
        (status = 200, description = "成功")
    ),
    tag = "features"
)]
pub async fn list_features(
    State(state): State<AppState>,
    Query(params): Query<ResourceQuery>,
) -> Result<Json<ApiResponse<PaginatedResponse<Feature>>>, AppError> {
    let limit = params.validate_limit(100);
    let items = fetch_items(&state.db, limit).await?;
    let total = count_items(&state.db).await?;

    let response = PaginatedResponse {
        items,
        meta: blog_shared::PaginationMeta::new(params.page, limit, total),
    };

    Ok(Json(ApiResponse::success(response)))
}
```

#### 2. 注册路由
```rust
// backend/crates/api/src/main.rs
use blog_api::routes::feature;

fn api_router() -> Router {
    Router::new()
        .route("/features", get(feature::list_features))
}
```

#### 3. 添加到 OpenAPI
```rust
// backend/crates/api/src/routes/openapi.rs
#[derive(OpenApi)]
#[openapi(
    paths(
        crate::routes::feature::list_features,
    )
)]
pub struct ApiDoc;
```

### 常用代码片段

#### 返回成功响应
```rust
Ok(Json(ApiResponse::success(data)))
```

#### 返回分页响应
```rust
let paginated = PaginatedResponse {
    items,
    meta: PaginationMeta::new(page, limit, total),
};
Ok(Json(ApiResponse::success(paginated)))
```

#### 返回错误
```rust
Err(AppError::NotFound)         // 404
Err(AppError::Unauthorized)     // 401
Err(AppError::BadRequest(msg))  // 400
```

#### 数据库查询
```rust
// 查询列表
let items = sqlx::query_as!(
    Model,
    "SELECT * FROM table ORDER BY created_at DESC LIMIT $1 OFFSET $2",
    limit as i64,
    offset as i64
)
.fetch_all(pool)
.await?;

// 查询单个
let item = sqlx::query_as!(
    Model,
    "SELECT * FROM table WHERE id = $1",
    id
)
.fetch_optional(pool)
.await?
.ok_or(AppError::NotFound)?;

// 计数
let total: i64 = sqlx::query_scalar!("SELECT COUNT(*) FROM table")
    .fetch_one(pool)
.await?;
```

### 测试
```bash
# 运行所有测试
cargo test --workspace

# 测试单个文件
cargo test --package blog-api

# 测试单个函数
cargo test test_list_features

# 显示输出
cargo test -- --nocapture
```

---

## 🎨 前端开发

### 开发新功能（使用 Mock）

#### 1. 生成类型
```bash
cd frontend
pnpm generate:types
```

#### 2. 启动 Mock Server
```bash
pnpm mock
# 运行在 http://localhost:4010
```

#### 3. 启动开发服务器
```bash
NEXT_PUBLIC_USE_MOCK=true pnpm dev
```

#### 4. 编写代码
```typescript
// app/features/page.tsx
import { components } from '@/lib/types/openapi-generated'

type Feature = components['schemas']['Feature']

export default async function FeaturesPage() {
  const features = await fetchFeatures()

  return (
    <div>
      {features.map((f: Feature) => (
        <div key={f.id}>{f.name}</div>
      ))}
    </div>
  )
}
```

### 常用代码片段

#### API 调用
```typescript
import { apiClient } from '@/lib/api/apiClient'

const data = await apiClient.get<ResponseType>('/features')
```

#### 错误处理
```typescript
try {
  const response = await apiClient.get('/data')
  if (!response.success) {
    throw new Error(response.error.message)
  }
  return response.data
} catch (error) {
  console.error('API Error:', error)
}
```

#### 类型定义
```typescript
// 使用生成的类型
import { components, paths } from '@/lib/types/openapi-generated'

type Post = components['schemas']['Post']
type PostListResponse = components['schemas']['ApiResponse_PaginatedResponse_PostListItem_']
```

### 测试
```bash
# 类型检查
pnpm tsc --noEmit

# Lint
pnpm lint

# 单元测试
pnpm test

# E2E 测试
pnpm test:e2e

# 契约测试
CI=true pnpm exec playwright test e2e/api-contract.spec.ts
```

---

## 🔧 常见任务

### 更新 API 接口

**后端**：
1. 修改结构体或路由
2. 更新 `backend/openapi/openapi.json`
3. 运行测试

**前端**：
```bash
cd frontend
pnpm generate:types        # 重新生成类型
# 更新代码以使用新类型
```

### 添加数据库迁移

```bash
# 1. 创建迁移文件
cd backend/migrations
vim XXXX_new_feature.sql

# 2. 编写 SQL
CREATE TABLE features (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

# 3. 重启后端（自动运行迁移）
cargo run --bin api
```

### 修复端口占用

**Windows**：
```bash
netstat -ano | findstr ":3000"
taskkill /F /PID <PID>
```

**Linux/Mac**：
```bash
lsof -ti:3000 | xargs kill -9
```

### 查看 Mock Server 日志

```bash
cd frontend
npx prism mock openapi.json -p 4010 -v debug
```

---

## 📊 API 响应格式

### 成功
```json
{
  "success": true,
  "data": { ... },
  "message": "操作成功"
}
```

### 分页
```json
{
  "success": true,
  "data": {
    "items": [...],
    "meta": {
      "page": 1,
      "limit": 20,
      "total": 100,
      "total_pages": 5,
      "has_next": true,
      "has_prev": false
    }
  }
}
```

### 错误
```json
{
  "success": false,
  "error": {
    "code": "POST_NOT_FOUND",
    "message": "文章不存在",
    "type": "404"
  }
}
```

---

## 🐛 调试

### 后端
```bash
# 启用调试日志
RUST_LOG=debug cargo run --bin api

# 查看数据库查询
RUST_LOG=sqlx=debug cargo run --bin api
```

### 前端
```bash
# 启用 Next.js 调试
NODE_OPTIONS='--inspect' pnpm dev

# 查看 Playwright 调试
pnpm exec playwright test --debug
```

---

## 📦 构建和部署

### 后端
```bash
# 构建
cd backend
cargo build --release

# Docker
docker build -t blog-backend .
docker run -d -p 3000:3000 blog-backend
```

### 前端
```bash
# 构建
cd frontend
pnpm build

# 本地预览
pnpm start

# Docker
docker build -t blog-frontend .
docker run -d -p 3001:3000 blog-frontend
```

---

## ⌨️ 快捷命令

| 任务 | 命令 |
|------|------|
| 启动后端 | `cd backend && cargo run --bin api` |
| 启动前端 | `cd frontend && pnpm dev` |
| 启动 Mock | `cd frontend && pnpm mock` |
| 生成类型 | `cd frontend && pnpm generate:types` |
| 后端测试 | `cd backend && cargo test` |
| 前端测试 | `cd frontend && pnpm test` |
| 契约测试 | `cd frontend && CI=true pnpm exec playwright test e2e/api-contract.spec.ts` |
| 类型检查 | `cd frontend && pnpm tsc --noEmit` |
| Lint | `cd frontend && pnpm lint` |
| 格式化 | `cd backend && cargo fmt` |
| 代码检查 | `cd backend && cargo clippy` |

---

**完整文档**：请查看 [FRONTEND_BACKEND_GUIDE.md](./FRONTEND_BACKEND_GUIDE.md)

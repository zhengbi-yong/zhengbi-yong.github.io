# 前后端解耦开发与测试指南

## 📚 目录

- [项目架构](#项目架构)
- [快速开始](#快速开始)
- [后端开发流程](#后端开发流程)
- [前端开发流程](#前端开发流程)
- [测试指南](#测试指南)
- [CI/CD 流程](#cicd-流程)
- [常见问题](#常见问题)
- [API 规范](#api-规范)

---

## 项目架构

### 技术栈

**后端**：
- Rust + Axum 0.8
- SQLx + PostgreSQL
- Redis（缓存和会话）
- JWT 认证
- Utoipa（OpenAPI 文档）

**前端**：
- Next.js 16 + React 19
- TypeScript
- Tailwind CSS
- Playwright（E2E 测试）
- MSW（API Mock）

### 项目结构

```
zhengbi-yong.github.io/
├── backend/                      # 后端项目
│   ├── crates/
│   │   ├── shared/              # 共享库（API 响应、错误、查询参数）
│   │   ├── api/                 # API 服务器
│   │   ├── core/                # 核心业务逻辑
│   │   └── db/                  # 数据库层
│   ├── openapi/                 # OpenAPI 规范输出
│   └── migrations/              # 数据库迁移
│
├── frontend/                     # 前端项目
│   ├── lib/
│   │   ├── types/              # 类型定义（包括自动生成的）
│   │   └── api/                # API 客户端
│   ├── src/mocks/              # MSW Mock 处理器
│   ├── e2e/                    # E2E 测试
│   ├── scripts/                # 构建和开发脚本
│   └── openapi.json            # OpenAPI 规范副本
│
└── .github/workflows/           # CI/CD 配置
    ├── frontend-ci.yml
    └── backend-ci.yml
```

---

## 快速开始

### 环境准备

**必需软件**：
- Rust 1.75+
- Node.js 20+
- pnpm 8+
- PostgreSQL 17
- Redis
- Git

**安装步骤**：
```bash
# 克隆项目
git clone <repository-url>
cd zhengbi-yong.github.io

# 安装前端依赖
cd frontend
pnpm install

# 回到根目录
cd ..
```

### 一键启动（开发环境）

#### 只启动后端
```bash
cd backend
# 设置环境变量（或使用 .env 文件）
DATABASE_URL="postgresql://blog_user:blog_password@localhost:5432/blog_db" \
REDIS_URL="redis://localhost:6379" \
JWT_SECRET="dev-secret-key-for-testing-only-32-chars" \
SESSION_SECRET="dev-session-secret" \
cargo run --bin api
```

#### 只启动前端（使用 Mock Server）
```bash
cd frontend

# 终端 1：启动 Mock Server
pnpm mock

# 终端 2：启动前端开发服务器
NEXT_PUBLIC_USE_MOCK=true pnpm dev
```

#### 同时启动前后端
```bash
# 终端 1：后端
cd backend && cargo run --bin api

# 终端 2：前端
cd frontend && pnpm dev
```

---

## 后端开发流程

### 1. 创建新的 API 端点

#### 步骤 1：定义数据模型

在 `backend/crates/db/models/` 中定义或使用现有模型：

```rust
// backend/crates/db/models/example.rs
use serde::{Serialize, Deserialize};

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ExampleModel {
    pub id: String,
    pub name: String,
    pub created_at: chrono::DateTime<chrono::Utc>,
}
```

#### 步骤 2：创建路由处理器

在 `backend/crates/api/src/routes/` 中创建新的路由文件：

```rust
// backend/crates/api/src/routes/example.rs
use axum::{Json, extract::{Query, State}};
use blog_shared::{ApiResponse, PaginatedResponse, ResourceQuery, AppError};

/// 列表接口
pub async fn list_examples(
    State(state): State<blog_api::AppState>,
    Query(params): Query<ResourceQuery>,
) -> Result<Json<ApiResponse<PaginatedResponse<ExampleModel>>>, AppError> {
    // 1. 验证分页参数
    let limit = params.validate_limit(100);
    let offset = params.offset();

    // 2. 查询数据库
    let pool = &state.db;
    let items = sqlx::query_as!(
        ExampleModel,
        "SELECT * FROM examples ORDER BY created_at DESC LIMIT $1 OFFSET $2",
        limit as i64,
        offset as i64
    )
    .fetch_all(pool)
    .await?;

    // 3. 查询总数
    let total: i64 = sqlx::query_scalar!("SELECT COUNT(*) FROM examples")
        .fetch_one(pool)
        .await?;

    // 4. 构建分页响应
    let paginated = PaginatedResponse {
        items,
        meta: blog_shared::PaginationMeta::new(params.page, limit, total as u64),
    };

    Ok(Json(ApiResponse::success(paginated)))
}

/// 详情接口
pub async fn get_example(
    Path(id): Path<String>,
    State(state): State<blog_api::AppState>,
) -> Result<Json<ApiResponse<ResourceResponse<ExampleModel>>>, AppError> {
    let pool = &state.db;

    let example = sqlx::query_as!(
        ExampleModel,
        "SELECT * FROM examples WHERE id = $1",
        id
    )
    .fetch_optional(pool)
    .await?
    .ok_or(AppError::NotFound)?;

    let resource = ResourceResponse::new(example, vec![]);
    Ok(Json(ApiResponse::success(resource)))
}
```

#### 步骤 3：添加 OpenAPI 文档注解

```rust
use utoipa::ToSchema;

#[derive(Debug, Serialize, Deserialize, ToSchema)]
pub struct ExampleModel {
    pub id: String,
    pub name: String,
    pub created_at: chrono::DateTime<chrono::Utc>,
}

/// 列出所有示例
///
/// 返回分页的示例列表
#[utoipa::path(
    get,
    path = "/v1/examples",
    params(
        ("page" = u32, Query, description = "页码"),
        ("limit" = u32, Query, description = "每页数量")
    ),
    responses(
        (status = 200, description = "成功获取列表", body = ApiResponse<PaginatedResponse<ExampleModel>>),
        (status = 500, description = "服务器错误", body = ApiError)
    ),
    tag = "examples",
    security(("BearerAuth" = []))
)]
pub async fn list_examples(...) -> ... { ... }
```

#### 步骤 4：注册路由

在 `backend/crates/api/src/main.rs` 中注册：

```rust
use blog_api::routes::example;

fn api_router() -> Router {
    Router::new()
        // ... 其他路由
        .route("/examples", get(example::list_examples))
        .route("/examples/:id", get(example::get_example))
}
```

#### 步骤 5：添加到 OpenAPI 规范

在 `backend/crates/api/src/routes/openapi.rs` 中添加：

```rust
#[derive(OpenApi)]
#[openapi(
    paths(
        // ... 现有路径
        crate::routes::example::list_examples,
        crate::routes::example::get_example,
    ),
    components(schemas(
        blog_db::models::ExampleModel,
    )),
    tags(
        (name = "examples", description = "示例资源管理"),
    )
)]
pub struct ApiDoc;
```

### 2. 更新 OpenAPI 规范

**手动更新**（当前推荐方式）：

```bash
# 编辑 backend/openapi/openapi.json
# 添加新的端点和 schema 定义
```

**程序化生成**（待修复栈溢出问题）：

```bash
cd backend
cargo run --bin export_openapi
```

### 3. 后端测试

#### 单元测试

在 `backend/crates/api/src/routes/example.rs` 中添加测试：

```rust
#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_list_examples() {
        // 测试逻辑
    }
}
```

运行测试：

```bash
# 测试所有 crates
cd backend
cargo test

# 测试特定 crate
cargo test --package blog-api

# 测试并显示输出
cargo test -- --nocapture

# 测试特定函数
cargo test test_list_examples
```

#### 集成测试

```bash
cd backend

# 启动数据库（Docker）
docker run -d -p 5432:5432 \
  -e POSTGRES_USER=blog_user \
  -e POSTGRES_PASSWORD=blog_password \
  -e POSTGRES_DB=blog_db \
  postgres:17

# 启动 Redis
docker run -d -p 6379:6379 redis:7

# 运行集成测试
cargo test --test '*'
```

### 4. 后端开发最佳实践

#### 错误处理

使用统一的错误响应格式：

```rust
use blog_shared::{AppError, ApiResponse};

pub async fn example_handler() -> Result<Json<ApiResponse<Data>>, AppError> {
    // 业务逻辑
    let result = do_something()
        .map_err(|e| AppError::DatabaseError(e.to_string()))?;

    Ok(Json(ApiResponse::success(result)))
}
```

#### 分页查询

使用标准化的分页参数：

```rust
use blog_shared::{ResourceQuery, PaginationMeta};

pub async fn list_items(
    Query(params): Query<ResourceQuery>,
) -> ... {
    let limit = params.validate_limit(100);  // 最大 100 条
    let offset = params.offset();

    // ... 查询数据

    let meta = PaginationMeta::new(params.page, limit, total);
    // ... 返回分页响应
}
```

#### 认证和授权

```rust
use axum::extract::Request;
use blog_core::auth::Claims;

pub async fn protected_handler(
    claims: Claims,  // JWT 认证
    State(state): State<AppState>,
) -> ... {
    // claims.user_id 包含当前用户 ID
    // claims.role 包含用户角色
}
```

---

## 前端开发流程

### 1. 使用 Mock Server 开发

#### 步骤 1：启动 Mock Server

```bash
cd frontend
pnpm mock
# Mock Server 运行在 http://localhost:4010
```

#### 步骤 2：启动前端开发服务器

```bash
cd frontend
NEXT_PUBLIC_USE_MOCK=true pnpm dev
# 前端运行在 http://localhost:3000
```

#### 步骤 3：开发功能

前端会自动使用 Mock Server 的数据，无需等待后端完成。

### 2. 生成类型

当后端 API 变更后，重新生成类型：

```bash
cd frontend
pnpm generate:types
```

查看生成的类型：

```typescript
// frontend/lib/types/openapi-generated.ts
export interface components {
  schemas: {
    // 自动生成的类型
    ExampleModel: {
      id: string;
      name: string;
      created_at: string;
    };
    ApiResponse_ExampleModel_: {
      success: boolean;
      data: components["schemas"]["ExampleModel"];
      message?: string;
    };
  }
}
```

### 3. 使用生成的类型

```typescript
// frontend/app/examples/page.tsx
import { components } from '@/lib/types/openapi-generated'

type ExampleModel = components['schemas']['ExampleModel']
type ApiResponse = components['schemas']['ApiResponse_ExampleModel_']

export default async function ExamplesPage() {
  const examples = await fetchExamples()

  return (
    <div>
      {examples.map((ex: ExampleModel) => (
        <div key={ex.id}>{ex.name}</div>
      ))}
    </div>
  )
}
```

### 4. 创建自定义 Mock 数据（MSW）

如果需要更复杂的 Mock 逻辑，使用 MSW：

```typescript
// frontend/src/mocks/handlers.ts
import { rest } from 'msw'

export const handlers = [
  // 自定义文章列表 Mock
  rest.get('http://localhost:4010/posts', (req, res, ctx) => {
    const page = Number(req.url.searchParams.get('page') || '1')

    return res(
      ctx.status(200),
      ctx.json({
        success: true,
        data: {
          items: [
            { id: '1', title: 'First Post', slug: 'first-post' },
            { id: '2', title: 'Second Post', slug: 'second-post' },
          ],
          meta: {
            page,
            limit: 20,
            total: 100,
            total_pages: 5,
            has_next: true,
            has_prev: false,
          }
        }
      })
    )
  }),
]
```

### 5. 前端测试

#### 单元测试

```bash
cd frontend
pnpm test
```

#### E2E 测试

```bash
# 契约测试（使用 Mock Server）
CI=true pnpm exec playwright test e2e/api-contract.spec.ts

# 完整 E2E 测试（需要启动开发服务器）
pnpm test:e2e
```

#### 测试示例

```typescript
// frontend/e2e/example.spec.ts
import { test, expect } from '@playwright/test'

test('loads examples page', async ({ page }) => {
  await page.goto('/examples')
  await expect(page.locator('h1')).toContainText('Examples')
})
```

### 6. 前端开发最佳实践

#### API 客户端使用

```typescript
// frontend/lib/api/examples.ts
import { apiClient } from './apiClient'
import { components } from '@/lib/types/openapi-generated'

type ExampleListResponse = components['schemas']['ApiResponse_PaginatedResponse_ExampleModel_']

export async function getExamples(page = 1, limit = 20) {
  return apiClient.get<ExampleListResponse>(`/examples?page=${page}&limit=${limit}`)
}
```

#### 错误处理

```typescript
// frontend/lib/api/apiClient.ts
import { AppError } from '@/lib/types/errors'

export async function fetchWithHandling(url: string) {
  try {
    const response = await fetch(url)
    const data = await response.json()

    if (!data.success) {
      throw new AppError(data.error.code, data.error.message)
    }

    return data.data
  } catch (error) {
    // 统一错误处理
    console.error('API Error:', error)
    throw error
  }
}
```

---

## 测试指南

### 后端测试

#### 运行所有测试

```bash
cd backend
cargo test --workspace
```

#### 测试覆盖率

```bash
# 安装 tarpaulin
cargo install cargo-tarpaulin

# 生成覆盖率报告
cargo tarpaulin --workspace --out Html --output-dir coverage
```

#### API 测试

```bash
# 启动后端
cd backend
cargo run --bin api

# 测试端点（另一个终端）
curl http://localhost:3000/v1/posts
curl http://localhost:3000/v1/posts/example-post
```

### 前端测试

#### 类型检查

```bash
cd frontend
pnpm tsc --noEmit
```

#### Lint

```bash
cd frontend
pnpm lint
```

#### 单元测试

```bash
cd frontend
pnpm test --coverage
```

#### E2E 测试

```bash
# 契约测试（不需要后端）
CI=true pnpm exec playwright test e2e/api-contract.spec.ts

# 完整 E2E 测试（需要前端服务器）
pnpm test:e2e
```

### 契约测试（API Contract Testing）

契约测试确保前后端接口一致性：

```bash
# 1. 启动 Mock Server
cd frontend
pnpm mock

# 2. 运行契约测试
CI=true pnpm exec playwright test e2e/api-contract.spec.ts --reporter=list

# 预期输出
# ✓ GET /posts should return valid response structure
# ✓ POST /auth/login should return tokens
# 1 skipped
# 2 passed
```

---

## CI/CD 流程

### 后端 CI/CD

**触发条件**：
- Push to `main` 或 `develop` 分支
- 修改 `backend/**` 路径下的文件

**流程**：
1. **Lint & Type Check** - Rust 编译检查
2. **Tests** - 运行所有单元测试和集成测试
3. **Build Docker** - 构建 Docker 镜像
4. **Push to Registry** - 推送到 GHCR
5. **Deploy** - 部署到生产服务器

**查看 CI 状态**：
```bash
# 在 GitHub 仓库页面
Actions -> Backend CI/CD
```

**手动触发**：
```bash
git push origin main
```

### 前端 CI/CD

**触发条件**：
- Push to `main` 或 `develop` 分支
- 修改 `frontend/**` 路径下的文件

**流程**：
1. **Lint** - ESLint 检查
2. **Type Check** - TypeScript 类型检查
3. **Unit Tests** - 运行 Vitest 测试
4. **Contract Tests** - 运行 API 契约测试
5. **Build** - 构建生产版本
6. **Deploy** - 部署到 Vercel

**查看 CI 状态**：
```bash
# 在 GitHub 仓库页面
Actions -> Frontend CI/CD
```

---

## 常见问题

### Q1: 后端编译时出现 "ToSchema trait not found"

**原因**：在 `blog-shared` crate 中使用了 `ToSchema`，但该 crate 没有 `utoipa` 依赖。

**解决**：
```rust
// 不要在 shared crate 中使用 ToSchema
// 只在 api crate 中使用
#[derive(Debug, Serialize, Deserialize)]  // 移除 ToSchema
pub struct ApiError { ... }
```

### Q2: export_openapi 栈溢出

**原因**：utoipa 在处理复杂嵌套结构时出现递归深度问题。

**解决**：手动维护 `backend/openapi/openapi.json` 文件。

### Q3: Mock Server 返回 401 Unauthorized

**原因**：OpenAPI 规范中设置了全局 BearerAuth。

**解决**：在特定端点上添加 `security: []`：
```json
{
  "paths": {
    "/posts": {
      "get": {
        "security": []  // 覆盖全局安全设置
      }
    }
  }
}
```

### Q4: 前端类型生成失败

**原因**：OpenAPI 规范格式错误或路径不正确。

**解决**：
```bash
# 检查 OpenAPI 规范
cd frontend
npx openapi-typescript openapi.json --output test-types.ts

# 查看错误信息并修复
```

### Q5: Playwright 测试超时

**原因**：Mock Server 未启动或端口不匹配。

**解决**：
```bash
# 确保 Mock Server 运行在 4010
cd frontend
pnpm mock

# 使用 CI=true 跳过 webServer
CI=true pnpm exec playwright test e2e/api-contract.spec.ts
```

### Q6: 端口被占用

**Windows**：
```bash
# 查找占用端口的进程
netstat -ano | findstr ":3000"
taskkill /F /PID <PID>
```

**Linux/Mac**：
```bash
lsof -ti:3000 | xargs kill -9
```

---

## API 规范

### 统一响应格式

#### 成功响应

```typescript
{
  "success": true,
  "data": T,
  "message"?: string
}
```

#### 分页响应

```typescript
{
  "success": true,
  "data": {
    "items": T[],
    "meta": {
      "page": number,
      "limit": number,
      "total": number,
      "total_pages": number,
      "has_next": boolean,
      "has_prev": boolean
    }
  }
}
```

#### 错误响应

```typescript
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",      // 机器可读
    "message": "错误消息",      // 人类可读
    "type": "400"              // HTTP 状态码
  }
}
```

### 错误代码表

| 代码 | HTTP | 说明 |
|------|------|------|
| `INVALID_CREDENTIALS` | 401 | 邮箱或密码错误 |
| `TOKEN_EXPIRED` | 401 | 登录已过期 |
| `POST_NOT_FOUND` | 404 | 文章不存在 |
| `COMMENT_NOT_FOUND` | 404 | 评论不存在 |
| `EMAIL_EXISTS` | 409 | 邮箱已被注册 |
| `RATE_LIMIT_EXCEEDED` | 429 | 请求过于频繁 |
| `DATABASE_ERROR` | 500 | 数据库错误 |
| `INTERNAL_ERROR` | 500 | 服务器内部错误 |

### RESTful 约定

#### 资源命名

- 使用复数名词：`/posts`, `/users`, `/comments`
- 使用小写和连字符：`/blog-posts`, `/user-profiles`

#### HTTP 方法

```bash
GET    /posts          # 列表
GET    /posts/:id      # 详情
POST   /posts          # 创建
PUT    /posts/:id      # 完整更新
PATCH  /posts/:id      # 部分更新
DELETE /posts/:id      # 删除
```

#### 查询参数

```bash
# 分页
?limit=20&page=1

# 排序（+升序，-降序）
?sort=+created_at
?sort=-title

# 字段选择
?fields=id,title,slug

# 资源展开
?include=author,category,tags

# 过滤
?filter={"status":"published"}
```

---

## 开发工作流示例

### 场景 1：添加新的文章字段

**后端**：
1. 修改数据库模型和迁移
2. 更新 `Post` 结构体
3. 更新 OpenAPI 规范
4. 运行测试

**前端**：
1. 重新生成类型：`pnpm generate:types`
2. 更新 UI 组件以显示新字段
3. 运行测试

### 场景 2：创建新功能（完全独立开发）

**第 1 周：后端开发**
1. 定义 API 接口（OpenAPI）
2. 实现后端逻辑
3. 编写单元测试
4. 导出 OpenAPI 规范

**第 2 周：前端开发（并行）**
1. 从 OpenAPI 生成类型
2. 使用 Mock Server 开发 UI
3. 编写前端测试
4. 无需等待后端完成

**第 3 周：集成**
1. 前端连接真实后端
2. 运行契约测试
3. 修复集成问题
4. 部署

---

## 性能优化建议

### 后端

1. **使用 Redis 缓存**
```rust
// 缓存热门文章
let cache_key = format!("posts:hot");
if let Ok(cached) = redis.get::<_, String>(&cache_key).await {
    return Ok(serde_json::from_str(&cached)?);
}
```

2. **数据库查询优化**
```rust
// 使用索引
CREATE INDEX idx_posts_created_at ON posts(created_at DESC);

// 避免 N+1 查询
SELECT posts.*, authors.name FROM posts
JOIN authors ON posts.author_id = authors.id;
```

3. **连接池配置**
```rust
sqlx::postgres::PgPoolOptions::new()
    .max_connections(20)
    .connect(&database_url)
    .await?;
```

### 前端

1. **数据预取**
```typescript
// 预取下一页
useEffect(() => {
  if (hasNext) {
    prefetchPosts(page + 1)
  }
}, [page, hasNext])
```

2. **组件懒加载**
```typescript
const HeavyComponent = dynamic(() => import('./HeavyComponent'), {
  loading: () => <Spinner />,
})
```

3. **API 响应缓存**
```typescript
// 使用 SWR 或 React Query
const { data } = useSWR('/posts', fetcher, {
  revalidateOnFocus: false,
  dedupingInterval: 60000,
})
```

---

## 部署

### 后端部署

```bash
# 构建 Docker 镜像
cd backend
docker build -t blog-backend .

# 运行容器
docker run -d \
  -p 3000:3000 \
  -e DATABASE_URL="postgresql://..." \
  -e REDIS_URL="redis://..." \
  --name blog-api \
  blog-backend
```

### 前端部署

```bash
# 构建生产版本
cd frontend
pnpm build

# 部署到 Vercel
vercel --prod

# 或使用 Docker
docker build -t blog-frontend .
docker run -d -p 3001:3000 blog-frontend
```

---

## 附录

### 有用的命令

**后端**：
```bash
# 格式化代码
cargo fmt

# 代码检查
cargo clippy

# 更新依赖
cargo update

# 清理构建
cargo clean
```

**前端**：
```bash
# 格式化代码
pnpm format

# 代码检查
pnpm lint

# 更新依赖
pnpm update

# 清理构建
pnpm clean
```

### 参考资源

- [Axum 文档](https://docs.rs/axum/)
- [SQLx 文档](https://docs.rs/sqlx/)
- [Next.js 文档](https://nextjs.org/docs)
- [OpenAPI 规范](https://spec.openapis.org/oas/latest.html)
- [Playwright 文档](https://playwright.dev/docs/intro)
- [Prism 文档](https://stoplight.io/open-source/prism)

---

**文档版本**：v1.0.0
**最后更新**：2026-01-01
**维护者**：Claude Code

如有问题，请查看项目 README 或提交 Issue。

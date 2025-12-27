# Development Best Practices

本文档说明项目开发的最佳实践，帮助团队保持代码质量和一致性。

## 目录

- [代码风格](#代码风格)
- [架构模式](#架构模式)
- [测试实践](#测试实践)
- [Git 工作流](#git-工作流)
- [文档规范](#文档规范)
- [性能优化](#性能优化)
- [安全实践](#安全实践)

---

## 代码风格

### TypeScript 规范

#### 命名约定

```typescript
// ✅ 组件：PascalCase
function UserProfile() {}

// ✅ Hooks：camelCase with 'use' prefix
function useUserData() {}

// ✅ 类型/接口：PascalCase
interface UserData {}
type UserRole = 'admin' | 'user'

// ✅ 常量：UPPER_SNAKE_CASE
const MAX_RETRIES = 3
const API_BASE_URL = 'https://api.example.com'

// ✅ 变量/函数：camelCase
const userCount = 0
function getUserData() {}

// ✅ 私有变量：_prefix
const _internalState = {}
```

#### 文件命名

```
components/
├── UserProfile.tsx        # 组件文件：PascalCase.tsx
├── useUserData.ts         # Hook 文件：camelCase.ts
├── user-types.ts          # 类型文件：entity-types.ts
└── user-utils.ts          # 工具文件：entity-utils.ts
```

#### 类型定义

```typescript
// ✅ 使用 interface 定义对象形状
interface User {
  id: string
  name: string
  email: string
}

// ✅ 使用 type 定义联合类型或交叉类型
type UserRole = 'admin' | 'user' | 'moderator'
type UserWithRole = User & { role: UserRole }

// ✅ 避免使用 any
// ❌ function processData(data: any) {}
// ✅ function processData(data: unknown) {
//     if (typeof data === 'string') { ... }
//   }
```

---

### Rust 规范

#### 命名约定

```rust
// ✅ 函数和变量：snake_case
fn get_user_data() {}
let user_count = 0;

// ✅ 类型和结构体：PascalCase
struct UserData {}
enum UserRole {}

// ✅ 常量：UPPER_SNAKE_CASE
const MAX_RETRIES: u32 = 3;

// ✅ 私有字段：_prefix
struct User {
    pub id: Uuid,
    _internal_state: String,
}
```

#### 错误处理

```rust
// ✅ 使用 Result 处理可能失败的操作
fn divide(a: f64, b: f64) -> Result<f64, String> {
    if b == 0.0 {
        Err("Cannot divide by zero".to_string())
    } else {
        Ok(a / b)
    }
}

// ✅ 使用 ? 传播错误
async fn get_user(pool: &PgPool, id: Uuid) -> Result<User> {
    let user = sqlx::query_as::<_, User>("SELECT * FROM users WHERE id = $1")
        .bind(id)
        .fetch_one(pool)
        .await?; // 自动传播错误

    Ok(user)
}
```

#### 代码组织

```rust
// 文件结构
// 1. 导入
use std::collections::HashMap;
use sqlx::PgPool;

// 2. 常量
const MAX_RETRIES: u32 = 3;

// 3. 类型定义
#[derive(Debug, Clone)]
pub struct User {
    pub id: Uuid,
    pub name: String,
}

// 4. trait 实现
impl User {
    pub fn new(name: String) -> Self {
        Self {
            id: Uuid::new_v4(),
            name,
        }
    }
}

// 5. 函数
pub async fn get_user(pool: &PgPool, id: Uuid) -> Result<User> {
    // ...
}
```

---

### 注释标准

#### 代码注释

```typescript
/**
 * 获取用户数据
 *
 * @param userId - 用户 ID
 * @param includeProfile - 是否包含个人资料
 * @returns 用户数据
 *
 * @example
 * ```typescript
 * const user = await getUser('123', true)
 * ```
 */
async function getUser(
  userId: string,
  includeProfile: boolean = false
): Promise<User> {
  // 实现...
}
```

#### Rust 文档注释

```rust
/// 获取用户数据
///
/// # 参数
///
/// * `pool` - 数据库连接池
/// * `user_id` - 用户 ID
///
/// # 返回
///
/// 返回一个 `Result`，包含用户数据或错误
///
/// # 示例
///
/// ```no_run
/// use sqlx::PgPool;
///
/// # async fn example() -> Result<(), Box<dyn std::error::Error>> {
/// let pool = PgPool::connect("postgresql://...").await?;
/// let user = get_user(&pool, uuid::Uuid::new_v4()).await?;
/// # Ok(())
/// # }
/// ```
pub async fn get_user(pool: &PgPool, user_id: Uuid) -> Result<User> {
    // ...
}
```

---

## 架构模式

### 分层架构

#### 前端分层

```
┌─────────────────────────────────────┐
│      Presentation Layer              │
│  (Pages, Components, Hooks)          │
├─────────────────────────────────────┤
│      Business Logic Layer           │
│  (Services, Utils, Validators)       │
├─────────────────────────────────────┤
│      Data Access Layer              │
│  (API Client, State Management)      │
└─────────────────────────────────────┘
```

**示例**:
```typescript
// ❌ 错误：混合层次
function UserList() {
  // 直接调用 API
  const [users, setUsers] = useState([])
  useEffect(() => {
    fetch('/api/users').then(r => r.json()).then(setUsers)
  }, [])
}

// ✅ 正确：分离层次
// data layer
function useUsers() {
  return useQuery({
    queryKey: ['users'],
    queryFn: () => api.get('/api/users'),
  })
}

// presentation layer
function UserList() {
  const { data: users, isLoading } = useUsers()
  // ...
}
```

#### 后端分层

```
┌─────────────────────────────────────┐
│         API Layer                   │
│  (Routes, Controllers, Handlers)     │
├─────────────────────────────────────┤
│       Service Layer                 │
│  (Business Logic, Validation)        │
├─────────────────────────────────────┤
│       Data Layer                    │
│  (Repositories, Database Access)     │
└─────────────────────────────────────┘
```

**示例**:
```rust
// routes/api.rs
pub async fn create_user(
    State(pool): State<PgPool>,
    Json(req): Json<CreateUserRequest>,
) -> Result<Json<User>, AppError> {
    // 调用 service 层
    let user = services::create_user(&pool, req).await?;
    Ok(Json(user))
}

// services/user.rs
pub async fn create_user(pool: &PgPool, req: CreateUserRequest) -> Result<User> {
    // 验证
    req.validate()?;

    // 业务逻辑
    let user = repositories::create_user(pool, req).await?;

    Ok(user)
}
```

---

### 依赖注入

#### TypeScript 依赖注入

```typescript
// ✅ 使用依赖注入
interface UserRepository {
  findById(id: string): Promise<User | null>
}

class UserService {
  constructor(private userRepo: UserRepository) {}

  async getUser(id: string) {
    return this.userRepo.findById(id)
  }
}

// 测试时可以注入 mock
const mockRepo: UserRepository = {
  findById: async (id) => ({ id, name: 'Test' }),
}
const service = new UserService(mockRepo)
```

#### Rust 依赖注入

```rust
// ✅ 使用 trait 和依赖注入
#[async_trait]
pub trait UserRepository {
    async fn find_by_id(&self, id: Uuid) -> Result<Option<User>>;
}

pub struct UserService<R: UserRepository> {
    repo: R,
}

impl<R: UserRepository> UserService<R> {
    pub async fn get_user(&self, id: Uuid) -> Result<User> {
        if let Some(user) = self.repo.find_by_id(id).await? {
            Ok(user)
        } else {
            Err(anyhow!("User not found"))
        }
    }
}
```

---

### 错误处理

#### 统一错误处理

```typescript
// utils/errors.ts
export class AppError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500
  ) {
    super(message)
    this.name = 'AppError'
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string) {
    super(`${resource} not found`, 'NOT_FOUND', 404)
  }
}

// 使用
if (!user) {
  throw new NotFoundError('User')
}
```

```rust
// error.rs
use thiserror::Error;

#[derive(Error, Debug)]
pub enum AppError {
    #[error("Database error: {0}")]
    Database(#[from] sqlx::Error),

    #[error("User not found")]
    UserNotFound,

    #[error("Unauthorized: {0}")]
    Unauthorized(String),
}

// 使用
pub async fn get_user(pool: &PgPool, id: Uuid) -> Result<User, AppError> {
    let user = sqlx::query_as::<_, User>("SELECT * FROM users WHERE id = $1")
        .bind(id)
        .fetch_optional(pool)
        .await?;

    user.ok_or(AppError::UserNotFound)
}
```

---

## 测试实践

### TDD/BDD

#### 测试驱动开发流程

1. **红**: 写一个失败的测试
2. **绿**: 写最少的代码使测试通过
3. **重构**: 改进代码质量

#### 示例

```typescript
// 1. 先写测试
describe('UserValidator', () => {
  it('should validate email format', () => {
    const result = validateEmail('invalid-email')
    expect(result.isValid).toBe(false)
  })
})

// 2. 实现功能
function validateEmail(email: string) {
  return {
    isValid: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email),
  }
}

// 3. 重构（如果需要）
```

---

### 测试覆盖率

#### 目标覆盖率

| 层级 | 目标 |
|------|------|
| 单元测试 | > 80% |
| 集成测试 | 关键流程 100% |
| E2E 测试 | 主要用户路径 100% |

#### 生成覆盖率报告

```bash
# TypeScript
pnpm test:coverage

# Rust
cargo tarpaulin --out Html
```

---

### Mock 策略

```typescript
// ✅ Mock 外部依赖
vi.mock('@/lib/api', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
  },
}))

// 在测试中使用
import { api } from '@/lib/api'

api.get.mockResolvedValue({ data: [] })
```

```rust
// ✅ 使用 mockall 进行 mock
#[mockall::automock]
trait UserRepository {
    async fn find_by_id(&self, id: Uuid) -> Result<Option<User>>;
}

#[cfg(test)]
mod tests {
    use super::*;
    use mockall::predicate::*;

    #[tokio::test]
    async fn test_get_user() {
        let mut mock_repo = MockUserRepository::new();
        mock_repo
            .expect_find_by_id()
            .with(eq(user_id))
            .returning(|_| Ok(Some(user.clone())));

        let service = UserService::new(mock_repo);
        let result = service.get_user(user_id).await.unwrap();
        assert_eq!(result.id, user_id);
    }
}
```

---

## Git 工作流

### 分支策略

```
main (生产)
  ↑
develop (开发)
  ↑
feature/user-auth (功能分支)
feature/refine-integration (功能分支)
hotfix/security-fix (热修复)
```

#### 分支命名

- `feature/feature-name` - 新功能
- `bugfix/bug-name` - Bug 修复
- `hotfix/critical-issue` - 紧急修复
- `refactor/component-name` - 重构
- `docs/documentation-name` - 文档更新

---

### Commit 规范

#### Commit Message 格式

```
<type>(<scope>): <subject>

<body>

<footer>
```

#### Type 类型

- `feat`: 新功能
- `fix`: Bug 修复
- `docs`: 文档更新
- `style`: 代码格式（不影响功能）
- `refactor`: 重构
- `perf`: 性能优化
- `test`: 测试相关
- `chore`: 构建/工具相关

#### 示例

```bash
# ✅ 好的 commit message
feat(auth): add refresh token rotation

- Implement token family tracking
- Revoke old tokens on login
- Add unit tests for rotation logic

Closes #123

# ❌ 差的 commit message
update code
fix bug
```

---

### Code Review

#### Review 清单

**功能**:
- [ ] 代码实现符合需求
- [ ] 边界情况已处理
- [ ] 错误处理完善

**代码质量**:
- [ ] 代码可读性好
- [ ] 遵循项目规范
- [ ] 无重复代码
- [ ] 命名清晰

**测试**:
- [ ] 有足够的测试覆盖
- [ ] 测试通过
- [ ] 包含集成测试

**文档**:
- [ ] 代码有必要的注释
- [ ] 文档已更新
- [ ] 变更日志已更新

---

## 文档规范

### 代码文档

#### README 标准

每个目录和重要模块应包含 README.md：

```markdown
# Module Name

## 功能
简要说明模块功能

## 使用方法
示例代码

## API 文档
详细的 API 说明

## 注意事项
重要的使用注意点
```

---

### API 文档

#### OpenAPI 规范

```yaml
openapi: 3.0.0
info:
  title: Blog API
  version: 1.0.0

paths:
  /users:
    get:
      summary: Get all users
      responses:
        '200':
          description: Successful response
          content:
            application/json:
              schema:
                type: array
                items:
                  $ref: '#/components/schemas/User'
```

---

### 变更日志

#### Keep a Changelog 格式

```markdown
# Changelog

## [1.8.0] - 2025-12-27

### Added
- Refine 框架集成
- 用户管理功能

### Changed
- 升级 Next.js 到 16

### Fixed
- Token 刷新逻辑 bug

### Security
- 更新依赖版本
```

---

## 性能优化

### 前端优化

#### 代码分割

```typescript
// ✅ 路由级代码分割
const Dashboard = dynamic(() => import('./Dashboard'))

// ✅ 组件级代码分割
const HeavyComponent = dynamic(() => import('./HeavyComponent'), {
  loading: () => <Spinner />,
})
```

#### 懒加载

```typescript
// ✅ 图片懒加载
import Image from 'next/image'

<Image
  src="/photo.jpg"
  width={500}
  height={300}
  loading="lazy"
/>
```

---

### 后端优化

#### 数据库优化

```sql
-- ✅ 添加索引
CREATE INDEX idx_users_email ON users(email);

-- ✅ 优化查询
SELECT id, name FROM users WHERE email = $1;
-- 而不是
SELECT * FROM users WHERE email = $1;
```

#### 连接池配置

```rust
let pool = PgPoolOptions::new()
    .max_connections(20)
    .min_connections(5)
    .acquire_timeout(Duration::from_secs(30))
    .idle_timeout(Duration::from_secs(600))
    .max_lifetime(Duration::from_secs(1800))
    .connect(&database_url)
    .await?;
```

---

## 安全实践

### 密码处理

```rust
// ✅ 使用 Argon2
use argon2::{Argon2, PasswordHash, PasswordHasher, PasswordVerifier};

let hash = hash_password(password)?;
let is_valid = verify_password(password, &hash)?;
```

### 输入验证

```typescript
// ✅ 使用 validator 库
import { validator, isEmail, isLength } from 'validator'

const email = 'user@example.com'
if (!isEmail(email)) {
  throw new Error('Invalid email')
}
```

### SQL 注入防护

```rust
// ✅ 使用参数化查询
sqlx::query_as::<_, User>("SELECT * FROM users WHERE email = $1")
    .bind(email)
    .fetch_optional(pool)
    .await?;
```

---

## 相关文档

- [Frontend Overview](./frontend/overview.md) - 前端架构
- [Backend Overview](./backend/overview.md) - 后端架构
- [Security Guide](./operations/security-guide.md) - 安全指南
- [Testing Guide](./frontend/testing.md) - 测试指南

---

**最后更新**: 2025-12-27
**维护者**: Development Team

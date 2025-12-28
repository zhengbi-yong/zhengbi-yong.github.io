# 代码风格指南

本文档定义了项目中使用的代码风格和最佳实践。

## Rust 代码风格

### 命名规范

遵循 [Rust API 命名指南](https://rust-lang.github.io/api-guidelines/naming.html):

| 类型 | 约定 | 示例 |
|------|------|------|
| 结构体 | `PascalCase` | `UserService`, `ApiResponse` |
| 枚举 | `PascalCase` | `UserRole`, `AuthError` |
| 函数/方法 | `snake_case` | `get_user`, `create_post` |
| 变量 | `snake_case` | `user_id`, `post_count` |
| 常量 | `SCREAMING_SNAKE_CASE` | `MAX_RETRIES`, `DEFAULT_TIMEOUT` |
| 静态变量 | `SCREAMING_SNAKE_CASE` | `CONFIG`, `DATABASE_URL` |
| 类型参数 | 简短大写 | `T`, `U`, `E` |
| 生命周期参数 | 短小写 | `'a`, `'b` |
| 模块 | `snake_case` | `auth`, `api_routes` |

### 错误处理

**基本原则**:
- 避免使用 `.unwrap()`, `.expect()` 在生产代码中
- 使用 `?` 操作符传播错误
- 为公共API提供有意义的错误信息
- 使用 `thiserror` 或 `anyhow` 简化错误处理

```rust
// ✅ 好 - 使用 ? 操作符
pub fn get_user(id: Uuid) -> Result<User, AppError> {
    let user = db::find_user(id)?
        .ok_or(AppError::UserNotFound { id })?;
    Ok(user)
}

// ❌ 差 - 使用 unwrap()
pub fn get_user(id: Uuid) -> User {
    db::find_user(id).unwrap()
}

// ✅ 好 - 自定义错误类型
#[derive(Debug, thiserror::Error)]
pub enum AuthError {
    #[error("Invalid credentials")]
    InvalidCredentials,
    #[error("User not found: {0}")]
    UserNotFound(String),
}

// ✅ 好 - 提供上下文
let token = generate_token()
    .map_err(|e| {
        tracing::error!("Token generation failed: {:?}", e);
        AppError::InternalError
    })?;
```

### 文档注释

**公共API必须包含文档注释**:
```rust
/// 用户认证服务
///
/// 提供用户注册、登录、token管理等功能。
///
/// # Examples
///
/// ```
/// use blog_core::AuthService;
///
/// let auth = AuthService::new("secret".to_string());
/// let token = auth.login("user@example.com", "password")?;
/// # Ok::<(), Box<dyn std::error::Error>>(())
/// ```
///
/// # Errors
///
/// 如果凭证无效，返回 [`AuthError::InvalidCredentials`]
pub struct AuthService {
    secret: String,
}

impl AuthService {
    /// 使用给定的密钥创建新的认证服务
    ///
    /// # Arguments
    ///
    /// * `secret` - 用于签名JWT的密钥
    pub fn new(secret: String) -> Self {
        Self { secret }
    }
}
```

### 代码组织

**文件结构**:
```rust
// 1. 导入（标准库、第三方、本地模块）
use std::collections::HashMap;
use axum::Json;
use blog_shared::AppError;

// 2. 常量
const MAX_RETRIES: u32 = 3;

// 3. 类型定义
type Result<T> = std::result::Result<T, AppError>;

// 4. 结构体和枚举
pub struct UserService { /* ... */ }

// 5. trait 实现
impl UserService { /* ... */ }

// 6. 函数
pub async fn get_user(id: Uuid) -> Result<User> { /* ... */ }

// 7. 测试
#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_user_creation() { /* ... */ }
}
```

### 异步代码

**使用 `async/await`**:
```rust
// ✅ 好
pub async fn fetch_user(id: Uuid) -> Result<User> {
    sqlx::query_as!("SELECT * FROM users WHERE id = $1", id)
        .fetch_one(&pool)
        .await
        .map_err(AppError::from)
}

// ❌ 差 - 不必要的阻塞
pub fn fetch_user(id: Uuid) -> Result<User> {
    let user = tokio::runtime::Handle::current()
        .block_on(async {
            sqlx::query_as!("SELECT * FROM users WHERE id = $1", id)
                .fetch_one(&pool)
                .await
        })?;
    Ok(user)
}
```

### 性能考虑

```rust
// ✅ 好 - 使用引用避免克隆
pub fn process_posts(posts: &[Post]) -> Vec<PostDto> {
    posts.iter()
        .map(|post| PostDto::from(post))
        .collect()
}

// ❌ 差 - 不必要的克隆
pub fn process_posts(posts: Vec<Post>) -> Vec<PostDto> {
    posts.into_iter()
        .map(|post| PostDto::from(post))
        .collect()
}

// ✅ 好 - 使用 Cow 避免分配
use std::borrow::Cow;

pub fn sanitize(input: Cow<str>) -> Cow<str> {
    if input.contains('<') {
        Cow::Owned(input.replace('<', "&lt;"))
    } else {
        input
    }
}
```

## TypeScript 代码风格

### 命名规范

| 类型 | 约定 | 示例 |
|------|------|------|
| 组件 | `PascalCase` | `UserProfile`, `CommentList` |
| 类型/接口 | `PascalCase` | `User`, `ApiResponse` |
| 枚举 | `PascalCase` | `UserRole`, `AuthStatus` |
| 函数/方法 | `camelCase` | `getUser`, `createPost` |
| 变量 | `camelCase` | `userId`, `postCount` |
| 常量 | `UPPER_SNAKE_CASE` | `MAX_RETRIES`, `API_URL` |
| 布尔值 | `is/has/should` 前缀 | `isLoading`, `hasPermission` |

### 类型定义

```typescript
// ✅ 好 - 明确的类型定义
interface User {
  id: string
  username: string
  email: string
  role: UserRole
  createdAt: Date
}

interface ApiResponse<T> {
  data: T
  status: number
  message: string
}

// ✅ 好 - 使用枚举
enum UserRole {
  Admin = 'admin',
  User = 'user',
  Guest = 'guest',
}

// ❌ 差 - 使用 any
function processData(data: any) {
  return data.value
}

// ✅ 好 - 使用泛型
function processData<T extends { value: unknown }>(data: T): T['value'] {
  return data.value as T['value']
}
```

### React 组件

```typescript
// ✅ 好 - 函数组件 + Props 类型
interface ButtonProps {
  label: string
  onClick: () => void
  variant?: 'primary' | 'secondary' | 'danger'
  disabled?: boolean
}

export function Button({
  label,
  onClick,
  variant = 'primary',
  disabled = false,
}: ButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn('btn', `btn-${variant}`)}
    >
      {label}
    </button>
  )
}

// ✅ 好 - 使用自定义 Hooks
function useUser() {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    fetchUser().then(setUser)
  }, [])

  return { user, isLoading }
}

// ✅ 好 - 避免过度 useEffect
// ❌ 差 - 不必要的 useEffect
function BadComponent({ count }: { count: number }) {
  const [doubled, setDoubled] = useState(0)

  useEffect(() => {
    setDoubled(count * 2)
  }, [count])

  return <div>{doubled}</div>
}

// ✅ 好 - 直接计算
function GoodComponent({ count }: { count: number }) {
  const doubled = count * 2
  return <div>{doubled}</div>
}
```

### 异步代码

```typescript
// ✅ 好 - 使用 async/await
async function fetchUser(id: string): Promise<User> {
  const response = await fetch(`/api/users/${id}`)
  if (!response.ok) {
    throw new Error('Failed to fetch user')
  }
  return response.json()
}

// ✅ 好 - 错误处理
try {
  const user = await fetchUser(userId)
  logger.log('User fetched:', user)
} catch (error) {
  logger.error('Failed to fetch user', error)
  throw error
}

// ❌ 差 - 忽略错误
fetchUser(userId).then(user => {
  console.log(user)
})
```

### 日志和调试

```typescript
// ✅ 好 - 使用统一的 logger
import { logger } from '@/lib/utils/logger'

function processUser(user: User) {
  logger.log('Processing user:', user.id)
  // ...
}

// ❌ 差 - 使用 console
function processUser(user: User) {
  console.log('Processing user:', user.id)
  // ...
}

// ✅ 好 - 条件日志
if (process.env.NODE_ENV === 'development') {
  logger.debug('Debug info:', data)
}

// ✅ 好 - 性能监控
const startTime = performance.now()
await processLargeData()
const duration = performance.now() - startTime
logger.performance('processLargeData', duration)
```

## Markdown 文档风格

### 标题层级

```markdown
# 一级标题 - 文档标题

## 二级标题 - 主要章节

### 三级标题 - 子章节

#### 四级标题 - 细节说明

避免使用五级及以下标题，考虑拆分文档
```

### 代码块

```markdown
// 指定语言以启用语法高亮
\```rust
fn hello() {
    println!("Hello, World!");
}
\```

\```typescript
function hello() {
    console.log('Hello, World!');
}
\```

// 可执行的代码示例
\```rust
# fn main() {
let x = 5;
assert_eq!(x, 5);
# }
\```
```

### 列表

```markdown
// 无序列表
- 项目 1
- 项目 2
  - 嵌套项目 2.1
  - 嵌套项目 2.2

// 有序列表
1. 第一步
2. 第二步
3. 第三步

// 任务列表
- [x] 已完成的任务
- [ ] 未完成的任务
```

### 链接和引用

```markdown
// 内部链接
参见 [API 文档](./api-reference.md)

// 外部链接
更多信息请参考 [Rust 官方文档](https://doc.rust-lang.org/)

// 引用
> 这是一个引用块
> 可以跨越多行
```

## 代码格式化工具

### Rust

```bash
# 格式化代码
cargo fmt

# 检查格式
cargo fmt --check

# 代码检查
cargo clippy -- -D warnings
```

### TypeScript

```bash
# 格式化和 Lint
pnpm lint

# 自动修复
pnpm lint:fix

# 类型检查
pnpm type-check
```

## 最佳实践总结

### 通用原则

1. **可读性优先**: 代码应该易于理解，优先于简洁性
2. **一致性**: 遵循项目既定的模式和约定
3. **类型安全**: 利用类型系统防止错误
4. **错误处理**: 不要忽略错误，提供有意义的错误信息
5. **测试**: 为关键逻辑编写测试
6. **文档**: 为公共API编写文档注释

### 代码审查清单

- [ ] 代码遵循命名规范
- [ ] 没有使用 `unwrap()` 或 `expect()`（生产代码）
- [ ] 没有使用 `console` 调用
- [ ] 错误被正确处理和传播
- [ ] 公共API有文档注释
- [ ] 代码通过 `cargo clippy` / `pnpm lint`
- [ ] 测试覆盖关键逻辑
- [ ] 没有硬编码的密钥或敏感信息

---

遵循这些风格指南将帮助保持代码库的一致性和可维护性。

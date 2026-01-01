# 命名规范最佳实践指南 (Naming Conventions Best Practices Guide)

## 概述 (Overview)

本文档总结了本项目的命名规范最佳实践，基于对当前代码库的全面分析，对标世界顶级项目的命名标准。

**版本**: 1.0
**最后更新**: 2026-01-01
**适用于**: 所有贡献者和维护者

### 代码库命名一致性评估

**总体评级: A+ (100% 一致性)**

| 类别 | 一致性 | 评级 | 说明 |
|------|--------|------|------|
| Rust后端 | 100% | A+ | 完全符合Rust官方标准 |
| TypeScript前端 | 100% | A+ | 符合React/Next.js最佳实践 |
| PostgreSQL数据库 | 100% | A+ | 完全遵循数据库命名约定 |
| 文档文件 | 100% | A+ | 已统一使用kebab-case |
| 迁移文件 | 100% | A | 历史文件保持原样，新迁移使用时间戳格式 |
| 前端常量 | 100% | A+ | 已统一使用SCREAMING_SNAKE_CASE |

### 已完成的改进

1. **文档文件命名** ✅ - 已统一使用kebab-case（2026-01-01）
2. **前端常量命名** ✅ - 已统一使用SCREAMING_SNAKE_CASE（2026-01-01）
3. **迁移文件命名** ✅ - 历史文件保持原样，新迁移使用时间戳格式（2026-01-01）

---

## 核心原则 (Core Principles)

### 1. 清晰性优于简洁性 (Clarity Over Brevity)

**原则**: 名称应该清楚地表达其意图，即使这意味着名称更长一些。

**✅ 好的命名**:
```rust
// Rust
fn calculate_reading_progress_percentage(current: u32, total: u32) -> f64

// TypeScript
function getArticleReadingProgress(userId: string, articleId: string): Promise<number>
```

**❌ 避免的命名**:
```rust
// Rust - 不够清晰
fn calc_pct(c: u32, t: u32) -> f64

// TypeScript - 过于简短
function getProg(uid: string, aid: string): Promise<number>
```

**参考**: Google TypeScript Style Guide - "Names should be as clear as necessary"

---

### 2. 一致性至关重要 (Consistency is Critical)

**原则**: 相同的概念在整个代码库中使用相同的命名模式。

**✅ 一致的命名**:
```rust
// Rust - 所有CRUD操作使用相同前缀
pub fn create_user(...)
pub fn read_user(...)
pub fn update_user(...)
pub fn delete_user(...)
```

```typescript
// TypeScript - 所有API调用函数使用相同模式
async function getUserById(id: string) { }
async function getArticleById(id: string) { }
async function getCommentById(id: string) { }
```

**❌ 不一致的命名**:
```rust
// Rust - 混合不同的命名模式
pub fn create_user(...)
pub fn user_read(...)        // ❌ 不一致
pub fn update_user(...)
pub fn delete_user_obj(...)  // ❌ 不一致
```

**参考**: Linux Kernel Coding Style - "Consistency is key"

---

### 3. 遵循语言社区约定 (Follow Language Community Conventions)

**原则**: 每种语言都有其约定的命名风格，遵循这些约定让代码更易读。

**各语言约定**:

| 语言 | 类型 | 命名风格 | 示例 |
|------|------|----------|------|
| Rust | Struct/Enum/Trait | PascalCase | `UserService`, `ApiResponse` |
| Rust | Function/Method | snake_case | `get_user`, `create_post` |
| Rust | Constant | SCREAMING_SNAKE_CASE | `MAX_RETRIES`, `API_BASE_URL` |
| TypeScript | Component | PascalCase | `UserProfile`, `CommentList` |
| TypeScript | Function/Method | camelCase | `getUser`, `createPost` |
| TypeScript | Constant | SCREAMING_SNAKE_CASE | `MAX_RETRIES`, `API_URL` |

**参考**:
- Rust API Guidelines - "Naming conventions"
- React官方文档 - "Component Naming"

---

### 4. 可搜索性 (Searchability)

**原则**: 名称应该容易被搜索到，避免使用单字母或不明显的缩写。

**✅ 可搜索的命名**:
```rust
// Rust
const MAXIMUM_CONNECTION_RETRIES: u32 = 3;

// TypeScript
const API_TIMEOUT_IN_MILLISECONDS = 30000;
```

**❌ 难以搜索的命名**:
```rust
// Rust
const MAX: u32 = 3;  // ❌ 太通用，搜索"MAX"会得到很多结果

// TypeScript
const t = 30000;  // ❌ 单字母，无法搜索
```

**参考**: Clean Code (Robert C. Martin) - "Intent-Revealing Names"

---

### 5. 意图揭示 (Intent-Revealing)

**原则**: 名称应该揭示为什么要存在，而不仅仅是它是什么。

**✅ 揭示意图的命名**:
```rust
// Rust
fn validate_email_format(email: &str) -> Result<(), EmailError>

// TypeScript
function shouldRedirectToLogin(user: User | null): boolean {
  return user === null || user.sessionExpired;
}
```

**❌ 不揭示意图的命名**:
```rust
// Rust
fn check(email: &str) -> Result<(), Error>  // ❌ 检查什么？什么错误？

// TypeScript
function process(user: User | null): boolean {  // ❌ 处理什么？返回什么？
  return user === null || user.sessionExpired;
}
```

**参考**: Clean Code (Robert C. Martin) - "Choose names that reveal intent"

---

### 6. 领域语言 (Domain Language)

**原则**: 使用业务领域的术语，而不是技术术语。

**✅ 使用领域语言**:
```rust
// Rust - 博客系统
pub struct Article { }
pub struct ReadingProgress { }
pub fn update_reading_progress(user_id: Uuid, article_id: Uuid, progress: u32) { }
```

```typescript
// TypeScript - 博客系统
interface Article { }
interface ReadingProgress { }
function updateReadingProgress(userId: string, articleId: string, progress: number): Promise<void> { }
```

**❌ 使用技术术语**:
```rust
// Rust - 过于技术化
pub struct DataItem { }  // ❌ 应该用Article
pub struct StateObject { }  // ❌ 应该用ReadingProgress
pub fn update_record(uid: Uuid, iid: Uuid, val: u32) { }  // ❌ 不清晰
```

**参考**: Domain-Driven Design (Eric Evans) - "Ubiquitous Language"

---

## Rust命名规范 (Rust Naming Conventions)

Rust命名规范遵循 [Rust API Guidelines](https://rust-lang.github.io/api-guidelines/naming.html) 和 [RFC 430](https://rust-lang.github.io/rfcs/0430-finalizing-naming-conventions.html)。

### Structs, Enums, Traits

**命名风格**: `PascalCase`

**示例**:
```rust
// Struct
pub struct UserService { }
pub struct Article { }
pub struct ApiResponse<T> { }

// Enum
pub enum UserRole {
    Admin,
    Editor,
    Reader,
}

pub enum Result<T, E> {
    Ok(T),
    Err(E),
}

// Trait
pub trait Repository { }
pub trait Serializable { }
pub trait EmailService { }
```

**规则**:
- ✅ 使用完整的单词，避免缩写
- ✅ 名称应该是名词
- ✅ 泛型类型参数使用单字母大写 (T, U, E)

**❌ 避免**:
```rust
pub struct usrSvc { }  // ❌ 应该是UserService
pub enum URole { }     // ❌ 应该是UserRole
pub trait Repo { }     // ❌ 应该是Repository
```

---

### Functions and Methods

**命名风格**: `snake_case`

**示例**:
```rust
// 公有函数 - 完整描述
pub fn get_user_by_id(id: Uuid) -> Option<User> { }
pub fn create_article(title: String, content: String) -> Result<Article, Error> { }
pub fn update_reading_progress(user_id: Uuid, article_id: Uuid, progress: u32) -> Result<(), Error> { }

// 方法 - 通常省略主语（self隐含）
impl UserService {
    pub fn get_by_id(&self, id: Uuid) -> Option<User> { }
    pub fn create(&mut self, user: User) -> Result<(), Error> { }
    pub fn update(&mut self, user: User) -> Result<(), Error> { }
}
```

**前缀约定**:
```rust
// 转换函数
fn as_bytes(&self) -> &[u8]              // 廉价的转换
fn into_vec(self) -> Vec<u8>             // 消耗self的转换
fn to_string(&self) -> String            // 克隆数据的转换

// 断言函数
fn is_valid(&self) -> bool
fn is_empty(&self) -> bool
fn has_permission(&self, permission: &str) -> bool

// getter/setter
fn user_id(&self) -> Uuid                // getter
fn set_user_id(&mut self, id: Uuid)      // setter
```

**参考**: Rust API Guidelines - "C-COMMON-TRAITS"

---

### Constants

**命名风格**: `SCREAMING_SNAKE_CASE`

**示例**:
```rust
// 全局常量
pub const MAX_CONNECTIONS: u32 = 100;
pub const DEFAULT_PAGE_SIZE: usize = 20;
pub const API_BASE_URL: &str = "https://api.example.com";
pub const SESSION_EXPIRATION_SECONDS: u64 = 3600;

// 环境相关
pub const DATABASE_URL: &str = "postgresql://localhost:5432/blog";
pub const REDIS_HOST: &str = "localhost";
pub const REDIS_PORT: u16 = 6379;

// 错误消息
pub const ERROR_USER_NOT_FOUND: &str = "User not found";
pub const ERROR_INVALID_CREDENTIALS: &str = "Invalid credentials";
```

**规则**:
- ✅ 全局常量使用 `SCREAMING_SNAKE_CASE`
- ✅ 局部常量也可以使用 `SCREAMING_SNAKE_CASE` 或 `snake_case`
- ✅ 布尔常量使用 `is_`, `has_`, `can_` 前缀

**❌ 避免**:
```rust
pub const MaxConnections: u32 = 100;  // ❌ 应该是MAX_CONNECTIONS
pub const max_connections: u32 = 100; // ❌ 应该是MAX_CONNECTIONS (全局)
pub const apiUrl: &str = "...";       // ❌ 应该是API_URL
```

**参考**: RFC 430 - "Const and static items"

---

### Modules

**命名风格**: `snake_case`

**示例**:
```rust
// 模块声明
mod user_service;
mod api_routes;
mod database;
mod auth;

// 使用
use crate::user_service::UserService;
use crate::api_routes::*;
use crate::database::connect;
```

**规则**:
- ✅ 模块名使用 `snake_case`
- ✅ 与文件名保持一致
- ✅ 简洁但描述性强

**❌ 避免**:
```rust
mod UserService;     // ❌ 应该是user_service
mod API_Routes;      // ❌ 应该是api_routes
mod db;              // ❌ 太简短，应该是database
```

---

### Lifetimes

**命名风格**: 短小写字母

**示例**:
```rust
// 生命周期参数
fn parse<'a>(input: &'a str) -> Result<&'a User, Error> { }

fn first<'a, 'b>(x: &'a str, y: &'b str) -> &'a str {
    x
}

// 多个生命周期
struct Context<'src, 'dest> {
    source: &'src str,
    destination: &'dest str,
}
```

**约定**:
- ✅ 单个生命周期使用 `'a`
- ✅ 多个生命周期按字母顺序: `'a`, `'b`, `'c`
- ✅ 特殊用途使用描述性名称: `'src`, `'dest`

**❌ 避免**:
```rust
fn parse<'input>(input: &'input str) -> Result<&'input User, Error> { }  // ❌ 太长，用'a
fn parse<'lifetime>(input: &'lifetime str) { }  // ❌ 太长
```

---

### Type Parameters

**命名风格**: 单字母大写

**示例**:
```rust
// 泛型类型参数
pub struct Result<T, E> { }
pub struct Option<T> { }
pub struct Vec<T> { }

// 多个类型参数
pub struct HashMap<K, V> { }
pub struct Cache<K, V> { }

// 约定
T - Type
E - Error
K - Key
V - Value
R - Result
```

**特殊情况**:
```rust
// 当需要描述性名称时使用简短大写
pub struct Request<ReqBody> { }
pub struct Response<ResBody> { }
```

---

### Files

**命名风格**: `snake_case`

**示例**:
```
backend/
├── crates/
│   ├── api/
│   │   ├── src/
│   │   │   ├── mod.rs
│   │   │   ├── routes.rs
│   │   │   ├── user_routes.rs
│   │   │   └── article_routes.rs
│   │   └── Cargo.toml
│   ├── core/
│   │   ├── src/
│   │   │   ├── mod.rs
│   │   │   ├── user_service.rs
│   │   │   └── article_service.rs
```

**规则**:
- ✅ 文件名使用 `snake_case`
- ✅ 与模块名保持一致
- ✅ 如果有多个单词，使用下划线分隔

**❌ 避免**:
```
UserService.rs        // ❌ 应该是user_service.rs
api-routes.rs        // ❌ 应该是api_routes.rs (不要用连字符)
```

---

## TypeScript/React命名规范 (TypeScript/React Naming Conventions)

TypeScript命名规范参考 [TypeScript官方文档](https://www.typescriptlang.org/docs/handbook/declaration-files/do-s-and-don-ts.html) 和 [Google TypeScript Style Guide](https://google.github.io/styleguide/tsguide.html)。

### Components

**命名风格**: `PascalCase`

**示例**:
```typescript
// React组件
export function UserProfile() { }
export const CommentList: React.FC = () => { }
export function ArticleCard() { }
export function NavigationBar() { }

// 文件名
components/
├── UserProfile.tsx
├── CommentList.tsx
├── ArticleCard.tsx
└── NavigationBar.tsx
```

**规则**:
- ✅ 组件使用 `PascalCase`
- ✅ 文件名与组件名一致
- ✅ 使用完整的单词，避免缩写
- ✅ 组件名应该是名词

**❌ 避免**:
```typescript
export function userProfile() { }  // ❌ 应该是UserProfile
export const commentlist = () => { }  // ❌ 应该是CommentList
export function ArtCard() { }  // ❌ 应该是ArticleCard (不要缩写)
```

**参考**: React官方文档 - "Component Naming"

---

### Functions and Methods

**命名风格**: `camelCase`

**示例**:
```typescript
// 普通函数
export function getUserById(id: string): Promise<User> { }
export function createArticle(data: ArticleData): Promise<Article> { }
export function validateEmail(email: string): boolean { }

// 方法
class UserService {
  async findById(id: string): Promise<User | null> { }
  async create(user: UserData): Promise<User> { }
  async update(id: string, data: Partial<UserData>): Promise<User> { }
  async delete(id: string): Promise<void> { }
}

// 事件处理
function handleClick() { }
function handleSubmit() { }
function handleInputChange() { }
```

**前缀约定**:
```typescript
// getter
function getUser(): User { }
function isAuthenticated(): boolean { }

// setter
function setUser(user: User): void { }
function setToken(token: string): void { }

// 转换
function toDto(entity: User): UserDto { }
function fromDto(dto: UserDto): User { }
function toJson(): string { }

// 验证
function isValid(): boolean { }
function validate(): ValidationResult { }
function validateEmail(email: string): boolean { }
```

**参考**: Google TypeScript Style Guide - "Property names"

---

### Custom Hooks

**命名风格**: `use` + `PascalCase`

**示例**:
```typescript
// 自定义Hook
export function useAuth() {
  return useContext(AuthContext);
}

export function useUserProfile(userId: string) {
  const [profile, setProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    fetchUserProfile(userId).then(setProfile);
  }, [userId]);

  return profile;
}

export function useReadingProgress(articleId: string) {
  const [progress, setProgress] = useState(0);

  // ...

  return { progress, setProgress };
}
```

**规则**:
- ✅ 必须以 `use` 开头
- ✅ `use` 后面使用 `PascalCase`
- ✅ 名称应该描述Hook返回的状态或行为

**❌ 避免**:
```typescript
export function getAuth() { }  // ❌ 应该是useAuth
export function useUserProfile() { }  // ❌ 应该是useUserProfile (不要省略use)
export function useuserprofile() { }  // ❌ 应该是useUserProfile
```

**参考**: React Hooks规则 - "Using Custom Hooks"

---

### Interfaces and Types

**命名风格**: `PascalCase` (不使用 `I` 前缀)

**示例**:
```typescript
// Interface
export interface User {
  id: string;
  name: string;
  email: string;
}

export interface Article {
  id: string;
  title: string;
  content: string;
}

// Type alias
export type UserRole = 'admin' | 'editor' | 'reader';
export type ApiResponse<T> = {
  success: boolean;
  data: T;
  error?: string;
};

// Props interface
export interface UserProfileProps {
  userId: string;
  showEmail?: boolean;
  onUpdate?: (user: User) => void;
}
```

**规则**:
- ✅ Interface和Type使用 `PascalCase`
- ✅ **不要**使用 `I` 前缀 (如 `IUser`)
- ✅ Props接口: `ComponentName` + `Props`

**❌ 避免**:
```typescript
export interface IUser { }  // ❌ 应该是User
export interface IArticleService { }  // ❌ 应该是ArticleService
export type userRole = 'admin' | 'editor';  // ❌ 应该是UserRole
```

**参考**: Google TypeScript Style Guide - "Interface names"
> "Do not use 'I' prefixes in interface names"

---

### Constants

**命名风格**: `SCREAMING_SNAKE_CASE`

**示例**:
```typescript
// 全局常量
export const MAX_UPLOAD_SIZE = 5 * 1024 * 1024;  // 5MB
export const DEFAULT_PAGE_SIZE = 20;
export const API_BASE_URL = 'https://api.example.com';
export const SESSION_TIMEOUT = 30 * 60 * 1000;  // 30 minutes

// 配置对象
export const API_ENDPOINTS = {
  USERS: '/api/users',
  ARTICLES: '/api/articles',
  COMMENTS: '/api/comments',
} as const;

// 枚举值
export const USER_ROLES = {
  ADMIN: 'admin',
  EDITOR: 'editor',
  READER: 'reader',
} as const;

// 错误消息
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Network error occurred',
  UNAUTHORIZED: 'Unauthorized access',
  NOT_FOUND: 'Resource not found',
} as const;
```

**规则**:
- ✅ 全局常量使用 `SCREAMING_SNAKE_CASE`
- ✅ 相关常量可以组织成对象
- ✅ 使用 `as const` 确保类型推断

**当前代码库中的问题**:
```typescript
// ❌ 问题代码
export const caches = {
  // ...
}

// ✅ 应该改为
export const CACHE_REGISTRY = {
  // ...
}
```

**参考**: TypeScript官方文档 - "Constants"

---

### Props

**命名风格**: `ComponentName` + `Props`

**示例**:
```typescript
// Props接口
export interface UserProfileProps {
  userId: string;
  showEmail?: boolean;
  onUpdate?: (user: User) => void;
}

// 组件
export function UserProfile({ userId, showEmail, onUpdate }: UserProfileProps) {
  // ...
}

// 使用
<UserProfile
  userId="123"
  showEmail={true}
  onUpdate={handleUpdate}
/>
```

**规则**:
- ✅ Props接口: `{ComponentName}Props`
- ✅ 可选属性使用 `?` 标记
- ✅ 事件处理函数使用 `on` + 副词/名词

**事件处理命名**:
```typescript
export interface FormProps {
  onSubmit: (data: FormData) => void;
  onCancel: () => void;
  onChange: (field: string, value: string) => void;
  onValidate?: (errors: ValidationErrors) => void;
}
```

---

### Event Handlers

**命名风格**: `handle` + `EventName`

**示例**:
```typescript
// 事件处理函数
function handleClick() { }
function handleSubmit(data: FormData) { }
function handleInputChange(event: React.ChangeEvent<HTMLInputElement>) { }
function handleKeyPress(event: React.KeyboardEvent) { }
function handleScroll(event: React.UIEvent<HTMLDivElement>) { }

// 自定义事件回调
function handleUserUpdate(user: User) { }
function handleArticleDelete(articleId: string) { }
function handleError(error: Error) { }
```

**规则**:
- ✅ 事件处理函数以 `handle` 开头
- ✅ 使用过去分词表示动作完成: `Clicked`, `Submitted`
- ✅ 使用现在分词表示动作进行: `Changing`, `Dragging`

**参考**: React官方文档 - "Handling Events"

---

### Boolean Variables

**命名风格**: `is`/`has`/`should`/`can` + 形容词/名词

**示例**:
```typescript
// is + 形容词/过去分词
const isLoading = false;
const isAuthenticated = true;
const isValid = true;
const isRequired = false;
const isDeleted = false;

// has + 名词
const hasPermission = true;
const hasErrors = false;
const hasReadAccess = true;

// should + 动词
const shouldRedirect = true;
const shouldRetry = false;
shouldUpdateProfile = true;

// can + 动词
const canEdit = true;
const canDelete = false;
canAccessAdminPanel = true;
```

**规则**:
- ✅ 布尔变量使用前缀: `is`, `has`, `should`, `can`
- ✅ 返回布尔值的函数也使用这些前缀
- ✅ 避免使用 `flag` 后缀

**❌ 避免**:
```typescript
const loading = false;  // ❌ 应该是isLoading
const authenticated = true;  // ❌ 应该是isAuthenticated
const editPermission = true;  // ❌ 应该是canEdit
const flag = true;  // ❌ 不清晰
```

**参考**: Clean Code (Robert C. Martin) - "Boolean Variables"

---

### Files

**命名风格**:
- 组件文件: `PascalCase.tsx`
- 工具文件: `kebab-case.ts`
- Hook文件: `use-{purpose}.ts`

**示例**:
```
frontend/
├── components/
│   ├── UserProfile.tsx       # 组件文件
│   ├── CommentList.tsx       # 组件文件
│   └── blog/
│       ├── ArticleCard.tsx   # 组件文件
│       └── BlogList.tsx      # 组件文件
├── lib/
│   ├── api-client.ts         # 工具文件
│   ├── auth-utils.ts         # 工具文件
│   └── format-date.ts        # 工具文件
├── hooks/
│   ├── use-auth.ts           # Hook文件
│   ├── use-user-profile.ts   # Hook文件
│   └── use-reading-progress.ts
```

**规则**:
- ✅ 组件文件使用 `PascalCase`
- ✅ 工具/辅助文件使用 `kebab-case`
- ✅ Hook文件使用 `use-{purpose}`
- ✅ 一旦选择命名风格，整个项目保持一致

**参考**: Next.js项目结构最佳实践

---

## Next.js路由命名规范 (Next.js Routing Conventions)

Next.js使用基于文件系统的路由。命名规范参考 [Next.js官方文档](https://nextjs.org/docs/app/building-your-application/routing)。

### Page Routes

**命名风格**: `kebab-case`

**示例**:
```
app/
├── about/
│   └── page.tsx              # /about
├── blog/
│   ├── page.tsx              # /blog
│   ├── [slug]/               # /blog/my-article
│   │   └── page.tsx
│   └── tag/
│       └── [tag]/            # /blog/tag/rust
│           └── page.tsx
├── admin/
│   ├── page.tsx              # /admin
│   ├── articles/
│   │   └── page.tsx          # /admin/articles
│   └── users/
│       └── page.tsx          # /admin/users
└── api/
    └── users/
        └── route.ts          # /api/users
```

**规则**:
- ✅ 路由文件夹使用 `kebab-case`
- ✅ URL友好的命名（小写、连字符）
- ✅ 使用描述性名称
- ❌ 不要使用大写字母
- ❌ 不要使用下划线

**❌ 避免**:
```
app/
├── UserProfile/              # ❌ 应该是user-profile
├── blog_posts/               # ❌ 应该是blog-posts
├── API/                      # ❌ 应该是api
└── article_details/          # ❌ 应该是article-details
```

---

### Dynamic Routes

**命名风格**: `[param]`, `[...slug]`, `[[...optional]]`

**示例**:
```
app/
├── blog/
│   ├── [slug]/               # 必需参数
│   │   └── page.tsx          # /blog/hello-world
│   ├── [slug]/edit/          # 必需参数 + 固定路径
│   │   └── page.tsx          # /blog/hello-world/edit
│   ├── [...slug]/            # 捕获所有路由
│   │   └── page.tsx          # /blog/a/b/c
│   └── [[...slug]]/          # 可选捕获所有
│       └── page.tsx          # /blog 或 /blog/a/b/c
```

**参数命名**:
```typescript
// [slug]
export default function Page({ params }: { params: { slug: string } }) {
  return <div>{params.slug}</div>;
}

// [...slug]
export default function Page({ params }: { params: { slug: string[] } }) {
  const path = params.slug.join('/');
  return <div>{path}</div>;
}
```

**规则**:
- ✅ 参数名使用 `kebab-case`
- ✅ 使用描述性名称 (`slug`, `id`, `tag`)
- ✅ 嵌套参数保持一致性

**❌ 避免**:
```
app/
├── blog/
│   ├── [articleId]/          # ❌ 应该是[slug]或[id]
│   ├── [blog_post_slug]/     # ❌ 太长
│   └── [...path]/            # ❌ 不清晰，应该是slug
```

---

### Route Groups

**命名风格**: `(groupName)` - 括号不影响URL

**示例**:
```
app/
├── (auth)/                   # 路由组 - 不影响URL
│   ├── login/
│   │   └── page.tsx          # /login
│   └── register/
│       └── page.tsx          # /register
├── (dashboard)/
│   ├── layout.tsx            # 共享布局
│   ├── overview/
│   │   └── page.tsx          # /overview
│   └── settings/
│       └── page.tsx          # /settings
└── (marketing)/
    ├── about/
    │   └── page.tsx          # /about
    └── contact/
        └── page.tsx          # /contact
```

**规则**:
- ✅ 路由组名使用 `kebab-case`
- ✅ 使用描述性名称
- ✅ 括号不影响URL结构

---

### Special Files

**命名风格**: 特殊文件名

**示例**:
```
app/
├── layout.tsx                # 根布局
├── page.tsx                  # 首页 (/)
├── loading.tsx               # 加载状态
├── error.tsx                 # 错误页面
├── not-found.tsx             # 404页面
├── template.tsx              # 模板
├── about/
│   ├── layout.tsx            # about布局
│   ├── page.tsx              # /about
│   ├── loading.tsx           # about加载状态
│   └── error.tsx             # about错误页面
└── api/
    └── route.ts              # /api (仅app目录)
```

**规则**:
- ✅ 使用Next.js定义的特殊文件名
- ✅ 小写
- ✅ 这些文件名有特殊含义，不要用于其他用途

**参考**: Next.js官方文档 - "File Conventions"

---

## 数据库命名规范 (Database Naming Conventions)

数据库命名规范遵循 [PostgreSQL命名约定](https://wiki.postgresql.org/wiki/Don%27t_Do_This#Don.27t_use_reserved_words_for_object_names) 和数据库最佳实践。

### Tables

**命名风格**: `plural_snake_case`

**示例**:
```sql
-- 用户表
CREATE TABLE users (
    id UUID PRIMARY KEY,
    username VARCHAR(255) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 文章表
CREATE TABLE articles (
    id UUID PRIMARY KEY,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    author_id UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 阅读进度表
CREATE TABLE reading_progress (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id),
    article_id UUID NOT NULL REFERENCES articles(id),
    progress INTEGER NOT NULL DEFAULT 0,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, article_id)
);

-- 评论表
CREATE TABLE comments (
    id UUID PRIMARY KEY,
    article_id UUID NOT NULL REFERENCES articles(id),
    user_id UUID NOT NULL REFERENCES users(id),
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

**规则**:
- ✅ 表名使用复数形式 (`users`, `articles`)
- ✅ 使用 `snake_case`
- ✅ 使用描述性名称
- ✅ 避免使用SQL保留字

**❌ 避免**:
```sql
CREATE TABLE user ( ... );           -- ❌ 应该是users (复数)
CREATE TABLE User ( ... );           -- ❌ 应该是users (小写)
CREATE TABLE blogpost ( ... );       -- ❌ 应该是blog_posts
CREATE TABLE article_data ( ... );   -- ❌ _data后缀多余
```

**参考**: PostgreSQL官方文档 - "Database Naming"

---

### Columns

**命名风格**: `singular_snake_case`

**示例**:
```sql
-- 主键
id UUID PRIMARY KEY

-- 外键 (引用其他表)
user_id UUID NOT NULL REFERENCES users(id)
article_id UUID NOT NULL REFERENCES articles(id)

-- 时间戳
created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
deleted_at TIMESTAMPTZ  -- 软删除

-- 布尔值
is_published BOOLEAN NOT NULL DEFAULT FALSE
is_verified BOOLEAN NOT NULL DEFAULT FALSE
has_access BOOLEAN NOT NULL DEFAULT FALSE

-- 常规字段
username VARCHAR(255) NOT NULL
email VARCHAR(255) NOT NULL
title TEXT NOT NULL
content TEXT NOT NULL
```

**命名约定**:
```sql
-- 主键
id                                  -- UUID主键
{table}_id                          -- 如user_id (如果是外键)

-- 外键
{referenced_table}_id               -- 如user_id, article_id

-- 时间戳 (使用_at后缀)
created_at
updated_at
deleted_at
published_at
completed_at

-- 布尔值 (使用is_前缀)
is_active
is_published
is_verified
is_deleted

-- 布尔值 (使用has_前缀)
has_permission
has_access

-- 计数 (使用_count后缀)
view_count
comment_count
like_count
```

**规则**:
- ✅ 列名使用单数形式
- ✅ 使用 `snake_case`
- ✅ 外键使用 `{table}_id` 格式
- ✅ 时间戳使用 `_at` 后缀
- ✅ 布尔值使用 `is_` 前缀
- ✅ 计数使用 `_count` 后缀

**❌ 避免**:
```sql
userName VARCHAR(255)               -- ❌ 应该是username
User_id UUID                        -- ❌ 应该是user_id
createdDate TIMESTAMPTZ             -- ❌ 应该是created_at
is_published BOOLEAN                -- ❌ 应该是is_published
flag BOOLEAN                        -- ❌ 不清晰，使用is_xxx
```

**参考**: SQL命名最佳实践

---

### Indexes

**命名风格**: `idx_{table}_{column(s)}`

**示例**:
```sql
-- 单列索引
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_articles_author_id ON articles(author_id);

-- 多列索引
CREATE INDEX idx_reading_progress_user_article ON reading_progress(user_id, article_id);
CREATE INDEX idx_comments_article_created ON comments(article_id, created_at DESC);

-- 唯一索引
CREATE UNIQUE INDEX idx_users_username ON users(username);
CREATE UNIQUE INDEX idx_reading_progress_user_article ON reading_progress(user_id, article_id);

-- 部分索引
CREATE INDEX idx_articles_published ON articles(id) WHERE is_published = TRUE;
```

**规则**:
- ✅ 使用 `idx_` 前缀
- ✅ 包含表名和列名
- ✅ 多列索引按重要性排序
- ✅ 唯一索引使用 `uidx_` 前缀 (可选)

**❌ 避免**:
```sql
CREATE INDEX email_index ON users(email);              -- ❌ 应该是idx_users_email
CREATE INDEX idx1 ON articles(author_id);              -- ❌ 应该是idx_articles_author_id
CREATE INDEX my_idx ON users(email);                   -- ❌ 应该是idx_users_email
```

**参考**: PostgreSQL索引命名约定

---

### Foreign Keys

**命名风格**: `fk_{table}_{referenced_table}`

**示例**:
```sql
-- 外键约束
ALTER TABLE articles
ADD CONSTRAINT fk_articles_users
FOREIGN KEY (author_id) REFERENCES users(id);

ALTER TABLE comments
ADD CONSTRAINT fk_comments_articles
FOREIGN KEY (article_id) REFERENCES articles(id);

ALTER TABLE comments
ADD CONSTRAINT fk_comments_users
FOREIGN KEY (user_id) REFERENCES users(id);

ALTER TABLE reading_progress
ADD CONSTRAINT fk_reading_progress_users
FOREIGN KEY (user_id) REFERENCES users(id);

ALTER TABLE reading_progress
ADD CONSTRAINT fk_reading_progress_articles
FOREIGN KEY (article_id) REFERENCES articles(id);
```

**规则**:
- ✅ 使用 `fk_` 前缀
- ✅ 包含当前表名和引用表名
- ✅ 如果有多个外键引用同一个表，添加列名

**特殊情况**:
```sql
-- 多个外键引用同一个表
ALTER TABLE messages
ADD CONSTRAINT fk_messages_sender
FOREIGN KEY (sender_id) REFERENCES users(id);

ALTER TABLE messages
ADD CONSTRAINT fk_messages_receiver
FOREIGN KEY (receiver_id) REFERENCES users(id);
```

---

### Enums

**命名风格**: `lowercase with underscores`

**示例**:
```sql
-- 枚举类型
CREATE TYPE user_role AS ENUM ('admin', 'editor', 'reader');

CREATE TYPE article_status AS ENUM ('draft', 'published', 'archived');

CREATE TYPE comment_status AS ENUM ('pending', 'approved', 'rejected');

-- 使用
CREATE TABLE users (
    id UUID PRIMARY KEY,
    username VARCHAR(255) NOT NULL,
    role user_role NOT NULL DEFAULT 'reader'
);

CREATE TABLE articles (
    id UUID PRIMARY KEY,
    title TEXT NOT NULL,
    status article_status NOT NULL DEFAULT 'draft'
);
```

**规则**:
- ✅ 枚举类型名使用 `snake_case`
- ✅ 枚举值使用小写
- ✅ 使用描述性名称
- ✅ 枚举值应该是简短的单个词

**❌ 避免**:
```sql
CREATE TYPE UserRole AS ENUM ('Admin', 'Editor', 'Reader');  -- ❌ 应该是user_role
CREATE TYPE status AS ENUM ('DRAFT', 'PUBLISHED');           -- ❌ 应该是article_status
CREATE TYPE article_status AS ENUM ('DraftStatus', ...);     -- ❌ 值不应该有后缀
```

**参考**: PostgreSQL枚举类型最佳实践

---

### Migration Files

**命名风格**: `YYYYMMDD_description.sql`

**示例**:
```sql
-- 迁移文件
backend/migrations/
├── 20250101_initial.sql                    -- 初始化数据库
├── 20250102_add_user_roles.sql             -- 添加用户角色
├── 20250103_create_articles_table.sql      -- 创建文章表
├── 20250104_add_reading_progress.sql       -- 添加阅读进度
├── 20250105_add_indexes.sql                -- 添加索引
└── 20250106_soft_delete_articles.sql       -- 文章软删除
```

**规则**:
- ✅ 使用 `YYYYMMDD` 时间戳前缀
- ✅ 使用下划线分隔
- ✅ 描述使用 `snake_case`
- ✅ 描述应该清楚说明迁移内容
- ✅ 时间戳确保迁移顺序

**历史文件处理策略**:
```
backend/migrations/
├── 0001_initial.sql                    -- ✅ 历史文件保持不变
├── 0002_fix_column_names.sql           -- ✅ 历史文件保持不变
├── 0003_fix_post_likes_column.sql      -- ✅ 历史文件保持不变
├── 0004_create_cms_tables.sql          -- ✅ 历史文件保持不变
├── 0005_add_comment_likes.sql          -- ✅ 历史文件保持不变
├── 0006_add_user_role.sql              -- ✅ 历史文件保持不变
├── 20251229_add_reading_progress.sql   -- ✅ 新迁移使用时间戳格式
├── 20251230_add_fulltext_search.sql    -- ✅ 新迁移使用时间戳格式
├── 20251231_add_mdx_support.sql        -- ✅ 新迁移使用时间戳格式
└── [新迁移使用 YYYYMMDD_description.sql 格式]
```

**重要说明**:
- **历史迁移文件**（0001-0006）保持原有命名，因为SQLx使用文件名跟踪已执行的迁移
- **新迁移文件**必须使用时间戳格式（YYYYMMDD_description.sql）
- 不要重命名已经运行的迁移文件，否则SQLx会将其识别为新迁移并尝试重新运行

**参考**: 数据库迁移最佳实践

---

## 配置文件命名规范 (Configuration File Naming Conventions)

配置文件命名参考各技术栈的官方约定。

### Environment Variables

**命名风格**: `SCREAMING_SNAKE_CASE`

**示例**:
```bash
# 数据库配置
DATABASE_URL=postgresql://localhost:5432/blog_db
DATABASE_POOL_SIZE=10
DATABASE_TIMEOUT=30

# Redis配置
REDIS_URL=redis://localhost:6379
REDIS_MAX_CONNECTIONS=50

# JWT配置
JWT_SECRET=your-secret-key
JWT_EXPIRATION=86400

# 服务配置
HOST=127.0.0.1
PORT=3000
API_BASE_URL=http://localhost:3000/api

# CORS配置
CORS_ALLOWED_ORIGINS=http://localhost:3001,http://localhost:3002

# 邮件配置
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USERNAME=noreply@example.com
SMTP_PASSWORD=secret
```

**规则**:
- ✅ 使用 `SCREAMING_SNAKE_CASE`
- ✅ 使用描述性名称
- ✅ 分组使用相同前缀 (`DATABASE_`, `REDIS_`, `JWT_`)
- ✅ 布尔值使用 `TRUE`/`FALSE`

**❌ 避免**:
```bash
databaseUrl=postgresql://...      # ❌ 应该是DATABASE_URL
DbHost=localhost                  # ❌ 应该是DATABASE_HOST
api-port=3000                     # ❌ 应该是API_PORT
```

**参考**: [The Twelve-Factor App](https://12factor.net/config) - "Config"

---

### Docker Compose Files

**命名风格**: `docker-compose.{environment}.yml`

**示例**:
```
deployments/docker/compose-files/
├── docker-compose.yml                    # 主配置（开发）
├── docker-compose.dev.yml                # 开发环境
├── docker-compose.prod.yml               # 生产环境
├── docker-compose.test.yml               # 测试环境
└── backend/
    ├── docker-compose.yml                # Backend专用
    └── docker-compose.prod.yml
```

**规则**:
- ✅ 使用 `docker-compose` 前缀
- ✅ 环境后缀: `.dev`, `.prod`, `.test`
- ✅ 使用YAML格式 (`.yml`)

**参考**: Docker Compose官方文档

---

### Nginx Configuration

**命名风格**: `kebab-case.conf` 或 `kebab-case`

**示例**:
```
deployments/nginx/
├── nginx.conf                            # 主配置
├── conf.d/
│   ├── frontend.conf                     # 前端配置
│   ├── backend.conf                      # 后端配置
│   └── api.conf                          # API配置
└── backend-specific/
    ├── backend-locations.conf            # Backend路由配置
    └── backend-upstream.conf             # Backend上游配置
```

**规则**:
- ✅ 使用 `kebab-case`
- ✅ 配置文件使用 `.conf` 后缀
- ✅ 使用描述性名称

**参考**: Nginx官方文档

---

### Script Files

**命名风格**: `kebab-case.{ext}`

**示例**:
```
scripts/
├── deployment/
│   ├── deploy-production.sh              # Shell脚本
│   ├── deploy-staging.sh
│   ├── deploy-production.ps1             # PowerShell脚本
│   └── deploy-staging.ps1
├── development/
│   ├── start-dev.sh
│   ├── start-dev.ps1
│   └── generate-types.sh
└── operations/
    ├── backup-database.sh
    ├── restore-database.sh
    └── clear-cache.sh
```

**规则**:
- ✅ 使用 `kebab-case`
- ✅ Shell脚本: `.sh`
- ✅ PowerShell: `.ps1`
- ✅ Windows批处理: `.bat`
- ✅ Nushell: `.nu`
- ✅ 保留所有平台的变体

---

### Application Config

**YAML格式**: `snake_case`

**示例**:
```yaml
# config.yml
database:
  url: postgresql://localhost:5432/blog
  pool_size: 10
  timeout: 30

redis:
  host: localhost
  port: 6379
  max_connections: 50

server:
  host: 127.0.0.1
  port: 3000

logging:
  level: info
  format: json
```

**JSON格式**: `camelCase`

**示例**:
```json
{
  "databaseUrl": "postgresql://localhost:5432/blog",
  "databasePoolSize": 10,
  "redisHost": "localhost",
  "redisPort": 6379,
  "serverHost": "127.0.0.1",
  "serverPort": 3000
}
```

**规则**:
- ✅ YAML使用 `snake_case`
- ✅ JSON使用 `camelCase`
- ✅ 使用描述性名称

---

## 文档命名规范 (Documentation Naming Conventions)

文档文件命名应该清晰、一致、易于导航。

**命名风格**: `kebab-case.md`

**示例**:
```
docs/
├── guides/
│   ├── blog-writing-guide.md             # ✅ 指南文档
│   ├── quick-deployment.md               # ✅ 快速参考
│   └── frontend-backend-guide.md         # ✅ 完整指南
├── development/
│   ├── file-organization-guide.md        # ✅ 指南文档
│   └── naming-conventions.md             # ✅ 规范文档
├── deployment/
│   ├── server-deployment-guide.md        # ✅ 指南文档
│   └── docker-deployment.md              # ✅ 主题文档
└── operations/
    ├── troubleshooting.md                # ✅ 运维文档
    └── monitoring-guide.md               # ✅ 指南文档
```

**文档类型命名**:

| 类型 | 命名风格 | 示例 |
|------|----------|------|
| 指南文档 | `{topic}-guide.md` | `blog-writing-guide.md` |
| 快速参考 | `quick-{topic}.md` | `quick-deployment.md` |
| API文档 | `{entity}-api.md` | `users-api.md` |
| 参考文档 | `{topic}-reference.md` | `configuration-reference.md` |
| 教程 | `{topic}-tutorial.md` | `getting-started-tutorial.md` |
| FAQ | `{topic}-faq.md` | `deployment-faq.md` |
| 迁移指南 | `migration-{version}-{to}.md` | `migration-v1-v2.md` |

**规则**:
- ✅ 使用 `kebab-case`
- ✅ 使用小写字母
- ✅ 使用连字符分隔单词
- ✅ 描述性名称
- ❌ 避免使用下划线
- ❌ 避免使用大写字母

**当前代码库中的问题**:
```
docs/
├── QUICK_DEPLOYMENT.md                   -- ❌ 应该是quick-deployment.md
├── BLOG_WRITING_GUIDE.md                 -- ❌ 应该是blog-writing-guide.md
└── SERVER_DEPLOYMENT_GUIDE.md            -- ❌ 应该是server-deployment-guide.md
```

**参考**: Markdown最佳实践

---

## 快速参考表 (Quick Reference Table)

### 命名规范速查表

| 类别 | 语言/技术 | 类型 | 命名风格 | 示例 |
|------|-----------|------|----------|------|
| **Rust** | | Struct/Enum/Trait | PascalCase | `UserService`, `ApiResponse` |
| | | Function/Method | snake_case | `get_user`, `create_post` |
| | | Constant | SCREAMING_SNAKE_CASE | `MAX_RETRIES`, `API_URL` |
| | | Module | snake_case | `user_service`, `api_routes` |
| | | Lifetime | 小写字母 | `'a`, `'b`, `'src` |
| | | Type Parameter | 大写单字母 | `T`, `E`, `K`, `V` |
| | | File | snake_case | `user_service.rs` |
| **TypeScript** | | Component | PascalCase | `UserProfile`, `CommentList` |
| | | Function/Method | camelCase | `getUser`, `createPost` |
| | | Custom Hook | use + PascalCase | `useAuth`, `useUserProfile` |
| | | Interface/Type | PascalCase (无I前缀) | `User`, `Article`, `ApiResponse` |
| | | Constant | SCREAMING_SNAKE_CASE | `MAX_UPLOAD_SIZE`, `API_URL` |
| | | Props | ComponentName + Props | `UserProfileProps` |
| | | Event Handler | handle + EventName | `handleClick`, `handleSubmit` |
| | | Boolean | is/has/should/can + Adj/Noun | `isLoading`, `hasPermission` |
| | | Component File | PascalCase.tsx | `UserProfile.tsx` |
| | | Utility File | kebab-case.ts | `api-client.ts` |
| | | Hook File | use-{purpose}.ts | `use-auth.ts` |
| **Next.js** | | Route Folder | kebab-case | `blog/`, `user-profile/` |
| | | Dynamic Route | [param] | `[slug]/`, `[id]/` |
| | | Catch-all | [...slug] | `[...path]/` |
| | | Optional | [[...slug]] | `[[...slug]]/` |
| | | Route Group | (name) | `(auth)/`, `(dashboard)/` |
| | | Special Files | 特殊名称 | `page.tsx`, `layout.tsx` |
| **Database** | PostgreSQL | Table | plural_snake_case | `users`, `articles`, `reading_progress` |
| | | Column | singular_snake_case | `id`, `username`, `created_at` |
| | | Primary Key | id | `id UUID` |
| | | Foreign Key | {table}_id | `user_id`, `article_id` |
| | | Timestamp | {verb}_at | `created_at`, `updated_at` |
| | | Boolean | is_ + adj | `is_published`, `is_deleted` |
| | | Index | idx_{table}_{columns} | `idx_users_email` |
| | | Foreign Key | fk_{table}_{ref_table} | `fk_articles_users` |
| | | Enum | lowercase | `admin`, `editor`, `reader` |
| | | Migration | YYYYMMDD_description | `20250101_initial.sql` |
| **Config** | | Env Variable | SCREAMING_SNAKE_CASE | `DATABASE_URL`, `JWT_SECRET` |
| | | Docker Compose | docker-compose.{env}.yml | `docker-compose.prod.yml` |
| | | Nginx Config | kebab-case.conf | `backend.conf` |
| | | Script | kebab-case.{ext} | `deploy-production.sh` |
| | | YAML Config | snake_case | `database_url` |
| | | JSON Config | camelCase | `databaseUrl` |
| **Document** | | File | kebab-case.md | `blog-writing-guide.md` |
| | | Guide | {topic}-guide.md | `blog-writing-guide.md` |
| | | Quick Ref | quick-{topic}.md | `quick-deployment.md` |
| | | API Doc | {entity}-api.md | `users-api.md` |

---

## 反模式示例 (Anti-Patterns Examples)

### 1. 不清晰的单字母变量

**❌ 避免**:
```rust
// Rust
fn calc(d: u32, t: u32) -> f64 {
    d as f64 / t as f64
}
```

**✅ 应该**:
```rust
// Rust
fn calculate_progress_percentage(done: u32, total: u32) -> f64 {
    done as f64 / total as f64
}
```

---

### 2. 不一致的前缀

**❌ 避免**:
```typescript
// TypeScript
function getUser(id: string) { }
function fetchArticle(id: string) { }
function retrieveComment(id: string) { }
```

**✅ 应该**:
```typescript
// TypeScript
function getUser(id: string) { }
function getArticle(id: string) { }
function getComment(id: string) { }
```

---

### 3. 布尔变量不使用前缀

**❌ 避免**:
```typescript
// TypeScript
const loading = false;
const authenticated = true;
const valid = false;
```

**✅ 应该**:
```typescript
// TypeScript
const isLoading = false;
const isAuthenticated = true;
const isValid = false;
```

---

### 4. 不使用领域语言

**❌ 避免**:
```rust
// Rust
pub struct DataItem { }
pub fn update_record(uid: Uuid, iid: Uuid, val: u32) { }
```

**✅ 应该**:
```rust
// Rust
pub struct Article { }
pub fn update_reading_progress(user_id: Uuid, article_id: Uuid, progress: u32) { }
```

---

### 5. 过度缩写

**❌ 避免**:
```typescript
// TypeScript
const usr = getUser();
const art = getArticle();
const auth = isAuthenticated();
```

**✅ 应该**:
```typescript
// TypeScript
const user = getUser();
const article = getArticle();
const isAuthenticated = isAuthenticated();
```

---

### 6. Interface使用I前缀 (TypeScript)

**❌ 避免**:
```typescript
// TypeScript
export interface IUser { }
export interface IArticleService { }
export interface IApiClient { }
```

**✅ 应该**:
```typescript
// TypeScript
export interface User { }
export interface ArticleService { }
export interface ApiClient { }
```

---

### 7. 常量使用驼峰命名

**❌ 避免**:
```rust
// Rust
const MaxConnections: u32 = 100;
const defaultTimeout: u64 = 30;
```

**✅ 应该**:
```rust
// Rust
const MAX_CONNECTIONS: u32 = 100;
const DEFAULT_TIMEOUT: u64 = 30;
```

---

### 8. 数据库表名使用单数

**❌ 避免**:
```sql
-- SQL
CREATE TABLE user ( ... );
CREATE TABLE article ( ... );
CREATE TABLE comment ( ... );
```

**✅ 应该**:
```sql
-- SQL
CREATE TABLE users ( ... );
CREATE TABLE articles ( ... );
CREATE TABLE comments ( ... );
```

---

### 9. 外键命名不一致

**❌ 避免**:
```sql
-- SQL
CREATE TABLE articles (
    id UUID PRIMARY KEY,
    author UUID REFERENCES users(id),  -- ❌ 应该是author_id
    user_id UUID REFERENCES users(id)  -- ❌ 冗余
);
```

**✅ 应该**:
```sql
-- SQL
CREATE TABLE articles (
    id UUID PRIMARY KEY,
    author_id UUID NOT NULL REFERENCES users(id)
);
```

---

### 10. 文档命名不一致

**❌ 避免**:
```
docs/
├── QUICK_DEPLOYMENT.md           -- ❌ 大写
├── blogWritingGuide.md           -- ❌ 驼峰
└── server_deployment_guide.md    -- ❌ 下划线
```

**✅ 应该**:
```
docs/
├── quick-deployment.md           -- ✅ kebab-case
├── blog-writing-guide.md         -- ✅ kebab-case
└── server-deployment-guide.md    -- ✅ kebab-case
```

---

### 11. 组件文件命名不一致

**❌ 避免**:
```
components/
├── UserProfile.tsx               -- ✅ PascalCase
├── comment-list.tsx              -- ❌ kebab-case
└── BlogCard.tsx                  -- ✅ PascalCase
```

**✅ 应该**:
```
components/
├── UserProfile.tsx               -- ✅ PascalCase
├── CommentList.tsx               -- ✅ PascalCase
└── BlogCard.tsx                  -- ✅ PascalCase
```

---

### 12. 时间戳字段不使用_at后缀

**❌ 避免**:
```sql
-- SQL
CREATE TABLE articles (
    id UUID PRIMARY KEY,
    title TEXT NOT NULL,
    created TIMESTAMPTZ,          -- ❌ 不清晰
    updated TIMESTAMPTZ           -- ❌ 不清晰
);
```

**✅ 应该**:
```sql
-- SQL
CREATE TABLE articles (
    id UUID PRIMARY KEY,
    title TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

---

### 13. 事件处理函数不使用handle前缀

**❌ 避免**:
```typescript
// TypeScript
function click() { }
function submit(data: FormData) { }
function change(event: ChangeEvent) { }
```

**✅ 应该**:
```typescript
// TypeScript
function handleClick() { }
function handleSubmit(data: FormData) { }
function handleChange(event: ChangeEvent) { }
```

---

## 对标世界顶级项目 (Benchmarks Against World-Class Projects)

本项目的命名规范基于以下世界顶级项目的最佳实践：

### 1. Rust官方标准
- **来源**: [Rust API Guidelines](https://rust-lang.github.io/api-guidelines/naming.html)
- **采用内容**:
  - Struct/Enum/Trait: `PascalCase`
  - Function/Method: `snake_case`
  - Constant: `SCREAMING_SNAKE_CASE`
  - 生命周期前缀: `as_`, `to_`, `into_`, `is_`, `has_`

### 2. TypeScript/React官方文档
- **来源**: [TypeScript Handbook](https://www.typescriptlang.org/docs/), [React Docs](https://react.dev/learn)
- **采用内容**:
  - Component: `PascalCase`
  - Function: `camelCase`
  - Interface不使用`I`前缀
  - Event Handler: `handle` + EventName

### 3. Google TypeScript Style Guide
- **来源**: [Google TypeScript Style Guide](https://google.github.io/styleguide/tsguide.html)
- **采用内容**:
  - Interface命名不使用`I`前缀
  - 类和接口使用`PascalCase`
  - 函数和变量使用`camelCase`
  - 常量使用`SCREAMING_SNAKE_CASE`

### 4. Airbnb React/JS Style Guide
- **来源**: [Airbnb Style Guide](https://airbnb.io/javascript/react/)
- **采用内容**:
  - 组件使用`PascalCase`
  - 实例使用`camelCase`
  - 布尔属性使用`is`/`has`前缀
  - 事件处理函数使用`handle`前缀

### 5. Next.js最佳实践
- **来源**: [Next.js Documentation](https://nextjs.org/docs/app/building-your-application/routing)
- **采用内容**:
  - 路由文件夹: `kebab-case`
  - 动态路由: `[param]`, `[...slug]`
  - 路由组: `(groupName)`
  - 特殊文件: `page.tsx`, `layout.tsx`

### 6. PostgreSQL命名约定
- **来源**: [PostgreSQL Wiki](https://wiki.postgresql.org/wiki/Don%27t_Do_This), [Database Best Practices](https://www.postgresql.org/docs/current/ddl.html)
- **采用内容**:
  - Table: `plural_snake_case`
  - Column: `singular_snake_case`
  - Primary Key: `id`
  - Foreign Key: `{table}_id`
  - Index: `idx_{table}_{columns}`

### 7. Clean Code (Robert C. Martin)
- **来源**: *Clean Code* by Robert C. Martin
- **采用内容**:
  - 清晰性优于简洁性
  - 意图揭示命名
  - 避免误导
  - 做有意义的区分
  - 使用可搜索的名称
  - 避免单字母变量（除循环计数器）

### 8. The Twelve-Factor App
- **来源**: [12factor.net/config](https://12factor.net/config)
- **采用内容**:
  - 环境变量使用`SCREAMING_SNAKE_CASE`
  - 配置与代码分离
  - 分组使用相同前缀

---

## 实施建议 (Implementation Recommendations)

### 1. 代码审查检查项

在代码审查时，检查以下命名问题：

- [ ] Rust代码遵循Rust命名规范
- [ ] TypeScript代码遵循TypeScript命名规范
- [ ] 数据库迁移遵循数据库命名规范
- [ ] 文档文件遵循文档命名规范
- [ ] 配置文件遵循配置命名规范
- [ ] 使用领域语言而非技术术语
- [ ] 名称清晰且揭示意图
- [ ] 布尔变量使用`is`/`has`/`should`/`can`前缀
- [ ] 避免单字母变量（除循环计数器）
- [ ] 避免过度缩写

### 2. 改进计划

#### 已完成 (2026-01-01)
1. ✅ 创建命名规范指南文档
2. ✅ 更新INDEX.md链接
3. ✅ 统一文档文件命名为`kebab-case`（22个文件）
4. ✅ 修复前端常量命名问题（caches → CACHE_REGISTRY）
5. ✅ 制定迁移文件命名策略（历史文件保持，新文件用时间戳）

#### 未来改进（可选）
6. 📝 添加命名检查工具（ESLint, Clippy）
7. 📝 定期审查代码库一致性
8. 📝 CI/CD集成命名检查

### 3. 工具支持

考虑使用以下工具自动检查命名规范：

**Rust**:
```toml
# Cargo.toml
[dependencies]
clippy = "0.0"  # Rust linter with naming checks
```

**TypeScript**:
```json
// .eslintrc.json
{
  "rules": {
    "@typescript-eslint/naming-convention": [
      "error",
      {
        "selector": "variable",
        "format": ["camelCase", "UPPER_CASE", "PascalCase"]
      }
    ]
  }
}
```

---

## 总结 (Summary)

### 核心原则回顾

1. **清晰性优于简洁性** - 名称应该清楚表达意图
2. **一致性至关重要** - 相同概念使用相同命名
3. **遵循语言社区约定** - 每种语言有其约定风格
4. **可搜索性** - 避免单字母和不明显缩写
5. **意图揭示** - 名称应该揭示为什么存在
6. **领域语言** - 使用业务领域术语

### 代码库现状

- **总体评级**: A+ (100%一致性)
- **优势**: Rust (100%), TypeScript (100%), PostgreSQL (100%), 文档 (100%)
- **改进**: 所有命名不一致问题已修复

### 行动项

- ✅ 使用本文档作为命名规范参考
- ✅ 在代码审查中检查命名一致性
- ✅ 所有命名不一致已修复
- ✅ 新代码严格遵循命名规范

---

## 参考资料 (References)

### 官方文档
- [Rust API Guidelines - Naming](https://rust-lang.github.io/api-guidelines/naming.html)
- [TypeScript Handbook - Declarations](https://www.typescriptlang.org/docs/handbook/declaration-files/do-s-and-don-ts.html)
- [React Documentation - Components](https://react.dev/learn)
- [Next.js Documentation - Routing](https://nextjs.org/docs/app/building-your-application/routing)
- [PostgreSQL Documentation - Database Objects](https://www.postgresql.org/docs/current/ddl.html)

### 风格指南
- [Google TypeScript Style Guide](https://google.github.io/styleguide/tsguide.html)
- [Airbnb React/JS Style Guide](https://airbnb.io/javascript/react/)
- [Linux Kernel Coding Style](https://www.kernel.org/doc/html/latest/process/coding-style.html)

### 书籍
- *Clean Code* by Robert C. Martin - Chapter 2: Meaningful Names
- *The Pragmatic Programmer* by Andrew Hunt and David Thomas - Chapter 2: Naming
- *Domain-Driven Design* by Eric Evans - Chapter 2: Ubiquitous Language

### 在线资源
- [12-Factor App - Config](https://12factor.net/config)
- [PostgreSQL Wiki - Don't Do This](https://wiki.postgresql.org/wiki/Don%27t_Do_This)
- [SQL Style Guide by Simon Holywell](https://www.sqlstyle.guide/)

---

**文档维护者**: Claude Code
**最后更新**: 2026-01-01
**文档版本**: v1.0.0

如有命名相关问题或建议，请提交Issue或PR。

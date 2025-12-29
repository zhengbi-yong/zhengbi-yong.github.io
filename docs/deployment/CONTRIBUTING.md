# 贡献指南

感谢您对项目的关注！我们欢迎各种形式的贡献。

## 贡献类型

- 🐛 报告bug
- 💡 提出新功能建议
- 📝 改进文档
- 🔧 提交代码修复
- ✨ 添加新功能

## 开发环境设置

### 前置要求
- Node.js 20+
- pnpm 10+
- Rust 1.70+
- Docker & Docker Compose

### 设置步骤

1. Fork项目
2. 克隆您的fork:
   ```bash
   git clone https://github.com/YOUR_USERNAME/zhengbi-yong.github.io.git
   cd zhengbi-yong.github.io
   ```

3. 安装依赖:
   ```bash
   # 前端
   cd frontend && pnpm install

   # 后端
   cd ../backend
   cargo build
   ```

4. 启动开发环境:
   ```bash
   # 使用 Docker Compose
   docker-compose up

   # 或分别启动
   ./start-dev.sh
   ```

## 开发流程

### 分支策略
- `main` - 生产代码
- `develop` - 开发分支
- `feature/*` - 功能分支
- `fix/*` - 修复分支
- `docs/*` - 文档分支

### 提交规范

我们使用 [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <subject>

<body>

<footer>
```

**类型（type）**:
- `feat`: 新功能
- `fix`: Bug修复
- `docs`: 文档
- `style`: 代码风格（不影响代码运行的变动）
- `refactor`: 重构（既不是新增功能，也不是修改bug的代码变动）
- `perf`: 性能优化
- `test`: 增加测试
- `chore`: 构建过程或辅助工具的变动
- `ci`: CI配置文件和脚本的变动
- `revert`: 回滚之前的commit

**示例**:
```
feat(auth): add OAuth2 login support

Implement OAuth2 authentication using Google and GitHub providers.

- Add OAuth2 callback endpoints
- Update user model to store OAuth data
- Add OAuth configuration to environment variables

Closes #123
```

### 代码审查

所有PR需要:
1. 通过所有测试 (`cargo test` 和 `pnpm test`)
2. 通过代码检查 (`cargo clippy` 和 `pnpm lint`)
3. 更新相关文档
4. 添加必要的测试
5. 至少一位维护者批准

## 代码规范

### Rust代码规范

**命名规范**:
- 结构体: `PascalCase`
- 函数/变量: `snake_case`
- 常量: `SCREAMING_SNAKE_CASE`
- 类型参数: `T`, `U`, `E` (简短大写)

**错误处理**:
```rust
// ✅ 好 - 使用 ? 操作符
fn get_user(id: Uuid) -> Result<User, AppError> {
    let user = db::find_user(id)?.ok_or(AppError::UserNotFound)?;
    Ok(user)
}

// ❌ 差 - 使用 unwrap()
fn get_user(id: Uuid) -> User {
    db::find_user(id).unwrap()
}
```

**文档注释**:
```rust
/// 用户认证服务
///
/// 提供用户注册、登录和token管理功能
///
/// # Examples
///
/// ```
/// let auth = AuthService::new(secret);
/// let token = auth.login("user@example.com", "pass")?;
/// ```
pub struct AuthService {
    // ...
}
```

**代码格式化**:
```bash
# 格式化代码
cargo fmt

# 检查格式
cargo fmt --check

# 代码检查
cargo clippy -- -D warnings
```

### TypeScript代码规范

**命名规范**:
- 组件: `PascalCase`
- 函数/变量: `camelCase`
- 接口/类型: `PascalCase`
- 常量: `UPPER_SNAKE_CASE`

**组件规范**:
```typescript
// ✅ 好 - 使用类型
interface ButtonProps {
  label: string
  onClick: () => void
  variant?: 'primary' | 'secondary'
}

export function Button({ label, onClick, variant = 'primary' }: ButtonProps) {
  return <button onClick={onClick}>{label}</button>
}

// ❌ 差 - 使用 any
export function Button(props: any) {
  return <button onClick={props.onClick}>{props.label}</button>
}
```

**错误处理和日志**:
```typescript
// ✅ 好 - 使用logger
import { logger } from '@/lib/utils/logger'

try {
  await fetchData()
} catch (error) {
  logger.error('Failed to fetch data', error)
  throw error
}

// ❌ 差 - 使用console
console.error('Failed to fetch data', error)
```

**React最佳实践**:
- 使用函数组件和Hooks
- 使用TypeScript定义Props类型
- 避免过度使用useEffect
- 使用React.memo优化性能

**代码检查**:
```bash
# Lint检查
pnpm lint

# 自动修复
pnpm lint:fix

# 类型检查
pnpm type-check
```

## 测试要求

### 后端测试

**单元测试**:
- 测试纯函数和业务逻辑
- 目标覆盖率: ≥ 70%
- 运行命令: `cargo test --package blog-api --unit`

**集成测试**:
- 测试API端点和数据库集成
- 覆盖所有关键API路径
- 运行命令: `cargo test --package blog-api --test integration_tests`

**测试覆盖率**:
```bash
# 安装 tarpaulin
cargo install cargo-tarpaulin

# 生成覆盖率报告
cargo tarpaulin --out Html
```

### 前端测试

**组件测试**:
- 测试React组件的行为
- 使用 Vitest + Testing Library
- 目标覆盖率: ≥ 70%

**E2E测试**:
- 测试关键用户流程
- 使用 Playwright
- 覆盖核心用户场景

**运行测试**:
```bash
# 单元测试
pnpm test

# 测试覆盖率
pnpm test:coverage

# E2E测试
pnpm test:e2e
```

## 安全最佳实践

### 后端安全
- ✅ 使用参数化查询防止SQL注入
- ✅ 验证所有用户输入
- ✅ 使用Argon2进行密码哈希
- ✅ 实施速率限制
- ❌ 不要在日志中记录敏感信息
- ❌ 不要使用 `unwrap()` 处理用户输入

### 前端安全
- ✅ 使用DOMPurify清理用户内容
- ✅ 使用httpOnly cookie存储token
- ✅ 实施CSRF保护
- ❌ 不要在前端存储敏感信息
- ❌ 不要使用 `console` 输出敏感数据

### 依赖安全
```bash
# Rust依赖审计
cargo audit

# Node.js依赖审计
pnpm audit

# 更新依赖
pnpm update
cargo update
```

## 报告问题

提交issue时请包含:
- 清晰的标题和描述
- 复现步骤
- 期望行为 vs 实际行为
- 环境信息 (OS, Node版本, Rust版本等)
- 相关日志或截图

## 开发工具推荐

### Rust开发
- **IDE**: VS Code + rust-analyzer / IntelliJ IDEA
- **插件**: rust-analyzer, CodeLLDB
- **工具**: cargo, cargo-watch, cargo-expand

### TypeScript/React开发
- **IDE**: VS Code
- **插件**: ESLint, Prettier, TypeScript Importer
- **工具**: pnpm, tsx, ts-node

## 获取帮助

- 📖 查看文档: [docs/](./docs/)
- 💬 讨论: [GitHub Discussions](https://github.com/zhengbi-yong.github.io/discussions)
- 🐛 问题反馈: [GitHub Issues](https://github.com/zhengbi-yong.github.io/issues)
- 📧 联系维护者: 通过 GitHub Issues

## 许可证

提交代码即表示您同意将代码以MIT许可证发布。

---

**再次感谢您的贡献！** 🎉

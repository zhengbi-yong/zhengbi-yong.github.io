# Best Practices Overview / 最佳实践概览

本文档汇总项目的所有开发最佳实践，提供快速导航索引。

This document provides an index of all development best practices for the project.

---

## 📋 Quick Index / 快速索引

### Essential Standards / 核心标准 ⭐⭐⭐⭐⭐

1. **[Naming Conventions](naming-conventions.md)** ⭐⭐⭐⭐⭐
   - 命名规范（最重要的标准）
   - Rust、TypeScript、数据库、配置文件命名规则
   - 对标世界顶级项目

2. **[File Organization](file-organization.md)** ⭐⭐⭐⭐⭐
   - 文件组织原则
   - 目录结构标准
   - 可扩展性指南

3. **[Security Practices](security-practices.md)** ⭐⭐⭐⭐⭐
   - 安全最佳实践
   - 认证、授权、输入验证
   - 企业级安全标准

4. **[Code Style](code-style.md)** ⭐⭐⭐⭐
   - 代码风格指南
   - Rust、TypeScript、Markdown规范
   - 格式化和linting规则

---

## 🎯 By Category / 按类别浏览

### 1. Code Quality / 代码质量

#### Naming Standards / 命名标准

**[→ Naming Conventions](naming-conventions.md)**

Comprehensive naming guide covering:
- **Rust Naming**: Structs, Functions, Constants, Modules, Lifetimes
- **TypeScript Naming**: Components, Hooks, Interfaces, Props
- **Database Naming**: Tables, Columns, Indexes, Migrations
- **Configuration Naming**: Environment variables, Docker, Nginx
- **File Naming**: Directories, scripts, documentation

**Quick Reference / 快速参考:**
```typescript
// TypeScript
Components: PascalCase (UserProfile)
Hooks: camelCase (useUserData)
Types: PascalCase (UserData)
Constants: UPPER_SNAKE_CASE (MAX_RETRIES)
```

```rust
// Rust
Functions: snake_case (get_user)
Structs: PascalCase (UserData)
Constants: UPPER_SNAKE_CASE (MAX_RETRIES)
Modules: snake_case (user_service)
```

#### Code Style / 代码风格

**[→ Code Style](code-style.md)**

Detailed coding standards:
- **TypeScript Style**: Type definitions, patterns, anti-patterns
- **Rust Style**: Idioms, patterns, error handling
- **Markdown Style**: Document formatting, structure
- **Linting Rules**: ESLint, Clippy, Prettier
- **Formatting**: Auto-formatting configuration

#### File Organization / 文件组织

**[→ File Organization](file-organization.md)**

**6 Core Principles / 6个核心原则:**
1. **Separation by Function** - Files grouped by function, not type
2. **Separation of Concerns** - Dev, test, deploy, ops separated
3. **Single Responsibility** - Each directory has one clear purpose
4. **Hierarchical Scalability** - Supports 3-level directory structure
5. **Discoverability First** - Intuitive naming, easy navigation
6. **Documentation as Code** - Docs treated like code

**Decision Trees / 决策树:**
- Where to put new files?
- How to name directories?
- When to create new subdirectories?

---

### 2. Security / 安全

#### Security Best Practices / 安全最佳实践

**[→ Security Practices](security-practices.md)**

**Core Security Principles / 核心安全原则:**
- **Defense in Depth** - Multiple layers of security
- **Least Privilege** - Minimum required access
- **Secure by Default** - Secure configurations out of the box

**Key Areas / 关键领域:**

**Authentication / 认证:**
- JWT with refresh tokens
- Password hashing with Argon2
- Secure session management
- OAuth integration

**Authorization / 授权:**
- Role-based access control (RBAC)
- API endpoint protection
- Resource-level permissions
- Admin access controls

**Input Validation / 输入验证:**
- SQL injection prevention
- XSS protection
- CSRF protection
- Rate limiting
- File upload security

**Data Protection / 数据保护:**
- Encryption at rest
- Encryption in transit
- Sensitive data handling
- PII protection
- Secret management

**Deployment Security / 部署安全:**
- Environment variable security
- Container security
- Network security
- Dependency scanning
- Security headers

---

### 3. Architecture / 架构

#### Design Patterns / 设计模式

**Follow These Patterns:**

**Frontend / 前端:**
- Component composition over inheritance
- Custom hooks for logic reuse
- Container/Presentational pattern
- Atomic design principles

**Backend / 后端:**
- Layered architecture (API → Core → DB)
- Repository pattern for data access
- Service layer for business logic
- Middleware for cross-cutting concerns

**Database / 数据库:**
- Normalization (3NF)
- Foreign key constraints
- Indexes for performance
- Migration-based schema changes

---

### 4. Testing / 测试

#### Testing Philosophy / 测试哲学

**See [Testing Guides](../guides/testing/)** for comprehensive testing strategies.

**Quick Principles / 快速原则:**

1. **Test Pyramid / 测试金字塔:**
   ```
         /\
        /E2E\       - Few (10%)
       /------\
      /Integration\ - Some (20%)
     /----------\
    /   Unit      \ - Many (70%)
   /--------------\
   ```

2. **Testing Standards / 测试标准:**
   - Unit tests for business logic
   - Integration tests for API endpoints
   - E2E tests for critical user flows
   - Performance tests for bottlenecks
   - Security tests for vulnerabilities

3. **Coverage Requirements / 覆盖率要求:**
   - Backend: >80% code coverage
   - Frontend: >70% code coverage
   - Critical paths: 100% coverage

---

### 5. Performance / 性能

#### Performance Best Practices / 性能最佳实践

**See [Performance Monitoring](../operations/performance-monitoring.md)** for detailed metrics.

**Core Principles / 核心原则:**

**Frontend / 前端:**
- Code splitting and lazy loading
- Image optimization (WebP, AVIF)
- Bundle size monitoring
- Core Web Vitals optimization
- Caching strategies

**Backend / 后端:**
- Database query optimization
- Connection pooling
- Redis caching
- Async/await patterns
- Pagination for large datasets

**Database / 数据库:**
- Index optimization
- Query plan analysis
- N+1 query prevention
- Connection pooling
- Regular vacuuming

---

### 6. Git Workflow / Git工作流

#### Branching Strategy / 分支策略

**See [Development Workflow](../getting-started/workflow.md)** for complete workflow guide.

**Quick Reference / 快速参考:**

```
main (protected)
  ↑
  develop
  ↑
  feature/ticket-description
```

**Branch Naming / 分支命名:**
- `feature/` - New features
- `fix/` - Bug fixes
- `refactor/` - Code refactoring
- `docs/` - Documentation updates
- `test/` - Test additions

**Commit Messages / 提交信息:**
```
feat: add user authentication

- Implement JWT login
- Add refresh token rotation
- Update API documentation

Closes #123
```

---

## 📖 By Technology / 按技术栈

### Frontend (Next.js + React + TypeScript)

**Essential Reading / 必读:**
1. [Naming Conventions → TypeScript](naming-conventions.md#typescriptreact-naming)
2. [Code Style → TypeScript](code-style.md#typescript-规范)
3. [File Organization → Frontend](file-organization.md#frontend-代码)
4. [Security Practices → Frontend](security-practices.md#前端安全)

**Common Patterns / 常见模式:**
- Use `use` prefix for hooks
- PascalCase for components
- camelCase for utilities
- Create types in `*.types.ts` files

### Backend (Rust + Axum + SQLx)

**Essential Reading / 必读:**
1. [Naming Conventions → Rust](naming-conventions.md#rust-naming)
2. [Code Style → Rust](code-style.md#rust-规范)
3. [File Organization → Backend](file-organization.md#backend-代码)
4. [Security Practices → Backend](security-practices.md#后端安全)

**Common Patterns / 常见模式:**
- Use `Result<T, E>` for error handling
- `?` operator for propagation
- Snake_case for functions and variables
- PascalCase for types and structs

### Database (PostgreSQL)

**Essential Reading / 必读:**
1. [Naming Conventions → Database](naming-conventions.md#数据库命名)
2. [File Organization → Migrations](file-organization.md#数据库迁移)
3. [Security Practices → Database](security-practices.md#数据库安全)

**Common Patterns / 常见模式:**
- Snake_case for table and column names
- Plural table names (users, posts)
- Foreign keys: `{table}_id` (user_id)
- Index names: `idx_{table}_{column}`

---

## 🎓 Learning Path / 学习路径

### For New Developers / 新开发者

**Week 1: Foundations / 第1周：基础**
1. Day 1-2: Read [Naming Conventions](naming-conventions.md) ⭐⭐⭐⭐⭐
2. Day 3-4: Read [File Organization](file-organization.md) ⭐⭐⭐⭐⭐
3. Day 5: Review [Code Style](code-style.md) ⭐⭐⭐⭐

**Week 2: Security & Quality / 第2周：安全和质量**
1. Day 1-3: Study [Security Practices](security-practices.md) ⭐⭐⭐⭐⭐
2. Day 4-5: Review [Development Workflow](../getting-started/workflow.md)

### For Experienced Developers / 有经验开发者

**Focus Areas / 重点关注:**
1. [Security Practices](security-practices.md) - Security-first approach
2. [File Organization](file-organization.md) - Scalability patterns
3. [Performance Monitoring](../operations/performance-monitoring.md) - Optimization

---

## ✅ Compliance Checklist / 合规检查清单

### Before Committing / 提交前检查

**Code Quality / 代码质量:**
- [ ] Follows [Naming Conventions](naming-conventions.md)
- [ ] Passes [Code Style](code-style.md) linting
- [ ] Organized per [File Organization](file-organization.md)
- [ ] No `any` types (TypeScript)
- [ ] No `unwrap()` (Rust)

**Security / 安全:**
- [ ] Reviewed [Security Practices](security-practices.md)
- [ ] Input validation on all endpoints
- [ ] SQL injection prevention
- [ ] XSS protection
- [ ] CSRF protection
- [ ] Rate limiting on public APIs

**Testing / 测试:**
- [ ] Unit tests for new features
- [ ] Integration tests for API endpoints
- [ ] E2E tests for user flows
- [ ] Coverage requirements met

**Documentation / 文档:**
- [ ] Code comments for complex logic
- [ ] API documentation updated
- [ ] README updated (if needed)
- [ ] Changelog updated

---

## 🔄 Updates / 更新记录

### Latest Updates / 最新更新

**2026-01-01**:
- Reorganized into modular structure
- Added Naming Conventions (world-class standards)
- Enhanced File Organization Guide
- Expanded Security Practices
- Created Code Style guide

### Archive / 归档

Historical best practices and progress reports:
- See [archive/](archive/) for historical documents

---

## 🆘 Getting Help / 获取帮助

### Questions / 问题

1. **Check the specific guide / 查看特定指南**
   - Naming: [Naming Conventions](naming-conventions.md)
   - Organization: [File Organization](file-organization.md)
   - Security: [Security Practices](security-practices.md)

2. **Review examples / 查看示例**
   - Frontend: `frontend/components/` directory
   - Backend: `backend/crates/` directory
   - Database: `backend/migrations/` directory

3. **Ask the team / 询问团队**
   - Create a GitHub issue
   - Contact maintainers
   - Pair programming sessions

---

## 📚 Additional Resources / 更多资源

### Internal / 内部资源

- [Architecture Overview](../concepts/architecture.md) - System design
- [Development Workflow](../getting-started/workflow.md) - Git workflow
- [Troubleshooting](../operations/troubleshooting.md) - Common issues

### External / 外部资源

- **Rust**: [API Guidelines](https://rust-lang.github.io/api-guidelines/)
- **TypeScript**: [Handbook](https://www.typescriptlang.org/docs/)
- **Next.js**: [Best Practices](https://nextjs.org/docs)
- **PostgreSQL**: [Best Practices](https://wiki.postgresql.org/wiki/Don%27t_Do_This)

---

## 🎯 Quick Reference Card / 快速参考卡

```
┌────────────────────────────────────────────────────────────┐
│  BEST PRACTICES QUICK REFERENCE                            │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  NAMING (MOST IMPORTANT) ⭐⭐⭐⭐⭐                       │
│  • TypeScript: PascalCase (User), camelCase (getUser)     │
│  • Rust: snake_case (get_user), PascalCase (User)         │
│  • Database: snake_case (users, user_id)                 │
│                                                            │
│  SECURITY (PRIORITY) ⭐⭐⭐⭐⭐                           │
│  • No any types, No unwrap()                              │
│  • Validate all inputs                                    │
│  • Use parameterized queries                             │
│  • Implement rate limiting                               │
│                                                            │
│  CODE QUALITY ⭐⭐⭐⭐                                    │
│  • Follow naming conventions                             │
│  • Run linters and formatters                            │
│  • Write tests (80% coverage min)                        │
│  • Document complex logic                                │
│                                                            │
│  FILE ORGANIZATION ⭐⭐⭐⭐                               │
│  • Group by function, not type                           │
│  • Separate dev, test, deploy, ops                        │
│  • Single responsibility per directory                   │
│  • Follow decision trees                                 │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

---

## 📝 Summary / 总结

**Key Principles / 核心原则:**
1. **Naming First** - Consistent naming is foundational
2. **Security Always** - Security-first development
3. **Quality Matters** - High code quality standards
4. **Clear Organization** - Predictable file structure
5. **Comprehensive Testing** - Test coverage requirements

**Most Important / 最重要:**
1. ⭐⭐⭐⭐⭐ [Naming Conventions](naming-conventions.md)
2. ⭐⭐⭐⭐⭐ [Security Practices](security-practices.md)
3. ⭐⭐⭐⭐⭐ [File Organization](file-organization.md)
4. ⭐⭐⭐⭐ [Code Style](code-style.md)

**Maintenance / 维护:**
- Review quarterly
- Update as project evolves
- Team feedback welcome
- Continuous improvement

---

**Version**: 2.0 (World-Class Best Practices)
**Last Updated**: 2026-01-01
**Maintained By**: Development Team

🤖 Generated with [Claude Code](https://claude.com/claude-code)

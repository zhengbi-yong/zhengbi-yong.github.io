# Developer Guide

欢迎来到 zhengbi-yong.github.io 的开发者文档！

Welcome to the developer documentation for zhengbi-yong.github.io!

---

## 📚 Quick Navigation / 快速导航

### For New Developers / 新开发者

1. **[Quick Start](quick-start.md)** ⭐ - 5分钟快速上手 / Get up and running in 5 minutes
2. **[Getting Started](getting-started/)** - 环境设置和基本概念 / Setup and basics
3. **[Core Concepts](concepts/)** - 理解架构设计 / Understand the architecture

### For Specific Tasks / 特定任务

- **[Frontend Development](guides/frontend-development/)** - Next.js, React, Refine, Components
- **[Backend Development](guides/backend-development/)** - Rust, Axum, API, Database
- **[Testing](guides/testing/)** - 前端和后端测试策略 / Testing strategies
- **[API Reference](reference/api-reference.md)** - REST API 端点文档
- **[Configuration](reference/configuration.md)** - 所有配置选项

### For Standards / 开发标准

- **[Best Practices](best-practices/)** - 代码质量标准 / Code quality standards
- **[Operations](operations/)** - 监控、安全、故障排查 / Monitoring, security, troubleshooting

---

## 🎯 Learning Paths / 学习路径

### Frontend Developer Path / 前端开发者路径

**Goal**: Build user interfaces and interactive features

1. [Quick Start](quick-start.md) - Set up your environment
2. [Frontend Architecture](concepts/frontend-architecture.md) - Understand Next.js structure
3. [Component Development](guides/frontend-development/component-development.md) - Build components
4. [Frontend Testing](guides/testing/frontend-testing.md) - Test your code
5. [Best Practices](best-practices/) - Follow coding standards

### Backend Developer Path / 后端开发者路径

**Goal**: Build APIs and business logic

1. [Quick Start](quick-start.md) - Set up your environment
2. [Backend Architecture](concepts/backend-architecture.md) - Understand Rust/Axum structure
3. [API Development](guides/backend-development/api-development.md) - Build endpoints
4. [Database Operations](guides/backend-development/database-operations.md) - Work with data
5. [Backend Testing](guides/testing/backend-testing.md) - Test your code
6. [Best Practices](best-practices/) - Follow coding standards

### Full-Stack Developer Path / 全栈开发者路径

**Goal**: End-to-end development

1. [Quick Start](quick-start.md) - Set up your environment
2. [Architecture (All)](concepts/) - Understand full system design
3. [Frontend & Backend Guides](guides/) - Complete development guides
4. [Testing](guides/testing/) - Testing strategies
5. [Best Practices](best-practices/) - Coding standards
6. [Operations](operations/) - Deployment and monitoring

---

## 📖 Documentation Structure / 文档结构

This documentation follows cognitive learning principles:

### 1. Quick Start / 快速开始
- **[Quick Start](quick-start.md)**: 5-minute setup guide

### 2. Getting Started / 快速入门
- **[Overview](getting-started/overview.md)**: Project introduction
- **[Project Structure](getting-started/project-structure.md)**: Code organization
- **[Development Environment](getting-started/development-environment.md)**: IDE and tools setup
- **[Workflow](getting-started/workflow.md)**: Development workflow

### 3. Core Concepts / 核心概念
- **[Architecture](concepts/architecture.md)**: System design overview
- **[Frontend Architecture](concepts/frontend-architecture.md)**: Next.js architecture
- **[Backend Architecture](concepts/backend-architecture.md)**: Rust/Axum architecture
- **[Data Flow](concepts/data-flow.md)**: Request/response flow

### 4. Guides / 开发指南
- **[Frontend Development](guides/frontend-development/)**: Frontend-specific guides
- **[Backend Development](guides/backend-development/)**: Backend-specific guides
- **[Testing](guides/testing/)**: Testing strategies and tools

### 5. Reference / 参考文档
- **[API Reference](reference/api-reference.md)**: Complete API documentation
- **[Components Reference](reference/components-reference.md)**: Component catalog
- **[Configuration](reference/configuration.md)**: All configuration options

### 6. Best Practices / 最佳实践
- **[Overview](best-practices/overview.md)**: Best practices index
- **[Code Style](best-practices/code-style.md)**: Coding standards
- **[Naming Conventions](best-practices/naming-conventions.md)**: Naming rules
- **[Security Practices](best-practices/security-practices.md)**: Security guidelines
- **[File Organization](best-practices/file-organization.md)**: File structure standards

### 7. Operations / 运维
- **[Performance Monitoring](operations/performance-monitoring.md)**: Metrics and optimization
- **[Security Guide](operations/security-guide.md)**: Security measures
- **[Troubleshooting](operations/troubleshooting.md)**: Common issues and solutions

### 8. Archive / 归档
- Historical project summaries and progress reports (archived for reference)

---

## 🚀 Quick Start / 快速开始

### For New Contributors / 新贡献者

**First time contributing? Follow these steps:**

1. **Read**: [Quick Start](quick-start.md) - Set up in 5 minutes
2. **Choose**: Select a learning path above based on your role
3. **Learn**: Read the core concepts for your area
4. **Practice**: Follow the how-to guides
5. **Reference**: Use the reference docs as needed
6. **Follow Standards**: Apply best practices in your code

### For Existing Contributors / 现有贡献者

**Already familiar? Jump to what you need:**

- **Adding a feature?** → [Frontend Guides](guides/frontend-development/) or [Backend Guides](guides/backend-development/)
- **Building an API?** → [API Development](guides/backend-development/api-development.md)
- **Writing tests?** → [Testing Guides](guides/testing/)
- **Need API info?** → [API Reference](reference/api-reference.md)
- **Debugging issues?** → [Troubleshooting](operations/troubleshooting.md)
- **Setting up environment?** → [Development Environment](getting-started/development-environment.md)

---

## 💡 Key Principles / 核心原则

This project follows world-class development practices:

### 1. **Cognitive Learning / 认知学习**
   - Quick Start → Concepts → Guides → Reference
   - Progressive complexity
   - Clear learning paths

### 2. **Separation of Concerns / 关注点分离**
   - Frontend and Backend clearly separated
   - Testing integrated into development
   - Operations concerns documented separately

### 3. **Best Practices First / 最佳实践优先**
   - Comprehensive coding standards
   - Security-first development
   - Performance monitoring

### 4. **Documentation as Code / 文档即代码**
   - Documentation is version controlled
   - Updated with code changes
   - Reviewed like code

---

## 🛠️ Technology Stack / 技术栈

### Frontend / 前端
- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript 5.9
- **Styling**: Tailwind CSS 4
- **Content**: MDX + Contentlayer2
- **Admin**: Refine

### Backend / 后端
- **Language**: Rust
- **Framework**: Axum 0.8
- **Database**: PostgreSQL 17 + SQLx
- **Cache**: Redis 7
- **Auth**: JWT with refresh tokens

### DevOps / 开发运维
- **Containerization**: Docker & Docker Compose
- **Monitoring**: Prometheus + Grafana
- **Web Server**: Nginx
- **Reverse Proxy**: Nginx

---

## 📝 Contributing / 贡献指南

### Documentation Updates / 文档更新

**When to update documentation:**
- Adding new features
- Changing APIs
- Modifying workflows
- Updating best practices
- Fixing bugs in docs

**How to contribute:**
1. Read [Best Practices](best-practices/) first
2. Follow the [File Organization Guide](best-practices/file-organization.md)
3. Update relevant documentation
4. Test your changes
5. Submit a pull request

### Code Contributions / 代码贡献

**Before contributing code:**
1. Read relevant [Best Practices](best-practices/)
2. Follow [Naming Conventions](best-practices/naming-conventions.md)
3. Understand [Development Workflow](getting-started/workflow.md)
4. Write [Tests](guides/testing/)
5. Update documentation

---

## 🔍 Finding Information / 查找信息

### By Task / 按任务查找

| Want to... | Go to... |
|-----------|---------|
| Set up development environment | [Development Environment](getting-started/development-environment.md) |
| Understand the architecture | [Concepts](concepts/) |
| Build a component | [Component Development](guides/frontend-development/component-development.md) |
| Create an API endpoint | [API Development](guides/backend-development/api-development.md) |
| Write tests | [Testing Guides](guides/testing/) |
| Look up API endpoints | [API Reference](reference/api-reference.md) |
| Configure the application | [Configuration](reference/configuration.md) |
| Debug an issue | [Troubleshooting](operations/troubleshooting.md) |
| Follow coding standards | [Best Practices](best-practices/) |
| Monitor performance | [Performance Monitoring](operations/performance-monitoring.md) |

### By Role / 按角色查找

| Role | Start Here |
|------|-----------|
| New Developer | [Quick Start](quick-start.md) → [Getting Started](getting-started/) |
| Frontend Developer | [Frontend Development](guides/frontend-development/) |
| Backend Developer | [Backend Development](guides/backend-development/) |
| Full-Stack Developer | [Architecture](concepts/) → [All Guides](guides/) |
| QA Engineer | [Testing](guides/testing/) |
| DevOps Engineer | [Operations](operations/) |

---

## 🤝 Getting Help / 获取帮助

### Still have questions? / 还有问题？

1. **Search documentation** - Use Ctrl+F to find keywords
2. **Check FAQ** - See relevant troubleshooting sections
3. **Read Architecture** - Understand system design first
4. **Review Examples** - Check existing code for patterns
5. **Ask Team** - Contact maintainers or create an issue

### External Resources / 外部资源

- [Rust Documentation](https://doc.rust-lang.org/)
- [Next.js Documentation](https://nextjs.org/docs)
- [React Documentation](https://react.dev/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Tailwind CSS](https://tailwindcss.com/docs)

---

## 📊 Documentation Stats / 文档统计

- **Total Documents**: ~30 files
- **Categories**: 7 main sections
- **Languages**: Chinese & English (bilingual)
- **Last Updated**: 2026-01-01
- **Maintenance**: Active

---

**Happy Coding! / 祝您开发愉快！** 🚀

---

## 📌 Quick Reference / 快速参考

### Essential Reading / 必读文档

**For All Developers**:
1. [Quick Start](quick-start.md) ⭐⭐⭐⭐⭐
2. [Architecture](concepts/architecture.md) ⭐⭐⭐⭐⭐
3. [Best Practices Overview](best-practices/overview.md) ⭐⭐⭐⭐
4. [Development Workflow](getting-started/workflow.md) ⭐⭐⭐⭐

**For Frontend**:
1. [Frontend Architecture](concepts/frontend-architecture.md) ⭐⭐⭐⭐⭐
2. [Component Development](guides/frontend-development/component-development.md) ⭐⭐⭐⭐
3. [Refine Integration](guides/frontend-development/refine-integration.md) ⭐⭐⭐⭐
4. [Frontend Testing](guides/testing/frontend-testing.md) ⭐⭐⭐⭐

**For Backend**:
1. [Backend Architecture](concepts/backend-architecture.md) ⭐⭐⭐⭐⭐
2. [API Development](guides/backend-development/api-development.md) ⭐⭐⭐⭐
3. [Database Operations](guides/backend-development/database-operations.md) ⭐⭐⭐⭐
4. [Backend Testing](guides/testing/backend-testing.md) ⭐⭐⭐⭐
5. [API Reference](reference/api-reference.md) ⭐⭐⭐⭐⭐

**For Standards**:
1. [Code Style](best-practices/code-style.md) ⭐⭐⭐⭐
2. [Naming Conventions](best-practices/naming-conventions.md) ⭐⭐⭐⭐⭐
3. [Security Practices](best-practices/security-practices.md) ⭐⭐⭐⭐⭐
4. [File Organization](best-practices/file-organization.md) ⭐⭐⭐⭐⭐

---

**Maintained by**: Development Team
**Last Update**: 2026-01-01
**Version**: 2.0 (World-Class Developer Guide)

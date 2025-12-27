# 术语表

本文档定义了项目中使用的技术术语和缩写。

## 目录

- [前端术语](#前端术语)
- [后端术语](#后端术语)
- [数据库术语](#数据库术语)
- [运维术语](#运维术语)
- [开发流程术语](#开发流程术语)

---

## 前端术语

### A

#### Access Token
访问令牌，用于认证 API 请求的短期令牌（通常 15 分钟有效期）。

### B

#### Bundle
前端打包后的 JavaScript 代码集合。

### C

#### Component
组件，React 的基本构建单元，可复用的 UI 元素。

#### CSR (Client-Side Rendering)
客户端渲染，由浏览器动态生成页面内容。

### D

#### Dynamic Import
动态导入，运行时加载模块，用于代码分割。

### E

#### E2E (End-to-End) Testing
端到端测试，模拟真实用户场景的完整测试。

### H

#### Hook
React Hook，函数组件中使用状态和生命周期的方式。

### M

#### MDX
Markdown + JSX，允许在 Markdown 中使用 React 组件。

#### Middleware
中间件，在请求和响应之间执行的函数。

### N

#### Next.js
React 框架，提供服务器端渲染、静态生成等功能。

### P

#### Props
属性，父组件传递给子组件的数据。

### R

#### React
用于构建用户界面的 JavaScript 库。

#### Refine
React CRUD 框架，用于快速构建管理后台。

### S

#### SSR (Server-Side Rendering)
服务器端渲染，在服务器上生成 HTML。

#### Static Generation
静态生成，构建时生成 HTML。

### T

#### TypeScript
JavaScript 的超集，添加了类型系统。

### V

#### Vitest
基于 Vite 的单元测试框架。

---

## 后端术语

### A

#### API (Application Programming Interface)
应用程序编程接口，定义软件组件之间的交互。

#### Argon2
密码哈希算法，抗 GPU 破解。

#### Axum
Rust Web 框架，基于 Tokio。

### C

#### CORS (Cross-Origin Resource Sharing)
跨域资源共享，允许服务器声明哪些源可以访问资源。

#### CRUD
Create, Read, Update, Delete - 基本数据操作。

### D

#### Docker
容器化平台，打包应用及其依赖。

### H

#### HTTP-only Cookie
只能通过 HTTP 访问的 Cookie，防止 XSS 攻击。

### J

#### JWT (JSON Web Token)
JSON 格式的安全令牌，用于认证和授权。

### L

#### Load Balancer
负载均衡器，分发请求到多个服务器。

### M

#### Middleware
中间件，拦截和处理 HTTP 请求的函数。

### P

#### PostgreSQL
开源关系数据库管理系统。

#### Pool
连接池，管理数据库连接以提高性能。

### R

#### Redis
开源内存数据结构存储，用作数据库、缓存和消息代理。

#### Refresh Token
刷新令牌，用于获取新的 Access Token（通常 7 天有效期）。

#### Rust
系统编程语言，注重安全、并发和性能。

### S

#### SQLx
Rust 异步 SQL 工具包，编译时检查查询。

#### Serverless
无服务器架构，无需管理服务器即可运行代码。

### T

#### Tokio
Rust 异步运行时。

---

## 数据库术语

### C

#### Cluster
集群，多台服务器协同工作。

#### Connection Pool
连接池，缓存和重用数据库连接。

#### Cursor
游标，用于遍历查询结果。

### E

#### Entity
实体，数据库表的面向对象表示。

### F

#### Foreign Key
外键，关联两个表的字段。

### I

#### Index
索引，加速数据查询的数据结构。

#### Index Type
索引类型，如 B-tree、Hash、GIN 等。

### J

#### Join
连接，从多个表中组合数据。

### M

#### Migration
迁移，数据库模式的版本控制。

### P

#### Primary Key
主键，唯一标识表中的每一行。

### R

#### Replica
副本，数据库的只读副本。

### S

#### Schema
模式，数据库的结构定义。

#### Sharding
分片，将数据分布到多个数据库。

### T

#### Transaction
事务，一组数据库操作的逻辑单元。

---

## 运维术语

### C

#### CI/CD (Continuous Integration/Continuous Deployment)
持续集成/持续部署，自动化开发流程。

#### Container
容器，轻量级虚拟化技术。

### D

#### Deployment
部署，将应用发布到生产环境。

#### Docker Compose
定义和运行多容器 Docker 应用的工具。

### E

#### Environment Variable
环境变量，外部配置应用的参数。

### H

#### High Availability
高可用性，系统在故障时仍能提供服务。

### L

#### Load Balancing
负载均衡，分发工作负载到多个服务器。

### M

#### Monitoring
监控，跟踪系统性能和健康状态。

### O

#### ORM (Object-Relational Mapping)
对象关系映射，将对象转换为数据库记录。

### P

#### PostgreSQL Replication
PostgreSQL 复制，将数据从主数据库复制到从数据库。

#### Proxy
代理，转发请求到后端服务。

### R

#### Rate Limiting
速率限制，控制请求频率。

#### Reverse Proxy
反向代理，接收请求并转发到后端服务器。

### S

#### Scaling
扩展，增加系统容量。

#### SSL/TLS
安全套接字层/传输层安全，加密网络通信。

---

## 开发流程术语

### B

#### Branch
分支，Git 中独立的开发线。

#### Bug Report
错误报告，描述软件缺陷的文档。

### C

#### Code Review
代码审查，检查代码质量和正确性。

#### Commit
提交，保存代码更改到 Git。

#### Coverage
覆盖率，测试代码的百分比。

### D

#### Deploy
部署，发布应用到生产环境。

#### Dependency
依赖，项目所需的外部库或模块。

### F

#### Feature Branch
功能分支，开发新功能的分支。

#### Fork
分支，创建仓库的副本。

### G

#### Git
分布式版本控制系统。

#### GitHub
基于 Git 的代码托管平台。

### I

#### Issue
问题，待解决的问题或功能请求。

### L

#### Linter
代码检查工具，检查代码风格和错误。

### M

#### Merge
合并，将一个分支的更改整合到另一个分支。

#### Mock
模拟对象，用于测试。

#### Module
模块，独立的代码单元。

### P

#### Package Manager
包管理器，管理项目依赖。

#### Pull Request (PR)
拉取请求，提议将更改合并到主分支。

### R

#### Refactor
重构，改进代码结构而不改变功能。

#### Repository (Repo)
仓库，存储项目代码和版本历史的地方。

### S

#### Stage
暂存，准备提交的文件。

#### Stash
暂存，临时保存未提交的更改。

### T

#### Tag
标签，标记重要的提交版本。

#### Test-Driven Development (TDD)
测试驱动开发，先写测试再写代码。

### V

#### Version Control
版本控制，跟踪代码更改的系统。

---

## 相关文档

- [开发最佳实践](../development/best-practices.md) - 开发规范和术语使用
- [架构概览](../development/architecture.md) - 系统架构详解
- [API 参考](../development/backend/api-reference.md) - API 术语详解

---

**最后更新**: 2025-12-27
**维护者**: Documentation Team

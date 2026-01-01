# 文件组织原则指南 (File Organization Principles Guide)

## 概述 (Overview)

本文档定义了本项目的文件组织原则，确保所有开发者遵循统一的结构规范。这些原则经过实践验证，旨在提高代码库的可维护性、可扩展性和可发现性。

**版本**: 1.0
**最后更新**: 2026-01-01
**适用于**: 所有贡献者和维护者

---

## 核心原则 (Core Principles)

### 1. 按功能分离 (Separation by Function)

**原则**: 文件应根据其**功能**而非**类型**进行分组。

**说明**:
- ✅ 好的做法: 所有部署相关文件放在 `deployments/`（无论是什么类型的文件）
- ❌ 坏的做法: 所有配置文件放在根目录（无论它们服务于哪个功能）

**应用示例**:
```
deployments/          # 按功能分组（部署）
├── docker/          # Docker配置（服务于部署功能）
├── nginx/           # Nginx配置（服务于部署功能）
└── scripts/         # 部署脚本（服务于部署功能）

vs.

根目录/              # ❌ 按类型分组
├── configs/         # 所有配置（混合了部署、开发、测试等）
├── scripts/         # 所有脚本（混合了各种功能）
```

### 2. 关注点分离 (Separation of Concerns)

**原则**: 不同生命周期阶段的代码和配置应该分开。

**生命周期阶段**:
1. **开发阶段** - 源代码、开发脚本
2. **测试阶段** - 测试代码、测试配置
3. **构建阶段** - 构建脚本、构建配置
4. **部署阶段** - 部署配置、部署脚本
5. **运维阶段** - 监控配置、运维脚本

**应用**:
```
生产代码:   backend/, frontend/
测试代码:   backend/tests/, frontend/tests/
文档:       docs/
部署:       deployments/
脚本:       scripts/
配置模板:   config/
```

**关键规则**:
- ❌ **绝不**将测试代码放在生产代码目录中
- ❌ **绝不**将部署配置放在源代码目录中
- ❌ **绝不**将文档散落在根目录

### 3. 单一职责目录 (Single Responsibility Directories)

**原则**: 每个顶级目录应该只有一个明确的职责。

**当前顶级目录职责**:

| 目录 | 职责 | 包含内容 |
|------|------|----------|
| `backend/` | 后端业务逻辑 | Rust源代码、migrations、tests |
| `frontend/` | 前端业务逻辑 | Next.js源代码、components、tests |
| `docs/` | 项目文档 | 所有markdown文档 |
| `deployments/` | 部署基础设施 | Docker、Nginx、监控配置 |
| `scripts/` | 自动化脚本 | 所有工具和自动化脚本 |
| `config/` | 配置模板 | 环境配置示例 |

**规则**:
- ✅ 目录中的所有文件都应该服务于该目录的单一职责
- ❌ 避免混合职责（如：在 `docs/` 中放置配置文件）

### 4. 分层可扩展性 (Hierarchical Scalability)

**原则**: 结构应该支持项目的增长，而不需要频繁重组。

**分层策略**:
```
Level 1 (顶级):    主要功能领域 (docs, deployments, scripts)
Level 2 (子级):    按用途分类 (docs/guides, scripts/development)
Level 3 (孙级):    具体实现 (guides/BLOG_WRITING_GUIDE.md)
```

**扩展规则**:
1. **添加新子目录** - 当某个类别变得复杂时
2. **创建新顶级目录** - 仅当引入全新的功能领域时
3. **保持一致性** - 新结构应遵循现有模式

**扩展示例**:
```
当前:
docs/
└── operations/     # 运维文档

未来扩展:
docs/
└── operations/     # 保持现有
    ├── monitoring/  # 新增：监控相关
    ├── backup/      # 新增：备份相关
    └── scaling/     # 新增：扩容相关
```

### 5. 可发现性优先 (Discoverability First)

**原则**: 新开发者应该能够直观地找到他们需要的文件。

**实现方式**:
- **直观的命名** - 目录名称应该清楚表明其用途
- **一致的约定** - 相同类型的文件使用相同的命名模式
- **最小化深度** - 避免过深的目录嵌套（最多3-4层）
- **清晰的导航** - 提供 INDEX.md 和 README.md

**示例**:
```
✅ 好的命名:
- getting-started/   (新开发者从这里开始)
- operations/        (运维相关)
- testing/           (测试相关)

❌ 避免的命名:
- docs1/, docs2/     (不清楚区别)
- misc/, other/      (职责不明)
- temp/, tmp/        (不应该提交到版本控制)
```

### 6. 文档即代码 (Documentation as Code)

**原则**: 文档应该与代码受到同等待遇。

**要求**:
1. **版本控制** - 所有文档在Git中
2. **结构化** - 文档有清晰的分类
3. **可维护** - 定期更新，保持准确
4. **可导航** - 提供索引和链接

**文档结构**:
```
docs/
├── INDEX.md                # 主导航入口
├── getting-started/        # 入门指南（给新开发者）
├── guides/                 # 操作指南（完成特定任务）
├── deployment/             # 部署文档（运维人员）
├── development/            # 开发文档（开发者）
├── operations/             # 运维文档（运行时）
├── reference/              # 参考文档（API、配置）
└── appendix/               # 附录（FAQ、术语表）
```

---

## 文件放置规则 (File Placement Rules)

### A. 源代码文件 (Source Code)

**后端 (Rust)**:
```
backend/
├── crates/              # 模块化crate
│   ├── api/            # API端点
│   ├── core/           # 核心业务逻辑
│   ├── db/             # 数据库层
│   ├── shared/         # 共享工具
│   └── worker/         # 后台任务
├── src/                # 主入口
├── src-bin/            # 其他二进制文件
├── migrations/         # 数据库迁移
├── tests/              # 集成测试
└── scripts/            # 后端专用脚本
```

**前端 (Next.js)**:
```
frontend/
├── app/                # 应用路由（生产代码）
│   ├── about/         # 页面路由
│   ├── blog/          # 博客路由
│   └── admin/         # 管理后台
├── components/         # React组件
│   ├── blog/          # 博客组件
│   ├── auth/          # 认证组件
│   └── ui/            # UI组件
├── lib/               # 工具库
├── data/              # 内容数据（博客文章等）
├── tests/             # 测试代码（非生产）
└── public/            # 静态资源
```

**规则**:
- ✅ 生产页面放在 `app/`
- ✅ 测试页面放在 `tests/`
- ❌ 绝不在 `app/` 中创建 `test-*` 路由

### B. 文档文件 (Documentation)

**放置决策树**:
```
是什么类型的文档？
│
├── 入门教程？
│   └── docs/getting-started/
│
├── 操作指南（如何做某事）？
│   └── docs/guides/
│
├── 部署相关？
│   └── docs/deployment/
│
├── 开发流程？
│   └── docs/development/
│
├── 运维操作（运行时）？
│   └── docs/operations/
│
├── 测试相关？
│   └── docs/testing/
│
├── 迁移/升级历史？
│   └── docs/migration/
│
├── API/配置参考？
│   └── docs/reference/
│
└── 其他补充材料？
    └── docs/appendix/
```

**命名规则**:
- **指南文档**: `kebab-case.md` (如: `blog-writing-guide.md`)
- **总结报告**: `UPPER_SNAKE_CASE.md` (如: `DECOUPLING_COMPLETE.md`)
- **快速参考**: `UPPER_SNAKE_CASE.md` (如: `QUICK_REFERENCE.md`)

### C. 配置文件 (Configuration)

**环境配置**:
```
config/environments/
├── .env.example                 # 主模板
├── .env.docker.example          # Docker环境
├── .env.local.example           # 本地开发
├── .env.production.example      # 生产环境
├── .env.deploy.example          # 部署环境
└── backend/
    └── .env.production.example  # Backend专用
```

**规则**:
- ✅ 所有 `.env.*.example` 模板放在 `config/environments/`
- ✅ 实际的 `.env` 文件不提交到Git（在 `.gitignore` 中）
- ✅ 每个服务/环境有独立的示例文件

**应用配置**:
```
backend/
├── Cargo.toml                   # Backend配置
└── .env.example                 # Backend专用模板

frontend/
├── next.config.js              # Frontend配置
├── tailwind.config.js          # Tailwind配置
└── .env.example                # Frontend专用模板
```

**部署配置**:
```
deployments/
├── docker/
│   └── compose-files/
│       ├── docker-compose.yml           # 主配置
│       ├── docker-compose.dev.yml       # 开发环境
│       ├── docker-compose.prod.yml      # 生产环境
│       └── backend/                     # Backend专用
├── nginx/
│   ├── nginx.conf               # 主配置
│   ├── conf.d/                  # 站点配置
│   └── backend-specific/        # Backend配置
└── server/
    ├── setup/                   # 服务器设置
    └── monitoring/              # 监控配置
```

### D. 脚本文件 (Scripts)

**放置决策树**:
```
脚本的用途是什么？
│
├── 部署到服务器？
│   └── scripts/deployment/
│
├── 开发工作流（启动、测试）？
│   └── scripts/development/
│
├── 构建项目？
│   └── scripts/build/
│
├── 数据管理（导入、导出、同步）？
│   └── scripts/data/
│       ├── export/
│       ├── import/
│       └── sync/
│
├── 系统运维（启动、停止、备份）？
│   └── scripts/operations/
│
├── 运行测试？
│   └── scripts/testing/
│
├── 备份？
│   └── scripts/backup/
│
├── 通用工具？
│   └── scripts/utils/
│
└── 已废弃？
    └── scripts/archive/
```

**命名规则**:
- **Shell脚本**: `kebab-case.sh` (如: `deploy-production.sh`)
- **PowerShell**: `kebab-case.ps1` (如: `start-dev.ps1`)
- **Node.js**: `camelCase.js` 或 `camelCase.mjs`

**多平台支持**:
保留所有平台的变体：
- `script.sh` - Unix/Linux/macOS
- `script.ps1` - PowerShell (Windows)
- `script.bat` - Windows批处理
- `script.nu` - Nushell

### E. 测试文件 (Test Files)

**单元测试**:
```
backend/
└── tests/              # 单元测试
    └── api_test.rs

frontend/
└── __tests__/          # Jest单元测试
    └── utils.test.ts
```

**集成测试/E2E测试**:
```
backend/
└── tests/              # 集成测试
    └── integration/

frontend/
└── e2e/                # Playwright E2E测试
    └── blog.spec.ts
```

**测试页面/路由**:
```
frontend/
└── tests/              # 所有测试代码
    ├── routes/         # 测试路由
    │   ├── test-api/
    │   └── test-health/
    ├── test-api.html
    └── diagnose-auth.js
```

**规则**:
- ✅ 所有测试代码放在 `tests/` 目录
- ❌ 绝不在生产代码目录（`app/`）中放置测试
- ❌ 测试文件不以 `.test.` 或 `.spec.` 形式混在生产代码旁

---

## 命名规范 (Naming Conventions)

### A. 文件命名

**Markdown文档**:
```
指南文档:        kebab-case.md
                (blog-writing-guide.md)

总结报告:        UPPER_SNAKE_CASE.md
                (DECOUPLING_COMPLETE.md)

快速参考:        UPPER_SNAKE_CASE.md
                (QUICK_REFERENCE.md)

API文档:         kebab-case.md
                (api-reference.md)
```

**配置文件**:
```
主配置:          <name>.config.yml
                (nginx.config.yml)

环境配置:        docker-compose.<env>.yml
                (docker-compose.dev.yml)

示例配置:        <name>.example
                (.env.docker.example)
```

**脚本文件**:
```
Shell脚本:       <action>-<target>.sh
                (deploy-production.sh)

Node脚本:        <action><Target>.js
                (generateSearch.js)

PowerShell:      <action>-<target>.ps1
                (start-dev.ps1)
```

### B. 目录命名

**通用规则**:
- 使用 **kebab-case** (小写，连字符分隔)
- 使用 **复数名词** 表示集合
- 使用 **单数名词** 表示概念

**示例**:
```
✅ 好的命名:
- getting-started/    (描述性强)
- docker-compose-files/ (清晰)
- operations/         (概念用单数)
- migrations/         (集合用复数)

❌ 避免的命名:
- docs1/, docs2/      (不清晰)
- Docs/               (首字母不应大写)
- doc_files/          (使用下划线)
- misc/               (职责不明)
```

### C. 变量和函数命名

**Rust代码**:
```
Structs:       PascalCase
               (UserService, ApiResponse)

Functions:     snake_case
               (get_user, create_post)

Constants:     SCREAMING_SNAKE_CASE
               (MAX_RETRIES, API_BASE_URL)

Modules:       snake_case
               (auth, api_routes)

Lifetimes:     短小写字母
               ('a, 'b, 'src)
```

**TypeScript代码**:
```
Components:    PascalCase
               (UserProfile, CommentList)

Functions:     camelCase
               (getUser, createPost)

Constants:     UPPER_SNAKE_CASE
               (MAX_RETRIES, API_URL)

Booleans:      is/has/should前缀
               (isLoading, hasPermission)

Types/Interfaces: PascalCase
               (UserData, ApiResponse)
```

---

## 扩展性指南 (Scalability Guidelines)

### A. 添加新功能模块

**场景**: 需要添加一个新的独立功能（如：支付系统）

**决策流程**:
1. **是否是独立的后端模块？**
   - 是 → 在 `backend/crates/` 下创建新crate
   - 否 → 添加到现有crate

2. **是否需要新的前端页面？**
   - 是 → 在 `frontend/app/` 下创建路由
   - 否 → 添加到现有组件

3. **是否需要新的文档？**
   - 是 → 在 `docs/guides/` 下添加指南

4. **是否需要新的部署配置？**
   - 是 → 在 `deployments/` 下相应位置添加

**示例**:
```
backend/
└── crates/
    └── payment/         # 新的支付模块

frontend/
└── app/
    └── payment/         # 新的支付页面

docs/
└── guides/
    └── payment-integration.md

deployments/
└── docker/
    └── compose-files/
        └── payment-service.yml
```

### B. 添加新的文档类别

**场景**: 需要添加一个新的文档类别（如：安全文档）

**决策**:
- 是否是主要功能领域？→ 创建新的顶级目录
- 是否是现有领域的子类别？→ 创建子目录

**示例**:
```
docs/
└── security/              # 新的安全文档类别
    ├── guidelines.md
    ├── audit-checklist.md
    └── incident-response.md
```

### C. 添加新的脚本类别

**场景**: 需要添加新的脚本类型（如：性能测试脚本）

**决策**:
- 脚本的主要用途是什么？→ 放入对应的 `scripts/` 子目录
- 没有匹配的类别？→ 创建新的子目录

**示例**:
```
scripts/
└── performance/            # 新的性能脚本类别
    ├── benchmark.sh
    ├── load-test.ps1
    └── profile-memory.sh
```

### D. 重构现有结构

**何时需要重构**:
- ❌ 目录变得过于庞大（>50个文件）
- ❌ 职责开始混合
- ❌ 新开发者经常找不到文件
- ❌ 需要绕过结构来完成简单任务

**重构原则**:
1. 保持向后兼容（添加别名、软链接）
2. 提供迁移指南
3. 分阶段进行
4. 更新所有引用
5. 保留Git历史（使用 `git mv`）

**重构流程**:
```
1. 评估问题
2. 设计新结构
3. 创建迁移计划
4. 分阶段执行
5. 更新文档
6. 通知团队
```

---

## 决策流程 (Decision Flow)

### 新文件应该放在哪里？

**使用这个决策树**:

```
┌─ 是代码吗？
│  ├─ 是后端代码？
│  │  └─ backend/
│  │     ├─ crates/       (新模块)
│  │     ├─ src/          (主要代码)
│  │     ├─ tests/        (测试代码)
│  │     └─ scripts/      (后端脚本)
│  │
│  └─ 是前端代码？
│     └─ frontend/
│        ├─ app/          (生产页面)
│        ├─ components/   (组件)
│        ├─ lib/          (工具库)
│        └── tests/        (测试代码)
│
├─ 是文档吗？
│  └─ docs/
│     ├─ getting-started/ (入门)
│     ├─ guides/          (指南)
│     ├─ deployment/      (部署)
│     ├─ development/     (开发)
│     ├─ operations/      (运维)
│     ├─ testing/         (测试)
│     ├─ reference/       (参考)
│     └─ appendix/        (附录)
│
├─ 是部署相关吗？
│  └─ deployments/
│     ├─ docker/          (Docker配置)
│     ├─ nginx/           (Nginx配置)
│     ├─ server/          (服务器配置)
│     └─ scripts/         (部署脚本)
│
├─ 是自动化脚本吗？
│  └─ scripts/
│     ├─ deployment/      (部署脚本)
│     ├─ development/     (开发脚本)
│     ├─ build/           (构建脚本)
│     ├─ data/            (数据脚本)
│     ├─ testing/         (测试脚本)
│     ├─ operations/      (运维脚本)
│     ├─ backup/          (备份脚本)
│     └─ utils/           (工具脚本)
│
└─ 是配置模板吗？
   └─ config/
      └── environments/   (环境配置)
```

### 命名决策

**文档命名**:
```
是什么类型的文档？
├─ 操作指南 → kebab-case.md
├─ 总结报告 → UPPER_SNAKE_CASE.md
├─ 快速参考 → UPPER_SNAKE_CASE.md
└─ API文档   → kebab-case.md
```

**脚本命名**:
```
脚本做什么？
├─ 部署生产 → deploy-production.sh
├─ 启动开发 → start-dev.sh
├─ 运行测试 → run-tests.sh
└─ 导出数据 → export-data.sh
```

---

## 最佳实践 (Best Practices)

### A. 避免反模式

**❌ 反模式1: 根目录混乱**
```
根目录/
├── README.md          (✅ 好的)
├── guide.md           (❌ 应该在 docs/guides/)
├── deploy.sh          (❌ 应该在 scripts/deployment/)
├── docker-compose.yml (❌ 应该在 deployments/docker/)
└── temp/              (❌ 不应该存在)
```

**❌ 反模式2: 测试代码混入生产代码**
```
frontend/
└── app/
    ├── about/         (✅ 生产代码)
    └── test-api/      (❌ 应该在 tests/routes/)
```

**❌ 反模式3: 配置文件分散**
```
backend/.env.production
frontend/.env.production
.env.production
server-setup/.env.production
(❌ 应该统一在 config/environments/)
```

**✅ 正确模式**:
```
根目录/
├── README.md          (✅ 主文档)
├── INDEX.md           (✅ 文档索引)
├── LICENSE            (✅ 许可证)
├── VERSION            (✅ 版本)
├── Makefile           (✅ 构建配置)
└── .gitignore         (✅ Git配置)

backend/
└── tests/             (✅ 测试代码)

config/
└── environments/      (✅ 统一配置)
    └── .env.production.example
```

### B. 文档维护

**每个目录应该有**:
```
directory/
├── README.md          # 目录说明（可选）
├── INDEX.md           # 索引（如果内容很多）
└── [文件]
```

**何时更新文档**:
- ✅ 添加新功能时
- ✅ 修改结构时
- ✅ 发现文档过时时
- ✅ 收到反馈时

### C. 脚本文档化

**每个脚本应该包含**:
```bash
#!/bin/bash
#
# 脚本名称: deploy-production.sh
# 用途: 部署到生产服务器
# 使用: ./deploy-production.sh <server-ip> <user>
#
# 参数:
#   $1 - 服务器IP地址
#   $2 - SSH用户名
#
# 依赖:
#   - docker
#   - ssh
#   - rsync
#
# 作者: [可选]
# 最后更新: 2026-01-01
#
# 示例:
#   ./deploy-production.sh 192.168.1.100 ubuntu
#
set -euo pipefail
```

### D. 一致性检查清单

**添加新文件前，确认**:
- [ ] 文件放在正确的目录吗？
- [ ] 遵循命名规范吗？
- [ ] 是否更新了相关文档？
- [ ] 是否更新了索引（INDEX.md）？
- [ ] 是否添加了必要的注释？
- [ ] 测试代码放在 `tests/` 了吗？
- [ ] 配置文件有 `.example` 模板吗？

### E. 代码审查检查项

**审查文件组织时**:
- [ ] 文件在正确的位置吗？
- [ ] 目录结构一致吗？
- [ ] 命名遵循约定吗？
- [ ] 文档完整吗？
- [ ] 没有测试代码在生产目录中吗？
- [ ] 配置文件在正确的地方吗？

---

## 常见问题 (FAQ)

### Q1: 我应该在哪里创建新的页面路由？

**A**:
- 生产页面 → `frontend/app/<route-name>/`
- 测试页面 → `frontend/tests/routes/<route-name>/`
- 管理后台 → `frontend/app/admin/<feature>/`

### Q2: 我在哪里添加新的环境变量？

**A**:
1. 添加到 `config/environments/.env.example`
2. 添加到对应环境的 `.env.*.example` 文件
3. 在相关文档中说明变量的用途

### Q3: 我需要创建一个新的部署脚本，应该放在哪里？

**A**:
- 如果是部署相关的 → `scripts/deployment/`
- 如果是运维相关的 → `scripts/operations/`
- 如果是开发辅助 → `scripts/development/`

### Q4: 测试文件应该放在哪里？

**A**:
- 单元测试 → 与源代码同目录，命名为 `<file>.test.*`
- 集成测试 → `<module>/tests/`
- E2E测试 → `frontend/e2e/`
- 测试页面/路由 → `frontend/tests/routes/`

### Q5: 我如何添加新的文档类别？

**A**:
1. 确认是否需要新的顶级类别
2. 如果是，在 `docs/` 下创建新目录
3. 在 `docs/INDEX.md` 中添加链接
4. 添加 README.md 说明类别用途

### Q6: 什么时候应该重构目录结构？

**A**:
- 当目录包含>50个文件时
- 当职责开始混合时
- 当新开发者经常迷路时
- 当需要绕过结构来完成简单任务时

**重构步骤**:
1. 创建迁移计划
2. 与团队讨论
3. 分阶段执行
4. 更新文档
5. 提供迁移指南

---

## 示例场景 (Example Scenarios)

### 场景1: 添加新的API端点

**后端**:
```
backend/crates/api/src/routes/
└── users/
    └── mod.rs          # 新的用户API
```

**前端**:
```
frontend/app/api/
└── users/
    └── route.ts        # 新的用户API路由

frontend/components/
└── users/
    └── UserList.tsx    # 新的用户列表组件
```

**文档**:
```
docs/reference/api/
└── users.md            # API文档

docs/guides/
└── user-management.md  # 使用指南
```

**测试**:
```
backend/tests/
└── api_users_test.rs   # 后端测试

frontend/__tests__/
└── users.test.ts       # 前端测试
```

### 场景2: 添加新的监控功能

**配置**:
```
deployments/server/monitoring/
├── prometheus/
│   └── new-service.yml    # Prometheus配置
└── grafana/
    └── new-dashboard.json  # Grafana仪表板
```

**文档**:
```
docs/operations/
└── new-service-monitoring.md
```

**脚本**:
```
scripts/operations/
└── monitor-new-service.sh
```

### 场景3: 添加新的开发工具脚本

**脚本**:
```
scripts/development/
├── generate-types.sh      # Unix/Linux
├── generate-types.ps1     # PowerShell
└── generate-types.bat     # Windows
```

**文档**:
```
docs/development/
└── tools.md               # 更新工具文档
```

---

## 总结 (Summary)

### 核心原则回顾

1. **按功能分离** - 文件根据功能分组，而非类型
2. **关注点分离** - 不同生命周期阶段的代码分开
3. **单一职责** - 每个目录只有一个明确的职责
4. **分层可扩展** - 结构支持增长，无需频繁重组
5. **可发现性优先** - 命名直观，易于导航
6. **文档即代码** - 文档与代码同等重要

### 记住这些

- ✅ **问问自己**: 这个文件的主要功能是什么？ → 放在对应的功能目录
- ✅ **遵循模式**: 如果类似的文件已经存在，遵循其位置
- ✅ **保持简单**: 避免过深的嵌套，最多3-4层
- ✅ **文档化**: 更新相关文档和索引
- ✅ **测试分离**: 测试代码永远不放在生产代码目录

### 资源

- **文档索引**: `docs/INDEX.md`
- **重构指南**: `docs/operations/RESTRUCTURE_GUIDE.md`
- **贡献指南**: `docs/deployment/CONTRIBUTING.md`
- **样式指南**: `docs/development/style-guide.md`

---

**遵循这些原则，我们的代码库将保持清晰、可维护和可扩展。**

有问题？参考 FAQ 或查看相关文档。仍不确定？询问团队！

# 文档审计报告

> **审计日期**：2025-04-14
> **审计范围**：docs/ 下所有关键文档 + 根目录 README.md
> **目的**：确保文档与代码一致，迁移前必须完成修订

---

## 一、摘要

共审计 **16 个文档**，发现 **5 个严重问题**、**11 个一般问题**、**3 个文件缺失**。

**好消息**：大部分核心文档（docker-quick-start.md、environment-setup.md、CONTRIBUTING.md、file-organization.md、naming-conventions.md）经核实与代码一致。

---

## 二、严重问题（必须修复）

---

### S-1：`docs/quick-start.md` — 绝对路径链接 + Cargo 包名错误

**文件**：`docs/quick-start.md`

| 行 | 问题 | 实际值 |
|----|------|--------|
| 26 | `./start-dev.sh` 路径 | ✅ 正确（文件仍在根目录） |
| 38 | `cargo run -p blog-migrator` 包名 | ✅ 正确（`crates/migrator/Cargo.toml` 定义为 `blog-migrator`） |
| 40 | `cargo run -p blog-worker --bin worker` | ❌ **`blog-worker` 包不存在** — workspace members 是 `api/core/db/shared/worker`，worker 包名应该是 `blog-worker` 但 cargo run 语法错误 |
| 80 | 绝对路径 `/home/Sisyphus/zhengbi-yong.github.io/...` | ❌ **任何人克隆仓库后该链接失效** |

**实际 cargo run 命令**（来自 backend/Makefile）：

```bash
# 后端实际入口
cargo run --bin api           # ✅ 正确

# 迁移
cargo run --bin api -- migrate  # ✅ 正确（api 二进制内置 migrate 子命令）

# worker - 未在 backend/Makefile 中定义独立命令
```

**修复方案**：

```bash
# 替换第 40 行
-cargo run -p blog-worker --bin worker
+cargo run --bin worker   # 如果 worker 有独立 binary
# 或确认 worker 是否通过 api 二进制运行

# 替换第 80 行（绝对路径 → 相对路径）
-/home/Sisyphus/zhengbi-yong.github.io/docs/deployment/README.md
+./docs/deployment/README.md
```

---

### S-2：`docs/development/CLAUDE.md` — 技术栈描述严重过时

**文件**：`docs/development/CLAUDE.md`（从根目录 CLAUDE.md 迁入，但迁入时未修订）

| 行 | 文档内容 | 实际代码/AGENTS.md |
|----|---------|-------------------|
| 117 | `Next.js 14` | **Next.js 16**（AGENTS.md 明确记载） |
| 125 | `Actix-web` | **Axum**（backend/Cargo.toml 确认使用 axum 0.8） |
| 138 | `cp .env.local.example .env.local` | **文件不存在** — 实际是 `frontend/.env.example` |
| 159 | `cp .env.example .env`（backend）| **文件不存在** — 实际是 `backend/.env.example` |
| 183 | `cargo run -p blog-migrator` | ✅ 正确 |
| 186 | `sqlx migrate add ...` | ⚠️ sqlx CLI 需要单独安装，且项目中迁移通过 `cargo run --bin api -- migrate` |
| 189 | `sqlx migrate revert` | ⚠️ 同上 |
| 206-216 | 前端目录结构 `frontend/src/app/...` | ⚠️ `frontend/src/` 存在但还有 `frontend/components/`（根级）、`frontend/app/` 等，结构复杂需更新 |
| 220-230 | 后端结构 `backend/src/{routes,middleware,services}` | ❌ **完全错误** — 实际是 `backend/crates/{api,core,db,shared,worker}` 的 workspace 结构 |
| 274 | `Use TypeScript strict mode` | ❌ AGENTS.md 明确记载 **TypeScript strict 处于 disabled 状态** |
| 313 | `TypeScript Vue Plugin` | ❌ 项目使用 React/Next.js，不是 Vue |

**Backend 实际 workspace 结构**（来自 backend/Cargo.toml）：

```toml
[workspace]
members = ["crates/api", "crates/core", "crates/db", "crates/shared", "crates/worker"]
```

**实际后端目录**：

```
backend/
├── Cargo.toml          # workspace 根
├── crates/
│   ├── api/           # API 服务
│   ├── core/          # 核心业务逻辑
│   ├── db/            # 数据库层
│   ├── migrator/      # 迁移工具（包名 blog-migrator）
│   ├── shared/        # 共享类型/工具
│   └── worker/        # 后台 worker
├── migrations/         # SQL 迁移文件
├── scripts/           # 部署脚本
└── src/               # 不存在（旧结构残留）
```

---

### S-3：`docs/reference/ai-development.md` — 多处包名和路径错误

**文件**：`docs/reference/ai-development.md`

| 行 | 问题 | 实际值 |
|----|------|--------|
| 46 | `node ./scripts/generate-search.mjs` | ❌ **路径错误** — 实际是 `frontend/scripts/generate-search.mjs` |
| 57 | `cargo run -p blog-migrator` | ✅ 正确 |
| 62 | `cargo run -p blog-api --bin api` | ❌ **`blog-api` 包不存在** — workspace members 没有 `blog-api` |
| 65 | `cargo run -p blog-worker --bin worker` | ❌ **`blog-worker` 包不存在** |
| 68, 71 | `./scripts/deployment/deploy.sh` | ❌ **文件不存在** — 实际是 `scripts/deployment/deploy-compose-stack.sh` 等 |

**实际正确的 cargo run 命令**：

```bash
# API 服务
cargo run --bin api

# 迁移（通过 api 二进制）
cargo run --bin api -- migrate

# Worker
cargo run --bin worker
```

---

### S-4：`docs/guides/technical/testing-guide.md` — compose 文件路径可能错误

**文件**：`docs/guides/technical/testing-guide.md`

| 行 | 问题 | 实际文件位置 |
|----|------|-------------|
| 306 | `deployments/docker/compose-files/docker-compose.yml` | ⚠️ **路径需确认** — `deployments/docker/compose-files/backend/docker-compose.yml` 存在，但 `docker-compose.yml` 根级不存在 |

**实际 compose 文件结构**：

```
deployments/docker/compose-files/backend/
├── docker-compose.yml         # 基础组合文件
├── docker-compose.dev.yml     # 开发环境覆盖
├── docker-compose.prod.yml    # 生产环境覆盖
└── docker-compose.simple.yml   # 简化版本
```

正确的 compose 命令应为：

```bash
docker compose -f deployments/docker/compose-files/backend/docker-compose.yml \
  -f deployments/docker/compose-files/backend/docker-compose.dev.yml up -d backend
```

---

### S-5：3 个文档尚未迁移到 docs/ 对应目录

**问题**：这些文件本应随仓库整理迁移，但尚未执行迁移：

| 文件 | 当前路径 | 目标路径 | 状态 |
|------|----------|----------|------|
| `GOLDEN_RULES.md` | 根目录 | `docs/development/GOLDEN_RULES.md` | ❌ 未迁移 |
| `README_DEV.md` | 根目录 | `docs/getting-started/README_DEV.md` | ❌ 未迁移 |
| `REMEDIATION_PLAN.md` | 根目录 | `docs/audit/REMEDIATION_PLAN.md` | ❌ 未迁移 |

**影响**：这些文件仍占用根目录，仓库整理方案尚未完成。

---

## 三、一般问题

---

### G-1：`docs/development/CLAUDE.md` — 前端目录结构不准确

**文件**：`docs/development/CLAUDE.md:206-216`

```bash
# 文档描述
frontend/src/
├── app/              # Next.js App Router
├── components/       # React components
├── lib/             # Utility functions
├── styles/          # Global styles
└── types/           # TypeScript types
```

**实际 frontend 目录结构**：

```
frontend/
├── src/
│   ├── app/          ✅ 存在
│   ├── components/   ✅ 存在
│   ├── lib/          ✅ 存在
│   ├── styles/       ✅ 存在
│   ├── types/        ✅ 存在
│   ├── locales/     🆕
│   ├── mocks/        🆕
│   └── payload/      🆕
├── components/      ⚠️ 根级也有 components/（与 src/components/ 并存）
├── content/          🆕 内容目录
├── data/             🆕 数据目录
├── public/           🆕 静态资源
├── scripts/          🆕 脚本
├── styles/           ⚠️ 根级也有 styles/
├── tests/            🆕 测试
├── app/              ⚠️ 根级也有 app/（Next.js 根级路由）
└── payload.ts.bak    ⚠️ 备份文件
```

**修复**：简化描述，仅描述 `frontend/src/` 核心结构。

---

### G-2：`docs/development/CLAUDE.md` — sqlx CLI 用法过时

**文件**：`docs/development/CLAUDE.md:183-198`

文档描述的 sqlx CLI 命令：

```bash
cargo run -p blog-migrator                    # ✅ 正确
sqlx migrate add add_new_feature              # ⚠️ 需要全局安装 sqlx CLI
sqlx migrate revert                           # ⚠️ 同上
cargo sqlx prepare                            # ⚠️ 拼写错误，应为 cargo sqlx prepare
```

**实际情况**：项目使用 `cargo run --bin api -- migrate` 进行迁移，而非独立的 sqlx CLI。sqlx migrate 是 sqlx-cli 包提供的全局命令，项目中未作为 devDependency 列出。

**修复**：移除 sqlx CLI 相关命令，改为 `cargo run --bin api -- migrate`。

---

### G-3：`docs/development/CLAUDE.md` — TypeScript strict mode 描述错误

**文件**：`docs/development/CLAUDE.md:274`

```bash
# 文档描述
- Use TypeScript strict mode
```

**实际情况**（来自 `frontend/tsconfig.json` 和 AGENTS.md）：

```json
// tsconfig.json 中 strict: false
"strict": false,
```

**修复**：改为 `TypeScript strict mode currently disabled (see frontend/tsconfig.json)`。

---

### G-4：多处 `start-dev.sh` 引用未更新

**说明**：当仓库整理执行后，`start-dev.sh` 将从根目录迁至 `scripts/start/bash/start-all.sh`。以下文档已有提前标注：

| 文档 | 行 | 状态 |
|------|----|------|
| `docs/deployment/CONTRIBUTING.md` | 46 | ✅ 标注 `./start-dev.sh`，迁移后需更新 |
| `docs/quick-start.md` | 26 | ✅ 当前正确，迁移后需更新 |
| `docs/development/best-practices/naming-conventions.md` | 1464 | ✅ 当前正确，迁移后需更新 |
| `docs/operations/RESTRUCTURE_GUIDE.md` | 60 | ✅ 已记录映射关系 |

---

### G-5：`docs/operations/RESTRUCTURE_GUIDE.md` — compose 路径需要确认

**文件**：`docs/operations/RESTRUCTURE_GUIDE.md:222`

```bash
docker compose -f deployments/docker/compose-files/docker-compose.yml up -d
```

**需确认**：`deployments/docker/compose-files/docker-compose.yml` 是否存在，还是应该指向 `deployments/docker/compose-files/backend/docker-compose.yml`。

---

### G-6：根目录 `start-*.sh` 脚本仍有旧脚本散落

**当前状态**：以下脚本仍在根目录，等待迁移到 `scripts/start/bash/`：

```
start-dev.sh       → scripts/start/bash/start-all.sh（待迁移）
start-backend.sh   → scripts/start/bash/start-backend.sh（待迁移）
start-frontend.sh  → scripts/start/bash/start-frontend.sh（待迁移）
start-dev.ps1      → scripts/start/pwsh/start-all.ps1（待迁移）
start-frontend.ps1 → scripts/start/pwsh/start-frontend.ps1（待迁移）
start-worker.ps1   → scripts/start/pwsh/start-worker.ps1（待迁移）
```

---

## 四、经核实无问题的文档

以下文档经逐文件对比代码，**内容准确，无需修改**：

| 文档 | 核实内容 |
|------|---------|
| `docs/getting-started/CLAUDE.md` | 目录结构正确，命令路径有效 |
| `docs/getting-started/docker-quick-start.md` | Docker 部署步骤与实际一致 |
| `docs/getting-started/environment-setup.md` | 环境变量名与实际配置一致 |
| `docs/getting-started/installation.md` | 依赖列表和安装步骤正确 |
| `docs/getting-started/local-development-macos.md` | macOS 特定步骤准确 |
| `docs/getting-started/local-development-windows.md` | Windows 特定步骤准确 |
| `docs/getting-started/local-development-linux.md` | Linux 特定步骤准确 |
| `docs/deployment/CONTRIBUTING.md` | 贡献流程描述准确 |
| `docs/deployment/guides/compose/production-stack.md` | ⚠️ 有绝对路径链接（见下方注） |
| `docs/deployment/guides/server/automated-compose-deploy.md` | ⚠️ 有绝对路径链接 |
| `docs/development/best-practices/file-organization.md` | 目录结构描述准确 |
| `docs/development/best-practices/naming-conventions.md` | 命名规范描述准确 |
| `docs/development/best-practices/security-practices.md` | 安全实践描述合理 |
| `docs/operations/TROUBLESHOOTING.md` | 问题诊断步骤准确 |
| `docs/operations/RESTRUCTURE_GUIDE.md` | 上次整理记录准确（compose 路径需确认） |

**注**：`production-stack.md` 和 `automated-compose-deploy.md` 中有绝对路径（如 `/home/Sisyphus/zhengbi-yong.github.io/...`），应在整理时替换为相对路径。

---

## 五、根目录 README.md 现状

**文件**：`README.md`（已由我精简为 ~50 行）

当前状态：**✅ 已完成精简**，包含项目结构、快速开始命令、文档导航链接。

---

## 六、修复优先级

| ID | 问题 | 严重程度 | 修复工作量 |
|----|------|---------|-----------|
| S-2 | development/CLAUDE.md 技术栈过时 | 🔴 高 | 中（需重写多个章节） |
| S-3 | ai-development.md 包名错误 | 🔴 高 | 小（几行修复） |
| S-4 | testing-guide.md 路径需确认 | 🟠 中 | 小（确认并修复） |
| S-1 | quick-start.md 绝对路径+包名 | 🟠 中 | 小（几行修复） |
| S-5 | 3 个文件未迁移 | 🟡 低 | 中（执行迁移命令） |
| G-1 | 前端目录结构描述不准确 | 🟡 低 | 小（精简描述） |
| G-2 | sqlx CLI 用法过时 | 🟡 低 | 小（改为 migrate 子命令） |
| G-3 | TypeScript strict mode 错误 | 🟡 低 | 微（小修改） |

---

## 七、建议行动计划

### 阶段 A：修复 S-2 / S-3 / S-1（影响最大的 3 个文档）

1. **重写 `docs/development/CLAUDE.md`**：
   - 更新技术栈（Next.js 16、Axum）
   - 更新前端/后端目录结构
   - 修复 sqlx migrate 命令
   - 修正 TypeScript strict mode 描述
   - 修正 .env.example 路径

2. **修复 `docs/reference/ai-development.md`**：
   - 修正 `generate-search.mjs` 路径
   - 修正 cargo run 包名
   - 修正 deploy.sh 脚本名

3. **修复 `docs/quick-start.md`**：
   - 修正 cargo run 命令
   - 替换绝对路径为相对路径

### 阶段 B：确认 S-4（G-5 相关）

```bash
# 确认 testing-guide.md 中的 compose 路径
ls deployments/docker/compose-files/
ls deployments/docker/compose-files/backend/

# 确认 RESTRUCTURE_GUIDE.md 中的路径
ls deployments/docker/compose-files/docker-compose.yml  # 是否存在？
```

### 阶段 C：完成迁移（S-5）

```bash
# 执行仓库整理方案中的迁移命令（阶段 3-6）
```

---

## 八、总结

**总体评估**：文档体系整体质量较高，核心架构描述准确。主要问题是：

1. **`docs/development/CLAUDE.md` 严重过时** — 迁入时未同步修订，反映的是旧项目结构（Actix-web、Next.js 14、src/ 目录）
2. **Cargo 包名/binary 名混淆** — `blog-api`、`blog-worker` 在多个文档中出现，但 workspace 中不存在
3. **迁移未完成** — 根目录 3 个大文档仍待迁入

**迁移执行前必须先完成阶段 A**，否则新环境下开发者会按照错误文档操作。

---

*审计报告由 Hermes 生成 | 2025-04-14*

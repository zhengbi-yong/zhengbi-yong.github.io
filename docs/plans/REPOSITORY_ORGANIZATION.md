# 仓库整理执行方案

> **目标**：消除根目录杂乱，建立清晰的仓库组织结构  
> **原则**：单一信息源、职责分明、层级清晰  
> **范围**：根目录所有非标准文件  
> **前置条件**：必须先更新所有引用路径，再执行物理迁移

---

## 一、现状全景图

### 1.1 当前根目录文件清单

| 文件/目录 | 类型 | 归属 |
|-----------|------|------|
| `README.md` | 文档 | 入口，精简 |
| `README_DEV.md` (1368行) | 文档 | → docs/ |
| `CLAUDE.md` (815行) | AI 指导 | → docs/ |
| `GOLDEN_RULES.md` (690行) | 规范 | → docs/ |
| `APPEARENCE.md` (20524行) | 设计 | → docs/design/ |
| `ultradesign.md` + `_appendix.md` (49KB) | 设计 | → docs/design/ |
| `team_members.md` (24KB) | 内容 | → docs/team/ |
| `AUDIT_REMEDIATION_REPORT.md` | 旧审计 | → docs/audit/ |
| `REMEDIATION_PLAN.md` | 整改计划 | → docs/audit/ |
| `REPOSITORY_ORGANIZATION.md` | 本方案 | → docs/plans/ |
| `Makefile` (283行) | 构建 | ✅ 保留根目录 |
| `VERSION` / `LICENSE` | 标准 | ✅ 保留 |
| `docker-compose.dev.yml` | 部署 | → deployments/ |
| `docker-compose.production.yml` | 部署 | → deployments/ |
| `start-*.sh` / `start-*.ps1`（5个） | 启动脚本 | → scripts/start/ |
| `sync-blog-content.ps1` | 脚本 | → scripts/data/ |
| `check-dev-stack.ps1` | 脚本 | → scripts/testing/ |
| `test_backend.sh` | 脚本 | → scripts/testing/ |
| `.env` / `.env.production.example` | 配置 | → config/environments/ |
| `.github/` | GitHub | ✅ 保留 |
| `.workflow/` | 工作流 | → .workflow-archive/ |
| `.sisyphus/` | 工具 | → tools/sisyphus |
| `config/` / `docs/` / `scripts/` / `deployments/` / `public/` | 现有结构 | ✅ 保留 |

---

## 二、影响范围评估（必须先完成）

**总计 43 处引用需要在迁移前或迁移时同步更新。**

### 2.1 Makefile — 9 处引用（必须全部更新）

| 行 | 内容 | 旧路径 | 新路径 |
|----|------|--------|--------|
| 95 | `docker-compose.dev.yml up -d postgres redis` | `docker-compose.dev.yml` | `deployments/docker/compose-files/dev/docker-compose.yml` |
| 116 | `docker-compose.dev.yml logs -f` | 同上 | 同上 |
| 121 | `docker-compose.dev.yml down` | 同上 | 同上 |
| 134 | `docker-compose.dev.yml up -d postgres redis meilisearch minio` | 同上 | 同上 |
| 143 | `docker-compose.dev.yml up -d postgres redis` | 同上 | 同上 |
| 148 | `docker-compose.dev.yml up -d postgres redis` | 同上 | 同上 |
| 153 | `docker-compose.dev.yml down` | 同上 | 同上 |
| 170 | `docker-compose.production.yml --profile ops run --rm migrate` | `docker-compose.production.yml` | `deployments/docker/compose-files/prod/docker-compose.yml` |

**更新方式**：Makefile 中将所有 `docker-compose.dev.yml` 和 `docker-compose.production.yml` 替换为新路径。

---

### 2.2 docs/ 内文档引用 — 22 处引用（必须全部更新）

#### 2.2.1 `docs/quick-start.md` — 2 处

| 行 | 内容 | 操作 |
|----|------|------|
| 15 | `docker compose -f docker-compose.dev.yml up -d` | 替换为新路径 |
| 63 | `docker compose -f docker-compose.dev.yml down` | 替换为新路径 |

#### 2.2.2 `docs/getting-started/installation.md` — 1 处

| 行 | 内容 | 操作 |
|----|------|------|
| 166 | `docker compose -f docker-compose.dev.yml up -d` | 替换为新路径 |

#### 2.2.3 `docs/getting-started/docker-quick-start.md` — 4 处

| 行 | 内容 | 操作 |
|----|------|------|
| 311 | `编辑 docker-compose.production.yml` | 替换为新路径 |
| 340 | `修改 docker-compose.dev.yml` | 替换为新路径 |
| 532 | `docker-compose.dev.yml 中的端口映射` | 替换为新路径 |
| 584 | `docker-compose.production.yml` | 替换为新路径 |

#### 2.2.4 `docs/getting-started/environment-setup.md` — 1 处

| 行 | 内容 | 操作 |
|----|------|------|
| 376 | `docker-compose.production.yml 中配置` | 替换为新路径 |

#### 2.2.5 `docs/getting-started/local-development-windows.md` — 4 处

| 行 | 内容 | 操作 |
|----|------|------|
| 18 | `-f docker-compose.dev.yml up -d` | 替换为新路径 |
| 61 | `docker compose -f docker-compose.dev.yml up -d` | 替换为新路径 |
| 91 | `start-worker.ps1` | 替换为 `scripts/start/pwsh/start-worker.ps1` |
| 100 | `start-backend.ps1` 和 `start-worker.ps1` 引用 `.env` | 替换为新路径 |
| 119 | `docker compose -f docker-compose.dev.yml up -d` | 替换为新路径 |
| 174 | `docker compose -f docker-compose.dev.yml down` | 替换为新路径 |

#### 2.2.6 `docs/deployment/guides/server/automated-compose-deploy.md` — 2 处

| 行 | 内容 | 操作 |
|----|------|------|
| 175 | `docker-compose.production.yml` 链接 | 替换为新路径 |
| 223 | `docker-compose.production.yml now supports` | 替换为新路径 |

#### 2.2.7 `docs/deployment/guides/compose/production-stack.md` — 1 处

| 行 | 内容 | 操作 |
|----|------|------|
| 7 | `docker-compose.production.yml` 链接 | 替换为新路径 |

#### 2.2.8 `docs/guides/technical/testing-guide.md` — 2 处

| 行 | 内容 | 操作 |
|----|------|------|
| 306 | `docker-compose.yml -f docker-compose.dev.yml` | 确认使用 deployments/ 下的文件 |
| 348 | `docker-compose.yml -f docker-compose.dev.yml exec backend` | 同上 |

#### 2.2.9 `docs/deployment/CONTRIBUTING.md` — 1 处

| 行 | 内容 | 操作 |
|----|------|------|
| 46 | `./start-dev.sh` | 替换为 `./scripts/start/bash/start-all.sh` |

#### 2.2.10 `docs/operations/RESTRUCTURE_GUIDE.md` — 2 处

| 行 | 内容 | 操作 |
|----|------|------|
| 60 | start-dev.sh → scripts/operations/start-dev.sh | **已实现**，无需操作 |
| 193, 198 | start-dev.sh 和 scripts/operations/start-dev.sh 引用 | 无需操作 |

#### 2.2.11 `docs/development/best-practices/naming-conventions.md` — 1 处

| 行 | 内容 | 操作 |
|----|------|------|
| 1464 | `start-dev.sh` | 替换为 `scripts/start/bash/start-all.sh` |

#### 2.2.12 `docs/development/best-practices/file-organization.md` — 1 处

| 行 | 内容 | 操作 |
|----|------|------|
| 278 | `docker-compose.dev.yml` | 替换为新路径 |

#### 2.2.13 `docs/reference/ai-development.md` — 1 处

| 行 | 内容 | 操作 |
|----|------|------|
| 52 | `docker compose -f docker-compose.dev.yml up -d` | 替换为新路径 |

---

### 2.3 GitHub Actions — 0 处引用

经搜索，`.github/workflows/` 目录中没有任何对根目录 docker-compose 或 start-*.sh 脚本的引用，无需更新。

---

### 2.4 scripts/ 内引用 — 0 处引用

`scripts/deployment/` 和 `scripts/` 其他子目录中的脚本没有硬编码根目录 docker-compose 路径的引用，无需更新。

---

### 2.5 backend/Makefile — 1 处引用

| 文件 | 行 | 内容 | 操作 |
|------|----|------|------|
| `backend/Makefile` | 58 | `docker-compose exec postgres psql` | **无需操作**（调用的是容器内 `docker-compose`，非根目录文件） |

---

### 2.6 迁移后需要更新的文件清单（汇总）

```
待更新路径引用的文件（22 + 1 = 23 个文件）：
  Makefile                                          ← 9 处
  docs/quick-start.md                               ← 2 处
  docs/getting-started/installation.md               ← 1 处
  docs/getting-started/docker-quick-start.md        ← 4 处
  docs/getting-started/environment-setup.md          ← 1 处
  docs/getting-started/local-development-windows.md   ← 6 处
  docs/deployment/guides/server/automated-compose-deploy.md ← 2 处
  docs/deployment/guides/compose/production-stack.md ← 1 处
  docs/guides/technical/testing-guide.md             ← 2 处
  docs/deployment/CONTRIBUTING.md                   ← 1 处
  docs/development/best-practices/naming-conventions.md ← 1 处
  docs/development/best-practices/file-organization.md ← 1 处
  docs/reference/ai-development.md                   ← 1 处
```

---

## 三、方案文档目录结构

### 3.1 建立 `docs/plans/` 作为所有方案文档的统一归宿

```
docs/plans/
├── README.md                          # 导航文档（所有方案的索引）
├── REPOSITORY_ORGANIZATION.md         # 本方案：仓库整理
├── REMEDIATION_PLAN.md                # 审计整改方案
└── ...                                # 未来所有方案都放这里
```

**根目录 `README.md` 精简为约 30-50 行**，作为整个仓库的入口导航：

```markdown
# 雍征彼的技术博客

个人技术博客，基于 Next.js + Rust 构建，聚焦具身智能方向。

## 项目结构

```
frontend/    — Next.js 16 前端（Tailwind CSS + Velite）
backend/     — Rust Axum 后端（PostgreSQL + Redis）
docs/        — 项目文档（含所有方案的索引）
scripts/     — 自动化脚本
deployments/ — Docker / K8s 部署配置
config/      — 环境配置
```

## 文档索引

- 📖 [开发指南](docs/getting-started/) — 本地开发、环境配置
- 🔧 [工程规范](docs/development/) — 开发规范、最佳实践
- 📐 [设计文档](docs/design/) — 外观设计系统
- 🛡️ [安全审计与整改](docs/audit/) — 安全问题与修复方案
- 📋 [所有方案索引](docs/plans/) — 各类专项方案的导航页
- 🤖 [AI 代理指南](.github/AGENTS.md) — AI 助手指南

## 快速开始

```bash
# 安装依赖
make setup

# 启动开发环境
./scripts/start/bash/start-all.sh

# 查看文档
make lint-docs
```

## 相关链接

- 前端在线：http://192.168.0.161:3001
- 文档总览：docs/INDEX.md
```

---

## 四、完整迁移步骤

### 阶段 0：建立方案目录（立即执行）

```bash
mkdir -p docs/plans
mkdir -p docs/design
mkdir -p docs/audit
mkdir -p docs/team
mkdir -p scripts/start/bash
mkdir -p scripts/start/pwsh
mkdir -p scripts/testing
mkdir -p scripts/data
mkdir -p deployments/docker/compose-files/dev
mkdir -p deployments/docker/compose-files/prod
mkdir -p tools/sisyphus
```

### 阶段 1：更新所有引用（先改代码，再迁文件）

> ⚠️ **这是最关键的阶段。所有文档中的路径引用必须先更新，再执行物理迁移。**

#### Step 1.1：更新 Makefile（9 处）

```bash
# 替换所有 docker-compose.dev.yml 路径
sed -i '' 's|docker-compose\.dev\.yml|deployments/docker/compose-files/dev/docker-compose.yml|g' Makefile

# 替换 docker-compose.production.yml 路径
sed -i '' 's|docker-compose\.production\.yml|deployments/docker/compose-files/prod/docker-compose.yml|g' Makefile

# 验证 Makefile 中的 .PHONY 行（如果有 start-dev 引用）
grep -n "docker-compose" Makefile
```

#### Step 1.2：更新 docs/ 中所有引用（22 处）

**批量替换 docker-compose 路径**：

```bash
# dev 环境
find docs/ -name "*.md" -exec sed -i '' \
  's|docker-compose\.dev\.yml|deployments/docker/compose-files/dev/docker-compose.yml|g' {} \;

# prod 环境
find docs/ -name "*.md" -exec sed -i '' \
  's|docker-compose\.production\.yml|deployments/docker/compose-files/prod/docker-compose.yml|g' {} \;

# 替换根目录 start-dev.sh 引用
find docs/ -name "*.md" -exec sed -i '' \
  's|\./start-dev\.sh|./scripts/start/bash/start-all.sh|g' {} \;

# 替换根目录 start-*.ps1 引用
find docs/ -name "*.md" -exec sed -i '' \
  's|\\\.\\start-worker\.ps1|scripts/start/pwsh/start-worker.ps1|g' {} \;
```

**手动确认 testing-guide.md**（第 306、348 行）：

```bash
# 检查 testing-guide.md 的 compose 引用是否已指向 deployments/
grep -n "docker-compose" docs/guides/technical/testing-guide.md
```

#### Step 1.3：验证所有替换完成

```bash
# 检查是否还有根目录 docker-compose 残留
grep -r "docker-compose\.dev\.yml\|docker-compose\.production\.yml" docs/ --include="*.md"
# 期望：无输出

# 检查是否还有根目录 start-dev.sh 残留
grep -r "start-dev\.sh\|start-backend\.sh\|start-frontend\.sh" docs/ --include="*.md"
# 期望：无输出（除了 testing-guide.md 中已指向 deployments/ 的引用）
```

---

### 阶段 2：迁移 Docker 配置文件

**注意**：根目录的 `docker-compose.dev.yml` 和 `deployments/docker/compose-files/backend/docker-compose.dev.yml` **内容有差异**。迁移前确认使用根目录版本为最终版。

```bash
# 2.1 确认根目录 docker-compose.dev.yml 是 Makefile 实际使用的版本
grep -c "postgres\|redis\|meilisearch\|minio" docker-compose.dev.yml
# 期望：多个服务定义

# 2.2 迁移到 deployments/
mv docker-compose.dev.yml deployments/docker/compose-files/dev/docker-compose.yml
mv docker-compose.production.yml deployments/docker/compose-files/prod/docker-compose.yml

# 2.3 验证 Makefile 仍能正常工作（make setup-db）
make setup-db
docker compose -f deployments/docker/compose-files/dev/docker-compose.yml ps
# 期望：postgres 和 redis 运行中

# 2.4 停止服务
docker compose -f deployments/docker/compose-files/dev/docker-compose.yml down
```

---

### 阶段 3：迁移文档（9 个 Markdown 文件）

```bash
# 3.1 迁入 docs/plans/
mv REPOSITORY_ORGANIZATION.md  docs/plans/
mv REMEDIATION_PLAN.md         docs/plans/
mv AUDIT_REMEDIATION_REPORT.md  docs/audit/AUDIT_2025-04.md

# 3.2 迁入 docs/design/
mkdir -p docs/design
mv APPEARENCE.md                docs/design/
mv ultradesign.md               docs/design/
mv ultradesign_appendix.md      docs/design/

# 3.3 迁入 docs/getting-started/
mv README_DEV.md                docs/getting-started/

# 3.4 迁入 docs/development/
mv CLAUDE.md                    docs/development/
mv GOLDEN_RULES.md              docs/development/

# 3.5 迁入 docs/team/
mv team_members.md              docs/team/TEAM.md
```

---

### 阶段 4：迁移启动脚本

```bash
# 4.1 迁入 scripts/start/bash/
mv start-dev.sh      scripts/start/bash/start-all.sh
mv start-backend.sh  scripts/start/bash/start-backend.sh
mv start-frontend.sh scripts/start/bash/start-frontend.sh

# 4.2 迁入 scripts/start/pwsh/
mv start-dev.ps1           scripts/start/pwsh/start-all.ps1
mv start-frontend.ps1      scripts/start/pwsh/start-frontend.ps1
mv start-worker.ps1         scripts/start/pwsh/start-worker.ps1

# 4.3 迁入 scripts/testing/
mv check-dev-stack.ps1   scripts/testing/
mv test_backend.sh        scripts/testing/test-backend.sh

# 4.4 迁入 scripts/data/
mv sync-blog-content.ps1  scripts/data/

# 4.5 验证脚本仍有执行权限
chmod +x scripts/start/bash/*.sh
chmod +x scripts/testing/*.sh
```

---

### 阶段 5：迁移环境配置

```bash
# 5.1 迁移 .env.production.example
mv .env.production.example config/environments/

# 5.2 .env 保留在根目录（已在 .gitignore 中，不提交）
```

---

### 阶段 6：工具配置目录重命名

```bash
# 6.1 重命名 .sisyphus → tools/sisyphus
mv .sisyphus tools/sisyphus

# 6.2 重命名 .workflow → .workflow-archive
mv .workflow .workflow-archive
```

---

### 阶段 7：创建 docs/plans/ 导航文档

```bash
# 写入 docs/plans/README.md
cat > docs/plans/README.md << 'EOF'
# 项目方案索引

本文档是所有专项方案的导航入口。所有长期方案文档统一存放在此目录。

## 方案列表

| 方案 | 文件 | 状态 | 说明 |
|------|------|------|------|
| 仓库结构整理 | `REPOSITORY_ORGANIZATION.md` | 执行中 | 将根目录杂乱文件归纳到 docs/、scripts/、deployments/ |
| 安全审计与整改 | `REMEDIATION_PLAN.md` | 待执行 | 15 项安全与性能问题修复方案 |

## 最近更新

- **2025-04-14** — `REPOSITORY_ORGANIZATION.md` 创建，仓库整理方案初稿

## 导航

```
docs/
├── getting-started/      ← 开发入门文档
├── development/          ← 工程实践规范
├── design/               ← 设计系统文档
├── deployment/           ← 部署指南
├── audit/                ← 安全审计报告
├── plans/                ← 本目录：方案索引 ←
└── INDEX.md              ← 完整文档导航
```
EOF
```

---

### 阶段 8：精简根目录 README.md

```bash
# 写入新的根目录 README.md（30-50 行）
cat > README.md << 'EOF'
# 雍征彼的技术博客

个人技术博客，基于 Next.js + Rust 构建，聚焦具身智能（Embodied AI）方向。

## 项目结构

```
zhengbi-yong.github.io/
├── frontend/    — Next.js 16 前端（Tailwind CSS + Velite）
├── backend/     — Rust Axum 后端（PostgreSQL + Redis）
├── docs/        — 完整项目文档（含方案索引）
├── scripts/     — 自动化脚本
├── deployments/ — Docker Compose / K8s 部署配置
└── config/      — 环境配置模板
```

## 快速开始

```bash
# 安装所有依赖
make setup

# 启动开发服务
./scripts/start/bash/start-all.sh

# 前端地址：http://localhost:3001
# 后端地址：http://localhost:3000
```

## 文档导航

| 文档 | 位置 | 说明 |
|------|------|------|
| 开发指南 | [docs/getting-started/](docs/getting-started/) | 本地开发、环境配置入门 |
| 工程规范 | [docs/development/](docs/development/) | 代码风格、安全实践 |
| 设计文档 | [docs/design/](docs/design/) | 外观设计系统 |
| 部署指南 | [docs/deployment/](docs/deployment/) | Docker、K8s、服务器部署 |
| 方案索引 | [docs/plans/](docs/plans/) | **所有专项方案的导航页** |
| AI 代理指南 | [.github/AGENTS.md](.github/AGENTS.md) | AI 助手使用规范 |

## 相关链接

- 博客在线：http://192.168.0.161:3001
- 文档总览：[docs/INDEX.md](docs/INDEX.md)

---
*最后更新：2025-04-14*
EOF
```

---

### 阶段 9：Git 验证与提交

```bash
# 9.1 检查是否有文件仍然引用旧路径（应该没有）
grep -r "docker-compose\.dev\.yml\|docker-compose\.production\.yml" \
  --include="*.md" --include="Makefile" .
# 期望：无输出

grep -r "start-dev\.sh\|start-backend\.sh" \
  --include="*.md" --include="Makefile" .
# 期望：无输出

# 9.2 验证构建正常
make setup-db
docker compose -f deployments/docker/compose-files/dev/docker-compose.yml ps
docker compose -f deployments/docker/compose-files/dev/docker-compose.yml down

# 9.3 Git 提交
git checkout -b chore/repository-organization
git add -A
git commit -m "chore: reorganize root directory
- Move documentation to docs/{getting-started,development,design,audit,team,plans}
- Consolidate docker-compose files to deployments/docker/compose-files/{dev,prod}
- Move start-*.sh/ps1 scripts to scripts/start/{bash,pwsh}
- Create docs/plans/ as single home for all project plans
- Rename .sisyphus → tools/sisyphus, .workflow → .workflow-archive
- Update all path references in Makefile and docs/"
git checkout main
git merge chore/repository-organization
```

---

## 五、迁移后根目录状态

```
zhengbi-yong.github.io/
│
├── .github/                              # ✅ 保留（标准目录）
│   ├── AGENTS.md                        # ✅ AI 代理主指南
│   └── workflows/                        # ✅ CI/CD
│
├── .workflow-archive/                    # 🆕 旧工作流归档
├── .gitignore / .editorconfig / .env     # ✅ 标准/开发配置
├── .husky/ / .npmrc                      # ✅ 标准工具配置
│
├── Makefile                              # ✅ 保留（构建入口）
├── README.md                             # ✅ 精简为 50 行导航
├── LICENSE / VERSION                      # ✅ 标准文件
│
├── backend/                              # ✅ 工程代码
├── frontend/                             # ✅ 工程代码
├── public/                               # ✅ 静态资源
│
├── config/                               # ✅ 配置管理
│   └── environments/                     # ✅ 含 .env.production.example
│
├── docs/                                 # ✅ 文档（扩大后为唯一来源）
│   ├── README.md                         # ✅ 文档总入口
│   ├── INDEX.md                           # ✅ 完整文档导航
│   ├── getting-started/                   # ✅ 含 README_DEV.md
│   ├── development/                      # ✅ 含 CLAUDE.md、GOLDEN_RULES.md
│   ├── design/                           # 🆕 含 APPEARENCE.md、ultradesign*.md
│   ├── audit/                            # 🆕 含 REMEDIATION_PLAN.md
│   ├── team/                             # 🆕 含 TEAM.md
│   ├── deployment/                        # ✅ 部署指南
│   └── plans/                            # 🆕 所有方案文档的统一归宿
│       ├── README.md                      # 🆕 方案索引导航
│       └── REPOSITORY_ORGANIZATION.md     # 🆕 仓库整理方案
│
├── deployments/                          # ✅ 部署配置（确立为唯一来源）
│   └── docker/compose-files/             # 🆕 迁入 docker-compose*.yml
│       ├── dev/docker-compose.yml
│       └── prod/docker-compose.yml
│
├── scripts/                              # ✅ 脚本（整理后）
│   ├── start/                            # 🆕 统一启动脚本
│   │   ├── bash/
│   │   │   ├── start-all.sh
│   │   │   ├── start-backend.sh
│   │   │   └── start-frontend.sh
│   │   └── pwsh/
│   │       ├── start-all.ps1
│   │       ├── start-frontend.ps1
│   │       └── start-worker.ps1
│   ├── dev/ / operations/ / testing/     # ✅ 现有目录
│   └── archive/                           # ✅ 归档（待清理）
│
└── tools/                                # 🆕 第三方工具配置
    └── sisyphus/                         # 🆕 从 .sisyphus 迁入
```

---

## 六、风险评估与缓解

| 风险 | 影响 | 缓解措施 |
|------|------|---------|
| Makefile 路径更新遗漏 | CI/CD 失败 | 阶段 1.1 必须先执行，阶段 2 才能测试 |
| docs/ 路径更新遗漏 | 文档链接断裂 | 阶段 1.2 批量替换后用 grep 验证 |
| 迁移后 Makefile 测试失败 | 开发环境无法启动 | 迁移前先在旧路径测试一次 `make setup-db` |
| `deployments/docker/compose-files/backend/` 中有不同版本 | 覆盖丢失信息 | 迁移前 diff 确认使用根目录版本为最终版 |
| `start-*.sh` 脚本有硬编码相对路径 | 脚本执行失败 | 脚本在 scripts/start/ 下运行时 cd 到项目根目录 |
| `sync-blog-content.ps1` 等脚本有其他依赖 | 功能失效 | 阶段 4 迁移后检查脚本内的路径引用 |
| `docs/quick-start.md` 等被其他文档深度引用 | 迁移后其他页面 404 | 已通过阶段 1.2 批量替换所有路径 |

---

## 七、执行检查清单

```bash
# ✅ 阶段 0
ls -d docs/plans docs/design docs/audit docs/team scripts/start/bash scripts/start/pwsh scripts/testing scripts/data deployments/docker/compose-files/dev deployments/docker/compose-files/prod tools/sisyphus

# ✅ 阶段 1.1 - Makefile 替换完成
grep "docker-compose.dev.yml\|docker-compose.production.yml" Makefile
# 期望：无输出

# ✅ 阶段 1.2 - docs/ 替换完成
grep -r "docker-compose\.dev\.yml\|docker-compose\.production\.yml\|start-dev\.sh" docs/ --include="*.md"
# 期望：无输出

# ✅ 阶段 2 - Docker 文件迁移完成
ls deployments/docker/compose-files/dev/docker-compose.yml
ls deployments/docker/compose-files/prod/docker-compose.yml
# 期望：文件存在

# ✅ 阶段 3 - 文档迁移完成
ls docs/plans/REPOSITORY_ORGANIZATION.md
ls docs/plans/REMEDIATION_PLAN.md
ls docs/design/APPEARENCE.md
ls docs/getting-started/README_DEV.md
ls docs/development/CLAUDE.md
ls docs/development/GOLDEN_RULES.md
# 期望：所有文件存在

# ✅ 阶段 4 - 脚本迁移完成
ls scripts/start/bash/start-all.sh
ls scripts/start/pwsh/start-worker.ps1

# ✅ 阶段 5 - 环境配置迁移完成
ls config/environments/.env.production.example

# ✅ 阶段 6 - 工具目录重命名完成
ls tools/sisyphus/
ls .workflow-archive/

# ✅ 阶段 7 - 方案目录创建
ls docs/plans/README.md

# ✅ 阶段 8 - README.md 精简
wc -l README.md
# 期望：< 60 行

# ✅ 阶段 9 - Git 提交
git log --oneline -1
# 期望：包含 "chore: reorganize root directory"
```

---

*执行方案由 Hermes 生成 | 2025-04-14*

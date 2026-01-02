# 仓库重构迁移指南

本文档记录了2026年1月仓库重构的变更，帮助你适应新的目录结构。

## 重构概览

本次重构将混乱的代码库重新组织成清晰的模块化结构，每个模块的代码只在各自的模块目录中。

## 主要变更

### 1. 文档重组

**旧路径 → 新路径**

| 旧路径 | 新路径 |
|--------|--------|
| `TROUBLESHOOTING.md` | `docs/operations/TROUBLESHOOTING.md` |
| `RESTART_GUIDE.md` | `docs/operations/RESTART_GUIDE.md` |
| `MONITORING_FIX_GUIDE.md` | `docs/operations/MONITORING_FIX_GUIDE.md` |
| `MIGRATION_SUMMARY.md` | `docs/migration/MIGRATION_SUMMARY.md` |
| `DECOUPLING_COMPLETE.md` | `docs/migration/DECOUPLING_COMPLETE.md` |
| `DECOUPLING_PROGRESS.md` | `docs/migration/DECOUPLING_PROGRESS.md` |
| `ADMIN_TEST_REPORT.md` | `docs/testing/ADMIN_TEST_REPORT.md` |
| `TESTING_COMPLETION_GUIDE.md` | `docs/testing/TESTING_COMPLETION_GUIDE.md` |
| `TESTING_PROGRESS_REPORT.md` | `docs/testing/TESTING_PROGRESS_REPORT.md` |
| `PHASE1_COMPLETION_REPORT.md` | `docs/testing/PHASE1_COMPLETION_REPORT.md` |
| `BLOG_WRITING_GUIDE.md` | `docs/guides/BLOG_WRITING_GUIDE.md` |
| `FRONTEND_BACKEND_GUIDE.md` | `docs/guides/FRONTEND_BACKEND_GUIDE.md` |
| `QUICK_REFERENCE.md` | `docs/guides/QUICK_REFERENCE.md` |
| `IMPLEMENTATION_SUMMARY.md` | `docs/development/IMPLEMENTATION_SUMMARY.md` |
| `PROJECT_SUMMARY.md` | `docs/development/PROJECT_SUMMARY.md` |
| `SOLUTION_SUMMARY.md` | `docs/development/SOLUTION_SUMMARY.md` |
| `DEPLOYMENT.md` | `docs/deployment/QUICK_DEPLOYMENT.md` |
| `DOCUMENTATION_INDEX.md` | `INDEX.md` |

### 2. 部署文件整合

**旧路径 → 新路径**

| 旧路径 | 新路径 |
|--------|--------|
| `docker-compose*.yml` (根目录) | `deployments/docker/compose-files/docker-compose*.yml` |
| `backend/docker-compose*.yml` | `deployments/docker/compose-files/backend/docker-compose*.yml` |
| `nginx/` (根目录) | `deployments/nginx/` |
| `backend/nginx/` | `deployments/nginx/backend-specific/` |
| `deployment-package/` | `deployments/server/package/` |
| `server-setup/` | `deployments/server/setup/` |
| `monitoring/` | `deployments/server/monitoring/` |
| `docker-images-export/` | `deployments/docker/images/export/` |
| `complete-deploy.sh` | `deployments/scripts/complete-deploy.sh` |
| `deploy-server.sh` | `deployments/scripts/deploy-server.sh` |

### 3. 脚本重组

**旧路径 → 新路径**

| 旧路径 | 新路径 |
|--------|--------|
| `start.sh` | `scripts/operations/start.sh` |
| `start-dev.sh` | `scripts/operations/start-dev.sh` |
| `start-prod.sh` | `scripts/operations/start-prod.sh` |
| `quick-test.sh` | `scripts/operations/quick-test.sh` |
| `scripts/build.js` | `scripts/build/build.js` |
| `scripts/generate-search.mjs` | `scripts/data/generate-search.mjs` |
| `scripts/dev*.sh` | `scripts/development/dev*.sh` |
| `scripts/deploy*.sh` | `scripts/deployment/deploy*.sh` |
| `scripts/config-manager.*` | `scripts/utils/config-manager.*` |

### 4. 配置文件整合

**旧路径 → 新路径**

| 旧路径 | 新路径 |
|--------|--------|
| `.env.docker.example` | `config/environments/.env.docker.example` |
| `.env.local.example` | `config/environments/.env.local.example` |
| `.env.deploy.example` | `config/environments/.env.deploy.example` |
| `.env.server.example` | `config/environments/.env.server.example` |
| `.env.production` | `config/environments/.env.production.example` |
| `backend/.env.production` | `config/environments/backend/.env.production.example` |

**保留位置：**
- `.env.example` - 根目录（主模板）
- `backend/.env.example` - backend目录（backend专用）
- `frontend/.env.example` - frontend目录（frontend专用）

### 5. 测试代码分离

**旧路径 → 新路径**

| 旧路径 | 新路径 |
|--------|--------|
| `frontend/app/test-3dmol/` | `frontend/tests/routes/test-3dmol/` |
| `frontend/app/test-api/` | `frontend/tests/routes/test-api/` |
| `frontend/app/test-chemistry/` | `frontend/tests/routes/test-chemistry/` |
| `frontend/app/test-chemistry-debug/` | `frontend/tests/routes/test-chemistry-debug/` |
| `frontend/app/test-health-page/` | `frontend/tests/routes/test-health-page/` |
| `frontend/app/test-molecule-id/` | `frontend/tests/routes/test-molecule-id/` |
| `frontend/app/test-rkit-mol/` | `frontend/tests/routes/test-rkit-mol/` |
| `frontend/test-*.html` | `frontend/tests/test-*.html` |
| `frontend/diagnose-*.js` | `frontend/tests/diagnose-*.js` |

### 6. 清理操作

**已删除：**
- 空目录：`backend;C/`, `gen_hash;C/`, `backups/`
- 构建产物：`backend/target/` (19GB)
- 日志文件：`backend/api.log`, `backend/backend.log`
- 孤立文件：`import-images-on-server.bat`

**更新的 .gitignore：**
- 添加 `deployments/docker/images/export/*.tar`
- 添加 `test-results/`
- 添加 `frontend/test-*.html`
- 添加 `frontend/diagnose-*.js`
- 添加 `backend/.env`
- 添加 `backend/.env.local`

## 新的目录结构

```
/
├── README.md                    # 主文档
├── LICENSE                      # 许可证
├── VERSION                      # 版本号
├── docs/INDEX.md                     # 文档索引
├── .gitignore                   # Git忽略配置
├── Makefile                     # 构建配置
├── config/config.yml                   # 中央配置
├── .env.example                 # 主环境模板
│
├── backend/                     # Rust后端（保持不变）
│   ├── crates/                  # 模块化crate
│   ├── migrations/              # 数据库迁移
│   ├── scripts/                 # 后端脚本
│   └── src/                     # 源代码
│
├── frontend/                    # Next.js前端
│   ├── app/                     # 应用路由（无test-路由）
│   ├── components/              # 组件
│   ├── data/                    # 内容数据
│   ├── lib/                     # 工具库
│   └── tests/                   # 测试代码（新增）
│
├── docs/                        # 所有文档
│   ├── getting-started/         # 快速开始
│   ├── guides/                  # 指南文档
│   ├── deployment/              # 部署文档
│   ├── development/             # 开发文档
│   ├── operations/              # 运维文档（新增）
│   ├── migration/               # 迁移文档（新增）
│   ├── testing/                 # 测试文档（新增）
│   ├── configuration/           # 配置文档
│   ├── reference/               # 参考文档
│   └── appendix/                # 附录
│
├── deployments/                 # 所有部署文件（新增）
│   ├── docker/
│   │   ├── compose-files/       # Docker Compose文件
│   │   └── images/
│   │       └── export/          # 导出的镜像
│   ├── nginx/                   # Nginx配置
│   ├── server/
│   │   ├── setup/               # 服务器设置
│   │   ├── monitoring/          # 监控配置
│   │   └── package/             # 部署包
│   └── scripts/                 # 部署脚本
│
├── scripts/                     # 所有工具脚本
│   ├── deployment/              # 部署脚本
│   ├── development/             # 开发脚本
│   ├── build/                   # 构建脚本（新增）
│   ├── data/                    # 数据脚本（新增）
│   │   ├── export/
│   │   ├── import/
│   │   └── sync/
│   ├── backup/                  # 备份脚本
│   ├── testing/                 # 测试脚本（新增）
│   ├── operations/              # 运维脚本（新增）
│   ├── backend-migration/       # 后端迁移脚本
│   └── utils/                   # 工具脚本
│
└── config/                      # 配置模板（新增）
    └── environments/            # 环境配置示例
```

## 使用方式变更

### 启动开发环境

**旧命令：**
```bash
./start-dev.sh
```

**新命令：**
```bash
./scripts/operations/start-dev.sh
```

### 部署到服务器

**旧命令：**
```bash
./scripts/deploy-production.sh <server-ip> <user>
```

**新命令：**
```bash
./scripts/deployment/deploy-production.sh <server-ip> <user>
```

### 使用Docker Compose

**旧命令：**
```bash
docker-compose up -d
```

**新命令：**
```bash
docker compose -f deployments/docker/compose-files/docker-compose.yml up -d
```

### 查看文档

**旧路径：**
- `DEPLOYMENT.md` - 部署指南
- `TROUBLESHOOTING.md` - 故障排除

**新路径：**
- `docs/deployment/QUICK_DEPLOYMENT.md` - 部署指南
- `docs/operations/TROUBLESHOOTING.md` - 故障排除

## 破坏性变更

1. **脚本路径变更** - 所有根目录的脚本已移动到 `scripts/` 子目录
2. **Docker Compose路径** - 所有compose文件现在在 `deployments/docker/compose-files/`
3. **环境配置路径** - `.env.*.example`文件现在在 `config/environments/`
4. **测试路由URL** - 测试路由已从生产代码中移除

## 回滚方案

如果遇到问题，可以回滚到重构前的状态：

```bash
# 查看重构前的提交
git log --oneline | head -20

# 回滚到重构前的提交
git checkout <commit-hash-before-restructure>

# 或者创建回滚分支
git checkout -b pre-restructure backup/before-restructure
```

## 迁移建议

1. **更新脚本引用** - 检查你的CI/CD流程和本地脚本
2. **更新文档链接** - 更新指向旧路径的文档链接
3. **更新环境配置** - 使用新的环境配置模板
4. **测试构建流程** - 确保构建和部署流程正常工作

## 需要帮助？

如果遇到问题：

1. 查看本文档的"主要变更"部分
2. 检查 `docs/operations/` 中的运维文档
3. 查看 `docs/deployment/` 中的部署文档
4. 提交Issue到GitHub仓库

## 总结

本次重构旨在：
- ✅ 提高代码组织性
- ✅ 减少根目录杂乱
- ✅ 清晰的模块分离
- ✅ 更好的可维护性
- ✅ 更容易的导航

重构后的仓库结构更加清晰和专业，便于长期维护和协作开发。

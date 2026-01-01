# 项目根目录整理文档

## 概述

本文档记录了项目根目录的整理过程，将散乱的文档和脚本文件移动到合理的目录结构中，使项目更加清晰和易于维护。

**整理日期**: 2025-12-29
**整理目的**: 优化项目结构，提高可维护性

---

## 整理前后对比

### 整理前的根目录问题

1. **文档文件过多**: 8个部署相关的 Markdown 文件散落在根目录
2. **脚本文件混乱**: 15+ 个脚本文件混杂在根目录
3. **缺少分类**: 没有按功能进行文件分类
4. **难以维护**: 难以快速找到所需的文档或脚本

### 整理后的根目录

```
zhengbi-yong.github.io/
├── .env*                    # 环境配置文件
├── .gitignore               # Git 忽略配置
├── config.yml               # 主配置文件
├── docker-compose*.yml      # Docker 编排文件
├── package.json             # 项目元数据
├── README.md                # 项目说明文档
├── LICENSE                  # 许可证
├── VERSION                  # 版本号
├── start*.sh                # 主要启动脚本
├── backend/                 # 后端项目
├── frontend/                # 前端项目
├── docs/                    # 文档目录（已整理）
├── scripts/                 # 脚本目录（已整理）
└── nginx/                   # Nginx 配置
```

---

## 新的目录结构

### 📁 docs/deployment/

**用途**: 存放所有部署相关的文档

**移动的文件**:
```
CROSS_PLATFORM_docs/deployment/QUICK_DEPLOYMENT.md    → docs/deployment/
CROSS_PLATFORM_SUMMARY.md       → docs/deployment/
docs/deployment/QUICK_DEPLOYMENT.md                   → docs/deployment/
DOCKER_BUILD_SUMMARY.md         → docs/deployment/
DOCKER_UPGRADE_SUMMARY.md       → docs/deployment/
LOCAL_DEPLOYMENT_SUCCESS.md     → docs/deployment/
PLATFORM_QUICK_REFERENCE.md     → docs/deployment/
CONTRIBUTING.md                 → docs/deployment/
```

**现有文件**:
- `docker.md` - Docker 部署指南
- `high-availability.md` - 高可用部署
- `overview.md` - 部署概述
- `scripts.md` - 脚本说明
- `single-server.md` - 单服务器部署
- `slidev.md` - Slidev 相关

### 📁 scripts/deployment/

**用途**: 存放所有部署相关的脚本

**移动的文件**:
```
build-all.ps1                   → scripts/deployment/
build-all.sh                    → scripts/deployment/
deploy-docker.ps1               → scripts/deployment/
deploy-docker.sh                → scripts/deployment/
deploy-server.sh                → scripts/deployment/
deploy-simple.sh                → scripts/deployment/
export-images.ps1               → scripts/deployment/
export-images.sh                → scripts/deployment/
push-images.ps1                 → scripts/deployment/
push-images.sh                  → scripts/deployment/
```

**脚本功能**:
- **构建脚本**: `build-all.*` - 构建所有 Docker 镜像
- **部署脚本**: `deploy-*.sh` - 部署到服务器
- **镜像管理**: `export-images.*`, `push-images.*` - 导出和推送镜像

### 📁 scripts/utils/

**用途**: 存放工具类脚本

**移动的文件**:
```
fix-images.sh                   → scripts/utils/
test-images.sh                  → scripts/utils/
test-local.sh                   → scripts/utils/
```

**脚本功能**:
- 测试 Docker 镜像
- 本地环境测试
- 修复镜像问题

### 📁 scripts/dev/

**用途**: 存放开发环境相关的脚本

**移动的文件**:
```
start-local.ps1                 → scripts/dev/
start-local.sh                  → scripts/dev/
kill-port-3000.bat              → scripts/dev/
restart_backend.bat             → scripts/dev/
restart_backend.sh              → scripts/dev/
RESTART_BACKEND_COMPLETE.bat    → scripts/dev/
```

**脚本功能**:
- 启动本地开发环境
- 重启后端服务
- 杀死占用端口的进程

---

## 根目录保留的文件

### 配置文件
- `.env` - 当前环境配置
- `.env.example` - 环境变量模板
- `.env.deploy.example` - 部署环境变量模板
- `.env.docker.example` - Docker 环境变量模板
- `.env.local.example` - 本地环境变量模板
- `config.yml` - 主配置文件
- `deployments/docker/compose-files/docker-compose.yml` - 生产环境 Docker 编排
- `docker-compose.local.yml` - 本地开发 Docker 编排
- `package.json` - 项目元数据和脚本

### 主要启动脚本
- `start.sh` - 默认启动脚本
- `start-dev.sh` - 开发环境启动脚本
- `start-prod.sh` - 生产环境启动脚本

**原因**: 这些是项目的主要入口点，应该保留在根目录以便快速访问。

### 项目文档
- `README.md` - 项目说明文档
- `LICENSE` - 许可证文件
- `VERSION` - 版本号

**原因**: 这些是项目的核心标识文件，应该在根目录。

---

## 文件路径更新

### README.md 更新

已更新 `README.md` 中的所有文件路径引用：

#### 脚本路径更新

**旧路径** → **新路径**:
```bash
.\build-all.ps1              → .\scripts\deployment\build-all.ps1
bash build-all.sh            → bash scripts/deployment/build-all.sh
.\push-images.ps1            → .\scripts\deployment\push-images.ps1
bash push-images.sh          → bash scripts/deployment/push-images.sh
bash deploy-server.sh        → bash scripts/deployment/deploy-server.sh
```

#### 文档路径更新

**旧路径** → **新路径**:
```markdown
[CROSS_PLATFORM_docs/deployment/QUICK_DEPLOYMENT.md] → [docs/deployment/CROSS_PLATFORM_docs/deployment/QUICK_DEPLOYMENT.md]
[docs/deployment/QUICK_DEPLOYMENT.md]               → [docs/deployment/docs/deployment/QUICK_DEPLOYMENT.md]
```

### 其他文档的路径引用

如果其他文档中引用了被移动的文件，需要进行相应的路径更新。建议使用相对路径：

```markdown
<!-- 从根目录引用 -->
[部署指南](docs/deployment/docs/deployment/QUICK_DEPLOYMENT.md)

<!-- 从 docs/ 引用 -->
[构建脚本](../scripts/deployment/build-all.sh)

<!-- 从 scripts/deployment/ 引用 -->
[部署文档](../../docs/deployment/docs/deployment/QUICK_DEPLOYMENT.md)
```

---

## 目录结构总览

```
zhengbi-yong.github.io/
│
├── README.md                          # 项目主文档
├── LICENSE                            # MIT 许可证
├── VERSION                            # 版本号
├── package.json                       # 项目元数据
├── config.yml                         # 配置文件
│
├── .env                               # 环境变量（不提交）
├── .env.example                       # 环境变量模板
├── .env.deploy.example                # 部署环境模板
├── .env.docker.example                # Docker 环境模板
├── .env.local.example                 # 本地环境模板
│
├── deployments/docker/compose-files/docker-compose.yml                 # 生产 Docker 编排
├── docker-compose.local.yml           # 本地 Docker 编排
│
├── start.sh                           # 启动脚本
├── start-dev.sh                       # 开发启动脚本
├── start-prod.sh                      # 生产启动脚本
│
├── backend/                           # Rust 后端项目
│   ├── crates/
│   ├── migrations/
│   └── ...
│
├── frontend/                          # Next.js 前端项目
│   ├── app/
│   ├── components/
│   ├── lib/
│   └── ...
│
├── docs/                              # 📖 项目文档
│   ├── deployment/                    #    部署文档（已整理）
│   │   ├── CROSS_PLATFORM_docs/deployment/QUICK_DEPLOYMENT.md
│   │   ├── docs/deployment/QUICK_DEPLOYMENT.md
│   │   ├── DOCKER_BUILD_SUMMARY.md
│   │   ├── DOCKER_UPGRADE_SUMMARY.md
│   │   ├── LOCAL_DEPLOYMENT_SUCCESS.md
│   │   ├── PLATFORM_QUICK_REFERENCE.md
│   │   ├── CONTRIBUTING.md
│   │   ├── docker.md
│   │   ├── high-availability.md
│   │   ├── overview.md
│   │   ├── scripts.md
│   │   ├── single-server.md
│   │   └── slidev.md
│   ├── getting-started/               #    快速开始
│   ├── guides/                        #    使用指南
│   ├── development/                   #    开发文档
│   └── appendix/                      #    附录
│
├── scripts/                           # 🛠️ 脚本目录
│   ├── deployment/                    #    部署脚本（已整理）
│   │   ├── build-all.ps1
│   │   ├── build-all.sh
│   │   ├── deploy-docker.ps1
│   │   ├── deploy-docker.sh
│   │   ├── deploy-server.sh
│   │   ├── deploy-simple.sh
│   │   ├── export-images.ps1
│   │   ├── export-images.sh
│   │   ├── push-images.ps1
│   │   └── push-images.sh
│   ├── utils/                         #    工具脚本（已整理）
│   │   ├── fix-images.sh
│   │   ├── test-images.sh
│   │   └── test-local.sh
│   ├── dev/                           #    开发脚本（已整理）
│   │   ├── start-local.ps1
│   │   ├── start-local.sh
│   │   ├── kill-port-3000.bat
│   │   ├── restart_backend.bat
│   │   ├── restart_backend.sh
│   │   └── RESTART_BACKEND_COMPLETE.bat
│   ├── build.js
│   ├── export.js
│   └── push.js
│
└── nginx/                             # Nginx 配置
    └── ...
```

---

## 整理收益

### 1. 清晰的目录结构
- ✅ 文档按类型分类存放
- ✅ 脚本按功能分类存放
- ✅ 根目录更加简洁

### 2. 提高可维护性
- ✅ 快速定位文件
- ✅ 明确文件用途
- ✅ 便于团队协作

### 3. 更好的可扩展性
- ✅ 新文档有明确的存放位置
- ✅ 新脚本有明确的存放位置
- ✅ 易于添加新的子分类

### 4. 改进的用户体验
- ✅ 根目录清晰展示项目核心文件
- ✅ 文档和脚本路径更加语义化
- ✅ 降低项目学习曲线

---

## 使用指南

### 部署项目

```bash
# 构建镜像
bash scripts/deployment/build-all.sh

# 推送镜像
bash scripts/deployment/push-images.sh

# 部署到服务器
bash scripts/deployment/deploy-server.sh <registry> <version>
```

### 本地开发

```bash
# 启动本地开发环境
bash scripts/dev/start-local.sh

# 重启后端服务
bash scripts/dev/restart_backend.sh

# 杀死占用端口
bash scripts/dev/kill-port-3000.bat
```

### 查看文档

```markdown
# 部署文档
docs/deployment/docs/deployment/QUICK_DEPLOYMENT.md
docs/deployment/CROSS_PLATFORM_docs/deployment/QUICK_DEPLOYMENT.md

# 脚本说明
docs/deployment/scripts.md
```

---

## 注意事项

### 1. 路径引用
- 任何引用已移动文件的文档都需要更新路径
- 使用相对路径而不是绝对路径
- 建议使用 Markdown 链接格式

### 2. Git 跟踪
- 文件移动会被 Git 自动识别
- 提交时使用 `git add -A` 确保所有移动都被跟踪
- 历史记录会保留

### 3. CI/CD 更新
- 如果 CI/CD 流程中使用了这些脚本，需要更新路径
- 检查 GitHub Actions、GitLab CI 等配置文件
- 更新部署脚本中的路径引用

### 4. 文档同步
- 确保所有团队成员了解新的目录结构
- 更新项目贡献指南
- 考虑发送通知或更新 README

---

## 后续优化建议

### 1. 添加 README 文件
在各子目录添加 `README.md` 说明目录用途：

```bash
docs/deployment/README.md    # 部署文档索引
scripts/deployment/README.md # 部署脚本使用说明
scripts/utils/README.md      # 工具脚本说明
scripts/dev/README.md        # 开发脚本说明
```

### 2. 创建索引文件
创建快速索引文档：

```markdown
docs/INDEX.md                # 所有文档索引
scripts/INDEX.md             # 所有脚本索引
```

### 3. 统一命名规范
- 文档文件使用大写或小写统一
- 脚本文件统一使用 `.sh` 或 `.ps1` 后缀
- 避免空格和特殊字符

### 4. 添加注释
在脚本文件头部添加功能说明：

```bash
#!/bin/bash
# 用途: 构建所有 Docker 镜像
# 使用方法: bash scripts/deployment/build-all.sh
# 作者: Zhengbi Yong
# 日期: 2025-12-29
```

---

## 变更日志

### 2025-12-29
- ✅ 创建 `docs/deployment/` 目录，移动 8 个部署文档
- ✅ 创建 `scripts/deployment/` 目录，移动 10 个部署脚本
- ✅ 创建 `scripts/utils/` 目录，移动 3 个工具脚本
- ✅ 创建 `scripts/dev/` 目录，移动 6 个开发脚本
- ✅ 更新 `README.md` 中的所有文件路径引用
- ✅ 创建本整理文档

---

**文档维护者**: Zhengbi Yong
**最后更新**: 2025-12-29
**版本**: 1.0.0

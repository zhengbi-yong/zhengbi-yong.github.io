# 雍征彼的技术博客

个人技术博客，基于 Next.js + Rust 构建，聚焦具身智能（Embodied AI）方向。

## 项目结构

```
zhengbi-yong.github.io/
├── frontend/     — Next.js 16 前端（Tailwind CSS + Velite）
├── backend/     — Rust Axum 后端（PostgreSQL + Redis）
├── docs/        — 完整项目文档
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
| 开发入门 | [docs/getting-started/](docs/getting-started/) | 环境配置、快速启动 |
| 工程规范 | [docs/development/](docs/development/) | 代码风格、安全实践 |
| 设计系统 | [docs/design/](docs/design/) | 外观设计文档 |
| 部署指南 | [docs/deployment/](docs/deployment/) | Docker、K8s、服务器部署 |
| **专项方案** | [docs/plans/](docs/plans/) | **所有长期方案的索引** |
| AI 代理指南 | [.github/AGENTS.md](.github/AGENTS.md) | AI 助手使用规范 |

## 专项方案索引

所有需要多步骤执行的方案文档统一存放在 [docs/plans/](docs/plans/)：

- 🔧 [仓库结构整理方案](docs/plans/REPOSITORY_ORGANIZATION.md) — 整理根目录杂乱文件
- 🛡️ [安全审计与整改方案](docs/plans/REMEDIATION_PLAN.md) — 15 项安全与性能问题修复

## 相关链接

- 博客在线：http://192.168.0.161:3001
- 文档总览：[docs/INDEX.md](docs/INDEX.md)

---
*最后更新：2025-04-14*

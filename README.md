# Zhengbi Yong's Personal Blog

个人博客系统，包含前端展示和后端API服务。

## 快速开始

### 前端
```bash
cd frontend
pnpm install
pnpm dev
```
访问: http://localhost:3001

### 后端
```bash
cd backend
./deploy.sh dev
```
API: http://localhost:3000

## 项目结构

- `frontend/` - Next.js 前端应用
- `backend/` - Rust 后端服务
- `scripts/` - 工具脚本
- `docs/` - 项目文档

详细文档请查看 [docs/README.md](docs/README.md)

## 部署

生产环境部署请查看 [scripts/deploy.sh](scripts/deploy.sh)
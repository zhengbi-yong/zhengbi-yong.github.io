# Docker 快速部署指南

本指南帮助您使用Docker一键部署整个博客系统。

## 🚀 快速开始

### 前置要求

- Docker 20.10+
- Docker Compose 2.0+
- 2GB+ 内存
- 20GB+ 磁盘空间

### 一键部署

**Linux/macOS:**
```bash
# 1. 克隆项目
git clone https://github.com/zhengbi-yong/zhengbi-yong.github.io.git
cd zhengbi-yong.github.io

# 2. 运行部署脚本
chmod +x deploy-docker.sh
./deploy-docker.sh
```

**Windows:**
```powershell
# 1. 克隆项目
git clone https://github.com/zhengbi-yong/zhengbi-yong.github.io.git
cd zhengbi-yong.github.io

# 2. 运行部署脚本
.\deploy-docker.ps1
```

### 手动部署

如果自动脚本不适用，可以手动部署：

```bash
# 1. 配置环境变量
cp .env.docker.example .env
nano .env  # 编辑配置

# 2. 启动服务
docker compose up -d

# 3. 查看日志
docker compose logs -f
```

## 📦 服务说明

| 服务 | 端口 | 说明 |
|------|------|------|
| Frontend | 3001 | Next.js应用 |
| Backend | 3000 | Rust API |
| PostgreSQL | 5432 | 数据库 |
| Redis | 6379 | 缓存 |
| Nginx | 80, 443 | 反向代理 |

## 🔧 常用命令

```bash
# 查看服务状态
docker compose ps

# 查看日志
docker compose logs -f [服务名]

# 重启服务
docker compose restart [服务名]

# 停止所有服务
docker compose down

# 更新代码
git pull
docker compose up -d --build

# 备份数据库
docker compose exec postgres pg_dump -U blog_user blog_db > backup.sql
```

## 📚 详细文档

完整部署文档请查看：[docs/deployment/docker.md](docs/deployment/docker.md)

## 🔗 相关链接

- [项目主页](https://zhengbi-yong.top)
- [GitHub仓库](https://github.com/zhengbi-yong/zhengbi-yong.github.io)
- [问题反馈](https://github.com/zhengbi-yong/zhengbi-yong.github.io/issues)

## ⚠️ 注意事项

1. **首次部署**必须修改`.env`文件中的安全配置（JWT_SECRET等）
2. **生产环境**建议配置SSL证书和域名
3. **数据备份**建议设置自动备份计划
4. **性能优化**根据实际访问量调整资源配置

---

**快速上手？** → 运行 `./deploy-docker.sh` (Linux/Mac) 或 `.\deploy-docker.ps1` (Windows)

**遇到问题？** → 查看 [docs/deployment/docker.md](docs/deployment/docker.md) 或提交Issue

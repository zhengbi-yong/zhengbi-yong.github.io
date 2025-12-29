# 部署相关文件结构

本文档说明项目中所有与部署相关的文件。

## 目录结构

```
zhengbi-yong.github.io/
├── server-setup/                  # 服务器部署配置文件
│   ├── .env.production           # 生产环境变量模板
│   ├── nginx.conf                # Nginx 主配置
│   ├── site.conf                 # Nginx 站点配置
│   └── README.md                 # 配置说明文档
│
├── scripts/                      # 部署脚本
│   ├── build.js                  # 构建 Docker 镜像
│   ├── export.js                 # 导出 Docker 镜像
│   ├── upload-rsync.js           # rsync 上传脚本
│   ├── package-deployment.js     # 打包部署文件
│   ├── deploy-production.sh      # 一键部署脚本 ⭐
│   └── deployment/               # 部署相关脚本
│       └── ...
│
├── docker-images-export/         # 导出的 Docker 镜像（生成）
│   ├── blog-backend-local.tar
│   ├── blog-frontend-local.tar
│   ├── postgres-17-alpine.tar
│   ├── redis-7.4-alpine.tar
│   ├── nginx-1.27-alpine.tar
│   ├── import-images.sh          # 服务器端导入脚本
│   └── README.md
│
├── docs/                         # 文档
│   ├── SERVER_DEPLOYMENT_GUIDE.md # 完整部署指南
│   └── DEPLOYMENT_STRUCTURE.md   # 本文档
│
├── docker-compose.server.yml     # 服务器部署用 compose 文件
├── DEPLOYMENT.md                 # 快速部署指南 ⭐
└── package.json                  # 包含部署命令
```

## 快速开始

### 首次部署

1. **修改配置文件**
   ```bash
   # 编辑服务器配置
   cd server-setup
   nano .env.production  # 修改 IP、密钥等配置
   ```

2. **一键部署**
   ```bash
   # 在项目根目录执行
   ./scripts/deploy-production.sh 152.136.43.194 ubuntu
   ```

### 手动部署步骤

详细步骤请参考：
- **快速指南**: [DEPLOYMENT.md](../DEPLOYMENT.md)
- **完整指南**: [docs/SERVER_DEPLOYMENT_GUIDE.md](./SERVER_DEPLOYMENT_GUIDE.md)

## 命令说明

### NPM 命令

```bash
npm run build          # 构建 Docker 镜像
npm run export         # 导出镜像为 tar 文件
npm run upload:rsync   # 通过 rsync 上传
npm run package        # 打包部署文件
```

### 部署脚本

| 脚本 | 用途 | 使用方法 |
|------|------|----------|
| `deploy-production.sh` | 一键部署 | `./scripts/deploy-production.sh <ip> <user>` |
| `build.js` | 构建镜像 | `npm run build` |
| `export.js` | 导出镜像 | `npm run export` |
| `upload-rsync.js` | 上传镜像 | `npm run upload:rsync <server>` |

## 配置文件详解

### server-setup/.env.production

生产环境变量配置，包含：
- 数据库配置
- Redis 配置
- API URL 配置
- CORS 配置
- 安全密钥（必须修改！）

### server-setup/nginx.conf

Nginx 全局配置：
- 工作进程数
- 连接数限制
- Gzip 压缩
- 日志格式

### server-setup/site.conf

Nginx 站点配置：
- 监听端口
- 域名配置
- 反向代理规则
  - `/` → Frontend (3001)
  - `/api` → Backend (3000)

### docker-compose.server.yml

服务器部署用的 Compose 文件：
- 使用本地构建的镜像
- 包含健康检查
- 配置数据卷
- 网络隔离

## 部署流程

### 1. 本地准备

```bash
# 构建 Docker 镜像
npm run build

# 导出镜像
npm run export
```

### 2. 上传文件

```bash
# 使用一键部署脚本（推荐）
./scripts/deploy-production.sh <ip> <user>

# 或手动上传
scp -r docker-images-export/ <user>@<ip>:~/blog-deployment/
scp server-setup/* <user>@<ip>:~/blog/
```

### 3. 服务器配置

```bash
ssh <user>@<ip>

# 导入镜像
cd ~/blog-deployment
bash import-images.sh

# 配置 Nginx
sudo cp ~/blog/site.conf /etc/nginx/sites-available/default
sudo systemctl reload nginx

# 启动服务
cd ~/blog
docker compose up -d
```

## 更新部署

当代码更新后：

```bash
# 本地重新构建
npm run build
npm run export

# 上传新镜像
scp docker-images-export/blog-backend-local.tar <user>@<ip>:~/blog-deployment/
scp docker-images-export/blog-frontend-local.tar <user>@<ip>:~/blog-deployment/

# 服务器更新
ssh <user>@<ip>
cd ~/blog-deployment
docker load -i blog-backend-local.tar
docker load -i blog-frontend-local.tar
cd ~/blog
docker compose up -d
```

## 故障排查

### 常见问题

1. **无法访问网站**
   - 检查防火墙: `sudo ufw status`
   - 检查服务状态: `docker compose ps`
   - 检查云服务商安全组

2. **登录失败 (failed to fetch)**
   - 检查 CORS 配置
   - 检查 API URL 配置
   - 查看后端日志

3. **服务无法启动**
   - 检查端口占用
   - 检查磁盘空间
   - 查看详细日志

### 调试命令

```bash
# 查看所有服务状态
docker compose ps

# 查看服务日志
docker compose logs -f
docker compose logs backend
docker compose logs frontend

# 进入容器调试
docker exec -it blog-backend bash
docker exec -it blog-frontend sh

# 检查网络连接
docker network ls
docker network inspect blog_blog-network
```

## 安全建议

1. 修改所有默认密钥和密码
2. 使用强密码（32+ 字符）
3. 配置 HTTPS
4. 限制防火墙规则
5. 定期备份数据
6. 定期更新系统

## 相关文档

- [快速部署指南](../DEPLOYMENT.md)
- [完整部署指南](./SERVER_DEPLOYMENT_GUIDE.md)
- [服务器配置说明](../server-setup/README.md)
- [项目主 README](../README.md)

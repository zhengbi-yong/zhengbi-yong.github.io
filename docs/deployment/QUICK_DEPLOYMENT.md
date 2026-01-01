# 快速部署指南

## 本地开发

```bash
# 安装依赖
cd frontend && pnpm install

# 启动开发服务器
pnpm dev
```

## 生产部署

### 方式 1: 一键部署脚本（推荐）

```bash
# 自动构建、导出、上传并部署
./scripts/deploy-production.sh <server-ip> <user>

# 示例
./scripts/deploy-production.sh 152.136.43.194 ubuntu
```

### 方式 2: 手动部署

#### 步骤 1: 构建镜像

```bash
npm run build
```

#### 步骤 2: 导出镜像

```bash
npm run export
```

#### 步骤 3: 上传到服务器

```bash
# 上传镜像
scp -r docker-images-export/ ubuntu@your-server:~/blog-deployment/

# 上传配置
scp server-setup/.env.production ubuntu@your-server:~/blog/.env
scp server-setup/nginx.conf ubuntu@your-server:~/blog/nginx.conf
scp server-setup/site.conf ubuntu@your-server:~/blog/site.conf
scp docker-compose.server.yml ubuntu@your-server:~/blog/docker-compose.yml
```

#### 步骤 4: 服务器部署

```bash
ssh ubuntu@your-server

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

## 配置说明

### 必须修改的配置

在 `server-setup/.env.production` 中修改：

```env
# 服务器 IP
NEXT_PUBLIC_SITE_URL=http://your-server-ip
NEXT_PUBLIC_API_URL=http://your-server-ip/api

# CORS 允许的域名
CORS_ALLOWED_ORIGINS=http://your-server-ip,http://your-server-ip:3001

# 安全密钥（必须修改！）
JWT_SECRET=<your-32-char-secret>
PASSWORD_PEPPER=<your-32-char-secret>
SESSION_SECRET=<your-32-char-secret>
```

### 云服务商配置

在云服务商控制台（腾讯云/阿里云等）开放端口：

- **22** - SSH
- **80** - HTTP
- **443** - HTTPS
- **3000** - Backend API (可选)
- **3001** - Frontend (可选)

## 访问地址

- **前端**: http://your-server-ip
- **后端 API**: http://your-server-ip/api
- **前端直连**: http://your-server-ip:3001 (需要开放 3001 端口)
- **后端直连**: http://your-server-ip:3000 (需要开放 3000 端口)

## 服务管理

```bash
# SSH 登录服务器
ssh ubuntu@your-server

# 查看服务状态
cd ~/blog
docker compose ps

# 查看日志
docker compose logs -f

# 重启服务
docker compose restart

# 停止服务
docker compose down
```

## 更新部署

```bash
# 本地重新构建
npm run build
npm run export

# 上传新镜像
scp docker-images-export/blog-backend-local.tar ubuntu@your-server:~/blog-deployment/
scp docker-images-export/blog-frontend-local.tar ubuntu@your-server:~/blog-deployment/

# 服务器上更新
ssh ubuntu@your-server
cd ~/blog-deployment
docker load -i blog-backend-local.tar
docker load -i blog-frontend-local.tar

cd ~/blog
docker compose down
docker compose up -d
```

## 详细文档

完整部署文档请查看: [docs/SERVER_DEPLOYMENT_GUIDE.md](docs/SERVER_DEPLOYMENT_GUIDE.md)

## 故障排查

### 无法访问网站

1. 检查服务状态: `docker compose ps`
2. 检查防火墙: `sudo ufw status`
3. 检查云服务商安全组规则
4. 查看日志: `docker compose logs -f`

### 登录失败 (failed to fetch)

1. 检查后端 CORS 配置
2. 确认 `.env` 中的 `CORS_ALLOWED_ORIGINS` 包含正确的域名
3. 查看后端日志: `docker compose logs backend`

### 服务无法启动

1. 查看详细日志: `docker compose logs backend`
2. 检查端口占用: `sudo netstat -tlnp | grep -E '3000|3001'`
3. 检查磁盘空间: `df -h`

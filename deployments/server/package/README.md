# 博客系统部署包

本目录包含了在服务器上部署博客系统所需的文件。

## 文件说明

- deployments/docker/compose-files/docker-compose.yml - Docker Compose 配置文件
- .env.example - 环境变量模板
- deploy.sh - 部署脚本
- nginx/ - Nginx 配置目录

## 部署步骤

### 1. 上传文件到服务器

将整个目录上传到服务器，例如 ~/blog/

### 2. 配置环境变量

```bash
cd ~/blog
cp .env.example .env
nano .env  # 或使用 vim 编辑
# 修改以下必须的安全配置:
# - JWT_SECRET
# - PASSWORD_PEPPER
# - SESSION_SECRET
# - NEXT_PUBLIC_SITE_URL (你的域名)
# - CORS_ALLOWED_ORIGINS (你的域名)
```

### 3. 运行部署脚本

```bash
chmod +x deploy.sh
bash deploy.sh
```

### 4. 配置域名和 SSL (可选)

如果需要使用域名和 HTTPS:

```bash
# 安装 certbot
sudo apt update
sudo apt install certbot

# 生成 SSL 证书
sudo certbot certonly --standalone -d yourdomain.com

# 证书会生成在 /etc/letsencrypt/live/yourdomain.com/
# 创建软链接到 nginx 目录
ln -s /etc/letsencrypt/live/yourdomain.com/fullchain.pem ~/blog/nginx/ssl/fullchain.pem
ln -s /etc/letsencrypt/live/yourdomain.com/privkey.pem ~/blog/nginx/ssl/privkey.pem
```

### 5. 启用 Nginx

```bash
docker compose --profile with-nginx up -d
```

## 服务访问

- 前端: http://your-server-ip:3001
- 后端: http://your-server-ip:3000
- 通过 Nginx: http://your-domain.com (如果配置)

## 常用命令

```bash
# 查看服务状态
docker compose ps

# 查看日志
docker compose logs -f

# 重启服务
docker compose restart

# 停止服务
docker compose down
```

## 故障排查

如果遇到问题:

1. 检查日志: docker compose logs -f
2. 检查服务状态: docker compose ps
3. 检查环境变量: cat .env
4. 检查端口占用: netstat -tlnp | grep -E '3000|3001|80|443'

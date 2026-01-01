# 低配置服务器部署指南

**适用场景**: 服务器配置较低（CPU、内存不足），无法进行编译工作
**解决方案**: 在本地构建镜像，服务器只负责加载和运行
**部署时间**: 30-60 分钟（本地构建 30 分钟 + 服务器部署 10 分钟）

---

## 📋 目录

1. [部署流程概述](#部署流程概述)
2. [本地准备阶段](#本地准备阶段)
3. [服务器部署阶段](#服务器部署阶段)
4. [SSL 配置](#ssl-配置)
5. [常见问题](#常见问题)
6. [优化建议](#优化建议)

---

## 部署流程概述

### 整体架构

```
本地机器（Windows/Mac/Linux）
    ↓
1. 构建 Docker 镜像 (30 分钟)
2. 导出镜像为 tar.gz 文件
3. 上传到服务器

服务器（低配置）
    ↓
4. 加载 Docker 镜像 (5 分钟)
5. 配置环境变量
6. 启动服务
7. 配置 SSL（可选）
```

### 优势

- ✅ **服务器零编译**: 所有构建工作在本地完成
- ✅ **部署快速**: 服务器只需加载镜像
- ✅ **可重复**: 镜像可以多次使用
- ✅ **节省资源**: 服务器只运行容器

### 系统要求

#### 本地机器
- Docker Desktop 或 Docker Engine
- 8GB+ 内存
- 20GB+ 磁盘空间
- 稳定的网络连接

#### 服务器（低配置）
- **CPU**: 1 核心以上
- **内存**: 2GB 以上（推荐 4GB）
- **磁盘**: 10GB 以上可用空间
- **系统**: Ubuntu 20.04+ / Debian 11+ / CentOS 8+

---

## 本地准备阶段

### 步骤 1: 克隆项目

```bash
# 在本地机器上
git clone https://github.com/zhengbi-yong/zhengbi-yong.github.io.git
cd zhengbi-yong.github.io
```

---

### 步骤 2: 构建 Docker 镜像

**重要**: 这一步在**本地机器**完成，不需要服务器参与。

#### 2.1 Windows (Git Bash / PowerShell)

```bash
# 使用 Git Bash
bash scripts/deployment/build-local-images.sh

# 或使用 PowerShell
.\scripts\deployment\build-local-images.ps1
```

#### 2.2 Linux / macOS

```bash
bash scripts/deployment/build-local-images.sh
```

#### 构建过程

构建会完成以下工作：

1. **检查环境**: 验证 Docker 已安装
2. **构建后端**: Rust API（10-20 分钟）
3. **构建前端**: Next.js 应用（15-30 分钟）
4. **验证镜像**: 确保镜像可用

**预期输出**:
```
====================================
本地 Docker 镜像构建
====================================

✓ Docker 环境检查通过

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  2. 构建后端镜像 (Rust)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

这可能需要 10-20 分钟...

[+] Building 123.5s (12/12) FINISHED
✓ 后端镜像构建成功
镜像大小: 567MB

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  3. 构建前端镜像 (Next.js)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

这可能需要 15-30 分钟...

[+] Building 2345.6s (20/20) FINISHED
✓ 前端镜像构建成功
镜像大小: 1.2GB

====================================
构建完成！
====================================

✓ 所有镜像构建成功

镜像列表:
blog-backend   local   abc123   5 minutes ago   567MB
blog-frontend  local   def456   3 minutes ago   1.2GB
```

---

### 步骤 3: 导出镜像

#### 3.1 使用导出脚本

```bash
bash scripts/deployment/export-images.sh
```

#### 导出过程

脚本会完成以下工作：

1. **检查镜像**: 确保镜像存在
2. **导出后端**: `blog-backend-local.tar` (~500MB)
3. **导出前端**: `blog-frontend-local.tar` (~1.5GB)
4. **压缩文件** (可选): 减少 30-50% 体积
5. **创建部署包**: 包含所有必要文件

**预期输出**:
```
====================================
Docker 镜像导出
====================================

✓ 所有镜像存在

导出后端镜像...
✓ 后端镜像导出成功 (大小: 567M)

导出前端镜像...
✓ 前端镜像导出成功 (大小: 1.2G)

是否压缩? 可减少 30% 体积 (y/N): y

压缩后端镜像...
✓ 后端镜像压缩完成 (大小: 345M)

压缩前端镜像...
✓ 前端镜像压缩完成 (大小: 789M)

====================================
导出完成！
====================================

✓ 所有文件已导出

导出的文件:
-rw-r--r-- blog-backend-local.tar.gz  345M
-rw-r--r-- blog-frontend-local.tar.gz  789M
-rw-r--r-- blog-deploy-package.tar.gz  1.1G

部署包: exports/blog-deploy-package.tar.gz
```

#### 3.2 导出文件位置

所有文件在 `exports/` 目录:

```
exports/
├── blog-backend-local.tar.gz       # 后端镜像（压缩）
├── blog-frontend-local.tar.gz      # 前端镜像（压缩）
└── blog-deploy-package.tar.gz      # 完整部署包
```

**文件大小**:
- 未压缩: ~2GB
- 压缩后: ~1.1GB
- 部署包: ~1.2GB

---

### 步骤 4: 准备服务器

在继续之前，确保服务器已准备好：

#### 4.1 安装 Docker

```bash
# 在服务器上执行
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER

# 重新登录或执行
newgrp docker
```

#### 4.2 安装 Docker Compose

```bash
# Docker Compose 通常已包含在 Docker 安装中
docker compose version
```

#### 4.3 创建项目目录

```bash
sudo mkdir -p /opt/blog
sudo chown $USER:$USER /opt/blog
cd /opt/blog
```

---

## 服务器部署阶段

### 步骤 5: 上传镜像到服务器

有三种方式上传镜像文件，选择最适合你的：

#### 方式 A: 上传完整部署包（推荐）

```bash
# 在本地执行
scp exports/blog-deploy-package.tar.gz user@server:/opt/

# 在服务器上解压
cd /opt
tar xzf blog-deploy-package.tar.gz -C deploy-package
cd deploy-package
```

**优点**: 一次性上传所有文件
**缺点**: 文件较大（~1.2GB）

#### 方式 B: 分别上传镜像文件

```bash
# 在本地执行
scp exports/blog-backend-local.tar.gz user@server:/opt/blog/
scp exports/blog-frontend-local.tar.gz user@server:/opt/blog/

# 上传其他必要文件
scp docker-compose.local.yml user@server:/opt/blog/deployments/docker/compose-files/docker-compose.yml
scp .env.docker.example user@server:/opt/blog/.env.example
scp -r nginx user@server:/opt/blog/
```

**优点**: 可以分批上传
**缺点**: 需要多次操作

#### 方式 C: 使用 SFTP 工具（适合 Windows）

使用图形化 SFTP 工具（如 FileZilla、WinSCP）：

1. 连接到服务器
2. 上传 `blog-backend-local.tar.gz` 到 `/opt/blog/`
3. 上传 `blog-frontend-local.tar.gz` 到 `/opt/blog/`
4. 上传其他配置文件

**上传时间**:
- 100Mbps 网络: ~2-3 分钟
- 10Mbps 网络: ~20-30 分钟

---

### 步骤 6: 加载 Docker 镜像

**重要**: 这一步在**服务器**上执行。

#### 6.1 检查磁盘空间

```bash
# 在服务器上
df -h /opt

# 确保至少有 5GB 可用空间
```

#### 6.2 加载镜像

**使用脚本**（推荐）:

```bash
cd /opt/blog
bash scripts/load-images.sh
```

**手动加载**:

```bash
# 如果镜像文件是压缩的，先解压
gunzip blog-backend-local.tar.gz
gunzip blog-frontend-local.tar.gz

# 加载后端镜像
docker load -i blog-backend-local.tar

# 加载前端镜像
docker load -i blog-frontend-local.tar
```

**预期输出**:
```
====================================
Docker 镜像加载
====================================

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  1. 检查镜像文件
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✓ 找到镜像文件
后端: blog-backend-local.tar.gz
前端: blog-frontend-local.tar.gz

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  2. 检查磁盘空间
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✓ 磁盘空间充足
可用空间: 15GB

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  3. 解压镜像文件
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

解压后端镜像...
✓ 后端镜像解压完成

解压前端镜像...
✓ 前端镜像解压完成

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  4. 加载 Docker 镜像
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

加载后端镜像（这需要几分钟）...
Loaded image: blog-backend:local
✓ 后端镜像加载成功

加载前端镜像（这需要几分钟）...
Loaded image: blog-frontend:local
✓ 前端镜像加载成功

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  5. 验证镜像
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✓ 后端镜像可用
✓ 前端镜像可用

镜像列表:
blog-backend    local    abc123def456   10 seconds ago   567MB
blog-frontend   local    def789ghi012   5 seconds ago    1.2GB

====================================
镜像加载完成！
====================================

✓ 所有镜像已成功加载
```

---

### 步骤 7: 配置环境变量

#### 7.1 创建 .env 文件

```bash
cd /opt/blog
cp .env.example .env
nano .env
```

#### 7.2 修改配置

**必须修改的配置**:

```bash
# 数据库密码（生成随机密码）
POSTGRES_PASSWORD=YourSecurePasswordHere2025

# 安全密钥（在本地生成）
# 使用: openssl rand -base64 32
JWT_SECRET=生成的32位随机密钥
PASSWORD_PEPPER=生成的32位随机密钥
SESSION_SECRET=生成的32位随机密钥

# 域名配置
CORS_ALLOWED_ORIGINS=https://your-domain.com
NEXT_PUBLIC_SITE_URL=https://your-domain.com
NEXT_PUBLIC_API_URL=https://your-domain.com
```

**生成密钥**（在本地或服务器）:

```bash
# 生成三个不同的密钥
openssl rand -base64 32  # JWT_SECRET
openssl rand -base64 32  # PASSWORD_PEPPER
openssl rand -base64 32  # SESSION_SECRET
```

#### 7.3 设置文件权限

```bash
chmod 600 .env
```

---

### 步骤 8: 配置 Nginx

```bash
nano nginx/conf.d/blog.conf
```

**修改第 7 行**（域名）:

```nginx
# 修改前
server_name zhengbi-yong.top 152.136.43.194;

# 修改后
server_name your-domain.com;
```

如果有多个域名：
```nginx
server_name your-domain.com www.your-domain.com;
```

---

### 步骤 9: 启动服务

#### 9.1 使用启动脚本

```bash
cd /opt/blog
bash scripts/start-from-images.sh
```

#### 9.2 手动启动

```bash
# 创建网络
docker network create blog-network

# 启动所有服务
docker compose -f docker-compose.local.yml up -d

# 查看状态
docker compose -f docker-compose.local.yml ps
```

**预期输出**:
```
====================================
启动博客服务
====================================

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  1. 检查镜像
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✓ 所有镜像已加载

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  2. 检查配置文件
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✓ 配置文件检查通过

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  3. 配置 Docker 网络
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

创建 Docker 网络...
✓ 网络创建成功

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  4. 启动服务
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[+] Running 5 services
[+] Creating blog-postgres    ... done
[+] Creating blog-redis       ... done
[+] Creating blog-backend     ... done
[+] Creating blog-frontend    ... done
[+] Creating blog-nginx       ... done
✓ 服务启动成功

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  5. 等待服务就绪
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

等待数据库启动...
等待后端启动...
等待前端启动...

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  6. 健康检查
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

容器状态:
NAME                IMAGE                      STATUS
blog-postgres       postgres:17-alpine         Up (healthy)
blog-redis          redis:7.4-alpine           Up (healthy)
blog-backend        blog-backend:local         Up (healthy)
blog-frontend       blog-frontend:local        Up (healthy)
blog-nginx          nginx:1.27-alpine          Up

测试后端 API...
✓ 后端 API 正常

测试前端...
✓ 前端正常

测试数据库...
✓ 数据库正常

测试 Redis...
✓ Redis 正常

====================================
服务启动完成！
====================================

✓ 所有服务已启动

访问地址:
  HTTP:  http://152.136.43.194
  HTTP:  http://localhost
```

---

### 步骤 10: 验证部署

#### 10.1 本地访问测试

```bash
# 在服务器上测试
curl http://localhost

# 或从本地浏览器访问
http://your-server-ip
```

#### 10.2 运行验证脚本

```bash
# 下载验证脚本到服务器（如果还没有）
cd /opt/blog/scripts/deployment

# 运行验证
bash verify-deployment.sh http://your-server-ip
```

---

## SSL 配置

### 步骤 11: 配置 HTTPS（可选但推荐）

#### 前提条件

- 域名已解析到服务器 IP
- 防火墙开放 80 和 443 端口

#### 配置步骤

```bash
cd /opt/blog

# 运行 SSL 配置脚本
bash scripts/setup-ssl.sh your-domain.com your-email@example.com
```

**配置过程**:

1. 检查域名解析
2. 安装 Certbot
3. 申请 SSL 证书
4. 配置 Nginx HTTPS
5. 设置自动续期

**完成后**:

```bash
# 测试 HTTPS 访问
curl https://your-domain.com

# 从浏览器访问
https://your-domain.com
```

---

## 常见问题

### 问题 1: 上传速度太慢

**解决方案**:

1. **压缩镜像**: 使用 `gzip` 压缩
2. **分批上传**: 分别上传后端和前端
3. **使用工具**: 使用 `rsync` 或 SFTP 工具支持断点续传

```bash
# 使用 rsync（支持断点续传）
rsync -avz --progress exports/blog-backend-local.tar.gz user@server:/opt/blog/
rsync -avz --progress exports/blog-frontend-local.tar.gz user@server:/opt/blog/
```

---

### 问题 2: 服务器磁盘空间不足

**解决方案**:

1. **清理 Docker 缓存**:
```bash
docker system prune -a
```

2. **删除压缩的镜像文件**（加载后）:
```bash
rm -f blog-backend-local.tar.gz
rm -f blog-frontend-local.tar.gz
```

3. **使用外部存储**: 挂载额外的磁盘

---

### 问题 3: 镜像加载失败

**症状**:
```
Error loading image: write error: no space left on device
```

**解决方案**:

1. 检查磁盘空间: `df -h`
2. 清理空间: `docker system prune -a`
3. 增加 swap 空间:
```bash
fallocate -l 2G /swapfile
chmod 600 /swapfile
mkswap /swapfile
swapon /swapfile
```

---

### 问题 4: 容器启动失败

**症状**:
```
Container exited with code 1
```

**解决方案**:

1. 查看日志: `docker compose logs`
2. 检查配置: `cat .env`
3. 验证镜像: `docker images`
4. 重启服务: `docker compose restart`

---

### 问题 5: 内存不足

**症状**:
```
Cannot allocate memory
```

**解决方案**:

1. **增加 swap**:
```bash
# 创建 4GB swap
fallocate -l 4G /swapfile
chmod 600 /swapfile
mkswap /swapfile
swapon /swapfile

# 永久生效
echo '/swapfile none swap sw 0 0' >> /etc/fstab
```

2. **限制容器内存**:
```yaml
# deployments/docker/compose-files/docker-compose.yml
services:
  backend:
    deploy:
      resources:
        limits:
          memory: 512M
```

3. **优化数据库**:
```yaml
postgres:
  environment:
    - shared_buffers=128MB
    - effective_cache_size=256MB
```

---

## 优化建议

### 1. 减少镜像大小

**在本地构建时**:

```dockerfile
# 使用 alpine 基础镜像
FROM node:20-alpine
FROM rustlang/rust:nightly-slim

# 多阶段构建
FROM builder AS runtime
# 只复制必要的文件
COPY --from=builder /app/dist ./dist
```

### 2. 优化服务器性能

**启用 Docker 优化**:

```json
// /etc/docker/daemon.json
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  },
  "storage-driver": "overlay2"
}
```

**重启 Docker**:
```bash
systemctl restart docker
```

### 3. 数据持久化

**配置数据备份**:

```bash
# 创建备份脚本
cat > /usr/local/bin/backup-blog.sh <<'EOF'
#!/bin/bash
BACKUP_DIR="/opt/backups"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

# 备份数据库
docker compose exec -T postgres pg_dump -U blog_user blog_db > $BACKUP_DIR/db_$DATE.sql

# 备份 Redis
docker compose exec -T redis redis-cli SAVE
docker cp blog-redis:/data/dump.rdb $BACKUP_DIR/redis_$DATE.rdb

# 删除 7 天前的备份
find $BACKUP_DIR -name "blog_backup_*.tar.gz" -mtime +7 -delete
EOF

chmod +x /usr/local/bin/backup-blog.sh

# 添加到 crontab（每天凌晨 2 点）
echo "0 2 * * * /usr/local/bin/backup-blog.sh" | crontab -
```

### 4. 监控资源使用

**安装监控工具**:

```bash
# 安装 htop
apt install htop -y

# 实时监控
htop
```

**查看容器资源**:

```bash
docker stats
```

---

## 快速命令参考

### 本地操作

```bash
# 构建镜像
bash scripts/deployment/build-local-images.sh

# 导出镜像
bash scripts/deployment/export-images.sh

# 上传到服务器
scp exports/*.tar.gz user@server:/opt/blog/
```

### 服务器操作

```bash
# 加载镜像
bash scripts/load-images.sh

# 配置环境
cp .env.example .env && nano .env

# 启动服务
bash scripts/start-from-images.sh

# 查看状态
docker compose ps

# 查看日志
docker compose logs -f

# 重启服务
docker compose restart

# 停止服务
docker compose down
```

---

## 部署检查清单

### 本地准备

- [ ] Docker 已安装并运行
- [ ] 项目已克隆
- [ ] 后端镜像构建成功
- [ ] 前端镜像构建成功
- [ ] 镜像已导出为 tar.gz 文件

### 服务器准备

- [ ] Docker 已安装
- [ ] Docker Compose 已安装
- [ ] 项目目录已创建 (/opt/blog)
- [ ] 磁盘空间充足 (至少 5GB)

### 配置文件

- [ ] .env 文件已创建
- [ ] 数据库密码已修改
- [ ] JWT_SECRET 已生成
- [ ] PASSWORD_PEPPER 已生成
- [ ] SESSION_SECRET 已生成
- [ ] CORS_ALLOWED_ORIGINS 已配置
- [ ] NEXT_PUBLIC_SITE_URL 已配置
- [ ] NEXT_PUBLIC_API_URL 已配置
- [ ] Nginx 配置中的域名已修改

### 服务部署

- [ ] 镜像文件已上传
- [ ] 镜像已成功加载
- [ ] 服务已启动
- [ ] 所有容器状态正常
- [ ] 前端可以访问
- [ ] 后端 API 可以访问
- [ ] 数据库连接正常
- [ ] Redis 连接正常

### SSL 配置（可选）

- [ ] 域名已解析
- [ ] SSL 证书已获取
- [ ] HTTPS 可以访问
- [ ] HTTP 重定向到 HTTPS

---

## 总结

### 部署流程总结

1. **本地构建** (30-40 分钟)
   - 构建 Docker 镜像
   - 导出镜像文件

2. **上传** (10-30 分钟)
   - 上传镜像到服务器
   - 上传配置文件

3. **服务器部署** (5-10 分钟)
   - 加载镜像
   - 配置环境
   - 启动服务

4. **验证** (5 分钟)
   - 测试访问
   - 配置 SSL（可选）

**总耗时**: 50-90 分钟（主要是本地构建时间）

### 关键优势

- ✅ **服务器零编译**: 适合低配置服务器
- ✅ **快速部署**: 服务器部署只需 10 分钟
- ✅ **可重复**: 镜像可以多次使用
- ✅ **离线部署**: 不需要外网连接

### 维护建议

- 定期备份数据库
- 监控资源使用
- 及时更新镜像
- 配置 SSL 证书
- 设置自动续期

---

**文档版本**: 1.0.0
**最后更新**: 2025-12-29
**维护者**: Zhengbi Yong

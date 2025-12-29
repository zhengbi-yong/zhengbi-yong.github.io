# 快速部署指南 - 低配置服务器

**适合场景**: 服务器配置低（CPU/内存不足），需要在本地构建镜像

---

## 🚀 三步完成部署

### 第一步：本地构建（30-40 分钟）

```bash
# 1. 克隆项目
git clone https://github.com/zhengbi-yong/zhengbi-yong.github.io.git
cd zhengbi-yong.github.io

# 2. 构建 Docker 镜像
bash scripts/deployment/build-local-images.sh

# 3. 导出镜像
bash scripts/deployment/export-images.sh
```

**完成后会生成**:
- `exports/blog-backend-local.tar.gz` (~350MB)
- `exports/blog-frontend-local.tar.gz` (~800MB)
- `exports/blog-deploy-package.tar.gz` (~1.2GB)

---

### 第二步：上传到服务器（10-30 分钟）

```bash
# 在本地执行（选择一种方式）

# 方式 A: 上传完整部署包（推荐）
scp exports/blog-deploy-package.tar.gz user@server:/opt/

# 方式 B: 分别上传
scp exports/blog-backend-local.tar.gz user@server:/opt/blog/
scp exports/blog-frontend-local.tar.gz user@server:/opt/blog/
```

**上传时间**:
- 100Mbps 网络: ~2-3 分钟
- 10Mbps 网络: ~20-30 分钟

---

### 第三步：服务器部署（5-10 分钟）

```bash
# SSH 连接到服务器
ssh user@server

# 解压部署包（如果使用了方式 A）
cd /opt
tar xzf blog-deploy-package.tar.gz -C deploy-package
cd deploy-package

# 或进入项目目录（如果使用了方式 B）
cd /opt/blog

# 1. 加载镜像
bash scripts/load-images.sh

# 2. 配置环境变量
cp .env.example .env
nano .env  # 修改域名和密钥

# 3. 启动服务
bash scripts/start-from-images.sh
```

**完成！** 访问 `http://your-server-ip`

---

## 📝 配置要点

### 必须修改的配置

编辑 `/opt/blog/.env`:

```bash
# 数据库密码
POSTGRES_PASSWORD=你的密码

# 安全密钥（在本地生成: openssl rand -base64 32）
JWT_SECRET=生成的密钥1
PASSWORD_PEPPER=生成的密钥2
SESSION_SECRET=生成的密钥3

# 域名
CORS_ALLOWED_ORIGINS=https://your-domain.com
NEXT_PUBLIC_SITE_URL=https://your-domain.com
NEXT_PUBLIC_API_URL=https://your-domain.com
```

编辑 `/opt/blog/nginx/conf.d/blog.conf`:

```nginx
server_name your-domain.com;  # 第 7 行
```

---

## 🔒 配置 SSL（可选）

```bash
cd /opt/blog
bash scripts/setup-ssl.sh your-domain.com your@email.com
```

---

## ✅ 验证部署

```bash
# 运行验证脚本
bash scripts/verify-deployment.sh http://your-server-ip

# 或从浏览器访问
http://your-server-ip
```

---

## 📚 详细文档

- **完整指南**: [LOW_RESOURCE_SERVER_DEPLOYMENT.md](LOW_RESOURCE_SERVER_DEPLOYMENT.md)
- **配置清单**: [CONFIG_CHECKLIST.md](CONFIG_CHECKLIST.md)
- **故障排查**: [SERVER_DEPLOYMENT_GUIDE.md](SERVER_DEPLOYMENT_GUIDE.md#常见问题排查)

---

## 🆘 遇到问题？

### 上传太慢

```bash
# 使用 rsync（支持断点续传）
rsync -avz --progress exports/*.tar.gz user@server:/opt/blog/
```

### 磁盘空间不足

```bash
# 清理 Docker（释放空间）
docker system prune -a

# 删除压缩的镜像文件（加载后）
rm -f blog-*-local.tar.gz
```

### 内存不足

```bash
# 增加 swap（2GB）
fallocate -l 2G /swapfile
chmod 600 /swapfile
mkswap /swapfile
swapon /swapfile
```

---

## 📞 获取帮助

- GitHub Issues: https://github.com/zhengbi-yong/zhengbi-yong.github.io/issues
- 完整文档: `docs/deployment/`

---

**预计总时间**: 50-90 分钟（主要是本地构建）

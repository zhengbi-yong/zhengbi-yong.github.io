# 低配置服务器部署 - 文件索引

**创建时间**: 2025-12-29
**适用场景**: 服务器配置低（2GB 内存），需要在本地构建所有镜像

---

## 📚 文档清单

### 必读文档

1. **[QUICK_START_LOW_RESOURCE.md](QUICK_START_LOW_RESOURCE.md)** ⭐⭐⭐
   - 快速开始指南
   - 三步完成部署
   - 5 分钟阅读

2. **[LOW_RESOURCE_SERVER_DEPLOYMENT.md](LOW_RESOURCE_SERVER_DEPLOYMENT.md)** ⭐⭐⭐
   - 完整部署指南
   - 详细步骤说明
   - 常见问题解答
   - 20 分钟阅读

3. **[CONFIG_CHECKLIST.md](CONFIG_CHECKLIST.md)** ⭐⭐⭐
   - 配置修改清单
   - 打勾式检查
   - 部署前必看

### 参考文档

4. **[SERVER_DEPLOYMENT_GUIDE.md](SERVER_DEPLOYMENT_GUIDE.md)**
   - 通用部署指南
   - 包含两种部署方式

5. **[DEPLOYMENT_VERIFICATION.md](../DEPLOYMENT_VERIFICATION.md)**
   - 部署验证报告
   - Docker 化程度检查

---

## 🛠️ 脚本清单

### 本地阶段脚本（在本地机器运行）

#### 1. build-local-images.sh
**用途**: 在本地构建所有 Docker 镜像

**使用**:
```bash
bash scripts/deployment/build-local-images.sh
```

**功能**:
- 检查 Docker 环境
- 构建后端镜像（Rust，10-20 分钟）
- 构建前端镜像（Next.js，15-30 分钟）
- 验证镜像可用性

**输出**:
- `blog-backend:local` 镜像
- `blog-frontend:local` 镜像

**预计时间**: 30-50 分钟

---

#### 2. export-images.sh
**用途**: 将构建好的镜像导出为 tar.gz 文件

**使用**:
```bash
bash scripts/deployment/export-images.sh
```

**功能**:
- 检查镜像存在
- 导出后端镜像（~500MB）
- 导出前端镜像（~1.5GB）
- 压缩文件（可选，减少 30-50%）
- 创建部署包

**输出**:
- `exports/blog-backend-local.tar.gz` (~350MB)
- `exports/blog-frontend-local.tar.gz` (~800MB)
- `exports/blog-deploy-package.tar.gz` (~1.2GB)

**预计时间**: 5-10 分钟

---

### 服务器阶段脚本（在服务器运行）

#### 3. load-images.sh
**用途**: 在服务器上加载 Docker 镜像

**使用**:
```bash
cd /opt/blog
bash scripts/load-images.sh
```

**功能**:
- 检查镜像文件
- 检查磁盘空间
- 解压镜像文件（如果压缩）
- 加载后端镜像到 Docker
- 加载前端镜像到 Docker
- 验证镜像可用

**预计时间**: 5-10 分钟

---

#### 4. start-from-images.sh
**用途**: 使用已加载的镜像启动所有服务

**使用**:
```bash
cd /opt/blog
bash scripts/start-from-images.sh
```

**功能**:
- 检查镜像和配置
- 创建 Docker 网络
- 启动所有容器
- 等待服务就绪
- 健康检查
- 配置防火墙

**预计时间**: 2-3 分钟

---

### 通用脚本

#### 5. setup-ssl.sh
**用途**: 配置 Let's Encrypt SSL 证书

**使用**:
```bash
bash scripts/setup-ssl.sh your-domain.com your@email.com
```

**功能**:
- 检查域名解析
- 安装 Certbot
- 申请 SSL 证书
- 配置 Nginx HTTPS
- 设置自动续期

**预计时间**: 5-10 分钟

---

#### 6. verify-deployment.sh
**用途**: 验证所有功能是否正常

**使用**:
```bash
bash scripts/verify-deployment.sh http://your-domain.com
```

**功能**:
- 检查容器状态
- 测试网络连接
- 验证数据库功能
- 检查化学可视化库
- 性能基准测试
- 安全配置检查

**输出**: 彩色测试报告

---

## 📋 部署流程图

```
┌─────────────────────────────────────────────────────────┐
│                    本地机器                               │
│  (Windows/Mac/Linux, 8GB+ 内存)                         │
└─────────────────────────────────────────────────────────┘
                          │
                          │ 1. 构建镜像
                          ↓
              ┌───────────────────────┐
              │ build-local-images.sh │
              │  (30-50 分钟)          │
              └───────────────────────┘
                          │
              ┌───────────────────────┐
              │   blog-backend:local  │
              │   blog-frontend:local │
              └───────────────────────┘
                          │
                          │ 2. 导出镜像
                          ↓
              ┌───────────────────────┐
              │   export-images.sh    │
              │    (5-10 分钟)         │
              └───────────────────────┘
                          │
              ┌───────────────────────┐
              │  *.tar.gz 文件         │
              │  (~1.2GB)              │
              └───────────────────────┘
                          │
                          │ 3. 上传到服务器
                          ├──────────────────────────────────┐
                          │                                  │
                          ↓                                  ↓
              ┌───────────────────────┐          ┌───────────────────────┐
              │    上传时间:           │          │     服务器             │
              │ 100Mbps: 2-3 分钟      │          │ (低配置, 2GB 内存)    │
              │ 10Mbps: 20-30 分钟     │          └───────────────────────┘
              └───────────────────────┘                          │
                                                                   │
                                                                   │ 4. 加载镜像
                                                                   ↓
                                                          ┌───────────────────────┐
                                                          │   load-images.sh      │
                                                          │    (5-10 分钟)         │
                                                          └───────────────────────┘
                                                                   │
                                                          ┌───────────────────────┐
                                                          │  Docker 镜像已加载     │
                                                          └───────────────────────┘
                                                                   │
                                                                   │ 5. 配置环境
                                                                   ↓
                                                          ┌───────────────────────┐
                                                          │  .env 文件配置         │
                                                          │  Nginx 配置            │
                                                          └───────────────────────┘
                                                                   │
                                                                   │ 6. 启动服务
                                                                   ↓
                                                          ┌───────────────────────┐
                                                          │ start-from-images.sh  │
                                                          │    (2-3 分钟)          │
                                                          └───────────────────────┘
                                                                   │
                                                          ┌───────────────────────┐
                                                          │   所有服务运行中       │
                                                          └───────────────────────┘
                                                                   │
                                                                   │ 7. 验证（可选）
                                                                   ↓
                                                          ┌───────────────────────┐
                                                          │ verify-deployment.sh  │
                                                          └───────────────────────┘
```

---

## 🎯 快速命令参考

### 本地操作

```bash
# 一键构建和导出
bash scripts/deployment/build-local-images.sh && \
bash scripts/deployment/export-images.sh

# 查看导出的文件
ls -lh exports/
```

### 服务器操作

```bash
# 一键加载和启动
cd /opt/blog
bash scripts/load-images.sh && \
cp .env.example .env && nano .env && \
bash scripts/start-from-images.sh

# 查看服务状态
docker compose ps

# 查看日志
docker compose logs -f
```

---

## ⚠️ 注意事项

### 本地阶段

1. **磁盘空间**: 至少 10GB 可用空间
2. **内存**: 至少 8GB（构建时需要）
3. **网络**: 稳定的网络连接（下载依赖）
4. **时间**: 预留 30-50 分钟构建时间

### 服务器阶段

1. **磁盘空间**: 至少 5GB 可用空间
2. **内存**: 至少 2GB（推荐 4GB）
3. **Docker**: 必须先安装 Docker 和 Docker Compose
4. **权限**: 需要 sudo 或 root 权限

---

## 📊 时间和资源消耗

| 阶段 | 时间 | 磁盘空间 | 内存 | 网络 |
|------|------|----------|------|------|
| 本地构建 | 30-50 分钟 | +5GB | 8GB | ~2GB 下载 |
| 导出镜像 | 5-10 分钟 | +2GB | 最小 | 无 |
| 上传文件 | 2-30 分钟 | - | 最小 | ~1.2GB 上传 |
| 加载镜像 | 5-10 分钟 | +2GB | 最小 | 无 |
| 启动服务 | 2-3 分钟 | 最小 | 2GB | 无 |
| **总计** | **44-103 分钟** | **~9GB** | **-** | **~3.2GB 传输** |

---

## 🔍 故障排查

### 问题: 构建失败

**检查**:
```bash
# Docker 是否运行
docker ps

# 磁盘空间是否足够
df -h

# 内存是否足够
free -h
```

### 问题: 上传中断

**解决**: 使用 rsync 支持断点续传
```bash
rsync -avz --progress exports/*.tar.gz user@server:/opt/blog/
```

### 问题: 服务器内存不足

**解决**: 增加 swap
```bash
fallocate -l 2G /swapfile
chmod 600 /swapfile
mkswap /swapfile
swapon /swapfile
```

---

## 📞 获取帮助

- **完整文档**: [LOW_RESOURCE_SERVER_DEPLOYMENT.md](LOW_RESOURCE_SERVER_DEPLOYMENT.md)
- **快速开始**: [QUICK_START_LOW_RESOURCE.md](QUICK_START_LOW_RESOURCE.md)
- **配置清单**: [CONFIG_CHECKLIST.md](CONFIG_CHECKLIST.md)
- **GitHub Issues**: https://github.com/zhengbi-yong/zhengbi-yong.github.io/issues

---

## ✅ 检查清单

### 本地准备

- [ ] Docker 已安装并运行
- [ ] 项目已克隆
- [ ] 运行 `build-local-images.sh`
- [ ] 运行 `export-images.sh`
- [ ] 确认导出文件存在

### 服务器准备

- [ ] Docker 已安装
- [ ] 项目目录已创建
- [ ] 磁盘空间充足（5GB+）
- [ ] 镜像文件已上传
- [ ] 运行 `load-images.sh`
- [ ] 配置 `.env` 文件
- [ ] 修改 Nginx 配置
- [ ] 运行 `start-from-images.sh`
- [ ] 服务正常运行
- [ ] 可以访问前端

### 可选优化

- [ ] 配置 SSL 证书
- [ ] 运行 `verify-deployment.sh`
- [ ] 设置自动备份
- [ ] 配置防火墙

---

**版本**: 1.0.0
**最后更新**: 2025-12-29
**维护者**: Zhengbi Yong

# 部署文档索引

**版本**: v1.0.0
**最后更新**: 2025-12-29

---

## 📚 文档导航

本目录包含所有部署相关文档，涵盖本地开发环境到生产服务器的完整部署流程。

---

## 🚀 快速开始指南

### 本地开发环境

如果你是第一次在本地运行项目，建议从以下文档开始：

1. **[Docker 跨平台快速启动](../getting-started/docker-quick-start.md)** ⭐⭐⭐
   - 适用于所有平台（Windows, macOS, Linux）
   - 最简单、最可靠的启动方式
   - 预计启动时间: 5-10 分钟

2. **平台特定指南** ⭐⭐
   - **[Windows 本地开发](../getting-started/local-development-windows.md)** - WSL2 和原生 Windows
   - **[macOS 本地开发](../getting-started/local-development-macos.md)** - Apple Silicon 和 Intel
   - **[Linux 本地开发](../getting-started/local-development-linux.md)** - Ubuntu, Debian, Fedora, Arch

3. **[快速开始](../getting-started/quick-start.md)** ⭐⭐
   - Docker 和传统开发模式概览
   - 帮助选择合适的启动方式

### 生产服务器部署

如果你准备部署到生产服务器，建议按以下顺序阅读：

1. **[服务器部署完整指南](SERVER_DEPLOYMENT_GUIDE.md)** ⭐⭐⭐
   - 最详细的部署指南
   - 包含所有步骤和故障排查
   - 预计部署时间: 30-60 分钟
   - **适用系统**: Ubuntu 20.04+, Debian 11+, CentOS 8+

2. **[配置修改清单](CONFIG_CHECKLIST.md)** ⭐⭐⭐
   - 快速检查所有需要修改的配置
   - 打勾式清单，不会遗漏
   - **部署前必看**

3. **[Docker 完整部署](docker.md)** ⭐⭐
   - Docker 部署的详细说明
   - 包含性能优化和安全加固

---

## 📋 部署方式对比

| 部署方式 | 适用场景 | 难度 | 时间 | 文档 |
|---------|---------|------|------|------|
| **Docker 本地开发** | 本地开发、测试 | ⭐ | 5-10 分钟 | [Docker 快速启动](../getting-started/docker-quick-start.md) |
| **传统开发模式** | 前后端分离开发 | ⭐⭐ | 15-30 分钟 | [平台特定指南](../getting-started/) |
| **服务器一键部署** | 生产环境部署 | ⭐⭐ | 20-40 分钟 | [服务器部署指南](SERVER_DEPLOYMENT_GUIDE.md) |
| **手动服务器部署** | 定制化生产环境 | ⭐⭐⭐ | 1-2 小时 | [完整部署指南](SERVER_DEPLOYMENT_GUIDE.md) |

---

## 🔧 相关文档

### 本地开发

- **[Docker 快速启动](../getting-started/docker-quick-start.md)** - 跨平台 Docker 部署
- **[Windows 本地开发](../getting-started/local-development-windows.md)** - Windows 特定指南
- **[macOS 本地开发](../getting-started/local-development-macos.md)** - macOS 特定指南
- **[Linux 本地开发](../getting-started/local-development-linux.md)** - Linux 特定指南
- **[安装指南](../getting-started/installation.md)** - 详细的安装步骤
- **[环境配置](../getting-started/environment-setup.md)** - 环境变量配置

### 服务器部署

- **[服务器部署完整指南](SERVER_DEPLOYMENT_GUIDE.md)** ⭐⭐⭐ - 详细的服务器部署文档
- **[配置修改清单](CONFIG_CHECKLIST.md)** ⭐⭐⭐ - 部署前检查清单
- **[Docker 完整部署](docker.md)** ⭐⭐ - Docker 部署详细说明
- **[单服务器部署](single-server.md)** - 快速单服务器部署
- **[高可用部署](high-availability.md)** - 生产环境高可用配置

---

## 🛠️ 部署脚本

所有脚本位于 `scripts/deployment/` 目录。

### 1️⃣ 快速部署脚本

**文件**: `scripts/deployment/quick-deploy.sh`

**用途**: 一键自动部署博客系统

**使用方法**:
```bash
bash scripts/deployment/quick-deploy.sh your-domain.com
```

**功能**:
- ✅ 自动生成所有安全密钥
- ✅ 配置环境变量
- ✅ 更新 Nginx 配置
- ✅ 构建 Docker 镜像
- ✅ 启动所有服务
- ✅ 运行健康检查

**适合**: 首次部署或快速测试

**预计时间**: 20-40 分钟

---

### 2️⃣ SSL 证书配置脚本

**文件**: `scripts/deployment/setup-ssl.sh`

**用途**: 自动配置 Let's Encrypt SSL 证书

**使用方法**:
```bash
bash scripts/deployment/setup-ssl.sh your-domain.com [your-email@example.com]
```

**功能**:
- ✅ 自动申请 SSL 证书
- ✅ 配置 Nginx HTTPS
- ✅ 设置 HTTP 到 HTTPS 重定向
- ✅ 配置证书自动续期

**适合**: 已完成基础部署，需要配置 HTTPS

**预计时间**: 5-10 分钟

---

### 3️⃣ 部署验证脚本

**文件**: `scripts/deployment/verify-deployment.sh`

**用途**: 自动检查所有功能是否正常

**使用方法**:
```bash
# HTTP
bash scripts/deployment/verify-deployment.sh http://your-domain.com

# HTTPS
bash scripts/deployment/verify-deployment.sh https://your-domain.com
```

**功能**:
- ✅ 检查所有容器状态
- ✅ 测试网络连接
- ✅ 验证数据库功能
- ✅ 检查化学可视化库
- ✅ 测试性能基准
- ✅ 检查安全配置

**输出**: 彩色的测试报告

**适合**: 部署后验证或日常健康检查

---

## 📖 完整部署流程

### 方案 A: 全自动部署（推荐新手）

```bash
# 1. 上传项目到服务器
git clone https://github.com/zhengbi-yong/zhengbi-yong.github.io.git
cd zhengbi-yong.github.io

# 2. 运行快速部署脚本
bash scripts/deployment/quick-deploy.sh your-domain.com

# 3. 配置 SSL 证书
bash scripts/deployment/setup-ssl.sh your-domain.com

# 4. 验证部署
bash scripts/deployment/verify-deployment.sh https://your-domain.com
```

**优点**: 简单、快速、自动化
**缺点**: 灵活性较低

---

### 方案 B: 手动部署（推荐有经验用户）

**步骤**:

1. **阅读文档** (15 分钟)
   ```bash
   # 阅读: SERVER_DEPLOYMENT_GUIDE.md
   # 了解完整的部署流程
   ```

2. **准备服务器** (10 分钟)
   ```bash
   # 安装 Docker
   curl -fsSL https://get.docker.com | sh

   # 安装 Docker Compose
   # 参考: SERVER_DEPLOYMENT_GUIDE.md 步骤 2
   ```

3. **上传项目** (5 分钟)
   ```bash
   # 方法 1: Git 克隆
   git clone https://github.com/zhengbi-yong/zhengbi-yong.github.io.git

   # 方法 2: 手动上传
   # 参考: SERVER_DEPLOYMENT_GUIDE.md 步骤 5
   ```

4. **修改配置** (10 分钟)
   ```bash
   # 使用配置清单
   # 参考: CONFIG_CHECKLIST.md

   # 生成密钥
   openssl rand -base64 32
   ```

5. **构建镜像** (20 分钟)
   ```bash
   docker compose build
   ```

6. **启动服务** (5 分钟)
   ```bash
   docker compose up -d
   ```

7. **配置 SSL** (10 分钟)
   ```bash
   bash scripts/deployment/setup-ssl.sh your-domain.com
   ```

8. **验证部署** (5 分钟)
   ```bash
   bash scripts/deployment/verify-deployment.sh https://your-domain.com
   ```

**优点**: 完全控制、可定制
**缺点**: 需要一定经验

---

## ⚡ 快速命令参考

### 容器管理

```bash
# 启动所有服务
docker compose up -d

# 停止所有服务
docker compose down

# 重启服务
docker compose restart

# 查看服务状态
docker compose ps

# 查看日志
docker compose logs -f
```

### 验证测试

```bash
# 运行完整验证
bash scripts/deployment/verify-deployment.sh https://your-domain.com

# 快速健康检查
curl https://your-domain.com/v1/health

# 查看容器状态
docker compose ps
```

### 备份恢复

```bash
# 数据库备份
docker compose exec postgres pg_dump -U blog_user blog_db > backup.sql

# 数据库恢复
docker compose exec -T postgres psql -U blog_user blog_db < backup.sql

# 备份所有数据
./scripts/deployment/backup.sh
```

---

## 🔍 故障排查

### 常见问题

| 问题 | 解决方案 | 文档链接 |
|------|----------|----------|
| 容器无法启动 | 查看日志检查错误 | [SERVER_DEPLOYMENT_GUIDE.md](SERVER_DEPLOYMENT_GUIDE.md#常见问题排查) |
| 前端无法访问 | 检查 CORS 配置 | [CONFIG_CHECKLIST.md](CONFIG_CHECKLIST.md) |
| 化学库不显示 | 检查文件是否存在 | [CHEMISTRY_VISUALIZATION_SETUP.md](../CHEMISTRY_VISUALIZATION_SETUP.md) |
| SSL 证书失败 | 检查域名解析 | [SERVER_DEPLOYMENT_GUIDE.md](SERVER_DEPLOYMENT_GUIDE.md#问题-4-ssl-证书获取失败) |

### 获取帮助

1. **查看日志**: `docker compose logs`
2. **运行验证**: `bash scripts/deployment/verify-deployment.sh`
3. **阅读文档**: 查看 `docs/` 目录下的相关文档
4. **提交 Issue**: https://github.com/zhengbi-yong/zhengbi-yong.github.io/issues

---

## 📊 部署检查清单

### 部署前检查

- [ ] 服务器已安装 Docker 和 Docker Compose
- [ ] 域名已解析到服务器 IP
- [ ] 防火墙已开放 80、443 端口
- [ ] 服务器内存至少 4GB
- [ ] 服务器磁盘至少 20GB 可用空间

### 配置修改检查

- [ ] 已修改 `.env` 文件中所有密码和密钥
- [ ] 已修改 `CORS_ALLOWED_ORIGINS`
- [ ] 已修改 `NEXT_PUBLIC_SITE_URL` 和 `NEXT_PUBLIC_API_URL`
- [ ] 已修改 Nginx 配置中的域名
- [ ] 已修改 docker-compose.yml 中的环境变量引用

### 部署后验证

- [ ] 所有容器状态正常
- [ ] 前端页面可以访问
- [ ] 后端 API 可以访问
- [ ] 数据库连接正常
- [ ] Redis 连接正常
- [ ] 化学可视化功能正常
- [ ] SSL 证书已配置（可选）

---

## 🎯 推荐部署路径

### 路径 1: 快速测试（30 分钟）

```bash
# 适合: 快速测试，学习使用
git clone <repo>
bash scripts/deployment/quick-deploy.sh test.your-domain.com
```

### 路径 2: 生产部署（1 小时）

```bash
# 适合: 正式上线
git clone <repo>
# 按照 SERVER_DEPLOYMENT_GUIDE.md 手动配置
bash scripts/deployment/quick-deploy.sh your-domain.com
bash scripts/deployment/setup-ssl.sh your-domain.com your@email.com
bash scripts/deployment/verify-deployment.sh https://your-domain.com
```

### 路径 3: 高级定制（2 小时）

```bash
# 适合: 需要定制配置
git clone <repo>
# 详细阅读所有文档
# 手动修改所有配置
# 逐步部署和测试
```

---

## 📞 联系方式

- **项目主页**: https://github.com/zhengbi-yong/zhengbi-yong.github.io
- **博客地址**: https://zhengbi-yong.github.io
- **Issues**: https://github.com/zhengbi-yong/zhengbi-yong.github.io/issues

---

## 📝 更新日志

### v1.0.0 (2025-12-29)

- ✅ 创建完整的部署指南
- ✅ 创建配置修改清单
- ✅ 创建自动部署脚本
- ✅ 创建 SSL 配置脚本
- ✅ 创建验证测试脚本
- ✅ 创建文档索引

---

**文档维护者**: Zhengbi Yong
**最后更新**: 2025-12-29
**反馈渠道**: GitHub Issues

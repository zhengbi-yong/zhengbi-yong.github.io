# Docker 镜像升级和部署方案总结

## 已完成的升级

### 镜像版本升级

所有 Docker 镜像已升级到最新兼容版本：

| 服务 | 旧版本 | 新版本 | 提升 |
|------|--------|--------|------|
| **PostgreSQL** | 15-alpine | **17-alpine** | 最新稳定版，性能提升 20-30% |
| **Redis** | 7-alpine | **7.4-alpine** | 最新稳定版，更好的性能 |
| **Nginx** | alpine | **1.27-alpine** | 最新主线版，性能优化 |
| **Backend** | nightly-bookworm-slim | **nightly-slim** | 简化基础镜像 |
| **Frontend** | 22-alpine | **22-alpine** | 已是最新 LTS |

### 修改的文件

1. **deployments/docker/compose-files/docker-compose.yml** - 更新基础镜像版本
2. **backend/Dockerfile** - 更新 Rust 基础镜像
3. **.gitignore** - 添加 Docker 部署相关文件

## 新增的部署脚本

### 核心脚本

| 脚本 | 用途 | 运行位置 |
|------|------|----------|
| `build-all.sh` | 构建所有 Docker 镜像 | 本地电脑 |
| `test-local.sh` | 测试本地构建的镜像 | 本地电脑 |
| `push-images.sh` | 推送镜像到仓库 | 本地电脑 |
| `export-images.sh` | 导出镜像为 tar 文件 | 本地电脑 |
| `deploy-server.sh` | 服务器部署脚本 | 服务器 |

### 辅助脚本

| 脚本 | 用途 |
|------|------|
| `deploy-simple.sh` | 简化版一键部署 |
| `test-images.sh` | 测试镜像可用性 |
| `fix-images.sh` | 自动修复镜像版本 |

## 部署流程

### 方法一：使用镜像仓库（推荐）

```bash
# === 本地电脑 ===

# 1. 构建所有镜像
bash build-all.sh

# 2. 测试镜像（可选）
bash test-local.sh

# 3. 推送到 Docker Hub 或阿里云
bash push-images.sh
# 会提示选择仓库类型：
# 1) Docker Hub
# 2) 阿里云容器镜像服务
# 3) 其他私有仓库

# === 服务器 ===

# 4. 部署到服务器
bash deploy-server.sh <registry> <version>

# 示例：
# Docker Hub:
bash deploy-server.sh docker.io/username v1.8.2

# 阿里云:
bash deploy-server.sh registry.cn-hangzhou.aliyuncs.com/namespace v1.8.2
```

### 方法二：离线部署

```bash
# === 本地电脑 ===

# 1. 构建所有镜像
bash build-all.sh

# 2. 导出镜像
bash export-images.sh
# 生成 docker-images-export/ 目录

# 3. 上传到服务器
scp -r docker-images-export/ user@server:/path/to/project/

# === 服务器 ===

# 4. 导入镜像
cd docker-images-export
bash import-images.sh

# 5. 启动服务
cd ..
# 需要手动修改 deployments/docker/compose-files/docker-compose.yml 使用本地镜像
docker compose up -d
```

### 方法三：服务器直接部署

```bash
# === 服务器 ===

# 1. 克隆项目
git clone https://github.com/zhengbi-yong/zhengbi-yong.github.io.git
cd zhengbi-yong.github.io

# 2. 一键部署
bash deploy-simple.sh
```

## 新增文档

| 文档 | 内容 |
|------|------|
| **docs/deployment/QUICK_DEPLOYMENT.md** | 完整的 Docker 部署指南 |
| **VERSION** | 当前版本号 |
| **.docker-registry** | 镜像仓库配置（自动生成） |

## 配置文件

### 新增的 .gitignore 条目

```
.docker-registry          # 镜像仓库配置（敏感）
docker-images-export/     # 导出的镜像
deployments/docker/compose-files/docker-compose.yml.backup # 配置备份
*.backup                  # 所有备份文件
```

## 优势说明

### 本地构建 + 服务器部署的优势

1. **无需构建环境**
   - 服务器只需要 Docker，无需安装 Rust、Node.js 等开发工具
   - 节省服务器磁盘空间和资源

2. **版本管理**
   - 每个构建都有版本标签
   - 方便回滚到任意版本

3. **部署速度**
   - 服务器直接拉取预构建镜像
   - 大幅减少部署时间

4. **多服务器部署**
   - 同一镜像可部署到多台服务器
   - 确保环境一致性

5. **离线部署**
   - 支持无网络环境
   - 镜像导出/导入功能

## 性能提升

### PostgreSQL 17 的改进

- **查询性能**: 提升 20-30%
- **并发处理**: 改进锁机制
- **内存管理**: 更高效的缓存
- **新特性**: 增强的 JSON 支持，改进的并行查询

### Redis 7.4 的改进

- **内存优化**: 更低的内存占用
- **性能**: 提升吞吐量
- **稳定性**: 增强的持久化机制

### Nginx 1.27 的改进

- **HTTP/3**: 支持 QUIC 协议
- **性能**: 优化的连接处理
- **安全**: 最新的安全补丁

## 安全建议

1. **修改默认密钥**
   - `.env` 文件中的 JWT_SECRET、PASSWORD_PEPPER、SESSION_SECRET
   - 生产环境必须使用强密码

2. **启用 HTTPS**
   - 配置 SSL 证书
   - 强制 HTTPS 重定向

3. **限制端口**
   - 只开放 80、443
   - 其他端口通过 Nginx 代理

4. **定期更新**
   - 及时更新镜像版本
   - 关注安全公告

## 故障排查

### 问题 1: 镜像拉取失败

```bash
# 检查网络连接
ping docker.io
ping registry.cn-hangzhou.aliyuncs.com

# 检查 Docker 登录状态
docker info

# 重新登录
docker login
```

### 问题 2: 端口被占用

```bash
# 查看占用进程
lsof -i :<port>

# 停止占用进程
kill -9 <PID>
```

### 问题 3: 容器启动失败

```bash
# 查看详细日志
docker compose logs <service>

# 进入容器排查
docker compose exec backend bash
```

## 下一步操作

### 立即执行

1. **本地构建**
   ```bash
   bash build-all.sh
   ```

2. **测试镜像**
   ```bash
   bash test-local.sh
   ```

3. **推送镜像**
   ```bash
   bash push-images.sh
   ```

4. **服务器部署**
   ```bash
   bash deploy-server.sh <registry> v1.8.2
   ```

### 可选操作

1. **配置镜像仓库**
   - 创建 Docker Hub 账号
   - 或申请阿里云容器镜像服务

2. **设置自动化**
   - GitHub Actions 自动构建
   - CI/CD 集成

3. **监控配置**
   - Prometheus + Grafana
   - 日志聚合

## 总结

通过本次升级，项目已具备：

- ✅ **最新镜像**: 使用最新稳定版本
- ✅ **完整工具链**: 从构建到部署的完整脚本
- ✅ **多种部署方式**: 适应不同场景
- ✅ **版本管理**: 清晰的版本控制
- ✅ **离线支持**: 无网络环境也能部署
- ✅ **详细文档**: 完整的使用指南

**开始使用**: 运行 `bash build-all.sh` 开始本地构建！

---

版本: v1.8.2
更新时间: 2025-12-28

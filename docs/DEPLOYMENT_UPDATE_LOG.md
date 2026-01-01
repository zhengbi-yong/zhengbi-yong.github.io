# 部署配置更新日志

**更新日期**: 2025-12-29
**版本**: v1.0.0

## 更新内容

### 新增文件

#### 1. 服务器配置目录 (`server-setup/`)
- `.env.production` - 生产环境变量配置模板
- `nginx.conf` - Nginx 主配置文件
- `site.conf` - Nginx 站点配置文件（反向代理）
- `README.md` - 配置说明文档

#### 2. 部署脚本 (`scripts/`)
- `deploy-production.sh` - 一键部署脚本

#### 3. 部署文档 (`docs/`)
- `SERVER_DEPLOYMENT_GUIDE.md` - 完整服务器部署指南
- `DEPLOYMENT_STRUCTURE.md` - 部署文件结构说明

#### 4. 部署指南
- `docs/deployment/QUICK_DEPLOYMENT.md` - 快速部署指南（项目根目录）

### 更新的配置

#### docker-compose.server.yml
- 使用本地构建的镜像 (`blog-backend:local`, `blog-frontend:local`)
- 包含所有服务：PostgreSQL, Redis, Backend, Frontend
- 配置健康检查和数据持久化

#### .env.production
主要配置项：
- **服务器地址**: `152.136.43.194`（需修改为实际 IP）
- **API URL**: `http://152.136.43.194/api`
- **CORS 配置**: 包含根域名和 3001 端口
- **安全密钥**: 已生成随机密钥（建议重新生成）

#### Nginx 配置
- **反向代理规则**:
  - `/` → Frontend (localhost:3001)
  - `/api` → Backend (localhost:3000)
- **Gzip 压缩**: 已启用
- **日志格式**: 标准化访问日志

### 部署流程优化

#### 之前的流程
1. 手动构建镜像
2. 手动导出镜像
3. 手动上传文件
4. 手动配置服务器
5. 手动启动服务

#### 现在的流程
**一键部署**:
```bash
./scripts/deployment/deploy-production.sh <server-ip> <user>
```

自动完成：
1. ✅ 构建 Docker 镜像
2. ✅ 导出镜像为 tar 文件
3. ✅ 上传镜像到服务器
4. ✅ 上传配置文件
5. ✅ 配置 Nginx
6. ✅ 启动所有服务

### 关键改进

#### 1. CORS 配置修复
**问题**: 前端通过 Nginx (80端口) 访问时，后端 CORS 不允许

**解决**:
```env
# 之前
CORS_ALLOWED_ORIGINS=http://152.136.43.194:3001

# 现在
CORS_ALLOWED_ORIGINS=http://152.136.43.194,http://152.136.43.194:3001,http://localhost:3001
```

#### 2. API URL 配置
**问题**: 前端无法连接后端 API

**解决**:
```env
# 之前
NEXT_PUBLIC_API_URL=http://152.136.43.194:3000

# 现在（通过 Nginx 代理）
NEXT_PUBLIC_API_URL=http://152.136.43.194/api
```

#### 3. 邮件服务配置
**问题**: 空的 SMTP 配置导致后端启动失败

**解决**:
```env
# 使用本地默认配置
SMTP_HOST=localhost
SMTP_PORT=25
SMTP_USERNAME=noreply@localhost
```

#### 4. 防火墙配置
**新增**: 开放 3000 和 3001 端口（可选）
```bash
sudo ufw allow 3000/tcp
sudo ufw allow 3001/tcp
```

### 使用方法

#### 首次部署

1. **修改配置**:
   ```bash
   cd server-setup
   nano .env.production
   # 修改 IP 地址、安全密钥等
   ```

2. **执行部署**:
   ```bash
   ./scripts/deployment/deploy-production.sh 152.136.43.194 ubuntu
   ```

3. **验证部署**:
   ```bash
   # 浏览器访问
   http://152.136.43.194
   ```

#### 更新部署

当代码更新后：

```bash
# 1. 本地重新构建
npm run build
npm run export

# 2. 重新部署
./scripts/deployment/deploy-production.sh 152.136.43.194 ubuntu
```

### 安全建议

⚠️ **重要**：在部署到生产环境前，必须：

1. **修改安全密钥**:
   ```bash
   # 生成新的随机密钥
   openssl rand -hex 32
   ```

2. **修改数据库密码**

3. **配置 HTTPS**（使用 Let's Encrypt）

4. **限制防火墙规则**

### 文档说明

| 文档 | 用途 | 位置 |
|------|------|------|
| 快速部署指南 | 快速上手 | `docs/deployment/QUICK_DEPLOYMENT.md` |
| 完整部署指南 | 详细步骤 | `docs/SERVER_DEPLOYMENT_GUIDE.md` |
| 配置文件说明 | 配置详解 | `server-setup/README.md` |
| 文件结构说明 | 文件组织 | `docs/DEPLOYMENT_STRUCTURE.md` |

### 已知问题

1. **健康检查失败**: `/health` 端点不存在，不影响实际功能
2. **HTTPS 重定向**: 前端会重定向到 HTTPS，需要配置 SSL 证书

### 下一步优化

- [ ] 配置 SSL 证书（Let's Encrypt）
- [ ] 添加自动备份脚本
- [ ] 配置监控和告警
- [ ] 添加 CI/CD 自动部署
- [ ] 优化镜像大小

### 贡献者

- Zhengbi Yong (雍征彼)

### 许可证

MIT License

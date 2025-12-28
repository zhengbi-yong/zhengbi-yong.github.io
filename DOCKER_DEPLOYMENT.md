# 博客系统Docker部署方案 - 完整总结

## 🎯 方案概述

本方案为博客系统提供了一套完整的、模块化的、可扩展的Docker部署解决方案，具有以下特点：

### ✨ 核心特性

1. **统一配置管理** - 所有配置集中在 `config.yml` 文件
2. **自动化端口管理** - 自动检测和清理端口占用
3. **完整异常处理** - 处理各种部署异常情况
4. **模块化设计** - 前端、后端、数据库、缓存独立容器化
5. **一键部署** - 单个命令完成全部部署流程
6. **跨平台支持** - Linux、macOS、Windows全平台支持

---

## 📦 创建的文件清单

### 配置文件

```
config.yml                          # 统一配置文件（核心）
.env.docker.example                  # 环境变量模板
```

### Docker文件

```
docker-compose.yml                  # 根目录编排文件
frontend/Dockerfile                 # 前端Docker镜像
frontend/.dockerignore              # 前端构建忽略
```

### Nginx配置

```
nginx/nginx.conf                    # Nginx主配置
nginx/conf.d/blog.conf              # 站点配置（HTTP+HTTPS）
```

### 脚本工具

```
scripts/
├── config-manager.sh               # 配置管理脚本（Bash）
├── config-manager.py               # 配置管理脚本（Python，跨平台）
└── deploy.sh                       # 一键部署脚本（增强版）
```

### 文档

```
docs/
├── deployment/
│   └── docker.md                   # 完整部署文档（60页）
├── configuration/
│   └── config-guide.md             # 配置管理指南
└── quick-start.md                  # 快速开始指南

README.Docker.md                    # Docker部署README
```

---

## 🚀 快速使用

### 方法1: 一键部署（推荐）

```bash
# Linux/macOS
chmod +x scripts/deploy.sh
./scripts/deploy.sh --auto-cleanup

# Windows
python scripts/deploy.py --auto-cleanup
```

### 方法2: 分步部署

```bash
# 1. 配置管理
python3 scripts/config-manager.py generate auto-cleanup

# 2. 启动服务
docker compose up -d

# 3. 查看状态
docker compose ps
```

---

## 🔧 配置管理

### 所有可配置项

所有配置项都在 `config.yml` 中，包括：

#### 系统配置
- 项目名称
- 部署环境
- 时区
- 日志级别

#### 端口配置（固定）
```yaml
ports:
  frontend: 3001      # 前端端口（固定）
  backend: 3000       # 后端端口（固定）
  postgres: 5432      # 数据库端口（固定）
  redis: 6379         # Redis端口（固定）
  nginx_http: 80      # HTTP端口（固定）
  nginx_https: 443    # HTTPS端口（固定）
```

**重要：端口固定后不要轻易修改！**

所有脚本和文档都基于这些端口，修改端口会导致：
- 反向代理失效
- 文档失效
- 脚本失效
- 需要手动更新多处配置

#### 域名配置
```yaml
domain:
  main: zhengbi-yong.top           # 主域名
  www: www.zhengbi-yong.top        # www域名
  server_ip: 152.136.43.194        # 服务器IP
  force_https: false               # 是否强制HTTPS
```

#### 数据库配置
```yaml
database:
  postgres:
    name: blog_db
    user: blog_user
    password: ""                   # 留空自动生成
    max_connections: 200           # 性能调优
    shared_buffers: 256
    work_mem: 4

  redis:
    password: ""
    persistence_mode: appendonly   # 持久化模式
    max_memory: 512
    eviction_policy: allkeys-lru
```

#### 安全配置
```yaml
security:
  jwt_secret: ""                  # 留空自动生成32位密钥
  password_pepper: ""
  session_secret: ""
  cors_origins: "http://localhost:3001,https://zhengbi-yong.top"
  rate_limit:
    requests_per_minute: 60
    burst: 10
```

#### 邮件配置
```yaml
email:
  enabled: false
  smtp_host: smtp.gmail.com
  smtp_port: 587
  smtp_username: ""
  smtp_password: ""
```

#### 性能配置
```yaml
performance:
  frontend:
    compression: true
    static_cache_ttl: 31536000     # 365天
    image_cache_ttl: 2592000       # 30天

  backend:
    worker_threads: 0              # 0=自动
    pool_size: 10
    query_timeout: 30
```

#### 资源限制
```yaml
resources:
  frontend:
    cpu_limit: "1"
    memory_limit: "1G"

  backend:
    cpu_limit: "2"
    memory_limit: "2G"

  # ... 其他服务
```

---

## 🛡️ 异常处理机制

### 1. 端口占用处理

**自动检测：**
```bash
python3 scripts/config-manager.py check-ports
```

**自动清理：**
```bash
python3 scripts/config-manager.py cleanup-ports
```

**特性：**
- 检测所有配置的端口（3000, 3001, 5432, 6379, 80, 443）
- 显示占用进程信息
- 询问是否终止
- 强制终止进程
- 跨平台支持（Linux/macOS/Windows）

### 2. 依赖检查

**检查项目：**
- Docker版本
- Docker Compose版本
- Docker守护进程状态
- 磁盘空间（>10GB）
- 内存（>2GB）

**失败处理：**
- 显示详细错误信息
- 提供修复建议
- 退出并阻止部署

### 3. 服务健康检查

**检查项：**
- 前端HTTP响应
- 后端API健康检查
- 数据库连接
- Redis连接

**超时处理：**
- 最长等待2分钟
- 显示进度条
- 部分服务失败不阻塞部署
- 提供日志查看建议

### 4. 配置验证

**验证项：**
- YAML语法
- 端口范围（1024-65535）
- 端口冲突
- 必填字段
- 密钥长度

**错误处理：**
- 显示具体错误位置
- 提供修复建议
- 阻止生成无效配置

### 5. 回滚机制

**配置备份：**
- 每次生成.env前自动备份
- 保留最近10个备份
- 备份文件命名：`env.backup.YYYYMMDD_HHMMSS`

**服务回滚：**
```bash
# 停止新版本
docker compose down

# 恢复旧配置
cp backups/config/env.backup.20251228_120000 .env

# 重启服务
docker compose up -d
```

---

## 📊 部署流程图

```
开始
  │
  ├─→ 检查环境依赖
  │   ├─ Docker版本
  │   ├─ Docker Compose版本
  │   ├─ 磁盘空间
  │   └─ 内存
  │
  ├─→ 读取config.yml
  │   ├─ 验证配置
  │   └─ 生成.env文件
  │
  ├─→ 端口管理
  │   ├─ 检查端口占用
  │   ├─ 显示冲突进程
  │   ├─ 询问是否清理
  │   └─ 清理端口（如同意）
  │
  ├─→ 停止旧服务
  │   ├─ 显示运行中容器
  │   └─ 停止并删除容器
  │
  ├─→ 拉取Docker镜像
  │   ├─ postgres:15-alpine
  │   ├─ redis:7-alpine
  │   └─ nginx:alpine
  │
  ├─→ 构建应用镜像
  │   ├─ 前端（Next.js）
  │   └─ 后端（Rust）
  │
  ├─→ 启动所有服务
  │   ├─ PostgreSQL
  │   ├─ Redis
  │   ├─ Backend
  │   ├─ Frontend
  │   └─ Nginx
  │
  ├─→ 等待健康检查
  │   ├─ 等待数据库（30秒）
  │   ├─ 等待后端（40秒）
  │   └─ 等待前端（60秒）
  │
  ├─→ 验证部署
  │   ├─ 前端访问测试
  │   ├─ 后端API测试
  │   ├─ 数据库连接测试
  │   └─ Redis连接测试
  │
  └─→ 显示部署信息
      ├─ 服务状态
      ├─ 访问地址
      ├─ 常用命令
      └─ 故障排查建议

完成
```

---

## 🎯 使用场景

### 场景1: 首次部署

```bash
# 1. 克隆项目
git clone https://github.com/zhengbi-yong/zhengbi-yong.github.io.git
cd zhengbi-yong.github.io

# 2. 一键部署
./scripts/deploy.sh --auto-cleanup

# 3. 等待完成（约10-15分钟）
# 访问 http://your-server-ip
```

### 场景2: 更新代码

```bash
# 1. 拉取最新代码
git pull

# 2. 重新部署
./scripts/deploy.sh --rebuild
```

### 场景3: 更改配置

```bash
# 1. 编辑config.yml
nano config.yml

# 2. 重新生成配置
python3 scripts/config-manager.py generate

# 3. 重新部署
./scripts/deploy.sh
```

### 场景4: 配置SSL

```bash
# 1. 获取SSL证书
sudo certbot certonly --standalone -d your-domain.com

# 2. 复制证书
sudo cp /etc/letsencrypt/live/your-domain.com/*.pem nginx/ssl/

# 3. 更新config.yml
nano config.yml
# 设置: ssl.enabled: true, domain.force_https: true

# 4. 重新部署
./scripts/deploy.sh --rebuild
```

### 场景5: 性能调优

```bash
# 1. 查看当前资源使用
docker stats

# 2. 编辑config.yml调整资源限制
nano config.yml

# 3. 重新部署
./scripts/deploy.sh
```

---

## 🔍 故障排查指南

### 问题1: 端口被占用

**症状：**
```
[ERROR] 端口 3000 已被占用
```

**解决方案：**
```bash
# 自动清理
python3 scripts/config-manager.py cleanup-ports

# 或手动清理
sudo lsof -i :3000      # 查看占用
sudo kill -9 <PID>      # 终止进程
```

### 问题2: Docker未安装

**症状：**
```
[ERROR] Docker未安装
```

**解决方案：**
```bash
# Ubuntu/Debian
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# macOS
brew install --cask docker
```

### 问题3: 内存不足

**症状：**
```
容器频繁重启
日志显示 OOM
```

**解决方案：**
```bash
# 增加swap空间
sudo fallocate -l 4G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile

# 或减少资源限制
# 编辑config.yml，降低memory_limit
```

### 问题4: 服务启动失败

**症状：**
```
服务启动失败
```

**解决方案：**
```bash
# 查看详细日志
docker compose logs backend
docker compose logs frontend

# 重新构建
./scripts/deploy.sh --rebuild

# 清理并重启
docker compose down -v
./scripts/deploy.sh --auto-cleanup
```

---

## 📈 性能建议

### 小型部署（< 1000 PV/天）

```yaml
resources:
  frontend:
    cpu_limit: "0.5"
    memory_limit: "512M"
  backend:
    cpu_limit: "1"
    memory_limit: "1G"
  postgres:
    cpu_limit: "0.5"
    memory_limit: "512M"
```

### 中型部署（1000-10000 PV/天）

```yaml
resources:
  frontend:
    cpu_limit: "1"
    memory_limit: "1G"
  backend:
    cpu_limit: "2"
    memory_limit: "2G"
  postgres:
    cpu_limit: "2"
    memory_limit: "2G"
```

### 大型部署（> 10000 PV/天）

```yaml
resources:
  frontend:
    cpu_limit: "2"
    memory_limit: "2G"
  backend:
    cpu_limit: "4"
    memory_limit: "4G"
  postgres:
    cpu_limit: "4"
    memory_limit: "4G"

# 扩展后端服务
docker compose up -d --scale backend=3
```

---

## 🎓 最佳实践

### 1. 配置管理

- ✅ 所有配置集中在 `config.yml`
- ✅ 密钥留空自动生成
- ✅ 首次部署后保存生成的密钥
- ✅ 定期备份配置文件
- ✅ 使用版本控制管理config.yml
- ❌ 不提交.env到Git

### 2. 端口管理

- ✅ 使用固定端口
- ✅ 不轻易修改端口
- ✅ 配置防火墙规则
- ✅ 使用自动化脚本处理冲突
- ❌ 不手动终止占用进程（使用脚本）

### 3. 部署流程

- ✅ 使用一键部署脚本
- ✅ 先在测试环境验证
- ✅ 部署前备份重要数据
- ✅ 监控部署过程
- ✅ 验证部署结果
- ❌ 不跳过健康检查

### 4. 维护

- ✅ 定期更新镜像
- ✅ 定期备份数据库
- ✅ 监控资源使用
- ✅ 查看日志及时发现问题
- ✅ 定期轮换安全密钥
- ❌ 不忽略警告信息

---

## 📚 相关文档

- [完整部署指南](docs/deployment/docker.md) - 60页详细文档
- [配置管理指南](docs/configuration/config-guide.md) - 所有配置项说明
- [快速开始指南](docs/quick-start.md) - 5分钟快速部署
- [项目主README](README.md) - 项目概览

---

## 🎉 总结

这套Docker部署方案提供了：

✅ **简单** - 一键部署，3步完成
✅ **安全** - 自动生成密钥，配置验证
✅ **可靠** - 完整异常处理，自动恢复
✅ **灵活** - 统一配置，易于定制
✅ **可维护** - 清晰的模块划分，完整的文档
✅ **可扩展** - 水平扩展，性能调优

**开始使用：**
```bash
git clone https://github.com/zhengbi-yong/zhengbi-yong.github.io.git
cd zhengbi-yong.github.io
./scripts/deploy.sh --auto-cleanup
```

---

**版本**: 2.0.0
**最后更新**: 2025-12-28
**作者**: Zhengbi Yong

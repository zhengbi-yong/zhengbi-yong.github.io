# 配置管理指南

本文档详细说明如何使用 `config.yml` 统一管理博客系统的所有配置项。

## 📋 目录

- [配置文件概述](#配置文件概述)
- [配置项说明](#配置项说明)
- [配置管理工具](#配置管理工具)
- [常见配置场景](#常见配置场景)
- [故障排查](#故障排查)

---

## 配置文件概述

### config.yml 结构

`config.yml` 是整个系统的**唯一配置源**，所有服务的配置都集中在这个文件中管理。

```yaml
system:          # 系统级配置
ports:           # 端口配置（固定，请勿轻易修改）
domain:          # 域名配置
database:        # 数据库配置
security:        # 安全配置
email:           # 邮件配置
ssl:             # SSL/TLS配置
performance:     # 性能配置
backup:          # 备份配置
monitoring:      # 监控配置
logging:         # 日志配置
resources:       # 资源限制配置
healthcheck:     # 健康检查配置
development:     # 开发环境配置
```

### 配置优先级

1. **config.yml** - 主配置文件（版本控制）
2. **.env** - 自动生成，不提交到版本控制
3. **环境变量** - 运行时覆盖（仅特殊情况下使用）

---

## 配置项说明

### 1. 系统配置 (system)

```yaml
system:
  project_name: blog              # 项目名称
  environment: production          # 环境: development, staging, production
  timezone: Asia/Shanghai          # 时区
  log_level: info                  # 日志级别: error, warn, info, debug, trace
```

**重要说明：**
- `environment` 决定了很多默认行为
- 生产环境必须设为 `production`
- 日志级别影响性能，生产环境建议用 `info`

### 2. 端口配置 (ports)

```yaml
ports:
  frontend: 3001      # 前端端口
  backend: 3000       # 后端API端口
  postgres: 5432      # PostgreSQL端口
  redis: 6379         # Redis端口
  nginx_http: 80      # HTTP端口
  nginx_https: 443    # HTTPS端口
```

**⚠️ 重要：端口固定后不要轻易修改！**

修改端口会导致：
- 访问地址变化
- 反向代理配置失效
- 防火墙规则失效
- 文档和脚本失效

如果必须修改端口，请同步更新：
1. `nginx/conf.d/blog.conf`
2. 防火墙规则
3. 相关文档

### 3. 域名配置 (domain)

```yaml
domain:
  main: zhengbi-yong.top           # 主域名
  www: www.zhengbi-yong.top        # www域名
  server_ip: 152.136.43.194        # 服务器IP
  force_https: false               # 是否强制HTTPS（配置SSL后改为true）
```

**首次部署流程：**
1. 设置 `force_https: false`
2. 部署并测试HTTP访问
3. 配置SSL证书
4. 设置 `force_https: true`
5. 重新部署

### 4. 数据库配置 (database)

```yaml
database:
  postgres:
    name: blog_db                    # 数据库名称
    user: blog_user                  # 用户名
    password: ""                     # 密码（留空自动生成）
    max_connections: 200             # 最大连接数
    shared_buffers: 256              # 共享缓冲区（MB）
    work_mem: 4                      # 工作内存（MB）
    persistence:
      enabled: true
      backup_retention_days: 30      # 备份保留天数

  redis:
    password: ""                     # 密码（留空无密码）
    persistence_mode: appendonly     # 持久化模式
    max_memory: 512                  # 最大内存（MB）
    eviction_policy: allkeys-lru     # 内存淘汰策略
```

**性能调优建议：**

小型部署（< 1000 PV/天）：
```yaml
max_connections: 100
shared_buffers: 128
work_mem: 2
```

中型部署（1000-10000 PV/天）：
```yaml
max_connections: 200
shared_buffers: 256
work_mem: 4
```

大型部署（> 10000 PV/天）：
```yaml
max_connections: 500
shared_buffers: 1024
work_mem: 8
```

### 5. 安全配置 (security)

```yaml
security:
  # JWT密钥（留空自动生成32位随机字符串）
  jwt_secret: ""

  # 密码加密密钥（留空自动生成）
  password_pepper: ""

  # 会话密钥（留空自动生成）
  session_secret: ""

  # CORS允许的来源
  cors_origins: "http://localhost:3001,https://zhengbi-yong.top"

  rate_limit:
    requests_per_minute: 60    # 每分钟请求数
    burst: 10                   # 突发请求数

  # IP白名单（留空不限制）
  ip_whitelist: ""
```

**⚠️ 安全最佳实践：**

1. **密钥管理：**
   - 首次部署留空，让系统自动生成
   - 保存生成的密钥到安全的地方
   - 定期轮换密钥（建议每6个月）

2. **CORS配置：**
   - 只允许可信的域名
   - 开发环境添加 `http://localhost:3001`
   - 生产环境使用HTTPS域名

3. **限流配置：**
   - 正常用户：60次/分钟足够
   - API密钥用户：可提高到300次/分钟
   - 恶意爬虫：通过IP白名单封禁

### 6. 邮件配置 (email)

```yaml
email:
  enabled: false                    # 启用邮件功能
  smtp_host: smtp.gmail.com
  smtp_port: 587
  smtp_username: ""
  smtp_password: ""
  from_address: noreply@zhengbi-yong.top
  from_name: "Zhengbi's Blog"
```

**常用邮件服务商配置：**

Gmail:
```yaml
smtp_host: smtp.gmail.com
smtp_port: 587
```

QQ邮箱:
```yaml
smtp_host: smtp.qq.com
smtp_port: 587
```

163邮箱:
```yaml
smtp_host: smtp.163.com
smtp_port: 465
```

### 7. SSL/TLS配置 (ssl)

```yaml
ssl:
  enabled: false
  certificate_path: /etc/nginx/ssl/fullchain.pem
  private_key_path: /etc/nginx/ssl/privkey.pem
  chain_path: /etc/nginx/ssl/chain.pem

  letsencrypt:
    auto_renew: true
    email: ""                    # 用于证书申请的邮箱
```

### 8. 性能配置 (performance)

```yaml
performance:
  frontend:
    compression: true
    static_cache_ttl: 31536000    # 365天
    image_cache_ttl: 2592000      # 30天

  backend:
    worker_threads: 0              # 0=自动
    pool_size: 10
    query_timeout: 30

  database:
    slow_query_log: true
    slow_query_threshold: 2
```

### 9. 资源限制 (resources)

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

**调整建议：**

- 根据服务器实际配置调整
- 使用 `docker stats` 查看实际使用情况
- 保留一定余量（20%）

---

## 配置管理工具

### 1. 配置管理脚本

项目提供了两个配置管理脚本：

**Bash脚本（Linux/macOS）：**
```bash
./scripts/config-manager.sh <命令>
```

**Python脚本（跨平台）：**
```bash
python3 scripts/config-manager.py <命令>
```

### 2. 可用命令

#### validate - 验证配置

```bash
python3 scripts/config-manager.py validate
```

验证 `config.yml` 的正确性：
- 语法检查
- 端口范围检查
- 端口冲突检查
- 必需字段检查

#### check-ports - 检查端口占用

```bash
python3 scripts/config-manager.py check-ports
```

检查所有配置的端口是否被占用。

#### cleanup-ports - 清理端口占用

```bash
python3 scripts/config-manager.py cleanup-ports
```

自动清理占用的端口：
- 检测占用进程
- 显示进程信息
- 询问是否终止
- 强制终止进程

#### generate - 生成配置文件

```bash
# 交互式清理端口
python3 scripts/config-manager.py generate

# 自动清理端口
python3 scripts/config-manager.py generate auto-cleanup
```

生成 `.env` 文件：
- 读取 `config.yml`
- 自动生成密钥
- 检查端口冲突
- 备份旧配置

---

## 常见配置场景

### 场景1: 首次部署

```bash
# 1. 编辑配置文件
nano config.yml

# 2. 生成.env文件
python3 scripts/config-manager.py generate auto-cleanup

# 3. 检查生成的配置
cat .env

# 4. 部署
./scripts/deploy.sh
```

### 场景2: 更新域名

```bash
# 1. 编辑config.yml
nano config.yml
# 修改:
# domain.main: your-new-domain.com

# 2. 重新生成.env
python3 scripts/config-manager.py generate

# 3. 重新部署
./scripts/deploy.sh --rebuild
```

### 场景3: 配置SSL

```bash
# 1. 获取SSL证书
sudo certbot certonly --standalone -d your-domain.com

# 2. 复制证书
sudo cp /etc/letsencrypt/live/your-domain.com/fullchain.pem nginx/ssl/
sudo cp /etc/letsencrypt/live/your-domain.com/privkey.pem nginx/ssl/
sudo cp /etc/letsencrypt/live/your-domain.com/chain.pem nginx/ssl/

# 3. 更新config.yml
nano config.yml
# 设置:
# ssl.enabled: true
# domain.force_https: true

# 4. 重新生成并部署
python3 scripts/config-manager.py generate
./scripts/deploy.sh --rebuild
```

### 场景4: 性能调优

```bash
# 1. 查看当前资源使用
docker stats

# 2. 编辑config.yml调整资源限制
nano config.yml

# 3. 重新生成并部署
python3 scripts/config-manager.py generate
./scripts/deploy.sh
```

### 场景5: 启用邮件

```bash
# 1. 编辑config.yml
nano config.yml
# 设置:
# email.enabled: true
# email.smtp_username: your-email@gmail.com
# email.smtp_password: your-app-password

# 2. 重新生成并部署
python3 scripts/config-manager.py generate
./scripts/deploy.sh --rebuild
```

---

## 故障排查

### 问题1: 端口被占用

**症状：**
```
[ERROR] 端口 3000 已被占用
```

**解决方案：**
```bash
# 方法1: 自动清理
python3 scripts/config-manager.py cleanup-ports

# 方法2: 手动查找并终止
sudo lsof -i :3000
sudo kill -9 <PID>
```

### 问题2: 配置验证失败

**症状：**
```
[ERROR] 配置验证失败
```

**解决方案：**
```bash
# 检查YAML语法
python3 -c "import yaml; yaml.safe_load(open('config.yml'))"

# 查看详细错误
python3 scripts/config-manager.py validate
```

### 问题3: 密钥已存在

**症状：**
```
[WARN] 安全配置: ⚠ 使用自动生成的密钥
```

**说明：** 这是正常的，首次部署会自动生成密钥。

**保存密钥：**
```bash
# 查看生成的密钥
grep JWT_SECRET .env
grep PASSWORD_PEPPER .env
grep SESSION_SECRET .env

# 保存到安全的地方
```

### 问题4: .env文件不生效

**症状：** 修改config.yml后，.env没有更新

**解决方案：**
```bash
# 重新生成.env
python3 scripts/config-manager.py generate

# 重启服务
docker compose down
docker compose up -d
```

---

## 配置最佳实践

### 1. 版本控制

**提交到Git：**
- ✅ `config.yml` - 配置模板
- ✅ `config.yml.example` - 示例配置

**不提交到Git：**
- ❌ `.env` - 包含敏感信息
- ❌ `config.yml` - 如果包含真实密钥

**推荐做法：**
```bash
# 创建config.yml.example
cp config.yml config.yml.example

# 编辑config.yml.example，将敏感信息替换为占位符
# jwt_secret: "CHANGE_ME"

# 提交示例文件
git add config.yml.example
git commit -m "Add config example"

# 本地使用config.yml（不提交）
git update-index --assume-unchanged config.yml
```

### 2. 环境分离

**开发环境：**
```bash
cp config.yml config.dev.yml
# 修改 environment: development
python3 scripts/config-manager.py --config config.dev.yml generate
```

**生产环境：**
```bash
cp config.yml config.prod.yml
# 修改 environment: production
python3 scripts/config-manager.py --config config.prod.yml generate
```

### 3. 密钥管理

**使用密钥管理工具：**
```bash
# 安装pass
sudo apt install pass

# 生成并保存密钥
pass generate "blog/jwt_secret" 32
pass generate "blog/password_pepper" 32
pass generate "blog/session_secret" 32

# 在config.yml中引用
# jwt_secret: $(pass show blog/jwt_secret)
```

### 4. 配置审计

**定期检查配置：**
```bash
# 每月审计一次
python3 scripts/config-manager.py audit

# 检查过期配置
python3 scripts/config-manager.py check-expiry
```

---

## 附录

### A. 完整配置示例

```yaml
system:
  project_name: blog
  environment: production
  timezone: Asia/Shanghai
  log_level: info

ports:
  frontend: 3001
  backend: 3000
  postgres: 5432
  redis: 6379
  nginx_http: 80
  nginx_https: 443

domain:
  main: zhengbi-yong.top
  www: www.zhengbi-yong.top
  server_ip: 152.136.43.194
  force_https: false

database:
  postgres:
    name: blog_db
    user: blog_user
    password: ""
    max_connections: 200
    shared_buffers: 256
    work_mem: 4

security:
  jwt_secret: ""
  password_pepper: ""
  session_secret: ""
  cors_origins: "https://zhengbi-yong.top"
  rate_limit:
    requests_per_minute: 60
    burst: 10

# ... 其他配置
```

### B. 相关文档

- [Docker部署指南](docker.md)
- [快速开始指南](../quick-start.md)
- [故障排查](troubleshooting.md)

---

**最后更新**: 2025-12-28
**版本**: 2.0.0

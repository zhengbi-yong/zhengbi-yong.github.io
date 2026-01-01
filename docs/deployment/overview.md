# 部署总览

本指南提供完整的部署方案，从单服务器到企业级集群。

## 部署阶段

根据项目规模和需求，选择合适的部署阶段：

| 阶段 | 适用场景 | 用户规模 | 架构 |
|------|---------|---------|------|
| **阶段一** | 初创期 | < 1000 用户 | 单服务器 |
| **阶段二** | 成长期 | 1000-10000 用户 | 双服务器高可用 |
| **阶段三** | 扩张期 | 10000-100000 用户 | 小规模集群 |
| **阶段四** | 成熟期 | 100000+ 用户 | 中规模集群 |
| **阶段五** | 企业级 | 大规模 | 分布式集群 |

## 快速开始

### 最小化部署（开发/测试）

```bash
# 1. 启动数据库
cd backend
./scripts/deployment/deploy.sh dev

# 2. 启动后端 API
export DATABASE_URL=postgresql://blog_user:blog_password@localhost:5432/blog_db
export REDIS_URL=redis://localhost:6379
cargo run

# 3. 构建前端
cd ../frontend
pnpm build
pnpm start
```

### 单服务器部署

适合个人博客或小型团队：

```bash
# 使用 Docker Compose 一键部署
cd backend
./scripts/deployment/deploy.sh prod
```

详细步骤请查看 [单服务器部署](./single-server.md)。

## 部署前检查清单

### 服务器要求

- [ ] 操作系统: Ubuntu 20.04+ / CentOS 8+ / Debian 11+
- [ ] CPU: 2+ 核心
- [ ] 内存: 4+ GB RAM
- [ ] 磁盘: 20+ GB SSD
- [ ] 网络: 公网 IP 和域名

### 软件依赖

- [ ] Docker 20.10+
- [ ] Docker Compose 2.0+
- [ ] Nginx (可选，用于反向代理)
- [ ] SSL 证书 (Let's Encrypt)

### 配置文件

- [ ] 后端环境变量 (`.env`)
- [ ] 前端环境变量 (`.env.local`)
- [ ] Docker Compose 配置
- [ ] Nginx 配置 (如使用)

### 安全检查

- [ ] 更改默认密码
- [ ] 生成安全的 JWT_SECRET
- [ ] 配置防火墙规则
- [ ] 启用 HTTPS
- [ ] 配置 CORS 正确的域名

## 部署架构

### 阶段一：单服务器

```
┌─────────────────────────────┐
│      Nginx (反向代理)        │
│      Port 80/443            │
└──────────────┬──────────────┘
               │
       ┌───────┴────────┐
       │                │
┌──────▼──────┐  ┌──────▼──────┐
│  Frontend   │  │   Backend   │
│  Next.js    │  │  Rust API   │
│  Port 3001  │  │  Port 3000  │
└─────────────┘  └──────┬──────┘
                        │
            ┌───────────┴──────────┐
            │                      │
     ┌──────▼──────┐      ┌───────▼──────┐
     │ PostgreSQL  │      │    Redis     │
     │  Port 5432  │      │  Port 6379   │
     └─────────────┘      └──────────────┘
```

**优点**: 简单、低成本、易管理
**缺点**: 单点故障、扩展性差

### 阶段二：双服务器高可用

```
服务器 1 (Web)                      服务器 2 (Database)
┌─────────────────┐                ┌─────────────────┐
│ Nginx           │                │                 │
│ Frontend        │────┐           │                 │
│ Backend         │    │───────────│ PostgreSQL      │
│                 │    │           │ Redis           │
└─────────────────┘    │           └─────────────────┘
                       │
                       │  负载均衡器 (可选)
                       │
                       ▼
              用户请求 → 部署域名
```

**优点**: 数据隔离、高可用性
**缺点**: 成本较高、配置复杂

### 阶段三：集群部署

```
                ┌─────────────┐
                │  负载均衡器  │
                │   (Nginx)   │
                └──────┬──────┘
                       │
       ┌───────────────┼───────────────┐
       │               │               │
┌──────▼──────┐  ┌──────▼──────┐  ┌──────▼──────┐
│  Web 节点 1  │  │  Web 节点 2  │  │  Web 节点 3  │
│ Frontend    │  │ Frontend    │  │ Frontend    │
│ Backend     │  │ Backend     │  │ Backend     │
└─────────────┘  └─────────────┘  └─────────────┘
       │                │                │
       └────────────────┴────────────────┘
                        │
            ┌───────────┴──────────┐
            │                      │
     ┌──────▼──────┐      ┌───────▼──────┐
     │ PostgreSQL  │      │    Redis     │
     │ 主从复制     │      │  哨兵模式     │
     └─────────────┘      └──────────────┘
```

**优点**: 高可用、自动扩展、容错
**缺点**: 复杂、高成本

## 部署选项

### Docker Compose（推荐）

**优点**:
- 简单部署
- 环境一致
- 易于管理

**使用**:
```bash
cd backend
docker compose up -d
```

### 传统部署

**适用场景**:
- 不使用 Docker
- 需要更多控制
- 性能优化

**步骤**:
1. 安装 PostgreSQL 和 Redis
2. 安装 Rust 和编译项目
3. 配置 Systemd 服务
4. 配置 Nginx 反向代理

### 云平台

**AWS**:
- ECS + RDS + ElastiCache
- 详细指南参考 [AWS 部署](./cloud/aws.md)

**Google Cloud**:
- Cloud Run + Cloud SQL + Memorystore

**Azure**:
- Container Instances + Azure Database + Redis Cache

## 数据库部署

### PostgreSQL

**生产环境建议**:
- 使用托管服务（如 AWS RDS）
- 或独立数据库服务器
- 启用 WAL 归档
- 定期备份

**Docker 部署**:
```yaml
services:
  postgres:
    image: postgres:15
    environment:
      POSTGRES_USER: blog_user
      POSTGRES_PASSWORD: ${DB_PASSWORD}
      POSTGRES_DB: blog_db
    volumes:
      - postgres_data:/var/lib/postgresql/data
```

### Redis

**持久化配置**:
```yaml
services:
  redis:
    image: redis:7-alpine
    command: redis-server --appendonly yes
    volumes:
      - redis_data:/data
```

## 反向代理

### Nginx 配置

```nginx
server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com;

    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;

    # 前端
    location / {
        proxy_pass http://localhost:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # 后端 API
    location /api/ {
        proxy_pass http://localhost:3000/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

## SSL 证书

### Let's Encrypt

```bash
# 安装 Certbot
sudo apt install certbot python3-certbot-nginx

# 获取证书
sudo certbot --nginx -d your-domain.com

# 自动续期
sudo certbot renew --dry-run
```

## 监控

### 健康检查

- **前端**: `GET http://localhost:3001`
- **后端**: `GET http://localhost:3000/health`
- **数据库**: `psql -h localhost -U blog_user -d blog_db`

### 日志

**Docker Compose**:
```bash
docker compose logs -f
docker compose logs -f api
```

**Systemd 服务**:
```bash
journalctl -u blog-api -f
```

## 性能优化

### 前端优化

- 启用 CDN
- 图片压缩和懒加载
- Gzip 压缩
- HTTP/2

### 后端优化

- 连接池优化
- Redis 缓存
- 查询优化
- 数据库索引

## 备份策略

### 数据库备份

```bash
# 手动备份
pg_dump -U blog_user blog_db > backup.sql

# 自动备份（cron）
0 2 * * * pg_dump -U blog_user blog_db > /backups/db_$(date +\%Y\%m\%d).sql
```

### 代码备份

```bash
# Git 推送到远程
git push origin main

# 或 GitHub Actions 自动部署
```

## 故障恢复

### 数据恢复

```bash
# 恢复数据库
psql -U blog_user blog_db < backup.sql
```

### 服务重启

```bash
cd backend
./scripts/deployment/deploy.sh stop
./scripts/deployment/deploy.sh prod
```

## 成本估算

### 单服务器部署

- **服务器**: $5-20/月 (DigitalOcean, Linode)
- **域名**: $10-15/年
- **SSL**: 免费 (Let's Encrypt)
- **总计**: ~$10-20/月

### 双服务器部署

- **Web 服务器**: $10-20/月
- **数据库服务器**: $20-40/月
- **负载均衡器**: $10/月 (可选)
- **总计**: ~$40-70/月

## 相关文档

- [单服务器部署](./single-server.md) - 详细的单服务器部署步骤
- [高可用部署](./high-availability.md) - 双服务器高可用配置
- [集群部署](./cluster.md) - 集群架构和配置
- [日常维护](./maintenance.md) - 备份、监控、更新

## 获取帮助

如果遇到部署问题：

1. 查看 [故障排查](../getting-started/troubleshooting.md)
2. 检查日志文件
3. 搜索 GitHub Issues
4. 创建新 Issue

---

**最后更新**: 2025-12-27

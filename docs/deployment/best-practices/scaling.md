# Scaling Strategy / 扩展策略

Horizontal and vertical scaling approaches to handle growing traffic.
/ 处理不断增长的流量的水平和垂直扩展方法。

---

## 📋 Overview / 概述

Scaling ensures your blog can handle increased traffic and growth. This guide covers vertical scaling (upgrading resources) and horizontal scaling (adding more servers).
/ 扩展确保您的博客能够处理增加的流量和增长。本指南涵盖垂直扩展（升级资源）和水平扩展（添加更多服务器）。

### Scaling Decision Framework / 扩展决策框架

**When to Scale / 何时扩展**:

| Metric / 指标 | Threshold / 阈值 | Action / 行动 |
|-------------|----------------|-------------|
| **CPU Usage / CPU使用率** | >70% sustained / 持续>70% | Scale up or out / 向上或向外扩展 |
| **Memory Usage / 内存使用率** | >80% sustained / 持续>80% | Scale up / 向上扩展 |
| **API Latency / API延迟** | >500ms p95 / P95>500ms | Scale up or optimize / 向上扩展或优化 |
| **Error Rate / 错误率** | >1% / >1% | Scale and investigate / 扩展并调查 |
| **Queue Depth / 队列深度** | Increasing / 增加 | Scale up / 向上扩展 |
| **Disk I/O / 磁盘I/O** | >80% utilization / >80%利用率 | Scale up or optimize / 向上扩展或优化 |

---

## 📈 Vertical Scaling / 垂直扩展

### What is Vertical Scaling? / 什么是垂直扩展？

**Definition / 定义**: Increasing resources (CPU, RAM, disk) on existing server. / 增加现有服务器上的资源（CPU、RAM、磁盘）。

**Also called / 也称为**: Scaling up / 向上扩展

### Pros / 优点

- ✅ **Simple** - No architecture changes / 简单 - 无架构变更
- ✅ **Fast** - Usually just upgrade server plan / 快速 - 通常只需升级服务器计划
- ✅ **No data synchronization** - Single database / 无数据同步 - 单一数据库
- ✅ **Lower maintenance** - One server to manage / 更低的维护 - 管理一台服务器
- ✅ **Cheaper for moderate growth** - Cost-effective up to a point / 对适度增长更具成本效益

### Cons / 缺点

- ❌ **Upper limit** - Server size limits exist / 上限 - 存在服务器大小限制
- ❌ **Single point of failure** - Server down = site down / 单点故障 - 服务器宕机=站点宕机
- ❌ **Downtime during upgrade** - May need to restart / 升级期间停机 - 可能需要重启
- ❌ **Diminishing returns** - Higher specs = exponentially more expensive / 收益递减 - 更高规格=指数级更贵

### When to Use Vertical Scaling / 何时使用垂直扩展

- Traffic < 10,000 daily visitors / 流量 < 10,000日访客
- Quick performance boost needed / 需要快速性能提升
- Limited DevOps expertise / DevOps专业知识有限
- Single-server deployment / 单服务器部署

### Vertical Scaling Path / 垂直扩展路径

```
Low Resource (2GB RAM)
    ↓ Upgrade
Single Server (4GB RAM)
    ↓ Upgrade
Production Server (8GB RAM)
    ↓ Upgrade
Large Server (16GB+ RAM)
```

### How to Scale Vertically / 如何垂直扩展

#### Step 1: Monitor Performance / 监控性能

```bash
# Check current resource usage
docker stats
free -h
df -h
top
```

#### Step 2: Choose New Plan / 选择新计划

**Cloud Providers Upgrade Path / 云提供商升级路径**:

| Current / 当前 | Upgrade To / 升级到 | Expected Improvement / 预期改进 |
|--------------|-----------------|-------------------------|
| 2GB RAM, 1 CPU | 4GB RAM, 2 CPU | 2x performance / 2倍性能 |
| 4GB RAM, 2 CPU | 8GB RAM, 4 CPU | 2-2.5x performance / 2-2.5倍性能 |
| 8GB RAM, 4 CPU | 16GB RAM, 8 CPU | 2x performance / 2倍性能 |

#### Step 3: Prepare for Upgrade / 准备升级

```bash
# 1. Full backup
./scripts/backup/backup-database.sh
./scripts/backup/backup-volumes.sh

# 2. Verify backups
ls -lh /backups/

# 3. Document current configuration
docker compose config > current-config.yml
```

#### Step 4: Execute Upgrade / 执行升级

**Option A: Same Provider, Upgrade Plan / 选项A：同一提供商，升级计划**

```bash
# 1. Resize server (via cloud provider dashboard)
# DigitalOcean: Resize droplet
# Linode: Resize linode
# AWS: Change instance type

# 2. Wait for resize to complete (usually 5-10 minutes)

# 3. Verify Docker containers are running
docker compose ps

# 4. Verify application is accessible
curl http://localhost:3001
```

**Option B: Migrate to New Server / 选项B：迁移到新服务器**

```bash
# 1. Provision new server
# 2. Install Docker
curl -fsSL https://get.docker.com | sh

# 3. Copy data from old server
rsync -avz --progress root@old-server:/backups/ /backups/

# 4. Clone repository and deploy
git clone https://github.com/zhengbi-yong/zhengbi-yong.github.io.git
cd zhengbi-yong.github.io

# 5. Restore database
./scripts/backup/restore-database.sh /backups/latest.sql.gz

# 6. Update DNS (point to new server)
# 7. Verify everything works
# 8. Cancel old server
```

#### Step 5: Post-Upgrade Optimization / 升级后优化

```bash
# Update Docker resource limits to use new resources
# Edit docker-compose.yml

services:
  postgres:
    deploy:
      resources:
        limits:
          cpus: '4.0'      # Increased from 2.0
          memory: 4G       # Increased from 2G

  backend:
    deploy:
      resources:
        limits:
          cpus: '2.0'      # Increased from 1.0
          memory: 2G       # Increased from 1G

# Restart services
docker compose up -d
```

---

## ↔️ Horizontal Scaling / 水平扩展

### What is Horizontal Scaling? / 什么是水平扩展？

**Definition / 定义**: Adding more servers to handle load. / 添加更多服务器来处理负载。

**Also called / 也称为**: Scaling out / 向外扩展

### Pros / 优点

- ✅ **No theoretical limit** - Keep adding servers / 无理论上限 - 持续添加服务器
- ✅ **High availability** - Redundancy / 高可用 - 冗余
- ✅ **Fault tolerance** - One server fails, others continue / 容错 - 一台服务器故障，其他继续
- ✅ **Flexible** - Scale up or down as needed / 灵活 - 根据需要向上或向下扩展
- ✅ **Better performance** - Load distribution / 更好的性能 - 负载分配

### Cons / 缺点

- ❌ **Complex** - Requires load balancing, replication / 复杂 - 需要负载均衡、复制
- ❌ **Higher cost** - Multiple servers / 更高成本 - 多台服务器
- ❌ **Data synchronization** - Database replication needed / 数据同步 - 需要数据库复制
- ❌ **Maintenance** - More servers to manage / 维护 - 更多服务器要管理
- ❌ **Expertise required** - DevOps knowledge needed / 需要专业知识 - 需要DevOps知识

### When to Use Horizontal Scaling / 何时使用水平扩展

- Traffic > 10,000 daily visitors / 流量 > 10,000日访客
- Need high availability / 需要高可用
- Single server maxed out / 单服务器已满载
- Business-critical site / 业务关键站点
- Have DevOps expertise / 有DevOps专业知识

### Horizontal Scaling Architecture / 水平扩展架构

```
                    ┌─────────────────┐
                    │  Load Balancer  │
                    │  (Nginx/HAProxy)│
                    └────────┬────────┘
                             │
              ┌──────────────┴──────────────┐
              │                             │
      ┌──────┴────────┐          ┌────────┴────────┐
      │  Server 1     │          │   Server 2      │
      │  (Primary)    │          │   (Replica)     │
      │                │          │                 │
      │  ┌───────────┐ │          │  ┌───────────┐  │
      │  │ Frontend  │ │          │  │ Frontend  │  │
      │  └─────┬─────┘ │          │  └─────┬──────┘  │
      │        │       │          │        │         │
      │  ┌─────┴─────┐ │          │  ┌─────┴──────┐  │
      │  │ Backend  │ │          │  │ Backend   │  │
      │  └─────┬─────┘ │          │  └─────┬──────┘  │
      │        │       │          │        │         │
      │  ┌─────┴──────┴───────┐   │  ┌─────┴────────┤
      │  │  PostgreSQL         │◄──┼──┤   PostgreSQL │
      │  │  (Primary DB)       │   │  │   (Replica)  │
      │  └─────────────────────┘   │  └──────────────┘
      └─────────────────────────┴───────────────────┘
                    │
            ┌───────┴────────┐
            │  Shared Redis  │
            │  (Sessions)    │
            └─────────────────┘
```

### How to Scale Horizontally / 如何水平扩展

#### Step 1: Setup Load Balancer / 设置负载均衡器

**Nginx Load Balancer Configuration / Nginx负载均衡器配置**:

```nginx
# /etc/nginx/nginx.conf (on load balancer)

upstream backend_servers {
    # Primary server
    server server1.example.com:3000 weight=3;

    # Replica server
    server server2.example.com:3000 weight=2;

    # Health check
    keepalive 32;
}

server {
    listen 80;
    server_name yourdomain.com;

    location / {
        proxy_pass http://backend_servers;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;

        # Health check
        proxy_next_upstream error timeout http_502 http_503 http_504;
    }
}
```

#### Step 2: Setup Database Replication / 设置数据库复制

**PostgreSQL Streaming Replication / PostgreSQL流复制**:

```bash
# On Primary Server (server1)
# /etc/postgresql/postgresql.conf

wal_level = replica
max_wal_senders = 3
wal_keep_size = 100MB

# Create replication user
docker compose exec postgres psql -U postgres -c "CREATE USER replicator WITH REPLICATION ENCRYPTED PASSWORD 'password';"

# Add to pg_hba.conf
host    replication     replicator      0.0.0.0/0      md5

# Reload PostgreSQL
docker compose restart postgres
```

```bash
# On Replica Server (server2)
# Stop postgres if running
docker compose stop postgres

# Take base backup from primary
pg_basebackup -h server1.example.com -D /var/lib/postgresql/data -U replicator -P -v -R

# Start replica
docker compose start postgres
```

**Verify Replication / 验证复制**:
```bash
# On primary, check replication status
docker compose exec postgres psql -U postgres -c "SELECT * FROM pg_stat_replication;"

# On replica, check it's in recovery mode
docker compose exec postgres psql -U postgres -c "SELECT pg_is_in_recovery();"
```

#### Step 3: Setup Shared Session Storage / 设置共享会话存储

**Redis Sentinel (for high availability)** / Redis Sentinel（用于高可用）:

```yaml
# docker-compose.yml (on both servers)

services:
  redis:
    image: redis:7
    command: redis-server --appendonly yes
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

  sentinel:
    image: redis:7
    command: redis-sentinel /etc/redis/sentinel.conf
    volumes:
      - ./sentinel.conf:/etc/redis/sentinel.conf
```

```conf
# sentinel.conf
port 26379
sentinel monitor mymaster server1.example.com 6379 2
sentinel down-after-milliseconds mymaster 5000
sentinel parallel-syncs mymaster 1
sentinel failover-timeout mymaster 10000
```

#### Step 4: Deploy Application to All Servers / 部署应用到所有服务器

```bash
# On Server 2 (replica)
git clone https://github.com/zhengbi-yong/zhengbi-yong.github.io.git
cd zhengbi-yong.github.io

# Copy .env from server1
scp root@server1:/path/to/.env ./

# Update configuration for replica
# DATABASE_URL=postgresql://blog_user:password@server1:5432/blog_db
# REDIS_URL=redis://redis:6379

# Start services
docker compose up -d
```

---

## 🔄 Auto-Scaling / 自动扩展

### Cloud Provider Auto-Scaling / 云提供商自动扩展

**AWS Auto Scaling**:
```bash
# Create Auto Scaling Group
aws autoscaling create-auto-scaling-group \
    --auto-scaling-group-name blog-asg \
    --launch-template LaunchTemplateId \
    --min-size 2 \
    --max-size 6 \
    --desired-capacity 2 \
    --availability-zones us-east-1a us-east-1b

# Create scaling policy (scale on CPU > 70%)
aws autoscaling put-scaling-policy \
    --auto-scaling-group-name blog-asg \
    --policy-name scale-up \
    --scaling-adjustment 1 \
    --adjustment-type ChangeInCapacity
```

**Digital Ocean Load Balancer**:
- Use managed load balancer
- Add droplets to backend
- Configure health checks

### Kubernetes Auto-Scaling / Kubernetes自动扩展

```yaml
# Horizontal Pod Autoscaler
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: blog-backend-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: backend
  minReplicas: 2
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
```

---

## 📊 Scaling Metrics / 扩展指标

### Key Performance Indicators (KPIs) / 关键性能指标

**Before Scaling / 扩展前**:
- Baseline performance measurement / 基线性能测量
- Identify bottlenecks / 识别瓶颈
- Document current capacity / 记录当前容量

**After Scaling / 扩展后**:
- Measure improvement / 测量改进
- Verify all services working / 验证所有服务工作
- Monitor for new issues / 监控新问题

**Scaling Success Metrics / 扩展成功指标**:

| Metric / 指标 | Before / 之前 | After / 之后 | Improvement / 改进 |
|-------------|-------------|-----------|-----------------|
| **API Latency / API延迟** | 800ms | 200ms | 4x faster / 4倍快 |
| **Concurrent Users / 并发用户** | 50 | 500 | 10x capacity / 10倍容量 |
| **Error Rate / 错误率** | 5% | 0.5% | 10x reduction / 10倍减少 |
| **CPU Usage / CPU使用率** | 90% | 40% | 2.25x headroom / 2.25倍余量 |
| **Page Load Time / 页面加载** | 3s | 0.8s | 3.75x faster / 3.75倍快 |

---

## 🎯 Scaling Decision Tree / 扩展决策树

```
Current Performance Issues / 当前性能问题
        │
        ▼
   Traffic Volume? / 流量量？
        │
   ┌────┴────┐
   │         │
< 10K/day   > 10K/day
   │         │
   ▼         ▼
Vertical    Horizontal
Scaling     Scaling
(Scale up)  (Scale out)
   │         │
   │         ▼
   │    Single server maxed out?
   │         │
   │    ┌────┴────┐
   │  No         Yes
   │   │          │
   │   ▼          ▼
   │  Scale up   Consider
   │  more      High Availability
   │            (Multiple servers)
   │
   ▼
Monitor and adjust
as traffic grows
```

---

## 📖 Related Documentation / 相关文档

- [Deployment Options](../concepts/deployment-options.md) - Deployment comparison
- [Performance Tuning](../reference/performance-tuning.md) - Optimization
- [High Availability Guide](../guides/server/high-availability.md) - Multi-server setup
- [Monitoring](./monitoring.md) - Performance tracking

---

## ❓ FAQ / 常见问题

### Q: Which is better: vertical or horizontal scaling? / 哪个更好：垂直还是水平扩展？

**A / 答**: / 答案：
- **Start with vertical** (easier, cheaper up to a point) / 从垂直开始（更容易，到一定程度更便宜）
- **Use horizontal when** you hit server limits or need high availability / 当达到服务器限制或需要高可用时使用水平
- **Many do both**: Scale up individual servers, add more servers as needed / 许多人两者都做：向上扩展单个服务器，根据需要添加更多服务器

### Q: When should I move from vertical to horizontal scaling? / 什么时候应该从垂直转向水平扩展？

**A / 答**: Consider horizontal when / 在以下情况考虑水平：
- Server size limits reached (max available from provider) / 达到服务器大小限制（提供商的最大可用）
- Need high availability (can't afford downtime) / 需要高可用（无法承受停机）
- Cost of huge server > 2-3 medium servers / 巨型服务器的成本 > 2-3台中型服务器
- Traffic > 50,000 daily visitors / 流量 > 50,000日访客

### Q: Can I combine vertical and horizontal scaling? / 可以结合垂直和水平扩展吗？

**A / 答**: Yes! This is common in production: / 可以！这在生产中很常见：
- Use medium-sized servers (not max) / 使用中型服务器（不是最大）
- Scale out to 2-3 servers / 扩展到2-3台服务器
- Scale up individual servers as needed / 根据需要向上扩展单个服务器
- This gives best balance of cost, performance, and reliability / 这在成本、性能和可靠性之间提供最佳平衡

---

**Version**: 2.0 (World-Class Deployment Documentation)
**Last Updated**: 2026-01-01
**Maintained By**: Deployment Team

🤖 Generated with [Claude Code](https://claude.com/claude-code)

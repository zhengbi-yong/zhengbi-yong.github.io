# High Availability Deployment

高可用性部署指南，适合生产环境和大型项目。

## 目录

- [架构设计](#架构设计)
- [服务器规划](#服务器规划)
- [负载均衡](#负载均衡)
- [数据库高可用](#数据库高可用)
- [Redis 高可用](#redis-高可用)
- [应用部署](#应用部署)
- [监控和告警](#监控和告警)
- [灾备策略](#灾备策略)

---

## 架构设计

### 整体架构

```
                    ┌─────────────┐
                    │   Cloudflare│
                    │    CDN/DNS  │
                    └──────┬──────┘
                           │
                    ┌──────▼──────┐
                    │  Load Balancer│
                    │   (Nginx)    │
                    └──────┬──────┘
                           │
            ┌──────────────┼──────────────┐
            │              │              │
    ┌───────▼──────┐┌─────▼─────┐┌──────▼──────┐
    │  App Server 1││App Server 2││App Server 3 │
    │  (Frontend)  ││ (Frontend) ││ (Frontend)  │
    └───────┬──────┘└─────┬─────┘└──────┬──────┘
            │              │              │
            └──────────────┼──────────────┘
                           │
            ┌──────────────┼──────────────┐
            │              │              │
    ┌───────▼──────┐┌─────▼─────┐┌──────▼──────┐
    │  API Server 1││API Server 2││API Server 3 │
    │   (Backend)  ││ (Backend) ││  (Backend)  │
    └───────┬──────┘└─────┬─────┘└──────┬──────┘
            │              │              │
            └──────────────┼──────────────┘
                           │
            ┌──────────────┴──────────────┐
            │                             │
    ┌───────▼──────┐            ┌────────▼────────┐
    │  DB Primary  │◄────────────►│   DB Standby   │
    │  (Master)    │  Streaming  │   (Replica)    │
    └──────────────┘  Replication└─────────────────┘
            │
    ┌───────▼──────┐
    │ Redis Sentinel│
    │   Cluster    │
    └──────────────┘
```

---

## 服务器规划

### 推荐配置

#### 应用服务器（3台）

| 组件 | 配置 |
|------|------|
| CPU | 4 核 |
| 内存 | 8 GB |
| 存储 | 50 GB SSD |
| 操作系统 | Ubuntu 22.04 LTS |

#### 数据库服务器（2台）

| 组件 | 配置 |
|------|------|
| CPU | 8 核 |
| 内存 | 16 GB |
| 存储 | 200 GB SSD |
| 操作系统 | Ubuntu 22.04 LTS |

#### 负载均衡服务器（2台）

| 组件 | 配置 |
|------|------|
| CPU | 2 核 |
| 内存 | 4 GB |
| 存储 | 20 GB SSD |
| 操作系统 | Ubuntu 22.04 LTS |

---

## 负载均衡

### Nginx 负载均衡配置

**文件**: `/etc/nginx/nginx.conf`

```nginx
# 上游服务器定义
upstream backend_servers {
    # 负载均衡算法：least_conn（最少连接）
    least_conn;

    # 后端服务器
    server 10.0.1.10:3000 max_fails=3 fail_timeout=30s;
    server 10.0.1.11:3000 max_fails=3 fail_timeout=30s;
    server 10.0.1.12:3000 max_fails=3 fail_timeout=30s;

    # 保持连接
    keepalive 32;
}

upstream frontend_servers {
    # 前端服务器
    server 10.0.1.20:3001 max_fails=3 fail_timeout=30s;
    server 10.0.1.21:3001 max_fails=3 fail_timeout=30s;
    server 10.0.1.22:3001 max_fails=3 fail_timeout=30s;
}

# HTTP 重定向
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    location / {
        return 301 https://$server_name$request_uri;
    }
}

# HTTPS 主服务器
server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;

    # SSL 配置
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    # 安全头
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;

    # 前端请求
    location / {
        proxy_pass http://frontend_servers;
        proxy_http_version 1.1;

        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        proxy_cache_bypass $http_upgrade;
    }

    # API 请求
    location /api/ {
        proxy_pass http://backend_servers;
        proxy_http_version 1.1;

        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # 超时配置
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # 健康检查
    location /healthz {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }
}
```

---

### 负载均衡算法

| 算法 | 说明 | 使用场景 |
|------|------|----------|
| `round_robin` | 轮询 | 默认，服务器性能相近 |
| `least_conn` | 最少连接 | 请求处理时间不同 |
| `ip_hash` | IP 哈希 | 需要会话保持 |
| `hash` | 自定义哈希 | 基于特定变量路由 |

---

## 数据库高可用

### PostgreSQL 主从复制

#### 主服务器配置

**文件**: `/etc/postgresql/15/main/postgresql.conf`

```bash
# 连接设置
listen_addresses = '*'
max_connections = 200

# 复制设置
wal_level = replica
max_wal_senders = 10
max_replication_slots = 10
synchronous_commit = on

# 同步复制
synchronous_standby_names = 'standby1'

# 归档
archive_mode = on
archive_command = 'cp %p /var/lib/postgresql/15/main/archive/%f'
```

**文件**: `/etc/postgresql/15/main/pg_hba.conf`

```bash
# 复制连接
host replication replicator 10.0.1.11/32 scram-sha-256
```

---

#### 从服务器配置

**文件**: `/etc/postgresql/15/main/postgresql.conf`

```bash
# 连接设置
listen_addresses = '*'
max_connections = 200

# 热备模式
hot_standby = on
max_standby_streaming_delay = 30s
max_standby_archive_delay = 30s
```

---

#### 创建复制用户

```bash
# 主服务器上执行
sudo -u postgres psql

CREATE ROLE replicator WITH REPLICATION PASSWORD 'strong-password' LOGIN;
```

---

#### 启动复制

**从服务器上执行**:

```bash
# 停止 PostgreSQL
sudo systemctl stop postgresql

# 清空数据目录
sudo rm -rf /var/lib/postgresql/15/main/*

# 使用 pg_basebackup 复制数据
sudo -u postgres pg_basebackup \
  -h 10.0.1.10 \
  -D /var/lib/postgresql/15/main \
  -U replicator \
  -P \
  -v \
  -R \
  -X stream \
  -C -S standby_1

# 启动 PostgreSQL
sudo systemctl start postgresql
```

---

### 自动故障转移

#### 使用 Patroni

```bash
# 安装 Patroni
sudo apt install patroni -y

# 配置文件
sudo vim /etc/patroni/config.yml
```

**配置示例**:

```yaml
scope: postgres-cluster
name: postgres1

restapi:
  listen: 0.0.0.0:8008
  connect_address: 10.0.1.10:8008

bootstrap:
  dcs:
    ttl: 30
    loop_wait: 10
    retry_timeout: 10
    maximum_lag_on_failover: 1048576

  postgresql:
    use_pg_rewind: true
    use_slots: true

postgresql:
  listen: 0.0.0.0:5432
  connect_address: 10.0.1.10:5432
  data_dir: /var/lib/postgresql/15/main
  bin_dir: /usr/lib/postgresql/15/bin

  authentication:
    replication:
      username: replicator
      password: strong-password

  parameters:
    max_connections: 200
    shared_buffers: 4GB
    effective_cache_size: 12GB
    maintenance_work_mem: 1GB
    checkpoint_completion_target: 0.9
    wal_buffers: 16MB
    default_statistics_target: 100
    random_page_cost: 1.1

tags:
  nofailover: false
  noloadbalance: false
  clonefrom: false
  nosync: false
```

---

## Redis 高可用

### Redis Sentinel

#### Redis Master 配置

**文件**: `/etc/redis/redis.conf`

```bash
bind 0.0.0.0
port 6379
requirepass strong-password
```

---

#### Redis Slave 配置

**文件**: `/etc/redis/redis.conf`

```bash
bind 0.0.0.0
port 6379
requirepass strong-password
replicaof 10.0.1.30 6379
masterauth strong-password
```

---

#### Sentinel 配置

**文件**: `/etc/redis/sentinel.conf`

```bash
port 26379
sentinel monitor mymaster 10.0.1.30 6379 2
sentinel auth-pass mymaster strong-password
sentinel down-after-milliseconds mymaster 5000
sentinel parallel-syncs mymaster 1
sentinel failover-timeout mymaster 10000
```

---

### Redis Cluster

#### 集群配置

```bash
# 创建集群
redis-cli --cluster create \
  10.0.1.40:7001 \
  10.0.1.40:7002 \
  10.0.1.41:7001 \
  10.0.1.41:7002 \
  10.0.1.42:7001 \
  10.0.1.42:7002 \
  --cluster-replicas 1
```

---

## 应用部署

### Systemd 服务

#### 后端服务

**文件**: `/etc/systemd/system/blog-backend.service`

```ini
[Unit]
Description=Blog Backend API
After=network.target

[Service]
Type=simple
User=deploy
WorkingDirectory=/home/deploy/zhengbi-yong.github.io/backend
Environment="DATABASE_URL=postgresql://blog_user:password@10.0.1.30:5432/blog_db"
Environment="REDIS_URL=redis://:password@10.0.1.40:6379"
Environment="JWT_SECRET=your-secret-key"
ExecStart=/home/deploy/zhengbi-yong.github.io/backend/target/release/api
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

#### 前端服务

**文件**: `/etc/systemd/system/blog-frontend.service`

```ini
[Unit]
Description=Blog Frontend Server
After=network.target

[Service]
Type=simple
User=deploy
WorkingDirectory=/home/deploy/zhengbi-yong.github.io/frontend
ExecStart=/usr/bin/node server.js
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

---

### 启动服务

```bash
# 重载 systemd
sudo systemctl daemon-reload

# 启动服务
sudo systemctl start blog-backend
sudo systemctl start blog-frontend

# 启用开机启动
sudo systemctl enable blog-backend
sudo systemctl enable blog-frontend

# 查看状态
sudo systemctl status blog-backend
sudo systemctl status blog-frontend
```

---

## 监控和告警

### Prometheus + Grafana

#### Prometheus 配置

**文件**: `/etc/prometheus/prometheus.yml`

```yaml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

scrape_configs:
  - job_name: 'node_exporter'
    static_configs:
      - targets:
          - '10.0.1.10:9100'
          - '10.0.1.11:9100'
          - '10.0.1.12:9100'

  - job_name: 'postgres_exporter'
    static_configs:
      - targets:
          - '10.0.1.30:9187'

  - job_name: 'redis_exporter'
    static_configs:
      - targets:
          - '10.0.1.40:9121'
```

---

### 告警规则

**文件**: `/etc/prometheus/alerts.yml`

```yaml
groups:
  - name: api_alerts
    interval: 30s
    rules:
      - alert: HighErrorRate
        expr: rate(http_requests_total{status=~"5.."}[5m]) > 0.05
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "High error rate detected"
          description: "Error rate is {{ $value }} errors/sec"

      - alert: ServiceDown
        expr: up == 0
        for: 2m
        labels:
          severity: critical
        annotations:
          summary: "Service is down"
          description: "{{ $labels.instance }} is down"
```

---

## 灾备策略

### 数据备份

#### 每日完整备份

```bash
#!/bin/bash
# /home/deploy/backup-daily.sh

DATE=$(date +%Y%m%d)
BACKUP_DIR="/backup/daily"

# 备份数据库
docker exec postgres pg_dump -U blog_user blog_db | gzip > $BACKUP_DIR/db_$DATE.sql.gz

# 备份 Redis
docker exec redis redis-cli --rdb /data/dump_$DATE.rdb
docker cp redis:/data/dump_$DATE.rdb $BACKUP_DIR/

# 上传到 S3
aws s3 sync $BACKUP_DIR s3://backup-bucket/daily/
```

---

### 灾难恢复

#### 恢复流程

1. **从备份恢复数据库**:
```bash
# 解压备份
gunzip db_20251227.sql.gz

# 恢复数据库
psql -U blog_user blog_db < db_20251227.sql
```

2. **切换到备用服务器**:
```bash
# 更新 DNS 指向备用服务器
# 或调整负载均衡器配置
```

---

## 相关文档

- [Single Server Deployment](./single-server.md) - 单服务器部署
- [Deployment Overview](./overview.md) - 部署总览
- [Performance Monitoring](../development/operations/performance-monitoring.md) - 性能监控

---

**最后更新**: 2025-12-27
**维护者**: DevOps Team

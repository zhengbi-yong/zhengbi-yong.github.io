# Performance Tuning / 性能优化

Optimization techniques for improving deployment performance and resource utilization.
/ 提高部署性能和资源利用率的优化技术。

---

## 📋 Overview / 概述

This guide covers performance optimization strategies for the blog platform, including Docker resource limits, database tuning, caching strategies, and application-level optimizations.
/ 本指南涵盖博客平台的性能优化策略，包括Docker资源限制、数据库调优、缓存策略和应用级优化。

---

## 🎯 Performance Goals / 性能目标

### Target Metrics / 目标指标

| Metric / 指标 | Target / 目标 | Acceptable / 可接受 |
|-------------|-------------|-----------------|
| **Page Load Time / 页面加载时间** | <1s | <2s |
| **API Response Time / API响应时间** | <200ms | <500ms |
| **Database Query Time / 数据库查询时间** | <100ms | <200ms |
| **Cache Hit Rate / 缓存命中率** | >90% | >80% |
| **Concurrent Users / 并发用户** | 200-500 | 100-200 |
| **Uptime / 正常运行时间** | 99.9% | 99.5% |

---

## 🐳 Docker Resource Limits / Docker资源限制

### Default Resource Usage / 默认资源使用

**Without Limits / 无限制**:
- Containers can use all available host resources
- One container can starve others
- No performance isolation

**With Limits / 有限制**:
- Guaranteed resources for each container
- Better performance predictability
- Improved stability

### Configure Resource Limits / 配置资源限制

**Docker Compose Configuration / Docker Compose配置**:

```yaml
# docker-compose.yml
services:
  frontend:
    image: blog-frontend:latest
    deploy:
      resources:
        limits:
          cpus: '1.0'      # Max 1 CPU core
          memory: 512M     # Max 512MB RAM
        reservations:
          cpus: '0.5'      # Reserved 0.5 CPU core
          memory: 256M     # Reserved 256MB RAM
    environment:
      - NODE_OPTIONS=--max-old-space-size=256

  backend:
    image: blog-backend:latest
    deploy:
      resources:
        limits:
          cpus: '2.0'      # Max 2 CPU cores
          memory: 1G       # Max 1GB RAM
        reservations:
          cpus: '1.0'      # Reserved 1 CPU core
          memory: 512M     # Reserved 512MB RAM

  postgres:
    image: postgres:17
    deploy:
      resources:
        limits:
          cpus: '2.0'
          memory: 2G
        reservations:
          cpus: '1.0'
          memory: 1G
    environment:
      - POSTGRES_SHARED_BUFFERS=256MB
      - POSTGRES_EFFECTIVE_CACHE_SIZE=1GB
      - POSTGRES_MAINTENANCE_WORK_MEM=64MB

  redis:
    image: redis:7
    deploy:
      resources:
        limits:
          cpus: '1.0'
          memory: 512M
        reservations:
          cpus: '0.5'
          memory: 256M
    command: redis-server --maxmemory 400mb --maxmemory-policy allkeys-lru
```

### Resource Allocation Examples / 资源分配示例

#### Low Resource Server (2GB RAM) / 低配置服务器

```yaml
services:
  frontend:
    deploy.resources:
      limits: { cpus: '0.5', memory: 256M }
      reservations: { cpus: '0.25', memory: 128M }

  backend:
    deploy.resources:
      limits: { cpus: '1.0', memory: 512M }
      reservations: { cpus: '0.5', memory: 256M }

  postgres:
    deploy.resources:
      limits: { cpus: '1.0', memory: 800M }
      reservations: { cpus: '0.5', memory: 400M }
    environment:
      - POSTGRES_SHARED_BUFFERS=200MB
      - POSTGRES_EFFECTIVE_CACHE_SIZE=600MB

  redis:
    deploy.resources:
      limits: { cpus: '0.5', memory: 256M }
      reservations: { cpus: '0.25', memory: 128M }
    command: redis-server --maxmemory 200mb --maxmemory-policy allkeys-lru
```

**Total Allocation / 总分配**: ~1.8GB (leaves 200MB for OS and overhead) / ~1.8GB（为系统和开销留出200MB）

#### Production Server (8GB RAM) / 生产服务器

```yaml
services:
  frontend:
    deploy.resources:
      limits: { cpus: '2.0', memory: 1G }
      reservations: { cpus: '1.0', memory: 512M }

  backend:
    deploy.resources:
      limits: { cpus: '4.0', memory: 2G }
      reservations: { cpus: '2.0', memory: 1G }

  postgres:
    deploy.resources:
      limits: { cpus: '4.0', memory: 4G }
      reservations: { cpus: '2.0', memory: 2G }
    environment:
      - POSTGRES_SHARED_BUFFERS=1GB
      - POSTGRES_EFFECTIVE_CACHE_SIZE=3GB
      - POSTGRES_MAINTENANCE_WORK_MEM=256MB

  redis:
    deploy.resources:
      limits: { cpus: '2.0', memory: 1G }
      reservations: { cpus: '1.0', memory: 512M }
    command: redis-server --maxmemory 800mb --maxmemory-policy allkeys-lru
```

**Total Allocation / 总分配**: ~7GB (leaves 1GB for OS and overhead) / ~7GB（为系统和开销留出1GB）

---

## 🗄️ PostgreSQL Performance Tuning / PostgreSQL性能调优

### Configuration Parameters / 配置参数

**Shared Buffers / 共享缓冲区**:
```ini
# postgresql.conf

# 25% of RAM (dedicated database server)
shared_buffers = 1GB              # 8GB RAM server
shared_buffers = 256MB            # 2GB RAM server
shared_buffers = 64MB             # 512MB RAM server
```

**Effective Cache Size / 有效缓存大小**:
```ini
# 50-75% of RAM (includes OS cache)
effective_cache_size = 3GB        # 8GB RAM server
effective_cache_size = 1GB        # 2GB RAM server
effective_cache_size = 256MB      # 512MB RAM server
```

**Maintenance Work Memory / 维护工作内存**:
```ini
# For VACUUM, CREATE INDEX, etc.
maintenance_work_mem = 256MB      # 8GB RAM server
maintenance_work_mem = 64MB       # 2GB RAM server
maintenance_work_mem = 16MB       # 512MB RAM server
```

**Work Memory / 工作内存** (per operation):
```ini
# For sorting, hashing, etc.
work_mem = 16MB                   # Production
work_mem = 4MB                    # Low resource
```

**Connections / 连接数**:
```ini
# Maximum concurrent connections
max_connections = 100             # Production
max_connections = 50              # Low resource
```

### Docker Environment Variables / Docker环境变量

```yaml
services:
  postgres:
    environment:
      # Memory settings
      - POSTGRES_SHARED_BUFFERS=256MB
      - POSTGRES_EFFECTIVE_CACHE_SIZE=1GB
      - POSTGRES_MAINTENANCE_WORK_MEM=64MB
      - POSTGRES_WORK_MEM=16MB

      # Connection settings
      - POSTGRES_MAX_CONNECTIONS=50

      # WAL settings (for durability vs performance)
      - POSTGRES_WAL_BUFFERS=16MB
      - POSTGRES_CHECKPOINT_COMPLETION_TARGET=0.9
```

### Query Optimization / 查询优化

**Indexes / 索引**:
```sql
-- Create indexes on frequently queried columns
CREATE INDEX idx_posts_published_at ON posts(published_at DESC);
CREATE INDEX idx_posts_slug ON posts(slug);
CREATE INDEX idx_posts_author_id ON posts(author_id);
CREATE INDEX idx_comments_post_id ON comments(post_id);

-- Composite index for complex queries
CREATE INDEX idx_posts_status_published ON posts(status, published_at DESC);

-- Full-text search index
CREATE INDEX idx_posts_search ON posts USING gin(to_tsvector('english', title || ' ' || content));
```

**Analyze Query Performance / 分析查询性能**:
```sql
-- Enable query logging
ALTER SYSTEM SET log_min_duration_statement = 1000;  -- Log queries >1s

-- Explain query plan
EXPLAIN ANALYZE SELECT * FROM posts WHERE status = 'published';

-- Check index usage
SELECT schemaname, tablename, indexname, idx_scan
FROM pg_stat_user_indexes
ORDER BY idx_scan ASC;

-- Find missing indexes
SELECT schemaname, tablename, attname, n_distinct, correlation
FROM pg_stats
WHERE schemaname = 'public'
ORDER BY n_distinct DESC;
```

**Vacuum and Analyze / 清理和分析**:
```sql
-- Manual vacuum
VACUUM ANALYZE posts;

-- Auto vacuum settings
ALTER SYSTEM SET autovacuum = on;
ALTER SYSTEM SET autovacuum_analyze_scale_factor = 0.05;
```

---

## 💾 Redis Performance Tuning / Redis性能调优

### Memory Management / 内存管理

**Max Memory / 最大内存**:
```conf
# redis.conf

# Set max memory (60-70% of allocated RAM)
maxmemory 512mb        # Low resource (2GB server)
maxmemory 2gb          # Production (8GB server)
```

**Eviction Policy / 淘汰策略**:
```conf
# All keys LRU (recommended for cache)
maxmemory-policy allkeys-lru

# Or volatile LRU (only evict keys with TTL)
maxmemory-policy volatile-lru

# Least frequently used
maxmemory-policy allkeys-lfu
```

### Persistence / 持久化

**RDB (Snapshotting) / RDB快照**:
```conf
# Save if at least 1 key changed in 900 seconds (15 min)
save 900 1

# Save if at least 10 keys changed in 300 seconds (5 min)
save 300 10

# Save if at least 10000 keys changed in 60 seconds
save 60 10000

# Disable (for pure cache)
save ""
```

**AOF (Append Only File) / AOF追加文件**:
```conf
# Enable AOF
appendonly yes

# AOF fsync policy
appendfsync everysec    # Recommended (balance)
appendfsync always       # Safest (slowest)
appendfsync no          # Fastest (least safe)
```

**Recommendation / 推荐**: Use RDB for cache-only, AOF for data persistence / 仅缓存使用RDB，数据持久化使用AOF

### Performance Optimization / 性能优化

```conf
# Disable expensive operations (if not needed)
# Disable keys command (blocks Redis)
rename-command KEYS ""

# Enable max memory tracking
maxmemory-samples 5

# Hash optimization
hash-max-ziplist-entries 512
hash-max-ziplist-value 64

# List optimization
list-max-ziplist-size -2

# Set optimization
set-max-intset-entries 512

# Sorted set optimization
zset-max-ziplist-entries 128
zset-max-ziplist-value 64
```

---

## 🚀 Application-Level Optimization / 应用级优化

### Frontend (Next.js) / 前端优化

**Image Optimization / 图片优化**:
```typescript
// next.config.js
module.exports = {
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
}
```

**Code Splitting / 代码分割**:
```typescript
// Dynamic imports for heavy components
const HeavyChart = dynamic(() => import('./HeavyChart'), {
  loading: () => <LoadingSpinner />,
  ssr: false,
})
```

**Cache Strategy / 缓存策略**:
```typescript
// ISR (Incremental Static Regeneration)
export const revalidate = 3600 // Revalidate every hour

// OR static generation for static content
export const dynamic = 'force-static'
```

**Bundle Optimization / 打包优化**:
```json
// package.json
{
  "scripts": {
    "build": "next build"
  }
}
```

### Backend (Rust/Axum) / 后端优化

**Connection Pooling / 连接池**:
```rust
// Optimize pool size
let pool = sqlx::postgres::PgPoolOptions::new()
    .max_connections(20)  // Based on CPU cores
    .min_connections(5)
    .acquire_timeout(Duration::from_secs(30))
    .idle_timeout(Duration::from_secs(600))
    .max_lifetime(Duration::from_secs(1800))
    .connect(&database_url)
    .await?;
```

**Async Concurrency / 异步并发**:
```rust
// Use Tokio multi-threaded runtime
#[tokio::main]
async fn main() {
    // Configure based on CPU cores
    let cores = num_cpus::get();
    // ...
}
```

**Response Caching / 响应缓存**:
```rust
// Cache TTL configuration
const CACHE_TTL_SHORT: u64 = 300;    // 5 minutes
const CACHE_TTL_MEDIUM: u64 = 3600;  // 1 hour
const CACHE_TTL_LONG: u64 = 86400;   // 24 hours
```

---

## 🌐 Nginx Optimization / Nginx优化

### Worker Processes / 工作进程

```nginx
# /etc/nginx/nginx.conf

# Set to auto (number of CPU cores)
worker_processes auto;

# Worker connections
events {
    worker_connections 1024;
}
```

### Caching / 缓存

```nginx
# Proxy cache for API responses
proxy_cache_path /var/cache/nginx levels=1:2 keys_zone=api_cache:10m max_size=100m inactive=60m;

server {
    location /api/ {
        proxy_cache api_cache;
        proxy_cache_valid 200 5m;
        proxy_cache_valid 404 1m;
        proxy_cache_use_stale error timeout updating http_500 http_502 http_503 http_504;
        proxy_cache_background_update on;

        proxy_pass http://backend:3000;
    }
}

# Static file caching
location /static/ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}

# Brotli/Gzip compression
gzip on;
gzip_vary on;
gzip_proxied any;
gzip_comp_level 6;
gzip_types text/plain text/css text/xml text/javascript application/json application/javascript application/xml+rss application/rss+xml font/truetype font/opentype application/vnd.ms-fontobject image/svg+xml;
```

### HTTP/2 / HTTP/2

```nginx
server {
    listen 443 ssl http2;

    # SSL configuration...

    # HTTP/2 push for critical resources
    http2_push /styles/main.css;
}
```

---

## 📊 Monitoring Performance / 监控性能

### Docker Stats / Docker统计

```bash
# Real-time container stats
docker stats

# Specific container
docker stats frontend backend

# Stream stats (no interactive)
docker stats --no-stream
```

### Database Metrics / 数据库指标

```sql
-- Connection count
SELECT count(*) FROM pg_stat_activity;

-- Long-running queries
SELECT pid, now() - pg_stat_activity.query_start AS duration, query
FROM pg_stat_activity
WHERE (now() - pg_stat_activity.query_start) > interval '5 minutes';

-- Table sizes
SELECT
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Index usage
SELECT
    schemaname,
    tablename,
    indexname,
    idx_scan,
    pg_size_pretty(pg_relation_size(indexrelid)) AS index_size
FROM pg_stat_user_indexes
ORDER BY idx_scan ASC;
```

### Redis Metrics / Redis指标

```bash
# Memory usage
docker compose exec redis redis-cli INFO memory

# Hit rate
docker compose exec redis redis-cli INFO stats | grep keyspace

# Slow log
docker compose exec redis redis-cli SLOWLOG GET 10
```

---

## 🔧 Performance Tuning Checklist / 性能调优清单

### Initial Setup / 初始设置

- [ ] Configure Docker resource limits
- [ ] Set PostgreSQL shared_buffers (25% of RAM)
- [ ] Set PostgreSQL effective_cache_size (50-75% of RAM)
- [ ] Configure Redis maxmemory and eviction policy
- [ ] Enable Nginx caching and compression

### Regular Maintenance / 定期维护

- [ ] Monitor container resource usage (`docker stats`)
- [ ] Check database query performance
- [ ] Review slow query logs
- [ ] Analyze table and index usage
- [ ] Check cache hit rates
- [ ] Vacuum and analyze database

### Optimization Actions / 优化操作

- [ ] Add missing indexes
- [ ] Tune PostgreSQL configuration
- [ ] Adjust Redis memory limits
- [ ] Optimize Nginx cache settings
- [ ] Enable HTTP/2
- [ ] Configure CDN for static assets
- [ ] Implement database read replicas (if needed)

---

## 🎯 Optimization by Deployment Type / 按部署类型优化

### Low Resource (2GB RAM) / 低配置

**Focus / 重点**: Minimize memory usage / 最小化内存使用

```yaml
# Conservative limits
frontend: 256MB
backend: 512MB
postgres: 800MB
redis: 256MB
```

**Optimizations / 优化**:
- Lower PostgreSQL work_mem
- Aggressive Redis eviction
- Disable non-essential features
- Use swap if needed (2GB)

### Production (4-8GB RAM) / 生产环境

**Focus / 重点**: Balance performance and resources / 平衡性能和资源

```yaml
# Balanced allocation
frontend: 512MB-1GB
backend: 1-2GB
postgres: 2-4GB
redis: 512MB-1GB
```

**Optimizations / 优化**:
- Enable query caching
- Configure connection pooling
- Optimize indexes
- Enable monitoring

### High Availability (Multiple servers) / 高可用

**Focus / 重点**: Scalability and redundancy / 可扩展性和冗余

- Database replication (primary-replica)
- Load balancing
- Distributed caching (Redis cluster)
- Auto-scaling

---

## 📖 Related Documentation / 相关文档

- [Architecture Overview](../../development/concepts/architecture.md) - System design
- [Deployment Guide](../README.md) - Resource requirements by deployment type
- [Monitoring Guide](../../development/operations/performance-monitoring.md) - Performance monitoring
- [Runtime and Scaling](../../features/runtime-and-scaling.md) - Horizontal and vertical scaling

---

## ❓ FAQ / 常见问题

### Q: How much RAM should I allocate to PostgreSQL? / 应该为PostgreSQL分配多少RAM？

**A / 答**: / 一般规则：
- **Dedicated database server**: 25% for shared_buffers, 50% for effective_cache_size / 专用数据库服务器：25%用于shared_buffers，50%用于effective_cache_size
- **Shared server**: 10-15% for shared_buffers, 25-35% for effective_cache_size / 共享服务器：10-15%用于shared_buffers，25-35%用于effective_cache_size
- **Low resource (2GB)**: shared_buffers=200MB, effective_cache_size=600MB / 低配置（2GB）：shared_buffers=200MB，effective_cache_size=600MB

### Q: What's a good cache hit rate? / 什么是好的缓存命中率？

**A / 答**: / 目标：
- **Excellent**: >95% / 优秀：>95%
- **Good**: 85-95% / 良好：85-95%
- **Acceptable**: 70-85% / 可接受：70-85%
- **Needs improvement**: <70% / 需要改进：<70%

### Q: Should I use swap? / 应该使用swap吗？

**A / 答**: / 建议：
- **Low resource servers**: Yes, 2GB swap (prevents OOM) / 低配置服务器：是的，2GB swap（防止OOM）
- **Production servers**: Optional, use if you see memory pressure / 生产服务器：可选，如果有内存压力则使用
- **High performance servers**: Avoid swap (degrades performance) / 高性能服务器：避免swap（降低性能）

---

**Version**: 2.0 (World-Class Deployment Documentation)
**Last Updated**: 2026-01-01
**Maintained By**: Deployment Team

🤖 Generated with [Claude Code](https://claude.com/claude-code)

# Monitoring and Logging / 监控和日志

Comprehensive monitoring and logging strategy for production deployments.
/ 生产部署的综合监控和日志策略。

---

## 📋 Overview / 概述

Effective monitoring helps you detect issues early, understand system behavior, and make informed decisions about scaling and optimizations.
/ 有效的监控帮助您及早发现问题、理解系统行为，并做出关于扩展和优化的明智决策。

### Key Monitoring Objectives / 关键监控目标

1. **Availability / 可用性** - Ensure services are running / 确保服务运行
2. **Performance / 性能** - Monitor response times / 监控响应时间
3. **Errors / 错误** - Track error rates and types / 跟踪错误率和类型
4. **Resources / 资源** - Monitor CPU, memory, disk, network / 监控CPU、内存、磁盘、网络
5. **Security / 安全** - Detect suspicious activity / 检测可疑活动

---

## 📊 Monitoring Levels / 监控级别

### Level 1: Basic Health Checks / 基本健康检查

**Purpose / 目的**: Quick verification that services are running / 快速验证服务运行

**Implementation / 实现**:

```yaml
# docker-compose.yml health checks
services:
  backend:
    image: blog-backend:latest
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/api/v1/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

  frontend:
    image: blog-frontend:latest
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000"]
      interval: 30s
      timeout: 10s
      retries: 3

  postgres:
    image: postgres:17
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U blog_user -d blog_db"]
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5
```

**Check Health / 检查健康状态**:

```bash
# Check all containers
docker compose ps

# Check specific service health
docker inspect --format='{{.State.Health.Status}}' backend

# Watch health status
watch docker compose ps
```

### Level 2: Application Metrics / 应用指标

**Key Metrics to Track / 要跟踪的关键指标**:

| Category / 类别 | Metric / 指标 | Target / 目标 |
|----------------|--------------|-------------|
| **Requests / 请求** | Request rate / 请求率 | Monitor trends / 监控趋势 |
| **Latency / 延迟** | API response time / API响应时间 | <200ms p95 |
| **Errors / 错误** | Error rate / 错误率 | <1% |
| **Database / 数据库** | Query time / 查询时间 | <100ms p95 |
| **Cache / 缓存** | Hit rate / 命中率 | >90% |

**Enable Prometheus Metrics / 启用Prometheus指标**:

```bash
# .env configuration
PROMETHEUS_ENABLED=true
```

**Metrics Endpoint / 指标端点**:

```
http://your-domain.com/metrics
```

**Example Metrics / 示例指标**:

```
# HELP http_requests_total Total number of HTTP requests
# TYPE http_requests_total counter
http_requests_total{method="GET",path="/api/v1/posts",status="200"} 1234

# HELP http_request_duration_seconds HTTP request duration
# TYPE http_request_duration_seconds histogram
http_request_duration_seconds_bucket{le="0.1"} 1000
http_request_duration_seconds_bucket{le="0.5"} 1500
http_request_duration_seconds_bucket{le="1.0"} 1800

# HELP db_query_duration_seconds Database query duration
# TYPE db_query_duration_seconds histogram
db_query_duration_seconds_bucket{le="0.05"} 2000
db_query_duration_seconds_bucket{le="0.1"} 2200
```

### Level 3: Infrastructure Monitoring / 基础设施监控

**System Resources / 系统资源**:

```bash
# Container stats
docker stats

# Host system resources
free -h              # Memory
df -h                # Disk
top                  # CPU
iostat               # I/O
iftop                # Network
```

**Alerting Thresholds / 告警阈值**:

| Resource / 资源 | Warning / 警告 | Critical / 严重 |
|----------------|---------------|---------------|
| **CPU Usage / CPU使用率** | >70% | >90% |
| **Memory Usage / 内存使用率** | >80% | >95% |
| **Disk Usage / 磁盘使用率** | >80% | >90% |
| **API Latency / API延迟** | >500ms | >1000ms |
| **Error Rate / 错误率** | >1% | >5% |

---

## 📝 Logging Strategy / 日志策略

### Log Levels / 日志级别

**Rust Log Levels / Rust日志级别** (via `RUST_LOG`):

| Level / 级别 | Use Case / 使用场景 | Example / 示例 |
|------------|-------------------|--------------|
| **Error** | Errors that require attention / 需要关注的错误 | Database connection failed |
| **Warn** | Warning messages / 警告消息 | High memory usage |
| **Info** | General information / 一般信息 | Server started, request completed |
| **Debug** | Detailed debugging information / 详细调试信息 | Request headers, query details |
| **Trace** | Extremely verbose / 极其详细 | Every function call |

**Configuration / 配置**:

```bash
# .env file

# Production (errors and warnings)
RUST_LOG=error,warn,blog_backend=info

# Development (verbose)
RUST_LOG=debug

# Troubleshooting (very verbose)
RUST_LOG=trace

# Specific module
RUST_LOG=blog_backend=debug,sqlx=warn
```

### Log Rotation / 日志轮换

**Docker Log Configuration / Docker日志配置**:

```yaml
# docker-compose.yml
services:
  backend:
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"

  frontend:
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
```

**Host Log Rotation / 主机日志轮换**:

```bash
# /etc/logrotate.d/docker-containers

/var/lib/docker/containers/*/*.log {
    rotate 7
    daily
    compress
    missingok
    delaycompress
    copytruncate
}
```

### Centralized Logging / 集中式日志

**Option 1: ELK Stack (Elasticsearch, Logstash, Kibana)** / 选项1：ELK栈

```yaml
# docker-compose.yml (add)
services:
  elasticsearch:
    image: elasticsearch:8.0.0
    environment:
      - discovery.type=single-node
      - "ES_JAVA_OPTS=-Xms512m -Xmx512m"
    ports:
      - "9200:9200"
    volumes:
      - elasticsearch_data:/usr/share/elasticsearch/data

  kibana:
    image: kibana:8.0.0
    ports:
      - "5601:5601"
    environment:
      - ELASTICSEARCH_HOSTS=http://elasticsearch:9200

  filebeat:
    image: elastic/filebeat:8.0.0
    volumes:
      - /var/lib/docker/containers:/var/lib/docker/containers
      - ./filebeat.yml:/usr/share/filebeat/filebeat.yml:ro
```

**Option 2: Loki + Grafana** (lighter weight) / 选项2：Loki + Grafana（更轻量）

```yaml
services:
  loki:
    image: grafana/loki:latest
    ports:
      - "3100:3100"
    command: -config.file=/etc/loki/local-config.yaml

  promtail:
    image: grafana/promtail:latest
    volumes:
      - /var/log:/var/log:ro
      - ./promtail.yml:/etc/promtail/config.yml:ro
```

---

## 📈 Prometheus + Grafana Setup / Prometheus + Grafana设置

### Architecture / 架构

```
┌──────────────┐     ┌─────────────┐     ┌──────────────┐
│  Services    │────►│ Prometheus  │────►│   Grafana    │
│ (Backend,    │     │  (Metrics)  │     │(Dashboards)  │
│  Frontend)   │     │             │     │              │
└──────────────┘     └─────────────┘     └──────────────┘
```

### Docker Compose Configuration / Docker Compose配置

```yaml
# docker-compose.monitoring.yml
version: '3.8'

services:
  prometheus:
    image: prom/prometheus:latest
    ports:
      - "9090:9090"
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
      - prometheus_data:/prometheus
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.path=/prometheus'

  grafana:
    image: grafana/grafana:latest
    ports:
      - "3001:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin
    volumes:
      - grafana_data:/var/lib/grafana
      - ./grafana/dashboards:/etc/grafana/provisioning/dashboards
      - ./grafana/datasources:/etc/grafana/provisioning/datasources

  alertmanager:
    image: prom/alertmanager:latest
    ports:
      - "9093:9093"
    volumes:
      - ./alertmanager.yml:/etc/alertmanager/alertmanager.yml

volumes:
  prometheus_data:
  grafana_data:
```

### Prometheus Configuration / Prometheus配置

```yaml
# prometheus.yml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

scrape_configs:
  - job_name: 'blog-backend'
    static_configs:
      - targets: ['backend:3000']
    metrics_path: '/metrics'

  - job_name: 'blog-frontend'
    static_configs:
      - targets: ['frontend:3000']
    metrics_path: '/metrics'

  - job_name: 'postgres'
    static_configs:
      - targets: ['postgres:9187']

  - job_name: 'redis'
    static_configs:
      - targets: ['redis:9121']

alerting:
  alertmanagers:
    - static_configs:
        - targets: ['alertmanager:9093']
```

### Grafana Dashboards / Grafana仪表板

**Key Dashboards to Create / 要创建的关键仪表板**:

1. **Overview Dashboard / 概览仪表板**
   - Request rate
   - Error rate
   - API latency
   - System health

2. **Database Dashboard / 数据库仪表板**
   - Connection pool usage
   - Query performance
   - Table sizes
   - Locks and deadlocks

3. **Cache Dashboard / 缓存仪表板**
   - Hit rate
   - Memory usage
   - Key count
   - Evictions

4. **System Resources Dashboard / 系统资源仪表板**
   - CPU usage
   - Memory usage
   - Disk I/O
   - Network traffic

**Import Dashboard / 导入仪表板**:

1. Log in to Grafana (http://localhost:3001)
2. Click "+" → "Import"
3. Enter dashboard ID or upload JSON
4. Select Prometheus datasource

**Community Dashboards / 社区仪表板**:
- Node Exporter: 1860
- PostgreSQL: 9628
- Redis: 11835
- Docker: 179

---

## 🚨 Alerting / 告警

### Alert Configuration / 告警配置

```yaml
# alertmanager.yml
global:
  resolve_timeout: 5m

route:
  group_by: ['alertname', 'cluster', 'service']
  group_wait: 10s
  group_interval: 10s
  repeat_interval: 12h
  receiver: 'default'

  routes:
    - match:
        severity: critical
      receiver: 'critical'

receivers:
  - name: 'default'
    email_configs:
      - to: 'admin@yourdomain.com'
        from: 'alertmanager@yourdomain.com'
        smarthost: 'smtp.example.com:587'
        auth_username: 'alertmanager@yourdomain.com'
        auth_password: 'password'

  - name: 'critical'
    email_configs:
      - to: 'oncall@yourdomain.com'
        from: 'alertmanager@yourdomain.com'
        smarthost: 'smtp.example.com:587'
```

### Prometheus Alert Rules / Prometheus告警规则

```yaml
# alert_rules.yml
groups:
  - name: blog_alerts
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

      - alert: HighAPILatency
        expr: histogram_quantile(0.95, http_request_duration_seconds_bucket) > 1
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High API latency"
          description: "P95 latency is {{ $value }}s"

      - alert: DatabaseConnectionPoolExhausted
        expr: db_pool_available_connections < 5
        for: 2m
        labels:
          severity: critical
        annotations:
          summary: "Database connection pool nearly exhausted"

      - alert: LowCacheHitRate
        expr: rate(cache_hits_total[5m]) / rate(cache_requests_total[5m]) < 0.7
        for: 10m
        labels:
          severity: warning
        annotations:
          summary: "Cache hit rate below 70%"

      - alert: HighMemoryUsage
        expr: container_memory_usage_bytes / container_spec_memory_limit_bytes > 0.9
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "Container {{ $labels.name }} high memory usage"
```

---

## 🔍 Log Analysis / 日志分析

### Common Queries / 常用查询

**Using Docker Logs / 使用Docker日志**:

```bash
# View all backend logs
docker compose logs backend

# Follow logs (real-time)
docker compose logs -f backend

# Last 100 lines
docker compose logs --tail 100 backend

# Since specific time
docker compose logs --since 2024-01-01T00:00:00 backend

# Grep for errors
docker compose logs backend | grep -i error

# Grep for specific endpoint
docker compose logs backend | grep "POST /api/v1/posts"

# Count errors in last hour
docker compose logs --since 1h backend | grep -c ERROR
```

**Using Journalctl (systemd services)** / 使用Journalctl：

```bash
# View service logs
sudo journalctl -u docker-compose

# Follow logs
sudo journalctl -u docker-compose -f

# Since boot
sudo journalctl -u docker-compose -b

# Last 100 lines
sudo journalctl -u docker-compose -n 100

# Filter by priority
sudo journalctl -u docker-compose -p err
```

### Log Analysis Tools / 日志分析工具

**Tool 1: jq (JSON log parsing)** / 工具1：jq（JSON日志解析）

```bash
# Parse JSON logs
docker compose logs backend --no-log-prefix | jq '.'

# Extract specific fields
docker compose logs backend --no-log-prefix | jq '.level, .message'

# Filter by level
docker compose logs backend --no-log-prefix | jq 'select(.level == "ERROR")'
```

**Tool 2: grep/awk/sed** / 工具2：grep/awk/sed

```bash
# Count status codes
docker compose logs nginx | grep -oP 'status=\K\d+' | sort | uniq -c

# Extract IP addresses
docker compose logs nginx | grep -oP 'client_ip=\K[\d.]+' | sort | uniq -c | sort -rn

# Average response time
docker compose logs backend | grep -oP 'duration=\K[\d.]+' | awk '{sum+=$1; count++} END {print sum/count}'
```

---

## 📊 Monitoring Checklist / 监控清单

### Initial Setup / 初始设置

- [ ] Configure health checks for all services / 为所有服务配置健康检查
- [ ] Enable Prometheus metrics / 启用Prometheus指标
- [ ] Set up log rotation / 设置日志轮换
- [ ] Configure Grafana dashboards / 配置Grafana仪表板
- [ ] Set up alerting / 设置告警
- [ ] Test monitoring system / 测试监控系统

### Ongoing Monitoring / 持续监控

**Daily / 每天**:
- [ ] Check service health / 检查服务健康
- [ ] Review error logs / 审查错误日志
- [ ] Verify alerts are working / 验证告警工作

**Weekly / 每周**:
- [ ] Review performance trends / 审查性能趋势
- [ ] Check disk space usage / 检查磁盘空间使用
- [ ] Analyze slow queries / 分析慢查询

**Monthly / 每月**:
- [ ] Review alerting rules / 审查告警规则
- [ ] Update dashboards / 更新仪表板
- [ ] Analyze security logs / 分析安全日志
- [ ] Performance audit / 性能审计

---

## 🔧 Troubleshooting / 故障排查

### Common Issues / 常见问题

**Issue 1: High Memory Usage / 内存使用率高**

```bash
# Check container stats
docker stats

# Identify memory leaks
docker compose logs backend | grep -i memory

# Check application memory
docker compose exec backend ps aux

# Solution: Restart container
docker compose restart backend
```

**Issue 2: High CPU Usage / CPU使用率高**

```bash
# Check CPU usage
docker stats --no-stream

# Check top processes in container
docker compose exec backend top

# Check for infinite loops
docker compose logs backend | tail -100

# Solution: Check logs for stuck requests, restart if needed
```

**Issue 3: Database Slow / 数据库慢**

```bash
# Check slow queries
docker compose exec postgres psql -U blog_user -d blog_db -c "SELECT * FROM pg_stat_statements ORDER BY total_exec_time DESC LIMIT 10;"

# Check locks
docker compose exec postgres psql -U blog_user -d blog_db -c "SELECT * FROM pg_locks;"

# Check table sizes
docker compose exec postgres psql -U blog_user -d blog_db -c "SELECT schemaname, tablename, pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) FROM pg_tables WHERE schemaname = 'public' ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;"

# Solution: Add indexes, vacuum, optimize queries
```

**Issue 4: High Error Rate / 高错误率**

```bash
# Check error logs
docker compose logs backend | grep ERROR | tail -50

# Check database connection issues
docker compose logs backend | grep -i "database\|connection"

# Check Redis issues
docker compose logs backend | grep -i "redis\|cache"

# Solution: Identify root cause from logs, fix code/config
```

---

## 📖 Related Documentation / 相关文档

- [Performance Tuning](../reference/performance-tuning.md) - Optimization techniques
- [Security Best Practices](./security.md) - Security monitoring
- [Production Server Guide](../guides/server/production-server.md) - Monitoring setup
- [Commands Reference](../reference/commands.md) - Log commands

---

## 🔗 External Resources / 外部资源

### Monitoring Tools / 监控工具

- **Prometheus**: https://prometheus.io/ - Metrics collection
- **Grafana**: https://grafana.com/ - Visualization
- **ELK Stack**: https://www.elastic.co/ - Logging
- **Datadog**: https://www.datadoghq.com/ - Commercial monitoring

### Learning Resources / 学习资源

- **Prometheus Best Practices**: https://prometheus.io/docs/practices/
- **Grafana Tutorials**: https://grafana.com/tutorials/
- **Observability Guide**: https://www.oreilly.com/library/view/monitoring-distributed-systems/9781492076695/

---

## ❓ FAQ / 常见问题

### Q: How long should I keep logs? / 应该保留日志多久？

**A / 答**: / 建议：
- Development: 1-7 days / 开发：1-7天
- Production: 30-90 days (for audit) / 生产：30-90天（用于审计）
- Compliance: Check legal requirements (often 1-7 years) / 合规：检查法律要求（通常1-7年）

### Q: What's the difference between logs and metrics? / 日志和指标有什么区别？

**A / 答**: / 区别：
- **Logs**: Detailed, discrete events (errors, requests) / 日志：详细的、离散的事件（错误、请求）
- **Metrics**: Numerical measurements over time (CPU, requests/sec) / 指标：随时间的数值测量（CPU、请求/秒）
- **Logs answer "what happened"** / 日志回答"发生了什么"
- **Metrics answer "how is the system performing"** / 指标回答"系统如何运行"

### Q: Do I need expensive monitoring tools? / 需要昂贵的监控工具吗？

**A / 答**: No. For most blogs: / 不需要。对于大多数博客：
- **Small sites**: Docker logs + Grafana (free) / 小型站点：Docker日志 + Grafana（免费）
- **Medium sites**: Prometheus + Grafana (free) / 中型站点：Prometheus + Grafana（免费）
- **Large sites**: Consider commercial tools (Datadog, New Relic) / 大型站点：考虑商业工具（Datadog、New Relic）

---

**Version**: 2.0 (World-Class Deployment Documentation)
**Last Updated**: 2026-01-01
**Maintained By**: Deployment Team

🤖 Generated with [Claude Code](https://claude.com/claude-code)

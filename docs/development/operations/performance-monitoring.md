# Performance Monitoring Guide

本文档说明如何监控前端和后端的性能指标，确保系统在生产环境中保持高性能。

## 目录

- [前端性能监控](#前端性能监控)
- [后端性能监控](#后端性能监控)
- [监控工具](#监控工具)
- [日志管理](#日志管理)
- [告警配置](#告警配置)
- [性能基线](#性能基线)

---

## 前端性能监控

### Core Web Vitals

Google 的 Core Web Vitals 是衡量用户体验的核心指标：

#### LCP (Largest Contentful Paint)

**目标**: < 2.5 秒

**含义**: 页面主要内容加载完成的时间

**监控**:
```typescript
// 使用 Performance API 测量 LCP
import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals'

function sendToAnalytics(metric) {
  const body = JSON.stringify(metric)
  const url = 'https://example.com/analytics'

  // 使用 sendBeacon 确保数据发送
  navigator.sendBeacon(url, body)
}

getLCP(sendToAnalytics)
```

**优化方法**:
- 减少服务器响应时间 (TTFB)
- 优化资源加载（懒加载、预加载）
- 减少第三方脚本影响
- 使用 CDN 加速

#### FID (First Input Delay)

**目标**: < 100 毫秒

**含义**: 用户首次交互到浏览器响应的时间

**优化方法**:
- 减少 JavaScript 执行时间
- 拆分长任务
- 使用 Web Workers
- 减少主线程工作

#### CLS (Cumulative Layout Shift)

**目标**: < 0.1

**含义**: 页面布局稳定性

**优化方法**:
- 为图片和视频设置尺寸
- 为动态广告位预留空间
- 避免在现有内容上方插入内容
- 使用 `transform` 动画而非改变布局

---

### Bundle 大小监控

#### 测量 Bundle 大小

```bash
# 分析 bundle 大小
pnpm build -- --analyze

# 使用 webpack-bundle-analyzer
pnpm install -D webpack-bundle-analyzer
```

#### 目标大小

| 资源类型 | 初始加载 | 总大小 |
|---------|---------|--------|
| JavaScript | < 200 KB | < 500 KB |
| CSS | < 50 KB | < 100 KB |
| Fonts | < 100 KB | < 200 KB |

#### 优化方法

1. **代码分割**:
```typescript
// 使用动态导入
const Dashboard = dynamic(() => import('./Dashboard'))
```

2. **Tree Shaking**:
```typescript
// 只导入需要的组件
import { Button } from '@/components/ui/button'
// 而不是 import * from '@/components'
```

3. **压缩**:
```javascript
// next.config.js
module.exports = {
  compress: true,
  swcMinify: true,
}
```

---

### 加载性能分析

#### Navigation Timing API

```typescript
function measurePageLoad() {
  const perfData = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming

  return {
    // DNS 查询时间
    dns: perfData.domainLookupEnd - perfData.domainLookupStart,

    // TCP 连接时间
    tcp: perfData.connectEnd - perfData.connectStart,

    // 请求响应时间
    ttfb: perfData.responseStart - perfData.requestStart,

    // DOM 解析时间
    domParse: perfData.domComplete - perfData.domInteractive,

    // 完整加载时间
    loadTime: perfData.loadEventEnd - perfData.fetchStart,
  }
}
```

#### Resource Timing API

```typescript
function measureResources() {
  const resources = performance.getEntriesByType('resource')

  return resources.map(r => ({
    name: r.name,
    duration: r.duration,
    size: r.transferSize,
    type: r.initiatorType,
  }))
}
```

---

## 后端性能监控

### API 响应时间

#### 测量端点性能

```rust
use axum::extract::Request;
use std::time::Instant;

async fn measure_middleware(
    req: Request,
    next: Next,
) -> Result<impl IntoResponse, StatusCode> {
    let start = Instant::now();

    let response = next.run(req).await;

    let duration = start.elapsed();

    // 记录响应时间
    tracing::info!(
        method = ?response.request().method(),
        path = ?response.request().uri().path(),
        status = ?response.status(),
        duration_ms = duration.as_millis(),
        "API request"
    );

    Ok(response)
}
```

#### 性能目标

| 端点类型 | P50 | P95 | P99 |
|---------|-----|-----|-----|
| 静态 API | < 50ms | < 100ms | < 200ms |
| 数据库查询 | < 20ms | < 50ms | < 100ms |
| 认证请求 | < 100ms | < 200ms | < 500ms |
| 复杂计算 | < 500ms | < 1000ms | < 2000ms |

---

### 数据库查询性能

#### 慢查询日志

```rust
use sqlx::postgres::PgPoolOptions;

#[tracing::instrument(skip(pool))]
async fn execute_query(pool: &PgPool, query: &str) -> Result<()> {
    let start = Instant::now();

    let result = sqlx::query(query)
        .execute(pool)
        .await?;

    let duration = start.elapsed();

    if duration.as_millis() > 100 {
        tracing::warn!(
            query,
            duration_ms = duration.as_millis(),
            "Slow query detected"
        );
    }

    Ok(())
}
```

#### 优化策略

1. **添加索引**:
```sql
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_comments_post_slug ON comments(post_slug);
CREATE INDEX idx_comments_status ON comments(status);
```

2. **优化查询**:
```sql
-- ❌ 避免 SELECT *
SELECT * FROM users WHERE email = '...';

-- ✅ 只选择需要的字段
SELECT id, username, email FROM users WHERE email = '...';
```

3. **连接池配置**:
```rust
let pool = PgPoolOptions::new()
    .max_connections(20)
    .min_connections(5)
    .acquire_timeout(Duration::from_secs(30))
    .idle_timeout(Duration::from_secs(600))
    .connect(&database_url).await?;
```

---

### Redis 缓存性能

#### 缓存命中率

```rust
#[derive(Debug)]
struct CacheMetrics {
    hits: AtomicU64,
    misses: AtomicU64,
}

impl CacheMetrics {
    fn hit_rate(&self) -> f64 {
        let hits = self.hits.load(Ordering::Relaxed) as f64;
        let misses = self.misses.load(Ordering::Relaxed) as f64;
        hits / (hits + misses)
    }
}
```

#### 目标命中率

| 缓存类型 | 目标命中率 |
|---------|-----------|
| 会话缓存 | > 95% |
| API 响应缓存 | > 80% |
| 静态数据缓存 | > 90% |

#### 优化方法

1. **设置合适的 TTL**:
```rust
// 会话数据：7天
redis.set_ex(key, value, 60 * 60 * 24 * 7).await?;

// API 响应：5分钟
redis.set_ex(key, value, 60 * 5).await?;

// 静态数据：1小时
redis.set_ex(key, value, 60 * 60).await?;
```

2. **缓存预热**:
```rust
async fn warmup_cache(redis: &RedisClient) -> Result<()> {
    let popular_posts = fetch_popular_posts().await?;

    for post in popular_posts {
        let key = format!("post:{}", post.slug);
        redis.set_ex(&key, &post, 3600).await?;
    }

    Ok(())
}
```

---

### 内存和 CPU 监控

#### Rust 内存监控

```rust
use sysinfo::{System, SystemExt};

fn check_memory_usage() {
    let mut sys = System::new_all();

    sys.refresh_all();

    let total_memory = sys.total_memory();
    let used_memory = sys.used_memory();
    let usage_percent = (used_memory as f64 / total_memory as f64) * 100.0;

    tracing::info!(
        total_mb = total_memory / 1024,
        used_mb = used_memory / 1024,
        usage_percent,
        "Memory usage"
    );
}
```

#### CPU 监控

```rust
fn check_cpu_usage() {
    let mut sys = System::new_all();

    sys.refresh_cpu();

    for (i, cpu) in sys.cpus().iter().enumerate() {
        tracing::info!(
            cpu = i,
            usage_percent = cpu.cpu_usage(),
            "CPU usage"
        );
    }
}
```

---

## 监控工具

### Prometheus + Grafana

#### Prometheus 配置

**文件**: `prometheus.yml`

```yaml
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'frontend'
    static_configs:
      - targets: ['localhost:3001']

  - job_name: 'backend'
    static_configs:
      - targets: ['localhost:3000']

  - job_name: 'postgres'
    static_configs:
      - targets: ['localhost:9187']

  - job_name: 'redis'
    static_configs:
      - targets: ['localhost:9121']
```

#### Grafana 仪表板

**推荐的仪表板**:
1. **Node Exporter** - 系统资源监控
2. **PostgreSQL** - 数据库性能
3. **Redis** - 缓存性能
4. **Next.js** - 前端性能

---

### Umami Analytics

#### 配置

**环境变量**:
```bash
NEXT_PUBLIC_UMAMI_ID=your-umami-id
NEXT_PUBLIC_UMAMI_URL=https://umami.example.com
```

#### 使用

```tsx
import { useEffect } from 'react'

export function Analytics() {
  useEffect(() => {
    if (typeof window !== 'undefined' && (window as any).umami) {
      (window as any).umami.track('page_view')
    }
  }, [])

  return null
}
```

---

### Google Analytics

#### 配置

**环境变量**:
```bash
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX
```

#### 使用

```tsx
import GoogleAnalytics from '@/components/GoogleAnalytics'

export default function RootLayout({ children }) {
  return (
    <html>
      <head>
        <GoogleAnalytics />
      </head>
      <body>{children}</body>
    </html>
  )
}
```

---

### Sentry 性能监控

#### 配置

```typescript
import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 0.1, // 10% 的事务采样

  // 性能监控
  integrations: [
    new Sentry.BrowserTracing({
      tracingOrigins: ['localhost', 'example.com'],
    }),
  ],
})
```

#### 自定义性能追踪

```typescript
import * as Sentry from '@sentry/nextjs'

async function fetchData() {
  return Sentry.startSpan(
    { name: 'fetch_data', op: 'http.client' },
    async () => {
      const response = await fetch('/api/data')
      return response.json()
    }
  )
}
```

---

## 日志管理

### 结构化日志

#### Rust 后端日志

```rust
use tracing::{info, warn, error};
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};

fn init_logging() {
    tracing_subscriber::registry()
        .with(
            tracing_subscriber::EnvFilter::try_from_default_env()
                .unwrap_or_else(|_| "blog_backend=debug,tower_http=debug".into()),
        )
        .with(tracing_subscriber::fmt::layer())
        .init();
}

#[tracing::instrument]
async fn handle_request(user_id: &str) -> Result<()> {
    info!(user_id, "Handling request");

    // ... 业务逻辑

    Ok(())
}
```

#### Next.js 前端日志

```typescript
import pino from 'pino'

const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  browser: {
    asObject: true,
  },
})

export { logger }
```

---

### 日志聚合

#### Elasticsearch + Kibana

```bash
# 使用 Filebeat 收集日志
filebeat modules enable nginx
filebeat modules enable postgresql
filebeat modules enable system
```

#### Grafana Loki

```yaml
# promtail-config.yml
server:
  http_listen_port: 9080

positions:
  filename: /tmp/positions.yaml

clients:
  - url: http://localhost:3100/loki/api/v1/push

scrape_configs:
  - job_name: backend-logs
    static_configs:
      - targets:
          - localhost
        labels:
          job: backend
          __path__: /var/log/backend/*.log
```

---

## 告警配置

### 告警规则

#### Prometheus 告警规则

**文件**: `alert.rules.yml`

```yaml
groups:
  - name: api_alerts
    interval: 30s
    rules:
      # 高错误率告警
      - alert: HighErrorRate
        expr: rate(http_requests_total{status=~"5.."}[5m]) > 0.05
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "High error rate detected"
          description: "Error rate is {{ $value }} errors/sec"

      # 慢 API 告警
      - alert: SlowAPI
        expr: http_request_duration_seconds{quantile="0.95"} > 1
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "Slow API detected"
          description: "P95 response time is {{ $value }}s"

      # 高内存使用告警
      - alert: HighMemoryUsage
        expr: (node_memory_MemTotal_bytes - node_memory_MemAvailable_bytes) / node_memory_MemTotal_bytes > 0.9
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High memory usage"
          description: "Memory usage is {{ $value | humanizePercentage }}"
```

---

### 通知渠道

#### Email 通知

```yaml
# alertmanager.yml
receivers:
  - name: 'email-alerts'
    email_configs:
      - to: 'alerts@example.com'
        from: 'alertmanager@example.com'
        smarthost: 'smtp.gmail.com:587'
        auth_username: 'alertmanager@example.com'
        auth_password: 'password'
```

#### Slack 通知

```yaml
receivers:
  - name: 'slack-alerts'
    slack_configs:
      - api_url: 'https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK'
        channel: '#alerts'
        title: '{{ .GroupLabels.alertname }}'
        text: '{{ range .Alerts }}{{ .Annotations.description }}{{ end }}'
```

---

## 性能基线

### 前端性能基线

| 指标 | 目标 | 可接受 | 需优化 |
|-----|------|--------|--------|
| LCP | < 2.5s | 2.5-4s | > 4s |
| FID | < 100ms | 100-300ms | > 300ms |
| CLS | < 0.1 | 0.1-0.25 | > 0.25 |
| TTI | < 3.5s | 3.5-7s | > 7s |
| Bundle 大小 | < 200 KB | 200-500 KB | > 500 KB |

### 后端性能基线

| 指标 | 目标 | 可接受 | 需优化 |
|-----|------|--------|--------|
| API P50 | < 50ms | 50-100ms | > 100ms |
| API P95 | < 200ms | 200-500ms | > 500ms |
| 数据库查询 | < 20ms | 20-50ms | > 50ms |
| Redis 命中率 | > 90% | 80-90% | < 80% |
| 内存使用 | < 70% | 70-90% | > 90% |

---

## 相关文档

- [Security Guide](./security-guide.md) - 安全监控指南
- [Troubleshooting Guide](./troubleshooting-guide.md) - 故障排查指南
- [Backend Overview](../backend/overview.md) - 后端架构
- [Frontend Overview](../frontend/overview.md) - 前端架构

---

**最后更新**: 2025-12-27
**维护者**: Operations Team

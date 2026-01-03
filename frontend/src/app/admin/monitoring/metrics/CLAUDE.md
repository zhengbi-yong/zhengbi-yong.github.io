# Prometheus Metrics Monitoring Page

## Module Overview
**Path**: `frontend/src/app/admin/monitoring/metrics/page.tsx`
**Layer**: 3 (Leaf Component)
**Type**: Client Component - Real-time Metrics Dashboard

Admin dashboard for visualizing Prometheus metrics with real-time updates. Displays HTTP request statistics, database connection pool status, Redis metrics, and session tracking.

## Purpose
Provides administrators with comprehensive system performance insights through parsed Prometheus metrics, enabling capacity planning and performance optimization.

## Core Responsibilities

### Metrics Fetching & Parsing
- Fetch raw Prometheus text format from `/metrics` endpoint
- Parse metrics using custom parser utility
- Extract specific metric categories (HTTP, DB, Redis, sessions)
- Calculate statistics (P50, P95, P99 latencies)

### Real-Time Display
- Auto-refresh metrics every 10 seconds (toggleable)
- Display key performance indicators (KPIs) in card grid
- Show detailed statistics for each metric category
- Handle loading and error states gracefully

### Performance Categories
- **HTTP Requests**: Total count, P95 latency, request rate
- **Database**: Connection pool status (active, idle, max)
- **Redis**: Connection statistics
- **Sessions**: Active session count with labels

## Technical Implementation

### Data Fetching
```typescript
const { data, isLoading, error, refetch } = useQuery<string>({
  queryKey: ['metrics'],
  queryFn: async () => {
    const response = await fetch(`${backendBaseUrl}/metrics`)
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    return response.text()  // Raw Prometheus text format
  },
  refetchInterval: autoRefresh ? 10000 : false,
})
```

### Metrics Parsing Pipeline
```typescript
// 1. Parse raw Prometheus text format
const metrics = data ? parsePrometheusMetrics(data) : null

// 2. Extract specific metric categories
const durationStats = metrics ? getRequestDurationStats(metrics) : null
const dbStats = metrics ? getDatabaseStats(metrics) : null
const redisStats = metrics ? getRedisStats(metrics) : null
```

### Backend URL Construction
```typescript
const backendBaseUrl = (process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3000/v1').replace('/v1', '')
// Removes /v1 prefix for metrics endpoint at root level
```

## Dependencies

### React & Query
```typescript
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
```

### UI Components
```typescript
import { RefreshCw, Activity, Database, Zap, AlertCircle } from 'lucide-react'
import { Loader2 } from 'lucide-react'
```

### Utility Functions
```typescript
import {
  parsePrometheusMetrics,
  getRequestDurationStats,
  getDatabaseStats,
  getRedisStats
} from '@/lib/utils/prometheus-parser'
```

## Component Structure

```
MetricsPage
├── Header
│   ├── Title ("Prometheus 指标监控")
│   ├── Auto-refresh toggle
│   └── Manual refresh button
├── Loading State (spinner)
├── Error Banner (alert icon + message)
├── Metrics Grid (KPI cards)
│   ├── HTTP Requests (total count)
│   ├── Request Latency (P95)
│   ├── Database Connections (active)
│   ├── Redis Connections (active)
│   ├── Active Sessions (count)
│   └── Request Rate (total)
└── Detailed Statistics (2-column grid)
    ├── HTTP Request Latency (P50, P95, P99, avg)
    ├── Database Connection Pool (active, idle, max, %)
    ├── Redis Cache (active, total)
    └── Session Statistics (count + labels)

MetricCard (subcomponent)
├── Icon with blue background
├── Title
├── Value (large, bold)
└── Label (small, gray)

StatRow (subcomponent)
├── Label (left)
└── Value (right, medium)
```

## Data Structures

### Parsed Metrics
```typescript
interface PrometheusMetrics {
  http_requests_total?: Metric[]
  http_request_duration_seconds?: HistogramMetric[]
  db_connections_active?: GaugeMetric
  redis_connections_active?: GaugeMetric
  active_sessions?: GaugeMetric
  // ... more metrics
}
```

### Request Duration Stats
```typescript
interface DurationStats {
  count: number        // Total requests
  sum: number          // Total duration (seconds)
  avg: string          // Average latency (ms)
  p50: string          // 50th percentile (ms)
  p95: string          // 95th percentile (ms)
  p99: string          // 99th percentile (ms)
}
```

### Database Stats
```typescript
interface DatabaseStats {
  active: number       // Active connections
  idle: number         // Idle connections
  max: number          // Maximum pool size
}
```

### Redis Stats
```typescript
interface RedisStats {
  active: number       // Active connections
  total: number        // Total connections
}
```

## Prometheus Parser Utilities

### parsePrometheusMetrics(data: string)
Parses raw Prometheus text format into structured object.

**Input Example**:
```
# HELP http_requests_total Total HTTP requests
# TYPE http_requests_total counter
http_requests_total{method="GET",path="/api/posts"} 1234
http_requests_total{method="POST",path="/api/posts"} 56

# HELP db_connections_active Database active connections
# TYPE db_connections_active gauge
db_connections_active 8
```

**Output**:
```typescript
{
  http_requests_total: [
    { name: 'http_requests_total', labels: { method: 'GET', path: '/api/posts' }, value: 1234 },
    { name: 'http_requests_total', labels: { method: 'POST', path: '/api/posts' }, value: 56 }
  ],
  db_connections_active: {
    name: 'db_connections_active',
    value: 8
  }
}
```

### getRequestDurationStats(metrics)
Calculates latency percentiles from histogram metrics.

**Returns**: P50, P95, P99, average, count, sum

### getDatabaseStats(metrics)
Extracts connection pool metrics.

**Returns**: Active, idle, max connections

### getRedisStats(metrics)
Extracts Redis connection metrics.

**Returns**: Active, total connections

## KPI Cards Display

### Metrics Grid Layout
```typescript
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  {/* Up to 6 KPI cards */}
</div>
```

### Card Examples
1. **HTTP Requests**: Total count from `http_requests_total`
2. **Request Latency**: P95 from duration histogram
3. **Database Connections**: Active from DB gauge
4. **Redis Connections**: Active from Redis gauge
5. **Active Sessions**: Count from session gauge
6. **Request Rate**: Total requests count

### Conditional Rendering
```typescript
{durationStats && (
  <MetricCard
    title="请求延迟"
    value={`${durationStats.p95}ms`}
    label="P95延迟"
  />
)}
```

## Detailed Statistics Sections

### HTTP Request Latency
```
总请求数: 1,234
总耗时: 45.67s
平均延迟: 37ms
P50延迟: 32ms
P95延迟: 78ms
P99延迟: 145ms
```

### Database Connection Pool
```
活跃连接: 8
空闲连接: 12
最大连接数: 20
连接池使用率: 40.0%
```

### Redis Cache
```
活跃连接: 5
总连接数: 10
```

### Session Statistics
```
当前活跃: 42
[Additional labels from metrics...]
```

## Auto-Refresh Behavior

### Toggle Implementation
```typescript
const [autoRefresh, setAutoRefresh] = useState(true)

<button onClick={() => setAutoRefresh(!autoRefresh)}>
  {autoRefresh ? '自动刷新：开' : '自动刷新：关'}
</button>
```

### Refresh Interval
- **Enabled**: 10 seconds (`refetchInterval: 10000`)
- **Disabled**: Manual only (`refetchInterval: false`)

### Manual Refresh
```typescript
<button onClick={() => refetch()}>
  <RefreshCw className="w-5 h-5" />
</button>
```

## Error Handling

### Loading State
```typescript
{isLoading && (
  <div className="flex items-center justify-center p-12">
    <Loader2 className="w-8 h-8 animate-spin" />
    <p>加载中...</p>
  </div>
)}
```

### Error State
```typescript
{error && (
  <div className="bg-red-50 border border-red-200 rounded-lg p-6">
    <AlertCircle className="w-6 h-6 text-red-600" />
    <h3>无法获取指标数据</h3>
    <p>{error.message || '请检查Prometheus服务是否运行'}</p>
  </div>
)}
```

## API Integration

### Endpoint
```
GET /metrics
```

### Response Format
Plain text in Prometheus exposition format:
```
# HELP metric_name Metric description
# TYPE metric_name counter|gauge|histogram|summary
metric_name{label1="value1",label2="value2"} value
```

### Example Response
```
# HELP http_requests_total Total HTTP requests
# TYPE http_requests_total counter
http_requests_total{method="GET"} 1234

# HELP http_request_duration_seconds HTTP request latency
# TYPE http_request_duration_seconds histogram
http_request_duration_seconds_bucket{le="0.1"} 500
http_request_duration_seconds_bucket{le="0.5"} 900
http_request_duration_seconds_bucket{le="+Inf"} 1000
http_request_duration_seconds_sum 250.5
http_request_duration_seconds_count 1000
```

## Styling

### Color Scheme
- **Primary**: Blue (icon backgrounds, active states)
- **Dark Mode**: Full support with `dark:` variants
- **Status Colors**: Semantic colors for different metrics

### Layout
- **KPI Grid**: Responsive (1 → 2 → 3 columns)
- **Details Grid**: 2 columns on large screens (`lg:grid-cols-2`)
- **Spacing**: `gap-6` between cards, `space-y-6` between sections

### Typography
- **Card Title**: Small, medium weight (`text-sm font-medium`)
- **Card Value**: Large, bold (`text-2xl font-bold`)
- **Card Label**: Extra small, gray (`text-xs`)
- **Stat Labels**: Small, gray (`text-sm text-gray-600`)

## Calculation Examples

### Connection Pool Usage Percentage
```typescript
const usage = ((dbStats.active / dbStats.max) * 100).toFixed(1)
// Example: (8 / 20) * 100 = 40.0%
```

### Average Latency
```typescript
const avg = (durationStats.sum / durationStats.count * 1000).toFixed(0)
// Convert seconds to milliseconds
```

## Performance Considerations

### Query Optimization
- 10-second refresh balances freshness vs. load
- Query key `['metrics']` enables cache invalidation
- Text format is smaller than JSON

### Parsing Efficiency
- Single-pass parsing in `parsePrometheusMetrics`
- Metrics filtered by category on-demand
- No unnecessary calculations

### Network
- Single endpoint fetches all metrics
- Text format is more compact than JSON
- No parallel requests needed

## Future Enhancements
- Historical metrics chart (time series graph)
- Custom metric selector/search
- Alert threshold configuration
- Export metrics as CSV/JSON
- Metrics comparison (time range comparison)
- Anomaly detection/highlighting
- Custom dashboards with drag-and-drop
- Real-time WebSocket updates (instead of polling)
- Metrics aggregation across multiple instances
- Performance budget/targets visualization

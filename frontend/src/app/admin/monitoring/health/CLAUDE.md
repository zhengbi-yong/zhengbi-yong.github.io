# Health Check Monitoring Page

## Module Overview
**Path**: `frontend/src/app/admin/monitoring/health/page.tsx`
**Layer**: 3 (Leaf Component)
**Type**: Client Component - Real-time Monitoring Dashboard

Admin dashboard page for real-time system health monitoring. Displays service status, response times, and connectivity checks with auto-refresh capability.

## Purpose
Provides administrators with instant visibility into system health across all critical services (database, Redis, JWT, email). Enables proactive issue detection and troubleshooting.

## Core Responsibilities

### Health Status Monitoring
- Fetch detailed health status from backend `/healthz/detailed` endpoint
- Display overall system status (healthy/unhealthy)
- Monitor individual service health indicators
- Track response times and last check timestamps

### Auto-Refresh Management
- Toggle auto-refresh on/off (10-second intervals)
- Manual refresh button for immediate status update
- Visual indicator for auto-refresh state

### Service Status Display
- Database connection health
- Redis cache connectivity
- JWT service availability
- Email service operational status

## Technical Implementation

### Data Fetching
```typescript
const { data: healthData, isLoading, error, refetch } = useQuery({
  queryKey: ['health-check', 'detailed'],
  queryFn: async () => {
    const response = await fetch(`${backendBaseUrl}/healthz/detailed`)
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    return response.json() as Promise<DetailedHealthStatus>
  },
  refetchInterval: autoRefresh ? 10000 : false, // 10s auto-refresh
})
```

### Backend URL Construction
```typescript
const backendBaseUrl = (process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3000/v1').replace('/v1', '')
// Result: http://localhost:3000 (removes /v1 for health endpoints)
```

### State Management
```typescript
const [autoRefresh, setAutoRefresh] = useState(true)
// Controls refetchInterval dynamically
```

## Dependencies

### React & Query
```typescript
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
```

### UI Components
```typescript
import { CheckCircle2, XCircle, AlertCircle, RefreshCw } from 'lucide-react'
import { Loader2 } from 'lucide-react'
```

### Type Definitions
```typescript
import type { DetailedHealthStatus, ServiceHealth } from '@/lib/types/backend'
```

## Component Structure

```
HealthCheckPage
├── Header
│   ├── Title ("系统健康检查")
│   ├── Auto-refresh toggle button
│   └── Manual refresh button
├── Overall Status Card
│   ├── Status icon (CheckCircle2/XCircle)
│   ├── Status text ("健康"/"不健康")
│   └── Last check timestamp
├── Loading State (spinner + "检查中...")
├── Error Banner (alert icon + error message)
└── Service Status Grid
    ├── Database (ServiceStatusCard)
    ├── Redis (ServiceStatusCard)
    ├── JWT (ServiceStatusCard)
    └── Email (ServiceStatusCard)

ServiceStatusCard (subcomponent)
├── Icon + Name + Status
├── Status indicator (CheckCircle2/XCircle)
├── Optional message
└── Details section
    ├── Response time
    └── Last check timestamp
```

## Data Structures

### DetailedHealthStatus
```typescript
interface DetailedHealthStatus {
  status: 'healthy' | 'unhealthy' | 'degraded'
  timestamp: string  // ISO 8601 timestamp
  services: {
    database: ServiceHealth
    redis: ServiceHealth
    jwt: ServiceHealth
    email: ServiceHealth
  }
}
```

### ServiceHealth
```typescript
interface ServiceHealth {
  status: 'healthy' | 'unhealthy'
  message?: string
  response_time_ms?: number
  last_check: string  // ISO 8601 timestamp
}
```

## Status Indicators

### Overall System Status
- **Healthy**:
  - Green background (`bg-green-50`)
  - Green border (`border-green-200`)
  - CheckCircle2 icon (green)
  - Text: "系统状态：健康"

- **Unhealthy**:
  - Red background (`bg-red-50`)
  - Red border (`border-red-200`)
  - XCircle icon (red)
  - Text: "系统状态：不健康"

### Individual Services
- **Healthy**: Green status indicator, "运行正常" text
- **Unhealthy**: Red status indicator, "服务异常" text

## Auto-Refresh Behavior

### Toggle Button
```typescript
<button onClick={() => setAutoRefresh(!autoRefresh)}>
  {autoRefresh ? '自动刷新：开' : '自动刷新：关'}
</button>
```

### Styling States
- **Enabled**: Blue background, blue text (`bg-blue-100 text-blue-700`)
- **Disabled**: Gray background, gray text (`bg-gray-100 text-gray-700`)

### Refresh Interval
- **Enabled**: `refetchInterval: 10000` (10 seconds)
- **Disabled**: `refetchInterval: false` (manual only)

## Error Handling

### Loading State
```typescript
{isLoading && (
  <div className="flex items-center justify-center p-12">
    <Loader2 className="w-8 h-8 animate-spin" />
    <p>检查中...</p>
  </div>
)}
```

### Error State
```typescript
{error && (
  <div className="bg-red-50 border border-red-200 rounded-lg p-6">
    <AlertCircle className="w-6 h-6 text-red-600" />
    <h3>无法获取健康状态</h3>
    <p>{error.message || '请检查后端服务是否运行'}</p>
  </div>
)}
```

## API Integration

### Endpoint
```
GET /healthz/detailed
```

### Response Example
```json
{
  "status": "healthy",
  "timestamp": "2025-01-03T10:30:00Z",
  "services": {
    "database": {
      "status": "healthy",
      "response_time_ms": 5,
      "last_check": "2025-01-03T10:30:00Z"
    },
    "redis": {
      "status": "healthy",
      "response_time_ms": 2,
      "last_check": "2025-01-03T10:30:00Z"
    },
    "jwt": {
      "status": "healthy",
      "message": "JWT service operational",
      "response_time_ms": 1,
      "last_check": "2025-01-03T10:30:00Z"
    },
    "email": {
      "status": "unhealthy",
      "message": "SMTP connection timeout",
      "response_time_ms": 5000,
      "last_check": "2025-01-03T10:30:00Z"
    }
  }
}
```

## Styling

### Color Scheme
- **Success**: Green (healthy status)
- **Error**: Red (unhealthy status)
- **Info**: Blue (auto-refresh toggle)
- **Warning**: Yellow (degraded status, if implemented)

### Dark Mode
- All color classes have `dark:` variants
- Backgrounds: `dark:bg-gray-800`, `dark:bg-green-900/20`
- Borders: `dark:border-gray-700`, `dark:border-green-800`
- Text: `dark:text-white`, `dark:text-green-400`

### Responsive Design
- Grid: `grid-cols-1 md:grid-cols-2` (1 col mobile, 2 col desktop)
- Spacing: `gap-6` between cards
- Padding: Consistent `p-6` for card content

## Timestamp Formatting

### Last Check Display
```typescript
{healthData?.timestamp
  ? `最后检查：${new Date(healthData.timestamp).toLocaleString('zh-CN')}`
  : '等待检查...'}
```

### Service Last Check
```typescript
{service.last_check && (
  <div>
    <dt>最后检查:</dt>
    <dd>{new Date(service.last_check).toLocaleTimeString('zh-CN')}</dd>
  </div>
)}
```

### Locale
- Chinese locale (`zh-CN`) for all timestamps
- Date format: `YYYY/MM/DD HH:mm:ss`
- Time only for individual services

## Accessibility

### Icon Usage
- **CheckCircle2**: Healthy status (green)
- **XCircle**: Unhealthy status (red)
- **AlertCircle**: Error state (red)
- **RefreshCw**: Manual refresh action (gray)

### Button Labels
- Clear text labels ("自动刷新：开/关")
- `title` attribute for icon buttons ("手动刷新")
- Color contrast meets WCAG standards

### Semantic HTML
- Proper heading hierarchy (h1, h2, h3)
- Definition lists (`<dl>`, `<dt>`, `<dd>`) for key-value pairs
- Button elements for interactive controls

## Performance Considerations

### Query Optimization
- 10-second refresh interval balances freshness vs. load
- Query key includes 'detailed' for cache invalidation
- Manual refresh bypasses interval with `refetch()`

### Network Efficiency
- Single endpoint fetches all service statuses
- No parallel requests for individual services
- Response size minimized with essential data only

## Future Enhancements
- Historical health trends chart
- Service dependency graph visualization
- Alert configuration (webhook, email, Slack)
- Export health report as PDF
- Service restart actions (if authorized)
- Detailed logs/metrics drill-down
- Health check configuration (timeout thresholds)
- Multi-region/cluster monitoring

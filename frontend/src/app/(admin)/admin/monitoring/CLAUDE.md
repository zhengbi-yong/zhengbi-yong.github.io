# Monitoring Overview Page

## Module Overview
**Path**: `frontend/src/app/admin/monitoring/page.tsx`
**Layer**: 3 (Leaf Component)
**Type**: Client Component - Monitoring Hub Dashboard

Central entry point for system monitoring tools, providing quick health status overview and navigation to specialized monitoring pages (health check, metrics, alerts).

## Purpose
Serves as the monitoring dashboard hub, displaying at-a-glance system health metrics and providing access to detailed monitoring modules for administrators.

## Core Responsibilities

### Quick Status Display
- Fetch and display overall system health status
- Show key service metrics (response time, database, Redis)
- Display last update timestamp
- Auto-refresh every 10 seconds

### Navigation Hub
- Provide quick access to health check page
- Link to Prometheus metrics dashboard
- Card-based navigation with icons and descriptions
- Clear visual hierarchy for monitoring tools

### Real-Time Updates
- Toggle auto-refresh on/off
- Manual refresh button
- Visual feedback for loading states
- Timestamp display for last update

## Technical Implementation

### Data Fetching
```typescript
const { data: healthData, isLoading: healthLoading } = useQuery({
  queryKey: ['health-check', 'overview'],
  queryFn: async () => {
    const backendBaseUrl = process.env.NEXT_PUBLIC_BACKEND_URL?.replace('/v1', '') || 'http://localhost:3000'
    const response = await fetch(`${backendBaseUrl}/health/detailed`)
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    return response.json() as Promise<DetailedHealthStatus>
  },
  refetchInterval: 10000, // 10 seconds
  enabled: mounted,
})
```

### Backend URL Construction
```typescript
const backendBaseUrl = (process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3000/v1').replace('/v1', '')
// Removes /v1 suffix to access root-level health endpoints
// Example: http://localhost:3000/v1 → http://localhost:3000
```

### Mounted State Pattern
```typescript
const [mounted, setMounted] = useState(false)

useEffect(() => {
  setMounted(true)
}, [])

// Prevents hydration mismatch in Next.js
// Query only runs after component mounts on client
```

## Dependencies

### React & Query
```typescript
import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
```

### UI Components
```typescript
import {
  Activity, Heart, BarChart3,
  Server, Zap, Database, Loader2
} from 'lucide-react'
```

### Type Definitions
```typescript
import type { DetailedHealthStatus } from '@/lib/types/backend'
```

## Component Structure

```
MonitoringOverviewPage
├── Header
│   ├── Title ("系统监控")
│   └── Subtitle ("全面监控系统的健康状态和性能指标")
├── Quick Stats Grid (4 cards)
│   ├── System Status (健康/异常)
│   ├── Response Time (响应时间)
│   ├── Database (连接正常/异常)
│   └── Redis (运行中/异常)
├── Monitoring Modules Grid (2-3 columns)
│   ├── Health Check Card (link to /admin/monitoring/health)
│   └── Metrics Card (link to /admin/monitoring/metrics)
├── Loading State (spinner)
└── Info Banner (auto-refresh explanation)
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
  last_check: string
}
```

## Quick Stats Cards

### Stats Configuration
```typescript
const quickStats = [
  {
    label: '系统状态',
    value: healthData?.status === 'healthy' ? '健康' : '异常',
    icon: healthData?.status === 'healthy'
      ? <Server className="w-5 h-5 text-green-600" />
      : <Server className="w-5 h-5 text-red-600" />,
  },
  {
    label: '响应时间',
    value: healthData?.services?.database?.response_time_ms
      ? `${healthData.services.database.response_time_ms}ms`
      : '检测中...',
    icon: <Activity className="w-5 h-5 text-blue-600" />,
  },
  {
    label: '数据库',
    value: healthData?.services?.database?.status === 'healthy' ? '连接正常' : '连接异常',
    icon: healthData?.services?.database?.status === 'healthy'
      ? <Database className="w-5 h-5 text-green-600" />
      : <Database className="w-5 h-5 text-red-600" />,
  },
  {
    label: '缓存',
    value: healthData?.services?.redis?.status === 'healthy' ? '运行中' : '异常',
    icon: healthData?.services?.redis?.status === 'healthy'
      ? <Zap className="w-5 h-5 text-yellow-600" />
      : <Zap className="w-5 h-5 text-red-600" />,
  },
]
```

### Card Layout
```typescript
<div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
  <div className="flex items-center justify-between">
    <div>
      <p className="text-sm text-gray-600 dark:text-gray-400">{stat.label}</p>
      <p className="text-lg font-semibold text-gray-900 dark:text-white mt-1">{stat.value}</p>
    </div>
    {stat.icon}
  </div>
</div>
```

### Dynamic Status Indicators
- **Healthy**: Green icon, positive text ("健康", "连接正常", "运行中")
- **Unhealthy**: Red icon, negative text ("异常", "连接异常")
- **Loading**: Gray text ("检测中...")

## Monitoring Modules

### Module Cards Configuration
```typescript
const monitoringModules = [
  {
    title: '健康检查',
    description: '查看各服务的健康状态和运行情况',
    icon: <Heart className="w-8 h-8" />,
    href: '/admin/monitoring/health',
    color: 'green',
  },
  {
    title: '指标监控',
    description: '查看Prometheus性能指标和统计数据',
    icon: <BarChart3 className="w-8 h-8" />,
    href: '/admin/monitoring/metrics',
    color: 'blue',
  },
]
```

### Card Styling
```typescript
<Link
  href={module.href}
  className="group bg-white dark:bg-gray-800 rounded-lg border-2 border-gray-200 dark:border-gray-700 p-6 hover:border-blue-500 dark:hover:border-blue-500 transition-all hover:shadow-lg"
>
  <div className={`p-3 rounded-lg inline-block mb-4 ${
    module.color === 'green'
      ? 'bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400'
      : 'bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
  }`}>
    {module.icon}
  </div>
  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
    {module.title}
  </h3>
  <p className="text-sm text-gray-600 dark:text-gray-400">
    {module.description}
  </p>
</Link>
```

### Hover Effects
- Border color change to blue
- Text color change to blue on title
- Shadow elevation
- Smooth transitions

### Color Coding
- **Health Check**: Green (medical/health association)
- **Metrics**: Blue (data/analytics association)

## Loading State

### Loading Display
```typescript
if (healthLoading) {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="flex flex-col items-center space-y-4">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600 dark:text-blue-400" />
        <p className="text-gray-600 dark:text-gray-400">加载监控数据中...</p>
      </div>
    </div>
  )
}
```

### Behavior
- Shows spinner on initial load
- Minimum height: 400px
- Centered with flexbox
- Dark mode support
- Includes loading text

## Auto-Refresh Behavior

### Query Configuration
```typescript
refetchInterval: 10000  // 10 seconds
```

### Auto-Refresh Info Banner
```typescript
<div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
  <div className="flex items-start space-x-3">
    <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
      <Activity className="w-5 h-5 text-blue-600 dark:text-blue-400" />
    </div>
    <div className="flex-1">
      <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-400 mb-1">
        实时监控
      </h3>
      <p className="text-sm text-blue-700 dark:text-blue-300">
        所有监控页面支持自动刷新功能，数据每10秒更新一次。您可以随时切换自动刷新开关或手动刷新数据。
        {healthData?.timestamp && (
          <span className="ml-2">
            最后更新：{new Date(healthData.timestamp).toLocaleTimeString('zh-CN')}
          </span>
        )}
      </p>
    </div>
  </div>
</div>
```

### Timestamp Display
```typescript
{healthData?.timestamp && (
  <span>
    最后更新：{new Date(healthData.timestamp).toLocaleTimeString('zh-CN')}
  </span>
)}
```

**Format**: HH:mm:ss (e.g., "10:30:45")
**Locale**: Chinese (`zh-CN`)

## API Integration

### Endpoint
```
GET /health/detailed
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
- **Primary**: Blue (links, active states, info banner)
- **Success**: Green (healthy status indicators)
- **Warning**: Yellow (Redis cache icon)
- **Error**: Red (unhealthy status indicators)
- **Neutral**: Gray (borders, backgrounds, text)

### Dark Mode
- All color classes include `dark:` variants
- Backgrounds: `dark:bg-gray-800`, `dark:bg-gray-700`
- Borders: `dark:border-gray-600`, `dark:border-gray-700`
- Text: `dark:text-white`, `dark:text-gray-300`, `dark:text-gray-400`
- Specialized: `dark:bg-green-900/20` (semi-transparent overlays)

### Responsive Design
- **Quick Stats Grid**: 1 → 2 → 4 columns (`grid-cols-1 sm:grid-cols-2 lg:grid-cols-4`)
- **Modules Grid**: 1 → 2 → 3 columns (`grid-cols-1 md:grid-cols-2 lg:grid-cols-3`)
- **Spacing**: `gap-4` (stats), `gap-6` (modules)
- **Padding**: Consistent `p-4` (stats), `p-6` (modules, banner)

### Typography
- **Headers**: `text-3xl font-bold` (h1), `text-xl font-semibold` (h2), `text-lg font-semibold` (h3)
- **Labels**: `text-sm` (card labels), `text-sm font-semibold` (banner headers)
- **Values**: `text-lg font-semibold` (stat values)
- **Body**: `text-sm` (descriptions)

## Navigation

### Next.js Link Component
```typescript
import Link from 'next/link'

<Link href={module.href} className="...">
  {/* Card content */}
</Link>
```

### Routes
- **Health Check**: `/admin/monitoring/health`
- **Metrics**: `/admin/monitoring/metrics`
- **Overview** (current): `/admin/monitoring`

### Link Behavior
- Client-side navigation (Next.js router)
- No full page reload
- Preserves scroll position
- Prefetching on hover (default Next.js behavior)

## Icon Usage

### Icons & Meanings
- **Activity**: General activity/status indicator
- **Heart**: Health check (medical association)
- **BarChart3**: Metrics/analytics dashboard
- **Server**: System status
- **Database**: Database service
- **Zap**: Redis cache (speed association)
- **Loader2**: Loading spinner

### Icon Sizing
- **Quick Stats**: `w-5 h-5` (20px)
- **Module Cards**: `w-8 h-8` (32px)
- **Loading**: `w-8 h-8` (32px)
- **Banner**: `w-5 h-5` (20px)

### Icon Colors
- **Green**: Healthy status
- **Red**: Unhealthy status
- **Blue**: Information/neutral
- **Yellow**: Cache/Redis

## Hydration Safety

### Mounted State Pattern
```typescript
const [mounted, setMounted] = useState(false)

useEffect(() => {
  setMounted(true)
}, [])

// Prevents hydration mismatch
// Query only enabled after client-side mount
```

### Why It's Needed
- Next.js does server-side rendering (SSR)
- `useQuery` runs immediately, causing fetch on server
- `enabled: mounted` defers fetch until client mount
- Prevents "text content does not match" errors

## Error Handling

### Current Implementation
- No explicit error state UI
- Default React Query error behavior
- Query will retry automatically (default: 3 attempts)

### Recommended Enhancement
```typescript
const { data, isLoading, error } = useQuery({...})

if (error) {
  return (
    <div className="bg-red-50 border border-red-200 rounded-lg p-6">
      <p className="text-red-600">无法加载监控数据</p>
      <p className="text-sm text-red-500 mt-2">{error.message}</p>
    </div>
  )
}
```

## Accessibility

### Semantic HTML
- Proper heading hierarchy (h1, h2, h3)
- Link elements for navigation (not buttons)
- Meaningful link text (titles + descriptions)

### Focus Indicators
- Hover effects on cards
- Focus rings would be added by browser default on links
- Color contrast meets WCAG standards

### Screen Reader Support
- Icon meanings reinforced by text labels
- Status indicators use text + icon (not color alone)
- Timestamp announced in info banner

## Performance Considerations

### Query Optimization
- 10-second refresh balances freshness vs. load
- Query key `['health-check', 'overview']` enables cache management
- Background refetch doesn't block UI
- Stale-while-revalidate strategy

### Network Efficiency
- Single endpoint fetches all health data
- No parallel requests
- Small JSON payload size
- Automatic retry on failure

### Client-Side Computation
- Quick stats derived from `healthData` (no extra fetch)
- No heavy calculations
- Minimal re-renders due to stable data structure

## Future Enhancements
- Alert/notification center integration
- Historical health trends sparkline
- Custom refresh interval selector
- Add more monitoring module cards (logs, traces, alerts)
- Drag-and-drop dashboard customization
- WebSocket support for real-time updates
- Export health report as PDF
- Service dependency graph visualization
- Multi-region/cluster monitoring support
- Performance budgets/thresholds configuration

## Integration Points
- **Health Check Page**: Detailed service status at `/admin/monitoring/health`
- **Metrics Page**: Prometheus metrics at `/admin/monitoring/metrics`
- **Backend API**: `/health/detailed` endpoint
- **Shared Types**: `DetailedHealthStatus` from `@/lib/types/backend`
- **Admin Layout**: Uses shared admin layout wrapper

## Testing Considerations
- Mock `useQuery` for unit tests
- Test mounted state prevents SSR fetch
- Verify quick stats render with various health states
- Test navigation links route correctly
- Validate timestamp formatting
- Simulate loading and error states
- Test responsive grid layouts
- Verify dark mode styles apply correctly

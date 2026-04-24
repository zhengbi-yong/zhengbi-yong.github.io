# Analytics Dashboard Page

## Module Overview
**Path**: `frontend/src/app/admin/analytics/page.tsx`
**Layer**: 3 (Leaf Component)
**Type**: Client Component - Data Visualization Dashboard

Admin analytics dashboard displaying user growth trends, comment activity patterns, and content engagement metrics with interactive charts and date range filtering.

## Purpose
Provides administrators with comprehensive insights into platform growth and user engagement through visual analytics. Enables data-driven decision making for content strategy and community management.

## Core Responsibilities

### Data Aggregation & Visualization
- Fetch aggregate statistics from backend `/admin/stats` endpoint
- Retrieve user growth trends via `/admin/user-growth` API
- Fetch comment data for activity analysis
- Transform raw data into chart-friendly formats

### Interactive Dashboard Components
- **Date Range Selector**: 7/14/30/90 day views
- **Stat Cards**: Key metrics with trend indicators (up/down)
- **User Growth Chart**: Line chart showing new vs cumulative users
- **Comment Activity Chart**: Stacked bar chart by status (approved/pending/rejected)

### Real-Time Data Refresh
- 5-minute cache interval for all queries
- Automatic cache invalidation on data updates
- Loading states during data fetch

## Technical Implementation

### Data Fetching Strategy
```typescript
// 1. Aggregate Statistics
const queryResult = useList({
  resource: 'admin/stats',
})

// 2. User Growth Data (custom endpoint)
const userGrowthQuery = useCustom({
  url: '/admin/user-growth',
  method: 'get',
  queryOptions: {
    staleTime: 5 * 60 * 1000, // 5min cache
  },
})

// 3. Comment Data (for activity chart)
const commentsQueryResult = useList({
  resource: 'admin/comments',
  pagination: { current: 1, pageSize: 1000 },
  queryOptions: {
    staleTime: 5 * 60 * 1000,
  },
})
```

### Data Transformation Pipeline

#### User Growth Data
```typescript
const userGrowthData = useMemo(() => {
  if (!userGrowthResponse?.data) return []

  return userGrowthResponse.data.map((item) => ({
    date: format(new Date(item.date), 'MM-dd'),
    新增用户: item.new_users,
    累计用户: item.cumulative_users,
  }))
}, [userGrowthResponse])
```

#### Comment Activity Data
```typescript
const commentActivityData = useMemo(() => {
  // Initialize date range buckets
  const groupedByDate = {}
  for (let i = daysRange - 1; i >= 0; i--) {
    const date = format(startOfDay(subDays(new Date(), i)), 'MM-dd')
    groupedByDate[date] = { approved: 0, pending: 0, rejected: 0 }
  }

  // Aggregate comments by date and status
  comments.forEach((comment) => {
    const date = format(new Date(comment.created_at), 'MM-dd')
    if (groupedByDate[date]) {
      if (comment.status === 'approved') groupedByDate[date].approved++
      else if (comment.status === 'pending') groupedByDate[date].pending++
      else if (comment.status === 'rejected') groupedByDate[date].rejected++
    }
  })

  return Object.entries(groupedByDate).map(([date, counts]) => ({
    date,
    已通过: counts.approved,
    待审核: counts.pending,
    已拒绝: counts.rejected,
  }))
}, [daysRange, commentsData])
```

### State Management
```typescript
const [daysRange, setDaysRange] = useState(30)
// Controls chart x-axis range
// Triggers commentActivityData recalculation
```

## Dependencies

### React & Query
```typescript
import { useState, useMemo } from 'react'
import { useList, useCustom } from '@refinedev/core'
```

### Data Visualization
```typescript
import {
  LineChart, Line,
  BarChart, Bar,
  XAxis, YAxis,
  CartesianGrid,
  Tooltip, Legend,
  ResponsiveContainer
} from 'recharts'
```

### Date Utilities
```typescript
import { format, subDays, startOfDay } from 'date-fns'
```

### UI Components
```typescript
import { Loader2 } from 'lucide-react'
```

## Component Structure

```
AnalyticsPage
├── Header
│   ├── Title ("数据分析")
│   ├── Subtitle ("全面了解用户活跃度和内容表现")
│   └── Date range selector (7/14/30/90 days)
├── Loading State (spinner)
├── Stats Overview Grid (4 StatCard components)
│   ├── Total Users (总用户数)
│   ├── Total Comments (总评论数)
│   ├── Pending Comments (待审核评论)
│   └── Approved Comments (已通过评论)
├── Charts Grid (2 columns)
│   ├── User Growth Chart (LineChart)
│   │   ├── 新增用户 line (blue)
│   │   └── 累计用户 line (green)
│   └── Comment Activity Chart (BarChart)
│       ├── 已通过 bar (green)
│       ├── 待审核 bar (yellow)
│       └── 已拒绝 bar (red)
└── Data Summary Info Box

StatCard (subcomponent)
├── Title label
├── Value (large number)
├── Change percentage (trend indicator)
└── Icon with color coding

TrendingIcon (subcomponent)
└── SVG arrow (up for positive, down for negative)
```

## Data Structures

### Aggregate Statistics
```typescript
interface AggregateStats {
  total_users: number
  total_comments: number
  pending_comments: number
  approved_comments: number
}
```

### User Growth Data
```typescript
interface UserGrowthItem {
  date: string           // ISO 8601 date
  new_users: number      // New users on this date
  cumulative_users: number  // Total users to date
}
```

### Comment Data
```typescript
interface Comment {
  id: string
  content: string
  status: 'pending' | 'approved' | 'rejected' | 'spam'
  created_at: string     // ISO 8601 timestamp
  username?: string
  slug: string          // Post slug
}
```

## Chart Configurations

### User Growth Line Chart
```typescript
<LineChart data={userGrowthData}>
  <CartesianGrid strokeDasharray="3 3" />
  <XAxis dataKey="date" />
  <YAxis />
  <Tooltip contentStyle={{
    backgroundColor: 'rgb(31 41 55)',
    border: '1px solid rgb(55 65 81)',
    borderRadius: '0.5rem',
  }} />
  <Legend />
  <Line
    type="monotone"
    dataKey="新增用户"
    stroke="#3b82f6"
    strokeWidth={2}
  />
  <Line
    type="monotone"
    dataKey="累计用户"
    stroke="#10b981"
    strokeWidth={2}
  />
</LineChart>
```

**Chart Type**: Dual-line chart
**X-Axis**: Date (MM-DD format)
**Y-Axis**: User count
**Lines**:
- Blue (#3b82f6): Daily new users
- Green (#10b981): Cumulative users
**Smoothing**: Monotone interpolation

### Comment Activity Bar Chart
```typescript
<BarChart data={commentActivityData}>
  <CartesianGrid strokeDasharray="3 3" />
  <XAxis dataKey="date" />
  <YAxis />
  <Tooltip contentStyle={{
    backgroundColor: 'rgb(31 41 55)',
    border: '1px solid rgb(55 65 81)',
    borderRadius: '0.5rem',
  }} />
  <Legend />
  <Bar dataKey="已通过" stackId="a" fill="#10b981" />
  <Bar dataKey="待审核" stackId="a" fill="#f59e0b" />
  <Bar dataKey="已拒绝" stackId="a" fill="#ef4444" />
</LineChart>
```

**Chart Type**: Stacked bar chart
**X-Axis**: Date (MM-DD format)
**Y-Axis**: Comment count
**Stacks**:
- Green (#10b981): Approved comments
- Yellow (#f59e0b): Pending comments
- Red (#ef4444): Rejected comments
**Stack ID**: 'a' (enables stacking)

## Stat Card Implementation

### Props Interface
```typescript
interface StatCardProps {
  title: string      // Metric label
  value: number      // Current value
  change: string     // Percentage change (e.g., "+12%")
  trend: 'up' | 'down'
  color?: 'blue' | 'green' | 'yellow'
}
```

### Color Mapping
```typescript
const colorClasses = {
  blue: 'bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400',
  green: 'bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400',
  yellow: 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400',
}

const trendColor = trend === 'up' ? 'text-green-600' : 'text-red-600'
```

### Visual Layout
```
┌─────────────────────────────┐
│ [Icon]         [TrendingIcon]│
│                             │
│ Title              Value    │
│ Change (vs 上期)             │
└─────────────────────────────┘
```

## Date Range Selector

### Options
- **7天**: Last 7 days
- **14天**: Last 14 days
- **30天**: Last 30 days (default)
- **90天**: Last 90 days

### Impact
- Affects `daysRange` state
- Triggers `commentActivityData` recalculation
- Changes x-axis range on charts
- Does NOT affect user growth chart (shows all available data)

### Styling
```typescript
<select className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white">
```

## Loading States

### Unified Loading Check
```typescript
if (statsLoading || userGrowthLoading || commentsLoading) {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <Loader2 className="w-8 h-8 animate-spin text-blue-600 dark:text-blue-400" />
      <p className="text-gray-600 dark:text-gray-400">加载数据中...</p>
    </div>
  )
}
```

### Behavior
- Shows spinner if ANY query is loading
- Minimum height: 400px for consistent layout
- Dark mode support with `dark:` variants
- Centered with flexbox

## API Integration

### Endpoints

#### 1. Aggregate Statistics
```
GET /admin/stats
```
**Response**:
```json
{
  "total_users": 1250,
  "total_comments": 4500,
  "pending_comments": 125,
  "approved_comments": 3200
}
```

#### 2. User Growth
```
GET /admin/user-growth
```
**Response**:
```json
{
  "data": [
    {
      "date": "2025-01-01",
      "new_users": 45,
      "cumulative_users": 1200
    },
    {
      "date": "2025-01-02",
      "new_users": 50,
      "cumulative_users": 1250
    }
  ]
}
```

#### 3. Comments List
```
GET /admin/comments
```
**Query Params**: `pageSize=1000` (fetch all for aggregation)
**Response**:
```json
{
  "data": [
    {
      "id": "123",
      "content": "Great post!",
      "status": "approved",
      "created_at": "2025-01-03T10:30:00Z",
      "username": "user123",
      "slug": "post-slug"
    }
  ],
  "total": 4500
}
```

## Styling

### Color Scheme
- **Primary**: Blue (user growth, headers)
- **Success**: Green (approved comments, positive trends)
- **Warning**: Yellow (pending comments)
- **Error**: Red (rejected comments, negative trends)
- **Background**: White/Gray (cards, containers)

### Dark Mode
- All color classes include `dark:` variants
- Backgrounds: `dark:bg-gray-800`
- Borders: `dark:border-gray-700`
- Text: `dark:text-white`, `dark:text-gray-400`

### Responsive Design
- **Stats Grid**: 1 → 2 → 4 columns (`grid-cols-1 sm:grid-cols-2 lg:grid-cols-4`)
- **Charts Grid**: 1 → 2 columns (`grid-cols-1 lg:grid-cols-2`)
- **Spacing**: Consistent `gap-4` (stats), `gap-6` (charts)
- **Padding**: `p-6` for card content

### Typography
- **Headers**: `text-3xl font-bold` (h1), `text-lg font-semibold` (h3)
- **Labels**: `text-sm font-medium` (card titles)
- **Values**: `text-2xl font-bold` (stat card values)
- **Body**: `text-sm` (info text)

## Date Formatting

### Chart Labels
```typescript
format(new Date(item.date), 'MM-dd')
// Result: "01-03" for January 3rd
```

### Comment Grouping
```typescript
format(startOfDay(subDays(new Date(), i)), 'MM-dd')
// Normalizes timestamps to day boundaries
// Example: "2025-01-03T14:30:00Z" → "01-03"
```

### Locale
- Chinese locale implicit in format patterns
- Short date format for compact axis labels
- Full timestamps in data, truncated for display

## Tooltip Styling

### Configuration
```typescript
<Tooltip contentStyle={{
  backgroundColor: 'rgb(31 41 55)',    // Gray-900
  border: '1px solid rgb(55 65 81)',  // Gray-700
  borderRadius: '0.5rem',             // 8px corners
}} />
```

### Behavior
- Default tooltip provided by Recharts
- Hover over data points shows values
- Legend shows line/bar color mapping
- Responsive to mouse position

## Performance Optimizations

### Memoization
```typescript
const userGrowthData = useMemo(() => { ... }, [userGrowthResponse])
const commentActivityData = useMemo(() => { ... }, [daysRange, commentsData])
```
- Prevents unnecessary recalculations
- Only recomputes when dependencies change
- Critical for comment activity (O(n) grouping operation)

### Query Caching
```typescript
queryOptions: {
  staleTime: 5 * 60 * 1000, // 5 minutes
}
```
- Reduces backend load
- Improves perceived performance
- Cache invalidates on manual refresh or mutation

### Data Fetching Strategy
- Single query for all comments (pageSize: 1000)
- Client-side aggregation for activity chart
- Avoids multiple API calls for different date ranges

## Accessibility

### Icon Usage
- **Loader2**: Loading spinner (blue)
- **TrendingIcon**: Trend indicators (green up / red down)

### Semantic HTML
- Proper heading hierarchy (h1, h3)
- Select elements with accessible labels
- Color contrast meets WCAG standards

### Loading Feedback
- Text description alongside spinner ("加载数据中...")
- Minimum height prevents layout shift
- Consistent loading pattern across queries

## Data Summary Section

### Content
```typescript
<div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
  <h3>数据说明</h3>
  <p>
    以上数据基于最近{daysRange}天的统计信息。用户增长趋势显示每日新增用户数量，
    评论活跃度展示各状态评论的分布情况。数据每5分钟自动刷新一次。
  </p>
</div>
```

### Purpose
- Explains data source and time range
- Sets expectations about refresh frequency
- Provides context for interpreting metrics

## Error Handling

### Current Implementation
- No explicit error handling UI
- Default Refine error behavior applies
- Consider adding error boundaries for production

### Recommended Enhancement
```typescript
if (statsError || userGrowthError || commentsError) {
  return <ErrorBanner message="Failed to load analytics data" />
}
```

## Future Enhancements
- Export analytics as CSV/PDF
- Custom date range picker (date inputs)
- Compare multiple time ranges
- Heat map for comment activity by hour
- Cohort analysis for user retention
- Real-time WebSocket updates for live stats
- Drill-down into individual post performance
- Predictive analytics (ML-based forecasting)
- Alerts for unusual activity patterns
- Goal tracking vs targets

## Integration Points
- **Admin Layout**: Uses shared admin layout
- **Refine Provider**: Requires `<Refine>` wrapper
- **Backend API**: Depends on `/admin/stats` and `/admin/user-growth` endpoints
- **Authentication**: Requires admin role (enforced at backend/API level)

## Testing Considerations
- Mock Refine hooks (`useList`, `useCustom`) in unit tests
- Test useMemo recalculations with varying inputs
- Verify chart rendering with empty data
- Test date range switching behavior
- Validate date formatting for edge cases (leap years, month boundaries)

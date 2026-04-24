# Posts Management Page

## Module Overview
**Path**: `frontend/src/app/admin/posts/page.tsx`
**Layer**: 3 (Leaf Component)
**Type**: Client Component - Admin Content Management Interface

Administrative interface for managing blog posts, displaying comprehensive post listings with engagement metrics, search functionality, and pagination. Provides quick access to post details and public preview.

## Purpose
Enables content administrators to view, search, and manage all blog posts from a centralized dashboard. Provides at-a-glance engagement metrics (views, likes, comments) and quick access to detailed analytics.

## Core Responsibilities

### Data Fetching & Display
- Fetch paginated posts list via Refine's `useList` hook
- Display engagement metrics (views, likes, comments) per post
- Show last updated timestamp for each post
- Support infinite pagination with 20 posts per page

### Search & Filtering
- Real-time search by post slug
- Client-side filtering (no additional API calls)
- Instant feedback as user types

### Navigation & Actions
- Link to post detail page (`/admin/posts/show/[slug]`)
- Open post in public view (new tab)
- Quick preview without leaving admin interface

### Debug Mode (Development)
- Display Refine query state in development
- Show data structure and counts
- Assist with troubleshooting data fetching issues

## Technical Implementation

### Data Fetching
```typescript
const queryResult = useList({
  resource: 'admin/posts',
  pagination: {
    current: page,
    pageSize: 20,
  },
})

// Refine v5 structure
const query = queryResult.query      // { isPending, isError, error }
const result = queryResult.result    // { data, total }
const data = result?.data
const total = result?.total || 0
const isLoading = query?.isPending
const error = query?.isError ? query.error : undefined
```

### State Management
```typescript
const [page, setPage] = useState(1)
const [pageSize] = useState(20)
const [searchQuery, setSearchQuery] = useState('')

// Invalidate helper (for manual refresh)
const invalidate = useInvalidate()
```

### Client-Side Filtering
```typescript
const filteredPosts = posts.filter((post) => {
  return searchQuery === '' || post.slug.toLowerCase().includes(searchQuery.toLowerCase())
})
```

**Search Scope**: Post slug only (case-insensitive)

## Dependencies

### React & Routing
```typescript
import { useState } from 'react'
import Link from 'next/link'
```

### Refine Hooks
```typescript
import { useList, useInvalidate } from '@refinedev/core'
```

### UI Components
```typescript
import { Search, Eye, Heart, MessageSquare, FileText, Loader2 } from 'lucide-react'
```

### Utilities
```typescript
import { logger } from '@/lib/utils/logger'
```

## Component Structure

```
PostsListPage
├── Debug Info (development only)
│   └── JSON dump of query state
├── Header
│   ├── Title ("文章管理")
│   └── Total count display
├── Search Bar
│   └── Search input with icon
├── Posts Table
│   ├── Header Row
│   │   ├── Slug column
│   │   ├── Stats column (views, likes, comments)
│   │   ├── Updated column
│   │   └── Actions column
│   └── Data Rows
│       ├── Icon + Slug
│       ├── Stats icons + counts
│       ├── Updated timestamp
│       └── Action links (详情, 预览)
├── Summary Cards (3 columns)
│   ├── Total Posts
│   ├── Total Views
│   └── Total Interactions (likes + comments)
├── Loading State (spinner)
└── Error State (error banner)
```

## Data Structures

### Post Interface
```typescript
interface Post {
  slug: string              // Unique identifier (URL-friendly)
  view_count: number       // Total page views
  like_count: number       // Total likes received
  comment_count: number    // Total comments
  updated_at: string       // ISO 8601 timestamp
}
```

### DebugInfo (Development)
```typescript
interface DebugInfo {
  isLoading: boolean
  hasData: boolean
  dataType: string
  dataKeys: string[]
  postsCount: number
  total: number
  firstPost: Post | null
}
```

## Table Structure

### Table Header
```typescript
<thead className="bg-gray-50 dark:bg-gray-700">
  <tr>
    <th>文章 Slug</th>
    <th>统计</th>
    <th>更新时间</th>
    <th className="text-right">操作</th>
  </tr>
</thead>
```

### Table Row
```typescript
<tr className="hover:bg-gray-50 dark:hover:bg-gray-700">
  <td>
    <div className="flex items-start space-x-3">
      <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
        <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
      </div>
      <p className="text-sm font-medium text-gray-900 dark:text-white">
        {post.slug}
      </p>
    </div>
  </td>
  <td>
    <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
      <div className="flex items-center space-x-1">
        <Eye className="w-4 h-4" />
        <span>{post.view_count}</span>
      </div>
      <div className="flex items-center space-x-1">
        <Heart className="w-4 h-4" />
        <span>{post.like_count}</span>
      </div>
      <div className="flex items-center space-x-1">
        <MessageSquare className="w-4 h-4" />
        <span>{post.comment_count}</span>
      </div>
    </div>
  </td>
  <td>
    {new Date(post.updated_at).toLocaleDateString('zh-CN')}
  </td>
  <td className="text-right space-x-2">
    <Link href={`/admin/posts/show/${encodeURIComponent(post.slug)}`}>
      详情
    </Link>
    <Link href={`/posts/${post.slug}`} target="_blank">
      预览
    </Link>
  </td>
</tr>
```

### Empty State
```typescript
{filteredPosts.length === 0 && (
  <tr>
    <td colSpan={4} className="text-center text-gray-500 dark:text-gray-400">
      {searchQuery ? '没有找到匹配的文章' : '暂无文章'}
    </td>
  </tr>
)}
```

## Summary Cards

### Card Layout
```typescript
<div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
  {/* Total Posts */}
  <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
    <p className="text-sm text-gray-600 dark:text-gray-400">总文章数</p>
    <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
      {total}
    </p>
  </div>

  {/* Total Views */}
  <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
    <p className="text-sm text-gray-600 dark:text-gray-400">总浏览量</p>
    <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
      {posts.reduce((sum, p) => sum + (p.view_count || 0), 0).toLocaleString()}
    </p>
  </div>

  {/* Total Interactions */}
  <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
    <p className="text-sm text-gray-600 dark:text-gray-400">总互动数</p>
    <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
      {posts.reduce((sum, p) => sum + (p.like_count || 0) + (p.comment_count || 0), 0).toLocaleString()}
    </p>
  </div>
</div>
```

### Calculation Logic
```typescript
// Total Views
posts.reduce((sum, p) => sum + (p.view_count || 0), 0).toLocaleString()

// Total Interactions (likes + comments)
posts.reduce((sum, p) => sum + (p.like_count || 0) + (p.comment_count || 0), 0).toLocaleString()
```

### Number Formatting
- Uses `toLocaleString()` for thousand separators
- **Example**: `1234` → `"1,234"`
- Handles undefined values with `|| 0` fallback

## Search Functionality

### Search Input
```typescript
<div className="relative">
  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
  <input
    type="text"
    placeholder="搜索文章 slug..."
    value={searchQuery}
    onChange={(e) => setSearchQuery(e.target.value)}
    className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
  />
</div>
```

### Search Behavior
- **Real-time**: Filters as you type
- **Case-insensitive**: Lowercases both query and slug
- **Slug-only**: Searches post slug field only
- **Client-side**: No API call triggered

## Debug Mode (Development)

### Debug Info Display
```typescript
{process.env.NODE_ENV === 'development' && (
  <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
    <h3 className="font-bold text-yellow-800 dark:text-yellow-400 mb-2">调试信息</h3>
    <pre className="text-xs overflow-auto">
      {JSON.stringify(debugInfo, null, 2)}
    </pre>
  </div>
)}
```

### DebugInfo Object
```typescript
const debugInfo = {
  isLoading,
  hasData: !!data,
  dataType: data ? typeof data : 'no data',
  dataKeys: data ? Object.keys(data) : [],
  postsCount: posts.length,
  total,
  firstPost: posts[0] || null,
}
```

### Purpose
- Visualize Refine query state
- Troubleshoot data fetching issues
- Inspect data structure during development
- Hidden in production (`NODE_ENV !== 'development'`)

## Loading & Error States

### Loading State
```typescript
if (isLoading) {
  return (
    <div className="flex items-center justify-center p-12">
      <Loader2 className="w-8 h-8 animate-spin text-blue-600 dark:text-blue-400" />
    </div>
  )
}
```

### Error State
```typescript
if (error) {
  return (
    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
      <p className="text-red-600 dark:text-red-400">加载文章列表失败</p>
    </div>
  )
}
```

## Navigation Links

### Detail Link
```typescript
<Link href={`/admin/posts/show/${encodeURIComponent(post.slug)}`}>
  详情
</Link>
```
- **Route**: `/admin/posts/show/[slug]`
- **Encoding**: `encodeURIComponent()` handles special characters
- **Behavior**: Client-side navigation (Next.js router)
- **Purpose**: View detailed analytics and comments

### Preview Link
```typescript
<Link href={`/posts/${post.slug}`} target="_blank">
  预览
</Link>
```
- **Route**: `/posts/[slug]` (public post page)
- **Target**: `_blank` (opens in new tab)
- **Purpose**: View post as visitors see it

## Timestamp Formatting

### Updated At Display
```typescript
new Date(post.updated_at).toLocaleDateString('zh-CN')
```

**Format**: `YYYY/M/D` (e.g., "2025/1/3")
**Locale**: Chinese (`zh-CN`)
**Date Only**: No time component shown

### ISO 8601 Input
```typescript
updated_at: "2025-01-03T10:30:00Z"  // UTC timestamp
```

## Styling

### Color Scheme
- **Primary**: Blue (slug icons, detail links)
- **Success**: Green (preview links)
- **Stats**: Gray (icons, labels)
- **Borders**: Gray (table borders, input borders)
- **Background**: White/Gray (cards, containers)

### Dark Mode
- All color classes include `dark:` variants
- Backgrounds: `dark:bg-gray-800`, `dark:bg-gray-700`
- Borders: `dark:border-gray-600`, `dark:border-gray-700`
- Text: `dark:text-white`, `dark:text-gray-300`, `dark:text-gray-400`
- Icon Backgrounds: `dark:bg-blue-900/20` (semi-transparent overlays)

### Responsive Design
- **Summary Cards**: 1 → 3 columns (`grid-cols-1 sm:grid-cols-3`)
- **Table**: Full width with horizontal scroll on mobile
- **Search Bar**: Full width on all screens
- **Spacing**: `gap-4` (cards), `space-y-6` (sections)

### Typography
- **Headers**: `text-3xl font-bold` (h1)
- **Table Headers**: `text-xs font-medium uppercase`
- **Table Cells**: `text-sm` (slug, stats, dates)
- **Card Labels**: `text-sm` (gray)
- **Card Values**: `text-2xl font-bold` (white)

## Icon Usage

### Icons & Meanings
- **FileText**: Post/article representation
- **Eye**: View count metric
- **Heart**: Like count metric
- **MessageSquare**: Comment count metric
- **Search**: Search input indicator
- **Loader2**: Loading spinner

### Icon Sizing
- **Slug Icon**: `w-5 h-5` (20px)
- **Stat Icons**: `w-4 h-4` (16px)
- **Search Icon**: `w-5 h-5` (20px)
- **Loading Icon**: `w-8 h-8` (32px)

### Icon Colors
- **Blue**: Post icon (brand color)
- **Gray**: Stat icons (neutral)
- **Blue (Dark)**: Stat icons in dark mode (`text-blue-400`)

## API Integration

### Endpoint
```
GET /admin/posts?page=1&pageSize=20
```

### Query Parameters
- `page`: Page number (1-based, default: 1)
- `pageSize`: Items per page (default: 20)

### Response Structure
```json
{
  "data": [
    {
      "slug": "my-first-blog-post",
      "view_count": 1234,
      "like_count": 56,
      "comment_count": 23,
      "updated_at": "2025-01-03T10:30:00Z"
    }
  ],
  "total": 125
}
```

## Logger Usage

### Debug Logging
```typescript
logger.debug('[PostsPage] Component rendering, page:', page)
logger.debug('[PostsPage] useList returned:', {...})
logger.debug('=== Posts Debug Start ===')
logger.debug('isLoading:', isLoading)
logger.debug('data:', data)
logger.debug('=== Posts Debug End ===')
```

### Purpose
- Track component re-renders
- Inspect Refine query state
- Debug data fetching issues
- Monitor pagination behavior

### Log Levels
- `logger.debug`: Development debugging only
- Not logged in production (assuming log level filtering)

## Pagination (Future)

### Current State
- Page state managed: `const [page, setPage] = useState(1)`
- Passed to `useList` hook
- Pagination UI not yet implemented

### Future Implementation
```typescript
// Add pagination controls below table
<div>
  <button onClick={() => setPage(page - 1)} disabled={page === 1}>
    上一页
  </button>
  <span>第 {page} 页</span>
  <button onClick={() => setPage(page + 1)} disabled={page === totalPages}>
    下一页
  </button>
</div>
```

## Performance Considerations

### Client-Side Filtering
- Search operates on already-fetched page data
- No additional API calls for filtering
- Efficient for small page sizes (20 items)

### Refine Query Optimization
- Automatic caching of fetched data
- Background refetch on stale data
- Deduplication of identical queries
- Optimistic updates for mutations

### Reduce Operations
```typescript
// Summary cards use reduce for aggregations
posts.reduce((sum, p) => sum + (p.view_count || 0), 0)
```
- O(n) complexity
- Single pass through data array
- Minimal overhead for 20 items

## Accessibility

### Semantic HTML
- `<table>`, `<thead>`, `<tbody>` for tabular data
- `<th>` with `scope` attribute (implicit)
- Button elements would be better than divs for actions

### Keyboard Navigation
- Tab order: Search → Table rows → Links
- Enter/Space to activate links
- Visible focus indicators (browser default)

### Screen Reader Support
- Stat icons have text labels ("浏览量", "点赞数", "评论数")
- Search input has placeholder text
- Link text is descriptive ("详情", "预览")

## Error Handling

### Query Errors
```typescript
const error = query?.isError ? query.error : undefined

if (error) {
  return <ErrorBanner message="加载文章列表失败" />
}
```

### Network Failures
- Refine's automatic retry (default: 3 attempts)
- Error boundary catches React errors
- User-friendly error message displayed

### Data Validation
- Fallback to `0` for undefined counts (`view_count || 0`)
- `posts || []` prevents null reference errors
- `encodeURIComponent()` prevents URL injection

## Future Enhancements
- Implement pagination controls UI
- Add filtering by date range
- Sort by views/likes/comments (clickable headers)
- Bulk actions (delete, unpublish, feature)
- Post status indicators (published/draft)
- Quick edit modal for slug/metadata
- Export posts data as CSV
- Advanced search (content, tags, author)
- Infinite scroll alternative to pagination
- Post thumbnail preview in table
- Quick actions dropdown (edit, delete, duplicate)
- Performance comparison charts (posts side-by-side)
- A/B test indicators for posts

## Integration Points
- **Post Detail Page**: `/admin/posts/show/[slug]`
- **Public Post Page**: `/posts/[slug]`
- **Backend API**: `/admin/posts` endpoint
- **Refine Provider**: Requires `<Refine>` wrapper
- **Admin Layout**: Uses shared admin layout
- **Logger**: Shared logging utility

## Testing Considerations
- Mock Refine's `useList` hook
- Test search with various slug patterns
- Verify summary card calculations
- Test navigation links route correctly
- Simulate loading and error states
- Validate timestamp formatting
- Test responsive table layout
- Verify dark mode styles
- Test with empty data set
- Validate slug encoding for special characters

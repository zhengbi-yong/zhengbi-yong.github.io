# Comment Management Page

## Module Overview
**Path**: `frontend/src/app/admin/comments/page.tsx`
**Layer**: 3 (Leaf Component)
**Type**: Client Component - Admin CRUD Interface

Comprehensive comment moderation interface with batch operations, advanced filtering, search functionality, and pagination. Enables efficient management of user-generated content at scale.

## Purpose
Provides administrators with tools to review, approve, reject, and manage user comments. Supports bulk operations for efficient moderation workflows and search/filter capabilities for content discovery.

## Core Responsibilities

### Data Fetching & Management
- Fetch paginated comments via Refine's `useList` hook
- Filter by status (all/pending/approved/rejected/spam)
- Search across comment content, username, and post slug
- Cache optimization with 5-minute stale time

### Comment Moderation
- **Individual Actions**: Change status, delete comment
- **Batch Operations**: Multi-select with bulk status update/delete
- **Status Workflow**: pending → approved/rejected/spam
- Optimistic updates for instant feedback

### User Interface
- **Pagination**: 20 comments per page
- **Select All**: Toggle all comments on current page
- **Batch Actions Bar**: Appears when comments selected
- **Responsive Table**: Adapts to mobile/desktop

## Technical Implementation

### Data Fetching
```typescript
const queryResult = useList({
  resource: 'admin/comments',
  pagination: {
    current: page,
    pageSize: 20,
  },
  filters: statusFilter !== 'all' ? [{
    field: 'status',
    operator: 'eq',
    value: statusFilter
  }] : [],
})

// Refine v5 structure
const query = queryResult.query      // { isPending, isError, error }
const result = queryResult.result    // { data, total }
const data = result?.data
const total = result?.total || 0
const isLoading = query?.isPending
```

### Mutation Hooks
```typescript
const updateMutation = useUpdate()
const deleteMutation = useDelete()
const invalidate = useInvalidate()

// Update comment status
await updateMutation.mutateAsync({
  resource: 'admin/comments',
  id: commentId,
  values: { status: newStatus },
})

// Delete comment
await deleteMutation.mutateAsync({
  resource: 'admin/comments',
  id: commentId,
})
```

### Batch Operations (Parallel Execution)
```typescript
// Disable auto-refresh for performance
await Promise.all(
  Array.from(selectedComments).map((commentId) =>
    updateMutation.mutateAsync({
      resource: 'admin/comments',
      id: commentId,
      values: { status },
      meta: {
        invalidates: [], // Prevent individual refreshes
      },
    })
  )
)
// Single refresh after all mutations complete
invalidate({
  resource: 'admin/comments',
  invalidates: ['list'],
})
```

## Dependencies

### React & State
```typescript
import { useState } from 'react'
```

### Refine Hooks
```typescript
import {
  useList,        // Data fetching
  useUpdate,      // Status updates
  useDelete,      // Deletion
  useInvalidate   // Cache invalidation
} from '@refinedev/core'
```

### UI Components
```typescript
import { Loader2, Search, Filter, Trash2 } from 'lucide-react'
```

### Utilities
```typescript
import { logger } from '@/lib/utils/logger'
```

## Component Structure

```
CommentManagementPage
├── Header
│   ├── Title ("评论审核")
│   └── Total count display
├── Filters & Actions Bar
│   ├── Search Input (content/username/slug)
│   ├── Status Filter Dropdown
│   └── Batch Actions (when items selected)
│       ├── Selection count
│       ├── Batch status update selector
│       └── Batch delete button
├── Comment Table
│   ├── Header Row
│   │   ├── Select all checkbox
│   │   ├── Content column
│   │   ├── User column
│   │   ├── Post column
│   │   ├── Status column
│   │   ├── Created at column
│   │   └── Actions column
│   └── Data Rows (loop through filteredComments)
│       ├── Checkbox
│       ├── Content (truncated)
│       ├── Username
│       ├── Post slug
│       ├── Status badge
│       ├── Timestamp
│       └── Actions (status dropdown + delete button)
├── Pagination Controls
│   ├── Previous button
│   ├── Page numbers
│   └── Next button
└── Loading/Error States
```

## State Management

### Local State
```typescript
const [page, setPage] = useState(1)                        // Current page
const [pageSize] = useState(20)                            // Fixed page size
const [selectedComments, setSelectedComments] = useState<Set<string>>(new Set())
const [statusFilter, setStatusFilter] = useState<CommentStatus>('all')
const [searchQuery, setSearchQuery] = useState('')
```

### Selection State Pattern
```typescript
// Toggle single item
const toggleCommentSelection = (commentId: string) => {
  const newSelected = new Set(selectedComments)
  if (newSelected.has(commentId)) {
    newSelected.delete(commentId)
  } else {
    newSelected.add(commentId)
  }
  setSelectedComments(newSelected)
}

// Toggle all on page
const toggleSelectAll = () => {
  if (selectedComments.size === filteredComments.length) {
    setSelectedComments(new Set())
  } else {
    setSelectedComments(new Set(filteredComments.map((c) => String(c.id))))
  }
}
```

### Filter Reset
```typescript
onChange={(e) => {
  setStatusFilter(e.target.value as CommentStatus)
  setPage(1) // Reset to first page when filter changes
}}
```

## Data Structures

### Comment Interface
```typescript
interface Comment {
  id: string
  content: string
  username?: string
  slug: string              // Post slug
  status: 'pending' | 'approved' | 'rejected' | 'spam'
  created_at: string        // ISO 8601 timestamp
}
```

### CommentStatus Type
```typescript
type CommentStatus = 'pending' | 'approved' | 'rejected' | 'spam' | 'all'
```

### Status Labels & Colors
```typescript
const statusLabels: Record<string, string> = {
  pending: '待审核',
  approved: '已通过',
  rejected: '已拒绝',
  spam: '垃圾评论',
}

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  approved: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  rejected: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  spam: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
}
```

## Filter & Search Logic

### Search Filter
```typescript
const filteredComments = comments.filter((comment) => {
  const matchesSearch =
    searchQuery === '' ||
    comment.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (comment.username || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    comment.slug.toLowerCase().includes(searchQuery.toLowerCase())
  return matchesSearch
})
```

**Search Fields**:
- Comment content (case-insensitive)
- Username (if available)
- Post slug

### Status Filter
- **Backend Filter**: Refine `filters` prop sends to API
- **Frontend Filter**: `statusFilter` state controls API query
- **Options**: all (no filter), pending, approved, rejected, spam

**Refine Filter Format**:
```typescript
filters: [{
  field: 'status',
  operator: 'eq',
  value: statusFilter
}]
```

## Batch Operations

### Batch Status Update
```typescript
const handleBatchStatusUpdate = async (status: string) => {
  if (selectedComments.size === 0) return
  if (!confirm(`确定要将选中的 ${selectedComments.size} 条评论的状态改为 "${statusLabels[status]}" 吗？`)) {
    return
  }

  try {
    // Parallel updates with auto-refresh disabled
    await Promise.all(
      Array.from(selectedComments).map((commentId) =>
        updateMutation.mutateAsync({
          resource: 'admin/comments',
          id: commentId,
          values: { status },
          meta: { invalidates: [] },
        })
      )
    )
    alert(`成功将 ${selectedComments.size} 条评论的状态更新为"${statusLabels[status]}"`)
    setSelectedComments(new Set())
    invalidate({ resource: 'admin/comments', invalidates: ['list'] })
  } catch (err) {
    logger.error('Failed to batch update status:', err)
    alert('批量更新状态失败')
  }
}
```

### Batch Delete
```typescript
const handleBatchDelete = async () => {
  if (selectedComments.size === 0) return
  if (!confirm(`确定要删除选中的 ${selectedComments.size} 条评论吗？此操作不可撤销。`)) {
    return
  }

  try {
    await Promise.all(
      Array.from(selectedComments).map((commentId) =>
        deleteMutation.mutateAsync({
          resource: 'admin/comments',
          id: commentId,
          meta: { invalidates: [] },
        })
      )
    )
    alert(`成功删除 ${selectedComments.size} 条评论`)
    setSelectedComments(new Set())
    invalidate({ resource: 'admin/comments', invalidates: ['list'] })
  } catch (err) {
    logger.error('Failed to batch delete comments:', err)
    alert('批量删除失败')
  }
}
```

### Performance Optimization
- **Promise.all**: Executes mutations in parallel
- **Disabled Invalidates**: Prevents N refreshes for N mutations
- **Single Invalidate**: Refreshes list once after all complete
- **Selection Clear**: Resets state after success

## Individual Actions

### Status Change
```typescript
const handleStatusChange = async (commentId: string, newStatus: string) => {
  try {
    await updateMutation.mutateAsync({
      resource: 'admin/comments',
      id: commentId,
      values: { status: newStatus },
    })
    alert(`评论状态已成功更新为"${statusLabels[newStatus]}"`)
  } catch (err) {
    logger.error('Failed to update comment status:', err)
    alert('更新评论状态失败')
  }
}
```

### Delete Comment
```typescript
const handleDeleteComment = async (commentId: string) => {
  if (!confirm('确定要删除这条评论吗？此操作不可撤销。')) {
    return
  }

  try {
    await deleteMutation.mutateAsync({
      resource: 'admin/comments',
      id: commentId,
    })
    alert('评论已成功删除')
  } catch (err) {
    logger.error('Failed to delete comment:', err)
    alert('删除评论失败')
  }
}
```

## Pagination

### Pagination Controls
```typescript
const totalPages = Math.ceil(total / pageSize)

// Mobile view (simple prev/next)
<div className="flex sm:hidden">
  <button onClick={() => setPage(page - 1)} disabled={page === 1}>
    上一页
  </button>
  <button onClick={() => setPage(page + 1)} disabled={page === totalPages}>
    下一页
  </button>
</div>

// Desktop view (page numbers)
<div className="hidden sm:flex">
  <button onClick={() => setPage(page - 1)} disabled={page === 1}>
    上一页
  </button>
  {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
    <button
      key={pageNum}
      onClick={() => setPage(pageNum)}
      className={page === pageNum ? 'z-10 bg-blue-50 border-blue-500 text-blue-600' : 'bg-white border-gray-300 text-gray-500'}
    >
      {pageNum}
    </button>
  ))}
  <button onClick={() => setPage(page + 1)} disabled={page === totalPages}>
    下一页
  </button>
</div>
```

### Pagination Info Display
```typescript
显示第 {(page - 1) * pageSize + 1} 到 {Math.min(page * pageSize, total)} 条，共 {total} 条
```

**Example**: "显示第 21 到 40 条，共 125 条"

## Table Structure

### Table Header
```typescript
<thead className="bg-gray-50 dark:bg-gray-900">
  <tr>
    <th><input type="checkbox" checked={...} onChange={toggleSelectAll} /></th>
    <th>评论内容</th>
    <th>用户</th>
    <th>文章</th>
    <th>状态</th>
    <th>发布时间</th>
    <th>操作</th>
  </tr>
</thead>
```

### Table Row
```typescript
<tr className="hover:bg-gray-50 dark:hover:bg-gray-700">
  <td><input type="checkbox" checked={selectedComments.has(String(comment.id))} /></td>
  <td>
    <p className="line-clamp-2">{comment.content}</p>
  </td>
  <td>{comment.username || '匿名用户'}</td>
  <td className="truncate max-w-xs">{comment.slug}</td>
  <td><span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${statusColors[comment.status]}`}>{statusLabels[comment.status]}</span></td>
  <td>{new Date(comment.created_at).toLocaleString('zh-CN')}</td>
  <td>
    <select value={comment.status} onChange={(e) => handleStatusChange(String(comment.id), e.target.value)}>
      <option value="pending">待审核</option>
      <option value="approved">通过</option>
      <option value="rejected">拒绝</option>
      <option value="spam">垃圾</option>
    </select>
    <button onClick={() => handleDeleteComment(String(comment.id))}>删除</button>
  </td>
</tr>
```

### Empty State
```typescript
{filteredComments.length === 0 && (
  <tr>
    <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
      暂无评论
    </td>
  </tr>
)}
```

## Loading & Error States

### Loading State
```typescript
if (isLoading) {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
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
      <p className="text-red-600 dark:text-red-400">加载评论列表失败</p>
    </div>
  )
}
```

## Styling

### Color Scheme
- **Primary**: Blue (links, active states)
- **Status Colors**: Yellow (pending), Green (approved), Red (rejected), Purple (spam)
- **Actions**: Red (delete buttons)
- **Borders**: Gray (table borders, input borders)

### Dark Mode
- All color classes include `dark:` variants
- Backgrounds: `dark:bg-gray-800`, `dark:bg-gray-700`
- Borders: `dark:border-gray-600`, `dark:border-gray-700`
- Text: `dark:text-white`, `dark:text-gray-300`

### Responsive Design
- **Mobile**:
  - Filters stack vertically (`flex-col`)
  - Simple prev/next pagination
  - Full-width table with horizontal scroll
- **Desktop**:
  - Filters in single row (`sm:flex-row`)
  - Full pagination with page numbers
  - Optimized table column widths

### Typography
- **Headers**: `text-3xl font-bold` (h1), `text-xs font-medium uppercase` (table headers)
- **Body**: `text-sm` (table cells)
- **Status Badges**: `text-xs font-semibold`

## Timestamp Formatting

### Display Format
```typescript
new Date(comment.created_at).toLocaleString('zh-CN')
```

**Example Output**: "2025/1/3 10:30:45"

### Locale
- Chinese locale (`zh-CN`)
- Standard date/time format
- 12-hour or 24-hour based on system locale

## User Feedback

### Success Alerts
```typescript
// Individual action
alert(`评论状态已成功更新为"${statusLabels[newStatus]}"`)

// Batch action
alert(`成功将 ${selectedComments.size} 条评论的状态更新为"${statusLabels[status]}"`)
```

### Error Alerts
```typescript
catch (err) {
  logger.error('Failed to update comment status:', err)
  alert('更新评论状态失败')
}
```

### Confirmation Dialogs
```typescript
// Delete confirmation
if (!confirm('确定要删除这条评论吗？此操作不可撤销。')) {
  return
}

// Batch action confirmation
if (!confirm(`确定要将选中的 ${selectedComments.size} 条评论的状态改为 "${statusLabels[status]}" 吗？`)) {
  return
}
```

**Note**: Using `alert()` and `confirm()` for simplicity. Consider replacing with toast notifications and modal dialogs in production.

## API Integration

### Endpoints

#### List Comments
```
GET /admin/comments?page=1&pageSize=20
```
**Query Params**:
- `page`: Page number (1-based)
- `pageSize`: Items per page (default: 20)
- `filters`: JSON array of filter objects (for status)

**Response**:
```json
{
  "data": [
    {
      "id": "123",
      "content": "Great post!",
      "username": "user123",
      "slug": "post-slug",
      "status": "approved",
      "created_at": "2025-01-03T10:30:00Z"
    }
  ],
  "total": 125
}
```

#### Update Comment Status
```
PATCH /admin/comments/:id
```
**Body**:
```json
{
  "status": "approved"
}
```

#### Delete Comment
```
DELETE /admin/comments/:id
```

## Accessibility

### Keyboard Navigation
- Tab order: Search → Filter → Table rows → Pagination
- Enter/Space to toggle checkboxes
- Arrow keys for dropdown navigation

### Semantic HTML
- `<table>`, `<thead>`, `<tbody>` for tabular data
- `<label>` for form inputs (implicit via placeholders)
- Button elements for actions

### Focus Indicators
- `focus:ring-2 focus:ring-blue-500` on interactive elements
- Visible focus states in dark mode

### Screen Reader Support
- Status badges use text + color (not color alone)
- ARIA labels could be added for icon-only buttons
- Pagination numbers are readable

## Performance Considerations

### Client-Side Filtering
- Search operates on already-fetched page data
- Doesn't trigger new API calls
- Efficient for small page sizes (20 items)

### Batch Operation Optimization
- Parallel mutations with `Promise.all`
- Disabled auto-refresh prevents excessive network calls
- Single invalidate after completion

### Query Caching
- Refine's default cache behavior
- Manual invalidation after mutations
- Stale-while-revalidate strategy

## Error Handling

### Mutation Failures
```typescript
try {
  await updateMutation.mutateAsync(...)
  alert('Success')
} catch (err) {
  logger.error('...', err)
  alert('Failure message')
}
```

### Network Errors
- Refine's retry logic (default: 3 attempts)
- Error boundary catches React errors
- User-friendly error messages

### Logging
```typescript
import { logger } from '@/lib/utils/logger'

logger.error('Failed to batch update status:', err)
```

## Security Considerations

### Authorization
- Backend must verify admin role
- API endpoints should be protected
- CSRF tokens for mutation requests

### Input Sanitization
- Search query is case-folded before comparison
- No HTML injection risk (text-only inputs)
- Status values limited to enum options

### XSS Prevention
- Comment content truncated with `line-clamp-2`
- No raw HTML rendering
- Text nodes only

## Future Enhancements
- Replace `alert()`/`confirm()` with toast/modals
- Comment content preview modal
- Bulk import/export (CSV)
- Comment history/audit log
- Flag/reason for rejected comments
- Auto-moderation with AI
- Comment threading/replies support
- Advanced filters (date range, user, post)
- Keyboard shortcuts (a=approve, r=reject, d=delete)
- Real-time updates via WebSocket
- Comment analytics dashboard
- Spam detection integration

## Testing Considerations
- Mock Refine hooks (`useList`, `useUpdate`, `useDelete`)
- Test batch operations with large selection sets
- Verify pagination edge cases (first/last page)
- Test search with special characters
- Validate status transitions
- Simulate mutation failures
- Test responsive behavior on mobile

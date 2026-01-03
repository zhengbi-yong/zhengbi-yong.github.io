# User Management with Refine (admin/users-refine)

## Overview
Simplified user management page demonstrating Refine v5 hooks usage. This is a reference implementation showing basic CRUD operations with Refine's data provider hooks.

## Technology Stack
- **Framework**: Next.js 15 (App Router)
- **UI**: React Client Component ('use client')
- **Data Management**: Refine v5 hooks (@refinedev/core)
- **Styling**: Tailwind CSS with dark mode support
- **Icons**: Lucide React
- **Language**: TypeScript with @ts-nocheck

## Core Features

### 1. User List Display
- Paginated user listing (20 users per page)
- Search functionality (server-side filtering)
- User statistics display
- Simple table layout

### 2. User Operations
- Role modification (user/admin/moderator)
- User deletion with confirmation
- Real-time mutation status

### 3. Search & Filter
- Server-side search via Refine filters
- `contains` operator for text search
- Updates list on search change

## Data Fetching

### Refine useList Hook
```typescript
const queryResult = useList({
  resource: 'admin/users',
  pagination: {
    current: page,
    pageSize,
  } as any,
  filters: searchQuery
    ? [{
        field: 'search',
        operator: 'contains',
        value: searchQuery,
      }]
    : []
})

// Refine v5 returns { query, result } structure
const query = queryResult.query
const result = queryResult.result
const data = result?.data
const isLoading = query?.isPending
const error = query?.isError ? query.error : undefined
```

### Mutation Hooks
```typescript
const deleteMutation = useDelete()
const updateMutation = useUpdate()
```

## API Integration

### Resources
- **Resource**: `admin/users`
- **Operations**:
  - **List**: GET with pagination and filters
  - **Delete**: DELETE by user ID
  - **Update**: PATCH/PUT with role update

### Mutation Patterns
```typescript
// Delete user
await deleteMutation.mutateAsync({
  resource: 'admin/users',
  id: userId
})

// Update role
await updateMutation.mutateAsync({
  resource: 'admin/users',
  id: userId,
  values: { role: newRole }
})
```

## Component Structure

### 1. Header Section
```typescript
<h1>用户管理 (Refine)</h1>
<p>使用 Refine hooks 管理的用户列表</p>
```

### 2. Search Bar
- Lucide Search icon
- Full-width input
- Icon prefix styling
- Controlled input with state

### 3. Statistics Cards
Grid layout showing:
- **Total Users**: `total` from API response
- **Current Page**: `page / totalPages`
- **Page Size**: Fixed at 20

### 4. Users Table
**Columns**:
- ID
- Username
- Email
- Role (dropdown selector)
- Actions (delete button with Trash2 icon)

### 5. Pagination
- Previous/Next buttons
- Page indicator
- Boundary checks (max/min pages)
- Disabled states at boundaries

## State Management

### Local State
```typescript
const [page, setPage] = useState(1)              // Current page number
const pageSize = 20                               // Fixed page size
const [searchQuery, setSearchQuery] = useState('')  // Search text
```

### Mutation States
```typescript
deleteMutation.isPending  // Disables delete button during mutation
updateMutation.isPending  // Disables role dropdown during mutation
```

## Styling Approach

### Dark Mode
All UI elements support dark mode:
```typescript
className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
```

### Color Scheme
- **Primary**: Blue (focus states)
- **Danger**: Red (delete actions)
- **Neutral**: Gray (text, borders)

### Responsive Design
- Stats grid: `grid-cols-1 sm:grid-cols-3`
- Table: `overflow-x-auto` for horizontal scroll
- Full-width on mobile, grid on desktop

## Error Handling

### Loading State
```typescript
if (isLoading) {
  return (
    <div className="flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin" />
      <p>加载中...</p>
    </div>
  )
}
```

### Error State
```typescript
if (error) {
  return (
    <div className="bg-red-50 dark:bg-red-900/20">
      <h3>加载失败</h3>
      <p>{error instanceof Error ? error.message : '无法加载用户数据'}</p>
    </div>
  )
}
```

### Mutation Errors
```typescript
try {
  await mutation.mutateAsync(...)
} catch (error) {
  logger.error('Failed:', error)
  alert('操作失败')
}
```

## Type Definitions

### User (implicit from API)
```typescript
interface User {
  id: string
  username: string
  email: string
  role: 'user' | 'admin' | 'moderator'
  // Possibly more fields...
}
```

**Note**: Uses `any` type in mapping: `users.map((user: any) => ...)`

## Key Functionality

### Role Update
- Inline dropdown in table
- Three options: user, admin, moderator
- Disabled during mutation
- Auto-commits on change

### User Deletion
- Confirmation dialog: `confirm('确定要删除这个用户吗？')`
- Trash2 icon button
- Disabled during mutation
- Error handling with alert

### Pagination
- Manual page state management
- Boundary protection: `Math.max(1, page - 1)`
- Total pages calculation: `Math.ceil(total / pageSize)`
- Conditional rendering (hidden if single page)

## Differences from admin/users

### Simplified Features
- **No batch operations** (vs. batch select/update/delete)
- **No role filter dropdown** (vs. role filter in admin/users)
- **No email verification display** (vs. verification badge)
- **No registration date** (vs. created_at column)
- **Simpler pagination** (vs. dual-mode mobile/desktop)
- **Server-side search** (vs. client-side filter in admin/users)

### Purpose
This is a **demonstration/learning page** for Refine hooks:
- Shows basic useList usage
- Demonstrates mutation hooks
- Simpler code for reference
- Label: "用户管理 (Refine)" to distinguish

## Best Practices

### Refine Patterns
- Use `as any` for pagination (type compatibility)
- Destructure `query` and `result` from Refine v5 response
- Check `query?.isPending` for loading state
- Handle `query?.isError` for error state

### State Management
- Controlled inputs for search
- Immediate search execution (no debounce)
- Page state drives pagination

### Error Handling
- Try-catch for mutations
- Logger.error for tracking
- User alerts in Chinese
- UI disabled during mutations

## Integration Points

### Backend API
- Expects REST API at `/admin/users`
- Query params: `current`, `pageSize`, `filters`
- Filter format: `[{ field, operator, value }]`
- Pagination metadata in response: `{ data, total }`

### Shared Dependencies
- `@refinedev/core` for hooks
- `lucide-react` for icons
- `@/lib/utils/logger` for error logging

## Dependencies
```
@refinedev/core
lucide-react
@/lib/utils/logger
```

## File Structure
```
frontend/src/app/admin/users-refine/
├── page.tsx          # Main component (Refine example)
└── CLAUDE.md         # This file
```

## Usage Context

This is a **reference implementation** page demonstrating:
1. How to use Refine v5 hooks in Next.js 15
2. Basic CRUD operations pattern
3. Server-side filtering approach
4. Mutation handling with error states

Compare with `/admin/users` for:
- Advanced features (batch operations)
- Client-side filtering
- More sophisticated UI
- Production-ready patterns

## Future Enhancements
- Add TypeScript types (replace `any`)
- Debounce search input
- Add user creation form
- Implement sorting
- Add more user fields (status, created_at, etc.)
- Export functionality

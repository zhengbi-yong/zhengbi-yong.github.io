# User Management Module (admin/users)

## Overview
Enhanced user management page using Refine v5 hooks for data operations. Provides admin functionality to manage users with batch operations, advanced filtering, and role-based access control.

## Technology Stack
- **Framework**: Next.js 15 (App Router)
- **UI**: React Client Component ('use client')
- **Data Management**: Refine v5 hooks (@refinedev/core)
- **Styling**: Tailwind CSS with dark mode support
- **Icons**: Lucide React
- **Language**: TypeScript with @ts-nocheck

## Core Features

### 1. User List Management
- Paginated user listing (20 users per page)
- Real-time user search (email/username)
- Role-based filtering (all/user/moderator/admin)
- Email verification status display
- Registration date tracking

### 2. Batch Operations
- Multi-user selection with checkboxes
- Batch role updates
- Batch user deletion
- Select all functionality
- Confirmation dialogs for safety

### 3. Individual User Actions
- Role modification via inline dropdown
- User deletion with confirmation
- Real-time mutation status indicators

### 4. Data Fetching & State
```typescript
// Refine v5 hook structure
const queryResult = useList({
  resource: 'admin/users',
  pagination: { current: page, pageSize },
  filters: roleFilter !== 'all' ? [{ field: 'role', operator: 'eq', value: roleFilter }] : []
})

// Returns { query, result } structure
const query = queryResult.query
const result = queryResult.result
const data = result?.data
const total = result?.total || 0
```

## API Integration

### Refine Resources
- **Resource**: `admin/users`
- **Operations**:
  - `useList`: Fetch paginated user list
  - `useUpdate`: Update user role
  - `useDelete`: Delete user

### Mutation Patterns
```typescript
// Update user role
await updateMutation.mutateAsync({
  resource: 'admin/users',
  id: userId,
  values: { role: newRole }
})

// Delete user
await deleteMutation.mutateAsync({
  resource: 'admin/users',
  id: userId
})
```

## Components

### 1. Search & Filter Bar
- **Search Input**: Text-based filtering by email/username
- **Role Filter**: Dropdown for role selection
- **Batch Actions**: Appears when users are selected
  - Batch role update dropdown
  - Batch delete button

### 2. User Table
- **Columns**:
  - Checkbox for selection
  - Username
  - Email
  - Role (editable dropdown)
  - Email verification status (badge)
  - Registration date
  - Actions (delete button)

### 3. Pagination
- Dual-mode pagination (mobile/desktop)
- Page range display
- Total count indicator
- Previous/Next navigation

## State Management

### Component State
```typescript
const [page, setPage] = useState(1)              // Current page
const [pageSize] = useState(20)                  // Items per page (fixed)
const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set())  // Selected user IDs
const [searchQuery, setSearchQuery] = useState('')  // Search text
const [roleFilter, setRoleFilter] = useState('all')  // Role filter
```

### Derived State
```typescript
const filteredUsers = users.filter((user) => {
  const matchesSearch = /* search logic */
  const matchesRole = /* role filter logic */
  return matchesSearch && matchesRole
})
```

## Styling Approach

### Dark Mode Support
All components support dark mode using Tailwind's `dark:` prefix:
```typescript
className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
```

### Responsive Design
- Mobile-first approach
- Conditional rendering for pagination (sm:hidden vs sm:flex)
- Horizontal scroll for table on small screens (overflow-x-auto)

### Color Scheme
- **Primary**: Blue (actions, focus states)
- **Success**: Green (verified status)
- **Danger**: Red (delete actions, unverified status)
- **Neutral**: Gray (text, borders)

## Error Handling

### Loading States
```typescript
if (isLoading) {
  return <Loader2 className="w-8 h-8 animate-spin" />
}
```

### Error Display
```typescript
if (error) {
  return (
    <div className="bg-red-50 dark:bg-red-900/20">
      <p className="text-red-600 dark:text-red-400">加载用户列表失败</p>
    </div>
  )
}
```

### Mutation Errors
- Try-catch blocks for all mutations
- Logger.error for error tracking
- User-friendly alerts in Chinese
- Mutation status disables UI during operation

## Type Definitions

### UserListItem
```typescript
interface UserListItem {
  id: string
  username: string
  email: string
  role: 'user' | 'moderator' | 'admin'
  email_verified: boolean
  created_at: string  // ISO date string
}
```

## Key Functionality

### Role Management
- Three roles: user (普通用户), moderator (版主), admin (管理员)
- Inline editing via dropdown
- Batch updates with confirmation
- Mutation disables during update

### User Deletion
- Confirmation dialog with username
- Irreversible operation warning
- Batch deletion support
- Error handling with user feedback

### Filtering Logic
```typescript
// Search matches email or username (case-insensitive)
const matchesSearch =
  searchQuery === '' ||
  user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
  user.username.toLowerCase().includes(searchQuery.toLowerCase())

// Role exact match
const matchesRole = roleFilter === 'all' || user.role === roleFilter
```

## Best Practices

### Performance
- Client-side filtering after fetch (small datasets)
- Parallel mutations with Promise.all for batch operations
- Memoized Set operations for selection state

### User Experience
- Confirmation dialogs for destructive actions
- Loading indicators for async operations
- Disabled state during mutations
- Empty state handling ("暂无用户")

### Code Organization
- Single file component
- Clear separation of data fetching, state, and UI
- Chinese UI text for user-facing elements
- Consistent error handling patterns

## Integration Points

### Backend
- Expects REST API at `/admin/users` endpoint
- Refine data provider handles HTTP operations
- Pagination: `current` and `pageSize` params
- Filtering: `{ field, operator, value }` format

### Shared Types
- `UserListItem` from `@/lib/types/backend`
- `logger` from `@/lib/utils/logger`

## Dependencies
```
@refinedev/core
lucide-react
@/lib/types/backend
@/lib/utils/logger
```

## File Structure
```
frontend/src/app/admin/users/
├── page.tsx          # Main user management component
└── CLAUDE.md         # This file
```

## Future Enhancements
- Server-side search for large datasets
- Export functionality (CSV/Excel)
- Advanced filters (date range, verification status)
- User profile editing modal
- Audit log for role changes
- Bulk import users

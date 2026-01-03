# `@/lib/hooks` Module

## Layer 1: Module Overview

### Purpose
Custom React hooks for data fetching, state management, and business logic (blog, admin, chemistry).

### Scope
- Blog data hooks with React Query
- Admin management hooks
- Chemistry calculation hooks
- Local chemistry state management

## Layer 2: Architecture

### Files
- **useBlogData.ts**: Blog posts, comments, search hooks
- **use-admin.ts**: Admin dashboard hooks
- **useChemistry.ts**: Chemistry calculation hooks (API)
- **useChemistryLocal.ts**: Chemistry state management (local)

## Layer 3: Implementation Details

### Blog Data Hooks (useBlogData.ts)

#### usePosts
```typescript
function usePosts(params?: PostListParams): UseQueryResult<PostListResponse>
```
**Features**: Pagination, filtering, caching

**Usage**:
```typescript
const { data, isLoading, error } = usePosts({
  page: 1,
  limit: 10,
  category: 'Technology'
})
```

---

#### usePost
```typescript
function usePost(slug: string): UseQueryResult<PostDetail>
```
**Features**: Single post fetching, automatic cache invalidation

---

#### useSearch
```typescript
function useSearch(query: string): UseQueryResult<SearchResponse>
```
**Features**: Debounced search, result caching

---

#### useSearchSuggestions
```typescript
function useSearchSuggestions(query: string, limit?: number): UseQueryResult<string[]>
```
**Features**: Autocomplete suggestions

---

#### useCreateComment
```typescript
function useCreateComment(): UseMutationResult<void, Error, CreateCommentRequest>
```
**Features**: Optimistic updates, cache invalidation

**Usage**:
```typescript
const createComment = useCreateComment()

const handleSubmit = async () => {
  await createComment.mutateAsync({
    slug: postSlug,
    content: commentText
  })
}
```

---

### Admin Hooks (use-admin.ts)

#### useAdminStats
```typescript
function useAdminStats(): UseQueryResult<AdminStats>
```
**Returns**: User count, post count, comment count, engagement metrics

---

#### useUsers
```typescript
function useUsers(params?: UserListParams): UseQueryResult<UserListResponse>
```
**Features**: Paginated user list with role filtering

---

#### useUpdateUserRole
```typescript
function useUpdateUserRole(): UseMutationResult<void, Error, UpdateUserRoleRequest>
```
**Features**: Role mutation with cache invalidation

---

#### useCommentsAdmin
```typescript
function useCommentsAdmin(): UseQueryResult<CommentAdminListResponse>
```
**Features**: All comments with moderation status

---

#### useUpdateCommentStatus
```typescript
function useUpdateCommentStatus(): UseMutationResult<void, Error, UpdateCommentStatusRequest>
```
**Features**: Approve/reject/delete comments

---

### Chemistry Hooks

#### useChemistry (API-based)
```typescript
function useChemistry(): {
  balance: (equation: string) => Promise<BalancedEquation>
  calculateMolarMass: (formula: string) => Promise<number>
  // ... more operations
}
```
**Features**: Backend API calls, loading states, error handling

---

#### useChemistryLocal (Local State)
```typescript
function useChemistryLocal(): {
  history: Calculation[]
  addToHistory: (calc: Calculation) => void
  clearHistory: () => void
  balanceEquation: (equation: string) => BalancedEquation | null
  // ... more operations
}
```
**Features**: Client-side calculations, history persistence

**State Management**:
```typescript
const [history, setHistory] = useState<Calculation[]>([])
const [favorites, setFavorites] = useState<Equation[]>([])

// Persist to localStorage
useEffect(() => {
  localStorage.setItem('chem-history', JSON.stringify(history))
}, [history])
```

## Architecture Context

### Integration Points
- **Location**: `@/lib/hooks` → Business logic layer
- **Data Layer**: `@/lib/api` (backend), `@/lib/db` (blog content)
- **State Management**: Zustand stores
- **Query Library**: React Query (@tanstack/react-query)

### Design Patterns
- **Custom Hooks**: Reusable stateful logic
- **React Query**: Server state management
- **Optimistic Updates**: Immediate UI feedback
- **Cache Invalidation**: Automatic data refresh

### Usage Examples

**Blog List Page**:
```typescript
import { usePosts } from '@/lib/hooks/useBlogData'

function BlogListPage() {
  const { data, isLoading, error } = usePosts({ page: 1 })

  if (isLoading) return <Loader />
  if (error) return <Error message={error.message} />

  return (
    <div>
      {data.posts.map(post => <PostCard key={post.id} post={post} />)}
    </div>
  )
}
```

**Post Detail with Comments**:
```typescript
function PostDetail({ slug }) {
  const { data: post } = usePost(slug)
  const { data: comments } = useComments(slug)
  const createComment = useCreateComment()

  const handleSubmit = async (content) => {
    await createComment.mutateAsync({ slug, content })
  }

  return (
    <article>
      <h1>{post.title}</h1>
      <CommentList comments={comments} />
      <CommentForm onSubmit={handleSubmit} />
    </article>
  )
}
```

**Admin Dashboard**:
```typescript
function AdminDashboard() {
  const { data: stats } = useAdminStats()
  const { data: users } = useUsers()
  const updateRole = useUpdateUserRole()

  const handleRoleChange = async (userId, newRole) => {
    await updateRole.mutateAsync({ userId, role: newRole })
  }

  return (
    <div>
      <StatsCards stats={stats} />
      <UserTable users={users} onRoleChange={handleRoleChange} />
    </div>
  )
}
```

**Chemistry Calculator**:
```typescript
import { useChemistryLocal } from '@/lib/hooks/useChemistryLocal'

function ChemistryCalculator() {
  const { balanceEquation, history, addToHistory } = useChemistryLocal()

  const handleBalance = (equation) => {
    const result = balanceEquation(equation)
    if (result) {
      addToHistory({ equation, result, timestamp: Date.now() })
    }
    return result
  }

  return (
    <div>
      <EquationInput onBalance={handleBalance} />
      <HistoryList items={history} />
    </div>
  )
}
```

## React Query Configuration

**Query Client Setup**:
```typescript
// app/providers.tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,  // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
      retry: 3,
      refetchOnWindowFocus: false
    }
  }
})
```

**Query Keys**:
```typescript
// Standardized keys for cache management
const queryKeys = {
  posts: ['posts'] as const,
  post: (slug: string) => ['posts', slug] as const,
  comments: (slug: string) => ['comments', slug] as const,
  adminStats: ['admin', 'stats'] as const,
}

// Usage
useQuery({
  queryKey: queryKeys.post(slug),
  queryFn: () => fetchPost(slug)
})
```

**Cache Invalidation**:
```typescript
// After mutation
queryClient.invalidateQueries({ queryKey: ['posts'] })
queryClient.invalidateQueries({ queryKey: ['comments', slug] })
```

## Performance Considerations

**React Query Benefits**:
- Automatic caching (no stale data)
- Background refetching (fresh data)
- Optimistic updates (instant UI)
- Deduplication (fewer requests)
- Pagination support

**Best Practices**:
1. Use appropriate `staleTime` (don't over-refetch)
2. Enable `refetchOnWindowFocus` for critical data
3. Use `isLoading` vs `isFetching` correctly
4. Handle errors gracefully
5. Use `enabled` option for conditional queries

**Hook Composition**:
```typescript
// Combine multiple hooks
function usePostWithComments(slug: string) {
  const post = usePost(slug)
  const comments = useComments(slug)
  const stats = usePostStats(slug)

  return {
    post: post.data,
    comments: comments.data,
    stats: stats.data,
    isLoading: post.isLoading || comments.isLoading || stats.isLoading,
    error: post.error || comments.error || stats.error
  }
}
```

## Dependencies

- `@tanstack/react-query`: React Query library
- `@/lib/api`: Backend API client
- `@/lib/db`: Blog database
- Zustand: Local state management

## Related Modules

- `@/lib/api`: Backend integration
- `@/lib/store`: Zustand stores
- `@/lib/cache`: Cache management
- `@/components`: UI components using hooks

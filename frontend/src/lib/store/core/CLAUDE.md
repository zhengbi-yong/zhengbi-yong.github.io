# Store Core Module

## Purpose

Provides unified state management infrastructure for the application using Zustand. This module defines standardized store patterns, base types, and async action wrappers to ensure consistency across all application stores.

## Architecture

### Core Principles

1. **Standardized Base State**: All stores share common state fields (`_initialized`, `_error`, `_loading`, `_lastUpdated`)
2. **Async Action Wrappers**: Unified error handling and loading state management
3. **Type Safety**: Full TypeScript support with strict type definitions
4. **Separation of Concerns**: Core utilities separated from domain-specific stores

### Module Structure

```
core/
├── types.ts       # Base interfaces, types, and error handlers
├── actions.ts     # Action wrappers (async, batch, sync)
└── index.ts       # Public API exports
```

## Core Types

### BaseStoreState

Every store MUST extend this interface for consistency:

```typescript
interface BaseStoreState {
  _initialized: boolean      // Store initialization status
  _error: string | null      // Current error message
  _loading: boolean          // Loading state for async operations
  _lastUpdated: number | null // Last update timestamp (ms)
}
```

### BaseStoreActions

Standard actions that every store SHOULD implement:

```typescript
interface BaseStoreActions {
  setError: (error: string | null) => void
  setLoading: (loading: boolean) => void
  clearError: () => void
  reset: () => void
  _setLastUpdated: (timestamp: number) => void
}
```

### Store Types

Predefined store identifiers for type safety:

```typescript
type StoreType = 'auth' | 'blog' | 'comment' | 'post' | 'ui'
```

## Action Wrappers

### wrapAsyncAction

Wrapper for async actions with automatic loading/error state management:

```typescript
const login = wrapAsyncAction(
  state,
  setState,
  async () => {
    const response = await authService.login({ email, password })
    return response
  },
  {
    errorHandler: customErrorHandler,
    onSuccess: () => console.log('Login success'),
    onError: (error) => console.error('Login failed:', error),
    clearPreviousError: true
  }
)
```

**Behavior**:
- Sets `_loading: true` and clears previous error on start
- Sets `_loading: false`, `_error: null`, updates timestamp on success
- Sets `_error` and `_loading: false` on failure
- Executes optional `onSuccess`/`onError` callbacks

### wrapBatchAsyncAction

Execute multiple async actions in parallel with unified state management:

```typescript
const batchAction = wrapBatchAsyncAction(
  state,
  setState,
  [
    () => fetchPosts(),
    () => fetchComments(),
    () => fetchAuthors()
  ],
  {
    errorHandler: customErrorHandler
  }
)
```

**Use Case**: Fetching independent data sources simultaneously

### createAction

Create synchronous actions with automatic timestamp updates:

```typescript
const setSearchQuery = createAction(setState, (query: string) => ({
  searchQuery: query
}))
```

### createSelector

Type-safe state selector factory:

```typescript
const selectUser = createSelector((state: AuthStore) => state.user)
const user = selectUser(useAuthStore.getState())
```

## Usage Patterns

### Creating a Store

**Pattern 1: Direct Implementation** (Current pattern in auth/blog/comment stores)

```typescript
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface AuthState {
  user: UserInfo | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
  // ... actions
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      login: async (email, password) => {
        set({ isLoading: true, error: null })
        try {
          const response = await authService.login({ email, password })
          set({
            user: response.user,
            token: response.access_token,
            isAuthenticated: true,
            isLoading: false
          })
        } catch (error) {
          set({
            error: error.message,
            isLoading: false
          })
          throw error
        }
      },

      // ... other actions
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated
      })
    }
  )
)
```

**Pattern 2: Core-Based Implementation** (Recommended for new stores)

```typescript
import { createBaseStore, createBaseInitialState } from '@/lib/store/core'

interface AuthState extends BaseStoreState {
  user: UserInfo | null
  token: string | null
}

interface AuthActions extends BaseStoreActions {
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
}

type AuthStore = AuthState & AuthActions

export const useAuthStore = createBaseStore<AuthStore>(
  'auth',
  (set, get) => ({
    // Base state
    ...createBaseInitialState(),

    // Domain state
    user: null,
    token: null,

    // Actions
    login: wrapAsyncAction(
      get(),
      set,
      async () => {
        const response = await authService.login({ email, password })
        set({
          user: response.user,
          token: response.access_token
        })
      }
    ),

    // Base actions
    setError: (error) => set({ _error: error }),
    setLoading: (loading) => set({ _loading: loading }),
    clearError: () => set({ _error: null }),
    reset: () => set(createBaseInitialState()),
    _setLastUpdated: (timestamp) => set({ _lastUpdated: timestamp })
  })
)
```

### Persistence Configuration

All persistent stores use Zustand's `persist` middleware with selective state persistence:

```typescript
persist(
  (set, get) => ({ /* store implementation */ }),
  {
    name: 'store-name-storage',
    partialize: (state) => ({
      // Only persist essential state
      // Exclude loading, error, and transient state
      user: state.user,
      token: state.token
    })
  }
)
```

**Rules**:
- Persist: authentication tokens, user data, cached content
- Don't persist: loading states, error messages, temporary UI state

## Error Handling

### Default Error Handler

```typescript
const defaultErrorHandler: ErrorHandler = (error) => {
  if (error instanceof Error) return error.message
  if (typeof error === 'string') return error
  return 'An unknown error occurred'
}
```

### Custom Error Handlers

```typescript
const apiErrorHandler: ErrorHandler = (error) => {
  if (axios.isAxiosError(error)) {
    return error.response?.data?.message || 'API request failed'
  }
  return defaultErrorHandler(error)
}
```

## Store Examples in Codebase

### Auth Store (`frontend/src/lib/store/auth-store.ts`)

**Domain**: User authentication and session management

**State**:
- `user: UserInfo | null` - Current user profile
- `token: string | null` - JWT access token
- `isAuthenticated: boolean` - Auth status flag
- `isLoading: boolean` - Async operation status
- `error: string | null` - Error message

**Actions**:
- `login(email, password)` - User login
- `register(email, username, password)` - New user registration
- `logout()` - Session termination
- `getCurrentUser()` - Fetch user profile
- `refreshToken()` - Token refresh
- `checkAuth()` - Verify authentication status

**Persistence**: User data and token persisted to localStorage

### Blog Store (`frontend/src/lib/store/blog-store.ts`)

**Domain**: Blog content caching and search

**State**:
- `searchQuery: string` - Current search term
- `filteredPosts: CoreContent<Blog>[]` - Search results
- `allPosts: CoreContent<Blog>[]` - Full blog cache
- `cachedAt: number | null` - Cache timestamp
- `cacheExpiry: number` - Cache TTL (default: 1 hour)

**Actions**:
- `setSearchQuery(query)` - Update search term
- `setFilteredPosts(posts)` - Store search results
- `setAllPosts(posts)` - Cache all blog posts
- `setCachedAt(timestamp)` - Update cache time
- `isCacheValid()` - Check cache freshness
- `clearCache()` - Invalidate cache

**Persistence**: Search query and cached posts persisted

## Data Flow Patterns

### Async Action Flow

```
User Action → wrapper → setLoading(true) → API Call
                              ↓
                         Success/Failure
                              ↓
                    ┌─────────┴─────────┐
                    ↓                   ↓
            Success Path          Error Path
            setError(null)       setError(message)
            setLoading(false)    setLoading(false)
            updateTimestamp      throw error
```

### Cache Flow

```
Component Mount → Check Cache Validity
                        ↓
              ┌─────────┴─────────┐
              ↓                   ↓
         Valid Cache        Invalid/No Cache
         Use cached          Fetch from API
         data                    ↓
                            setAllPosts(data)
                            setCachedAt(now)
```

## Integration Points

### API Integration

Stores integrate with backend services from `@/lib/api/backend`:

```typescript
import { authService } from '@/lib/api/backend'

login: async (email, password) => {
  const response = await authService.login({ email, password })
  // Update store state
}
```

### Component Integration

Components consume stores using Zustand hooks:

```typescript
import { useAuthStore } from '@/lib/store/auth-store'

function LoginForm() {
  const { login, isLoading, error } = useAuthStore()

  const handleSubmit = async (e) => {
    e.preventDefault()
    await login(email, password)
  }

  // ... render
}
```

## Best Practices

1. **Always handle loading states** - Show loading indicators during async operations
2. **Clear errors on retry** - Reset error state before retrying failed operations
3. **Use partialize for persistence** - Only persist essential state to localStorage
4. **Timestamp updates** - Use `_lastUpdated` for cache invalidation
5. **Error boundaries** - Wrap store consumers in error boundaries
6. **Type safety** - Always define explicit types for store state and actions
7. **Atomic updates** - Update related state in single `set()` call
8. **Selector optimization** - Use selectors to prevent unnecessary re-renders

## Migration Notes

**Current State**: Most stores (auth, blog, comment) use direct Zustand implementation without extending base types from `core/`.

**Future**: New stores should extend `BaseStoreState` and `BaseStoreActions` for consistency. Existing stores can be migrated incrementally.

**Benefits of Migration**:
- Consistent error handling across all stores
- Unified loading state management
- Automatic timestamp tracking
- Reduced boilerplate code

## Dependencies

- **zustand**: State management library
- **zustand/middleware**: Persistence (`persist`) middleware
- **@/lib/api/backend**: Backend service integration
- **@/types/backend**: Type definitions for API responses
- **contentlayer/generated**: Blog content types

## Testing

Store testing should verify:

1. **State updates** - Actions correctly update state
2. **Persistence** - State survives page reload
3. **Error handling** - Errors properly caught and stored
4. **Loading states** - Loading flags set/cleared correctly
5. **Cache invalidation** - Timestamp-based cache expiry works

Example test pattern:

```typescript
describe('AuthStore', () => {
  it('should set loading state during login', async () => {
    const { login, isLoading } = useAuthStore.getState()

    expect(isLoading).toBe(false)

    const loginPromise = login('user@example.com', 'password')
    expect(useAuthStore.getState().isLoading).toBe(true)

    await loginPromise
    expect(useAuthStore.getState().isLoading).toBe(false)
  })
})
```

## Performance Considerations

1. **Selector usage** - Use selectors to subscribe to specific state slices
2. **Batch updates** - Use `wrapBatchAsyncAction` for parallel async operations
3. **Partialize** - Minimize persisted data to reduce localStorage overhead
4. **Cache invalidation** - Use timestamp-based cache expiry to avoid stale data
5. **Avoid deep subscriptions** - Prefer shallow state access patterns

## File Locations

- **Core module**: `frontend/src/lib/store/core/`
- **Auth store**: `frontend/src/lib/store/auth-store.ts`
- **Blog store**: `frontend/src/lib/store/blog-store.ts`
- **Comment store**: `frontend/src/lib/store/comment-store.ts`
- **Post store**: `frontend/src/lib/store/post-store.ts`
- **UI store**: `frontend/src/lib/store/ui-store.ts`
- **Index**: `frontend/src/lib/store/index.ts`

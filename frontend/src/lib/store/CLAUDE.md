# `@/lib/store` Module

## Layer 1: Module Overview

### Purpose
Zustand-based client-side state management for authentication, blog data, comments, posts, and UI state.

### Scope
- Authentication state (user, tokens)
- Blog content cache
- Comment management
- Post statistics and interactions
- UI state (modals, toasts, theme)

## Layer 2: Architecture

### Files
- **auth-store.ts**: Authentication state
- **blog-store.ts**: Blog content cache
- **comment-store.ts**: Comment state
- **post-store.ts**: Post interactions (likes, views)
- **ui-store.ts**: UI state (theme, modals)
- **core/**: Store utilities and types

### Store: Auth (auth-store.ts)

**State Interface**:
```typescript
interface AuthState {
  user: User | null
  isAuthenticated: boolean
  // GOLDEN_RULES 1.1: 不再存储 token，认证通过 HttpOnly Cookie 处理

  // Actions
  login: (credentials: LoginRequest) => Promise<void>
  logout: () => Promise<void>
  updateUser: (user: User) => void
}
```

**Usage**:
```typescript
import { useAuthStore } from '@/lib/store'

function LoginButton() {
  const { login, isAuthenticated } = useAuthStore()

  const handleClick = async () => {
    await login({ username, password })
    // Redirect to dashboard
  }

  return <button onClick={handleClick}>Login</button>
}
```

---

### Store: Blog (blog-store.ts)

**State Interface**:
```typescript
interface BlogState {
  posts: Post[]
  categories: Category[]
  tags: Tag[]
  lastFetched: number | null

  // Actions
  fetchPosts: () => Promise<void>
  fetchCategories: () => Promise<void>
  fetchTags: () => Promise<void>
  getPostBySlug: (slug: string) => Post | undefined
  getPostsByCategory: (category: string) => Post[]
}
```

**Purpose**: Cache blog content to reduce API calls

---

### Store: Comment (comment-store.ts)

**State Interface**:
```typescript
interface CommentState {
  comments: Record<string, Comment[]>  // Key: post slug
  likedComments: Set<string>  // Comment IDs
  loading: Record<string, boolean>
  error: Record<string, string>

  // Actions
  fetchComments: (slug: string, cursor?: string) => Promise<void>
  createComment: (slug: string, data: CreateCommentRequest) => Promise<void>
  likeComment: (commentId: string) => Promise<void>
  getComments: (slug: string) => Comment[]
  hasMore: (slug: string) => boolean
}
```

**Features**:
- Pagination with cursor
- Optimistic updates
- Like tracking

---

### Store: Post (post-store.ts)

**State Interface**:
```typescript
interface PostState {
  stats: Record<string, PostStats>  // Key: post slug
  likedPosts: Set<string>

  // Actions
  fetchStats: (slug: string) => Promise<void>
  recordView: (slug: string) => Promise<void>
  toggleLike: (slug: string) => Promise<void>
  getStats: (slug: string) => PostStats | null
  isLiked: (slug: string) => boolean
}
```

**PostStats Interface**:
```typescript
interface PostStats {
  view_count: number
  like_count: number
  comment_count: number
}
```

---

### Store: UI (ui-store.ts)

**State Interface**:
```typescript
interface UIState {
  theme: 'light' | 'dark' | 'system'
  sidebarOpen: boolean
  modalOpen: boolean
  activeModal: string | null

  // Actions
  setTheme: (theme: string) => void
  toggleSidebar: () => void
  openModal: (modal: string) => void
  closeModal: () => void
}
```

## Layer 3: Implementation Details

### Zustand Store Pattern

**Basic Store**:
```typescript
import create from 'zustand'

interface StoreState {
  count: number
  increment: () => void
}

export const useStore = create<StoreState>((set) => ({
  count: 0,
  increment: () => set((state) => ({ count: state.count + 1 }))
}))
```

**Async Actions**:
```typescript
export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,

  login: async (credentials) => {
    set({ loading: true })
    try {
      const response = await api.login(credentials)
      set({ user: response.user, isAuthenticated: true })
    } catch (error) {
      set({ error: error.message })
    } finally {
      set({ loading: false })
    }
  }
}))
```

**Persistence**:
```typescript
import { persist } from 'zustand/middleware'

export const useAuthStore = create(
  persist<AuthState>(
    (set) => ({
      // ... store config
    }),
    {
      name: 'auth-storage',  // localStorage key
      partialize: (state) => ({ user: state.user, token: state.token })
    }
  )
)
```

### Selectors for Performance

**Bad (Re-renders on all state changes)**:
```typescript
function Component() {
  const { user, posts, comments } = useStore()
  // Re-renders if ANY store value changes
}
```

**Good (Only re-renders on selected changes)**:
```typescript
function Component() {
  const user = useStore((state) => state.user)
  // Only re-renders if user changes
}
```

### Middleware

**DevTools**:
```typescript
import { devtools } from 'zustand/middleware'

export const useStore = create(
  devtools<StoreState>(
    (set) => ({
      // ... store config
    }),
    { name: 'BlogStore' }  // Store name in DevTools
  )
)
```

**Logger**:
```typescript
import { logger } from 'zustand/middleware'

export const useStore = create(
  logger<StoreState>((set) => ({
    // ... store config
  }))
)
```

### Composing Stores

**Cross-Store Actions**:
```typescript
export const useCommentStore = create<CommentState>((set, get) => ({
  comments: {},

  createComment: async (slug, data) => {
    const response = await api.createComment(slug, data)

    // Update comment store
    set((state) => ({
      comments: {
        ...state.comments,
        [slug]: [...state.comments[slug], response]
      }
    }))

    // Update post stats store
    const postStore = getPostStore()
    postStore.fetchStats(slug)
  }
}))
```

## Architecture Context

### Integration Points
- **Location**: `@/lib/store` → Client state
- **Used By**: Components across entire app
- **Persistence**: localStorage (via zustand persist middleware)
- **DevTools**: Redux DevTools integration

### Design Patterns
- **Flux Pattern**: Actions, state, selectors
- **Middleware**: Composeable store enhancements
- **Selectors**: Performance optimization
- **Persistence**: Automatic localStorage sync

### Usage Examples

**Authentication Flow**:
```typescript
function LoginForm() {
  const { login, isLoading, error } = useAuthStore()

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      await login({ username, password })
      router.push('/dashboard')
    } catch (err) {
      // Error handled by store
    }
  }

  return <form onSubmit={handleSubmit}>...</form>
}
```

**Post Interactions**:
```typescript
function PostActions({ slug }) {
  const { toggleLike, isLiked } = usePostStore()
  const liked = isLiked(slug)

  return (
    <button onClick={() => toggleLike(slug)}>
      {liked ? '❤️' : '🤍'}
    </button>
  )
}
```

**Theme Switcher**:
```typescript
function ThemeToggle() {
  const { theme, setTheme } = useUIStore()

  return (
    <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
      Toggle Theme
    </button>
  )
}
```

## Performance Considerations

**Optimization Tips**:
1. Use selectors to prevent unnecessary re-renders
2. Split large stores into smaller, focused stores
3. Use shallow comparison for objects/arrays
4. Persist only necessary state (not loading states)
5. Debounce rapid actions (like toggles)

**Selector Best Practices**:
```typescript
// Use shallow compare for objects
import { shallow } from 'zustand/shallow'

function Component() {
  const { user, posts } = useStore(
    (state) => ({ user: state.user, posts: state.posts }),
    shallow  // Prevents re-render if object reference is same
  )
}
```

## Testing

**Test Store Actions**:
```typescript
import { renderHook, act } from '@testing-library/react'
import { useAuthStore } from '@/lib/store'

test('login updates user state', async () => {
  const { result } = renderHook(() => useAuthStore())

  await act(async () => {
    await result.current.login({ username: 'test', password: 'test' })
  })

  expect(result.current.user).toBeTruthy()
  expect(result.current.isAuthenticated).toBe(true)
})
```

## Dependencies

- `zustand`: State management library
- `zustand/middleware`: Persist, devtools, logger
- TypeScript: Type definitions

## Related Modules

- `@/lib/api`: Backend integration
- `@/components/ui`: Store-consuming components
- `@/app/pages`: Page-level store usage

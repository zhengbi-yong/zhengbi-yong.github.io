# `@/lib/api` Module

## Layer 1: Module Overview

### Purpose
Centralized HTTP client and backend API integration with authentication, caching, retry logic, and error handling.

### Scope
- HTTP client with interceptors
- Token refresh mechanism
- Backend API endpoints
- Error translation and handling
- Request/response caching

## Layer 2: Architecture

### Files
- **apiClient.ts**: Core HTTP client with auth, caching, retries
- **backend.ts**: Backend-specific API endpoints

### Core Classes

#### APIClient (apiClient.ts)

**Responsibilities**:
- HTTP request/response handling
- Automatic token refresh
- Request caching
- Retry logic with exponential backoff
- Error translation (English → Chinese)

**Constructor**:
```typescript
constructor(baseURL: string = '')
```

**Request Options**:
```typescript
interface RequestOptions {
  cache?: boolean | number  // Cache control
  retries?: number          // Retry attempts
  retryDelay?: number       // Delay between retries (ms)
  timeout?: number          // Request timeout (ms)
  skipAuthRefresh?: boolean // Disable auto token refresh
}
```

**Methods**:
- `get<T>(url, options?)`
- `post<T>(url, data, options?)`
- `put<T>(url, data, options?)`
- `delete<T>(url, options?)`

---

#### Backend API (backend.ts)

**Responsibilities**:
- Typed API endpoints
- Token management
- Auth, posts, comments, users, admin operations

**Base URL**:
```typescript
const BACKEND_API_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3000/v1'
```

## Layer 3: Implementation Details

### Token Refresh Flow

```typescript
// Prevent multiple simultaneous refresh attempts
let refreshPromise: Promise<string> | null = null

export const refreshAccessToken = async (): Promise<string> => {
  if (refreshPromise) {
    return refreshPromise  // Return existing promise
  }

  refreshPromise = (async () => {
    try {
      const response = await api.post(`${BACKEND_API_URL}/auth/refresh`, ...)
      return response.access_token
    } finally {
      refreshPromise = null
    }
  })()

  return refreshPromise
}
```

**Benefits**:
- Single refresh request for multiple 401s
- Prevents refresh token spam
- Queues requests until refresh completes

### Caching Strategy

```typescript
interface RequestOptions {
  cache?: boolean | number
  // false = no cache
  // true = default cache (1 hour)
  // 300000 = custom TTL (5 minutes)
}
```

**Implementation**:
- Uses `@/lib/cache/CacheManager`
- Cache key = `${method}:${url}`
- Respects Cache-Control headers

### Retry Logic

```typescript
private async request<T>(...): Promise<T> {
  let lastError: Error

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fetch(...)
    } catch (error) {
      lastError = error
      if (attempt < retries) {
        await new Promise(resolve => setTimeout(resolve, retryDelay))
      }
    }
  }

  throw lastError
}
```

**Exponential Backoff**:
```typescript
retryDelay = retryDelay * Math.pow(2, attempt)
```

### Error Translation

```typescript
private translateErrorMessage(message: string): string {
  const translations: Record<string, string> = {
    'Invalid credentials': '用户名或密码错误',
    'User already exists': '用户已存在',
    'Access token expired': '登录已过期，请重新登录',
    // ... more mappings
  }

  return translations[message] || message
}
```

### Request Interceptors

**Add Auth Header**:
```typescript
private getRequestHeaders(): Record<string, string> {
  const headers = { ...this.defaultHeaders }

  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('access_token')
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }
  }

  return headers
}
```

**Handle 401 Responses**:
```typescript
if (response.status === 401 && !skipAuthRefresh) {
  try {
    const newToken = await refreshAccessToken()
    // Retry request with new token
    return this.request<T>(url, { ...options, skipAuthRefresh: true })
  } catch {
    // Redirect to login
  }
}
```

## Architecture Context

### Integration Points
- **Location**: `@/lib/api` → Data layer
- **Cache**: `@/lib/cache/CacheManager`
- **Error Handling**: `@/lib/error-handler`
- **Logging**: `@/lib/utils/logger`
- **Types**: `@/lib/types/backend`

### Design Patterns
- **Singleton**: Single APIClient instance
- **Interceptor Pattern**: Request/response transformation
- **Promise Queue**: Token refresh coordination
- **Factory Pattern**: API endpoint creation

### API Endpoints (backend.ts)

**Authentication**:
- `POST /auth/register` - User registration
- `POST /auth/login` - User login
- `POST /auth/logout` - User logout
- `POST /auth/refresh` - Refresh access token
- `GET /auth/me` - Get current user

**Posts**:
- `GET /posts` - List posts (paginated)
- `GET /posts/:slug` - Get post by slug
- `POST /posts/:slug/view` - Record view
- `POST /posts/:slug/like` - Toggle like
- `GET /posts/:slug/stats` - Get post stats

**Comments**:
- `GET /posts/:slug/comments` - List comments
- `POST /posts/:slug/comments` - Create comment
- `POST /comments/:id/like` - Like comment
- `DELETE /comments/:id` - Delete comment

**Admin**:
- `GET /admin/stats` - Dashboard stats
- `GET /admin/users` - List users
- `PUT /admin/users/:id/role` - Update user role
- `GET /admin/comments` - List all comments
- `PUT /admin/comments/:id/status` - Update comment status

### Usage Examples

**Authenticated Request**:
```typescript
import { apiClient } from '@/lib/api'

const posts = await apiClient.get<Post[]>('/posts')
```

**With Caching**:
```typescript
// Cache for 5 minutes
const posts = await apiClient.get('/posts', {
  cache: 5 * 60 * 1000
})
```

**With Retry**:
```typescript
const data = await apiClient.get('/api/unstable', {
  retries: 3,
  retryDelay: 1000
})
```

**Custom Backend API**:
```typescript
import * as backend from '@/lib/api/backend'

// Login
const { access_token } = await backend.login({
  username: 'user',
  password: 'pass'
})

// Get posts
const posts = await backend.getPosts({ page: 1, limit: 10 })

// Create comment
await backend.createComment(postSlug, {
  content: 'Great post!'
})
```

## Performance Considerations

**Caching**:
- Cache GET requests by default
- Invalidate cache on mutations
- Use short TTL for dynamic data

**Retries**:
- Only retry network errors, not 4xx errors
- Use exponential backoff
- Limit max retries (default: 3)

**Timeouts**:
- Default: 30 seconds
- Adjust for slow endpoints
- Fail fast for critical operations

## Error Handling

**AppError Types**:
- `NETWORK_ERROR`: Connection failed
- `AUTH_ERROR`: 401/403 responses
- `VALIDATION_ERROR`: 400 with field errors
- `NOT_FOUND`: 404 responses
- `SERVER_ERROR`: 5xx responses

**Best Practices**:
- Always handle errors in UI
- Show user-friendly messages (translated)
- Log errors for debugging
- Retry idempotent operations

## Dependencies

- `@/lib/cache`: CacheManager
- `@/lib/error-handler`: AppError, ErrorType
- `@/lib/utils/logger`: Logger instance
- `@/lib/types/backend`: TypeScript types

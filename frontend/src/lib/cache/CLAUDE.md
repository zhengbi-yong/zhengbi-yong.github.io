# `@/lib/cache` Module

## Layer 1: Module Overview

### Purpose
Unified caching system with memory and persistent storage options, TTL support, and automatic eviction.

### Scope
- In-memory caching (Map-based)
- LocalStorage persistence
- SessionStorage persistence
- TTL (time-to-live) expiration
- LRU eviction when full
- Cache registry for centralized management

## Layer 2: Architecture

### Files
- **CacheManager.ts**: Generic cache manager with storage backends
- **memory-cache.ts**: Specialized in-memory cache
- **index.ts**: Cache registry and exports

### Core Class: CacheManager

**Type Parameters**:
```typescript
class CacheManager<T = any>
```

**Constructor Options**:
```typescript
interface CacheOptions {
  ttl?: number       // Time-to-live in milliseconds
  maxSize?: number   // Maximum cache entries (default: 100)
  storage?: 'memory' | 'localStorage' | 'sessionStorage'
}

constructor(
  storageKey: string,
  options: CacheOptions = {},
  defaultTTL: number = 60 * 60 * 1000  // 1 hour default
)
```

## Layer 3: Implementation Details

### Cache Entry Structure

```typescript
interface CacheEntry<T> {
  value: T
  timestamp: number  // Creation time
  ttl: number        // Time-to-live in milliseconds
}
```

### Core Operations

#### Set Cache
```typescript
set(key: string, value: T, ttl?: number): void
```

**Behavior**:
- Creates entry with current timestamp
- Uses provided TTL or default TTL
- Evicts oldest entry if cache is full
- Persists to storage if not memory backend

**Example**:
```typescript
userCache.set('user:123', userData, 5 * 60 * 1000)  // 5 minutes
```

---

#### Get Cache
```typescript
get(key: string): T | null
```

**Behavior**:
- Returns cached value if exists and not expired
- Returns `null` if missing or expired
- Auto-removes expired entries

**Example**:
```typescript
const user = userCache.get('user:123')
if (user) {
  console.log('Cache hit!', user)
} else {
  console.log('Cache miss, fetching...')
}
```

---

#### Has Cache
```typescript
has(key: string): boolean
```

**Returns**: `true` if key exists and not expired

---

#### Delete Cache
```typescript
delete(key: string): boolean
```

**Returns**: `true` if entry was deleted

---

#### Clear Cache
```typescript
clear(): void
```

**Behavior**: Removes all entries and clears persistent storage

---

### Eviction Strategy

**LRU (Least Recently Used)**:
```typescript
private evictOldest(): void {
  let oldestKey: string | null = null
  let oldestTimestamp = Infinity

  for (const [key, entry] of this.cache) {
    if (entry.timestamp < oldestTimestamp) {
      oldestTimestamp = entry.timestamp
      oldestKey = key
    }
  }

  if (oldestKey) {
    this.cache.delete(oldestKey)
    this.saveToStorage()
  }
}
```

**Triggered**: When cache is full (`size >= maxSize`) and new key is added

### Storage Backends

#### Memory Storage
```typescript
storage: 'memory'
```
- Fastest access
- Lost on page refresh
- No serialization overhead

#### LocalStorage
```typescript
storage: 'localStorage'
```
- Persists across sessions
- 5-10MB limit (domain-wide)
- Requires JSON serialization

#### SessionStorage
```typescript
storage: 'sessionStorage'
```
- Persists until tab closed
- 5-10MB limit
- Requires JSON serialization

### Persistence Handling

**Save to Storage**:
```typescript
private saveToStorage(): void {
  if (this.storage === 'memory') return

  const data = JSON.stringify(Array.from(this.cache.entries()))
  window[this.storage].setItem(this.storageKey, data)
}
```

**Load from Storage**:
```typescript
private loadFromStorage(): void {
  const data = window[this.storage].getItem(this.storageKey)
  if (data) {
    const entries = JSON.parse(data)
    this.cache = new Map(entries)
  }
}
```

**Cleanup on Exit**:
```typescript
// Automatic in constructor/destructor
window.addEventListener('beforeunload', () => this.saveToStorage())
```

### Cache Registry

**Global Registry**:
```typescript
// index.ts
import { CacheManager } from './CacheManager'

export const CACHE_REGISTRY = {
  users: new CacheManager('users', { ttl: 30 * 60 * 1000 }),
  posts: new CacheManager('posts', { ttl: 60 * 60 * 1000 }),
  api: new CacheManager('api', { storage: 'localStorage' }),
  // ... more caches
}

export default CACHE_REGISTRY
```

**Benefits**:
- Centralized cache management
- Easy cache invalidation
- Shared configuration

### Expiration Check

```typescript
private isExpired(entry: CacheEntry<T>): boolean {
  const now = Date.now()
  const age = now - entry.timestamp
  return age > entry.ttl
}
```

**Triggered**: On every `get()` operation

## Architecture Context

### Integration Points
- **Location**: `@/lib/cache` → Data caching layer
- **Used By**: `@/lib/api` (API response caching), `@/lib/hooks` (data hooks)
- **Logging**: `@/lib/utils/logger`

### Design Patterns
- **Generic Class**: Type-safe cache for any data type
- **Strategy Pattern**: Pluggable storage backends
- **Registry Pattern**: Centralized cache management
- **LRU Eviction**: Automatic memory management

### Usage Examples

**Basic Usage**:
```typescript
import { CacheManager } from '@/lib/cache'

const userCache = new CacheManager('users', {
  ttl: 5 * 60 * 1000,  // 5 minutes
  maxSize: 50,
  storage: 'memory'
})

// Set cache
userCache.set('user:123', { name: 'John', age: 30 })

// Get cache
const user = userCache.get('user:123')

// Check if exists
if (userCache.has('user:123')) {
  // ...
}

// Delete specific entry
userCache.delete('user:123')

// Clear all
userCache.clear()
```

**Using Registry**:
```typescript
import { CACHE_REGISTRY as caches } from '@/lib/cache'

// Access pre-configured cache
caches.users.set('current', userData)
const user = caches.users.get('current')

// API response caching
caches.api.set('/posts', postsData, 10 * 60 * 1000)
const cached = caches.api.get('/posts')
```

**Persistent Storage**:
```typescript
const sessionCache = new CacheManager('session', {
  storage: 'sessionStorage',
  ttl: 24 * 60 * 60 * 1000  // 24 hours
})

// Survives page refresh
sessionCache.set('draft', blogPostContent)
```

## Performance Considerations

**Memory Storage**:
- Fastest: O(1) get/set
- Limited by heap size
- No serialization overhead

**LocalStorage/SessionStorage**:
- Slower: JSON parse/stringify
- Synchronous (blocks main thread)
- 5-10MB limit per domain

**Optimization Tips**:
1. Use memory cache for frequently accessed data
2. Use persistent storage for rarely changing data
3. Set appropriate TTLs to prevent stale data
4. Monitor cache size with `maxSize` limit
5. Clear unused caches to free memory

**Best Practices**:
- Cache expensive computations (API calls, complex calculations)
- Use shorter TTLs for dynamic data
- Use longer TTLs for static data
- Invalidate cache on mutations
- Don't cache large objects (>1MB)

## Advanced Features

### Cache Statistics (Future Enhancement)
```typescript
interface CacheStats {
  hits: number
  misses: number
  size: number
  hitRate: number
}

cache.getStats()  // { hits: 100, misses: 10, size: 50, hitRate: 0.91 }
```

### Cache Invalidation
```typescript
// Invalidate by pattern
cache.invalidate((key, value) => key.startsWith('user:'))

// Invalidate by predicate
cache.invalidate((key, value) => value.status === 'deleted')
```

### Cache Events
```typescript
cache.on('set', (key, value) => console.log(`Cached: ${key}`))
cache.on('get', (key, value) => console.log(`Retrieved: ${key}`))
cache.on('delete', (key) => console.log(`Deleted: ${key}`))
```

## Related Modules

- `@/lib/api`: Uses cache for HTTP responses
- `@/lib/hooks`: React Query hooks with cache integration
- `@/lib/utils/logger`: Cache operation logging

## Dependencies

- `@/lib/utils/logger`: Logger instance
- Browser APIs: `localStorage`, `sessionStorage`

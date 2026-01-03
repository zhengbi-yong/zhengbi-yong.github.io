# `@/lib/utils` Module

## Layer 1: Module Overview

### Purpose
Utility functions and helper methods for common operations (string formatting, date manipulation, class names, etc.).

### Scope
- String manipulation and formatting
- Date/time utilities
- Number formatting
- Class name merging (cn utility)
- Toast notifications
- Performance utilities
- Validation helpers

## Layer 2: Architecture

### Files
- **index.ts**: General utility exports
- **toast.ts**: Toast notification utilities
- **logger.ts**: Logging utilities
- **layout-algorithms.ts**: Layout calculation algorithms
- **recommendation-algorithm.ts**: Content recommendation logic

### Core Utilities

#### cn (Class Name Merger)

**Purpose**: Merge Tailwind CSS classes without conflicts

```typescript
import { cn } from '@/lib/utils'

cn('px-4 py-2', 'bg-blue-500')  // 'px-4 py-2 bg-blue-500'
cn('text-red-500', 'text-blue-500')  // 'text-blue-500' (last wins)
cn('px-4', undefined && 'py-2')  // 'px-4' (ignores undefined)
cn('dark:text-white', 'text-black')  // Respects dark mode
```

**Implementation**:
```typescript
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

**Dependencies**:
- `clsx`: Conditional class names
- `tailwind-merge`: Merge Tailwind classes intelligently

---

#### formatDate (Date Formatting)

```typescript
function formatDate(date: Date | string, locale: string = 'zh-CN'): string
```

**Usage**:
```typescript
formatDate(new Date())  // '2025年1月3日'
formatDate('2025-01-03', 'en-US')  // 'January 3, 2025'
```

---

#### formatNumber (Number Formatting)

```typescript
function formatNumber(num: number, locale: string = 'zh-CN'): string
```

**Usage**:
```typescript
formatNumber(1234567)  // '1,234,567'
formatNumber(3.14, 'en-US')  // '3.14'
```

---

#### truncate (String Truncation)

```typescript
function truncate(str: string, maxLength: number): string
```

**Usage**:
```typescript
truncate('Very long text...', 10)  // 'Very long...'
```

---

#### slugify (URL-Friendly Strings)

```typescript
function slugify(text: string): string
```

**Usage**:
```typescript
slugify('Hello World!')  // 'hello-world'
slugify('React & Redux')  // 'react-redux'
```

---

### Toast Utilities (toast.ts)

**Purpose**: Display non-intrusive notifications

**API**:
```typescript
import { toast } from '@/lib/utils/toast'

// Success toast
toast.success('操作成功！')

// Error toast
toast.error('操作失败，请重试')

// Info toast
toast.info('正在保存...')

// Warning toast
toast.warning('请注意')

// Custom toast
toast.show({
  message: '自定义消息',
  duration: 5000,
  position: 'top-right'
})
```

**Implementation**: Uses Sonner or similar toast library

---

### Logger (logger.ts)

**Purpose**: Structured logging with levels

```typescript
import { logger } from '@/lib/utils/logger'

logger.info('User logged in', { userId: '123' })
logger.error('API request failed', { error, endpoint: '/api/posts' })
logger.warn('Deprecated API used', { endpoint: '/api/old' })
logger.debug('Cache state', { cache })
```

**Levels**:
- `info`: General information
- `error`: Errors and exceptions
- `warn`: Warnings and deprecations
- `debug`: Detailed debugging info

---

### Layout Algorithms (layout-algorithms.ts)

**Purpose**: Calculate optimal layouts for grids, masonry, etc.

```typescript
// Masonry layout calculation
function calculateMasonryLayout(
  items: LayoutItem[],
  columnCount: number
): LayoutPosition[]

// Recommendation algorithm
function calculateRecommendations(
  currentItem: Item,
  allItems: Item[],
  options: RecommendationOptions
): Item[]
```

---

## Layer 3: Implementation Details

### String Utilities

**Slugify Algorithm**:
```typescript
function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')  // Remove special chars
    .replace(/[\s_-]+/g, '-')  // Replace spaces/underscores with hyphens
    .replace(/^-+|-+$/g, '')   // Remove leading/trailing hyphens
}
```

**Truncate Algorithm**:
```typescript
function truncate(str: string, maxLength: number, suffix: string = '...'): string {
  if (str.length <= maxLength) return str
  return str.slice(0, maxLength - suffix.length) + suffix
}
```

### Date Utilities

**Relative Time**:
```typescript
function formatRelativeTime(date: Date | string): string {
  const now = new Date()
  const past = new Date(date)
  const diffMs = now.getTime() - past.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return '刚刚'
  if (diffMins < 60) return `${diffMins}分钟前`
  if (diffHours < 24) return `${diffHours}小时前`
  if (diffDays < 7) return `${diffDays}天前`

  return formatDate(past)
}

// Examples:
// '刚刚', '5分钟前', '2小时前', '3天前', '2024年12月28日'
```

### Validation Utilities

**Email Validation**:
```typescript
function isValidEmail(email: string): boolean {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return regex.test(email)
}
```

**URL Validation**:
```typescript
function isValidUrl(url: string): boolean {
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}
```

**UUID Validation**:
```typescript
function isValidUuid(uuid: string): boolean {
  const regex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  return regex.test(uuid)
}
```

### Performance Utilities

**Debounce**:
```typescript
function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null

  return function (...args: Parameters<T>) {
    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

// Usage
const debouncedSearch = debounce((query: string) => {
  console.log('Searching:', query)
}, 300)
```

**Throttle**:
```typescript
function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean

  return function (...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args)
      inThrottle = true
      setTimeout(() => inThrottle = false, limit)
    }
  }
}
```

**Async Retry**:
```typescript
async function retry<T>(
  fn: () => Promise<T>,
  options: { retries?: number; delay?: number } = {}
): Promise<T> {
  const { retries = 3, delay = 1000 } = options

  for (let i = 0; i < retries; i++) {
    try {
      return await fn()
    } catch (error) {
      if (i === retries - 1) throw error
      await new Promise(resolve => setTimeout(resolve, delay * (i + 1)))
    }
  }

  throw new Error('Max retries reached')
}
```

## Architecture Context

### Integration Points
- **Location**: `@/lib/utils` → Shared utilities
- **Used By**: All modules requiring helper functions
- **No Dependencies**: Pure functions (mostly)

### Design Patterns
- **Pure Functions**: No side effects, predictable output
- **Composition**: Small utilities composed into complex logic
- **Type Safety**: Full TypeScript support

### Usage Examples

**Component Utilities**:
```typescript
import { cn, truncate, formatDate } from '@/lib/utils'

function PostCard({ post }) {
  return (
    <article className={cn('p-4', 'hover:bg-gray-100', post.featured && 'bg-yellow-50')}>
      <h2 className="text-xl">{truncate(post.title, 50)}</h2>
      <p className="text-sm text-gray-500">{formatDate(post.date)}</p>
    </article>
  )
}
```

**Form Validation**:
```typescript
import { isValidEmail, isValidUrl } from '@/lib/utils'

function validateForm(data: FormData) {
  const errors = []

  if (!isValidEmail(data.email)) {
    errors.push('Invalid email address')
  }

  if (data.website && !isValidUrl(data.website)) {
    errors.push('Invalid website URL')
  }

  return errors
}
```

**Performance Optimization**:
```typescript
import { debounce } from '@/lib/utils'

function SearchBar() {
  const [query, setQuery] = useState('')

  const debouncedSearch = useMemo(
    () => debounce((q: string) => {
      fetch(`/api/search?q=${q}`)
    }, 300),
    []
  )

  useEffect(() => {
    debouncedSearch(query)
  }, [query, debouncedSearch])
}
```

## Testing

**Unit Tests**:
```typescript
import { slugify, truncate, formatDate } from '@/lib/utils'

describe('slugify', () => {
  it('converts spaces to hyphens', () => {
    expect(slugify('hello world')).toBe('hello-world')
  })

  it('removes special characters', () => {
    expect(slugify('hello@world!')).toBe('helloworld')
  })
})

describe('truncate', () => {
  it('truncates long strings', () => {
    expect(truncate('very long text', 10)).toBe('very lo...')
  })

  it('returns short strings unchanged', () => {
    expect(truncate('short', 10)).toBe('short')
  })
})
```

## Best Practices

1. **Pure Functions**: Avoid side effects when possible
2. **Type Safety**: Provide type definitions
3. **Documentation**: JSDoc comments for complex functions
4. **Testing**: Unit tests for all utilities
5. **Performance**: Optimize hot paths

## Dependencies

- `clsx`: Conditional class names
- `tailwind-merge`: Tailwind class merging
- Date-fns (optional): Date manipulation
- Toast library: Sonner or react-hot-toast

## Related Modules

- `@/components`: Components using utilities
- `@/lib/hooks`: Hooks using utilities
- All modules: General-purpose helpers

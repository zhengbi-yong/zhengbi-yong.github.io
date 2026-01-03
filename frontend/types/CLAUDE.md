# Frontend TypeScript Types Directory

## Purpose
TypeScript type definitions, interfaces, and declaration files for frontend type safety.

## Directory Structure

```
frontend/types/
├── body-scroll-lock.d.ts      # body-scroll-lock types
├── canvas-confetti.d.ts       # Confetti animation types
├── chemistry.ts               # Chemistry-related types
├── common.ts                  # Shared/common types
├── css-modules.d.ts           # CSS module declarations
├── rdkit.d.ts                 # RDKit chemistry library types
└── three-examples.d.ts        # Three.js example types
```

## Type Definitions

### 1. Common Types (`common.ts`)
**Purpose**: Shared type definitions used across the application

**Key Types**:

#### Responsive & UI
```typescript
export type Breakpoint = 'sm' | 'md' | 'lg' | 'xl' | '2xl'
export type Theme = 'light' | 'dark' | 'system'
export type Language = 'en' | 'zh-CN'
```

#### Article/Blog Types
```typescript
export interface ArticleMeta {
  id: string
  title: string
  description: string
  date: string
  modified?: string
  image?: string
  tags: string[]
  category: string
  author: string
  status: 'draft' | 'published'
  featured?: boolean
  readingTime: number
  wordCount: number
  path: string
}

export interface Article extends ArticleMeta {
  content: string
  toc?: TableOfContentsItem[]
}

export interface TableOfContentsItem {
  id: string
  title: string
  level: number
}
```

#### Analytics Types
```typescript
export interface PageView {
  path: string
  title: string
  timestamp: number
  referrer?: string
  userAgent?: string
  sessionId: string
}

export interface ArticleAnalytics {
  articleId: string
  views: number
  uniqueViews: number
  totalReadingTime: number
  averageReadingTime: number
  scrollDepth: {
    25: number
    50: number
    75: number
    100: number
  }
  engagementScore: number
  lastUpdated: number
}
```

#### Search Types
```typescript
export interface SearchResult {
  id: string
  title: string
  description: string
  url: string
  category: string
  tags: string[]
  score: number
}

export interface SearchOptions {
  query: string
  category?: string
  tags?: string[]
  limit?: number
}
```

#### API Response Types
```typescript
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
  }
}
```

#### Form Types
```typescript
export interface FormField {
  name: string
  label: string
  type: 'text' | 'email' | 'password' | 'textarea' | 'select' | 'checkbox' | 'radio'
  placeholder?: string
  required?: boolean
  options?: Array<{
    label: string
    value: string
  }>
  validation?: {
    min?: number
    max?: number
    pattern?: string
    message?: string
  }
}

export interface FormState {
  values: Record<string, any>
  errors: Record<string, string>
  touched: Record<string, boolean>
  isSubmitting: boolean
  isValid: boolean
}
```

#### Utility Types
```typescript
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P]
}

export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>

export type OptionalFields<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>
```

### 2. Chemistry Types (`chemistry.ts`)
**Purpose**: Type definitions for chemistry visualization and molecular rendering

**Usage**: RDKit.js integration, 3D molecular visualization

### 3. Library Declaration Files

#### body-scroll-lock.d.ts
**Library**: `body-scroll-lock`

**Purpose**: Prevent body scroll when modals/open

#### canvas-confetti.d.ts
**Library**: `canvas-confetti`

**Purpose**: Celebration/confetti animations

#### rdkit.d.ts
**Library**: RDKit.js

**Purpose**: Chemistry molecule processing and rendering

#### three-examples.d.ts
**Library**: Three.js examples

**Purpose**: 3D visualization examples and helpers

#### css-modules.d.ts
**Purpose**: CSS module type declarations

**Pattern**:
```typescript
declare module '*.css' {
  const content: { [className: string]: string }
  export default content
}

declare module '*.module.css' {
  const classes: { [key: string]: string }
  export default classes
}
```

## Type Usage Patterns

### Import Pattern
```typescript
import type { Article, SearchResult, ApiResponse } from '@/types/common'
```

### Type Guards
```typescript
export function isValidArticle(data: unknown): data is Article {
  // Runtime validation logic
  return typeof data === 'object' && data !== null &&
    'title' in data && 'content' in data
}
```

### Generic Types
```typescript
async function fetchApi<T>(url: string): Promise<ApiResponse<T>> {
  const response = await fetch(url)
  return response.json()
}

// Usage
const result = await fetchApi<Article[]>('/api/posts')
```

## Type Safety Best Practices

### 1. Strict Mode
```json
// tsconfig.json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true
  }
}
```

### 2. Type Imports
```typescript
// ✅ Good: Type-only import
import type { Article } from '@/types/common'

// ❌ Avoid: Value import when only type needed
import { Article } from '@/types/common'
```

### 3. Discriminated Unions
```typescript
type Response =
  | { success: true; data: Article }
  | { success: false; error: string }

function handleResponse(res: Response) {
  if (res.success) {
    console.log(res.data.title) // Type narrowing
  }
}
```

### 4. Branding for Primitive Types
```typescript
type UserId = string & { readonly __brand: unique symbol }
type PostId = string & { readonly __brand: unique symbol }

// Prevents accidental assignment
const userId: UserId = '123' as UserId
const postId: PostId = userId // Error: Type mismatch
```

## Declaration File Maintenance

### Adding New Declaration Files
1. Create file: `libname.d.ts`
2. Export types or declare module
3. Include in `tsconfig.json` if needed

### Module Declaration Pattern
```typescript
// For npm packages without types
declare module 'some-library' {
  export interface Options {
    // ...
  }

  export function init(options: Options): void
}
```

### Global Declaration Pattern
```typescript
// For global variables
declare global {
  interface Window {
    myCustomProperty: string
  }
}

export {}
```

## Type Validation

### Runtime Validation with Zod
```typescript
import { z } from 'zod'

const ArticleSchema = z.object({
  id: z.string(),
  title: z.string(),
  content: z.string(),
  // ...
})

type Article = z.infer<typeof ArticleSchema>
```

### API Response Validation
```typescript
import { isValidSiteMetadata } from '@/types/common'

const data = await fetch('/api/metadata').then(r => r.json())
if (isValidSiteMetadata(data)) {
  // Use data with type safety
  console.log(data.title)
}
```

## Related Modules
- `frontend/src/lib/` - Utility functions using these types
- `frontend/tsconfig.json` - TypeScript configuration
- `contentlayer/generated` - Generated content types
- `backend/crates/shared/src/api_response.rs` - Backend API types

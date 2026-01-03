# Tag Pagination Page

## Module Overview
**Path**: `frontend/src/app/tags/[tag]/page/[page]/page.tsx`
**Layer**: 3 (Leaf Component)
**Type**: Server Component - Dynamic Route with Static Generation

Implements paginated tag-based blog listing with static generation for optimal performance. Handles URL encoding/decoding and validates pagination parameters.

## Purpose
Server-rendered page that displays blog posts filtered by tag with pagination support. Generates static pages for all tag/page combinations at build time.

## Core Responsibilities

### Static Generation
- Generate all possible `(tag, page)` combinations via `generateStaticParams`
- Calculate total pages per tag based on `POSTS_PER_PAGE` (50 posts)
- Encode/decode tags for URL-safe routing

### Data Filtering & Pagination
- Filter `allBlogs` (Contentlayer generated) by tag using `github-slugger`
- Sort filtered posts using Pliny's `sortPosts`
- Slice posts array for current page
- Handle edge cases (invalid page numbers, empty pages)

### Route Validation
- Return 404 for invalid page numbers (≤ 0, > totalPages, NaN)
- Validate page parameter before rendering

## Technical Implementation

### Routing Strategy
- **Dynamic Route**: `[tag]/[page]` nested dynamic segments
- **URL Encoding**:
  - Static: `encodeURI(tag)` for route generation
  - Runtime: `decodeURI(params.tag)` for retrieval
- **Slug Matching**: Uses `github-slugger` for consistent tag slugs

### Static Generation
```typescript
export const generateStaticParams = async () => {
  const tagCounts = tagData as Record<string, number>
  return Object.keys(tagCounts).flatMap((tag) => {
    const postCount = tagCounts[tag]
    const totalPages = Math.max(1, Math.ceil(postCount / POSTS_PER_PAGE))
    return Array.from({ length: totalPages }, (_, i) => ({
      tag: encodeURI(tag),
      page: (i + 1).toString(),
    }))
  })
}
```

### Data Processing Pipeline
```
1. allBlogs (Contentlayer generated)
   ↓
2. Filter by tag (slug matching)
   ↓
3. Sort posts (date/descending)
   ↓
4. Extract core content (allCoreContent)
   ↓
5. Slice for pagination
   ↓
6. Pass to ListLayout component
```

## Dependencies

### Content Management
```typescript
import { allCoreContent, sortPosts } from 'pliny/utils/contentlayer'
import { allBlogs } from 'contentlayer/generated'
import { slug } from 'github-slugger'
import tagData from '@/app/tag-data.json'
```

### Routing
```typescript
import { notFound } from 'next/navigation'
```

### UI Component
```typescript
import ListLayout from '@/components/layouts/ListLayoutWithTags'
```

## Component Structure

```
TagPage (Server Component)
├── Route Parameter Extraction
│   ├── tag (decoded from URL)
│   └── page (parsed as integer)
├── Tag Title Formatting
│   └── Capitalize + space handling
├── Data Filtering
│   ├── Filter allBlogs by tag slug
│   ├── Sort by date
│   └── Extract core content
├── Pagination Logic
│   ├── Calculate totalPages
│   ├── Validate page number
│   └── Slice posts array
├── 404 Check
│   └── notFound() for invalid pages
└── ListLayout Render
    ├── All filtered posts
    ├── Initial display posts (sliced)
    ├── Pagination metadata
    └── Formatted title
```

## Data Structures

### Input Parameters
```typescript
interface TagPageParams {
  tag: string    // URL-encoded tag (e.g., "react%20hooks")
  page: string   // Page number as string
}
```

### Pagination Metadata
```typescript
interface Pagination {
  currentPage: number
  totalPages: number
}
```

### Tag Data Structure
```typescript
// tagData.json
{
  "react": 15,
  "nextjs": 8,
  "typescript": 12
}
```

## URL Handling

### Encoding
- **Static Generation**: `encodeURI(tag)` converts spaces to `%20`
- **Example**: "React Hooks" → "react-hooks" (slug) → `encodeURI` preserves hyphen

### Decoding
- **Runtime**: `decodeURI(params.tag)` restores original tag name
- **Title Formatting**: Capitalizes first letter, preserves spaces/hyphens

### Title Transformation
```typescript
const tag = "web-development"
const title = tag[0].toUpperCase() + tag.split(' ').join('-').slice(1)
// Result: "Web-development"
```

## Pagination Logic

### Constants
```typescript
const POSTS_PER_PAGE = 50
```

### Page Calculation
```typescript
const totalPages = Math.ceil(filteredPosts.length / POSTS_PER_PAGE)
const start = POSTS_PER_PAGE * (pageNumber - 1)
const end = POSTS_PER_PAGE * pageNumber
const initialDisplayPosts = filteredPosts.slice(start, end)
```

### Validation
```typescript
// Returns 404 if:
if (pageNumber <= 0 ||        // Negative or zero
    pageNumber > totalPages || // Beyond last page
    isNaN(pageNumber)) {       // Not a number
  return notFound()
}
```

## Build-Time Generation

### Static Path Generation
```
For tag "react" with 120 posts:
  totalPages = ceil(120 / 50) = 3

Generated paths:
  /tags/react/page/1
  /tags/react/page/2
  /tags/react/page/3
```

### Performance Optimization
- **Zero Runtime API Calls**: All data fetched at build time
- **Incremental Static Regeneration**: Supports ISR with Contentlayer
- **Pre-rendered HTML**: No client-side JavaScript for content

## Error Handling

### 404 Conditions
1. Page number ≤ 0
2. Page number > total pages
3. Page number is NaN
4. Tag doesn't exist (handled by Next.js 404 automatically)

### Edge Cases
- Empty tag pages: `Math.max(1, ...)` ensures at least page 1
- Tag with 0 posts: Not generated in `generateStaticParams`
- Invalid URL encoding: `decodeURI` throws, caught by Next.js error boundary

## ListLayout Integration

### Props Passed
```typescript
<ListLayout
  posts={filteredPosts}           // All posts for this tag
  initialDisplayPosts={initialDisplayPosts}  // Page 1 posts
  pagination={{
    currentPage: pageNumber,
    totalPages: totalPages,
  }}
  title={title}  // Formatted tag name
/>
```

### Component Responsibilities
- Render post cards with metadata
- Pagination controls (prev/next/page numbers)
- Tag filtering UI
- Search functionality

## SEO Considerations

### Meta Tags (inherited from layout)
- Dynamic title: `{tag} - Page {page}`
- Canonical URLs with pagination
- Structured data for blog posts

### Performance
- Static generation → fast page loads
- Pre-rendered HTML → SEO friendly
- No client-side fetching → Core Web Vitals optimized

## Accessibility
- Semantic HTML structure (inherited from ListLayout)
- Keyboard navigation support
- Screen reader friendly pagination
- Proper heading hierarchy

## Future Enhancements
- Infinite scroll option
- Posts per page customization
- Tag combination filtering
- RSS feed per tag
- Export filtered posts as PDF
- Tag following/notification system

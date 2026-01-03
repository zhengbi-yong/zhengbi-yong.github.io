# `@/lib/db` Module

## Layer 1: Module Overview

### Purpose
Blog database abstraction layer for content management, providing type-safe access to blog posts, categories, tags, and metadata.

### Scope
- Blog post CRUD operations
- Category and tag management
- Content search and filtering
- Slug generation and validation
- Metadata handling

## Layer 2: Architecture

### Files
- **blog-db.ts**: Blog database interface and operations

### Core Interface: BlogDatabase

**Type Parameters**: None (concrete implementation)

**Responsibilities**:
- Load blog content from filesystem
- Parse frontmatter and content
- Provide query methods
- Manage categories and tags

## Layer 3: Implementation Details

### Data Structure

**Blog Post Schema**:
```typescript
interface BlogPost {
  slug: string           // URL-friendly identifier
  title: string          // Post title
  content: string        // Markdown/MDX content
  excerpt: string        // Short description
  date: Date             // Publication date
  modified?: Date        // Last modified date
  author: string         // Author name
  categories: string[]   // Category hierarchy
  tags: string[]         // Flat tags
  image?: string         // Featured image URL
  draft: boolean         // Draft status
  featured?: boolean     // Featured post flag
}
```

### Core Operations

#### Get All Posts
```typescript
getAllPosts(): BlogPost[]
```
**Returns**: All published posts (excluding drafts) sorted by date (newest first)

---

#### Get Post by Slug
```typescript
getPost(slug: string): BlogPost | undefined
```
**Returns**: Post matching slug, or `undefined` if not found

---

#### Get Posts by Category
```typescript
getPostsByCategory(category: string): BlogPost[]
```
**Returns**: All posts in specified category

---

#### Get Posts by Tag
```typescript
getPostsByTag(tag: string): BlogPost[]
```
**Returns**: All posts with specified tag

---

#### Search Posts
```typescript
searchPosts(query: string): BlogPost[]
```
**Behavior**: Searches title, excerpt, and content for query string

---

#### Get Categories
```typescript
getCategories(): Category[]
```
**Returns**: Unique categories with post counts

---

#### Get Tags
```typescript
getTags(): Tag[]
```
**Returns**: Unique tags with post counts

---

### Content Loading

**Filesystem Reading**:
```typescript
import fs from 'fs'
import path from 'path'

const postsDir = path.join(process.cwd(), 'content/posts')
const files = fs.readdirSync(postsDir)

for (const file of files) {
  const filePath = path.join(postsDir, file)
  const content = fs.readFileSync(filePath, 'utf-8')
  const { data, content } = parseFrontmatter(content)
  // ...
}
```

**Frontmatter Parsing**:
```yaml
---
title: My Blog Post
date: 2025-01-03
categories: [Technology, React]
tags: [nextjs, typescript]
featured: true
draft: false
---

Post content in Markdown...
```

### Slug Generation

**Algorithm**:
```typescript
function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')  // Remove special chars
    .replace(/\s+/g, '-')       // Replace spaces with hyphens
    .replace(/-+/g, '-')        // Replace multiple hyphens
    .trim()
}

// "My Awesome Post!" → "my-awesome-post"
```

### Content Parsing

**Extract Metadata**:
```typescript
function parsePost(content: string): BlogPost {
  const { data, content: body } = parseFrontmatter(content)

  return {
    slug: data.slug || generateSlug(data.title),
    title: data.title,
    content: body,
    excerpt: data.excerpt || extractExcerpt(body),
    date: new Date(data.date),
    categories: data.categories || [],
    tags: data.tags || [],
    draft: data.draft || false,
    // ...
  }
}
```

### Query Methods

**Filter by Draft Status**:
```typescript
const publishedPosts = posts.filter(post => !post.draft)
```

**Sort by Date**:
```typescript
const sortedPosts = posts.sort((a, b) =>
  new Date(b.date).getTime() - new Date(a.date).getTime()
)
```

**Search Implementation**:
```typescript
function searchPosts(query: string): BlogPost[] {
  const lowerQuery = query.toLowerCase()

  return posts.filter(post =>
    post.title.toLowerCase().includes(lowerQuery) ||
    post.excerpt.toLowerCase().includes(lowerQuery) ||
    post.content.toLowerCase().includes(lowerQuery)
  )
}
```

## Architecture Context

### Integration Points
- **Location**: `@/lib/db` → Data layer
- **Content Source**: `content/posts/` directory
- **Used By**: `@/lib/hooks` (React hooks), Page components

### Design Patterns
- **Repository Pattern**: Abstract data access
- **Singleton**: Single BlogDatabase instance
- **Factory Pattern**: Create blog post objects from files

### Usage Examples

**Get All Posts**:
```typescript
import { blogDb } from '@/lib/db'

const posts = blogDb.getAllPosts()
```

**Get Single Post**:
```typescript
const post = blogDb.getPost('my-awesome-post')
if (post) {
  console.log(post.title)
}
```

**Get Category Posts**:
```typescript
const reactPosts = blogDb.getPostsByCategory('Technology')
```

**Search**:
```typescript
const results = blogDb.searchPosts('react hooks')
```

**Get Metadata**:
```typescript
const categories = blogDb.getCategories()
// [{ name: 'Technology', count: 15 }, ...]

const tags = blogDb.getTags()
// [{ name: 'react', count: 8 }, ...]
```

### Page Integration

**Dynamic Route** (`app/blog/[slug]/page.tsx`):
```typescript
import { blogDb } from '@/lib/db'

export default function BlogPostPage({ params }) {
  const post = blogDb.getPost(params.slug)

  if (!post) return <NotFound />

  return <article>{post.content}</article>
}
```

**Static Generation**:
```typescript
export async function generateStaticParams() {
  const posts = blogDb.getAllPosts()

  return posts.map(post => ({
    slug: post.slug
  }))
}
```

## Performance Considerations

**Optimization Strategies**:

1. **Lazy Loading**: Load posts on demand, not all at once
2. **Caching**: Cache parsed posts in memory
3. **Incremental Builds**: Only rebuild changed posts
4. **Pagination**: Limit query results
5. **Indexing**: Build search index for faster queries

**Memory Usage**:
- Each post ~10-50KB (depending on content)
- 100 posts = ~1-5MB memory
- Monitor with `process.memoryUsage()`

**Build Performance**:
- Parse posts at build time (not runtime)
- Use Next.js ISR (Incremental Static Regeneration)
- Cache parsed posts between builds

## Future Enhancements

**Database Backend**:
```typescript
interface BlogDatabase {
  // Current: Filesystem
  // Future: Database (PostgreSQL, MongoDB, etc.)

  connect(): Promise<void>
  disconnect(): Promise<void>
}
```

**Full-Text Search**:
```typescript
// Integrate with search library (Lunr.js, FlexSearch)
interface SearchOptions {
  fields?: ('title' | 'content' | 'tags')[]
  fuzzy?: boolean
  limit?: number
}

blogDb.searchPosts('react', { fields: ['title'], fuzzy: true })
```

**Relationships**:
```typescript
// Related posts based on tags/categories
blogDb.getRelatedPosts(post.slug, { limit: 3 })
```

## Dependencies

- `fs`: Filesystem access (Node.js)
- `path`: Path manipulation
- `gray-matter` (likely): Frontmatter parsing
- `date-fns` (likely): Date formatting

## Related Modules

- `@/lib/hooks/useBlogData`: React hooks for data fetching
- `@/lib/api`: Backend API integration
- `@/lib/types`: TypeScript type definitions

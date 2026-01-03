# Layouts Module Documentation

## Overview

This module provides specialized layout components for different content types and display scenarios. All layouts support responsive design, SEO optimization, and performance features like caching and preloading.

## Components

### ListLayout
**File**: `ListLayout.tsx`

Main blog listing layout with advanced features:
- Real-time search across titles, summaries, and tags
- Infinite scroll with Intersection Observer
- Batch rendering (15 items per batch)
- Blog post caching via Zustand store
- Aggressive post preloading with `requestIdleCallback`
- Pagination support
- Skeleton loading states

**Props**:
```typescript
interface ListLayoutProps {
  posts: CoreContent<Blog>[]          // All blog posts
  title: string                        // Section title
  initialDisplayPosts?: CoreContent<Blog>[]  // Featured posts (shown first)
  pagination?: {
    totalPages: number
    currentPage: number
  }
}
```

**Features**:
- Search state persistence across navigation
- Progressive loading with smooth animations
- Optimized filtering with `useMemo`
- Scroll-based and observer-based infinite scroll
- Chinese UI labels

**Usage**:
```tsx
import ListLayout from '@/components/layouts/ListLayout'

<ListLayout
  posts={allPosts}
  title="博客"
  initialDisplayPosts={featuredPosts}
  pagination={{ totalPages: 10, currentPage: 1 }}
/>
```

### ListLayoutWithTags
**File**: `ListLayoutWithTags.tsx`

Extended version of ListLayout with tag filtering support. Inherits all ListLayout features and adds:
- Tag-based filtering
- Active tag state management
- Tag count display

**Additional Props**:
```typescript
interface ListLayoutWithTagsProps extends ListLayoutProps {
  availableTags?: string[]  // All available tags
  activeTag?: string        // Currently selected tag
}
```

### PostLayout
**File**: `PostLayout.tsx`

Full-featured article layout with:
- Three-column responsive layout (TOC | Content | Comments)
- Schema.org structured data (BlogPosting, BreadcrumbList)
- Reading progress tracking with backend integration
- Article analytics
- Related articles sidebar
- Floating table of contents
- Backend comment integration
- Mobile-optimized floating TOC

**Props**:
```typescript
interface LayoutProps {
  content: CoreContent<Blog>           // Article content
  authorDetails: CoreContent<Authors>[] // Author information
  next?: { path: string; title: string }
  prev?: { path: string; title: string }
  children: ReactNode                  // Article MDX content
  toc?: TOC                            // Table of contents
  showTOC?: boolean                    // TOC visibility
}
```

**Layout Structure** (xl screens):
- Left (1fr): Sticky TOC
- Center (3fr): Article content
- Right (1fr): Related articles (38.2%) + Comments (61.8%)

**SEO Features**:
- JSON-LD structured data for BlogPosting
- BreadcrumbList schema
- Open Graph image meta tags
- Article reading time
- Author metadata

### PostSimple
**File**: `PostSimple.tsx`

Simplified article layout for minimal display:
- Single column layout
- No TOC or sidebars
- Lightweight rendering
- Mobile-first design

**Use Case**: Pages without complex features (about pages, simple posts)

### PostBanner
**File**: `PostBanner.tsx`

Banner-style layout for featured content:
- Hero image display
- Overlay text
- Call-to-action buttons
- Gradient backgrounds

### MagazineLayout
**File**: `MagazineLayout.tsx`

Magazine-style layout integrating multiple components:
- Hero section (featured article + book grid)
- Filter bar (categories, sort, search)
- Masonry grid layout
- Smart recommendations based on reading history

**Props**:
```typescript
interface MagazineLayoutProps {
  featuredArticle?: {
    title: string
    summary: string
    date: string
    readTime: string
    image: string
    slug: string
    tags: string[]
  }
  latestBooks?: Array<{
    name: string
    description?: string
    image: string
    href?: string
  }>
  allItems?: ContentItem[]
  readHistory?: ContentItem[]
  categories?: string[]
}
```

**Feature Flags**:
- `magazineLayout`: Enable magazine components
- `masonryGrid`: Enable masonry layout
- `recommendations`: Enable smart recommendations

### BookDetailLayout
**File**: `BookDetailLayout.tsx`

Dedicated layout for book detail pages:
- Book metadata display
- Chapter listings
- Reading progress
- Related books

### BookShelfLayout
**File**: `BookShelfLayout.tsx`

Grid layout for displaying book collections:
- Responsive grid (auto-fit)
- Filter by category/status
- Search functionality
- Quick preview on hover

### AuthorLayout
**File**: `AuthorLayout.tsx`

Author profile and article listing:
- Author bio and avatar
- Social links
- Publication list
- Stats display

## Shared Components

### Pagination
**File**: `ListLayout.tsx` (internal component)

Reusable pagination with:
- Previous/Next navigation
- Current page indicator
- Disabled state styling
- URL path generation

**Usage**:
```tsx
<Pagination totalPages={10} currentPage={2} />
```

## Data Flow

### Blog Cache Management
```
ListLayout
  ↓ (initial load)
useBlogStore.setAllPosts(posts)
  ↓ (subsequent visits)
useBlogStore.allPosts (cached)
  ↓
Faster rendering, no refetch
```

### Search State Flow
```
User input → setSearchValue
  ↓
useBlogStore.setSearchQuery
  ↓
Persisted in URL/store
  ↓
Restored on navigation back
```

### Preloading Pipeline
```
ListLayout mounted
  ↓
Extract all post slugs
  ↓
postPreloader.preloadPosts(slugs, 'low')
  ↓
requestIdleCallback
  ↓
Batch prefetch in background
```

## Performance Optimizations

1. **Memoization**: All filtered lists computed with `useMemo`
2. **Lazy Loading**: Intersection Observer for infinite scroll
3. **Throttling**: 100ms minimum between load batches
4. **Request Animation Frame**: Smooth UI updates
5. **Request Idle Callback**: Non-blocking preloading
6. **Progressive Rendering**: 15-item batches
7. **Code Splitting**: Dynamic imports for heavy components

## Styling

- **Framework**: Tailwind CSS
- **Dark Mode**: Fully supported with `dark:` prefixes
- **Responsive**: Mobile-first breakpoints
- **Animations**: Framer Motion for transitions
- **Typography**: Prose classes for article content

## State Management

**Store**: `@/lib/store/blog-store`

```typescript
interface BlogStore {
  allPosts: CoreContent<Blog>[]
  setAllPosts: (posts: CoreContent<Blog>[]) => void
  isCacheValid: () => boolean
  searchQuery: string
  setSearchQuery: (query: string) => void
}
```

## Integration Points

### With Next.js
- Uses `usePathname` for pagination URLs
- Compatible with App Router
- Supports dynamic routes (`[slug]`, `page/[page]`)

### With Contentlayer
- Uses `CoreContent<Blog>` type
- Imports from `contentlayer/generated`
- Type-safe blog post data

### With Analytics
- `ArticleAnalytics` component in PostLayout
- Reading progress tracking via API
- Comment system integration

## Dependencies

```
- react (useState, useMemo, useEffect, useRef, useCallback)
- next/navigation (usePathname)
- pliny/utils (formatDate, contentlayer)
- framer-motion (SlideIn, FadeIn)
- zustand (useBlogStore)
- @/lib/utils/post-preloader
- @/components/animations
- @/components/loaders
```

## Usage Examples

### Blog Listing Page
```tsx
// app/blog/page.tsx
export default function BlogPage({ allPosts }) {
  const totalPages = Math.ceil(allPosts.length / POSTS_PER_PAGE)

  return (
    <ListLayout
      posts={allPosts}
      title="博客"
      initialDisplayPosts={allPosts.slice(0, POSTS_PER_PAGE)}
      pagination={{ totalPages, currentPage: 1 }}
    />
  )
}
```

### Article Page
```tsx
// app/blog/[slug]/page.tsx
export default function ArticlePage({ post, authorDetails, toc }) {
  return (
    <PostLayout
      content={post}
      authorDetails={authorDetails}
      toc={toc}
      showTOC={true}
    >
      <MDXContent />
    </PostLayout>
  )
}
```

### Magazine Homepage
```tsx
// app/page.tsx
export default function HomePage() {
  return (
    <MagazineLayout
      featuredArticle={featuredPost}
      latestBooks={books}
      allItems={contentItems}
      readHistory={userHistory}
      categories={['全部', '机器人', '控制', '感知']}
    />
  )
}
```

## Best Practices

1. **Always provide `posts` prop** - Required for cache initialization
2. **Use `initialDisplayPosts` for featured content** - Optimizes initial render
3. **Enable pagination for large lists** - Improves UX
4. **Leverage search state persistence** - Maintains user context
5. **Customize batch size for your content** - Default is 15 items
6. **Monitor cache validity** - Store handles this automatically
7. **Use feature flags for new layouts** - Safe rollout strategy

## File Structure

```
layouts/
├── ListLayout.tsx           # Main blog listing
├── ListLayoutWithTags.tsx   # Blog listing with tags
├── PostLayout.tsx           # Full article layout
├── PostSimple.tsx           # Simple article layout
├── PostBanner.tsx           # Banner layout
├── MagazineLayout.tsx       # Magazine layout
├── BookDetailLayout.tsx     # Book detail page
├── BookShelfLayout.tsx      # Book collection
└── AuthorLayout.tsx         # Author profile
```

## Notes

- All layouts are responsive by default
- Chinese UI labels (can be localized)
- SEO-optimized with structured data
- Performance-oriented with caching
- Accessibility: semantic HTML, ARIA labels
- Dark mode support throughout

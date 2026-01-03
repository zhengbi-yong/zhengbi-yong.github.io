# Magazine Components Module Documentation

## Overview

This module provides magazine-style components for rich, visual content presentation. Components include hero sections, masonry grids, filtering, and smart recommendations. All components feature smooth animations and responsive design.

## Components

### HeroSection
**File**: `HeroSection.tsx`

Featured article and book grid hero section (40vh height).

**Props**:
```typescript
interface HeroSectionProps {
  featuredArticle: {
    title: string
    summary: string
    date: string
    readTime: string
    image: string
    slug: string
    tags: string[]
  }
  latestBooks: Array<{
    name: string
    description?: string
    image: string
    href?: string
  }>
}
```

**Layout**:
- Left: Featured article card (responsive image, tags, title, summary, metadata)
- Right: 2x3 book grid (6 books, aspect-[3/4] covers)
- Responsive: Stacked on mobile, side-by-side on lg+
- Height: 40vh minimum, min-height 400px

**Features**:
- Framer Motion entrance animations
- Hover effects on cards (scale, shadow, border)
- Gradient backgrounds
- Image lazy loading
- Responsive images with Next.js Image

**Usage**:
```tsx
import HeroSection from '@/components/magazine/HeroSection'

<HeroSection
  featuredArticle={{
    title: "最新文章标题",
    summary: "文章摘要...",
    date: "2024-01-01",
    readTime: "5 分钟",
    image: "/images/featured.jpg",
    slug: "/blog/article",
    tags: ["技术", "教程"]
  }}
  latestBooks={booksData}
/>
```

### MasonryGrid
**File**: `MasonryGrid.tsx`

Responsive masonry layout with 4 card sizes and infinite scroll.

**Props**:
```typescript
interface MasonryGridProps {
  items: ContentItem[]  // See ContentItem interface below
  columnCount?: number  // Default: 3
  onItemClick?: (item: ContentItem) => void
}

interface ContentItem {
  id: string
  type: 'book' | 'article' | 'chapter'
  title: string
  summary?: string
  date?: string
  tags?: string[]
  image?: string
  slug: string
  featured?: boolean
}
```

**Card Sizes**:
- `large` (2x2): Featured items, 20% distribution
- `tall` (1x2): Vertical emphasis, 30% distribution
- `wide` (2x1): Horizontal emphasis, 20% distribution
- `small` (1x1): Standard cards, 30% distribution

**Responsive Columns**:
- Mobile: 1 column
- Tablet (sm/md): 2 columns
- Desktop (lg): 3 columns
- Large (xl): 4 columns

**Features**:
- Infinite scroll with Intersection Observer
- Initial load: 12 items
- Load more: 6 items per batch
- Framer Motion layout animations
- Hover effects (border, shadow, scale)
- Image lazy loading
- Tag filtering support
- Type indicators (📚 📄 📖)

**Size Calculation**:
```typescript
// Pattern: 20% large, 30% tall, 20% wide, 30% small
const pattern = ['large', 'tall', 'small', 'wide', 'tall', 'small', 'tall', 'small', 'wide', 'small']
const size = pattern[index % pattern.length]
```

**Usage**:
```tsx
import MasonryGrid from '@/components/magazine/MasonryGrid'

const items: ContentItem[] = [
  {
    id: '1',
    type: 'article',
    title: '文章标题',
    summary: '摘要...',
    date: '2024-01-01',
    tags: ['技术', '教程'],
    image: '/images/article.jpg',
    slug: '/blog/article',
    featured: true
  },
  // ... more items
]

<MasonryGrid
  items={items}
  columnCount={3}
  onItemClick={(item) => router.push(item.slug)}
/>
```

### FilterBar
**File**: `FilterBar.tsx`

Category filter and sort bar with search functionality.

**Props**:
```typescript
interface FilterBarProps {
  categories: string[]  // ['全部', '机器人', '控制', '感知']
  onFilterChange: (filter: FilterState) => void
  initialFilter?: FilterState
}

interface FilterState {
  category: string
  sortBy: 'latest' | 'popular' | 'relevant'
  searchQuery: string
}
```

**Features**:
- Category pills with active state
- Sort dropdown (latest, popular, relevant)
- Search input with icon
- Responsive design
- Smooth transitions

**Usage**:
```tsx
import FilterBar, { FilterState } from '@/components/magazine/FilterBar'

const [filter, setFilter] = useState<FilterState>({
  category: '全部',
  sortBy: 'latest',
  searchQuery: ''
})

<FilterBar
  categories={['全部', '机器人', '控制', '感知']}
  onFilterChange={setFilter}
/>
```

### RecommendedSection
**File**: `RecommendedSection.tsx`

Smart recommendation engine based on reading history.

**Props**:
```typescript
interface RecommendedSectionProps {
  readHistory: ContentItem[]    // User's reading history
  allItems: ContentItem[]        // All available items
  maxRecommendations?: number    // Default: 6
}
```

**Algorithm**:
1. Extract tags from read history
2. Calculate tag frequency
3. Score unread items by tag overlap
4. Sort by score (descending)
5. Exclude already read items

**Features**:
- Tag-based collaborative filtering
- Automatic exclusion of read items
- Configurable recommendation count
- Grid layout display
- Smooth animations

**Usage**:
```tsx
import RecommendedSection from '@/components/magazine/RecommendedSection'

<RecommendedSection
  readHistory={userHistory}
  allItems={allContentItems}
  maxRecommendations={6}
/>
```

### ArticleCard
**File**: `ArticleCard.tsx`

Featured article card component.

**Props**:
```typescript
interface ArticleCardProps {
  article: {
    title: string
    summary: string
    date: string
    image: string
    slug: string
    tags: string[]
  }
  size?: 'default' | 'large' | 'compact'
}
```

**Features**:
- Responsive image
- Tag display
- Hover animations
- Gradient overlays
- Multiple size variants

### BookCard
**File**: `BookCard.tsx`

Book cover card with metadata.

**Props**:
```typescript
interface BookCardProps {
  book: {
    name: string
    description?: string
    image: string
    href?: string
    author?: string
    rating?: number
  }
  size?: 'default' | 'large' | 'compact'
}
```

**Features**:
- Aspect-[3/4] book cover ratio
- Author display
- Rating stars
- Quick preview on hover
- Click to view details

### ChapterCard
**File**: `ChapterCard.tsx`

Chapter preview card for book content.

**Props**:
```typescript
interface ChapterCardProps {
  chapter: {
    id: string
    title: string
    summary?: string
    bookTitle: string
    chapterNumber: number
    readTime?: string
  }
}
```

**Features**:
- Chapter numbering
- Progress indicator
- Read time estimate
- Book title reference
- Status badges (new, updated)

### SmartCard
**File**: `SmartCard.tsx`

Intelligent card that adapts content based on item type.

**Props**:
```typescript
interface SmartCardProps {
  item: ContentItem
  size?: 'small' | 'medium' | 'large'
  onClick?: (item: ContentItem) => void
}
```

**Features**:
- Auto-detects item type (book/article/chapter)
- Chooses appropriate display style
- Unified interface for mixed content
- Hover effects

## Integration: MagazineLayout

**File**: `../layouts/MagazineLayout.tsx`

Master layout combining all magazine components:

```tsx
import MagazineLayout from '@/components/layouts/MagazineLayout'

<MagazineLayout
  featuredArticle={featuredPost}
  latestBooks={recentBooks}
  allItems={contentItems}
  readHistory={userHistory}
  categories={['全部', '机器人', '控制', '感知']}
/>
```

**Component Flow**:
1. HeroSection (featured + books)
2. FilterBar (categories, sort, search)
3. MasonryGrid (filtered content)
4. RecommendedSection (smart suggestions)

## Styling & Animation

### Framer Motion Patterns
```tsx
// Entrance animation
initial={{ opacity: 0, x: -20 }}
animate={{ opacity: 1, x: 0 }}
transition={{ duration: 0.6 }}

// Stagger children
transition={{ duration: 0.4, delay: 0.1 * index }}

// Layout animation
<motion.div layout>
```

### Hover Effects
- Border color change (gray → primary)
- Scale transform (1.0 → 1.05)
- Shadow increase (md → xl)
- Image zoom (scale-105)

### Color Schemes
- Light mode: White cards, gray borders
- Dark mode: Gray-800 cards, gray-700 borders
- Accent colors: Primary-500/400

## Best Practices

1. **Optimize images**:
   - Use Next.js Image component
   - Provide appropriate sizes
   - Lazy load below fold
   - WebP format when possible

2. **Card size distribution**:
   - Use `featured` flag for large cards
   - Balance tall/wide/small for visual rhythm
   - Pattern: 20% large, 30% tall, 20% wide, 30% small

3. **Performance**:
   - Limit initial items (12 default)
   - Batch load more (6 per batch)
   - Use Intersection Observer
   - Memoize filtered/sorted lists

4. **Accessibility**:
   - Alt text for images
   - Semantic headings
   - Keyboard navigation
   - ARIA labels for filters

5. **Responsive design**:
   - Test breakpoints (sm/md/lg/xl)
   - Adjust grid columns
   - Optimize touch targets
   - Mobile-first approach

## Feature Flags

Components respect these feature flags:
```typescript
import { isFeatureEnabled } from '@/lib/feature-flags'

// In MagazineLayout
if (isFeatureEnabled('magazineLayout')) { /* ... */ }
if (isFeatureEnabled('masonryGrid')) { /* ... */ }
if (isFeatureEnabled('recommendations')) { /* ... */ }
```

## Dependencies

```
- react: ^18.0.0
- next: ^14.0.0
- framer-motion: ^10.0.0
- lucide-react: ^0.300.0  (icons)
- @/lib/feature-flags
```

## File Structure

```
magazine/
├── HeroSection.tsx         # Featured article + books
├── MasonryGrid.tsx         # Waterfall grid layout
├── FilterBar.tsx           # Category filter + sort + search
├── RecommendedSection.tsx  # Smart recommendations
├── ArticleCard.tsx         # Article card component
├── BookCard.tsx            # Book card component
├── ChapterCard.tsx         # Chapter card component
└── SmartCard.tsx           # Adaptive card component
```

## Usage Examples

### Magazine Homepage
```tsx
// app/page.tsx
import MagazineLayout from '@/components/layouts/MagazineLayout'

export default function HomePage() {
  const { featuredPost, books, allItems, history } = useData()

  return (
    <MagazineLayout
      featuredArticle={featuredPost}
      latestBooks={books}
      allItems={allItems}
      readHistory={history}
      categories={['全部', '机器人', '控制', '感知']}
    />
  )
}
```

### Standalone Masonry Grid
```tsx
'use client'

import MasonryGrid from '@/components/magazine/MasonryGrid'

export default function ContentPage() {
  const [filter, setFilter] = useState({ category: '全部' })

  const filteredItems = useMemo(() => {
    if (filter.category === '全部') return allItems
    return allItems.filter(item =>
      item.tags?.includes(filter.category)
    )
  }, [allItems, filter])

  return (
    <MasonryGrid
      items={filteredItems}
      onItemClick={(item) => router.push(item.slug)}
    />
  )
}
```

### Custom Filter Bar
```tsx
import FilterBar from '@/components/magazine/FilterBar'

function MyFilter() {
  const handleFilterChange = (newFilter) => {
    console.log('Filter changed:', newFilter)
    // Update content based on filter
  }

  return (
    <FilterBar
      categories={['全部', '技术', '生活', '读书']}
      onFilterChange={handleFilterChange}
      initialFilter={{
        category: '全部',
        sortBy: 'latest',
        searchQuery: ''
      }}
    />
  )
}
```

## Performance Optimization

1. **Image Optimization**:
   - Next.js Image with sizes attribute
   - Lazy loading for offscreen images
   - WebP format fallback

2. **Code Splitting**:
   - Dynamic imports for heavy components
   - Separate client components
   - Route-based splitting

3. **Rendering**:
   - `useMemo` for filtered lists
   - `useCallback` for event handlers
   - Virtual scrolling for large lists

4. **Animation Performance**:
   - GPU-accelerated transforms
   - `will-change` hints
   - Reduced motion support

## Future Enhancements

- Virtual scrolling for 1000+ items
- Drag-and-drop reordering
- Masonry columns with true masonry (not grid)
- Swipe gestures on mobile
- Skeleton loading states
- Error boundaries
- Analytics tracking

## Notes

- All components support dark mode
- Animations respect `prefers-reduced-motion`
- Infinite scroll uses Intersection Observer
- Cards are clickable with optional onClick handler
- Feature flags allow safe rollout
- Responsive design tested on all breakpoints

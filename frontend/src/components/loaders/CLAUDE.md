# Loaders Module Documentation

## Overview

This module provides loading state components and skeleton screens for better UX during data fetching. All loaders use Framer Motion for smooth transitions and support dark mode.

## Components

### ComponentLoader
**File**: `ComponentLoader.tsx`

Universal loading wrapper that displays skeleton or spinner while content loads.

**Props**:
```typescript
interface ComponentLoaderProps {
  isLoading: boolean      // Loading state
  children: ReactNode     // Content to display when loaded
  skeleton?: ReactNode    // Custom skeleton component
  spinner?: boolean       // Show spinner (default: true)
  message?: string        // Loading message
  className?: string      // Container class name
}
```

**Features**:
- Framer Motion fade transitions (opacity)
- `AnimatePresence` for smooth mount/unmount
- Custom skeleton or default spinner
- Loading message display
- Full styling control via className

**Usage Examples**:

```tsx
import ComponentLoader from '@/components/loaders/ComponentLoader'
import { ListSkeleton } from '@/components/loaders'

// With default spinner
<ComponentLoader isLoading={loading}>
  <MyContent />
</ComponentLoader>

// With custom skeleton
<ComponentLoader
  isLoading={loading}
  skeleton={<ListSkeleton itemCount={3} />}
  message="加载中..."
>
  <MyContent />
</ComponentLoader>

// With message only
<ComponentLoader
  isLoading={loading}
  spinner={false}
  message="正在获取数据..."
>
  <MyContent />
</ComponentLoader>
```

**Animation Behavior**:
- Loading enter: Fade in (0ms → 1 opacity over 0.2s)
- Loading exit: Fade out (1 → 0 opacity over 0.2s)
- Content enter: Fade in (0 → 1 opacity over 0.2s)
- Mode: `wait` ensures one animation completes before next starts

### Spinner
**File**: `Spinner.tsx`

Classic rotating circle spinner.

**Props**:
```typescript
interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  color?: string
  className?: string
}
```

**Size Variants**:
- `sm`: 16px (small inline spinners)
- `md`: 24px (default, form buttons)
- `lg`: 32px (page loading)
- `xl`: 48px (hero sections)

**Usage**:
```tsx
<Spinner size="lg" />
<Spinner size="sm" className="inline-block" />
```

### Skeleton
**File**: `Skeleton.tsx`

Base skeleton component with shimmer animation.

**Props**:
```typescript
interface SkeletonProps {
  className?: string
  variant?: 'text' | 'rect' | 'circle'
}
```

**Features**:
- Shimmer gradient animation
- Rounded corners
- Customizable dimensions
- Gray/dark-gray base with shimmer overlay

**Usage**:
```tsx
<Skeleton className="h-4 w-3/4" />           // Text line
<Skeleton className="h-32 w-full" />          // Rectangle
<Skeleton className="h-12 w-12 rounded-full" /> // Circle
```

### ListSkeleton
**File**: `ListSkeleton.tsx`

Skeleton for blog post list items (matches ListLayout design).

**Props**:
```typescript
interface ListSkeletonProps {
  itemCount?: number  // Number of skeleton items (default: 3)
}
```

**Structure per item**:
- Title line (w-3/4)
- Meta line (w-1/4, smaller)
- Summary lines (2 lines, w-full)

**Usage**:
```tsx
<ListSkeleton itemCount={5} />
```

### ArticleSkeleton
**File**: `ArticleSkeleton.tsx`

Skeleton for article pages (matches PostLayout design).

**Structure**:
- Large hero rectangle (w-full, h-48)
- Title line (w-3/4, larger)
- Meta info line (w-1/2, smaller)
- Multiple content lines (4-5 lines)

**Usage**:
```tsx
<ArticleSkeleton />
```

### CardSkeleton
**File**: `CardSkeleton.tsx`

Skeleton for card components (blog cards, product cards, etc.).

**Structure**:
- Image rectangle (aspect-video)
- Title line (w-2/3)
- Description lines (2 lines, w-full)

**Usage**:
```tsx
<CardSkeleton />
```

### ImageSkeleton
**File**: `ImageSkeleton.tsx`

Skeleton for image placeholders.

**Props**:
```typescript
interface ImageSkeletonProps {
  aspectRatio?: string  // Tailwind aspect-ratio class
  className?: string
}
```

**Usage**:
```tsx
<ImageSkeleton aspectRatio="aspect-video" />
<ImageSkeleton aspectRatio="aspect-square" />
<ImageSkeleton aspectRatio="aspect-[3/4]" />
```

### AnimationSkeleton
**File**: `AnimationSkeleton.tsx`

Minimal skeleton for animated components.

**Structure**:
- Single rectangle with shimmer
- Compact design
- Fast animation

**Usage**:
```tsx
<AnimationSkeleton className="h-8 w-32" />
```

### RouteTransition
**File**: `RouteTransition.tsx`

Page transition wrapper for route changes.

**Features**:
- Fade in/out on route change
- Smooth transition between pages
- Configurable duration

**Usage**:
```tsx
import RouteTransition from '@/components/loaders/RouteTransition'

export default function Layout({ children }) {
  return <RouteTransition>{children}</RouteTransition>
}
```

## Barrel Export

**File**: `index.ts`

Central export point for all loaders:

```typescript
export { default as ComponentLoader } from './ComponentLoader'
export { default as Spinner } from './Spinner'
export { default as Skeleton } from './Skeleton'
export { default as ListSkeleton } from './ListSkeleton'
export { default as ArticleSkeleton } from './ArticleSkeleton'
export { default as CardSkeleton } from './CardSkeleton'
export { default as ImageSkeleton } from './ImageSkeleton'
export { default as AnimationSkeleton } from './AnimationSkeleton'
export { default as RouteTransition } from './RouteTransition'
```

**Usage**:
```tsx
import {
  ComponentLoader,
  Spinner,
  ListSkeleton,
  ArticleSkeleton
} from '@/components/loaders'
```

## Styling

### Shimmer Animation
All skeletons use a shimmer effect:
```css
@keyframes shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}

.skeleton {
  background: linear-gradient(
    90deg,
    var(--skeleton-base) 25%,
    var(--skeleton-highlight) 50%,
    var(--skeleton-base) 75%
  );
  background-size: 200% 100%;
  animation: shimmer 2s infinite;
}
```

### Dark Mode
- Light mode: `bg-gray-200` base, `bg-gray-300` shimmer
- Dark mode: `bg-gray-700` base, `bg-gray-600` shimmer

### Tailwind Classes
All skeletons use Tailwind utility classes for:
- Dimensions (`h-*`, `w-*`)
- Rounding (`rounded-*`)
- Margins/padding (`m-*`, `p-*`)
- Aspect ratios (`aspect-*`)

## Best Practices

1. **Match skeleton structure to actual content**:
```tsx
// Good: Matches real content structure
<ListSkeleton>
  {/* Title, meta, summary structure matches ListLayout */}
</ListSkeleton>

// Avoid: Generic skeleton that doesn't match
<Skeleton className="h-32 w-full" />
```

2. **Use appropriate skeleton type**:
- Blog listing → `ListSkeleton`
- Article page → `ArticleSkeleton`
- Card grid → `CardSkeleton`
- Custom layout → Build with `Skeleton` base

3. **Set appropriate item counts**:
```tsx
<ListSkeleton itemCount={3} />  // Match your initial display count
```

4. **Combine with ComponentLoader**:
```tsx
<ComponentLoader
  isLoading={loading}
  skeleton={<ListSkeleton itemCount={5} />}
>
  <ActualContent />
</ComponentLoader>
```

5. **Provide loading messages for long waits**:
```tsx
<ComponentLoader
  isLoading={loading}
  message="加载中，请稍候..."
>
  <Content />
</ComponentLoader>
```

## Usage Patterns

### Pattern 1: Data Fetching
```tsx
const [data, setData] = useState(null)
const [loading, setLoading] = useState(true)

useEffect(() => {
  fetchData().then(setData).finally(() => setLoading(false))
}, [])

return (
  <ComponentLoader isLoading={loading} skeleton={<ListSkeleton />}>
    <DataDisplay data={data} />
  </ComponentLoader>
)
```

### Pattern 2: Route Loading
```tsx
// In layout component
<RouteTransition>
  {children}
</RouteTransition>
```

### Pattern 3: Infinite Scroll
```tsx
{hasMore && (
  <div ref={loadMoreRef}>
    <Spinner size="lg" />
  </div>
)}
```

### Pattern 4: Form Submission
```tsx`
const [submitting, setSubmitting] = useState(false)

const handleSubmit = async () => {
  setSubmitting(true)
  await submitForm()
  setSubmitting(false)
}

return (
  <button disabled={submitting}>
    {submitting ? <Spinner size="sm" /> : 'Submit'}
  </button>
)
```

## Performance Considerations

1. **CSS-based animations** (GPU accelerated)
2. **No JavaScript layout thrashing**
3. **Minimal repaints** (opacity only)
4. **`will-change` optimization** (framer-motion)
5. **Intersection Observer** for lazy loading

## Accessibility

- **ARIA attributes**: Add `aria-busy` to container
- **Screen readers**: Skeletons hidden with `aria-hidden`
- **Loading messages**: Use `aria-live` for updates

```tsx
<div aria-busy={isLoading}>
  <ComponentLoader isLoading={isLoading}>
    <Content />
  </ComponentLoader>
</div>
```

## Dependencies

```
- react: ^18.0.0
- framer-motion: ^10.0.0
- clsx: ^2.0.0
- tailwind-merge: ^2.0.0
```

## File Structure

```
loaders/
├── ComponentLoader.tsx      # Universal wrapper
├── Spinner.tsx              # Rotating spinner
├── Skeleton.tsx             # Base skeleton
├── ListSkeleton.tsx         # Blog list skeleton
├── ArticleSkeleton.tsx      # Article page skeleton
├── CardSkeleton.tsx         # Card component skeleton
├── ImageSkeleton.tsx        # Image placeholder skeleton
├── AnimationSkeleton.tsx    # Minimal animation skeleton
├── RouteTransition.tsx      # Page transition wrapper
└── index.ts                 # Barrel export
```

## Integration Examples

### With ListLayout
```tsx
<ul>
  {!posts.length && loading && <ListSkeleton itemCount={3} />}
  {posts.map(post => <PostCard key={post.id} post={post} />)}
</ul>
```

### With API Calls
```tsx
const { data, loading } = useSWR('/api/posts', fetcher)

return (
  <ComponentLoader
    isLoading={loading}
    skeleton={<ArticleSkeleton />}
  >
    <Article content={data} />
  </ComponentLoader>
)
```

### With Next.js Data Fetching
```tsx
// app/blog/page.tsx
export default async function BlogPage() {
  const posts = await fetchPosts()

  return (
    <Suspense fallback={<ListSkeleton itemCount={5} />}>
      <BlogList posts={posts} />
    </Suspense>
  )
}
```

## Future Enhancements

- Pulse animation variant
- Progress bar skeletons
- Chart skeletons
- Table skeletons
- Form input skeletons
- Custom shimmer speeds

## Notes

- All loaders support dark mode
- Animations are 60fps (GPU accelerated)
- Skeletons match real content dimensions
- Use `ComponentLoader` for most cases
- Custom skeletons for complex layouts
- Keep shimmer animations subtle

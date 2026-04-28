# `@/components/ui` Module

## Layer 1: Module Overview

### Purpose
Reusable UI components including accessibility utilities, loading states, image optimization, and modals.

### Scope
- Accessibility components (LiveRegion, Status, Alert)
- Loading indicators (Loader, Skeleton screens)
- Image optimization (EnhancedImage; ui/OptimizedImage.tsx removed in 2a94a65f as dead code)
- Specialized modals (Excalidraw)
- Interactive containers (SwipeContainer)

## Layer 2: Component Architecture

### Accessibility Components

#### `LiveRegion`

**Purpose**: Announce dynamic content changes to screen readers

**Props Interface**:
```typescript
interface LiveRegionProps {
  children?: React.ReactNode
  politeness?: 'polite' | 'assertive' | 'off'
  atomic?: boolean
  relevant?: 'additions' | 'removals' | 'text' | 'all'
  className?: string
}
```

**ARIA Attributes**:
- `aria-live`: When to announce (`polite` = wait for quiet, `assertive` = interrupt)
- `aria-atomic`: Announce entire region or just changes
- `aria-relevant`: What changes to announce

---

#### `useAnnouncer` Hook

**Purpose**: Programmatically announce messages to screen readers

```typescript
const { announce } = useAnnouncer()

// Polite announcement (waits for quiet)
announce('Page loaded successfully')

// Assertive announcement (interrupts immediately)
announce('Error occurred', 'assertive')
```

**Implementation**:
```typescript
// Creates/updates live region div
const announcer = document.createElement('div')
announcer.setAttribute('aria-live', politeness)
document.body.appendChild(announcer)

// Clear and update to trigger announcement
announcer.textContent = ''
setTimeout(() => {
  announcer.textContent = message
}, 100)
```

---

#### `Status` & `Alert`

**Status**: Non-critical announcements
```tsx
<Status>Loading content...</Status>
```

**Alert**: Critical announcements (interrupts immediately)
```tsx
<Alert>Error: Form submission failed</Alert>
```

---

### Loading Components

#### `Loader`

**Purpose**: Simple spinner using lucide-react

**Props Interface**:
```typescript
interface LoaderProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}
```

**Size Classes**:
- `sm`: `h-4 w-4` (16px)
- `md`: `h-6 w-6` (24px)
- `lg`: `h-8 w-8` (32px)

---

#### Skeleton Screens

**BlogSkeleton**: Full-page blog loading state
- Three-column layout skeleton
- Book card skeletons (12 items)
- Sidebar content skeletons

**PostSkeleton**: Single post loading state
- Title, metadata, content area placeholders

**Benefits**:
- Perceived performance improvement
- Content structure preview
- Reduced layout shift

---

### Image Components

> **Note**: `ui/OptimizedImage.tsx` (which exported both `OptimizedImage` and `AccessibleImage`) was removed in commit 2a94a65f as dead code. No files imported either component.
> The remaining image components are at `@/components/OptimizedImage.tsx` (root) and `@/components/ui/EnhancedImage.tsx`.
> See `@/components/media/Image/CLAUDE.md` for the consolidation plan.

---

### Modal Components

#### `ExcalidrawModal`

**Purpose**: Full-screen Excalidraw drawing interface

**Props Interface**:
```typescript
interface ExcalidrawModalProps {
  isOpen: boolean
  onClose: () => void
  initialData?: {
    elements?: unknown[]
    appState?: unknown
    files?: unknown
  }
  title?: string
}
```

**Layout**:
```
┌─────────────────────────────────────┐
│ Title                    [关闭]     │
├─────────────────────────────────────┤
│                                     │
│         Excalidraw Viewer           │
│         (90vh height)               │
│                                     │
└─────────────────────────────────────┘
```

---

### Interactive Components

#### `SwipeContainer`

**Purpose**: Touch/gesture swipe handling (details in implementation)

**Likely Features**:
- Touch event handlers
- Swipe detection (left/right)
- Callback execution
- Threshold configuration

## Layer 3: Implementation Details

### Live Region Timing

```typescript
// Clear content first
announcer.textContent = ''

// Update after 100ms delay
setTimeout(() => {
  announcer.textContent = message
}, 100)
```

**Why 100ms?**: Ensures screen reader detects the content change

### Skeleton Pulse Animation

```tsx
<div className="animate-pulse bg-gray-200 dark:bg-gray-700" />
```

**Tailwind Animation**: Built-in pulse at `animate-pulse`

### Image Error Recovery

```typescript
const [imgSrc, setImgSrc] = useState(props.src)
const [hasError, setHasError] = useState(false)

const handleError = () => {
  if (!hasError && imgSrc !== fallbackSrc) {
    setImgSrc(fallbackSrc)
    setHasError(true)
  }
}
```

**Strategy**: One-time fallback to prevent infinite loops

### SSR Considerations

**Client-Side Only**:
- `'use client'` directive on all components
- No SSR-specific hydration handling

## Architecture Context

### Integration Points
- **Location**: `@/components/ui` → Generic UI utilities
- **Dependencies**:
  - `@/components/shadcn/ui/button`: Button components
  - `@/components/Excalidraw/ExcalidrawViewer`: Drawing interface
  - `@/lib/utils`: Utility functions
  - Lucide React: Icons

### Design Patterns
- **Accessibility First**: ARIA attributes, screen reader support
- **Progressive Enhancement**: Loading states, error fallbacks
- **Type Safety**: Enforced props (e.g., `alt` required)
- **Composition**: Small components combined into complex UIs

### Usage Examples

**Announce Page Navigation**:
```tsx
import { useAnnouncer } from '@/components/ui'

function Navigation() {
  const { announce } = useAnnouncer()

  const handleNavigate = (page: string) => {
    router.push(`/${page}`)
    announce(`Navigated to ${page}`)
  }
}
```

**Loading Skeleton**:
```tsx
import BlogSkeleton from '@/components/ui/Skeleton/BlogSkeleton'

function BlogPage() {
  if (isLoading) return <BlogSkeleton />
  return <BlogContent posts={posts} />
}
```

**Optimized Image**:
```tsx
# import { OptimizedImage } from '@/components/ui'  # removed in 2a94a65f

<!-- <OptimizedImage ... removed in 2a94a65f -->
  src="/hero.jpg"
  alt="Blog hero image"
  width={1200}
  height={630}
  priority={true}  // Above-the-fold
  fallbackSrc="/placeholder.jpg"
/>
```

**Excalidraw Modal**:
```tsx
import { ExcalidrawModal } from '@/components/ui'

<ExcalidrawModal
  isOpen={isModalOpen}
  onClose={() => setIsModalOpen(false)}
  initialData={savedDrawing}
  title="Edit Diagram"
/>
```

## Accessibility Best Practices

**Live Region Usage**:
- Use `polite` for non-critical updates
- Use `assertive` for errors/critical alerts
- Don't over-announce (filter redundant updates)
- Test with actual screen readers (NVDA, JAWS, VoiceOver)

**Image Accessibility**:
- Always provide descriptive `alt` text
- Use empty `alt=""` for decorative images
- Include `width`/`height` to prevent layout shift

**Loading States**:
- Announce loading start/end to screen readers
- Provide visual feedback for all users
- Don't rely on color alone (use icons/text)

## Performance Considerations

**Skeleton Screens**:
- Match actual content structure closely
- Reduce animation complexity (pulse is efficient)
- Remove from DOM immediately after load

**Image Optimization**:
- Use Next.js Image component (automatic optimization)
- Lazy load below-fold images
- Provide responsive `sizes` attribute
- Use WebP format when possible

**Modal Performance**:
- Lazy-load modal content
- Don't mount hidden modals in DOM
- Clean up resources on unmount

## Related Modules

- `@/components/loaders`: More loading states
- `@/components/shadcn/ui`: Base UI primitives
- `@/components/lib/utils`: Utility functions
- `@/lib/utils`: Shared utilities

# Hooks Module

## Purpose
Custom React hooks for common functionality across the application.

## Files
- `useActiveHeading.ts` - Active heading detection for TOC
- `useAnalyticsStorage.ts` - Analytics data persistence
- `useArticleAnalytics.ts` - Article reading analytics
- `useGSAP.ts` - GSAP animation lifecycle management
- `useGSAPPerformance.ts` - GSAP performance monitoring
- `useImagePreload.ts` - Image preloading optimization
- `usePerformanceMonitor.ts` - Web vitals monitoring
- `useReadingProgress.ts` - Reading progress indicator
- `useReadingProgressWithApi.ts` - Reading progress with API sync
- `useScrollAnimation.ts` - Scroll-triggered animations

## Architecture

### Hook Categories

#### Navigation & Scrolling
```typescript
// Active heading tracking
useActiveHeading(headingIds: string[]): string

// Reading progress
useReadingProgress(): number
useReadingProgressWithApi(articleId: string): void

// Scroll animations
useScrollAnimation(): void
```

#### Performance Monitoring
```typescript
// Web vitals
usePerformanceMonitor(options?): PerformanceMetrics

// GSAP performance
useGSAPPerformance(): GSAPMetrics
```

#### Analytics
```typescript
// Local storage analytics
useAnalyticsStorage(): AnalyticsData

// Article reading analytics
useArticleAnalytics(articleId: string): ArticleMetrics
```

#### Animation
```typescript
// GSAP lifecycle
useGSAP(callback, dependencies?): Animation
```

#### Optimization
```typescript
// Image preloading
useImagePreload(srcs: string[]): boolean
```

## Individual Hooks

### useActiveHeading
**Purpose**: Track currently visible heading in viewport

**Features**:
- IntersectionObserver API
- RAF-based scroll throttling
- Cached element references
- Debounced scroll handler

**Usage**:
```typescript
const activeId = useActiveHeading(['#intro', '#methods', '#results'])
// Highlight active heading in TOC
```

**Performance**:
- Passive scroll listeners
- RequestAnimationFrame throttling
- Cached DOM queries (Map)

### useGSAP
**Purpose**: Manage GSAP animation lifecycle

**Features**:
- Automatic ScrollTrigger registration
- Cleanup on unmount
- Dependency tracking
- Plugin registration (once)

**Usage**:
```typescript
const animation = useGSAP((gsap, ScrollTrigger) => {
  gsap.to('.box', { rotation: 360 })
  return gsap.timeline()
}, [dependency])
```

**Cleanup**:
```typescript
// Automatically kills:
// - ScrollTriggers
// - Timelines
// - Tweens
```

### usePerformanceMonitor
**Purpose**: Monitor Web Vitals and performance metrics

**Metrics**:
- FCP (First Contentful Paint)
- LCP (Largest Contentful Paint)
- FID (First Input Delay)
- CLS (Cumulative Layout Shift)
- TTI (Time to Interactive)

**Usage**:
```typescript
const metrics = usePerformanceMonitor({
  threshold: { fcp: 2000, lcp: 2500 },
  reportToAnalytics: true
})
```

**API**: PerformanceObserver, PerformancePaintTiming

### useArticleAnalytics
**Purpose**: Track article reading behavior

**Metrics**:
- Time spent reading
- Scroll depth
- Completion rate
- Device info

**Usage**:
```typescript
const analytics = useArticleAnalytics(articleId)
// Sends to API on unmount
```

### useReadingProgress
**Purpose**: Calculate scroll progress percentage

**Usage**:
```typescript
const progress = useReadingProgress()
// Returns 0-100
```

**Formula**: `(scrollY / (docHeight - winHeight)) * 100`

### useImagePreload
**Purpose**: Preload images for faster rendering

**Usage**:
```typescript
const allLoaded = useImagePreload([
  '/img1.jpg',
  '/img2.jpg'
])
// Show loader until allLoaded === true
```

**Implementation**: `new Image().src = url`

### useAnalyticsStorage
**Purpose**: Persist analytics data to localStorage

**Features**:
- JSON serialization
- Error handling
- quota exceeded handling

**Usage**:
```typescript
const { data, save, clear } = useAnalyticsStorage()
save({ pageViews: 100 })
```

### useGSAPPerformance
**Purpose**: Monitor GSAP animation performance

**Metrics**:
- Active animations count
- Average FPS
- Janky frames
- CPU usage

### useReadingProgressWithApi
**Purpose**: Sync reading progress to server

**Features**:
- Throttled API calls (30s)
- Debounced saves
- Offline support
- Resume from last position

**Usage**:
```typescript
useReadingProgressWithApi(articleId)
// Auto-saves progress to /api/reading-progress
```

### useScrollAnimation
**Purpose**: Trigger animations on scroll

**Features**:
- Viewport detection
- One-time animations
- Custom thresholds

**Usage**:
```typescript
useScrollAnimation()
// Triggers elements with data-animate attribute
```

## Integration Points

### GSAP
```typescript
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
// Registered by useGSAP
```

### Performance API
```typescript
// Built-in browser APIs
window.performance
PerformanceObserver
```

### Analytics API
```typescript
// Custom endpoints
POST /api/analytics
POST /api/reading-progress
```

## Data Flow

### useActiveHeading
```
Scroll event → RAF throttle → Calculate positions → Update activeId → Re-render TOC
```

### useGSAP
```
Component mount → Register plugins → Run callback → Save ref → On unmount: Kill animations
```

### usePerformanceMonitor
```
Component mount → Create PerformanceObserver → Collect metrics → Check thresholds → Report (optional)
```

## Dependencies
- **External**:
  - `gsap`, `gsap/ScrollTrigger`
  - React hooks (built-in)

## Performance Considerations

### Optimization Strategies
- **RAF throttling**: Use requestAnimationFrame for scroll events
- **Passive listeners**: `{ passive: true }` for better scroll performance
- **Memoization**: Cache expensive calculations
- **Cleanup**: Kill animations, disconnect observers
- **Debouncing**: Limit API calls

### useActiveHeading Optimizations
```typescript
// Cached element references (Map)
headingElementsRef.current.set(id, element)

// RAF throttling
rafIdRef.current = requestAnimationFrame(updateActiveHeading)

// Debounced scroll
scrollTimeoutRef.current = setTimeout(updateActiveHeading, 100)
```

## Usage Examples

### TOC with Active Heading
```typescript
function TableOfContents({ headings }) {
  const activeId = useActiveHeading(headings)

  return (
    <nav>
      {headings.map(id => (
        <a
          key={id}
          href={id}
          className={id === activeId ? 'active' : ''}
        >
          {id.replace('#', '')}
        </a>
      ))}
    </nav>
  )
}
```

### GSAP Animation
```typescript
function AnimatedComponent() {
  const ref = useRef()
  useGSAP((gsap) => {
    gsap.to(ref.current, { opacity: 1, y: 0 })
  }, [])

  return <div ref={ref} style={{ opacity: 0, y: 20 }}>Hello</div>
}
```

### Performance Monitoring
```typescript
function App() {
  usePerformanceMonitor({
    threshold: { fcp: 2000, lcp: 2500 },
    reportToAnalytics: true
  })
  // Logs warnings if thresholds exceeded
}
```

## Best Practices
- **Cleanup always**: Return cleanup function from useEffect
- **Passive listeners**: Use `{ passive: true }` for scroll/resize
- **Throttle/debounce**: Limit expensive operations
- **Cache references**: Use useRef to avoid re-renders
- **Lazy initialization**: Initialize expensive values in useEffect

## Future Enhancements
- [ ] useIntersectionObserver (generic)
- [ ] useLocalStorage (typed)
- [ ] useDebounce/useThrottle
- [ ] useMediaQuery
- [ ] useOnlineStatus
- [ ] useGeolocation
- [ ] useClipboard
- [ ] useFetch (with caching)
- [ ] useWebSocket
- [ ] useWebWorker

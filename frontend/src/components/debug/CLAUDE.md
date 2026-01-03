# Debug Components Module

## Purpose
Development and debugging tools for monitoring application performance and state.

## Files
- `DebugPanel.tsx` - Comprehensive debug information panel

## Architecture

### DebugPanel Component
```
DebugPanel (Client Component)
├── Toggle button (floating)
├── Collapsible panel
│   ├── Performance metrics
│   │   ├── Load time
│   │   ├── Render count
│   │   └── Last render timestamp
│   ├── Network status
│   │   ├── Pending requests
│   │   ├── Completed requests
│   │   └── Failed requests
│   ├── Cache statistics
│   │   ├── Size
│   │   └── Hit rate
│   └── Memory usage
│       ├── Used
│       └── Total
└── Real-time updates
```

### DebugInfo Schema
```typescript
interface DebugInfo {
  performance: {
    loadTime: number        // Page load time (ms)
    renderCount: number     // Component render count
    lastRender: number      // Last render timestamp
  }
  network: {
    pendingRequests: number
    completedRequests: number
    failedRequests: number
  }
  cache: {
    size: number            // Cache entry count
    hitRate: number         // Cache hit rate (0-1)
  }
  memory: {
    used: number            // Used memory (MB)
    total: number           // Total memory (MB)
  }
}
```

### Component Props
```typescript
// Internal state management
const [isOpen, setIsOpen] = useState(false)
const [debugInfo, setDebugInfo] = useState<DebugInfo>(initialState)
```

### Key Features

#### Performance Monitoring
```typescript
// Render count tracking
useEffect(() => {
  setDebugInfo(prev => ({
    ...prev,
    performance: {
      ...prev.performance,
      renderCount: prev.performance.renderCount + 1,
      lastRender: Date.now()
    }
  }))
})
```

#### Network Tracking
```typescript
// Interceptor pattern for fetch/XMLHttpRequest
// Tracks pending, completed, failed requests
```

#### Memory Profiling
```typescript
// Browser memory API (if available)
if ('memory' in performance) {
  const memory = (performance as any).memory
  setDebugInfo(prev => ({
    ...prev,
    memory: {
      used: memory.usedJSHeapSize / 1024 / 1024,
      total: memory.totalJSHeapSize / 1024 / 1024
    }
  }))
}
```

### Technologies
- React hooks (useState, useEffect)
- lucide-react (icons)
- Performance API
- Custom styling

## Integration Points

### Performance API
```typescript
// Page load time
const loadTime = performance.timing.loadEventEnd - performance.timing.navigationStart
```

### Memory API
```typescript
// Chrome/Edge only
performance.memory.usedJSHeapSize
performance.memory.totalJSHeapSize
```

### Network Interceptors
```typescript
// Global fetch tracking
const originalFetch = window.fetch
window.fetch = async (...args) => {
  // Track pending → completed/failed
  return originalFetch(...args)
}
```

## Data Flow
```
Component mount → Initialize debug state → Monitor performance/network/memory → Update state → Render panel
```

## Dependencies
- **External**: `lucide-react`
- **Internal**: `@/lib/utils` (cn), `@/components/shadcn/ui/button`

## Styling
- **Position**: Fixed, bottom-right
- **Toggle**: Floating button (Bug icon)
- **Panel**: Collapsible, glass effect
- **Theme**: Dark mode support

## Development Usage

#### Enable/Disable
```typescript
// Show only in development
{process.env.NODE_ENV === 'development' && <DebugPanel />}
```

#### Production Builds
```typescript
// Completely excluded from production bundles
// Use next/dynamic or conditional rendering
```

## Security Considerations
- **Never expose in production**: Development only
- **No sensitive data**: Exclude API keys, tokens
- **Performance impact**: Minimal overhead

## Future Enhancements
- [ ] Component tree visualization
- [ ] Redux/Zustand store inspector
- [ ] React Query devtools integration
- [ ] Network request timeline
- [ ] Source map integration
- [ ] Error boundary integration
- [ ] Console log capture
- [ ] Local storage inspector
- [ ] Session replay
- [ ] Custom metrics tracking

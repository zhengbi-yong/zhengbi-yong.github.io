# Utils Tests

## Module Overview

Test suite for ResourceManager utility class, which manages browser resources and prevents memory leaks.

## Architecture Layer

### Layer 3: Utility Testing

```
tests/lib/utils/
└── ResourceManager.test.tsx    # ResourceManager tests
```

**Scope**: Utility function validation
**Hierarchy**: Integration tests → Utility tests → Unit tests

## Test Coverage

### ResourceManager Class

**Purpose**: Centralized management of browser resources to prevent memory leaks

**Test Categories**:

1. **Animation Frame Management** - `requestAnimationFrame` tracking
2. **Event Listener Management** - DOM event listener lifecycle
3. **Timer Management** - `setTimeout` and `setInterval` cleanup
4. **Three.js Object Management** - 3D resource disposal
5. **Observer Management** - MutationObserver, IntersectionObserver cleanup
6. **Statistics Tracking** - Resource monitoring

### Test Scenarios

**Animation Frames**
```typescript
it('should track animation frames', () => {
  const callback = vi.fn()
  const id = resourceManager.requestAnimationFrame(callback)

  expect(typeof id).toBe('number')
  expect(resourceManager.getStats().animationFrames).toBe(1)

  resourceManager.cancelAnimationFrame(id)
  expect(resourceManager.getStats().animationFrames).toBe(0)
})
```

**Event Listeners**
```typescript
it('should add and track event listeners', () => {
  const element = document.createElement('div')
  const handler = vi.fn()

  resourceManager.addEventListener(element, 'click', handler)
  expect(resourceManager.getStats().eventListeners).toBe(1)

  // Simulate event
  element.click()
  expect(handler).toHaveBeenCalled()
})
```

**Timers**
```typescript
it('should track intervals', () => {
  vi.useFakeTimers()
  const callback = vi.fn()

  const id = resourceManager.setInterval(callback, 1000)
  expect(resourceManager.getStats().intervals).toBe(1)

  vi.advanceTimersByTime(1000)
  expect(callback).toHaveBeenCalledTimes(1)

  resourceManager.clearInterval(id)
  expect(resourceManager.getStats().intervals).toBe(0)
})
```

**Three.js Objects**
```typescript
it('should dispose Three.js objects', () => {
  const geometry = { dispose: vi.fn() }
  const material = { dispose: vi.fn() }
  const mesh = { geometry, material }

  resourceManager.registerThreeObject(mesh)
  resourceManager.dispose()

  expect(geometry.dispose).toHaveBeenCalled()
  expect(material.dispose).toHaveBeenCalled()
})
```

**Observers**
```typescript
it('should track and disconnect observers', () => {
  const observer = { disconnect: vi.fn() }

  resourceManager.registerObserver(observer)
  expect(resourceManager.getStats().observers).toBe(1)

  resourceManager.dispose()
  expect(observer.disconnect).toHaveBeenCalled()
})
```

**Statistics**
```typescript
it('should return correct statistics', () => {
  resourceManager.requestAnimationFrame(() => {})
  resourceManager.addEventListener(element, 'click', handler)
  resourceManager.setInterval(() => {}, 1000)
  resourceManager.setTimeout(() => {}, 1000)
  resourceManager.registerThreeObject({ geometry: { dispose: vi.fn() } })
  resourceManager.registerObserver({ disconnect: vi.fn() })

  const stats = resourceManager.getStats()

  expect(stats).toEqual({
    animationFrames: 1,
    eventListeners: 1,
    intervals: 1,
    timeouts: 1,
    threeObjects: 1,
    observers: 1,
  })
})
```

### React Hook Tests

**useResourceManager Hook**
```typescript
it('should create a new ResourceManager on mount', () => {
  const { result } = renderHook(() => useResourceManager())

  expect(result.current).toBeInstanceOf(ResourceManager)
  expect(result.current.getStats()).toEqual({
    animationFrames: 0,
    eventListeners: 0,
    intervals: 0,
    timeouts: 0,
    threeObjects: 0,
    observers: 0,
  })
})

it('should maintain same instance across re-renders', () => {
  const { result, rerender } = renderHook(() => useResourceManager())

  const firstInstance = result.current
  rerender()
  const secondInstance = result.current

  expect(firstInstance).toBe(secondInstance)
})

it('should dispose ResourceManager on unmount', () => {
  const { result, unmount } = renderHook(() => useResourceManager())
  const manager = result.current

  manager.requestAnimationFrame(() => {})
  expect(manager.getStats().animationFrames).toBe(1)

  unmount()
  // All resources should be cleaned up
})
```

## ResourceManager API

### Constructor
```typescript
new ResourceManager()
```

### Methods

**Animation Frames**
- `requestAnimationFrame(callback: FrameRequestCallback): number`
- `cancelAnimationFrame(id: number): void`

**Event Listeners**
- `addEventListener(element: HTMLElement, event: string, handler: Function): void`

**Timers**
- `setTimeout(callback: Function, delay: number): number`
- `clearTimeout(id: number): void`
- `setInterval(callback: Function, delay: number): number`
- `clearInterval(id: number): void`

**Three.js**
- `registerThreeObject(obj: ThreeObject): void`

**Observers**
- `registerObserver(observer: Observer): void`

**Cleanup**
- `dispose(): void` - Clean up all resources

**Statistics**
- `getStats(): ResourceStats`

### Type Definitions

```typescript
interface ResourceStats {
  animationFrames: number
  eventListeners: number
  intervals: number
  timeouts: number
  threeObjects: number
  observers: number
}

interface ThreeObject {
  geometry?: { dispose(): void }
  material?: { dispose(): void } | { dispose(): void }[]
}

interface Observer {
  disconnect(): void
}
```

## Usage Examples

### In React Component

```typescript
import { useResourceManager } from '@/lib/utils/ResourceManager'

function MyComponent() {
  const manager = useResourceManager()

  useEffect(() => {
    const element = ref.current

    // Register event listener
    manager.addEventListener(element, 'click', handleClick)

    // Register animation frame
    const id = manager.requestAnimationFrame(animate)

    // Register Three.js object
    manager.registerThreeObject(mesh)

    // Cleanup is automatic on unmount
  }, [manager])

  return <div ref={ref}>...</div>
}
```

### Standalone Usage

```typescript
import { ResourceManager } from '@/lib/utils/ResourceManager'

const manager = new ResourceManager()

// Use resources
manager.setInterval(() => console.log('tick'), 1000)
manager.addEventListener(document, 'scroll', handleScroll)

// Later: cleanup
manager.dispose()
```

## Test Patterns

### Fake Timers

```typescript
beforeEach(() => {
  vi.useFakeTimers()
})

afterEach(() => {
  vi.useRealTimers()
})

it('should test timer behavior', () => {
  const callback = vi.fn()
  manager.setTimeout(callback, 1000)

  vi.advanceTimersByTime(1000)
  expect(callback).toHaveBeenCalled()
})
```

### DOM Elements

```typescript
let element: HTMLElement

beforeEach(() => {
  element = document.createElement('div')
})

it('should test DOM events', () => {
  const handler = vi.fn()
  manager.addEventListener(element, 'click', handler)

  element.click()
  expect(handler).toHaveBeenCalled()
})
```

### Cleanup Verification

```typescript
afterEach(() => {
  resourceManager.dispose()
})

it('should clean up all resources', () => {
  // Add resources
  manager.requestAnimationFrame(() => {})
  manager.addEventListener(element, 'click', () => {})

  // Verify stats show resources
  expect(manager.getStats().animationFrames).toBe(1)

  // Dispose
  manager.dispose()

  // Verify cleanup
  expect(manager.getStats().animationFrames).toBe(0)
})
```

## Extension Guide

### Adding New Resource Type

1. **Add to ResourceManager**:
```typescript
class ResourceManager {
  private webWorkers: Set<Worker> = new Set()

  registerWebWorker(worker: Worker) {
    this.webWorkers.add(worker)
  }

  dispose() {
    // ... existing cleanup
    this.webWorkers.forEach(worker => worker.terminate())
    this.webWorkers.clear()
  }
}
```

2. **Add tests**:
```typescript
describe('Web Worker Management', () => {
  it('should track and terminate web workers', () => {
    const worker = new Worker('worker.js')
    manager.registerWebWorker(worker)

    expect(manager.getStats().webWorkers).toBe(1)

    manager.dispose()
    // Verify worker terminated
  })
})
```

### Testing Edge Cases

```typescript
it('should handle duplicate registrations', () => {
  const observer = { disconnect: vi.fn() }
  manager.registerObserver(observer)
  manager.registerObserver(observer) // Duplicate

  manager.dispose()
  expect(observer.disconnect).toHaveBeenCalledTimes(1)
})

it('should handle disposal after disposal', () => {
  manager.dispose()
  manager.dispose() // Should be safe

  expect(manager.getStats()).toEqual({
    animationFrames: 0,
    eventListeners: 0,
    intervals: 0,
    timeouts: 0,
    threeObjects: 0,
    observers: 0,
  })
})
```

## Dependencies

**Testing Framework**
- `vitest` - Test runner
- `@testing-library/react` - React hook testing

**Implementation**
- `@/lib/utils/ResourceManager` - ResourceManager class

## Related Modules

- `/src/lib/utils/ResourceManager.ts` - Implementation
- `/src/components/chemistry/**/*` - Usage in chemistry components
- `/src/components/3d/**/*` - Usage in 3D components

## Best Practices

- **Always dispose**: Call dispose() when done with resources
- **Use the hook**: Prefer useResourceManager in React components
- **Track stats**: Monitor getStats() during development
- **Test cleanup**: Verify all resources are cleaned up
- **Fake timers**: Use vi.useFakeTimers() for timer tests
- **Memory leaks**: Run tests with memory profiling

## Running Tests

```bash
# ResourceManager tests
npm test -- tests/lib/utils/ResourceManager.test.tsx

# Watch mode
npm test -- --watch tests/lib/utils

# Coverage
npm test -- --coverage tests/lib/utils
```

## Memory Leak Prevention

ResourceManager prevents memory leaks by:
- Centralizing resource tracking
- Automatic cleanup on unmount (React hook)
- Explicit dispose() for standalone usage
- Statistics tracking for debugging
- Complete cleanup of all resource types

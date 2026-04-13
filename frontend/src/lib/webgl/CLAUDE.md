# `@/lib/webgl` Module

## Layer 1: Module Overview

### Purpose
WebGL context management with LRU eviction for resource-constrained browser environments.

### Scope
- WebGL context lifecycle management
- LRU eviction when exceeding context limits
- Context lost/restored event handling
- Snapshot saving for Activity visibility transitions

## Layer 2: Architecture

### WebGLContextManager

**Singleton** managing all WebGL contexts across the application.

```typescript
const webGLContextManager = WebGLContextManager.getInstance()
```

**Key Constraints** (from GOLDEN_RULES 2.4):
- Maximum 6 active WebGL contexts (browser limit is 16)
- LRU eviction when at capacity
- Context lost/restored event handling

### Class Structure

```typescript
interface ManagedContext {
  id: string                      // Unique identifier
  canvas: HTMLCanvasElement       // Associated canvas
  context: WebGLRenderingContext | WebGL2RenderingContext | null
  priority: number                // LRU priority (higher = more recent)
  snapshot: string | null         // PNG snapshot for pause state
  isLost: boolean                 // Context lost flag
  lastAccessed: number            // Timestamp for LRU
}
```

### Core Methods

| Method | Purpose | Idempotent |
|--------|---------|------------|
| `acquire(id, canvas)` | Get/create WebGL context | Yes |
| `release(id)` | Free GPU resources | Yes |
| `pause(id)` | Save snapshot, stop rendering | Yes |
| `resume(id)` | Restore rendering | Yes |
| `getSnapshot(id)` | Get saved snapshot | Yes |
| `isContextLost(id)` | Check lost status | Yes |
| `dispose()` | Cleanup all contexts | Yes |

### LRU Eviction

When acquiring a context and `MAX_CONTEXTS` (6) is reached:
1. Find context with lowest priority
2. Save its snapshot
3. Release GPU resources
4. Remove from managed pool

### Context Lost Handling

**Event Flow**:
1. `webglcontextlost` fires on canvas
2. Manager marks context as `isLost = true`
3. Registered callbacks notified
4. Application shows snapshot fallback

5. `webglcontextrestored` fires
6. Manager marks context as restored
7. Callbacks notified for potential recovery

## Layer 3: Usage

### Integration with ThreeViewer

```typescript
// Acquire context
const gl = webGLContextManager.acquire(id, canvas)

// On Activity hidden (GOLDEN_RULES 2.3)
const snapshot = webGLContextManager.pause(id) // pause is idempotent

// On Activity visible
webGLContextManager.resume(id)

// Cleanup
webGLContextManager.release(id)
```

### Activity Pattern Compliance

**GOLDEN_RULES 2.3**: Effect cleanup must be idempotent

```typescript
// CORRECT: pause() is idempotent
return () => {
  webGLContextManager.pause(id) // Safe to call multiple times
}

// WRONG: release() destroys context
return () => {
  webGLContextManager.release(id) // Context lost on restore!
}
```

### Snapshot Display

When Activity is hidden (`isActive=false`):
```tsx
if (snapshot && !isActive) {
  return <img src={snapshot} alt="paused" />
}
```

## Design Decisions

### Why Snapshot on Pause?

React 19's `<Activity>` destroys Effects when hidden. The snapshot:
1. Provides visual continuity during pause
2. Allows graceful fallback if context is lost
3. Is saved before any potential GPU resource release

### Why Preserve Drawing Buffer?

WebGL contexts acquired with `preserveDrawingBuffer: true`:
- Allows `canvas.toDataURL()` after rendering stops
- Slight memory overhead but necessary for snapshots

### Why 6 Contexts?

Browser hard limit is typically 16 contexts. Using 6:
- Leaves safety margin for other WebGL usage
- Prevents GPU resource exhaustion
- Aligns with GOLDEN_RULES 2.4 requirement

## Performance Considerations

### Context Switching Overhead
- Creating WebGL context is expensive (~50ms)
- Managed contexts persist to avoid recreation
- Only evicted when at capacity

### Memory Management
- Snapshots stored as PNG data URLs (~100KB each)
- Only saved when Activity transitions to hidden
- Cleared on release

## Future Enhancements

**Priority Inversion Prevention**:
- Currently LRU based on access count and timestamp
- Could add explicit priority levels for critical viewers

**Automatic Snapshot Cleanup**:
- Add TTL for snapshots to reduce memory
- Clear oldest snapshots first

**Context Migration**:
- On context lost, attempt to recreate from snapshot
- More complex but enables full recovery

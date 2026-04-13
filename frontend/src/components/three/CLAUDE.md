# `@/components/three` Module

## Layer 1: Module Overview

### Purpose
3D rendering component using Three.js library for WebGL content, with Activity-aware lifecycle management.

### Scope
- Three.js scene initialization
- Basic 3D object rendering (default cube)
- Auto-rotation animation
- SSR-safe rendering
- Responsive canvas sizing
- Activity visibility transitions (pause/resume)
- WebGL context LRU management

## Layer 2: Component Architecture

### Component: `ThreeViewer`

**Responsibilities**:
- Initialize Three.js scene, camera, renderer
- Render 3D geometry with materials
- Handle animation loop (when active)
- Manage cleanup on unmount (pause, not destroy)
- Support client-side only rendering
- Activity visibility transitions via `isActive` prop
- WebGL context management via WebGLContextManager

**Props Interface**:
```typescript
interface ThreeViewerProps {
  modelPath?: string      // Legacy prop (unused)
  modelUrl?: string       // Model URL (future feature)
  className?: string      // Additional container styling
  autoRotate?: boolean    // Enable rotation (default: true)
  width?: number          // Canvas width (default: 800)
  height?: number         // Canvas height (default: 600)
  cameraPosition?: [number, number, number]  // Camera placement
  isActive?: boolean      // Activity visibility (default: true)
}
```

## Layer 3: Implementation Details

### WebGLContextManager Integration

ThreeViewer uses the singleton `WebGLContextManager` for:
- Context acquisition with LRU eviction
- Pause/resume for Activity transitions
- Snapshot saving when hidden
- Context lost event handling

```typescript
// Context acquired through manager (LRU managed)
const gl = webGLContextManager.acquire(id, canvas)

// On Activity hidden - save snapshot, pause rendering
const snapshot = webGLContextManager.pause(id)

// On Activity visible - resume rendering
webGLContextManager.resume(id)
```

### GOLDEN_RULES 2.3 Compliance

**Effect cleanup is idempotent** (pause, not destroy):

```typescript
// CORRECT: pause() can be called multiple times safely
return () => {
  webGLContextManager.pause(id)  // Idempotent
  // Canvas remains attached, context stays alive
}

// WRONG: release() would destroy context
return () => {
  webGLContextManager.release(id)  // NOT idempotent!
  // Context destroyed, Activity restore would fail
}
```

### GOLDEN_RULES 2.4 Compliance

**Max 6 WebGL contexts with LRU eviction**:

```typescript
class WebGLContextManager {
  private static readonly MAX_CONTEXTS = 6

  acquire(id, canvas) {
    if (this.contexts.size >= MAX_CONTEXTS) {
      this.evictLeastRecentlyUsed()  // LRU eviction
    }
    // ... create context
  }
}
```

### Scene Setup

```typescript
const scene = new THREE.Scene()
scene.background = new THREE.Color(0xf0f0f0)  // Light gray background
```

### Camera Configuration

```typescript
const camera = new THREE.PerspectiveCamera(
  75,              // Field of view (degrees)
  width / height,  // Aspect ratio
  0.1,             // Near clipping plane
  1000             // Far clipping plane
)
camera.position.z = 5  // Move camera back
```

### Renderer Initialization

```typescript
const renderer = new THREE.WebGLRenderer({
  antialias: true,
  context: gl  // Use managed context
})
renderer.setSize(width, height)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))  // Cap at 2x for performance
```

### Lighting Setup

```typescript
// Ambient light (soft overall illumination)
const ambientLight = new THREE.AmbientLight(0xffffff, 0.6)
scene.add(ambientLight)

// Directional light (simulates sunlight)
const directionalLight = new THREE.DirectionalLight(0xffffff, 0.4)
directionalLight.position.set(5, 5, 5)
scene.add(directionalLight)
```

### Default Mesh (Cube)

```typescript
const geometry = new THREE.BoxGeometry(2, 2, 2)  // Width, height, depth
const material = new THREE.MeshStandardMaterial({
  color: 0x3b82f6,      // Blue color
  metalness: 0.5,       // Metallic appearance
  roughness: 0.5,       // Surface roughness
})
const cube = new THREE.Mesh(geometry, material)
scene.add(cube)
```

### Activity-Aware Animation Loop

```typescript
const animate = () => {
  requestAnimationFrame(animate)

  // Only animate when active to save resources
  if (isActive && cubeRef.current) {
    cubeRef.current.rotation.x += 0.01
    cubeRef.current.rotation.y += 0.01
  }

  if (rendererRef.current && sceneRef.current && cameraRef.current) {
    rendererRef.current.render(sceneRef.current, cameraRef.current)
  }
}

animate()
```

### Snapshot Display

When Activity is hidden, show snapshot instead of black canvas:

```tsx
if (snapshot && !isActive) {
  return (
    <div className={className} style={{ width, height }}>
      <img src={snapshot} alt="3D viewer paused" />
    </div>
  )
}
```

### SSR Safety Pattern

```typescript
const [isClient, setIsClient] = useState(false)

useEffect(() => {
  setIsClient(true)
}, [])

if (!isClient) {
  return <div>Loading 3D content...</div>
}
```

**Why**: Three.js requires browser APIs (WebGL) not available during SSR

### Cleanup Strategy (GOLDEN_RULES 2.3)

```typescript
return () => {
  window.removeEventListener('resize', handleResize)

  // Pause context (keeps it alive for potential restore)
  webGLContextManager.pause(id)

  // Remove canvas from DOM
  if (mountRef.current && canvas.parentNode === mountRef.current) {
    mountRef.current.removeChild(canvas)
  }

  // Note: Don't dispose renderer - context is managed by manager
  // This allows Activity restore without context recreation
}
```

### Responsive Handling

```typescript
const handleResize = () => {
  camera.aspect = width / height
  camera.updateProjectionMatrix()
  renderer.setSize(width, height)
}

window.addEventListener('resize', handleResize)
```

## Architecture Context

### Integration Points
- **Location**: `@/components/three` → 3D content
- **Library**: `three` (Three.js)
- **Manager**: `@/lib/webgl/WebGLContextManager`
- **Used In**: Product showcases, interactive demos

### Design Patterns
- **SSR-Safe Component**: Client detection pattern
- **WebGL LRU Management**: Centralized context pooling
- **Activity-Aware Rendering**: Pause/Resume with snapshots
- **Idempotent Cleanup**: pause() not destroy()

### Usage Example

```tsx
import { ThreeViewer } from '@/components/three'

// Basic usage
<ThreeViewer
  width={800}
  height={600}
  autoRotate={true}
  className="rounded-lg shadow-lg"
/>

// With Activity visibility control
<ThreeViewer
  isActive={isVisible}
  width={800}
  height={600}
/>
```

## Performance Considerations

**Optimization Tips**:
1. Use `requestAnimationFrame` for smooth animation
2. Set `pixelRatio` to max 2 for high DPI (avoid 3x/4x)
3. Reuse geometries/materials when creating multiple meshes
4. Implement frustum culling for complex scenes
5. Use LOD (Level of Detail) for distant objects
6. Pause animation when `isActive=false` to save CPU

**Context Management**:
1. Max 6 contexts enforced by WebGLContextManager
2. LRU eviction frees GPU memory for oldest context
3. Snapshots stored as PNG data URLs (~100KB each)
4. Context preserved during pause for fast resume

## Dependencies

- `three`: Three.js library
- `@/lib/webgl/WebGLContextManager`: Context LRU management
- React hooks: `useRef`, `useEffect`, `useState`, `useCallback`

## Alternatives

**For Simple 3D**:
- `@react-three/fiber`: React renderer for Three.js
- `@react-three/drei`: Useful helpers for R3F

**For Model Loading**:
- GLTFLoader (Three.js example)
- FBXLoader (for Autodesk files)
- OBJLoader (for Wavefront files)

## Related Documentation

- `@/lib/webgl/WebGLContextManager` - Full context manager docs
- `GOLDEN_RULES.md` - WebGL management requirements (2.3, 2.4)

# `@/components/three` Module

## Layer 1: Module Overview

### Purpose
3D rendering component using Three.js library for WebGL content.

### Scope
- Three.js scene initialization
- Basic 3D object rendering (default cube)
- Auto-rotation animation
- SSR-safe rendering
- Responsive canvas sizing

## Layer 2: Component Architecture

### Component: `ThreeViewer`

**Responsibilities**:
- Initialize Three.js scene, camera, renderer
- Render 3D geometry with materials
- Handle animation loop
- Manage cleanup on unmount
- Support client-side only rendering

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
}
```

## Layer 3: Implementation Details

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
const renderer = new THREE.WebGLRenderer({ antialias: true })
renderer.setSize(width, height)
renderer.setPixelRatio(window.devicePixelRatio)  // Sharp rendering on retina displays
mountRef.current.appendChild(renderer.domElement)
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

### Animation Loop

```typescript
const animate = () => {
  requestAnimationFrame(animate)

  if (autoRotate) {
    cube.rotation.x += 0.01
    cube.rotation.y += 0.01
  }

  renderer.render(scene, camera)
}

animate()
```

**Purpose**: Continuous rotation animation at 60 FPS

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

### Cleanup Strategy

```typescript
return () => {
  window.removeEventListener('resize', handleResize)

  // Remove canvas from DOM
  if (mountRef.current && renderer.domElement) {
    mountRef.current.removeChild(renderer.domElement)
  }

  // Dispose Three.js resources
  geometry.dispose()
  material.dispose()
  renderer.dispose()
}
```

**Memory Management**:
- Event listeners removed
- DOM nodes cleaned up
- GPU resources freed

### Responsive Handling

```typescript
const handleResize = () => {
  camera.aspect = width / height
  camera.updateProjectionMatrix()
  renderer.setSize(width, height)
}

window.addEventListener('resize', handleResize)
```

**Note**: Currently updates to fixed `width`/`height` props, not viewport size

## Architecture Context

### Integration Points
- **Location**: `@/components/three` → 3D content
- **Library**: `three` (Three.js)
- **Used In**: Product showcases, interactive demos

### Design Patterns
- **SSR-Safe Component**: Client detection pattern
- **Resource Cleanup**: Proper disposal of GPU resources
- **Effect Dependency Array**: Re-initialize on prop changes

### Usage Example

```tsx
import { ThreeViewer } from '@/components/three'

<ThreeViewer
  width={800}
  height={600}
  autoRotate={true}
  className="rounded-lg shadow-lg"
/>
```

### Future Enhancements

**Model Loading** (currently stubbed):
```typescript
// Props exist but not implemented
modelUrl?: string

// Would use:
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'

const loader = new GLTFLoader()
loader.load(modelUrl, (gltf) => {
  scene.add(gltf.scene)
})
```

**Camera Control** (could add):
```typescript
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'

const controls = new OrbitControls(camera, renderer.domElement)
controls.enableDamping = true
```

## Performance Considerations

**Optimization Tips**:
1. Use `requestAnimationFrame` for smooth animation
2. Set `pixelRatio` to max 2 for high DPI (avoid 3x/4x)
3. Reuse geometries/materials when creating multiple meshes
4. Implement frustum culling for complex scenes
5. Use LOD (Level of Detail) for distant objects

**Common Issues**:
- **Memory leaks**: Always dispose geometries/materials
- **Blurry rendering**: Check `pixelRatio` and antialiasing
- **Dark scene**: Adjust light intensity
- **Poor performance**: Reduce polygon count, disable shadows

## Dependencies

- `three`: Three.js library
- React hooks: `useRef`, `useEffect`, `useState`

## Alternatives

**For Simple 3D**:
- `@react-three/fiber`: React renderer for Three.js
- `@react-three/drei`: Useful helpers for R3F

**For Model Loading**:
- GLTFLoader (Three.js example)
- FBXLoader (for Autodesk files)
- OBJLoader (for Wavefront files)

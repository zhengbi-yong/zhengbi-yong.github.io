# `@/components/maps` Module

## Layer 1: Module Overview

### Purpose
Interactive map visualization component using Leaflet library for geographical data presentation.

### Scope
- OpenStreetMap integration with Leaflet
- Interactive marker system with popups
- Client-side only rendering (SSR-safe)
- Responsive map container with loading states

## Layer 2: Component Architecture

### Component: `InteractiveMap`

**Responsibilities**:
- Initialize Leaflet map instance
- Render OpenStreetMap tile layer
- Display interactive markers with custom content
- Handle SSR hydration gracefully

**Props Interface**:
```typescript
interface MapMarker {
  id: string
  position: [number, number]  // [latitude, longitude]
  title?: string
  description?: string
}

interface InteractiveMapProps {
  center: [number, number]     // Map center coordinates
  zoom: number                  // Zoom level (0-18)
  markers?: MapMarker[]         // Array of markers to display
  className?: string            // Additional CSS classes
}
```

**State Management**:
- `map`: Leaflet Map instance
- `isClient`: Boolean flag for SSR detection

**Lifecycle**:
1. Client detection → Prevents SSR hydration errors
2. Map initialization → Creates Leaflet instance with tile layer
3. Marker rendering → Dynamically adds/removes markers based on props
4. Cleanup → Removes map instance on unmount

**Technical Notes**:
- Default marker icons patched via CDN (webpack compatibility fix)
- Uses OpenStreetMap tile server (free, no API key required)
- Automatic marker cleanup when props change
- Accessible loading placeholder with Chinese text

## Layer 3: Implementation Details

### Dependencies
- `leaflet`: Map rendering library
- React hooks: `useEffect`, `useRef`, `useState`

### Marker Management
```typescript
// Markers are cleared and re-rendered when props change
map.eachLayer((layer) => {
  if (layer instanceof L.Marker) {
    map.removeLayer(layer)
  }
})
```

### SSR Safety Pattern
```typescript
const [isClient, setIsClient] = useState(false)

useEffect(() => {
  setIsClient(true)
}, [])

// Render loading placeholder until client-side
if (!isClient) {
  return <div>Loading...</div>
}
```

### Integration Example
```tsx
import { InteractiveMap } from '@/components/maps'

<InteractiveMap
  center={[39.9042, 116.4074]}  // Beijing
  zoom={12}
  markers={[
    {
      id: '1',
      position: [39.9042, 116.4074],
      title: 'Beijing',
      description: 'Capital of China'
    }
  ]}
  className="w-full h-96"
/>
```

## Architecture Context

### Integration Points
- **Location**: `@/components/maps` → Maps/geo features
- **Dependencies**: `leaflet` (external)
- **Consumed by**: Pages requiring geographic visualization
- **Design System**: Follows loading state patterns from `@/components/loaders`

### Design Patterns
- **SSR-Safe Component**: Client detection pattern
- **Effect Cleanup**: Proper map instance disposal
- **Marker Reconciliation**: Clear-and-re-render strategy

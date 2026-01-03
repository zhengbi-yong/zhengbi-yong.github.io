# Excalidraw Components Module

## Purpose
Excalidraw diagram viewer and editor integration for hand-drawn style diagrams.

## Files
- `ExcalidrawViewer.tsx` - Excalidraw diagram viewer component
- `excalidraw.css` - Excalidraw-specific styles

## Architecture

### ExcalidrawViewer Component
```
ExcalidrawViewer (Client Component)
├── Dynamic import
│   ├── SSR: false (avoid hydration issues)
│   └── Loading state (Loader component)
├── Excalidraw instance
│   ├── Data (elements, appState, files)
│   ├── View mode (read-only)
│   └── Custom styling
├── Error handling
│   └── Toast notifications
└── Navigation
    └── Back button
```

### Data Schema
```typescript
type ExcalidrawElement = any  // Complex Excalidraw element type

interface ExcalidrawData {
  elements: ExcalidrawElement[]
  appState: any
  files: any
}
```

### Component Props
```typescript
interface ExcalidrawViewerProps {
  data: ExcalidrawData
  className?: string
}
```

### Key Features

#### Dynamic Import
```typescript
const Excalidraw = dynamic(
  () => import('@excalidraw/excalidraw').then(mod => ({
    default: mod.Excalidraw
  })),
  {
    ssr: false,  // Critical: client-side only
    loading: () => <Loader className="h-96 w-full" />
  }
)
```

#### View Mode
```typescript
// Read-only display
<Excalidraw
  initialData={data}
  viewModeEnabled={true}
/>
```

#### Error Handling
```typescript
// Try-catch with toast notifications
try {
  // Render Excalidraw
} catch (error) {
  logger.error('Excalidraw render error:', error)
  showToast('Failed to load diagram', 'error')
}
```

### Technologies
- @excalidraw/excalidraw (npm package)
- Next.js dynamic imports
- React hooks (useState, useEffect, useCallback)
- Custom logger

## Integration Points

### Data Loading
```typescript
// From API
const response = await fetch('/api/diagram/123')
const data = await response.json()
<ExcalidrawViewer data={data} />
```

### From Markdown
```typescript
// Embedded in .md files
// Frontmatter or custom syntax
// Parsed and rendered at build time
```

### Styling
```typescript
// Custom CSS for Excalidraw container
.excalidraw-container {
  width: 100%;
  height: 600px;
  border-radius: 8px;
}
```

## Data Flow
```
Data prop → Dynamic import Excalidraw → Load with initialData → Render in view mode → User views diagram
```

## Dependencies
- **External**: `@excalidraw/excalidraw`
- **Internal**:
  - `@/lib/utils/logger` - Error logging
  - `@/components/shadcn/ui/button` - UI components
  - `@/components/ui/Loader` - Loading indicator

## Performance Considerations

#### Bundle Size
- **Large package**: ~500KB gzipped
- **Code splitting**: Dynamic import reduces initial bundle
- **Lazy loading**: Load only when viewing diagram

#### SSR Issues
```typescript
// CRITICAL: Must use ssr: false
// Excalidraw relies on browser APIs (window, document)
// Server-side rendering will fail
```

#### Loading State
```typescript
// Show loader during import
loading: () => <Loader className="h-96 w-full" />
```

## Usage Examples

#### Basic Usage
```typescript
import ExcalidrawViewer from '@/components/Excalidraw/ExcalidrawViewer'

const diagramData = {
  elements: [
    { type: 'rectangle', x: 0, y: 0, width: 100, height: 100 }
  ],
  appState: {},
  files: {}
}

<ExcalidrawViewer data={diagramData} />
```

#### With Error Handling
```typescript
const [data, setData] = useState(null)
const [error, setError] = useState(null)

useEffect(() => {
  fetch('/diagram.json')
    .then(res => res.json())
    .then(setData)
    .catch(setError)
}, [])

{error && <p>Failed to load diagram</p>}
{data && <ExcalidrawViewer data={data} />}
```

## Styling
- **Container**: Full width, fixed height
- **Animations**: Fade in/out toasts
- **Dark mode**: Automatic theme detection
- **Responsive**: Mobile-friendly

## Limitations
- **View only**: Editing not enabled
- **Large files**: Performance degrades with complex diagrams
- **Mobile**: Limited screen real estate
- **Export**: Not implemented (requires editor mode)

## Future Enhancements
- [ ] Edit mode toggle
- [ ] Export to PNG/SVG
- [ ] Collaborative editing
- [ ] Custom libraries
- [ ] Image upload
- [ ] Hand-drawn recognition
- [ ] Diagram templates
- [ ] Version history
- [ ] Cloud storage integration
- [ ] Real-time collaboration

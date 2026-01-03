# `@/components/MDXComponents` Module

## Layer 1: Module Overview

### Purpose
MDX (Markdown + JSX) integration components for enhanced content authoring with interactive elements.

### Scope
- Excalidraw diagram embedding with modal viewer
- Interactive drawing canvas integration
- Accessible trigger components with keyboard navigation
- Responsive layout with dark mode support

## Layer 2: Component Architecture

### Component: `ExcalidrawEmbed`

**Responsibilities**:
- Render clickable placeholder for Excalidraw diagrams
- Launch full-featured drawing modal on interaction
- Provide accessible keyboard navigation (Enter/Space)
- Display customizable preview area

**Props Interface**:
```typescript
interface ExcalidrawEmbedProps {
  id?: string              // Optional diagram identifier
  width?: string           // Container width (default: "100%")
  height?: string          // Container height (default: "400px")
  readonly?: boolean       // View-only mode (default: true)
  title?: string           // Modal title (default: "Excalidraw 绘图")
}
```

**State Management**:
- `isModalOpen`: Controls modal visibility

**Interaction Design**:
- Click placeholder → Opens modal
- Keyboard (Enter/Space) → Opens modal
- Modal close → Returns to placeholder

**Accessibility Features**:
- `role="button"` on placeholder div
- `tabIndex={0}` for keyboard focus
- `aria-label` for screen readers
- `onKeyDown` handler for keyboard activation

## Layer 3: Implementation Details

### Dependencies
- `@/components/ui/ExcalidrawModal`: Full drawing interface
- `@/components/shadcn/ui/button`: Trigger button
- `@/components/lib/utils`: `cn()` class name utility

### Visual Design
```tsx
// Dashed border pattern for interactive placeholder
className={cn(
  'border-2 border-dashed border-gray-300',
  'hover:border-gray-400',
  'dark:border-gray-600 dark:hover:border-gray-500',
  'bg-gray-50 dark:bg-gray-800',
  'cursor-pointer'
)}
```

### Icon Integration
```tsx
// Pencil icon from lucide-react
<svg className="h-12 w-12">
  <path d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
</svg>
```

### Modal Launch Flow
1. User clicks placeholder or presses Enter/Space
2. `handleOpenModal()` sets `isModalOpen = true`
3. `ExcalidrawModal` renders with `isOpen={true}`
4. User creates/edits diagram in modal
5. Modal close callback resets state

### Integration Example
```tsx
import { ExcalidrawEmbed } from '@/components/MDXComponents'

// In MDX content
<ExcalidrawEmbed
  id="architecture-diagram"
  width="100%"
  height="500px"
  title="系统架构图"
/>
```

### MDX Configuration
The component is registered as an MDX component for use in markdown content:
```mdx
import { ExcalidrawEmbed } from '@/components/MDXComponents'

# My Article

Here's an interactive diagram:
<ExcalidrawEmbed title="Process Flow" />
```

## Architecture Context

### Integration Points
- **Location**: `@/components/MDXComponents` → Content authoring
- **Consumed by**: MDX renderer in blog posts
- **Depends on**: `@/components/ui/ExcalidrawModal` (drawing canvas)
- **Design System**: Shadcn/ui button components, Tailwind utilities

### Design Patterns
- **Placeholder Pattern**: Click preview to launch full interface
- **Modal Composition**: Separates trigger from modal logic
- **Accessibility First**: Full keyboard navigation support
- **SSR-Safe**: Client-side state management

### Related Components
- `@/components/ui/ExcalidrawModal`: Full drawing interface
- `@/components/lib/utils`: Shared utility functions
- Shadcn/ui buttons: Consistent interaction patterns

## Content Authoring Workflow

1. **Authoring**: Content creator adds `<ExcalidrawEmbed>` in MDX
2. **Preview**: Rendered as clickable placeholder in published content
3. **Interaction**: Reader clicks to open full drawing modal
4. **Creation**: Reader can create/view diagrams in modal
5. **Persistence**: Diagrams can be saved (if implemented in modal)

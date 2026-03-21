# frontend/src/components/

## OVERVIEW

React component library with 75 files. Organized by domain (magazine, UI, visualizations, chemistry, charts, etc.). NOT co-located with source files they're used in.

## STRUCTURE

```
src/components/
├── magazine/          # Magazine-style blog layouts
├── shadcn/ui/         # Shadcn UI components (15 files)
├── ui/                # Custom UI components (12 files)
├── animations/          # Animation wrappers (GSAP, Framer Motion)
├── chemistry/           # Chemistry visualizations (RDKit, 3Dmol)
├── charts/             # Chart components (Nivo, ECharts, Three.js)
├── audio/              # Audio/notation tools
├── book/               # Book reading interface
├── post/               # Post-related components
├── sections/           # Page sections (Hero, Features, etc.)
├── layouts/            # Layout components
├── loaders/            # Loading indicators
├── MDXComponents/     # MDX renderers
├── hooks/              # Custom hooks
├── seo/                # SEO components
└── social-icons/       # Social media icons
```

## WHERE TO LOOK

| Component Type | Location | Examples |
|--------------|----------|----------|
| Blog layouts | `magazine/` | `MagazineLayout.tsx`, `BlogSection.tsx` |
| UI components | `ui/`, `shadcn/ui/` | `Button.tsx`, `Input.tsx` (shadcn) |
| Visualizations | `chemistry/`, `charts/` | `MoleculeViewer.tsx`, `NivoChart.tsx` |
| Animation | `animations/` | `GSAPAnimation.tsx`, `FramerMotionWrapper.tsx` |
| 3D graphics | `three/` | `ThreeViewer.tsx` |

## CONVENTIONS

**Naming**: PascalCase for components, camelCase for props/state
**Styling**: Tailwind CSS (no inline styles, use className)
**Props**: Define explicit TypeScript interfaces for complex props
**Testing**: Co-located test in `frontend/tests/components/*.test.tsx`

**Import Order**:
```typescript
import React from 'react'
import { useState, useEffect } from 'react'
```

## ANTI-PATTERNS

- ❌ Inline styles (use className + Tailwind)
- ❌ Prop drilling beyond 3 levels
- ❌ useEffect for simple derived state
- ❌ Any imports (avoid generic `import * as`)

## NOTES

- 75 files total - use subdirectories to navigate
- Shadcn UI components at `shadcn/ui/` have their own docs
- Visualizations use RDKit.js, 3Dmol.js, Three.js
- Animation wrappers around GSAP and Framer Motion

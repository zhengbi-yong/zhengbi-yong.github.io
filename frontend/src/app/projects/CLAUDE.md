# Projects Page Module

## Purpose
Public-facing portfolio showcase displaying research and academic projects.

## Files
- `page.tsx` - Projects listing page component

## Architecture

### Component Structure
```
ProjectsPage (Server Component)
├── Header section
│   ├── Title ("项目")
│   └── Description ("研究和学术项目")
└── Projects grid (responsive)
    └── ProjectCard (for each project)
        ├── Image (optional)
        ├── Title
        ├── Description
        └── "Learn more" link
```

### Data Source
```typescript
// @/data/projectsData
interface Project {
  title: string
  description: string
  href: string
  imgSrc?: string
}
```

### Responsive Design
- **Mobile**: 1 column grid
- **Tablet**: 2 columns (md:)
- **Desktop**: 2 columns with larger gap (lg:)

### Card Interactions
- Hover: Shadow increase, lift animation (-translate-y-1)
- Image zoom: Scale 105% on hover
- Link underline animation: Width 0 → 100%

### Technologies
- Next.js App Router (Server Component)
- shadcn/ui Card components
- Next.js Image optimization
- Tailwind CSS

## Integration Points

### SEO
```typescript
// Uses centralized SEO utility
import { genPageMetadata } from '@/app/seo'
export const metadata = genPageMetadata({ title: 'Projects' })
```

### Data Layer
```typescript
// Static data import
import projectsData from '@/data/projectsData'
```

### Styling
```typescript
// shadcn/ui card component
import { Card, CardContent, CardHeader, CardTitle, CardDescription }
```

## Data Flow
```
projectsData (static) → Map to cards → Grid layout → Link to project details
```

## Dependencies
- **Internal**:
  - `@/data/projectsData` - Project metadata
  - `@/components/shadcn/ui/card` - Card components
  - `@/app/seo` - SEO metadata generation
- **External**: `next/image`, `next/link`

## Future Enhancements
- [ ] Filtering by category/topic
- [ ] Search functionality
- [ ] Pagination for large project lists
- [ ] Project preview modals
- [ ] Dynamic data from CMS
- [ ] Featured/pinned projects

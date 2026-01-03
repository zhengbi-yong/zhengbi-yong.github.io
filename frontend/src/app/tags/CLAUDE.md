# Tags Page Module

## Purpose
Displays all blog post tags with post counts, sorted by frequency.

## Files
- `page.tsx` - Tags listing page (Server Component)
- `tag-data.json` - Tag → count mapping (generated at build time)

## Architecture

### Component Structure
```
TagsPage (Server Component)
├── Header section
│   └── "Tags" title (responsive layout)
└── Tags cloud (flex wrap)
    └── TagItem (for each tag)
        ├── Tag component (colored badge)
        ├── Post count
        └── Link to /tags/{slug}
```

### Data Source
```typescript
// @/app/tag-data.json
{
  "tag-name": number_of_posts,
  ...
}
```

### Sorting Logic
```typescript
// Sort by post count (descending)
const sortedTags = tagKeys.sort((a, b) => tagCounts[b] - tagCounts[a])
```

### URL Generation
```typescript
// GitHub-style slugification
import { slug } from 'github-slugger'
href={`/tags/${slug(t)}`}  // e.g., /tags/react-hooks
```

### Technologies
- Next.js App Router (Server Component)
- github-slugger (URL-friendly slugs)
- Custom Tag component
- Tailwind CSS

## Integration Points

### SEO
```typescript
import { genPageMetadata } from '@/app/seo'
export const metadata = genPageMetadata({
  title: 'Tags',
  description: 'Things I blog about'
})
```

### Tag Component
```typescript
import Tag from '@/components/Tag'
// Renders styled badge with color coding
```

### Link Component
```typescript
import Link from '@/components/Link'
// Custom link with underline animation
```

### Dynamic Routes
```typescript
// Routes to /tags/[tag]/page.tsx
// Handles pagination via /tags/[tag]/page/[page]/page.tsx
```

## Data Flow
```
tag-data.json (build time) → Server Component → Sort by count → Render tags with links → Dynamic tag pages
```

## Dependencies
- **Internal**:
  - `@/app/tag-data.json` - Tag statistics
  - `@/components/Tag` - Tag badge component
  - `@/components/Link` - Custom link component
  - `@/app/seo` - Metadata generation
- **External**: `github-slugger`

## Future Enhancements
- [ ] Tag search/filter
- [ ] Tag groupings (category-based)
- [ ] Tag cloud visualization (sizing by frequency)
- [ ] Related tags suggestions
- [ ] Tag merging/splitting interface
- [ ] Real-time tag updates (CMS integration)

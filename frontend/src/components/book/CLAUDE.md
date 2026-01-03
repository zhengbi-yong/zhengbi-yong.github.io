# Book Components Module

## Purpose
Book-related UI components for displaying book categories, articles, and navigation.

## Files
- `ArticleCard.tsx` - Article display card component
- `BackToShelfButton.tsx` - Navigation back button
- `Book.tsx` - Main book category display
- `BookIcons.tsx` - Icon mapping for book categories
- `Chapter.tsx` - Chapter display component

## Architecture

### Book Component
```
Book (Client Component)
├── Performance detection
│   ├── Mobile check (window width)
│   └── Animation disable check
├── Theme detection (dark/light)
├── Animation optimization
│   └── getOptimizedAnimationParams()
└── Book card
    ├── Icon (category-specific)
    ├── Title (book.name)
    ├── Description (book.description)
    ├── Link to category
    └── Motion animation (staggered)
```

### Book Data Schema
```typescript
interface BookCategory {
  name: string
  description: string
  icon?: string
  color?: string
  count?: number
}
```

### Component Features

#### Book.tsx
- **Performance optimization**: Disables complex animations on low-end devices
- **Responsive**: Mobile-aware animation parameters
- **Theme support**: Dark/light mode color schemes
- **Staggered animations**: Index-based delay
- **Accessibility**: ARIA labels, semantic HTML

#### ArticleCard.tsx
- Article thumbnail and metadata
- Category tag
- Reading time estimate
- Author information
- Publication date
- Hover effects

#### BackToShelfButton.tsx
- Navigation to bookshelf
- Icon + text
- Smooth transition
- Breadcrumb integration

#### Chapter.tsx
- Chapter number/title
- Content preview
- Read progress indicator
- Link to full chapter

#### BookIcons.tsx
```typescript
// Icon mapping utility
export function getBookIcon(categoryName: string): React.ComponentType
// Returns appropriate icon for category
```

### Technologies
- React Client Components
- Framer Motion (animations)
- next-themes (theme detection)
- lucide-react (icons)
- Performance utilities

## Integration Points

### Book Categorizer
```typescript
import { getCategoryColorScheme } from '@/lib/utils/book-categorizer'
// Color schemes for categories
```

### Performance Optimization
```typescript
import {
  getOptimizedAnimationParams,
  shouldDisableComplexAnimations,
} from '@/lib/utils/performance-optimized'
// Device performance detection
```

### Theme System
```typescript
import { useTheme } from 'next-themes'
// Dark/light mode detection
```

### Routing
```typescript
const categoryUrl = `/blog/category/${encodeURIComponent(book.name)}`
// Category filtering
```

## Data Flow
```
Book data (props) → Performance check → Theme check → Animation params → Render with motion → Link to category
```

## Dependencies
- **Internal**:
  - `@/lib/utils/book-categorizer` - Category utilities
  - `@/lib/utils/performance-optimized` - Performance detection
- **External**: `framer-motion`, `next-themes`, `lucide-react`

## Styling
- **Color schemes**: Category-specific (getCategoryColorScheme)
- **Dark mode**: Full support
- **Animations**: Motion variants, optimized parameters
- **Responsive**: Mobile-first approach

## Performance Considerations

#### Optimization Strategies
- **Mobile detection**: Reduce animation complexity
- **Device capability**: Disable animations on low-end devices
- **Stagger delays**: Index-based (index * 0.1s)
- **Theme mounting**: Avoid hydration mismatch

#### Animation Parameters
```typescript
const { delay, duration } = getOptimizedAnimationParams(0.5, index * 0.1)
// Adjusted based on device performance
```

## Future Enhancements
- [ ] Book search functionality
- [ ] Filter by reading time
- [ ] Sort by date/popularity
- [ ] Book series support
- [ ] Reading progress tracking
- [ ] Bookmarks/favorites
- [ ] Sharing functionality
- [ ] Offline reading (PWA)

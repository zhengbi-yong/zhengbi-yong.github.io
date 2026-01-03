# frontend

## Purpose

Next.js 15 frontend providing blog UI with MDX rendering, authentication, admin panel, and magazine-style layouts.

## Quick Start

```bash
cd frontend

# Install dependencies
pnpm install

# Development server
pnpm dev

# Production build
pnpm build

# Start production server
pnpm start

# Linting
pnpm lint

# Type checking
pnpm tsc --noEmit
```

## Architecture

**Framework**: Next.js 15 (App Router)

**Language**: TypeScript 5.7+

**Package Manager**: pnpm

**Structure**:
```
frontend/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (auth)/            # Auth routes group
│   │   ├── (main)/            # Main application routes
│   │   ├── admin/             # Admin panel
│   │   ├── api/               # API routes (BFF)
│   │   └── layout.tsx         # Root layout
│   │
│   ├── components/            # React components
│   │   ├── auth/              # Authentication components
│   │   ├── blog/              # Blog components
│   │   ├── magazine/          # Magazine layout components
│   │   ├── sections/          # Page sections
│   │   ├── shadcn/ui/         # UI components
│   │   ├── layouts/           # Layout components
│   │   └── lib/               # Utility components
│   │
│   ├── lib/                   # Utilities
│   │   ├── utils/             # Helper functions
│   │   ├── store/             # State management
│   │   └── feature-flags.ts   # Feature toggles
│   │
│   └── styles/                # Styles
│       ├── tailwind.css       # Tailwind base
│       └── globals.css        # Global styles
│
├── public/                    # Static assets
├── package.json               # Dependencies
├── tsconfig.json              # TypeScript config
├── next.config.js             # Next.js configuration
├── tailwind.config.ts         # Tailwind configuration
└── components.json            # shadcn/ui config
```

## Key Technologies

### Core Framework
- **Next.js 15**: React framework with App Router
- **React 19**: UI library
- **TypeScript**: Type safety
- **pnpm**: Fast, disk space efficient package manager

### UI Components
- **Tailwind CSS 3.4**: Utility-first styling
- **shadcn/ui**: High-quality React components
- **Radix UI**: Unstyled, accessible components
- **Framer Motion**: Animation library
- **Lucide React**: Icon library

### Content & Markdown
- **MDX**: Markdown with JSX components
- **next-mdx-remote**: Remote MDX rendering
- **rehype-katex**: Math formula rendering
- **remark-gfm**: GitHub Flavored Markdown
- **react-syntax-highlighter**: Code highlighting

### State & Data
- **Zustand**: Lightweight state management
- **TanStack Query**: Server state management
- **Axios**: HTTP client

### Authentication
- **NextAuth.js**: Authentication solution
- **JWT**: Token-based auth

## Routing Structure

### App Router (Next.js 15)
```
app/
├── (auth)/                    # Auth route group
│   ├── login/
│   └── register/
│
├── (main)/                    # Main app routes
│   ├── page.tsx              # Homepage
│   ├── blog/
│   │   ├── page.tsx          # Blog index
│   │   └── [slug]/
│   │       └── page.tsx      # Blog post
│   ├── tags/
│   │   ├── [tag]/
│   │   │   └── page/[page]/  # Paginated tag pages
│   └── projects/             # Projects page
│
├── admin/                     # Admin panel
│   ├── analytics/
│   ├── comments/
│   ├── monitoring/
│   ├── posts/
│   ├── posts-simple/
│   ├── posts-refine/
│   ├── users/
│   ├── users-refine/
│   └── settings/
│
├── api/                       # API routes (BFF)
│   ├── newsletter/
│   ├── visitor/
│   └── visitors/
│
├── music/[name]/              # Music pages
│
└── layout.tsx                 # Root layout
```

## Key Features

### Magazine Layout
**Location**: `src/components/magazine/`

**Components**:
- `MagazineLayout.tsx` - Main layout wrapper
- `MasonryGrid.tsx` - Masonry grid system
- `ArticleCard.tsx` - Article display card
- `FilterBar.tsx` - Category/tag filtering
- `HeroSection.tsx` - Featured content
- `RecommendedSection.tsx` - Personalized recommendations

**Algorithms**: `src/lib/utils/recommendation-algorithm.ts`

### Authentication
**Location**: `src/components/auth/`

**Components**:
- `AuthButton.tsx` - Login/logout button
- `AuthModal.tsx` - Authentication modal
- Protected routes with middleware

### Blog System
**MDX Rendering**:
- Remote MDX processing
- Math formulas (KaTeX)
- Syntax highlighting
- Custom components
- Table of contents

**Components**: `src/components/post/`

### Admin Panel
**Location**: `src/app/admin/`

**Sections**:
- **Analytics**: Dashboard and metrics
- **Comments**: Comment moderation
- **Monitoring**: Health and performance
- **Posts**: Content management (multiple modes)
- **Users**: User management (multiple modes)
- **Settings**: Configuration

## Styling System

### Tailwind CSS
**Configuration**: `tailwind.config.ts`

**Custom Theme**:
- Colors: Primary, secondary, accent
- Fonts: Sans, serif, mono
- Spacing: Consistent scale
- Breakpoints: Mobile-first

### Global Styles
**Location**: `src/styles/globals.css`

**Contents**:
- CSS variables
- Tailwind imports
- Custom utilities
- Animation keyframes

## State Management

### Zustand Stores
**Location**: `src/lib/store/`

**Stores**:
- `auth-store.ts` - Authentication state
- `ui-store.ts` - UI state (modals, sidebars)
- `post-store.ts` - Blog post state
- `user-store.ts` - User preferences

### Feature Flags
**Location**: `src/lib/feature-flags.ts`

**Flags**:
- `ENABLE_MAGAZINE_LAYOUT`: Magazine UI
- `ENABLE_NEW_AUTH`: Updated auth flow
- `ENABLE_ANALYTICS`: Analytics tracking

## API Integration

### Backend API
**Base URL**: `NEXT_PUBLIC_API_URL` (from .env.local)

**Endpoints**:
```typescript
const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL;

// Blog posts
GET /api/v1/posts
GET /api/v1/posts/:slug

// Authentication
POST /api/v1/auth/login
POST /api/v1/auth/register
POST /api/v1/auth/logout

// Comments
GET /api/v1/posts/:slug/comments
POST /api/v1/comments
```

### BFF Pattern
**Location**: `src/app/api/`

**Purpose**: Backend for Frontend pattern

**Routes**:
- `/api/newsletter` - Newsletter subscription
- `/api/visitor` - Visitor tracking
- `/api/visitors` - Visitor analytics

## Performance Optimization

### Code Splitting
- Dynamic imports for heavy components
- Route-based splitting (automatic)
- Lazy loading for images

### Image Optimization
```tsx
import Image from 'next/image';

<Image
  src="/path/to/image"
  width={800}
  height={600}
  loading="lazy"
  placeholder="blur"
/>
```

### Bundle Analysis
```bash
cd frontend
ANALYZE=true pnpm build
# View report at .next/analyze/client.html
```

## Development Workflow

### Component Development
1. Create component in appropriate directory
2. Add TypeScript types
3. Implement with Tailwind classes
4. Add unit tests (if complex)
5. Update documentation

### Adding New Routes
1. Create directory in `src/app/`
2. Add `page.tsx`
3. Export metadata
4. Implement layout (optional)
5. Add navigation links

### Adding API Routes
1. Create directory in `src/app/api/`
2. Add `route.ts`
3. Implement handlers (GET, POST, etc.)
4. Add validation
5. Error handling

## Environment Configuration

### Required Variables (.env.local)
```bash
# Backend API
NEXT_PUBLIC_API_URL=http://localhost:3000
NEXT_PUBLIC_API_BASE_URL=http://localhost:3000/api/v1

# Site Configuration
NEXT_PUBLIC_SITE_URL=http://localhost:3001
```

### Optional Variables
```bash
# Analytics
NEXT_PUBLIC_GA_ID=GA-XXXXXXXXX

# Feature Flags
NEXT_PUBLIC_ENABLE_ANALYTICS=true
```

## Testing

### Unit Tests
```bash
pnpm test
pnpm test --watch
pnpm test --coverage
```

### E2E Tests (Planned)
```bash
pnpm test:e2e
```

### Linting
```bash
pnpm lint
pnpm lint --fix
```

### Type Checking
```bash
pnpm tsc --noEmit
```

## Build & Deployment

### Development Build
```bash
pnpm dev
# Runs on http://localhost:3001
```

### Production Build
```bash
pnpm build
pnpm start
```

### Static Export (if configured)
```bash
pnpm build
# Output in out/ directory
```

## Troubleshooting

### Build Errors
```bash
# Clear Next.js cache
rm -rf .next

# Clear node_modules
rm -rf node_modules
pnpm install

# Rebuild
pnpm build
```

### Type Errors
```bash
# Check types
pnpm tsc --noEmit

# Specific file
npx tsc --noEmit src/app/page.tsx
```

### Styling Issues
```bash
# Check Tailwind config
cat tailwind.config.ts

# Verify CSS imports
grep -r "import.*css" src/
```

## Key Dependencies

### Production
```json
{
  "next": "15.x",
  "react": "19.x",
  "typescript": "5.x",
  "tailwindcss": "3.4.x",
  "zustand": "4.x",
  "@tanstack/react-query": "5.x"
}
```

### Development
```json
{
  "@types/node": "20.x",
  "@types/react": "19.x",
  "eslint": "8.x",
  "prettier": "3.x"
}
```

## Documentation

**Internal**: Component-level CLAUDE.md files
- `src/app/*/CLAUDE.md`
- `src/components/*/CLAUDE.md`
- `src/lib/*/CLAUDE.md`

**See Also**:
- `package.json` - Full dependency list
- `next.config.js` - Next.js configuration
- `tailwind.config.ts` - Tailwind customization
- `../docs/` - User-facing documentation

## Best Practices

### Component Design
1. Keep components small and focused
2. Use TypeScript for all props
3. Implement proper error boundaries
4. Add loading states
5. Handle edge cases

### Performance
1. Use dynamic imports for code splitting
2. Implement proper caching
3. Optimize images (Next.js Image)
4. Lazy load below-fold content
5. Monitor bundle size

### Accessibility
1. Use semantic HTML
2. ARIA labels for interactive elements
3. Keyboard navigation support
4. Color contrast compliance
5. Screen reader testing

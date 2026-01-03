# `@/components/sections` Module

## Layer 1: Module Overview

### Purpose
Reusable section components for page layout, including headers, action bars, cards, and interactive content areas.

### Scope
- Page headers with animated text
- Action bars for project showcases
- Blog and portfolio cards
- Interactive explore section with animations
- Section headers and separators

## Layer 2: Component Architecture

### Component: `PageHeader`

**Responsibilities**:
- Display page title with animation
- Show optional description
- Render tag pills

**Props Interface**:
```typescript
interface PageHeaderProps {
  title: string
  description?: string
  tags?: string[]
  className?: string
}
```

**Features**:
- Animated text reveal (staggered characters)
- Responsive typography (4xl → 5xl)
- Centered layout with max-width constraints
- Tag pills with rounded borders

**Animation**:
```tsx
<AnimatedText delay={0.2} stagger={0.08} content={title} />
```

---

### Component: `ActionBar`

**Responsibilities**:
- Fixed bottom navigation bar
- Display project logo and tags
- Show GitHub link and visit button
- Framer Motion entrance animation

**Props Interface**:
```typescript
interface ActionBarProps {
  logo?: string | { src: string }
  tags?: string[]
  url?: string
  github?: string
  visitLabel?: string
  className?: string
}
```

**Layout Structure**:
```
[Logo] [Tag1] [Tag2] [GitHub] [Visit Button]
```

**Visual Design**:
- Fixed positioning (`bottom-5` → `bottom-8` on larger screens)
- Dark glassmorphism background (`bg-neutral-900`)
- Yellow primary button (`bg-yellow-300`)
- Responsive max-width (`max-w-[92vw]`)

**Logo Normalization**:
```typescript
// Supports: URL string, { src: string }, or text fallback
function normalizeLogo(logo?: LogoInput): string | null
```

---

### Component: `Explore`

**Responsibilities**:
- Grid layout for content exploration
- Interactive cards with images/animations
- Auto-playing video with intersection observer
- Responsive 3-column layout

**Grid Structure**:
```
┌─────────────┬─────────────┬─────────────┐
│ Design &    │ Writing     │ Matter.js   │
│ Code        │             │ Animation   │
│             │             │             │
├─────────────┼─────────────┤             │
│ Faves       │ My Tools    │             │
│ (Game       │ (Tools      │             │
│  Cassettes) │  Card)      │             │
└─────────────┴─────────────┴─────────────┘
```

**Video Auto-Play Logic**:
- Muted by default (browser requirement)
- Intersection observer for play/pause
- User interaction fallback for mobile
- Visibility change detection
- Max 3 play attempts (error recovery)

**CSS Modules**:
```typescript
import styles from './Explore.module.css'

// Used for:
// - .exploreContent: Container layout
// - .exploreList: Grid structure
// - .exploreItem: Card styling
// - .exploreFigure: Absolute positioning
```

---

### Component: `SectionHeader`

**Responsibilities**:
- Section title and description
- Consistent typography
- Optional alignment control

**Usage Pattern**:
```tsx
<SectionHeader
  title="Latest Posts"
  description="Thoughts on technology and design"
/>
```

---

### Component: `SeparatorLine`

**Responsibilities**:
- Visual separator between sections
- Consistent spacing
- Optional styling variants

---

### Component: `BlogCard` & `WorkCard`

**BlogCard**:
- Blog post preview with image
- Title, excerpt, date, tags
- Hover animations
- Link to full post

**WorkCard**:
- Portfolio project showcase
- Project thumbnail
- Tech stack tags
- External links (demo/source)

---

### Component: `BlogSection` & `WorksSection`

**Responsibilities**:
- Grid layout for cards
- Responsive columns (1 → 2 → 3)
- Gap and spacing control
- Optional section headers

**Grid Configuration**:
```tsx
className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3"
```

---

### Component: `FeaturedWork`

**Responsibilities**:
- Highlighted project showcase
- Larger card size
- Enhanced visual treatment
- Prominent positioning

## Layer 3: Implementation Details

### ActionBar Logo Handling

```typescript
// Three input formats supported:
logo: "/logo.png"           // URL string
logo: { src: "/logo.png" }  // Object with src
logo: "W."                  // Text fallback

// Normalization logic:
const logoSrc = normalizeLogo(logo)
const displayText = !logoSrc ? logo : 'W.'

// Render:
{logoSrc ? <Image src={logoSrc} /> : <span>{displayText}</span>}
```

### Explore Video Optimization

**Intersection Observer**:
```typescript
observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        video.play()  // Play when visible
      } else {
        video.pause() // Pause when off-screen
      }
    })
  },
  { threshold: 0.1, rootMargin: '50px' }
)
```

**Mobile Fallback**:
```typescript
// Mobile browsers block autoplay
if (/Android|iPhone|iPad|iPod/i.test(navigator.userAgent)) {
  // Wait for user interaction
  document.addEventListener('touchstart', tryPlay, { once: true })
}
```

### Responsive Grid Patterns

**Breakpoints**:
```tsx
// Mobile (default)
className="grid-cols-1"

// Small (sm: 640px)
className="sm:grid-cols-2"

// Large (lg: 1024px)
className="lg:grid-cols-3"
```

**Gap Scaling**:
```tsx
gap-3 → sm:gap-4 → md:gap-6
```

### Animation Strategy

**Framer Motion (ActionBar)**:
```tsx
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ delay: 0.2, duration: 0.5 }}
>
```

**AnimatedText (PageHeader)**:
```tsx
// Character-by-character reveal
<AnimatedText delay={0.2} stagger={0.08} content={title} />
```

## Architecture Context

### Integration Points
- **Location**: `@/components/sections` → Layout sections
- **Dependencies**:
  - `@/components/home/AnimatedText`: Text animations
  - `@/components/home/ToolsCard`: Tools showcase
  - `@/components/MatterAnimation`: Physics simulation
  - `@/components/Image`: Optimized images
  - `@/components/Link`: Custom link component
- **CSS Modules**: `Explore.module.css` for scoped styles

### Design Patterns
- **Compound Components**: Section + Cards + Headers
- **Responsive Grid**: Mobile-first layout
- **Progressive Enhancement**: Animations enhance but don't break
- **CSS Modules**: Scoped styling for complex layouts

### Usage Examples

**Page with Header**:
```tsx
<PageHeader
  title="Blog"
  description="Thoughts on technology"
  tags={['React', 'Next.js', 'TypeScript']}
/>
<BlogSection posts={posts} />
```

**Project Showcase**:
```tsx
<WorksSection projects={projects} />
<ActionBar
  logo="/project-logo.png"
  tags={['React', 'Node.js']}
  url="https://demo.com"
  github="https://github.com/user/repo"
/>
```

**Explore Section**:
```tsx
<Explore
  title="Explore"
  description="Discover my work and interests"
/>
```

## Performance Considerations

**Video Optimization**:
- Lazy load video (`preload="auto"`)
- Intersection observer for play/pause
- Mobile interaction fallback
- Remove listeners on unmount

**Image Optimization**:
- Use `@/components/Image` (Next.js Image wrapper)
- Lazy loading (`loading="lazy"`)
- Responsive sizes

**Animation Performance**:
- Use Framer Motion (GPU-accelerated)
- Stagger delays for smooth sequences
- Minimal layout thrashing

## Related Modules

- `@/components/home`: Animated text, tools card
- `@/components/magazine`: Alternative card layouts
- `@/components/loaders`: Loading states
- `@/components/lib/utils`: Utility functions

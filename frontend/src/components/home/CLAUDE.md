# Home Components Module

## Purpose
Homepage hero section components with advanced visual effects and interactions.

## Files
- `AnimatedText.tsx` - Animated text reveal component
- `HeroCard.tsx` - Main hero card with parallax effects
- `SocialCard.tsx` - Social media links card
- `ToolsCard.tsx` - Tools/technologies showcase card

## Architecture

### HeroCard Component
```
HeroCard (Client Component)
├── Parallax effects
│   ├── WebCase layer (strength: 25)
│   ├── ColorPicker layer (strength: 40)
│   └── Color layer (strength: 50)
├── Custom cursor
│   ├── Position tracking
│   ├── Smooth easing (0.12)
│   └── Visual feedback
├── Decorative elements
│   ├── Color picker SVG
│   ├── Color blob SVG
│   └── Cursor indicator
└── Responsive behavior
    └── Disabled on mobile (< 768px)
```

### Parallax System
```typescript
// Mouse-driven parallax with easing
const parallaxEasing = 0.08

// Layer-specific strengths
const webCaseStrength = 25
const colorPickerStrength = 40
const colorStrength = 50

// Calculation
const offsetX = (mouseXValue / window.innerWidth) * strength
const offsetY = (mouseYValue / window.innerHeight) * strength

// Apply with easing
element.style.transform = `translate(${offsetX}px, ${offsetY}px)`
```

### Custom Cursor
```typescript
// Smooth cursor following
const cursorEasing = 0.12
const targetPositionRef = useRef({ x: 0, y: 0 })

// RequestAnimationFrame loop
const animateCursor = () => {
  const currentX = parseFloat(cursorElement.style.x) || 0
  const currentY = parseFloat(cursorElement.style.y) || 0

  const newX = currentX + (targetX - currentX) * cursorEasing
  const newY = currentY + (targetY - currentY) * cursorEasing

  cursorElement.style.transform = `translate(${newX}px, ${newY}px)`
  requestAnimationFrame(animateCursor)
}
```

### Component Props
```typescript
interface HeroCardProps {
  imageUrl: string      // Background image
  title?: string        // Card title (default 'Home')
  link?: string         // Navigation link
  className?: string    // Custom styles
}
```

### Component Features

#### HeroCard
- **Multi-layer parallax**: 3 independent layers
- **Custom cursor**: Smooth-following indicator
- **Hover effects**: Scale, color changes
- **Mobile optimization**: Disabled on small screens
- **Performance**: RAF-based animation loop

#### AnimatedText
- Character-by-character reveal
- Staggered animations
- Custom timing
- Loop support

#### SocialCard
- Social media links
- Hover animations
- Icon-based
- External links

#### ToolsCard
- Technology showcase
- Grid layout
- Tool icons
- Descriptions

### Technologies
- React hooks (useState, useEffect, useRef)
- CSS transforms (parallax)
- RequestAnimationFrame (smooth animation)
- SVG graphics
- Next.js Image

## Integration Points

### Data Layer
```typescript
// Hero data from configuration
import heroData from '@/data/heroData'
```

### Routing
```typescript
// Link to featured pages
<Link href={link}>
  <HeroCard imageUrl={imageUrl} title={title} />
</Link>
```

### Styling
```typescript
// Custom CSS modules or Tailwind
import styles from './HeroCard.module.css'
```

## Data Flow
```
Mouse move → Track position → Calculate offsets → Apply parallax transforms → RAF loop → Smooth cursor → Render
```

## Dependencies
- **Internal**:
  - `@/components/Image` - Optimized image
  - `@/components/Link` - Custom link
  - `@/components/lib/utils` - Utilities (cn)
- **External**: None (vanilla JS + React)

## Performance Considerations

#### Optimization Strategies
- **Mobile detection**: Disable effects on small screens
- **RAF throttling**: Use requestAnimationFrame, not setInterval
- **Debouncing**: Mouse move events
- **Cleanup**: Remove event listeners on unmount
- **Will-change**: CSS property for GPU acceleration

#### Mobile Fallback
```typescript
if (window.innerWidth < 768) {
  // Skip parallax and custom cursor
  return
}
```

## Usage Examples

#### Basic HeroCard
```typescript
import HeroCard from '@/components/home/HeroCard'

<HeroCard
  imageUrl="/images/hero.jpg"
  title="Welcome"
  link="/about"
/>
```

#### Custom Styling
```typescript
<HeroCard
  imageUrl="/images/hero.jpg"
  className="custom-hero-styles"
  title="Portfolio"
/>
```

#### AnimatedText
```typescript
<AnimatedText
  text="Hello, World!"
  delay={0.5}
  duration={0.8}
/>
```

## Styling
- **Position**: Relative, with absolute layers
- **Z-index**: Layered for depth
- **Transitions**: Smooth parallax (easing)
- **Responsive**: Mobile-first

## Future Enhancements
- [ ] Scroll-triggered animations
- [ ] Video background support
- [ ] Interactive 3D elements
- [ ] Sound effects
- [ ] Gesture controls (swipe)
- [ ] VR/AR integration
- [ ] Particle effects
- [ ] WebGL backgrounds
- [ ] Lazy loading optimization

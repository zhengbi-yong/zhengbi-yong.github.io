# Animations Components Module

## Purpose
Reusable animation components for enhanced UI interactions and visual effects.

## Files
- `AdvancedScrollAnimation.tsx` - Scroll-triggered animations
- `BounceIn.tsx` - Bounce entrance animation
- `ConfettiAnimation.tsx` - Confetti celebration effect
- `ConfettiOnView.tsx` - Viewport-triggered confetti
- `ExplosionAnimation.tsx` - Explosion particle effect
- `FadeIn.tsx` - Simple fade entrance
- `FireworksAnimation.tsx` - Fireworks display
- `OptimizedPageTransition.tsx` - Page transition wrapper
- `ParallaxScroll.tsx` - Parallax scrolling effect
- `PinElement.tsx` - Pin-to-scroll element
- `RotateIn.tsx` - Rotation entrance
- `ScaleIn.tsx` - Scale entrance animation
- `ScrollReveal.tsx` - Scroll reveal animation
- `SlideIn.tsx` - Slide entrance animation
- `SparklesAnimation.tsx` - Sparkle particle effect
- `SVGPathAnimation.tsx` - SVG path drawing animation
- `SVGShapeMorph.tsx` - SVG shape morphing
- `TimelineAnimation.tsx` - Timeline scroll animation

## Architecture

### Animation Categories

#### Entrance Animations
```typescript
// Simple entrances
FadeIn, SlideIn, ScaleIn, RotateIn, BounceIn
// Props: direction, delay, duration, children
```

#### Scroll Animations
```typescript
// Viewport-triggered
ScrollReveal, AdvancedScrollAnimation, ParallaxScroll
// Props: threshold, delay, springConfig
```

#### Particle Effects
```typescript
// Canvas-based
Confetti, Explosion, Fireworks, Sparkles
// Props: particleCount, colors, duration
```

#### SVG Animations
```typescript
// Path manipulation
SVGPathAnimation, SVGShapeMorph
// Props: path, duration, easing
```

#### Special Effects
```typescript
// Interactive
PinElement, TimelineAnimation, ConfettiOnView
// Props: triggerOnce, springOptions
```

### Technologies
- Framer Motion (primary animation library)
- React hooks (useState, useEffect, useRef)
- Canvas API (particle effects)
- SVG manipulation

## Integration Points

### Framer Motion
```typescript
import { motion, useAnimation, useInView } from 'framer-motion'
// Core animation primitives
```

### Spring Animations
```typescript
// Framer Motion spring configuration
const springConfig = {
  type: 'spring',
  stiffness: 300,
  damping: 30,
}
```

### Viewport Detection
```typescript
import { useInView } from 'framer-motion'
// Trigger animations on scroll into view
```

## Usage Patterns

#### Basic Fade In
```typescript
<FadeIn delay={0.2}>
  <YourComponent />
</FadeIn>
```

#### Scroll Reveal
```typescript
<ScrollReveal threshold={0.3}>
  <YourComponent />
</ScrollReveal>
```

#### Confetti Celebration
```typescript
<ConfettiAnimation
  particleCount={100}
  colors={['#ff0000', '#00ff00', '#0000ff']}
  duration={3000}
/>
```

#### Parallax Effect
```typescript
<ParallaxScroll speed={0.5}>
  <YourBackground />
</ParallaxScroll>
```

## Performance Considerations

#### Optimization
- **GPU acceleration**: Use `transform` and `opacity`
- **Will-change**: Applied strategically for known animations
- **Throttle/debounce**: Scroll event listeners
- **RequestAnimationFrame**: For smooth updates

#### Bundle Size
- Tree-shakeable components
- Lazy load heavy canvas animations
- Dynamic imports for less common effects

## Data Flow
```
Component mount → Setup animation → Trigger (scroll/mount/view) → Animate → Cleanup
```

## Dependencies
- **External**: `framer-motion` (primary), `react-spring` (optional)

## Best Practices
- Keep animations under 300ms for UI feedback
- Use `transform` over position changes
- Provide `prefers-reduced-motion` media query support
- Test on low-end devices
- Use `layoutId` for shared element transitions

## Future Enhancements
- [ ] Lottie animation support
- [ ] GSAP integration option
- [ ] Animation presets library
- [ ] Visual animation editor
- [ ] Performance monitoring
- [ ] A11y improvements (respect prefers-reduced-motion)

# Immersive Homepage Redesign Design Spec

**Date**: 2026-04-03
**Status**: Approved
**Scope**: Full rewrite of Main.tsx and all homepage components
**Approach**: Full rewrite (Option A) — clean architecture, no legacy debt

## Overview

Complete redesign of the blog homepage from a conventional multi-section layout to an Awwwards-grade immersive digital experience. The page combines WebGL particle effects, Bento Grid content architecture, audio-reactive music visualization, and editorial typography to create a world-class personal blog homepage.

## Page Architecture

The page consists of 6 sections arranged as a narrative arc from top to bottom:

```
1. Immersive Hero          — Full-screen WebGL particles + bilingual hero text
2. Bento Grid Content Hub  — Modular grid showcasing latest content
3. Projects Gallery        — Horizontal scrolling project showcase
4. Music Experience        — Audio-reactive sheet music visualization
5. Latest Writing          — Editorial-style article listing
6. Mega Footer             — Full-screen call-to-action footer
```

### Navigation

- Auto-hide header: fully hidden during Hero section, fades in from top after scrolling past Hero
- GSAP ScrollTrigger controls header visibility
- Mobile: simplified header behavior, always visible after scroll

### Color System

- Supports dark/light mode toggle, defaults to system preference
- Dark base: `#0A0A0F` (background), with fluid gradient accents (indigo -> purple -> amber)
- Light base: `#FAFAFA` (background), with softer gradient accents
- Accent colors flow as CSS gradients across components

---

## Section 1: Immersive Hero

### Visual Composition

- **Background**: Three.js fluid particle cloud (2000-3000 particles on desktop, 500 on mobile)
- Particles simulate organic wave/data-flow motion, colors shift between indigo/purple/amber over time
- Custom vertex shader controls particle positions with noise-based displacement
- Custom fragment shader controls particle size and color with soft circular falloff

### Typography

- **Main title**: "Zhengbi Yong" in Newsreader or Playfair Display serif font, `clamp(3rem, 8vw, 8rem)`
- **Subtitle**: "Robotics · Multimodal Perception · Music" (English) + "机器人 · 多模态感知 · 音乐" (Chinese)
- Text uses `mix-blend-mode: difference` to ensure readability over particles
- Entry animation: GSAP SplitText effect — characters fade in one by one with blur-to-clear transition

### Scroll Indicator

- Bottom of Hero: thin pulsing line animation (CSS `@keyframes` pulse)
- Subtle downward arrow or infinite line suggesting depth

### Performance

- Three.js `Points` + `ShaderMaterial` for GPU-accelerated rendering
- `IntersectionObserver` to pause rendering when Hero is not visible
- Mobile: reduced particle count (500) with simpler CSS animation fallback
- `prefers-reduced-motion`: replace particles with static gradient background

### Implementation

- File: `components/home/HeroSection.tsx`
- Sub-component: `components/home/ParticleBackground.tsx`
- Shaders: `shaders/particles.vert`, `shaders/particles.frag`
- Libraries: Three.js, GSAP, Framer Motion

---

## Section 2: Bento Grid Content Hub

### Layout

- CSS Grid, desktop: 4 columns, tablet: 2 columns, mobile: 1 column
- Modules of varying sizes create visual rhythm

### Modules

| Module | Grid Span | Content | Hover Interaction |
|--------|-----------|---------|-------------------|
| Featured Post | 2 cols x 2 rows | Latest/pinned article with cover image | Image scale up + Z-axis float |
| Recent Post 1 | 1 col x 2 rows | Second newest article | Title slide + underline animation |
| Recent Post 2 | 1 col x 2 rows | Third newest article | Same as above |
| Featured Project | 2 cols x 1 row | Featured project with looping video embed | 3D tilt effect |
| Music Preview | 2 cols x 1 row (square aspect) | SVG sheet music snippet + play icon | Notes glow + micro audio preview |

### Visual Style — Glassmorphism 2.0

- Background: `rgba(255,255,255,0.03)` (dark mode), `rgba(0,0,0,0.02)` (light mode)
- Backdrop blur: `backdrop-blur(20px)`
- Border: `1px solid rgba(255,255,255,0.08)` (dark), `rgba(0,0,0,0.06)` (light)
- Border radius: `24px`
- Gap: `16px`
- Easing: `cubic-bezier(0.16, 1, 0.3, 1)` for all transitions

### Data Sources

- Articles: backend API via `usePosts()` hook (limit 3)
- Projects: `projectsData.ts` (first featured item)
- Music: `musicData.ts` (first item, simplified SVG staff notation — not full OSMD)

### Implementation

- Files: `components/home/BentoGrid.tsx`, `components/home/BentoCard.tsx`
- CSS Grid with named areas for desktop layout
- Responsive breakpoints collapse to simpler layouts on smaller screens

---

## Section 3: Projects Gallery

### Layout

- Horizontal scrolling gallery with CSS `scroll-snap-type: x mandatory`
- Cards with 4:5 aspect ratio, large cover image top half, info bottom half
- Drag-to-scroll via Framer Motion gesture handling

### Card Design

- Top 60%: project cover image or looping video (autoplay via IntersectionObserver)
- Bottom 40%: project title (serif font), category tag, year
- Hover: 3D tilt effect using CSS `perspective` + `rotateX/Y` following mouse position
- Dynamic shadow that shifts with tilt angle

### Background

- Section uses deep gradient background to create visual separation from adjacent sections
- Subtle grain texture overlay for depth

### Implementation

- File: `components/home/ProjectGallery.tsx`
- Data: `projectsData.ts`
- Libraries: Framer Motion (drag gestures), CSS scroll-snap

---

## Section 4: Music Experience

### Layout — Split Screen

- Left 60%: OSMD-rendered vector sheet music
- Right 40%: Track info (title, composer, description) + play/pause controls

### Sheet Music Rendering

- OpenSheetMusicDisplay renders MusicXML as SVG in the browser
- Theme-aware styling: dark mode uses gold/amber staff lines, light mode uses classic black
- Sheet music auto-scales responsively

### Audio-Reactive Visualization

- Three.js particle system as background layer behind the entire section
- Web Audio API `AnalyserNode` extracts real-time frequency/amplitude data (FFT)
- Particle size, position, and color respond to music frequency bands
- Bypasses DOM entirely via WebGL for 60fps audio visualization

### Synchronized Playback Cursor

- During playback, a glowing cursor/highlight flows across the rendered sheet music
- Cursor position synced to audio timestamp

### Implementation

- File: `components/home/MusicExperience.tsx`
- Sub-component: `components/home/AudioVisualizer.tsx`
- Libraries: OpenSheetMusicDisplay, Three.js, Web Audio API
- Audio source: pre-loaded audio file from music data

---

## Section 5: Latest Writing

### Layout — Editorial Style

- Featured card (left 60%): large serif title + excerpt + tags + reading time, subtle gradient background
- Two list cards (right 40%): compact layout with title + date + category
- Hover on list cards: entire row shifts right 8px with smooth transition

### Visual Treatment

- High-end magazine editorial feel
- Generous negative space (whitespace)
- Low-contrast neutrals for secondary text, punchy accent for interactive elements
- Serif font (Newsreader/Playfair Display) for titles, sans-serif for metadata

### Implementation

- File: `components/home/LatestWriting.tsx`
- Data: backend API via `usePosts()` hook (limit 3 articles)
- "View All" link to `/blog` with animated arrow

---

## Section 6: Mega Footer

### Full-Screen Call-to-Action

- Height: `100vh` — occupies full viewport
- Dark background: `#050505` (dark mode), deep indigo (light mode)
- High contrast text and interactive elements

### Content Structure

```
┌─────────────────────────────────┐
│                                 │
│     LET'S CREATE               │  <- Giant declaration text
│     SOMETHING TOGETHER          │     (clamp 4rem-10rem)
│                                 │
│     --- separator ---           │
│                                 │
│  Blog    Projects    Music      │  <- Navigation links
│              About              │
│                                 │
│  GitHub · Email · Social        │  <- Social links
│                                 │
│  (c) 2026 Zhengbi Yong          │  <- Copyright
└─────────────────────────────────┘
```

### Interactions

- Hover on links: underline animation + color shift
- Scroll-snap at bottom of page triggers smooth footer rise
- Social icons: scale up + color transition on hover
- Replaces existing Footer component on homepage only

### Implementation

- File: `components/home/MegaFooter.tsx`
- Navigation links from `siteMetadata.ts`
- Social links from `socialData.ts`

---

## Global Interaction System

### Custom Cursor

- Replaces system cursor on desktop (hidden on mobile/touch)
- Default: small dot + outer ring
- Context-sensitive morphing:
  - Over article cards: reading/book icon
  - Over project cards: arrow icon
  - Over music section: music note icon
  - Over clickable elements: pointer ring expansion
- Smooth interpolation between states (lerp 0.15)

### Scroll Animations (Scrollytelling)

- GSAP ScrollTrigger drives section-level animations
- Staged timing: title enters first (0ms), then content (+100-200ms)
- Easing: `cubic-bezier(0.16, 1, 0.3, 1)` (expo-out)
- Each section fades + slides in from below when entering viewport

### Page Transitions

- Bento Grid card clicks: card smoothly expands to fill viewport, transitions to detail page
- View Transition API (with GSAP FLIP fallback for unsupported browsers)

### Implementation

- File: `components/home/CustomCursor.tsx`
- Uses `mousemove` event listener with requestAnimationFrame for smooth interpolation
- GSAP ScrollTrigger for scroll-driven animations

---

## Performance Requirements

| Metric | Target |
|--------|--------|
| First Contentful Paint | < 1.5s |
| Time to Interactive | < 3s |
| Lighthouse Performance | > 85 |
| Animation FPS | >= 60fps |
| Desktop particles | ~2000 |
| Mobile particles | ~500 or CSS fallback |

### Optimization Strategy

- Three.js rendering offloaded to GPU via `ShaderMaterial`
- `IntersectionObserver` pauses off-screen WebGL canvases
- Lazy loading for heavy components (OSMD, Three.js scenes)
- Code splitting: separate chunks for Three.js, GSAP, OSMD
- Images: WebP format, lazy loading via IntersectionObserver
- Mobile detection: reduce particle count, disable 3D tilt, simplify cursor

---

## Accessibility Requirements

- `prefers-reduced-motion`: disable all WebGL particles, parallax, 3D effects. Replace with static gradient backgrounds and simple CSS transitions.
- WCAG 2.2 AA contrast ratios for all text
- Keyboard navigation: focusable elements have clear, designed focus rings
- Semantic HTML: `<section>`, `<article>`, `<nav>`, `aria-label` throughout
- Screen reader: hidden text descriptions for SVG sheet music graphics

---

## New Dependencies

| Package | Purpose | Status |
|---------|---------|--------|
| `@react-three/fiber` | React Three.js integration | New install needed |
| `@react-three/drei` | R3F helpers (particles, shaders) | New install needed |

Existing dependencies used:
- `three` (^0.183.2) — 3D rendering
- `gsap` (^3.14.2) — Animation platform
- `@gsap/react` (^2.1.2) — GSAP React hooks
- `framer-motion` (^12.34.3) — React animation
- `opensheetmusicdisplay` — Sheet music rendering (already installed)

---

## File Structure

```
frontend/src/
├── app/(public)/
│   ├── page.tsx                    <- Thin wrapper (unchanged)
│   └── Main.tsx                    <- Full rewrite: orchestrates 6 sections
├── components/home/
│   ├── HeroSection.tsx             <- WebGL particles + hero text
│   ├── ParticleBackground.tsx      <- Three.js particle system
│   ├── BentoGrid.tsx               <- Bento layout with modules
│   ├── BentoCard.tsx               <- Reusable glassmorphism card
│   ├── ProjectGallery.tsx          <- Horizontal scroll project cards
│   ├── MusicExperience.tsx         <- OSMD sheet music + audio controls
│   ├── AudioVisualizer.tsx         <- WebGL audio-reactive particles
│   ├── LatestWriting.tsx           <- Editorial article listing
│   ├── MegaFooter.tsx              <- Full-screen CTA footer
│   └── CustomCursor.tsx            <- Context-sensitive cursor
└── shaders/
    ├── particles.vert              <- Particle vertex shader
    └── particles.frag              <- Particle fragment shader
```

---

## Sections NOT Included in This Redesign

The following existing components will be removed from the homepage but remain available for other pages:
- `SocialCard.tsx` — social icon fan-out (replaced by Mega Footer)
- `HeroCard.tsx` — parallax hero image card (replaced by Hero Section)
- `Explore.tsx` / `Explore.module.css` — interactive cards grid (replaced by Bento Grid)
- `MatterAnimation.tsx` — Matter.js physics (replaced by Three.js particles)
- `NewsletterSignup.tsx` — email form (replaced by Mega Footer CTA)
- `ToolsCard.tsx` — tool icons grid (removed from homepage)
- `FeaturedWork.tsx` — project listing (replaced by Project Gallery)
- `BlogSection.tsx` — blog listing (replaced by Bento Grid + Latest Writing)

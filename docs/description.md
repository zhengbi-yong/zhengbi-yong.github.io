# Zhengbi Yong's Personal Blog - Comprehensive Project Documentation

## Table of Contents

1. [Project Overview](#project-overview)
2. [Technical Architecture](#technical-architecture)
3. [Core Features](#core-features)
4. [Performance Optimizations](#performance-optimizations)
5. [Security & Best Practices](#security--best-practices)
6. [Development Workflow](#development-workflow)
7. [Testing & Quality Assurance](#testing--quality-assurance)
8. [SEO & Analytics](#seo--analytics)
9. [Accessibility Features](#accessibility-features)
10. [Current Status](#current-status)
11. [Implementation Guides](#implementation-guides)

---

## Project Overview

Zhengbi Yong's Personal Blog is a sophisticated, enterprise-grade blogging platform built with cutting-edge web technologies. It serves as a technical blog covering robotics, automation, mathematics, computer science, chemistry, music, photography, and motor control, while demonstrating professional software development practices.

### Key Highlights

- **Next.js 16.0.10** with App Router and Turbopack for optimal performance
- **TypeScript 5.9.3** in strict mode with comprehensive type safety
- **Tailwind CSS 4.1.17** with custom design system
- **React 19.2.1** with latest features and Suspense boundaries
- **Contentlayer2 0.5.8** for advanced MDX processing
- **Comprehensive integrations**: Excalidraw, Three.js, Chemistry visualizations
- **Multi-language support** (English/Chinese) with i18next
- **Dark/light theme** with system preference detection
- **Production-ready** with monitoring and error tracking

### Current Performance

- **Version**: 2.3.0
- **Build Tool**: Turbopack (Next.js 16 default)
- **Bundle Analysis**: Available with `pnpm analyze`
- **Testing**: Vitest with React Testing Library
- **Documentation**: Storybook for component showcase

---

## Technical Architecture

### Core Technology Stack

#### Frontend Framework

- **Next.js 16.0.10**: App Router, Server Components, ISR, Turbopack
- **React 19.2.1**: Concurrent features, Suspense boundaries, Server Components
- **TypeScript 5.9.3**: Strict mode, path aliases, advanced typing
- **Turbopack**: Next-generation bundler for faster builds

#### Styling & UI

- **Tailwind CSS 4.1.17**: Utility-first CSS with custom configuration
- **Framer Motion 12.23.25**: Production-ready animations
- **Radix UI**: Accessible component primitives
- **Shadcn UI**: Modern component library built on Radix
- **Lucide React**: Comprehensive icon library
- **GSAP**: Advanced animation library alongside Framer Motion

#### Content Management

- **Contentlayer2 0.5.8**: Advanced MDX/Markdown processing
- **Pliny 0.4.1**: Search functionality and analytics
- **MDX**: JSX support in Markdown
- **Remark/Rehype**: Plugin ecosystem for content transformation

#### Internationalization

- **react-i18next 16.5.0**: Production-ready i18n framework
- **i18next 25.7.3**: Core internationalization library
- **i18next-browser-languagedetector 8.2.0**: Automatic language detection

#### Performance & Monitoring

- **Next.js Image**: Automatic optimization (AVIF/WebP support)
- **Bundle Analyzer**: Package size analysis
- **Sentry 10.30.0**: Error tracking and performance monitoring
- **Service Worker**: Offline support and caching

### Project Structure

```
zhengbi-yong.github.io/
├── app/                      # Next.js App Router
│   ├── blog/               # Blog-related pages
│   │   ├── category/       # Category pages
│   │   └── [...slug]/      # Dynamic article pages
│   ├── excalidraw/         # Excalidraw whiteboard page
│   ├── layout.tsx          # Root layout
│   ├── page.tsx           # Homepage
│   ├── globals.css        # Global styles
│   └── api/               # API routes
├── components/              # React components (50+)
│   ├── ui/               # Base UI components
│   ├── seo/              # SEO components
│   ├── hooks/            # Custom hooks
│   ├── animations/       # Animation components
│   ├── layouts/          # Page layouts
│   ├── Excalidraw/       # Drawing tools
│   ├── chemistry/        # Chemistry visualization
│   ├── audio/            # Audio components
│   ├── debug/            # Debug tools
│   └── comments/         # Comment system
├── data/                  # Static content
│   ├── blog/             # Blog posts (MDX) organized by category
│   │   ├── chemistry/    # Chemistry articles
│   │   ├── computer/     # Computer science
│   │   ├── math/         # Mathematics
│   │   ├── motor/        # Motor control
│   │   ├── music/        # Music theory
│   │   ├── photography/  # Photography
│   │   ├── robotics/     # Robotics
│   │   ├── social/       # Social commentary
│   │   └── tactile/      # Tactile sensing
│   └── siteMetadata.ts   # Site configuration
├── layouts/               # Layout components
│   ├── PostLayout.tsx    # Standard post layout
│   ├── PostSimple.tsx    # Simple post layout
│   └── PostBanner.tsx    # Banner post layout
├── lib/                   # Utilities
│   ├── cache/           # Cache management
│   ├── store/           # State management (Zustand)
│   ├── utils/           # Helper functions
│   └── security/        # Security utilities
├── public/               # Static assets
│   ├── sw.js           # Service Worker
│   └── structures/     # 3D chemical models
├── scripts/              # Build and utility scripts
│   ├── generate-search.mjs
│   ├── postbuild.mjs
│   └── generate-stories.mjs
├── styles/              # Style files
├── test/                # Test files
├── tests/               # More test files
├── types/               # TypeScript definitions
├── .storybook/          # Storybook configuration
└── vitest.config.ts     # Test configuration
```

---

## Core Features

### 1. Content Management System

#### Advanced MDX Processing

- **Type-safe content** with auto-generated TypeScript definitions
- **Frontmatter validation** with required metadata
- **Content transformation** pipeline with extensive plugin support
- **Auto-generated TOC** (Table of Contents)
- **Reading time** calculation
- **Code highlighting** with Prism Plus
- **Math rendering** with KaTeX
- **Citation support** with rehype-citation

#### Content Categories (9 Active Categories)

- **Computer Science**: Bash hotkeys, tmux, VPN, development tools
- **Mathematics**: MDX tutorials, mathematical content
- **Motor Control**: ODrive, VESC, motor control theory
- **Music**: Genre theory, music notation display
- **Photography**: Lens guides, photography techniques
- **Robotics**: DDS, IsaacSim, reinforcement learning
- **Social**: Software recommendations
- **Tactile**: Sensor technology
- **Chemistry**: Newly added category for chemical content and visualizations

### 2. Search & Discovery

#### Advanced Search (Pliny Integration)

- **Kbar command palette** for keyboard-driven navigation
- **Full-text search** across all content
- **Real-time filtering** by category and tags
- **Search analytics** for user insights
- **Search index generation** on build

#### Content Organization

- **Tag system** with automatic tag pages
- **Category filtering** with dedicated category pages
- **Related content** suggestions
- **Breadcrumb navigation** support
- **Dynamic sitemap** generation

### 3. Interactive Features

#### Excalidraw Integration (Fully Implemented)

- **Whiteboard drawing** tool with full Excalidraw integration
- **Drawing storage** with localStorage management
- **Export functionality** (PNG, SVG, JSON formats)
- **Mobile-responsive** design
- **Dark/light theme** support
- **Dedicated page** at `/excalidraw`
- **Components**: ExcalidrawViewer, ExcalidrawExport, ExcalidrawStorage

#### Three.js/3D Visualizations

- **Multiple Three.js viewers** (ThreeViewer, ThreeJSViewer, ThreeViewerWrapper)
- **Hero 3D section** with animated models
- **3D model support** with URDF loader for robotics
- **@tresjs/core** integration for simplified Three.js usage
- **Matter.js physics** integration
- **Interactive controls** and animations

#### Chemistry Visualization

- **3Dmol.js integration** for molecular visualization
- **Support for multiple formats**: PDB, SDF, XYZ, MOL, CIF
- **mhchemparser** for chemical formulas in MDX
- **Auto-rotation** and interactive controls
- **Theme-aware** rendering
- **Custom chemistry components** for MDX

#### Music & Audio Features

- **Custom music player** component
- **Music notation display** with OpenSheetMusicDisplay
- **Fullscreen music** sheet viewer
- **Tone.js integration** for audio synthesis
- **Interactive audio** components

### 4. User Experience

#### Theme System

- **Dark/light modes** with system preference detection
- **next-themes** integration
- **Custom color schemes**
- **Reduced motion** support
- **High contrast** mode support

#### Performance Features

- **Progressive loading** for images and content
- **Skeleton screens** for better perceived performance
- **Reading progress** indicators
- **Offline support** with Service Worker
- **Lazy loading** for heavy components

#### Responsive Design

- **Mobile-first** approach
- **Touch-optimized** interactions
- **Adaptive layouts** for all screen sizes
- **Tailwind's responsive** utilities

---

## Performance Optimizations

### Bundle Optimization

#### Code Splitting (Implemented)

- **Dynamic imports** for heavy libraries (Excalidraw, Three.js)
- **Route-based code** splitting
- **Component-level lazy** loading
- **Turbopack bundler** for optimized builds

#### Tree Shaking

- **ESM modules** for better static analysis
- **Selective imports** for large libraries
- **Unused code elimination**

### Image Optimization

#### Next.js Image Component

- **Automatic format selection** (AVIF/WebP priority)
- **Responsive images** with srcset generation
- **Lazy loading** with intersection observer
- **Remote patterns** configured for external images

### Caching Strategy

#### Multi-layer Caching

1. **Service Worker**: Offline-first strategy with cache management
2. **Next.js Cache**: Automatic caching optimization
3. **Browser Cache**: Static assets with appropriate headers

#### Service Worker Implementation

```javascript
// public/sw.js - Active service worker
- Cache management with version control
- Offline fallback pages
- Stale-while-revalidate strategy
- Background sync capabilities
```

### Performance Monitoring

#### Sentry Integration

- **Error tracking** with detailed context
- **Performance monitoring** (transaction tracking)
- **Release tracking** for deployments
- **User feedback** collection

---

## Security & Best Practices

### Content Security Policy (CSP)

#### Dynamic CSP Generation

- **Environment-aware** CSP configuration
- **Production strict** mode
- **Development flexible** mode
- **Domain whitelisting** for external services

### Security Headers (Comprehensive)

- **X-Frame-Options**: DENY
- **X-Content-Type-Options**: nosniff
- **X-DNS-Prefetch-Control**: on
- **Strict-Transport-Security**: HSTS in production
- **Permissions-Policy**: Restricted API access
- **Cross-Origin policies**: COOP, COEP, CORP

### Input Validation

- **Content sanitization** for MDX content
- **XSS prevention** measures
- **CSRF protection** implementation
- **Type safety** with TypeScript strict mode

---

## Development Workflow

### Development Setup

#### Prerequisites

```bash
# Node.js version
node --version  # >= 18.0.0

# Package manager
pnpm --version  # >= 10.24.0
```

#### Installation & Scripts

```bash
# Install dependencies
pnpm install

# Development server with Turbopack
pnpm dev

# Build project
pnpm build

# Analyze bundle size
pnpm analyze

# Run tests
pnpm test

# Storybook
pnpm storybook
```

### Build Process

#### Content Processing

```bash
# Contentlayer builds MDX content
pnpm contentlayer

# Generate search index
node ./scripts/generate-search.mjs

# Post-build processing
node ./scripts/postbuild.mjs
```

#### Git Workflow

- **Husky** for git hooks
- **lint-staged** for pre-commit checks
- **Conventional commits** format
- **Automated linting** and formatting

### Quality Tools

#### ESLint Configuration

- **Next.js ESLint** rules
- **TypeScript ESLint** plugin
- **Prettier integration**
- **Storybook linting**

#### Testing Setup

- **Vitest 4.0.15** as test runner
- **React Testing Library** for component tests
- **Coverage reporting** with v8
- **Test utilities** setup

---

## Testing & Quality Assurance

### Test Configuration

#### Vitest Setup

```typescript
// vitest.config.ts - Active configuration
- TypeScript support
- jsdom environment
- Test setup files
- Coverage configuration
- Path aliases configured
```

### Test Structure

```
test/
├── components/     # Component tests
└── setup.ts.bak    # Test setup backup

tests/
├── lib/           # Library tests
├── setup.ts       # Main test setup
└── setup.ts.bak   # Backup setup
```

### Component Testing (Partially Implemented)

- **Basic test setup** configured
- **Test utilities** available
- **Coverage reporting** ready
- **Storybook testing** integration

---

## SEO & Analytics

### SEO Optimization (Implemented)

#### Dynamic Sitemap

- **Automated sitemap** generation
- **Includes all blog** posts and pages
- **Proper lastModified** dates
- **Priority and** changeFrequency settings

#### Meta Tags

- **OpenGraph** support
- **Twitter Card** meta tags
- **JSON-LD structured** data ready
- **Dynamic meta** generation

### Analytics (Configured)

#### Analytics Providers

- **Umami Analytics** (primary)
- **Sentry** for error tracking
- **Pliny analytics** integration
- **Custom visitor** tracking

#### Tracking Features

- **Page view** tracking
- **Article analytics** with reading time
- **User engagement** metrics
- **Error boundary** reporting

---

## Accessibility Features

### ARIA Implementation

- **ARIA labels** and roles
- **Keyboard navigation** support
- **Screen reader** optimizations
- **Focus management** systems

### Motion Support

- **Reduced motion** preference respected
- **Animation controls** available
- **Performance optimizations** for reduced motion

### Theme Support

- **High contrast** mode
- **System preference** detection
- **Theme persistence** across sessions

---

## Current Status

### Version Information

- **Current Version**: 2.3.0
- **Next.js**: 16.0.10 with Turbopack enabled
- **Last Update**: December 2025
- **Status**: Active development

### Recently Implemented

1. **Chemistry category** with 3D visualization support
2. **Excalidraw integration** with full drawing capabilities
3. **Enhanced testing** setup with Vitest
4. **Storybook configuration** for component documentation
5. **Performance optimizations** with Turbopack

### Active Features

✅ Multi-layout blog posts
✅ Tag system and categorization
✅ Advanced search with Kbar
✅ Dark/light theme support
✅ Internationalization (i18next)
✅ Excalidraw whiteboard integration
✅ Three.js 3D visualizations
✅ Chemistry molecular visualization
✅ Music notation display
✅ Analytics and error tracking
✅ Service Worker for offline support
✅ Comprehensive testing setup
✅ Storybook documentation

### Known Limitations

- **E2E tests**: Setup available but tests not yet written
- **PWA manifest**: Service Worker active but manifest needs enhancement
- **Performance monitoring**: Configured but custom metrics need implementation

---

## Implementation Guides

### Adding New Blog Posts

1. **Create MDX File**

```bash
# Navigate to appropriate category
cd data/blog/[category]

# Create new MDX file
touch new-article.mdx
```

2. **Add Required Frontmatter**

```yaml
---
title: 'Article Title'
date: '2025-01-15'
summary: 'Brief description of the article'
tags: ['tag1', 'tag2', 'tag3']
draft: false
lastmod: '2025-01-16' # optional
---
```

3. **Write Content with MDX Support**

- Import React components
- Use math notation with KaTeX
- Add chemical formulas with mhchem
- Include interactive visualizations

### Using Excalidraw Drawings in Posts

1. **Create Drawing**

- Visit `/excalidraw` to create drawings
- Drawings are automatically saved to localStorage

2. **Embed in MDX**

```mdx
import { ExcalidrawEmbed } from '@/components/Excalidraw/ExcalidrawEmbed'

<ExcalidrawEmbed id="drawing-id" width="100%" height="400px" />
```

### Creating New Components

1. **Component Structure**

```
components/
├── YourComponent/
│   ├── YourComponent.tsx
│   ├── YourComponent.stories.tsx (optional)
│   └── index.ts
```

2. **Storybook Documentation**

```bash
# Generate stories automatically
pnpm generate-stories

# View components
pnpm storybook
```

### Testing Components

```typescript
// test/components/YourComponent.test.tsx
import { render, screen } from '@testing-library/react'
import { YourComponent } from '@/components/YourComponent'

describe('YourComponent', () => {
  it('renders correctly', () => {
    render(<YourComponent />)
    expect(screen.getByText('Expected text')).toBeInTheDocument()
  })
})
```

### Environment Configuration

#### Development

```bash
# .env.local
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_ANALYTICS_ID=your-analytics-id
```

#### Production

```bash
# .env.production
NEXT_PUBLIC_SITE_URL=https://yourdomain.com
NEXT_PUBLIC_ANALYTICS_ID=production-analytics-id
SENTRY_DSN=your-sentry-dsn
```

---

## Deployment

### Build Commands

```bash
# Development build
pnpm dev

# Production build
pnpm build

# Bundle analysis
pnpm analyze

# Static export (if needed)
pnpm build
```

### CI/CD

- **GitHub Actions** configured
- **Automated testing** on PR
- **Bundle analysis** available
- **Deployment ready** for static hosting

---

## Support

### Resources

- [Next.js 16 Documentation](https://nextjs.org/docs)
- [Tailwind CSS 4 Documentation](https://tailwindcss.com/docs)
- [Contentlayer Documentation](https://contentlayer.dev)
- [Framer Motion Documentation](https://www.framer.com/motion)
- [Excalidraw Documentation](https://excalidraw.com)

### Component Documentation

- **Storybook**: Run `pnpm storybook` to view all components
- **Auto-generated stories**: 132+ components documented
- **Interactive examples**: Available for all UI components

---

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## Acknowledgments

- [Next.js](https://nextjs.org/) for the React framework
- [Tailwind CSS](https://tailwindcss.com/) for the utility-first CSS framework
- [Vercel](https://vercel.com/) for hosting inspiration
- The open-source community for all the amazing tools and libraries

---

_Last updated: December 2025_
_Version: 2.3.0_

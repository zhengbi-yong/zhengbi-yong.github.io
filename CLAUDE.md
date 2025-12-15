# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is Zhengbi Yong's Personal Blog - a sophisticated blogging platform built with Next.js 16, TypeScript, and modern web technologies. The blog features technical content about robotics, automation, mathematics, and computer science.

## Essential Commands

### Development

```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev

# Build for production
pnpm build

# Run linting
pnpm lint

# Start production server
pnpm start
```

### Content Management

- Blog posts are stored in `/data/blog/[category]/` as MDX files
- Use Contentlayer2 for processing - content is automatically transformed on build
- Frontmatter metadata is required for all posts
- Categories: Computer Science, Mathematics, Motor Control, Music, Photography, Robotics, Social, Tactile

## Architecture Overview

### Core Structure

- **App Router (`/app`)**: Next.js pages with dynamic routing for blog posts, tags, and pagination
- **Components (`/components`)**: Reusable React components including MDX components, 3D viewers, animations
- **Data (`/data`)**: Static content organized by category, site metadata, navigation configs
- **Layouts (`/layouts`)**: Specialized layouts for posts (PostLayout, PostSimple, PostBanner), lists, and bookshelf
- **Lib (`/lib`)**: Utilities, configurations, and helper functions

### Content Pipeline

1. MDX files in `/data/blog/[category]/` with frontmatter
2. Contentlayer2 processes content with remark/rehype plugins
3. Automatic features: TOC generation, reading time, code highlighting, math rendering
4. Build-time content generation for static pages

### Key Technologies

- **Next.js 16** with App Router and Turbopack
- **TypeScript** with strict mode and path aliases
- **Tailwind CSS 4** with custom theme and animations
- **Contentlayer2** for MDX/Markdown processing
- **Framer Motion** for animations
- **Three.js** for 3D visualizations
- **Prism** for code highlighting
- **KaTeX** for math formulas

### Special Features

- Multi-layout blog posts (3 different layouts)
- Tag system with automatic tag pages
- Search functionality with Kbar command panel
- Giscus comment system
- Dark/light theme switching
- Music notation display
- 3D model visualization
- Interactive animations

## Development Protocol

This project follows a strict 5-mode development protocol (defined in .cursor/rules/riper-5.mdc):

1. **RESEARCH**: Information gathering only
2. **INNOVATE**: Brainstorming solutions
3. **PLAN**: Detailed technical specifications
4. **EXECUTE**: Implementation following exact plan
5. **REVIEW**: Verification against plan

Always follow this protocol when making changes to ensure structured development.

## Important Configuration

### Path Aliases (tsconfig.json)

- `@/`: Root directory
- `@/app/*`: App directory
- `@/components/*`: Components directory
- `@/data/*`: Data directory
- `@/layouts/*`: Layouts directory
- `@/lib/*`: Library directory

### Content Structure

- Each blog post must have frontmatter with title, date, tags, and other metadata
- Images should be placed in `/public` and referenced with absolute paths
- Use MDX components for custom content types

### Security

- Content Security Policy configured in next.config.js
- Image optimization enabled
- Security headers properly set

## Build Process

1. Contentlayer processes all MDX files
2. Static pages are generated for all content
3. Images are optimized
4. Bundle is analyzed (optional via `ANALYZE=true pnpm build`)
5. Production-ready output in `.next` directory

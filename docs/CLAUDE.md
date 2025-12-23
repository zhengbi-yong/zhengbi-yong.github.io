# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is Zhengbi Yong's Personal Blog - a sophisticated dual-architecture blogging platform built with Next.js 16 frontend and Rust backend. The blog features technical content about robotics, automation, mathematics, computer science, and tactile sensing.

**About the Author**: Zhengbi Yong is a Master's student at Beijing Institute of Technology (formerly at Tsinghua University), researching robotics and multimodal perception under Professor Shi Dawai.

**Blog URL**: https://zhengbi-yong.github.io

---

## Essential Commands

### Frontend Development

```bash
cd frontend

# Install dependencies
pnpm install

# Start development server (port 3001)
pnpm dev

# Build for production
pnpm build

# Run linting
pnpm lint

# Run tests
pnpm test
pnpm test:coverage
pnpm test:ui

# Analyze bundle size
ANALYZE=true pnpm build

# Start production server
pnpm start

# Generate search index (included in build)
node ./scripts/generate-search.mjs
```

### Backend Development

```bash
cd backend

# Start development environment (PostgreSQL + Redis)
./deploy.sh dev

# Build and run the API
export DATABASE_URL=postgresql://blog_user:blog_password@localhost:5432/blog_db
export REDIS_URL=redis://localhost:6379
cargo run --bin blog-api

# Production deployment
./deploy.sh prod

# Stop all services
./deploy.sh stop

# Check service status
./deploy.sh status

# Run tests
cargo test

# Run with debug logging
RUST_LOG=debug cargo run
```

---

## Architecture Overview

### Frontend Structure

```
frontend/
├── app/                      # Next.js App Router pages
│   ├── blog/[...slug]/      # Dynamic blog post routes
│   ├── tags/[...slug]/      # Tag filter pages
│   ├── page.tsx             # Homepage
│   ├── layout.tsx           # Root layout with providers
│   └── globals.css          # Global styles
├── components/              # React components
│   ├── MDXComponents/       # Custom MDX components for blog content
│   ├── analytics/           # Umami, Google Analytics integrations
│   ├── comments/            # Giscus comment system
│   ├── search/              # Kbar search panel
│   ├── 3d/                  # Three.js, TresJS, 3Dmol viewers
│   ├── chemistry/           # RDKit chemistry visualizations
│   ├── charts/              # Nivo, ECharts, G2, G6 charts
│   ├── music/               # Music notation (OSMD) and audio (Tone.js)
│   ├── math/                # Math rendering (KaTeX)
│   ├── format/              # Date formatting utilities
│   ├── layout/              # Layout components (Hero, Section)
│   ├── card/                # Blog post cards
│   ├── social/              # Social media icons
│   └── tag/                 # Tag-related components
├── data/                    # Static content
│   ├── blog/[category]/     # Blog posts by category
│   ├── authors/             # Author profiles
│   ├── siteMetadata.ts      # Site configuration
│   └── tag-data.json        # Auto-generated tags
├── layouts/                 # Page layouts
│   ├── PostLayout.tsx       # Full-featured post layout
│   ├── PostSimple.tsx       # Minimal post layout
│   └── PostBanner.tsx       # Banner-style post layout
├── lib/                     # Utilities and configurations
│   ├── contentlayer.ts      # MDX processing config
│   ├── utils.ts             # Helper functions
│   └── ga/                  # Google Analytics setup
├── public/                  # Static assets
├── slidev/                 # Slidev presentations
└── styles/                 # Additional styles
```

### Backend Structure

```
backend/
├── crates/
│   ├── api/                # HTTP API layer (Axum)
│   │   └── src/
│   │       ├── main.rs     # API entry point
│   │       ├── routes/     # Route handlers
│   │       └── middleware/ # Auth, CORS, etc.
│   ├── core/               # Core business logic
│   ├── db/                 # Database models (SQLx)
│   ├── shared/             # Shared utilities
│   └── worker/             # Background jobs
├── migrations/             # Database migrations
├── docs/                   # API documentation
│   └── Blog_API.postman_collection.json
├── nginx/                  # Nginx configuration
└── deploy.sh               # Deployment script
```

---

## Technology Stack

### Frontend Technologies

| Category | Library | Purpose |
|----------|---------|---------|
| **Framework** | Next.js 16 | React framework with App Router |
| **Language** | TypeScript | Type-safe JavaScript |
| **Styling** | Tailwind CSS 4 | Utility-first CSS |
| **Content** | Contentlayer2 | MDX/Markdown processing |
| **Animations** | Framer Motion, GSAP | Animations and transitions |
| **3D** | Three.js | 3D graphics rendering |
| **3D** | TresJS | Three.js reactive wrapper |
| **3D** | 3Dmol.js | Molecular visualization |
| **3D** | URDF Loader | Robot model loading |
| **Charts** | Nivo | Declarative charts |
| **Charts** | ECharts + ECharts-GL | Advanced charts with 3D |
| **Charts** | AntV G2 | Statistical charts |
| **Charts** | AntV G6 | Graph visualization |
| **Chemistry** | RDKit.js | Chemical structure rendering |
| **Chemistry** | MHChem | Chemical equation parsing |
| **Math** | KaTeX | Math formula rendering |
| **Code** | Prism + rehype-prism-plus | Syntax highlighting |
| **Maps** | Leaflet + React Leaflet | Interactive maps |
| **Physics** | Matter.js | 2D physics engine |
| **Drawing** | Excalidraw | Hand-drawn diagrams |
| **Audio/Music** | Tone.js | Web Audio framework |
| **Audio/Music** | OpenSheetMusicDisplay | Music notation display |
| **Comments** | Giscus | GitHub Discussions integration |
| **Search** | Kbar | Command palette search |
| **Analytics** | Umami, GA4 | Usage analytics |
| **Error Tracking** | Sentry | Error monitoring |
| **Testing** | Vitest, Testing Library | Unit testing |
| **Storybook** | Storybook | Component development |

### Backend Technologies

| Category | Library | Purpose |
|----------|---------|---------|
| **Language** | Rust | Systems programming language |
| **Framework** | Axum | Async web framework |
| **Database** | PostgreSQL | Relational database |
| **Database** | SQLx | Async SQL toolkit |
| **Cache** | Redis | In-memory cache |
| **Auth** | JWT | JSON Web Tokens |
| **API Docs** | OpenAPI/Swagger | API documentation |
| **Monitoring** | Prometheus | Metrics collection |
| **Container** | Docker | Containerization |
| **Error Tracking** | Sentry | Error monitoring |

---

## Content Management

### Blog Post Structure

Blog posts are stored in `/data/blog/[category]/` as MDX files.

### Required Frontmatter

```yaml
---
title: Your Post Title
date: 2025-01-15
tags: ['tag1', 'tag2', 'tag3']
draft: false
summary: Brief description for SEO and listing
layout: PostLayout  # or PostSimple, PostBanner
canonicalUrl: https://original-url.com  # optional
authors:
  - name: Zhengbi Yong
    url: https://github.com/zhengbi-yong
    image_url: https://github.com/zhengbi-yong.png
---
```

### Supported Content Categories

- `computer` - Computer science, AI, algorithms
- `robotics` - Robotics research, ROS, control systems
- `math` - Mathematics, linear algebra, calculus
- `chemistry` - Chemistry, molecular visualization
- `motor` - Motor control, servo systems
- `music` - Music theory, notation
- `photography` - Photography portfolio
- `social` - Social commentary, essays
- `tactile` - Tactile sensing research
- `tools` - Development tools, utilities
- `control` - Control theory, feedback systems
- `economics` - Economics, game theory

### Content Processing Pipeline

1. MDX files with frontmatter are placed in `/data/blog/[category]/`
2. Contentlayer2 processes content with remark/rehype plugins:
   - `remark-gfm` - GitHub Flavored Markdown
   - `remark-math` - Math syntax support
   - `rehype-katex` - KaTeX math rendering
   - `rehype-prism-plus` - Code highlighting
   - `rehype-slug` - Heading slug generation
   - `rehype-autolink-headings` - Heading anchor links
3. Automatic features: TOC generation, reading time, word count
4. Search index is generated from processed content
5. Static pages are generated for all content

### Available MDX Components

#### 3D Visualization

```tsx
import { ThreeViewer } from '@/components/3d/ThreeViewer'

<ThreeViewer modelPath="/models/robot.glb" />

import { TresViewer } from '@/components/3d/TresViewer'

<TresViewer modelPath="/models/scene.gltf" />

import { MoleculeViewer } from '@/components/chemistry/MoleculeViewer'

<MoleculeViewer pdbFile="/molecules/protein.pdb" />
```

#### Charts

```tsx
import { LineChart } from '@/components/charts/LineChart'
import { BarChart } from '@/components/charts/BarChart'
import { PieChart } from '@/components/charts/PieChart'
import { ScatterPlot } from '@/components/charts/ScatterPlot'

<LineChart data={chartData} xKey="date" yKey="value" />

import { EChart } from '@/components/charts/EChart'

<EChart option={chartOption} />

import { G2Chart } from '@/components/charts/G2Chart'

<G2Chart data={data} type="line" xField="date" yField="value" />

import { GraphVisualization } from '@/components/charts/GraphVisualization'

<GraphVisualization data={graphData} />
```

#### Chemistry

```tsx
import { ChemicalStructure } from '@/components/chemistry/ChemicalStructure'

<ChemicalStructure smiles="CCO" />

import { ChemicalEquation } from '@/components/chemistry/ChemicalEquation'

<ChemicalEquation equation="H2 + O2 -> H2O" />
```

#### Music

```tsx
import { MusicNotation } from '@/components/music/MusicNotation'

<MusicNotation xmlPath="/music/score.musicxml" />

import { Piano } from '@/components/music/Piano'

<Piano />
```

#### Other Components

```tsx
import { Map } from '@/components/maps/Map'

<Map center={[latitude, longitude]} zoom={13} />

import { Excalidraw } from '@/components/drawing/Excalidraw'

<Excalidraw />

import { PhysicsSimulation } from '@/components/physics/PhysicsSimulation'

<PhysicsSimulation />
```

---

## Path Aliases

Configured in `tsconfig.json`:

- `@/` - Root directory
- `@/app/*` - App directory
- `@/components/*` - Components directory
- `@/data/*` - Data directory
- `@/layouts/*` - Layouts directory
- `@/lib/*` - Library directory

---

## Environment Variables

### Frontend (.env.local)

```bash
# Site Configuration
NEXT_PUBLIC_SITE_URL=http://localhost:3001
NEXT_PUBLIC_BASE_PATH=

# Analytics (Optional)
NEXT_PUBLIC_UMAMI_ID=your-umami-id
NEXT_PUBLIC_GA_ID=your-google-analytics-id

# Comments (Optional)
NEXT_PUBLIC_GISCUS_REPO=your-repo
NEXT_PUBLIC_GISCUS_REPO_ID=your-repo-id
NEXT_PUBLIC_GISCUS_CATEGORY=Announcements
NEXT_PUBLIC_GISCUS_CATEGORY_ID=your-category-id
NEXT_PUBLIC_GISCUS_THEME=preferred_color_scheme
NEXT_PUBLIC_GISCUS_LANG=en

# Sentry (Optional)
NEXT_PUBLIC_SENTRY_DSN=your-sentry-dsn
SENTRY_AUTH_TOKEN=your-auth-token
SENTRY_PROJECT=your-project
SENTRY_ORG=your-org

# Build
EXPORT=0  # Set to 1 for static export
ANALYZE=false  # Set to true for bundle analysis
```

### Backend (.env)

```bash
# Database
DATABASE_URL=postgresql://blog_user:blog_password@localhost:5432/blog_db

# Redis
REDIS_URL=redis://localhost:6379

# JWT
JWT_SECRET=your-secret-key

# Server
HOST=127.0.0.1
PORT=3000

# Environment
RUST_LOG=debug  # or info, warn, error
ENVIRONMENT=development

# Security
PASSWORD_PEPPER=your-pepper
CORS_ORIGIN=http://localhost:3001

# Rate Limiting
RATE_LIMIT_PER_MINUTE=1000

# Session
SESSION_SECRET=your-session-secret
SESSION_TIMEOUT_HOURS=24

# Monitoring
PROMETHEUS_ENABLED=true
```

---

## Deployment

### Static Export (GitHub Pages)

The frontend is configured for static export:

```bash
cd frontend

# Build for GitHub Pages
EXPORT=1 BASE_PATH=/repo-name pnpm build

# Output is in frontend/out/
```

### Backend Deployment

```bash
cd backend

# Development
./deploy.sh dev

# Production
./deploy.sh prod

# Stop
./deploy.sh stop
```

---

## Development Protocol

This project follows a strict 5-mode development protocol (defined in `.cursor/rules/riper-5.mdc`):

1. **RESEARCH**: Information gathering and requirements analysis
2. **INNOVATE**: Brainstorming solutions and approaches
3. **PLAN**: Detailed technical specifications
4. **EXECUTE**: Implementation following exact plan
5. **REVIEW**: Verification against requirements

**Always follow this protocol** when making changes to ensure structured development.

---

## Build Process

### Frontend Build Flow

1. Contentlayer2 processes all MDX files
2. Remark/Rehype plugins transform content
3. Search index is generated (`scripts/generate-search.mjs`)
4. Next.js generates static pages
5. Post-build scripts run (`scripts/postbuild.mjs`)
6. Production output in `.next/` or `out/` for static export

### Backend Build Flow

1. Cargo compiles all crates
2. Migrations are prepared
3. Docker image is built (production)
4. Database is initialized
5. Services are started

---

## Security

### Frontend Security

- Content Security Policy configured in `next.config.js`
- DOMPurify sanitizes HTML content
- Image optimization enabled
- Security headers properly set
- Sentry for error tracking

### Backend Security

- JWT authentication with refresh tokens
- Password hashing with bcrypt
- Rate limiting on endpoints
- CORS configuration
- Input validation
- SQL injection prevention (SQLx)

---

## Testing

### Frontend Tests

```bash
cd frontend

# Run tests
pnpm test

# Watch mode
pnpm test:watch

# Coverage
pnpm test:coverage

# UI mode
pnpm test:ui

# Storybook
pnpm storybook
```

### Backend Tests

```bash
cd backend

# Unit tests
cargo test

# Integration tests
cargo test --test integration

# With output
cargo test -- --nocapture
```

---

## Troubleshooting

### Common Issues

**Port already in use**:
```bash
lsof -ti:3001 | xargs kill -9  # Frontend
lsof -ti:3000 | xargs kill -9  # Backend
```

**Database connection failed**:
```bash
cd backend
./deploy.sh stop
./deploy.sh dev
```

**Contentlayer build errors**:
```bash
rm -rf frontend/.next frontend/node_modules/.cache
cd frontend
pnpm install
pnpm build
```

**Static export issues**:
```bash
# Make sure to use EXPORT=1
EXPORT=1 BASE_PATH=/repo-name pnpm build
```

### Debug Mode

**Frontend**:
```bash
DEBUG=* pnpm dev
```

**Backend**:
```bash
RUST_LOG=debug cargo run
```

---

## Special Features

### Multi-Layout Blog Posts

Three layouts available via frontmatter `layout` field:
- `PostLayout` - Full-featured with TOC, comments, author info
- `PostSimple` - Minimal for focused reading
- `PostBanner` - Banner-style with hero image

### Tag System

- Automatic tag generation from frontmatter
- Dynamic tag pages at `/tags/[slug]`
- Tag filtering on category pages
- Tag data auto-generated in `tag-data.json`

### Search Functionality

- Kbar command palette (Cmd/Ctrl + K)
- Search index generated at build time
- Full-text search across all posts
- Keyboard navigation support

### Theme Support

- Dark/light mode switching via `next-themes`
- System preference detection
- Persistent theme selection
- Giscus theme sync

### Slidev Presentations

Located in `/frontend/slidev/`:
- `hardware/` - Hardware-related presentations
- Built with Slidev framework
- Exported as static HTML

---

## Important Configuration Files

| File | Purpose |
|------|---------|
| `frontend/next.config.js` | Next.js configuration, CSP headers |
| `frontend/tailwind.config.js` | Tailwind CSS theme |
| `frontend/tsconfig.json` | TypeScript config, path aliases |
| `frontend/contentlayer.ts` | MDX processing config |
| `backend/Cargo.toml` | Rust workspace config |
| `backend/deploy.sh` | Deployment script |

---

## Performance Optimization

### Frontend

- Static site generation (SSG)
- Image optimization
- Code splitting
- Lazy loading
- Bundle analysis with `ANALYZE=true`
- Turbopack for faster dev builds

### Backend

- Async/await with Tokio
- Redis caching
- Database connection pooling
- Query optimization with SQLx
- Prometheus monitoring

---

## Monitoring

### Frontend

- Umami analytics for page views
- Google Analytics integration
- Sentry error tracking

### Backend

- Prometheus metrics at `/metrics`
- Health check at `/health`
- Sentry error tracking
- Structured logging with `tracing`

---

## When Working with This Codebase

1. **Read before editing** - Always read files before suggesting changes
2. **Follow conventions** - Match existing code style and patterns
3. **Use TypeScript strict mode** - All code must be type-safe
4. **Test changes** - Run tests before committing
5. **Update docs** - Keep documentation in sync
6. **Follow 5-mode protocol** - Research → Innovate → Plan → Execute → Review

---

## Contact

- **Blog**: https://zhengbi-yong.github.io
- **GitHub**: https://github.com/zhengbi-yong
- **Institution**: Beijing Institute of Technology
- **Advisor**: Professor Shi Dawai

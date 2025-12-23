# Zhengbi Yong's Blog Platform

## Project Overview

This is Zhengbi Yong's (雍征彼) personal technical blog platform - a sophisticated dual-architecture blogging system built with modern web technologies. The blog features research and tutorials in robotics, automation, mathematics, computer science, and tactile sensing.

**About the Author**: Zhengbi Yong is a Master's student at Beijing Institute of Technology (formerly at Tsinghua University), researching robotics and multimodal perception under Professor Shi Dawai.

**Blog URL**: https://zhengbi-yong.github.io

---

## Project Structure

```
zhengbi-yong.github.io/
├── frontend/                    # Next.js 16 frontend application
│   ├── app/                     # Next.js App Router pages
│   │   ├── blog/               # Blog post pages with dynamic routing
│   │   ├── tags/               # Tag listing and filter pages
│   │   ├── page.tsx            # Homepage
│   │   └── layout.tsx          # Root layout
│   ├── components/             # React components
│   │   ├── MDXComponents/      # Custom MDX components
│   │   ├── analytics/          # Analytics integrations
│   │   ├── comments/           # Giscus comments
│   │   ├── search/             # Kbar search panel
│   │   ├── 3d/                 # Three.js, TresJS, 3Dmol viewers
│   │   ├── chemistry/          # RDKit chemistry visualizations
│   │   ├── charts/             # Nivo, ECharts, G2, G6 chart components
│   │   ├── music/              # Music notation and audio
│   │   └── ...
│   ├── data/                   # Blog content (MDX files)
│   │   ├── blog/               # Blog posts organized by category
│   │   │   ├── computer/       # Computer science articles
│   │   │   ├── robotics/       # Robotics research
│   │   │   ├── math/           # Mathematics content
│   │   │   ├── chemistry/      # Chemistry articles
│   │   │   ├── motor/          # Motor control topics
│   │   │   ├── music/          # Music-related content
│   │   │   ├── photography/    # Photography
│   │   │   ├── social/         # Social articles
│   │   │   ├── tactile/        # Tactile sensing research
│   │   │   ├── tools/          # Tools and utilities
│   │   │   ├── control/        # Control theory
│   │   │   └── economics/      # Economics content
│   │   ├── authors/            # Author information
│   │   ├── siteMetadata.ts     # Site configuration
│   │   └── tag-data.json       # Auto-generated tags
│   ├── layouts/                # Page layouts
│   │   ├── PostLayout.tsx      # Full-featured post layout
│   │   ├── PostSimple.tsx      # Minimal post layout
│   │   └── PostBanner.tsx      # Banner-style post layout
│   ├── lib/                    # Utilities and configurations
│   ├── public/                 # Static assets
│   ├── styles/                 # Global styles (Tailwind CSS)
│   ├── slidev/                # Slidev presentations
│   │   └── hardware/          # Hardware-related slides
│   └── .next/                 # Next.js build output
│
├── backend/                   # Rust API backend
│   ├── crates/                # Rust workspace crates
│   │   ├── api/               # HTTP API layer (Axum)
│   │   ├── core/              # Core business logic
│   │   ├── db/                # Database models (SQLx)
│   │   ├── shared/            # Shared utilities
│   │   └── worker/            # Background jobs
│   ├── migrations/            # Database migrations
│   ├── docs/                  # API documentation
│   │   └── Blog_API.postman_collection.json
│   ├── nginx/                 # Nginx configuration
│   ├── deploy.sh              # Deployment script
│   ├── docker-compose.simple.yml  # Development compose
│   └── docker-compose.prod.yml    # Production compose
│
├── scripts/                   # Development and deployment scripts
└── docs/                      # Project documentation
    ├── README.md              # This file
    └── CLAUDE.md              # Claude AI guidelines
```

---

## Getting Started

### Prerequisites

- **Node.js** 20+ and **pnpm** (for frontend)
- **Rust** 1.70+ and **Cargo** (for backend)
- **Docker** and **Docker Compose** (for databases)

### Frontend (Next.js)

```bash
cd frontend

# Install dependencies
pnpm install

# Start development server
pnpm dev
# Access at: http://localhost:3001

# Build for production
pnpm build

# Start production server
pnpm start

# Run tests
pnpm test
pnpm test:coverage
```

**Frontend Environment Variables**:

Create a `.env.local` file in the `frontend/` directory:

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

# Sentry (Optional)
NEXT_PUBLIC_SENTRY_DSN=your-sentry-dsn
SENTRY_AUTH_TOKEN=your-auth-token
```

### Backend (Rust)

```bash
cd backend

# Start development environment (PostgreSQL + Redis)
./deploy.sh dev

# Build and run the API
export DATABASE_URL=postgresql://blog_user:blog_password@localhost:5432/blog_db
export REDIS_URL=redis://localhost:6379
cargo run --bin blog-api
# Access at: http://localhost:3000

# Production deployment
./deploy.sh prod

# Stop all services
./deploy.sh stop

# Check service status
./deploy.sh status
```

**Backend Environment Variables**:

The `deploy.sh dev` command creates a `.env` file with defaults:

```bash
# Database
DATABASE_URL=postgresql://blog_user:blog_password@localhost:5432/blog_db

# Redis
REDIS_URL=redis://localhost:6379

# JWT
JWT_SECRET=dev-secret-key-for-testing-only

# Server
HOST=127.0.0.1
PORT=3000

# Environment
RUST_LOG=debug
ENVIRONMENT=development

# Security
PASSWORD_PEPPER=dev-pepper
CORS_ORIGIN=http://localhost:3000

# Rate Limiting
RATE_LIMIT_PER_MINUTE=1000

# Session
SESSION_SECRET=dev-session-secret
SESSION_TIMEOUT_HOURS=24

# Monitoring
PROMETHEUS_ENABLED=true
```

---

## Technology Stack

### Frontend

| Category | Technology |
|----------|------------|
| **Framework** | Next.js 16 with App Router and Turbopack |
| **Language** | TypeScript with strict mode |
| **Styling** | Tailwind CSS 4 with custom theme |
| **Content** | MDX with Contentlayer2 processing |
| **Animations** | Framer Motion, GSAP |
| **3D Visualization** | Three.js, TresJS, 3Dmol.js, URDF Loader |
| **Charts** | Nivo, ECharts + ECharts-GL, AntV G2, AntV G6 |
| **Chemistry** | RDKit.js, MHChem |
| **Math** | KaTeX |
| **Code Highlighting** | Prism + rehype-prism-plus |
| **Maps** | Leaflet + React Leaflet |
| **Physics** | Matter.js |
| **Drawing** | Excalidraw |
| **Audio/Music** | Tone.js, OpenSheetMusicDisplay |
| **Comments** | Giscus (GitHub Discussions) |
| **Search** | Kbar command panel |
| **Analytics** | Umami, Google Analytics |
| **Error Tracking** | Sentry |
| **Testing** | Vitest, Testing Library, Storybook |

### Backend

| Category | Technology |
|----------|------------|
| **Language** | Rust |
| **Framework** | Axum web framework |
| **Database** | PostgreSQL with SQLx |
| **Cache** | Redis |
| **Authentication** | JWT with refresh tokens |
| **API Documentation** | OpenAPI (Swagger UI) |
| **Monitoring** | Prometheus, health checks |
| **Error Tracking** | Sentry |
| **Containerization** | Docker, Docker Compose |

---

## Key Features

### Multi-Layout Blog Posts
Three different layouts for different content types:
- **PostLayout**: Full-featured layout with TOC, author info, comments
- **PostSimple**: Minimal layout for focused reading
- **PostBanner**: Banner-style layout with hero image

### Tag System
- Automatic tag generation from frontmatter
- Dynamic tag pages with filtering
- Tag cloud visualization

### Search Functionality
- Kbar command palette (Cmd/Ctrl + K)
- Full-text search across all posts
- Search suggestions and keyboard navigation

### Interactive Content
- **3D Models**: Three.js viewer for robotics simulations
- **Molecular Visualization**: 3Dmol.js for chemistry
- **URDF Models**: Robot model viewer
- **Chemical Structures**: RDKit integration
- **Charts**: Multiple charting libraries for data visualization
- **Music Notation**: Sheet music display
- **Interactive Diagrams**: Excalidraw for sketches

### Theme Support
- Dark/light mode switching
- System preference detection
- Persistent theme selection

### Performance
- Static site generation (SSG) for GitHub Pages
- Image optimization
- Bundle analysis with `ANALYZE=true pnpm build`
- Code splitting and lazy loading

### Security
- Content Security Policy headers
- DOMPurify for HTML sanitization
- Sentry error tracking
- Security best practices

---

## Content Management

### Creating a New Blog Post

1. Create a new MDX file in `frontend/data/blog/[category]/`

2. Add frontmatter:

```yaml
---
title: Your Post Title
date: 2025-01-15
tags: ['tag1', 'tag2', 'tag3']
draft: false
summary: Brief description for SEO and listing
layout: PostLayout
canonicalUrl: https://original-url.com (optional)
authors:
  - name: Zhengbi Yong
    url: https://github.com/zhengbi-yong
    image_url: https://github.com/zhengbi-yong.png
---
```

3. Write your content in MDX format:

```mdx
import { MyComponent } from '@/components/MyComponent'

# Heading

Regular **markdown** content.

<MyComponent prop="value" />

## Math

Inline math: $E = mc^2$

Block math:

$$
\int_{-\infty}^{\infty} e^{-x^2} dx = \sqrt{\pi}
$$

## Code

```python
def hello():
    print("Hello, World!")
```
```

### Supported Content Categories

- **computer**: Computer science, AI, algorithms
- **robotics**: Robotics research, ROS, control systems
- **math**: Mathematics, linear algebra, calculus
- **chemistry**: Chemistry, molecular visualization
- **motor**: Motor control, servo systems
- **music**: Music theory, notation
- **photography**: Photography portfolio
- **social**: Social commentary, essays
- **tactile**: Tactile sensing research
- **tools**: Development tools, utilities
- **control**: Control theory, feedback systems
- **economics**: Economics, game theory

### MDX Components Available

- `<3DModel />`: Three.js 3D model viewer
- `<MoleculeViewer />`: 3Dmol molecular visualization
- `<ChemicalStructure />`: RDKit chemical structure
- `<LineChart />`, `<BarChart />`, `<PieChart />`: Nivo charts
- `<EChart />`: ECharts component
- `<G2Chart />`: AntV G2 chart
- `<MusicNotation />`: Sheet music display
- `<Map />`: Leaflet map
- `<Excalidraw />`: Drawing canvas

---

## Deployment

### GitHub Pages (Frontend)

The frontend is configured for static export to GitHub Pages:

```bash
cd frontend

# Build for static export
EXPORT=1 BASE_PATH=/your-repo-name pnpm build

# Output will be in frontend/out/
# Deploy the contents of out/ to GitHub Pages
```

**GitHub Actions workflow**: The project includes automated deployment via GitHub Actions when pushing to the main branch.

### Production Deployment (Full Stack)

For full stack deployment with backend:

1. **Backend Deployment**:
```bash
cd backend
# Configure .env.production
./deploy.sh prod
```

2. **Frontend Build**:
```bash
cd frontend
# Configure API endpoint in .env.production
pnpm build
pnpm start
```

### Docker Deployment

```bash
# Development
cd backend
docker compose -f docker-compose.simple.yml up -d

# Production
docker compose -f docker-compose.prod.yml up -d
```

---

## API Documentation

### Backend Endpoints

Once the backend is running, access:

- **API Root**: http://localhost:3000
- **Health Check**: http://localhost:3000/health
- **Swagger UI**: http://localhost:3000/swagger-ui/
- **Prometheus Metrics**: http://localhost:3000/metrics

### Postman Collection

Import `/backend/docs/Blog_API.postman_collection.json` into Postman for API testing.

---

## Scripts Reference

### Frontend Scripts

```bash
pnpm dev              # Start development server
pnpm build            # Build for production
pnpm start            # Start production server
pnpm lint             # Run ESLint
pnpm test             # Run Vitest tests
pnpm test:coverage    # Run tests with coverage
pnpm analyze          # Analyze bundle size
```

### Backend Scripts

```bash
./deploy.sh dev       # Start development databases
./deploy.sh prod      # Start production stack
./deploy.sh stop      # Stop all services
./deploy.sh status    # Show service status
./deploy.sh setup-db  # Setup database and migrations
```

---

## Troubleshooting

### Common Issues

**1. Port already in use**
```bash
# Kill process on port 3001
lsof -ti:3001 | xargs kill -9
```

**2. Database connection failed**
```bash
# Check if PostgreSQL is running
docker ps | grep postgres

# Restart databases
cd backend
./deploy.sh stop
./deploy.sh dev
```

**3. Build errors with contentlayer**
```bash
# Clean cache and rebuild
rm -rf frontend/.next frontend/node_modules/.cache
cd frontend
pnpm install
pnpm build
```

**4. Static export issues**
```bash
# Make sure to use EXPORT=1 and BASE_PATH if deploying to GitHub Pages
EXPORT=1 BASE_PATH=/repo-name pnpm build
```

**5. MDX components not found**
- Ensure the component is exported from `/components/MDXComponents/index.ts`
- Check the import path is correct
- Verify the component is properly typed

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

## Development Protocol

This project follows a strict 5-mode development protocol:

1. **RESEARCH**: Information gathering and requirements analysis
2. **INNOVATE**: Brainstorming and solution exploration
3. **PLAN**: Detailed technical specifications
4. **EXECUTE**: Implementation following the exact plan
5. **REVIEW**: Verification against requirements

Always follow this protocol when making changes to ensure structured development.

---

## Contributing Guidelines

1. Follow the existing code style and conventions
2. Add tests for new features
3. Update documentation for API changes
4. Use TypeScript strict mode
5. Run linting before committing: `pnpm lint`
6. Ensure all tests pass: `pnpm test`

---

## License

This project is licensed under the MIT License - see the LICENSE file for details.

---

**Built with** by [Zhengbi Yong](https://zhengbi-yong.github.io)

**Research Institution**: Beijing Institute of Technology

**Advisor**: Professor Shi Dawai

For more information, visit the [blog](https://zhengbi-yong.github.io) or [GitHub repository](https://github.com/zhengbi-yong/zhengbi-yong.github.io).

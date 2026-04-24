# zhengbi-yong.github.io

## Purpose

Zhengbi Yong's personal technical blog platform - a sophisticated dual-architecture system featuring a Next.js 15 frontend with MDX rendering, Rust backend API, and comprehensive deployment infrastructure.

**Live Site**: https://zhengbi-yong.github.io

**Author**: Zhengbi Yong (雍征彼) - Master's student at Beijing Institute of Technology, researching robotics and multimodal perception under Professor Shi Dawai.

## Quick Start

### Docker (Recommended - Cross-Platform)

```bash
# Clone repository
git clone https://github.com/zhengbi-yong/zhengbi-yong.github.io.git
cd zhengbi-yong.github.io

# Configure environment
cp .env.docker.example .env

# Start all services
docker compose up -d

# Access frontend at http://localhost:3001
# Backend API at http://localhost:3000
```

**Advantages**:
- Cross-platform consistency (Windows, macOS, Linux)
- One-command startup for all services
- Isolated environment
- 5-minute setup time

### Traditional Development

**Prerequisites**:
- Node.js 22+ and pnpm (frontend)
- Rust 1.70+ and Cargo (backend)
- Docker and Docker Compose (databases)

```bash
# Frontend (Terminal 1)
cd frontend
pnpm install
pnpm dev  # Runs on http://localhost:3001

# Backend (Terminal 2)
cd backend
cargo run  # Runs on http://localhost:3000
```

## Architecture Overview

### System Components

```
┌─────────────────────────────────────────────────────────────┐
│                     User Browser                             │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│              Next.js 15 Frontend (Port 3001)                 │
│  ┌────────────┐  ┌────────────┐  ┌────────────────────┐    │
│  │ App Router │  │ MDX Blog   │  │   Admin Panel      │    │
│  │  (React 19)│  │  Renderer  │  │  (Payload CMS)     │    │
│  └────────────┘  └────────────┘  └────────────────────┘    │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│            Rust Backend API (Port 3000)                      │
│  ┌──────────┐  ┌──────────┐  ┌──────────────────────┐       │
│  │   Axum   │  │  SQLx    │  │   Business Logic     │       │
│  │  Server  │  │PostgreSQL│  │   (Rust Workspace)   │       │
│  └──────────┘  └──────────┘  └──────────────────────┘       │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│              Data Layer                                      │
│  ┌──────────────┐  ┌──────────────┐                        │
│  │ PostgreSQL   │  │    Redis     │                        │
│  │  (Port 5432) │  │  (Port 6379) │                        │
│  └──────────────┘  └──────────────┘                        │
└─────────────────────────────────────────────────────────────┘
```

### Technology Stack

#### Frontend
- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript 5.7+
- **UI Library**: React 19
- **Styling**: Tailwind CSS 4
- **Content**: MDX + Contentlayer2
- **State**: Zustand + TanStack Query
- **CMS**: Payload CMS 3.69
- **Authentication**: Backend JWT + HttpOnly Cookie

**Interactive Components**:
- 3D rendering: Three.js, 3Dmol.js
- Charts: Nivo, ECharts, G2, G6
- Chemistry: RDKit.js
- Math: KaTeX
- Music notation: OpenSheetMusicDisplay

#### Backend
- **Language**: Rust 2024 edition
- **Framework**: Axum (async web)
- **Database**: PostgreSQL 17 via SQLx
- **Cache**: Redis 7.4
- **Authentication**: JWT sessions
- **API Docs**: OpenAPI 3.0 (Swagger UI)
- **Monitoring**: Prometheus metrics

#### Deployment
- **Containerization**: Docker + Docker Compose
- **Web Server**: Nginx 1.27
- **Reverse Proxy**: Nginx configuration
- **CI/CD**: GitHub Actions
- **Monitoring**: Grafana + Prometheus
- **Deployment scripts**: Shell automation

## Project Structure

```
zhengbi-yong.github.io/
│
├── frontend/                    # Next.js 15 application
│   ├── src/
│   │   ├── app/                # App Router pages
│   │   │   ├── (auth)/        # Auth routes
│   │   │   ├── (main)/        # Main app (blog, projects)
│   │   │   ├── admin/         # Payload CMS admin
│   │   │   └── api/           # API routes (BFF)
│   │   │
│   │   ├── components/        # React components
│   │   │   ├── auth/          # Authentication
│   │   │   ├── magazine/      # Magazine layout
│   │   │   ├── blog/          # Blog components
│   │   │   ├── shadcn/ui/     # UI components
│   │   │   └── ...            # Other component groups
│   │   │
│   │   ├── lib/               # Utilities
│   │   │   ├── utils/         # Helper functions
│   │   │   ├── store/         # Zustand stores
│   │   │   └── feature-flags.ts
│   │   │
│   │   ├── payload/           # Payload CMS config
│   │   ├── data/blog/         # MDX blog posts
│   │   └── styles/            # Global styles
│   │
│   ├── tests/                 # Frontend tests
│   ├── package.json           # Dependencies
│   ├── next.config.js         # Next.js config
│   └── tailwind.config.ts     # Tailwind config
│
├── backend/                     # Rust workspace
│   ├── crates/
│   │   ├── api/               # HTTP server (Axum)
│   │   │   ├── src/
│   │   │   │   ├── routes/    # API endpoints
│   │   │   │   ├── middleware/# Auth, CORS, etc.
│   │   │   │   ├── metrics/   # Prometheus
│   │   │   │   └── utils/     # Helpers
│   │   │   └── tests/         # API tests
│   │   │
│   │   ├── core/              # Business logic
│   │   ├── db/                # Database models
│   │   │   └── src/models/    # Data schemas
│   │   ├── shared/            # Shared utilities
│   │   └── worker/            # Background tasks
│   │
│   ├── migrations/            # SQLx migrations
│   ├── openapi/               # API specs
│   ├── Cargo.toml             # Workspace config
│   └── Dockerfile             # Multi-stage build
│
├── deployments/                 # Deployment configurations
│   ├── docker/
│   │   └── compose-files/     # Docker Compose files
│   ├── server/
│   │   └── monitoring/        # Grafana dashboards
│   └── ssl/                   # SSL certificates
│
├── docs/                        # Project documentation
│   ├── getting-started/        # Setup guides
│   ├── development/            # Dev documentation
│   ├── deployment/             # Deployment guides
│   ├── migration/              # Migration docs
│   └── README.md               # Main docs hub (462 lines)
│
├── scripts/                     # Automation scripts
│   ├── dev/                    # Development utilities
│   ├── export/                 # Data export
│   ├── operations/             # Deployment scripts
│   ├── testing/                # Test utilities
│   └── utils/                  # Helper scripts
│
├── config/                      # Configuration files
│   └── config.yml              # System configuration
│
├── .github/                     # GitHub configurations
│   └── workflows/              # CI/CD pipelines
│
├── docker-compose.yml          # Main compose file
├── README.md                   # Project README (359 lines)
└── CLAUDE.md                   # This file
```

## Key Features

### Blog System
**Multi-Layout Posts**:
- Standard blog layout
- Magazine layout (masonry grid)
- Simple/minimal layout

**MDX Rendering**:
- Remote MDX processing
- Math formulas (KaTeX)
- Syntax highlighting
- Custom components
- Table of contents

**Tag System**:
- Automatic tag generation
- Tag filtering and pagination
- Tag-based navigation

**Interactive Content**:
- 3D models (Three.js)
- Molecular visualization (3Dmol.js, RDKit)
- Charts (Nivo, ECharts, G2, G6)
- Music notation (OpenSheetMusicDisplay)
- Mathematical equations (KaTeX)

### Admin Panel
**Payload CMS Integration**:
- Post management (multiple modes: simple, refine)
- User management (multiple modes)
- Comment moderation
- Analytics dashboard
- Health monitoring
- Settings configuration

### Authentication
**Backend JWT + HttpOnly Cookie** (no NextAuth.js):
- HttpOnly, Secure, SameSite=Strict cookies
- JWT verification in Rust Axum middleware
- CSRF protection via XSRF-TOKEN double-submit cookie
- No localStorage token storage (XSS protection)

### Search
**Kbar Command Palette**:
- Keyboard shortcut: Cmd/Ctrl + K
- Search posts, tags, projects
- Quick navigation

### Theme Switching
**Dark/Light Mode**:
- next-themes integration
- Persistent preference
- System preference detection

## Development Workflow

### Local Development Setup

**Option 1: Docker (Recommended)**
```bash
# One-command startup
docker compose up -d

# View logs
docker compose logs -f

# Stop services
docker compose down
```

**Option 2: Traditional**
```bash
# Terminal 1: Frontend
cd frontend
pnpm install
pnpm dev

# Terminal 2: Backend
cd backend
cargo run

# Terminal 3: Databases
docker compose up postgres redis
```

### Creating Content

**New Blog Post**:
```bash
# Create MDX file in frontend/data/blog/
title: "Post Title"
date: 2025-01-03
tags: ["tag1", "tag2"]
draft: false

# Content here with MDX support
```

**Add Interactive Components**:
```mdx
import { ThreeScene } from '@/components/three/ThreeScene';
import { MoleculeViewer } from '@/components/chemistry/MoleculeViewer';

<ThreeScene modelPath="/models/robot.glb" />
<MoleculeViewer smiles="CC(=O)OC1=CC=CC=C1C(=O)O" />
```

### Code Quality

**Frontend**:
```bash
cd frontend

# Type checking
pnpm tsc --noEmit

# Linting
pnpm lint
pnpm lint --fix

# Formatting
pnpm format

# Testing
pnpm test
pnpm test:coverage
```

**Backend**:
```bash
cd backend

# Type checking (compile-time)
cargo check

# Linting
cargo clippy

# Formatting
cargo fmt

# Testing
cargo test --workspace
cargo test --workspace --coverage
```

### Pre-commit Hooks

**Husky + lint-staged**:
```bash
# Auto-run on git commit
# - ESLint + Prettier (frontend)
# - cargo fmt + clippy (backend)
# - TypeScript checks
```

## Environment Configuration

### Required Variables

**Frontend (.env.local)**:
```bash
# Backend API
NEXT_PUBLIC_API_URL=http://localhost:3000
NEXT_PUBLIC_API_BASE_URL=http://localhost:3000/api/v1

# Site Configuration
NEXT_PUBLIC_SITE_URL=http://localhost:3001

# Optional Analytics
NEXT_PUBLIC_GA_ID=GA-XXXXXXXXX
```

**Backend (.env)**:
```bash
# Database
DATABASE_URL=postgresql://blog_user:blog_password@localhost:5432/blog_db

# Cache
REDIS_URL=redis://localhost:6379

# Security
JWT_SECRET=your-jwt-secret-32-chars-minimum
PASSWORD_PEPPER=your-pepper-32-chars
SESSION_SECRET=your-session-secret

# CORS
CORS_ALLOWED_ORIGINS=http://localhost:3001

# Logging
RUST_LOG=debug
ENVIRONMENT=development
```

### Docker Configuration (.env.docker.example)

**Complete environment setup for Docker Compose**:
```bash
# PostgreSQL
POSTGRES_DB=blog_db
POSTGRES_USER=blog_user
POSTGRES_PASSWORD=blog_password

# Redis
REDIS_PASSWORD=redis_password

# Backend
DATABASE_URL=postgresql://blog_user:blog_password@blog-postgres:5432/blog_db
REDIS_URL=redis://blog-redis:6379

# Frontend
NEXT_PUBLIC_API_URL=http://localhost:3000
```

## Deployment

### Production Deployment

**Quick Deploy Script**:
```bash
# One-command deployment to server
./scripts/deployment/deploy-production.sh <server-ip> <user>

# Example
./scripts/deployment/deploy-production.sh 152.136.43.194 ubuntu
```

**Manual Deployment**:
```bash
# 1. Build Docker images
./scripts/operations/start-prod.sh build

# 2. Export frontend
cd frontend && EXPORT=1 BASE_PATH=/ pnpm build

# 3. Transfer to server
./scripts/deployment/upload-rsync.sh

# 4. Deploy on server
./scripts/deployment/deploy-server.sh
```

### Deployment Structure

**Server Layout**:
```
/var/www/
├── blog/
│   ├── frontend/              # Static frontend files
│   │   └── _next/             # Next.js build output
│   ├── backend/              # Backend binary
│   ├── nginx/                # Nginx configuration
│   └── ssl/                  # SSL certificates
│
├── docker/
│   └── docker-compose.yml    # Production compose
│
└── monitoring/
    ├── prometheus/           # Metrics
    └── grafana/             # Dashboards
```

### Monitoring

**Grafana Dashboards**:
- System metrics (CPU, memory, disk)
- Application metrics (request rate, latency)
- Database metrics (connections, query performance)
- Error tracking and alerting

**Prometheus Metrics**:
- Backend: `/metrics` endpoint
- Frontend: Custom events
- Database: Built-in exporters
- Nginx: stub_status module

## Testing

### Frontend Tests

**Unit Tests (Vitest)**:
```bash
cd frontend
pnpm test
pnpm test --watch
pnpm test --coverage
```

**E2E Tests (Playwright)**:
```bash
pnpm test:e2e
pnpm test:e2e:ui
pnpm test:e2e:debug
```

**Coverage Goals**:
- Components: 75%+
- Utilities: 80%+
- API routes: 70%+

### Backend Tests

**Unit Tests**:
```bash
cd backend
cargo test --workspace
cargo test --workspace --lib
```

**Integration Tests**:
```bash
cargo test --workspace --test '*'
SQLX_OFFLINE=false cargo test
```

**Coverage Goals**:
- Business logic: 80%+
- API endpoints: 75%+
- Database operations: 85%+

### Test Structure

**Frontend**:
```
frontend/tests/
├── app/              # Page tests
├── components/       # Component tests
├── lib/              # Utility tests
└── routes/           # E2E route tests
```

**Backend**:
```
backend/crates/
├── api/tests/
│   ├── unit/        # Unit tests
│   ├── integration/ # Integration tests
│   ├── security/    # Security tests
│   └── helpers/     # Test utilities
└── core/tests/
```

## Performance Optimization

### Frontend Optimization

**Code Splitting**:
- Dynamic imports for heavy components
- Route-based splitting (automatic)
- Lazy loading for images

**Bundle Analysis**:
```bash
cd frontend
ANALYZE=true pnpm build
# View report at .next/analyze/client.html
```

**Image Optimization**:
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

### Backend Optimization

**Database Optimization**:
- Connection pooling (SQLx)
- Query optimization with indexes
- Redis caching for hot data

**Caching Strategy**:
- Redis for session data
- HTTP caching headers
- CDN for static assets

### Monitoring

**Performance Metrics**:
- Page load time < 2s
- First Contentful Paint < 1s
- Time to Interactive < 3s
- Backend API p50 < 100ms
- Backend API p99 < 500ms

## Security

### Frontend Security

**Implementations**:
- CSP headers (Content Security Policy)
- XSS protection (DOMPurify)
- CSRF tokens (XSRF-TOKEN double-submit cookie)
- Secure cookies (httpOnly, secure, sameSite)

### Backend Security

**Implementations**:
- Password hashing (Argon2id, 64MiB, 3 iterations, p=4)
- JWT session tokens
- CORS validation
- Rate limiting (60 req/min)
- SQL injection prevention (SQLx)
- Input validation

### Dependencies

**Security Audits**:
```bash
# Frontend
cd frontend
pnpm audit
pnpm audit --fix

# Backend
cd backend
cargo audit
cargo update
```

## Troubleshooting

### Common Issues

**Frontend Build Errors**:
```bash
# Clear Next.js cache
rm -rf frontend/.next

# Clear node_modules
rm -rf frontend/node_modules
cd frontend && pnpm install

# Rebuild
pnpm build
```

**Backend Build Errors**:
```bash
# Clean build
cd backend
cargo clean
cargo build

# Update dependencies
cargo update
```

**Database Connection**:
```bash
# Check PostgreSQL
docker exec blog-postgres pg_isready -U blog_user -d blog_db

# Check connection
psql $DATABASE_URL

# Restart database
docker compose restart postgres
```

**Docker Issues**:
```bash
# Rebuild containers
docker compose down
docker compose build --no-cache
docker compose up -d

# Check logs
docker compose logs -f
docker compose logs backend
docker compose logs frontend
```

### Debug Mode

**Frontend**:
```bash
# Next.js debug
NODE_OPTIONS='--inspect' pnpm dev

# Chrome DevTools
# Navigate to chrome://inspect
```

**Backend**:
```bash
# Rust debug
RUST_LOG=debug cargo run

# With specific module logging
RUST_LOG=blog_api=debug cargo run
```

## Documentation

### Project Documentation

**Main Hub**: `docs/README.md` (462 lines)

**Key Documents**:
- `quick-start.md` - 5-minute setup
- `getting-started/` - Detailed setup guides
- `development/` - Development documentation
- `deployment/` - Deployment procedures
- `operations/` - Operational procedures

### Code Documentation

**Component-Level CLAUDE.md**:
- Each major directory has CLAUDE.md
- Deep documentation hierarchy
- Cross-referenced topics

**Documentation Locations**:
- `frontend/src/app/*/CLAUDE.md` - App routes
- `frontend/src/components/*/CLAUDE.md` - Components
- `backend/crates/*/CLAUDE.md` - Rust crates
- `scripts/*/CLAUDE.md` - Script documentation

### API Documentation

**Backend API**:
- Swagger UI: http://localhost:3000/swagger-ui/
- OpenAPI JSON: http://localhost:3000/api-docs/openapi.json
- OpenAPI specs: `backend/openapi/`

## Contributing

### Development Workflow

1. **RESEARCH** - Information gathering
2. **INNOVATE** - Brainstorming solutions
3. **PLAN** - Technical specifications
4. **EXECUTE** - Implementation
5. **REVIEW** - Verification

### Code Standards

**Frontend**:
- ESLint + Prettier
- Conventional Commits
- TypeScript strict mode

**Backend**:
- `cargo fmt` + `cargo clippy`
- Rust API guidelines
- Documentation comments

### Pull Request Process

1. Fork repository
2. Create feature branch
3. Make changes
4. Write tests
5. Update documentation
6. Submit PR

## Version History

**Current Version**: 1.8.5.1 (Frontend reformed)

**Recent Changes**:
- Frontend restructure (src/ directory)
- Payload CMS integration
- Magazine layout implementation
- Enhanced admin panel
- Improved documentation

**Migration Guides**: `docs/migration/`

## License

MIT License - See [LICENSE](LICENSE) for details.

## Contact

**Author**: Zhengbi Yong (雍征彼)

**Research Institution**: Beijing Institute of Technology (北京理工大学)

**Advisor**: Professor Shi Dawai (石大发教授)

**Blog**: https://zhengbi-yong.github.io

**GitHub**: https://github.com/zhengbi-yong/zhengbi-yong.github.io

## See Also

- `README.md` - Main project README
- `frontend/CLAUDE.md` - Frontend documentation
- `backend/CLAUDE.md` - Backend documentation
- `docs/` - Comprehensive documentation
- `scripts/` - Automation scripts
- `deployments/` - Deployment configurations

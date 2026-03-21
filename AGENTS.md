# AGENTS.md - Codebase Guide for AI Agents

**Generated**: 2026-01-17
**Commit**: main

## OVERVIEW

Dual-architecture monorepo: Next.js 16 frontend + Rust/Axum backend. Custom orchestration via Makefiles and shell scripts (no Turborepo/Nx).

## STRUCTURE

```
./
├── backend/               # Rust/Axum API workspace
│   ├── crates/          # api, core, db, shared, worker
│   ├── migrations/       # SQLx migrations
│   └── scripts/         # deployment, dev, database tools
├── frontend/             # Next.js 16 App Router
│   ├── src/             # components, app, lib
│   ├── data/blog/        # MDX content (9 categories)
│   └── tests/            # Vitest (unit) + Playwright (e2e)
├── scripts/              # monorepo orchestration
│   ├── archive/          # deprecated/duplicate files
│   └── deployment/       # deployment scripts
└── docs/                # comprehensive documentation
```

## WHERE TO LOOK

| Task | Location | Notes |
|------|----------|-------|
| Frontend dev | `./start-dev.sh` | Interactive: backend/frontend/both/stop |
| Backend dev | `./start-backend.sh` | API on port 3000 |
| Frontend only | `./start-frontend.sh` | Next.js on port 3001 |
| Build all | `make build` | Frontend + backend release |
| Test all | `make test` | Frontend + backend tests |
| API routes | `backend/crates/api/src/routes/` | 16 route files |
| Components | `frontend/src/components/` | 75+ React components |
| DB models | `backend/crates/db/src/models/` | Database schemas |

## CODE MAP

Skipped (no LSP available and project scale <10k lines).

## CONVENTIONS

**Non-Standard Deviations:**
- TypeScript strict mode DISABLED (`strict: false` in tsconfig.json)
- Tests centralized in `frontend/tests/` (not co-located with source)
- Content in `frontend/data/blog/` (not `src/content/`)
- Cargo workspace at `backend/` level (not repo root)
- Root Makefile orchestrates both frontend/backend
- Multiple `.env` files scattered (root, backend/, frontend/.env.local)

**Linting:**
- Frontend: ESLint (max 10 warnings), Prettier (100 char width, no semicolons)
- Backend: rustfmt (100 char width), clippy (-D warnings enforced)
- Pre-commit: Husky enforces conventional commits + quality checks

**Testing:**
- Frontend: 70% coverage threshold (Vitest), E2E with Playwright
- Backend: 70% coverage threshold (tarpaulin)

**Git:**
- Conventional commits ENFORCED: `<type>(<scope>): <subject>`
- Min subject length: 10 characters

## ANTI-PATTERNS (THIS PROJECT)

**NEVER (Security-Critical):**
- Never use default passwords in production
- Never change `PASSWORD_PEPPER` after initial set
- Never do string concatenation for SQL (injection risk)
- Never use default env values for production

**CRITICAL Security Issues:**
- UUID validation: Any valid UUID is accepted (server doesn't verify)
- No token storage or per-session validation in middleware

**Deprecated/Migration Scripts:**
- `migrate-mdx-to-db.js/mjs` - MDX migration (legacy, unused)
- `scripts/archive/migrate_mdx_crate/` - Old migration tool

**Gotchas:**
- Frontend dev server uses port 3001 (not default 3000)
- Backend API on port 3000
- Always use database for dynamic content (`ALWAYS use database` in `page.tsx`)
- Docker Compose uses `docker-compose.dev.yml` for development

## UNIQUE STYLES

**Monorepo Orchestration:**
- Custom shell scripts (`start-*.sh`, `Makefile`) instead of Turborepo/Nx
- Manual Docker deployment: tar export → rsync upload → server load
- API sync chain: Backend export → curl → frontend types (manual coordination)

**CLI Binaries:**
- `create_admin` - Creates admin user
- `export_openapi` - Generates OpenAPI spec
- `migrate_mdx` - MDX to database migration

## COMMANDS

```bash
# Development (Recommended)
./start-dev.sh              # Interactive menu (backend/frontend/both/stop)
./start-backend.sh           # Backend API (port 3000)
./start-frontend.sh          # Next.js dev (port 3001)

# Building
make build                   # Frontend + backend release
make dev                     # Development builds

# Testing
make test                    # All tests (frontend + backend)
pnpm test                   # Frontend tests
cargo test                   # Backend tests
pnpm test:e2e               # E2E tests (Playwright)

# Linting
make lint                    # Both projects (ESLint + clippy)
pnpm lint                    # Frontend ESLint (max 10 warnings)
cargo fmt --check; cargo clippy  # Backend format + lint

# Database
make setup-db                # Start PostgreSQL + Redis (Docker)
make db-migrate               # Run SQLx migrations

# API Types
make generate-api             # Export OpenAPI → Generate TypeScript types

# Deployment
./scripts/deployment/deploy.sh                  # Interactive deployment
./scripts/deployment/deploy-production.sh        # One-click server deployment
```

## NOTES

**Architecture:**
- Dual-architecture monorepo (Next.js + Rust)
- Custom orchestration via Makefiles and shell scripts
- No CI/CD pipeline (manual deployment only)
- Workspace at backend/ level (not repository root)

**Development Workflow:**
1. Start databases: `docker compose -f docker-compose.dev.yml up -d`
2. Choose: `./start-dev.sh` (interactive menu)
3. API types: Run `make generate-api` after backend changes
4. Tests: Run `make test` before committing

**Security:**
- JWT_SECRET, PASSWORD_PEPPER, SESSION_SECRET must be changed in production
- SQL injection: Use parameterized queries only
- UUID acceptance issue in middleware (any UUID is valid)

**TODO Items (131 total):**
- Media upload multipart feature (backend/crates/api/src/routes/media.rs)
- Real IP extraction for comments (backend/crates/api/src/routes/comments.rs)
- Sentry/monitoring integration (frontend logger)
- Auth features: password reset, forgot password (frontend/lib/providers/refine-auth-provider.ts)

**Project Status:**
- Frontend: Next.js 16.0.10, TypeScript 5.9.3, Tailwind 4.1.17
- Backend: Rust 1.70+, Axum 0.8, SQLx 0.8
- Testing: 70% coverage threshold enforced for both frontend and backend
- Documentation: Extensive docs/ directory with deployment, development, and guides

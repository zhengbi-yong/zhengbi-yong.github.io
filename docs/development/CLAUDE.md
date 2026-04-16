# Development Documentation

## Module Overview

Comprehensive development setup, architecture, and best practices for the blog platform.

## Purpose

Provide complete development documentation covering frontend, backend, testing, and contribution guidelines.

## Structure

```
docs/development/
├── README.md                   # Development documentation hub
├── quick-start.md              # Quick development setup
├── best-practices.md           # Development best practices
├── getting-started/            # Beginner development guides
├── guides/                     # Development how-to guides
├── concepts/                   # Architecture and design concepts
├── best-practices/             # Coding standards and practices
├── reference/                  # Technical reference
└── archive/                    # Deprecated development docs
```

## Documentation Structure

### By Component

**Frontend Development**:
- Next.js setup and development
- React components and patterns
- TypeScript configuration
- Styling with Tailwind CSS
- State management

**Backend Development**:
- Rust backend setup (Axum web framework)
- API development
- Database operations
- Authentication and authorization
- Background workers (blog-worker crate)

**Testing**:
- Unit testing
- Integration testing
- E2E testing
- Test data management

**DevOps**:
- Local development environment
- Docker for development
- CI/CD setup
- Debugging tools

## Key Documentation

### README.md

**Purpose**: Navigation hub for development documentation

**Content**:
- Development environment setup
- Architecture overview
- Development workflow
- Code organization
- Testing strategy

### quick-start.md

**Purpose**: Fastest path to development environment

**Steps**:
1. Prerequisites installation
2. Clone repository
3. Environment configuration
4. Start development servers
5. Verify setup

**Time**: 10-15 minutes

### best-practices.md

**Purpose**: Development standards and guidelines

**Topics**:
- Code style conventions
- Git workflow
- Testing requirements
- Documentation standards
- Code review process

## Architecture

### System Architecture

**Document**: `concepts/architecture.md`

**Components**:
- Frontend (Next.js 16 + React)
- Backend (Rust + Axum 0.8)
- Database (PostgreSQL)
- Cache (Redis)
- Search (Meilisearch)
- Object Storage (MinIO)

### Data Flow

**Request Flow**:
1. Client → Frontend (Next.js)
2. Frontend → Backend API (Axum)
3. Backend → PostgreSQL / Redis / Meilisearch / MinIO
4. Response back through chain

### Technology Stack

**Frontend**:
- Next.js 16 (App Router)
- React 18
- TypeScript (strict mode **disabled** — see `frontend/tsconfig.json`)
- Tailwind CSS
- shadcn/ui
- Velite (content layer for MDX)

**Backend**:
- Rust
- Axum 0.8 (web framework)
- SQLx (database, async)
- Tokio (async runtime)
- JWT (authentication)

**Backend Workspace Crates**:
- `blog-api` — HTTP API server (crates/api)
- `blog-worker` — Background job processor (crates/worker)
- `blog-migrator` — Database migrations (crates/migrator)
- `blog-core` — Core business logic (crates/core)
- `blog-db` — Database layer (crates/db)
- `blog-shared` — Shared utilities (crates/shared)

## Development Workflow

### Frontend Development

**Setup**:
```bash
cd frontend
pnpm install
cp .env.example .env.local   # NOT .env.local.example
pnpm dev
```

**Development Server**:
- URL: `http://localhost:3001`
- Hot reload enabled
- Fast refresh working

**Building**:
```bash
pnpm build          # Production build
pnpm start          # Start production server
pnpm lint           # Run ESLint
pnpm type-check     # TypeScript check
```

**Search Index**:
```bash
# Generate search index (run as part of build)
node ./scripts/generate/generate-search.mjs
```

### Backend Development

**Setup**:
```bash
cd backend
cargo build
cp .env.example .env          # NOT .env.example at root
cargo run --bin api           # Start API server
```

**Development Server**:
- URL: `http://localhost:3000`
- Auto-reload with cargo-watch (if installed)
- Debug logging enabled via RUST_LOG

**Running**:
```bash
cargo run --bin api           # API server (includes migrate subcommand)
cargo run --bin worker        # Background worker
cargo test                    # Run tests
cargo clippy                  # Lint code
cargo fmt                     # Format code
```

### Database Development

**Migrations**:
```bash
# Run migrations (via api binary)
cargo run --bin api -- migrate

# Create migration via sqlx CLI (requires: cargo install sqlx-cli)
sqlx migrate add add_new_feature

# Rollback via sqlx CLI
sqlx migrate revert

# Note: sqlx CLI must be installed separately
# Project does not include sqlx-cli as a devDependency
```

**Offline Mode**:
```bash
# Generate query cache (requires sqlx offline mode)
cargo sqlx prepare --offline

# Or generate config
mkdir -p .sqlx
echo 'offline = true' > .sqlx/config.toml
```

## Code Organization

### Frontend Structure

```
frontend/
├── src/
│   ├── app/              # Next.js App Router pages
│   ├── components/       # React components (lib/ form UI components)
│   ├── lib/               # Utilities and type definitions
│   ├── styles/           # Global styles
│   ├── locales/          # i18n translations
│   ├── mocks/            # Mock data for development
│   └── payload/          # Payload CMS integration
├── content/               # MDX blog content (Velite source)
├── public/                # Static assets
├── scripts/               # Build and utility scripts
├── tests/                 # Test files
├── app/                  # Root-level Next.js app directory
└── components/           # Root-level components (alternative location)
```

**Key paths**:
- Search script: `frontend/scripts/generate/generate-search.mjs`
- Env template: `frontend/.env.example`
- OpenAPI types: `frontend/src/lib/api.ts` (generated by orval)

### Backend Structure

```
backend/
├── Cargo.toml            # Workspace root
├── crates/
│   ├── api/             # HTTP API server
│   │   └── src/
│   │       ├── main.rs          # Entry point (binary "api")
│   │       ├── migrate.rs       # Migration runner (binary "migrate")
│   │       ├── create_admin.rs  # Admin creator (binary "create_admin")
│   │       └── export_openapi.rs
│   ├── worker/          # Background worker
│   │   └── src/
│   │       ├── main.rs          # Worker binary "worker"
│   │       └── cdc_main.rs      # CDC worker binary "cdc-worker"
│   ├── migrator/        # Standalone migration tool (blog-migrator)
│   ├── core/            # Core business logic
│   ├── db/              # Database layer
│   └── shared/          # Shared utilities
├── migrations/          # SQLx migration files
└── scripts/             # Deployment scripts
```

**Binaries defined**:
| Binary | Crate | Purpose |
|--------|-------|---------|
| `api` | blog-api | Main HTTP API server |
| `migrate` | blog-api | DB migration runner |
| `create_admin` | blog-api | Admin user creation |
| `export_openapi` | blog-api | OpenAPI spec export |
| `worker` | blog-worker | Background job processor |
| `cdc-worker` | blog-worker | CDC worker for Meilisearch sync |

## Testing

### Frontend Testing

**Unit Tests**:
```bash
pnpm test            # Run tests
pnpm test:watch      # Watch mode
pnpm test:coverage   # Coverage report
```

**E2E Tests**:
```bash
pnpm test:e2e        # Playwright E2E tests
```

### Backend Testing

**Unit Tests**:
```bash
cargo test           # Run all tests
cargo test --lib     # Library tests only
cargo test --bins    # Binary tests only
```

**Integration Tests**:
```bash
cargo test --test '*'
```

**Test Coverage**:
```bash
cargo tarpaulin --out Html
```

## Coding Standards

### TypeScript/Frontend

**Style Guide**:
- Use functional components with hooks
- Prefer composition over inheritance
- **Note**: TypeScript strict mode is **disabled** (see `frontend/tsconfig.json`)
- Follow ESLint rules
- Use Prettier for formatting

**Naming Conventions**:
- Components: PascalCase (`PostCard.tsx`)
- Utilities: camelCase (`formatDate.ts`)
- Constants: UPPER_SNAKE_CASE (`API_BASE_URL`)
- Types/Interfaces: PascalCase (`UserProfile`)

### Rust/Backend

**Style Guide**:
- Follow Rust API guidelines
- Use rustfmt for formatting
- Pass clippy lints
- Document public APIs
- Use Result<T, E> for errors

**Naming Conventions**:
- Modules: snake_case (`user_auth.rs`)
- Types: PascalCase (`UserProfile`)
- Functions: snake_case (`get_user()`)
- Constants: SCREAMING_SNAKE_CASE (`MAX_CONNECTIONS`)

## Development Tools

### IDE/Editor

**Recommended**:
- **VS Code** + Rust Analyzer + ESLint
- **IntelliJ IDEA** + Rust plugin
- **Neovim** + rust-analyzer

### VS Code Extensions

**Frontend**:
- ESLint
- Prettier
- Tailwind CSS IntelliSense
- TypeScript Importer

**Backend**:
- rust-analyzer
- CodeLLDB (debugger)
- Even Better TOML
- Error Lens

### Git Hooks

**Pre-commit**:
```bash
# Frontend
pnpm lint
pnpm type-check

# Backend
cargo fmt --check
cargo clippy
```

**Pre-push**:
```bash
# Run tests
pnpm test
cargo test
```

## Common Tasks

### Adding New Feature

**Frontend**:
1. Create component file
2. Add TypeScript types
3. Implement logic
4. Add tests
5. Update documentation

**Backend**:
1. Create route handler
2. Add database model
3. Implement business logic
4. Add migration (if needed)
5. Add tests
6. Update OpenAPI spec

### Debugging

**Frontend**:
- Chrome DevTools
- React DevTools
- Network tab for API calls
- Console for errors

**Backend**:
- `RUST_LOG=debug` for verbose logging
- VS Code debugger with CodeLLDB
- `tracing::debug!` for structured logging
- Postman/curl for API testing

### Performance Profiling

**Frontend**:
- React DevTools Profiler
- Lighthouse audit
- WebPageTest

**Backend**:
- Flamegraphs (`cargo flamegraph`)
- Criterion benchmarks
- Database query analysis

## Best Practices

### Security

- Never commit secrets
- Validate all inputs
- Use prepared statements
- Sanitize user content
- Implement rate limiting
- Keep dependencies updated

### Performance

- Lazy load components
- Optimize images
- Use database indexes
- Cache frequently accessed data
- Minimize API calls
- Use connection pooling

### Code Quality

- Write self-documenting code
- Add comments for complex logic
- Keep functions small and focused
- DRY (Don't Repeat Yourself)
- SOLID principles
- Test-driven development

## Related Modules

- **Deployment Docs**: `../deployment/` - Deployment procedures
- **Configuration**: `../configuration/` - Configuration management
- **API Docs**: `frontend/src/lib/api.ts` - Generated API types
- **Frontend Code**: `../../frontend/src/` - Frontend source
- **Backend Code**: `../../backend/crates/` - Backend source crates

## Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Rust Book](https://doc.rust-lang.org/book/)
- [React Documentation](https://react.dev/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Axum Web Framework](https://docs.rs/axum/latest/axum/)

---

**Last Updated**: 2025-04-14
**Maintained By**: Development Team

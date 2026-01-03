# GitHub Workflows

## Module Overview

CI/CD automation workflows for the blog system using GitHub Actions.

## Purpose

Automate testing, building, and deployment processes for both frontend and backend components.

## Structure

```
.github/workflows/
├── backend-ci.yml       # Backend continuous integration
├── backend-test.yml     # Backend testing workflow
├── frontend-ci.yml      # Frontend continuous integration
├── lighthouse.yml       # Performance testing with Lighthouse
└── pages.yml           # GitHub Pages deployment
```

## Key Workflows

### Backend CI (`backend-ci.yml`)

**Triggers**:
- Push to `main` or `develop` branches (backend changes)
- Pull requests to `main` or `develop` (backend changes)

**Jobs**:

1. **Test Job**
   - Runs on Ubuntu latest
   - PostgreSQL 17 service container
   - Rust toolchain setup
   - Executes `cargo test --workspace`
   - Environment: Test database with `blog_user/blog_password`

2. **Build Job**
   - Depends on test job
   - Docker Buildx setup
   - Builds and pushes to GHCR
   - Tag: `ghcr.io/{repository}/blog-backend:latest`
   - GitHub Actions cache integration

3. **Deploy Job**
   - Only on `main` branch
   - Production environment
   - Placeholder for server deployment commands

**Key Configuration**:
```yaml
env:
  CARGO_TERM_COLOR: always
  RUST_BACKTRACE: 1
  DATABASE_URL: postgresql://blog_user:blog_password@localhost:5432/blog_test
  REDIS_URL: redis://localhost:6379
```

### Frontend CI (`frontend-ci.yml`)

**Triggers**:
- Push to `main` or `develop` branches (frontend changes)
- Pull requests to `main` or `develop` (frontend changes)

**Jobs**:
- Linting and type checking
- Build verification
- Unit tests

### Lighthouse (`lighthouse.yml`)

**Purpose**: Performance and quality testing

**Tests**:
- Performance scores
- Accessibility
- Best practices
- SEO

### Pages Deployment (`pages.yml`)

**Purpose**: Deploy frontend to GitHub Pages

**Process**:
- Build frontend application
- Deploy to GitHub Pages
- Triggered on push to `main`

## Testing Strategy

### Backend Testing
- **Unit Tests**: `cargo test` for all workspace members
- **Integration Tests**: Database-backed tests with PostgreSQL service
- **Service Containers**: PostgreSQL 17 with health checks

### Frontend Testing
- **Type Checking**: TypeScript strict mode validation
- **Linting**: ESLint and Prettier checks
- **Build Verification**: Production build validation

## Build and Deployment

### Docker Image Building
```yaml
- uses: docker/build-push-action@v5
  with:
    context: ./backend
    push: true
    tags: ghcr.io/${{ github.repository }}/blog-backend:latest
    cache-from: type=gha
    cache-to: type=gha,mode=max
```

### Deployment Pipeline
1. Test verification (required)
2. Docker image build (push events only)
3. Deploy to production (main branch only)

## Environment Variables

### Backend CI
- `DATABASE_URL`: PostgreSQL connection string
- `REDIS_URL`: Redis connection string
- `CARGO_TERM_COLOR`: Colored cargo output
- `RUST_BACKTRACE`: Error backtrace enabled

### Secrets (GitHub Secrets)
- `GITHUB_TOKEN`: Automatic authentication for GHCR

## Permissions

```yaml
permissions:
  contents: read
  packages: write  # For pushing to GHCR
```

## Service Containers

### PostgreSQL Configuration
```yaml
services:
  postgres:
    image: postgres:17
    env:
      POSTGRES_USER: blog_user
      POSTGRES_PASSWORD: blog_password
      POSTGRES_DB: blog_test
    ports:
      - 5432:5432
    options: >-
      --health-cmd pg_isready
      --health-interval 10s
      --health-timeout 5s
```

## Caching Strategy

### GitHub Actions Cache
- **Type**: `gha` (GitHub Actions cache)
- **Mode**: `max` for maximum cache retention
- **Purpose**: Speed up Docker builds with layer caching

## Branch Protection Rules

**Protected Branches**: `main`, `develop`

**Required Checks**:
- Backend tests must pass
- Frontend linting must pass
- Build verification must succeed

## Trigger Paths

### Backend Workflows
- `backend/**` - Only trigger on backend changes

### Frontend Workflows
- Frontend-specific paths

## Integration Points

### Container Registry
- **Registry**: GitHub Container Registry (GHCR)
- **Image**: `ghcr.io/zhengbi-yong/zhengbi-yong.github.io/blog-backend`
- **Tag**: `latest` (always updated)

### Database Migrations
- Migrations run as part of backend tests
- Uses `sqlx-cli` for migration management
- Test database schema validation

## Monitoring and Quality Gates

### Lighthouse CI
- Performance thresholds
- Accessibility scores (minimum 90)
- Best practices (minimum 90)
- SEO (minimum 90)

### Test Requirements
- All unit tests must pass
- Integration tests must pass
- No test skips allowed in CI

## Development Workflow

### Feature Development
1. Create feature branch
2. Push changes (triggers CI)
3. Verify CI passes
4. Create pull request
5. Merge after approval and CI passes

### Hotfix Workflow
1. Create hotfix branch from `main`
2. Push changes
3. Verify CI passes
4. Merge directly to `main`
5. Backport to `develop` if needed

## Troubleshooting

### Common Issues

**Postgres Service Not Ready**
```
--health-interval 10s
--health-timeout 5s
```
Increase timeout if database startup is slow.

**Docker Build Fails**
- Check Dockerfile syntax
- Verify build context
- Review cache settings

**Test Failures in CI**
- Check `RUST_BACKTRACE=1` for full error details
- Review test database connection
- Verify all dependencies are available

## Related Modules

- **Backend**: `./backend` - Application code
- **Frontend**: `./frontend` - UI code
- **Migrations**: `./backend/migrations` - Database schema
- **Deployment**: `./deployments` - Production deployment

## Maintenance

### Workflow Updates
- Keep actions updated (`@v4`, `@v5`)
- Review Rust toolchain version
- Update service container versions

### Performance Optimization
- Use caching aggressively
- Parallelize independent jobs
- Minimize build context size

---

**Last Updated**: 2026-01-03
**Maintained By**: DevOps Team

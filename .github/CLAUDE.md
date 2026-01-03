# .github

## Module Overview

GitHub configuration and workflows for automated CI/CD, dependency management, and repository automation.

## Purpose

Centralize GitHub-specific configurations including Actions workflows, Dependabot automation, and repository settings.

## Structure

```
.github/
├── workflows/
│   ├── backend-ci.yml       # Backend CI/CD pipeline
│   ├── backend-test.yml     # Backend testing workflow
│   ├── frontend-ci.yml      # Frontend CI/CD pipeline
│   ├── lighthouse.yml       # Performance testing with Lighthouse
│   ├── pages.yml           # GitHub Pages deployment
│   └── CLAUDE.md           # Workflows documentation
├── dependabot.yml          # Dependency update automation
└── FUNDING.yml            # GitHub Sponsors configuration
```

## Workflows

### Backend CI (`workflows/backend-ci.yml`)

**Triggers**:
- Push to `main`, `develop` (backend changes only)
- Pull requests to `main`, `develop` (backend changes only)

**Jobs**:

1. **Test Job**
   - PostgreSQL 17 service container
   - Rust toolchain setup
   - Database-backed integration tests
   - Environment: Test database (`blog_test`)

2. **Build Job**
   - Docker Buildx multi-platform builds
   - Push to GitHub Container Registry (GHCR)
   - Image tagging: `blog-backend:latest`
   - Layer caching for faster builds

3. **Deploy Job**
   - Triggers only on `main` branch
   - Production environment
   - Placeholder for deployment commands

**Key Configuration**:
```yaml
env:
  CARGO_TERM_COLOR: always
  RUST_BACKTRACE: 1
  DATABASE_URL: postgresql://blog_user:blog_password@localhost:5432/blog_test
  REDIS_URL: redis://localhost:6379
```

### Frontend CI (`workflows/frontend-ci.yml`)

**Triggers**:
- Push to `main`, `develop` (frontend changes only)
- Pull requests to `main`, `develop` (frontend changes only)

**Jobs**:

1. **Lint & Type Check**
   - ESLint code quality checks
   - TypeScript strict mode validation
   - Node.js 20 with pnpm caching

2. **Unit Tests**
   - Test runner execution
   - Coverage collection
   - pnpm for package management

3. **Build Job**
   - Production build verification
   - Environment variable configuration
   - Static export validation

4. **Deploy Job**
   - Vercel deployment integration
   - Production environment
   - Automatic deployment on merge

### Lighthouse CI (`workflows/lighthouse.yml`)

**Purpose**: Automated performance, accessibility, and quality testing

**Triggers**:
- Pull requests to `main`/`master`
- Push to `main`/`master`
- Manual workflow dispatch

**Test URLs**:
- `http://localhost:3001` (homepage)
- `http://localhost:3001/blog`
- `http://localhost:3001/about`
- `http://localhost:3001/projects`

**Metrics**:
- Performance score
- Accessibility score
- Best practices score
- SEO score

**Features**:
- Builds frontend production bundle
- Serves with `npx serve` on port 3001
- Runs Lighthouse CI on multiple pages
- Uploads artifacts for detailed analysis
- Comments PR with results summary

**Configuration**:
```yaml
urls: |
  http://localhost:3001
  http://localhost:3001/blog
  http://localhost:3001/about
  http://localhost:3001/projects
uploadArtifacts: true
temporaryPublicStorage: true
```

### Backend Test (`workflows/backend-test.yml`)

**Purpose**: Dedicated backend testing workflow

**Features**:
- PostgreSQL service integration
- Full test suite execution
- Database migration validation
- Coverage reporting

### Pages Deployment (`workflows/pages.yml`)

**Purpose**: Deploy frontend to GitHub Pages

**Process**:
- Static build generation
- GitHub Pages deployment
- Triggered on push to `main`

## Dependabot Configuration

### Dependency Updates (`dependabot.yml`)

**NPM Dependencies**:
- **Schedule**: Weekly (Monday 09:00)
- **Limit**: 10 open PRs
- **Groups**:
  - Production dependencies (minor/patch updates)
  - Development dependencies (minor/patch updates)
- **Labels**: `dependencies`, `npm`
- **Reviewers**: `zhengbi-yong`

**GitHub Actions**:
- **Schedule**: Weekly (Monday 09:00)
- **Labels**: `dependencies`, `github-actions`
- **Prefix**: `ci`

**Commit Message Format**:
- NPM: `deps(npm): update package-name`
- Actions: `ci(github-actions): update action-name`

## Funding Configuration

### GitHub Sponsors (`FUNDING.yml`)

**Purpose**: Enable GitHub Sponsors button on repository

**Content**: Sponsorship links and funding information

## Continuous Integration Strategy

### Pipeline Architecture

```
┌─────────────┐
│   Push/PR   │
└──────┬──────┘
       │
       ├──────────────┬──────────────┐
       │              │              │
       ▼              ▼              ▼
┌──────────┐   ┌──────────┐   ┌──────────┐
│ Backend  │   │ Frontend │   │ Lighthouse│
│   CI     │   │   CI     │   │    CI    │
└─────┬────┘   └─────┬────┘   └─────┬────┘
      │              │              │
      ▼              ▼              ▼
  ┌─────────┐   ┌─────────┐   ┌─────────┐
  │  Test   │   │  Test   │   │ Lighthouse│
  │  Build  │   │  Build  │   │  Report  │
  └────┬────┘   └────┬────┘   └─────────┘
       │              │
       ▼              ▼
  ┌─────────┐   ┌─────────┐
  │ Deploy  │   │ Deploy  │
  │(main on)│   │(main on)│
  └─────────┘   └─────────┘
```

### Quality Gates

**Backend**:
- All tests must pass
- Integration tests with real database
- No SQLx query errors
- Docker build succeeds

**Frontend**:
- ESLint passes with no warnings
- TypeScript type checking succeeds
- Unit tests pass
- Production build succeeds
- Lighthouse scores > 90

## Service Containers

### PostgreSQL Integration

**Purpose**: Database for backend tests

**Configuration**:
```yaml
postgres:
  image: postgres:17
  env:
    POSTGRES_USER: blog_user
    POSTGRES_PASSWORD: blog_password
    POSTGRES_DB: blog_test
  ports:
    - 5432:5432
  healthcheck:
    test: pg_isready
    interval: 10s
    timeout: 5s
```

**Connection String**:
```
postgresql://blog_user:blog_password@localhost:5432/blog_test
```

## Caching Strategy

### Dependencies Cache
- **pnpm**: `frontend/pnpm-lock.yaml`
- **Cargo**: Rust target directory caching
- **Docker**: GitHub Actions cache for layers

### Build Artifacts
- **Next.js**: `.next/cache` directory
- **Docker**: Layer caching for faster rebuilds

## Deployment Automation

### Backend Deployment
- Triggers: Successful build on `main` branch
- Target: Production server (placeholder)
- Method: SSH + Docker Compose (to be implemented)

### Frontend Deployment
- Triggers: Successful build on `main` branch
- Target: Vercel
- Method: Vercel CLI via GitHub Action
- Configuration: Vercel project secrets

## Permissions

### Required Scopes
```yaml
permissions:
  contents: read           # Read repository contents
  packages: write          # Push to GHCR
  pull-requests: write     # Comment on PRs (Lighthouse)
```

## Branch Protection

### Protected Branches
- `main` - Production branch
- `develop` - Development branch

### Required Checks
- Backend tests pass
- Frontend lint and tests pass
- Lighthouse scores acceptable
- Build verification succeeds

## Security Features

### Dependency Scanning
- Dependabot for automated updates
- Weekly security patching
- Grouped updates for review efficiency

### Secrets Management
**Required Secrets**:
- `VERCEL_TOKEN` - Vercel deployment token
- `VERCEL_ORG_ID` - Vercel organization ID
- `VERCEL_PROJECT_ID` - Vercel project ID
- `GITHUB_TOKEN` - Auto-provided by GitHub Actions

### Container Security
- Official Docker images only
- Version pinning (postgres:17)
- Regular security updates

## Performance Monitoring

### Lighthouse CI Integration

**Score Thresholds**: Recommended minimum 90 for all categories

**Artifacts**:
- HTML reports for each URL
- JSON metrics for trend analysis
- PR comments for quick review

**Trend Analysis**:
- Compare performance across commits
- Detect regressions early
- Track optimization progress

## Troubleshooting

### Workflow Failures

**Backend Tests Fail**:
```bash
# Check database connection
docker exec blog-postgres pg_isready -U blog_user -d blog_test

# View logs
docker logs blog-postgres

# Run tests locally
cd backend
cargo test --workspace
```

**Frontend Build Fails**:
```bash
# Check dependencies
cd frontend
pnpm install --frozen-lockfile

# Type check
pnpm tsc --noEmit

# Lint
pnpm lint
```

**Lighthouse CI Fails**:
```bash
# Run locally
npx lighthouse http://localhost:3001 --view

# Check server is running
curl http://localhost:3001
```

### Action Version Issues
- Keep actions updated (`@v4`, `@v5`)
- Review breaking changes in action releases
- Test workflow changes in feature branches

## Best Practices

### Workflow Development
1. Test workflows in feature branches first
2. Use `workflow_dispatch` for manual testing
3. Monitor action usage limits
4. Keep workflows simple and focused
5. Document complex logic in comments

### Dependency Management
1. Review Dependabot PRs weekly
2. Group updates for efficiency
3. Test updates in development environment
4. Update actions regularly
5. Monitor for security advisories

### Performance Optimization
1. Use caching aggressively
2. Parallelize independent jobs
3. Minimize build context size
4. Use Docker layer caching
5. Optimize dependency installation

## Maintenance

### Regular Tasks
- **Weekly**: Review Dependabot PRs
- **Monthly**: Update action versions
- **Quarterly**: Review and optimize workflows
- **As Needed**: Update threshold configurations

### Monitoring
- GitHub Actions usage time
- Workflow success/failure rates
- Lighthouse score trends
- Deployment frequency

## See Also

- `./backend/CLAUDE.md` - Backend testing and deployment
- `./frontend/CLAUDE.md` - Frontend build and deployment
- `./scripts/operations/` - Operations and deployment scripts
- GitHub Actions Documentation: https://docs.github.com/en/actions
- Dependabot Docs: https://docs.github.com/en/code-security/dependabot

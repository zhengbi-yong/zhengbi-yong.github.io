# scripts/testing

## Purpose

Testing utilities and scripts for validating application functionality, performance, and quality.

## Current Status

**Note**: This directory currently has no dedicated testing scripts. Testing is integrated within:

- `./scripts/operations/quick-test.sh` - MDX rendering validation
- `.github/workflows/backend-test.yml` - Backend CI testing
- `.github/workflows/frontend-ci.yml` - Frontend CI testing

## Testing Infrastructure

### Backend Testing
**Location**: `.github/workflows/backend-test.yml`

**Test Runner**: Cargo test framework

**Database**: PostgreSQL 17 service container

**Environment**:
```yaml
DATABASE_URL: postgresql://blog_user:blog_password@localhost:5432/blog_test
REDIS_URL: redis://localhost:6379
```

**Execution**:
```bash
# Local backend testing
cd backend
cargo test --workspace

# With database
SQLX_OFFLINE=false cargo test

# Specific test
cargo test test_name

# With output
cargo test -- --nocapture
```

### Frontend Testing
**Location**: `.github/workflows/frontend-ci.yml`

**Test Runner**: Vitest / Jest (configured in frontend)

**Checks**:
- Linting (ESLint)
- Type checking (TypeScript)
- Unit tests
- Build verification

**Execution**:
```bash
# Local frontend testing
cd frontend

# Linting
pnpm lint

# Type check
pnpm tsc --noEmit

# Unit tests
pnpm test

# Tests with coverage
pnpm test --coverage

# Build verification
pnpm build
```

## Integration Testing

### MDX Rendering Test
**Script**: `./scripts/operations/quick-test.sh`

**Purpose**: Validate MDX dynamic rendering functionality

**Test Coverage**:
- Math formula rendering (inline and block)
- Code syntax highlighting
- List formatting
- Table rendering
- Article metadata

**Usage**:
```bash
./scripts/operations/quick-test.sh
```

**Frontend Verification**:
```bash
# After backend test passes
cd frontend
pnpm dev

# Visit test article
http://localhost:3001/blog/test-mdx-rendering
```

## Performance Testing

### Lighthouse CI
**Location**: `.github/workflows/lighthouse.yml`

**Metrics**:
- Performance score
- Accessibility score
- Best practices score
- SEO score

**Thresholds**: Minimum 90 for all categories

**Local Testing**:
```bash
# Install Lighthouse CLI
npm install -g lighthouse

# Run Lighthouse
lighthouse http://localhost:3001 --view

# CI mode
lighthouse http://localhost:3001 --chrome-flags="--headless" --output=json
```

## Load Testing

**Current Status**: Not yet implemented

**Recommended Tools**:
- **k6**: Modern load testing
- **Artillery**: HTTP load testing
- **Locust**: Python-based load testing

**Example k6 Test** (Future):
```javascript
import http from 'k6/http';
import { check } from 'k6';

export default function () {
  const res = http.get('http://localhost:3000/api/v1/posts');
  check(res, {
    'status is 200': (r) => r.status === 200,
    'response time < 500ms': (r) => r.timings.duration < 500,
  });
}
```

## End-to-End Testing

**Current Status**: Not yet implemented

**Recommended Tools**:
- **Playwright**: Modern E2E testing
- **Cypress**: Feature-rich E2E framework
- **Puppeteer**: Headless Chrome control

**Example Playwright Test** (Future):
```typescript
import { test, expect } from '@playwright/test';

test('blog post page loads', async ({ page }) => {
  await page.goto('/blog/test-post');
  await expect(page.locator('h1')).toContainText('Test Post');
});
```

## Test Data Management

### Test Database
**Name**: `blog_test`

**Setup**:
```bash
# Create test database
docker exec blog-postgres psql -U blog_user -c "CREATE DATABASE blog_test;"

# Run migrations
cd backend
SQLX_OFFLINE=false cargo test -- --test-threads=1
```

### Fixtures
**Location**: Backend test fixtures (to be organized)

**Categories**:
- User fixtures
- Post fixtures
- Comment fixtures
- Category fixtures

## Continuous Integration

### GitHub Actions
**Backend**: `.github/workflows/backend-test.yml`
- Triggers: Push/PR to main, develop
- Service: PostgreSQL 17 container
- Command: `cargo test --workspace`

**Frontend**: `.github/workflows/frontend-ci.yml`
- Triggers: Push/PR to main, develop
- Steps: Lint → Type check → Unit tests → Build

### Test Reports
**Backend**: Test output in GitHub Actions logs

**Frontend**: Coverage reports (if configured)

**Viewing**:
```bash
# Local coverage report
cd frontend
pnpm test --coverage
open coverage/index.html
```

## Best Practices

### Test Organization
- Unit tests: Co-located with source code
- Integration tests: `__tests__` directories
- E2E tests: `./e2e` or `./tests/e2e`

### Test Naming
- Descriptive test names
- Given-When-Then structure
- User-focused descriptions

### Test Isolation
- Each test should be independent
- Clean up database state
- Reset mocks between tests

### Mock Configuration
- Mock external APIs
- Use test fixtures
- Control time-dependent tests

## Common Commands

### Backend Testing
```bash
# All tests
cargo test

# Watch mode
cargo watch -x test

# Verbose output
cargo test -- --nocapture

# Specific module
cargo test -p blog_api

# Documentation tests
cargo test --doc
```

### Frontend Testing
```bash
# All tests
pnpm test

# Watch mode
pnpm test --watch

# Coverage
pnpm test --coverage

# Specific file
pnpm test path/to/test.test.ts

# UI mode (Vitest)
pnpm test --ui
```

## Troubleshooting

### Database Connection Issues
```bash
# Check PostgreSQL is running
docker ps | grep blog-postgres

# Test connection
docker exec blog-postgres psql -U blog_user -d blog_test -c "SELECT 1"

# Restart database
docker restart blog-postgres
```

### Flaky Tests
- Check for timing dependencies
- Increase timeout values
- Ensure proper cleanup
- Add retry logic for external services

### Test Environment Issues
```bash
# Clean build
cd backend && cargo clean

# Rebuild
SQLX_OFFLINE=false cargo build

# Clear cache
cargo test --no-fail-fast
```

## Future Improvements

### Planned Additions
- [ ] E2E testing framework (Playwright/Cypress)
- [ ] Visual regression testing
- [ ] API contract testing
- [ ] Performance benchmarking
- [ ] Security testing (OWASP ZAP)
- [ ] Load testing suite (k6)

### Test Coverage Goals
- Backend: 80%+ code coverage
- Frontend: 75%+ code coverage
- Critical paths: 100% coverage

## See Also

- `./scripts/operations/quick-test.sh` - MDX integration testing
- `.github/workflows/` - CI/CD pipeline configuration
- `./backend/CLAUDE.md` - Backend testing documentation
- `./frontend/CLAUDE.md` - Frontend testing documentation
- `./backend/migrations/` - Database schema for test setup

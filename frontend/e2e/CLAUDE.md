# End-to-End (E2E) Tests

## Purpose
Comprehensive E2E test suites covering critical user journeys using Playwright.

## Directory Structure

```
frontend/e2e/
├── admin.spec.ts         # Admin panel E2E tests
├── api-contract.spec.ts  # API contract validation
├── auth.spec.ts          # Authentication flow tests
└── blog.spec.ts          # Blog functionality tests
```

## Test Suites

### 1. Admin Panel Tests
**File**: `admin.spec.ts` (13.5KB)

**Coverage**:
- Admin login and authentication
- Post management (create, edit, delete)
- Category management
- Tag management
- User management
- Comment moderation
- Role-based access control

**Test Data Helpers**:
```typescript
function generateAdminData() {
  const timestamp = Date.now()
  return {
    email: `admin_${timestamp}@example.com`,
    username: `admin_${timestamp}`,
    password: `AdminP@ssw0rd${timestamp}`,
  }
}
```

**Key Scenarios**:
- ✅ Admin can access admin panel
- ✅ Regular users blocked from admin panel
- ✅ Post CRUD operations
- ✅ User role modifications
- ✅ Comment approval/rejection workflows

### 2. API Contract Tests
**File**: `api-contract.spec.ts` (1.8KB)

**Purpose**: Validate API contracts and response schemas

**Coverage**:
- Response format validation
- Error handling verification
- Status code correctness
- Data type consistency

### 3. Authentication Tests
**File**: `auth.spec.ts` (9.2KB)

**Coverage**:
- User registration flow
- Login/logout functionality
- Password validation
- Session management
- Token handling
- Protected route access
- Email verification (if enabled)

**Critical Flows**:
- Registration → Email verification → Login
- Login → Token refresh → Logout
- Access protected routes with valid/invalid tokens

### 4. Blog Functionality Tests
**File**: `blog.spec.ts` (12.5KB)

**Coverage**:
- Blog listing page
- Post detail page
- MDX content rendering
- Math formula rendering
- Chemistry equation rendering
- Comment submission
- Search functionality
- Tag/category filtering
- Pagination

**Content Validation**:
- MDX components render correctly
- KaTeX math formulas display
- mhchem chemical equations work
- Code blocks have syntax highlighting
- Images load properly
- TOC navigation works

## Test Framework

### Technology
- **Framework**: Playwright
- **Language**: TypeScript
- **Runner**: `pnpm test:e2e`

### Configuration
**File**: `playwright.config.ts` (at frontend root)

**Typical Settings**:
```typescript
{
  testDir: './e2e',
  timeout: 30000,
  retries: process.env.CI ? 2 : 0,
  use: {
    baseURL: 'http://localhost:3001',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
}
```

## Test Data Management

### Dynamic Data Generation
Each test generates unique data using timestamps to avoid conflicts:
```typescript
const timestamp = Date.now()
const email = `user_${timestamp}@example.com`
```

### Cleanup Strategies
- **Automatic**: Tests clean up after themselves
- **Database**: Use test database or transactions
- **Isolation**: Each test suite runs independently

## Running Tests

### Run All E2E Tests
```bash
cd frontend
pnpm test:e2e
```

### Run Specific Test File
```bash
pnpm playwright test admin.spec.ts
```

### Debug Mode
```bash
pnpm playwright test --debug
```

### Interactive Mode
```bash
pnpm playwright test --ui
```

### Generate Report
```bash
pnpm playwright show-report
```

## Test Environment Requirements

### Prerequisites
1. **Backend API**: Running on `http://localhost:3000`
2. **Frontend**: Running on `http://localhost:3001`
3. **Database**: Test database or clean state
4. **Redis**: Running for session/cache

### Setup Script
```bash
# Start all services
cd backend && cargo run --bin api &
cd frontend && pnpm dev &

# Run tests
pnpm test:e2e

# Cleanup (optional)
killall api
killall node
```

## Best Practices

### Test Organization
- **Describe blocks**: Group related tests
- **BeforeAll/AfterAll**: Setup/teardown for suite
- **BeforeEach/AfterEach**: Reset state between tests
- **Page objects**: Reusable component selectors

### Selector Strategies
- **Prefer**: `data-testid` attributes
- **Avoid**: Brittle CSS selectors
- **Accessibility**: Use ARIA roles when appropriate

### Waiting Strategies
```typescript
// Good: Explicit wait
await page.waitForURL(/\/admin/)
await expect(element).toBeVisible()

// Bad: Arbitrary delays
await page.waitForTimeout(5000)  // Avoid!
```

### Assertion Strategies
```typescript
// Use Playwright's assertions
await expect(page).toHaveURL(/\/admin/)
await expect(text).toContainText('Success')
await expect(button).toBeEnabled()
```

## CI/CD Integration

### GitHub Actions Example
```yaml
- name: Install dependencies
  run: pnpm install

- name: Install Playwright browsers
  run: pnpm playwright install --with-deps

- name: Run E2E tests
  run: pnpm test:e2e

- name: Upload test report
  if: always()
  uses: actions/upload-artifact
  with:
    name: playwright-report
    path: playwright-report/
```

## Troubleshooting

### Common Issues

**Tests timeout**:
- Increase timeout in config
- Check if services are running
- Verify network connectivity

**Flaky tests**:
- Add retries in config
- Improve wait strategies
- Check for race conditions

**Selector not found**:
- Verify page loaded
- Use more specific selectors
- Add explicit waits

### Debugging Tips
```bash
# Run with headed browser
HEADLESS=true pnpm playwright test

# Keep browser open
pnpm playwright test --headed

# Run specific test
pnpm playwright test -g "should allow admin login"
```

## Coverage Goals

### Target Areas
- [ ] All authenticated flows
- [ ] All admin operations
- [ ] Critical user journeys
- [ ] Error scenarios
- [ ] Edge cases

### Success Metrics
- **Pass rate**: > 95% in CI
- **Execution time**: < 5 minutes
- **Flakiness**: < 2% retry rate

## Related Modules
- `frontend/src/app/admin/` - Admin panel implementation
- `frontend/src/app/blog/` - Blog functionality
- `backend/crates/api/src/routes/` - API endpoints
- `docs/testing/` - Test documentation and reports

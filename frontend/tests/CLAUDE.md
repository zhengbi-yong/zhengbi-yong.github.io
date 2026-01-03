# Frontend Tests Directory

## Purpose
Unit tests, integration tests, and test utilities for frontend components and logic.

## Directory Structure

```
frontend/tests/
├── README.md                           # Test documentation
├── setup.ts                            # Global test setup
├── diagnose-auth.js                    # Auth diagnostic utility
├── test-api.html                       # API testing page
├── test-auth.html                      # Auth testing page
├── test-health-endpoint.html           # Health check test page
├── kill-port-3001.bat                  # Port cleanup utility
├── mock-server-usage.md                # Mock server guide
├── app/                                # Component integration tests
│   ├── admin/
│   │   ├── comments-refine.test.tsx
│   │   ├── dashboard-refine.test.tsx
│   │   ├── integration.test.tsx
│   │   └── users-refine.test.tsx
├── lib/                                # Library tests
│   ├── providers/
│   │   ├── refine-auth-provider.test.ts
│   │   ├── refine-auth-provider-stress.test.ts
│   │   ├── refine-data-provider.test.ts
│   │   ├── refine-data-provider-stress.test.ts
│   │   └── refine-provider-integration.test.tsx
│   └── security/
│       └── sanitize.test.tsx
├── routes/                             # Route/page tests
│   ├── test-3dmol/page.tsx
│   ├── test-api/page.tsx
│   ├── test-chemistry/page.tsx
│   ├── test-chemistry-debug/page.tsx
│   ├── test-health-page/page.tsx
│   ├── test-molecule-id/page.tsx
│   └── test-rkit-mol/page.tsx
└── lib/utils/ResourceManager.test.tsx
```

## Test Framework

### Technology Stack
- **Runner**: Vitest
- **Testing Library**: React Testing Library
- **Mocking**: Vitest vi.mock()
- **Coverage**: c8 or v8

### Configuration
**File**: `vitest.config.ts` (at frontend root)

## Test Categories

### 1. Component Tests
**Location**: `app/`

**Coverage**:
- **Admin Panel**: Refine integration tests
  - User management (users-refine.test.tsx)
  - Comment moderation (comments-refine.test.tsx)
  - Dashboard analytics (dashboard-refine.test.tsx)
  - Integration scenarios (integration.test.tsx)

**Test Features**:
- Loading states
- Data rendering
- User interactions
- Error handling
- API mocking

### 2. Provider Tests
**Location**: `lib/providers/`

#### Auth Provider Tests
**Files**: `refine-auth-provider.test.ts`, `refine-auth-provider-stress.test.ts`

**Coverage**:
- ✅ Login (success/failure)
- ✅ Logout (success/failure)
- ✅ Check authentication
- ✅ Token refresh
- ✅ Get user identity
- ✅ Registration
- ✅ Error handling

**Stress Tests**:
- Multiple concurrent requests
- Token refresh edge cases
- Error recovery scenarios

#### Data Provider Tests
**Files**: `refine-data-provider.test.ts`, `refine-data-provider-stress.test.ts`

**Coverage**:
- ✅ getList (pagination, sorting, filtering)
- ✅ getOne (single resource)
- ✅ create (resource creation)
- ✅ update (resource updates)
- ✅ deleteOne (resource deletion)
- ✅ custom (custom requests)
- ✅ Error handling

**Integration Tests**: `refine-provider-integration.test.tsx`
- Auth + Data provider coordination
- End-to-end scenarios

### 3. Utility Tests
**Location**: `lib/utils/`, `lib/security/`

**Files**:
- `ResourceManager.test.tsx` - Resource management logic
- `sanitize.test.tsx` - Input sanitization security

### 4. Route Tests
**Location**: `routes/test-*/`

**Purpose**: Page-level integration and visual testing

**Test Pages**:
- `test-3dmol/` - 3D molecular visualization
- `test-api/` - API integration
- `test-chemistry/` - Chemistry rendering
- `test-chemistry-debug/` - Chemistry debug tools
- `test-health-page/` - Health endpoint
- `test-molecule-id/` - Molecule identification
- `test-rkit-mol/` - RDKit molecule rendering

### 5. Diagnostic Tools
**Files**:
- `diagnose-auth.js` - Auth flow debugging
- `test-api.html` - Manual API testing
- `test-auth.html` - Manual auth testing
- `test-health-endpoint.html` - Health check testing
- `kill-port-3001.bat` - Port cleanup (Windows)

## Running Tests

### All Tests
```bash
pnpm test
```

### Watch Mode
```bash
pnpm test:watch
```

### Coverage Report
```bash
pnpm test:coverage
```

### UI Mode
```bash
pnpm test:ui
```

### Specific Test File
```bash
pnpm test refine-auth-provider.test.ts
```

## Test Setup

### Global Configuration
**File**: `setup.ts`

**Purpose**:
- Configure test environment
- Setup global mocks
- Configure Testing Library
- Import test utilities

### Mock Strategy

#### API Mock
```typescript
vi.mock('@/lib/api/apiClient', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}))
```

#### Refine Hooks Mock
```typescript
vi.mock('@refinedev/core', () => ({
  useList: vi.fn(),
  useUpdate: vi.fn(),
  useDelete: vi.fn(),
}))
```

#### localStorage Mock
```typescript
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
}
global.localStorage = localStorageMock as any
```

## Test Best Practices

### 1. Isolation
- Each test is independent
- Clean state before/after each test
- No shared state between tests

### 2. Asynchronous Handling
```typescript
import { waitFor } from '@testing-library/react'

await waitFor(() => {
  expect(element).toBeVisible()
})
```

### 3. Error Scenarios
- Test success paths
- Test error paths
- Test edge cases
- Test boundary conditions

### 4. Descriptive Names
```typescript
it('should allow admin to update user role', async () => {
  // Test implementation
})

it('should show error when update fails', async () => {
  // Test implementation
})
```

### 5. Mock Cleanup
```typescript
beforeEach(() => {
  vi.clearAllMocks()
})

afterEach(() => {
  vi.restoreAllMocks()
})
```

## Coverage Goals

### Target Metrics
- **Statements**: > 80%
- **Branches**: > 75%
- **Functions**: > 80%
- **Lines**: > 80%

### Priority Areas
- Critical business logic (auth, data providers)
- Error handling paths
- Security-related functions
- User interactions

## Related Modules
- `frontend/e2e/` - E2E tests with Playwright
- `frontend/.husky/pre-commit` - Pre-commit test hook
- `frontend/src/lib/providers/` - Provider implementations
- `docs/testing/` - Testing documentation and reports

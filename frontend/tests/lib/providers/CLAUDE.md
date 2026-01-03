# Refine Providers Tests

## Module Overview

Comprehensive test suites for Refine auth and data providers, including stress tests and integration tests.

## Architecture Layer

### Layer 3: Provider Test Suites

```
tests/lib/providers/
├── refine-auth-provider.test.ts              # Auth provider unit tests
├── refine-auth-provider-stress.test.ts       # Auth stress tests
├── refine-data-provider.test.ts              # Data provider unit tests
├── refine-data-provider-stress.test.ts       # Data stress tests
└── refine-provider-integration.test.tsx      # Provider integration tests
```

**Scope**: Provider logic validation
**Hierarchy**: E2E tests → Provider integration → Provider unit tests

## Test Files

### refine-auth-provider.test.ts

**Test Categories**:

1. **login** - Authentication flow
2. **logout** - Session cleanup
3. **check** - Auth state verification
4. **getIdentity** - User profile retrieval
5. **register** - User registration
6. **onError** - Error handling

**Key Test Scenarios**:

**Successful Login**
```typescript
it('should login successfully', async () => {
  const mockResponse = {
    access_token: 'token123',
    user: { id: '1', username: 'testuser', email: 'test@test.com' }
  }

  vi.mocked(authService.login).mockResolvedValue(mockResponse)

  const result = await authProvider.login({
    email: 'test@test.com',
    password: 'password123',
  })

  expect(result.success).toBe(true)
  expect(result.redirectTo).toBe('/admin')
})
```

**Login Failure**
```typescript
it('should handle login failure', async () => {
  vi.mocked(authService.login).mockRejectedValue(
    new Error('Invalid credentials')
  )

  const result = await authProvider.login({ /* ... */ })

  expect(result.success).toBe(false)
  expect(result.error?.message).toBe('Invalid credentials')
})
```

**Token Refresh Flow**
```typescript
it('should refresh token when getCurrentUser fails', async () => {
  localStorageMock.getItem.mockReturnValue('expired_token')

  // First call fails (expired token)
  vi.mocked(authService.getCurrentUser)
    .mockRejectedValueOnce(new Error('Token expired'))
    // Second call succeeds (after refresh)
    .mockResolvedValueOnce(mockUser)

  vi.mocked(authService.refreshToken).mockResolvedValue({
    access_token: 'new_token'
  })

  const result = await authProvider.check()

  expect(result.authenticated).toBe(true)
  expect(authService.refreshToken).toHaveBeenCalled()
})
```

**Logout with API Failure**
```typescript
it('should logout even if API fails', async () => {
  vi.mocked(authService.logout).mockRejectedValue(
    new Error('Logout failed')
  )

  const result = await authProvider.logout()

  // Should still clear local state
  expect(result.success).toBe(true)
  expect(localStorageMock.removeItem).toHaveBeenCalledWith('access_token')
  expect(localStorageMock.removeItem).toHaveBeenCalledWith('user_info')
})
```

**401 Error Handling**
```typescript
it('should logout on 401 error', async () => {
  const error = { statusCode: 401, message: 'Unauthorized' }

  const result = await authProvider.onError(error as any)

  expect(result.logout).toBe(true)
  expect(result.redirectTo).toBe('/')
})
```

## Test Patterns

### Mock Setup

```typescript
// Auth service
vi.mock('@/lib/api/backend', () => ({
  authService: {
    login: vi.fn(),
    logout: vi.fn(),
    getCurrentUser: vi.fn(),
    refreshToken: vi.fn(),
    register: vi.fn(),
  },
}))

// localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
}

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
})
```

### Cleanup

```typescript
beforeEach(() => {
  vi.clearAllMocks()
  localStorageMock.getItem.mockReturnValue(null)
})

afterEach(() => {
  vi.restoreAllMocks()
})
```

## Provider Interface

### Auth Provider Methods

```typescript
interface AuthProvider {
  login: (params: { email: string; password: string }) => Promise<AuthResult>
  logout: () => Promise<AuthResult>
  check: () => Promise<CheckResult>
  getIdentity: () => Promise<UserIdentity | null>
  register: (params: RegisterParams) => Promise<AuthResult>
  onError: (error: any) => Promise<ErrorHandlerResult>
}
```

### Return Types

**AuthResult**
```typescript
{
  success: boolean
  redirectTo?: string
  error?: { message: string }
}
```

**CheckResult**
```typescript
{
  authenticated: boolean
  logout?: boolean
  redirectTo?: string
}
```

## Extension Guide

### Adding New Auth Test

1. **Test new auth flow**:
```typescript
describe('passwordReset', () => {
  it('should send reset email', async () => {
    vi.mocked(authService.passwordReset).mockResolvedValue({})

    const result = await authProvider.passwordReset({
      email: 'test@test.com'
    })

    expect(result.success).toBe(true)
  })
})
```

2. **Test edge cases**:
- Token expiration scenarios
- Concurrent auth operations
- Network failures
- Invalid credentials

### Testing Data Providers

```typescript
describe('Data Provider', () => {
  it('should fetch list with pagination', async () => {
    const dataProvider = refineDataProvider(API_URL)

    const result = await dataProvider.getList({
      resource: 'users',
      pagination: { current: 1, pageSize: 10 },
    })

    expect(result.data).toHaveLength(10)
    expect(result.total).toBeGreaterThan(0)
  })

  it('should handle create operations', async () => {
    const result = await dataProvider.create({
      resource: 'posts',
      values: { title: 'New Post', content: 'Content' },
    })

    expect(result.data.title).toBe('New Post')
  })
})
```

### Stress Testing

```typescript
describe('Stress Tests', () => {
  it('should handle rapid login attempts', async () => {
    const attempts = Array.from({ length: 100 }, (_, i) =>
      authProvider.login({
        email: `user${i}@test.com`,
        password: 'password',
      })
    )

    const results = await Promise.allSettled(attempts)

    const successful = results.filter(r => r.status === 'fulfilled').length
    expect(successful).toBeGreaterThan(90) // 90% success rate
  })
})
```

## Dependencies

**Testing Framework**
- `vitest` - Test runner
- `@testing-library/react` - For integration tests

**Mocked Dependencies**
- `@/lib/api/backend` - Auth service
- `localStorage` - Browser storage

**Provider Implementation**
- `@/lib/providers/refine-auth-provider` - Auth provider
- `@/lib/providers/refine-data-provider` - Data provider

## Related Modules

- `/src/lib/providers/**/*` - Provider implementations
- `/src/lib/api/backend.ts` - Backend API service
- `/tests/app/admin/**/*` - Admin integration tests

## Best Practices

- **Mock isolation**: Each test should have fresh mocks
- **Async handling**: Use proper async/await patterns
- **Error cases**: Test both success and failure paths
- **Edge cases**: Token expiry, network failures, concurrent ops
- **Cleanup**: Restore mocks after each test
- **Realism**: Mock should resemble real API responses

## Running Tests

```bash
# All provider tests
npm test -- tests/lib/providers

# Auth provider only
npm test -- refine-auth-provider.test.ts

# Stress tests
npm test -- --stress tests/lib/providers

# With coverage
npm test -- --coverage tests/lib/providers
```

## Coverage Goals

- All provider methods
- Success and error paths
- Token refresh flows
- Edge cases (network failures, timeouts)
- Concurrent operations
- State cleanup on logout

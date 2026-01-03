# Admin App Integration Tests

## Module Overview

Integration tests for admin pages, testing multi-page interactions, data consistency, and state synchronization across Refine-based admin interface.

## Architecture Layer

### Layer 3: Application Integration Tests

```
tests/
└── app/
    └── admin/
        ├── integration.test.tsx          # Cross-page integration
        ├── dashboard-refine.test.tsx     # Dashboard tests
        ├── users-refine.test.tsx         # User management tests
        └── comments-refine.test.tsx      # Comment moderation tests
```

**Scope**: Admin application integration testing
**Hierarchy**: E2E tests → Integration tests → Unit tests

## Test Structure

### Integration Tests (integration.test.tsx)

**Test Categories**:

1. **Data Consistency** - Data integrity across pages
2. **Error Recovery** - Network error handling and retry logic
3. **Concurrent Operations** - Parallel update handling
4. **State Synchronization** - Multi-component state consistency

### Key Test Scenarios

**Data Consistency**
```typescript
it('should maintain consistent user data across pages', async () => {
  // Simulate data shared between Users and Dashboard
  const mockUsers = [/* user data */]
  mockUseList.mockReturnValue({ data: { data: mockUsers } })

  // Update user role in Users page
  await updateHook.mutateAsync({
    resource: 'admin/users',
    id: '1',
    values: { role: 'admin' },
  })

  // Verify update propagates
  expect(updateMockAsync).toHaveBeenCalled()
})
```

**Error Recovery**
```typescript
it('should recover from network error and retry', async () => {
  // First call fails
  mockUseList.mockReturnValueOnce({
    error: new Error('Network error')
  })

  // Second call succeeds (retry logic)
  mockUseList.mockReturnValueOnce({
    data: { data: [], total: 0 },
    error: null
  })
})
```

**Concurrent Updates**
```typescript
it('should handle concurrent updates without conflicts', async () => {
  // Parallel updates to different users
  const promises = [
    mockUseUpdate().mutateAsync({
      resource: 'admin/users',
      id: '1',
      values: { role: 'admin' },
    }),
    mockUseUpdate().mutateAsync({
      resource: 'admin/users',
      id: '2',
      values: { role: 'moderator' },
    }),
  ]

  await Promise.all(promises)
  expect(updateMock).toHaveBeenCalledTimes(2)
})
```

**State Synchronization**
```typescript
it('should sync state across multiple components', async () => {
  // Dashboard uses stats
  const statsReturn = {
    data: { data: [{ total_users: 100 }], total: 1 }
  }

  // Users page uses user list
  const usersReturn = {
    data: { data: [{ id: '1' }], total: 100 }
  }

  // Verify consistency
  expect(statsResult.data.data[0].total_users).toBe(100)
  expect(usersResult.data.total).toBe(100)
})
```

## Test Patterns

### Mock Setup

```typescript
// Refine hooks
vi.mock('@refinedev/core', () => ({
  useList: vi.fn(),
  useUpdate: vi.fn(),
  useDelete: vi.fn(),
}))

// Auth store
vi.mock('@/lib/store/auth-store', () => ({
  useAuthStore: vi.fn(),
}))

// Router
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
}))
```

### Query Client Provider

```typescript
const renderWithProviders = (component: React.ReactElement) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })

  return render(
    <QueryClientProvider client={queryClient}>
      {component}
    </QueryClientProvider>
  )
}
```

### Auth State Mocking

```typescript
mockUseAuthStore.mockReturnValue({
  user: { id: '1', username: 'admin', email: 'admin@test.com' },
  isAuthenticated: true,
  checkAuth: vi.fn().mockResolvedValue(true),
} as any)
```

## Integration Points

### Tested Pages
- `/admin` - Dashboard with stats
- `/admin/users` - User management
- `/admin/comments` - Comment moderation

### Refine Hooks
- `useList` - Data fetching
- `useUpdate` - Update operations
- `useDelete` - Delete operations

### State Management
- Auth store (`/lib/store/auth-store`)
- React Query (`@tanstack/react-query`)
- Router (`next/navigation`)

## Extension Guide

### Adding New Integration Test

1. **Define test scenario**:
```typescript
describe('New Feature Integration', () => {
  it('should coordinate between Page A and Page B', async () => {
    // Setup mocks for both pages
    mockUseList
      .mockReturnValueOnce(pageAMock)
      .mockReturnValueOnce(pageBMock)

    // Perform action on Page A
    // Verify state change on Page B
  })
})
```

2. **Test cross-page workflows**:
- Data updates reflecting across pages
- Navigation state preservation
- Shared resource consistency

### Testing Error Flows

```typescript
it('should handle cascading failures', async () => {
  // Mock cascade: API fails → retry fails → fallback
  mockUseList
    .mockRejectedValueOnce(new Error('API down'))
    .mockRejectedValueOnce(new Error('Retry failed'))

  // Verify fallback behavior
  expect(screen.getByText('Unable to load')).toBeInTheDocument()
})
```

### Testing Race Conditions

```typescript
it('should handle rapid navigation', async () => {
  // Rapid page switches
  fireEvent.click(screen.getByText('Users'))
  fireEvent.click(screen.getByText('Comments'))
  fireEvent.click(screen.getByText('Dashboard'))

  // Verify no data corruption
  await waitFor(() => {
    expect(screen.getByText('Total Users')).toBeInTheDocument()
  })
})
```

## Dependencies

**Testing Framework**
- `vitest` - Test runner
- `@testing-library/react` - Component testing
- `@testing-library/user-event` - User interaction simulation

**Mocked Dependencies**
- `@refinedev/core` - Refine hooks
- `@tanstack/react-query` - Query client
- `next/navigation` - Next.js router
- `@/lib/store/auth-store` - Auth state

## Related Modules

- `/src/app/admin/**/*` - Admin pages being tested
- `/src/lib/providers/**/*` - Provider implementations
- `/tests/lib/providers/**/*` - Provider unit tests

## Best Practices

- **Isolation**: Each test should be independent
- **Cleanup**: Use `beforeEach` to reset mocks
- **Realism**: Simulate actual user workflows
- **Timing**: Use `waitFor` for async operations
- **Coverage**: Test both success and failure paths
- **State**: Verify state consistency across operations

## Running Tests

```bash
# All admin integration tests
npm test -- tests/app/admin

# Specific file
npm test -- tests/app/admin/integration.test.tsx

# Watch mode
npm test -- --watch tests/app/admin
```

## Coverage Goals

- Cross-page data consistency
- Error recovery scenarios
- Concurrent operation handling
- State synchronization
- User workflow integrity

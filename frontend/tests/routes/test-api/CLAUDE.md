# API Test Page

## Module Overview

Comprehensive API testing interface for backend integration verification.

## Architecture Layer

### Layer 3: Route Testing

```
tests/routes/test-api/
└── page.tsx    # API test interface
```

**Purpose**: Validate backend API connectivity
**Access**: `/test-api`

## Test Coverage

### Authentication State

**Token Validation**
- Existence check from localStorage
- Token length verification
- User info parsing

**User Information**
- User ID
- Email
- Username
- Role

### API Endpoints

**Posts API**
- Endpoint: `http://localhost:3000/v1/admin/posts`
- Method: GET
- Auth: Bearer token
- Response: Total count, posts array

**Users API**
- Endpoint: `http://localhost:3000/v1/admin/users`
- Method: GET
- Auth: Bearer token
- Response: Total count, users array

**Comments API**
- Endpoint: `http://localhost:3000/v1/admin/comments`
- Method: GET
- Auth: Bearer token
- Response: Total count, comments array

## Implementation

### Test Execution

```typescript
useEffect(() => {
  const storedToken = localStorage.getItem('access_token')
  const storedUser = localStorage.getItem('user_info')

  if (storedToken) {
    // Test all endpoints
    testPostsAPI(storedToken)
    testUsersAPI(storedToken)
    testCommentsAPI(storedToken)
  }
}, [])
```

### API Call Pattern

```typescript
const response = await fetch('http://localhost:3000/v1/admin/posts', {
  headers: {
    'Authorization': `Bearer ${token}`,
  },
})

const data = {
  status: response.status,
  ok: response.ok,
  data: await response.json(),
}
```

## Response Display

### Success State
- Status code
- OK boolean
- Total count
- Array length
- Expandable JSON details

### Error State
- Error message
- Red highlighting

## Actions

- **前往管理面板** - Navigate to admin
- **前往登录** - Navigate to login
- **清除缓存并刷新** - Clear localStorage and reload

## Dependencies

- Backend API: `http://localhost:3000`
- localStorage: Token and user info
- Auth tokens: Bearer authentication

## Related Modules

- `/src/lib/api/backend.ts` - API client
- `/tests/app/admin/**/*` - Admin integration tests
- `/src/lib/providers/**/*` - Auth providers

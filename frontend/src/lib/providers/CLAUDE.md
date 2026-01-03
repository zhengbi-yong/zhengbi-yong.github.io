# `@/lib/providers` Module

## Layer 1: Module Overview

### Purpose
React context providers for Refine (admin framework) integration, authentication, and data management.

### Scope
- Refine data provider (CRUD operations)
- Refine auth provider (authentication)
- Admin provider wrapper
- Provider composition

## Layer 2: Architecture

### Files
- **refine-data-provider.ts**: Data provider for Refine CRUD operations
- **refine-auth-provider.ts**: Authentication provider for Refine
- **admin-provider.tsx**: Admin provider wrapper component
- **refine-provider.tsx**: Combined Refine providers

### Data Provider (refine-data-provider.ts)

**Purpose**: Bridge Refine admin framework with backend API

**Methods**:
```typescript
interface DataProvider {
  getList: (resource, params) => Promise<{ data, total }>
  getOne: (resource, params) => Promise<{ data }>
  create: (resource, params) => Promise<{ data }>
  update: (resource, params) => Promise<{ data }>
  deleteOne: (resource, params) => Promise<{ data }>
  // ... many more Refine methods
}
```

**Resources**:
- `users`: User management
- `posts`: Blog post management
- `comments`: Comment moderation
- `categories`: Category management
- `tags`: Tag management

### Auth Provider (refine-auth-provider.ts)

**Purpose**: Handle authentication for Refine admin panel

**Methods**:
```typescript
interface AuthProvider {
  login: (params) => Promise<void>
  logout: (params) => Promise<void>
  checkAuth: (params) => Promise<void>
  checkError: (error) => Promise<void>
  getPermissions: (params) => Promise<void>
  getUserIdentity: (params) => Promise<User>
}
```

**Implementation**:
- Uses `@/lib/api/backend` for auth calls
- Manages access tokens in localStorage
- Redirects to login on auth failure

### Admin Provider (admin-provider.tsx)

**Purpose**: Wrap admin pages with necessary providers

```tsx
export function AdminProvider({ children }) {
  return (
    <RefineProvider>
      <DataProvider>
        <AuthProvider>
          {children}
        </AuthProvider>
      </DataProvider>
    </RefineProvider>
  )
}
```

## Layer 3: Implementation Details

### Data Provider Mapping

**getList Example**:
```typescript
getList: async (resource, params) => {
  const { pagination, sort, filter } = params

  // Map Refine params to API params
  const apiParams = {
    page: pagination.current,
    limit: pagination.pageSize,
    sort: sort.field,
    order: sort.order,
    ...filter
  }

  const response = await api.get(`/${resource}`, { params })
  return {
    data: response.data.items,
    total: response.data.total
  }
}
```

### Auth Provider Flow

**Login**:
```typescript
login: async ({ username, password }) => {
  const { access_token } = await backend.login({ username, password })
  localStorage.setItem('access_token', access_token)
}
```

**Check Auth**:
```typescript
checkAuth: async () => {
  const token = localStorage.getItem('access_token')
  if (!token) {
    return Promise.reject(new Error('Not authenticated'))
  }
}
```

**Logout**:
```typescript
logout: async () => {
  await backend.logout()
  localStorage.removeItem('access_token')
  // Redirect to login
}
```

## Architecture Context

### Integration Points
- **Location**: `@/lib/providers` → Admin framework integration
- **Admin Framework**: Refine (https://refine.dev)
- **Backend**: `@/lib/api/backend`
- **UI**: Admin pages in `@/app/admin`

### Usage Example

**Admin Layout**:
```tsx
import { AdminProvider } from '@/lib/providers'

export default function AdminLayout({ children }) {
  return (
    <AdminProvider>
      <Refine>
        <Sidebar />
        <Header />
        {children}
      </Refine>
    </AdminProvider>
  )
}
```

**Refine Resource Definition**:
```tsx
<Refine
  dataProvider={dataProvider}
  authProvider={authProvider}
  resources={[
    {
      name: 'users',
      list: UserList,
      edit: UserEdit,
      show: UserShow
    }
  ]}
/>
```

## Dependencies

- `@refinedev/core`: Refine framework
- `@/lib/api/backend`: Backend API client
- React Context: Provider pattern

## Related Modules

- `@/app/admin`: Admin pages
- `@/lib/api`: Backend integration
- `@/lib/store`: State management

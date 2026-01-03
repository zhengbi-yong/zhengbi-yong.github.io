# OpenAPI Specification

## Module Overview

OpenAPI 3.1.0 specification for the Blog Platform RESTful API.

## Purpose

Document all API endpoints, request/response schemas, authentication requirements, and error handling.

## Structure

```
backend/openapi/
└── openapi.json    # OpenAPI 3.1.0 specification
```

## OpenAPI Version

**Specification**: OpenAPI 3.1.0
**Title**: Blog Platform API
**Version**: 1.0.0

## Servers

### Development Server
```
URL: http://localhost:3000/v1
Description: Development server
```

### Production Server
```
URL: https://api.example.com/v1
Description: Production server
```

## API Structure

### Base URL
```
{server}/v1
```

### Versioning
- **Version 1**: Current stable API
- **Breaking Changes**: Will increment to v2
- **Non-Breaking Changes**: Remain in v1

## Endpoint Categories

### Posts API (`/posts`)

#### List Posts
```
GET /v1/posts
```

**Authentication**: Not required

**Query Parameters**:
- `page` (integer, default: 1) - Page number
- `limit` (integer, default: 20, max: 100) - Items per page

**Response**: `ApiResponse<PaginatedResponse<PostListItem>>`

**Status Codes**:
- `200 OK` - Successful response

#### Get Post by Slug
```
GET /v1/posts/{slug}
```

**Authentication**: Not required

**Path Parameters**:
- `slug` (string, required) - Post slug

**Response**: `ApiResponse<PostDetail>`

**Status Codes**:
- `200 OK` - Post found
- `404 Not Found` - Post not found (`ApiError`)

### Authentication API (`/auth`)

#### User Login
```
POST /v1/auth/login
```

**Authentication**: Not required (credentials in body)

**Request Body**:
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response**: `ApiResponse<AuthResponse>`

**Status Codes**:
- `200 OK` - Login successful
- `401 Unauthorized` - Invalid credentials (`ApiError`)

## Data Models

### ApiResponse
Standard API response wrapper.

```typescript
{
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  meta?: {
    timestamp: string;
    request_id: string;
  };
}
```

### PaginatedResponse
Pagination metadata wrapper.

```typescript
{
  items: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}
```

### PostListItem
Post summary for list views.

```typescript
{
  slug: string;
  title: string;
  excerpt: string;
  author: {
    id: string;
    username: string;
    email: string;
  };
  created_at: string;  // ISO 8601
  updated_at: string;  // ISO 8601
  stats: {
    view_count: number;
    like_count: number;
    comment_count: number;
  };
}
```

### PostDetail
Full post with content.

```typescript
{
  slug: string;
  title: string;
  content: string;
  html_content: string;
  author: {
    id: string;
    username: string;
    email: string;
    profile: object;
  };
  created_at: string;
  updated_at: string;
  stats: {
    view_count: number;
    like_count: number;
    comment_count: number;
  };
}
```

### AuthResponse
Authentication response.

```typescript
{
  user: {
    id: string;
    email: string;
    username: string;
    profile: object;
  };
  tokens: {
    access_token: string;
    refresh_token: string;
    expires_in: number;  // seconds
  };
}
```

### ApiError
Error response structure.

```typescript
{
  success: false;
  error: {
    code: string;        // e.g., "VALIDATION_ERROR", "NOT_FOUND"
    message: string;     // Human-readable message
    details?: any;       // Additional error context
  };
  meta: {
    timestamp: string;
    request_id: string;
  };
}
```

## Authentication

### Token Types
- **Access Token**: Short-lived JWT (15 minutes)
- **Refresh Token**: Long-lived token (7 days)

### Authenticated Requests
```
Authorization: Bearer {access_token}
```

### Token Endpoints
```
POST /v1/auth/login       # Get tokens
POST /v1/auth/refresh     # Refresh access token
POST /v1/auth/logout      # Invalidate tokens
```

## Error Handling

### Error Codes

#### 4xx Client Errors
- `400 Bad Request` - Invalid request format
- `401 Unauthorized` - Missing or invalid authentication
- `403 Forbidden` - Insufficient permissions
- `404 Not Found` - Resource not found
- `409 Conflict` - Resource conflict (e.g., duplicate email)
- `422 Unprocessable Entity` - Validation error
- `429 Too Many Requests` - Rate limit exceeded

#### 5xx Server Errors
- `500 Internal Server Error` - Unexpected server error
- `503 Service Unavailable` - Service temporarily unavailable

### Error Response Format
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Email is required",
    "details": {
      "field": "email",
      "constraint": "required"
    }
  },
  "meta": {
    "timestamp": "2026-01-03T12:00:00Z",
    "request_id": "req_abc123"
  }
}
```

## Rate Limiting

### Limits
- **Unauthenticated**: 60 requests/minute
- **Authenticated**: 1000 requests/minute

### Headers
```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 995
X-RateLimit-Reset: 1641234567
```

### Rate Limit Error
```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Rate limit exceeded. Try again in 30 seconds.",
    "details": {
      "retry_after": 30
    }
  }
}
```

## Pagination

### Query Parameters
- `page` (integer, default: 1) - Page number (1-indexed)
- `limit` (integer, default: 20, max: 100) - Items per page

### Response Headers
```
X-Page: 1
X-Limit: 20
X-Total: 150
X-Pages: 8
```

### Response Format
```json
{
  "success": true,
  "data": {
    "items": [...],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 150,
      "pages": 8
    }
  }
}
```

## CORS Configuration

### Allowed Origins
**Development**:
- `http://localhost:3001` (Frontend)
- `http://localhost:3000` (Backend)
- `http://localhost:3002`
- `http://localhost:3003`

**Production**:
- Configured via environment variable

### Allowed Methods
- GET, POST, PUT, PATCH, DELETE, OPTIONS

### Allowed Headers
- Content-Type, Authorization, X-Requested-With

## Validation

### Email Validation
```json
{
  "email": "user@example.com"
}
```
**Format**: Valid email address (RFC 5322)
**Case**: Case-insensitive (CITEXT in database)

### Password Validation
```json
{
  "password": "SecurePass123!"
}
```
**Requirements**:
- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number
- At least one special character

### Username Validation
```json
{
  "username": "johndoe123"
}
```
**Requirements**:
- 3-30 characters
- Alphanumeric and underscore only
- Case-insensitive (CITEXT in database)

## Health Check

### Endpoint
```
GET /v1/healthz
```

### Response
```json
{
  "status": "healthy",
  "version": "1.0.0",
  "uptime_seconds": 3600,
  "services": {
    "database": "connected",
    "redis": "connected"
  }
}
```

## API Versioning Strategy

### URL Versioning
```
/v1/posts   # Version 1 (current)
/v2/posts   # Version 2 (future)
```

### Deprecation Policy
- **Notice Period**: 6 months
- **Headers**: `X-API-Deprecation: true, X-Sunset: 2026-07-03`
- **Documentation**: Updated with sunset dates

## Best Practices

### Request IDs
Every request gets a unique ID:
```json
{
  "meta": {
    "request_id": "req_abc123xyz"
  }
}
```

### Timestamps
All timestamps in ISO 8601 format:
```
2026-01-03T12:00:00Z
```

### Idempotency
**Idempotent Operations**: GET, PUT, DELETE
**Non-Idempotent**: POST

### ETags for Caching
```
ETag: "33a64df551425fcc55e4d42a148795d9f25f89d4"
```

## Usage Examples

### Fetch Posts (cURL)
```bash
curl -X GET "http://localhost:3000/v1/posts?page=1&limit=20" \
  -H "Accept: application/json"
```

### Login (cURL)
```bash
curl -X POST "http://localhost:3000/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "SecurePass123!"
  }'
```

### Authenticated Request (cURL)
```bash
curl -X GET "http://localhost:3000/v1/posts/my-post" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Accept: application/json"
```

## Integration with Backend

### OpenAPI Generation
```bash
# Generate from Rust code (using utoipa)
cargo run --bin generate-openapi

# Output: backend/openapi/openapi.json
```

### Validation
```bash
# Validate OpenAPI spec
npx @apidevtools/swagger-cli validate backend/openapi/openapi.json
```

### Documentation Generation
```bash
# Generate HTML docs
npx @redocly/cli build-docs backend/openapi/openapi.json -o api-docs.html
```

## Related Modules

- **Backend Routes**: `../src/routes/` - Route handlers
- **Backend Models**: `../src/models/` - Data models
- **Middleware**: `../src/middleware/` - Auth, validation, error handling
- **Tests**: `../tests/` - API integration tests

## Resources

- [OpenAPI 3.1 Specification](https://spec.openapis.org/oas/v3.1.0)
- [OpenAPI Tools](https://openapi.tools/)
- [API Design Best Practices](https://github.com/microsoft/api-guidelines)

---

**Last Updated**: 2026-01-03
**Maintained By**: API Team

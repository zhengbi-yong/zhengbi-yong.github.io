# Reference Documentation

## Purpose
Technical specifications, API documentation, and design standards for the blog system.

## Directory Structure

```
docs/reference/
├── README.md                           # Reference documentation index
├── color-system.md                     # Design color specifications
├── ai-development.md                   # AI development guidelines
└── Blog_API.postman_collection.json    # Postman API collection
```

## Content Scope

### Design Specifications
1. **Color System**
   - Primary/secondary/accent colors
   - Dark/light theme palettes
   - Semantic color mappings (success, warning, error)
   - Usage guidelines and component integration

2. **Component Styling**
   - Tailwind CSS configuration
   - shadcn/ui theme customization
   - Responsive breakpoint standards

### API Documentation
1. **Postman Collection**
   - Complete API endpoint definitions
   - Request/response examples
   - Authentication setup
   - Environment variable configuration

2. **Endpoint Categories**
   - Authentication (`/v1/auth/*`)
   - Posts (`/v1/posts/*`)
   - Comments (`/v1/comments/*`)
   - Admin (`/v1/admin/*`)
   - Health (`/health`)

### Development Guidelines
1. **AI Development Standards**
   - Code generation patterns
   - Testing requirements
   - Documentation standards
   - Review processes

## Key Information

### API Base URL
```
Development: http://localhost:3000
Production:  https://api.yourdomain.com
```

### Authentication
All API requests require Bearer token:
```bash
Authorization: Bearer <access_token>
```

### Color System Structure
```typescript
// Primary colors
primary: {
  50: '#f0f9ff',
  500: '#0ea5e9',
  900: '#0c4a6e'
}

// Semantic colors
success: '#22c55e'
warning: '#f59e0b'
error: '#ef4444'
info: '#3b82f6'
```

## Usage Guidelines

### Color System Application
1. **Primary Colors**: CTAs, links, brand elements
2. **Secondary Colors**: Supporting UI elements
3. **Semantic Colors**: Status indicators, notifications
4. **Neutral Colors**: Text, backgrounds, borders

### API Testing Workflow
1. Import Postman collection: `Blog_API.postman_collection.json`
2. Configure environment variables (base_url, token)
3. Run authentication request to obtain token
4. Update environment variable with received token
5. Execute endpoint tests

### Development Standards
- Follow TypeScript strict mode
- Use async/await for asynchronous operations
- Implement proper error handling
- Write JSDoc comments for public APIs
- Maintain test coverage above 80%

## Related Modules
- `docs/guides/frontend-backend-guide.md` - API usage guide
- `backend/crates/api/src/routes/` - API implementations
- `frontend/src/lib/` - Frontend utilities and types
- `frontend/tailwind.config.js` - Tailwind configuration

## Standards Compliance

### TypeScript Standards
- Strict type checking enabled
- No `any` types without documentation
- Interface definitions for all API contracts
- Proper generic type constraints

### API Design Principles
- RESTful architecture
- Consistent response formats
- Proper HTTP status codes
- CORS configuration for cross-origin requests
- Rate limiting for endpoint protection

### Documentation Standards
- JSDoc for all public functions
- README.md for each major module
- Changelog for version tracking
- Inline comments for complex logic

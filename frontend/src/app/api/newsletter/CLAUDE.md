# Newsletter API Route (api/newsletter)

## Overview
Next.js 15 API route handler for newsletter subscription management using Pliny's NewsletterAPI. Delegates newsletter operations to external providers (currently Buttondown).

## Technology Stack
- **Framework**: Next.js 15 (App Router API Route)
- **Library**: Pliny (@pliny/newsletter)
- **Provider**: Buttondown
- **Type**: TypeScript
- **Runtime**: Force Static (`dynamic = 'force-static'`)

## Route Configuration

### File-Based Routing
```
frontend/src/app/api/newsletter/
├── route.ts          # API route handler
└── CLAUDE.md         # This file
```

**URL Pattern**: `/api/newsletter`

### Supported Methods
- **GET**: Newsletter information/verification
- **POST**: Newsletter subscription

## Core Implementation

### 1. Static Optimization
```typescript
export const dynamic = 'force-static'
```
- Forces route to be statically optimized
- Improves performance by pre-generating at build time
- Suitable for newsletter operations that don't require dynamic server rendering

### 2. Newsletter Configuration
```typescript
const newsletterConfig: NewsletterConfig = {
  provider: siteMetadata.newsletter.provider,  // 'buttondown'
}
```

**Configuration Source**: `@/data/siteMetadata`
```typescript
siteMetadata.newsletter.provider  // Type: 'buttondown'
```

### 3. API Handler
```typescript
const handler = NewsletterAPI(newsletterConfig)
export { handler as GET, handler as POST }
```

**Pattern**: Single handler exported for both GET and POST methods.

## Type Definitions

### NewsletterConfig (from Pliny)
```typescript
interface NewsletterConfig {
  provider: 'buttondown' | 'convertkit' | 'mailchimp' | 'revue' | ... // string literal union
  // Provider-specific fields...
}
```

**Provider**: Currently configured as `'buttondown'`

### NewsletterAPI Function
```typescript
function NewsletterAPI(config: NewsletterConfig): (req: Request) => Promise<Response>
```

Returns a Next.js route handler function.

## API Behavior

### GET Request
**Purpose**: Verify newsletter configuration or retrieve newsletter info

**Request**: `GET /api/newsletter`

**Response**: Depends on NewsletterAPI implementation
- Likely returns newsletter status/configuration
- May validate provider setup

### POST Request
**Purpose**: Subscribe email to newsletter

**Request**: `POST /api/newsletter`
```typescript
// Expected body (provider-specific)
{
  email: string
  // Additional fields based on provider...
}
```

**Response**:
- Success: Confirmation response
- Error: Error message (invalid email, already subscribed, etc.)

## Provider Integration

### Buttondown Provider
**Current Provider**: Buttondown (newsletter platform)

**Integration Flow**:
1. Request hits `/api/newsletter`
2. NewsletterAPI handler processes request
3. Calls Buttondown API via Pliny's integration
4. Returns response to client

**Configuration**:
- Provider selection from `siteMetadata`
- Type-safe: `'buttondown'` matches NewsletterConfig provider union
- No API key visible in this file (likely in environment variables)

## Data Flow

### Subscription Flow
```
Client Form
  ↓ POST /api/newsletter { email }
Next.js Route Handler (route.ts)
  ↓ NewsletterAPI(newsletterConfig)
Pliny NewsletterAPI
  ↓ Buttondown API
Buttondown Service
  ↓ Response
Client
```

### Type Safety
```typescript
// siteMetadata.newsletter.provider: 'buttondown'
// NewsletterConfig.provider: 'buttondown' | ...
// Assignment is type-safe ✅
```

## Styling
**N/A** - This is an API route, no UI components.

## Error Handling
**Delegated to Pliny's NewsletterAPI**:
- Provider-specific errors (Buttondown API errors)
- Validation errors (email format, missing fields)
- Network errors
- Errors returned as HTTP responses with appropriate status codes

## Integration Points

### Site Metadata
```typescript
import siteMetadata from '@/data/siteMetadata'
```
- Centralized configuration
- Provider selection
- Newsletter settings

### Pliny Newsletter API
```typescript
import { NewsletterAPI, type NewsletterConfig } from 'pliny/newsletter'
```
- Newsletter abstraction layer
- Multi-provider support
- Standardized interface

### Environment
Likely uses environment variables (not visible in this file):
```bash
# Expected (based on Pliny/Buttondown pattern)
BUTTONDOWN_API_KEY=...
NEXT_PUBLIC_BUTTONDOWN_USERNAME=...
```

## Dependencies
```
pliny/newsletter
@/data/siteMetadata
```

## Deployment Considerations

### Static Optimization
```typescript
export const dynamic = 'force-static'
```
- Route is pre-built at compile time
- May require revalidation if newsletter config changes
- Suitable for mostly-static newsletter operations

### Build-time Generation
- Handler logic is compiled
- Configuration is baked in at build time
- Runtime behavior depends on `siteMetadata` at build time

## Best Practices

### Type Safety
- Explicit `NewsletterConfig` type annotation
- Type-safe provider selection
- Comment explains type compatibility

### Separation of Concerns
- Configuration from `siteMetadata`
- Handler logic from Pliny
- Route just wires them together

### Minimal Implementation
- Single line for handler creation
- Export both methods with single statement
- Clean and maintainable

## Client Integration

### Frontend Usage Example
```typescript
// Client component subscription form
const handleSubscribe = async (email: string) => {
  const response = await fetch('/api/newsletter', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email })
  })

  if (response.ok) {
    // Success handling
  } else {
    // Error handling
  }
}
```

## Testing Considerations

### Unit Tests
- Mock `NewsletterAPI` from Pliny
- Test GET/POST exports
- Verify configuration passing

### Integration Tests
- Test actual Buttondown API integration
- Verify email subscription flow
- Test error responses

### Manual Testing
```bash
# Test GET
curl http://localhost:3000/api/newsletter

# Test POST
curl -X POST http://localhost:3000/api/newsletter \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com"}'
```

## Future Enhancements

### Provider Switching
```typescript
// Easy to switch providers
const newsletterConfig: NewsletterConfig = {
  provider: siteMetadata.newsletter.provider,  // Change in siteMetadata
  // 'convertkit' | 'mailchimp' | 'revue' | ...
}
```

### Additional Features
- Add double opt-in configuration
- Custom success/error pages
- Newsletter metadata (name, description)
- Subscriber count display
- Unsubscribe endpoint

### Validation
- Add request validation middleware
- Rate limiting for subscription endpoint
- CAPTCHA integration
- Email verification before subscription

## Security Considerations

### API Key Management
- Keys should be in environment variables
- Never committed to repository
- Server-side only (not exposed to client)

### Rate Limiting
- Consider adding rate limiting
- Prevent abuse of subscription endpoint
- Protect against spam subscriptions

### Input Validation
- Email format validation
- Sanitize user input
- Prevent injection attacks

## Related Files
- `@/data/siteMetadata` - Newsletter configuration
- `pliny/newsletter` - Newsletter API implementation
- Client components consuming this API

## Notes
- **Minimal implementation**: Route is just a thin wrapper around Pliny's NewsletterAPI
- **Provider-agnostic**: Easy to switch newsletter providers
- **Type-safe**: Provider type checked at compile time
- **Static optimization**: Pre-built for performance

# `@/lib/security` Module

## Layer 1: Module Overview

### Purpose
Security utilities for content sanitization, XSS prevention, and safe HTML rendering.

### Scope
- HTML sanitization (DOMPurify integration)
- XSS attack prevention
- Safe content rendering for user-generated content
- Comment content sanitization

## Layer 2: Architecture

### Files
- **sanitize.ts**: HTML sanitization utilities

### Core Functions

#### sanitizeHtml
```typescript
function sanitizeHtml(html: string, options?: SanitizeOptions): string
```
**Purpose**: Remove malicious HTML tags and attributes

**Default Behavior**:
- Removes `<script>` tags
- Removes `onclick`, `onerror` event handlers
- Removes `javascript:` URLs
- Allows safe formatting tags (b, i, em, strong, a, p, etc.)

**Usage**:
```typescript
import { sanitizeHtml } from '@/lib/security'

const userInput = '<script>alert("XSS")</script><p>Hello</p>'
const clean = sanitizeHtml(userInput)
// Returns: '<p>Hello</p>'
```

---

#### sanitizeComment
```typescript
function sanitizeComment(html: string): string
```
**Purpose**: Sanitize user comments with restricted tag set

**Allowed Tags**:
- Formatting: `b`, `i`, `em`, `strong`, `p`, `br`
- Links: `a` (with href sanitization)
- Lists: `ul`, `ol`, `li`
- Code: `code`, `pre`

**Blocked**:
- Scripts: `script`, `iframe`, `object`
- Styles: `style`, `link`
- Events: All `on*` attributes
- Dangerous attributes: `style`, `class`, `id`

---

#### sanitizeUserContent
```typescript
function sanitizeUserContent(content: string, options?: UserContentOptions): string
```
**Purpose**: Flexible sanitization for various user content types

**Options**:
```typescript
interface UserContentOptions {
  allowLinks?: boolean
  allowFormatting?: boolean
  allowCodeBlocks?: boolean
  maxTextLength?: number
}
```

## Layer 3: Implementation Details

### DOMPurify Configuration

```typescript
import DOMPurify from 'isomorphic-dompurify'

const defaultConfig = {
  ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'br', 'ul', 'ol', 'li', 'code', 'pre'],
  ALLOWED_ATTR: ['href', 'title', 'target'],
  ALLOW_DATA_ATTR: false,
  ALLOW_UNKNOWN_PROTOCOLS: false,
  SAFE_FOR_JQUERY: true,
  SANITIZE_DOM: true,
  // Strip dangerous tags completely (not escape)
  FORCE_BODY: false
}
```

### Link Sanitization

```typescript
function sanitizeLink(href: string): string | null {
  // Block javascript: protocol
  if (href.startsWith('javascript:')) return null
  if (href.startsWith('data:')) return null

  // Allow http, https, mailto
  if (/^https?:\/\//.test(href)) return href
  if (href.startsWith('mailto:')) return href

  return null
}
```

### XSS Attack Vectors Prevented

**Script Injection**:
```html
<script>alert(document.cookie)</script>
<!-- Removed entirely -->
```

**Event Handler Injection**:
```html
<img src=x onerror="alert('XSS')">
<!-- Becomes: <img src="x"> -->
```

**JavaScript Protocol**:
```html
<a href="javascript:alert('XSS')">Click</a>
<!-- Becomes: <a>Click</a> (href removed) -->
```

**iframe Injection**:
```html
<iframe src="evil.com"></iframe>
<!-- Removed entirely -->
```

### Performance Considerations

**DOMPurify Overhead**:
- ~10-50ms per sanitization (depending on content size)
- Use `sanitizeHtml` only for user-generated content
- Cache sanitized content when possible

**Best Practices**:
1. Sanitize on server AND client (defense in depth)
2. Use Content Security Policy (CSP) headers
3. Validate input on server
4. Escape before storing in database
5. Escape again on output (double encoding)

## Architecture Context

### Integration Points
- **Location**: `@/lib/security` → Security layer
- **Used By**: `@/components/post` (comments), `@/lib/api` (request/response)
- **Library**: `isomorphic-dompurify` (DOMPurify for SSR)

### Usage Examples

**Comment Sanitization**:
```typescript
import { sanitizeComment } from '@/lib/security'

async function createComment(content: string) {
  const sanitized = sanitizeComment(content)

  const response = await api.post('/comments', {
    content: sanitized
  })

  return response
}
```

**Render Sanitized HTML**:
```typescript
import { sanitizeHtml } from '@/lib/security'

function Comment({ content }) {
  const cleanHtml = sanitizeHtml(content)

  return (
    <div dangerouslySetInnerHTML={{ __html: cleanHtml }} />
  )
}
```

**Markdown + Sanitization**:
```typescript
import { marked } from 'marked'
import { sanitizeHtml } from '@/lib/security'

function Markdown({ content }) {
  const html = marked(content)  // Markdown → HTML
  const clean = sanitizeHtml(html)  // Sanitize

  return <div dangerouslySetInnerHTML={{ __html: clean }} />
}
```

## Security Best Practices

**Defense in Depth**:
1. **Input Validation**: Reject malicious input before processing
2. **Output Encoding**: Escape when rendering to HTML
3. **Content Sanitization**: Remove dangerous HTML tags
4. **CSP Headers**: Prevent inline script execution
5. **HttpOnly Cookies**: Protect session tokens

**Common Vulnerabilities Prevented**:
- Cross-Site Scripting (XSS)
- Script injection
- Event handler injection
- iframe injection
- JavaScript protocol links

**Configuration for Different Contexts**:

**Strict (Comments)**:
```typescript
const commentConfig = {
  ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'p', 'br'],
  ALLOWED_ATTR: []  // No attributes allowed
}
```

**Moderate (Blog Content)**:
```typescript
const blogConfig = {
  ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'br', 'ul', 'ol', 'li', 'code', 'pre', 'h1', 'h2', 'h3'],
  ALLOWED_ATTR: ['href', 'title', 'target']
}
```

**Permissive (Admin)**:
```typescript
const adminConfig = {
  ALLOWED_TAGS: ['*'],  // All tags (use with caution!)
  ALLOWED_ATTR: ['*'],  // All attributes
  ADD_ATTR: ['target']  // Add target="_blank" to links
}
```

## Testing

**XSS Test Cases**:
```typescript
const testCases = [
  '<script>alert("XSS")</script>',
  '<img src=x onerror="alert(1)">',
  '<a href="javascript:alert(1)">Click</a>',
  '<iframe src="evil.com"></iframe>',
  '<svg onload="alert(1)">',
  '"><script>alert(String.fromCharCode(88,83,83))</script>'
]

testCases.forEach(malicious => {
  const clean = sanitizeHtml(malicious)
  expect(clean).not.toContain('<script>')
  expect(clean).not.toContain('onerror')
  expect(clean).not.toContain('javascript:')
})
```

## Dependencies

- `isomorphic-dompurify`: DOMPurify (SSR-compatible)
- TypeScript: Type definitions

## Related Modules

- `@/components/post`: Comment sanitization
- `@/lib/api`: Request/response sanitization
- `@/app/admin`: Admin content validation

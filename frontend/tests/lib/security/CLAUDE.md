# Security Sanitization Tests

## Module Overview

Comprehensive test suite for security sanitization functions, covering XSS prevention, URL validation, and input sanitization.

## Architecture Layer

### Layer 3: Security Testing

```
tests/lib/security/
└── sanitize.test.tsx    # Sanitization function tests
```

**Scope**: Security function validation
**Hierarchy**: Integration tests → Security tests → Unit tests

## Test Categories

### sanitizeHtml

**Purpose**: Prevent XSS attacks through HTML content

**Test Scenarios**:

**Script Tag Removal**
```typescript
it('should remove script tags', () => {
  const dirty = '<script>alert("xss")</script><p>Safe content</p>'
  const clean = sanitizeHtml(dirty)

  expect(clean).not.toContain('<script>')
  expect(clean).toContain('<p>Safe content</p>')
})
```

**Dangerous Attribute Removal**
```typescript
it('should remove dangerous attributes', () => {
  const dirty = '<div onclick="alert(1)" onmouseover="alert(2)">Content</div>'
  const clean = sanitizeHtml(dirty)

  expect(clean).not.toContain('onclick')
  expect(clean).not.toContain('onmouseover')
})
```

**Safe HTML Preservation**
```typescript
it('should allow safe HTML tags', () => {
  const safe = '<h1>Title</h1><p>Paragraph with <strong>bold</strong></p>'
  const clean = sanitizeHtml(safe)

  expect(clean).toBe(safe)
})
```

**MDX Support**
```typescript
it('should handle MDX specific tags', () => {
  const mdx = '<math><mn>1</mn><mo>+</mo><mn>2</mn></math>'
  const clean = sanitizeHtml(mdx, { isMdx: true })

  expect(clean).toContain('<math>')
})
```

**JavaScript URL Blocking**
```typescript
it('should remove javascript: URLs', () => {
  const dirty = '<a href="javascript:alert(1)">Click</a>'
  const clean = sanitizeHtml(dirty)

  expect(clean).not.toContain('javascript:')
})
```

### sanitizeText

**Purpose**: Remove control characters and normalize text

**Test Scenarios**:

**Control Character Removal**
```typescript
it('should remove control characters', () => {
  const dirty = 'Text\x00with\x1Fcontrol\x7Fcharacters'
  const clean = sanitizeText(dirty)

  expect(clean).toBe('Textwithcontrolcharacters')
})
```

**Zero-Width Character Removal**
```typescript
it('should remove zero-width characters', () => {
  const dirty = 'Text\uFEFFwith\u200Bzero\u200Bwidth'
  const clean = sanitizeText(dirty)

  expect(clean).toBe('Textwithzerowidth')
})
```

**Whitespace Trimming**
```typescript
it('should trim whitespace', () => {
  const dirty = '  padded text  '
  const clean = sanitizeText(dirty)

  expect(clean).toBe('padded text')
})
```

### sanitizeUrl

**Purpose**: Validate and sanitize URLs

**Test Scenarios**:

**Safe Protocol Allowance**
```typescript
it('should allow safe protocols', () => {
  const safeUrls = [
    'https://example.com',
    'http://example.com',
    'mailto:test@example.com',
    'tel:+1234567890',
  ]

  safeUrls.forEach((url) => {
    expect(sanitizeUrl(url)).toBe(url)
  })
})
```

**Dangerous Protocol Blocking**
```typescript
it('should block dangerous protocols', () => {
  const dangerousUrls = [
    'javascript:alert(1)',
    'data:text/html,<script>alert(1)</script>',
    'vbscript:msgbox(1)',
  ]

  dangerousUrls.forEach((url) => {
    expect(sanitizeUrl(url)).toBe('#')
  })
})
```

**Domain Whitelist**
```typescript
it('should respect domain whitelist', () => {
  const allowedDomains = ['example.com', 'trusted.com']

  expect(sanitizeUrl('https://example.com/path', allowedDomains))
    .toBe('https://example.com/path')

  expect(sanitizeUrl('https://evil.com/path', allowedDomains))
    .toBe('#')
})
```

### sanitizeUserInput

**Purpose**: Sanitize user-generated text content

**Test Scenarios**:

**HTML Content Removal**
```typescript
it('should remove HTML-like content', () => {
  const input = 'Hello <script>alert(1)</script> world'
  const clean = sanitizeUserInput(input)

  expect(clean).not.toContain('<script>')
  expect(clean).toBe('Hello alert(1) world')
})
```

**Length Limiting**
```typescript
it('should respect max length', () => {
  const input = 'a'.repeat(100)
  const clean = sanitizeUserInput(input, 50)

  expect(clean.length).toBe(50)
})
```

### sanitizeClassNames

**Purpose**: Validate CSS class names

**Test Scenarios**:

**Valid Class Names**
```typescript
it('should allow valid class names', () => {
  const valid = 'class1 class-2 class_3'
  const clean = sanitizeClassNames(valid)

  expect(clean).toBe(valid)
})
```

**Invalid Character Removal**
```typescript
it('should remove invalid characters', () => {
  const invalid = 'class1 class@2 class#3'
  const clean = sanitizeClassNames(invalid)

  expect(clean).toBe('class1 class2 class3')
})
```

### sanitizeProps

**Purpose**: Sanitize React component props

**Test Scenarios**:

**Function Props Removal**
```typescript
it('should remove function props', () => {
  const props = {
    onClick: () => {},
    className: 'safe-class',
    'data-testid': 'test',
  }

  const clean = sanitizeProps(props)

  expect(clean.onClick).toBeUndefined()
  expect(clean.className).toBe('safe-class')
  expect(clean['data-testid']).toBe('test')
})
```

**Event Handler Removal**
```typescript
it('should remove event handlers', () => {
  const props = {
    onMouseOver: () => {},
    onSubmit: () => {},
    normalProp: 'value',
  }

  const clean = sanitizeProps(props)

  expect(clean.onMouseOver).toBeUndefined()
  expect(clean.onSubmit).toBeUndefined()
  expect(clean.normalProp).toBe('value')
})
```

**String Value Sanitization**
```typescript
it('should sanitize string values', () => {
  const props = {
    title: '<script>alert(1)</script>',
    count: 42,
  }

  const clean = sanitizeProps(props)

  expect(clean.title).not.toContain('<script>')
  expect(clean.count).toBe(42)
})
```

**Allowed Attributes Whitelist**
```typescript
it('should respect allowed attributes list', () => {
  const props = {
    className: 'class',
    id: 'id',
    title: 'title',
    custom: 'value',
  }

  const clean = sanitizeProps(props, ['className', 'id'])

  expect(clean.className).toBe('class')
  expect(clean.id).toBe('id')
  expect(clean.title).toBeUndefined()
  expect(clean.custom).toBeUndefined()
})
```

## Sanitization Functions Reference

### Function Signatures

```typescript
sanitizeHtml(html: string, options?: { isMdx?: boolean }): string
sanitizeText(text: string): string
sanitizeUrl(url: string, allowedDomains?: string[]): string
sanitizeUserInput(input: string, maxLength?: number): string
sanitizeClassNames(classNames: string): string
sanitizeProps(props: Record<string, any>, allowed?: string[]): Record<string, any>
```

### Usage Examples

```typescript
import {
  sanitizeHtml,
  sanitizeText,
  sanitizeUrl,
  sanitizeUserInput,
  sanitizeClassNames,
  sanitizeProps,
} from '@/lib/security/sanitize'

// Sanitize user-generated HTML
const safeHtml = sanitizeHtml(userComment, { isMdx: true })

// Clean text input
const cleanText = sanitizeText(rawInput)

// Validate URLs
const safeUrl = sanitizeUrl(userUrl, ['example.com', 'trusted.com'])

// Sanitize user input
const safeInput = sanitizeUserInput(userInput, 1000)

// Validate class names
const safeClasses = sanitizeClassNames(userClasses)

// Sanitize component props
const safeProps = sanitizeProps(userProps, ['className', 'id'])
```

## Extension Guide

### Adding New Sanitization Tests

1. **Test new attack vectors**:
```typescript
describe('sanitizeHtml', () => {
  it('should prevent SVG XSS', () => {
    const svgXss = '<svg onload="alert(1)">'
    const clean = sanitizeHtml(svgXss)
    expect(clean).not.toContain('onload')
  })
})
```

2. **Test edge cases**:
- Unicode attacks
- CSS injection
- Protocol-relative URLs
- Data exfiltration attempts

### Custom Sanitizers

```typescript
describe('sanitizeCustomFormat', () => {
  it('should validate custom format', () => {
    const input = 'custom:data'
    const clean = sanitizeCustomFormat(input)
    expect(clean).toMatch(/^[a-z]+:[a-z]+$/)
  })
})
```

## Dependencies

**Testing Framework**
- `vitest` - Test runner
- `@testing-library/react` - React testing utilities

**Implementation**
- `@/lib/security/sanitize` - Sanitization functions

## Related Modules

- `/src/lib/security/sanitize.ts` - Implementation
- `/src/lib/security/index.ts` - Security exports
- `/src/components/**/*` - Usage in components

## Best Practices

- **Defense in depth**: Multiple sanitization layers
- **Whitelist over blacklist**: Allow only known safe content
- **Context awareness**: Different rules for different contexts
- **Zero trust**: Sanitize all user input
- **Keep updated**: Security libraries should be current
- **Test attack vectors**: Simulate real XSS attempts

## Running Tests

```bash
# Security tests
npm test -- tests/lib/security

# Watch mode
npm test -- --watch tests/lib/security

# Coverage
npm test -- --coverage tests/lib/security
```

## Security Considerations

- **XSS Prevention**: All HTML must be sanitized
- **CSP Compliance**: Sanitization should work with Content Security Policy
- **No unsafe methods**: Avoid `dangerouslySetInnerHTML` without sanitization
- **URL validation**: Prevent javascript: and data: URLs
- **Event handler blocking**: Remove all on* attributes
- **Input validation**: Validate on both client and server

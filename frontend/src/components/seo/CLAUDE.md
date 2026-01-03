# `@/components/seo` Module

## Layer 1: Module Overview

### Purpose
Search engine optimization (SEO) components for structured data and schema.org markup.

### Scope
- JSON-LD structured data generation
- Schema.org vocabulary support
- Multiple data types (Article, Organization, Person, WebSite, Breadcrumb)
- Specialized components for common use cases

## Layer 2: Component Architecture

### Component: `JsonLd`

**Responsibilities**:
- Render JSON-LD `<script>` tags
- Serialize data to JSON
- Inject into `<head>` via Next.js

**Props Interface**:
```typescript
interface JsonLdProps {
  data: Record<string, unknown>
}
```

**Usage**:
```tsx
<JsonLd data={{ '@context': 'https://schema.org', ... }} />
```

**Output**:
```html
<script type="application/ld+json">
  {"@context":"https://schema.org",...}
</script>
```

---

### Component: `StructuredData`

**Responsibilities**:
- Generate type-specific schema.org markup
- Support multiple structured data types
- Provide specialized helper components

**Supported Types**:
```typescript
type SchemaType =
  | 'Article'          // Blog articles
  | 'BlogPosting'      // Blog posts (enhanced Article)
  | 'Organization'     // Companies/organizations
  | 'Person'           // Individual profiles
  | 'WebSite'          // Site-level metadata
  | 'BreadcrumbList'   // Navigation breadcrumbs
```

**Props Interface**:
```typescript
interface StructuredDataProps {
  type: SchemaType
  data: Record<string, any>
}
```

**Generated Schema Structure**:

**BlogPosting**:
```typescript
{
  '@type': 'BlogPosting',
  mainEntityOfPage: { '@type': 'WebPage', '@id': url },
  headline: title,
  description: description,
  image: [url],
  datePublished: date,
  dateModified: date,
  author: { '@type': 'Person', name, url },
  publisher: {
    '@type': 'Organization',
    name: "Zhengbi Yong's Blog",
    logo: { '@type': 'ImageObject', url }
  }
}
```

**WebSite**:
```typescript
{
  '@type': 'WebSite',
  name,
  url,
  description,
  potentialAction: {
    '@type': 'SearchAction',
    target: `${url}/search?q={search_term_string}`,
    'query-input': 'required name=search_term_string'
  }
}
```

**BreadcrumbList**:
```typescript
{
  '@type': 'BreadcrumbList',
  itemListElement: items.map((item, index) => ({
    '@type': 'ListItem',
    position: index + 1,
    name: item.name,
    item: item.url
  }))
}
```

---

### Helper Components

#### `ArticleStructuredData`

Specialized component for blog posts:

```typescript
interface ArticleProps {
  title: string
  description: string
  url: string
  image?: string
  datePublished: string
  dateModified?: string
  author: string
  authorUrl?: string
  tags?: string[]
}
```

**Usage**:
```tsx
<ArticleStructuredData
  title="My Blog Post"
  description="An amazing post"
  url="https://example.com/blog/my-post"
  datePublished="2025-01-03"
  author="John Doe"
  tags={['react', 'nextjs']}
/>
```

#### `BreadcrumbStructuredData`

```typescript
interface BreadcrumbProps {
  items: Array<{ name: string; url: string }>
}
```

**Usage**:
```tsx
<BreadcrumbStructuredData
  items={[
    { name: 'Home', url: 'https://example.com' },
    { name: 'Blog', url: 'https://example.com/blog' },
    { name: 'Post', url: 'https://example.com/blog/post' }
  ]}
/>
```

#### `WebSiteStructuredData`

```typescript
interface WebSiteProps {
  name: string
  url: string
  description: string
}
```

## Layer 3: Implementation Details

### Rendering Strategy

Components use `dangerouslySetInnerHTML` to inject JSON-LD:

```tsx
<script
  type="application/ld+json"
  dangerouslySetInnerHTML={{
    __html: JSON.stringify(structuredData, null, 2)
  }}
/>
```

**Security Note**: Data is generated internally, not from user input, so XSS risk is minimal.

### Integration with Next.js

In Next.js App Router, these components should be placed in page metadata:

```tsx
// app/blog/[slug]/page.tsx
import { ArticleStructuredData } from '@/components/seo'

export default function BlogPost({ post }) {
  return (
    <>
      <ArticleStructuredData {...post} />
      <article>{post.content}</article>
    </>
  )
}
```

### Schema.org Validation

Use [Google's Rich Results Test](https://search.google.com/test/rich-results) to validate:
1. Navigate to page in browser
2. View page source
3. Copy JSON-LD script content
4. Paste into validator tool

### Best Practices

**Do**:
- Include all required fields for each schema type
- Use absolute URLs for all links
- Provide high-quality images (min 1200x630px)
- Include `dateModified` when content updates
- Add author information with URLs

**Don't**:
- Include sensitive personal data
- Use placeholder/default values
- Omit required fields
- Use relative URLs

## Architecture Context

### Integration Points
- **Location**: `@/components/seo` → SEO metadata
- **Used In**: Page components, blog posts, static pages
- **Standards**: schema.org vocabulary
- **Validation**: Google Rich Results Test

### Design Patterns
- **Factory Pattern**: `generateStructuredData()` creates type-specific schemas
- **Specialization**: Helper components for common use cases
- **Composition**: Multiple structured data components can coexist

### Related Modules
- `@/components/sections/PageHeader`: May include breadcrumb structured data
- `@/app`: Page components that render structured data
- Next.js Metadata API: Alternative approach for basic metadata

## SEO Benefits

**Structured Data Helps Search Engines**:
1. **Understand Content**: Context about page type and content
2. **Rich Snippets**: Enhanced search results (stars, images, author)
3. **Knowledge Graph**: Entity recognition and relationships
4. **Search Actions**: Site search functionality in results

**Example Rich Result**:
```
┌─────────────────────────────────────┐
│ My Amazing Blog Post                │
│ ⭐⭐⭐⭐⭐ (5 reviews)               │
│ By John Doe | January 3, 2025       │
│ [Thumbnail Image]                   │
│ An amazing post about React...      │
│ zhengbi-yong.github.io › blog      │
└─────────────────────────────────────┘
```

## Dependencies

- `next/head`: Next.js head component (legacy)
- React: Component rendering
- schema.org: Vocabulary standard (external)

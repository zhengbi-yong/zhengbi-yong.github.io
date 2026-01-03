# Payload Collections Module

## Module Overview

Payload CMS collection definitions for content management (Authors, Posts, Tags, Categories, Media, Users).

## Architecture Layer

### Layer 3: Data Model Definitions

```
payload/
└── collections/
    ├── Authors.ts       # Author profiles
    ├── Posts.ts         # Blog posts
    ├── Tags.ts          # Post tags
    ├── Categories.ts    # Post categories
    ├── Media.ts         # Media library
    └── Users.ts         # User accounts
```

**Scope**: Content schema definitions
**Hierarchy**: Payload Config → Collections → Fields → Hooks

## Module Structure

### Collection Files

Each collection file exports a `CollectionConfig` object:

**Authors.ts**
- Profile: name, avatar, occupation, company
- Social: twitter, bluesky, linkedin, github
- Bio: rich text description
- Custom layout field

**Posts.ts**
- Content: title, slug, description, content (rich text)
- Meta: date, lastmod, draft status
- Media: images array (URL + alt)
- Relations: authors (many), tags (many), categories (many)
- Display: layout, showTOC, math, canonicalUrl
- Auto-fields: readingTime (JSON)

**Tags.ts** / **Categories.ts**
- Basic categorization
- Relationship with posts

**Media.ts** / **Users.ts**
- Standard Payload collections

## Implementation Patterns

### Collection Schema

```typescript
import { CollectionConfig } from 'payload'

export const CollectionName: CollectionConfig = {
  slug: 'collection-name',
  admin: {
    useAsTitle: 'title-field',
    preview: (doc) => `${URL}/${doc.slug}`,
  },
  access: {
    read: () => true,
    create: () => true,
    update: () => true,
    delete: () => true,
  },
  fields: [
    // Field definitions
  ],
  timestamps: true,
}
```

### Field Types

**Text Fields**
```typescript
{
  name: 'title',
  type: 'text',
  required: true,
}
```

**Rich Text**
```typescript
{
  name: 'content',
  type: 'richText',
  required: true,
}
```

**Relationships**
```typescript
{
  name: 'authors',
  type: 'relationship',
  relationTo: 'authors',
  hasMany: true,
}
```

**Arrays**
```typescript
{
  name: 'images',
  type: 'array',
  fields: [
    { name: 'url', type: 'text', required: true },
    { name: 'alt', type: 'text' },
  ],
}
```

### Hooks Pattern

**Auto-generate Slugs** (Posts.ts)
```typescript
{
  name: 'slug',
  type: 'text',
  unique: true,
  index: true,
  hooks: {
    beforeValidate: [
      ({ value, data }) => {
        if (value) return value
        return slug(data.title || '')
      },
    ],
  },
}
```

## Key Features

### Posts Collection

**Content Management**
- Rich text editor for post body
- Draft status for unpublished content
- SEO fields (slug, canonicalUrl, description)

**Organization**
- Multi-author support
- Tag and category relationships
- Custom layout selection
- Table of contents toggle

**Special Features**
- Math formula support
- Bibliography field
- Reading time auto-calculation
- Image gallery with alt text

### Authors Collection

**Professional Info**
- Occupation and company
- Social media links (Twitter, Bluesky, LinkedIn, GitHub)
- Rich text bio

**Display Options**
- Avatar URL
- Custom layout per author

## Integration Points

### Payload Config
```typescript
// In payload.config.ts
import { Posts } from './collections/Posts'
import { Authors } from './collections/Authors'

export default buildConfig({
  collections: [Posts, Authors, /* ... */],
})
```

### API Endpoints
- REST API: `/api/collection-name`
- GraphQL: Via Payload GraphQL plugin
- Admin UI: Auto-generated from schema

### Frontend Usage
```typescript
// Fetch posts
const response = await fetch(`${API_URL}/api/posts?where[draft][equals]=false`)
const posts = await response.json()

// Access fields
posts.docs[0].title
posts.docs[0].authors[0].name
```

## Extension Guide

### Adding New Collection

1. **Create collection file**:
```typescript
// NewCollection.ts
export const NewCollection: CollectionConfig = {
  slug: 'new-collection',
  fields: [/* ... */],
}
```

2. **Register in config**:
```typescript
import { NewCollection } from './collections/NewCollection'

collections: [/* ... */, NewCollection]
```

### Adding Fields

**Simple field**:
```typescript
{
  name: 'fieldName',
  type: 'text',
  required: false,
}
```

**Relationship field**:
```typescript
{
  name: 'relatedPosts',
  type: 'relationship',
  relationTo: 'posts',
  hasMany: true,
}
```

### Access Control

**Current**: All operations permitted for all users
**Production**: Implement role-based access
```typescript
access: {
  read: () => true,
  create: ({ req }) => req.user?.role === 'admin',
  update: ({ req }) => req.user?.role === 'admin',
  delete: ({ req }) => req.user?.role === 'admin',
}
```

## Dependencies

**External**
- `payload`: CMS framework

**Internal**
- None (schema definitions)

## Related Modules

- `/src/app/blog/[slug]` - Post display
- `/src/app/admin` - Admin UI
- `/src/lib/api/payload` - API client

## Best Practices

- **Field naming**: camelCase for field names
- **Validation**: Use `required` for essential fields
- **Relationships**: Prefer `hasMany` for tag/category-style relations
- **Slugs**: Always unique and indexed
- **Descriptions**: Add admin descriptions for UX
- **Hooks**: Use for auto-generation (slugs, timestamps)
- **Draft status**: Implement content workflow with draft field

## Testing Considerations

- Validate collection schema in Payload admin
- Test API queries and mutations
- Verify relationships and joins
- Check access control rules
- Test rich text rendering

## Migration Notes

- Slug generation: Uses Payload's built-in `slug()` helper
- Legacy `category` field: Deprecated, use `categories` relationship
- Auto-calculated fields: `readingTime` populated via hooks

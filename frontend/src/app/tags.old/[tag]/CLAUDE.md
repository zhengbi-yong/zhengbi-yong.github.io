# Tag Dynamic Route Module

## Overview

This module implements a dynamic route for displaying blog posts filtered by tag. Each route corresponds to a tag name and renders a paginated list of posts with that tag.

**Purpose**: Display blog posts filtered by specific tag
**Pattern**: Dynamic Route with Static Generation (SSG) + Pagination
**Layer**: Layer 2 - Page Component

## Module Structure

```
frontend/src/app/tags/[tag]/
└── page.tsx              # Dynamic page component with pagination
```

## Architecture

### Data Flow

```
User visits /tag/react
    ↓
generateStaticParams() provides all tag names
    ↓
TagPage component receives params
    ↓
decodeURI() decodes tag from URL encoding
    ↓
Filter allBlogs by tag slug
    ↓
Sort posts by date
    ↓
Calculate pagination (50 posts per page)
    ↓
Render ListLayout with filtered posts
```

### Components

**page.tsx** (60 lines)
- **generateMetadata()**: Generates SEO metadata for tag pages
- **generateStaticParams()**: Generates static paths for all tags
- **TagPage()**: Page component that filters and displays tagged posts
- **Data Source**: `allBlogs` (Contentlayer), `tagData` (pre-computed tags)
- **Pagination**: 50 posts per page (configurable via `POSTS_PER_PAGE`)

## Route Parameters

### Dynamic Parameter: `[tag]`

- **Type**: `string` (tag slug)
- **Source**: URL path segment
- **Encoding**: URL encoding (decodeURI applied)
- **Example**: `/tag/web-development` → `params.tag = "web-development"`

## Data Flow Details

### 1. Static Params Generation

```typescript
export const generateStaticParams = async () => {
  const tagCounts = tagData as Record<string, number>
  const tagKeys = Object.keys(tagCounts)
  return tagKeys.map((tag) => ({
    tag: encodeURI(tag),
  }))
}
```

**Behavior**:
- Reads `@/app/tag-data.json` (pre-computed tag counts)
- Generates static HTML for each tag
- Encodes tags for URL safety (spaces → %20, etc.)
- Pre-renders all tag pages at build time

**Data Source**:
```json
// tag-data.json
{
  "react": 15,
  "typescript": 8,
  "web development": 3
}
```

### 2. Tag Filtering Logic

```typescript
const tag = decodeURI(params.tag)
const filteredPosts = allCoreContent(
  sortPosts(
    allBlogs.filter((post) =>
      post.tags &&
      post.tags.map((t) => slug(t)).includes(tag)
    )
  )
)
```

**Process**:
1. Decode tag from URL encoding
2. Filter posts where `post.tags` includes the tag
3. Match using `github-slugger` slug() for consistency
4. Sort posts by date (sortPosts)
5. Extract core content (allCoreContent)

**Slug Matching**:
- `post.tags`: Human-readable tag names (`["Web Development"]`)
- `slug(tag)`: URL-safe slugs (`"web-development"`)
- Ensures `/tag/web-development` matches posts tagged "Web Development"

### 3. Pagination

```typescript
const POSTS_PER_PAGE = 50
const totalPages = Math.ceil(filteredPosts.length / POSTS_PER_PAGE)
const initialDisplayPosts = filteredPosts.slice(0, POSTS_PER_PAGE)
const pagination = {
  currentPage: 1,
  totalPages: totalPages,
}
```

**Behavior**:
- Initial page shows first 50 posts
- Remaining posts loaded via client-side pagination
- `ListLayout` component handles pagination UI

## Component API

### ListLayout

```typescript
interface ListLayoutProps {
  posts: CoreContent[]           // All filtered posts
  initialDisplayPosts: CoreContent[]  // First page posts
  pagination: {
    currentPage: number
    totalPages: number
  }
  title: string                  // Display title (capitalized)
}
```

Location: `@/components/layouts/ListLayoutWithTags`

**Features**:
- Client-side pagination
- Search functionality
- Tag filtering UI
- Post cards with metadata

## SEO & Metadata

### generateMetadata()

```typescript
export async function generateMetadata(props: {
  params: Promise<{ tag: string }>
}): Promise<Metadata> {
  const params = await props.params
  const tag = decodeURI(params.tag)
  return genPageMetadata({
    title: tag,
    description: `${siteMetadata.title} ${tag} tagged content`,
    alternates: {
      canonical: './',
      types: {
        'application/rss+xml': `${siteMetadata.siteUrl}/tags/${tag}/feed.xml`,
      },
    },
  })
}
```

**Metadata Generated**:
- **Title**: Tag name (e.g., "React")
- **Description**: Site title + "tagged content"
- **Canonical URL**: Current page
- **RSS Feed**: Tag-specific RSS feed URL

**Example Output**:
```html
<title>React | Your Site</title>
<meta name="description" content="Your Site React tagged content" />
<link rel="canonical" href="https://example.com/tags/react" />
<link rel="alternate" type="application/rss+xml" href="https://example.com/tags/react/feed.xml" />
```

## Data Models

### CoreContent (inferred)

```typescript
interface CoreContent {
  slug: string
  title: string
  date: string
  tags?: string[]
  summary?: string
  // ... other post fields
}
```

Location: `pliny/utils/contentlayer`

### Blog (from Contentlayer)

```typescript
interface Blog {
  slug: string
  title: string
  date: Date
  tags?: string[]
  content: string
  // ... MDX frontmatter fields
}
```

## Dependencies

### Internal
- `@/app/tag-data.json` - Pre-computed tag counts
- `@/data/siteMetadata` - Site configuration
- `@/components/layouts/ListLayoutWithTags` - List layout component
- `@/app/seo` - Metadata generation utilities

### External
- `contentlayer/generated` - Blog post data (`allBlogs`)
- `pliny/utils/contentlayer` - Content utilities (`allCoreContent`, `sortPosts`)
- `github-slugger` - Slug generation (`slug()`)
- `next` - Next.js utilities

## Usage Examples

### Accessing Tag Pages

```
User navigates to: /tag/react
    ↓
Next.js serves pre-rendered HTML
    ↓
TagPage filters allBlogs for "react" tag
    ↓
ListLayout displays 50 posts with React tag
    ↓
User can paginate, search, filter further
```

### Title Capitalization

```typescript
const title = tag[0].toUpperCase() + tag.split(' ').join('-').slice(1)
```

**Transformations**:
- `react` → `"React"`
- `web-development` → `"Web-development"`
- `machine learning` → `"Machine-learning"` (after slug)

**Note**: Hyphens preserved in multi-word tags

### Adding New Tags

Tags are auto-generated from blog post frontmatter:

```markdown
---
title: "Understanding React Hooks"
tags: ["react", "hooks", "frontend"]
---
```

Build process automatically:
1. Extracts tags from all posts
2. Generates slugs using `github-slugger`
3. Creates `tag-data.json` with counts
4. Generates static pages for each tag

## Error Handling

### Empty Tag Pages

No special handling - if a tag has no posts:
- `filteredPosts` = `[]`
- `ListLayout` shows "No posts found" message
- Page still renders successfully

### Invalid Tags

Handled by Next.js automatically:
- Tag not in `generateStaticParams()` → 404 page
- Graceful fallback to notFound page

## Constraints & Limitations

- **Static Tags**: Tags must exist at build time (from blog posts)
- **No Dynamic Tags**: Cannot add tags without rebuild
- **Pagination Limit**: 50 posts per page (hardcoded)
- **Client-side Pagination**: Additional posts loaded via JS
- **Title Formatting**: Simple capitalization (may not handle all cases)
- **No Tag Editing**: Tags defined in post frontmatter only

## Integration Points

1. **Contentlayer**: Blog post data source (allBlogs)
2. **Tag Data Generation**: Build step creates `tag-data.json`
3. **List Layout Component**: Renders post list with pagination
4. **SEO Module**: Generates metadata and RSS feeds
5. **Slug Generation**: `github-slugger` for consistent URLs

## Testing Considerations

- Test with single-word tags (e.g., "react")
- Test with multi-word tags (e.g., "web development")
- Test with special characters in tags
- Test empty tag pages (no posts)
- Test pagination (pages with 50+ posts)
- Test SEO metadata (title, description, RSS)
- Verify static generation (all tags present in build)
- Test URL encoding/decoding

## Future Enhancements

### Multi-Page Support
Currently only shows first page. Add true pagination routes:

```typescript
// /tags/[tag]/page/[page]
export default async function TagPageWithPagination({ params }) {
  const page = parseInt((await params).page)
  const start = (page - 1) * POSTS_PER_PAGE
  const end = start + POSTS_PER_PAGE
  // ...
}
```

### Tag Features
- Add tag descriptions
- Show related tags
- Tag search functionality
- Tag merging/renaming
- Tag analytics (most popular tags)
- Tag subscriptions

### SEO Improvements
- Add structured data (BreadcrumbList)
- Add tag descriptions to metadata
- Add tag-specific Open Graph images
- Add canonical URL with pagination

### Performance
- Implement incremental static regeneration (ISR)
- Add tag page caching
- Optimize large tag pages with virtual scrolling

## Related Modules

- `@/app/tags/` - Parent tags section
- `@/app/tag-data.json` - Tag data source
- `@/components/layouts/ListLayoutWithTags` - List layout
- `@/app/blog/[slug]` - Individual blog posts
- `@/app/` - Blog index page

## Maintenance Notes

- **Tag Consistency**: Use `github-slugger` everywhere for slug generation
- **Build Step**: Ensure `tag-data.json` is regenerated before build
- **Pagination**: Update `POSTS_PER_PAGE` if changing pagination logic
- **Title Case**: Consider proper title case library for better formatting
- **URL Stability**: Tag slugs should never change (breaking links)
- **Type Safety**: Keep CoreContent interface in sync with Contentlayer schema

## Performance Considerations

- **Build Time**: Each tag page is pre-rendered at build time
- **Large Tag Sets**: Many tags (100+) may slow down builds
- **Filtering Cost**: O(n) filter over all blog posts per tag
- **Memory**: All blog posts loaded into memory during build

**Optimization Tips**:
- Use ISR for frequent tag updates
- Cache filtered posts in build step
- Consider pagination for tag counts >100

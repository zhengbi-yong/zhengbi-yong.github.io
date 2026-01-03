# Data Processing Scripts Directory

## Purpose
Build-time data generation, content processing, and static asset creation.

## Directory Structure

```
scripts/data/
├── generate-search.mjs          # Search index generation
├── generate-stories.mjs         # Storybook/social image generation
├── postbuild.mjs                # Post-build processing
├── rss.mjs                      # RSS feed generation
└── sync/                        # Data synchronization
    └── sync_lin.sh              # Linux sync utilities
```

## Data Generation Scripts

### 1. Search Index Generation
**File**: `generate-search.mjs`

**Purpose**: Generate search index from Contentlayer blog data

**Output**: Static search index file

**Process**:
1. Load Contentlayer generated data from `.contentlayer/generated/Blog/*.json`
2. Extract metadata (title, slug, summary, tags, category)
3. Create search documents with structured fields
4. Include static pages (about, projects, music)
5. Write index file for client-side search

**Document Structure**:
```javascript
{
  id: 'post-slug',
  title: 'Post Title',
  url: '/blog/post-slug',
  content: 'Post summary...',
  tags: ['tag1', 'tag2'],
  category: 'category-name',
  date: '2026-01-03',
  type: 'post'  // 'post' or 'page'
}
```

**Usage**:
```bash
node scripts/data/generate-search.mjs
```

### 2. Social Image Generation
**File**: `generate-stories.mjs`

**Purpose**: Generate social sharing images (OGP, Twitter cards)

**Features**:
- Auto-generate images for each blog post
- Include title, author, date
- Consistent branding and styling
- Output to `public/images/og/`

**Usage**:
```bash
node scripts/data/generate-stories.mjs
```

### 3. Post-build Processing
**File**: `postbuild.mjs`

**Purpose**: Post-build data processing and optimization

**Tasks**:
- Generate sitemap.xml
- Create robots.txt
- Optimize search index
- Process static assets

**Trigger**: Automatically runs after `pnpm build`

**Usage**:
```bash
# Manual execution
node scripts/data/postbuild.mjs

# Automatic (via package.json)
pnpm build  # triggers postbuild script
```

### 4. RSS Feed Generation
**File**: `rss.mjs`

**Purpose**: Generate RSS/Atom feeds for blog content

**Output**: `public/rss.xml` or `public/feed.xml`

**Feed Schema**:
```xml
<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>Blog Title</title>
    <link>https://example.com</link>
    <description>Blog description</description>
    <item>
      <title>Post Title</title>
      <link>https://example.com/blog/post-slug</link>
      <description>Post summary...</description>
      <pubDate>Mon, 03 Jan 2026 00:00:00 GMT</pubDate>
      <author>author@example.com</author>
      <guid>https://example.com/blog/post-slug</guid>
    </item>
  </channel>
</rss>
```

**Usage**:
```bash
node scripts/data/rss.mjs
```

## Synchronization Scripts

### Linux Sync Utilities
**File**: `sync/sync_lin.sh`

**Purpose**: Synchronize data between environments on Linux

**Use Cases**:
- Development to production sync
- Backup to remote storage
- Multi-environment data consistency

**Usage**:
```bash
chmod +x scripts/data/sync/sync_lin.sh
./scripts/data/sync/sync_lin.sh
```

## Integration with Build Process

### package.json Scripts
```json
{
  "scripts": {
    "build": "next build",
    "postbuild": "node scripts/data/postbuild.mjs",
    "generate:search": "node scripts/data/generate-search.mjs",
    "generate:rss": "node scripts/data/rss.mjs",
    "generate:images": "node scripts/data/generate-stories.mjs"
  }
}
```

### Build Flow
```
pnpm build
  ↓
1. Next.js compilation
  ↓
2. Contentlayer processes MDX
  ↓
3. postbuild.mjs executes
  ↓
4. Generate search index
  ↓
5. Generate RSS feeds
  ↓
6. Generate sitemap
  ↓
7. Optimize assets
```

## Data Sources

### Input Data
- **Blog Posts**: `frontend/data/blog/*.mdx`
- **Contentlayer Output**: `.contentlayer/generated/`
- **Site Metadata**: `frontend/data/siteMetadata.ts`
- **Static Pages**: `frontend/app/**/page.tsx`

### Output Data
- **Search Index**: `public/search.json`
- **RSS Feed**: `public/rss.xml`
- **Sitemap**: `public/sitemap.xml`
- **Social Images**: `public/images/og/*.png`

## Configuration

### Environment Variables
```bash
# Search index generation
NEXT_PUBLIC_SEARCH_ENABLED=true

# RSS feed settings
NEXT_PUBLIC_RSS_ENABLED=true
RSS_FEED_COUNT=50  # Number of items in feed

# Image generation
NEXT_PUBLIC_OG_IMAGE_WIDTH=1200
NEXT_PUBLIC_OG_IMAGE_HEIGHT=630
```

### Customization
Each script can be customized by modifying:
- Output paths
- Data filters (e.g., exclude drafts)
- Template styles (for images)
- Feed metadata

## Performance Considerations

### Execution Time
- **Search generation**: ~2-5 seconds (100 posts)
- **RSS generation**: ~1-2 seconds
- **Image generation**: ~30-60 seconds (100 posts)

### Optimization
- **Incremental updates**: Only process changed files
- **Caching**: Cache Contentlayer data
- **Parallel processing**: Use worker threads for images
- **Build-time only**: No runtime overhead

## Maintenance

### Adding New Data Processing
1. Create new script in `scripts/data/`
2. Add npm script shortcut if frequently used
3. Integrate with `postbuild.mjs` if needed
4. Update this CLAUDE.md

### Updating Existing Scripts
1. Test changes locally
2. Verify output files
3. Check build performance
4. Update documentation

## Related Modules
- `contentlayer.config.js` - Content processing configuration
- `frontend/data/` - Source data files
- `frontend/data/blog/` - MDX blog posts
- `next.config.js` - Build configuration
- `scripts/build/` - Build utilities

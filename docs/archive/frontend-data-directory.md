# Frontend Data Directory

## Purpose
Static data, content files, and metadata for the blog frontend.

## Directory Structure

```
frontend/data/
├── authors/              # Author profiles and metadata
├── blog/                 # MDX blog post files (118+ articles)
├── headerNavLinks.ts     # Navigation menu configuration
├── musicData.ts          # Music section data
├── projectsData.ts       # Projects portfolio data
├── siteMetadata.data.mjs # Site metadata (legacy module)
├── siteMetadata.ts       # Site metadata (TypeScript)
├── socialData.ts         # Social media links
├── works.ts              # Works/cv data
├── references-data.bib   # Bibliography references
└── logo.svg              # Site logo asset
```

## Content Types

### 1. Blog Content (MDX)
**Location**: `blog/`

**Structure**:
- Category-based subdirectories (e.g., `chemistry/`, `cs/`)
- MDX files with frontmatter
- Asset files (images, diagrams)

**Frontmatter Schema**:
```yaml
---
title: Post Title
slug: unique-slug
date: YYYY-MM-DD
lastmod: YYYY-MM-DD
draft: false
summary: Brief description
tags: [tag1, tag2]
categories: [category1]
authors: [author-id]
layout: article
showTOC: true
math: false
bibliography: references-data.bib
---
```

**Statistics**:
- Total posts: 118+
- Categories: Chemistry, CS, etc.
- Formats: .mdx (Markdown + JSX)

### 2. Site Metadata
**Files**: `siteMetadata.ts`, `siteMetadata.data.mjs`

**Schema**:
```typescript
interface SiteMetadata {
  // Basic Info
  title: string                  // Site title
  author: string                 // Author name
  headerTitle: string | ReactNode
  description: string            // SEO description
  language: string               // 'en-US'
  locale: string                 // 'en'

  // Theme
  theme: 'system' | 'dark' | 'light'
  stickyNav: boolean
  defaultShowTOC?: boolean

  // URLs
  siteUrl: string                // Base URL
  siteRepo: string               // GitHub repository
  siteLogo: string               // Logo path
  socialBanner: string           // Social share image

  // Contact
  email: string
  github?: string
  twitter?: string
  mastodon?: string
  // ... other social platforms

  // Analytics
  analytics: {
    umamiAnalytics?: { umamiWebsiteId, src }
    plausibleAnalytics?: { plausibleDataDomain, src }
    googleAnalytics?: { googleAnalyticsId }
    // ... other providers
  }

  // Features
  newsletter: {
    provider: 'mailchimp' | 'buttondown' | ...
  }
  comments: CommentsConfig
  search: {
    provider: 'kbar' | 'algolia'
  }
}
```

**Type Safety**:
- Runtime validation: `isValidSiteMetadata()`
- TypeScript interface: `SiteMetadata`
- Import pattern: `siteMetadataData` → typed `siteMetadata`

### 3. Navigation Data
**File**: `headerNavLinks.ts`

**Purpose**: Main navigation menu structure

**Schema**:
```typescript
interface NavLink {
  title: string
  href: string
  items?: NavLink[]  // For dropdowns
}
```

### 4. Social Media Data
**File**: `socialData.ts`

**Purpose**: Social media platform links

**Platforms Supported**:
- GitHub, Twitter/X, Mastodon
- LinkedIn, YouTube, Facebook
- Instagram, Threads, Bluesky
- Xiaohongshu (Little Red Book), Medium

### 5. Projects & Works
**Files**: `projectsData.ts`, `works.ts`

**Purpose**: Portfolio and CV data

**Schema**:
```typescript
interface Project {
  title: string
  description: string
  technologies: string[]
  links?: { github?: string; demo?: string }
}
```

### 6. Music Data
**File**: `musicData.ts`

**Purpose**: Music section content

**Usage**: Dynamic music pages at `/music/[name]`

### 7. Bibliography
**File**: `references-data.bib`

**Format**: BibTeX
**Usage**: Academic citation support in MDX posts

## Data Flow

### Build-time Processing
1. **Contentlayer** reads `blog/*.mdx`
2. Parses frontmatter and MDX content
3. Generates JSON data in `.contentlayer/`
4. Next.js uses generated data for static pages

### Runtime Access
```typescript
// Site metadata
import siteMetadata from '@/data/siteMetadata'

// Blog posts
import { allBlogs } from 'contentlayer/generated'

// Navigation
import headerNavLinks from '@/data/headerNavLinks'
```

## Key Features

### MDX Capabilities
- **Markdown**: Standard syntax
- **JSX Components**: React components in content
- **Frontmatter**: Metadata and configuration
- **Math**: KaTeX rendering (if `math: true`)
- **Chemistry**: mhchem chemical equations
- **Code Highlighting**: Prism.js or Shiki
- **TOC**: Auto-generated table of contents
- **Bibliography**: BibTeX citation support

### Content Organization
- **Categories**: Hierarchical structure
- **Tags**: Multi-label classification
- **Authors**: Multi-author support
- **Drafts**: `draft: true` hides from production
- **Dates**: `date` (created) and `lastmod` (updated)

### Asset Management
- **Images**: Relative paths in MDX
- **Logo**: SVG format at root
- **Banners**: Social share images

## Maintenance Guidelines

### Adding New Blog Posts
1. Create MDX file in appropriate category directory
2. Include frontmatter with all required fields
3. Run `pnpm contentlayer build` to regenerate
4. Verify in development server

### Updating Metadata
1. Edit `siteMetadata.data.mjs` (source)
2. `siteMetadata.ts` imports and validates
3. Changes reflected on next build

### Navigation Changes
1. Update `headerNavLinks.ts`
2. Ensure all `href` paths exist
3. Test dropdown menus if nested

## Related Modules
- `contentlayer.config.js` - Content processing configuration
- `frontend/lib/mdx-runtime.ts` - MDX rendering
- `frontend/app/blog/` - Blog page routes
- `docs/guides/writing-guide.md` - Author guidelines

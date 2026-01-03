# scripts/export

## Purpose

Data export utilities for backing up and migrating blog content from database to various formats (SQL, CSV, JSON, MDX).

## Core Components

### export-posts-to-mdx.sh
**Purpose**: Export blog posts from PostgreSQL database to multiple formats for backup and migration

**Supported Export Formats**:
1. **SQL Full Backup**: Complete database dump (pg_dump)
2. **CSV**: Spreadsheet-compatible format (Excel/Pandas)
3. **JSON**: Machine-readable with full metadata
4. **MDX**: Frontend-ready markdown with frontmatter

## Export Process

### Prerequisites
```bash
# Check Docker running
docker ps

# Verify database container
docker ps | grep blog-postgres

# Start if needed
docker-compose up -d postgres
```

### Execution Flow
```
1. Validate Docker and PostgreSQL containers
2. Create output directory (default: ./exported-posts)
3. Export Method 1: Full SQL backup to ./backups/
4. Export Method 2: Posts list as CSV
5. Export Method 3: Posts with metadata as JSON
6. Export Method 4: Sample post as MDX
7. Generate statistics (total/published/draft)
8. Display export summary
```

### Usage
```bash
# Default output directory
./scripts/export/export-posts-to-mdx.sh

# Custom output directory
./scripts/export/export-posts-to-mdx.sh /path/to/output
```

## Export Formats

### 1. SQL Full Backup
**File**: `./backups/db_full_<timestamp>.sql`

**Content**: Complete database schema and data

**Restore**:
```bash
docker exec -i blog-postgres psql -U blog_user blog_db < backups/db_full_TIMESTAMP.sql
```

### 2. CSV Format
**File**: `./exported-posts/posts_<timestamp>.csv`

**Columns**:
- slug (URL-friendly identifier)
- title (post title)
- summary (excerpt)
- content (full HTML/Markdown content)
- status (published/draft)
- published_at (publication date)
- created_at (creation date)

**Usage**: Open in Excel, Google Sheets, or import to Pandas

### 3. JSON Format
**File**: `./exported-posts/posts_<timestamp>.json`

**Structure**:
```json
[
  {
    "slug": "post-slug",
    "title": "Post Title",
    "summary": "Excerpt",
    "content": "Full content",
    "status": "published",
    "published_at": "2025-01-01T00:00:00Z",
    "created_at": "2025-01-01T00:00:00Z",
    "updated_at": "2025-01-02T00:00:00Z",
    "category": "category-slug",
    "tags": ["tag1", "tag2", "tag3"]
  }
]
```

**Usage**: API responses, data processing, frontend imports

### 4. MDX Format
**File**: `./exported-posts/example-post.mdx`

**Structure**:
```mdx
---
title: Post Title
date: 2025-01-01T00:00:00Z
tags: ["tag1", "tag2"]
summary: Post excerpt
---

Post content in Markdown...
```

**Usage**: Direct import to Next.js frontend, static site generation

## Database Queries

### Posts Selection
```sql
SELECT slug, title, summary, content, status, published_at, created_at
FROM posts
WHERE deleted_at IS NULL
ORDER BY published_at DESC
```

### Metadata Enrichment
```sql
-- Category
SELECT slug FROM categories WHERE id = posts.category_id

-- Tags (array aggregation)
SELECT json_agg(slug)
FROM unnest(post_tags) AS tag_id
JOIN tags ON tags.id = tag_id
```

## Statistics Output

**Post Counts**:
- Total posts (excluding deleted)
- Published posts
- Draft posts

**Example**:
```
📊 文章总数: 42
✅ 已发布: 35
📝 草稿: 7
```

## Error Handling

### Docker Not Running
**Error**: `❌ 错误: Docker未运行`
**Solution**: Start Docker Desktop/application

### PostgreSQL Container Not Running
**Error**: `❌ 错误: PostgreSQL容器未运行`
**Solution**: `docker-compose up -d postgres`

### Connection Failures
**Check**:
```bash
# Container status
docker ps | grep blog-postgres

# Database connectivity
docker exec blog-postgres psql -U blog_user -d blog_db -c "SELECT 1"
```

### Empty Exports
**Verify**:
```sql
-- Check if posts exist
docker exec blog-postgres psql -U blog_user -d blog_db -c "
  SELECT COUNT(*) FROM posts WHERE deleted_at IS NULL
"
```

## Output Locations

**Directory Structure**:
```
./
├── backups/
│   └── db_full_20250101_120000.sql
└── exported-posts/
    ├── posts_20250101_120000.csv
    ├── posts_20250101_120000.json
    └── example-post.mdx
```

## Integration Points

### Database Schema
- **Table**: `posts`
- **Relations**: `categories`, `tags`, `post_tags`
- **Soft Deletes**: `deleted_at IS NULL`

### Frontend Integration
- MDX files can be imported directly to Next.js
- JSON format matches API response structure
- CSV useful for content audit in spreadsheets

## Best Practices

**Regular Backups**:
```bash
# Cron job (daily at 2 AM)
0 2 * * * /path/to/scripts/export/export-posts-to-mdx.sh
```

**Before Major Changes**:
- Schema migrations
- Content management system upgrades
- Bulk content operations

**Disaster Recovery**:
1. Restore SQL backup to fresh database
2. Verify post counts match statistics
3. Test frontend with restored data

## Alternative Export Methods

**Admin Panel Export**:
- Access http://localhost:3001/admin
- Use built-in export features
- Export filtered subsets (by category/tag/date)

**API Export**:
```bash
curl http://localhost:3000/api/posts > posts.json
```

**Direct Database Access**:
```bash
docker exec -it blog-postgres psql -U blog_user blog_db
```

## See Also

- `./backups/README.md` - Backup management
- `./backend/migrations/` - Database schema history
- `./scripts/operations/` - Operations and deployment
- `./frontend/src/app/admin/` - Admin panel interface

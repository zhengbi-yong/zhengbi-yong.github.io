# Database Migrations

## Module Overview

PostgreSQL database schema migrations using SQLx for the blog system.

## Purpose

Manage database schema evolution, version control, and deployment across environments.

## Structure

```
backend/migrations/
├── 0001_initial.sql                # Initial schema (users, tokens, posts, comments)
├── 0002_fix_column_names.sql       # Fix naming inconsistencies
├── 0003_fix_post_likes_column.sql   # Correct post_likes foreign key
├── 0004_create_cms_tables.sql      # CMS integration tables
├── 0005_add_comment_likes.sql       # Comment like feature
├── 0006_add_user_role.sql           # User role management
├── 20251229_add_reading_progress.sql # Reading tracking
├── 20251230_add_fulltext_search.sql  # Search optimization
└── 20251231_add_mdx_support.sql     # MDX content support
```

## Migration System

### Tool: SQLx

**Why SQLx?**
- Compile-time checked SQL queries
- Async/await support with Tokio
- Type-safe query results
- Offline mode support

### Migration Format

**Naming Convention**: `{version}_{description}.sql`

**Examples**:
- `0001_initial.sql` - Initial schema
- `20251229_add_reading_progress.sql` - Feature addition (dated)

## Initial Schema (0001_initial.sql)

### PostgreSQL Extensions

```sql
CREATE EXTENSION IF NOT EXISTS pgcrypto;   -- UUID generation
CREATE EXTENSION IF NOT EXISTS citext;     -- Case-insensitive text
CREATE EXTENSION IF NOT EXISTS ltree;      -- Hierarchical data (comments)
```

### Core Tables

#### Users Table

```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email CITEXT UNIQUE NOT NULL,
    username CITEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    profile JSONB NOT NULL DEFAULT '{}',
    email_verified BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

**Features**:
- UUID primary key
- Case-insensitive email/username
- JSONB profile (flexible user data)
- Email verification flag

**Indexes**:
```sql
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_created_at ON users(created_at DESC);
CREATE INDEX idx_users_profile_gin ON users USING GIN (profile);
```

#### Refresh Tokens Table

```sql
CREATE TABLE refresh_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash TEXT NOT NULL UNIQUE,
    family_id UUID NOT NULL,
    replaced_by_hash TEXT,
    revoked_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_used_at TIMESTAMPTZ,
    created_ip INET,
    user_agent_hash TEXT
);
```

**Security Features**:
- Token hashing (SHA-256)
- Family ID for token rotation
- Revocation tracking
- IP and user agent logging
- CASCADE delete on user deletion

#### Post Statistics Table

```sql
CREATE TABLE post_stats (
    post_slug TEXT PRIMARY KEY,
    view_count BIGINT NOT NULL DEFAULT 0,
    like_count INT NOT NULL DEFAULT 0,
    comment_count INT NOT NULL DEFAULT 0,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

**Purpose**: Denormalized statistics for performance

**Indexes**:
```sql
CREATE INDEX idx_post_stats_updated ON post_stats(updated_at DESC);
CREATE INDEX idx_post_stats_views ON post_stats(view_count DESC);
CREATE INDEX idx_post_stats_likes ON post_stats(like_count DESC);
```

#### Post Likes Table

```sql
CREATE TABLE post_likes (
    post_slug TEXT NOT NULL,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (post_slug, user_id)
);
```

**Features**:
- Composite primary key (prevents duplicate likes)
- CASCADE delete on user deletion

#### Comments Table

```sql
CREATE TYPE comment_status AS ENUM ('pending','approved','rejected','spam','deleted');

CREATE TABLE comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_slug TEXT NOT NULL,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    parent_id UUID REFERENCES comments(id) ON DELETE CASCADE,

    content TEXT NOT NULL,
    html_sanitized TEXT NOT NULL,
    status comment_status NOT NULL DEFAULT 'pending',

    path LTREE NOT NULL,
    depth INTEGER NOT NULL DEFAULT 0,

    like_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,

    created_ip INET,
    user_agent TEXT,
    moderation_reason TEXT,

    FOREIGN KEY (post_slug) REFERENCES post_stats(post_slug)
);
```

**Features**:
- Hierarchical structure (ltree)
- Content moderation workflow
- Spam detection status
- Soft delete support
- Audit trail (IP, user agent)

**Indexes**:
```sql
CREATE INDEX idx_comments_post_created ON comments(post_slug, created_at DESC);
CREATE INDEX idx_comments_post_status ON comments(post_slug, status);
CREATE INDEX idx_comments_path_gist ON comments USING GIST (path);
CREATE INDEX idx_comments_user ON comments(user_id);
```

#### Outbox Events Table

```sql
CREATE TABLE outbox_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    topic TEXT NOT NULL,
    payload JSONB NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    run_after TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    attempts INT NOT NULL DEFAULT 0,
    last_error TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

**Purpose**: Event-driven architecture (worker queue)

## Schema Evolution

### Migration 0002: Fix Column Names
**Purpose**: Correct naming inconsistencies

### Migration 0003: Fix Post Likes Column
**Purpose**: Correct foreign key reference

### Migration 0004: CMS Tables
**Purpose**: Integration with Payload CMS or similar headless CMS

### Migration 0005: Comment Likes
**Purpose**: Add like functionality to comments

### Migration 0006: User Role
**Purpose**: Add role-based access control (admin, moderator, user)

### Migration 20251229: Reading Progress
**Purpose**: Track user reading progress for posts

**Likely Schema**:
```sql
CREATE TABLE reading_progress (
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    post_slug TEXT NOT NULL,
    progress INTEGER NOT NULL,  -- Percentage 0-100
    last_read_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (user_id, post_slug)
);
```

### Migration 20251230: Full-Text Search
**Purpose**: Add search capabilities using PostgreSQL FTS

**Likely Features**:
- `tsvector` columns for posts
- GIN indexes for search performance
- Triggers for automatic vector update
- Search functions with ranking

### Migration 20251231: MDX Support
**Purpose**: Enhanced content format support

**Likely Features**:
- MDX content storage
- Component metadata
- Render options
- Syntax highlighting data

## Running Migrations

### Development

```bash
# Run all pending migrations (preferred)
cargo run -p blog-migrator

# Run with custom database URL
cargo run -p blog-migrator

# Run specific migration (advanced)
sqlx migrate run --source=backend/migrations  # legacy, use cargo run -p blog-migrator instead
```

### Production

```bash
# Run migrations (preferred)
cargo run -p blog-migrator

# Verify migration status
sqlx migrate info
```

### Docker

```bash
# In Dockerfile
RUN cargo run -p blog-migrator

# In docker-compose
command: ["sh", "-c", "cargo run -p blog-migrator && ./blog-backend"]
```

## Creating New Migrations

```bash
# Create new migration
sqlx migrate add add_new_feature

# With custom directory
sqlx migrate add add_new_feature --source=backend/migrations
```

## Migration Best Practices

### Forward-Compatible Migrations
- Add columns before using them in code
- Use `DEFAULT` values for new required columns
- Make columns `NULL` first, populate data, then make `NOT NULL`

### Backward-Compatible Migrations
- Never drop columns immediately
- Deprecate in code first, then remove in later migration
- Use views to abstract schema changes

### Transaction Safety
```sql
BEGIN;
-- Your migration SQL
COMMIT;
```

### Rollback Planning
Always write rollback script:
```sql
-- Down migration
DROP INDEX IF EXISTS idx_new_index;
ALTER TABLE users DROP COLUMN new_field;
```

## Indexing Strategy

### B-Tree Indexes (default)
- Equality queries: `WHERE email = $1`
- Range queries: `WHERE created_at > $1`
- Sorting: `ORDER BY created_at DESC`

### GIN Indexes
- JSONB: `profile @> '{"key": "value"}'`
- Full-text search: `tsvector @@ to_tsquery('search')`
- Arrays: `tags @> ARRAY['tag1']`

### GIST Indexes
- ltree: `path <@ 'root.category'`
- Geometric data
- Range queries

## Data Integrity

### Foreign Keys
```sql
-- Cascade delete
REFERENCES users(id) ON DELETE CASCADE

-- Set null
REFERENCES users(id) ON DELETE SET NULL

-- Restrict
REFERENCES users(id) ON DELETE RESTRICT
```

### Check Constraints
```sql
ALTER TABLE users ADD CONSTRAINT check_email_format
CHECK (email ~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');
```

### Triggers
```sql
-- Update timestamp trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at
BEFORE UPDATE ON users
FOR EACH ROW EXECUTE FUNCTION update_updated_at();
```

## Performance Optimization

### Connection Pooling
```rust
use sqlx::postgres::PgPoolOptions;

let pool = PgPoolOptions::new()
    .max_connections(20)
    .connect(&database_url)
    .await?;
```

### Query Optimization
```sql
-- Use EXPLAIN ANALYZE
EXPLAIN ANALYZE SELECT * FROM posts WHERE slug = $1;

-- Add appropriate indexes
CREATE INDEX CONCURRENTLY idx_posts_slug ON posts(slug);
```

### Materialized Views
```sql
CREATE MATERIALIZED VIEW popular_posts AS
SELECT slug, title, like_count
FROM post_stats
ORDER BY like_count DESC
LIMIT 10;

-- Refresh periodically
REFRESH MATERIALIZED VIEW popular_posts;
```

## Backup and Recovery

### Dump Schema
```bash
pg_dump -s -U blog_user blog_db > schema.sql
```

### Dump Data
```bash
pg_dump -U blog_user blog_db > backup.sql
```

### Restore
```bash
psql -U blog_user blog_db < backup.sql
```

## Monitoring

### Migration Status
```bash
sqlx migrate info
```

### Table Sizes
```sql
SELECT
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

### Index Usage
```sql
SELECT
    schemaname,
    tablename,
    indexname,
    idx_scan as index_scans
FROM pg_stat_user_indexes
ORDER BY idx_scan DESC;
```

## Troubleshooting

### Migration Conflicts
**Error**: Migration version already applied

**Solution**:
```bash
# Check applied migrations
sqlx migrate info

# Rollback if needed
sqlx migrate revert
```

### Lock Timeouts
**Error**: Lock timeout acquiring lock

**Solution**:
```sql
-- Set longer timeout
SET lock_timeout = '5s';

-- Use CONCURRENTLY for indexes
CREATE INDEX CONCURRENTLY idx_name ON table(column);
```

### Foreign Key Violations
**Error**: Insert or update violates foreign key constraint

**Solution**:
1. Verify referenced rows exist
2. Check constraint names
3. Use `ON DELETE SET NULL` if appropriate

## Related Modules

- **SQLx Config**: `../.sqlx/` - Query cache configuration
- **Backend Code**: `../src/` - Database access code
- **GitHub Workflows**: `../../.github/workflows/` - CI/CD integration
- **Deployments**: `../../deployments/` - Production database setup

## Resources

- [SQLx Migrations](https://github.com/launchbadge/sqlx/blob/main/sqlx-cli/README.md)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Database Best Practices](https://www.postgresql.org/docs/current/best-practices.html)

---

**Last Updated**: 2026-01-03
**Maintained By**: Backend Team

# Blog Database Crate (backend/crates/db)

## Overview
Database models and SQL query helpers for the blog application. Provides type-safe database access using SQLx.

**Purpose**: Database access layer
**Language**: Rust
**Layer**: Layer 3 - Data Access
**ORM**: SQLx (compile-time checked queries)

## Module Structure

```
src/
├── lib.rs          # Public API exports
└── models/
    ├── mod.rs       # Model exports
    └── cms.rs       # CMS-related models
```

## Architecture

### Public API (lib.rs)

```rust
pub mod models;

pub use models::*;
```

**Re-exports all models from `models/` module**

## Models Module (models/mod.rs)

### Purpose
Central export point for all database models

**Structure** (inferred):
```rust
// User models
pub mod user;
pub use user::{User, NewUser, UpdateUser};

// Post models
pub mod post;
pub use post::{Post, NewPost, UpdatePost, PostWithRelations};

// Comment models
pub mod comment;
pub use comment::{Comment, NewComment};

// Category models
pub mod category;
pub use category::{Category, NewCategory, CategoryTree};

// Tag models
pub mod tag;
pub use tag::{Tag, NewTag, PostTag};

// Media models
pub mod media;
pub use media::{Media, NewMedia};

// Analytics models
pub mod analytics;
pub use analytics::{ViewStats, LikeStats};

// Version control models
pub mod version;
pub use version::{PostVersion, NewPostVersion};
```

**Note**: Actual model files may vary - check `models/` directory for current structure

## CMS Models (models/cms.rs)

### Purpose
Models for CMS integration (Payload CMS, MDX sync)

**Key Models** (inferred):

```rust
/// CMS post representation
pub struct CmsPost {
    pub id: Uuid,
    pub slug: String,
    pub title: String,
    pub content: String,
    pub summary: Option<String>,
    pub published: bool,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

/// Synchronization status
pub struct SyncStatus {
    pub last_sync: DateTime<Utc>,
    pub total_posts: i64,
    pub published_posts: i64,
}

/// MDX frontmatter
pub struct MdxFrontmatter {
    pub title: String,
    pub slug: String,
    pub date: Option<DateTime<Utc>>,
    pub tags: Vec<String>,
    pub category: Option<String>,
    pub summary: Option<String>,
}
```

**Usage**:
- Sync MDX files to database
- Import/export CMS data
- Version control integration

## Database Schema

### Tables (inferred from routes)

**Users**:
- `id` (UUID, PK)
- `email` (TEXT, unique)
- `username` (TEXT, unique)
- `password_hash` (TEXT)
- `role` (TEXT: user/admin/moderator)
- `email_verified` (BOOLEAN)
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

**Posts**:
- `id` (UUID, PK)
- `slug` (TEXT, unique)
- `title` (TEXT)
- `content` (TEXT)
- `summary` (TEXT)
- `published` (BOOLEAN)
- `author_id` (UUID, FK → users.id)
- `category_id` (UUID, FK → categories.id)
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)
- `view_count` (INTEGER)
- `like_count` (INTEGER)

**Comments**:
- `id` (UUID, PK)
- `post_id` (UUID, FK → posts.id)
- `user_id` (UUID, FK → users.id, nullable)
- `author_name` (TEXT)
- `author_email` (TEXT)
- `content` (TEXT)
- `status` (TEXT: pending/approved/spam)
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)
- `like_count` (INTEGER)

**Categories**:
- `id` (UUID, PK)
- `slug` (TEXT, unique)
- `name` (TEXT)
- `description` (TEXT)
- `parent_id` (UUID, FK → categories.id, nullable)
- `order` (INTEGER)
- `created_at` (TIMESTAMP)

**Tags**:
- `id` (UUID, PK)
- `slug` (TEXT, unique)
- `name` (TEXT)
- `post_count` (INTEGER)
- `created_at` (TIMESTAMP)

**Post_Tags** (junction):
- `post_id` (UUID, FK → posts.id)
- `tag_id` (UUID, FK → tags.id)
- PK: (post_id, tag_id)

**Media**:
- `id` (UUID, PK)
- `filename` (TEXT)
- `url` (TEXT)
- `mime_type` (TEXT)
- `size` (INTEGER)
- `width` (INTEGER, nullable)
- `height` (INTEGER, nullable)
- `alt_text` (TEXT)
- `uploaded_at` (TIMESTAMP)
- `unused` (BOOLEAN)

**Post_Versions**:
- `id` (UUID, PK)
- `post_id` (UUID, FK → posts.id)
- `version_number` (INTEGER)
- `title` (TEXT)
- `content` (TEXT)
- `created_at` (TIMESTAMP)
- `created_by` (UUID, FK → users.id)
- `comment` (TEXT)

**Reading_Progress**:
- `user_id` (UUID, FK → users.id)
- `post_id` (UUID, FK → posts.id)
- `progress` (INTEGER) - Percentage
- `last_read_at` (TIMESTAMP)
- `completed_at` (TIMESTAMP, nullable)
- PK: (user_id, post_id)

**Refresh_Tokens**:
- `id` (UUID, PK)
- `user_id` (UUID, FK → users.id)
- `token_id` (UUID)
- `family_id` (UUID)
- `expires_at` (TIMESTAMP)
- `created_at` (TIMESTAMP)
- `revoked` (BOOLEAN)

**Views** (analytics):
- `id` (UUID, PK)
- `post_id` (UUID, FK → posts.id)
- `user_id` (UUID, FK → users.id, nullable)
- `ip_address` (TEXT)
- `user_agent` (TEXT)
- `viewed_at` (TIMESTAMP)

**Likes** (posts):
- `user_id` (UUID, FK → users.id)
- `post_id` (UUID, FK → posts.id)
- `created_at` (TIMESTAMP)
- PK: (user_id, post_id)

**Comment_Likes**:
- `user_id` (UUID, FK → users.id)
- `comment_id` (UUID, FK → comments.id)
- `created_at` (TIMESTAMP)
- PK: (user_id, comment_id)

## Migrations

**Location**: `backend/migrations/`

**Run on startup** (from `main.rs`):
```rust
sqlx::migrate!("../../migrations").run(&db).await?;
```

**Naming convention**: `{timestamp}_{description}.sql`

**Examples**:
- `001_initial_schema.sql`
- `002_add_version_control.sql`
- `003_add_reading_progress.sql`

## SQLx Features

### Compile-Time Verification

```rust
// Query checked at compile time
sqlx::query_as!(
    Post,
    "SELECT * FROM posts WHERE slug = $1"
)
.bind(slug)
.fetch_one(&pool)
.await
```

**Benefits**:
- Type safety (Rust types match DB columns)
- SQL syntax validation
- Missing column detection
- No runtime query string errors

### Derived Types

```rust
// Automatically derives Post struct from query result
sqlx::query_as!(
    PostWithRelations,
    r#"
    SELECT
        p.*,
        u.username as author_username,
        c.name as category_name
    FROM posts p
    LEFT JOIN users u ON p.author_id = u.id
    LEFT JOIN categories c ON p.category_id = c.id
    WHERE p.slug = $1
    "#
)
```

## Dependencies

```toml
[dependencies]
sqlx = { version = "0.8", features = ["runtime-tokio", "postgres", "migrate", "uuid", "chrono"] }
uuid = { version = "1", features = ["serde"] }
chrono = { version = "0.10", features = ["serde"] }
```

**Features**:
- `runtime-tokio` - Async runtime
- `postgres` - PostgreSQL driver
- `migrate` - Migration support
- `uuid` - UUID support
- `chrono` - DateTime support

## Usage Examples

### Query with SQLx

```rust
use sqlx::PgPool;

// Single post
let post = sqlx::query_as!(
    Post,
    "SELECT * FROM posts WHERE slug = $1",
    slug
)
.fetch_one(&pool)
.await?;

// List posts with pagination
let posts = sqlx::query_as!(
    Post,
    "SELECT * FROM posts WHERE published = true ORDER BY created_at DESC LIMIT $1 OFFSET $2",
    limit,
    offset
)
.fetch_all(&pool)
.await?;

// Insert post
sqlx::query!(
    "INSERT INTO posts (id, slug, title, content, author_id) VALUES ($1, $2, $3, $4, $5)",
    Uuid::new_v4(),
    slug,
    title,
    content,
    author_id
)
.execute(&pool)
.await?;
```

### Transaction

```rust
use sqlx::Ac;

let mut tx = pool.begin().await?;

sqlx::query!("INSERT INTO posts ...")
.execute(&mut *tx)
.await?;

sqlx::query!("UPDATE categories SET post_count = post_count + 1")
.execute(&mut *tx)
.await?;

tx.commit().await?;
```

## Best Practices

### 1. Always Use Query Macros
```rust
// ✓ Good - compile-time checked
sqlx::query_as!(Post, "SELECT * FROM posts")

// ✗ Bad - runtime error prone
sqlx::query_as::<Post>("SELECT * FROM posts")
```

### 2. Use Transactions for Multi-Step Operations
```rust
let mut tx = pool.begin().await?;
// ... multiple queries ...
tx.commit().await?;
```

### 3. Use Connection Pooling
```rust
// In AppState
pub db: PgPool,  // Already a pool

// Just use it directly
let post = sqlx::query_as!(...).fetch_one(&state.db).await?;
```

### 4. Handle Not Found Gracefully
```rust
use sqlx::Error;

match sqlx::query_as!(...).fetch_one(&pool).await {
    Ok(post) => Ok(post),
    Err(Error::RowNotFound) => Err(AppError::NotFound("Post".to_string())),
    Err(e) => Err(AppError::Database(e.to_string())),
}
```

## Performance

### Indexes (inferred)
- `posts.slug` (unique)
- `posts.published`
- `posts.created_at`
- `comments.post_id`
- `comments.status`
- `post_tags.post_id`, `post_tags.tag_id`
- `reading_progress.user_id`, `reading_progress.post_id`

### Connection Pooling
- **Max size**: 10 connections (default)
- **Min idle**: 0 connections
- **Timeout**: 30 seconds

### Query Optimization
- Use `EXPLAIN ANALYZE` for slow queries
- Add indexes for frequently queried columns
- Use `JOIN` instead of multiple queries
- Implement pagination for large result sets

## Testing

### Test Database
```bash
# Set test database URL
export DATABASE_URL="postgresql://localhost/blog_test"

# Run migrations
cargo install sqlx-cli
sqlx database create

# Run tests
cargo test
```

### Fixtures
Use `sqlx::query!` to insert test data:
```rust
sqlx::query!("INSERT INTO posts (id, slug, title) VALUES ($1, $2, $3)", ...)
.execute(&pool)
.await?;
```

## Related Modules
- `blog_api` - Uses models for request/response handling
- `blog_core` - Business logic using models
- `migrations/` - SQL schema definitions

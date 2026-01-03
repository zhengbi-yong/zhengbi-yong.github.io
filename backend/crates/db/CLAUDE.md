# Database Crate (backend/crates/db)

## Overview
Database models and query utilities for the blog application.

**Purpose**: Data access layer
**Language**: Rust
**Layer**: Layer 3 - Data Persistence
**ORM**: sqlx (compile-time checked queries)

## Module Structure

```
src/
├── lib.rs          # Public API exports
├── models.rs       # Core database models
└── models/
    └── cms.rs      # CMS-specific models (posts, comments, tags, categories)
```

## Core Models

### User
- `id` (UUID)
- `username` (String)
- `email` (String)
- `password_hash` (String)
- `role` (Enum: user, admin)
- `created_at`, `updated_at` (Timestamp)

### Post
- `id` (UUID)
- `title` (String)
- `slug` (String, unique)
- `content` (Text)
- `summary` (Text, nullable)
- `published` (Boolean)
- `author_id` (UUID FK)
- `created_at`, `updated_at` (Timestamp)

### Comment
- `id` (UUID)
- `post_id` (UUID FK)
- `user_id` (UUID FK, nullable)
- `content` (Text)
- `status` (Enum: pending, approved, rejected)
- `created_at`

### Tag / Category
- `id` (UUID)
- `name` (String)
- `slug` (String, unique)
- `description` (Text, nullable)

### Media
- `id` (UUID)
- `filename` (String)
- `url` (String)
- `mime_type` (String)
- `size` (Integer)
- `uploaded_by` (UUID FK)

## CMS Models (models/cms.rs)

Extended models for CMS functionality with relationships and metadata.

## Query Patterns

### Compile-Time Verification
```rust
sqlx::query_as!(
    Post,
    "SELECT * FROM posts WHERE slug = $1"
)
.bind(slug)
.fetch_one(&pool)
.await
```

### Transactions
```rust
sqlx::transaction(&pool)
.begin()
.await?
```

## Migrations

**Location**: `backend/migrations/`

**Applied on startup** via `sqlx::migrate!()`

## Related

- `/backend/crates/api` - API handlers using models
- `/backend/migrations/` - SQL schema definitions
- `blog_core` - Authentication models

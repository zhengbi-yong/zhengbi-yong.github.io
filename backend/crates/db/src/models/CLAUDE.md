# Database Models Module - Multi-Layer Architecture Documentation

## Layer 1: Application Layer

### Purpose & Scope
**Database schema definitions and ORM models** for the blog platform. Defines the data structures that persist in PostgreSQL and provides type-safe database operations using SQLx.

**Core Responsibilities:**
- Database table schema definitions
- Type-safe query operations
- Data validation constraints
- Relationship mappings (foreign keys)
- Migration generation support

**Success Criteria:**
- 100% type-safe database operations (no raw SQL in handlers)
- Compile-time verified queries
- Zero runtime query errors (type safety)
- Clear data model documentation

**Integration Points:**
- SQLx for compile-time query verification
- PostgreSQL database
- API route handlers (CRUD operations)
- Database migrations

---

## Layer 2: Feature Layer

### Model Categories

**1. CMS Models** (`cms.rs`)
- Category data structures
- Tag data structures
- Media file metadata
- Content versioning models
- Hierarchical taxonomies

---

## Layer 3: Module Layer

### Module Structure

```
models/
└── cms.rs    # CMS-related database models
```

### Key Model Patterns

**Example Model Structure:**
```rust
#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct Category {
    pub id: Uuid,
    pub name: String,
    pub slug: String,
    pub description: Option<String>,
    pub parent_id: Option<Uuid>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CreateCategory {
    pub name: String,
    pub slug: String,
    pub description: Option<String>,
    pub parent_id: Option<Uuid>,
}
```

---

## Layer 4: Integration Layer

### Query Operations

**CRUD Pattern:**
```rust
// Create
pub async fn create_category(
    db: &PgPool,
    input: &CreateCategory,
) -> Result<Category, Error> {
    sqlx::query_as!(
        Category,
        r#"
        INSERT INTO categories (id, name, slug, description, parent_id)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *
        "#,
        Uuid::new_v4(),
        input.name,
        input.slug,
        input.description,
        input.parent_id
    )
    .fetch_one(db)
    .await
}

// Read
pub async fn get_category(
    db: &PgPool,
    id: Uuid,
) -> Result<Category, Error> {
    sqlx::query_as!(Category, "SELECT * FROM categories WHERE id = $1", id)
        .fetch_one(db)
        .await
}

// Update
pub async fn update_category(
    db: &PgPool,
    id: Uuid,
    input: &UpdateCategory,
) -> Result<Category, Error> {
    sqlx::query_as!(
        Category,
        r#"
        UPDATE categories
        SET name = $2, slug = $3, description = $4
        WHERE id = $1
        RETURNING *
        "#,
        id,
        input.name,
        input.slug,
        input.description
    )
    .fetch_one(db)
    .await
}

// Delete
pub async fn delete_category(
    db: &PgPool,
    id: Uuid,
) -> Result<(), Error> {
    sqlx::query!("DELETE FROM categories WHERE id = $1", id)
        .execute(db)
        .await?;
    Ok(())
}
```

---

## Layer 5: Foundation Layer

### Dependencies

**Rust Crates:**
- `sqlx` - Type-safe SQL queries
- `uuid` - UUID generation and parsing
- `chrono` - Date/time handling
- `serde` - Serialization (JSON, database rows)

### SQLx Features

**Compile-Time Query Verification:**
```rust
sqlx::query_as!(Category, "SELECT * FROM categories WHERE id = $1", id)
// ^ Compiles to:
// - Verifies table exists
// - Verifies columns exist and types match Category struct
// - Generates optimized query code
```

**Migration Integration:**
```bash
# Create migration
sqlx migrate add create_categories_table

# Run migrations
cargo run -p blog-migrator

# Build with offline mode
cargo build --features sqlx/offline
```

---

## Development Guidelines

### Adding New Models

**1. Define Struct:**
```rust
#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct NewModel {
    pub id: Uuid,
    pub name: String,
    pub created_at: DateTime<Utc>,
}
```

**2. Create Migration:**
```sql
-- migrations/XXXXXXXXXXXXXX_create_new_model.sql
CREATE TABLE new_models (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

**3. Implement CRUD:**
```rust
pub async fn create_new_model(
    db: &PgPool,
    input: &CreateNewModel,
) -> Result<NewModel, Error> {
    sqlx::query_as!(
        NewModel,
        "INSERT INTO new_models (id, name) VALUES ($1, $2) RETURNING *",
        Uuid::new_v4(),
        input.name
    )
    .fetch_one(db)
    .await
}
```

---

## Future Improvements

**Features:**
1. Add relationship helpers (JOIN queries)
2. Add pagination support (cursor-based)
3. Add soft deletes (deleted_at column)
4. Add audit trail tracking

**Performance:**
1. Add database indexes documentation
2. Add query optimization hints
3. Add connection pooling configuration
4. Add read replica support

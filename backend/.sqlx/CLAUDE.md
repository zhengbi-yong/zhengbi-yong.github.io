# SQLx Configuration

## Module Overview

SQLx database query cache and offline mode configuration for compile-time checked SQL queries.

## Purpose

Enable SQLx offline mode and store prepared query metadata for compile-time verification without database connection.

## Structure

```
backend/.sqlx/
├── config.toml              # SQLx CLI configuration
├── config.json              # Alternative JSON format config
└── query-*.json             # Cached query metadata
```

## Configuration Files

### config.toml

```toml
[general]
offline = true
```

**Purpose**: Enable offline mode for SQLx

**Behavior**:
- Skip database connectivity checks at compile time
- Use cached query metadata from `query-*.json` files
- Allow compilation without running database
- Essential for CI/CD pipelines

### config.json

Alternative configuration format (JSON)

**Structure**:
```json
{
  "version": "1",
  "databases": {
    "default": {
      "url": "postgresql://...",
      "offline": true
    }
  }
}
```

## Offline Mode

### Why Offline Mode?

**Benefits**:
- **CI/CD**: Compile without database service
- **Docker Builds**: Faster build times
- **Air-Gapped Environments**: No network/database dependency
- **Reproducible Builds**: Same artifacts across environments

**Trade-offs**:
- Query metadata must be pre-generated
- Schema changes require cache update
- Need to sync `query-*.json` files

### Enabling Offline Mode

```bash
# Step 1: Generate query cache with database running
cargo sqlx prepare --database-url=postgresql://... -- --all-targets

# Step 2: Enable offline mode in config.toml
echo "[general]" > .sqlx/config.toml
echo "offline = true" >> .sqlx/config.toml

# Step 3: Compile without database
cargo build --release
```

### Disabling Offline Mode

```toml
[general]
offline = false
```

Or remove the config file entirely (defaults to online mode).

## Query Cache Files

### File Naming

```
query-{hash}.json
```

**Hash**: SHA-256 hash of the SQL query string

**Example**: `query-001fe655cd6aaae6066e049264a5723dfc54c6e5692df17d90ba5f832402cc88.json`

### File Structure

```json
{
  "database": "postgresql",
  "query": "SELECT * FROM users WHERE email = $1",
  "description": "Query parameters",
  "columns": [
    {
      "name": "id",
      "ordinal": 0,
      "type": "Uuid",
      "nullable": false
    },
    {
      "name": "email",
      "ordinal": 1,
      "type": "Text",
      "nullable": false
    }
  ],
  "parameters": {
    "left": [
      {
        "type": "Text"
      }
    ]
  }
}
```

### Cache Management

**Generate Cache**:
```bash
# Generate for all queries
cargo sqlx prepare

# Generate for specific binary
cargo sqlx prepare -- --bin blog-backend

# Generate with custom database URL
SQLX_OFFLINE=false cargo sqlx prepare --database-url=$DATABASE_URL
```

**Update Cache**:
```bash
# After schema changes
rm -rf .sqlx/query-*.json
cargo sqlx prepare
```

**Validate Cache**:
```bash
# Check if cache is valid
cargo sqlx prepare --check
```

## Integration with Cargo

### sqlx-cli Features

```toml
# Cargo.toml dependencies
sqlx = { version = "0.7", features = ["runtime-tokio", "tls-rustls", "postgres", "macros"] }
```

**Features**:
- `macros`: Enable `sqlx::query!` and `sqlx::query_as!` macros
- `postgres`: PostgreSQL driver
- `runtime-tokio`: Tokio async runtime
- `tls-rustls`: TLS support for secure connections

### Compile-Time Checked Queries

```rust
// sqlx::query! checks at compile time
let user = sqlx::query!(
    r#"SELECT id, email, username FROM users WHERE email = $1"#,
    user_email
)
.fetch_one(&pool)
.await?;

// sqlx::query_as! returns structs
#[derive(Debug)]
struct User {
    id: Uuid,
    email: String,
    username: String,
}

let user = sqlx::query_as!(
    User,
    r#"SELECT id, email, username FROM users WHERE id = $1"#,
    user_id
)
.fetch_optional(&pool)
.await?;
```

**Compile-Time Checks**:
- SQL syntax validation
- Table/column existence
- Type matching between Rust and SQL
- Parameter count validation

## Database Migrations

### Migration Integration

```bash
# Run migrations (online mode required)
sqlx migrate run

# Create new migration
sqlx migrate add add_user_roles

# Revert last migration
sqlx migrate revert
```

### Migration Scripts

**Location**: `../migrations/`

**Format**: `{version}_{description}.sql`

**Example**: `0001_initial.sql`

### Offline Mode with Migrations

When using offline mode:
1. Run migrations once (development/staging)
2. Generate query cache
3. Enable offline mode
4. Compile and deploy

## Query Examples

### Parameterized Queries

```rust
// Single parameter
sqlx::query!(
    "SELECT * FROM users WHERE email = $1",
    email
)
.fetch_one(&pool)
.await?;

// Multiple parameters
sqlx::query!(
    "INSERT INTO posts (slug, title, content) VALUES ($1, $2, $3)",
    post_slug,
    post_title,
    post_content
)
.execute(&pool)
.await?;
```

### Join Queries

```rust
#[derive(Debug)]
struct PostWithAuthor {
    slug: String,
    title: String,
    author_email: String,
}

let posts = sqlx::query_as!(
    PostWithAuthor,
    r#"
    SELECT p.slug, p.title, u.email as author_email
    FROM posts p
    JOIN users u ON p.author_id = u.id
    "#
)
.fetch_all(&pool)
.await?;
```

### Dynamic Queries

```rust
// sqlx::query! doesn't support dynamic queries
// Use sqlx::query for runtime SQL

use sqlx::Query;

let mut query = sqlx::query("SELECT * FROM posts");

if let Some(filter) = filter_author {
    query = query.arg(filter);
}

let result = query.fetch_all(&pool).await?;
```

## CI/CD Integration

### GitHub Actions

```yaml
# .github/workflows/backend-ci.yml

jobs:
  test:
    services:
      postgres:
        image: postgres:17
        # ... postgres service config

    steps:
      - uses: actions/checkout@v4
      - uses: actions-rust-lang/setup-rust-toolchain@v1

      # Generate query cache with database
      - name: Generate SQLx cache
        run: |
          cargo sqlx prepare \
            --database-url=postgresql://blog_user:blog_password@localhost:5432/blog_test

      # Cache query metadata
      - uses: actions/cache@v3
        with:
          path: backend/.sqlx
          key: ${{ runner.os }}-sqlx-${{ hashFiles('backend/migrations/**/*.sql') }}

      # Run tests
      - name: Run tests
        run: cargo test --workspace
```

### Docker Build

```dockerfile
# Dockerfile

FROM rust:1.75 as builder

# Copy migrations and generate cache
COPY migrations ./migrations
RUN cargo install sqlx-cli && \
    cargo sqlx prepare --database-url=${DATABASE_URL}

# Copy source and build
COPY . .
RUN cargo build --release
```

## Troubleshooting

### Cache Miss Errors

**Error**: `query data not found`

**Solution**:
```bash
# Regenerate cache
rm backend/.sqlx/query-*.json
cargo sqlx prepare --database-url=$DATABASE_URL
```

### Schema Mismatch

**Error**: Type mismatch in query

**Solution**:
1. Update schema: `sqlx migrate run`
2. Regenerate cache: `cargo sqlx prepare`
3. Recompile: `cargo build`

### Offline Mode Not Working

**Symptoms**: Still tries to connect to database

**Solutions**:
- Verify `config.toml` exists
- Check `offline = true` is set
- Ensure no `SQLX_OFFLINE=false` environment variable

## Best Practices

### Cache Management
- Commit `query-*.json` files to version control
- Update cache after schema changes
- Use `.gitignore` for `config.json` (contains credentials)

### Development Workflow
1. Make schema changes
2. Run migrations: `sqlx migrate run`
3. Generate cache: `cargo sqlx prepare`
4. Commit cache files
5. Deploy with offline mode enabled

### Security
- Never commit `config.json` with credentials
- Use environment variables for database URL
- Rotate credentials regularly

## Related Modules

- **Migrations**: `../migrations/` - Database schema definitions
- **Backend Code**: `../src/` - Application code using SQLx
- **Cargo Config**: `../.cargo/` - Build configuration
- **GitHub Workflows**: `../../.github/workflows/` - CI/CD integration

## Resources

- [SQLx Documentation](https://docs.rs/sqlx/)
- [Offline Mode Guide](https://github.com/launchbadge/sqlx/blob/main/sqlx-cli/README.md#offline-mode)
- [Query Macros](https://docs.rs/sqlx/latest/sqlx/macro.query.html)

---

**Last Updated**: 2026-01-03
**Maintained By**: Backend Team

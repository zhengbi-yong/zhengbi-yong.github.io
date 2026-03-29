# backend

## Purpose

Rust-based backend API providing blog content management, authentication, and data persistence with PostgreSQL and Redis.

## Quick Start

```bash
cd backend

# Development
cargo run

# Testing
cargo test --workspace

# Build
cargo build --release

# With database
SQLX_OFFLINE=false cargo run
```

## Architecture

**Workspace Structure**:
```
backend/
├── Cargo.toml              # Workspace configuration
├── crates/                 # Workspace members
│   ├── api/               # Main API server (Axum)
│   ├── blog-core/         # Core business logic
│   ├── blog-models/       # Data models and types
│   └── blog-tests/        # Integration tests
├── migrations/            # Database migrations (SQLx)
├── openapi/               # OpenAPI specifications
├── Dockerfile             # Multi-stage build
├── Makefile               # Common operations
└── README.md              # Detailed documentation (301 lines)
```

## Key Technologies

- **Language**: Rust (2024 edition)
- **Framework**: Axum (async web framework)
- **Database**: PostgreSQL 17 via SQLx
- **Cache**: Redis
- **Authentication**: JWT sessions
- **Documentation**: OpenAPI 3.0 (Swagger UI)

## Environment Configuration

**Required Variables** (.env):
```bash
DATABASE_URL=postgresql://blog_user:blog_password@localhost:5432/blog_db
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-secret-key-32-chars-minimum
PASSWORD_PEPPER=your-pepper-32-chars
SESSION_SECRET=your-session-secret
CORS_ALLOWED_ORIGINS=http://localhost:3001
RUST_LOG=debug
ENVIRONMENT=development
```

**Example File**: `.env.example`

## API Documentation

**Swagger UI**: http://localhost:3000/swagger-ui/
**OpenAPI JSON**: http://localhost:3000/api-docs/openapi.json

## Database

**Migrations**: `./migrations/`
- Run via migrator: `cargo run -p blog-migrator`
- Automatically tracked in `.sqlx/`

**Schema**:
- `posts` - Blog posts with MDX content
- `users` - User accounts and profiles
- `categories` - Post categorization
- `tags` - Tag system
- `comments` - Comment management
- `sessions` - Session storage

## Testing

```bash
# All workspace tests
cargo test --workspace

# Specific crate
cargo test -p blog_api

# Integration tests (requires database)
SQLX_OFFLINE=false cargo test

# Documentation tests
cargo test --doc
```

## Docker Deployment

**Build**:
```bash
docker build -t blog-backend:latest .
```

**Production Build**:
```bash
docker build --target production -t blog-backend:prod .
```

**Multi-stage**: Builder → Runtime (minimal image)

## Key Crates

### api/
**Purpose**: HTTP server and route handlers

**Endpoints**:
- `GET /healthz` - Health check
- `GET /metrics` - Prometheus metrics
- `GET /api/v1/posts` - List posts
- `POST /api/v1/posts` - Create post
- `/api/v1/admin/*` - Admin endpoints

**Middleware**:
- CORS
- Authentication
- Rate limiting
- Logging
- Error handling

### blog-core/
**Purpose**: Business logic and services

**Services**:
- Post service
- User service
- Auth service
- Comment service
- Cache service

### blog-models/
**Purpose**: Data types and database models

**Types**:
- DTOs (request/response)
- Domain models
- Database entities
- Error types

## Development Workflow

**Makefile Commands**:
```bash
make build          # Build project
make test           # Run tests
make migrate        # Run migrations
make docker-build   # Build Docker image
make run            # Run API server
```

## Error Handling

**Result Types**: All functions use `Result<T, E>`

**Error Response Format**:
```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable message",
    "details": {}
  }
}
```

## Performance

**Features**:
- Async/await throughout
- Connection pooling (PostgreSQL, Redis)
- Query optimization with indexes
- Redis caching for hot data
- Prometheus metrics

## Security

**Implementations**:
- Password hashing (bcrypt + pepper)
- JWT session tokens
- CORS validation
- Rate limiting (60 req/min)
- SQL injection prevention (SQLx)
- Input validation

## Logging

**Levels**: error, warn, info, debug, trace

**Configuration**: `RUST_LOG` environment variable

**Structured Logging**: JSON format in production

## CI/CD

**Workflow**: `.github/workflows/backend-ci.yml`

**Jobs**:
1. Test (PostgreSQL service)
2. Build Docker image
3. Deploy (main branch only)

## Troubleshooting

**Database Connection**:
```bash
# Check PostgreSQL
docker exec blog-postgres pg_isready -U blog_user -d blog_db

# Test connection
psql $DATABASE_URL
```

**SQLx Offline Mode**:
```bash
# Generate cache
cargo install sqlx-cli
sqlx database create --database-url $DATABASE_URL
cargo sqlx prepare --database-url $DATABASE_URL
```

**Build Errors**:
```bash
# Clean build
cargo clean
cargo build
```

## Detailed Documentation

**Primary Source**: `./README.md` (301 lines)

**Topics Covered**:
- Complete API reference
- Database schema details
- Migration guide
- Deployment instructions
- Development setup
- Testing strategies
- Performance optimization

## See Also

- `./migrations/` - Database schema history
- `./openapi/` - API specifications
- `./crates/` - Crates documentation
- `./scripts/operations/` - Operations scripts
- `../.github/workflows/backend-ci.yml` - CI/CD pipeline

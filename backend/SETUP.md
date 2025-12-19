# Blog Backend Setup Guide

This guide will walk you through setting up the blog backend API from scratch.

## Prerequisites

### System Requirements
- **OS**: Linux (Ubuntu 20.04+, Debian 11+) or macOS (10.15+) or Windows 10+
- **RAM**: Minimum 4GB, Recommended 8GB+
- **Disk Space**: Minimum 10GB free space
- **CPU**: 64-bit processor

### Required Software
1. **Rust** (latest stable version)
   ```bash
   curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
   source ~/.cargo/env
   ```

2. **Docker** & **Docker Compose** (for PostgreSQL and Redis)
   ```bash
   # Ubuntu/Debian
   sudo apt update
   sudo apt install docker.io docker-compose-plugin

   # Start Docker service
   sudo systemctl start docker
   sudo systemctl enable docker

   # Add user to docker group (to avoid sudo)
   sudo usermod -aG docker $USER
   # Log out and log back in for changes to take effect
   ```

3. **PostgreSQL Client** (optional, for manual database access)
   ```bash
   sudo apt install postgresql-client
   ```

4. **Redis CLI** (optional, for manual Redis access)
   ```bash
   sudo apt install redis-tools
   ```

## Project Setup

### 1. Clone the Repository
```bash
git clone https://github.com/yourusername/zhengbi-yong.github.io.git
cd zhengbi-yong.github.io/blog-backend
```

### 2. Environment Configuration
Create and configure your environment file:

```bash
cp .env.example .env
```

Edit `.env` with your configuration:

```env
# Database Configuration
DATABASE_URL=postgresql://blog_user:blog_password@localhost:5432/blog_db

# Redis Configuration
REDIS_URL=redis://localhost:6379

# JWT Configuration (generate a secure secret)
JWT_SECRET=your-super-secret-jwt-key-here-make-it-at-least-256-bits

# Server Configuration
HOST=127.0.0.1
PORT=3000

# Email Configuration (Optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password

# Environment
RUST_LOG=info
ENVIRONMENT=development

# Security
PASSWORD_PEPPER=your-password-pepper-here
CORS_ORIGIN=https://yourdomain.com
```

### 3. Start Database Services

#### Option A: Using Docker (Recommended)
```bash
# Start PostgreSQL and Redis containers
docker compose up -d

# Verify containers are running
docker compose ps
```

#### Option B: Local Installation

**PostgreSQL:**
```bash
# Install PostgreSQL
sudo apt install postgresql postgresql-contrib

# Create database and user
sudo -u postgres psql -c "CREATE USER blog_user WITH PASSWORD 'blog_password';"
sudo -u postgres psql -c "CREATE DATABASE blog_db OWNER blog_user;"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE blog_db TO blog_user;"
```

**Redis:**
```bash
# Install and start Redis
sudo apt install redis-server
sudo systemctl start redis-server
sudo systemctl enable redis-server
```

### 4. Install SQLx CLI
```bash
cargo install sqlx-cli --no-default-features --features rustls,postgres
```

### 5. Database Migrations
```bash
# Run migrations
sqlx migrate run

# Or if using Docker
sqlx migrate run --database-url "postgresql://blog_user:blog_password@localhost:5432/blog_db"
```

### 6. Prepare SQLx Queries (for offline compilation)
```bash
# Generate query metadata
cargo sqlx prepare

# This creates .sqlx/query-meta.json for offline compilation
```

## Building and Running

### Development Mode
```bash
# Run with hot reload (requires cargo-watch)
cargo install cargo-watch
cargo watch -x run

# Or simply run
cargo run
```

### Production Build
```bash
# Build optimized binary
cargo build --release

# Run production binary
./target/release/api
```

### Running Tests
```bash
# Run all tests
cargo test

# Run tests with coverage
cargo install cargo-tarpaulin
cargo tarpaulin --out Html
```

## API Documentation

Once the server is running, you can access:
- **API Documentation**: http://localhost:3000/swagger-ui/
- **OpenAPI JSON**: http://localhost:3000/api-docs/openapi.json
- **Health Check**: http://localhost:3000/healthz
- **Metrics**: http://localhost:3000/metrics

## Development Workflow

### 1. Making Changes
```bash
# Check for compilation errors
cargo check

# Run clippy for linting
cargo clippy -- -D warnings

# Format code
cargo fmt

# Run tests
cargo test
```

### 2. Database Schema Changes
```bash
# Create new migration
sqlx migrate add <migration_name>

# Edit migration file in migrations/
# Then run migrations
sqlx migrate run
```

### 3. Adding New Dependencies
```bash
# Add workspace dependency
cargo add <crate> --workspace

# Add to specific crate
cargo add <crate> -p blog-api
```

## Troubleshooting

### Common Issues

1. **"Connection refused" error**
   - Ensure Docker is running: `docker ps`
   - Check if containers are up: `docker compose ps`
   - Verify database is accessible: `psql $DATABASE_URL`

2. **SQLx compile-time errors**
   - Run with `SQLX_OFFLINE=true` if you don't have a database connection
   - Or prepare queries first: `cargo sqlx prepare`

3. **Permission denied with Docker**
   - Add your user to docker group: `sudo usermod -aG docker $USER`
   - Restart your shell/session

4. **Port already in use**
   - Check what's using port 3000: `lsof -i :3000`
   - Kill the process: `kill -9 <PID>`
   - Or change port in `.env`

5. **Migration fails**
   - Check database connection: `sqlx migrate info`
   - Drop and recreate database (WARNING: This deletes all data):
     ```bash
     sqlx database drop
     sqlx database create
     sqlx migrate run
     ```

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | Required |
| `REDIS_URL` | Redis connection string | `redis://localhost:6379` |
| `JWT_SECRET` | Secret for JWT tokens | Required |
| `PASSWORD_PEPPER` | Additional password security | Optional |
| `RUST_LOG` | Log level filter | `info` |
| `ENVIRONMENT` | Environment (development/production) | `development` |
| `HOST` | Server bind address | `127.0.0.1` |
| `PORT` | Server port | `3000` |
| `CORS_ORIGIN` | Allowed CORS origin | `http://localhost:3000` |

## Production Deployment

### 1. Environment Setup
```bash
# Set production environment
export ENVIRONMENT=production
export RUST_LOG=warn

# Use production database
export DATABASE_URL=postgresql://user:pass@prod-db:5432/blog_db
```

### 2. Security Checklist
- [ ] Change all default passwords
- [ ] Use environment variables for secrets
- [ ] Enable HTTPS in production
- [ ] Set up proper CORS origins
- [ ] Configure firewall rules
- [ ] Set up database backups
- [ ] Enable monitoring and logging

### 3. Performance Tuning
```bash
# Build with optimizations
export RUSTFLAGS="-C target-cpu=native"
cargo build --release

# Or use profile-guided optimization (PGO)
cargo build --release
./target/release/api --profile-generate ./profile-data
cargo build --release
```

## Useful Commands

```bash
# Update dependencies
cargo update

# Check for outdated dependencies
cargo outdated

# Audit dependencies for security vulnerabilities
cargo audit

# Remove target directory and rebuild from scratch
cargo clean
cargo build

# Generate dependency graph
cargo tree

# Check binary size
cargo bloat --crates

# Run benchmarks
cargo bench

# Generate documentation
cargo doc --open
```

## API Endpoints

### Authentication
- `POST /v1/auth/register` - User registration
- `POST /v1/auth/login` - User login
- `POST /v1/auth/refresh` - Refresh JWT token
- `POST /v1/auth/logout` - User logout
- `GET /v1/auth/me` - Get current user info

### Posts
- `GET /v1/posts/{slug}/stats` - Get post statistics
- `POST /v1/posts/{slug}/view` - Record post view
- `POST /v1/posts/{slug}/like` - Like post
- `DELETE /v1/posts/{slug}/like` - Unlike post

### Comments
- `GET /v1/posts/{slug}/comments` - List post comments
- `POST /v1/posts/{slug}/comments` - Create comment
- `POST /v1/comments/{id}/like` - Like comment

### Health & Metrics
- `GET /healthz` - Basic health check
- `GET /healthz/detailed` - Detailed health check
- `GET /readyz` - Readiness check
- `GET /metrics` - Prometheus metrics

## License

This project is licensed under the MIT License - see the LICENSE file for details.
# Blog Backend API

A high-performance, Rust-based backend API for a blog platform built with Axum, SQLx, and modern web technologies.

## 🚀 Features

- **High Performance**: Built on Rust with async/await and Tokio runtime
- **Type Safety**: Full type safety with SQLx compile-time query checking
- **Authentication**: JWT-based authentication with refresh tokens
- **Database**: PostgreSQL with connection pooling
- **Caching**: Redis for session and data caching
- **API Documentation**: OpenAPI 3.0 with Swagger UI
- **Monitoring**: Prometheus metrics and health checks
- **Security**: CORS support, rate limiting, input sanitization
- **Real-time**: WebSocket support for real-time features
- **Modular**: Clean architecture with separate crates for core functionality

## 📦 Architecture

The project is organized into several crates:

```
blog-backend/
├── crates/
│   ├── api/        # HTTP API layer (Axum server)
│   ├── core/       # Core business logic and utilities
│   ├── db/         # Database models and schemas
│   ├── shared/     # Shared types and utilities
│   └── worker/     # Background worker processes
├── migrations/     # SQLx database migrations
├── docker-compose.yml
├── setup.sh       # Automated setup script
├── SETUP.md       # Detailed setup guide
└── README.md
```

## 🛠 Tech Stack

- **Web Framework**: Axum 0.8
- **Database**: PostgreSQL 15+ with SQLx 0.8
- **Cache**: Redis 7+ with deadpool-redis
- **Serialization**: Serde 1.0
- **Authentication**: JWT with argon2 password hashing
- **OpenAPI**: Utoipa 4.2 with Swagger UI
- **Monitoring**: Prometheus and Sentry
- **Async Runtime**: Tokio 1.42
- **Logging**: tracing and tracing-subscriber

## 🚀 Quick Start

### Prerequisites

- Rust 1.70+
- Docker & Docker Compose
- PostgreSQL and Redis (or use Docker)

### Automated Setup (Recommended)

```bash
# Clone the repository
git clone https://github.com/yourusername/zhengbi-yong.github.io.git
cd zhengbi-yong.github.io/blog-backend

# Run the setup script
./setup.sh
```

The setup script will:
- ✅ Install Rust (if not installed)
- ✅ Install Docker (if not installed)
- ✅ Create environment file with secure secrets
- ✅ Start PostgreSQL and Redis containers
- ✅ Install SQLx CLI
- ✅ Run database migrations
- ✅ Build and test the project

### Manual Setup

1. **Clone and navigate to the project**
   ```bash
   git clone https://github.com/yourusername/zhengbi-yong.github.io.git
   cd zhengbi-yong.github.io/blog-backend
   ```

2. **Install dependencies**
   ```bash
   # Install Rust (if not installed)
   curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

   # Install SQLx CLI
   cargo install sqlx-cli --no-default-features --features rustls,postgres
   ```

3. **Set up environment**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Start databases**
   ```bash
   docker compose up -d
   ```

5. **Run migrations**
   ```bash
   sqlx migrate run
   ```

6. **Run the server**
   ```bash
   cargo run
   ```

## 📚 API Documentation

Once the server is running:

- **Swagger UI**: http://localhost:3000/swagger-ui/
- **OpenAPI JSON**: http://localhost:3000/api-docs/openapi.json
- **Health Check**: http://localhost:3000/healthz
- **Metrics**: http://localhost:3000/metrics

## 🧪 Development

### Running Tests

```bash
# Run all tests
cargo test

# Run with coverage
cargo install cargo-tarpaulin
cargo tarpaulin --out Html
```

### Code Quality

```bash
# Check code
cargo check

# Lint
cargo clippy -- -D warnings

# Format
cargo fmt
```

### Database Migrations

```bash
# Create new migration
sqlx migrate add <migration_name>

# Run migrations
sqlx migrate run

# Check migration status
sqlx migrate info
```

### Hot Reload

```bash
# Install cargo-watch
cargo install cargo-watch

# Run with hot reload
cargo watch -x run
```

## 📊 Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | Required |
| `REDIS_URL` | Redis connection string | `redis://localhost:6379` |
| `JWT_SECRET` | JWT signing secret | Required |
| `PASSWORD_PEPPER` | Password pepper for hashing | Optional |
| `RUST_LOG` | Log level | `info` |
| `ENVIRONMENT` | Environment | `development` |
| `HOST` | Server bind address | `127.0.0.1` |
| `PORT` | Server port | `3000` |
| `CORS_ORIGIN` | Allowed CORS origin | `http://localhost:3000` |

## 🔧 Configuration

The application can be configured through environment variables or a `.env` file. See `.env.example` for all available options.

## 📝 API Endpoints

### Authentication
- `POST /v1/auth/register` - Register new user
- `POST /v1/auth/login` - User login
- `POST /v1/auth/refresh` - Refresh JWT token
- `POST /v1/auth/logout` - User logout
- `GET /v1/auth/me` - Get current user

### Posts
- `GET /v1/posts/{slug}/stats` - Get post statistics
- `POST /v1/posts/{slug}/view` - Record post view
- `POST /v1/posts/{slug}/like` - Like post
- `DELETE /v1/posts/{slug}/like` - Unlike post

### Comments
- `GET /v1/posts/{slug}/comments` - List comments
- `POST /v1/posts/{slug}/comments` - Create comment
- `POST /v1/comments/{id}/like` - Like comment

### System
- `GET /healthz` - Health check
- `GET /readyz` - Readiness probe
- `GET /metrics` - Prometheus metrics

## 🚀 Deployment

### Production Build

```bash
# Build optimized binary
cargo build --release

# Run production binary
./target/release/api
```

### Docker Deployment

```bash
# Build Docker image
docker build -t blog-api .

# Run container
docker run -p 3000:3000 --env-file .env blog-api
```

### Environment

For production, ensure:

1. Set `ENVIRONMENT=production`
2. Use a secure `JWT_SECRET`
3. Configure proper `CORS_ORIGIN`
4. Set up monitoring and logging
5. Enable HTTPS
6. Configure firewall rules

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

If you encounter any issues:

1. Check the [troubleshooting section](./SETUP.md#troubleshooting)
2. Search [existing issues](https://github.com/yourusername/zhengbi-yong.github.io/issues)
3. Create a [new issue](https://github.com/yourusername/zhengbi-yong.github.io/issues/new)

## 🙏 Acknowledgments

- [Axum](https://github.com/tokio-rs/axum) - Web framework
- [SQLx](https://github.com/launchbadge/sqlx) - SQL toolkit
- [Tokio](https://github.com/tokio-rs/tokio) - Async runtime
- [Serde](https://github.com/serde-rs/serde) - Serialization framework
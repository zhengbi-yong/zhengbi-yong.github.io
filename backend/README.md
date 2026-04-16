# Backend Workspace

Rust/Axum backend for the blog platform.

## Workspace layout

```text
backend/
├── crates/
│   ├── api/      # HTTP API binary and route layer
│   ├── core/     # auth, domain services, email, shared business logic
│   ├── db/       # SQLx-backed models and persistence helpers
│   ├── shared/   # configuration, errors, shared DTOs
│   └── worker/   # background outbox consumer and async jobs
├── migrations/   # SQLx migrations
└── scripts/      # backend-only helper scripts
```

## Runtime model

- `cargo run --bin migrate`: one-shot schema migration job
- `cargo run --bin api`: stateless HTTP API
- `cargo run --bin worker`: background outbox consumer

This separation is intentional. The API verifies migration state on startup but
does not mutate schema automatically.

## Local development

From the repository root:

```bash
docker compose -f deployments/docker/compose-files/dev/docker-compose.yml up -d postgres redis
cd backend
cp .env.example .env
cargo run --bin migrate
cargo run --bin api
```

## Quality checks

```bash
cd backend
cargo fmt --check
cargo clippy --workspace --all-targets -- -D warnings
cargo test --workspace --locked
```

## Operations

- health: `http://localhost:3000/healthz`
- readiness: `http://localhost:3000/readyz`
- metrics: `http://localhost:3000/metrics`

## Canonical documentation

- [Repository docs hub](/home/Sisyphus/zhengbi-yong.github.io/docs/README.md)
- [Feature: Auth and Engagement](/home/Sisyphus/zhengbi-yong.github.io/docs/features/auth-and-engagement.md)
- [Feature: Media and Storage](/home/Sisyphus/zhengbi-yong.github.io/docs/features/media-and-storage.md)
- [Feature: Search and Discovery](/home/Sisyphus/zhengbi-yong.github.io/docs/features/search-and-discovery.md)
- [Feature: Observability and Operations](/home/Sisyphus/zhengbi-yong.github.io/docs/features/observability-and-operations.md)
- [Feature: Runtime and Scaling](/home/Sisyphus/zhengbi-yong.github.io/docs/features/runtime-and-scaling.md)
- [Deployment guide](/home/Sisyphus/zhengbi-yong.github.io/docs/deployment/README.md)

## Notes

- Use [backend/.env.example](/home/Sisyphus/zhengbi-yong.github.io/backend/.env.example) as
  the source of truth for runtime configuration.
- Use [scripts/deployment](/home/Sisyphus/zhengbi-yong.github.io/scripts/deployment) for
  deployment automation. Older ad-hoc deployment procedures are no longer
  maintained.

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

## 🆘 Support

If you encounter any issues:

1. Check the [troubleshooting guide](../docs/getting-started/troubleshooting.md)
2. Search [existing issues](https://github.com/zhengbi-yong/zhengbi-yong.github.io/issues)
3. Create a [new issue](https://github.com/zhengbi-yong/zhengbi-yong.github.io/issues/new)

## 🙏 Acknowledgments

- [Axum](https://github.com/tokio-rs/axum) - Web framework
- [SQLx](https://github.com/launchbadge/sqlx) - SQL toolkit
- [Tokio](https://github.com/tokio-rs/tokio) - Async runtime
- [Serde](https://github.com/serde-rs/serde) - Serialization framework

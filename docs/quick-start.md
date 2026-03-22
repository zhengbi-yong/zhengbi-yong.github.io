# Quick Start

This is the fastest verified local startup path for the current repository.

## 1. Clone the repository

```bash
git clone https://github.com/zhengbi-yong/zhengbi-yong.github.io.git
cd zhengbi-yong.github.io
```

## 2. Start shared infrastructure

```bash
docker compose -f docker-compose.dev.yml up -d
```

This starts PostgreSQL, Redis, Meilisearch, and MinIO for local development.

## 3. Start the application

Recommended:

```bash
./start-dev.sh
```

Or run the services directly:

```bash
cd backend && cargo run --bin api
cd frontend && pnpm dev
```

## 4. Open the app

- frontend: `http://localhost:3001`
- backend API: `http://localhost:3000`
- search UI: `http://localhost:3001/search`
- admin UI: `http://localhost:3001/admin`

## Common commands

```bash
# stop shared infrastructure
docker compose -f docker-compose.dev.yml down

# backend checks
cd backend && cargo check

# frontend tests
cd frontend && pnpm test
```

## Next steps

- [Getting Started](/home/Sisyphus/zhengbi-yong.github.io/docs/getting-started/README.md)
- [Developer Guide](/home/Sisyphus/zhengbi-yong.github.io/docs/development/README.md)
- [Feature Index](/home/Sisyphus/zhengbi-yong.github.io/docs/features/README.md)
- [Deployment Guide](/home/Sisyphus/zhengbi-yong.github.io/docs/deployment/README.md)

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
# Unix-like shells
./start-dev.sh
```

```powershell
# Windows PowerShell
powershell -ExecutionPolicy Bypass -File .\start-dev.ps1
powershell -ExecutionPolicy Bypass -File .\start-dev.ps1 -IncludeWorker
```

Or run the services directly:

```bash
cd backend && cargo run -p blog-migrator
cd backend && cargo run --bin api
cd backend && cargo run -p blog-worker --bin worker
cd frontend && pnpm dev
```

Windows-specific entrypoints are also available if you prefer separate shells:

```powershell
powershell -ExecutionPolicy Bypass -File .\start-backend.ps1
powershell -ExecutionPolicy Bypass -File .\start-frontend.ps1
powershell -ExecutionPolicy Bypass -File .\start-worker.ps1
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

# frontend OpenAPI type generation
cd frontend && pnpm generate:types
```

## Next steps

- [Getting Started](/home/Sisyphus/zhengbi-yong.github.io/docs/getting-started/README.md)
- [Developer Guide](/home/Sisyphus/zhengbi-yong.github.io/docs/development/README.md)
- [Feature Index](/home/Sisyphus/zhengbi-yong.github.io/docs/features/README.md)
- [Deployment Guide](/home/Sisyphus/zhengbi-yong.github.io/docs/deployment/README.md)

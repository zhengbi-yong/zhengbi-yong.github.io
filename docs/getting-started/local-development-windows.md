# Windows Native Development

Supported platforms: Windows 10 and Windows 11

This repository now supports an actively maintained Windows-native local
development flow for day-to-day frontend and backend work.

## Recommendation

- Prefer WSL2 if you want the closest match to the Linux production runtime.
- Prefer native Windows if you mainly want to edit code, run the frontend,
  start the Rust API and worker, and iterate quickly with Docker Desktop.

## Current Status

Native Windows is now a practical path for:

- `docker compose -f deployments/docker/compose-files/dev/docker-compose.yml up -d`
- `pnpm dev`
- `pnpm generate:types`
- `cargo run -p blog-migrator`
- `cargo run --bin api`
- `cargo run --bin worker`

These areas are still Bash-first and are better run from WSL2 or another
Unix-like shell:

- root `Makefile`
- `scripts/deployment/**`
- `scripts/release/**`
- other scripts that explicitly require `bash`

## Prerequisites

Install the following tools first:

- Git for Windows
- Node.js 20+
- npm 10+
- pnpm 10.28.2+
- Rust toolchain
- Docker Desktop

If `pnpm` is not installed yet:

```powershell
npm install -g pnpm@10.28.2
```

Keep the repo on a short path when possible, for example:

```powershell
C:\dev\zhengbi-yong.github.io
```

## Fast Start

### 1. Start shared infrastructure

```powershell
docker compose -f deployments/docker/compose-files/dev/docker-compose.yml up -d
```

This starts PostgreSQL, Redis, Meilisearch, and MinIO for local development.

### 2. Start the application

Recommended PowerShell entrypoints:

Start frontend + backend:

```powershell
powershell -ExecutionPolicy Bypass -File .\start-dev.ps1
```

Start frontend + backend + worker:

```powershell
powershell -ExecutionPolicy Bypass -File .\start-dev.ps1 -IncludeWorker
```

Start only the backend API:

```powershell
powershell -ExecutionPolicy Bypass -File .\start-backend.ps1
```

Start only the worker:

```powershell
powershell -ExecutionPolicy Bypass -File .\start-worker.ps1
```

Start only the frontend:

```powershell
powershell -ExecutionPolicy Bypass -File .\start-frontend.ps1
```

`start-backend.ps1` and `start-worker.ps1` now load the root `.env`, apply
Windows-friendly local defaults, and run database migrations automatically
before launching Rust services.

`start-dev.ps1` also supports explicit modes:

```powershell
powershell -ExecutionPolicy Bypass -File .\start-dev.ps1 -Mode backend
powershell -ExecutionPolicy Bypass -File .\start-dev.ps1 -Mode worker
powershell -ExecutionPolicy Bypass -File .\start-dev.ps1 -Mode frontend
powershell -ExecutionPolicy Bypass -File .\start-dev.ps1 -Mode infra
powershell -ExecutionPolicy Bypass -File .\start-dev.ps1 -Mode full -NoInfra
```

### 3. Run the services directly

If you prefer direct commands instead of helper scripts:

```powershell
docker compose -f deployments/docker/compose-files/dev/docker-compose.yml up -d

cd backend
cargo run -p blog-migrator
cargo run --bin api
```

Open another terminal for the worker when needed:

```powershell
cd backend
cargo run --bin worker
```

Open another terminal for the frontend:

```powershell
cd frontend
pnpm install
pnpm dev
```

## Common Commands

Backend checks:

```powershell
cd backend
cargo check
```

Frontend tests:

```powershell
cd frontend
pnpm test
```

Frontend OpenAPI type generation:

```powershell
cd frontend
pnpm generate:types
```

Backend startup smoke test:

```powershell
powershell -ExecutionPolicy Bypass -File .\backend\scripts\smoke-backend-start.ps1
powershell -ExecutionPolicy Bypass -File .\backend\scripts\smoke-worker-start.ps1
```

Stop shared infrastructure:

```powershell
docker compose -f deployments/docker/compose-files/dev/docker-compose.yml down
```

## Local URLs

- frontend home: `http://localhost:3001`
- search: `http://localhost:3001/search`
- admin: `http://localhost:3001/admin`
- backend API: `http://localhost:3000`
- backend health: `http://localhost:3000/healthz`

## Why This Works Better On Windows Now

- frontend scripts no longer depend on Unix-only `$PWD`
- OpenAPI type generation now uses Node instead of Bash
- Windows production builds fall back to webpack to avoid a Turbopack path issue
- root PowerShell entrypoints cover frontend, backend, worker, and infra
- backend startup now uses a dedicated migrator crate so migrations can run on a
  fresh database before the API crate is compiled
- Windows CI now validates the native entrypoints and frontend smoke flow

## When WSL2 Is Still Better

Use WSL2 when you want to:

- run `make` targets
- use deployment or release scripts
- stay as close as possible to the Linux production runtime while debugging

## Troubleshooting

### PowerShell blocks local scripts

If you see `running scripts is disabled`, run:

```powershell
powershell -ExecutionPolicy Bypass -File .\start-dev.ps1
```

Or set a less restrictive per-user policy:

```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### Long path errors

Keep the repository under a short path such as
`C:\dev\zhengbi-yong.github.io`.

If needed, enable Windows long paths:

```powershell
New-ItemProperty -Path "HKLM:\SYSTEM\CurrentControlSet\Control\FileSystem" `
  -Name "LongPathsEnabled" -Value 1 -PropertyType DWORD -Force
```

### Git hooks expect a shell

Some Husky hooks still run through `sh`. Installing Git for Windows is usually
enough because it includes Git Bash.

### Docker is slow or file watching feels unstable

Try:

- keeping the repository on an SSD
- excluding the repo from Windows Defender scans
- restarting Docker Desktop

## Next Steps

- [Quick Start](../../../../../docs/quick-start.md)
- [Getting Started](../../../../../docs/getting-started/README.md)
- [Developer Guide](../../../../../docs/development/README.md)

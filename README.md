# Zhengbi Yong Blog Platform

Production blog platform for `https://zhengbi-yong.top`, built as a dual-stack
monorepo:

- `frontend/`: Next.js 16 App Router, MDX, admin UI, search UI
- `backend/`: Rust + Axum API workspace (`api`, `core`, `db`, `shared`, `worker`)
- `docker-compose.production.yml`: canonical single-host and small-fleet runtime
- `deployments/kubernetes/`: canonical multi-node baseline

## Current architecture

- stateless `api` and `frontend` processes
- independent `worker` process for outbox and background jobs
- PostgreSQL + Redis as core stateful services
- optional Meilisearch and MinIO
- optional Compose edge proxy, or host nginx cutover in front of the stack

## Repository layout

```text
.
├── backend/
├── frontend/
├── scripts/
│   ├── deployment/
│   └── release/
├── deployments/
│   ├── environments/
│   ├── kubernetes/
│   └── nginx/
└── docs/
```

## Local development

Start infrastructure:

```bash
docker compose -f docker-compose.dev.yml up -d
```

Recommended entrypoints:

```bash
# Unix-like shells
./start-dev.sh
./start-backend.sh
./start-frontend.sh
```

```powershell
# Windows PowerShell
powershell -ExecutionPolicy Bypass -File .\start-dev.ps1
powershell -ExecutionPolicy Bypass -File .\start-backend.ps1
powershell -ExecutionPolicy Bypass -File .\start-frontend.ps1
powershell -ExecutionPolicy Bypass -File .\start-worker.ps1
```

Or run services directly:

```bash
cd backend && cargo run -p blog-migrator
cd backend && cargo run --bin api
cd backend && cargo run -p blog-worker --bin worker
cd frontend && pnpm dev
```

For native Windows day-to-day development, prefer the PowerShell entrypoints
above or the direct `cargo` / `pnpm` commands. The release, deployment, and
Compose validation helpers remain Bash-first and are still best run from WSL2
or another Unix-like shell.

## Testing and quality

```bash
make test
make verify-api-contract
make smoke-prod-compose
make smoke-prod-compose-fast
cd backend && cargo check
cd backend && cargo test
cd frontend && pnpm test
cd frontend && pnpm test:e2e
```

## Production deployment

Compose is the canonical path for one host to a small fleet:

```bash
cp .env.production.example .env.production
make deploy-prod-validate
make deploy-prod-up
```

For repeat local validation after images already exist:

```bash
make smoke-prod-compose-fast ENV_FILE=.env.production
```

Sentry release creation and source map upload are now credential-driven. Set
`SENTRY_AUTH_TOKEN`, `SENTRY_ORG`, and `SENTRY_PROJECT` only in environments
where build-time release artifacts should be published.

Lowest-friction remote deployment:

```bash
bash scripts/deployment/provision-compose-host.sh --target ubuntu@203.0.113.10
```

If the host already runs system nginx on `80/443`:

```bash
bash scripts/deployment/provision-compose-host.sh \
  --target ubuntu@203.0.113.10 \
  --site-url https://blog.example.com \
  --cutover-system-nginx
```

Kubernetes is the canonical clustered path:

```bash
kubectl apply -k deployments/kubernetes/base
```

Generate immutable release assets:

```bash
make render-release-assets VERSION=1.8.2
make validate-k8s-apply RELEASE_VERSION=1.8.2
```

## Canonical documentation

- [Developer Handoff](README_DEV.md)
- [Documentation Hub](/home/Sisyphus/zhengbi-yong.github.io/docs/README.md)
- [Feature Index](/home/Sisyphus/zhengbi-yong.github.io/docs/features/README.md)
- [Deployment Guide](/home/Sisyphus/zhengbi-yong.github.io/docs/deployment/README.md)
- [Developer Guide](/home/Sisyphus/zhengbi-yong.github.io/docs/development/README.md)
- [Kubernetes Base](/home/Sisyphus/zhengbi-yong.github.io/deployments/kubernetes/README.md)

## Maintenance policy

- Compose production and Kubernetes base are the only maintained deployment paths.
- Legacy deployment flows have been removed from the active documentation surface.
- Historical material belongs under `docs/archive/` or git history, not the main entrypoints.

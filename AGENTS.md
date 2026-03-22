# AGENTS.md - Codebase Guide for AI Agents

**Generated**: 2026-03-22

## OVERVIEW

Dual-architecture monorepo:

- `frontend/`: Next.js 16 App Router application
- `backend/`: Rust workspace with `api`, `core`, `db`, `shared`, and `worker`

The repository now has two maintained deployment paths only:

- Compose for single-host and small-fleet deployments
- Kubernetes + optional GitOps release assets for clustered deployments

## REPO MAP

```text
./
├── backend/
│   ├── crates/
│   ├── migrations/
│   └── scripts/
├── frontend/
│   ├── src/
│   ├── data/blog/
│   └── tests/
├── scripts/
│   ├── deployment/
│   ├── release/
│   └── operations/
├── deployments/
│   ├── environments/
│   ├── kubernetes/
│   └── nginx/
└── docs/
```

## WHERE TO LOOK

| Task | Location |
|------|----------|
| Static content and MDX | `frontend/data/blog/` |
| Shared MDX component registry | `frontend/src/components/MDXComponents.tsx` |
| Search UI | `frontend/src/app/search/` |
| Admin UI | `frontend/src/app/admin/` |
| API routes | `backend/crates/api/src/routes/` |
| Runtime bootstrapping | `backend/crates/api/src/main.rs` |
| Worker runtime | `backend/crates/worker/src/main.rs` |
| Compose deployment | `docker-compose.production.yml` |
| Kubernetes deployment | `deployments/kubernetes/` |

## CANONICAL COMMANDS

```bash
# Local development
docker compose -f docker-compose.dev.yml up -d
./start-dev.sh
./start-backend.sh
./start-frontend.sh

# Build and test
make build
make test
cd backend && cargo check
cd frontend && pnpm test

# Production Compose
make deploy-prod-validate
make deploy-prod-up

# Remote Compose bootstrap
bash scripts/deployment/provision-compose-host.sh --target user@host

# System nginx cutover
bash scripts/deployment/cutover-system-nginx.sh --target user@host
bash scripts/deployment/rollback-system-nginx.sh --target user@host

# Release assets
make render-release-assets VERSION=1.8.2
make validate-k8s-apply RELEASE_VERSION=1.8.2
```

## CONVENTIONS

- TypeScript `strict` remains disabled in the frontend.
- Frontend dev server is `3001`; backend API is `3000`.
- Root `docker-compose.dev.yml` is for shared development infrastructure only.
- Root `docker-compose.production.yml` is the canonical Compose runtime.
- Production env files are generated from `.env.production.example`.

## KNOWN LIMITS

- comment IP extraction still has TODOs in `backend/crates/api/src/routes/comments.rs`
- forgot-password and password-update flows still have TODOs in `frontend/src/lib/providers/refine-auth-provider.ts`
- multipart media upload work remains incomplete in `backend/crates/api/src/routes/media.rs`

## DELIVERY PIPELINE

The repository now has active GitHub Actions for:

- backend CI
- frontend CI
- security baseline and scheduled security scans
- release image publication
- deployment asset validation

Do not describe this repository as manual-only deployment anymore.

## DOCUMENTATION ENTRYPOINTS

- `docs/README.md`
- `docs/features/README.md`
- `docs/deployment/README.md`
- `docs/development/README.md`

Anything outside those entrypoints should be treated as secondary until verified.

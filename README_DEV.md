# README_DEV

Developer handoff and current work summary for this repository.

Last updated: 2026-03-26

## Purpose

This file tracks the current optimization work, the verified local development
paths, and the next recommended steps for contributors who continue from the
current branch state.

## Current Focus

The current workstream is improving native Windows development without breaking
the existing Unix-like workflows.

## Completed In This Workstream

### Tooling and package management

- `pnpm` was installed and verified on Windows: `10.28.2`
- frontend `package.json` now uses Windows-safe commands for type generation and
  build orchestration
- frontend build on Windows falls back to webpack through
  [frontend/scripts/build/run-next-build.js](frontend/scripts/build/run-next-build.js)
- frontend dev on Windows now prebuilds Contentlayer before starting Next dev,
  which avoids the transient `.contentlayer` module-missing startup race that
  could surface as early `404` responses on `/`
- blog list and blog detail pages now use the backend API as the canonical
  runtime source in development, instead of mixing static Contentlayer list
  pages with database-backed detail pages
- home page and blog category detail pages now also use the backend API at
  runtime, so the public blog flow no longer depends on Contentlayer data for
  local development rendering

### Root development entrypoints

- added PowerShell entrypoints:
  - [start-dev.ps1](start-dev.ps1)
  - [start-backend.ps1](start-backend.ps1)
  - [start-frontend.ps1](start-frontend.ps1)
  - [start-worker.ps1](start-worker.ps1)
  - [sync-blog-content.ps1](sync-blog-content.ps1)
- `start-dev.ps1` now also supports `-Detached` so the full dev stack can be
  launched in the background for manual verification
- `start-dev.ps1` now triggers blog-content sync automatically after the backend
  becomes healthy when the post table is empty
- updated Unix shell entrypoints to use the new migration flow:
  - [start-dev.sh](start-dev.sh)
  - [start-backend.sh](start-backend.sh)

### Backend migration and startup flow

- added dedicated migrator crate:
  - [backend/crates/migrator/Cargo.toml](backend/crates/migrator/Cargo.toml)
  - [backend/crates/migrator/src/lib.rs](backend/crates/migrator/src/lib.rs)
  - [backend/crates/migrator/src/main.rs](backend/crates/migrator/src/main.rs)
- this fixes the old bootstrap problem where SQLx compile-time checks could
  block migrations on a fresh database
- the legacy command `cargo run --bin migrate` now delegates to the dedicated
  migrator and remains usable
- backend environment files were normalized to current runtime variable names:
  - [backend/.env](backend/.env)
  - [backend/.env.clean](backend/.env.clean)
  - [backend/.env.example](backend/.env.example)

### Windows-native validation

- added backend smoke scripts:
  - [backend/scripts/smoke-backend-start.ps1](backend/scripts/smoke-backend-start.ps1)
  - [backend/scripts/smoke-worker-start.ps1](backend/scripts/smoke-worker-start.ps1)
- added stack status helper:
  - [check-dev-stack.ps1](check-dev-stack.ps1)
- expanded Windows CI:
  - [.github/workflows/windows-native-ci.yml](.github/workflows/windows-native-ci.yml)
- CI now covers:
  - frontend install, type generation, smoke test, and build
  - backend migrations
  - `cargo check --workspace`
  - backend PowerShell smoke start
  - PowerShell syntax parsing for all current Windows entrypoints

### Runtime stability fixes

- visitor tracking is now disabled by default in development unless
  `NEXT_PUBLIC_ENABLE_VISITOR_TRACKING=true` is set; this avoids Next.js dev
  rebuild loops caused by writing visitor files under the frontend workspace
- service worker registration remains disabled by default in development, with
  explicit cleanup/unregister behavior
- Sentry client debug logging is now opt-in instead of always on in development
- i18n client debug logging is now opt-in instead of always on in development
- backend MDX sync now preserves nested path-based slugs such as
  `chemistry/rdkit-visualization`, creates tag/category relationships, ensures
  `post_stats` rows exist, and queues search rebuilds after sync
- frontend API proxy now preserves encoded nested slugs, forwards request bodies
  correctly, handles backend `204 No Content` responses, and strips invalid
  response encoding headers that previously caused
  `ERR_CONTENT_DECODING_FAILED` in the browser
- article layouts now normalize backend post payloads instead of assuming the
  old Contentlayer `path` shape, which fixes the `path.split(...)` crash on
  database-backed article pages
- database-backed MDX rendering now normalizes expression props before runtime
  serialization so components like `RDKitStructure`, `MoleculeFingerprint`, and
  `SimpleChemicalStructure` keep multi-line `data={\`...\`}` and numeric props
  such as `height={350}`, `radius={3}`, and `bits={1024}`
- 3D chemistry components now lazy-load `3dmol`, fetch file-backed structures,
  infer model formats, and render without the previous browser-side
  `createViewer` failure
- RDKit loading now goes through a shared client-side single-flight loader, so
  article pages no longer inject both `/rdkit-init.js` and
  `/chemistry/rdkit-init.js` during the same render flow
- RDKit 2D rendering now routes both SMILES and MOL/SDF payloads through the
  same normalized chemistry helper path, which fixes the old
  `Invalid MOL data` regression for ChemDraw-style database-backed article MDX
- backend article view tracking is now de-duplicated per browser session so
  React development remounts do not spam repeated `POST /view` requests
- home page content width was widened for laptop-sized viewports by increasing
  the main hero, social, hero-card, and newsletter container widths

### Documentation updates

- updated:
  - [README.md](README.md)
  - [docs/quick-start.md](docs/quick-start.md)
  - [docs/getting-started/local-development-windows.md](docs/getting-started/local-development-windows.md)

## Verified Commands

The following commands were run successfully in the current workspace:

```powershell
pnpm --version
pnpm generate:types
pnpm exec vitest run tests/lib/api/resolveBackendApiBaseUrl.test.ts
pnpm build
pnpm exec tsc --noEmit --pretty false

powershell -ExecutionPolicy Bypass -File .\start-dev.ps1 -Mode infra -NoInfra
powershell -ExecutionPolicy Bypass -File .\start-dev.ps1 -IncludeWorker -Detached
powershell -ExecutionPolicy Bypass -File .\start-dev.ps1 -Mode frontend -NoInfra -Detached
powershell -ExecutionPolicy Bypass -File .\check-dev-stack.ps1
powershell -ExecutionPolicy Bypass -File .\sync-blog-content.ps1
powershell -ExecutionPolicy Bypass -File .\backend\scripts\smoke-backend-start.ps1
powershell -ExecutionPolicy Bypass -File .\backend\scripts\smoke-worker-start.ps1

cd backend
cargo run -p blog-migrator
cargo run --bin migrate
cargo check --workspace
```

The following local endpoints were also manually verified from this workspace on
2026-03-26:

- frontend home: `http://127.0.0.1:3001`
- frontend blog list: `http://127.0.0.1:3001/blog`
- frontend blog category: `http://127.0.0.1:3001/blog/category/chemistry`
- frontend blog detail: `http://127.0.0.1:3001/blog/chemistry/rdkit-visualization`
- frontend search: `http://127.0.0.1:3001/search`
- frontend admin shell: `http://127.0.0.1:3001/admin`
- backend health: `http://127.0.0.1:3000/healthz`
- backend posts API: `http://127.0.0.1:3000/api/v1/posts`
- Meilisearch health: `http://127.0.0.1:7700/health`
- MinIO console: `http://127.0.0.1:9001`

Browser-level verification in this workstream included:

- home page opens successfully and the main content width now occupies roughly
  `1216px / 1280px` on a standard laptop-sized viewport
- blog category page opens successfully with API-backed data and no new runtime
  console errors
- nested-slug article page
  `chemistry/rdkit-visualization` opens successfully with no runtime console
  errors; the previous `path.split(...)`, `zustand create(...)`, `204 proxy`,
  and MDX chemistry rendering regressions were all cleared

## Recommended Local Workflows

### Windows

Start infra only:

```powershell
docker compose -f docker-compose.dev.yml up -d
```

Start frontend + backend:

```powershell
powershell -ExecutionPolicy Bypass -File .\start-dev.ps1
```

Start frontend + backend + worker:

```powershell
powershell -ExecutionPolicy Bypass -File .\start-dev.ps1 -IncludeWorker
```

Start everything in the background:

```powershell
powershell -ExecutionPolicy Bypass -File .\start-dev.ps1 -IncludeWorker -Detached
```

Sync blog content into the database manually:

```powershell
powershell -ExecutionPolicy Bypass -File .\sync-blog-content.ps1
powershell -ExecutionPolicy Bypass -File .\sync-blog-content.ps1 -Force
```

Run backend smoke validation:

```powershell
powershell -ExecutionPolicy Bypass -File .\backend\scripts\smoke-backend-start.ps1
powershell -ExecutionPolicy Bypass -File .\backend\scripts\smoke-worker-start.ps1
```

Check the stack status:

```powershell
powershell -ExecutionPolicy Bypass -File .\check-dev-stack.ps1
```

Manual verification URLs:

```text
Frontend:        http://localhost:3001
Search:          http://localhost:3001/search
Admin:           http://localhost:3001/admin
Backend health:  http://localhost:3000/healthz
Backend API:     http://localhost:3000
Meilisearch:     http://localhost:7700
MinIO API:       http://localhost:9000
MinIO console:   http://localhost:9001
```

### Direct Rust commands

```powershell
cd backend
cargo run -p blog-migrator
cargo run -p blog-api --bin api
cargo run -p blog-worker --bin worker
```

## Known Gaps

- the full frontend test suite still has pre-existing failures outside the new
  Windows workstream
- many old secondary docs still mention outdated backend commands and need a
  broader cleanup pass
- the repository still carries both root and `backend/` environment files, which
  is workable now but should eventually be simplified
- development still shows some framework-level warnings unrelated to the core
  blog flow, mainly the current Sentry App Router setup warnings and the Next.js
  `allowedDevOrigins` heads-up

## Recommended Next Steps

1. Continue cleaning outdated docs that still mention `sqlx migrate run`,
   `cargo run`, or legacy backend env variable names.
2. Add a lightweight frontend smoke assertion for `/`, `/search`, and `/admin`
   so CI catches route regressions after the Windows startup path succeeds.
3. Add worker startup smoke coverage to any non-Windows validation path if the
   team wants parity across platforms.
4. Decide whether to keep both root `.env` and `backend/.env` long-term, or
   consolidate around one canonical local runtime env file.
5. Triage the existing frontend test failures so native Windows CI can grow from
   smoke coverage to broader test coverage.
6. Clean up the remaining Sentry and `allowedDevOrigins` development warnings so
   the console stays focused on real regressions during manual QA.

## Change Hotspots

If you continue this work, the most relevant files are:

- [frontend/package.json](frontend/package.json)
- [frontend/src/app/page.tsx](frontend/src/app/page.tsx)
- [frontend/src/app/Main.tsx](frontend/src/app/Main.tsx)
- [frontend/src/app/api/v1/[...path]/route.ts](frontend/src/app/api/v1/[...path]/route.ts)
- [frontend/src/app/blog/category/[category]/page.tsx](frontend/src/app/blog/category/[category]/page.tsx)
- [frontend/src/app/blog/category/[category]/ApiCategoryPage.tsx](frontend/src/app/blog/category/[category]/ApiCategoryPage.tsx)
- [frontend/src/components/layouts/PostLayout.tsx](frontend/src/components/layouts/PostLayout.tsx)
- [frontend/src/components/layouts/postLayoutContent.ts](frontend/src/components/layouts/postLayoutContent.ts)
- [frontend/src/components/RecentArticles.tsx](frontend/src/components/RecentArticles.tsx)
- [frontend/src/components/chemistry/runtimeProps.ts](frontend/src/components/chemistry/runtimeProps.ts)
- [frontend/src/components/chemistry/threeDmol.ts](frontend/src/components/chemistry/threeDmol.ts)
- [frontend/src/lib/mdx-runtime.tsx](frontend/src/lib/mdx-runtime.tsx)
- [frontend/src/lib/mdx-runtime-normalize.ts](frontend/src/lib/mdx-runtime-normalize.ts)
- [frontend/src/lib/adapters/backend-posts.ts](frontend/src/lib/adapters/backend-posts.ts)
- [frontend/scripts/generate/generate-api-types.js](frontend/scripts/generate/generate-api-types.js)
- [frontend/scripts/build/run-next-build.js](frontend/scripts/build/run-next-build.js)
- [backend/crates/migrator/src/lib.rs](backend/crates/migrator/src/lib.rs)
- [backend/crates/api/src/runtime.rs](backend/crates/api/src/runtime.rs)
- [backend/scripts/load-env.ps1](backend/scripts/load-env.ps1)
- [backend/scripts/smoke-backend-start.ps1](backend/scripts/smoke-backend-start.ps1)
- [backend/scripts/smoke-worker-start.ps1](backend/scripts/smoke-worker-start.ps1)
- [start-dev.ps1](start-dev.ps1)
- [start-worker.ps1](start-worker.ps1)
- [check-dev-stack.ps1](check-dev-stack.ps1)
- [.github/workflows/windows-native-ci.yml](.github/workflows/windows-native-ci.yml)

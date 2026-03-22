# Search and Discovery

## Purpose

Search provides fast full-text discovery for published posts while preserving a PostgreSQL fallback when Meilisearch is unavailable.

## User-facing capabilities

- `/search` page with live query results
- suggestion chips for partial queries
- trending keyword display when no query is active
- URL-synchronized search state for deep linking

## Frontend implementation

- [search/page.tsx](/home/Sisyphus/zhengbi-yong.github.io/frontend/src/app/search/page.tsx) owns the route entry
- [SearchPageClient.tsx](/home/Sisyphus/zhengbi-yong.github.io/frontend/src/app/search/SearchPageClient.tsx#L1) handles client search state, debounced fetching, and URL updates
- tests live in:
  - [resolveBackendApiBaseUrl.test.ts](/home/Sisyphus/zhengbi-yong.github.io/frontend/tests/lib/api/resolveBackendApiBaseUrl.test.ts)
  - `frontend/e2e/search.spec.ts`

## Backend implementation

### Search API

- search routes live in [routes/search.rs](/home/Sisyphus/zhengbi-yong.github.io/backend/crates/api/src/routes/search.rs)
- the API exposes full search, suggestions, and trending endpoints

### Search index service

- [search_index.rs](/home/Sisyphus/zhengbi-yong.github.io/backend/crates/api/src/search_index.rs#L1) wraps Meilisearch client setup, index configuration, document sync, and query execution
- searchable attributes include title, summary, content, tags, and category name
- filterable fields include category and tags

### Async indexing

- [outbox.rs](/home/Sisyphus/zhengbi-yong.github.io/backend/crates/api/src/outbox.rs#L1) emits search index events instead of blocking API writes
- [worker/main.rs](/home/Sisyphus/zhengbi-yong.github.io/backend/crates/worker/src/main.rs#L1) claims outbox records and applies indexing operations asynchronously

## Runtime dependencies

- PostgreSQL for canonical post data
- optional Meilisearch for accelerated search
- worker process for outbox consumption

## Scaling properties

- API writes remain responsive because indexing is moved out of the request path
- worker instances can scale horizontally because events are claimed with `FOR UPDATE SKIP LOCKED`
- if Meilisearch is disabled, the product remains functional with a slower fallback path

## Known boundaries

- trending data quality depends on search traffic accumulation
- search optimization work still exists in legacy or incomplete paths such as `search_optimized.rs`
- index rebuild orchestration is operationally available, but long-running rebuilds should still be scheduled carefully

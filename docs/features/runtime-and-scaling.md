# Runtime and Scaling

## Purpose

This document describes the parts of the system that matter when moving from one server to several or many.

## Runtime topology

### Single host

- `postgres`
- `redis`
- optional `meilisearch`
- optional `minio`
- `api`
- `worker`
- `frontend`
- optional edge proxy

### Multi-node

- API replicas remain stateless
- worker replicas consume outbox events with row-level claiming
- PostgreSQL, Redis, object storage, and search move to dedicated services

## Scaling primitives

### Stateless API

- migration execution is separated from API startup
- API startup only verifies migration state
- graceful shutdown is supported in the runtime helpers

### Worker isolation

- outbox processing runs in [backend/crates/worker/src/main.rs](/home/Sisyphus/zhengbi-yong.github.io/backend/crates/worker/src/main.rs#L1)
- search sync and view-count batching no longer block request handlers

### Explicit pool controls

- database and Redis pool sizes are environment-driven
- this keeps per-process connection usage predictable as replica count grows

### Release assets

- [scripts/release/render-release-assets.sh](/home/Sisyphus/zhengbi-yong.github.io/scripts/release/render-release-assets.sh) renders version-pinned Compose and Kubernetes assets
- Kubernetes overlays and Argo CD applications are generated from the same release metadata

## Deployment modes

- Compose is the standard path for single host and small fleets
- Kubernetes is the standard path for larger horizontal scaling
- GitOps output is available for Argo CD-based cluster operations

## Current architectural strengths

- deployment paths are converging on one canonical Compose stack and one canonical Kubernetes base
- object storage abstraction removes a major horizontal-scaling blocker
- asynchronous search indexing improves API latency stability under write load
- repo-local `kind` validation now makes `kubectl apply` checks reproducible

## Known boundaries

- there is still legacy deployment documentation that should be treated as non-canonical
- several TODOs remain in request handling and media uploads
- full auto-scaling policy, queue back-pressure policy, and disaster-recovery drill automation still need more depth

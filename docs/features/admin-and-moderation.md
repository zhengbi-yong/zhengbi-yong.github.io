# Admin and Moderation

## Purpose

The admin surface provides operational control for users, comments, posts, and platform monitoring.

## User-facing capabilities

- admin dashboard with high-level metrics
- user listing and role changes
- comment moderation flows
- post and analytics views
- monitoring pages for health and metrics

## Frontend implementation

- admin route entry is [admin/page.tsx](../../../../../frontend/src/app/admin/page.tsx#L1)
- the frontend uses Refine hooks and route-specific admin pages under [frontend/src/app/admin](../../../../../frontend/src/app/admin)
- shared admin UI components live under [frontend/src/components/admin](../../../../../frontend/src/components/admin)

## Backend implementation

- admin APIs live in [routes/admin.rs](../../../../../backend/crates/api/src/routes/admin.rs#L1)
- authorization is enforced by checking the authenticated user role before each admin action
- the admin API covers:
  - user listing, deletion, and role mutation
  - comment list and moderation status updates
  - platform statistics and growth reporting

## Monitoring inside admin

- frontend monitoring pages exist at:
  - [admin/monitoring/page.tsx](../../../../../frontend/src/app/admin/monitoring/page.tsx)
  - [admin/monitoring/health/page.tsx](../../../../../frontend/src/app/admin/monitoring/health/page.tsx)
  - [admin/monitoring/metrics/page.tsx](../../../../../frontend/src/app/admin/monitoring/metrics/page.tsx)
- backend health and Prometheus-style endpoints are mounted in [main.rs](../../../../../backend/crates/api/src/main.rs#L174)

## Scaling properties

- admin traffic is low-volume and primarily read-heavy
- most admin operations are database-backed and safe to run on stateless API replicas
- monitoring pages rely on HTTP endpoints rather than host-local access, which makes them load balancer friendly

## Known boundaries

- some admin pages still carry `@ts-nocheck` or loose typing
- role checks are repeated per handler and could eventually move behind a dedicated admin authorization layer
- media management exists but multipart upload support is still incomplete

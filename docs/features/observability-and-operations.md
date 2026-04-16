# Observability and Operations

## Purpose

Observability covers health checks, metrics, tracing, and frontend error reporting so deployments can be operated instead of merely started.

## Backend observability

- health and readiness endpoints are mounted in [main.rs](../../../../../backend/crates/api/src/main.rs#L174)
- Prometheus-style metrics live in [metrics/prometheus.rs](../../../../../backend/crates/api/src/metrics/prometheus.rs)
- OpenTelemetry setup lives in [observability/tracing.rs](../../../../../backend/crates/api/src/observability/tracing.rs#L1)
- request IDs are injected via [middleware/request_id.rs](../../../../../backend/crates/api/src/middleware/request_id.rs)

## Frontend observability

- frontend Sentry and OpenTelemetry configuration flows through environment variables
- admin monitoring pages surface health and metrics without requiring shell access

## Operational workflow

- the API process initializes tracing, pool configuration, storage, and optional Meilisearch at startup
- the worker process is independent and can be scaled or restarted separately
- production env validation prevents placeholder secrets from reaching deploy time

## Scaling properties

- trace metadata carries service name, version, and environment, which is necessary once the system spans multiple nodes
- health endpoints support load balancer readiness and rolling deploys
- separate worker and API processes isolate background failures from request-serving capacity

## Known boundaries

- tracing is in place, but operational dashboards and collector topology still depend on external infrastructure
- some frontend logging paths still have TODOs around richer error reporting
- alerting policies are not yet codified in this repository

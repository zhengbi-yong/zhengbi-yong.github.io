# Deployment Scripts

This directory contains the maintained deployment automation surface.

## Canonical scripts

- `generate-production-env.sh`
- `validate-production-env.sh`
- `deploy-compose-stack.sh`
- `bootstrap-remote-host.sh`
- `deploy-remote-compose.sh`
- `provision-compose-host.sh`
- `refresh-remote-compose.sh`
- `stream-local-images.sh`
- `cutover-system-nginx.sh`
- `rollback-system-nginx.sh`
- `validate-kubernetes-apply.sh`

## Intent

- Compose is the standard path for single-host and small-fleet deployments.
- Kubernetes manifests under `deployments/kubernetes/` are the standard
  clustered path.
- Release generation belongs in `scripts/release/`.

## Compatibility wrappers

These remain only for transitional compatibility and should not be used as the
primary documented path:

- `deploy-docker.sh`
- `deploy-production.sh`
- `deploy-server.sh`

## Removed paths

Legacy one-off deploy, image load/start, and script-per-scenario flows were
removed from the active tree to reduce maintenance burden and documentation
drift.

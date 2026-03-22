# Deployment Guide

This section documents the maintained deployment surface of the repository.

## Canonical deployment paths

### 1. Compose production stack

Use this for one host or a small fleet with a shared operational model.

- [Compose Production Stack](/home/Sisyphus/zhengbi-yong.github.io/docs/deployment/guides/compose/production-stack.md)
- [Environment Variables](/home/Sisyphus/zhengbi-yong.github.io/docs/deployment/reference/environment-variables.md)
- [Commands Reference](/home/Sisyphus/zhengbi-yong.github.io/docs/deployment/reference/commands.md)

### 2. Automated SSH deployment

Use this when you want the repository to generate env, bootstrap the host, and
publish the Compose runtime over SSH.

- [Automated Compose Deploy](/home/Sisyphus/zhengbi-yong.github.io/docs/deployment/guides/server/automated-compose-deploy.md)
- [Quick Deployment](/home/Sisyphus/zhengbi-yong.github.io/docs/deployment/guides/server/quick-deployment.md)

### 3. System nginx cutover

Use this when the server already owns `80/443` with system nginx and you want a
safe switch-over with backup and rollback.

- [System Nginx Cutover](/home/Sisyphus/zhengbi-yong.github.io/docs/deployment/guides/server/system-nginx-cutover.md)

### 4. Kubernetes and GitOps

Use this for clustered deployments and version-pinned release promotion.

- [Kubernetes Base](/home/Sisyphus/zhengbi-yong.github.io/deployments/kubernetes/README.md)
- [Kubernetes Guide](/home/Sisyphus/zhengbi-yong.github.io/docs/deployment/guides/kubernetes/base.md)
- [GitOps / Argo CD](/home/Sisyphus/zhengbi-yong.github.io/docs/deployment/guides/gitops/argocd.md)

## Quick commands

```bash
# Local production-style validation
cp .env.production.example .env.production
make deploy-prod-validate
make deploy-prod-up

# Fast repeat smoke after images already exist
make smoke-prod-compose-fast ENV_FILE=.env.production

# Lowest-friction fresh-host deploy
bash scripts/deployment/provision-compose-host.sh --target ubuntu@203.0.113.10

# Render immutable release assets
make render-release-assets VERSION=1.8.2
```

If you want frontend source maps and Sentry release metadata to be published
during `next build`, provide `SENTRY_AUTH_TOKEN`, `SENTRY_ORG`, and
`SENTRY_PROJECT`. Without those credentials the build stays quiet and skips the
artifact upload step.

## What was retired

The repository no longer treats the following as maintained primary deployment
paths:

- legacy `quick-deploy.sh` style scripts
- hand-managed image export/load/start procedures
- low-resource special-case deployment guides
- legacy Docker guide trees that diverged from the canonical Compose stack
- duplicated deployment assets under `deployments/docker/compose-files/`
- standalone deployment wrappers under `deployments/scripts/`

Those flows were removed from the active documentation surface to keep the
repository understandable and maintainable.

## Supporting references

- [Environment Variables](/home/Sisyphus/zhengbi-yong.github.io/docs/deployment/reference/environment-variables.md)
- [Commands Reference](/home/Sisyphus/zhengbi-yong.github.io/docs/deployment/reference/commands.md)
- [Ports and Networking](/home/Sisyphus/zhengbi-yong.github.io/docs/deployment/reference/ports-and-networking.md)

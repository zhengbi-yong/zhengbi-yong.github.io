# Compose Production Stack

This is the canonical deployment path for one host and small fleets.

## Core files

- [docker-compose.production.yml](/home/Sisyphus/zhengbi-yong.github.io/docker-compose.production.yml)
- [.env.production.example](/home/Sisyphus/zhengbi-yong.github.io/.env.production.example)
- [scripts/deployment/validate-production-env.sh](/home/Sisyphus/zhengbi-yong.github.io/scripts/deployment/validate-production-env.sh)
- [scripts/deployment/deploy-compose-stack.sh](/home/Sisyphus/zhengbi-yong.github.io/scripts/deployment/deploy-compose-stack.sh)

## Local operator workflow

```bash
cp .env.production.example .env.production
# edit secrets and image tags
make deploy-prod-validate
make deploy-prod-up

# after the first successful build, reuse local images for fast repeat smoke
make smoke-prod-compose-fast ENV_FILE=.env.production
```

That flow validates configuration, starts infrastructure, runs the migration
job, starts `api`, `worker`, `frontend`, and optional edge services, then checks
readiness.

If frontend source maps and Sentry release metadata should be published during
`next build`, provide `SENTRY_AUTH_TOKEN`, `SENTRY_ORG`, and `SENTRY_PROJECT` in
the deployment environment. Leaving them unset keeps routine builds quiet and
skips artifact upload.

## Remote operator workflow

For a fresh host:

```bash
bash scripts/deployment/provision-compose-host.sh --target ubuntu@203.0.113.10
```

For a reviewed env file and explicit deployment step:

```bash
bash scripts/deployment/generate-production-env.sh \
  --public-host 203.0.113.10 \
  --output .env.production

bash scripts/deployment/deploy-remote-compose.sh \
  --target ubuntu@203.0.113.10 \
  --env-file .env.production
```

## Image sourcing modes

### Registry mode

Use published OCI images referenced by `BACKEND_IMAGE` and `FRONTEND_IMAGE`.

### Local image streaming mode

Use this when the host cannot pull private images, or when you need to deploy
exactly what is in the current working tree:

```bash
bash scripts/deployment/provision-compose-host.sh \
  --target ubuntu@203.0.113.10 \
  --image-source local
```

That path builds local images, streams them over SSH, and deploys with
`blog-backend:local` and `blog-frontend:local`.

## Network model

- Only the edge proxy should bind publicly by default.
- Backend, frontend, PostgreSQL, Redis, Meilisearch, MinIO, and Mailpit should
  usually bind to loopback on production hosts.
- If the host already runs system nginx on `80/443`, keep the Compose edge on
  loopback and use [System Nginx Cutover](/home/Sisyphus/zhengbi-yong.github.io/docs/deployment/guides/server/system-nginx-cutover.md).

## Optional bundled services

- `ENABLE_BUNDLED_MEILISEARCH=true`
- `ENABLE_BUNDLED_MINIO=true`
- `ENABLE_BUNDLED_MAILPIT=true`
- `ENABLE_EDGE_PROXY=true`

## Release and upgrade

Render immutable release assets:

```bash
make render-release-assets VERSION=1.8.2
```

Validate Kubernetes apply against a disposable local cluster:

```bash
make validate-k8s-apply RELEASE_VERSION=1.8.2
```

When upgrading Compose hosts, change image tags in `.env.production` and rerun:

```bash
bash scripts/deployment/deploy-compose-stack.sh --env-file .env.production --pull
```

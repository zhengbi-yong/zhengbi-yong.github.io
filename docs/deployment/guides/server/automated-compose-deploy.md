# Automated Compose Deploy

This is the canonical lowest-friction path for a fresh single-host deployment.

## What it automates

`scripts/deployment/provision-compose-host.sh` performs the full bootstrap:

1. derives a public URL from the SSH target unless you override it
2. generates a production env file with random secrets
3. optionally enables bundled Mailpit, Meilisearch, and MinIO
4. bootstraps Docker Engine and Docker Compose on the remote host
5. optionally builds local images and streams them to the remote host
6. uploads the runtime package over SSH
7. deploys the production Compose stack remotely

## Minimal command

```bash
bash scripts/deployment/provision-compose-host.sh --target ubuntu@203.0.113.10
```

By default this:

- uses `http://203.0.113.10` as `NEXT_PUBLIC_SITE_URL`
- enables bundled Mailpit for low-friction SMTP
- keeps search and object storage external unless you opt in
- uploads releases under `/opt/blog-platform`
- binds only the edge proxy to `0.0.0.0`; backend, frontend, PostgreSQL, Redis, Mailpit, Meilisearch, and MinIO default to `127.0.0.1`

## Recommended command

```bash
bash scripts/deployment/provision-compose-host.sh \
  --target ubuntu@203.0.113.10 \
  --site-url https://blog.example.com \
  --release-version 1.8.2 \
  --enable-bundled-meilisearch \
  --enable-bundled-minio
```

## System nginx cutover mode

Use this when the host already terminates public traffic with system nginx on
`80/443` and you want the new Compose stack to hide behind it:

```bash
bash scripts/deployment/provision-compose-host.sh \
  --target ubuntu@203.0.113.10 \
  --site-url https://blog.example.com \
  --cutover-system-nginx
```

This mode automatically defaults the Compose edge to `127.0.0.1:18080` unless
you override `EDGE_BIND_HOST` or `EDGE_HTTP_PORT`.

Rollback remains explicit and one-command:

```bash
bash scripts/deployment/rollback-system-nginx.sh \
  --target ubuntu@203.0.113.10
```

## Registry Mode vs Local Mode

### Registry mode

This is the default. The remote host pulls `BACKEND_IMAGE` and `FRONTEND_IMAGE` from the configured registry.

```bash
bash scripts/deployment/provision-compose-host.sh \
  --target ubuntu@203.0.113.10 \
  --site-url https://blog.example.com
```

### Local mode

Use local mode when:

- the host cannot authenticate to a private registry
- you want the exact images built from the current workspace
- you need a self-contained deploy from your laptop to a fresh server

```bash
bash scripts/deployment/provision-compose-host.sh \
  --target ubuntu@203.0.113.10 \
  --site-url http://203.0.113.10 \
  --image-source local \
  --configure-firewall
```

Local mode will:

- build `blog-backend:local` and `blog-frontend:local` locally unless `--skip-local-build` is set
- auto-reuse host-built frontend `.next/standalone` artifacts when available
- stream only changed images to the host over SSH
- deploy with `BACKEND_IMAGE=blog-backend:local` and `FRONTEND_IMAGE=blog-frontend:local`

For the current repository, local mode defaults to `NEXT_IGNORE_BUILD_ERRORS=1` and `NEXT_IGNORE_ESLINT=1` during image builds. Override them with:

```bash
--frontend-ignore-build-errors 0
--frontend-ignore-eslint 0
```

if you want strict local image builds.

## Script responsibilities

### 1. Generate env

Use [generate-production-env.sh](/home/Sisyphus/zhengbi-yong.github.io/scripts/deployment/generate-production-env.sh):

```bash
bash scripts/deployment/generate-production-env.sh \
  --public-host 203.0.113.10 \
  --release-version 1.8.2 \
  --smtp-mode mailpit \
  --enable-bundled-mailpit \
  --output .env.production
```

This writes a validated env file and replaces placeholder secrets.

You can also override any specific key without editing the template:

```bash
bash scripts/deployment/generate-production-env.sh \
  --public-host 203.0.113.10 \
  --compose-project-name blog-platform-staging \
  --set-env EDGE_HTTP_PORT=18080 \
  --set-env FRONTEND_PORT=13101 \
  --set-env BACKEND_PORT=13100 \
  --output .env.staging
```

### 2. Bootstrap the host

Use [bootstrap-remote-host.sh](/home/Sisyphus/zhengbi-yong.github.io/scripts/deployment/bootstrap-remote-host.sh):

```bash
bash scripts/deployment/bootstrap-remote-host.sh --target ubuntu@203.0.113.10
```

To open additional edge ports for staging or canary stacks:

```bash
bash scripts/deployment/bootstrap-remote-host.sh \
  --target ubuntu@203.0.113.10 \
  --configure-firewall \
  --allow-port 18080/tcp
```

Current support:

- Ubuntu
- Debian

The bootstrap installs Docker Engine, Docker Compose, `curl`, `pigz`, and
`rsync`, then enables Docker.

### 3. Deploy the runtime package

Use [deploy-remote-compose.sh](/home/Sisyphus/zhengbi-yong.github.io/scripts/deployment/deploy-remote-compose.sh):

```bash
bash scripts/deployment/deploy-remote-compose.sh \
  --target ubuntu@203.0.113.10 \
  --env-file .env.production \
  --bootstrap
```

The runtime package includes:

- [docker-compose.production.yml](/home/Sisyphus/zhengbi-yong.github.io/docker-compose.production.yml)
- [scripts/deployment/deploy-compose-stack.sh](/home/Sisyphus/zhengbi-yong.github.io/scripts/deployment/deploy-compose-stack.sh)
- [scripts/deployment/validate-production-env.sh](/home/Sisyphus/zhengbi-yong.github.io/scripts/deployment/validate-production-env.sh)
- [deployments/nginx](/home/Sisyphus/zhengbi-yong.github.io/deployments/nginx)

Releases are uploaded into:

```text
/opt/blog-platform/
  current -> releases/<timestamp>
  releases/<timestamp>/
  shared/.env.production
```

This keeps runtime files versioned while preserving a stable env file path.

## Fast updates for an existing host

After the first successful deploy, use
[refresh-remote-compose.sh](/home/Sisyphus/zhengbi-yong.github.io/scripts/deployment/refresh-remote-compose.sh)
instead of re-running the full bootstrap flow:

```bash
bash scripts/deployment/refresh-remote-compose.sh \
  --target ubuntu@203.0.113.10 \
  --build-local-images
```

This fast path:

- reuses the existing remote `shared/.env.production`
- builds local images only when you ask it to
- skips streaming unchanged images by comparing local and remote image IDs
- uploads the latest runtime package
- restarts only the affected services instead of the whole stack
- uses explicit SSH connect/keepalive timeouts so hosts that stop returning the
  SSH banner fail fast instead of hanging for a long period

For frontend-only updates that already have fresh local images:

```bash
bash scripts/deployment/refresh-remote-compose.sh \
  --target ubuntu@203.0.113.10 \
  --image blog-frontend:local
```

## Optional bundled services

`docker-compose.production.yml` now supports:

- `ENABLE_BUNDLED_MAILPIT=true`
- `ENABLE_BUNDLED_MEILISEARCH=true`
- `ENABLE_BUNDLED_MINIO=true`

Mailpit is intended for bootstrap, staging, and low-friction internal deployments. For public production systems, external SMTP is still preferred.

## Parallel environments

The same host can run multiple isolated Compose environments as long as you vary:

- `COMPOSE_PROJECT_NAME`
- published ports such as `EDGE_HTTP_PORT`, `FRONTEND_PORT`, `BACKEND_PORT`, `POSTGRES_PORT`, `REDIS_PORT`
- the remote release root, for example `/opt/blog-platform-staging`

Example:

```bash
bash scripts/deployment/provision-compose-host.sh \
  --target ubuntu@203.0.113.10 \
  --remote-dir /opt/blog-platform-staging \
  --site-url http://203.0.113.10:18080 \
  --compose-project-name blog-platform-staging \
  --set-env EDGE_HTTP_PORT=18080 \
  --set-env FRONTEND_PORT=13101 \
  --set-env BACKEND_PORT=13100 \
  --set-env POSTGRES_PORT=25432 \
  --set-env REDIS_PORT=26379 \
  --image-source local \
  --configure-firewall
```

## Dry run mode

Both the env generator and remote deploy pipeline can be validated locally:

```bash
bash scripts/deployment/provision-compose-host.sh \
  --target ubuntu@203.0.113.10 \
  --dry-run
```

That generates the env file and deployment package without opening an SSH session.

## Operational constraints

- remote user must be `root` or have passwordless `sudo`
- the host must have outbound internet access to install Docker packages and pull OCI images
- if the image registry is private, authenticate Docker on the host before deploy
- local mode removes the registry dependency by building and streaming images over SSH
- for HTTPS, point a domain to the host and place TLS termination in front of the bundled edge proxy
- if system nginx already owns `80/443`, use [System Nginx Cutover](/home/Sisyphus/zhengbi-yong.github.io/docs/deployment/guides/server/system-nginx-cutover.md)

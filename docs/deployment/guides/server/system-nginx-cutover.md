# System Nginx Cutover

Use this guide when the host already runs a system nginx on `80/443` and you
want the new Compose stack to sit behind it with a clean rollback path.

## Why this exists

This solves the most common production transition problem:

- keep the old stack alive while the new Compose stack is validated on an alternate port
- switch public traffic without editing `/etc/nginx/sites-available/*` by hand
- preserve a timestamped backup that can be restored with one command

The cutover flow is implemented by:

- [cutover-system-nginx.sh](/home/Sisyphus/zhengbi-yong.github.io/scripts/deployment/cutover-system-nginx.sh)
- [rollback-system-nginx.sh](/home/Sisyphus/zhengbi-yong.github.io/scripts/deployment/rollback-system-nginx.sh)

## One-command production path

If the host already has system nginx and certbot-managed TLS, the lowest-friction
path is:

```bash
bash scripts/deployment/provision-compose-host.sh \
  --target ubuntu@203.0.113.10 \
  --site-url https://blog.example.com \
  --cutover-system-nginx
```

When `--cutover-system-nginx` is enabled, the provisioning script automatically:

- deploys the Compose stack first
- defaults the Compose edge to `127.0.0.1:18080` unless you override it
- switches system nginx to proxy public traffic to that edge
- stores a backup under `<remote-dir>/shared/system-nginx-backups/<timestamp>`

## Safe staged rollout

This is the recommended pattern for existing servers with a live legacy stack.

### 1. Deploy the new stack in parallel

```bash
bash scripts/deployment/provision-compose-host.sh \
  --target ubuntu@203.0.113.10 \
  --remote-dir /home/ubuntu/blog-platform-autopilot \
  --site-url http://203.0.113.10:18080 \
  --compose-project-name blog-platform-autopilot \
  --set-env EDGE_HTTP_PORT=18080 \
  --set-env FRONTEND_PORT=13101 \
  --set-env BACKEND_PORT=13100 \
  --set-env POSTGRES_PORT=25432 \
  --set-env REDIS_PORT=26379 \
  --image-source local \
  --configure-firewall
```

### 2. Verify the new stack on the server

```bash
ssh ubuntu@203.0.113.10 \
  'curl -sS -o /dev/null -w "%{http_code}\n" http://127.0.0.1:18080/readyz'
```

### 3. Cut public traffic over to the new stack

```bash
bash scripts/deployment/cutover-system-nginx.sh \
  --target ubuntu@203.0.113.10 \
  --remote-dir /home/ubuntu/blog-platform-autopilot
```

The script will:

- infer the upstream from `${REMOTE_DIR}/shared/.env.production`
- infer TLS settings from the current nginx configuration when possible
- disable conflicting enabled sites for the same `server_name`
- validate `nginx -t`
- reload nginx
- check `http://127.0.0.1/readyz` or `https://127.0.0.1/readyz` with the correct `Host` header

## Rollback

Rollback restores the latest backup by default:

```bash
bash scripts/deployment/rollback-system-nginx.sh \
  --target ubuntu@203.0.113.10 \
  --remote-dir /home/ubuntu/blog-platform-autopilot
```

To restore a specific backup:

```bash
bash scripts/deployment/rollback-system-nginx.sh \
  --target ubuntu@203.0.113.10 \
  --backup-path /home/ubuntu/blog-platform-autopilot/shared/system-nginx-backups/20260322T120000Z
```

## Recommended operating model

- Keep the Compose edge bound to loopback when system nginx owns `80/443`.
- Keep backend, frontend, PostgreSQL, Redis, Meilisearch, MinIO, and Mailpit on loopback too.
- Only remove the old stack after the new public route has been stable for at least one verification window.
- Treat the backup path printed by the cutover script as a release artifact.

## Current production example

For the current server used during validation:

```bash
bash scripts/deployment/cutover-system-nginx.sh \
  --target ubuntu@152.136.43.194 \
  --remote-dir /home/ubuntu/blog-platform-autopilot
```

Rollback:

```bash
bash scripts/deployment/rollback-system-nginx.sh \
  --target ubuntu@152.136.43.194 \
  --remote-dir /home/ubuntu/blog-platform-autopilot
```

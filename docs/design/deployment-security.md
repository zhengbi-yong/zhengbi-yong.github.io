# 部署与安全设计

> 当前使用 Docker Compose 和 Kubernetes 两种部署方式，以下描述以实际配置文件为准。

## 容器安全

### Docker 构建

```dockerfile
# backend/Dockerfile
FROM rust:1.92-slim-bookworm AS builder
WORKDIR /app
COPY . .
RUN cargo build --locked --release -p blog-api -p blog-worker

# 运行时最小镜像
FROM debian:bookworm-slim
COPY --from=builder /app/target/release/api /usr/local/bin/
COPY --from=builder /app/target/release/worker /usr/local/bin/
COPY --from=builder /app/target/release/migrate /usr/local/bin/
COPY --from=builder /app/target/release/create_admin /usr/local/bin/
COPY --from=builder /app/migrations /app/migrations
ENTRYPOINT ["dumb-init", "--"]
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:3000/.well-known/live
```

- 构建 4 个二进制: `api`, `worker`, `migrate`, `create_admin`
- 复制 `migrations/` 目录到运行时镜像
- 使用 `dumb-init` 确保信号正确转发

### 前端 Dockerfile

`frontend/Dockerfile` — 使用 `node:22-alpine` 多阶段构建，独立部署。

### Kubernetes 安全上下文

K8s base 配置 (`deployments/kubernetes/base/api-deployment.yaml`)：
- 未设置 `securityContext`
- 存活探针: `/livez:3000`（注：实际代码路由为 `/.well-known/live`，需要修正）
- 就绪探针: `/readyz:3000`（注：实际代码路由为 `/.well-known/ready`，需要修正）
- 密钥引用: `blog-runtime-secrets`

> 注：`deployments/k3s/blog-backend.yaml` 文件尚未创建。K3s 安全上下文配置（`runAsNonRoot`, `readOnlyRootFilesystem`, `capabilities.drop`）应补充到 K8s base 配置中。

## 健康检查

### 后端健康端点

| 路径 | 用途 | 说明 |
|------|------|------|
| `/.well-known/live` | 存活探针 | 只返回 200 |
| `/.well-known/ready` | 就绪探针 | 检查 DB/Redis/JWT/Email 连接 |
| `/health/detailed` | 详细健康 | JSON 格式各组件状态 |
| `/metrics` | Prometheus 指标 | 指标数据 |

> 注：实际 Dockerfile HEALTHCHECK 使用 `/healthz`（需修正为 `/.well-known/live`）。Docker Compose 生产配置的 healthcheck 使用 `/livez`（也需修正）。K8s base api-deployment.yaml 的 liveness/readiness 探针使用 `/livez` 和 `/readyz`（均需修正为 `/.well-known/live` 和 `/.well-known/ready`）。`/health` 端点未在 main.rs 中注册。

## 环境变量与密钥管理

```yaml
# 从 Secrets 挂载
envFrom:
  - secretRef:
      name: blog-runtime-secrets
```

所需环境变量：
- `DATABASE_URL` — PostgreSQL 连接串
- `REDIS_URL` — Redis 连接串
- `JWT_SECRET` — ≥32 字符
- `PASSWORD_PEPPER` — ≥32 字符
- `SESSION_SECRET`
- `CORS_ALLOWED_ORIGINS`
- `RUST_LOG`
- `ENVIRONMENT` (development/production)
- SMTP 配置（可选）
- `MEILISEARCH_MASTER_KEY`（搜索，可选）
- `MINIO_ACCESS_KEY` / `MINIO_SECRET_KEY`（媒体存储，可选）

## 备份策略

| 频率 | 内容 | 方式 |
|------|------|------|
| 每日 | PostgreSQL 全量备份 | `pg_dump` → MinIO/S3 |
| 每小时 | WAL 归档 | `archive_command` → MinIO/S3 |
| 持续 | Redis RDB 快照 | 配置 `save` 策略 |
| 按需 | 配置/密钥 | `kubectl get secret` + 加密存储 |

## 监控

| 组件 | 工具 | 说明 |
|------|------|------|
| 指标收集 | Prometheus | API `/metrics` + Node exporter |
| 可视化 | Grafana | 预定仪表盘 |
| 日志 | Loki | 集中日志聚合 |
| 告警 | Alertmanager | Slack/邮件通知 |

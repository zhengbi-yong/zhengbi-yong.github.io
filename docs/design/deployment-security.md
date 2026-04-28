# 部署与安全设计

> 当前使用 Docker Compose 和 Kubernetes 两种部署方式，以下描述以实际配置文件为准。

## 容器安全

### Docker 构建

```dockerfile
# backend/Dockerfile — 4 个构建阶段
# 1. builder: 编译所有二进制
FROM rust:1.92-slim-bookworm AS builder
WORKDIR /app
COPY . .
RUN cargo build --locked --release -p blog-api -p blog-worker

# 2. production: 最小运行时镜像（默认目标）
FROM debian:bookworm-slim AS production
COPY --from=builder /app/target/release/api /usr/local/bin/
COPY --from=builder /app/target/release/worker /usr/local/bin/
COPY --from=builder /app/target/release/migrate /usr/local/bin/
COPY --from=builder /app/target/release/create_admin /usr/local/bin/
COPY --from=builder /app/migrations /app/migrations
RUN groupadd -r rustuser && useradd -r -g rustuser -m -u 1000 rustuser
USER rustuser
ENTRYPOINT ["dumb-init", "--"]
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:3000/.well-known/live

# 3. local-runtime: 复用 production 阶段
FROM production AS local-runtime

# 4. development: 完整 Rust 工具链用于本地开发
FROM rust:1.92-slim-bookworm AS development
WORKDIR /app
COPY . .
RUN cargo build --locked -p blog-api -p blog-worker
CMD ["cargo", "run", "--bin", "api"]
```

- 构建 4 个二进制: `api`, `worker`, `migrate`, `create_admin`
- 复制 `migrations/` 目录到运行时镜像
- 使用 `dumb-init` 确保信号正确转发

### 前端 Dockerfile

`frontend/Dockerfile` — 使用 `node:22-alpine` 多阶段构建，独立部署。

### Kubernetes 安全上下文

K8s base 配置 (`deployments/kubernetes/base/api-deployment.yaml`)：
- 未设置 `securityContext`
- 存活探针: `/.well-known/live:3000` (initialDelaySeconds: 20, periodSeconds: 20)
- 就绪探针: `/.well-known/ready:3000` (initialDelaySeconds: 10, periodSeconds: 10)
- 密钥引用: `blog-runtime-secrets`

K3s 部署 (`deployments/k3s/blog-backend.yaml`) 计划中 — 当前使用 Kustomize base + overlay 模式。

> 注：K8s base 配置 (`deployments/kubernetes/base/api-deployment.yaml`) 的 securityContext 待补充（当前未设置）。生产部署应添加 `runAsNonRoot: true`、`readOnlyRootFilesystem: true`、`capabilities.drop: ["ALL"]`。

## 健康检查

### 后端健康端点

| 路径 | 用途 | 说明 |
|------|------|------|
| `/.well-known/live` | 存活探针 | 只返回 200 |
| `/.well-known/ready` | 就绪探针 | 检查 DB/Redis/JWT/Email 连接 |
| `/health/detailed` | 详细健康 | JSON 格式各组件状态 |
| `/metrics` | Prometheus 指标 | 指标数据 |
| `/api/v1/healthz` | 基本健康（API v1 下） | 返回 "OK" |
| `/api/v1/readyz` | 就绪探针（API v1 下） | 检查各组件状态 |

> **注意**：`/health` 路由在 `main.rs` 中不存在（仅 `/health/detailed` 在根级别注册）。`/livez`/`/readyz` 在脚本中广泛使用但实际路由为 `/.well-known/live`、`/.well-known/ready` 和 `/api/v1/healthz`、`/api/v1/readyz`。

## 环境变量与密钥管理

```yaml
# 从 Secrets 挂载
envFrom:
  - secretRef:
      name: blog-runtime-secrets
```

所需环境变量（完整列表见 `backend/crates/shared/src/config.rs` 中的 `Settings::from_env()`）：

**必需变量：**
- `DATABASE_URL` — PostgreSQL 连接串
- `REDIS_URL` — Redis 连接串
- `JWT_SECRET` — ≥32 字符
- `PASSWORD_PEPPER` — ≥32 字符
- `SMTP_USERNAME` — SMTP 用户名
- `SMTP_PASSWORD` — SMTP 密码
- `SMTP_FROM` — SMTP 发件人地址

**可选变量（带默认值）：**
- `CORS_ALLOWED_ORIGINS` — 逗号分隔的允许域名
- `RUST_LOG` — 日志级别（默认 `info`）
- `ENVIRONMENT` — 环境标识（`development` / `production`）
- `SERVER_HOST` — 监听地址（默认 `0.0.0.0`）
- `SERVER_PORT` — 监听端口（默认 `3000`）
- `DATABASE_REPLICA_URL` — 只读副本连接串

**连接池配置（可选）：**
- `DATABASE_POOL_MAX_CONNECTIONS` — 默认 `50`
- `DATABASE_POOL_MIN_CONNECTIONS` — 默认 `5`
- `DATABASE_POOL_ACQUIRE_TIMEOUT_SECS` — 默认 `5`
- `DATABASE_POOL_MAX_LIFETIME_SECS` — 默认 `1800`
- `DATABASE_POOL_IDLE_TIMEOUT_SECS` — 默认 `600`
- `REDIS_POOL_MAX_SIZE` — 默认 `10`
- `REDIS_POOL_WAIT_TIMEOUT_SECS` — 默认 `5`
- `REDIS_POOL_CREATE_TIMEOUT_SECS` — 默认 `5`
- `REDIS_POOL_RECYCLE_TIMEOUT_SECS` — 默认 `5`

**Worker 配置（可选）：**
- `WORKER_POLL_INTERVAL_SECS` — 默认 `5`
- `WORKER_BATCH_SIZE` — 默认 `100`
- `WORKER_LOCK_TIMEOUT_SECS` — 默认 `300`

**健康检查阈值（可选）：**
- `HEALTH_OUTBOX_PENDING_WARN_THRESHOLD` — 默认 `1000`
- `HEALTH_OUTBOX_PENDING_FAIL_THRESHOLD` — 默认 `5000`
- `HEALTH_OUTBOX_OLDEST_WARN_SECS` — 默认 `60`
- `HEALTH_OUTBOX_OLDEST_FAIL_SECS` — 默认 `300`

**存储后端（可选，默认 local）：**
- `STORAGE_BACKEND` — `local` 或 `minio`
- `STORAGE_LOCAL_PATH` — 本地路径（默认 `./uploads`）
- `STORAGE_LOCAL_URL` — 本地 URL 前缀（默认 `/uploads`）
- `MINIO_ENDPOINT` — MinIO 端点
- `MINIO_PUBLIC_URL` — MinIO 公开 URL
- `MINIO_ACCESS_KEY` — MinIO 访问密钥
- `MINIO_SECRET_KEY` — MinIO 密钥
- `MINIO_BUCKET` — MinIO 桶名
- `MINIO_REGION` — MinIO 区域（默认 `us-east-1`）

**搜索（可选）：**
- `MEILISEARCH_URL` — Meilisearch 端点
- `MEILISEARCH_MASTER_KEY` — Meilisearch 主密钥
- `MEILISEARCH_INDEX` — 索引名（默认 `posts`）
- `MEILISEARCH_AUTO_SYNC` — 自动同步（默认 `false`）

**OpenTelemetry（可选）：**
- `OTEL_ENABLED` — 是否启用（默认 `false`）
- `OTEL_EXPORTER_OTLP_ENDPOINT` — OTLP 端点
- `OTEL_SERVICE_NAME` — 服务名（默认 `blog-api`）
- `OTEL_SERVICE_VERSION` — 服务版本

**速率限制（可选）：**
- `RATE_LIMIT_AUTH_RPS` — 默认 `5`
- `RATE_LIMIT_AUTH_RPM` — 默认 `100`
- `RATE_LIMIT_VIEW_RPS` — 默认 `10`
- `RATE_LIMIT_VIEW_RPM` — 默认 `1000`
- `RATE_LIMIT_COMMENT_RPS` — 默认 `2`
- `RATE_LIMIT_COMMENT_RPM` — 默认 `20`
- `RATE_LIMIT_DEFAULT_RPS` — 默认 `100`
- `RATE_LIMIT_DEFAULT_RPM` — 默认 `6000`
- `RATE_LIMIT_FAILURE_MODE` — `fail_open` 或 `fail_closed`（默认 `fail_closed`）

**SMTP 配置（可选）：**
- `SMTP_HOST` — SMTP 服务器（默认 `localhost`）
- `SMTP_PORT` — 端口（默认 `587`）
- `SMTP_TLS` — 是否启用 TLS（默认 `true`）

> **注意**：`SESSION_SECRET` 在脚本中被使用但在代码中并未实际读取 — 会话由 JWT 管理。

## 备份策略

> ⚠️ **待实现**：以下备份策略描述目标方案，备份脚本尚未编写。当前仅 PostgreSQL 自动 WAL 归档和 Redis RDB 由各自进程原生支持。

| 频率 | 内容 | 方式 |
|------|------|------|
| 每日 | PostgreSQL 全量备份 | `pg_dump` → MinIO/S3（计划） |
| 每小时 | WAL 归档 | `archive_command` → MinIO/S3（计划） |
| 持续 | Redis RDB 快照 | 配置 `save` 策略（Redis 原生） |
| 按需 | 配置/密钥 | `kubectl get secret` + 加密存储（计划） |

## 监控

> ⚠️ **部分实现**：当前仅有 `/metrics` 端点提供 Prometheus 指标数据。Grafana、Loki、Alertmanager 等为计划中的组件。

| 组件 | 工具 | 说明 | 状态 |
|------|------|------|------|
| 指标收集 | Prometheus | API `/metrics` + Node exporter | ✅ 已实现 |
| 可视化 | Grafana | 预定仪表盘 | 📋 计划 |
| 日志 | Loki | 集中日志聚合 | 📋 计划 |
| 告警 | Alertmanager | Slack/邮件通知 | 📋 计划 |

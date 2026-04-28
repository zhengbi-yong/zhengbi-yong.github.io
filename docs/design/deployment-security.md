# 部署与安全设计

> 当前使用 Docker Compose 和 Kubernetes 两种部署方式，以下描述以实际配置文件为准。

## 容器安全

### Docker 构建

```dockerfile
# backend/Dockerfile
# syntax=docker/dockerfile:1

# 构建阶段
FROM rust:1.92-slim-bookworm AS builder
WORKDIR /app
COPY . .

ARG SQLX_OFFLINE=true
ENV SQLX_OFFLINE=$SQLX_OFFLINE

ARG DATABASE_URL=postgres://skip@localhost/skip
ENV DATABASE_URL=$DATABASE_URL

RUN cargo build --locked --release -p blog-api -p blog-worker

# 运行时最小镜像
FROM debian:bookworm-slim

LABEL org.label-schema.build-date=$BUILD_DATE \
      org.label-schema.vcs-ref=$VCS_REF \
      org.label-schema.version=$APP_VERSION

ARG APP_VERSION
ARG VCS_REF
ARG BUILD_DATE
ARG SQLX_OFFLINE
ARG DATABASE_URL
ARG SWAGGER_UI_DOWNLOAD_URL
ARG DEBIAN_APT_FORCE_HTTPS

# 强制 apt 使用 HTTPS 源
RUN if [ -n "$DEBIAN_APT_FORCE_HTTPS" ]; then \
        for f in /etc/apt/sources.list.d/*.sources /etc/apt/sources.list; do \
            [ -f "$f" ] && sed -i 's|http://|https://|g' "$f" 2>/dev/null || true; \
        done \
    fi

# 带重试逻辑的 apt-get 操作
RUN apt-get update && \
    for i in 1 2 3; do \
        apt-get install -y --no-install-recommends dumb-init ca-certificates curl && \
        break || \
        if [ $i -lt 3 ]; then sleep 5; else exit 1; fi; \
    done && \
    rm -rf /var/lib/apt/lists/*

COPY --from=builder /app/target/release/api /usr/local/bin/
COPY --from=builder /app/target/release/worker /usr/local/bin/
COPY --from=builder /app/target/release/migrate /usr/local/bin/
COPY --from=builder /app/target/release/create_admin /usr/local/bin/
COPY --from=builder /app/migrations /app/migrations

# 创建非 root 用户及所需目录
RUN groupadd -r rustuser && useradd -r -g rustuser -d /app -s /sbin/nologin rustuser && \
    mkdir -p /app/uploads /app/logs && \
    chown -R rustuser:rustuser /app

USER rustuser

EXPOSE 3000

ENTRYPOINT ["dumb-init", "--"]

# 注意：HEALTHCHECK 使用 /.well-known/live，但该端点在生产环境中已经实现，
# 见后端路由配置。
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
- 存活探针: `/.well-known/live:3000` (initialDelaySeconds: 20, periodSeconds: 20)
- 就绪探针: `/.well-known/ready:3000` (initialDelaySeconds: 10, periodSeconds: 10)
- 密钥引用: `blog-runtime-secrets`

K3s 部署 (`deployments/k3s/blog-backend.yaml`)：
- `runAsNonRoot: true` + `readOnlyRootFilesystem: true`
- `capabilities.drop: ["ALL"]`
- `tmpfs` 卷挂载 `/tmp`

> 注：K8s base 配置的 securityContext 待补充到与 K3s 一致。

## 健康检查

### 后端健康端点

| 路径 | 用途 | 说明 |
|------|------|------|
| `/.well-known/live` | 存活探针 | 只返回 200 |
| `/.well-known/ready` | 就绪探针 | 检查 DB/Redis/JWT/Email 连接 |
| `/health/detailed` | 详细健康 | JSON 格式各组件状态 |
| `/metrics` | Prometheus 指标 | 指标数据 |

> **注意**: Nginx Compose 配置中已修复健康探针路径。原配置使用 `/livez` 和 `/readyz`，现改为正确的 `/.well-known/live` 和 `/.well-known/ready`，与实际后端端点保持一致。

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
- `CORS_ALLOWED_METHODS` — 允许的 HTTP 方法，如 `GET,POST,PUT,DELETE,PATCH`
- `CORS_ALLOWED_HEADERS` — 允许的 HTTP 头，如 `Content-Type,Authorization`
- `RUST_LOG`
- `ENVIRONMENT` (development/production)
- SMTP 配置（可选）
- `SERVER_HOST` — 绑定地址，如 `0.0.0.0`
- `SERVER_PORT` — 监听端口，如 `3000`
- `RATE_LIMIT_REQUESTS` — 窗口内允许的最大请求数
- `RATE_LIMIT_WINDOW_SECS` — 限流窗口秒数
- `RATE_LIMIT_BURST` — 突发允许的额外请求数
- `RATE_LIMIT_CATEGORY_DEFAULT` — 默认分类的请求限制
- `RATE_LIMIT_CATEGORY_AUTH` — 认证接口的请求限制
- `RATE_LIMIT_CATEGORY_API` — API 接口的请求限制
- `RATE_LIMIT_CATEGORY_STATIC` — 静态资源的请求限制
- `STORAGE_BACKEND` — 存储后端类型，如 `local` 或 `minio`
- `STORAGE_LOCAL_PATH` — 本地存储路径
- `STORAGE_LOCAL_URL` — 本地存储的公开访问 URL
- `MINIO_ENDPOINT` — MinIO 服务地址
- `MINIO_REGION` — MinIO 区域
- `MINIO_BUCKET` — MinIO 存储桶名称
- `MINIO_ACCESS_KEY` — MinIO 访问密钥
- `MINIO_SECRET_KEY` — MinIO 秘密密钥
- `MEILISEARCH_HOST` — Meilisearch 服务地址
- `MEILISEARCH_API_KEY` — Meilisearch API 密钥
- `MEILISEARCH_INDEX` — Meilisearch 索引名称
- `MEILISEARCH_SEARCH_KEY` — Meilisearch 搜索密钥（前端使用）
- `FRONTEND_BLOG_DIR` — 前端博客静态文件目录
- `OTEL_SERVICE_NAME` — OpenTelemetry 服务名称
- `OTEL_EXPORTER_OTLP_ENDPOINT` — OTLP 导出端点
- `OTEL_EXPORTER_OTLP_PROTOCOL` — OTLP 导出协议（grpc/http）
- `OTEL_SDK_DISABLED` — 是否禁用 OpenTelemetry SDK
- `WORKER_CONCURRENCY` — 工作线程并发数
- `WORKER_QUEUE_POLL_INTERVAL` — 队列轮询间隔（毫秒）
- `WORKER_MAX_RETRIES` — 任务最大重试次数
- `HEALTH_OUTBOX_ENABLED` — 是否启用发件箱健康检查
- `HEALTH_OUTBOX_TIMEOUT` — 发件箱检查超时（秒）
- `HEALTH_OUTBOX_MAX_LAG` — 发件箱最大允许延迟（秒）
- `HEALTH_OUTBOX_INTERVAL` — 发件箱检查间隔（秒）
- `DATABASE_POOL_MIN` — 数据库连接池最小连接数
- `DATABASE_POOL_MAX` — 数据库连接池最大连接数
- `DATABASE_POOL_ACQUIRE_TIMEOUT` — 获取连接超时（秒）
- `DATABASE_POOL_IDLE_TIMEOUT` — 连接空闲超时（秒）
- `DATABASE_POOL_MAX_LIFETIME` — 连接最大生命周期（秒）
- `REDIS_POOL_MIN` — Redis 连接池最小连接数
- `REDIS_POOL_MAX` — Redis 连接池最大连接数
- `REDIS_POOL_ACQUIRE_TIMEOUT` — 获取 Redis 连接超时（秒）
- `REDIS_POOL_IDLE_TIMEOUT` — Redis 连接空闲超时（秒）

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

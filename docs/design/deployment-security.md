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
    CMD curl -f http://localhost:3000/.well-known/live || exit 1
```

- 构建 2 个二进制: `api`, `worker`（`migrate` 和 `create_admin` 也是构建产物，但 Dockerfile 复制了 4 个二进制到运行镜像）
- 复制 `migrations/` 目录到运行时镜像
- 使用 `dumb-init` 确保信号正确转发
- 健康检查路径: `/.well-known/live`（与 K8s 探针一致）

### 前端 Dockerfile

`frontend/Dockerfile` — 使用 `node:22-alpine` 多阶段构建，独立部署。

### Kubernetes 安全上下文

K8s base 配置 (`deployments/kubernetes/base/api-deployment.yaml`)：
- 未设置 `securityContext`（TODO：需补充 `runAsNonRoot: true`, `readOnlyRootFilesystem: true`, `capabilities.drop: ["ALL"]`）
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
| `/.well-known/live` | 存活探针 | 只返回 200（无外部依赖） |
| `/.well-known/ready` | 就绪探针 | 检查 DB/Redis/JWT/Email 连接（并行检查） |
| `/health` | 基本健康 | JSON 格式 `{"status":"healthy","version":"...","uptime_seconds":...}` |
| `/health/detailed` | 详细健康 | JSON 格式各组件状态（内存/CPU/连接池/Outbox） |
| `/readyz` | 就绪探针别名 | 同 `/.well-known/ready` |
| `/metrics` | Prometheus 指标 | 指标数据 |

## 环境变量与密钥管理

```yaml
# 从 Secrets 挂载
envFrom:
  - secretRef:
      name: blog-runtime-secrets
```

### 完整环境变量参考

配置通过 `backend/crates/shared/src/config.rs` 中的 `Settings::from_env()` 解析。所有配置项均支持环境变量覆盖。

| 环境变量 | 说明 | 默认值 |
|----------|------|--------|
| **核心运行时** | | |
| `ENVIRONMENT` | 运行环境 (development/production) | `development` |
| `RUST_LOG` | 日志级别 | `info` |
| `SERVER_HOST` | 监听地址 | `0.0.0.0` |
| `SERVER_PORT` | 监听端口 | `3000` |
| **数据库** | | |
| `DATABASE_URL` | PostgreSQL 连接串 | **必填** |
| `DATABASE_REPLICA_URL` | 只读副本连接串（可选） | 不设置则使用主库 |
| `DATABASE_POOL_MAX_CONNECTIONS` | 最大连接数 | `50` |
| `DATABASE_POOL_MIN_CONNECTIONS` | 最小连接数 | `5` |
| `DATABASE_POOL_ACQUIRE_TIMEOUT_SECS` | 获取连接超时(秒) | `5` |
| `DATABASE_POOL_MAX_LIFETIME_SECS` | 连接最大生命周期(秒) | `1800` |
| `DATABASE_POOL_IDLE_TIMEOUT_SECS` | 空闲超时(秒) | `600` |
| **Redis** | | |
| `REDIS_URL` | Redis 连接串 | **必填** |
| `REDIS_POOL_MAX_SIZE` | 连接池大小 | `10` |
| `REDIS_POOL_WAIT_TIMEOUT_SECS` | 等待连接超时(秒) | `5` |
| `REDIS_POOL_CREATE_TIMEOUT_SECS` | 创建连接超时(秒) | `5` |
| `REDIS_POOL_RECYCLE_TIMEOUT_SECS` | 回收连接超时(秒) | `5` |
| **认证** | | |
| `JWT_SECRET` | JWT 签名密钥（≥32 字符） | **必填** |
| `PASSWORD_PEPPER` | 密码胡椒（≥32 字符） | **必填** |
| **Worker** | | |
| `WORKER_POLL_INTERVAL_SECS` | CDC 轮询间隔(秒) | `5` |
| `WORKER_BATCH_SIZE` | 每批处理事件数 | `100` |
| `WORKER_LOCK_TIMEOUT_SECS` | 事件锁定超时(秒) | `300` |
| **频率限制** | | |
| `RATE_LIMIT_AUTH_RPS` | 认证请求每秒限制 | `5` |
| `RATE_LIMIT_AUTH_RPM` | 认证请求每分钟限制 | `100` |
| `RATE_LIMIT_VIEW_RPS` | 浏览请求每秒限制 | `10` |
| `RATE_LIMIT_VIEW_RPM` | 浏览请求每分钟限制 | `1000` |
| `RATE_LIMIT_COMMENT_RPS` | 评论请求每秒限制 | `2` |
| `RATE_LIMIT_COMMENT_RPM` | 评论请求每分钟限制 | `20` |
| `RATE_LIMIT_DEFAULT_RPS` | 默认每秒限制 | `100` |
| `RATE_LIMIT_DEFAULT_RPM` | 默认每分钟限制 | `6000` |
| `RATE_LIMIT_FAILURE_MODE` | 限流失败模式 (fail_open/fail_closed) | `fail_closed` |
| **存储** | | |
| `STORAGE_BACKEND` | 存储后端 (local/minio) | `local` |
| `STORAGE_LOCAL_PATH` | 本地存储路径 | `./uploads` |
| `STORAGE_LOCAL_URL` | 本地存储公开 URL | `/uploads` |
| **MinIO/S3** | | |
| `MINIO_ENDPOINT` | MinIO 端点 | `http://localhost:9000` |
| `MINIO_PUBLIC_URL` | MinIO 公开访问 URL | `http://localhost:9000` |
| `MINIO_ACCESS_KEY` | MinIO 访问密钥 | `minioadmin` |
| `MINIO_SECRET_KEY` | MinIO 密钥 | **按需设置** |
| `MINIO_BUCKET` | MinIO 存储桶 | `blog-uploads` |
| `MINIO_REGION` | MinIO 区域 | `us-east-1` |
| **搜索 (Meilisearch)** | | |
| `MEILISEARCH_URL` | Meilisearch 地址 | 不设置则不启用 |
| `MEILISEARCH_MASTER_KEY` | Meilisearch 主密钥 | 设置 URL 时必填 |
| `MEILISEARCH_INDEX` | 索引名称 | `posts` |
| `MEILISEARCH_AUTO_SYNC` | 启动时自动同步 | `false` |
| **可观测性** | | |
| `OTEL_ENABLED` | 是否启用 OpenTelemetry | `false` |
| `OTEL_EXPORTER_OTLP_ENDPOINT` | OTLP 导出端点 | `http://localhost:4318` |
| `OTEL_SERVICE_NAME` | 服务名称 | `blog-api` |
| `OTEL_SERVICE_VERSION` | 服务版本 | `0.1.0` |
| **健康检查** | | |
| `HEALTH_OUTBOX_PENDING_WARN_THRESHOLD` | Outbox 待处理警告阈值 | `1000` |
| `HEALTH_OUTBOX_PENDING_FAIL_THRESHOLD` | Outbox 待处理故障阈值 | `5000` |
| `HEALTH_OUTBOX_OLDEST_WARN_SECS` | Outbox 最旧事件警告秒数 | `60` |
| `HEALTH_OUTBOX_OLDEST_FAIL_SECS` | Outbox 最旧事件故障秒数 | `300` |
| **SMTP** | | |
| `SMTP_HOST` | SMTP 服务器地址 | `localhost` |
| `SMTP_PORT` | SMTP 端口 | `587` |
| `SMTP_USERNAME` | SMTP 用户名 | **必填** |
| `SMTP_PASSWORD` | SMTP 密码 | **必填** |
| `SMTP_FROM` | 发件人地址 | **必填** |
| `SMTP_TLS` | 启用 TLS | `true` |
| **CORS** | | |
| `CORS_ALLOWED_ORIGINS` | 允许的来源（逗号分隔，开发环境可用 `*`） | `https://yourdomain.com,https://www.yourdomain.com` |
| `CORS_ALLOWED_METHODS` | 允许的 HTTP 方法 | `GET,POST,PUT,DELETE,OPTIONS` |
| `CORS_ALLOWED_HEADERS` | 允许的 HTTP 头 | `Authorization,Content-Type,Accept,X-CSRF-Token` |

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

## Nginx 反向代理

实际配置位于 `deployments/nginx/nginx.conf` 和 `deployments/nginx/conf.d/blog.conf`。提供以下功能：

### 前端代理
- `location /` → `http://frontend:3001`（Next.js 前端）
- WebSocket 支持（`Upgrade`/`Connection` 头）
- Next.js 静态资源缓存（`/_next/static` → 365 天，`immutable`）
- 图片缓存（30 天）

### 后端 API 代理
- `location /v1/` → `http://backend:3000`（API）
- `location /admin/` → `http://backend:3000`（管理面板）
- CORS 头（开发环境允许所有来源）

### 安全头（HTTPS 配置，当前被注释）
- `Strict-Transport-Security`: `max-age=31536000; includeSubDomains`
- `X-Frame-Options`: `DENY`
- `X-Content-Type-Options`: `nosniff`
- `X-XSS-Protection`: `1; mode=block`
- `Referrer-Policy`: `strict-origin-when-cross-origin`

### 性能优化
- Gzip 压缩（级别 6，覆盖文本/JSON/JS/CSS/字体/SVG）
- `sendfile`, `tcp_nopush`, `tcp_nodelay` 启用
- `client_max_body_size`: 20MB
- `keepalive_timeout`: 65s

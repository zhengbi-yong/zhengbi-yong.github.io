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
- 存活探针: `/.well-known/live:3000` (initialDelaySeconds: 20, periodSeconds: 20)
- 就绪探针: `/.well-known/ready:3000` (initialDelaySeconds: 10, periodSeconds: 10)
- 密钥引用: `blog-runtime-secrets`

> ⚠️ K3s 专用配置文件 `deployments/k3s/blog-backend.yaml` 不存在（`deployments/k3s/` 目录已移除）。安全上下文配置（`runAsNonRoot: true`、`readOnlyRootFilesystem: true`、`capabilities.drop`）应直接在 K8s base 配置中设置。

## 安全头

Nginx 配置（`deployments/nginx/conf.d/blog.conf`）中的安全头目前**已注释掉**（第 48-53 行）：

```nginx
#     add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
#     add_header X-Frame-Options "DENY" always;
#     add_header X-Content-Type-Options "nosniff" always;
#     add_header X-XSS-Protection "1; mode=block" always;
#     add_header Referrer-Policy "strict-origin-when-cross-origin" always;
```

> ⚠️ 生产环境部署前需取消注释以上安全头配置。

## 健康检查

### 后端健康端点

| 路径 | 用途 | 说明 |
|------|------|------|
| `/.well-known/live` | 存活探针 | 只返回 200 |
| `/.well-known/ready` | 就绪探针 | 检查 DB/Redis/JWT/Email 连接 |
| `/health` | 基本健康 | 返回 "OK" — ⚠️ handler 已实现但未在路由表中注册（见 `metrics/health.rs`） |
| `/health/detailed` | 详细健康 | JSON 格式各组件状态 |
| `/metrics` | Prometheus 指标 | 指标数据 |

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
- `SERVER_HOST` — 监听地址（默认 0.0.0.0）
- `SERVER_PORT` — 监听端口（默认 3000）
- `RUST_LOG`
- `ENVIRONMENT` (development/production)
- SMTP 配置（可选）

> 注：`AGENTS.md` 提到生产环境 env 文件从 `.env.production.example` 生成。目前该文件存在于 `config/environments/backend/.env.production.example` 和 `config/environments/.env.production.example`，需确认生成流程是否正确引用路径。

## CORS 配置说明

`Settings.cors`（`CorsConfig` 结构体）包含三个字段：`allowed_origins`、`allowed_methods`、`allowed_headers`。但在 `main.rs` 的 `create_cors_layer()` 函数中，目前仅使用了 `allowed_origins` 字段；`allowed_methods` 和 `allowed_headers` 已在结构体中定义但未被 CorsLayer 创建时使用（方法列表和头列表被硬编码）。如需利用配置的字段，需修改 `create_cors_layer()`。

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

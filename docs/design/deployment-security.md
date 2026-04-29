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
- apt-get 安装含重试逻辑（最多 5 次尝试，支持 Acquire::Retries=10 和 No-Cache 选项），应对临时网络抖动
- 运行时镜像安装 `ca-certificates` 和 `curl`（用于健康检查）
- 使用 OCI 标签（org.opencontainers.image.title/description/version/revision/created）
- 创建非 root 用户 `rustuser`（uid=1000），运行时以非 root 身份运行
- 创建 `/app/uploads` 和 `/app/logs` 目录，权限归 `rustuser`

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

### 网络策略（Network Policy）

K3s 部署包含完整的零信任网络策略（`deployments/k3s/network-policy.yaml`）：

| 策略 | 作用 |
|------|------|
| `default-deny-all` | 默认拒绝所有入站和出站流量 |
| `allow-dns` | 允许所有 Pod 的 DNS 解析（kube-system 的 53 端口） |
| `allow-backend-to-postgres` | 允许 backend 访问 PostgreSQL（5432 端口） |
| `allow-backend-to-redis` | 允许 backend 访问 Redis（6379 端口） |
| `allow-frontend-to-backend` | 允许前端和 Ingress Controller（Traefik）访问 backend（3000 端口） |

> 注：Compose 部署无网络隔离，所有服务在同一 Docker 网络中互通。

### 安全响应头

> **已知缺口**：安全头（HSTS、X-Frame-Options、X-Content-Type-Options、X-XSS-Protection、Referrer-Policy）仅在 Nginx 配置中被注释掉的 HTTPS 服务器块中定义（第 49-53 行），当前激活的 HTTP 服务器（第 119-179 行）**未设置任何安全响应头**。生产环境切换到 HTTPS 时需要取消注释并确认生效。CSP（Content-Security-Policy）在任何 Nginx 块中均未配置。

## 健康检查

### 后端健康端点

| 路径 | 用途 | 说明 |
|------|------|------|
| `/.well-known/live` | 存活探针 | 只返回 200 |
| `/.well-known/ready` | 就绪探针 | 检查 DB/Redis/JWT/Email 连接 |
| `/health` | 基本健康 | 返回 JSON HealthStatus（status/timestamp/version/uptime） |
| `/health/detailed` | 详细健康 | JSON 格式各组件状态 |
| `/metrics` | Prometheus 指标 | 指标数据 |

## CORS 配置

> **重复 CORS 风险**：CORS 头同时在 Nginx（`deployments/nginx/conf.d/blog.conf`）和 Axum 应用层设置。
>
> - **Nginx**（HTTP 开发服务器，第 145-148 行）：对 `/api/v1/` 路径设置 `Access-Control-Allow-Origin *` 等头
> - **Axum**（`main.rs` 中 `create_cors_layer()`）：根据 `CORS_ALLOWED_ORIGINS` 环境变量配置（开发模式允许任意来源，生产模式严格校验）
>
> 当 Nginx 和 Axum 同时设置 CORS 头，浏览器可能因重复头导致行为异常或安全降级（Nginx 的 `*` 会覆盖 Axum 的严格限制）。建议只保留一层的 CORS 配置。另见 `backend/code-review-report.md`。

> **Nginx upstream 与 Docker DNS**：Nginx 配置中的 `proxy_pass http://backend:3000` 使用 Docker Compose 网络中的服务名 `backend` 进行 DNS 解析。在 Compose 环境下，Docker 内置 DNS 自动将 `backend` 解析为对应容器的 IP。但在独立或 Kubernetes 环境中，此 DNS 名称解析可能失败。Compose 部署依赖 Docker DNS 自动解析，无需手动配置 upstream 块；K8s 部署则使用 Service 名称和 Cluster DNS。如果 nginx 以容器方式运行但不在同一 Docker 网络中（如系统级 nginx），则需手动配置 `/etc/hosts` 或使用 upstream 块指向具体容器 IP。

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

> **已知缺口**：`SESSION_SECRET` 在文档中列为必需环境变量，但：Kubernetes `secret.example.yaml` 中未包含；K3s `blog-backend.yaml` 使用 `${SESSION_SECRET}` 变量引用（需外部填充）；Compose 的 prod `docker-compose.yml` 和环境模板中均未配置。仅后端 `.env.example` 文件中有占位值。建议在所有部署配置中补全。另见 `docs/reference/environment-vars.md`。

> **已知缺口**：Compose 的 prod `docker-compose.yml` 中 `DATABASE_URL` 直接硬编码 `***` 作为密码占位符（`postgresql://${POSTGRES_USER}:***@postgres:5432/${POSTGRES_DB}`），而非使用变量引用（如 `${DB_PASSWORD}`）。这意味着部署者必须手动替换该占位符，否则数据库连接将因密码无效而失败。

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

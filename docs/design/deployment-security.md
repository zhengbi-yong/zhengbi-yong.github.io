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

- `cargo build` 编译 `blog-api`, `blog-worker` 两个 crate，产生 `api` 和 `worker` 两个二进制
- `migrate` 和 `create_admin` 二进制由项目提供预编译产物，直接从 builder 镜像复制到运行时镜像
- 最终运行时镜像包含 4 个二进制: `api`, `worker`, `migrate`, `create_admin`
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
| `/health` | 基本健康 | 返回 "OK" |
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
- `RUST_LOG`
- `ENVIRONMENT` (development/production)
- SMTP 配置（可选）

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

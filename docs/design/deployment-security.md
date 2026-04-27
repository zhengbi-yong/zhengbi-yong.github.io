# 部署与安全设计

> 来源：ultradesign.md (7章)

## 容器安全

```yaml
# kubernetes/deployment.yaml
spec:
  template:
    spec:
      securityContext:
        runAsNonRoot: true
        runAsUser: 1000
        runAsGroup: 1000
        readOnlyRootFilesystem: true
        capabilities:
          capDrop: [ALL]           # 丢弃所有 capability

      # 临时文件用 tmpfs
      volumes:
        - name: tmp
          emptyDir:
            medium: Memory
      volumeMounts:
        - name: tmp
          mountPath: /tmp
```

## 重启策略

| 策略 | 适用 | 说明 |
|------|------|------|
| `Always` | 主服务 | 总是自动重启 |
| `OnFailure` | 一次性任务 | 只在上次退出码非 0 时重启 |
| `UnlessStopped` | 数据库 | 除非手动停止否则总是运行 |

## 健康检查

### 存活探针 (Liveness)

**只检查进程是否存活，不查外部依赖。**

```yaml
livenessProbe:
  httpGet:
    path: /.well-known/live
    port: 3000
  initialDelaySeconds: 5
  periodSeconds: 10
  failureThreshold: 3
```

- 用于 K8s 判断是否需要重启 Pod
- 网络抖动不应触发重启

### 就绪探针 (Readiness)

**可查 DB/Redis，确认能否接收流量。**

```yaml
readinessProbe:
  httpGet:
    path: /.well-known/ready
    port: 3000
  initialDelaySeconds: 10
  periodSeconds: 5
```

- 用于 K8s 判断是否接收流量
- DB 断开时停止接收，避免 500 响应

### 错误示范

```yaml
# 禁止: 将 pg_isready 作为存活探针
livenessProbe:
  exec:
    command: ["pg_isready"]  # 网络抖动会触发重启!
```

## 环境变量与密钥管理

### 禁止明文

```yaml
# 禁止!
env:
  - name: JWT_SECRET
    value: "super-secret-key"
```

### 正确做法

```yaml
# 从 Secrets 挂载
envFrom:
  - secretRef:
      name: app-secrets
env:
  - name: JWT_SECRET_FILE
    value: "/run/secrets/jwt_secret"
```

## Docker 多阶段构建

```dockerfile
# backend/Dockerfile
FROM rust:1.80 AS builder
WORKDIR /app
COPY Cargo.toml Cargo.lock ./
# 先编译依赖（利用缓存）
RUN mkdir src && echo "fn main() {}" > src/main.rs
RUN cargo build --release
# 再编译源码
COPY src/ ./src/
RUN cargo build --release

# 运行时: 最小镜像
FROM debian:bookworm-slim
COPY --from=builder /app/target/release/api /usr/local/bin/
# 只复制二进制，不带工具链
CMD ["/usr/local/bin/api"]
```

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

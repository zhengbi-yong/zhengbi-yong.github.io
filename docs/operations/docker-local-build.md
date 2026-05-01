# Docker 本地构建部署踩坑记录

记录在中国大陆网络环境下，使用 `docker-compose.local.yml` 从头构建并启动全套博客服务的完整过程和遇到的问题。

## 环境信息

- **项目**: zhengbi-yong.github.io
- **Compose 文件**: `docker-compose.local.yml`
- **服务器**: Linux (Ubuntu)，位于中国大陆
- **网络限制**: 无法直接访问 Docker Hub、GitHub、crates.io 等境外资源
- **代理**: 曾配置 `http://127.0.0.1:7890`，但不稳定（clash 进程频繁停止）

## 服务架构

```
┌──────────────────────────────────────────────────┐
│                docker-compose.local.yml            │
│                                                    │
│  ┌──────────┐  ┌──────────┐  ┌────────────────┐  │
│  │PostgreSQL │  │  Redis   │  │  Meilisearch   │  │
│  │  :5432   │  │  :6379   │  │    :7700       │  │
│  └──────────┘  └──────────┘  └────────────────┘  │
│                                                    │
│  ┌──────────┐  ┌──────────┐  ┌────────────────┐  │
│  │  MinIO   │  │ Mailpit  │  │  Migrate       │  │
│  │ :9000/01 │  │:1025/8025│  │  (run once)    │  │
│  └──────────┘  └──────────┘  └────────────────┘  │
│                                                    │
│  ┌──────────────────┐  ┌──────────────────────┐   │
│  │    API :3000     │  │   Frontend :3001     │   │
│  │  (blog-backend)  │  │  (blog-frontend)     │   │
│  └──────────────────┘  └──────────────────────┘   │
│                                                    │
│  ┌──────────────────┐                             │
│  │  Worker          │                             │
│  │  (blog-backend)  │                             │
│  └──────────────────┘                             │
└──────────────────────────────────────────────────┘
```

## 踩坑记录

### 坑 1：Docker Hub 镜像拉取失败

**现象**：
```
error pulling image configuration: download failed after attempts=6: 
dial tcp 104.18.124.25:443: i/o timeout
EOF
```

**原因**：中国大陆无法直接访问 Docker Hub。

**解决方案**：使用国内镜像源。在 Docker daemon 配置中添加：

```json
{
  "registry-mirrors": [
    "https://docker.1panel.live",
    "https://hub.rat.dev"
  ]
}
```

或者直接在 compose 文件中为每个服务指定 `image: docker.1panel.live/library/xxx`。

最终方案：使用 USTC 镜像（参见坑 3）。

---

### 坑 2：Swagger UI 下载失败

**现象**：后端 Dockerfile 构建时，下载 Swagger UI zip 失败：
```
curl: (7) Failed to connect to github.com port 443
```

**原因**：GitHub 在中国大陆不可达。

**解决方案**：提前下载 Swagger UI zip 文件，通过本地 HTTP 服务器提供：

```bash
# 1. 在有代理的环境下载（或手动上传）
wget https://github.com/swagger-api/swagger-ui/archive/refs/tags/v5.17.14.zip \
  -O swagger-ui-v5.17.14.zip

# 2. 在构建服务器上启动临时 HTTP 服务
python3 -m http.server 8888 &

# 3. 修改 Dockerfile 中的下载 URL
ARG SWAGGER_ZIP_URL="http://host.docker.internal:8888/swagger-ui-v5.17.14.zip"
```

---

### 坑 3：Cargo/Rust 依赖下载失败

**现象**：
```
error: failed to fetch `https://github.com/rust-lang/crates.io-index`
```

**原因**：crates.io 在中国大陆不可达。

**解决方案**：在 Dockerfile 中配置 USTC 镜像源：

```dockerfile
# Cargo 使用 USTC 镜像（sparse 协议）
ENV CARGO_REGISTRIES_CRATES_IO_PROTOCOL=sparse
ENV CARGO_REGISTRIES_CRATES_IO_INDEX=sparse+https://mirrors.ustc.edu.cn/crates.io-index/

# Debian APT 也使用 USTC 镜像
RUN sed -i 's/deb.debian.org/mirrors.ustc.edu.cn/g' /etc/apt/sources.list.d/debian.sources
```

**注意**：Cargo 必须使用 `sparse+https://` 协议才能正常使用 USTC 镜像。传统的 `git://` 协议可能不受支持。

---

### 坑 4：DNS 无法解析 USTC 镜像子域名

**现象**：主机上 `curl https://mirrors.ustc.edu.cn` 可正常访问，但 Docker 构建时（使用 `--network=host`）解析 `sparse+https://mirrors.ustc.edu.cn/crates.io-index/` 失败。

**原因**：主机的 `systemd-resolved` 对部分 USTC 子域名返回空结果，而 Docker 容器默认继承主机 DNS 配置。

**解决方案**：在 Dockerfile 中配置 Google DNS 或直接在构建命令中使用 `--network=host`：

```dockerfile
# 方式 1：在 Dockerfile 中设置 DNS
RUN echo "nameserver 8.8.8.8" > /etc/resolv.conf && \
    echo "nameserver 8.8.4.4" >> /etc/resolv.conf
```

或：

```bash
# 方式 2：构建时使用 host 网络
docker compose -f docker-compose.local.yml build --network=host
```

---

### 坑 5：代理不稳定

**现象**：最初配置了 `http://172.17.0.1:7890` 作为 Docker 容器内的代理访问国外源，但构建时频繁中断。

```
curl: (56) Recv failure: Connection reset by peer
curl: (7) Failed to connect to 172.17.0.1:7890
```

**原因**：代理服务（clash）在构建过程中停止或崩溃。

**决策**：**放弃代理，全面切换为国内镜像源**（USTC）。虽然配置更复杂，但避免了代理不稳定带来的构建失败。

**教训**：在中国大陆构建 Docker 镜像，优先使用国内镜像源而非代理。代理适用于快速测试，不适合长时间构建任务。

---

### 坑 6：SQLx 编译时类型推断错误（75 个错误）

**现象**：
```
error[E0282]: type annotations needed
  --> crates/api/src/routes/versions.rs:XX:XX
   |
XX |     .fetch_one(&pool)
   |      ^^^^^^^^^ cannot infer type
```

**原因**：SQLx 的宏 `sqlx::query_as!()` 在编译时需要连接数据库来推断返回类型。在 Docker 构建环境中没有数据库可连接，导致类型推断失败。

**解决方案**：在 Dockerfile 构建阶段使用 SQLx 离线模式：

```dockerfile
# 步骤 1：先安装 sqlx-cli 并连接本地数据库生成 .sqlx 缓存
# （仅在构建时需要，数据库必须可访问）
RUN cargo install sqlx-cli --no-default-features --features postgres
RUN DATABASE_URL="postgresql://blog_user:blog_password@host.docker.internal:5432/blog_db" \
    cargo sqlx prepare --workspace

# 步骤 2：启用离线模式编译
ENV SQLX_OFFLINE=true
RUN cargo build --release --bin api
```

**关键点**：
- `cargo sqlx prepare --workspace` 必须带 `--workspace` 参数，否则只处理根 crate
- 数据库密码**不是** `.env` 文件中的值，而是 compose 文件中实际使用的密码（`blog_password`）
- 生成的 `.sqlx/` 目录会缓存在 Docker 镜像层中

---

### 坑 7：数据库密码不一致

**现象**：使用 `.env` 文件中的密码连接数据库失败。

**原因**：`docker-compose.local.yml` 中硬编码了 `POSTGRES_PASSWORD=blog_password`，而 `.env` 文件中写的是另一个长密码。Docker Compose 的环境变量直接覆盖了 `.env` 文件中的值。

**诊断方法**：

```bash
# 查看实际运行容器的环境变量
docker inspect blog-postgres | jq '.[0].Config.Env'
```

**教训**：排查数据库连接问题时，**直接查看容器环境变量**，不要假定 `.env` 文件中的值就是实际使用的值。

---

### 坑 8：pnpm 符号链接损坏

**现象**：
```
Error: Cannot find module '../dist/pnpm.cjs'
```

**原因**：通过手动复制全局安装的 pnpm 到 Docker 镜像时，`node_modules/.bin/pnpm` 是一个符号链接，复制后链接目标丢失。

**解决方案**：使用 **corepack** 管理 pnpm，而不是手动复制：

```dockerfile
RUN npm install -g corepack@latest && \
    corepack enable && \
    corepack prepare pnpm@9.15.5 --activate
```

Corepack 会将 pnpm 正确安装为可执行文件，不依赖符号链接。

---

### 坑 9：前端构建 prebuilt-runner 阶段失败

**现象**：
```
COPY failed: file not found in build context or excluded by .dockerignore: 
stat /app/.next/standalone: file does not exist
```

**原因**：Dockerfile 中定义了 `prebuilt-runner` 阶段，期望从本地挂载预构建的 `.next/standalone` 目录，但本地没有该目录。

**解决方案**：构建时指定正确的目标阶段：

```bash
docker compose -f docker-compose.local.yml build --build-arg target=runner frontend
```

或在 compose 文件中明确指定构建目标：

```yaml
services:
  frontend:
    build:
      context: ./frontend
      target: runner   # 跳过 prebuilt-runner，直接构建 runner
```

---

### 坑 10：SMTP 环境变量缺失导致 API 启动失败

**现象**：API 容器健康检查失败，日志显示 SMTP 连接错误。

**原因**：`docker-compose.local.yml` 中未配置 SMTP 相关环境变量，后端启动时尝试连接 SMTP 服务器失败。

**解决方案**：配置 Mailpit 作为本地 SMTP 服务器：

```yaml
services:
  api:
    environment:
      SMTP_HOST: mailpit
      SMTP_PORT: 1025
      SMTP_USERNAME: ""
      SMTP_PASSWORD: ""
      SMTP_FROM: "noreply@blog.local"
```

Mailpit 在 1025 端口提供 SMTP 服务，8025 端口提供 Web 界面查看邮件。

---

## 正确的 Docker 构建流程

综合以上踩坑经验，正确的构建步骤：

```bash
# 1. 确保基础设施服务先启动（PostgreSQL、Redis 等）
docker compose -f docker-compose.local.yml up -d postgres redis meilisearch minio mailpit

# 2. 构建后端镜像（需要数据库连接来生成 .sqlx 缓存）
docker compose -f docker-compose.local.yml build backend

# 3. 构建前端镜像（指定 target: runner）
docker compose -f docker-compose.local.yml build frontend

# 4. 运行迁移
docker compose -f docker-compose.local.yml up -d migrate

# 5. 启动所有服务
docker compose -f docker-compose.local.yml up -d
```

## 常用诊断命令

```bash
# 查看所有服务状态
docker compose -f docker-compose.local.yml ps

# 查看 API 日志
docker compose -f docker-compose.local.yml logs -f api

# 健康检查
curl http://localhost:3000/health/detailed

# 数据库连接测试
docker compose -f docker-compose.local.yml exec postgres \
  psql -U blog_user -d blog_db -c "SELECT 1;"

# 清理重建（开发环境）
docker compose -f docker-compose.local.yml down -v
docker compose -f docker-compose.local.yml up -d --build
```

## 构建镜像大小参考

| 镜像 | 大小 | 说明 |
|------|------|------|
| `blog-backend:local` | ~200MB | Rust 编译产物，含 Swagger UI |
| `blog-frontend:local` | ~250MB | Next.js standalone 输出 |
| `postgres:17-alpine` | ~100MB | 基础设施 |
| `redis:7.4-alpine` | ~30MB | 基础设施 |

## 相关文件

- `docker-compose.local.yml` — 本地开发 compose 配置
- `backend/Dockerfile` — 后端构建配置（含 USTC 镜像、SQLx 离线模式）
- `frontend/Dockerfile` — 前端构建配置（corepack pnpm、runner 目标）
- `docs/migration/sqlx-checksum-troubleshooting.md` — SQLx checksum 问题详解

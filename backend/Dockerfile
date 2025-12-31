# =============================================================================
# Development Stage
# =============================================================================
FROM rustlang/rust:nightly-slim AS development

# 安装开发依赖
RUN apt-get update && apt-get install -y \
    pkg-config \
    libssl-dev \
    libpq-dev \
    curl \
    && rm -rf /var/lib/apt/lists/*

# 设置工作目录
WORKDIR /app

# 创建非 root 用户
RUN useradd -m -u 1000 rustuser && \
    chown -R rustuser:rustuser /app

# 复制所有源代码
COPY --chown=rustuser:rustuser . .

# 切换到非 root 用户
USER rustuser

# 构建所有二进制文件
RUN cargo build -p blog-api -p blog-worker

# 默认命令：直接运行应用
CMD ["cargo", "run", "--bin", "api"]

# =============================================================================
# Builder Stage
# =============================================================================
FROM rustlang/rust:nightly-slim AS builder

# 接受数据库URL作为构建参数
ARG DATABASE_URL

# 安装必要的系统依赖
RUN apt-get update && apt-get install -y \
    pkg-config \
    libssl-dev \
    libpq-dev \
    curl \
    && rm -rf /var/lib/apt/lists/*

# 设置工作目录
WORKDIR /app

# 复制所有源代码（包括 Cargo 文件和 SQLx 缓存）
COPY . .

# 如果没有提供DATABASE_URL，设置离线模式
RUN if [ -z "$DATABASE_URL" ]; then \
        echo "Building in offline mode (SQLX_OFFLINE=true)"; \
        export SQLX_OFFLINE=true; \
    else \
        echo "Building in online mode with DATABASE_URL"; \
        export DATABASE_URL="$DATABASE_URL"; \
    fi && \
    cargo build --release -p blog-api -p blog-worker

# =============================================================================
# Production Stage
# =============================================================================
FROM debian:bookworm-slim AS production

# 安装运行时依赖
RUN apt-get update && apt-get install -y \
    libpq5 \
    ca-certificates \
    curl \
    dumb-init \
    && rm -rf /var/lib/apt/lists/*

# 创建非 root 用户
RUN groupadd -r rustuser && \
    useradd -r -g rustuser -m -u 1000 rustuser

# 设置工作目录
WORKDIR /app

# 从构建阶段复制二进制文件
COPY --from=builder /app/target/release/api /usr/local/bin/
COPY --from=builder /app/target/release/worker /usr/local/bin/
COPY --from=builder /app/target/release/create_admin /usr/local/bin/

# 复制迁移文件
COPY --from=builder /app/migrations ./migrations

# 创建必要的目录
RUN mkdir -p /app/uploads /app/logs && \
    chown -R rustuser:rustuser /app

# 切换到非 root 用户
USER rustuser

# 暴露端口
EXPOSE 3000

# 健康检查
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:3000/health || exit 1

# 使用 dumb-init 作为 PID 1
ENTRYPOINT ["dumb-init", "--"]

# 启动应用
CMD ["api"]
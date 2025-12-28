# =============================================================================
# Development Stage
# =============================================================================
FROM rustlang/rust:nightly-bookworm-slim AS development

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

# 复制 Cargo 文件
COPY --chown=rustuser:rustuser Cargo.toml Cargo.lock ./
COPY --chown=rustuser:rustuser crates ./crates

# 切换到非 root 用户
USER rustuser

# 构建依赖
RUN cargo build

# 默认命令：直接运行应用
CMD ["cargo", "run", "--bin", "blog-api"]

# =============================================================================
# Builder Stage
# =============================================================================
FROM rustlang/rust:nightly-bookworm-slim AS builder

# 安装必要的系统依赖
RUN apt-get update && apt-get install -y \
    pkg-config \
    libssl-dev \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# 设置工作目录
WORKDIR /app

# 复制 Cargo 文件
COPY Cargo.toml Cargo.lock ./
COPY crates ./crates

# 创建虚拟 src 目录以缓存构建依赖
RUN mkdir -p src && \
    echo "fn main() {}" > src/main.rs && \
    mkdir -p crates/api/src && \
    echo "fn main() {}" > crates/api/src/lib.rs && \
    mkdir -p crates/core/src && \
    echo "fn main() {}" > crates/core/src/lib.rs && \
    mkdir -p crates/db/src && \
    echo "fn main() {}" > crates/db/src/lib.rs && \
    mkdir -p crates/shared/src && \
    echo "fn main() {}" > crates/shared/src/lib.rs && \
    mkdir -p crates/worker/src && \
    echo "fn main() {}" > crates/worker/src/lib.rs

# 构建依赖（缓存层）
RUN cargo build --release && \
    rm -rf src && \
    rm -rf crates/*/src

# 复制源代码
COPY . .

# 构建应用
RUN cargo build --release

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
COPY --from=builder /app/target/release/blog-api /usr/local/bin/
COPY --from=builder /app/target/release/worker /usr/local/bin/

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
CMD ["blog-api"]
FROM rust:1.92-slim-bookworm AS builder

ARG APP_VERSION=dev
ARG VCS_REF=local
ARG BUILD_DATE=unknown
ARG SQLX_OFFLINE=true
ARG DATABASE_URL=
ARG SWAGGER_UI_DOWNLOAD_URL=
ARG DEBIAN_APT_FORCE_HTTPS=false

RUN if [ "${DEBIAN_APT_FORCE_HTTPS}" = "true" ]; then \
      if [ -f /etc/apt/sources.list.d/debian.sources ]; then \
        sed -i 's|http://deb.debian.org|https://deb.debian.org|g' /etc/apt/sources.list.d/debian.sources; \
      elif [ -f /etc/apt/sources.list ]; then \
        sed -i 's|http://deb.debian.org|https://deb.debian.org|g' /etc/apt/sources.list; \
      fi; \
    fi

# 安装必要的系统依赖，并对临时网络抖动做重试
RUN set -eux; \
    attempts=0; \
    until [ "$attempts" -ge 5 ]; do \
      apt-get update \
        -o Acquire::Retries=10 \
        -o Acquire::http::No-Cache=true \
        -o Acquire::https::No-Cache=true \
        -o Acquire::BrokenProxy=true \
        && apt-get install -y --fix-missing --no-install-recommends \
        -o Acquire::Retries=10 \
        -o Acquire::http::No-Cache=true \
        -o Acquire::https::No-Cache=true \
        -o Acquire::BrokenProxy=true \
        pkg-config \
        libssl-dev \
        libpq-dev \
        curl \
        && break; \
      apt-get -f install -y || true; \
      dpkg --configure -a || true; \
      attempts=$((attempts + 1)); \
      rm -rf /var/lib/apt/lists/*; \
      sleep 5; \
    done; \
    [ "$attempts" -lt 5 ]; \
    rm -rf /var/lib/apt/lists/*

# 设置工作目录
WORKDIR /app

ENV SQLX_OFFLINE=${SQLX_OFFLINE}
ENV DATABASE_URL=${DATABASE_URL}

# 复制所有源代码（包括 Cargo 文件和 SQLx 缓存）
COPY . .

RUN set -eux; \
    if [ -n "${SWAGGER_UI_DOWNLOAD_URL}" ]; then \
      export SWAGGER_UI_DOWNLOAD_URL="${SWAGGER_UI_DOWNLOAD_URL}"; \
    else \
      unset SWAGGER_UI_DOWNLOAD_URL; \
    fi; \
    cargo build --locked --release -p blog-api -p blog-worker

# =============================================================================
# Production Stage
# =============================================================================
FROM debian:bookworm-slim AS production

ARG APP_VERSION=dev
ARG VCS_REF=local
ARG BUILD_DATE=unknown
ARG DEBIAN_APT_FORCE_HTTPS=false

LABEL org.opencontainers.image.title="blog-backend" \
      org.opencontainers.image.description="Rust API, worker, and migration runtime for the blog platform" \
      org.opencontainers.image.version="${APP_VERSION}" \
      org.opencontainers.image.revision="${VCS_REF}" \
      org.opencontainers.image.created="${BUILD_DATE}"

RUN if [ "${DEBIAN_APT_FORCE_HTTPS}" = "true" ]; then \
      if [ -f /etc/apt/sources.list.d/debian.sources ]; then \
        sed -i 's|http://deb.debian.org|https://deb.debian.org|g' /etc/apt/sources.list.d/debian.sources; \
      elif [ -f /etc/apt/sources.list ]; then \
        sed -i 's|http://deb.debian.org|https://deb.debian.org|g' /etc/apt/sources.list; \
      fi; \
    fi

# 安装运行时依赖，并对临时网络抖动做重试
RUN set -eux; \
    attempts=0; \
    until [ "$attempts" -ge 5 ]; do \
      apt-get update \
        -o Acquire::Retries=10 \
        -o Acquire::http::No-Cache=true \
        -o Acquire::https::No-Cache=true \
        -o Acquire::BrokenProxy=true \
        && apt-get install -y --fix-missing --no-install-recommends \
        -o Acquire::Retries=10 \
        -o Acquire::http::No-Cache=true \
        -o Acquire::https::No-Cache=true \
        -o Acquire::BrokenProxy=true \
        libpq5 \
        ca-certificates \
        curl \
        dumb-init \
        && break; \
      apt-get -f install -y || true; \
      dpkg --configure -a || true; \
      attempts=$((attempts + 1)); \
      rm -rf /var/lib/apt/lists/*; \
      sleep 5; \
    done; \
    [ "$attempts" -lt 5 ]; \
    rm -rf /var/lib/apt/lists/*

# 创建非 root 用户
RUN groupadd -r rustuser && \
    useradd -r -g rustuser -m -u 1000 rustuser

# 设置工作目录
WORKDIR /app

# 从构建阶段复制二进制文件
COPY --from=builder /app/target/release/api /usr/local/bin/
COPY --from=builder /app/target/release/worker /usr/local/bin/
COPY --from=builder /app/target/release/migrate /usr/local/bin/
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
    CMD curl -f http://localhost:3000/.well-known/live || exit 1

# 使用 dumb-init 作为 PID 1
ENTRYPOINT ["dumb-init", "--"]

# 启动应用
CMD ["api"]

# =============================================================================
# Local Runtime Stage
# Keep the historical local-runtime target name, but reuse the slim production
# runtime so local SSH deploys do not ship the full builder toolchain.
# =============================================================================
FROM production AS local-runtime

# =============================================================================
# Development Stage
# Keep this stage after production so classic Docker builders don't waste time
# building it when the target image is production.
# =============================================================================
FROM rust:1.92-slim-bookworm AS development

ARG SQLX_OFFLINE=true
ARG DATABASE_URL=
ARG SWAGGER_UI_DOWNLOAD_URL=
ARG DEBIAN_APT_FORCE_HTTPS=false

RUN if [ "${DEBIAN_APT_FORCE_HTTPS}" = "true" ]; then \
      if [ -f /etc/apt/sources.list.d/debian.sources ]; then \
        sed -i 's|http://deb.debian.org|https://deb.debian.org|g' /etc/apt/sources.list.d/debian.sources; \
      elif [ -f /etc/apt/sources.list ]; then \
        sed -i 's|http://deb.debian.org|https://deb.debian.org|g' /etc/apt/sources.list; \
      fi; \
    fi

RUN set -eux; \
    attempts=0; \
    until [ "$attempts" -ge 5 ]; do \
      apt-get update \
        -o Acquire::Retries=10 \
        -o Acquire::http::No-Cache=true \
        -o Acquire::https::No-Cache=true \
        -o Acquire::BrokenProxy=true \
        && apt-get install -y --fix-missing --no-install-recommends \
        -o Acquire::Retries=10 \
        -o Acquire::http::No-Cache=true \
        -o Acquire::https::No-Cache=true \
        -o Acquire::BrokenProxy=true \
        pkg-config \
        libssl-dev \
        libpq-dev \
        curl \
        && break; \
      apt-get -f install -y || true; \
      dpkg --configure -a || true; \
      attempts=$((attempts + 1)); \
      rm -rf /var/lib/apt/lists/*; \
      sleep 5; \
    done; \
    [ "$attempts" -lt 5 ]; \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

ENV SQLX_OFFLINE=${SQLX_OFFLINE}
ENV DATABASE_URL=${DATABASE_URL}

RUN useradd -m -u 1000 rustuser && \
    chown -R rustuser:rustuser /app

COPY --chown=rustuser:rustuser . .

USER rustuser

RUN set -eux; \
    if [ -n "${SWAGGER_UI_DOWNLOAD_URL}" ]; then \
      export SWAGGER_UI_DOWNLOAD_URL="${SWAGGER_UI_DOWNLOAD_URL}"; \
    else \
      unset SWAGGER_UI_DOWNLOAD_URL; \
    fi; \
    cargo build --locked -p blog-api -p blog-worker

CMD ["cargo", "run", "--bin", "api"]

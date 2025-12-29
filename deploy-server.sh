#!/usr/bin/env bash
# 服务器端部署脚本
# 在服务器上运行此脚本，拉取并启动所有服务

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() { echo -e "${GREEN}[INFO]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# 检查参数
if [ $# -lt 1 ]; then
    echo "用法: $0 <registry> [version]"
    echo ""
    echo "示例:"
    echo "  $0 docker.io/username"
    echo "  $0 docker.io/username v1.0.0"
    echo "  $0 registry.cn-hangzhou.aliyuncs.com/namespace"
    echo ""
    exit 1
fi

REGISTRY="$1"
VERSION="${2:-latest}"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  服务器部署脚本${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""
log_info "镜像仓库: $REGISTRY"
log_info "版本: $VERSION"
echo ""

# 检查 Docker
log_info "步骤 1/6: 检查 Docker 环境..."

if ! command -v docker &> /dev/null; then
    log_error "Docker 未安装"
    echo "请先安装 Docker: https://docs.docker.com/get-docker/"
    exit 1
fi

if ! docker info &> /dev/null; then
    log_error "Docker 服务未运行"
    echo "请启动 Docker: sudo systemctl start docker"
    exit 1
fi

log_info "Docker 环境检查通过 ✓"
echo ""

# 检查 Docker Compose
log_info "步骤 2/6: 检查 Docker Compose..."

if ! docker compose version &> /dev/null; then
    log_error "Docker Compose 未安装"
    echo "请先安装 Docker Compose"
    exit 1
fi

log_info "Docker Compose 检查通过 ✓"
echo ""

# 停止旧服务
log_info "步骤 3/6: 停止旧服务..."
docker compose down 2>/dev/null || true
log_info "旧服务已停止 ✓"
echo ""

# 清理端口
log_info "步骤 4/6: 清理端口占用..."
cleanup_port() {
    local port=$1
    local name=$2

    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
        log_warn "端口 $port ($name) 已被占用，正在清理..."
        lsof -ti :$port | xargs kill -9 2>/dev/null || true
        sleep 1
        log_info "端口 $port 已释放 ✓"
    fi
}

cleanup_port 3000 "后端"
cleanup_port 3001 "前端"
cleanup_port 5432 "数据库"
cleanup_port 6379 "Redis"
cleanup_port 80 "Nginx HTTP"
cleanup_port 443 "Nginx HTTPS"
log_info "端口清理完成 ✓"
echo ""

# 拉取镜像
log_info "步骤 5/6: 拉取镜像..."
echo "正在拉取:"
echo "  - $REGISTRY/blog-backend:$VERSION"
echo "  - $REGISTRY/blog-frontend:$VERSION"
echo ""

docker pull "$REGISTRY/blog-backend:$VERSION" &
docker pull "$REGISTRY/blog-frontend:$VERSION" &

wait

log_info "镜像拉取完成 ✓"
echo ""

# 更新 docker-compose.yml 使用远程镜像
log_info "步骤 6/6: 更新配置并启动服务..."

# 备份原配置
if [ -f docker-compose.yml ]; then
    cp docker-compose.yml docker-compose.yml.backup
fi

# 生成新的 docker-compose.yml
cat > docker-compose.prod.yml << EOF
# 生产环境 Docker Compose 配置
# 使用远程镜像，无需本地构建

services:
  # PostgreSQL 数据库
  postgres:
    image: postgres:17-alpine
    container_name: blog-postgres
    restart: unless-stopped
    environment:
      POSTGRES_USER: \${POSTGRES_USER:-blog_user}
      POSTGRES_PASSWORD: \${POSTGRES_PASSWORD:-blog_password}
      POSTGRES_DB: \${POSTGRES_DB:-blog_db}
      PGDATA: /var/lib/postgresql/data/pgdata
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./backend/migrations:/docker-entrypoint-initdb.d:ro
    ports:
      - "\${POSTGRES_PORT:-5432}:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U \${POSTGRES_USER:-blog_user} -d \${POSTGRES_DB:-blog_db}"]
      interval: 10s
      timeout: 5s
      retries: 5
    networks:
      - blog-network

  # Redis 缓存
  redis:
    image: redis:7.4-alpine
    container_name: blog-redis
    restart: unless-stopped
    command: redis-server --appendonly yes
    volumes:
      - redis_data:/data
    ports:
      - "\${REDIS_PORT:-6379}:6379"
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5
    networks:
      - blog-network

  # 后端 API
  backend:
    image: $REGISTRY/blog-backend:$VERSION
    container_name: blog-backend
    restart: unless-stopped
    environment:
      DATABASE_URL: postgresql://\${POSTGRES_USER:-blog_user}:\${POSTGRES_PASSWORD:-blog_password}@postgres:5432/\${POSTGRES_DB:-blog_db}
      REDIS_URL: redis://redis:6379
      HOST: 0.0.0.0
      PORT: 3000
      ENVIRONMENT: production
      RUST_LOG: \${RUST_LOG:-info}
      JWT_SECRET: \${JWT_SECRET}
      PASSWORD_PEPPER: \${PASSWORD_PEPPER}
      SESSION_SECRET: \${SESSION_SECRET}
      CORS_ALLOWED_ORIGINS: \${CORS_ALLOWED_ORIGINS:-https://zhengbi-yong.top}
      RATE_LIMIT_PER_MINUTE: \${RATE_LIMIT_PER_MINUTE:-60}
    ports:
      - "\${BACKEND_PORT:-3000}:3000"
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
    networks:
      - blog-network

  # 前端
  frontend:
    image: $REGISTRY/blog-frontend:$VERSION
    container_name: blog-frontend
    restart: unless-stopped
    environment:
      NODE_ENV: production
      PORT: 3001
      NEXT_PUBLIC_API_URL: http://backend:3000
      NEXT_PUBLIC_SITE_URL: \${NEXT_PUBLIC_SITE_URL:-https://zhengbi-yong.top}
    ports:
      - "\${FRONTEND_PORT:-3001}:3001"
    depends_on:
      backend:
        condition: service_healthy
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3001"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 60s
    networks:
      - blog-network

  # Nginx 反向代理
  nginx:
    image: nginx:1.27-alpine
    container_name: blog-nginx
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - ./nginx/conf.d:/etc/nginx/conf.d:ro
      - ./nginx/ssl:/etc/nginx/ssl:ro
      - nginx_logs:/var/log/nginx
    depends_on:
      - frontend
      - backend
    networks:
      - blog-network

volumes:
  postgres_data:
    driver: local
  redis_data:
    driver: local
  nginx_logs:
    driver: local

networks:
  blog-network:
    driver: bridge
EOF

# 生成 .env 文件（如果不存在）
if [ ! -f .env ]; then
    log_info "生成 .env 文件..."

    JWT_SECRET=$(openssl rand -base64 32 | tr -d '/+=') 2>/dev/null || echo "change-this-jwt-secret"
    PASSWORD_PEPPER=$(openssl rand -base64 32 | tr -d '/+=') 2>/dev/null || echo "change-this-pepper"
    SESSION_SECRET=$(openssl rand -base64 32 | tr -d '/+=') 2>/dev/null || echo "change-this-session-secret"
    POSTGRES_PASSWORD=$(openssl rand -base64 16 | tr -d '/+=') 2>/dev/null || echo "change-this-postgres-password"

    cat > .env << EOF
# 系统配置
ENVIRONMENT=production
TZ=Asia/Shanghai
RUST_LOG=info

# 端口配置
FRONTEND_PORT=3001
BACKEND_PORT=3000
POSTGRES_PORT=5432
REDIS_PORT=6379

# 数据库配置
POSTGRES_USER=blog_user
POSTGRES_PASSWORD=$POSTGRES_PASSWORD
POSTGRES_DB=blog_db

# 安全配置
JWT_SECRET=$JWT_SECRET
PASSWORD_PEPPER=$PASSWORD_PEPPER
SESSION_SECRET=$SESSION_SECRET

# CORS配置
CORS_ALLOWED_ORIGINS=https://zhengbi-yong.top

# 限流配置
RATE_LIMIT_PER_MINUTE=60

# 域名配置
NEXT_PUBLIC_SITE_URL=https://zhengbi-yong.top
EOF

    log_info ".env 文件已生成 ✓"
    log_warn "请修改 .env 文件中的安全配置！"
else
    log_info ".env 文件已存在，跳过生成"
fi

# 启动服务
log_info "启动所有服务..."
docker compose -f docker-compose.prod.yml up -d

log_info "等待服务启动..."
sleep 15

echo ""
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  部署完成！${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# 显示服务状态
docker compose -f docker-compose.prod.yml ps

echo ""
log_info "访问地址："
echo "  前端: https://zhengbi-yong.top"
echo "  后端: https://zhengbi-yong.top/v1/"
echo "  管理: https://zhengbi-yong.top/admin/"
echo ""
log_info "查看日志:"
echo "  docker compose -f docker-compose.prod.yml logs -f"
echo ""
log_info "查看状态:"
echo "  docker compose -f docker-compose.prod.yml ps"
echo ""

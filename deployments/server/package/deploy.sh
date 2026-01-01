#!/bin/bash
# 在服务器上部署博客系统

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() { echo -e "${GREEN}[INFO]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  博客系统部署脚本${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# 检查是否在项目根目录
if [ ! -f "docker-compose.server.yml" ]; then
    log_error "未找到 docker-compose.server.yml，请确保在项目根目录运行此脚本"
    exit 1
fi

# 1. 检查环境变量文件
log_info "步骤 1/6: 检查环境变量配置..."
if [ ! -f ".env" ]; then
    log_warn ".env 文件不存在"
    if [ -f ".env.server.example" ]; then
        log_info "从 .env.server.example 创建 .env 文件..."
        cp .env.server.example .env
        log_warn "请编辑 .env 文件，修改安全配置（JWT_SECRET, PASSWORD_PEPPER, SESSION_SECRET）"
        log_warn "编辑完成后按回车继续..."
        read
    else
        log_error "未找到 .env.server.example"
        exit 1
    fi
else
    log_info ".env 文件已存在 ✓"
fi
echo ""

# 2. 创建必要的目录
log_info "步骤 2/6: 创建必要的目录..."
mkdir -p nginx/conf.d
mkdir -p nginx/ssl
mkdir -p uploads
mkdir -p logs
log_info "目录创建完成 ✓"
echo ""

# 3. 创建 Nginx 配置
log_info "步骤 3/6: 配置 Nginx..."
if [ ! -f "nginx/nginx.conf" ]; then
    log_info "创建默认 Nginx 配置..."
    cat > nginx/nginx.conf << 'EOF'
user nginx;
worker_processes auto;
error_log /var/log/nginx/error.log warn;
pid /var/run/nginx.pid;

events {
    worker_connections 1024;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                    '$status $body_bytes_sent "$http_referer" '
                    '"$http_user_agent" "$http_x_forwarded_for"';

    access_log /var/log/nginx/access.log main;

    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;
    types_hash_max_size 2048;

    # Gzip 压缩
    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types text/plain text/css text/xml text/javascript
               application/json application/javascript application/xml+rss
               application/rss+xml font/truetype font/opentype
               application/vnd.ms-fontobject image/svg+xml;

    # 包含站点配置
    include /etc/nginx/conf.d/*.conf;
}
EOF
    log_info "Nginx 主配置文件已创建 ✓"
fi

if [ ! -f "nginx/conf.d/default.conf" ]; then
    log_info "创建默认站点配置..."
    cat > nginx/conf.d/default.conf << 'EOF'
server {
    listen 80;
    server_name localhost;

    # 前端
    location / {
        proxy_pass http://frontend:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # 后端 API
    location /api {
        proxy_pass http://backend:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
EOF
    log_info "站点配置文件已创建 ✓"
fi
echo ""

# 4. 检查 Docker 镜像
log_info "步骤 4/6: 检查 Docker 镜像..."
docker images | grep -E 'blog-backend:local|blog-frontend:local' || {
    log_error "未找到本地镜像，请先运行: bash ~/blog-deployment/import-images.sh"
    exit 1
}
log_info "Docker 镜像检查通过 ✓"
echo ""

# 5. 启动服务
log_info "步骤 5/6: 启动 Docker 服务..."
docker compose -f docker-compose.server.yml up -d
log_info "服务启动完成 ✓"
echo ""

# 6. 显示服务状态
log_info "步骤 6/6: 检查服务状态..."
sleep 5
docker compose -f docker-compose.server.yml ps
echo ""

log_info "部署完成！"
echo ""
echo -e "${YELLOW}服务访问地址:${NC}"
echo "  前端: http://localhost:3001"
echo "  后端: http://localhost:3000"
echo ""
echo -e "${YELLOW}查看日志:${NC}"
echo "  所有服务: docker compose -f docker-compose.server.yml logs -f"
echo "  后端: docker compose -f docker-compose.server.yml logs -f backend"
echo "  前端: docker compose -f docker-compose.server.yml logs -f frontend"
echo ""
echo -e "${YELLOW}常用命令:${NC}"
echo "  停止服务: docker compose -f docker-compose.server.yml down"
echo "  重启服务: docker compose -f docker-compose.server.yml restart"
echo "  查看状态: docker compose -f docker-compose.server.yml ps"
echo ""

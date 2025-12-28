#!/usr/bin/env bash
# 简化版一键部署脚本 - 绕过配置验证

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log_info() { echo -e "${GREEN}[INFO]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# 获取脚本所在目录的绝对路径（兼容多种shell）
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="${SCRIPT_DIR}"
cd "$PROJECT_ROOT"

# 1. 检查环境
log_info "检查Docker环境..."

# 检查 Docker 是否可用
if command -v docker &> /dev/null; then
    DOCKER_CMD="docker"
elif [ -x "/usr/bin/docker" ]; then
    DOCKER_CMD="/usr/bin/docker"
else
    log_error "Docker未安装或不在PATH中"
    echo "请安装Docker: https://docs.docker.com/get-docker/"
    exit 1
fi

# 验证 Docker 可以运行
if ! $DOCKER_CMD info &> /dev/null; then
    log_error "Docker无法运行，请检查Docker服务状态"
    echo "尝试: sudo systemctl start docker"
    echo "或: sudo service docker start"
    exit 1
fi

log_info "Docker环境检查通过 ✓"

# 2. 停止旧服务
log_info "停止旧服务..."
$DOCKER_CMD compose down 2>/dev/null || true

# 3. 清理端口
log_info "清理端口占用..."
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

# 4. 生成.env文件（如果不存在）
if [ ! -f .env ]; then
    log_info "生成.env文件..."

    JWT_SECRET=$(openssl rand -base64 32 | tr -d '/+=')
    PASSWORD_PEPPER=$(openssl rand -base64 32 | tr -d '/+=')
    SESSION_SECRET=$(openssl rand -base64 32 | tr -d '/+=')
    POSTGRES_PASSWORD=$(openssl rand -base64 16 | tr -d '/+=')

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

# Redis配置
REDIS_PASSWORD=

# 安全配置
JWT_SECRET=$JWT_SECRET
PASSWORD_PEPPER=$PASSWORD_PEPPER
SESSION_SECRET=$SESSION_SECRET

# CORS配置
CORS_ALLOWED_ORIGINS=http://localhost:3001,https://zhengbi-yong.top

# 限流配置
RATE_LIMIT_PER_MINUTE=60

# 域名配置
NEXT_PUBLIC_SITE_URL=https://zhengbi-yong.top
NEXT_PUBLIC_API_URL=http://localhost:3000
SERVER_IP=152.136.43.194

# SSL配置
FORCE_HTTPS=false

# 备份配置
BACKUP_ENABLED=true
BACKUP_DIRECTORY=./backups
BACKUP_RETENTION_DAYS=30
EOF
    log_info ".env文件已生成 ✓"
else
    log_info ".env文件已存在，跳过生成"
fi

# 5. 启动服务
log_info "启动所有服务..."
$DOCKER_CMD compose up -d

# 6. 等待服务健康
log_info "等待服务启动..."
sleep 10

# 7. 显示状态
echo ""
log_info "部署完成！"
echo ""
$DOCKER_CMD compose ps
echo ""
log_info "访问地址："
echo "  前端: https://zhengbi-yong.top"
echo "  后端: https://zhengbi-yong.top/v1/"
echo "  管理: https://zhengbi-yong.top/admin/"
echo ""
log_info "查看日志: $DOCKER_CMD compose logs -f"

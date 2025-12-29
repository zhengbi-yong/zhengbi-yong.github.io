#!/usr/bin/env bash
# 测试本地构建的镜像

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() { echo -e "${GREEN}[INFO]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# 获取脚本所在目录的绝对路径
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="${SCRIPT_DIR}"
cd "$PROJECT_ROOT"

# 检查 Docker 是否可用
if command -v docker &> /dev/null; then
    DOCKER_CMD="docker"
elif [ -x "/usr/bin/docker" ]; then
    DOCKER_CMD="/usr/bin/docker"
else
    log_error "Docker未安装或不在PATH中"
    exit 1
fi

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  测试本地构建的镜像${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# 1. 检查镜像是否存在
log_info "步骤 1/3: 检查镜像是否存在..."
if ! $DOCKER_CMD images | grep -q "blog-backend.*local"; then
    log_error "blog-backend:local 镜像不存在，请先运行: bash build-all.sh"
    exit 1
fi

if ! $DOCKER_CMD images | grep -q "blog-frontend.*local"; then
    log_error "blog-frontend:local 镜像不存在，请先运行: bash build-all.sh"
    exit 1
fi

log_info "所有镜像存在 ✓"
echo ""

# 2. 使用本地镜像启动服务
log_info "步骤 2/3: 启动测试环境..."

# 停止现有服务
$DOCKER_CMD compose down 2>/dev/null || true

# 更新 docker-compose.yml 使用本地镜像
cp docker-compose.yml docker-compose.yml.backup

# 临时修改使用本地镜像
sed -i 's|build:|# build:|g' docker-compose.yml
sed -i 's|context: ./backend|# context: ./backend|g' docker-compose.yml
sed -i 's|context: ./frontend|# context: ./frontend|g' docker-compose.yml
sed -i 's|dockerfile: Dockerfile|# dockerfile: Dockerfile|g' docker-compose.yml
sed -i '/^\s*backend:/,/^\s*$/s|image: .*|image: blog-backend:local|' docker-compose.yml
sed -i '/^\s*frontend:/,/^\s*$/s|image: .*|image: blog-frontend:local|' docker-compose.yml

# 启动服务
$DOCKER_CMD compose up -d

log_info "服务启动中..."
sleep 15

echo ""
log_info "步骤 3/3: 检查服务状态..."
echo ""

# 显示容器状态
echo -e "${BLUE}容器状态:${NC}"
$DOCKER_CMD compose ps
echo ""

# 健康检查
log_info "健康检查:"

# 检查 PostgreSQL
if $DOCKER_CMD compose exec -T postgres pg_isready -U blog_user > /dev/null 2>&1; then
    echo -e "  ${GREEN}✓${NC} PostgreSQL"
else
    echo -e "  ${RED}✗${NC} PostgreSQL"
fi

# 检查 Redis
if $DOCKER_CMD compose exec -T redis redis-cli ping > /dev/null 2>&1; then
    echo -e "  ${GREEN}✓${NC} Redis"
else
    echo -e "  ${RED}✗${NC} Redis"
fi

# 检查 Backend
if curl -sf http://localhost:3000/health > /dev/null 2>&1; then
    echo -e "  ${GREEN}✓${NC} Backend"
else
    echo -e "  ${YELLOW}⚠${NC} Backend (可能还在启动中)"
fi

# 检查 Frontend
if curl -sf http://localhost:3001 > /dev/null 2>&1; then
    echo -e "  ${GREEN}✓${NC} Frontend"
else
    echo -e "  ${YELLOW}⚠${NC} Frontend (可能还在启动中)"
fi

echo ""
log_info "测试完成！"
echo ""
echo -e "${YELLOW}查看日志:${NC}"
echo "  $DOCKER_CMD compose logs -f"
echo ""
echo -e "${YELLOW}停止服务:${NC}"
echo "  $DOCKER_CMD compose down"
echo "  mv docker-compose.yml.backup docker-compose.yml"
echo ""

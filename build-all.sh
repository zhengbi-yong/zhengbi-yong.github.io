#!/usr/bin/env bash
# 本地构建所有 Docker 镜像
# 在本地电脑上运行此脚本，构建所有镜像并准备好推送到服务器

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
echo -e "${BLUE}  本地构建所有 Docker 镜像${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# 1. 拉取基础镜像
log_info "步骤 1/4: 拉取所有基础镜像..."
echo "正在拉取:"
echo "  - postgres:17-alpine"
echo "  - redis:7.4-alpine"
echo "  - nginx:1.27-alpine"
echo "  - rustlang/rust:nightly-slim"
echo "  - node:22-alpine"
echo "  - debian:bookworm-slim"
echo ""

$DOCKER_CMD pull postgres:17-alpine &
$DOCKER_CMD pull redis:7.4-alpine &
$DOCKER_CMD pull nginx:1.27-alpine &
$DOCKER_CMD pull rustlang/rust:nightly-slim &
$DOCKER_CMD pull node:22-alpine &
$DOCKER_CMD pull debian:bookworm-slim &
wait

log_info "所有基础镜像拉取完成 ✓"
echo ""

# 2. 构建 Backend 镜像
log_info "步骤 2/4: 构建 Backend 镜像..."
cd backend
$DOCKER_CMD build -t blog-backend:local -t blog-backend:latest -f Dockerfile .
log_info "Backend 镜像构建完成 ✓"
echo ""

# 3. 构建 Frontend 镜像
log_info "步骤 3/4: 构建 Frontend 镜像..."
cd "$PROJECT_ROOT/frontend"
$DOCKER_CMD build -t blog-frontend:local -t blog-frontend:latest -f Dockerfile .
log_info "Frontend 镜像构建完成 ✓"
echo ""

# 4. 验证镜像
log_info "步骤 4/4: 验证构建的镜像..."
echo ""
echo -e "${BLUE}构建的镜像:${NC}"
$DOCKER_CMD images | grep -E "REPOSITORY|blog-backend|blog-frontend"
echo ""

# 显示镜像大小
log_info "镜像信息:"
echo ""
$DOCKER_CMD images blog-backend:local --format "  blog-backend: {{.Tag}} - {{.Size}}"
$DOCKER_CMD images blog-frontend:local --format "  blog-frontend: {{.Tag}} - {{.Size}}"
echo ""

log_info "本地构建完成！"
echo ""
echo -e "${YELLOW}下一步操作:${NC}"
echo "  1. 测试镜像: bash test-local.sh"
echo "  2. 推送到仓库: bash push-images.sh"
echo "  3. 导出镜像: bash export-images.sh"
echo ""

#!/usr/bin/env bash
# 推送镜像到 Docker Hub 或阿里云容器镜像服务
# 配置好 registry 后运行此脚本

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

# 读取配置（如果存在）
if [ -f .docker-registry ]; then
    source .docker-registry
else
    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE}  配置 Docker 镜像仓库${NC}"
    echo -e "${BLUE}========================================${NC}"
    echo ""

    echo "选择镜像仓库:"
    echo "  1) Docker Hub (https://hub.docker.com)"
    echo "  2) 阿里云容器镜像服务 (https://cr.console.aliyun.com)"
    echo "  3) 其他私有仓库"
    echo ""
    read -p "请选择 [1-3]: " registry_choice

    case $registry_choice in
        1)
            read -p "请输入 Docker Hub 用户名: " DOCKER_USERNAME
            REGISTRY="docker.io/$DOCKER_USERNAME"
            ;;
        2)
            read -p "请输入阿里云命名空间: " ALIYUN_NAMESPACE
            REGISTRY="registry.cn-hangzhou.aliyuncs.com/$ALIYUN_NAMESPACE"
            ;;
        3)
            read -p "请输入仓库地址: " REGISTRY
            ;;
        *)
            log_error "无效选择"
            exit 1
            ;;
    esac

    # 保存配置
    cat > .docker-registry << EOF
# Docker 镜像仓库配置
REGISTRY="$REGISTRY"
EOF

    echo ""
    log_info "配置已保存到 .docker-registry"
    echo ""
fi

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  推送镜像到仓库${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""
log_info "目标仓库: $REGISTRY"
echo ""

# 获取版本号
if [ -f VERSION ]; then
    VERSION=$(cat VERSION)
else
    VERSION="latest"
    log_warn "VERSION 文件不存在，使用 'latest' 作为版本号"
fi

# 获取时间戳作为额外标签
TIMESTAMP=$(date +%Y%m%d%H%M%S)

# 标签和推送镜像
log_info "步骤 1/2: 标记镜像..."

# Backend
$DOCKER_CMD tag blog-backend:local "$REGISTRY/blog-backend:$VERSION"
$DOCKER_CMD tag blog-backend:local "$REGISTRY/blog-backend:$TIMESTAMP"
$DOCKER_CMD tag blog-backend:latest "$REGISTRY/blog-backend:latest"
log_info "Backend 镜像标记完成 ✓"

# Frontend
$DOCKER_CMD tag blog-frontend:local "$REGISTRY/blog-frontend:$VERSION"
$DOCKER_CMD tag blog-frontend:local "$REGISTRY/blog-frontend:$TIMESTAMP"
$DOCKER_CMD tag blog-frontend:latest "$REGISTRY/blog-frontend:latest"
log_info "Frontend 镜像标记完成 ✓"

echo ""
log_info "步骤 2/2: 推送镜像到仓库..."
echo ""

# 登录（如果未登录）
if ! $DOCKER_CMD info | grep -q "Username"; then
    log_warn "未检测到 Docker 登录状态"
    $DOCKER_CMD login
fi

# 推送镜像
echo "正在推送 blog-backend:$VERSION..."
$DOCKER_CMD push "$REGISTRY/blog-backend:$VERSION" &
echo "正在推送 blog-frontend:$VERSION..."
$DOCKER_CMD push "$REGISTRY/blog-frontend:$VERSION" &

wait

echo ""
echo "正在推送 latest 标签..."
$DOCKER_CMD push "$REGISTRY/blog-backend:latest" &
$DOCKER_CMD push "$REGISTRY/blog-frontend:latest" &

wait

log_info "所有镜像推送完成 ✓"
echo ""

# 显示推送的镜像
echo -e "${BLUE}推送的镜像:${NC}"
echo "  $REGISTRY/blog-backend:$VERSION"
echo "  $REGISTRY/blog-backend:$TIMESTAMP"
echo "  $REGISTRY/blog-backend:latest"
echo "  $REGISTRY/blog-frontend:$VERSION"
echo "  $REGISTRY/blog-frontend:$TIMESTAMP"
echo "  $REGISTRY/blog-frontend:latest"
echo ""

log_info "推送完成！"
echo ""
echo -e "${YELLOW}在服务器上拉取并部署:${NC}"
echo "  bash deploy-server.sh $REGISTRY $VERSION"
echo ""

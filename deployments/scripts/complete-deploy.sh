#!/bin/bash
# 博客系统完整部署脚本
# 在服务器上一次性完成所有部署操作

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
echo -e "${BLUE}  博客系统完整部署脚本${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# 进入项目目录
cd ~/blog

# 1. 停止并删除旧容器
log_info "步骤 1/5: 清理旧容器..."
OLD_CONTAINERS=$(docker ps -a --format '{{.Names}}' | grep -E 'blog-|postgres|redis' || true)
if [ -n "$OLD_CONTAINERS" ]; then
    docker stop $OLD_CONTAINERS 2>/dev/null || true
    docker rm $OLD_CONTAINERS 2>/dev/null || true
    log_info "旧容器已清理 ✓"
else
    log_info "没有需要清理的旧容器"
fi
echo ""

# 2. 启动服务
log_info "步骤 2/5: 启动 Docker 服务..."
docker compose up -d
log_info "服务启动完成 ✓"
echo ""

# 3. 等待服务就绪
log_info "步骤 3/5: 等待服务就绪..."
sleep 10
log_info "服务就绪等待完成 ✓"
echo ""

# 4. 检查服务状态
log_info "步骤 4/5: 检查服务状态..."
docker compose ps
echo ""

# 5. 检查日志
log_info "步骤 5/5: 检查服务日志（最近20行）..."
echo ""
echo -e "${BLUE}=== Backend 日志 ===${NC}"
docker logs blog-backend --tail 20 2>&1 || true
echo ""
echo -e "${BLUE}=== Frontend 日志 ===${NC}"
docker logs blog-frontend --tail 20 2>&1 || true
echo ""

log_info "部署完成！"
echo ""
echo -e "${YELLOW}服务访问地址:${NC}"
echo "  前端: http://152.136.43.194:3001"
echo "  后端: http://152.136.43.194:3000"
echo "  通过 Nginx: http://152.136.43.194"
echo ""
echo -e "${YELLOW}查看所有服务状态:${NC}"
echo "  docker compose ps"
echo ""
echo -e "${YELLOW}查看实时日志:${NC}"
echo "  docker compose logs -f"
echo ""
echo -e "${YELLOW}查看特定服务日志:${NC}"
echo "  docker compose logs -f backend"
echo "  docker compose logs -f frontend"
echo ""
echo -e "${YELLOW}重启服务:${NC}"
echo "  docker compose restart"
echo ""
echo -e "${YELLOW}停止服务:${NC}"
echo "  docker compose down"
echo ""

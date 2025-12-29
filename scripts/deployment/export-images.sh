#!/bin/bash

###############################################################################
# 镜像导出脚本
# 用途: 将构建好的 Docker 镜像导出为 tar.gz 文件
# 使用: bash scripts/deployment/export-images.sh
###############################################################################

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
EXPORT_DIR="$PROJECT_ROOT/exports"
mkdir -p "$EXPORT_DIR"

echo -e "${BLUE}=====================================${NC}"
echo -e "${BLUE}Docker 镜像导出${NC}"
echo -e "${BLUE}=====================================${NC}"
echo ""

# 检查镜像
if ! docker images | grep -q "blog-backend:local"; then
    echo -e "${RED}错误: blog-backend:local 镜像不存在${NC}"
    exit 1
fi

if ! docker images | grep -q "blog-frontend:local"; then
    echo -e "${RED}错误: blog-frontend:local 镜像不存在${NC}"
    exit 1
fi

echo -e "${GREEN}✓ 所有镜像存在${NC}"

# 导出后端
echo -e "${INFO} 导出后端镜像..."
docker save blog-backend:local -o "$EXPORT_DIR/blog-backend-local.tar"
echo -e "${GREEN}✓ 后端镜像导出完成${NC}"

# 导出前端
echo -e "${INFO} 导出前端镜像..."
docker save blog-frontend:local -o "$EXPORT_DIR/blog-frontend-local.tar"
echo -e "${GREEN}✓ 前端镜像导出完成${NC}"

# 压缩（可选）
read -p "是否压缩? 可减少 30% 体积 (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    gzip -f "$EXPORT_DIR/blog-backend-local.tar"
    gzip -f "$EXPORT_DIR/blog-frontend-local.tar"
    echo -e "${GREEN}✓ 压缩完成${NC}"
fi

echo ""
echo -e "${GREEN}✓ 导出完成！${NC}"
echo -e "${INFO} 文件位置: $EXPORT_DIR"
ls -lh "$EXPORT_DIR"

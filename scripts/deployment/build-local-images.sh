#!/bin/bash

###############################################################################
# 本地镜像构建脚本
# 用途: 在本地机器上构建所有 Docker 镜像
# 使用: bash scripts/deployment/build-local-images.sh
# 平台: Windows (Git Bash) / Linux / macOS
###############################################################################

set -e  # 遇到错误立即退出

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 项目根目录
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$PROJECT_ROOT"

echo -e "${BLUE}=====================================${NC}"
echo -e "${BLUE}本地 Docker 镜像构建${NC}"
echo -e "${BLUE}=====================================${NC}"
echo ""
echo -e "${INFO} 项目目录: $PROJECT_ROOT"
echo -e "${INFO} 开始时间: $(date '+%Y-%m-%d %H:%M:%S')"
echo ""

# 检查 Docker
if ! command -v docker &> /dev/null; then
    echo -e "${RED}错误: Docker 未安装${NC}"
    echo "请先安装 Docker Desktop for Windows/Mac 或 Docker Engine for Linux"
    exit 1
fi

echo -e "${GREEN}✓ Docker 环境检查通过${NC}"
echo ""

###############################################################################
# 1. 清理旧镜像（可选）
###############################################################################

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}  1. 检查现有镜像${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

if docker images | grep -q "blog-backend"; then
    echo -e "${YELLOW}⚠ 发现旧的 blog-backend 镜像${NC}"
    read -p "是否删除旧镜像? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        docker rmi blog-backend:local 2>/dev/null || true
        echo -e "${GREEN}✓ 旧镜像已删除${NC}"
    fi
fi

if docker images | grep -q "blog-frontend"; then
    echo -e "${YELLOW}⚠ 发现旧的 blog-frontend 镜像${NC}"
    read -p "是否删除旧镜像? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        docker rmi blog-frontend:local 2>/dev/null || true
        echo -e "${GREEN}✓ 旧镜像已删除${NC}"
    fi
fi

###############################################################################
# 2. 构建后端镜像
###############################################################################

echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}  2. 构建后端镜像 (Rust)${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

echo -e "${INFO} 这可能需要 10-20 分钟..."
echo ""

cd backend

if docker build -t blog-backend:local .; then
    echo -e "${GREEN}✓ 后端镜像构建成功${NC}"

    # 显示镜像大小
    image_size=$(docker images blog-backend:local --format "{{.Size}}")
    echo -e "${INFO} 镜像大小: $image_size"
else
    echo -e "${RED}✗ 后端镜像构建失败${NC}"
    exit 1
fi

cd "$PROJECT_ROOT"

###############################################################################
# 3. 构建前端镜像
###############################################################################

echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}  3. 构建前端镜像 (Next.js)${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

echo -e "${INFO} 这可能需要 15-30 分钟..."
echo ""

cd frontend

if docker build -t blog-frontend:local .; then
    echo -e "${GREEN}✓ 前端镜像构建成功${NC}"

    # 显示镜像大小
    image_size=$(docker images blog-frontend:local --format "{{.Size}}")
    echo -e "${INFO} 镜像大小: $image_size"
else
    echo -e "${RED}✗ 前端镜像构建失败${NC}"
    exit 1
fi

cd "$PROJECT_ROOT"

###############################################################################
# 4. 验证镜像
###############################################################################

echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}  4. 验证镜像${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

echo -e "${INFO} 检查镜像列表..."
docker images | grep "blog-"

echo ""
echo -e "${INFO} 测试后端镜像..."
if docker inspect blog-backend:local > /dev/null 2>&1; then
    echo -e "${GREEN}✓ 后端镜像有效${NC}"
else
    echo -e "${RED}✗ 后端镜像无效${NC}"
    exit 1
fi

echo -e "${INFO} 测试前端镜像..."
if docker inspect blog-frontend:local > /dev/null 2>&1; then
    echo -e "${GREEN}✓ 前端镜像有效${NC}"
else
    echo -e "${RED}✗ 前端镜像无效${NC}"
    exit 1
fi

###############################################################################
# 5. 显示构建摘要
###############################################################################

echo ""
echo -e "${BLUE}=====================================${NC}"
echo -e "${BLUE}构建完成！${NC}"
echo -e "${BLUE}=====================================${NC}"
echo ""

echo -e "${GREEN}✓ 所有镜像构建成功${NC}"
echo ""

echo -e "${INFO} 镜像列表:"
docker images | grep "blog-"

echo ""
echo -e "${INFO} 下一步操作:"
echo "  1. 导出镜像: bash scripts/deployment/export-images.sh"
echo "  2. 上传到服务器: 使用 SCP 或 SFTP"
echo "  3. 在服务器加载: bash scripts/deployment/load-images.sh"
echo ""

# 保存镜像信息
cat > build-info.txt <<EOF
镜像构建信息
=====================================
构建时间: $(date '+%Y-%m-%d %H:%M:%S')
构建主机: $(hostname)
平台: $(uname -s) $(uname -m)

镜像列表:
- blog-backend:local
- blog-frontend:local

镜像大小:
$(docker images | grep "blog-")

下一步:
1. 导出镜像: bash scripts/deployment/export-images.sh
2. 上传到服务器
3. 在服务器加载镜像
EOF

echo -e "${INFO} 构建信息已保存到: build-info.txt"
echo ""
echo -e "${INFO} 完成时间: $(date '+%Y-%m-%d %H:%M:%S')"
echo ""

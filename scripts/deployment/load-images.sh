#!/bin/bash

###############################################################################
# 镜像加载脚本（服务器端）
# 用途: 在服务器上加载 Docker 镜像
# 使用: bash scripts/load-images.sh
# 注意: 此脚本在服务器上运行
###############################################################################

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}=====================================${NC}"
echo -e "${BLUE}Docker 镜像加载${NC}"
echo -e "${BLUE}=====================================${NC}"
echo ""
echo -e "${INFO} 开始时间: $(date '+%Y-%m-%d %H:%M:%S')"
echo ""

# 项目目录（假设在 /opt/blog）
PROJECT_DIR="/opt/blog"
cd "$PROJECT_DIR"

###############################################################################
# 1. 检查镜像文件
###############################################################################

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}  1. 检查镜像文件${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

# 查找镜像文件
BACKEND_FILE=$(ls -1 blog-backend-local.tar* 2>/dev/null | head -1)
FRONTEND_FILE=$(ls -1 blog-frontend-local.tar* 2>/dev/null | head -1)

if [[ -z "$BACKEND_FILE" ]]; then
    echo -e "${RED}错误: 找不到后端镜像文件${NC}"
    echo "请上传 blog-backend-local.tar 或 blog-backend-local.tar.gz"
    exit 1
fi

if [[ -z "$FRONTEND_FILE" ]]; then
    echo -e "${RED}错误: 找不到前端镜像文件${NC}"
    echo "请上传 blog-frontend-local.tar 或 blog-frontend-local.tar.gz"
    exit 1
fi

echo -e "${GREEN}✓ 找到镜像文件${NC}"
echo -e "${INFO} 后端: $BACKEND_FILE"
echo -e "${INFO} 前端: $FRONTEND_FILE"

# 显示文件大小
ls -lh "$BACKEND_FILE" "$FRONTEND_FILE"

###############################################################################
# 2. 检查磁盘空间
###############################################################################

echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}  2. 检查磁盘空间${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

available_space=$(df -BG . | tail -1 | awk '{print $4}' | sed 's/G//')

if [[ $available_space -lt 5 ]]; then
    echo -e "${RED}错误: 磁盘空间不足${NC}"
    echo "可用空间: ${available_space}GB"
    echo "需要至少: 5GB"
    exit 1
fi

echo -e "${GREEN}✓ 磁盘空间充足${NC}"
echo -e "${INFO} 可用空间: ${available_space}GB"

###############################################################################
# 3. 解压镜像文件（如果是压缩的）
###############################################################################

echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}  3. 解压镜像文件${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

if [[ "$BACKEND_FILE" == *.gz ]]; then
    echo -e "${INFO} 解压后端镜像..."
    gunzip -c "$BACKEND_FILE" > blog-backend-local.tar
    BACKEND_FILE="blog-backend-local.tar"
    echo -e "${GREEN}✓ 后端镜像解压完成${NC}"
else
    echo -e "${INFO} 后端镜像未压缩，跳过解压"
fi

if [[ "$FRONTEND_FILE" == *.gz ]]; then
    echo -e "${INFO} 解压前端镜像..."
    gunzip -c "$FRONTEND_FILE" > blog-frontend-local.tar
    FRONTEND_FILE="blog-frontend-local.tar"
    echo -e "${GREEN}✓ 前端镜像解压完成${NC}"
else
    echo -e "${INFO} 前端镜像未压缩，跳过解压"
fi

###############################################################################
# 4. 加载镜像
###############################################################################

echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}  4. 加载 Docker 镜像${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

echo -e "${INFO} 加载后端镜像（这需要几分钟）..."
if docker load -i "$BACKEND_FILE"; then
    echo -e "${GREEN}✓ 后端镜像加载成功${NC}"
else
    echo -e "${RED}✗ 后端镜像加载失败${NC}"
    exit 1
fi

echo ""
echo -e "${INFO} 加载前端镜像（这需要几分钟）..."
if docker load -i "$FRONTEND_FILE"; then
    echo -e "${GREEN}✓ 前端镜像加载成功${NC}"
else
    echo -e "${RED}✗ 前端镜像加载失败${NC}"
    exit 1
fi

###############################################################################
# 5. 验证镜像
###############################################################################

echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}  5. 验证镜像${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

if docker images | grep -q "blog-backend:local"; then
    echo -e "${GREEN}✓ 后端镜像可用${NC}"
else
    echo -e "${RED}✗ 后端镜像不可用${NC}"
    exit 1
fi

if docker images | grep -q "blog-frontend:local"; then
    echo -e "${GREEN}✓ 前端镜像可用${NC}"
else
    echo -e "${RED}✗ 前端镜像不可用${NC}"
    exit 1
fi

echo ""
echo -e "${INFO} 镜像列表:"
docker images | grep "blog-"

###############################################################################
# 6. 清理临时文件
###############################################################################

echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}  6. 清理临时文件${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

read -p "是否删除原始镜像文件以释放空间? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    rm -f blog-backend-local.tar*
    rm -f blog-frontend-local.tar*
    echo -e "${GREEN}✓ 临时文件已清理${NC}"
else
    echo -e "${INFO} 保留镜像文件"
fi

###############################################################################
# 7. 完成
###############################################################################

echo ""
echo -e "${BLUE}=====================================${NC}"
echo -e "${BLUE}镜像加载完成！${NC}"
echo -e "${BLUE}=====================================${NC}"
echo ""

echo -e "${GREEN}✓ 所有镜像已成功加载${NC}"
echo ""

echo -e "${INFO} 下一步操作:"
echo "  1. 配置环境变量: cp .env.example .env && nano .env"
echo "  2. 修改 Nginx 配置: nano nginx/conf.d/blog.conf"
echo "  3. 启动服务: bash scripts/start-from-images.sh"
echo ""

echo -e "${INFO} 完成时间: $(date '+%Y-%m-%d %H:%M:%S')"
echo ""

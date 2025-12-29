#!/bin/bash

###############################################################################
# 从镜像启动服务脚本（服务器端）
# 用途: 使用已加载的镜像启动所有服务
# 使用: bash scripts/start-from-images.sh
# 注意: 此脚本在服务器上运行，不进行任何编译
###############################################################################

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}=====================================${NC}"
echo -e "${BLUE}启动博客服务${NC}"
echo -e "${BLUE}=====================================${NC}"
echo ""
echo -e "${INFO} 开始时间: $(date '+%Y-%m-%d %H:%M:%S')"
echo ""

# 项目目录
PROJECT_DIR="/opt/blog"
cd "$PROJECT_DIR"

###############################################################################
# 1. 检查镜像
###############################################################################

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}  1. 检查镜像${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

if ! docker images | grep -q "blog-backend:local"; then
    echo -e "${RED}错误: blog-backend:local 镜像不存在${NC}"
    echo "请先运行: bash scripts/load-images.sh"
    exit 1
fi

if ! docker images | grep -q "blog-frontend:local"; then
    echo -e "${RED}错误: blog-frontend:local 镜像不存在${NC}"
    echo "请先运行: bash scripts/load-images.sh"
    exit 1
fi

echo -e "${GREEN}✓ 所有镜像已加载${NC}"

###############################################################################
# 2. 检查配置文件
###############################################################################

echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}  2. 检查配置文件${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

if [[ ! -f .env ]]; then
    echo -e "${YELLOW}⚠ .env 文件不存在${NC}"
    echo -e "${INFO} 创建 .env 文件..."
    cp .env.example .env
    echo -e "${YELLOW}⚠ 请编辑 .env 文件配置你的环境变量${NC}"
    echo "nano .env"
    read -p "按 Enter 继续（确保已配置 .env）..."
fi

if [[ ! -f nginx/conf.d/blog.conf ]]; then
    echo -e "${RED}错误: Nginx 配置文件不存在${NC}"
    exit 1
fi

echo -e "${GREEN}✓ 配置文件检查通过${NC}"

###############################################################################
# 3. 检查并创建网络
###############################################################################

echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}  3. 配置 Docker 网络${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

if ! docker network ls | grep -q "blog-network"; then
    echo -e "${INFO} 创建 Docker 网络..."
    docker network create blog-network
    echo -e "${GREEN}✓ 网络创建成功${NC}"
else
    echo -e "${INFO} 网络已存在"
fi

###############################################################################
# 4. 启动服务
###############################################################################

echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}  4. 启动服务${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

echo -e "${INFO} 使用 docker-compose.local.yml 启动服务..."
echo ""

if docker compose -f docker-compose.local.yml up -d; then
    echo -e "${GREEN}✓ 服务启动成功${NC}"
else
    echo -e "${RED}✗ 服务启动失败${NC}"
    echo -e "${INFO} 查看日志: docker compose -f docker-compose.local.yml logs"
    exit 1
fi

###############################################################################
# 5. 等待服务就绪
###############################################################################

echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}  5. 等待服务就绪${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

echo -e "${INFO} 等待数据库启动..."
sleep 10

echo -e "${INFO} 等待后端启动..."
sleep 15

echo -e "${INFO} 等待前端启动..."
sleep 20

###############################################################################
# 6. 健康检查
###############################################################################

echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}  6. 健康检查${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

# 检查容器状态
echo -e "${INFO} 容器状态:"
docker compose -f docker-compose.local.yml ps

# 测试后端
echo ""
echo -e "${INFO} 测试后端 API..."
if docker compose exec -T backend curl -f http://localhost:3000/healthz > /dev/null 2>&1; then
    echo -e "${GREEN}✓ 后端 API 正常${NC}"
else
    echo -e "${YELLOW}⚠ 后端 API 尚未就绪（可能还在启动）${NC}"
fi

# 测试前端
echo -e "${INFO} 测试前端..."
if docker compose exec -T frontend curl -f http://localhost:3001 > /dev/null 2>&1; then
    echo -e "${GREEN}✓ 前端正常${NC}"
else
    echo -e "${YELLOW}⚠ 前端尚未就绪（可能还在启动）${NC}"
fi

# 测试数据库
echo -e "${INFO} 测试数据库..."
if docker compose exec -T postgres psql -U blog_user -d blog_db -c "SELECT 1;" > /dev/null 2>&1; then
    echo -e "${GREEN}✓ 数据库正常${NC}"
else
    echo -e "${YELLOW}⚠ 数据库尚未就绪${NC}"
fi

# 测试 Redis
echo -e "${INFO} 测试 Redis..."
if docker compose exec -T redis redis-cli ping > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Redis 正常${NC}"
else
    echo -e "${YELLOW}⚠ Redis 尚未就绪${NC}"
fi

###############################################################################
# 7. 配置防火墙
###############################################################################

echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}  7. 配置防火墙${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

if command -v ufw > /dev/null 2>&1; then
    echo -e "${INFO} 配置 UFW..."
    ufw allow 80/tcp > /dev/null 2>&1 || true
    ufw allow 443/tcp > /dev/null 2>&1 || true
    echo -e "${GREEN}✓ 防火墙规则已添加${NC}"
elif command -v firewall-cmd > /dev/null 2>&1; then
    echo -e "${INFO} 配置 firewalld..."
    firewall-cmd --permanent --add-service=http > /dev/null 2>&1 || true
    firewall-cmd --permanent --add-service=https > /dev/null 2>&1 || true
    firewall-cmd --reload > /dev/null 2>&1 || true
    echo -e "${GREEN}✓ 防火墙规则已添加${NC}"
else
    echo -e "${YELLOW}⚠ 未检测到防火墙，请手动配置${NC}"
fi

###############################################################################
# 8. 完成
###############################################################################

echo ""
echo -e "${BLUE}=====================================${NC}"
echo -e "${BLUE}服务启动完成！${NC}"
echo -e "${BLUE}=====================================${NC}"
echo ""

echo -e "${GREEN}✓ 所有服务已启动${NC}"
echo ""

# 获取服务器 IP
SERVER_IP=$(hostname -I | awk '{print $1}')
echo -e "${INFO} 访问地址:"
echo "  HTTP:  http://${SERVER_IP}"
echo "  HTTP:  http://localhost"
echo ""

echo -e "${INFO} 如果配置了域名，请修改 Nginx 配置:"
echo "  nano nginx/conf.d/blog.conf"
echo "  # 修改 server_name 为你的域名"
echo "  docker compose restart nginx"
echo ""

echo -e "${INFO} 下一步操作:"
echo "  1. 配置 SSL: bash scripts/setup-ssl.sh your-domain.com"
echo "  2. 验证部署: bash scripts/verify-deployment.sh http://${SERVER_IP}"
echo "  3. 查看日志: docker compose logs -f"
echo "  4. 管理服务: docker compose ps"
echo ""

echo -e "${YELLOW}⚠ 重要提醒:${NC}"
echo "  - 确保已修改 .env 中的安全密钥"
echo "  - 确保已修改 Nginx 配置中的域名"
echo "  - 定期备份数据库"
echo ""

echo -e "${INFO} 完成时间: $(date '+%Y-%m-%d %H:%M:%S')"
echo ""

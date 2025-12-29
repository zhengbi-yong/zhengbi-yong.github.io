#!/bin/bash
# 生产环境一键部署脚本
# 使用方法: ./scripts/deploy-production.sh <server-ip> <user>

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() { echo -e "${GREEN}[INFO]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# 获取参数
SERVER_IP=${1:-152.136.43.194}
SERVER_USER=${2:-ubuntu}

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  博客系统生产环境部署${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""
log_info "服务器: ${SERVER_USER}@${SERVER_IP}"
echo ""

# 1. 构建 Docker 镜像
log_info "步骤 1/6: 构建 Docker 镜像..."
npm run build
log_info "镜像构建完成 ✓"
echo ""

# 2. 导出镜像
log_info "步骤 2/6: 导出 Docker 镜像..."
npm run export
log_info "镜像导出完成 ✓"
echo ""

# 3. 上传镜像文件
log_info "步骤 3/6: 上传镜像到服务器..."
scp -r docker-images-export/ ${SERVER_USER}@${SERVER_IP}:~/blog-deployment/
log_info "镜像上传完成 ✓"
echo ""

# 4. 上传配置文件
log_info "步骤 4/6: 上传配置文件..."
scp server-setup/.env.production ${SERVER_USER}@${SERVER_IP}:~/blog/.env
scp server-setup/nginx.conf ${SERVER_USER}@${SERVER_IP}:~/blog/nginx.conf
scp server-setup/site.conf ${SERVER_USER}@${SERVER_IP}:~/blog/site.conf
scp docker-compose.server.yml ${SERVER_USER}@${SERVER_IP}:~/blog/docker-compose.yml
log_info "配置文件上传完成 ✓"
echo ""

# 5. 在服务器上执行部署
log_info "步骤 5/6: 在服务器上部署..."
ssh ${SERVER_USER}@${SERVER_IP} 'bash -s' << 'EOF'
set -e

echo "=== 服务器端部署开始 ==="

# 创建目录
mkdir -p ~/blog/nginx

# 导入镜像
echo "导入 Docker 镜像..."
cd ~/blog-deployment
docker load -i blog-backend-local.tar
docker load -i blog-frontend-local.tar
docker load -i postgres-17-alpine.tar
docker load -i redis-7.4-alpine.tar
docker load -i nginx-1.27-alpine.tar

# 配置 Nginx
echo "配置 Nginx..."
sudo cp ~/blog/site.conf /etc/nginx/sites-available/default
sudo nginx -t
sudo systemctl reload nginx

# 启动服务
echo "启动 Docker 服务..."
cd ~/blog
docker compose down 2>/dev/null || true
docker compose up -d

echo "=== 服务器端部署完成 ==="
EOF
log_info "服务器部署完成 ✓"
echo ""

# 6. 验证
log_info "步骤 6/6: 验证部署..."
echo ""
log_info "访问地址:"
echo "  前端: http://${SERVER_IP}"
echo "  后端: http://${SERVER_IP}:3000"
echo ""
log_info "查看服务状态:"
echo "  ssh ${SERVER_USER}@${SERVER_IP} 'cd ~/blog && docker compose ps'"
echo ""
log_info "查看日志:"
echo "  ssh ${SERVER_USER}@${SERVER_IP} 'cd ~/blog && docker compose logs -f'"
echo ""

log_info "部署完成！"

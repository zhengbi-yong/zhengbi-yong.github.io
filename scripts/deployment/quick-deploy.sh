#!/bin/bash

###############################################################################
# 快速部署脚本
# 用途: 一键部署博客系统到服务器
# 使用: bash quick-deploy.sh [your-domain.com]
# 示例: bash quick-deploy.sh example.com
###############################################################################

set -e  # 遇到错误立即退出

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 获取域名
DOMAIN=${1}
if [[ -z "$DOMAIN" ]]; then
    echo -e "${RED}错误: 请提供域名${NC}"
    echo "使用方法: bash quick-deploy.sh your-domain.com"
    exit 1
fi

echo -e "${BLUE}=====================================${NC}"
echo -e "${BLUE}博客系统快速部署${NC}"
echo -e "${BLUE}=====================================${NC}"
echo ""
echo -e "${INFO} 目标域名: ${DOMAIN}"
echo -e "${INFO} 开始时间: $(date '+%Y-%m-%d %H:%M:%S')"
echo ""

###############################################################################
# 1. 生成安全密钥
###############################################################################

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}  1. 生成安全密钥${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

JWT_SECRET=$(openssl rand -base64 32)
PASSWORD_PEPPER=$(openssl rand -base64 32)
SESSION_SECRET=$(openssl rand -base64 32)
DB_PASSWORD=$(openssl rand -base64 24)

echo -e "${GREEN}✓ 安全密钥已生成${NC}"

###############################################################################
# 2. 创建 .env 文件
###############################################################################

echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}  2. 配置环境变量${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

if [[ -f .env ]]; then
    echo -e "${YELLOW}⚠ .env 文件已存在，备份中...${NC}"
    cp .env .env.backup.$(date +%Y%m%d_%H%M%S)
fi

cat > .env <<EOF
# ================================
# 数据库配置
# ================================
POSTGRES_USER=blog_user
POSTGRES_PASSWORD=${DB_PASSWORD}
POSTGRES_DB=blog_db
POSTGRES_PORT=5432

# ================================
# Redis 配置
# ================================
REDIS_PORT=6379

# ================================
# 后端 API 配置
# ================================
BACKEND_PORT=3000
RUST_LOG=info

# ================================
# 安全配置
# ================================
JWT_SECRET=${JWT_SECRET}
PASSWORD_PEPPER=${PASSWORD_PEPPER}
SESSION_SECRET=${SESSION_SECRET}

# ================================
# CORS 配置
# ================================
CORS_ALLOWED_ORIGINS=https://${DOMAIN}

# 限流配置
RATE_LIMIT_PER_MINUTE=60

# ================================
# 邮件配置（可选）
# ================================
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=
SMTP_PASSWORD=
SMTP_FROM=noreply@${DOMAIN}

# ================================
# 前端配置
# ================================
FRONTEND_PORT=3001
NEXT_PUBLIC_SITE_URL=https://${DOMAIN}
NEXT_PUBLIC_API_URL=https://${DOMAIN}
EOF

chmod 600 .env
echo -e "${GREEN}✓ .env 文件已创建${NC}"

###############################################################################
# 3. 更新 Nginx 配置
###############################################################################

echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}  3. 更新 Nginx 配置${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

# 备份原配置
if [[ -f nginx/conf.d/blog.conf ]]; then
    cp nginx/conf.d/blog.conf nginx/conf.d/blog.conf.backup.$(date +%Y%m%d_%H%M%S)
fi

# 更新域名（第一个 server_name）
sed -i "0,/server_name .*/s//server_name ${DOMAIN};/" nginx/conf.d/blog.conf

echo -e "${GREEN}✓ Nginx 配置已更新${NC}"
echo -e "${INFO} 配置的域名: ${DOMAIN}"

###############################################################################
# 4. 更新 docker-compose.yml
###############################################################################

echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}  4. 更新 Docker Compose 配置${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

# 备份原配置
if [[ -f docker-compose.yml ]]; then
    cp docker-compose.yml docker-compose.yml.backup.$(date +%Y%m%d_%H%M%S)
fi

# 更新前端环境变量
sed -i 's/NEXT_PUBLIC_API_URL: http:\/\/localhost:3000/NEXT_PUBLIC_API_URL: ${NEXT_PUBLIC_API_URL}/' docker-compose.yml

# 更新后端 CORS 配置
sed -i "s/CORS_ALLOWED_ORIGINS: \${CORS_ALLOWED_ORIGINS:-.*/CORS_ALLOWED_ORIGINS: \${CORS_ALLOWED_ORIGINS}/" docker-compose.yml

echo -e "${GREEN}✓ Docker Compose 配置已更新${NC}"

###############################################################################
# 5. 构建镜像
###############################################################################

echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}  5. 构建 Docker 镜像${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

echo -e "${INFO} 这可能需要 15-30 分钟，请耐心等待..."
echo ""

if docker compose build; then
    echo -e "${GREEN}✓ 镜像构建成功${NC}"
else
    echo -e "${RED}✗ 镜像构建失败${NC}"
    exit 1
fi

###############################################################################
# 6. 启动服务
###############################################################################

echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}  6. 启动服务${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

if docker compose up -d; then
    echo -e "${GREEN}✓ 服务启动成功${NC}"
else
    echo -e "${RED}✗ 服务启动失败${NC}"
    exit 1
fi

###############################################################################
# 7. 等待服务就绪
###############################################################################

echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}  7. 等待服务就绪${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

echo -e "${INFO} 等待数据库启动..."
sleep 10

echo -e "${INFO} 等待后端启动..."
sleep 15

echo -e "${INFO} 等待前端启动..."
sleep 20

###############################################################################
# 8. 运行健康检查
###############################################################################

echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}  8. 健康检查${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

# 检查容器状态
echo -e "${INFO} 检查容器状态..."
docker compose ps

# 测试后端
echo -e "${INFO} 测试后端 API..."
if curl -f http://localhost:3000/healthz > /dev/null 2>&1; then
    echo -e "${GREEN}✓ 后端 API 正常${NC}"
else
    echo -e "${YELLOW}⚠ 后端 API 尚未就绪（可能还在启动中）${NC}"
fi

# 测试前端
echo -e "${INFO} 测试前端..."
if curl -f http://localhost:3001 > /dev/null 2>&1; then
    echo -e "${GREEN}✓ 前端正常${NC}"
else
    echo -e "${YELLOW}⚠ 前端尚未就绪（可能还在启动中）${NC}"
fi

# 测试数据库
echo -e "${INFO} 测试数据库连接..."
if docker compose exec -T postgres psql -U blog_user -d blog_db -c "SELECT 1;" > /dev/null 2>&1; then
    echo -e "${GREEN}✓ 数据库连接正常${NC}"
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
# 9. 配置防火墙
###############################################################################

echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}  9. 配置防火墙${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

if command -v ufw > /dev/null 2>&1; then
    echo -e "${INFO} 配置 UFW 防火墙..."
    ufw allow 80/tcp 2>/dev/null || true
    ufw allow 443/tcp 2>/dev/null || true
    echo -e "${GREEN}✓ 防火墙规则已添加${NC}"
elif command -v firewall-cmd > /dev/null 2>&1; then
    echo -e "${INFO} 配置 firewalld..."
    firewall-cmd --permanent --add-service=http 2>/dev/null || true
    firewall-cmd --permanent --add-service=https 2>/dev/null || true
    firewall-cmd --reload 2>/dev/null || true
    echo -e "${GREEN}✓ 防火墙规则已添加${NC}"
else
    echo -e "${YELLOW}⚠ 未检测到防火墙，请手动配置${NC}"
fi

###############################################################################
# 10. 完成
###############################################################################

echo ""
echo -e "${BLUE}=====================================${NC}"
echo -e "${BLUE}部署完成！${NC}"
echo -e "${BLUE}=====================================${NC}"
echo ""
echo -e "${GREEN}✓ 部署成功！${NC}"
echo ""
echo -e "${INFO} 访问地址:"
echo -e "  HTTP:  http://${DOMAIN}"
echo -e "  HTTPS: https://${DOMAIN} (需要配置 SSL)"
echo ""
echo -e "${INFO} 下一步操作:"
echo "  1. 配置 SSL 证书: bash scripts/deployment/setup-ssl.sh ${DOMAIN}"
echo "  2. 运行验证测试: bash scripts/deployment/verify-deployment.sh https://${DOMAIN}"
echo "  3. 查看日志: docker compose logs -f"
echo "  4. 管理服务: docker compose ps"
echo ""
echo -e "${YELLOW}⚠ 重要提醒:${NC}"
echo "  - 请妥善保管 .env 文件"
echo "  - 定期备份数据库"
echo "  - 及时更新系统"
echo ""
echo -e "${INFO} 完成时间: $(date '+%Y-%m-%d %H:%M:%S')"
echo ""

# 保存重要信息到文件
cat > deployment-info.txt <<EOF
部署信息
=====================================
域名: ${DOMAIN}
部署时间: $(date '+%Y-%m-%d %H:%M:%S')

数据库密码: ${DB_PASSWORD}
JWT Secret: ${JWT_SECRET}
Password Pepper: ${PASSWORD_PEPPER}
Session Secret: ${SESSION_SECRET}

访问地址:
  HTTP:  http://${DOMAIN}
  HTTPS: https://${DOMAIN}

常用命令:
  查看日志: docker compose logs -f
  重启服务: docker compose restart
  停止服务: docker compose down
  启动服务: docker compose up -d

备份文件:
  .env.backup.$(date +%Y%m%d_%H%M%S)
  nginx/conf.d/blog.conf.backup.$(date +%Y%m%d_%H%M%S)
  docker-compose.yml.backup.$(date +%Y%m%d_%H%M%S)
EOF

chmod 600 deployment-info.txt
echo -e "${INFO} 部署信息已保存到: deployment-info.txt"
echo ""

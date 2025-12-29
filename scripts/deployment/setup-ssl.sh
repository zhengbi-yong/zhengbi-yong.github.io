#!/bin/bash

###############################################################################
# SSL 证书配置脚本
# 用途: 自动配置 Let's Encrypt SSL 证书
# 使用: bash setup-ssl.sh your-domain.com
# 示例: bash setup-ssl.sh example.com
###############################################################################

set -e

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
    echo "使用方法: bash setup-ssl.sh your-domain.com"
    exit 1
fi

EMAIL=${2:-""}

echo -e "${BLUE}=====================================${NC}"
echo -e "${BLUE}SSL 证书配置${NC}"
echo -e "${BLUE}=====================================${NC}"
echo ""
echo -e "${INFO} 目标域名: ${DOMAIN}"
echo -e "${INFO} 开始时间: $(date '+%Y-%m-%d %H:%M:%S')"
echo ""

###############################################################################
# 1. 检查域名解析
###############################################################################

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}  1. 检查域名解析${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

if nslookup ${DOMAIN} > /dev/null 2>&1; then
    echo -e "${GREEN}✓ 域名解析正常${NC}"
else
    echo -e "${RED}✗ 域名未解析，请先配置 DNS${NC}"
    exit 1
fi

###############################################################################
# 2. 检查 80 端口可用性
###############################################################################

echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}  2. 检查端口可用性${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

if netstat -tulpn | grep ":80 " > /dev/null 2>&1; then
    echo -e "${GREEN}✓ 80 端口开放${NC}"
else
    echo -e "${YELLOW}⚠ 80 端口未检测到监听，请检查防火墙${NC}"
fi

###############################################################################
# 3. 安装 Certbot
###############################################################################

echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}  3. 安装 Certbot${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

if command -v certbot > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Certbot 已安装${NC}"
else
    echo -e "${INFO} 安装 Certbot..."
    if command -v apt > /dev/null 2>&1; then
        apt update
        apt install -y certbot python3-certbot-nginx
    elif command -v yum > /dev/null 2>&1; then
        yum install -y certbot python3-certbot-nginx
    else
        echo -e "${RED}✗ 不支持的系统${NC}"
        exit 1
    fi
    echo -e "${GREEN}✓ Certbot 安装完成${NC}"
fi

###############################################################################
# 4. 停止 Nginx 容器（让 Certbot 使用 standalone 模式）
###############################################################################

echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}  4. 准备获取证书${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

echo -e "${INFO} 停止 Nginx 容器..."
docker compose stop nginx

###############################################################################
# 5. 获取 SSL 证书
###############################################################################

echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}  5. 获取 SSL 证书${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

echo -e "${INFO} 正在向 Let's Encrypt 申请证书..."
echo ""

# 构建命令
CERTBOT_CMD="certbot certonly --standalone -d ${DOMAIN}"

if [[ -n "$EMAIL" ]]; then
    CERTBOT_CMD="$CERTBOT_CMD --email $EMAIL --no-eff-email"
else
    CERTBOT_CMD="$CERTBOT_CMD --register-unsafely-without-email"
fi

# 执行命令
if $CERTBOT_CMD; then
    echo -e "${GREEN}✓ SSL 证书获取成功${NC}"
else
    echo -e "${RED}✗ SSL 证书获取失败${NC}"
    echo -e "${INFO} 正在重启 Nginx..."
    docker compose start nginx
    exit 1
fi

###############################################################################
# 6. 配置 Nginx 使用 SSL
###############################################################################

echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}  6. 配置 Nginx SSL${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

# 备份配置
cp nginx/conf.d/blog.conf nginx/conf.d/blog.conf.backup.ssl

# 创建新的 SSL 配置
cat > nginx/conf.d/blog.conf <<EOF
# 博客系统Nginx配置（HTTPS）
# 前端Next.js + 后端Rust API

# HTTP - 重定向到 HTTPS
server {
    listen 80;
    server_name ${DOMAIN};

    # Let's Encrypt验证
    location /.well-known/acme-challenge/ {
        root /var/www/html;
    }

    # 重定向到 HTTPS
    location / {
        return 301 https://\$host\$request_uri;
    }
}

# HTTPS 服务器
server {
    listen 443 ssl http2;
    server_name ${DOMAIN};

    # SSL证书配置
    ssl_certificate /etc/letsencrypt/live/${DOMAIN}/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/${DOMAIN}/privkey.pem;
    ssl_trusted_certificate /etc/letsencrypt/live/${DOMAIN}/chain.pem;

    # SSL优化
    ssl_session_timeout 1d;
    ssl_session_cache shared:SSL:10m;
    ssl_session_tickets off;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;

    # 安全头
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "DENY" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # 前端Next.js
    location / {
        proxy_pass http://frontend:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;

        # 超时设置
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # 后端API
    location /v1/ {
        proxy_pass http://backend:3000;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;

        # CORS
        add_header Access-Control-Allow-Origin * always;
        add_header Access-Control-Allow-Methods 'GET, POST, PUT, DELETE, OPTIONS' always;
        add_header Access-Control-Allow-Headers 'Authorization, Content-Type' always;

        if (\$request_method = 'OPTIONS') {
            return 204;
        }
    }

    # 管理面板
    location /admin/ {
        proxy_pass http://backend:3000;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    # Next.js静态资源缓存
    location /_next/static {
        proxy_pass http://frontend:3001;
        expires 365d;
        access_log off;
        add_header Cache-Control "public, immutable";
    }

    # 图片资源缓存
    location ~* \.(jpg|jpeg|png|gif|ico|svg|webp|avif)$ {
        proxy_pass http://frontend:3001;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }
}
EOF

echo -e "${GREEN}✓ Nginx SSL 配置完成${NC}"

###############################################################################
# 7. 挂载 SSL 证书到容器
###############################################################################

echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}  7. 挂载 SSL 证书${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

# 更新 docker-compose.yml 添加 SSL 证书卷挂载
if ! grep -q "/etc/letsencrypt:/etc/letsencrypt:ro" docker-compose.yml; then
    # 备份
    cp docker-compose.yml docker-compose.yml.backup.ssl

    # 在 nginx volumes 部分添加 SSL 证书挂载
    sed -i '/nginx\/conf.d:\/etc\/nginx\/conf.d:ro/a\      - \/etc\/letsencrypt:\/etc\/letsencrypt:ro' docker-compose.yml

    echo -e "${GREEN}✓ SSL 证书卷已添加到 docker-compose.yml${NC}"
else
    echo -e "${INFO} SSL 证书卷已存在"
fi

###############################################################################
# 8. 重启 Nginx
###############################################################################

echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}  8. 重启 Nginx${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

docker compose up -d nginx

sleep 5

if docker compose ps nginx | grep -q "Up"; then
    echo -e "${GREEN}✓ Nginx 启动成功${NC}"
else
    echo -e "${RED}✗ Nginx 启动失败${NC}"
    docker compose logs nginx
    exit 1
fi

###############################################################################
# 9. 测试 SSL 配置
###############################################################################

echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}  9. 测试 SSL 配置${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

echo -e "${INFO} 测试 HTTPS 访问..."
sleep 3

if curl -f -s -o /dev/null https://${DOMAIN}; then
    echo -e "${GREEN}✓ HTTPS 访问正常${NC}"
else
    echo -e "${YELLOW}⚠ HTTPS 访问失败，可能还在生效中${NC}"
fi

echo -e "${INFO} 测试 HTTP 重定向..."
http_code=$(curl -s -o /dev/null -w "%{http_code}" http://${DOMAIN})
if [[ "$http_code" == "301" || "$http_code" == "302" ]]; then
    echo -e "${GREEN}✓ HTTP 重定向正常${NC}"
else
    echo -e "${YELLOW}⚠ HTTP 重定向可能有问题（状态码: $http_code）${NC}"
fi

###############################################################################
# 10. 配置自动续期
###############################################################################

echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}  10. 配置证书自动续期${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

# 创建续期脚本
cat > /usr/local/bin/renew-ssl.sh <<'EOFSCRIPT'
#!/bin/bash
# SSL 证书续期脚本

echo "开始续期 SSL 证书..."
certbot renew --quiet --deploy-hook "docker compose -f /opt/blog/docker-compose.yml restart nginx"

echo "SSL 证书续期完成"
EOFSCRIPT

chmod +x /usr/local/bin/renew-ssl.sh

# 添加到 crontab
(crontab -l 2>/dev/null | grep -v "certbot renew"; echo "0 3 * * * /usr/local/bin/renew-ssl.sh >> /var/log/ssl-renew.log 2>&1") | crontab -

echo -e "${GREEN}✓ 自动续期已配置${NC}"
echo -e "${INFO} 续期时间: 每天凌晨 3 点"

###############################################################################
# 完成
###############################################################################

echo ""
echo -e "${BLUE}=====================================${NC}"
echo -e "${BLUE}SSL 配置完成！${NC}"
echo -e "${BLUE}=====================================${NC}"
echo ""
echo -e "${GREEN}✓ SSL 证书配置成功！${NC}"
echo ""
echo -e "${INFO} 访问地址:"
echo -e "  HTTPS: https://${DOMAIN}"
echo -e "  HTTP:  http://${DOMAIN} (会重定向到 HTTPS)"
echo ""
echo -e "${INFO} 证书信息:"
certbot certificates
echo ""
echo -e "${INFO} 下一步操作:"
echo "  1. 运行验证测试: bash scripts/deployment/verify-deployment.sh https://${DOMAIN}"
echo "  2. 查看证书有效期: certbot certificates"
echo "  3. 测试续期: certbot renew --dry-run"
echo ""
echo -e "${YELLOW}⚠ 重要提醒:${NC}"
echo "  - 证书有效期为 90 天"
echo "  - 系统会自动续期证书"
echo "  - 确保防火墙开放 80 和 443 端口"
echo ""
echo -e "${INFO} 完成时间: $(date '+%Y-%m-%d %H:%M:%S')"
echo ""

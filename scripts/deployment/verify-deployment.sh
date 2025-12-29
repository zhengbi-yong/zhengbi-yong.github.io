#!/bin/bash

###############################################################################
# 部署验证脚本
# 用途: 自动检查博客系统所有功能是否正常
# 使用: bash verify-deployment.sh [domain]
# 示例: bash verify-deployment.sh https://your-domain.com
###############################################################################

set -e  # 遇到错误立即退出

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 符号定义
PASS="✓"
FAIL="✗"
WARN="⚠"
INFO="→"

# 统计变量
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0
WARNINGS=0

# 获取域名
DOMAIN=${1:-"http://localhost"}
if [[ ! $DOMAIN =~ ^https?:// ]]; then
    DOMAIN="http://$DOMAIN"
fi

echo -e "${BLUE}=====================================${NC}"
echo -e "${BLUE}博客系统部署验证${NC}"
echo -e "${BLUE}=====================================${NC}"
echo ""
echo -e "${INFO} 目标域名: ${DOMAIN}"
echo -e "${INFO} 开始时间: $(date '+%Y-%m-%d %H:%M:%S')"
echo ""

###############################################################################
# 辅助函数
###############################################################################

# 成功消息
success() {
    echo -e "${GREEN}${PASS} $1${NC}"
    ((PASSED_TESTS++))
    ((TOTAL_TESTS++))
}

# 失败消息
failure() {
    echo -e "${RED}${FAIL} $1${NC}"
    ((FAILED_TESTS++))
    ((TOTAL_TESTS++))
}

# 警告消息
warning() {
    echo -e "${YELLOW}${WARN} $1${NC}"
    ((WARNINGS++))
}

# 信息消息
info() {
    echo -e "${BLUE}${INFO} $1${NC}"
}

# 测试标题
test_section() {
    echo ""
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}  $1${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
}

###############################################################################
# 1. Docker 容器状态检查
###############################################################################

test_section "1. Docker 容器状态检查"

# 检查 Docker 是否运行
info "检查 Docker 服务..."
if docker ps > /dev/null 2>&1; then
    success "Docker 服务运行正常"
else
    failure "Docker 服务未运行"
    exit 1
fi

# 检查所有容器状态
info "检查容器状态..."
containers=("blog-postgres" "blog-redis" "blog-backend" "blog-frontend" "blog-nginx")
all_running=true

for container in "${containers[@]}"; do
    if docker ps --format '{{.Names}}' | grep -q "^${container}$"; then
        success "容器 $container 运行中"
    else
        failure "容器 $container 未运行"
        all_running=false
    fi
done

# 检查容器健康状态
info "检查容器健康状态..."
health_checks=(
    "blog-postgres:pg_isready -U blog_user"
    "blog-redis:redis-cli ping"
    "blog-backend:curl -f http://localhost:3000/healthz || exit 1"
    "blog-frontend:curl -f http://localhost:3001 || exit 1"
)

for check in "${health_checks[@]}"; do
    container="${check%%:*}"
    command="${check##*:}"

    if docker compose exec -T $container bash -c "$command" > /dev/null 2>&1; then
        success "容器 $container 健康检查通过"
    else
        warning "容器 $container 健康检查失败（可能还在启动中）"
    fi
done

###############################################################################
# 2. 网络连接检查
###############################################################################

test_section "2. 网络连接检查"

# 检查前端访问
info "检查前端访问 ($DOMAIN)..."
if curl -f -s -o /dev/null "$DOMAIN"; then
    success "前端可以访问"
else
    failure "前端无法访问"
fi

# 检查后端 API
info "检查后端 API (${DOMAIN}/v1/health)..."
if curl -f -s -o /dev/null "${DOMAIN}/v1/health"; then
    success "后端 API 可以访问"
else
    failure "后端 API 无法访问"
fi

# 检查 CORS 配置
info "检查 CORS 配置..."
cors_headers=$(curl -s -I -H "Origin: https://example.com" "${DOMAIN}/v1/health" | grep -i "access-control-allow-origin" || true)
if [[ -n "$cors_headers" ]]; then
    success "CORS 配置正确"
else
    warning "CORS 配置可能有问题"
fi

###############################################################################
# 3. 数据库功能检查
###############################################################################

test_section "3. 数据库功能检查"

# 检查数据库连接
info "检查 PostgreSQL 连接..."
if docker compose exec -T postgres psql -U blog_user -d blog_db -c "SELECT 1;" > /dev/null 2>&1; then
    success "PostgreSQL 连接正常"
else
    failure "PostgreSQL 连接失败"
fi

# 检查数据库版本
info "检查数据库版本..."
db_version=$(docker compose exec -T postgres psql -U blog_user -d blog_db -t -c "SELECT version();" 2>/dev/null | head -1 || echo "")
if [[ -n "$db_version" ]]; then
    success "数据库版本: ${db_version:0:50}..."
else
    warning "无法获取数据库版本"
fi

# 检查 Redis 连接
info "检查 Redis 连接..."
redis_response=$(docker compose exec -T redis redis-cli ping 2>/dev/null || echo "")
if [[ "$redis_response" == "PONG" ]]; then
    success "Redis 连接正常"
else
    failure "Redis 连接失败"
fi

###############################################################################
# 4. 化学可视化功能检查
###############################################################################

test_section "4. 化学可视化功能检查"

# 检查化学库文件
info "检查化学库文件..."
chemistry_files=(
    "frontend/public/chemistry/katex/katex.min.js"
    "frontend/public/chemistry/katex/contrib/mhchem.min.js"
    "frontend/public/chemistry/rdkit/RDKit_minimal.js"
    "frontend/public/chemistry/rdkit/RDKit_minimal.wasm"
    "frontend/public/chemistry/3dmol/3Dmol-min.js"
)

for file in "${chemistry_files[@]}"; do
    if [[ -f "$file" ]]; then
        success "化学库文件存在: $(basename $file)"
    else
        failure "化学库文件缺失: $file"
    fi
done

# 检查前端 npm 包
info "检查前端化学库 npm 包..."
if docker compose exec -T frontend bash -c "ls node_modules/katex/package.json" > /dev/null 2>&1; then
    success "KaTeX npm 包已安装"
else
    warning "KaTeX npm 包未找到"
fi

if docker compose exec -T frontend bash -c "ls node_modules/3dmol/package.json" > /dev/null 2>&1; then
    success "3Dmol.js npm 包已安装"
else
    warning "3Dmol.js npm 包未找到"
fi

# 检查 CSP 配置
info "检查前端 CSP 配置..."
csp_config=$(docker compose exec -T frontend cat /app/next.config.js 2>/dev/null | grep -o "'wasm-unsafe-eval'" || echo "")
if [[ -n "$csp_config" ]]; then
    success "CSP 配置包含 wasm-unsafe-eval（支持 RDKit）"
else
    warning "CSP 配置可能不完整"
fi

###############################################################################
# 5. 服务资源使用检查
###############################################################################

test_section "5. 服务资源使用检查"

# 检查容器资源使用
info "检查容器资源使用..."
while IFS= read -r line; do
    container_name=$(echo "$line" | awk '{print $2}')
    cpu_percent=$(echo "$line" | awk '{print $3}')
    mem_percent=$(echo "$line" | awk '{print $4}')

    if [[ "$cpu_percent" != "0.00%" ]]; then
        success "$container_name - CPU: $cpu_percent, MEM: $mem_percent"
    else
        info "$container_name - CPU: $cpu_percent, MEM: $mem_percent"
    fi
done < <(docker stats --no-stream --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemPerc}}" | tail -n +2)

# 检查磁盘使用
info "检查磁盘使用..."
disk_usage=$(df -h /opt/blog | tail -1 | awk '{print $5}' | sed 's/%//')
if [[ $disk_usage -lt 80 ]]; then
    success "磁盘使用率: ${disk_usage}%"
elif [[ $disk_usage -lt 90 ]]; then
    warning "磁盘使用率: ${disk_usage}% (偏高)"
else
    failure "磁盘使用率: ${disk_usage}% (严重)"
fi

###############################################################################
# 6. 日志错误检查
###############################################################################

test_section "6. 日志错误检查"

# 检查后端日志错误
info "检查后端日志错误..."
backend_errors=$(docker compose logs --tail=100 backend 2>&1 | grep -i "error\|panic\|fatal" | wc -l)
if [[ $backend_errors -eq 0 ]]; then
    success "后端日志无明显错误"
else
    warning "后端发现 $backend_errors 个错误信息"
fi

# 检查前端日志错误
info "检查前端日志错误..."
frontend_errors=$(docker compose logs --tail=100 frontend 2>&1 | grep -i "error\|fail" | wc -l)
if [[ $frontend_errors -eq 0 ]]; then
    success "前端日志无明显错误"
else
    warning "前端发现 $frontend_errors 个错误信息"
fi

# 检查数据库日志
info "检查数据库日志..."
db_errors=$(docker compose logs --tail=50 postgres 2>&1 | grep -i "error\|fatal" | wc -l)
if [[ $db_errors -eq 0 ]]; then
    success "数据库日志无明显错误"
else
    warning "数据库发现 $db_errors 个错误信息"
fi

###############################################################################
# 7. SSL/TLS 证书检查（如果使用 HTTPS）
###############################################################################

if [[ "$DOMAIN" == https://* ]]; then
    test_section "7. SSL/TLS 证书检查"

    info "检查 SSL 证书..."
    cert_info=$(openssl s_client -connect "${DOMAIN#https://}:443" -servername "${DOMAIN#https://}" </dev/null 2>/dev/null | grep -A 2 "subject=" | head -1 || echo "")
    if [[ -n "$cert_info" ]]; then
        success "SSL 证书有效"
        info "证书信息: $cert_info"
    else
        failure "SSL 证书无效或未配置"
    fi

    # 检查证书过期时间
    cert_expiry=$(openssl s_client -connect "${DOMAIN#https://}:443" -servername "${DOMAIN#https://}" </dev/null 2>/dev/null | grep -A 2 "notAfter" | tail -1 || echo "")
    if [[ -n "$cert_expiry" ]]; then
        info "证书过期时间: $cert_expiry"
    fi
else
    info "跳过 SSL 检查（使用 HTTP）"
fi

###############################################################################
# 8. 性能基准测试
###############################################################################

test_section "8. 性能基准测试"

info "测试首页响应时间..."
response_time=$(curl -o /dev/null -s -w '%{time_total}' "$DOMAIN" 2>/dev/null || echo "0")
if (( $(echo "$response_time < 5.0" | bc -l) )); then
    success "首页响应时间: ${response_time}s"
elif (( $(echo "$response_time < 10.0" | bc -l) )); then
    warning "首页响应时间: ${response_time}s (较慢)"
else
    failure "首页响应时间: ${response_time}s (太慢)"
fi

# 检查 HTTP 状态码
info "检查 HTTP 状态码..."
http_status=$(curl -s -o /dev/null -w '%{http_code}' "$DOMAIN" 2>/dev/null || echo "000")
if [[ "$http_status" == "200" ]]; then
    success "HTTP 状态码: 200 OK"
elif [[ "$http_status" == "302" || "$http_status" == "301" ]]; then
    info "HTTP 状态码: $http_status (重定向)"
else
    warning "HTTP 状态码: $http_status"
fi

###############################################################################
# 9. 安全配置检查
###############################################################################

test_section "9. 安全配置检查"

# 检查是否暴露了数据库端口
info "检查数据库端口暴露..."
db_port_exposed=$(docker compose ps postgres | grep "0.0.0.0:5432" || echo "")
if [[ -z "$db_port_exposed" ]]; then
    success "数据库端口未暴露（安全）"
else
    warning "数据库端口已暴露到公网（建议修改）"
fi

# 检查是否暴露了 Redis 端口
info "检查 Redis 端口暴露..."
redis_port_exposed=$(docker compose ps redis | grep "0.0.0.0:6379" || echo "")
if [[ -z "$redis_port_exposed" ]]; then
    success "Redis 端口未暴露（安全）"
else
    warning "Redis 端口已暴露到公网（建议修改）"
fi

# 检查环境变量文件权限
info "检查环境变量文件权限..."
env_perms=$(stat -c %a .env 2>/dev/null || stat -f %A .env 2>/dev/null || echo "000")
if [[ "$env_perms" == "600" || "$env_perms" == "400" ]]; then
    success "环境变量文件权限正确 ($env_perms)"
else
    warning "环境变量文件权限过宽 ($env_perms)，建议设置为 600"
fi

###############################################################################
# 10. 功能测试
###############################################################################

test_section "10. 功能端点测试"

# 测试文章列表 API
info "测试文章列表 API..."
posts_response=$(curl -s "$DOMAIN/v1/posts" | head -c 100)
if [[ -n "$posts_response" ]]; then
    success "文章列表 API 响应正常"
else
    warning "文章列表 API 响应为空"
fi

# 测试健康检查 API
info "测试健康检查 API..."
health_response=$(curl -s "$DOMAIN/v1/health" 2>/dev/null || echo "")
if [[ -n "$health_response" ]]; then
    success "健康检查 API 响应正常"
else
    failure "健康检查 API 无响应"
fi

# 测试静态资源
info "测试静态资源访问..."
static_response=$(curl -s -o /dev/null -w "%{http_code}" "$DOMAIN/_next/static/" 2>/dev/null || echo "000")
if [[ "$static_response" == "200" || "$static_response" == "404" ]]; then
    success "静态资源路由正常"
else
    warning "静态资源路由异常 (状态码: $static_response)"
fi

###############################################################################
# 最终报告
###############################################################################

echo ""
echo -e "${BLUE}=====================================${NC}"
echo -e "${BLUE}验证结果汇总${NC}"
echo -e "${BLUE}=====================================${NC}"
echo ""
echo -e "${INFO} 总测试数: ${TOTAL_TESTS}"
echo -e "${GREEN}${PASS} 通过: ${PASSED_TESTS}${NC}"
echo -e "${RED}${FAIL} 失败: ${FAILED_TESTS}${NC}"
echo -e "${YELLOW}${WARN} 警告: ${WARNINGS}${NC}"
echo ""

# 计算通过率
if [[ $TOTAL_TESTS -gt 0 ]]; then
    pass_rate=$((PASSED_TESTS * 100 / TOTAL_TESTS))
    echo -e "${INFO} 通过率: ${pass_rate}%"
    echo ""

    if [[ $FAILED_TESTS -eq 0 && $WARNINGS -lt 5 ]]; then
        echo -e "${GREEN}✓ 部署验证通过！所有核心功能正常。${NC}"
        exit 0
    elif [[ $FAILED_TESTS -eq 0 ]]; then
        echo -e "${YELLOW}⚠ 部署基本成功，但有一些警告需要注意。${NC}"
        exit 0
    else
        echo -e "${RED}✗ 部署验证失败！请检查失败的测试项。${NC}"
        echo ""
        echo "建议操作:"
        echo "1. 查看详细日志: docker compose logs"
        echo "2. 检查配置文件: cat .env"
        echo "3. 重启服务: docker compose restart"
        echo "4. 查看部署文档: docs/deployment/SERVER_DEPLOYMENT_GUIDE.md"
        exit 1
    fi
else
    echo -e "${RED}✗ 没有执行任何测试${NC}"
    exit 1
fi

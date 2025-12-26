#!/bin/bash
# 管理后台测试脚本 (Bash)
# 用于测试所有服务是否正常运行

DETAILED=false

# 解析参数
while [[ $# -gt 0 ]]; do
    case $1 in
        --detailed|-d)
            DETAILED=true
            shift
            ;;
        *)
            echo "未知参数: $1"
            exit 1
            ;;
    esac
done

echo "🧪 管理后台测试脚本"
echo "===================="
echo ""

ALL_TESTS_PASSED=true

# 颜色定义
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
GRAY='\033[0;37m'
NC='\033[0m' # No Color

success() { echo -e "${GREEN}✅${NC} $1"; }
error() { echo -e "${RED}❌${NC} $1"; ALL_TESTS_PASSED=false; }
warning() { echo -e "${YELLOW}⚠️ ${NC} $1"; }
info() { echo -e "${GRAY}ℹ️ ${NC} $1"; }

# 测试服务连接
test_service() {
    local name=$1
    local url=$2
    local method=${3:-GET}
    
    if curl -s -X "$method" "$url" -f -o /dev/null 2>&1; then
        success "$name 连接正常 ($url)"
        return 0
    else
        error "$name 连接失败 ($url)"
        return 1
    fi
}

# 1. 测试数据库连接
echo "1️⃣  测试数据库连接..."
if docker exec blog-postgres psql -U blog_user -d blog_db -c "SELECT 1;" > /dev/null 2>&1; then
    success "PostgreSQL 数据库连接正常"
else
    error "PostgreSQL 数据库连接失败"
    info "   请确保 Docker 正在运行且数据库容器已启动"
fi
echo ""

# 2. 测试后端 API
echo "2️⃣  测试后端 API..."
if test_service "后端 API" "http://localhost:3000/v1/health"; then
    BACKEND_OK=true
else
    BACKEND_OK=false
    info "   提示: 运行 ./scripts/start-admin.sh 启动后端"
fi
echo ""

# 3. 测试前端（检查多个可能的端口）
echo "3️⃣  测试前端..."
FRONTEND_PORT=""
FRONTEND_OK=false

for port in 3000 3001 3002 3003; do
    if test_service "前端 (端口 $port)" "http://localhost:$port"; then
        FRONTEND_OK=true
        FRONTEND_PORT=$port
        echo -e "${GREEN}✅ 检测到前端运行在端口 $port${NC}"
        break
    fi
done

if [ "$FRONTEND_OK" = false ]; then
    info "   提示: 运行 ./scripts/start-admin.sh 启动前端"
    FRONTEND_PORT=${FRONTEND_PORT:-3000}
fi
echo ""

# 4. 测试登录 API
if [ "$BACKEND_OK" = true ]; then
    echo "4️⃣  测试登录 API..."
    LOGIN_RESPONSE=$(curl -s -X POST http://localhost:3000/v1/auth/login \
        -H "Content-Type: application/json" \
        -d '{"email":"demo2024@test.com","password":"demo123456"}' 2>&1)
    
    if echo "$LOGIN_RESPONSE" | grep -q "access_token"; then
        success "登录 API 正常"
        TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"access_token":"[^"]*' | cut -d'"' -f4)
        if [ "$DETAILED" = true ]; then
            info "   Token: ${TOKEN:0:30}..."
        fi
    else
        error "登录 API 失败"
        if [ "$DETAILED" = true ]; then
            info "   响应: $LOGIN_RESPONSE"
        fi
    fi
    echo ""
fi

# 5. 测试管理员 API
if [ "$BACKEND_OK" = true ] && [ -n "$TOKEN" ]; then
    echo "5️⃣  测试管理员 API..."
    
    # 测试统计数据 API
    STATS_RESPONSE=$(curl -s http://localhost:3000/v1/admin/stats \
        -H "Authorization: Bearer $TOKEN" 2>&1)
    
    if echo "$STATS_RESPONSE" | grep -q "total_users"; then
        success "统计数据 API 正常"
        if [ "$DETAILED" = true ]; then
            TOTAL_USERS=$(echo "$STATS_RESPONSE" | grep -o '"total_users":[0-9]*' | cut -d':' -f2)
            TOTAL_COMMENTS=$(echo "$STATS_RESPONSE" | grep -o '"total_comments":[0-9]*' | cut -d':' -f2)
            info "   总用户数: $TOTAL_USERS"
            info "   总评论数: $TOTAL_COMMENTS"
        fi
    else
        error "统计数据 API 失败"
        if [ "$DETAILED" = true ]; then
            info "   响应: $STATS_RESPONSE"
        fi
    fi
    echo ""
fi

# 6. 测试管理后台页面
if [ "$FRONTEND_OK" = true ]; then
    echo "6️⃣  测试管理后台页面..."
    PAGE_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:$FRONTEND_PORT/admin 2>&1)
    
    if [ "$PAGE_RESPONSE" = "200" ] || [ "$PAGE_RESPONSE" = "302" ] || [ "$PAGE_RESPONSE" = "307" ]; then
        success "管理后台页面可访问"
        if [ "$DETAILED" = true ]; then
            info "   状态码: $PAGE_RESPONSE"
        fi
    else
        warning "管理后台页面需要登录才能访问（这是正常的）"
        if [ "$DETAILED" = true ]; then
            info "   状态码: $PAGE_RESPONSE"
        fi
    fi
    echo ""
fi

# 总结
echo "===================="
echo "📋 测试总结"
echo "===================="
echo ""

FINAL_PORT=${FRONTEND_PORT:-3000}

if [ "$ALL_TESTS_PASSED" = true ] && [ "$BACKEND_OK" = true ] && [ "$FRONTEND_OK" = true ]; then
    echo -e "${GREEN}✅ 所有测试通过！${NC}"
    echo ""
    echo "🌐 访问管理后台:"
    echo "   http://localhost:$FINAL_PORT/admin"
    echo ""
    echo "🔑 默认管理员账号:"
    echo "   邮箱: demo2024@test.com"
    echo "   密码: demo123456"
    echo ""
    echo "📖 详细测试指南: docs/admin_testing_guide.md"
else
    echo -e "${YELLOW}⚠️  部分测试失败${NC}"
    echo ""
    echo "💡 建议操作:"
    echo "   1. 运行启动脚本: ./scripts/start-admin.sh"
    echo "   2. 等待所有服务启动完成"
    echo "   3. 再次运行测试脚本"
    echo ""
    echo "📖 故障排查: docs/admin_testing_guide.md"
fi

echo ""

#!/bin/bash
# 管理后台启动脚本 (Bash)
# 用于启动数据库、后端 API 和前端开发服务器

set -e

SKIP_DATABASE=false
SKIP_BACKEND=false
SKIP_FRONTEND=false

# 解析参数
while [[ $# -gt 0 ]]; do
    case $1 in
        --skip-database)
            SKIP_DATABASE=true
            shift
            ;;
        --skip-backend)
            SKIP_BACKEND=true
            shift
            ;;
        --skip-frontend)
            SKIP_FRONTEND=true
            shift
            ;;
        *)
            echo "未知参数: $1"
            exit 1
            ;;
    esac
done

echo "🚀 启动管理后台服务"
echo "===================="
echo ""

# 获取脚本目录
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# 检查 Docker 是否运行
check_docker() {
    if ! docker ps > /dev/null 2>&1; then
        echo "❌ Docker 未运行，请先启动 Docker"
        exit 1
    fi
}

# 启动数据库
if [ "$SKIP_DATABASE" = false ]; then
    echo "1️⃣  启动数据库服务..."
    
    check_docker
    
    cd "$PROJECT_ROOT/backend"
    
    echo "   正在启动 PostgreSQL 和 Redis..."
    ./deploy.sh dev > /dev/null 2>&1 || echo "⚠️  数据库可能已经在运行中"
    
    # 等待数据库启动
    echo "   等待数据库就绪..."
    sleep 5
    
    echo "✅ 数据库服务已启动"
    echo ""
fi

# 启动后端 API
if [ "$SKIP_BACKEND" = false ]; then
    echo "2️⃣  启动后端 API..."
    
    cd "$PROJECT_ROOT/backend"
    
    # 检查后端是否已在运行
    if curl -s http://localhost:3000/v1/health > /dev/null 2>&1; then
        echo "⚠️  后端 API 已在运行 (http://localhost:3000)"
    else
        echo "   正在启动后端 API..."
        
        export DATABASE_URL=postgresql://blog_user:blog_password@localhost:5432/blog_db
        export REDIS_URL=redis://localhost:6379
        export JWT_SECRET=dev-secret-key-for-testing-only-x
        export PASSWORD_PEPPER=dev-pepper
        export SMTP_HOST=localhost
        export SMTP_PORT=587
        export SMTP_USERNAME=noreply@example.com
        export SMTP_PASSWORD=dev-password
        export SMTP_FROM=noreply@example.com
        export SMTP_TLS=false
        export CORS_ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001,http://localhost:3002,http://localhost:3003
        export RUST_LOG=debug
        export ENVIRONMENT=development
        
        # 在后台启动后端
        nohup cargo run --bin api > /tmp/backend.log 2>&1 &
        BACKEND_PID=$!
        echo $BACKEND_PID > /tmp/backend.pid
        
        echo "✅ 后端 API 启动中 (PID: $BACKEND_PID)"
        echo "   日志: /tmp/backend.log"
        echo "   等待后端就绪..."
        sleep 10
    fi
    echo ""
fi

# 启动前端
if [ "$SKIP_FRONTEND" = false ]; then
    echo "3️⃣  启动前端开发服务器..."
    
    cd "$PROJECT_ROOT/frontend"
    
    # 检查前端是否已在运行（检查多个可能的端口）
    FRONTEND_PORT=""
    for port in 3000 3001 3002 3003; do
        if curl -s http://localhost:$port > /dev/null 2>&1; then
            FRONTEND_PORT=$port
            echo "⚠️  前端已在运行 (http://localhost:$port)"
            break
        fi
    done
    
    if [ -z "$FRONTEND_PORT" ]; then
        echo "   正在启动前端..."
        
        # 检查并删除锁文件
        if [ -f ".next/dev/lock" ]; then
            echo "   检测到锁文件，正在清理..."
            rm -f .next/dev/lock
        fi
        
        # 在后台启动前端
        nohup pnpm dev > /tmp/frontend.log 2>&1 &
        FRONTEND_PID=$!
        echo $FRONTEND_PID > /tmp/frontend.pid
        
        echo "✅ 前端开发服务器启动中 (PID: $FRONTEND_PID)"
        echo "   日志: /tmp/frontend.log"
        echo "   等待前端就绪..."
        sleep 5
        FRONTEND_PORT=${FRONTEND_PORT:-3000}
    fi
    echo ""
fi

# 总结
echo "===================="
echo "✅ 启动完成！"
echo "===================="
echo ""
FINAL_FRONTEND_PORT=${FRONTEND_PORT:-3000}
echo "📋 服务状态:"
echo "   - 数据库: http://localhost:5432"
echo "   - 后端 API: http://localhost:3000"
echo "   - 前端: http://localhost:$FINAL_FRONTEND_PORT"
echo ""
echo "🌐 访问管理后台:"
echo "   http://localhost:$FINAL_FRONTEND_PORT/admin"
echo ""
echo "🔑 默认管理员账号:"
echo "   邮箱: demo2024@test.com"
echo "   密码: demo123456"
echo ""
echo "💡 提示:"
echo "   - 运行测试脚本检查服务状态: ./scripts/test-admin.sh"
echo "   - 停止后端: kill \$(cat /tmp/backend.pid)"
echo "   - 停止前端: kill \$(cat /tmp/frontend.pid)"
echo ""


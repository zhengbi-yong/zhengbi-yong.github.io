#!/bin/bash
# 开发环境启动脚本
# 混合模式：数据库 Docker + 前后端本地运行

set -e

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$PROJECT_ROOT"

echo "=== 启动开发环境 ==="
echo ""

# 加载 Rust 环境
source ~/.cargo/env

# 设置后端环境变量
export DATABASE_URL=postgresql://blog_user:blog_password@localhost:5432/blog_db
export REDIS_URL=redis://localhost:6379
export JWT_SECRET=vH4JcUlc03hOt4vOGjo6eO/3Iv/mQs42S3r93a9lbrQ=
export PASSWORD_PEPPER=QZlYevqR3wtUS/+0jN0nrqUvafJt5irCZs9ZwKF8YG8=
export SESSION_SECRET=4pJQlFmAMeKlJK40O9vf2n2ySBYjaHBQtdTdJU6afkk=
export RUST_LOG=debug
export CORS_ALLOWED_ORIGINS=http://localhost:3001
export ENVIRONMENT=development

# 检查数据库状态
echo "1. 检查数据库状态..."
if docker compose -f "$PROJECT_ROOT/docker-compose.dev.yml" ps | grep -q "blog-postgres.*Up"; then
    echo "   ✓ PostgreSQL 运行中"
else
    echo "   ✗ PostgreSQL 未运行，正在启动..."
    docker compose -f "$PROJECT_ROOT/docker-compose.dev.yml" up -d
    sleep 3
fi

if docker compose -f "$PROJECT_ROOT/docker-compose.dev.yml" ps | grep -q "blog-redis.*Up"; then
    echo "   ✓ Redis 运行中"
else
    echo "   ✗ Redis 未运行，正在启动..."
    docker compose -f "$PROJECT_ROOT/docker-compose.dev.yml" up -d
    sleep 3
fi

echo ""
echo "=== 选择要启动的服务 ==="
echo "1) 仅后端"
echo "2) 仅前端"
echo "3) 后端 + 前端"
echo "4) 全部停止"
echo ""
read -p "请输入选择 (1-4): " choice

case $choice in
    1)
        echo ""
        echo "启动后端（在后台）..."
        cd "$PROJECT_ROOT/backend"
        cargo run --bin api
        ;;
    2)
        echo ""
        echo "启动前端..."
        cd "$PROJECT_ROOT/frontend"
        pnpm dev
        ;;
    3)
        echo ""
        echo "启动后端和前端..."
        echo "后端将在后台启动，前端在当前终端..."
        
        # 启动后端（后台）
        cd "$PROJECT_ROOT/backend"
        cargo run --bin api > /tmp/backend.log 2>&1 &
        BACKEND_PID=$!
        echo "   后端 PID: $BACKEND_PID"
        
        # 等待后端启动
        sleep 5
        
        # 启动前端（前台）
        cd "$PROJECT_ROOT/frontend"
        echo "   启动前端..."
        pnpm dev
        
        # 前端结束后清理后端
        kill $BACKEND_PID 2>/dev/null || true
        ;;
    4)
        echo ""
        echo "停止所有服务..."
        pkill -f "cargo run" || true
        pkill -f "pnpm dev" || true
        pkill -f "next-dev" || true
        docker compose -f "$PROJECT_ROOT/docker-compose.dev.yml" down
        echo "✓ 所有服务已停止"
        ;;
    *)
        echo "无效选择"
        exit 1
        ;;
esac

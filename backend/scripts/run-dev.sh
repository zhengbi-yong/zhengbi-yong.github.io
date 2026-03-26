#!/bin/bash
# 开发环境启动脚本

set -e

echo "🚀 启动后端开发服务器..."
echo ""

# 检查 .env 文件是否存在
ENV_FILE="$(dirname "$0")/../.env"
if [ ! -f "$ENV_FILE" ]; then
    echo "📝 创建 .env 文件..."
    EXAMPLE_FILE="$(dirname "$0")/../.env.example"
    if [ -f "$EXAMPLE_FILE" ]; then
        cp "$EXAMPLE_FILE" "$ENV_FILE"
        echo "✅ .env 文件已创建（从 .env.example）"
    else
        echo "⚠️  .env.example 文件不存在，请手动创建 .env 文件"
    fi
fi

# 设置环境变量（作为备用，dotenv 会优先加载 .env 文件）
export DATABASE_URL="postgresql://blog_user:blog_password@localhost:5432/blog_db"
export REDIS_URL="redis://localhost:6379"
export JWT_SECRET="dev-secret-key-for-testing-only-32-chars-long"
export PASSWORD_PEPPER="dev-password-pepper-for-testing-32-chars"
export SMTP_USERNAME="dev@example.com"
export SMTP_PASSWORD="dev-password"
export SMTP_FROM="noreply@example.com"
export SMTP_HOST="smtp.gmail.com"
export SMTP_PORT="587"
export SMTP_TLS="true"
export SERVER_HOST="0.0.0.0"
export SERVER_PORT="3000"
export RUST_LOG="debug"

echo ""
echo "📦 运行后端服务..."
echo ""

# 运行后端
cargo run -p blog-migrator
cargo run --bin api

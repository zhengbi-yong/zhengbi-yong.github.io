#!/bin/bash
# 启动后端服务器

set -e

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$PROJECT_ROOT/backend"

# 加载 Rust 环境
source ~/.cargo/env

# 设置环境变量
export DATABASE_URL=postgresql://blog_user:blog_password@localhost:5432/blog_db
export REDIS_URL=redis://localhost:6379
export JWT_SECRET=vH4JcUlc03hOt4vOGjo6eO/3Iv/mQs42S3r93a9lbrQ=
export PASSWORD_PEPPER=QZlYevqR3wtUS/+0jN0nrqUvafJt5irCZs9ZwKF8YG8=
export SESSION_SECRET=4pJQlFmAMeKlJK40O9vf2n2ySBYjaHBQtdTdJU6afkk=
export RUST_LOG=debug
export CORS_ALLOWED_ORIGINS=http://localhost:3001
export ENVIRONMENT=development

echo "=== 启动后端服务器 ==="
echo "数据库: $DATABASE_URL"
echo "Redis: $REDIS_URL"
echo ""

# 运行 API 服务器
cargo run --bin api 2>&1

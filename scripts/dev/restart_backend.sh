#!/bin/bash
cd /d/YZB/zhengbi-yong.github.io/backend

echo "Building backend..."
cargo build --bin api

if [ $? -eq 0 ]; then
    echo "Build successful! Starting backend..."
    DATABASE_URL="postgresql://blog_user:blog_password@localhost:5432/blog_db" \
    REDIS_URL="redis://localhost:6379" \
    JWT_SECRET="dev-secret-key-for-testing-only-32-chars" \
    HOST="127.0.0.1" \
    PORT="3000" \
    RUST_LOG="debug" \
    ENVIRONMENT="development" \
    PASSWORD_PEPPER="dev-pepper" \
    CORS_ALLOWED_ORIGINS="http://localhost:3001,http://localhost:3000,http://localhost:3002,http://localhost:3003" \
    RATE_LIMIT_PER_MINUTE="1000" \
    SESSION_SECRET="dev-session-secret" \
    PROMETHEUS_ENABLED="true" \
    SMTP_HOST="localhost" \
    SMTP_PORT="587" \
    SMTP_USERNAME="dev@example.com" \
    SMTP_PASSWORD="dev-password" \
    SMTP_FROM="noreply@example.com" \
    ./target/debug/api
else
    echo "Build failed!"
    exit 1
fi

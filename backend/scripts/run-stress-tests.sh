#!/bin/bash
# 运行后端压力测试脚本

set -e

echo "🧪 运行后端压力测试和边界情况测试..."
echo ""

# 检查后端是否运行
echo "🔍 检查后端服务状态..."

BASE_URL="http://localhost:3000"
MAX_RETRIES=5
RETRY_COUNT=0
RETRY_DELAY=2
IS_RUNNING=false

# 首先检查端口是否被占用
echo "   检查端口 3000..."
if command -v nc >/dev/null 2>&1; then
    if nc -z localhost 3000 2>/dev/null; then
        echo "   ✓ 端口 3000 正在监听"
    else
        echo "   ⚠️  端口 3000 未被占用"
    fi
fi

while [ $RETRY_COUNT -lt $MAX_RETRIES ] && [ "$IS_RUNNING" = false ]; do
    if curl -s -f -m 10 "$BASE_URL/healthz" > /dev/null 2>&1; then
        IS_RUNNING=true
        echo "✅ 后端服务运行中"
        
        # 尝试获取健康状态详情
        HEALTH_STATUS=$(curl -s "$BASE_URL/healthz" 2>/dev/null | grep -o '"status":"[^"]*"' | head -1 || echo "")
        if [ -n "$HEALTH_STATUS" ]; then
            echo "   服务状态: $HEALTH_STATUS"
        fi
    else
        RETRY_COUNT=$((RETRY_COUNT + 1))
        
        # 检查错误类型
        CURL_ERROR=$(curl -s -f -m 5 "$BASE_URL/healthz" 2>&1)
        if echo "$CURL_ERROR" | grep -q "Connection refused"; then
            echo "   ⚠️  连接被拒绝 - 后端服务可能未启动"
        elif echo "$CURL_ERROR" | grep -q "timeout\|timed out"; then
            echo "   ⚠️  请求超时 - 后端服务可能响应缓慢"
        else
            echo "   ⚠️  连接失败"
        fi
        
        if [ $RETRY_COUNT -lt $MAX_RETRIES ]; then
            echo "   重试 $RETRY_COUNT/$MAX_RETRIES (等待 ${RETRY_DELAY}秒)..."
            sleep $RETRY_DELAY
            RETRY_DELAY=$((RETRY_DELAY < 5 ? RETRY_DELAY + 1 : 5))
        else
            echo ""
            echo "❌ 无法连接到后端服务"
            echo ""
            echo "诊断信息:"
            echo "  - 尝试连接的URL: $BASE_URL/healthz"
            echo "  - 重试次数: $MAX_RETRIES"
            echo ""
            echo "可能的解决方案:"
            echo "  1. 确保后端服务正在运行:"
            echo "     cd backend"
            echo "     cargo run"
            echo ""
            echo "  2. 检查后端是否在其他端口运行:"
            echo "     查看后端日志或配置文件中的端口设置"
            echo ""
            echo "  3. 检查防火墙设置:"
            echo "     确保端口 3000 未被防火墙阻止"
            echo ""
            echo "  4. 检查环境变量:"
            echo "     确保 .env 文件中的配置正确"
            echo ""
            echo "  5. 手动测试连接:"
            echo "     curl $BASE_URL/healthz"
            echo ""
            exit 1
        fi
    fi
done
echo ""

# 运行压力测试
echo "📦 运行压力测试..."
cargo test --test stress_tests --release -- --nocapture
if [ $? -ne 0 ]; then
    echo "❌ 压力测试失败"
    exit 1
fi
echo ""

# 运行安全性测试
echo "🔐 运行安全性测试..."
cargo test --test security_tests --release -- --nocapture
if [ $? -ne 0 ]; then
    echo "❌ 安全性测试失败"
    exit 1
fi
echo ""

# 运行集成测试
echo "🔗 运行集成测试..."
cargo test --test integration_tests --release -- --nocapture
if [ $? -ne 0 ]; then
    echo "❌ 集成测试失败"
    exit 1
fi
echo ""

echo "✅ 所有测试完成！"


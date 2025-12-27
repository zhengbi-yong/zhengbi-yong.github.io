#!/bin/bash
# 检查后端服务状态的独立脚本

URL="${1:-http://localhost:3000}"
TIMEOUT=10
MAX_RETRIES=5

echo "🔍 检查后端服务状态..."
echo "   URL: $URL"
echo ""

RETRY_COUNT=0
RETRY_DELAY=2
IS_RUNNING=false

# 提取端口
PORT=$(echo "$URL" | sed -n 's/.*:\([0-9]*\).*/\1/p')
PORT=${PORT:-3000}

# 检查端口
echo "   检查端口 $PORT..."
if command -v nc >/dev/null 2>&1; then
    if nc -z localhost "$PORT" 2>/dev/null; then
        echo "   ✓ 端口 $PORT 正在监听"
    else
        echo "   ⚠️  端口 $PORT 未被占用"
    fi
elif command -v netstat >/dev/null 2>&1; then
    if netstat -an 2>/dev/null | grep -q ":$PORT.*LISTEN"; then
        echo "   ✓ 端口 $PORT 正在监听"
    else
        echo "   ⚠️  端口 $PORT 未被占用"
    fi
fi

echo ""

# 尝试连接健康检查端点
while [ $RETRY_COUNT -lt $MAX_RETRIES ] && [ "$IS_RUNNING" = false ]; do
    HEALTH_URL="$URL/healthz"
    echo "   尝试连接: $HEALTH_URL (超时: ${TIMEOUT}秒)..."
    
    if curl -s -f -m $TIMEOUT "$HEALTH_URL" > /dev/null 2>&1; then
        IS_RUNNING=true
        echo ""
        echo "✅ 后端服务运行正常！"
        
        # 获取详细信息
        HEALTH_DATA=$(curl -s "$HEALTH_URL" 2>/dev/null)
        if [ -n "$HEALTH_DATA" ]; then
            STATUS=$(echo "$HEALTH_DATA" | grep -o '"status":"[^"]*"' | head -1 | cut -d'"' -f4)
            VERSION=$(echo "$HEALTH_DATA" | grep -o '"version":"[^"]*"' | head -1 | cut -d'"' -f4)
            UPTIME=$(echo "$HEALTH_DATA" | grep -o '"uptime_seconds":[0-9]*' | head -1 | cut -d':' -f2)
            
            echo "   状态码: 200"
            [ -n "$STATUS" ] && echo "   服务状态: $STATUS"
            [ -n "$VERSION" ] && echo "   版本: $VERSION"
            if [ -n "$UPTIME" ]; then
                HOURS=$((UPTIME / 3600))
                MINUTES=$(((UPTIME % 3600) / 60))
                SECONDS=$((UPTIME % 60))
                echo "   运行时间: ${HOURS}:$(printf "%02d" $MINUTES):$(printf "%02d" $SECONDS)"
            fi
        fi
        
        exit 0
    else
        RETRY_COUNT=$((RETRY_COUNT + 1))
        CURL_ERROR=$(curl -s -f -m 5 "$HEALTH_URL" 2>&1)
        
        echo "   ✗ 连接失败"
        
        if echo "$CURL_ERROR" | grep -q "Connection refused"; then
            echo "   原因: 连接被拒绝 - 后端服务可能未启动"
        elif echo "$CURL_ERROR" | grep -q "timeout\|timed out"; then
            echo "   原因: 请求超时 - 后端服务可能响应缓慢或未启动"
        else
            echo "   原因: 连接失败"
        fi
        
        if [ $RETRY_COUNT -lt $MAX_RETRIES ]; then
            echo "   等待 ${RETRY_DELAY}秒后重试 ($RETRY_COUNT/$MAX_RETRIES)..."
            sleep $RETRY_DELAY
            RETRY_DELAY=$((RETRY_DELAY < 5 ? RETRY_DELAY + 1 : 5))
        fi
    fi
done

# 如果所有重试都失败
echo ""
echo "❌ 无法连接到后端服务"
echo ""
echo "诊断信息:"
echo "  - URL: $URL"
echo "  - 端口: $PORT"
echo "  - 重试次数: $MAX_RETRIES"
echo ""
echo "解决方案:"
echo "  1. 启动后端服务:"
echo "     cd backend"
echo "     cargo run"
echo ""
echo "  2. 检查端口是否被占用:"
echo "     lsof -i :$PORT  # macOS/Linux"
echo "     netstat -ano | grep $PORT  # Windows"
echo ""
echo "  3. 检查环境变量配置:"
echo "     确保 .env 文件存在且配置正确"
echo ""
echo "  4. 手动测试:"
echo "     curl $URL/healthz"
echo ""

exit 1


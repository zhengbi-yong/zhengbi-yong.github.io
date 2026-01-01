#!/bin/bash
echo "Testing new API error response format..."

# 启动 API 服务器（后台）
cargo run --bin api &
API_PID=$!
echo "API Server PID: $API_PID"

# 等待服务器启动
sleep 5

# 测试 404 错误
echo -e "\n\n1. Testing 404 Error (POST_NOT_FOUND):"
curl -s http://localhost:3000/v1/posts/nonexistent-post | jq '.'

# 测试 401 错误
echo -e "\n\n2. Testing 401 Error (INVALID_TOKEN):"
curl -s http://localhost:3000/v1/auth/me -H "Authorization: Bearer invalid_token" | jq '.'

# 停止服务器
kill $API_PID
echo -e "\n\nTest completed!"

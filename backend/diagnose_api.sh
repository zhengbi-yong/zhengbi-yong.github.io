#!/bin/bash

echo "=== API诊断测试 ==="
echo ""

# 1. 测试健康检查
echo "1. 测试健康检查API:"
curl -s -w "\nHTTP状态: %{http_code}\n" http://localhost:3000/health
echo ""

# 2. 登录
echo "2. 测试登录API:"
LOGIN_RESPONSE=$(curl -s -w "\nHTTP状态: %{http_code}\n" -X POST http://localhost:3000/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@test.com","password":"xK9#mP2$vL8@nQ5*wR4"}')
echo "$LOGIN_RESPONSE"
echo ""

# 提取token（如果登录成功）
if echo "$LOGIN_RESPONSE" | grep -q "access_token"; then
  TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"access_token":"[^"]*"' | cut -d'"' -f4)
  echo "Token获取成功: ${TOKEN:0:30}..."
  echo "$TOKEN" > /tmp/debug_token.txt
  echo ""
else
  echo "❌ 登录失败！"
  exit 1
fi

# 3. 测试管理员统计API
echo "3. 测试管理员统计API:"
curl -s -w "\nHTTP状态: %{http_code}\n" -X GET http://localhost:3000/v1/admin/stats \
  -H "Authorization: Bearer $TOKEN"
echo ""

# 4. 测试创建分类API
echo "4. 测试创建分类API:"
echo "请求数据:"
echo '{
  "slug": "tech",
  "name": "技术",
  "description": "技术文章"
}'
echo ""
curl -s -w "\nHTTP状态: %{http_code}\n" -X POST http://localhost:3000/v1/categories \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "slug": "tech",
    "name": "技术",
    "description": "技术文章"
}'
echo ""

# 5. 测试创建文章API
echo "5. 测试创建文章API:"
cat > /tmp/post_data.json << 'EOF'
{
  "slug": "test-post",
  "title": "测试文章",
  "content": "这是一篇测试文章",
  "summary": "测试摘要",
  "status": "published"
}
EOF

echo "请求数据:"
cat /tmp/post_data.json
echo ""

curl -s -w "\nHTTP状态: %{http_code}\n" -X POST http://localhost:3000/v1/posts \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d @/tmp/post_data.json
echo ""

# 6. 检查数据库
echo "6. 检查数据库中的数据:"
docker exec blog-postgres psql -U blog_user -d blog_db << 'EOSQL'
SELECT 'posts' as table_name, COUNT(*) as count FROM posts
UNION ALL
SELECT 'categories', COUNT(*) FROM categories
UNION ALL
SELECT 'tags', COUNT(*) FROM tags;
EOSQL

echo ""
echo "=== 诊断完成 ==="

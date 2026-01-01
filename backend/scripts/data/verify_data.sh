#!/bin/bash

# 重新登录
echo "正在登录..."
curl -s -X POST http://localhost:3000/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@test.com","password":"xK9#mP2$vL8@nQ5*wR4"}' \
  > /tmp/login_verify.json

# 提取token
TOKEN=$(grep '"access_token"' /tmp/login_verify.json | cut -d'"' -f4)

echo ""
echo "=== 数据验证报告 ==="
echo ""

# 获取管理员统计
echo "1. 管理员统计:"
curl -s "http://localhost:3000/v1/admin/stats" \
  -H "Authorization: Bearer $TOKEN"
echo ""

# 获取文章列表
echo "2. 文章列表（前5篇）:"
curl -s "http://localhost:3000/v1/posts?limit=5" \
  -H "Authorization: Bearer $TOKEN" | \
  grep -E '"slug"|"title"' | head -20
echo ""

# 获取分类列表
echo "3. 分类列表:"
curl -s "http://localhost:3000/v1/categories" \
  -H "Authorization: Bearer $TOKEN" | \
  grep -E '"slug"|"name"' | head -10
echo ""

# 获取标签列表
echo "4. 标签列表:"
curl -s "http://localhost:3000/v1/tags" \
  -H "Authorization: Bearer $TOKEN" | \
  grep -E '"slug"|"name"' | head -10
echo ""

# 获取评论列表
echo "5. 评论列表（前5条）:"
curl -s "http://localhost:3000/v1/comments/hello-world?status=approved" \
  -H "Authorization: Bearer $TOKEN" | \
  grep -E '"content"' | head -5
echo ""

echo "=== 验证完成 ==="
echo ""
echo "💡 提示: 刷新浏览器（Ctrl+F5）查看新创建的数据"
echo "📊 访问 http://localhost:3001 查看前端"
echo "🔧 访问 http://localhost:3001/admin 查看管理后台"

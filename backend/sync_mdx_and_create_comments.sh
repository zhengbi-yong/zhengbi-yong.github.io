#!/bin/bash

echo "=== 1. 登录获取Token ==="
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:3000/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@test.com","password":"xK9#mP2$vL8@nQ5*wR4"}')

TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"access_token":"[^"]*"' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
  echo "❌ 登录失败"
  echo "$LOGIN_RESPONSE"
  exit 1
fi

echo "✅ Token获取成功: ${TOKEN:0:50}..."
echo ""

echo "=== 2. 同步MDX文章到数据库 ==="
SYNC_RESPONSE=$(curl -s -X POST http://localhost:3000/v1/admin/sync/mdx \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"force":true}')

echo "$SYNC_RESPONSE" | python -c "import sys, json; d=json.load(sys.stdin); print(json.dumps(d, indent=2, ensure_ascii=False))" 2>/dev/null || echo "$SYNC_RESPONSE"
echo ""

echo "=== 3. 检查数据库中的文章数量 ==="
sleep 2
docker exec blog-postgres psql -U blog_user -d blog_db -c "SELECT COUNT(*) as post_count FROM posts;"
echo ""

echo "=== 4. 创建测试评论 ==="
# 获取第一篇文章的slug
FIRST_POST=$(curl -s "http://localhost:3000/v1/posts?page=1&page_size=1" | python -c "import sys, json; d=json.load(sys.stdin); posts=d.get('data', d.get('posts', [])); print(posts[0]['slug'] if posts else '')" 2>/dev/null)

if [ -n "$FIRST_POST" ]; then
  echo "为文章 '$FIRST_POST' 创建评论..."

  # 注册一个测试用户
  USER_RESPONSE=$(curl -s -X POST http://localhost:3000/v1/auth/register \
    -H "Content-Type: application/json" \
    -d '{
      "email":"reader@example.com",
      "username":"reader",
      "password":"Reader123!"
    }')

  # 登录测试用户
  USER_TOKEN=$(curl -s -X POST http://localhost:3000/v1/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"reader@example.com","password":"Reader123!"}' | \
    grep -o '"access_token":"[^"]*"' | cut -d'"' -f4)

  if [ -n "$USER_TOKEN" ]; then
    # 创建评论
    COMMENT1=$(curl -s -X POST "http://localhost:3000/v1/comments/$FIRST_POST" \
      -H "Authorization: Bearer $USER_TOKEN" \
      -H "Content-Type: application/json" \
      -d '{"content":"这篇文章写得非常好！对我帮助很大。"}')

    echo "✅ 评论1创建成功"

    # 创建第二条评论
    sleep 1
    COMMENT2=$(curl -s -X POST "http://localhost:3000/v1/comments/$FIRST_POST" \
      -H "Authorization: Bearer $USER_TOKEN" \
      -H "Content-Type: application/json" \
      -d '{"content":"感谢分享，学到了很多新知识！"}')

    echo "✅ 评论2创建成功"

    # 用管理员账号审核评论
    sleep 1
    echo "审核评论..."

    # 获取评论列表（管理员API）
    ADMIN_COMMENTS=$(curl -s "http://localhost:3000/v1/admin/comments?page=1&page_size=10" \
      -H "Authorization: Bearer $TOKEN")

    echo "$ADMIN_COMMENTS" | python -c "
import sys, json
d = json.load(sys.stdin)
comments = d.get('comments', d.get('data', []))
for c in comments[:2]:
    print(c.get('id', ''))
" 2>/dev/null | while read COMMENT_ID; do
      if [ -n "$COMMENT_ID" ]; then
        curl -s -X PUT "http://localhost:3000/v1/admin/comments/$COMMENT_ID/status" \
          -H "Authorization: Bearer $TOKEN" \
          -H "Content-Type: application/json" \
          -d '{"status":"approved"}' > /dev/null
        echo "✅ 评论 $COMMENT_ID 已审核"
      fi
    done
  else
    echo "❌ 测试用户登录失败"
  fi
else
  echo "❌ 没有找到文章"
fi
echo ""

echo "=== 5. 验证结果 ==="
echo "文章总数:"
docker exec blog-postgres psql -U blog_user -d blog_db -c "SELECT COUNT(*) FROM posts;"
echo "评论总数:"
docker exec blog-postgres psql -U blog_user -d blog_db -c "SELECT COUNT(*) FROM comments;"
echo "已审核评论:"
docker exec blog-postgres psql -U blog_user -d blog_db -c "SELECT COUNT(*) FROM comments WHERE status='approved';"
echo ""

echo "=== 完成！==="
echo "💡 现在请刷新浏览器（Ctrl+F5）查看文章和评论"
echo "📄 访问 http://localhost:3001 查看文章列表"

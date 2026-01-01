#!/bin/bash

echo "=== 使用纯英文创建测试数据 ==="
echo ""

# 1. 登录
echo "Step 1: Login..."
LOGIN=$(curl -s -X POST http://localhost:3000/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@test.com","password":"xK9#mP2$vL8@nQ5*wR4"}')

TOKEN=$(echo "$LOGIN" | grep -o '"access_token":"[^"]*"' | cut -d'"' -f4)
echo "Token obtained"
echo ""

# 2. 创建分类（英文）
echo "Step 2: Create category..."
CAT_RESP=$(curl -s -X POST http://localhost:3000/v1/admin/categories \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "slug": "tech",
    "name": "Technology",
    "description": "Tech articles",
    "icon": "Code",
    "color": "#3B82F6"
  }')

echo "Category response: $CAT_RESP"
echo ""

# 3. 创建标签（英文）
echo "Step 3: Create tag..."
TAG_RESP=$(curl -s -X POST http://localhost:3000/v1/admin/tags \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "slug": "rust",
    "name": "Rust",
    "description": "Rust programming language"
  }')

echo "Tag response: $TAG_RESP"
echo ""

# 4. 创建文章（英文）
echo "Step 4: Create post..."
POST_RESP=$(curl -s -X POST http://localhost:3000/v1/admin/posts \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "slug": "hello-world",
    "title": "Hello World",
    "content": "Welcome to my blog!\n\nThis is my first post.",
    "summary": "My first blog post",
    "status": "published"
  }')

echo "Post response: $POST_RESP"
echo ""

# 5. 检查数据库
echo "Step 5: Check database..."
docker exec blog-postgres psql -U blog_user -d blog_db -c "
SELECT
  'categories' as table, COUNT(*) as count FROM categories
UNION ALL SELECT 'tags', COUNT(*) FROM tags
UNION ALL SELECT 'posts', COUNT(*) FROM posts;
"
echo ""

# 6. 查看管理后台文章列表
echo "Step 6: Check admin posts API..."
ADMIN_POSTS=$(curl -s "http://localhost:3000/v1/admin/posts" \
  -H "Authorization: Bearer $TOKEN")
echo "$ADMIN_POSTS"
echo ""

echo "=== Done ==="

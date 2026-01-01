#!/bin/bash

echo "=== 使用正确的状态值创建文章 ==="
echo ""

# 登录
LOGIN=$(curl -s -X POST http://localhost:3000/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@test.com","password":"xK9#mP2$vL8@nQ5*wR4"}')

TOKEN=$(echo "$LOGIN" | grep -o '"access_token":"[^"]*"' | cut -d'"' -f4)

# 创建多篇文章
echo "Creating posts..."
echo ""

# Post 1
echo "1. Creating post 1..."
curl -s -X POST http://localhost:3000/v1/admin/posts \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "slug": "hello-world",
    "title": "Hello World - My First Blog Post",
    "content": "Welcome to my blog!\n\nThis is my first post built with Rust and Next.js.",
    "summary": "My first blog post",
    "status": "Published"
  }' | head -5
echo ""

# Post 2
echo "2. Creating post 2..."
curl -s -X POST http://localhost:3000/v1/admin/posts \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "slug": "rust-ownership",
    "title": "Understanding Rust Ownership",
    "content": "Rust ownership system is unique.\n\nEach value has a single owner.",
    "summary": "Learn about Rust ownership",
    "status": "Published",
    "category_slug": "tech",
    "tags": ["rust"]
  }' | head -5
echo ""

# Post 3
echo "3. Creating post 3..."
curl -s -X POST http://localhost:3000/v1/admin/posts \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "slug": "nextjs-guide",
    "title": "Next.js App Router Guide",
    "content": "Next.js 13 introduced App Router.\n\nIt is based on React Server Components.",
    "summary": "Complete guide to Next.js App Router",
    "status": "Published",
    "category_slug": "tech"
  }' | head -5
echo ""

# Post 4
echo "4. Creating post 4..."
curl -s -X POST http://localhost:3000/v1/admin/posts \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "slug": "my-today",
    "title": "My Day",
    "content": "Today was a good day.\n\nI learned a lot about Rust.",
    "summary": "Daily journal entry",
    "status": "Published"
  }' | head -5
echo ""

# 验证数据库
echo "=== Verification ==="
echo "Database records:"
docker exec blog-postgres psql -U blog_user -d blog_db -c "
SELECT
  'categories' as table, COUNT(*) FROM categories
UNION ALL SELECT 'tags', COUNT(*) FROM tags
UNION ALL SELECT 'posts', COUNT(*) FROM posts;
"
echo ""

# 测试公开API
echo "Public API test:"
curl -s http://localhost:3000/v1/posts | python -c "import sys, json; d=json.load(sys.stdin); print(f\"Total posts: {d['total']}\")" 2>/dev/null || echo "Raw response:"
curl -s http://localhost:3000/v1/posts | head -10
echo ""

echo "=== Done! ==="
echo "Please refresh your browser (Ctrl+F5) to see the posts!"

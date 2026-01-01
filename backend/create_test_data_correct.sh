#!/bin/bash

echo "=== 使用正确的管理员API创建测试数据 ==="
echo ""

# 1. 登录
echo "1. 登录管理员账号..."
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:3000/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@test.com","password":"xK9#mP2$vL8@nQ5*wR4"}')

if ! echo "$LOGIN_RESPONSE" | grep -q "access_token"; then
  echo "❌ 登录失败"
  echo "$LOGIN_RESPONSE"
  exit 1
fi

TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"access_token":"[^"]*"' | cut -d'"' -f4)
echo "✅ 登录成功"
echo ""

# 2. 创建分类（使用 /admin/categories 端点）
echo "2. 创建分类..."
RESP1=$(curl -s -X POST http://localhost:3000/v1/admin/categories \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "slug": "tech",
    "name": "技术",
    "description": "技术相关文章",
    "icon": "Code",
    "color": "#3B82F6"
  }')

if echo "$RESP1" | grep -q "slug"; then
  echo "✅ 技术分类创建成功"
else
  echo "❌ 技术分类创建失败"
  echo "$RESP1" | head -5
fi

RESP2=$(curl -s -X POST http://localhost:3000/v1/admin/categories \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "slug": "life",
    "name": "生活",
    "description": "生活感悟",
    "icon": "Heart",
    "color": "#10B981"
  }')

if echo "$RESP2" | grep -q "slug"; then
  echo "✅ 生活分类创建成功"
else
  echo "❌ 生活分类创建失败"
  echo "$RESP2" | head -5
fi
echo ""

# 3. 创建标签（使用 /admin/tags 端点）
echo "3. 创建标签..."
RESP3=$(curl -s -X POST http://localhost:3000/v1/admin/tags \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "slug": "rust",
    "name": "Rust",
    "description": "Rust编程语言"
  }')

if echo "$RESP3" | grep -q "slug"; then
  echo "✅ Rust标签创建成功"
else
  echo "❌ Rust标签创建失败"
  echo "$RESP3" | head -5
fi
echo ""

# 4. 创建文章（使用 /admin/posts 端点）
echo "4. 创建文章..."
RESP4=$(curl -s -X POST http://localhost:3000/v1/admin/posts \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "slug": "hello-world",
    "title": "Hello World - 我的第一篇博客",
    "content": "# 欢迎来到我的博客\n\n这是我使用Rust和Next.js构建的第一篇文章。\n\n## 技术栈\n\n- **后端**: Rust + Axum\n- **前端**: Next.js 16\n- **数据库**: PostgreSQL\n- **缓存**: Redis\n\n## 为什么选择Rust？\n\nRust提供了出色的性能和安全性，非常适合构建高性能的Web应用。\n\n```rust\nfn main() {\n    println!(\"Hello, world!\");\n}\n```\n\n让我们一起开始这段精彩的编程之旅！",
    "summary": "欢迎来到我的博客，这是我使用Rust和Next.js构建的第一篇文章。",
    "status": "published",
    "category_slug": "tech",
    "tags": ["rust"],
    "show_toc": true
  }')

if echo "$RESP4" | grep -q "slug\|id"; then
  echo "✅ 文章1创建成功"
else
  echo "❌ 文章1创建失败"
  echo "$RESP4" | head -10
fi

RESP5=$(curl -s -X POST http://localhost:3000/v1/admin/posts \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "slug": "rust-ownership",
    "title": "深入理解Rust所有权",
    "content": "# Rust所有权系统\n\nRust的所有权是其最独特的特性。\n\n## 所有权规则\n\n1. 每个值都有一个所有者\n2. 值在同一时间只能有一个所有者\n3. 当所有者离开作用域，值将被丢弃\n\n```rust\nlet s1 = String::from(\"hello\");\nlet s2 = s1;\n```",
    "summary": "深入讲解Rust的所有权系统",
    "status": "published",
    "category_slug": "tech",
    "tags": ["rust"]
  }')

if echo "$RESP5" | grep -q "slug\|id"; then
  echo "✅ 文章2创建成功"
else
  echo "❌ 文章2创建失败"
  echo "$RESP5" | head -10
fi
echo ""

# 5. 验证数据库
echo "5. 验证数据库..."
docker exec blog-postgres psql -U blog_user -d blog_db -c "
SELECT
  'posts' as table_name,
  COUNT(*) as count
FROM posts
UNION ALL
SELECT 'categories', COUNT(*) FROM categories
UNION ALL
SELECT 'tags', COUNT(*) FROM tags;
"
echo ""

# 6. 测试公开API
echo "6. 测试公开文章列表API..."
PUBLIC_POSTS=$(curl -s http://localhost:3000/v1/posts)
if echo "$PUBLIC_POSTS" | grep -q '"posts"'; then
  POST_COUNT=$(echo "$PUBLIC_POSTS" | grep -o '"total":[0-9]*' | cut -d':' -f2)
  echo "✅ 公开API返回 $POST_COUNT 篇文章"
else
  echo "❌ 公开API无数据"
fi
echo ""

echo "=== 创建完成 ==="
echo ""
echo "💡 现在请刷新浏览器（Ctrl+F5）查看文章！"
echo "📄 访问 http://localhost:3001 查看文章列表"
echo "🔧 访问 http://localhost:3001/admin/posts 管理文章"

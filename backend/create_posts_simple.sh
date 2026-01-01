#!/bin/bash

# 登录并保存token
echo "正在登录..."
curl -s -X POST http://localhost:3000/v1/auth/login \
  -H "Content-Type: application/json" \
  --data-raw '{"email":"admin@test.com","password":"xK9#mP2$vL8@nQ5*wR4"}' \
  > /tmp/token_response.json

# 提取token
cat /tmp/token_response.json | python -c "import sys, json; print(json.load(sys.stdin)['access_token'])" > /tmp/token.txt 2>/dev/null || \
cat /tmp/token_response.json | grep -o '"access_token":"[^"]*"' | cut -d'"' -f4 > /tmp/token.txt

TOKEN=$(cat /tmp/token.txt)
echo "Token obtained: ${TOKEN:0:30}..."
echo ""

# 创建分类
echo "=== 1. 创建分类 ==="
RESPONSE1=$(curl -s -X POST http://localhost:3000/v1/categories \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "slug": "tech",
    "name": "技术",
    "description": "技术相关文章",
    "icon": "Code",
    "color": "#3B82F6"
  }')
echo "$RESPONSE1" | head -5
echo ""

# 创建标签
echo "=== 2. 创建标签 ==="
RESPONSE2=$(curl -s -X POST http://localhost:3000/v1/tags \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "slug": "rust",
    "name": "Rust",
    "description": "Rust编程语言"
  }')
echo "$RESPONSE2" | head -5
echo ""

# 创建文章
echo "=== 3. 创建文章 ==="
RESPONSE3=$(curl -s -X POST http://localhost:3000/v1/posts \
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
echo "$RESPONSE3"
echo ""

# 检查数据库
echo "=== 4. 验证数据库 ==="
docker exec blog-postgres psql -U blog_user -d blog_db -c "SELECT COUNT(*) as post_count FROM posts;"
echo ""

# 测试API
echo "=== 5. 测试文章列表API ==="
curl -s http://localhost:3000/v1/posts | python -c "import sys, json; d=json.load(sys.stdin); print(f\"文章数: {d['total']}\")" 2>/dev/null || echo "API响应: $(curl -s http://localhost:3000/v1/posts)"
echo ""

echo "=== 完成 ==="

#!/bin/bash

# 从登录响应中提取token
TOKEN=$(cat /tmp/login.json | grep -o '"access_token":"[^"]*"' | cut -d'"' -f4)

echo "使用Token创建测试数据..."

# 1. 创建分类
echo "创建分类..."
curl -s -X POST http://localhost:3000/v1/categories \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "slug": "tech",
    "name": "技术",
    "description": "技术相关文章",
    "icon": "Code",
    "color": "#3B82F6"
  }' > /dev/null

curl -s -X POST http://localhost:3000/v1/categories \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "slug": "life",
    "name": "生活",
    "description": "生活感悟",
    "icon": "Heart",
    "color": "#10B981"
  }' > /dev/null

echo "✓ 分类创建完成"

# 2. 创建标签
echo "创建标签..."
curl -s -X POST http://localhost:3000/v1/tags \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "slug": "rust",
    "name": "Rust",
    "description": "Rust编程语言"
  }' > /dev/null

curl -s -X POST http://localhost:3000/v1/tags \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "slug": "nextjs",
    "name": "Next.js",
    "description": "Next.js框架"
  }' > /dev/null

curl -s -X POST http://localhost:3000/v1/tags \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "slug": "web-dev",
    "name": "Web开发",
    "description": "Web开发技术"
  }' > /dev/null

echo "✓ 标签创建完成"

# 3. 创建文章
echo "创建文章..."
curl -s -X POST http://localhost:3000/v1/posts \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "slug": "hello-world",
    "title": "Hello World - 我的第一篇博客",
    "content": "# 欢迎来到我的博客\n\n这是我使用Rust和Next.js构建的第一篇文章。\n\n## 技术栈\n\n- **后端**: Rust + Axum\n- **前端**: Next.js 16\n- **数据库**: PostgreSQL\n- **缓存**: Redis\n\n## 为什么选择Rust？\n\nRust提供了出色的性能和安全性，非常适合构建高性能的Web应用。\n\n```rust\nfn main() {\n    println!(\"Hello, world!\");\n}\n```\n\n让我们一起开始这段精彩的编程之旅！",
    "summary": "欢迎来到我的博客，这是我使用Rust和Next.js构建的第一篇文章。",
    "status": "published",
    "category_slug": "tech",
    "tags": ["rust", "web-dev"],
    "show_toc": true
  }' > /dev/null

curl -s -X POST http://localhost:3000/v1/posts \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "slug": "nextjs-app-router-guide",
    "title": "Next.js App Router 完全指南",
    "content": "# Next.js App Router 完全指南\n\nNext.js 13引入了全新的App Router，基于React Server Components构建。\n\n## 主要特性\n\n- React Server Components\n- Streaming\n- Suspense\n- 路由组\n- 并行路由\n\n## 开始使用\n\n创建新的Next.js应用：\n\n```bash\nnpx create-next-app@latest my-app\n```\n\n## 文件结构\n\n```\napp/\n├── layout.tsx\n├── page.tsx\n└── blog/\n    └── [slug]/\n        └── page.tsx\n```\n\n让我们一起探索Next.js的强大功能！",
    "summary": "详细介绍Next.js App Router的主要特性和使用方法。",
    "status": "published",
    "category_slug": "tech",
    "tags": ["nextjs", "web-dev"],
    "show_toc": true
  }' > /dev/null

curl -s -X POST http://localhost:3000/v1/posts \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "slug": "my-today",
    "title": "今天的生活感悟",
    "content": "# 今天的生活感悟\n\n今天天气真好，阳光明媚。\n\n## 工作\n\n完成了一个重要的项目，感觉很有成就感。\n\n## 学习\n\n学习了Rust的新特性，对生命周期有了更深的理解。\n\n## 生活\n\n和朋友喝了咖啡，聊了很多有趣的话题。\n\n生活就是这样，充满了小确幸。",
    "summary": "记录今天的工作、学习和生活点滴。",
    "status": "published",
    "category_slug": "life",
    "tags": [],
    "show_toc": true
  }' > /dev/null

curl -s -X POST http://localhost:3000/v1/posts \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "slug": "rust-ownership-explained",
    "title": "深入理解Rust的所有权系统",
    "content": "# Rust所有权系统详解\n\nRust的所有权系统是其最独特的特性之一。\n\n## 所有权规则\n\n1. Rust中的每个值都有一个所有者\n2. 值在同一时间只能有一个所有者\n3. 当所有者离开作用域，值将被丢弃\n\n## 示例\n\n```rust\nlet s1 = String::from(\"hello\");\nlet s2 = s1; // s1被移动了\n// println!(\"{}\", s1); // 错误！s1不再有效\n```\n\n## 借用\n\n```rust\nlet s1 = String::from(\"hello\");\nlet len = calculate_length(&s1); // 借用\nprintln!(\"{}的长度是{}\", s1, len);\n```\n\n所有权系统让Rust能够在编译时保证内存安全！",
    "summary": "深入讲解Rust的所有权、借用和生命周期概念。",
    "status": "published",
    "category_slug": "tech",
    "tags": ["rust"],
    "show_toc": true
  }' > /dev/null

echo "✓ 文章创建完成"

# 4. 创建测试用户并发表评论
echo "创建测试用户和评论..."

# 注册测试用户
curl -s -X POST http://localhost:3000/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "reader@example.com",
    "username": "reader",
    "password": "Reader123XYZ"
  }' > /tmp/reader_login.json

READER_TOKEN=$(cat /tmp/reader_login.json | grep -o '"access_token":"[^"]*"' | cut -d'"' -f4)

# 为文章1添加评论
curl -s -X POST http://localhost:3000/v1/comments/hello-world \
  -H "Authorization: Bearer $READER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "content": "欢迎开始你的博客之旅！Rust和Next.js是很棒的技术栈组合。"
  }' > /dev/null

# 为文章2添加评论
curl -s -X POST http://localhost:3000/v1/comments/nextjs-app-router-guide \
  -H "Authorization: Bearer $READER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "content": "这篇文章写得很详细，对我学习Next.js很有帮助！"
  }' > /dev/null

# 回复评论
curl -s -X POST http://localhost:3000/v1/comments/hello-world \
  -H "Authorization: Bearer $READER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "content": "期待更多Rust相关的文章！",
    "parent_id": "需要从第一个评论获取ID"
  }' > /dev/null 2>&1

echo "✓ 测试用户和评论创建完成"

echo ""
echo "=========================================="
echo "测试数据创建完成！"
echo "=========================================="
echo "已创建："
echo "- 2个分类（技术、生活）"
echo "- 3个标签（Rust、Next.js、Web开发）"
echo "- 4篇文章"
echo "- 1个测试用户（reader@example.com）"
echo "- 多条评论"
echo ""
echo "现在可以刷新浏览器查看数据了！"
echo "=========================================="

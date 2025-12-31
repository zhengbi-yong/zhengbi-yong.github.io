#!/bin/bash
# ============================================
# 快速测试脚本
# 用于验证MDX动态渲染功能
# ============================================

set -e

echo "=========================================="
echo "MDX动态渲染 - 快速测试"
echo "=========================================="
echo ""

# 颜色定义
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# 检查Docker环境
echo -e "${YELLOW}1. 检查Docker环境...${NC}"
if ! command -v docker &> /dev/null; then
    echo -e "${RED}错误: Docker未安装${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Docker已安装${NC}"
echo ""

# 启动数据库和Redis
echo -e "${YELLOW}2. 启动PostgreSQL和Redis...${NC}"
docker-compose up -d postgres redis
echo -e "${GREEN}✓ 数据库服务已启动${NC}"
echo ""

# 等待数据库就绪
echo -e "${YELLOW}3. 等待数据库就绪...${NC}"
sleep 10
echo -e "${GREEN}✓ 数据库已就绪${NC}"
echo ""

# 检查后端镜像
echo -e "${YELLOW}4. 检查后端Docker镜像...${NC}"
if docker images | grep -q "blog-backend.*latest"; then
    echo -e "${GREEN}✓ 后端镜像已存在${NC}"
    echo -e "${YELLOW}   启动后端服务...${NC}"
    docker-compose up -d backend
    sleep 15
else
    echo -e "${YELLOW}   后端镜像不存在，需要构建${NC}"
    echo -e "${RED}   请运行: docker-compose build backend${NC}"
    echo -e "${RED}   然后重新运行此脚本${NC}"
    exit 1
fi
echo ""

# 测试后端API
echo -e "${YELLOW}5. 测试后端API...${NC}"
if curl -s -f http://localhost:3000/v1/posts > /dev/null 2>&1; then
    echo -e "${GREEN}✓ 后端API正常工作${NC}"
else
    echo -e "${RED}✗ 后端API无法访问${NC}"
    echo -e "${YELLOW}   请检查: docker logs blog-backend${NC}"
    exit 1
fi
echo ""

# 插入测试数据
echo -e "${YELLOW}6. 插入测试数据...${NC}"
docker exec blog-postgres psql -U blog_user -d blog_db -c "
INSERT INTO posts (
  id, slug, title, content, summary, status,
  published_at, show_toc, view_count, like_count,
  comment_count, content_hash
) VALUES (
  '550e8400-e29b-41d4-a716-446655440001'::uuid,
  'test-mdx-rendering',
  '测试MDX渲染功能',
  '# 测试文章标题

这是一个用于测试MDX动态渲染功能的文章。

## 功能测试

### 1. 数学公式
行内公式：$E = mc^2$

块级公式：
$$
\int_0^\infty e^{-x^2} dx = \frac{\sqrt{\pi}}{2}
$$

### 2. 代码高亮
\`\`\`javascript
function greet(name) {
  console.log('Hello, ' + name + '!');
}
greet('World');
\`\`\`

### 3. 列表
- 项目1
- 项目2
  - 子项目2.1
  - 子项目2.2
- 项目3

### 4. 表格

| 列1 | 列2 | 列3 |
|-----|-----|-----|
| A   | B   | C   |
| D   | E   | F   |

本文档用于验证所有MDX渲染功能是否正常工作。
',
  '这是一篇测试MDX动态渲染功能的文章。',
  'published',
  NOW(),
  true,
  0, 0, 0,
  'test-hash-123'
) ON CONFLICT (slug) DO UPDATE SET
  content = EXCLUDED.content,
  updated_at = NOW();
"

echo -e "${GREEN}✓ 测试数据已插入${NC}"
echo ""

# 验证数据
echo -e "${YELLOW}7. 验证数据...${NC}"
RESULT=$(docker exec blog-postgres psql -U blog_user -d blog_db -tAc "SELECT COUNT(*) FROM posts WHERE slug = 'test-mdx-rendering';")
if [ "$RESULT" -eq 1 ]; then
    echo -e "${GREEN}✓ 测试文章已存在于数据库${NC}"
else
    echo -e "${RED}✗ 测试文章未找到${NC}"
    exit 1
fi
echo ""

# 测试API返回
echo -e "${YELLOW}8. 测试API返回...${NC}"
POST_COUNT=$(curl -s http://localhost:3000/v1/posts | python -c "import sys, json; data=json.load(sys.stdin); print(data['total']);")
echo -e "${GREEN}✓ 数据库中共有 $POST_COUNT 篇文章${NC}"
echo ""

# 前端测试指南
echo "=========================================="
echo -e "${GREEN}后端测试完成！${NC}"
echo "=========================================="
echo ""
echo "下一步：测试前端"
echo ""
echo "1. 启动前端服务："
echo "   cd frontend"
echo "   pnpm dev"
echo ""
echo "2. 访问测试文章："
echo "   http://localhost:3001/blog/test-mdx-rendering"
echo ""
echo "3. 验证功能："
echo "   - 标题显示正确"
echo "   - 数学公式渲染"
echo "   - 代码块高亮"
echo "   - 列表和表格正常"
echo ""
echo "=========================================="
echo "测试完成！"
echo "=========================================="

#!/bin/bash
# MDX 文件迁移到数据库脚本
# 从 frontend/data/blog 读取 MDX 文件并导入到 PostgreSQL

set -e

DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
DB_NAME="${DB_NAME:-blog_db}"
DB_USER="${DB_USER:-blog_user}"
DB_PASS="${DB_PASSWORD:-blog_password}"

FRONTEND_BLOG_DIR="./frontend/data/blog"

echo "================================"
echo "MDX 文件迁移脚本"
echo "================================"
echo ""

# 检查 PostgreSQL 连接
echo "1. 检查数据库连接..."
PGPASSWORD="$DB_PASS" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c '\dt' > /dev/null 2>&1
if [ $? -ne 0 ]; then
    echo "错误: 无法连接到数据库"
    echo "请检查: "
    echo "  - PostgreSQL 服务是否运行"
    echo "  - 环境变量是否正确设置"
    exit 1
fi
echo "✓ 数据库连接正常"
echo ""

# 统计 MDX 文件数量
echo "2. 统计 MDX 文件..."
MDX_COUNT=$(find "$FRONTEND_BLOG_DIR" -name "*.mdx" | wc -l)
echo "找到 $MDX_COUNT 个 MDX 文件"
echo ""

# 创建临时 SQL 文件
TEMP_SQL="/tmp/migrate_mdx.sql"
echo "3. 生成迁移 SQL..."

# 创建测试分类
cat > "$TEMP_SQL" << 'EOF'
-- 插入测试分类
INSERT INTO categories (id, slug, name, description, display_order, post_count) VALUES
('00000000-0000-0000-0000-000000000001', 'computer-science', 'Computer Science', 'AI, algorithms, programming', 1, 0),
('00000000-0000-0000-0000-000000000002', 'robotics', 'Robotics', 'ROS, control systems, automation', 2, 0),
('00000000-0000-0000-0000-000000000003', 'mathematics', 'Mathematics', 'Linear algebra, calculus, theory', 3, 0),
('00000000-0000-0000-0000-000000000004', 'chemistry', 'Chemistry', 'Molecular visualization, structures', 4, 0),
('00000000-0000-0000-0000-000000000005', 'tactile-sensing', 'Tactile Sensing', 'Research papers, experiments', 5, 0)
ON CONFLICT (slug) DO NOTHING;
EOF

# 插入一些测试标签
cat >> "$TEMP_SQL" << 'EOF'
-- 插入测试标签
INSERT INTO tags (id, slug, name, description) VALUES
('00000000-0000-0000-0000-000000000001', 'nextjs', 'Next.js', 'Next.js framework'),
('00000000-0000-0000-0000-000000000002', 'rust', 'Rust', 'Rust programming language'),
('00000000-0000-0000-0000-000000000003', 'tutorial', 'Tutorial', 'Tutorial articles'),
('00000000-0000-0000-0000-000000000004', 'research', 'Research', 'Research papers')
ON CONFLICT (slug) DO NOTHING;
EOF

# 从 MDX 文件中提取 frontmatter 并插入数据库
find "$FRONTEND_BLOG_DIR" -name "*.mdx" -type f | while read -r mdx_file; do
    echo "处理: $mdx_file"

    # 提取文件名（不含扩展名）
    filename=$(basename "$mdx_file" .mdx)

    # 使用简单的 sed 提取 frontmatter 中的标题
    title=$(grep -m 1 "^title:" "$mdx_file" | sed 's/^title: *//' | sed 's/"//g' | sed "s/'//g" || echo "$filename")
    slug=$(echo "$filename" | tr '[:upper:]' '[:lower:]' | tr ' ' '-' | tr '/' '-')

    # 提取日期
    date_str=$(grep -m 1 "^date:" "$mdx_file" | sed 's/^date: *//' || echo "2024-01-01")

    # 提取分类
    category=$(grep -m 1 "^category:" "$mdx_file" | sed 's/^category: *//' | sed 's/"//g' || echo "computer-science")

    # 提取摘要
    summary=$(grep -m 1 "^summary:" "$mdx_file" | sed 's/^summary: *//' | sed 's/"//g' || echo "")

    # 读取完整内容（跳过 frontmatter）
    content=$(awk '/^---$/{if (++f==2) next} f>=2' "$mdx_file" || echo "")

    # 转义单引号和反斜杠
    title_escaped=$(echo "$title" | sed "s/'/''/g")
    summary_escaped=$(echo "$summary" | sed "s/'/''/g")
    content_escaped=$(echo "$content" | sed "s/'/''/g" | sed 's/\\/\\\\/g')

    # 生成插入 SQL
    cat >> "$TEMP_SQL" << EOF

-- 插入文章: $filename
INSERT INTO posts (
    slug,
    title,
    summary,
    content,
    status,
    published_at,
    category_id,
    view_count,
    like_count,
    comment_count
)
SELECT
    '$slug',
    '$title_escaped',
    '$summary_escaped',
    E'$content_escaped',
    'published',
    '$date_str'::timestamp,
    (SELECT id FROM categories WHERE slug = '$category' OR name = '$category' LIMIT 1),
    0,
    0,
    0
WHERE NOT EXISTS (SELECT 1 FROM posts WHERE slug = '$slug');
EOF

done

echo "4. 执行数据库迁移..."
PGPASSWORD="$DB_PASS" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" < "$TEMP_SQL"

if [ $? -eq 0 ]; then
    echo ""
    echo "================================"
    echo "✓ 迁移完成！"
    echo "================================"
    echo ""
    echo "验证结果:"
    PGPASSWORD="$DB_PASS" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "
        SELECT 'categories' as type, COUNT(*) as count FROM categories
        UNION ALL
        SELECT 'tags' as type, COUNT(*) as count FROM tags
        UNION ALL
        SELECT 'posts' as type, COUNT(*) as count FROM posts;
    "
else
    echo "✗ 迁移失败"
    exit 1
fi

# 清理临时文件
rm -f "$TEMP_SQL"

echo ""
echo "迁移脚本执行完成！"

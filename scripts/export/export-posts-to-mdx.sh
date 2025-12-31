#!/bin/bash
# 将数据库中的文章导出为MDX文件
# 用法: ./export-posts-to-mdx.sh [output_directory]

set -e

OUTPUT_DIR="${1:-./exported-posts}"
BACKUP_DIR="./backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

echo "========================================"
echo "   导出博客文章为MDX文件"
echo "========================================"
echo "开始时间: $(date '+%Y-%m-%d %H:%M:%S')"
echo ""

# 检查Docker是否运行
if ! docker ps &> /dev/null; then
    echo "❌ 错误: Docker未运行"
    exit 1
fi

# 检查数据库容器是否运行
if ! docker ps | grep -q blog-postgres; then
    echo "❌ 错误: PostgreSQL容器未运行"
    echo "   请先启动数据库: docker-compose up -d postgres"
    exit 1
fi

# 创建输出目录
mkdir -p "$OUTPUT_DIR"
echo "✓ 输出目录: $OUTPUT_DIR"
echo ""

# 方法1: 使用PostgreSQL导出为SQL格式
echo "1️⃣  导出数据库备份..."
docker exec blog-postgres pg_dump -U blog_user blog_db > "$BACKUP_DIR/db_full_$TIMESTAMP.sql"
echo "   ✓ 完整数据库备份: $BACKUP_DIR/db_full_$TIMESTAMP.sql"
echo ""

# 方法2: 导出文章为CSV（可以用Excel/文本编辑器查看）
echo "2️⃣  导出文章列表为CSV..."
docker exec blog-postgres psql -U blog_user -d blog_db -c "
COPY (
    SELECT
        slug,
        title,
        summary,
        content,
        status,
        published_at,
        created_at
    FROM posts
    WHERE deleted_at IS NULL
    ORDER BY published_at DESC
) TO STDOUT WITH CSV HEADER
" > "$OUTPUT_DIR/posts_$TIMESTAMP.csv"
echo "   ✓ 文章列表: $OUTPUT_DIR/posts_$TIMESTAMP.csv"
echo ""

# 方法3: 导出文章为JSON（包含所有元数据）
echo "3️⃣  导出文章为JSON..."
docker exec blog-postgres psql -U blog_user -d blog_db -t -c "
SELECT json_agg(
    json_build_object(
        'slug', slug,
        'title', title,
        'summary', summary,
        'content', content,
        'status', status,
        'published_at', published_at,
        'created_at', created_at,
        'updated_at', updated_at,
        'category', (SELECT slug FROM categories WHERE id = posts.category_id),
        'tags', (SELECT json_agg(slug) FROM unnest(post_tags) AS tag_id JOIN tags ON tags.id = tag_id)
    )
)
FROM posts
WHERE deleted_at IS NULL
" > "$OUTPUT_DIR/posts_$TIMESTAMP.json"
echo "   ✓ JSON格式: $OUTPUT_DIR/posts_$TIMESTAMP.json"
echo ""

# 方法4: 导出单篇文章为MDX文件
echo "4️⃣  导出文章为MDX文件..."
docker exec blog-postgres psql -U blog_user -d blog_db -t -c "
SELECT
    '---
title: ' || title || E'\n' ||
    'date: ' || COALESCE(published_at::text, created_at::text) || E'\n' ||
    'tags: [' || COALESCE((SELECT string_agg('\"' || tag_name || '\"', ', ') FROM unnest(post_tags) AS tag_id JOIN tags ON tags.id = tag_id), '') || ']\n' ||
    'summary: ' || COALESCE(summary, '') || E'\n' ||
    '---\n\n' ||
    content
FROM posts
WHERE slug = 'example-post'
" > "$OUTPUT_DIR/example-post.mdx"
echo "   ✓ 示例MDX: $OUTPUT_DIR/example-post.mdx"
echo ""

# 统计信息
echo "5️⃣  统计信息..."
TOTAL_POSTS=$(docker exec blog-postgres psql -U blog_user -d blog_db -t -c "SELECT COUNT(*) FROM posts WHERE deleted_at IS NULL")
PUBLISHED_POSTS=$(docker exec blog-postgres psql -U blog_user -d blog_db -t -c "SELECT COUNT(*) FROM posts WHERE status = 'published' AND deleted_at IS NULL")
DRAFT_POSTS=$(docker exec blog-postgres psql -U blog_user -d blog_db -t -c "SELECT COUNT(*) FROM posts WHERE status = 'draft' AND deleted_at IS NULL")

echo "   📊 文章总数: $TOTAL_POSTS"
echo "   ✅ 已发布: $PUBLISHED_POSTS"
echo "   📝 草稿: $DRAFT_POSTS"
echo ""

echo "========================================"
echo "   导出完成！"
echo "========================================"
echo ""
echo "📁 导出文件位置:"
echo "   - 数据库备份: $BACKUP_DIR/db_full_$TIMESTAMP.sql"
echo "   - CSV格式: $OUTPUT_DIR/posts_$TIMESTAMP.csv"
echo "   - JSON格式: $OUTPUT_DIR/posts_$TIMESTAMP.json"
echo "   - MDX示例: $OUTPUT_DIR/example-post.mdx"
echo ""
echo "💡 提示:"
echo "   - CSV和JSON文件可以用文本编辑器查看"
echo "   - CSV可以用Excel打开"
echo "   - 完整的数据库备份可以在需要时恢复"
echo "   - 要编辑文章，请使用管理后台: http://localhost:3001/admin"
echo ""

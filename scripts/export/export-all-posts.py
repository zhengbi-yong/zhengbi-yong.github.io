#!/usr/bin/env python3
"""
将数据库中的所有文章导出为MDX文件
每个文章保存为独立的MDX文件
"""

import os
import sys
import psycopg2
from psycopg2.extras import RealDictCursor
import datetime
import json

# 数据库配置
DB_CONFIG = {
    'host': os.getenv('DB_HOST', 'localhost'),
    'port': int(os.getenv('DB_PORT', 5432)),
    'database': os.getenv('DB_NAME', 'blog_db'),
    'user': os.getenv('DB_USER', 'blog_user'),
    'password': os.getenv('DB_PASSWORD', 'blog_password'),
}

def convert_to_mdx(post):
    """将文章转换为MDX格式"""
    # Frontmatter
    frontmatter = {
        'title': post['title'],
        'date': post['published_at'] or post['created_at'],
        'tags': post.get('tags', []),
        'summary': post.get('summary', ''),
        'status': post['status'],
    }

    if post.get('category'):
        frontmatter['category'] = post['category']

    if post.get('meta_title'):
        frontmatter['meta_title'] = post['meta_title']

    if post.get('meta_description'):
        frontmatter['meta_description'] = post['meta_description']

    # 生成MDX内容
    mdx_content = "---\n"
    for key, value in frontmatter.items():
        if isinstance(value, list):
            mdx_content += f"{key}: {json.dumps(value)}\n"
        elif value:
            mdx_content += f"{key}: {value}\n"
    mdx_content += "---\n\n"

    # 添加文章内容
    mdx_content += post['content']

    return mdx_content

def slug_to_filepath(slug):
    """将slug转换为文件路径"""
    # 替换特殊字符
    filename = slug.replace('/', '_')
    return f"{filename}.mdx"

def main():
    output_dir = sys.argv[1] if len(sys.argv) > 1 else './exported-posts-mdx'
    os.makedirs(output_dir, exist_ok=True)

    print("=" * 40)
    print("  导出文章为MDX文件")
    print("=" * 40)
    print(f"输出目录: {output_dir}\n")

    try:
        # 连接数据库
        print("🔌 连接数据库...")
        conn = psycopg2.connect(**DB_CONFIG)
        cursor = conn.cursor(cursor_factory=RealDictCursor)

        # 获取所有文章
        print("📥 获取文章列表...")
        cursor.execute("""
            SELECT
                p.*,
                c.slug as category,
                c.name as category_name,
                ARRAY_AGG(DISTINCT t.slug) FILTER (WHERE t.slug IS NOT NULL) as tags,
                ARRAY_AGG(DISTINCT t.name) FILTER (WHERE t.name IS NOT NULL) as tag_names
            FROM posts p
            LEFT JOIN categories c ON p.category_id = c.id
            LEFT JOIN post_tags pt ON p.slug = pt.post_slug
            LEFT JOIN tags t ON pt.tag_id = t.id
            WHERE p.deleted_at IS NULL
            GROUP BY p.slug, c.slug, c.name
            ORDER BY p.published_at DESC NULLS LAST, p.created_at DESC
        """)

        posts = cursor.fetchall()
        print(f"✓ 找到 {len(posts)} 篇文章\n")

        # 导出每篇文章
        for i, post in enumerate(posts, 1):
            # 转换为MDX
            mdx_content = convert_to_mdx(post)

            # 生成文件路径
            filepath = slug_to_filepath(post['slug'])
            full_path = os.path.join(output_dir, filepath)

            # 写入文件
            with open(full_path, 'w', encoding='utf-8') as f:
                f.write(mdx_content)

            status = "✅" if post['status'] == 'published' else "📝"
            print(f"{status} [{i}/{len(posts)}] {post['title']}")

        print(f"\n✓ 所有文章已导出到: {output_dir}")

        # 统计信息
        published = sum(1 for p in posts if p['status'] == 'published')
        drafts = sum(1 for p in posts if p['status'] == 'draft')

        print(f"\n📊 统计:")
        print(f"   总计: {len(posts)} 篇")
        print(f"   已发布: {published} 篇")
        print(f"   草稿: {drafts} 篇")

        cursor.close()
        conn.close()

    except Exception as e:
        print(f"\n❌ 错误: {e}")
        sys.exit(1)

    print("\n" + "=" * 40)
    print("  导出完成！")
    print("=" * 40)

if __name__ == '__main__':
    main()

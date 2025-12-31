#!/usr/bin/env python3
"""MDX 文件迁移工具 - 通过 API 导入"""

import os
import re
import json
import requests
from pathlib import Path
from datetime import datetime
from zoneinfo import ZoneInfo

# 配置
API_URL = "http://127.0.0.1:3000/v1"
BLOG_DIR = "./frontend/data/blog"
DEFAULT_CATEGORY = "computer-science"

def find_mdx_files(directory):
    """递归查找所有 MDX 文件"""
    mdx_files = []
    for root, dirs, files in os.walk(directory):
        for file in files:
            if file.endswith('.mdx'):
                mdx_files.append(os.path.join(root, file))
    return sorted(mdx_files)

def parse_mdx(filepath):
    """解析 MDX 文件"""
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # 分离 frontmatter 和正文
    lines = content.split('\n')

    if not lines or lines[0] != '---':
        return None

    frontmatter_lines = []
    body_lines = []
    in_frontmatter = True
    dashes_count = 0

    for line in lines[1:]:
        if line == '---' and dashes_count == 0:
            dashes_count += 1
            in_frontmatter = False
            continue
        if in_frontmatter:
            frontmatter_lines.append(line)
        else:
            body_lines.append(line)

    # 解析 frontmatter
    frontmatter = {}
    current_key = None
    current_value = []

    for line in frontmatter_lines:
        match = re.match(r'^(\w+):\s*(.*)$', line)
        if match:
            if current_key:
                frontmatter[current_key] = '\n'.join(current_value).strip()
            current_key = match.group(1)
            current_value = [match.group(2)]
        elif current_key:
            current_value.append(line)

    if current_key:
        frontmatter[current_key] = '\n'.join(current_value).strip()

    # 提取信息
    title = frontmatter.get('title', Path(filepath).stem)
    slug = title.lower().replace(' ', '-').replace('/', '-')
    date_str = frontmatter.get('date', datetime.now().strftime('%Y-%m-%d'))
    category = frontmatter.get('category', DEFAULT_CATEGORY).strip('"\'')
    summary = frontmatter.get('summary', '')

    # 解析日期
    try:
        published_at = datetime.strptime(date_str, '%Y-%m-%d').isoformat() + 'Z'
    except:
        published_at = datetime.now().isoformat() + 'Z'

    # 标签（如果有）
    tags_str = frontmatter.get('tags', '[]')
    try:
        tags = json.loads(tags_str) if isinstance(tags_str, str) else []
    except:
        tags = []

    body = '\n'.join(body_lines).strip()

    return {
        'title': title,
        'slug': slug,
        'summary': summary,
        'content': body,
        'published_at': published_at,
        'category': category,
        'tags': tags
    }

def create_category(name, api_key):
    """创建分类（如果不存在）"""
    slug = name.lower().replace(' ', '-')

    # 检查是否已存在
    response = requests.get(f"{API_URL}/categories/{slug}")
    if response.status_code == 200:
        return response.json()['id']

    # 创建新分类
    data = {
        'slug': slug,
        'name': name,
        'description': f'{name} articles'
    }

    response = requests.post(
        f"{API_URL}/admin/categories",
        json=data,
        headers={'Authorization': f'Bearer {api_key}'}
    )

    if response.status_code in [200, 201]:
        return response.json()['id']
    return None

def migrate_file(filepath, api_key):
    """迁移单个文件"""
    parsed = parse_mdx(filepath)
    if not parsed:
        print(f"  ✗ 无法解析: {filepath}")
        return False

    # 确保分类存在
    category_id = create_category(parsed['category'], api_key)
    if not category_id:
        print(f"  ⚠ 无法创建分类: {parsed['category']}")

    # 创建文章
    data = {
        'slug': parsed['slug'],
        'title': parsed['title'],
        'summary': parsed['summary'],
        'content': parsed['content'],
        'published_at': parsed['published_at'],
        'category_id': category_id,
        'status': 'published'
    }

    response = requests.post(
        f"{API_URL}/admin/posts",
        json=data,
        headers={'Authorization': f'Bearer {api_key}'}
    )

    if response.status_code in [200, 201]:
        return True
    else:
        print(f"  ✗ 失败: {response.text}")
        return False

def main():
    print("=" * 40)
    print("MDX 文件迁移工具")
    print("=" * 40)
    print("")

    # 检查 API
    print("1. 检查 API 连接...")
    try:
        response = requests.get(f"{API_URL}/healthz")
        if response.status_code != 200:
            print("  ✗ API 不可用")
            return
        print("  ✓ API 连接正常")
    except Exception as e:
        print(f"  ✗ 无法连接到 API: {e}")
        return

    # 查找 MDX 文件
    print("2. 扫描 MDX 文件...")
    mdx_files = find_mdx_files(BLOG_DIR)
    print(f"  ✓ 找到 {len(mdx_files)} 个 MDX 文件")
    print("")

    # 注意：这需要管理员权限
    print("⚠ 注意: 此脚本需要管理员 API 密钥")
    print("如果还没有创建管理员用户，请先创建")
    print("")

    # TODO: 这里需要先实现认证，或者跳过认证直接插入数据库
    print("由于需要认证，此脚本暂时无法执行")
    print("建议使用数据库直接插入的方式")
    print("")

    print("3. 将执行迁移...")
    print("   (暂时跳过)")

if __name__ == '__main__':
    main()

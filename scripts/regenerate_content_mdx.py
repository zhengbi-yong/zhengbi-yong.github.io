#!/usr/bin/env python3
"""
从 content_json 重新生成 content_mdx 列。

解决: 后端 Rust blocknote_json_to_mdx 的 code block 语言处理 bug。
Python 端有完整的 Markdown 转换能力，直接写入 content_mdx 列。
"""
import json
import os
import sys

PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, PROJECT_ROOT)

def block_to_markdown(block):
    """Convert a single BlockNote block to Markdown string."""
    btype = block.get('type', 'paragraph')
    props = block.get('props', {})
    content = block.get('content', [])
    
    if btype == 'paragraph':
        text = inline_to_markdown(content)
        return text if text.strip() else ''
    
    elif btype == 'heading':
        level = props.get('level', 1)
        text = inline_to_markdown(content)
        return f"{'#' * level} {text}" if text.strip() else ''
    
    elif btype == 'codeBlock':
        lang = props.get('language', '')
        if lang == 'plaintext':
            lang = ''
        lines = [node.get('text', '') for node in content if isinstance(node, dict)]
        code = '\n'.join(lines).rstrip('\n')
        if not code.strip():
            return ''
        return f"```{lang}\n{code}\n```"
    
    elif btype == 'bulletListItem':
        text = inline_to_markdown(content)
        return f"- {text}" if text.strip() else ''
    
    elif btype == 'numberedListItem':
        text = inline_to_markdown(content)
        return f"1. {text}" if text.strip() else ''
    
    elif btype == 'checkListItem':
        checked = props.get('checked', False)
        marker = '[x]' if checked else '[ ]'
        text = inline_to_markdown(content)
        return f"- {marker} {text}" if text.strip() else ''
    
    elif btype == 'quote' or btype == 'blockquote':
        # blockquote content is nested blocks → convert each to markdown
        inner = '\n'.join(
            f"> {block_to_markdown(child)}" 
            for child in content 
            if isinstance(child, dict)
        )
        return inner
    
    elif btype == 'table':
        rows = content
        if not isinstance(rows, list) or not rows:
            return ''
        
        md_lines = []
        # Header
        header_cells = []
        for cell in rows[0].get('content', []):
            header_cells.append(inline_to_markdown(cell.get('content', [])))
        md_lines.append('| ' + ' | '.join(header_cells) + ' |')
        md_lines.append('|' + '|'.join([' --- '] * len(header_cells)) + '|')
        
        # Data rows
        for row in rows[1:]:
            cells = []
            for cell in row.get('content', []):
                cells.append(inline_to_markdown(cell.get('content', [])))
            md_lines.append('| ' + ' | '.join(cells) + ' |')
        
        return '\n'.join(md_lines)
    
    elif btype == 'divider':
        return '---'
    
    elif btype == 'image':
        src = props.get('url', '')
        caption = props.get('caption', '')
        return f"![{caption}]({src})" if caption else f"![]({src})"
    
    elif btype == 'toggleListItem':
        text = inline_to_markdown(content)
        return f"> {text}" if text.strip() else ''
    
    else:
        # fallback: try inline content
        text = inline_to_markdown(content)
        return text if text.strip() else ''


def inline_to_markdown(nodes):
    """Convert inline content array to Markdown string."""
    if not isinstance(nodes, list):
        return ''
    
    result = []
    for node in nodes:
        if not isinstance(node, dict):
            continue
        
        ntype = node.get('type', 'text')
        
        if ntype == 'text':
            text = node.get('text', '')
            styles = node.get('styles', {})
            if styles:
                # Apply styles (inner to outer: code → strike → italic → bold)
                if isinstance(styles.get('code'), (dict, bool)) and styles.get('code'):
                    text = f"`{text}`"
                if isinstance(styles.get('strike'), (dict, bool)) and styles.get('strike'):
                    text = f"~~{text}~~"
                if isinstance(styles.get('italic'), (dict, bool)) and styles.get('italic'):
                    text = f"*{text}*"
                if isinstance(styles.get('bold'), (dict, bool)) and styles.get('bold'):
                    text = f"**{text}**"
            result.append(text)
        
        elif ntype == 'link':
            href = node.get('href', '')
            inner = inline_to_markdown(node.get('content', []))
            result.append(f"[{inner}]({href})" if inner else href)
    
    return ''.join(result)


def main():
    import subprocess
    
    # Export all content_json from DB
    subprocess.run(['docker', 'exec', 'blog-postgres', 'psql', '-U', 'blog_user', '-d', 'blog_db', '-t', '-A',
        '-c', "SELECT json_agg(json_build_object('id', id, 'slug', slug, 'content_json', content_json::text)) FROM posts WHERE content_json IS NOT NULL;",
        '-o', '/tmp/regenerate_mdx.json'], check=True)
    subprocess.run(['docker', 'cp', 'blog-postgres:/tmp/regenerate_mdx.json', '/tmp/regenerate_mdx.json'], check=True)
    
    with open('/tmp/regenerate_mdx.json') as f:
        posts = json.load(f)
    
    print(f"Processing {len(posts)} posts...")
    
    sql_lines = ['BEGIN;']
    updated = 0
    
    for post in posts:
        slug = post['slug']
        pid = post['id']
        raw = post['content_json']
        
        try:
            blocks = json.loads(raw) if isinstance(raw, str) else raw
        except:
            print(f"  ⚠ {slug}: invalid JSON, skipping")
            continue
        
        md_parts = []
        for block in blocks:
            md = block_to_markdown(block)
            if md:
                md_parts.append(md)
        
        mdx_content = '\n\n'.join(md_parts)
        escaped = mdx_content.replace("'", "''")
        sql_lines.append(f"UPDATE posts SET content_mdx = '{escaped}' WHERE id = '{pid}';")
        updated += 1
    
    sql_lines.append('COMMIT;')
    
    sql_file = '/tmp/regenerate_mdx.sql'
    with open(sql_file, 'w') as f:
        f.write('\n'.join(sql_lines))
    
    print(f"Updated: {updated}")
    print(f"SQL: {sql_file} ({os.path.getsize(sql_file)} bytes)")
    
    # Apply
    subprocess.run(['docker', 'cp', sql_file, 'blog-postgres:/tmp/regenerate_mdx.sql'], check=True)
    subprocess.run(['docker', 'exec', 'blog-postgres', 'psql', '-U', 'blog_user', '-d', 'blog_db', '-f', '/tmp/regenerate_mdx.sql'],
                   capture_output=True)
    print("✅ Applied")


if __name__ == '__main__':
    main()

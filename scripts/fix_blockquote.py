#!/usr/bin/env python3
"""
修复 content_json 中的 blockquote 块：BlockNote 0.49 不支持 blockquote 类型，
需要将其转换为 paragraph 类型，提取内部段落内容。
"""
import asyncio
import asyncpg
import json
import os

DATABASE_URL = os.environ.get(
    "DATABASE_URL",
    "postgresql://blog_user:blog_password@127.0.0.1:5432/blog_db"
)

def fix_blockquote_blocks(blocks: list) -> tuple[list, int]:
    """将 blockquote 转换为 paragraph，返回 (fixed_blocks, fix_count)"""
    fixed = []
    count = 0
    for block in blocks:
        if block.get("type") == "blockquote":
            count += 1
            # 提取 blockquote 内部的段落内容
            inner_content = block.get("content", [])
            # 将 blockquote 转换为 paragraph，保留内部内容
            new_block = {
                "id": block.get("id"),
                "type": "paragraph",
                "props": block.get("props", {}),
                "content": [],
                "children": block.get("children", []),
            }
            # 展平内部段落的内容到新的 paragraph 中
            for child in inner_content:
                if isinstance(child, dict) and child.get("type") == "paragraph":
                    # 复制内部段落的 content（text nodes）
                    child_content = child.get("content", [])
                    new_block["content"].extend(child_content)
                elif isinstance(child, dict) and child.get("type") == "text":
                    # 直接是 text node
                    new_block["content"].append(child)
            fixed.append(new_block)
        else:
            fixed.append(block)
    return fixed, count


async def main():
    conn = await asyncpg.connect(DATABASE_URL)

    # 查找所有包含 blockquote 的文章
    rows = await conn.fetch("""
        SELECT id, slug, content_json::text as cj_text
        FROM posts
        WHERE content_json::text LIKE '%"type": "blockquote"%'
    """)

    print(f"找到 {len(rows)} 篇包含 blockquote 的文章")

    total_fixes = 0
    for row in rows:
        cj = json.loads(row["cj_text"])
        fixed_cj, count = fix_blockquote_blocks(cj)
        if count > 0:
            total_fixes += count
            # 更新数据库
            await conn.execute(
                "UPDATE posts SET content_json = $1::jsonb WHERE id = $2",
                json.dumps(fixed_cj), row["id"]
            )
            print(f"  {row['slug']}: 修复了 {count} 个 blockquote")

    await conn.close()
    print(f"\n总计修复: {total_fixes} 个 blockquote 块，涉及 {len(rows)} 篇文章")


if __name__ == "__main__":
    asyncio.run(main())

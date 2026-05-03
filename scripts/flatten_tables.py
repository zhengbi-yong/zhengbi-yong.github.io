#!/usr/bin/env python3
"""
Emergency fix: convert ALL table blocks in content_json to regular paragraphs.
BlockNote 0.49.0's table schema is incompatible with our data format.
Tables can be manually recreated in the editor after editing.
"""
import asyncio
import json
import asyncpg

DB_URL = "postgresql://blog_user:blog_password@127.0.0.1:5432/blog_db"

def table_to_paragraphs(block):
    """Convert a table block to paragraph blocks with the table text content."""
    paragraphs = []
    
    for row in block.get('content', []):
        if not isinstance(row, dict) or row.get('type') != 'tableRow':
            continue
        for cell in row.get('content', []):
            if not isinstance(cell, dict) or cell.get('type') != 'tableCell':
                continue
            text_parts = []
            for node in cell.get('content', []):
                if isinstance(node, dict):
                    txt = node.get('text', '')
                    if txt.strip():
                        text_parts.append(txt)
            if text_parts:
                from uuid import uuid4
                text = ' | '.join(text_parts)
                p_style = next((n.get('styles', {}) for n in cell.get('content', []) if isinstance(n, dict)), {})
                paragraphs.append({
                    "id": str(uuid4()),
                    "type": "paragraph",
                    "props": {
                        "backgroundColor": "default",
                        "textAlignment": "left",
                        "textColor": "default"
                    },
                    "content": [{
                        "type": "text",
                        "text": text,
                        "styles": p_style if isinstance(p_style, dict) else {}
                    }],
                    "children": []
                })
    
    return paragraphs


async def main():
    conn = await asyncpg.connect(DB_URL)
    try:
        rows = await conn.fetch(
            "SELECT id, slug, content_json FROM posts "
            "WHERE content_json IS NOT NULL "
            "AND content_json::text LIKE '%\"table\"%' "
            "ORDER BY created_at"
        )
        print(f"Found {len(rows)} posts with tables")

        fixed = 0
        for row in rows:
            cj = row["content_json"]
            if isinstance(cj, str):
                cj = json.loads(cj)
            if not isinstance(cj, list):
                continue

            new_blocks = []
            for block in cj:
                if isinstance(block, dict) and block.get('type') == 'table':
                    new_blocks.extend(table_to_paragraphs(block))
                else:
                    new_blocks.append(block)

            if new_blocks != cj:
                await conn.execute(
                    "UPDATE posts SET content_json = $1::jsonb WHERE id = $2",
                    json.dumps(new_blocks, ensure_ascii=False),
                    row["id"]
                )
                fixed += 1
                print(f"  Fixed: {row['slug']}")

        print(f"\nDone: {fixed} posts converted (tables → paragraphs)")

    finally:
        await conn.close()


if __name__ == "__main__":
    asyncio.run(main())

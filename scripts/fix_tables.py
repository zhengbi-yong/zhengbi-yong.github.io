#!/usr/bin/env python3
"""
Fix table blocks in content_json — convert flat text nodes to
BlockNote 0.49.0 table structure (tableRow → tableCell → paragraph → text).
"""
import asyncio
import json
import asyncpg

DB_URL = "postgresql://blog_user:blog_password@127.0.0.1:5432/blog_db"

def fix_table(block):
    """Convert flat text-cell table to proper BlockNote table format.
    Assumes 4 columns (standard for comparison tables)."""
    content = block.get("content")
    if not isinstance(content, list) or not content:
        return block

    # All cells should be text nodes — extract them
    cells = []
    for node in content:
        if isinstance(node, dict) and "text" in node:
            cells.append(node)
        else:
            # Non-text cell — can't convert, return original
            return block

    if not cells:
        return block

    # Assume 4 columns
    num_cols = 4
    rows = [cells[i:i+num_cols] for i in range(0, len(cells), num_cols)]

    # Build BlockNote table structure
    table_content = []
    for row_cells in rows:
        cell_nodes = []
        for cell in row_cells:
            cell_nodes.append({
                "type": "tableCell",
                "content": [{
                    "type": "paragraph",
                    "content": [{
                        "type": "text",
                        "text": cell.get("text", ""),
                        "styles": cell.get("styles", {})
                    }],
                    "props": {
                        "backgroundColor": "default",
                        "textAlignment": "left",
                        "textColor": "default"
                    }
                }],
                "props": {
                    "backgroundColor": "default",
                    "textAlignment": "left",
                    "textColor": "default"
                }
            })
        table_content.append({
            "type": "tableRow",
            "content": cell_nodes
        })

    # Rebuild block preserving id and other props
    new_block = {}
    for k, v in block.items():
        if k == "content":
            new_block[k] = table_content
        elif k == "props":
            new_block[k] = {}  # Reset props
        else:
            new_block[k] = v

    return new_block


async def main():
    conn = await asyncpg.connect(DB_URL)

    try:
        rows = await conn.fetch(
            "SELECT id, slug, content_json FROM posts "
            "WHERE content_json IS NOT NULL "
            "ORDER BY created_at"
        )
        print(f"Found {len(rows)} posts total")

        fixed = 0
        for row in rows:
            cj = row["content_json"]
            if isinstance(cj, str):
                cj = json.loads(cj)
            if not isinstance(cj, list):
                continue

            changed = False
            new_blocks = []
            for block in cj:
                if isinstance(block, dict) and block.get("type") == "table":
                    new_block = fix_table(block)
                    if json.dumps(new_block, ensure_ascii=False) != json.dumps(block, ensure_ascii=False):
                        changed = True
                    new_blocks.append(new_block)
                else:
                    new_blocks.append(block)

            if changed:
                await conn.execute(
                    "UPDATE posts SET content_json = $1::jsonb WHERE id = $2",
                    json.dumps(new_blocks, ensure_ascii=False),
                    row["id"]
                )
                fixed += 1
                print(f"  Fixed: {row['slug']}")

        print(f"\nDone: {fixed} posts with tables fixed")

    finally:
        await conn.close()


if __name__ == "__main__":
    asyncio.run(main())

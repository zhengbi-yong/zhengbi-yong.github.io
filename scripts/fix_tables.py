#!/usr/bin/env python3
"""
Fix table blocks — convert to BlockNote 0.49.0 table structure.
Cells use inline content (text nodes directly, NOT paragraph wrapped).
"""
import asyncio
import json
import asyncpg

DB_URL = "postgresql://blog_user:blog_password@127.0.0.1:5432/blog_db"

def fix_table(block):
    """Ensure table cells use inline text (not paragraph) in their content."""
    content = block.get("content")
    if not isinstance(content, list) or not content:
        return block

    # Check what format we're dealing with
    # Format A: flat text cells [{type: 'text', text: '...'}, ...]
    # Format B: proper rows [{type: 'tableRow', content: [{type: 'tableCell', ...}]}]
    first = content[0] if content else None
    if isinstance(first, dict) and first.get("type") == "tableRow":
        # Already in row format — fix cells to use inline text
        new_rows = []
        for row in content:
            if not isinstance(row, dict):
                new_rows.append(row)
                continue
            cells = row.get("content", [])
            new_cells = []
            for cell in cells:
                if not isinstance(cell, dict) or cell.get("type") != "tableCell":
                    new_cells.append(cell)
                    continue
                # Extract text from cell's content (skip paragraph wrapping)
                cell_content = cell.get("content", [])
                flat_texts = []
                for node in cell_content:
                    if isinstance(node, dict):
                        if node.get("type") == "text" and "text" in node:
                            flat_texts.append(node)
                        elif node.get("type") == "paragraph":
                            # Unwrap: paragraph.content → text nodes
                            for inner in node.get("content", []):
                                if isinstance(inner, dict) and "text" in inner:
                                    flat_texts.append({
                                        "type": "text",
                                        "text": inner.get("text", ""),
                                        "styles": inner.get("styles", {})
                                    })
                # Rebuild cell with flat text
                new_cells.append({
                    "type": "tableCell",
                    "content": flat_texts if flat_texts else [{"type": "text", "text": "", "styles": {}}],
                    "props": cell.get("props", {
                        "backgroundColor": "default",
                        "textAlignment": "left",
                        "textColor": "default"
                    })
                })
            new_rows.append({
                "type": "tableRow",
                "content": new_cells
            })

        new_block = {k: v for k, v in block.items() if k != "content"}
        new_block["content"] = new_rows
        return new_block

    elif isinstance(first, dict) and "text" in first:
        # Flat text format — build rows from scratch (4 columns)
        cells = [n for n in content if isinstance(n, dict) and "text" in n]
        num_cols = 4
        rows = [cells[i:i+num_cols] for i in range(0, len(cells), num_cols)]

        table_content = []
        for row_cells in rows:
            cell_nodes = []
            for cell in row_cells:
                cell_nodes.append({
                    "type": "tableCell",
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
                })
            table_content.append({
                "type": "tableRow",
                "content": cell_nodes
            })

        new_block = {k: v for k, v in block.items() if k != "content"}
        new_block["content"] = table_content
        return new_block

    return block


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

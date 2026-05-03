#!/usr/bin/env python3
"""
Fix content_json in blog_db — normalize legacy BlockNote format.

Issues fixed:
1. Boolean styles { bold: true } → { bold: {} }
2. Nested block nodes inside inline content — content[0].content[0].text
   → content[0].text
"""
import asyncio
import json
import asyncpg
import sys

DB_URL = "postgresql://blog_user:blog_password@127.0.0.1:5432/blog_db"


def extract_text_nodes(node):
    """Recursively extract leaf text nodes from nested block tree.
    Accepts any node with a non-empty text field, regardless of type."""
    if isinstance(node, list):
        result = []
        for item in node:
            result.extend(extract_text_nodes(item))
        return result
    if not isinstance(node, dict):
        return []

    # Leaf text node: has text content
    text = node.get("text")
    if isinstance(text, str) and text:
        clean = {"type": "text", "text": text}
        styles = node.get("styles")
        if isinstance(styles, dict):
            cleaned_styles = {}
            for k, v in styles.items():
                cleaned_styles[k] = {} if v is True else v
            clean["styles"] = cleaned_styles
        return [clean]

    # Recurse deeper
    result = []
    for key in ("content", "children"):
        val = node.get(key)
        if isinstance(val, list):
            result.extend(extract_text_nodes(val))
    return result


def is_blocklike(node):
    """Check if an inline node has block-level properties (id/props/children)."""
    if not isinstance(node, dict):
        return False
    return bool(set(node.keys()) & {"id", "props", "children"})


def flix_styles(node):
    """Fix boolean styles → empty object in a node."""
    if not isinstance(node, dict):
        return
    styles = node.get("styles")
    if isinstance(styles, dict):
        for k, v in list(styles.items()):
            if v is True:
                styles[k] = {}


def normalize_block(block, is_inline=False):
    """Normalize a block. When is_inline=True, flatten nested blocks."""
    if isinstance(block, list):
        result = []
        for item in block:
            norm = normalize_block(item, is_inline)
            if isinstance(norm, list):
                result.extend(norm)
            elif norm is not None:
                result.append(norm)
        return result

    if not isinstance(block, dict):
        return block

    # Inline context: if blocklike, flatten it
    if is_inline and is_blocklike(block):
        return extract_text_nodes(block)

    out = dict(block)
    flix_styles(out)

    # Process inline content
    content = out.get("content")
    if isinstance(content, list):
        new_content = []
        for node in content:
            norm = normalize_block(node, is_inline=True)
            if isinstance(norm, list):
                new_content.extend(n for n in norm if isinstance(n, dict) and n.get("type"))
            elif isinstance(norm, dict):
                new_content.append(norm)
        out["content"] = new_content

    # Process child blocks
    children = out.get("children")
    if isinstance(children, list):
        out["children"] = [normalize_block(c, is_inline=False) for c in children]

    return out


async def main():
    conn = await asyncpg.connect(DB_URL)

    try:
        # Read posts with content_json (asyncpg returns jsonb as Python objects)
        rows = await conn.fetch(
            "SELECT id, slug, content_json FROM posts "
            "WHERE content_json IS NOT NULL "
            "ORDER BY created_at"
        )
        print(f"Found {len(rows)} posts with content_json")

        fixed = 0
        for row in rows:
            cj = row["content_json"]
            # asyncpg returns jsonb as JSON string, parse it
            if isinstance(cj, str):
                cj = json.loads(cj)
            if not isinstance(cj, list):
                continue

            normalized = normalize_block(cj, is_inline=False)

            # Compare: re-serialize both to JSON for consistent comparison
            old_json = json.dumps(cj, ensure_ascii=False, sort_keys=True)
            new_json = json.dumps(normalized, ensure_ascii=False, sort_keys=True)

            if old_json != new_json:
                await conn.execute(
                    "UPDATE posts SET content_json = $1::jsonb WHERE id = $2",
                    json.dumps(normalized, ensure_ascii=False),
                    row["id"]
                )
                fixed += 1
                print(f"  Fixed: {row['slug']}")

        print(f"\nDone: {fixed} posts fixed, {len(rows) - fixed} unchanged")

    finally:
        await conn.close()


if __name__ == "__main__":
    asyncio.run(main())

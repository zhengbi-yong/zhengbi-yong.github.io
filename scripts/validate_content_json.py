#!/usr/bin/env python3
"""
BlockNote 0.49.0 Content JSON Validator

Validates that all articles in the database have content_json that conforms
to the BlockNote 0.49.0 ProseMirror schema. This script should be run:
  1. After any migration that modifies content_json
  2. In CI before deploying
  3. As a pre-push safety check

Schema rules extracted from @blocknote/core ProseMirror schema definitions.
"""
import json
import os
import sys
import argparse
from typing import Any

# ─── BlockNote 0.49.0 Schema Rules ─────────────────────────────────────────

VALID_BLOCK_TYPES = frozenset({
    "paragraph", "heading", "codeBlock",
    "bulletListItem", "numberedListItem", "checkListItem", "toggleListItem",
    "table", "blockquote", "divider",
    "image", "video", "audio", "file",
})

# Blocks whose content is inline (text, link, marks) — source: blocks-_lpGWKOa.cjs
# "content:`inline`" or "content:`inline*`"
INLINE_CONTENT_BLOCKS = frozenset({
    "paragraph", "heading",
    "bulletListItem", "numberedListItem", "checkListItem", "toggleListItem",
    "tableParagraph",
})

# Blocks whose content is nested blocks (blockContainer+)
# blockquote uses blockGroup/blockContainer
BLOCK_CONTAINER_BLOCKS = frozenset({"blockquote"})

# Blocks with no content
NON_CONTENT_BLOCKS = frozenset({
    "codeBlock", "divider", "image", "video", "audio", "file",
})

# tableCell/tableHeader content group = "tableContent+"
# tableContent ONLY contains tableParagraph
TABLE_CELL_CHILD_TYPES = frozenset({"tableParagraph"})

# Inline content types
VALID_INLINE_TYPES = frozenset({"text", "link", "mention"})

VALID_STYLES = frozenset({"bold", "italic", "code", "strike", "highlight", "underline", "superscript", "subscript"})

VALID_HEADING_LEVELS = frozenset({1, 2, 3})


class ValidationError(Exception):
    pass


def validate_blocknote_json(content_json: Any, article_slug: str = "unknown") -> list[str]:
    """Validate an article's content_json against BlockNote 0.49.0 schema.
    Returns list of error messages (empty = valid)."""
    errors: list[str] = []
    ctx = f"[{article_slug}]"

    if not isinstance(content_json, list):
        errors.append(f"{ctx} Top-level content_json must be an array, got {type(content_json).__name__}")
        return errors

    for bi, block in enumerate(content_json):
        errors.extend(_validate_block(block, f"{ctx} block[{bi}]", article_slug))
    return errors


def _validate_block(block: dict, path: str, slug: str) -> list[str]:
    errors: list[str] = []

    if not isinstance(block, dict):
        errors.append(f"{path}: block must be dict, got {type(block).__name__}")
        return errors

    block_type = block.get("type")
    if not block_type:
        errors.append(f"{path}: block missing 'type' field")
        return errors

    if block_type not in VALID_BLOCK_TYPES:
        errors.append(f"{path}: unknown block type '{block_type}'")

    # ── Table validation (was the source of our bug) ──
    if block_type == "table":
        content = block.get("content")
        if not isinstance(content, dict) or content.get("type") != "tableContent":
            errors.append(f"{path}: table missing content.type='tableContent'")
        else:
            rows = content.get("content", [])
            if not isinstance(rows, list):
                errors.append(f"{path}: table content must be list of rows")
            else:
                for ri, row in enumerate(rows):
                    errors.extend(_validate_table_row(row, f"{path}.row[{ri}]"))

    # ── Heading level ──
    elif block_type == "heading":
        props = block.get("props", {})
        level = props.get("level")
        if level is None:
            errors.append(f"{path}: heading missing props.level")
        elif level not in VALID_HEADING_LEVELS:
            errors.append(f"{path}: heading level {level} not in {VALID_HEADING_LEVELS}")

    # ── CodeBlock language ──
    elif block_type == "codeBlock":
        props = block.get("props", {})
        if "language" not in props:
            errors.append(f"{path}: codeBlock missing props.language")

    # ── Image/Video need url ──
    elif block_type in ("image", "video", "audio", "file"):
        props = block.get("props", {})
        if "url" not in props:
            errors.append(f"{path}: {block_type} missing props.url")

    # ── Validate inline content (paragraphs, headings, list items, tableParagraph) ──
    if block_type in INLINE_CONTENT_BLOCKS:
        inline = block.get("content")
        if isinstance(inline, list):
            errors.extend(_validate_inline_nodes(inline, f"{path}.content"))
        elif inline is not None and block_type not in NON_CONTENT_BLOCKS:
            errors.append(f"{path}: content must be list for inline-content block, got {type(inline).__name__}")

    # ── blockquote contains nested blocks ──
    if block_type in BLOCK_CONTAINER_BLOCKS:
        content = block.get("content")
        if isinstance(content, list):
            for ci, child in enumerate(content):
                errors.extend(_validate_block(child, f"{path}.quote[{ci}]", slug))
        elif content is not None:
            errors.append(f"{path}: blockquote content must be list, got {type(content).__name__}")

    return errors


def _validate_table_row(row: dict, path: str) -> list[str]:
    errors: list[str] = []

    if row.get("type") not in ("tableRow",):
        errors.append(f"{path}: expected type='tableRow', got '{row.get('type')}'")
        return errors

    cells = row.get("content", [])
    if not isinstance(cells, list):
        errors.append(f"{path}: content must be list of cells")
        return errors

    for ci, cell in enumerate(cells):
        cell_type = cell.get("type")
        if cell_type not in ("tableCell", "tableHeader"):
            errors.append(f"{path}.cell[{ci}]: expected tableCell/tableHeader, got '{cell_type}'")
            continue

        cell_content = cell.get("content", [])
        if not isinstance(cell_content, list):
            errors.append(f"{path}.cell[{ci}]: content must be list, got {type(cell_content).__name__}")
            continue

        for ni, node in enumerate(cell_content):
            node_type = node.get("type")
            if node_type not in TABLE_CELL_CHILD_TYPES:
                errors.append(
                    f"{path}.cell[{ci}][{ni}]: "
                    f"BlockNote 0.49.0 tableCell/tableHeader ONLY accepts tableParagraph, "
                    f"got '{node_type}'. All inline content must be wrapped in tableParagraph."
                )
                continue

            # Validate the tableParagraph's inline content
            inline = node.get("content")
            if isinstance(inline, list):
                errors.extend(_validate_inline_nodes(inline, f"{path}.cell[{ci}][{ni}].content"))

    return errors


def _validate_inline_nodes(nodes: list, path: str) -> list[str]:
    """Validate inline content (text + styles + links)."""
    errors: list[str] = []

    for ni, node in enumerate(nodes):
        node_path = f"{path}[{ni}]"
        if not isinstance(node, dict):
            errors.append(f"{node_path}: inline node must be dict, got {type(node).__name__}")
            continue

        node_type = node.get("type")
        if node_type not in VALID_INLINE_TYPES:
            errors.append(f"{node_path}: unknown inline type '{node_type}'")
            continue

        if node_type == "text":
            # Must have 'text' field
            if "text" not in node:
                errors.append(f"{node_path}: text node missing 'text' field")

            # Validate styles object
            styles = node.get("styles")
            if styles is not None:
                if not isinstance(styles, dict):
                    errors.append(f"{node_path}: styles must be dict, got {type(styles).__name__}")
                else:
                    for style_name, style_val in styles.items():
                        if style_name not in VALID_STYLES:
                            errors.append(f"{node_path}: unknown style '{style_name}'")
                        # All styles must be objects ({}), not booleans (this was a previous bug)
                        if not isinstance(style_val, dict):
                            errors.append(
                                f"{node_path}: style '{style_name}' must be object {{}}, "
                                f"got {type(style_val).__name__} (BlockNote 0.49.0 format)"
                            )

        elif node_type == "link":
            if "href" not in node:
                errors.append(f"{node_path}: link missing 'href' field")
            if "content" not in node:
                errors.append(f"{node_path}: link missing 'content' field")
            else:
                # Recursively validate link content (should be text nodes)
                link_content = node.get("content", [])
                if isinstance(link_content, list):
                    errors.extend(_validate_inline_nodes(link_content, f"{node_path}.content"))

    return errors


# ─── Database Integration ─────────────────────────────────────────────────

def get_db_connection():
    """Get database connection from Docker environment or env vars."""
    import psycopg2

    db_url = os.environ.get(
        "DATABASE_URL",
        "postgres://blog_user:blog_password@localhost:5432/blog-local"
    )
    return psycopg2.connect(db_url)


def validate_from_database() -> tuple[bool, list[str]]:
    """Validate all articles in the database. Returns (all_valid, error_details)."""
    try:
        conn = get_db_connection()
    except Exception as e:
        return False, [f"Failed to connect to database: {e}"]

    all_errors: list[str] = []
    try:
        with conn.cursor() as cur:
            cur.execute("SELECT slug, content_json FROM posts WHERE content_json IS NOT NULL")
            rows = cur.fetchall()

        if not rows:
            return True, ["No articles found in database"]

        for slug, content_json_raw in rows:
            try:
                content_json = content_json_raw if isinstance(content_json_raw, (list, dict)) else json.loads(content_json_raw)
            except (json.JSONDecodeError, TypeError) as e:
                all_errors.append(f"[{slug}] Invalid JSON: {e}")
                continue

            article_errors = validate_blocknote_json(content_json, slug)
            all_errors.extend(article_errors)

    finally:
        conn.close()

    return len(all_errors) == 0, all_errors


def validate_from_directory(mdx_dir: str, converter_script: str) -> tuple[bool, list[str]]:
    """Run converter on MDX files and validate the output without touching DB."""
    import subprocess
    import tempfile

    with tempfile.TemporaryDirectory() as tmpdir:
        out = tmpdir + "/output.json"
        result = subprocess.run(
            ["python3", converter_script, "--mdx-dir", mdx_dir, "--output", out, "--dry-run"],
            capture_output=True, text=True, timeout=120
        )
        if result.returncode != 0:
            return False, [f"Converter failed: {result.stderr}"]

        with open(out) as f:
            all_posts = json.load(f)

        all_errors: list[str] = []
        for slug, content_json in all_posts.items():
            all_errors.extend(validate_blocknote_json(content_json, slug))

        return len(all_errors) == 0, all_errors


# ─── CLI ───────────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(
        description="Validate content_json against BlockNote 0.49.0 schema"
    )
    parser.add_argument(
        "--db", action="store_true",
        help="Validate all articles in the database"
    )
    parser.add_argument(
        "--json-file", type=str,
        help="Validate a single JSON file containing article(s)"
    )
    parser.add_argument(
        "--quiet", action="store_true",
        help="Suppress output unless there are errors"
    )
    parser.add_argument(
        "--max-errors", type=int, default=100,
        help="Maximum number of errors to report (default: 100)"
    )
    args = parser.parse_args()

    if args.db:
        ok, errors = validate_from_database()
    elif args.json_file:
        with open(args.json_file) as f:
            data = json.load(f)
        errors = validate_blocknote_json(data, os.path.basename(args.json_file))
        ok = len(errors) == 0
    else:
        print("Usage: validate_content_json.py --db | --json-file <path>", file=sys.stderr)
        sys.exit(2)

    if errors:
        print(f"\n❌ Found {len(errors)} validation error(s):\n", file=sys.stderr)
        for err in errors[:args.max_errors]:
            print(f"  • {err}", file=sys.stderr)
        if len(errors) > args.max_errors:
            print(f"  ... and {len(errors) - args.max_errors} more", file=sys.stderr)
        sys.exit(1)
    else:
        if not args.quiet:
            print("✅ All content_json validates against BlockNote 0.49.0 schema")
        sys.exit(0)


if __name__ == "__main__":
    main()

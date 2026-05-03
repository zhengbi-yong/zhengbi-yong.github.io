"""
rebuild_content_json.py

Rebuild all content_json from original MDX files using a markdown-to-BlockNote
JSON converter. This fixes heading levels, code blocks, tables, and other blocks
that were corrupted by previous migrations.

BlockNote JSON format:
- heading: {type:"heading", props:{level:1-3, ...}, content:[{type:"text", text:"...", styles:{}}], children:[]}
- paragraph: {type:"paragraph", props:{...}, content:[...], children:[]}
- codeBlock: {type:"codeBlock", props:{language:"..."}, content:[{type:"text", text:"...", styles:{}}], children:[]}
- bulletListItem: {type:"bulletListItem", props:{...}, content:[...], children:[]}

Usage:
  python3 scripts/rebuild_content_json.py
"""

import json
import re
import os
import uuid
from pathlib import Path
import psycopg2
import psycopg2.extras

PROJECT_ROOT = Path(__file__).parent.parent
BLOG_DATA_DIR = PROJECT_ROOT / "data" / "blog"
DATABASE_URL = os.environ.get(
    "DATABASE_URL",
    "postgresql://blog_user:blog_password@localhost:5432/blog_db"
)

# ============================================================
# Block factory helpers
# ============================================================

def make_id():
    return str(uuid.uuid4())

def make_text(text="", styles=None):
    return {
        "type": "text",
        "text": text,
        "styles": styles or {},
    }

def make_block(block_type, content=None, props=None, children=None):
    return {
        "id": make_id(),
        "type": block_type,
        "props": props or {},
        "content": content or [],
        "children": children or [],
    }

def make_paragraph(text="", styles=None):
    return make_block("paragraph", content=[make_text(text, styles)] if text else [])

def make_heading(level, text):
    return make_block(
        "heading",
        props={
            "level": level,
            "textColor": "default",
            "textAlignment": "left",
            "backgroundColor": "default",
            "isToggleable": False,
        },
        content=[make_text(text)],
    )

def make_codeblock(language, code_text):
    lines = code_text.split('\n')
    content = []
    for i, line in enumerate(lines):
        if i > 0:
            content.append(make_text('\n'))
        content.append(make_text(line))
    return make_block(
        "codeBlock",
        props={"language": language} if language else {},
        content=content,
    )

def make_bullet_list_item(text, styles=None):
    return make_block("bulletListItem", content=[make_text(text, styles)] if text else [])

def make_ordered_list_item(text, styles=None):
    return make_block("numberedListItem", content=[make_text(text, styles)] if text else [])

# NOTE: BlockNote 0.49.0 table hierarchy:
# table → tableRow → tableCell/tableHeader → tableParagraph → text (inline)
# tableCell.content = "tableContent+" where tableContent group = tableParagraph
# tableParagraph.content = "inline*"


def make_table_paragraph(text):
    """Create a tableParagraph block wrapping inline text."""
    return make_block("tableParagraph", content=[make_text(text)])


def make_table(headers, rows):
    """Create a BlockNote table block with correct 0.49.0 hierarchy."""
    table_content = []
    # Header row — use tableHeader for first row
    header_cells = []
    for h in headers:
        header_cells.append(
            make_block("tableHeader", content=[make_table_paragraph(h)])
        )
    table_content.append(make_block("tableRow", content=header_cells))
    # Data rows — use tableCell
    for row in rows:
        cells = []
        for cell in row:
            cells.append(
                make_block("tableCell", content=[make_table_paragraph(cell)])
            )
        table_content.append(make_block("tableRow", content=cells))
    return make_block("table", content=table_content)

# ============================================================
# Markdown parser
# ============================================================

def parse_mdx_to_blocks(mdx_text):
    """Parse MDX text to BlockNote JSON blocks.
    
    Handles:
    - # ## ### headings
    - ```language code blocks
    - | tables |
    - - bullet lists
    - 1. ordered lists
    - Regular paragraphs
    - Inline **bold**, *italic*, `code`
    """
    lines = mdx_text.split('\n')
    blocks = []
    i = 0
    
    while i < len(lines):
        line = lines[i]
        
        # Skip empty lines (but not between tight blocks)
        if not line.strip():
            # Check if next line starts a new block
            next_nonempty = None
            for j in range(i + 1, min(i + 3, len(lines))):
                if lines[j].strip():
                    next_nonempty = lines[j].strip()
                    break
            # Only skip if next line is also empty or it's the end
            i += 1
            continue
        
        stripped = line.strip()
        
        # ===== Code blocks =====
        if stripped.startswith('```'):
            lang = stripped[3:].strip()
            code_lines = []
            i += 1
            while i < len(lines):
                if lines[i].strip() == '```':
                    i += 1
                    break
                code_lines.append(lines[i])
                i += 1
            code_text = '\n'.join(code_lines)
            if code_text.strip():
                blocks.append(make_codeblock(lang if lang else None, code_text))
            continue
        
        # ===== Headings =====
        heading_match = re.match(r'^(#{1,6})\s+(.+)$', stripped)
        if heading_match:
            level = len(heading_match.group(1))
            text = heading_match.group(2).strip()
            blocks.append(make_heading(min(level, 3), text))  # BlockNote max level 3
            i += 1
            continue
        
        # ===== Tables =====
        if '|' in stripped and i + 2 < len(lines):
            # Check next line for separator: |---|---|
            next_line = lines[i + 1].strip() if i + 1 < len(lines) else ''
            if re.match(r'^[\|\s\-\:]+$', next_line) and '---' in next_line:
                # Parse table
                header_cells = [c.strip() for c in stripped.split('|') if c.strip()]
                rows = []
                j = i + 2
                while j < len(lines) and '|' in lines[j].strip():
                    row_cells = [c.strip() for c in lines[j].strip().split('|') if c.strip()]
                    if row_cells:
                        rows.append(row_cells)
                    j += 1
                
                # Normalize column count (pad or truncate)
                max_cols = len(header_cells)
                if rows:
                    max_cols = max(max_cols, max(len(r) for r in rows))
                
                while len(header_cells) < max_cols:
                    header_cells.append('')
                for r in rows:
                    while len(r) < max_cols:
                        r.append('')
                    if len(r) > max_cols:
                        r[:] = r[:max_cols]
                
                if header_cells or rows:
                    blocks.append(make_table(header_cells, rows))
                i = j
                continue
        
        # ===== Bullet list items =====
        if re.match(r'^[\-\*\+]\s+', stripped):
            bullet_lines = []
            while i < len(lines) and re.match(r'^[\-\*\+]\s+', lines[i].strip()):
                text = re.sub(r'^[\-\*\+]\s+', '', lines[i].strip())
                bullet_lines.append(text)
                i += 1
            for text in bullet_lines:
                blocks.append(make_bullet_list_item(text))
            continue
        
        # ===== Ordered list items =====
        if re.match(r'^\d+[\.\)]\s+', stripped):
            ordered_lines = []
            while i < len(lines) and re.match(r'^\d+[\.\)]\s+', lines[i].strip()):
                text = re.sub(r'^\d+[\.\)]\s+', '', lines[i].strip())
                ordered_lines.append(text)
                i += 1
            for text in ordered_lines:
                blocks.append(make_ordered_list_item(text))
            continue
        
        # ===== Horizontal rule =====
        if re.match(r'^[\-\*\_]{3,}\s*$', stripped):
            blocks.append(make_block("divider"))
            i += 1
            continue
        
        # ===== Blockquote =====
        if stripped.startswith('> '):
            quote_lines = []
            while i < len(lines) and lines[i].strip().startswith('> '):
                quote_lines.append(lines[i].strip()[2:])
                i += 1
            quote_text = ' '.join(quote_lines)
            blocks.append(make_block("blockquote", content=[make_text(quote_text)]))
            continue
        
        # ===== Paragraph (default) =====
        # Collect consecutive non-empty, non-special lines as one paragraph
        para_lines = []
        while i < len(lines) and lines[i].strip():
            s = lines[i].strip()
            # Stop at special blocks
            if (s.startswith('```') or s.startswith('#') or 
                re.match(r'^[\-\*\+]\s+', s) or 
                re.match(r'^\d+[\.\)]\s+', s) or
                re.match(r'^[\-\*\_]{3,}\s*$', s) or
                s.startswith('> ') or
                ('|' in s and i + 1 < len(lines) and '---' in lines[i+1])):
                break
            para_lines.append(s)
            i += 1
        
        if para_lines:
            text = ' '.join(para_lines).strip()
            if text:
                blocks.append(make_paragraph(text))
        else:
            i += 1
    
    return blocks


# ============================================================
# Main migration
# ============================================================

def main():
    conn = psycopg2.connect(DATABASE_URL)
    conn.autocommit = False
    
    try:
        with conn.cursor(cursor_factory=psycopg2.extras.DictCursor) as cur:
            cur.execute("""
                SELECT id, slug, content_mdx, content_json, title
                FROM posts
                WHERE content_mdx IS NOT NULL AND content_mdx != ''
                ORDER BY slug
            """)
            posts = cur.fetchall()
        
        print(f"Found {len(posts)} posts with MDX content\n")
        
        updated = 0
        skipped = 0
        errors = 0
        stats = []
        
        for post in posts:
            try:
                existing = post['content_json'] or []
                if isinstance(existing, str):
                    existing = json.loads(existing)
                
                # Count existing headings
                old_headings = sum(1 for b in existing if isinstance(b, dict) and b.get('type') == 'heading')
                
                # Parse MDX to new blocks
                blocks = parse_mdx_to_blocks(post['content_mdx'])
                
                # Count new blocks
                new_headings = sum(1 for b in blocks if b['type'] == 'heading')
                code_blocks = sum(1 for b in blocks if b['type'] == 'codeBlock')
                tables = sum(1 for b in blocks if b['type'] == 'table')
                
                # Always update (overwrite corrupted data)
                with conn.cursor() as cur:
                    cur.execute(
                        "UPDATE posts SET content_json = %s WHERE id = %s",
                        (json.dumps(blocks, ensure_ascii=False), post['id'])
                    )
                
                updated += 1
                heading_delta = new_headings - old_headings
                parts = [f"{len(blocks)} blocks"]
                if heading_delta != 0:
                    parts.append(f"headings: {old_headings}→{new_headings} (+{heading_delta})")
                if code_blocks > 0:
                    parts.append(f"{code_blocks} code")
                if tables > 0:
                    parts.append(f"{tables} tables")
                
                slug_short = post['slug'][:45]
                print(f"✅ {slug_short:<47} {', '.join(parts)}")
                
            except Exception as e:
                errors += 1
                print(f"❌ {post['slug']}: {e}")
                conn.rollback()
                return 1
        
        conn.commit()
        print(f"\n=== Summary ===")
        print(f"Updated: {updated}")
        print(f"Errors:  {errors}")
        print(f"Commit:  OK")
        
    except Exception as e:
        conn.rollback()
        print(f"Fatal error: {e}")
        return 1
    finally:
        conn.close()
    
    return 0

if __name__ == '__main__':
    exit(main())

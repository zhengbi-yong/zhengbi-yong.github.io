"""
rebuild_content_json.py — Full BlockNote 0.49.0 Compatible Markdown Converter

Converts MDX markdown to BlockNote JSON blocks with complete support for
ALL BlockNote 0.49.0 block types and inline styles.

BLOCK TYPES SUPPORTED:
  paragraph, heading (1-3), codeBlock, bulletListItem, numberedListItem,
  checkListItem, toggleListItem, table (with tableParagraph), blockquote,
  divider, image, video, file

INLINE STYLES SUPPORTED:
  **bold**, *italic*, ***bold_italic***, `code`, ~~strike~~, ==highlight==,
  [links](url), ![images](url)

TABLE FORMAT (BlockNote 0.49.0):
  table → tableRow → tableHeader/tableCell → tableParagraph → text

Usage:
  python3 scripts/rebuild_content_json.py
"""

import json
import re
import uuid
import os
import sys
from pathlib import Path

PROJECT_ROOT = Path(__file__).parent.parent

# ============================================================
# ID generator
# ============================================================

def make_id():
    return str(uuid.uuid4())


# ============================================================
# Block factory helpers
# ============================================================

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


def make_paragraph_with_inline(inline_content):
    """Create a paragraph with inline content (text + styles)."""
    return make_block("paragraph", content=inline_content)


def make_heading(level, inline_content):
    """Create a heading with inline content."""
    return make_block(
        "heading",
        props={
            "level": level,
            "textColor": "default",
            "textAlignment": "left",
            "backgroundColor": "default",
            "isToggleable": False,
        },
        content=inline_content,
    )


def make_codeblock(language, code_text):
    """Create a codeBlock with inline text content (one text node per line)."""
    if not code_text.strip():
        return make_paragraph("")
    
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


def make_bullet_list_item(inline_content):
    return make_block("bulletListItem", content=inline_content)


def make_numbered_list_item(inline_content):
    return make_block("numberedListItem", content=inline_content)


def make_check_list_item(inline_content, checked=False):
    return make_block(
        "checkListItem",
        props={"checked": checked},
        content=inline_content,
    )


def make_toggle_list_item(inline_content):
    """Toggle list item - like a heading but in list form."""
    return make_block(
        "toggleListItem",
        props={},
        content=inline_content,
    )


def make_blockquote(inline_content):
    return make_block("blockquote", content=inline_content)


def make_divider():
    return make_block("divider")


def make_table_paragraph(text):
    """Create a tableParagraph wrapping inline text."""
    styles = _parse_inline_styles(text)
    if styles:
        return make_block("tableParagraph", content=styles)
    return make_block("tableParagraph", content=[make_text(text)])


def make_table(headers, rows):
    """Create a BlockNote 0.49.0 table with correct tableParagraph wrapping."""
    table_content = []
    # Header row → tableHeader
    header_cells = []
    for h in headers:
        header_cells.append(
            make_block("tableHeader", content=[make_table_paragraph(h)])
        )
    table_content.append(make_block("tableRow", content=header_cells))
    # Data rows → tableCell
    for row in rows:
        cells = []
        for cell in row:
            cells.append(
                make_block("tableCell", content=[make_table_paragraph(cell)])
            )
        table_content.append(make_block("tableRow", content=cells))
    return make_block("table", content=table_content)


def make_image_block(src, alt="", caption=""):
    """Create an image block."""
    props = {
        "url": src,
        "caption": caption or alt,
        "showPreview": True,
        "previewWidth": None,
    }
    if alt:
        props["name"] = alt
    return make_block("image", props=props)


def make_video_block(src, title=""):
    """Create a video block."""
    return make_block("video", props={
        "url": src,
        "name": title or os.path.basename(src),
    })


def make_file_block(url, name=""):
    """Create a file block."""
    return make_block("file", props={
        "url": url,
        "name": name or os.path.basename(url),
        "showPreview": True,
        "previewWidth": None,
    })


# ============================================================
# Inline style parser
# ============================================================

def _parse_inline_styles(text):
    """
    Parse inline markdown formatting into BlockNote text nodes with styles.
    Uses a simple character-by-character scanner to avoid regex backtracking.
    """
    if not text:
        return [make_text("")]
    
    result = []
    i = 0
    n = len(text)
    plain_start = 0
    
    def flush_plain(end):
        nonlocal plain_start
        if end > plain_start:
            result.append(make_text(text[plain_start:end], {}))
        plain_start = end
    
    while i < n:
        c = text[i]
        
        # Check for multi-char patterns (longest first)
        matched = False
        
        # Bold+Italic: ***...***
        if i + 6 <= n and text[i:i+3] == '***':
            end = text.find('***', i + 3)
            if end != -1:
                flush_plain(i)
                inner = text[i+3:end]
                result.append(make_text(inner, {"bold": {}, "italic": {}}))
                i = end + 3
                plain_start = i
                matched = True
                continue
        
        # Bold: **...**
        if not matched and i + 4 <= n and text[i:i+2] == '**':
            end = text.find('**', i + 2)
            if end != -1:
                flush_plain(i)
                inner = text[i+2:end]
                result.append(make_text(inner, {"bold": {}}))
                i = end + 2
                plain_start = i
                matched = True
                continue
        
        # Italic: *...* (but not **)
        if not matched and c == '*' and i + 2 < n:
            # Make sure it's a single *, not part of ** or ***
            if text[i+1] != '*':
                end = text.find('*', i + 1)
                if end != -1:
                    # Check it's a single closing *
                    if end + 1 >= n or text[end+1] != '*':
                        flush_plain(i)
                        inner = text[i+1:end]
                        result.append(make_text(inner, {"italic": {}}))
                        i = end + 1
                        plain_start = i
                        matched = True
                        continue
        
        # Strikethrough: ~~...~~
        if not matched and i + 4 <= n and text[i:i+2] == '~~':
            end = text.find('~~', i + 2)
            if end != -1:
                flush_plain(i)
                inner = text[i+2:end]
                result.append(make_text(inner, {"strike": {}}))
                i = end + 2
                plain_start = i
                matched = True
                continue
        
        # Highlight: ==...==
        if not matched and i + 4 <= n and text[i:i+2] == '==':
            end = text.find('==', i + 2)
            if end != -1:
                flush_plain(i)
                inner = text[i+2:end]
                result.append(make_text(inner, {"highlight": {}}))
                i = end + 2
                plain_start = i
                matched = True
                continue
        
        # Inline code: `...`
        if not matched and c == '`':
            end = text.find('`', i + 1)
            if end != -1:
                flush_plain(i)
                inner = text[i+1:end]
                result.append(make_text(inner, {"code": {}}))
                i = end + 1
                plain_start = i
                matched = True
                continue
        
        # Link: [text](url)
        if not matched and c == '[':
            close_bracket = text.find('](', i + 1)
            if close_bracket != -1:
                close_paren = text.find(')', close_bracket + 2)
                if close_paren != -1:
                    link_text = text[i+1:close_bracket]
                    link_url = text[close_bracket+2:close_paren]
                    if link_url:  # Only create link if URL is non-empty
                        flush_plain(i)
                        result.append({
                            "type": "link",
                            "content": [make_text(link_text)],
                            "href": link_url,
                        })
                        i = close_paren + 1
                        plain_start = i
                        matched = True
                        continue
        
        i += 1
    
    # Flush remaining plain text
    flush_plain(n)
    
    return result if result else [make_text(text, {})]


# ============================================================
# Markdown block parser
# ============================================================

def parse_mdx_to_blocks(mdx_text):
    """
    Parse MDX markdown into BlockNote JSON blocks with full syntax support.
    """
    lines = mdx_text.split('\n')
    blocks = []
    i = 0
    
    while i < len(lines):
        line = lines[i]
        
        # Skip empty lines entirely
        if not line.strip():
            i += 1
            continue
        
        stripped = line.strip()
        
        # ===== Fenced code blocks =====
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
                blocks.append(make_codeblock(lang if lang else "", code_text))
            continue
        
        # ===== Headings (# ## ###) =====
        heading_match = re.match(r'^(#{1,6})\s+(.+)$', stripped)
        if heading_match:
            level = min(len(heading_match.group(1)), 3)  # BlockNote max level 3
            text = heading_match.group(2).strip()
            inline = _parse_inline_styles(text)
            blocks.append(make_heading(level, inline))
            i += 1
            continue
        
        # ===== Thematic break / divider (--- *** ___) =====
        if re.match(r'^[\-\*\_]{3,}\s*$', stripped):
            blocks.append(make_divider())
            i += 1
            continue
        
        # ===== Tables (| col1 | col2 |) =====
        if '|' in stripped and i + 2 < len(lines):
            next_line = lines[i + 1].strip() if i + 1 < len(lines) else ''
            if re.match(r'^[\|\s\-\:]+$', next_line) and '---' in next_line:
                header_cells = [c.strip() for c in stripped.split('|') if c.strip()]
                rows = []
                j = i + 2
                while j < len(lines) and '|' in lines[j].strip():
                    row_cells = [c.strip() for c in lines[j].strip().split('|') if c.strip()]
                    if row_cells:
                        rows.append(row_cells)
                    j += 1
                
                # Normalize columns
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
                
                if header_cells:
                    blocks.append(make_table(header_cells, rows))
                i = j
                continue
        
        # ===== Blockquotes (> text) =====
        if stripped.startswith('> '):
            quote_lines = []
            while i < len(lines) and lines[i].strip().startswith('> '):
                quote_lines.append(lines[i].strip()[2:])
                i += 1
            quote_text = ' '.join(quote_lines)
            inline = _parse_inline_styles(quote_text)
            blocks.append(make_blockquote(inline))
            continue
        
        # ===== Check list items (- [ ] or - [x]) =====
        check_match = re.match(r'^[\-\*\+]\s+\[([ xX])\]\s+(.+)$', stripped)
        if check_match:
            checked = check_match.group(1).lower() == 'x'
            text = check_match.group(2)
            # Collect consecutive check items
            check_items = []
            check_items.append((text, checked))
            i += 1
            while i < len(lines):
                cm = re.match(r'^[\-\*\+]\s+\[([ xX])\]\s+(.+)$', lines[i].strip())
                if cm:
                    check_items.append((cm.group(2), cm.group(1).lower() == 'x'))
                    i += 1
                else:
                    break
            for t, c in check_items:
                inline = _parse_inline_styles(t)
                blocks.append(make_check_list_item(inline, c))
            continue
        
        # ===== Bullet list items (- or * or +) =====
        if re.match(r'^[\-\*\+]\s+', stripped):
            bullet_lines = []
            while i < len(lines) and re.match(r'^[\-\*\+]\s+', lines[i].strip()):
                # Skip check items (only if the bracket pattern is actually a checkbox)
                if re.match(r'^[\-\*\+]\s+\[([ xX])\]\s+', lines[i].strip()):
                    break
                text = re.sub(r'^[\-\*\+]\s+', '', lines[i].strip())
                bullet_lines.append(text)
                i += 1
            for text in bullet_lines:
                inline = _parse_inline_styles(text)
                blocks.append(make_bullet_list_item(inline))
            if not bullet_lines:
                i += 1  # Ensure forward progress on edge cases
            continue
        
        # ===== Numbered list items (1. or 1)) =====
        if re.match(r'^\d+[\.\)]\s+', stripped):
            numbered_lines = []
            while i < len(lines) and re.match(r'^\d+[\.\)]\s+', lines[i].strip()):
                text = re.sub(r'^\d+[\.\)]\s+', '', lines[i].strip())
                numbered_lines.append(text)
                i += 1
            for text in numbered_lines:
                inline = _parse_inline_styles(text)
                blocks.append(make_numbered_list_item(inline))
            continue
        
        # ===== Standalone images (![alt](url)) =====
        img_match = re.match(r'^!\[([^\]]*)\]\(([^)]+)\)$', stripped)
        if img_match:
            alt = img_match.group(1)
            src = img_match.group(2)
            # Video files become video blocks
            if re.search(r'\.(mp4|webm|ogg|mov)$', src, re.IGNORECASE):
                blocks.append(make_video_block(src, alt))
            else:
                blocks.append(make_image_block(src, alt))
            i += 1
            continue
        
        # ===== Toggle list items (> heading) =====
        toggle_match = re.match(r'^>\s+(.+)$', stripped)
        if toggle_match and i + 1 < len(lines):
            # Check if next line is indented (content of toggle)
            # Only treat as toggle if it looks like a heading-like toggle
            text = toggle_match.group(1)
            # Simple toggle: just a line starting with >
            # Collect indented content as children
            toggle_content = [_parse_inline_styles(text)]
            i += 1
            # Collect indented child lines
            child_lines = []
            while i < len(lines) and lines[i].startswith('  ') and lines[i].strip():
                child_lines.append(lines[i].strip())
                i += 1
            # For now, create as toggleListItem with content
            inline = _parse_inline_styles(text)
            blocks.append(make_toggle_list_item(inline))
            # Add children as nested paragraphs
            for cl in child_lines:
                if cl:
                    blocks.append(make_block("paragraph", content=_parse_inline_styles(cl)))
            continue
        
        # ===== Paragraph (default) =====
        para_lines = []
        while i < len(lines) and lines[i].strip():
            s = lines[i].strip()
            # Stop at any special block starter
            if (s.startswith('```') or s.startswith('#') or
                re.match(r'^[\-\*\+]\s+', s) or
                re.match(r'^\d+[\.\)]\s+', s) or
                re.match(r'^[\-\*\_]{3,}\s*$', s) or
                s.startswith('> ') or
                re.match(r'^!\[', s) or
                ('|' in s and i + 1 < len(lines) and '---' in lines[i+1])):
                break
            para_lines.append(s)
            i += 1
        
        if para_lines:
            text = ' '.join(para_lines).strip()
            if text:
                inline = _parse_inline_styles(text)
                blocks.append(make_paragraph_with_inline(inline))
        else:
            i += 1
    
    return blocks


# ============================================================
# Main migration
# ============================================================

def main():
    input_file = '/tmp/posts_mdx_export.json'
    output_file = '/tmp/content_json_rebuilt.json'
    
    if not os.path.exists(input_file):
        print(f"Error: {input_file} not found. Run export first.")
        return 1
    
    with open(input_file, 'r') as f:
        posts = json.loads(f.read().strip())
    
    print(f"Processing {len(posts)} posts...\n")
    
    output = {}
    updated = 0
    errors = 0
    
    for post in posts:
        try:
            blocks = parse_mdx_to_blocks(post['content_mdx'])
            
            headings = sum(1 for b in blocks if b['type'] == 'heading')
            code_blocks = sum(1 for b in blocks if b['type'] == 'codeBlock')
            tables = sum(1 for b in blocks if b['type'] == 'table')
            bullets = sum(1 for b in blocks if b['type'] == 'bulletListItem')
            numbered = sum(1 for b in blocks if b['type'] == 'numberedListItem')
            checks = sum(1 for b in blocks if b['type'] == 'checkListItem')
            toggles = sum(1 for b in blocks if b['type'] == 'toggleListItem')
            images = sum(1 for b in blocks if b['type'] == 'image')
            videos = sum(1 for b in blocks if b['type'] == 'video')
            quotes = sum(1 for b in blocks if b['type'] == 'blockquote')
            dividers = sum(1 for b in blocks if b['type'] == 'divider')
            
            output[post['id']] = json.dumps(blocks, ensure_ascii=False)
            updated += 1
            
            parts = [f"{len(blocks)} blocks"]
            if headings > 0: parts.append(f"H{headings}")
            if code_blocks > 0: parts.append(f"code×{code_blocks}")
            if tables > 0: parts.append(f"table×{tables}")
            if bullets > 0: parts.append(f"bullet×{bullets}")
            if numbered > 0: parts.append(f"num×{numbered}")
            if checks > 0: parts.append(f"check×{checks}")
            if toggles > 0: parts.append(f"toggle×{toggles}")
            if images > 0: parts.append(f"img×{images}")
            if videos > 0: parts.append(f"vid×{videos}")
            if quotes > 0: parts.append(f"quote×{quotes}")
            if dividers > 0: parts.append(f"hr×{dividers}")
            
            slug = post['slug'][:45]
            print(f"✅ {slug:<47} {', '.join(parts)}")
            
        except Exception as e:
            errors += 1
            print(f"❌ {post['slug']}: {e}")
    
    # Write JSON output
    with open(output_file, 'w') as f:
        json.dump(output, f, ensure_ascii=False)
    
    # Generate SQL
    lines = ["BEGIN;"]
    for post_id, content_json in output.items():
        escaped = content_json.replace("'", "''")
        lines.append(f"UPDATE posts SET content_json = '{escaped}' WHERE id = '{post_id}';")
    lines.append("COMMIT;")
    
    sql_file = '/tmp/update_content_json.sql'
    with open(sql_file, 'w') as f:
        f.write('\n'.join(lines))
    
    print(f"\n=== Summary ===")
    print(f"Updated: {updated}")
    print(f"Errors:  {errors}")
    print(f"JSON:    {output_file}")
    print(f"SQL:     {sql_file} ({os.path.getsize(sql_file)} bytes)")
    
    return 0


if __name__ == '__main__':
    exit(main())

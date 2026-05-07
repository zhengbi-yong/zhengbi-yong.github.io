"""
rebuild_content_mdx.py — BlockNote JSON → MDX reverse converter

Takes content_json (BlockNote 0.49.0 blocks) and generates
content_mdx (Markdown with JSX components for custom blocks).

This is the reverse operation of rebuild_content_json.py.
The output is stored in content_mdx and used by MDXRuntime
for public rendering.

Usage:
  python3 scripts/rebuild_content_mdx.py < /tmp/content_json_rebuilt.json > /tmp/content_mdx_rebuilt.json
"""

import json
import sys
from typing import Any


def block_to_mdx(block: dict) -> str:
    """Convert a single BlockNote block to MDX string."""
    block_type = block['type']
    props = block.get('props', {})
    content = block.get('content', [])
    children = block.get('children', [])

    # --- Inline content helper ---
    def inline_to_text(inline_items: list) -> str:
        """Convert inline content (text + styles) to MDX/markdown."""
        parts = []
        for item in inline_items:
            if item['type'] == 'text':
                text = item['text']
                styles = item.get('styles', {})
                if styles.get('bold') and styles.get('italic'):
                    text = f'***{text}***'
                elif styles.get('bold'):
                    text = f'**{text}**'
                elif styles.get('italic'):
                    text = f'*{text}*'
                elif styles.get('strike'):
                    text = f'~~{text}~~'
                elif styles.get('code'):
                    text = f'`{text}`'
                parts.append(text)
            elif item['type'] == 'link':
                link_text = inline_to_text(item.get('content', []))
                href = item.get('href', '')
                parts.append(f'[{link_text}]({href})')
        return ''.join(parts)

    def table_block_to_mdx(block: dict) -> str:
        """Convert a table block to markdown table."""
        rows = block.get('content', [])
        lines = []
        for ri, row in enumerate(rows):
            cells = row.get('content', [])
            cell_texts = []
            for cell in cells:
                cell_paras = cell.get('content', [])
                cell_text = ''
                for cp in cell_paras:
                    cell_text += inline_to_text(cp.get('content', []))
                cell_texts.append(cell_text.strip())
            lines.append('| ' + ' | '.join(cell_texts) + ' |')
            if ri == 0:
                lines.append('|' + '|'.join(['------' for _ in cells]) + '|')
        return '\n'.join(lines)

    # --- Block type handlers ---
    if block_type == 'paragraph':
        return inline_to_text(content)

    elif block_type == 'heading':
        level = props.get('level', 2)
        prefix = '#' * level
        return f'{prefix} {inline_to_text(content)}'

    elif block_type == 'codeBlock':
        language = props.get('language', '')
        code_text = content[0]['text'] if content else ''
        return f'```{language}\n{code_text}\n```'

    elif block_type == 'bulletListItem':
        return f'- {inline_to_text(content)}'

    elif block_type == 'numberedListItem':
        return f'1. {inline_to_text(content)}'

    elif block_type == 'checkListItem':
        checked = 'x' if props.get('checked', False) else ' '
        return f'- [{checked}] {inline_to_text(content)}'

    elif block_type == 'blockquote':
        inner = '\n'.join(block_to_mdx(child) for child in content)
        return '\n'.join(f'> {line}' for line in inner.split('\n'))

    elif block_type == 'divider':
        return '---'

    elif block_type == 'image':
        src = props.get('url', '')
        alt = props.get('name', props.get('caption', ''))
        return f'![{alt}]({src})'

    elif block_type == 'video':
        src = props.get('url', '')
        name = props.get('name', '')
        return f'![{name}]({src})'

    elif block_type == 'table':
        return table_block_to_mdx(block)

    elif block_type == 'toggleListItem':
        return f'> {inline_to_text(content)}'

    elif block_type == 'customComponent':
        # Convert customComponent back to JSX
        component_name = props.get('componentName', '')
        attrs = props.get('attributes', {})
        child_blocks = props.get('children', [])

        attr_parts = []
        for k, v in attrs.items():
            # Determine if value looks like JSX expression or string
            if v.startswith('{') or v.startswith('[') or v.isdigit() or v in ('true', 'false', 'null'):
                attr_parts.append(f'{k}={{{v}}}')
            else:
                attr_parts.append(f'{k}="{v}"')

        attrs_str = ' '.join(attr_parts)
        if attrs_str:
            attrs_str = ' ' + attrs_str

        if child_blocks:
            children_mdx = '\n'.join(block_to_mdx(c) for c in child_blocks)
            return f'<{component_name}{attrs_str}>\n{children_mdx}\n</{component_name}>'
        else:
            return f'<{component_name}{attrs_str} />'

    elif block_type == 'html':
        return props.get('html', '')

    elif block_type == 'file':
        url = props.get('url', '')
        name = props.get('name', '')
        return f'[{name}]({url})'

    # Fallback for unknown types
    return inline_to_text(content) if content else ''


def parse_blocks_to_mdx(blocks: list) -> str:
    """Convert a list of BlockNote blocks to MDX string."""
    lines = []
    for i, block in enumerate(blocks):
        mdx = block_to_mdx(block)
        if mdx.strip():
            # Add blank line before headings, code blocks, tables, custom components, dividers
            block_type = block['type']
            if i > 0 and block_type in ('heading', 'codeBlock', 'table', 'customComponent', 
                                         'divider', 'image', 'video', 'blockquote', 'html'):
                lines.append('')
            lines.append(mdx)
    return '\n'.join(lines)


def main():
    """Read content_json JSON, output content_mdx JSON."""
    try:
        data = json.load(sys.stdin)
    except json.JSONDecodeError:
        # Try reading as a file argument
        if len(sys.argv) > 1:
            with open(sys.argv[1]) as f:
                data = json.load(f)
        else:
            print("Error: no valid JSON input", file=sys.stderr)
            return 1
    
    output = {}
    for post_id, blocks_json in data.items():
        if isinstance(blocks_json, str):
            blocks = json.loads(blocks_json)
        else:
            blocks = blocks_json
        
        mdx = parse_blocks_to_mdx(blocks)
        output[post_id] = mdx
    
    print(json.dumps(output, ensure_ascii=False, indent=2))
    return 0


if __name__ == '__main__':
    sys.exit(main())

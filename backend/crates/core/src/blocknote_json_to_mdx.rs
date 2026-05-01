//! BlockNote JSON → MDX/Markdown 转换器
//!
//! 将 BlockNote blocks JSON array 格式转换回 MDX/Markdown 文本。
//! 这是 `mdx_to_blocknote_json()` 的逆操作。
//!
//! # 格式差异
//! - BlockNote: 数组 `[{id, type, props, content, children}]`，内联样式 `styles`
//! - TipTap (legacy): 对象包裹 `{type:"doc", content:[...]}`，内联标记 `marks`
//!
//! # 设计原则
//! - 纯同步转换，无 IO
//! - 空输入返回空字符串
//! - 产出语义等价的 Markdown/MDX 文本
//! - 保留所有内联样式（bold, italic, code, strike）
//! - 正确处理嵌套结构（table > row > cell, link > content）

use serde_json::Value;

/// 将 BlockNote JSON blocks 数组转换为 MDX 文本
///
/// # Examples
///
/// ```
/// use blog_core::blocknote_json_to_mdx;
/// use serde_json::json;
///
/// let input = json!([{
///     "id": "1", "type": "paragraph", "props": {},
///     "content": [{"type": "text", "text": "Hello World", "styles": {}}],
///     "children": []
/// }]);
/// assert_eq!(blocknote_json_to_mdx(&input), "Hello World");
/// ```
pub fn blocknote_json_to_mdx(blocks: &Value) -> String {
    match blocks {
        Value::Array(arr) => {
            let rendered: Vec<String> = arr
                .iter()
                .map(block_to_mdx)
                .filter(|s| !s.is_empty())
                .collect();

            // 用双换行连接 blocks（保留 Markdown 段落间距）
            rendered.join("\n\n")
        }
        _ => String::new(),
    }
}

// ============================================================================
// Block-level 转换
// ============================================================================

fn block_to_mdx(block: &Value) -> String {
    let btype = block["type"].as_str().unwrap_or("paragraph");

    match btype {
        "heading" => heading_to_mdx(block),
        "paragraph" => {
            let text = inline_content_to_mdx(&block["content"]);
            // 空段落跳过
            if text.trim().is_empty() {
                String::new()
            } else {
                text
            }
        }
        "codeBlock" => codeblock_to_mdx(block),
        "bulletListItem" => {
            let text = inline_content_to_mdx(&block["content"]);
            if text.trim().is_empty() {
                return String::new();
            }
            format!("- {}", text)
        }
        "numberedListItem" => {
            let text = inline_content_to_mdx(&block["content"]);
            if text.trim().is_empty() {
                return String::new();
            }
            format!("1. {}", text)
        }
        "checkListItem" => {
            let checked = block["props"]["checked"].as_bool().unwrap_or(false);
            let marker = if checked { "[x]" } else { "[ ]" };
            let text = inline_content_to_mdx(&block["content"]);
            if text.trim().is_empty() {
                return String::new();
            }
            format!("- {} {}", marker, text)
        }
        "quote" => quote_to_mdx(block),
        "table" => table_to_mdx(block),
        "tableRow" => {
            // tableRow 不应出现在顶层，但做防御性处理
            let cells: Vec<String> = block["content"]
                .as_array()
                .map(|arr| arr.iter().map(|c| inline_content_to_mdx(&c["content"])).collect())
                .unwrap_or_default();
            format!("| {} |", cells.join(" | "))
        }
        "tableCell" => inline_content_to_mdx(&block["content"]),
        "divider" => "---".to_string(),
        "image" => {
            let src = block["props"]["url"].as_str().unwrap_or("");
            let caption = block["props"]["caption"].as_str().unwrap_or("");
            if caption.is_empty() {
                format!("![]({})", src)
            } else {
                format!("![{}]({})", caption, src)
            }
        }
        // 未知类型回退为 paragraph
        _ => {
            let text = inline_content_to_mdx(&block["content"]);
            if text.trim().is_empty() {
                String::new()
            } else {
                text
            }
        }
    }
}

fn heading_to_mdx(block: &Value) -> String {
    let level = block["props"]["level"].as_u64().unwrap_or(1).min(6).max(1);
    let prefix = "#".repeat(level as usize);
    let text = inline_content_to_mdx(&block["content"]);
    if text.trim().is_empty() {
        return String::new();
    }
    format!("{} {}", prefix, text)
}

fn codeblock_to_mdx(block: &Value) -> String {
    let lang = block["props"]["language"].as_str().unwrap_or("");
    let text = block["content"]
        .as_array()
        .map(|arr| {
            arr.iter()
                .map(|node| node["text"].as_str().unwrap_or(""))
                .collect::<Vec<_>>()
                .join("")
        })
        .unwrap_or_default();

    if text.trim().is_empty() {
        return String::new();
    }

    // 去除末尾多余换行
    let code = text.trim_end();
    format!("```{}\n{}\n```", lang, code)
}

fn quote_to_mdx(block: &Value) -> String {
    let text = inline_content_to_mdx(&block["content"]);
    if text.trim().is_empty() {
        return String::new();
    }
    // 每行添加 > 前缀
    text.lines()
        .map(|line| {
            if line.trim().is_empty() {
                ">".to_string()
            } else {
                format!("> {}", line)
            }
        })
        .collect::<Vec<_>>()
        .join("\n")
}

fn table_to_mdx(block: &Value) -> String {
    let rows: Vec<Vec<String>> = block["content"]
        .as_array()
        .map(|arr| {
            arr.iter()
                .map(|row| {
                    row["content"]
                        .as_array()
                        .map(|cells| {
                            cells
                                .iter()
                                .map(|cell| inline_content_to_mdx(&cell["content"]).trim().to_string())
                                .collect()
                        })
                        .unwrap_or_default()
                })
                .collect()
        })
        .unwrap_or_default();

    if rows.is_empty() {
        return String::new();
    }

    let col_count = rows.first().map(|r| r.len()).unwrap_or(0);
    if col_count == 0 {
        return String::new();
    }

    let mut lines: Vec<String> = Vec::new();

    // 表头行
    let header = rows[0]
        .iter()
        .map(|c| format!(" {}", c.trim(), ))
        .collect::<Vec<_>>()
        .join(" |");
    lines.push(format!("|{} |", header));

    // 分隔行
    let sep: Vec<String> = (0..col_count).map(|_| " --- ".to_string()).collect();
    lines.push(format!("|{} |", sep.join("|")));

    // 数据行（跳过第一行作为 header）
    for row in rows.iter().skip(1) {
        let data: Vec<String> = row.iter().map(|c| format!(" {}", c.trim())).collect();
        lines.push(format!("|{} |", data.join(" |")));
    }

    lines.join("\n")
}

// ============================================================================
// Inline 转换
// ============================================================================

/// 将内联内容数组转换为 Markdown 文本
fn inline_content_to_mdx(content: &Value) -> String {
    match content {
        Value::Array(items) => items.iter().map(inline_node_to_mdx).collect(),
        _ => String::new(),
    }
}

/// 将单个内联节点转换为 Markdown
///
/// 处理 text 和 link 两种内联类型。
/// 样式应用顺序（从外到内）：bold > italic > strike > code
/// 这样 Markdown 渲染后语义正确。
fn inline_node_to_mdx(node: &Value) -> String {
    let ntype = node["type"].as_str().unwrap_or("text");

    match ntype {
        "text" => {
            let text = node["text"].as_str().unwrap_or("");
            if text.is_empty() {
                return String::new();
            }
            let styles = &node["styles"];
            apply_inline_styles(text, styles)
        }
        "link" => {
            let href = node["href"]
                .as_str()
                .or_else(|| node["props"]["href"].as_str())
                .unwrap_or("");
            let inner = inline_content_to_mdx(&node["content"]);
            if inner.is_empty() {
                href.to_string()
            } else {
                format!("[{}]({})", inner, href)
            }
        }
        "mention" => {
            let name = node["props"]["name"]
                .as_str()
                .or_else(|| node["name"].as_str())
                .unwrap_or("");
            format!("@{}", name)
        }
        "image" => {
            // 内联图片（BlockNote 可能在段落内包含图片节点）
            let url = node["props"]["url"]
                .as_str()
                .or_else(|| node["url"].as_str())
                .unwrap_or("");
            let caption = node["props"]["caption"]
                .as_str()
                .or_else(|| node["caption"].as_str())
                .unwrap_or("");
            if caption.is_empty() {
                format!("![]({})", url)
            } else {
                format!("![{}]({})", caption, url)
            }
        }
        _ => {
            // 未知内联类型：尝试提取内容
            inline_content_to_mdx(
                &node
                    .get("content")
                    .unwrap_or(&Value::Null),
            )
        }
    }
}

/// 应用内联样式到文本
///
/// 样式应用顺序注意嵌套：bold 在外层，code 在内层
/// 示例：**`bold code`** 而非 `**bold code**`
fn apply_inline_styles(text: &str, styles: &Value) -> String {
    let bold = styles.get("bold").and_then(|v| v.as_bool()).unwrap_or(false);
    let italic = styles.get("italic").and_then(|v| v.as_bool()).unwrap_or(false);
    let strike = styles.get("strike").and_then(|v| v.as_bool()).unwrap_or(false);
    let code = styles.get("code").and_then(|v| v.as_bool()).unwrap_or(false);

    let mut result = text.to_string();

    // 内层：code
    if code {
        result = format!("`{}`", result);
    }
    // 中层：strikethrough
    if strike {
        result = format!("~~{}~~", result);
    }
    // 中内层：italic
    if italic {
        result = format!("*{}*", result);
    }
    // 外层：bold
    if bold {
        result = format!("**{}**", result);
    }

    result
}

// ============================================================================
// Tests
// ============================================================================

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;

    // ── 基本转换 ──────────────────────────────────────────────────────

    #[test]
    fn test_empty_array() {
        assert_eq!(blocknote_json_to_mdx(&json!([])), "");
    }

    #[test]
    fn test_null_input() {
        assert_eq!(blocknote_json_to_mdx(&Value::Null), "");
    }

    // ── Paragraph ─────────────────────────────────────────────────────

    #[test]
    fn test_paragraph() {
        let input = json!([{
            "id": "1", "type": "paragraph", "props": {},
            "content": [{"type": "text", "text": "Hello World", "styles": {}}],
            "children": []
        }]);
        assert_eq!(blocknote_json_to_mdx(&input), "Hello World");
    }

    #[test]
    fn test_multiple_paragraphs() {
        let input = json!([
            {"id": "1", "type": "paragraph", "props": {},
             "content": [{"type": "text", "text": "First", "styles": {}}], "children": []},
            {"id": "2", "type": "paragraph", "props": {},
             "content": [{"type": "text", "text": "Second", "styles": {}}], "children": []}
        ]);
        assert_eq!(blocknote_json_to_mdx(&input), "First\n\nSecond");
    }

    // ── Heading ───────────────────────────────────────────────────────

    #[test]
    fn test_heading_h1() {
        let input = json!([{
            "id": "1", "type": "heading", "props": {"level": 1},
            "content": [{"type": "text", "text": "Title", "styles": {}}],
            "children": []
        }]);
        assert_eq!(blocknote_json_to_mdx(&input), "# Title");
    }

    #[test]
    fn test_heading_h3() {
        let input = json!([{
            "id": "1", "type": "heading", "props": {"level": 3},
            "content": [{"type": "text", "text": "Section", "styles": {}}],
            "children": []
        }]);
        assert_eq!(blocknote_json_to_mdx(&input), "### Section");
    }

    #[test]
    fn test_heading_clamps_level() {
        // level 超出 1-6 范围时应 clamp
        let input = json!([{
            "id": "1", "type": "heading", "props": {"level": 7},
            "content": [{"type": "text", "text": "Clamped", "styles": {}}],
            "children": []
        }]);
        assert_eq!(blocknote_json_to_mdx(&input), "###### Clamped");
    }

    // ── Inline Styles ─────────────────────────────────────────────────

    #[test]
    fn test_bold() {
        let input = json!([{
            "id": "1", "type": "paragraph", "props": {},
            "content": [{"type": "text", "text": "bold", "styles": {"bold": true}}],
            "children": []
        }]);
        assert_eq!(blocknote_json_to_mdx(&input), "**bold**");
    }

    #[test]
    fn test_italic() {
        let input = json!([{
            "id": "1", "type": "paragraph", "props": {},
            "content": [{"type": "text", "text": "italic", "styles": {"italic": true}}],
            "children": []
        }]);
        assert_eq!(blocknote_json_to_mdx(&input), "*italic*");
    }

    #[test]
    fn test_strikethrough() {
        let input = json!([{
            "id": "1", "type": "paragraph", "props": {},
            "content": [{"type": "text", "text": "deleted", "styles": {"strike": true}}],
            "children": []
        }]);
        assert_eq!(blocknote_json_to_mdx(&input), "~~deleted~~");
    }

    #[test]
    fn test_inline_code() {
        let input = json!([{
            "id": "1", "type": "paragraph", "props": {},
            "content": [{"type": "text", "text": "code", "styles": {"code": true}}],
            "children": []
        }]);
        assert_eq!(blocknote_json_to_mdx(&input), "`code`");
    }

    #[test]
    fn test_bold_italic_nested() {
        let input = json!([{
            "id": "1", "type": "paragraph", "props": {},
            "content": [{"type": "text", "text": "both", "styles": {"bold": true, "italic": true}}],
            "children": []
        }]);
        assert_eq!(blocknote_json_to_mdx(&input), "***both***");
    }

    #[test]
    fn test_mixed_inline() {
        let input = json!([{
            "id": "1", "type": "paragraph", "props": {},
            "content": [
                {"type": "text", "text": "plain ", "styles": {}},
                {"type": "text", "text": "bold", "styles": {"bold": true}},
                {"type": "text", "text": " and ", "styles": {}},
                {"type": "text", "text": "italic", "styles": {"italic": true}},
                {"type": "text", "text": ".", "styles": {}}
            ],
            "children": []
        }]);
        assert_eq!(blocknote_json_to_mdx(&input), "plain **bold** and *italic*.");
    }

    // ── Link ──────────────────────────────────────────────────────────

    #[test]
    fn test_link() {
        let input = json!([{
            "id": "1", "type": "paragraph", "props": {},
            "content": [{"type": "link", "href": "https://example.com",
              "content": [{"type": "text", "text": "click here", "styles": {}}]}],
            "children": []
        }]);
        assert_eq!(blocknote_json_to_mdx(&input), "[click here](https://example.com)");
    }

    #[test]
    fn test_link_with_props_href() {
        // BlockNote v2+ 把 href 放在 props 下
        let input = json!([{
            "id": "1", "type": "paragraph", "props": {},
            "content": [{"type": "link", "props": {"href": "https://example.com"},
              "content": [{"type": "text", "text": "click", "styles": {}}]}],
            "children": []
        }]);
        assert_eq!(blocknote_json_to_mdx(&input), "[click](https://example.com)");
    }

    // ── Code Block ────────────────────────────────────────────────────

    #[test]
    fn test_code_block() {
        let input = json!([{
            "id": "1", "type": "codeBlock", "props": {"language": "rust"},
            "content": [{"type": "text", "text": "fn main() {\n    println!(\"hi\");\n}", "styles": {}}],
            "children": []
        }]);
        let output = blocknote_json_to_mdx(&input);
        assert!(output.starts_with("```rust\n"));
        assert!(output.ends_with("\n```"));
        assert!(output.contains("fn main()"));
    }

    #[test]
    fn test_code_block_no_lang() {
        let input = json!([{
            "id": "1", "type": "codeBlock", "props": {"language": ""},
            "content": [{"type": "text", "text": "plain code", "styles": {}}],
            "children": []
        }]);
        let output = blocknote_json_to_mdx(&input);
        assert!(output.starts_with("```\n"));
        assert!(output.contains("plain code"));
    }

    // ── Lists ─────────────────────────────────────────────────────────

    #[test]
    fn test_bullet_list() {
        let input = json!([
            {"id": "1", "type": "bulletListItem", "props": {},
             "content": [{"type": "text", "text": "Item A", "styles": {}}], "children": []},
            {"id": "2", "type": "bulletListItem", "props": {},
             "content": [{"type": "text", "text": "Item B", "styles": {}}], "children": []}
        ]);
        assert_eq!(blocknote_json_to_mdx(&input), "- Item A\n\n- Item B");
    }

    #[test]
    fn test_numbered_list() {
        let input = json!([
            {"id": "1", "type": "numberedListItem", "props": {},
             "content": [{"type": "text", "text": "First", "styles": {}}], "children": []},
            {"id": "2", "type": "numberedListItem", "props": {},
             "content": [{"type": "text", "text": "Second", "styles": {}}], "children": []}
        ]);
        assert_eq!(blocknote_json_to_mdx(&input), "1. First\n\n1. Second");
    }

    #[test]
    fn test_check_list() {
        let input = json!([
            {"id": "1", "type": "checkListItem", "props": {"checked": true},
             "content": [{"type": "text", "text": "Done", "styles": {}}], "children": []},
            {"id": "2", "type": "checkListItem", "props": {"checked": false},
             "content": [{"type": "text", "text": "Todo", "styles": {}}], "children": []}
        ]);
        assert_eq!(
            blocknote_json_to_mdx(&input),
            "- [x] Done\n\n- [ ] Todo"
        );
    }

    // ── Quote ─────────────────────────────────────────────────────────

    #[test]
    fn test_quote() {
        let input = json!([{
            "id": "1", "type": "quote", "props": {},
            "content": [{"type": "text", "text": "Quote text", "styles": {}}],
            "children": []
        }]);
        assert_eq!(blocknote_json_to_mdx(&input), "> Quote text");
    }

    #[test]
    fn test_quote_multiline() {
        let input = json!([{
            "id": "1", "type": "quote", "props": {},
            "content": [
                {"type": "text", "text": "Line 1\nLine 2", "styles": {}}
            ],
            "children": []
        }]);
        assert_eq!(
            blocknote_json_to_mdx(&input),
            "> Line 1\n> Line 2"
        );
    }

    // ── Divider ───────────────────────────────────────────────────────

    #[test]
    fn test_divider() {
        let input = json!([{
            "id": "1", "type": "divider", "props": {}, "children": []
        }]);
        assert_eq!(blocknote_json_to_mdx(&input), "---");
    }

    // ── Image ─────────────────────────────────────────────────────────

    #[test]
    fn test_image() {
        let input = json!([{
            "id": "1", "type": "image",
            "props": {"url": "https://example.com/img.png", "caption": ""},
            "children": []
        }]);
        assert_eq!(
            blocknote_json_to_mdx(&input),
            "![](https://example.com/img.png)"
        );
    }

    #[test]
    fn test_image_with_caption() {
        let input = json!([{
            "id": "1", "type": "image",
            "props": {"url": "https://example.com/img.png", "caption": "My image"},
            "children": []
        }]);
        assert_eq!(
            blocknote_json_to_mdx(&input),
            "![My image](https://example.com/img.png)"
        );
    }

    // ── Table ─────────────────────────────────────────────────────────

    #[test]
    fn test_simple_table() {
        let input = json!([{
            "id": "1", "type": "table", "props": {"backgroundColor": "default"},
            "content": [
                {"id": "r1", "type": "tableRow", "props": {},
                 "content": [
                    {"id": "c1", "type": "tableCell", "props": {},
                     "content": [{"type": "text", "text": "H1", "styles": {}}],
                     "children": []},
                    {"id": "c2", "type": "tableCell", "props": {},
                     "content": [{"type": "text", "text": "H2", "styles": {}}],
                     "children": []}
                 ], "children": []},
                {"id": "r2", "type": "tableRow", "props": {},
                 "content": [
                    {"id": "c3", "type": "tableCell", "props": {},
                     "content": [{"type": "text", "text": "D1", "styles": {}}],
                     "children": []},
                    {"id": "c4", "type": "tableCell", "props": {},
                     "content": [{"type": "text", "text": "D2", "styles": {}}],
                     "children": []}
                 ], "children": []}
            ],
            "children": []
        }]);
        let output = blocknote_json_to_mdx(&input);
        assert!(output.contains("| H1 | H2 |"));
        assert!(output.contains("| --- | --- |"));
        assert!(output.contains("| D1 | D2 |"));
    }

    // ── Unicode ───────────────────────────────────────────────────────

    #[test]
    fn test_chinese() {
        let input = json!([
            {"id": "1", "type": "heading", "props": {"level": 1},
             "content": [{"type": "text", "text": "你好世界", "styles": {}}], "children": []},
            {"id": "2", "type": "paragraph", "props": {},
             "content": [{"type": "text", "text": "这是中文内容。", "styles": {}}], "children": []}
        ]);
        assert_eq!(
            blocknote_json_to_mdx(&input),
            "# 你好世界\n\n这是中文内容。"
        );
    }

    #[test]
    fn test_japanese() {
        let input = json!([{
            "id": "1", "type": "paragraph", "props": {},
            "content": [{"type": "text", "text": "こんにちは世界", "styles": {}}],
            "children": []
        }]);
        assert_eq!(blocknote_json_to_mdx(&input), "こんにちは世界");
    }

    // ── Roundtrip 测试 ───────────────────────────────────────────────

    #[test]
    fn test_roundtrip_paragraph() {
        let original = "Hello World";
        let bn_json = crate::mdx_to_blocknote_json(original);
        let roundtrip = blocknote_json_to_mdx(&bn_json);
        assert_eq!(roundtrip, original);
    }

    #[test]
    fn test_roundtrip_heading() {
        let original = "# Hello";
        let bn_json = crate::mdx_to_blocknote_json(original);
        let roundtrip = blocknote_json_to_mdx(&bn_json);
        assert_eq!(roundtrip, original);
    }

    #[test]
    fn test_roundtrip_bold_italic() {
        let original = "**bold** and *italic*";
        let bn_json = crate::mdx_to_blocknote_json(original);
        let roundtrip = blocknote_json_to_mdx(&bn_json);
        assert_eq!(roundtrip, original);
    }

    #[test]
    fn test_roundtrip_inline_code() {
        let original = "Use `code` here.";
        let bn_json = crate::mdx_to_blocknote_json(original);
        let roundtrip = blocknote_json_to_mdx(&bn_json);
        assert_eq!(roundtrip, original);
    }

    #[test]
    fn test_roundtrip_link() {
        let original = "[click](https://example.com)";
        let bn_json = crate::mdx_to_blocknote_json(original);
        let roundtrip = blocknote_json_to_mdx(&bn_json);
        assert_eq!(roundtrip, original);
    }

    #[test]
    fn test_roundtrip_code_block() {
        let original = "```rust\nfn main() {}\n```";
        let bn_json = crate::mdx_to_blocknote_json(original);
        let roundtrip = blocknote_json_to_mdx(&bn_json);
        assert_eq!(roundtrip, original);
    }

    #[test]
    fn test_roundtrip_bullet_list() {
        let original = "- A\n\n- B\n\n- C";
        let bn_json = crate::mdx_to_blocknote_json(original);
        let roundtrip = blocknote_json_to_mdx(&bn_json);
        assert_eq!(roundtrip, original);
    }

    #[test]
    fn test_roundtrip_divider() {
        let original = "Before\n\n---\n\nAfter";
        let bn_json = crate::mdx_to_blocknote_json(original);
        let roundtrip = blocknote_json_to_mdx(&bn_json);
        assert_eq!(roundtrip, original);
    }

    #[test]
    fn test_roundtrip_complex() {
        let original = concat!(
            "# Title\n\n",
            "Intro paragraph with **bold** and `code`.\n\n",
            "- Item 1\n",
            "- Item 2\n\n",
            "> A quote\n\n",
            "```rust\nfn main() {}\n```\n\n",
            "Final paragraph with [link](https://example.com)."
        );
        let bn_json = crate::mdx_to_blocknote_json(original);
        let roundtrip = blocknote_json_to_mdx(&bn_json);

        // Roundtrip 验证：每个关键元素都应出现在输出中
        assert!(roundtrip.contains("# Title"), "should contain heading");
        assert!(roundtrip.contains("**bold**"), "should contain bold");
        assert!(roundtrip.contains("`code`"), "should contain inline code");
        assert!(roundtrip.contains("- Item 1"), "should contain bullet item");
        assert!(roundtrip.contains("- Item 2"), "should contain bullet item");
        assert!(roundtrip.contains("> A quote"), "should contain quote");
        assert!(roundtrip.contains("```rust"), "should contain code block");
        assert!(roundtrip.contains("fn main()"), "should contain code");
        assert!(
            roundtrip.contains("[link](https://example.com)"),
            "should contain link"
        );
    }

    // ── Edge Cases ────────────────────────────────────────────────────

    #[test]
    fn test_empty_paragraph_skipped() {
        let input = json!([
            {"id": "1", "type": "paragraph", "props": {},
             "content": [{"type": "text", "text": "", "styles": {}}], "children": []},
            {"id": "2", "type": "paragraph", "props": {},
             "content": [{"type": "text", "text": "Real content", "styles": {}}], "children": []}
        ]);
        assert_eq!(blocknote_json_to_mdx(&input), "Real content");
    }

    #[test]
    fn test_unknown_block_type_falls_back() {
        let input = json!([{
            "id": "1", "type": "customBlock", "props": {},
            "content": [{"type": "text", "text": "fallback", "styles": {}}],
            "children": []
        }]);
        assert_eq!(blocknote_json_to_mdx(&input), "fallback");
    }

    #[test]
    fn test_nested_blockquote_with_styles() {
        let input = json!([{
            "id": "1", "type": "quote",
            "props": {"backgroundColor": "default", "textColor": "default"},
            "content": [{"type": "text", "text": "Quoted **bold**", "styles": {}}],
            "children": []
        }]);
        assert_eq!(blocknote_json_to_mdx(&input), "> Quoted **bold**");
    }
}

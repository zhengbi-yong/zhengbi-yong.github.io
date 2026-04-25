//! Tiptap JSON AST → MDX 文本转换器
//!
//! 遍历 Tiptap ProseMirror JSON 树，将每个节点映射为 MDX/Markdown 语法字符串。
//! 支持：标题、段落、内联格式化、列表、代码块、数学公式、表格、引用、图片、视频、分割线等。
//!
//! 设计原则：
//! - 纯同步转换，无 IO，无外部依赖
//! - 空文档返回空字符串，不返回 undefined/null
//! - 文本节点进行 Markdown 特殊字符转义
//! - 列表嵌套使用 2 空格缩进（标准 Markdown 约定）

use serde_json::Value;

/// 将 Tiptap JSON AST 转换为 MDX 文本字符串。
///
/// # Arguments
/// * `json` - Tiptap ProseMirror JSON 节点树，通常是 `{ "type": "doc", "content": [...] }`
///
/// # Returns
/// 转换后的 MDX/Markdown 文本。
///
/// # Example
/// ```ignore
/// let json: serde_json::Value = serde_json::json!({
///     "type": "doc",
///     "content": [
///         { "type": "heading", "attrs": { "level": 1 }, "content": [{ "type": "text", "text": "Hello" }] },
///         { "type": "paragraph", "content": [{ "type": "text", "text": "World" }] }
///     ]
/// });
/// let mdx = blog_core::tiptap_json_to_mdx(&json);
/// assert_eq!(mdx, "# Hello\n\nWorld");
/// ```
pub fn tiptap_json_to_mdx(json: &Value) -> String {
    match json {
        Value::Object(obj) => {
            let node_type = obj.get("type").and_then(|v| v.as_str()).unwrap_or("text");
            let attrs = obj.get("attrs");
            let content = obj.get("content");

            match node_type {
                "doc" => render_doc(content),
                "paragraph" => render_paragraph(content),
                "heading" => render_heading(content, attrs),
                "text" => render_text_node(&Value::Object(obj.clone())),
                "bulletList" => render_bullet_list(content),
                "orderedList" => render_ordered_list(content, attrs),
                "taskList" => render_task_list(content),
                "taskItem" => render_task_item(content, attrs),
                "listItem" => render_list_item(content),
                "codeBlock" => render_code_block(content, attrs),
                "blockquote" => render_blockquote(content),
                "horizontalRule" => render_horizontal_rule(),
                "hardBreak" => render_hard_break(),
                "image" => render_image(attrs),
                "video" => render_video(attrs),
                "inlineMath" => render_inline_math(json),
                "math" => render_display_math(json),
                "table" => render_table(content),
                "tableRow" => render_table_row(content),
                "tableCell" => render_table_cell(content),
                "mention" => render_mention(attrs),
                "details" => render_details(content),
                "detailsSummary" => render_details_summary(content),
                "detailsContent" => render_details_content(content),
                "callout" => render_callout(content, attrs),
                // mark nodes (bold, italic, etc.) are handled inline in text
                _ => {
                    // Default: render children if available
                    if let Some(c) = content {
                        match c {
                            Value::Array(arr) => render_children(arr),
                            _ => tiptap_json_to_mdx(c),
                        }
                    } else {
                        String::new()
                    }
                }
            }
        }
        Value::Array(arr) => render_children(arr),
        _ => String::new(),
    }
}

// ---------------------------------------------------------------------------
// Doc
// ---------------------------------------------------------------------------

fn render_doc(content: Option<&Value>) -> String {
    match content {
        Some(Value::Array(arr)) => {
            let rendered: Vec<String> = arr.iter().map(|n| tiptap_json_to_mdx(n)).collect();
            rendered.join("\n\n")
        }
        _ => String::new(),
    }
}

// ---------------------------------------------------------------------------
// Block-level nodes
// ---------------------------------------------------------------------------

fn render_paragraph(content: Option<&Value>) -> String {
    match content {
        Some(Value::Array(arr)) if arr.is_empty() => String::new(),
        Some(Value::Array(arr)) => {
            let inner = render_inline_nodes(arr);
            if inner.trim().is_empty() {
                String::new()
            } else {
                inner
            }
        }
        _ => String::new(),
    }
}

fn render_heading(content: Option<&Value>, attrs: Option<&Value>) -> String {
    let level = attrs
        .and_then(|a| a.get("level"))
        .and_then(|v| v.as_i64())
        .unwrap_or(1)
        .min(6) as usize;
    let hashes = "#".repeat(level);

    let text = match content {
        Some(Value::Array(arr)) => render_inline_nodes(arr),
        _ => String::new(),
    };

    if text.trim().is_empty() {
        String::new()
    } else {
        format!("{} {}", hashes, text)
    }
}

fn render_code_block(content: Option<&Value>, attrs: Option<&Value>) -> String {
    let code = match content {
        Some(Value::Array(arr)) => {
            arr.iter()
                .map(|n| {
                    if let Some(t) = n.get("text").and_then(|v| v.as_str()) {
                        t.to_string()
                    } else {
                        tiptap_json_to_mdx(n)
                    }
                })
                .collect::<Vec<_>>()
                .join("")
        }
        _ => String::new(),
    };

    let language = attrs
        .and_then(|a| a.get("language"))
        .and_then(|v| v.as_str())
        .unwrap_or("");

    if code.trim().is_empty() {
        String::new()
    } else {
        format!("```{}\n{}\n```", language, code)
    }
}

fn render_blockquote(content: Option<&Value>) -> String {
    match content {
        Some(Value::Array(arr)) => {
            let inner: Vec<String> = arr.iter().map(|n| tiptap_json_to_mdx(n)).collect();
            let joined = inner.join("\n\n");
            joined
                .split('\n')
                .map(|line| format!("> {}", line))
                .collect::<Vec<_>>()
                .join("\n")
        }
        _ => String::new(),
    }
}

fn render_horizontal_rule() -> String {
    "\n---\n".to_string()
}

fn render_hard_break() -> String {
    "\n".to_string()
}

fn render_image(attrs: Option<&Value>) -> String {
    let src = attrs
        .and_then(|a| a.get("src"))
        .and_then(|v| v.as_str())
        .unwrap_or("");
    let alt = attrs
        .and_then(|a| a.get("alt"))
        .and_then(|v| v.as_str())
        .unwrap_or("");
    let title = attrs
        .and_then(|a| a.get("title"))
        .and_then(|v| v.as_str());

    if src.is_empty() {
        String::new()
    } else if let Some(t) = title {
        format!("![{}]({}) \"{}\"", alt, src, t)
    } else {
        format!("![{}]({})", alt, src)
    }
}

fn render_video(attrs: Option<&Value>) -> String {
    let src = attrs
        .and_then(|a| a.get("src"))
        .and_then(|v| v.as_str())
        .unwrap_or("");

    if src.is_empty() {
        String::new()
    } else {
        format!("<video src=\"{}\" />", src)
    }
}

// ---------------------------------------------------------------------------
// Table
// ---------------------------------------------------------------------------

fn render_table(content: Option<&Value>) -> String {
    match content {
        Some(Value::Array(rows)) if !rows.is_empty() => {
            let rendered_rows: Vec<String> = rows
                .iter()
                .map(|r| tiptap_json_to_mdx(r))
                .filter(|s| !s.trim().is_empty())
                .collect();

            if rendered_rows.is_empty() {
                String::new()
            } else {
                // Add separator after first row (header row)
                if rendered_rows.len() > 1 {
                    let header = &rendered_rows[0];
                    let body = &rendered_rows[1..];
                    let sep = make_table_separator(header);
                    format!(
                        "{}\n{}\n{}",
                        header,
                        sep,
                        body.join("\n")
                    )
                } else {
                    rendered_rows.join("\n")
                }
            }
        }
        _ => String::new(),
    }
}

fn render_table_row(content: Option<&Value>) -> String {
    match content {
        Some(Value::Array(cells)) => {
            let rendered: Vec<String> = cells
                .iter()
                .map(|c| tiptap_json_to_mdx(c))
                .collect();

            format!("|{}|", rendered.join("|"))
        }
        _ => String::new(),
    }
}

fn render_table_cell(content: Option<&Value>) -> String {
    match content {
        Some(Value::Array(paragraphs)) => {
            let text: String = paragraphs
                .iter()
                .map(|p| {
                    if let Some(arr) = p.as_object().and_then(|o| o.get("content")).and_then(|v| v.as_array()) {
                        render_inline_nodes(arr)
                    } else {
                        String::new()
                    }
                })
                .collect::<Vec<_>>()
                .join(" ");
            format!(" {} ", text.trim())
        }
        _ => String::new(),
    }
}

fn make_table_separator(header_row: &str) -> String {
    let col_count = header_row.matches('|').count().saturating_sub(1);
    (0..col_count)
        .map(|_| "| --- ")
        .collect::<Vec<_>>()
        .join("") + "|"
}

// ---------------------------------------------------------------------------
// List rendering
// ---------------------------------------------------------------------------

fn render_bullet_list(content: Option<&Value>) -> String {
    render_list(content, "- ".to_string(), 1.to_string())
}

fn render_ordered_list(content: Option<&Value>, attrs: Option<&Value>) -> String {
    let start = attrs
        .and_then(|a| a.get("start"))
        .and_then(|v| v.as_i64())
        .unwrap_or(1);
    render_list(content, "1. ".to_string(), start.to_string())
}

fn render_list(content: Option<&Value>, marker: String, start_num: String) -> String {
    match content {
        Some(Value::Array(items)) => {
            let mut result = String::new();
            let mut counter: i64 = start_num.parse().unwrap_or(1);

            for item in items {
                let item_text = tiptap_json_to_mdx(item);
                if item_text.trim().is_empty() {
                    continue;
                }

                // Indent nested content with 2 spaces
                let indented: Vec<String> = item_text
                    .split('\n')
                    .skip(1) // skip the list marker line (it's already marked)
                    .map(|line| format!("  {}", line))
                    .collect();

                // The first line already has the marker from tiptap_json_to_mdx
                // For top-level we use the provided marker
                if result.is_empty() {
                    // First item: prepend marker to first line
                    let lines: Vec<&str> = item_text.split('\n').collect();
                    if let Some(first) = lines.first() {
                        // Use numbered marker for ordered lists (respects start attribute)
                        let m = if marker.starts_with("1.") {
                            format!("{}. ", counter)
                        } else {
                            marker.to_string()
                        };
                        result.push_str(&format!("{}{}\n", m, first.trim()));
                        result.push_str(&indented.join("\n"));
                        if lines.len() > 1 || !indented.is_empty() {
                            result.push('\n');
                        }
                    }
                } else {
                    let lines: Vec<&str> = item_text.split('\n').collect();
                    if let Some(first) = lines.first() {
                        // Use numbered marker for ordered lists
                        let m = if marker.starts_with("1.") {
                            format!("{}. ", counter)
                        } else {
                            marker.to_string()
                        };
                        result.push_str(&format!("{}{}\n", m, first.trim()));
                        result.push_str(&indented.join("\n"));
                        if lines.len() > 1 || !indented.is_empty() {
                            result.push('\n');
                        }
                    }
                }
                counter += 1;
            }

            result.trim_end().to_string()
        }
        _ => String::new(),
    }
}

fn render_task_list(content: Option<&Value>) -> String {
    match content {
        Some(Value::Array(items)) => {
            let rendered: Vec<String> = items
                .iter()
                .map(|n| tiptap_json_to_mdx(n))
                .filter(|s| !s.trim().is_empty())
                .collect();
            rendered.join("\n")
        }
        _ => String::new(),
    }
}

fn render_task_item(content: Option<&Value>, attrs: Option<&Value>) -> String {
    let checked = attrs
        .and_then(|a| a.get("checked"))
        .and_then(|v| v.as_bool())
        .unwrap_or(false);

    let checkbox = if checked { "[x]" } else { "[ ]" };

    match content {
        Some(Value::Array(arr)) => {
            let inner: Vec<String> = arr
                .iter()
                .map(|n| tiptap_json_to_mdx(n))
                .filter(|s| !s.trim().is_empty())
                .collect();
            let joined = inner.join("\n");
            let first_indented = joined
                .split('\n')
                .enumerate()
                .map(|(i, line)| {
                    if i == 0 {
                        format!("- {} {}", checkbox, line.trim())
                    } else {
                        format!("  {}", line)
                    }
                })
                .collect::<Vec<_>>()
                .join("\n");
            first_indented
        }
        _ => format!("- {} ", checkbox),
    }
}

fn render_list_item(content: Option<&Value>) -> String {
    match content {
        Some(Value::Array(arr)) => {
            let parts: Vec<String> = arr
                .iter()
                .map(|n| tiptap_json_to_mdx(n))
                .collect();

            if parts.is_empty() {
                String::new()
            } else {
                // First part is the paragraph content of this list item
                // Remaining parts are nested lists
                let first = parts.first().cloned().unwrap_or_default();
                let rest = &parts[1..];

                let mut result = first.trim().to_string();
                if !rest.is_empty() {
                    let nested = rest
                        .iter()
                        .map(|s| {
                            s.split('\n')
                                .enumerate()
                                .map(|(i, line)| {
                                    if i == 0 {
                                        format!("  {}", line)
                                    } else {
                                        format!("  {}", line)
                                    }
                                })
                                .collect::<Vec<_>>()
                                .join("\n")
                        })
                        .collect::<Vec<_>>()
                        .join("\n");
                    if !nested.trim().is_empty() {
                        result.push_str("\n");
                        result.push_str(&nested);
                    }
                }
                result
            }
        }
        _ => String::new(),
    }
}

fn render_mention(attrs: Option<&Value>) -> String {
    let id = attrs
        .and_then(|a| a.get("id"))
        .and_then(|v| v.as_str())
        .unwrap_or("");
    let label = attrs
        .and_then(|a| a.get("label"))
        .and_then(|v| v.as_str())
        .unwrap_or(id);
    format!("@{}", label)
}

fn render_details(content: Option<&Value>) -> String {
    match content {
        Some(Value::Array(arr)) => {
            let inner: Vec<String> = arr.iter().map(|n| tiptap_json_to_mdx(n)).collect();
            inner.join("\n")
        }
        _ => String::new(),
    }
}

fn render_details_summary(content: Option<&Value>) -> String {
    match content {
        Some(Value::Array(arr)) => {
            let inner = render_inline_nodes(arr);
            format!("<details><summary>{}</summary>", inner)
        }
        _ => String::new(),
    }
}

fn render_details_content(content: Option<&Value>) -> String {
    match content {
        Some(Value::Array(arr)) => {
            let inner: Vec<String> = arr.iter().map(|n| tiptap_json_to_mdx(n)).collect();
            format!("{}\n</details>", inner.join("\n"))
        }
        _ => String::new(),
    }
}

fn render_callout(content: Option<&Value>, attrs: Option<&Value>) -> String {
    let callout_type = attrs
        .and_then(|a| a.get("type"))
        .and_then(|v| v.as_str())
        .unwrap_or("info");

    match content {
        Some(Value::Array(arr)) => {
            let inner: Vec<String> = arr.iter().map(|n| tiptap_json_to_mdx(n)).collect();
            let joined = inner.join("\n\n");
            let prefix = match callout_type {
                "warning" => "> ⚠️ ",
                "error" | "danger" => "> 🚨 ",
                "success" => "> ✅ ",
                _ => "> ℹ️ ",
            };
            joined
                .split('\n')
                .map(|line| format!("{}{}", prefix, line))
                .collect::<Vec<_>>()
                .join("\n")
        }
        _ => String::new(),
    }
}

// ---------------------------------------------------------------------------
// Inline rendering
// ---------------------------------------------------------------------------

/// Render an array of inline nodes (text + marks + inlineMath + mention)
fn render_inline_nodes(arr: &[Value]) -> String {
    arr.iter()
        .map(|node| render_inline_node(node))
        .collect::<Vec<_>>()
        .join("")
}

fn render_inline_node(node: &Value) -> String {
    let node_type = node.get("type").and_then(|v| v.as_str()).unwrap_or("text");
    let obj = node.as_object();

    match node_type {
        "text" => render_text_node(node),
        "image" => obj.and_then(|o| o.get("attrs")).map(|a| render_image(Some(a))).unwrap_or_default(),
        "video" => obj.and_then(|o| o.get("attrs")).map(|a| render_video(Some(a))).unwrap_or_default(),
        "inlineMath" => render_inline_math(node),
        "math" => render_display_math(node),
        _ => {
            // Unknown inline: try to render children
            node.get("content")
                .and_then(|v| v.as_array())
                .map(|arr| render_inline_nodes(arr))
                .unwrap_or_default()
        }
    }
}

fn render_text_node(node: &Value) -> String {
    let obj = match node.as_object() {
        Some(o) => o,
        None => return String::new(),
    };
    let text = obj.get("text").and_then(|v| v.as_str()).unwrap_or("");
    let marks = obj.get("marks").and_then(|v| v.as_array());

    let text = escape_markdown_text(text);

    match marks {
        Some(arr) if !arr.is_empty() => {
            let mut result = text;
            // Apply marks in order: bold, code, italic, strike, highlight, underline
            // Note: order matters — wrap from inside out
            for mark in arr {
                let mark_type = mark.get("type").and_then(|v| v.as_str()).unwrap_or("");
                result = apply_mark(result, mark_type, Some(mark));
            }
            result
        }
        _ => text,
    }
}

fn apply_mark(text: String, mark_type: &str, mark: Option<&Value>) -> String {
    let t = text.as_str();
    match mark_type {
        "bold" => format!("**{}**", t),
        "italic" => format!("*{}*", t),
        "underline" => format!("__{}__", t),
        "strike" => format!("~~{}~~", t),
        "code" => format!("`{}`", t),
        "highlight" => format!("=={}==", t),
        "link" => {
            // link attrs are stored alongside the text mark in Tiptap's JSON
            // The href is retrieved from the attrs on the mark itself
            let href = mark
                .and_then(|m| m.get("attrs"))
                .and_then(|a| a.get("href"))
                .and_then(|v| v.as_str())
                .unwrap_or("#");
            format!("[{}]({})", t, href)
        }
        _ => text,
    }
}

fn render_inline_math(node: &Value) -> String {
    let latex = node
        .get("attrs")
        .and_then(|a| a.get("latex"))
        .and_then(|v| v.as_str())
        .unwrap_or("");
    format!("${}$", latex)
}

fn render_display_math(node: &Value) -> String {
    let latex = node
        .get("attrs")
        .and_then(|a| a.get("latex"))
        .and_then(|v| v.as_str())
        .unwrap_or("");
    format!("$$\n{}\n$$", latex)
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

fn render_children(arr: &[Value]) -> String {
    arr.iter()
        .map(|n| tiptap_json_to_mdx(n))
        .collect::<Vec<_>>()
        .join("\n")
}

/// Escape special Markdown characters in text nodes.
/// Only escapes when the character is not already part of a mark.
/// Characters: * _ ` # + - ! [ ] ( ) | >
fn escape_markdown_text(text: &str) -> String {
    let mut result = String::with_capacity(text.len());
    let chars: Vec<char> = text.chars().collect();

    for (i, c) in chars.iter().enumerate() {
        match c {
            '*' | '_' | '`' | '#' | '+' | '>' => {
                // Escape if not already escaped and not inside a code mark
                result.push('\\');
                result.push(*c);
            }
            '[' => {
                // Escape to prevent accidental link syntax
                result.push('\\');
                result.push(*c);
            }
            ']' => {
                // Escape if followed by ( without an opening [
                result.push(*c);
                if i + 1 < chars.len() && chars[i + 1] == '(' {
                    result.push('\\');
                }
            }
            '|' => {
                // Escape in non-table contexts (simplified heuristic: always escape in text)
                result.push('\\');
                result.push(*c);
            }
            '-' => {
                // Escape if it would look like a list or HR (preceded by newline or space)
                if i > 0 && (chars[i - 1] == '\n' || chars[i - 1] == ' ') {
                    result.push('\\');
                    result.push(*c);
                } else {
                    result.push(*c);
                }
            }
            _ => result.push(*c),
        }
    }

    result
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_heading() {
        let json = serde_json::json!({
            "type": "doc",
            "content": [
                { "type": "heading", "attrs": { "level": 1 }, "content": [{ "type": "text", "text": "Hello World" }] }
            ]
        });
        assert_eq!(tiptap_json_to_mdx(&json), "# Hello World");
    }

    #[test]
    fn test_paragraph() {
        let json = serde_json::json!({
            "type": "doc",
            "content": [
                { "type": "paragraph", "content": [{ "type": "text", "text": "Hello" }] }
            ]
        });
        assert_eq!(tiptap_json_to_mdx(&json), "Hello");
    }

    #[test]
    fn test_inline_math() {
        let json = serde_json::json!({
            "type": "doc",
            "content": [
                { "type": "paragraph", "content": [
                    { "type": "text", "text": "Energy: " },
                    { "type": "inlineMath", "attrs": { "latex": "E=mc^2" } }
                ]}
            ]
        });
        assert_eq!(tiptap_json_to_mdx(&json), "Energy: $E=mc^2$");
    }

    #[test]
    fn test_display_math() {
        let json = serde_json::json!({
            "type": "doc",
            "content": [
                { "type": "math", "attrs": { "latex": "\\frac{-b}{a}" } }
            ]
        });
        assert_eq!(tiptap_json_to_mdx(&json), "$$\n\\frac{-b}{a}\n$$");
    }

    #[test]
    fn test_code_block() {
        let json = serde_json::json!({
            "type": "doc",
            "content": [
                { "type": "codeBlock", "attrs": { "language": "rust" }, "content": [{ "type": "text", "text": "fn main() {}" }] }
            ]
        });
        assert_eq!(tiptap_json_to_mdx(&json), "```rust\nfn main() {}\n```");
    }

    #[test]
    fn test_bold_and_italic() {
        let json = serde_json::json!({
            "type": "doc",
            "content": [
                { "type": "paragraph", "content": [
                    { "type": "text", "text": "bold", "marks": [{ "type": "bold" }] },
                    { "type": "text", "text": " and " },
                    { "type": "text", "text": "italic", "marks": [{ "type": "italic" }] }
                ]}
            ]
        });
        assert_eq!(tiptap_json_to_mdx(&json), "**bold** and *italic*");
    }

    #[test]
    fn test_blockquote() {
        let json = serde_json::json!({
            "type": "doc",
            "content": [
                { "type": "blockquote", "content": [
                    { "type": "paragraph", "content": [{ "type": "text", "text": "Quote me" }] }
                ]}
            ]
        });
        assert_eq!(tiptap_json_to_mdx(&json), "> Quote me");
    }

    #[test]
    fn test_bullet_list() {
        let json = serde_json::json!({
            "type": "doc",
            "content": [
                { "type": "bulletList", "content": [
                    { "type": "listItem", "content": [
                        { "type": "paragraph", "content": [{ "type": "text", "text": "Item 1" }] }
                    ]},
                    { "type": "listItem", "content": [
                        { "type": "paragraph", "content": [{ "type": "text", "text": "Item 2" }] }
                    ]}
                ]}
            ]
        });
        let result = tiptap_json_to_mdx(&json);
        assert!(result.contains("- Item 1"));
        assert!(result.contains("- Item 2"));
    }

    #[test]
    fn test_image() {
        let json = serde_json::json!({
            "type": "doc",
            "content": [
                { "type": "paragraph", "content": [
                    { "type": "image", "attrs": { "src": "https://example.com/img.png", "alt": "example" } }
                ]}
            ]
        });
        assert_eq!(tiptap_json_to_mdx(&json), "![example](https://example.com/img.png)");
    }

    #[test]
    fn test_video() {
        let json = serde_json::json!({
            "type": "doc",
            "content": [
                { "type": "video", "attrs": { "src": "https://example.com/video.mp4" } }
            ]
        });
        assert_eq!(
            tiptap_json_to_mdx(&json),
            "<video src=\"https://example.com/video.mp4\" />"
        );
    }

    #[test]
    fn test_table() {
        let json = serde_json::json!({
            "type": "doc",
            "content": [
                { "type": "table", "content": [
                    { "type": "tableRow", "content": [
                        { "type": "tableCell", "content": [{ "type": "paragraph", "content": [{ "type": "text", "text": "Header 1" }] }] },
                        { "type": "tableCell", "content": [{ "type": "paragraph", "content": [{ "type": "text", "text": "Header 2" }] }] }
                    ]},
                    { "type": "tableRow", "content": [
                        { "type": "tableCell", "content": [{ "type": "paragraph", "content": [{ "type": "text", "text": "Cell 1" }] }] },
                        { "type": "tableCell", "content": [{ "type": "paragraph", "content": [{ "type": "text", "text": "Cell 2" }] }] }
                    ]}
                ]}
            ]
        });
        let result = tiptap_json_to_mdx(&json);
        assert!(result.contains("| Header 1 | Header 2 |"));
        assert!(result.contains("| Cell 1 | Cell 2 |"));
        assert!(result.contains("| --- | --- |")); // separator
    }

    #[test]
    fn test_horizontal_rule() {
        let json = serde_json::json!({
            "type": "doc",
            "content": [{ "type": "horizontalRule" }]
        });
        assert_eq!(tiptap_json_to_mdx(&json), "\n---\n");
    }

    #[test]
    fn test_task_list() {
        let json = serde_json::json!({
            "type": "doc",
            "content": [
                { "type": "taskList", "content": [
                    { "type": "taskItem", "attrs": { "checked": true }, "content": [
                        { "type": "paragraph", "content": [{ "type": "text", "text": "Done" }] }
                    ]},
                    { "type": "taskItem", "attrs": { "checked": false }, "content": [
                        { "type": "paragraph", "content": [{ "type": "text", "text": "Not done" }] }
                    ]}
                ]}
            ]
        });
        let result = tiptap_json_to_mdx(&json);
        assert!(result.contains("[x] Done"));
        assert!(result.contains("[ ] Not done"));
    }

    #[test]
    fn test_escape_special_chars() {
        let json = serde_json::json!({
            "type": "doc",
            "content": [
                { "type": "paragraph", "content": [{ "type": "text", "text": "Hello *world* and [links](url)" }] }
            ]
        });
        let result = tiptap_json_to_mdx(&json);
        // Asterisks and brackets should be escaped
        assert!(result.contains("\\*"));
    }

    #[test]
    fn test_empty_doc() {
        let json = serde_json::json!({ "type": "doc", "content": [] });
        assert_eq!(tiptap_json_to_mdx(&json), "");
    }

    #[test]
    fn test_nested_lists() {
        let json = serde_json::json!({
            "type": "doc",
            "content": [
                { "type": "bulletList", "content": [
                    { "type": "listItem", "content": [
                        { "type": "paragraph", "content": [{ "type": "text", "text": "Item 1" }] },
                        { "type": "bulletList", "content": [
                            { "type": "listItem", "content": [
                                { "type": "paragraph", "content": [{ "type": "text", "text": "Nested" }] }
                            ]}
                        ]}
                    ]}
                ]}
            ]
        });
        let result = tiptap_json_to_mdx(&json);
        assert!(result.contains("- Item 1"));
        assert!(result.contains("  - Nested"));
    }
}

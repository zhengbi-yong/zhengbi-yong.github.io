//! MDX/Markdown → BlockNote JSON 转换器
//!
//! 使用 pulldown-cmark 将 MDX/Markdown 文本解析为事件流，然后映射为
//! BlockNote blocks JSON array 格式。
//!
//! # 设计原则
//! - 纯同步转换，无 IO，无外部副作用
//! - 空输入返回 `[]`
//! - 所有 block 严格遵循 BlockNote JSON 格式
//! - 内联样式通过栈上下文自动应用到文本节点
//!
//! # 与 mdx_to_json 的区别
//! - 输出 BlockNote 格式（id, props, styles）而非 TipTap 格式（attrs, marks）
//! - 输出为 JSON Array 而非 `{"type":"doc",...}` 包裹
//! - 链接是 inline node 而非 mark
//! - 列表项直接输出到父级，不包裹 list 容器
//! - divider 无 content 字段
//! - quote 的 props 无 textAlignment

use pulldown_cmark::{CodeBlockKind, Event, HeadingLevel, Options, Parser, Tag, TagEnd};
use serde_json::{json, Value};
use uuid::Uuid;

/// 将 MDX/Markdown 文本转换为 BlockNote blocks JSON array
pub fn mdx_to_blocknote_json(mdx_text: &str) -> Value {
    if mdx_text.trim().is_empty() {
        return json!([]);
    }

    let parser = Parser::new_ext(mdx_text, Options::all());
    let events: Vec<Event> = parser.collect();
    let mut ctx = ParseContext::new();
    ctx.process_events(&events);

    json!(ctx.blocks)
}

// ============================================================================
// 解析器：基于双栈的架构
// ============================================================================
//
// `node_stack`: 当前打开的节点类型
// `content_stack`: 每个栈层面对应的内容缓冲区 Vec<Value>
//
// Start(tag) => push node + 空 Vec
// End(tag)   => pop node + Vec，组装为 JSON，加入父层 content
// Text 等    => 组装为 JSON 节点，加入顶层 content
//
// 特殊处理：
// - List: 不在输出中创建容器 block，其子列表项在 assemble 时被 re-parent
// - Link: 作为 inline node（有 type:"link" 和 content），非 mark

struct ParseContext {
    node_stack: Vec<BlockType>,
    content_stack: Vec<Vec<Value>>,
    blocks: Vec<Value>,
    in_code_block: bool,
    code_block_text: String,
    /// 当前列表项的 check 状态
    current_item_is_check: bool,
    current_item_checked: bool,
}

#[derive(Debug, Clone)]
enum BlockType {
    Paragraph,
    Heading { level: u8 },
    CodeBlock { language: String },
    /// List 不会产出 block；它的 assemble 只是将其子项 re-parent
    List { ordered: bool },
    /// ListItem 产出一个 bulletListItem / numberedListItem / checkListItem block
    ListItem { ordered: bool },
    Quote,
    Table,
    TableRow,
    TableCell,
    /// 内联格式容器（不产出 block，而是对其内容应用 styles 后展平）
    Emphasis,
    Strong,
    Strikethrough,
    /// 链接：内联节点，包装其内容
    Link { href: String, title: String },
    /// 图片 alt 文本容器（图片 block 已在 on_start 时创建）
    Image,
}

impl ParseContext {
    fn new() -> Self {
        Self {
            node_stack: Vec::new(),
            content_stack: Vec::new(),
            blocks: Vec::new(),
            in_code_block: false,
            code_block_text: String::new(),
            current_item_is_check: false,
            current_item_checked: false,
        }
    }

    fn current_content(&mut self) -> &mut Vec<Value> {
        self.content_stack
            .last_mut()
            .expect("content_stack empty")
    }

    fn push(&mut self, node: BlockType) {
        self.node_stack.push(node);
        self.content_stack.push(Vec::new());
    }

    fn pop(&mut self) {
        let content = self.content_stack.pop().expect("pop on empty stack");
        let node = self.node_stack.pop().expect("pop on empty stack");
        let assembled = self.assemble_block(node, content);
        if let Some(value) = assembled {
            if let Some(parent) = self.content_stack.last_mut() {
                parent.push(value);
            } else {
                self.blocks.push(value);
            }
        }
    }

    fn assemble_block(&mut self, block_type: BlockType, content: Vec<Value>) -> Option<Value> {
        match block_type {
            // ── Block-level nodes ────────────────────────────────────────
            BlockType::Paragraph => {
                if content.is_empty() {
                    return None;
                }
                Some(json!({
                    "id": new_id(),
                    "type": "paragraph",
                    "props": {
                        "backgroundColor": "default",
                        "textColor": "default",
                        "textAlignment": "left"
                    },
                    "content": content,
                    "children": []
                }))
            }
            BlockType::Heading { level } => {
                if content.is_empty() {
                    return None;
                }
                Some(json!({
                    "id": new_id(),
                    "type": "heading",
                    "props": {
                        "backgroundColor": "default",
                        "textColor": "default",
                        "textAlignment": "left",
                        "level": level,
                        "isToggleable": false
                    },
                    "content": content,
                    "children": []
                }))
            }
            BlockType::CodeBlock { language } => {
                let text = std::mem::take(&mut self.code_block_text);
                let lang = if language.is_empty() {
                    String::new()
                } else {
                    language
                };
                if text.trim().is_empty() {
                    return None;
                }
                Some(json!({
                    "id": new_id(),
                    "type": "codeBlock",
                    "props": {
                        "language": lang
                    },
                    "content": [{
                        "type": "text",
                        "text": text,
                        "styles": {}
                    }],
                    "children": []
                }))
            }
            BlockType::List { .. } => {
                // 列表项已经在 ListItem 的 assemble 中产出 block，
                // 并累积到 List 的 content 中。
                // 这里将它们直接 re-parent 到父级（或 root），
                // 不创建任何包裹容器。
                if !content.is_empty() {
                    if let Some(parent) = self.content_stack.last_mut() {
                        parent.extend(content);
                    } else {
                        self.blocks.extend(content);
                    }
                }
                None
            }
            BlockType::ListItem { ordered } => {
                if content.is_empty() {
                    return None;
                }
                let (item_type, props) = if self.current_item_is_check {
                    self.current_item_is_check = false;
                    (
                        "checkListItem",
                        json!({
                            "backgroundColor": "default",
                            "textColor": "default",
                            "textAlignment": "left",
                            "checked": self.current_item_checked
                        }),
                    )
                } else if ordered {
                    (
                        "numberedListItem",
                        json!({
                            "backgroundColor": "default",
                            "textColor": "default",
                            "textAlignment": "left"
                        }),
                    )
                } else {
                    (
                        "bulletListItem",
                        json!({
                            "backgroundColor": "default",
                            "textColor": "default",
                            "textAlignment": "left"
                        }),
                    )
                };
                Some(json!({
                    "id": new_id(),
                    "type": item_type,
                    "props": props,
                    "content": content,
                    "children": []
                }))
            }
            BlockType::Quote => {
                if content.is_empty() {
                    return None;
                }
                Some(json!({
                    "id": new_id(),
                    "type": "quote",
                    "props": {
                        "backgroundColor": "default",
                        "textColor": "default"
                    },
                    "content": content,
                    "children": []
                }))
            }
            BlockType::Table => {
                if content.is_empty() {
                    return None;
                }
                Some(json!({
                    "id": new_id(),
                    "type": "table",
                    "props": {
                        "backgroundColor": "default"
                    },
                    "content": content,
                    "children": []
                }))
            }
            BlockType::TableRow => {
                if content.is_empty() {
                    return None;
                }
                Some(json!({
                    "id": new_id(),
                    "type": "tableRow",
                    "props": {
                        "backgroundColor": "default"
                    },
                    "content": content,
                    "children": []
                }))
            }
            BlockType::TableCell => {
                if content.is_empty() {
                    return None;
                }
                Some(json!({
                    "id": new_id(),
                    "type": "tableCell",
                    "props": {
                        "backgroundColor": "default",
                        "textColor": "default",
                        "textAlignment": "left"
                    },
                    "content": content,
                    "children": []
                }))
            }
            // ── Inline formatting containers (flatten into parent) ────────
            BlockType::Emphasis => {
                let styled: Vec<Value> = content
                    .into_iter()
                    .flat_map(|v| apply_style(v, "italic", true))
                    .collect();
                if let Some(parent) = self.content_stack.last_mut() {
                    parent.extend(styled);
                }
                None
            }
            BlockType::Strong => {
                let styled: Vec<Value> = content
                    .into_iter()
                    .flat_map(|v| apply_style(v, "bold", true))
                    .collect();
                if let Some(parent) = self.content_stack.last_mut() {
                    parent.extend(styled);
                }
                None
            }
            BlockType::Strikethrough => {
                let styled: Vec<Value> = content
                    .into_iter()
                    .flat_map(|v| apply_style(v, "strike", true))
                    .collect();
                if let Some(parent) = self.content_stack.last_mut() {
                    parent.extend(styled);
                }
                None
            }
            BlockType::Link { href, title: _ } => {
                // 创建 link inline node，包装其内容
                let link_node = json!({
                    "type": "link",
                    "href": href,
                    "content": content
                });
                if let Some(parent) = self.content_stack.last_mut() {
                    parent.push(link_node);
                }
                None
            }
            BlockType::Image => {
                // 图片 block 已在 on_start 中创建，这里只是清理 alt 容器
                None
            }
        }
    }

    // ── 事件处理 ──────────────────────────────────────────────────────

    fn process_events(&mut self, events: &[Event]) {
        for event in events {
            match event {
                Event::Start(tag) => self.on_start(tag),
                Event::End(tag_end) => self.on_end(tag_end),
                Event::Text(text) => self.on_text(text, false),
                Event::Code(text) => {
                    // 行内代码：作为 text node 带 code style
                    if !text.is_empty() {
                        let node = json!({
                            "type": "text",
                            "text": text.as_ref(),
                            "styles": { "code": true }
                        });
                        self.current_content().push(node);
                    }
                }
                Event::Html(text) | Event::InlineHtml(text) => {
                    self.on_text(text, false);
                }
                Event::SoftBreak => {
                    self.on_text("\n", true);
                }
                Event::HardBreak => {
                    self.on_text("\n", true);
                }
                Event::Rule => {
                    let block = json!({
                        "id": new_id(),
                        "type": "divider",
                        "props": {},
                        "children": []
                    });
                    if let Some(parent) = self.content_stack.last_mut() {
                        parent.push(block);
                    } else {
                        self.blocks.push(block);
                    }
                }
                Event::TaskListMarker(checked) => {
                    self.current_item_is_check = true;
                    self.current_item_checked = *checked;
                }
                Event::InlineMath(text) | Event::DisplayMath(text) => {
                    // 数学公式按纯文本处理
                    self.on_text(text, false);
                }
                Event::FootnoteReference(_) => {}
            }
        }
    }

    fn on_start(&mut self, tag: &Tag) {
        match tag {
            Tag::Paragraph => self.push(BlockType::Paragraph),
            Tag::Heading { level, .. } => {
                let lvl = match level {
                    HeadingLevel::H1 => 1,
                    HeadingLevel::H2 => 2,
                    HeadingLevel::H3 => 3,
                    HeadingLevel::H4 => 4,
                    HeadingLevel::H5 => 5,
                    HeadingLevel::H6 => 6,
                };
                self.push(BlockType::Heading { level: lvl });
            }
            Tag::CodeBlock(kind) => {
                let language = match kind {
                    CodeBlockKind::Fenced(info) => info
                        .split([' ', ',', '\t'])
                        .next()
                        .unwrap_or("")
                        .to_string(),
                    CodeBlockKind::Indented => String::new(),
                };
                self.in_code_block = true;
                self.code_block_text.clear();
                self.push(BlockType::CodeBlock { language });
            }
            Tag::List(start) => {
                let ordered = start.is_some();
                self.push(BlockType::List { ordered });
            }
            Tag::Item => {
                self.current_item_is_check = false;
                // 查找最近一个 List 节点确定 ordered 状态
                let ordered = self
                    .node_stack
                    .iter()
                    .rev()
                    .find_map(|n| {
                        if let BlockType::List { ordered } = n {
                            Some(*ordered)
                        } else {
                            None
                        }
                    })
                    .unwrap_or(false);
                self.push(BlockType::ListItem { ordered });
            }
            Tag::BlockQuote(_) => self.push(BlockType::Quote),
            Tag::Table(_) => self.push(BlockType::Table),
            Tag::TableHead => self.push(BlockType::TableRow),
            Tag::TableRow => self.push(BlockType::TableRow),
            Tag::TableCell => self.push(BlockType::TableCell),
            Tag::Emphasis => self.push(BlockType::Emphasis),
            Tag::Strong => self.push(BlockType::Strong),
            Tag::Strikethrough => self.push(BlockType::Strikethrough),
            Tag::Link {
                dest_url, title, ..
            } => {
                self.push(BlockType::Link {
                    href: dest_url.to_string(),
                    title: title.to_string(),
                });
            }
            Tag::Image {
                dest_url, title, ..
            } => {
                let url = dest_url.to_string();
                let caption = title.to_string();
                // 创建 image block 并立即推入当前 content
                self.current_content().push(json!({
                    "id": new_id(),
                    "type": "image",
                    "props": {
                        "url": url,
                        "caption": caption,
                        "backgroundColor": "default",
                        "textColor": "default",
                        "textAlignment": "left"
                    },
                    "children": []
                }));
                // 推入 Image 容器以收集 alt 文本（不会产出 block）
                self.push(BlockType::Image);
            }
            _ => {
                // 未知标签回退为 paragraph
                self.push(BlockType::Paragraph);
            }
        }
    }

    fn on_end(&mut self, tag_end: &TagEnd) {
        if matches!(tag_end, TagEnd::CodeBlock) {
            self.in_code_block = false;
        }
        self.pop();
    }

    fn on_text(&mut self, text: &str, _is_break: bool) {
        if text.is_empty() {
            return;
        }

        // 代码块文本直接累积
        if self.in_code_block {
            self.code_block_text.push_str(text);
            return;
        }

        // 收集当前内联栈中的 styles
        let mut styles = serde_json::Map::new();

        for node in self.node_stack.iter() {
            match node {
                BlockType::Emphasis => {
                    styles.insert("italic".to_string(), json!(true));
                }
                BlockType::Strong => {
                    styles.insert("bold".to_string(), json!(true));
                }
                BlockType::Strikethrough => {
                    styles.insert("strike".to_string(), json!(true));
                }
                _ => {}
            }
        }

        // 尝试与上一个 text node 合并（相同 styles 且都在同一 link 层级）
        let should_merge = if let Some(last) = self.current_content().last() {
            if last.get("type") == Some(&json!("text")) {
                let last_styles = last.get("styles").cloned().unwrap_or(json!({}));
                styles_eq(&last_styles, &json!(styles))
            } else {
                false
            }
        } else {
            false
        };

        if should_merge {
            if let Some(last) = self.current_content().last_mut() {
                let existing = last
                    .get("text")
                    .and_then(|t| t.as_str())
                    .unwrap_or("");
                let new_text = format!("{}{}", existing, text);
                last["text"] = json!(new_text);
                return;
            }
        }

        // 创建新的 text node
        let node = json!({
            "type": "text",
            "text": text,
            "styles": styles
        });
        self.current_content().push(node);
    }
}

// ============================================================================
// 辅助函数
// ============================================================================

fn new_id() -> String {
    Uuid::new_v4().to_string()
}

/// 对 value 应用样式（递归处理 link node 内的 text nodes）
fn apply_style(value: Value, style_name: &str, style_value: bool) -> Vec<Value> {
    let value_type = value.get("type").and_then(|v| v.as_str());

    match value_type {
        Some("text") => {
            let mut node = value;
            if let Some(styles) = node.get_mut("styles").and_then(|s| s.as_object_mut()) {
                styles.insert(style_name.to_string(), json!(style_value));
            } else {
                node["styles"] = json!({ style_name: style_value });
            }
            vec![node]
        }
        Some("link") => {
            // 递归处理 link 内部的 content
            let mut node = value;
            if let Some(content) = node.get_mut("content").and_then(|c| c.as_array_mut()) {
                let new_content: Vec<Value> = content
                    .drain(..)
                    .flat_map(|v| apply_style(v, style_name, style_value))
                    .collect();
                *content = new_content;
            }
            vec![node]
        }
        _ => {
            vec![value]
        }
    }
}

/// 比较两个 styles JSON 对象是否相同
fn styles_eq(a: &Value, b: &Value) -> bool {
    let a_obj = a.as_object();
    let b_obj = b.as_object();
    match (a_obj, b_obj) {
        (Some(a_map), Some(b_map)) => {
            if a_map.len() != b_map.len() {
                return false;
            }
            a_map.iter().all(|(k, v)| b_map.get(k) == Some(v))
        }
        _ => a == b,
    }
}

// ============================================================================
// Tests
// ============================================================================

#[cfg(test)]
mod tests {
    use super::*;

    fn parse(mdx: &str) -> Value {
        mdx_to_blocknote_json(mdx)
    }

    fn first_block(json: &Value) -> &Value {
        let arr = json.as_array().expect("should be array");
        assert!(!arr.is_empty(), "blocks should not be empty");
        &arr[0]
    }

    // ── 基本转换 ──────────────────────────────────────────────────────

    #[test]
    fn test_empty_input() {
        let r = parse("");
        assert_eq!(r.as_array().unwrap().len(), 0);
    }

    #[test]
    fn test_whitespace_only() {
        let r = parse("   \n  \n  ");
        assert_eq!(r.as_array().unwrap().len(), 0);
    }

    // ── Paragraph ─────────────────────────────────────────────────────

    #[test]
    fn test_paragraph() {
        let r = parse("Hello, world!");
        let block = first_block(&r);
        assert_eq!(block["type"], "paragraph");
        assert!(block["id"].as_str().unwrap().len() > 0);
        assert_eq!(block["props"]["textAlignment"], "left");
        assert_eq!(block["content"][0]["text"], "Hello, world!");
        assert!(block["children"].as_array().unwrap().is_empty());
    }

    #[test]
    fn test_paragraphs_separated() {
        let r = parse("First para.\n\nSecond para.");
        let arr = r.as_array().unwrap();
        assert_eq!(arr.len(), 2);
        assert_eq!(arr[0]["type"], "paragraph");
        assert_eq!(arr[1]["type"], "paragraph");
    }

    // ── Heading ───────────────────────────────────────────────────────

    #[test]
    fn test_heading_h1() {
        let r = parse("# Hello");
        let block = first_block(&r);
        assert_eq!(block["type"], "heading");
        assert_eq!(block["props"]["level"], 1);
        assert!(!block["props"]["isToggleable"].as_bool().unwrap());
        assert_eq!(block["content"][0]["text"], "Hello");
    }

    #[test]
    fn test_heading_h3() {
        let r = parse("### Section 3");
        let block = first_block(&r);
        assert_eq!(block["type"], "heading");
        assert_eq!(block["props"]["level"], 3);
    }

    #[test]
    fn test_heading_h6() {
        let r = parse("###### Small");
        let block = first_block(&r);
        assert_eq!(block["props"]["level"], 6);
    }

    // ── Code Block ────────────────────────────────────────────────────

    #[test]
    fn test_fenced_code_block() {
        let r = parse("```rust\nfn main() {\n    println!(\"hi\");\n}\n```");
        let block = first_block(&r);
        assert_eq!(block["type"], "codeBlock");
        assert_eq!(block["props"]["language"], "rust");
        let text = block["content"][0]["text"].as_str().unwrap();
        assert!(text.contains("fn main()"));
        assert!(text.contains("println!"));
    }

    #[test]
    fn test_code_block_no_lang() {
        let r = parse("```\njust code\n```");
        let block = first_block(&r);
        assert_eq!(block["props"]["language"], "");
    }

    // ── Inline styles ─────────────────────────────────────────────────

    #[test]
    fn test_bold() {
        let r = parse("This is **bold** text.");
        let content = first_block(&r)["content"].as_array().unwrap();
        let bold_node = content
            .iter()
            .find(|n| n["styles"]["bold"] == true)
            .expect("should contain bold text");
        assert_eq!(bold_node["text"], "bold");
    }

    #[test]
    fn test_italic() {
        let r = parse("This is *italic* text.");
        let content = first_block(&r)["content"].as_array().unwrap();
        let italic = content
            .iter()
            .find(|n| n["styles"]["italic"] == true)
            .expect("should contain italic text");
        assert_eq!(italic["text"], "italic");
    }

    #[test]
    fn test_strikethrough() {
        let r = parse("This is ~~deleted~~ text.");
        let content = first_block(&r)["content"].as_array().unwrap();
        let strike = content
            .iter()
            .find(|n| n["styles"]["strike"] == true)
            .expect("should contain strikethrough");
        assert_eq!(strike["text"], "deleted");
    }

    #[test]
    fn test_inline_code() {
        let r = parse("Use `code` here.");
        let content = first_block(&r)["content"].as_array().unwrap();
        let code = content
            .iter()
            .find(|n| n["styles"]["code"] == true)
            .expect("should contain inline code");
        assert_eq!(code["text"], "code");
    }

    #[test]
    fn test_bold_italic_nested() {
        let r = parse("***bold and italic***");
        let content = first_block(&r)["content"].as_array().unwrap();
        let node = content
            .iter()
            .find(|n| n["styles"]["bold"] == true && n["styles"]["italic"] == true)
            .expect("should have both bold and italic");
        assert_eq!(node["text"], "bold and italic");
    }

    // ── Link (inline node) ────────────────────────────────────────────

    #[test]
    fn test_link() {
        let r = parse("[Click here](https://example.com)");
        let content = first_block(&r)["content"].as_array().unwrap();
        let link = content
            .iter()
            .find(|n| n["type"] == "link")
            .expect("should contain link node");
        assert_eq!(link["href"], "https://example.com");
        assert_eq!(link["content"][0]["text"], "Click here");
    }

    #[test]
    fn test_bold_link() {
        let r = parse("**[bold link](https://example.com)**");
        let content = first_block(&r)["content"].as_array().unwrap();
        // 外层 bold 应用到 link 内的 text node
        let link = content
            .iter()
            .find(|n| n["type"] == "link")
            .expect("should contain link");
        let inner_text = &link["content"][0];
        assert_eq!(inner_text["text"], "bold link");
        assert_eq!(inner_text["styles"]["bold"], true);
    }

    // ── Divider ───────────────────────────────────────────────────────

    #[test]
    fn test_divider() {
        let r = parse("Text\n\n---\n\nMore text");
        let arr = r.as_array().unwrap();
        let divider = arr
            .iter()
            .find(|b| b["type"] == "divider")
            .expect("should contain divider");
        assert!(divider.get("content").is_none(), "divider should not have content");
        assert_eq!(divider["props"], json!({}));
        assert!(divider["children"].as_array().unwrap().is_empty());
    }

    // ── Quote ─────────────────────────────────────────────────────────

    #[test]
    fn test_quote() {
        let r = parse("> This is a quote");
        let block = first_block(&r);
        assert_eq!(block["type"], "quote");
        // quote 的 props 不应有 textAlignment
        assert!(block["props"].get("textAlignment").is_none());
        assert_eq!(block["props"]["backgroundColor"], "default");
        assert_eq!(block["content"][0]["text"], "This is a quote");
    }

    // ── Bullet list ───────────────────────────────────────────────────

    #[test]
    fn test_bullet_list() {
        let r = parse("- Item A\n- Item B\n- Item C");
        let arr = r.as_array().unwrap();
        assert_eq!(arr.len(), 3, "should have 3 direct bullet items");
        for item in arr.iter() {
            assert_eq!(item["type"], "bulletListItem");
            assert!(item["id"].as_str().unwrap().len() > 0);
            assert!(item["children"].as_array().unwrap().is_empty());
        }
    }

    #[test]
    fn test_bullet_list_empty_items_skipped() {
        let r = parse("- \n- Not empty");
        let arr = r.as_array().unwrap();
        // 空列表项应该被跳过
        assert_eq!(arr.len(), 1);
        assert_eq!(arr[0]["type"], "bulletListItem");
    }

    // ── Ordered list ──────────────────────────────────────────────────

    #[test]
    fn test_ordered_list() {
        let r = parse("1. First\n2. Second\n3. Third");
        let arr = r.as_array().unwrap();
        assert_eq!(arr.len(), 3);
        for item in arr.iter() {
            assert_eq!(item["type"], "numberedListItem");
        }
        assert_eq!(arr[0]["content"][0]["text"], "First");
        assert_eq!(arr[1]["content"][0]["text"], "Second");
        assert_eq!(arr[2]["content"][0]["text"], "Third");
    }

    // ── Check list ────────────────────────────────────────────────────

    #[test]
    fn test_check_list() {
        let r = parse("- [x] Done item\n- [ ] Todo item\n- Regular item");
        let arr = r.as_array().unwrap();
        assert_eq!(arr.len(), 3);

        // 第一项：checkListItem checked=true
        assert_eq!(arr[0]["type"], "checkListItem");
        assert_eq!(arr[0]["props"]["checked"], true);
        assert_eq!(arr[0]["content"][0]["text"], "Done item");

        // 第二项：checkListItem checked=false
        assert_eq!(arr[1]["type"], "checkListItem");
        assert_eq!(arr[1]["props"]["checked"], false);
        assert_eq!(arr[1]["content"][0]["text"], "Todo item");

        // 第三项：普通 bulletListItem
        assert_eq!(arr[2]["type"], "bulletListItem");
        assert_eq!(arr[2]["content"][0]["text"], "Regular item");
    }

    // ── Image ─────────────────────────────────────────────────────────

    #[test]
    fn test_image() {
        let r = parse("![alt text](https://example.com/img.png)");
        let block = first_block(&r);
        // Image 被创建在 paragraph 内部
        // 实际上在 on_start 中直接推入，可能在 paragraph 外
        let arr = r.as_array().unwrap();
        let img = arr
            .iter()
            .find(|b| b["type"] == "image")
            .expect("should contain image block");
        assert_eq!(img["props"]["url"], "https://example.com/img.png");
        assert_eq!(img["props"]["caption"], "");
    }

    // ── Table ─────────────────────────────────────────────────────────

    #[test]
    fn test_table() {
        let r = parse("| H1 | H2 |\n| --- | --- |\n| C1 | C2 |");
        let arr = r.as_array().unwrap();
        let table = arr
            .iter()
            .find(|b| b["type"] == "table")
            .expect("should contain table");
        assert_eq!(table["props"]["backgroundColor"], "default");
        let rows = table["content"].as_array().unwrap();
        assert!(!rows.is_empty(), "table should have rows");
        // 每个 row 应该有 cells
        for row in rows.iter() {
            assert_eq!(row["type"], "tableRow");
            let cells = row["content"].as_array().unwrap();
            assert!(!cells.is_empty());
            for cell in cells.iter() {
                assert_eq!(cell["type"], "tableCell");
            }
        }
    }

    // ── Unicode ───────────────────────────────────────────────────────

    #[test]
    fn test_unicode_chinese() {
        let r = parse("# 你好世界\n\n这是中文内容。");
        let arr = r.as_array().unwrap();
        assert_eq!(arr[0]["type"], "heading");
        assert_eq!(arr[0]["content"][0]["text"], "你好世界");
        assert_eq!(arr[1]["type"], "paragraph");
        assert_eq!(arr[1]["content"][0]["text"], "这是中文内容。");
    }

    // ── Edge cases ────────────────────────────────────────────────────

    #[test]
    fn test_all_blocks_have_id() {
        let r = parse("# A\n\nPara\n\n- Item\n\n> Quote\n\n---\n\n```\ncode\n```");
        let arr = r.as_array().unwrap();
        for block in arr.iter() {
            let id = block["id"].as_str().expect("every block must have id");
            assert!(!id.is_empty());
        }
    }

    #[test]
    fn test_all_blocks_have_children() {
        let r = parse("# A\n\nPara\n\n- Item\n\n---\n\n```\ncode\n```");
        let arr = r.as_array().unwrap();
        for block in arr.iter() {
            assert!(
                block.get("children").is_some(),
                "block {:?} should have children field",
                block["type"]
            );
        }
    }

    #[test]
    fn test_mixed_content() {
        let r = parse("Normal, **bold**, *italic*, ~~strike~~, and `code` inline.");
        let content = first_block(&r)["content"].as_array().unwrap();
        let has_bold = content.iter().any(|n| n["styles"]["bold"] == true);
        let has_italic = content.iter().any(|n| n["styles"]["italic"] == true);
        let has_strike = content.iter().any(|n| n["styles"]["strike"] == true);
        let has_code = content.iter().any(|n| n["styles"]["code"] == true);
        assert!(has_bold);
        assert!(has_italic);
        assert!(has_strike);
        assert!(has_code);
    }

    #[test]
    fn test_every_block_has_valid_id() {
        let r = parse("# Title\n\nParagraph\n\n- Item\n\n1. First\n\n- [x] Done\n\n```\ncode\n```\n\n---\n\n> Quote");
        let arr = r.as_array().unwrap();
        for block in arr.iter() {
            let id_str = block["id"].as_str().expect("id must be string");
            // UUID v4 格式检查：xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
            assert!(
                Uuid::parse_str(id_str).is_ok(),
                "id '{}' is not a valid UUID",
                id_str
            );
        }
    }
}

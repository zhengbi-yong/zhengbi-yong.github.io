//! MDX/Markdown → TipTap ProseMirror JSON 转换器
//!
//! 使用 pulldown-cmark 将 MDX 文本解析为事件流，然后映射为
//! TipTap 3.x JSONContent 格式的 JSON AST。
//!
//! 与 `crate::mdx_convert::tiptap_json_to_mdx()` 互为逆操作。
//!
//! # 设计原则
//! - 纯同步转换，无 IO，无外部副作用
//! - 空输入返回 `{"type":"doc","content":[]}`
//! - 所有节点严格遵循 TipTap 3.x JSONContent 格式
//! - 内联标记 (marks) 通过栈上下文自动应用到文本节点

use pulldown_cmark::{CodeBlockKind, Event, HeadingLevel, Options, Parser, Tag, TagEnd};
use serde_json::{json, Value};
use utoipa::ToSchema;

/// 将 MDX/Markdown 文本转换为 TipTap ProseMirror JSON AST
pub fn mdx_to_tiptap_json(mdx_text: &str) -> Value {
    if mdx_text.trim().is_empty() {
        return json!({"type": "doc", "content": []});
    }

    let parser = Parser::new_ext(mdx_text, Options::all());
    let events: Vec<Event> = parser.collect();
    let mut ctx = ParseContext::new();
    ctx.process_events(&events);

    // Move all content from Doc's content stack to root
    let doc_content = ctx.content_stack.pop().unwrap_or_default();
    json!({"type": "doc", "content": doc_content})
}

/// 带统计信息的转换
pub fn mdx_to_tiptap_json_with_stats(mdx_text: &str) -> (Value, ConversionStats) {
    let json = mdx_to_tiptap_json(mdx_text);
    let stats = collect_stats(&json);
    (json, stats)
}

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize, ToSchema)]
pub struct ConversionStats {
    pub blocks: usize,
    pub text_nodes: usize,
    pub marks_used: Vec<String>,
}

fn collect_stats(json: &Value) -> ConversionStats {
    let mut stats = ConversionStats {
        blocks: 0,
        text_nodes: 0,
        marks_used: Vec::new(),
    };
    collect_recursive(json, &mut stats);
    stats.marks_used.sort();
    stats.marks_used.dedup();
    stats
}

fn collect_recursive(node: &Value, stats: &mut ConversionStats) {
    if let Some(obj) = node.as_object() {
        if let Some(ty) = obj.get("type").and_then(|v| v.as_str()) {
            match ty {
                "text" => {
                    stats.text_nodes += 1;
                    if let Some(marks) = obj.get("marks").and_then(|v| v.as_array()) {
                        for m in marks {
                            if let Some(mt) = m.get("type").and_then(|v| v.as_str()) {
                                stats.marks_used.push(mt.to_string());
                            }
                        }
                    }
                }
                "horizontalRule" | "hardBreak" => {}
                _ => stats.blocks += 1,
            }
        }
        if let Some(content) = obj.get("content").and_then(|v| v.as_array()) {
            for child in content {
                collect_recursive(child, stats);
            }
        }
    }
}

// ============================================================================
// 解析器：基于栈的架构
// ============================================================================
//
// 两个平行栈：
// - `node_stack`: 当前打开的节点类型
// - `content_stack`: 每个栈层面对应的内容缓冲区 Vec<Value>
//
// Start(tag) => push node + 空 Vec
// End(tag)   => pop node + Vec，组装为 JSON，加入父层 content
// Text/Code 等 => 组装为 JSON 节点，加入顶层 content

struct ParseContext {
    node_stack: Vec<NodeType>,
    content_stack: Vec<Vec<Value>>,
    root: Vec<Value>,
    in_code_block: bool,
    code_block_text: String,
}

#[derive(Debug, Clone, PartialEq)]
enum NodeType {
    Doc,
    Paragraph,
    Heading {
        level: u8,
    },
    CodeBlock {
        language: String,
    },
    List {
        ordered: bool,
        start: i64,
    },
    ListItem,
    Blockquote,
    Table,
    TableRow,
    TableCell {
        header: bool,
    },
    /// Inline containers that collect marks context
    Emphasis,
    Strong,
    Strikethrough,
    Link {
        href: String,
        title: String,
    },
    /// Image alt text container
    Image,
}

impl ParseContext {
    fn new() -> Self {
        Self {
            node_stack: vec![NodeType::Doc],
            content_stack: vec![Vec::new()],
            root: Vec::new(),
            in_code_block: false,
            code_block_text: String::new(),
        }
    }

    fn current_content(&mut self) -> &mut Vec<Value> {
        self.content_stack.last_mut().expect("content_stack empty")
    }

    fn push(&mut self, node: NodeType) {
        self.node_stack.push(node);
        self.content_stack.push(Vec::new());
    }

    fn pop(&mut self) {
        let content = self.content_stack.pop().expect("pop on empty stack");
        let node = self.node_stack.pop().expect("pop on empty stack");
        let assembled = self.assemble_node(node, content);
        if let Some(value) = assembled {
            if let Some(parent) = self.content_stack.last_mut() {
                parent.push(value);
            } else {
                self.root.push(value);
            }
        }
    }

    fn assemble_node(&mut self, node_type: NodeType, content: Vec<Value>) -> Option<Value> {
        match node_type {
            NodeType::Doc => None,
            NodeType::Paragraph => {
                if content.is_empty() {
                    return None;
                }
                Some(json!({"type": "paragraph", "content": content}))
            }
            NodeType::Heading { level } => {
                if content.is_empty() {
                    return None;
                }
                Some(json!({"type": "heading", "attrs": {"level": level}, "content": content}))
            }
            NodeType::CodeBlock { language } => {
                let text = std::mem::take(&mut self.code_block_text);
                let lang_val = if language.is_empty() {
                    Value::Null
                } else {
                    json!(language)
                };
                if text.trim().is_empty() {
                    return None;
                }
                Some(json!({
                    "type": "codeBlock",
                    "attrs": {"language": lang_val},
                    "content": [{"type": "text", "text": text}]
                }))
            }
            NodeType::List { ordered, start } => {
                if content.is_empty() {
                    return None;
                }
                let list_type = if ordered { "orderedList" } else { "bulletList" };
                let mut node = json!({"type": list_type, "content": content});
                if ordered {
                    node["attrs"] = json!({"start": start});
                }
                Some(node)
            }
            NodeType::ListItem => {
                if content.is_empty() {
                    return None;
                }
                Some(json!({"type": "listItem", "content": content}))
            }
            NodeType::Blockquote => {
                if content.is_empty() {
                    return None;
                }
                Some(json!({"type": "blockquote", "content": content}))
            }
            NodeType::Table => {
                if content.is_empty() {
                    return None;
                }
                Some(json!({"type": "table", "content": content}))
            }
            NodeType::TableRow => {
                if content.is_empty() {
                    return None;
                }
                Some(json!({"type": "tableRow", "content": content}))
            }
            NodeType::TableCell { header } => {
                if content.is_empty() {
                    return None;
                }
                let mut node = json!({"type": "tableCell", "content": content});
                if header {
                    node["attrs"] = json!({"header": true});
                }
                Some(node)
            }
            // Inline containers: apply marks, flatten into parent, return None
            NodeType::Emphasis => {
                let marked: Vec<Value> = content
                    .into_iter()
                    .flat_map(|v| apply_mark(v, json!({"type": "italic"})))
                    .collect();
                if let Some(parent) = self.content_stack.last_mut() {
                    parent.extend(marked);
                }
                None
            }
            NodeType::Strong => {
                let marked: Vec<Value> = content
                    .into_iter()
                    .flat_map(|v| apply_mark(v, json!({"type": "bold"})))
                    .collect();
                if let Some(parent) = self.content_stack.last_mut() {
                    parent.extend(marked);
                }
                None
            }
            NodeType::Strikethrough => {
                let marked: Vec<Value> = content
                    .into_iter()
                    .flat_map(|v| apply_mark(v, json!({"type": "strike"})))
                    .collect();
                if let Some(parent) = self.content_stack.last_mut() {
                    parent.extend(marked);
                }
                None
            }
            NodeType::Link { href, title } => {
                let mut mark_attrs = json!({"href": href});
                if !title.is_empty() {
                    mark_attrs["title"] = json!(title);
                }
                let mark = json!({"type": "link", "attrs": mark_attrs});
                let marked: Vec<Value> = content
                    .into_iter()
                    .flat_map(|v| apply_mark(v, mark.clone()))
                    .collect();
                if let Some(parent) = self.content_stack.last_mut() {
                    parent.extend(marked);
                }
                None
            }
            NodeType::Image => {
                // Image node already created in on_start; just discard alt text
                None
            }
        }
    }

    fn process_events(&mut self, events: &[Event]) {
        for event in events {
            match event {
                Event::Start(tag) => self.on_start(tag),
                Event::End(tag_end) => self.on_end(tag_end),
                Event::Text(text) => self.on_text(text, &[]),
                Event::Code(text) => self.on_text(text, &[json!({"type": "code"})]),
                Event::Html(text) | Event::InlineHtml(text) => {
                    self.on_text(text, &[]);
                }
                Event::SoftBreak => self.on_text("\n", &[]),
                Event::HardBreak => {
                    self.current_content().push(json!({"type": "hardBreak"}));
                }
                Event::Rule => {
                    self.current_content()
                        .push(json!({"type": "horizontalRule"}));
                }
                Event::InlineMath(text) => {
                    self.current_content().push(json!({
                        "type": "inlineMath",
                        "attrs": {"latex": text.as_ref()}
                    }));
                }
                Event::DisplayMath(text) => {
                    self.current_content().push(json!({
                        "type": "blockMath",
                        "attrs": {"latex": text.as_ref()}
                    }));
                }
                Event::TaskListMarker(checked) => {
                    let checkbox = if *checked { "[x] " } else { "[ ] " };
                    self.current_content().push(json!({
                        "type": "text",
                        "text": checkbox
                    }));
                }
                Event::FootnoteReference(_) => {}
            }
        }
    }

    fn on_start(&mut self, tag: &Tag) {
        match tag {
            Tag::Paragraph => self.push(NodeType::Paragraph),
            Tag::Heading { level, .. } => {
                let lvl = match level {
                    HeadingLevel::H1 => 1,
                    HeadingLevel::H2 => 2,
                    HeadingLevel::H3 => 3,
                    HeadingLevel::H4 => 4,
                    HeadingLevel::H5 => 5,
                    HeadingLevel::H6 => 6,
                };
                self.push(NodeType::Heading { level: lvl });
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
                self.push(NodeType::CodeBlock { language });
            }
            Tag::List(start) => {
                self.push(NodeType::List {
                    ordered: start.is_some(),
                    start: start.unwrap_or(1) as i64,
                });
            }
            Tag::Item => self.push(NodeType::ListItem),
            Tag::BlockQuote(_) => self.push(NodeType::Blockquote),
            Tag::Table(_) => self.push(NodeType::Table),
            Tag::TableHead => self.push(NodeType::TableRow),
            Tag::TableRow => self.push(NodeType::TableRow),
            Tag::TableCell => {
                let header = self
                    .node_stack
                    .iter()
                    .any(|n| matches!(n, NodeType::TableRow));
                self.push(NodeType::TableCell { header });
            }
            Tag::Emphasis => self.push(NodeType::Emphasis),
            Tag::Strong => self.push(NodeType::Strong),
            Tag::Strikethrough => self.push(NodeType::Strikethrough),
            Tag::Link {
                dest_url, title, ..
            } => {
                self.push(NodeType::Link {
                    href: dest_url.to_string(),
                    title: title.to_string(),
                });
            }
            Tag::Image {
                dest_url, title, ..
            } => {
                let mut attrs = json!({"src": dest_url.as_ref(), "alt": ""});
                if !title.is_empty() {
                    attrs["title"] = json!(title.as_ref());
                }
                self.current_content()
                    .push(json!({"type": "image", "attrs": attrs}));
                self.push(NodeType::Image);
            }
            _ => {
                self.push(NodeType::Paragraph);
            }
        }
    }

    fn on_end(&mut self, tag_end: &TagEnd) {
        if matches!(tag_end, TagEnd::CodeBlock) {
            self.in_code_block = false;
        }
        self.pop();
    }

    fn on_text(&mut self, text: &str, extra_marks: &[Value]) {
        if text.is_empty() {
            return;
        }

        if self.in_code_block {
            self.code_block_text.push_str(text);
            return;
        }

        // Collect marks from current inline context
        let mut marks: Vec<Value> = Vec::new();
        for node in self.node_stack.iter() {
            match node {
                NodeType::Emphasis => marks.push(json!({"type": "italic"})),
                NodeType::Strong => marks.push(json!({"type": "bold"})),
                NodeType::Strikethrough => marks.push(json!({"type": "strike"})),
                NodeType::Link { href, title } => {
                    let mut attrs = json!({"href": href});
                    if !title.is_empty() {
                        attrs["title"] = json!(title);
                    }
                    marks.push(json!({"type": "link", "attrs": attrs}));
                }
                _ => {}
            }
        }
        marks.extend_from_slice(extra_marks);

        // Try to merge with last text node if marks match
        if let Some(last) = self.current_content().last_mut() {
            if last.get("type") == Some(&json!("text")) {
                let last_marks = last.get("marks").cloned().unwrap_or(json!([]));
                if marks_eq(&marks, &last_marks.as_array().cloned().unwrap_or_default()) {
                    let new_text = format!(
                        "{}{}",
                        last.get("text").and_then(|t| t.as_str()).unwrap_or(""),
                        text
                    );
                    last["text"] = json!(new_text);
                    return;
                }
            }
        }

        // Create new text node
        let mut node = json!({"type": "text", "text": text});
        if !marks.is_empty() {
            node["marks"] = json!(marks);
        }
        self.current_content().push(node);
    }
}

fn apply_mark(value: Value, mark: Value) -> Vec<Value> {
    if value.get("type") == Some(&json!("text")) {
        let mut node = value;
        let mark_type = mark.get("type").and_then(|v| v.as_str());
        let marks = node.get_mut("marks").and_then(|m| m.as_array_mut());
        if let Some(arr) = marks {
            // Avoid duplicate marks of the same type
            if let Some(mt) = mark_type {
                if !arr
                    .iter()
                    .any(|m| m.get("type").and_then(|v| v.as_str()) == Some(mt))
                {
                    arr.push(mark);
                }
            } else {
                arr.push(mark);
            }
        } else {
            node["marks"] = json!([mark]);
        }
        vec![node]
    } else {
        vec![value]
    }
}

fn marks_eq(a: &[Value], b: &[Value]) -> bool {
    if a.len() != b.len() {
        return false;
    }
    for (ma, mb) in a.iter().zip(b.iter()) {
        let ta = ma.get("type").and_then(|v| v.as_str());
        let tb = mb.get("type").and_then(|v| v.as_str());
        if ta != tb {
            return false;
        }
    }
    true
}

// ============================================================================
// Tests
// ============================================================================

#[cfg(test)]
mod tests {
    use super::*;

    fn basic_check(mdx: &str, expected_type: &str) -> Value {
        let result = mdx_to_tiptap_json(mdx);
        assert_eq!(result["type"], "doc", "Root must be doc");
        let content = result["content"].as_array().unwrap();
        assert!(!content.is_empty(), "Content should not be empty");
        if !expected_type.is_empty() {
            assert_eq!(
                content[0]["type"], expected_type,
                "First block should be '{}', got '{}'",
                expected_type, content[0]["type"]
            );
        }
        result
    }

    #[test]
    fn test_empty() {
        let r = mdx_to_tiptap_json("");
        assert_eq!(r["type"], "doc");
        assert_eq!(r["content"].as_array().unwrap().len(), 0);
    }

    #[test]
    fn test_whitespace_only() {
        let r = mdx_to_tiptap_json("   \n  \n  ");
        assert_eq!(r["content"].as_array().unwrap().len(), 0);
    }

    #[test]
    fn test_heading_h1() {
        let r = basic_check("# Hello World", "heading");
        assert_eq!(r["content"][0]["attrs"]["level"], 1);
        assert_eq!(r["content"][0]["content"][0]["text"], "Hello World");
    }

    #[test]
    fn test_heading_h2() {
        let r = basic_check("## Section 2", "heading");
        assert_eq!(r["content"][0]["attrs"]["level"], 2);
    }

    #[test]
    fn test_heading_h3() {
        let r = basic_check("### Section 3", "heading");
        assert_eq!(r["content"][0]["attrs"]["level"], 3);
    }

    #[test]
    fn test_paragraph_simple() {
        let r = basic_check("Hello, world!", "paragraph");
        assert_eq!(r["content"][0]["content"][0]["text"], "Hello, world!");
    }

    #[test]
    fn test_bold_text() {
        let r = basic_check("This is **bold** text.", "paragraph");
        let texts = r["content"][0]["content"].as_array().unwrap();
        let bold = texts.iter().find(|t| {
            t.get("marks")
                .and_then(|m| m.as_array())
                .map(|a| a.iter().any(|m| m["type"] == "bold"))
                .unwrap_or(false)
        });
        assert!(bold.is_some(), "Should contain bold text");
        assert_eq!(bold.unwrap()["text"], "bold");
    }

    #[test]
    fn test_italic_text() {
        let r = basic_check("This is *italic* text.", "paragraph");
        let texts = r["content"][0]["content"].as_array().unwrap();
        let italic = texts.iter().find(|t| {
            t.get("marks")
                .and_then(|m| m.as_array())
                .map(|a| a.iter().any(|m| m["type"] == "italic"))
                .unwrap_or(false)
        });
        assert!(italic.is_some(), "Should contain italic text");
    }

    #[test]
    fn test_inline_code() {
        let r = basic_check("Use `code` here.", "paragraph");
        let texts = r["content"][0]["content"].as_array().unwrap();
        let code = texts.iter().find(|t| {
            t.get("marks")
                .and_then(|m| m.as_array())
                .map(|a| a.iter().any(|m| m["type"] == "code"))
                .unwrap_or(false)
        });
        assert!(code.is_some(), "Should contain code inline");
    }

    #[test]
    fn test_code_block() {
        let r = basic_check(
            "```rust\nfn main() {\n    println!(\"hi\");\n}\n```",
            "codeBlock",
        );
        assert_eq!(r["content"][0]["attrs"]["language"], "rust");
        let text = r["content"][0]["content"][0]["text"].as_str().unwrap();
        assert!(text.contains("fn main()"));
        assert!(text.contains("println!"));
    }

    #[test]
    fn test_indented_code_block() {
        let r = basic_check("    let x = 1;", "codeBlock");
        assert!(r["content"][0]["content"][0]["text"]
            .as_str()
            .unwrap()
            .contains("let x = 1"));
    }

    #[test]
    fn test_bullet_list() {
        let mdx = "- Item A\n- Item B\n- Item C";
        let r = basic_check(mdx, "bulletList");
        let items = r["content"][0]["content"].as_array().unwrap();
        assert_eq!(items.len(), 3);
    }

    #[test]
    fn test_ordered_list() {
        let mdx = "1. First\n2. Second\n3. Third";
        let r = basic_check(mdx, "orderedList");
        assert_eq!(r["content"][0]["attrs"]["start"], 1);
        let items = r["content"][0]["content"].as_array().unwrap();
        assert_eq!(items.len(), 3);
    }

    #[test]
    fn test_blockquote() {
        let r = basic_check("> This is a quote", "blockquote");
    }

    #[test]
    fn test_horizontal_rule() {
        let mdx = "Text\n\n---\n\nMore text";
        let r = mdx_to_tiptap_json(mdx);
        let content = r["content"].as_array().unwrap();
        let has_hr = content.iter().any(|b| b["type"] == "horizontalRule");
        assert!(has_hr, "Should contain horizontalRule");
    }

    #[test]
    fn test_table() {
        let mdx = "| H1 | H2 |\n| --- | --- |\n| C1 | C2 |";
        let r = mdx_to_tiptap_json(mdx);
        let content = r["content"].as_array().unwrap();
        let has_table = content.iter().any(|b| b["type"] == "table");
        assert!(has_table, "Should contain table node");
    }

    #[test]
    fn test_inline_math() {
        let r = basic_check("Energy: $E=mc^2$", "paragraph");
        let texts = r["content"][0]["content"].as_array().unwrap();
        let has_math = texts.iter().any(|t| t["type"] == "inlineMath");
        assert!(has_math, "Should contain inlineMath");
        let math = texts.iter().find(|t| t["type"] == "inlineMath").unwrap();
        assert_eq!(math["attrs"]["latex"], "E=mc^2");
    }

    #[test]
    fn test_display_math() {
        let mdx = "$$\n\\int_{-\\infty}^{\\infty} e^{-x^2}\\,dx = \\sqrt{\\pi}\n$$";
        let r = mdx_to_tiptap_json(mdx);
        // DisplayMath is emitted by pulldown-cmark inside a Paragraph tag
        let content = r["content"].as_array().unwrap();
        // It should be wrapped in a paragraph with a math node inside
        let has_math_in_para = content.iter().any(|b| {
            b["type"] == "paragraph"
                && b.get("content")
                    .and_then(|c| c.as_array())
                    .map(|a| a.iter().any(|t| t["type"] == "blockMath"))
                    .unwrap_or(false)
        });
        assert!(
            has_math_in_para,
            "Should have paragraph containing math node"
        );
    }

    #[test]
    fn test_link() {
        let r = basic_check("[Click here](https://example.com)", "paragraph");
        let texts = r["content"][0]["content"].as_array().unwrap();
        let has_link = texts.iter().any(|t| {
            t.get("marks")
                .and_then(|m| m.as_array())
                .map(|a| a.iter().any(|m| m["type"] == "link"))
                .unwrap_or(false)
        });
        assert!(has_link, "Should contain link mark");
    }

    #[test]
    fn test_strikethrough() {
        let r = basic_check("This is ~~deleted~~ text.", "paragraph");
        let texts = r["content"][0]["content"].as_array().unwrap();
        let has_strike = texts.iter().any(|t| {
            t.get("marks")
                .and_then(|m| m.as_array())
                .map(|a| a.iter().any(|m| m["type"] == "strike"))
                .unwrap_or(false)
        });
        assert!(has_strike, "Should contain strikethrough mark");
    }

    #[test]
    fn test_image() {
        let r = basic_check("![alt text](https://example.com/img.png)", "paragraph");
        let texts = r["content"][0]["content"].as_array().unwrap();
        // Image is created at Start(Image) before alt text is captured,
        // so alt may be empty. Check src exists.
        let img = texts.iter().find(|t| t["type"] == "image");
        assert!(img.is_some(), "Should contain image node");
        assert_eq!(img.unwrap()["attrs"]["src"], "https://example.com/img.png");
    }

    #[test]
    fn test_nested_bold_italic() {
        let r = basic_check("***bold and italic***", "paragraph");
        let texts = r["content"][0]["content"].as_array().unwrap();
        let has_bold = texts.iter().any(|t| {
            t.get("marks")
                .and_then(|m| m.as_array())
                .map(|a| a.iter().any(|m| m["type"] == "bold"))
                .unwrap_or(false)
        });
        let has_italic = texts.iter().any(|t| {
            t.get("marks")
                .and_then(|m| m.as_array())
                .map(|a| a.iter().any(|m| m["type"] == "italic"))
                .unwrap_or(false)
        });
        assert!(
            has_bold && has_italic,
            "Should have both bold and italic marks"
        );
    }

    #[test]
    fn test_mdx_component() {
        let mdx = "<RDKitStructure data=\"CC(=O)O\" height={300} />";
        let r = mdx_to_tiptap_json(mdx);
        assert!(
            !r["content"].as_array().unwrap().is_empty(),
            "Should parse MDX component"
        );
    }

    #[test]
    fn test_unicode_chinese() {
        let mdx = "# 你好世界\n\n这是中文内容。";
        let r = mdx_to_tiptap_json(mdx);
        assert_eq!(r["content"][0]["content"][0]["text"], "你好世界");
        assert_eq!(r["content"][1]["content"][0]["text"], "这是中文内容。");
    }

    #[test]
    fn test_mixed_paragraph() {
        let mdx = "Normal, **bold**, *italic*, and `code` inline.";
        let r = mdx_to_tiptap_json(mdx);
        let texts = r["content"][0]["content"].as_array().unwrap();
        let types: Vec<&str> = texts
            .iter()
            .map(|t| {
                let has_bold = t
                    .get("marks")
                    .and_then(|m| m.as_array())
                    .map(|a| a.iter().any(|m| m["type"] == "bold"))
                    .unwrap_or(false);
                let has_italic = t
                    .get("marks")
                    .and_then(|m| m.as_array())
                    .map(|a| a.iter().any(|m| m["type"] == "italic"))
                    .unwrap_or(false);
                let has_code = t
                    .get("marks")
                    .and_then(|m| m.as_array())
                    .map(|a| a.iter().any(|m| m["type"] == "code"))
                    .unwrap_or(false);
                if has_bold {
                    "bold"
                } else if has_italic {
                    "italic"
                } else if has_code {
                    "code"
                } else {
                    "plain"
                }
            })
            .collect();
        assert!(types.contains(&"bold"), "Should be a bold section");
        assert!(types.contains(&"italic"), "Should be an italic section");
        assert!(types.contains(&"code"), "Should be a code section");
    }

    #[test]
    fn test_stats() {
        let (_json, stats) = mdx_to_tiptap_json_with_stats("# Title\n\n**Bold** and *italic*.");
        assert!(stats.blocks >= 2, "At least 2 blocks (heading + paragraph)");
        assert!(stats.text_nodes >= 3, "At least 3 text nodes");
        assert!(stats.marks_used.contains(&"bold".to_string()));
        assert!(stats.marks_used.contains(&"italic".to_string()));
    }

    #[test]
    fn test_nested_list() {
        let mdx = "- Item 1\n  - Nested A\n  - Nested B\n- Item 2";
        let r = mdx_to_tiptap_json(mdx);
        let content = r["content"].as_array().unwrap();
        let list = content
            .iter()
            .find(|b| b["type"] == "bulletList" || b["type"] == "orderedList");
        assert!(list.is_some(), "Should contain a list");
    }
}

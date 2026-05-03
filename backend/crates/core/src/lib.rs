//! Blog core crate
//!
//! This crate contains the business logic and domain models.

pub mod auth;
pub mod email;
pub mod mdx_convert;
pub mod mdx_to_json;
pub mod mdx_to_blocknote_json;
pub mod blocknote_json_to_mdx;

// 重新导出常用类型
pub use auth::{Claims, JwtService, RefreshClaims, TokenType};
pub use mdx_convert::tiptap_json_to_mdx;
pub use mdx_to_json::{mdx_to_tiptap_json, mdx_to_tiptap_json_with_stats, ConversionStats};
pub use mdx_to_blocknote_json::{mdx_to_blocknote_json, mdx_to_blocknote_json_with_stats, BlockNoteConversionStats};
pub use blocknote_json_to_mdx::blocknote_json_to_mdx;

/// 统一的 content_json → MDX 转换函数
///
/// 自动检测输入格式：
/// - `[{type: "paragraph", ...}]`（BlockNote 数组）→ `blocknote_json_to_mdx()`
/// - `{type: "doc", content: [...]}`（TipTap 旧格式）→ `tiptap_json_to_mdx()`
///
/// # 为什么需要这个函数
///
/// 数据库中 content_json 有两种格式共存：
/// 1. BlockNote 格式（新）：直接数组 `[{...}]`
/// 2. TipTap/ProseMirror 格式（旧）：包裹对象 `{type:"doc", content:[...]}`
///
/// 错误地使用 `tiptap_json_to_mdx()` 处理 BlockNote 数组会导致排版完全丢失：
/// 标题变纯文本、代码块丢失 language、表格变空等。
///
/// 此函数消除了所有调用方需要自行判断格式的负担。
pub fn content_json_to_mdx(json: &serde_json::Value) -> String {
    match json {
        serde_json::Value::Array(_) => {
            blocknote_json_to_mdx(json)
        }
        serde_json::Value::Object(obj) if obj.contains_key("content") => {
            tiptap_json_to_mdx(json)
        }
        _ => {
            String::new()
        }
    }
}

/// 断言 content_json 是 BlockNote 数组格式（非 TipTap 对象格式）。
///
/// 如果传入 TipTap 旧格式 `{type:"doc", content:[...]}` 则直接 panic。
/// 应在所有写入 content_json 到数据库之前调用，作为格式守卫。
///
/// # Panics
/// 当 json 是 Object 格式（TipTap）时 panic。
pub fn assert_blocknote_format(json: &serde_json::Value) {
    assert!(
        json.is_array(),
        "content_json MUST be BlockNote array format [{{...}}], got object/other. \
         Use mdx_to_blocknote_json() instead of mdx_to_tiptap_json() to generate content_json."
    );
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;

    // =========================================================================
    // content_json_to_mdx 格式自动检测
    // =========================================================================

    #[test]
    fn content_json_to_mdx_blocknote_format() {
        // BlockNote 数组格式
        let input = json!([{
            "id": "1",
            "type": "heading",
            "props": { "level": 2 },
            "content": [{ "type": "text", "text": "Hello", "styles": {} }],
            "children": []
        }]);
        let result = content_json_to_mdx(&input);
        assert_eq!(result, "## Hello");
    }

    #[test]
    fn content_json_to_mdx_blocknote_code_block() {
        let input = json!([{
            "id": "1",
            "type": "codeBlock",
            "props": { "language": "rust" },
            "content": [
                { "type": "text", "text": "fn main() {}", "styles": {} }
            ],
            "children": []
        }]);
        let result = content_json_to_mdx(&input);
        assert!(result.contains("```rust"), "Code block must have language fence");
        assert!(result.contains("fn main() {}"), "Code content must be preserved");
    }

    #[test]
    fn content_json_to_mdx_tiptap_legacy_format() {
        // TipTap 旧格式（向后兼容）
        let input = json!({
            "type": "doc",
            "content": [{
                "type": "heading",
                "attrs": { "level": 1 },
                "content": [{ "type": "text", "text": "Legacy Title" }]
            }]
        });
        let result = content_json_to_mdx(&input);
        assert_eq!(result, "# Legacy Title");
    }

    #[test]
    fn content_json_to_mdx_null_returns_empty() {
        assert_eq!(content_json_to_mdx(&serde_json::Value::Null), "");
        assert_eq!(content_json_to_mdx(&json!({})), "");
        assert_eq!(content_json_to_mdx(&json!([])), "");
    }

    // =========================================================================
    // assert_blocknote_format 守卫
    // =========================================================================

    #[test]
    fn assert_blocknote_format_accepts_array() {
        assert_blocknote_format(&json!([{"type": "paragraph"}]));
    }

    #[test]
    #[should_panic(expected = "MUST be BlockNote array format")]
    fn assert_blocknote_format_rejects_tiptap_object() {
        assert_blocknote_format(&json!({"type": "doc", "content": []}));
    }

    #[test]
    #[should_panic(expected = "MUST be BlockNote array format")]
    fn assert_blocknote_format_rejects_null() {
        assert_blocknote_format(&serde_json::Value::Null);
    }

    // =========================================================================
    // 防护测试：证明 tiptap_json_to_mdx 处理 BlockNote 会出错
    // =========================================================================

    #[test]
    fn tiptap_on_blocknote_loses_heading() {
        // 这是一个 "反例测试"——证明旧函数处理 BlockNote 数据会丢失格式
        let blocknote = json!([{
            "id": "1",
            "type": "heading",
            "props": { "level": 2 },
            "content": [{ "type": "text", "text": "Section", "styles": {} }],
            "children": []
        }]);
        // content_json_to_mdx 正确处理
        assert_eq!(content_json_to_mdx(&blocknote), "## Section");
        // tiptap_json_to_mdx 处理 BlockNote 数组时只提取纯文本，丢失 ## 标记
        let tiptap_result = tiptap_json_to_mdx(&blocknote);
        assert!(!tiptap_result.starts_with("##"), 
            "tiptap_json_to_mdx on BlockNote data SHOULD lose heading markers. \
             This test exists to prevent anyone from reverting to tiptap_json_to_mdx.");
    }

    #[test]
    fn tiptap_on_blocknote_breaks_code_block() {
        let blocknote = json!([{
            "id": "1",
            "type": "codeBlock",
            "props": { "language": "python" },
            "content": [{ "type": "text", "text": "print(1)", "styles": {} }],
            "children": []
        }]);
        let correct = content_json_to_mdx(&blocknote);
        assert!(correct.contains("```python"), "content_json_to_mdx must preserve language");
        
        let broken = tiptap_json_to_mdx(&blocknote);
        assert!(!broken.contains("```python"),
            "tiptap_json_to_mdx on BlockNote data SHOULD lose code fence. \
             This test proves tiptap_json_to_mdx is broken for BlockNote format.");
    }

    // =========================================================================
    // mdx_to_blocknote_json 产出格式保证
    // =========================================================================

    #[test]
    fn mdx_to_blocknote_json_always_produces_array() {
        let result = mdx_to_blocknote_json("# Title\n\nParagraph text\n\n- Item 1\n- Item 2");
        assert!(result.is_array(), "mdx_to_blocknote_json MUST produce array format");
        let arr = result.as_array().unwrap();
        assert!(arr.len() >= 3, "Should have at least 3 blocks: heading, paragraph, list");
        
        // 验证每个 block 都有 BlockNote 特征
        for block in arr {
            assert!(block.is_object(), "Each block must be an object");
            let obj = block.as_object().unwrap();
            assert!(obj.contains_key("type"), "Block must have 'type' field");
            assert!(obj.contains_key("id"), "Block must have 'id' field");
            assert!(obj.contains_key("props"), "Block must have 'props' field");
            assert!(obj.contains_key("content"), "Block must have 'content' field");
            assert!(obj.contains_key("children"), "Block must have 'children' field");
            
            // 验证没有 TipTap 特征（attrs/marks）
            assert!(!obj.contains_key("attrs"), 
                "BlockNote blocks must NOT have 'attrs' field (TipTap legacy). Found in: {:?}", obj.get("type"));
        }
    }

    #[test]
    fn mdx_to_blocknote_json_with_stats_format() {
        let (result, stats) = mdx_to_blocknote_json_with_stats("**bold** and *italic* text");
        assert!(result.is_array(), "with_stats must also produce array");
        assert!(stats.blocks > 0, "Should count at least one block");
    }

    // =========================================================================
    // 空输入边界测试
    // =========================================================================

    #[test]
    fn mdx_to_blocknote_empty_input() {
        let result = mdx_to_blocknote_json("");
        assert!(result.is_array());
        assert!(result.as_array().unwrap().is_empty());
        
        let result = mdx_to_blocknote_json("   \n  ");
        assert!(result.is_array());
        assert!(result.as_array().unwrap().is_empty());
    }
}

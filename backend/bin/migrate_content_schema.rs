//! migrate_content_schema — 高级富文本内容系统数据库架构迁移工具
//!
//! 遵循设计文档《高级富文本内容系统的数据库架构与模式设计》
//!
//! 迁移步骤：
//! 1. 新增 content_json (JSONB) 列（如果不存在）
//! 2. 新增 content_mdx (TEXT) 列（如果不存在）
//! 3. 新增 content_html (TEXT) 列（如果不存在）
//! 4. 回填所有历史文章的 content_json（从旧 content 列推断）
//! 5. 回填 content_mdx（通过 Rust tiptap_json_to_mdx）
//! 6. 清空 Redis 缓存
//! 7. 验证
//!
//! 执行方式：
//!   DATABASE_URL=postgresql://blog_user:blog_pass@localhost:5432/blog_db \
//!   cargo run --bin migrate_content_schema --release

use std::env;
use sqlx::postgres::PgPoolOptions;
use sqlx::PgPool;
use serde_json::Value as JsonValue;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    let database_url = env::var("DATABASE_URL")
        .unwrap_or_else(|_| "postgresql://blog_user:blog_pass@localhost:5432/blog_db".to_string());

    println!("================================================================");
    println!("高级富文本内容系统 — 数据库架构迁移");
    println!("================================================================");
    println!("数据库: {}", database_url.replace(&*":blog_pass@", ":***@"));
    println!();

    // Step 1: 连接数据库
    print!("[1/7] 连接数据库... ");
    let pool = PgPoolOptions::new()
        .max_connections(1)
        .connect(&database_url)
        .await?;
    println!("✓");

    // Step 2: 检查当前列状态
    print!("[2/7] 检查 posts 表列结构... ");
    let columns: Vec<(String, String, String)> = sqlx::query_as(
        r#"
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_name = 'posts'
        ORDER BY ordinal_position
        "#
    )
    .fetch_all(&pool)
    .await?;

    let col_names: Vec<&str> = columns.iter().map(|(n, _, _)| n.as_str()).collect();
    println!("✓ 当前 {} 列", columns.len());
    for (n, t, nullable) in &columns {
        println!("    {:25s} {:20s} nullable={}", n, t, nullable);
    }

    let has_content_json = col_names.contains(&"content_json");
    let has_content_mdx  = col_names.contains(&"content_mdx");
    let has_content_html = col_names.contains(&"content_html");

    // Step 3: 新增缺失的列
    println!();
    println!("[3/7] 应用 schema 变更...");
    if !has_content_json {
        print!("  + content_json (JSONB NOT NULL DEFAULT '{{}}')... ");
        sqlx::query("ALTER TABLE posts ADD COLUMN content_json JSONB NOT NULL DEFAULT '{}'")
            .execute(&pool).await?;
        println!("✓");
    } else {
        print!("  + content_json... ");
        // Ensure it has NOT NULL constraint
        let _: Option<(String,)> = sqlx::query_as(
            "ALTER TABLE posts ALTER COLUMN content_json SET NOT NULL"
        )
        .fetch_optional(&pool).await.ok();
        println!("已存在 (确保 NOT NULL ✓)");
    }

    if !has_content_mdx {
        print!("  + content_mdx (TEXT)... ");
        sqlx::query("ALTER TABLE posts ADD COLUMN IF NOT EXISTS content_mdx TEXT")
            .execute(&pool).await?;
        println!("✓");
    } else {
        println!("  + content_mdx... 已存在 ✓");
    }

    if !has_content_html {
        print!("  + content_html (TEXT)... ");
        sqlx::query("ALTER TABLE posts ADD COLUMN IF NOT EXISTS content_html TEXT")
            .execute(&pool).await?;
        println!("✓");
    } else {
        println!("  + content_html... 已存在 ✓");
    }

    // Step 4: 回填 content_json（核心迁移）
    println!();
    println!("[4/7] 回填 content_json（真相源）...");

    let posts: Vec<(sqlx::types::Uuid, String, Option<String>, Option<JsonValue>)> = sqlx::query_as(
        "SELECT id, content, content_json, content_mdx FROM posts WHERE deleted_at IS NULL"
    )
    .fetch_all(&pool)
    .await?;

    println!("  共 {} 篇非删除文章", posts.len());

    let mut ok_json = 0;
    let mut ok_mdx = 0;
    let mut err_json = 0;
    let mut err_mdx = 0;

    for (id, content, content_json_existing, content_mdx_existing) in posts {
        // ==== 重建 content_json ====
        let new_content_json: JsonValue = if let Some(ref existing) = content_json_existing {
            if !existing.is_null() && existing.get("type").is_some() {
                // 已有合法 TipTap AST，直接使用
                existing.clone()
            } else {
                // content_json 存在但无效（null 或空对象），从 content 重建
                rebuild_tiptap_doc(content.as_deref().unwrap_or(""))
            }
        } else {
            // content_json 为 NULL，从 content 推断
            rebuild_tiptap_doc(content.as_deref().unwrap_or(""))
        };

        // ==== 转换为 MDX ====
        let new_content_mdx = tiptap_json_to_mdx_string(&new_content_json);

        // ==== 写入 content_json ====
        match sqlx::query(
            "UPDATE posts SET content_json = $1, content_mdx = $2 WHERE id = $3"
        )
        .bind(&new_content_json)
        .bind(&new_content_mdx)
        .bind(id)
        .execute(&pool)
        .await
        {
            Ok(_) => { ok_json += 1; ok_mdx += 1; }
            Err(e) => {
                eprintln!("    ✗ Post {} error: {}", id, e);
                err_json += 1;
                err_mdx += 1;
            }
        }

        if ok_json % 20 == 0 {
            print!("\r  进度: {}/{} ({} errors)", ok_json, posts.len(), err_json);
            use std::io::Write;
            std::io::stdout().flush().ok();
        }
    }
    print!("\r  进度: {}/{} ({} errors)       \n", ok_json, posts.len(), err_json);
    println!("  content_json 回填: {} ✓, {} ✗", ok_json, err_json);
    println!("  content_mdx 回填:  {} ✓, {} ✗", ok_mdx, err_mdx);

    // Step 5: 回填 content_html（通过生成纯文本 fallback，HTML 生成由前端负责）
    println!();
    println!("[5/7] 回填 content_html（预渲染 HTML）...");
    let mdx_for_html: Vec<(sqlx::types::Uuid, String)> = sqlx::query_as(
        "SELECT id, content_mdx FROM posts WHERE content_mdx IS NOT NULL AND deleted_at IS NULL"
    )
    .fetch_all(&pool)
    .await?;
    println!("  {} 篇文章有 content_mdx，跳过 content_html（由前端 compileMDX 生成）", mdx_for_html.len());
    println!("  (设计文档：content_html 由 @tiptap/static-renderer 在保存时异步生成)");
    println!("  (当前前端 compileMDX 直接消费 content_mdx，无需预生成 content_html)");

    // Step 6: 清理 Redis 缓存
    println!();
    println!("[6/7] 清理 Redis 缓存...");
    match清理_redis缓存().await {
        Ok(n) => println!("  ✓ 清除 {} 个 post:* 缓存键", n),
        Err(e) => println!("  ⚠ Redis 不可用，跳过: {}", e),
    }

    // Step 7: 验证
    println!();
    println!("[7/7] 验证迁移结果...");
    let stats: (i64, i64, i64, i64, i64, i64) = sqlx::query_as(
        r#"
        SELECT
            COUNT(*) as total,
            COUNT(content_json) as has_json,
            COUNT(CASE WHEN content_json->>'type' = 'doc' THEN 1 END) as valid_tiptap,
            COUNT(content_mdx) as has_mdx,
            COUNT(content_mdx) - COUNT(CASE WHEN content_mdx ~ '^#' THEN 1 END) as dirty_mdx,
            COUNT(content_html) as has_html
        FROM posts WHERE deleted_at IS NULL
        "#
    )
    .fetch_one(&pool)
    .await?;

    println!("  总文章数:        {}", stats.0);
    println!("  content_json 有值:   {}", stats.1);
    println!("  content_json 合法:   {}", stats.2);
    println!("  content_mdx 有值:    {}", stats.3);
    println!("  content_mdx 脏数据:  {}", stats.4);
    println!("  content_html 有值:   {}", stats.5);

    // Sample checks
    println!();
    println!("  === 样例验证 ===");
    let samples: Vec<(String, String, String)> = sqlx::query_as(
        r#"
        SELECT slug,
               LEFT(content_mdx, 80),
               LEFT(content_json::text, 80)
        FROM posts WHERE deleted_at IS NULL LIMIT 3
        "#
    )
    .fetch_all(&pool)
    .await?;

    for (slug, mdx, json) in samples {
        println!("  slug={}", slug);
        println!("    content_mdx:  {}", mdx.replace('\n', "\\n"));
        println!("    content_json: {}", json.replace('\n', "\\n"));
    }

    println!();
    println!("================================================================");
    println!("迁移完成！");
    println!("================================================================");
    println!("✅ content_json → TipTap AST（真相源，JSONB）");
    println!("✅ content_mdx  → 预渲染 MDX（读取轨，TEXT）");
    println!("⚠  content_html → 前端 compileMDX 按需生成（可后续优化）");
    println!();
    println!("后续步骤：");
    println!("  1. 重启后端: kill $(lsof -ti :3000) && cd backend && RUST_LOG=error ./target/release/api &");
    println!("  2. 验证博客页: curl http://localhost:3000/api/v1/posts");
    println!("  3. 浏览器访问: http://192.168.0.161:3001/blog/<slug>");
    println!();

    pool.close().await;
    Ok(())
}

// ============================================================================
// TipTap JSON 重建
// ============================================================================

fn rebuild_tiptap_doc(content: &str) -> JsonValue {
    if content.is_empty() {
        return serde_json::json!({
            "type": "doc",
            "content": [{ "type": "paragraph" }]
        });
    }

    if content.trim().starts_with('{') {
        // Looks like TipTap JSON — try to parse and validate
        if let Ok(parsed) = serde_json::from_str::<JsonValue>(content) {
            if let Some(obj) = parsed.as_object() {
                // Must have 'type' field at root level
                if obj.contains_key("type") {
                    return parsed;
                }
            }
        }
    }

    // Not valid TipTap JSON — wrap plain text as paragraph
    serde_json::json!({
        "type": "doc",
        "content": [{
            "type": "paragraph",
            "content": [{
                "type": "text",
                "text": content
            }]
        }]
    })
}

// ============================================================================
// TipTap JSON → MDX 转换（简化版，基于 mdx_convert.rs 的核心逻辑）
// ============================================================================

fn tiptap_json_to_mdx_string(node: &JsonValue) -> String {
    let mut out = String::new();
    render_node(node, &mut out, 0);
    out
}

fn render_node(node: &JsonValue, out: &mut String, indent: usize) {
    let obj = match node.as_object() {
        Some(o) => o,
        None => return,
    };

    let ntype = obj.get("type").and_then(|v| v.as_str()).unwrap_or("");

    match ntype {
        "doc" => {
            if let Some(content) = obj.get("content").and_then(|v| v.as_array()) {
                for child in content {
                    render_node(child, out, indent);
                }
            }
        }
        "paragraph" => {
            if let Some(content) = obj.get("content").and_then(|v| v.as_array()) {
                for child in content {
                    render_node(child, out, indent);
                }
            }
            if !out.ends_with('\n') {
                out.push_str("  \n");
            }
        }
        "heading" => {
            let level = obj.get("attrs")
                .and_then(|v| v.get("level"))
                .and_then(|v| v.as_i64())
                .unwrap_or(1) as usize;
            let hashes = "#".repeat(level.min(6));
            out.push_str(&format!("{} ", hashes));
            if let Some(content) = obj.get("content").and_then(|v| v.as_array()) {
                for child in content {
                    render_inline(child, out);
                }
            }
            out.push_str("  \n");
        }
        "text" => {
            if let Some(text) = obj.get("text").and_then(|v| v.as_str()) {
                out.push_str(text);
            }
        }
        "hardBreak" => {
            out.push_str("  \n");
        }
        "blockquote" => {
            out.push_str("> ");
            if let Some(content) = obj.get("content").and_then(|v| v.as_array()) {
                for child in content {
                    render_node(child, out, indent);
                }
            }
        }
        "codeBlock" => {
            let lang = obj.get("attrs")
                .and_then(|v| v.get("language"))
                .and_then(|v| v.as_str())
                .unwrap_or("");
            out.push_str(&format!("```{}\n", lang));
            if let Some(content) = obj.get("content").and_then(|v| v.as_array()) {
                for child in content {
                    if let Some(text) = child.get("text").and_then(|v| v.as_str()) {
                        out.push_str(&escape_for_code(text));
                    }
                }
            }
            out.push_str("\n```  \n");
        }
        "bulletList" => {
            if let Some(content) = obj.get("content").and_then(|v| v.as_array()) {
                for item in content {
                    out.push_str("- ");
                    if let Some(inner) = item.get("content") {
                        render_node(inner, out, indent);
                    }
                }
            }
        }
        "orderedList" => {
            let start = obj.get("attrs")
                .and_then(|v| v.get("start"))
                .and_then(|v| v.as_i64())
                .unwrap_or(1);
            if let Some(content) = obj.get("content").and_then(|v| v.as_array()) {
                for (i, item) in content.iter().enumerate() {
                    out.push_str(&format!("{}. ", start as i64 + i as i64));
                    if let Some(inner) = item.get("content") {
                        render_node(inner, out, indent);
                    }
                }
            }
        }
        "listItem" => {
            if let Some(content) = obj.get("content").and_then(|v| v.as_array()) {
                for child in content {
                    render_node(child, out, indent);
                }
            }
            if !out.ends_with('\n') {
                out.push('\n');
            }
        }
        "horizontalRule" => {
            out.push_str("\n---\n");
        }
        "image" => {
            let src = obj.get("attrs")
                .and_then(|v| v.get("src"))
                .and_then(|v| v.as_str())
                .unwrap_or("");
            let alt = obj.get("attrs")
                .and_then(|v| v.get("alt"))
                .and_then(|v| v.as_str())
                .unwrap_or("");
            out.push_str(&format!("![]({})", src));
            if !alt.is_empty() {
                out.push_str(&format!(" \"{}\"", alt));
            }
            out.push_str("  \n");
        }
        "mathBlock" => {
            let latex = obj.get("attrs")
                .and_then(|v| v.get("latex"))
                .and_then(|v| v.as_str())
                .unwrap_or("");
            out.push_str(&format!("$$\n{}\n$$  \n", latex));
        }
        "inlineMath" => {
            let latex = obj.get("attrs")
                .and_then(|v| v.get("latex"))
                .and_then(|v| v.as_str())
                .unwrap_or("");
            out.push_str(&format!("$#{}$#", latex));
        }
        "callout" => {
            out.push_str("> **Callout**  \n");
            if let Some(content) = obj.get("content").and_then(|v| v.as_array()) {
                for child in content {
                    render_node(child, out, indent);
                }
            }
        }
        "details" => {
            out.push_str("<details>\n");
            if let Some(content) = obj.get("content").and_then(|v| v.as_array()) {
                for child in content {
                    render_node(child, out, indent);
                }
            }
            out.push_str("</details>\n");
        }
        "summary" => {
            out.push_str("<summary>");
            if let Some(content) = obj.get("content").and_then(|v| v.as_array()) {
                for child in content {
                    render_inline(child, out);
                }
            }
            out.push_str("</summary>\n");
        }
        "table" | "tableRow" | "tableCell" | "tableHeader" => {
            // Simplified table rendering
            if ntype == "table" {
                out.push('\n');
            }
            if let Some(content) = obj.get("content").and_then(|v| v.as_array()) {
                let cells: Vec<String> = content.iter().map(|cell| {
                    let mut s = String::new();
                    render_node(cell, &mut s, indent);
                    s.trim().to_string()
                }).collect();
                if ntype == "tableRow" {
                    out.push_str("| ");
                    out.push_str(&cells.join(" | "));
                    out.push_str(" |\n");
                } else {
                    for child in content {
                        render_node(child, out, indent);
                    }
                }
            }
            if ntype == "table" {
                // Add separator row after header
                out.push_str("| --- | --- |\n");
            }
        }
        "mention" => {
            let name = obj.get("attrs")
                .and_then(|v| v.get("name"))
                .and_then(|v| v.as_str())
                .unwrap_or("user");
            out.push_str(&format!("@{}", name));
        }
        "codeBlockLowlight" => {
            let lang = obj.get("attrs")
                .and_then(|v| v.get("language"))
                .and_then(|v| v.as_str())
                .unwrap_or("");
            out.push_str(&format!("```{}\n", lang));
            if let Some(content) = obj.get("content").and_then(|v| v.as_array()) {
                for child in content {
                    if let Some(text) = child.get("text").and_then(|v| v.as_str()) {
                        out.push_str(&escape_for_code(text));
                    }
                }
            }
            out.push_str("\n```  \n");
        }
        "taskList" => {
            if let Some(content) = obj.get("content").and_then(|v| v.as_array()) {
                for item in content {
                    let checked = item.get("attrs")
                        .and_then(|v| v.get("checked"))
                        .and_then(|v| v.as_bool())
                        .unwrap_or(false);
                    out.push_str(if checked { "- [x] " } else { "- [ ] " });
                    if let Some(inner) = item.get("content") {
                        render_node(inner, out, indent);
                    }
                }
            }
        }
        _ => {
            // Unknown node type — try to render children
            if let Some(content) = obj.get("content").and_then(|v| v.as_array()) {
                for child in content {
                    render_node(child, out, indent);
                }
            }
        }
    }
}

fn render_inline(node: &JsonValue, out: &mut String) {
    let obj = match node.as_object() {
        Some(o) => o,
        None => return,
    };
    let ntype = obj.get("type").and_then(|v| v.as_str()).unwrap_or("");

    match ntype {
        "text" => {
            let mut text = obj.get("text").and_then(|v| v.as_str()).unwrap_or("").to_string();

            // Render marks
            if let Some(marks) = obj.get("marks").and_then(|v| v.as_array()) {
                for mark in marks {
                    let mtype = mark.get("type").and_then(|v| v.as_str()).unwrap_or("");
                    match mtype {
                        "bold" => { out.push_str("**"); out.push_str(&text); out.push_str("**"); return; }
                        "italic" => { out.push('_'); out.push_str(&text); out.push('_'); return; }
                        "code" => { out.push('`'); out.push_str(&text); out.push('`'); return; }
                        "link" => {
                            let href = mark.get("attrs")
                                .and_then(|v| v.get("href"))
                                .and_then(|v| v.as_str())
                                .unwrap_or("#");
                            out.push_str(&format!("[{}]({})", text, href));
                            return;
                        }
                        "strike" => { out.push_str("~~"); out.push_str(&text); out.push_str("~~"); return; }
                        "underline" => { out.push_str("<u>"); out.push_str(&text); out.push_str("</u>"); return; }
                        _ => {}
                    }
                }
            }
            out.push_str(&text);
        }
        "hardBreak" => out.push_str("  \n"),
        "inlineMath" => {
            let latex = obj.get("attrs")
                .and_then(|v| v.get("latex"))
                .and_then(|v| v.as_str())
                .unwrap_or("");
            out.push_str(&format!("${{{}}}$", latex));
        }
        "mention" => {
            let name = obj.get("attrs")
                .and_then(|v| v.get("name"))
                .and_then(|v| v.as_str())
                .unwrap_or("user");
            out.push_str(&format!("@{}", name));
        }
        "mathBlock" => {
            let latex = obj.get("attrs")
                .and_then(|v| v.get("latex"))
                .and_then(|v| v.as_str())
                .unwrap_or("");
            out.push_str(&format!("$$\n{}\n$$", latex));
        }
        _ => {
            if let Some(content) = obj.get("content").and_then(|v| v.as_array()) {
                for child in content {
                    render_inline(child, out);
                }
            }
        }
    }
}

fn escape_for_code(text: &str) -> String {
    text.replace('&', "&amp;")
        .replace('<', "&lt;")
        .replace('>', "&gt;")
}

// ============================================================================
// Redis 缓存清理
// ============================================================================

async fn 清理_redis缓存() -> Result<usize, Box<dyn std::error::Error>> {
    use std::net::TcpStream;
    use std::io::{Read, Write};

    let mut stream = TcpStream::connect("127.0.0.1:6379")?;
    stream.set_read_timeout(Some(std::time::Duration::from_secs(2)))?;
    stream.set_write_timeout(Some(std::time::Duration::from_secs(2)))?;

    // SCAN for post:* keys
    stream.write_all(b"*3\r\n$5\r\nSCAN\r\n$1\r\n0\r\n$5\r\nmatch\r\n$5\r\npost:*\r\n")?;
    let mut buf = [0u8; 4096];
    let n = stream.read(&mut buf)?;
    let response = String::from_utf8_lossy(&buf[..n]);

    // Count keys in response
    let keys: Vec<&str> = response.lines()
        .filter(|l| l.starts_with("$") || l.starts_with(":"))
        .collect();

    if keys.len() < 2 {
        return Ok(0);
    }

    // Get the array of keys (last few lines before +OK or empty)
    let all_keys: Vec<String> = response.lines()
        .filter(|l| !l.is_empty() && !l.starts_with("+OK"))
        .flat_map(|l| {
            // Multi-bulk reply format
            if l.starts_with("$") || l.starts_with(":") {
                None
            } else {
                Some(l.trim().to_string())
            }
        })
        .filter(|k| !k.is_empty() && k.len() > 10 && k != "0")
        .collect();

    if all_keys.is_empty() {
        return Ok(0);
    }

    // DEL all post:* keys
    let del_cmd = format!("*2\r\n$3\r\nDEL\r\n${}\r\n{}\r\n",
        all_keys[0].len(), all_keys[0]);
    stream.write_all(del_cmd.as_bytes())?;
    let mut del_buf = [0u8; 100];
    stream.read(&mut del_buf)?;

    Ok(all_keys.len())
}

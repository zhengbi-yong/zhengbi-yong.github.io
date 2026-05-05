//! Route convention tests — 自动化路由规范验证
//!
//! 从 main.rs 提取所有路由，根据 routing-specification.md 验证。
//! 违反任何 🔴 Must 规则 = panic。
//!
//! 用法: `cargo test -p blog-api -- route_convention_tests`

use std::fs;
use std::collections::HashMap;

// ─── 路由提取（支持多行）────────────────────────────────

fn extract_routes_from_source() -> Vec<(String, String)> {
    let source = fs::read_to_string("src/main.rs")
        .expect("Cannot read src/main.rs");
    let lines: Vec<&str> = source.lines().collect();
    let mut routes = Vec::new();
    let mut i = 0;
    
    while i < lines.len() {
        let trimmed = lines[i].trim();
        if trimmed.starts_with(".route(") {
            // 收集从此行到下一个独立 .route()/.merge()/.nest()/} 的所有文本
            let mut block = String::from(trimmed);
            let mut j = i + 1;
            while j < lines.len() {
                let next = lines[j].trim();
                if next.starts_with(".route(") || next.starts_with(".merge(") 
                    || next.starts_with(".nest(") || next == "}" || next == "})" {
                    break;
                }
                block.push(' ');
                block.push_str(next);
                j += 1;
            }
            
            // 从 block 中提取路径
            if let Some(path) = extract_path_from_block(&block) {
                let method = extract_method_from_block(&block);
                if method != "UNKNOWN" {
                    routes.push((method.to_string(), path.to_string()));
                }
            }
            i = j;
        } else {
            i += 1;
        }
    }
    
    routes
}

fn extract_path_from_block(block: &str) -> Option<String> {
    if let Some(start) = block.find('"') {
        let after = &block[start + 1..];
        if let Some(end) = after.find('"') {
            return Some(after[..end].to_string());
        }
    }
    None
}

fn extract_method_from_block(block: &str) -> &str {
    // 优先级: 检查括号前的关键词
    if block.contains("get(") { return "GET"; }
    if block.contains("post(") { return "POST"; }
    if block.contains("put(") { return "PUT"; }
    if block.contains("patch(") { return "PATCH"; }
    if block.contains("delete(") { return "DELETE"; }
    "UNKNOWN"
}

// ─── 规则检查 ─────────────────────────────────────────

fn is_kebab_case(segment: &str) -> bool {
    if segment.is_empty() { return true; }
    if (segment.starts_with('{') && segment.ends_with('}')) 
        || (segment.starts_with("[...") && segment.ends_with(']')) { return true; }
    // RFC standard paths whitelist
    if segment == ".well-known" { return true; }
    segment.chars().all(|c| c.is_ascii_lowercase() || c.is_ascii_digit() || c == '-')
}

fn contains_verb_in_path(path: &str) -> Option<String> {
    let forbidden = ["delete", "update", "create", "fetch", "remove", "add", "edit", "get", "set", "list"];
    let segs: Vec<&str> = path.split('/').collect();
    for (i, seg) in segs.iter().enumerate() {
        let clean = seg.trim_start_matches('{').trim_end_matches('}');
        // batch/* sub-resources are standard (e.g. batch/delete replaces :batchDelete)
        if i > 0 && segs[i - 1] == "batch" { continue; }
        if clean == "batch" { continue; }
        if forbidden.contains(&clean.to_lowercase().as_str()) {
            return Some(clean.to_string());
        }
    }
    None
}

fn check_id_naming(path: &str) -> Vec<String> {
    let mut v = Vec::new();
    for seg in path.split('/') {
        if seg.starts_with('{') && seg.ends_with('}') {
            let param = &seg[1..seg.len()-1];
            if param != "id" && param != "number" {
                v.push(format!("'{0}' → 应为 '{{id}}' (路径: {1})", param, path));
            }
        }
    }
    v
}

fn check_url_format(path: &str) -> Vec<String> {
    let mut v = Vec::new();
    if path != "/" && path.ends_with('/') {
        v.push(format!("尾部斜杠: {}", path));
    }
    if path.contains("//") {
        v.push(format!("连续斜杠: {}", path));
    }
    for seg in path.split('/') {
        if seg.is_empty() { continue; }
        if !is_kebab_case(seg) {
            v.push(format!("段 '{}' 非 kebab-case ({})", seg, path));
        }
    }
    if let Some(verb) = contains_verb_in_path(path) {
        v.push(format!("动词 '{}' ({}) → 应使用 HTTP 方法", verb, path));
    }
    v
}

/// 检查 `:` 批量语法 — 只检查 URL 路径中是否有 `:action` 模式
fn has_colon_batch_syntax(path: &str) -> bool {
    // 匹配 URL 中的 :action 模式: /users:batchUpdateRole
    for seg in path.split('/') {
        if seg.contains(':') && !seg.starts_with('{') && !seg.starts_with("[...") {
            return true;
        }
    }
    false
}

fn check_pagination_params() -> Vec<String> {
    let files = ["src/routes/posts.rs", "src/routes/admin.rs", "src/routes/comments.rs",
                 "src/routes/categories.rs", "src/routes/tags.rs", "src/main.rs"];
    let mut v = Vec::new();
    for f in &files {
        if let Ok(c) = fs::read_to_string(f) {
            if c.contains("page_size") {
                v.push(format!("{} 使用 'page_size'，应为 'per_page'", f));
            }
        }
    }
    v
}

// ─── 测试 ────────────────────────────────────────────

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn all_routes_must_use_kebab_case() {
        let routes = extract_routes_from_source();
        let mut violations = Vec::new();
        for (method, path) in &routes {
            violations.extend(check_url_format(path));
        }
        if !violations.is_empty() {
            panic!("\n❌ URL 格式违规 ({} 个):\n{}",
                violations.len(),
                violations.iter().map(|v| format!("  • {}", v)).collect::<Vec<_>>().join("\n"));
        }
    }

    #[test]
    fn no_verbs_in_urls() {
        let routes = extract_routes_from_source();
        let vv: Vec<_> = routes.iter()
            .filter_map(|(_, p)| contains_verb_in_path(p).map(|v| (p, v)))
            .collect();
        if !vv.is_empty() {
            panic!("\n❌ URL 动词违规:\n{}",
                vv.iter().map(|(p,v)| format!("  • {} (含 '{}')", p, v)).collect::<Vec<_>>().join("\n"));
        }
    }

    #[test]
    fn consistent_id_naming() {
        let routes = extract_routes_from_source();
        let mut v = Vec::new();
        for (_, p) in &routes { v.extend(check_id_naming(p)); }
        if !v.is_empty() {
            panic!("\n❌ ID 命名不规范:\n{}",
                v.iter().map(|x| format!("  • {}", x)).collect::<Vec<_>>().join("\n"));
        }
    }

    #[test]
    fn no_duplicate_routes() {
        let routes = extract_routes_from_source();
        let mut seen: HashMap<String, usize> = HashMap::new();
        for (m, p) in &routes {
            *seen.entry(format!("{} {}", m, p)).or_default() += 1;
        }
        let dups: Vec<_> = seen.iter().filter(|(_, &c)| c > 1).collect();
        if !dups.is_empty() {
            panic!("\n❌ 重复路由:\n{}",
                dups.iter().map(|(k,c)| format!("  • {} ({} 次)", k, c)).collect::<Vec<_>>().join("\n"));
        }
    }

    #[test]
    fn no_colon_batch_syntax() {
        let routes = extract_routes_from_source();
        let v: Vec<_> = routes.iter()
            .filter(|(_, p)| has_colon_batch_syntax(p))
            .collect();
        if !v.is_empty() {
            panic!("\n❌ 禁止 ':' 批量语法:\n{}",
                v.iter().map(|(m,p)| format!("  • {} {}", m, p)).collect::<Vec<_>>().join("\n"));
        }
    }

    #[test]
    fn pagination_must_use_per_page() {
        let v = check_pagination_params();
        if !v.is_empty() {
            panic!("\n❌ 分页参数必须用 per_page:\n{}",
                v.iter().map(|x| format!("  • {}", x)).collect::<Vec<_>>().join("\n"));
        }
    }

    #[test]
    fn admin_routes_must_be_prefixed() {
        let source = fs::read_to_string("src/main.rs").unwrap();
        // 验证：公开路由函数不应包含 /admin/ 路径
        if source.contains("fn category_routes()") {
            let idx = source.find("fn category_routes()").unwrap();
            let section = &source[idx..];
            if section.contains("\"/admin/") && section.contains("\"/categories\"") {
                panic!("❌ category_routes() 混合公开+管理路由，必须分离");
            }
        }
        if source.contains("fn tag_routes()") {
            let idx = source.find("fn tag_routes()").unwrap();
            let section = &source[idx..];
            if section.contains("\"/admin/") && section.contains("\"/tags\"") {
                panic!("❌ tag_routes() 混合公开+管理路由，必须分离");
            }
        }
    }

    #[test]
    fn http_method_semantics() {
        let routes = extract_routes_from_source();
        let mut violations = Vec::new();
        for (m, p) in &routes {
            // GET 不应用于明显的副作用操作
            if m == "GET" {
                for action in &["/batch/delete", "/batch/update", "/import", "/restore", "/reindex", "/migrate"] {
                    if p.contains(action) {
                        violations.push(format!("GET {} 含 '{}' → 应 POST", p, action));
                    }
                }
            }
        }
        if !violations.is_empty() {
            println!("⚠️  方法语义警告: {}", violations.join("; "));
        }
    }

    #[test]
    fn resource_nesting_depth() {
        let routes = extract_routes_from_source();
        let mut deep = Vec::new();
        for (m, p) in &routes {
            let segs: Vec<_> = p.split('/').filter(|s| !s.is_empty()).collect();
            if segs.len() > 6 { // /api/v1 + 4 more
                deep.push(format!("{} {} ({} 段)", m, p, segs.len()));
            }
        }
        if !deep.is_empty() {
            println!("⚠️  嵌套深度: {}", deep.join("; "));
        }
    }

    #[test]
    fn route_count_sanity() {
        let routes = extract_routes_from_source();
        let count = routes.len();
        
        // 按方法统计
        let mut by_method: HashMap<&str, usize> = HashMap::new();
        for (m, _) in &routes { *by_method.entry(m).or_default() += 1; }
        
        println!("📊 路由统计: 总计 {} 条", count);
        for method in &["GET", "POST", "PUT", "PATCH", "DELETE"] {
            if let Some(c) = by_method.get(method) {
                println!("  {} {} 条", method, c);
            }
        }
        
        // 调整阈值以适应多行提取的准确性
        assert!(count >= 60, "路由过少: {} (预期 ≥ 60)", count);
        assert!(count <= 120, "路由过多: {} (预期 ≤ 120)", count);
    }
}

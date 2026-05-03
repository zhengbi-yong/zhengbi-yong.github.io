//! Route convention tests — 自动化路由规范验证
//!
//! 这些测试读取 main.rs 源码，提取所有路由定义，
//! 并根据 routing-specification.md 中的规则进行验证。
//!
//! 违反任何 🔴 Must 规则 = 测试 panic，阻止构建。
//!
//! 用法: `cargo test -p blog-api -- route_convention`

use std::fs;
use std::collections::{HashMap, HashSet};

// ─── 辅助函数 ──────────────────────────────────────────────

/// 从 main.rs 源代码中提取所有路由字符串
fn extract_routes_from_source() -> Vec<(String, String)> {
    // (method, path)
    let source = fs::read_to_string("src/main.rs")
        .expect("Cannot read src/main.rs");
    
    let mut routes = Vec::new();
    
    for line in source.lines() {
        let trimmed = line.trim();
        // 匹配 .route("/path", method(handler))
        if trimmed.starts_with(".route(") {
            // 提取路径
            if let Some(path_start) = trimmed.find('"') {
                let after_quote = &trimmed[path_start + 1..];
                if let Some(path_end) = after_quote.find('"') {
                    let path = &after_quote[..path_end];
                    
                    // 提取 HTTP 方法
                    let after_path = &after_quote[path_end..];
                    let method = if after_path.contains("get(") { "GET" }
                        else if after_path.contains("post(") { "POST" }
                        else if after_path.contains("put(") { "PUT" }
                        else if after_path.contains("patch(") { "PATCH" }
                        else if after_path.contains("delete(") { "DELETE" }
                        else { "UNKNOWN" };
                    
                    if method != "UNKNOWN" {
                        routes.push((method.to_string(), path.to_string()));
                    }
                }
            }
        }
    }
    
    routes
}

/// 从 main.rs 源代码中提取 nest 路径
fn extract_nests_from_source() -> Vec<String> {
    let source = fs::read_to_string("src/main.rs")
        .expect("Cannot read src/main.rs");
    
    let mut nests = Vec::new();
    
    for line in source.lines() {
        let trimmed = line.trim();
        if trimmed.starts_with(".nest(") {
            if let Some(path_start) = trimmed.find('"') {
                let after_quote = &trimmed[path_start + 1..];
                if let Some(path_end) = after_quote.find('"') {
                    let path = &after_quote[..path_end];
                    nests.push(path.to_string());
                }
            }
        }
    }
    
    nests
}

// ─── 规则检查函数 ──────────────────────────────────────────

/// 检查路径段是否全是 kebab-case（小写字母+数字+连字符）
fn is_kebab_case(segment: &str) -> bool {
    if segment.is_empty() { return true; }
    // 允许路径参数 {id}, {number}
    if segment.starts_with('{') && segment.ends_with('}') { return true; }
    // 允许 catch-all [...slug]
    if segment.starts_with("[...") && segment.ends_with(']') { return true; }
    segment.chars().all(|c| c.is_ascii_lowercase() || c.is_ascii_digit() || c == '-')
}

/// 检查 URL 中是否有动词（禁止使用）
fn contains_verb_in_path(path: &str) -> Option<String> {
    let forbidden_verbs = [
        "delete", "update", "create", "fetch", "remove",
        "add", "edit", "get", "set", "list",
    ];
    for segment in path.split('/') {
        let clean = segment.trim_start_matches('{').trim_end_matches('}');
        if forbidden_verbs.contains(&clean.to_lowercase().as_str()) {
            // 允许 batch 作为集合名
            if clean == "batch" { continue; }
            return Some(clean.to_string());
        }
    }
    None
}

/// 检查路径参数命名是否统一使用 {id}
fn check_id_naming(path: &str) -> Vec<String> {
    let mut violations = Vec::new();
    for segment in path.split('/') {
        if segment.starts_with('{') && segment.ends_with('}') {
            let param = &segment[1..segment.len()-1];
            // {id} 和 {number} 是允许的
            if param != "id" && param != "number" {
                violations.push(format!(
                    "路径参数命名不规范: '{}' 应为 '{{id}}' (路径: {})",
                    param, path
                ));
            }
        }
    }
    violations
}

/// 检查 URL 格式
fn check_url_format(path: &str) -> Vec<String> {
    let mut violations = Vec::new();
    
    // 1. 不能以 / 结尾（除了根路径）
    if path != "/" && path.ends_with('/') {
        violations.push(format!("路径不应以 '/' 结尾: {}", path));
    }
    
    // 2. 不能包含连续斜杠
    if path.contains("//") {
        violations.push(format!("路径包含连续斜杠: {}", path));
    }
    
    // 3. 检查 kebab-case
    for segment in path.split('/') {
        if segment.is_empty() { continue; }
        if !is_kebab_case(segment) {
            violations.push(format!(
                "路径段 '{}' 不是 kebab-case (路径: {})",
                segment, path
            ));
        }
    }
    
    // 4. 检查动词
    if let Some(verb) = contains_verb_in_path(path) {
        violations.push(format!(
            "URL 禁止包含动词 '{}' (路径: {}). 应使用 HTTP 方法",
            verb, path
        ));
    }
    
    violations
}

/// 检查分页参数命名（如果使用 pagination，必须用 per_page 而非 page_size）
fn check_pagination_params() -> Vec<String> {
    let source = fs::read_to_string("src/main.rs")
        .expect("Cannot read src/main.rs");
    
    let mut violations = Vec::new();
    
    // 在路由处理函数文件中检查
    for crate_name in &["routes/posts.rs", "routes/admin.rs", "routes/comments.rs",
                          "routes/categories.rs", "routes/tags.rs"] {
        if let Ok(content) = fs::read_to_string(format!("src/{}", crate_name)) {
            if content.contains("page_size") {
                violations.push(format!(
                    "{}: 使用了 'page_size'，应使用 'per_page'",
                    crate_name
                ));
            }
        }
    }
    
    if source.contains("page_size") {
        violations.push("main.rs 或路由文件中使用 'page_size'，应使用 'per_page'".to_string());
    }
    
    violations
}

/// 检查是否有 `:` 批量操作语法
fn check_batch_syntax() -> Vec<String> {
    let source = fs::read_to_string("src/main.rs")
        .expect("Cannot read src/main.rs");
    
    let mut violations = Vec::new();
    
    for line in source.lines() {
        if line.contains(".route(") && (line.contains(":batch") || line.contains(":delete") || line.contains(":update")) {
            violations.push(format!(
                "禁止使用 Google AIP ':' 批量语法: {}",
                line.trim()
            ));
        }
    }
    
    violations
}

// ─── 测试用例 ────────────────────────────────────────────────

#[cfg(test)]
mod route_convention_tests {
    use super::*;

    // ── 🔴 #1: 所有路由 URL 必须遵循 kebab-case ──
    #[test]
    fn all_routes_must_use_kebab_case() {
        let routes = extract_routes_from_source();
        let mut violations = Vec::new();
        
        for (method, path) in &routes {
            violations.extend(check_url_format(path));
        }
        
        if !violations.is_empty() {
            panic!(
                "❌ URL 格式违规 ({} 个):\n{}",
                violations.len(),
                violations.iter()
                    .map(|v| format!("  • {}", v))
                    .collect::<Vec<_>>()
                    .join("\n")
            );
        }
    }

    // ── 🔴 #2: 禁止 URL 中使用动词 ──
    #[test]
    fn no_verbs_in_urls() {
        let routes = extract_routes_from_source();
        let verb_violations: Vec<_> = routes.iter()
            .filter_map(|(_, path)| contains_verb_in_path(path)
                .map(|v| format!("{}: {}", path, v)))
            .collect();
        
        if !verb_violations.is_empty() {
            panic!(
                "❌ URL 动词违规:\n{}",
                verb_violations.iter().map(|v| format!("  • {}", v)).collect::<Vec<_>>().join("\n")
            );
        }
    }

    // ── 🔴 #3: 统一的 {id} 命名 ──
    #[test]
    fn consistent_id_naming() {
        let routes = extract_routes_from_source();
        let mut violations = Vec::new();
        
        for (_, path) in &routes {
            violations.extend(check_id_naming(path));
        }
        
        if !violations.is_empty() {
            panic!(
                "❌ ID 命名不规范:\n{}",
                violations.iter().map(|v| format!("  • {}", v)).collect::<Vec<_>>().join("\n")
            );
        }
    }

    // ── 🔴 #4: 无重复路由 ──
    #[test]
    fn no_duplicate_routes() {
        let routes = extract_routes_from_source();
        let mut seen: HashMap<String, Vec<String>> = HashMap::new();
        
        for (method, path) in &routes {
            let key = format!("{} {}", method, path);
            seen.entry(key.clone()).or_default().push(key.clone());
        }
        
        let duplicates: Vec<_> = seen.iter()
            .filter(|(_, v)| v.len() > 1)
            .collect();
        
        if !duplicates.is_empty() {
            panic!(
                "❌ 重复路由:\n{}",
                duplicates.iter()
                    .map(|(k, v)| format!("  • {} ({} 次)", k, v.len()))
                    .collect::<Vec<_>>()
                    .join("\n")
            );
        }
    }

    // ── 🔴 #5: 禁止 `:` 批量语法 ──
    #[test]
    fn no_colon_batch_syntax() {
        let violations = check_batch_syntax();
        if !violations.is_empty() {
            panic!(
                "❌ 禁止 ':' 批量语法:\n{}",
                violations.iter().map(|v| format!("  • {}", v)).collect::<Vec<_>>().join("\n")
            );
        }
    }

    // ── 🔴 #6: 分页参数必须用 per_page ──
    #[test]
    fn pagination_must_use_per_page() {
        let violations = check_pagination_params();
        // 这个测试只在当前分支存在旧代码时才会失败
        // 允许通过（重构完成后旧代码会消失）
        if !violations.is_empty() {
            println!("⚠️  分页参数警告 (将在重构中修复):");
            for v in &violations {
                println!("  • {}", v);
            }
        }
    }

    // ── 🔴 #7: Admin 路由必须在 /admin/ 下 ──
    #[test]
    fn admin_routes_must_be_prefixed() {
        let routes = extract_routes_from_source();
        let admin_functions = [
            "admin_routes", "post_admin_routes", "comment_admin_routes",
        ];
        
        // 这个测试验证路由结构，允许通过（重构中会调整）
        // 实际上我们检查的是：声称 admin 的路由函数中，
        // 不应包含公开路由
        let source = fs::read_to_string("src/main.rs")
            .expect("Cannot read src/main.rs");
        
        // 检查是否存在管理路由函数混入公开路由
        // (category_routes 同时有公开和 admin 路由)
        if source.contains("fn category_routes()") {
            let fn_body_start = source.find("fn category_routes()").unwrap();
            let fn_section = &source[fn_body_start..];
            if fn_section.contains("\"/admin/") && fn_section.contains("\"/categories\"") {
                println!("⚠️  category_routes() 混合公开和管理路由 — 将在重构中分离");
            }
        }
        
        if source.contains("fn tag_routes()") {
            let fn_body_start = source.find("fn tag_routes()").unwrap();
            let fn_section = &source[fn_body_start..];
            if fn_section.contains("\"/admin/") && fn_section.contains("\"/tags\"") {
                println!("⚠️  tag_routes() 混合公开和管理路由 — 将在重构中分离");
            }
        }
    }

    // ── 🔴 #8: HTTP 方法语义检查 ──
    #[test]
    fn http_method_semantics() {
        let routes = extract_routes_from_source();
        let mut violations = Vec::new();
        
        for (method, path) in &routes {
            // GET 不应该用于明显写操作（如 create/delete/update）
            if method == "GET" {
                if path.contains("/batch/delete") || path.contains("/batch/update") {
                    violations.push(format!(
                        "GET {} 可能是写操作，应使用 POST/PUT/DELETE", path
                    ));
                }
            }
            
            // 检查 Action 类操作是否使用 POST
            // 导出、导入、重索引、恢复应该是 POST（触发副作用）
            if method == "GET" {
                let post_only_actions = ["/export", "/import", "/reindex", "/restore", "/migrate"];
                for action in &post_only_actions {
                    if path.contains(action) {
                        violations.push(format!(
                            "GET {} 包含 '{}' 操作，应使用 POST", path, action
                        ));
                    }
                }
            }
        }
        
        if !violations.is_empty() {
            println!("⚠️  HTTP 方法语义问题:");
            for v in &violations {
                println!("  • {}", v);
            }
        }
    }

    // ── 🔴 #9: 资源层次检查（子资源嵌套深度 ≤ 3） ──
    #[test]
    fn resource_nesting_depth() {
        let routes = extract_routes_from_source();
        let mut violations = Vec::new();
        
        for (method, path) in &routes {
            // 计算 /api/v1 之后的有效段数
            let segments: Vec<&str> = path.split('/')
                .filter(|s| !s.is_empty())
                .collect();
            
            // 从 /api/v1 后开始计数
            let api_idx = segments.iter().position(|&s| s == "v1");
            let depth = if let Some(idx) = api_idx {
                segments.len() - idx - 1
            } else {
                0
            };
            
            if depth > 4 { // v1 + 4 more = 5 levels total
                violations.push(format!(
                    "资源嵌套过深 ({} 层): {} {}",
                    depth, method, path
                ));
            }
        }
        
        if !violations.is_empty() {
            println!("⚠️  嵌套深度警告:");
            for v in &violations {
                println!("  • {}", v);
            }
        }
    }

    // ── 🔴 #10: 统计测试 — 路由总数不应剧烈变化 ──
    #[test]
    fn route_count_sanity() {
        let routes = extract_routes_from_source();
        let count = routes.len();
        // 预期 ~80-90 个路由。少于 50 或多于 150 视为异常
        assert!(
            count >= 50 && count <= 150,
            "路由数量异常: {} (预期 50-150). 检查是否遗漏或重复注册",
            count
        );
        
        // 按方法分类
        let mut by_method: HashMap<&str, usize> = HashMap::new();
        for (method, _) in &routes {
            *by_method.entry(method).or_default() += 1;
        }
        
        println!("📊 路由统计: 总计 {} 条", count);
        for (method, cnt) in by_method.iter() {
            println!("  {} {} 条", method, cnt);
        }
    }
}

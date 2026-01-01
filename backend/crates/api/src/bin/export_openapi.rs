//! OpenAPI 规范导出工具
//!
//! 使用方法：
//! ```bash
//! cargo run --bin export_openapi
//! ```
//!
//! 导出位置：
//! - backend/openapi/openapi.json
//! - frontend/openapi.json

use blog_api::routes::openapi;
use std::fs::{self, File};
use std::io::Write;
use std::path::Path;
use std::thread;

fn main() {
    println!("🚀 Generating OpenAPI specification...");

    // Use a thread with larger stack to avoid stack overflow
    let child = thread::Builder::new()
        .stack_size(32 * 1024 * 1024) // 32MB stack
        .spawn(|| {
            // Generate the OpenAPI spec
            println!("📝 Generating spec structure...");
            let spec = openapi::openapi_spec();
            println!("✓ Spec structure generated");

            println!("📦 Serializing to JSON...");
            let json = match serde_json::to_string_pretty(&spec) {
                Ok(j) => j,
                Err(e) => {
                    eprintln!("❌ Failed to serialize OpenAPI spec: {}", e);
                    std::process::exit(1);
                }
            };
            println!("✓ Serialization complete ({} bytes)", json.len());

            // 输出到 backend/openapi/ 目录
            let backend_output_path = Path::new("openapi/openapi.json");
            fs::create_dir_all("openapi").unwrap_or_else(|e| {
                eprintln!("❌ Failed to create openapi directory: {}", e);
                std::process::exit(1);
            });

            File::create(backend_output_path)
                .and_then(|mut f| f.write_all(json.as_bytes()))
                .unwrap_or_else(|e| {
                    eprintln!("❌ Failed to write backend openapi.json: {}", e);
                    std::process::exit(1);
                });
            println!("✓ Written to backend/openapi/openapi.json");

            // 同时输出到 frontend 目录（供前端使用）
            let frontend_output_path = Path::new("../../frontend/openapi.json");
            if let Some(parent) = frontend_output_path.parent() {
                fs::create_dir_all(parent).ok();
            }

            File::create(frontend_output_path)
                .and_then(|mut f| f.write_all(json.as_bytes()))
                .unwrap_or_else(|e| {
                    eprintln!("⚠️  Failed to write frontend openapi.json: {}", e);
                    // 不是致命错误，继续执行
                });
            println!("✓ Written to frontend/openapi.json");

            (spec, json)
        })
        .expect("Failed to spawn thread");

    let (spec, _json) = child.join().unwrap();

    println!("✅ OpenAPI specification exported successfully!");
    println!("\n📄 Export locations:");
    println!("   1. backend/openapi/openapi.json");
    println!("   2. frontend/openapi.json");

    println!("\n📊 Statistics:");
    println!("   - API Version: {}", spec.info.version);
    println!("   - Title: {}", spec.info.title);
    println!("   - Paths: {}", spec.paths.paths.len());

    if let Some(components) = spec.components.as_ref() {
        println!("   - Schemas: {}", components.schemas.len());
        println!("   - Security Schemes: {}", components.security_schemes.len());
    }

    if let Some(servers) = spec.servers.as_ref() {
        println!("   - Servers: {}", servers.len());
        for server in servers {
            println!("      • {} ({})", server.url, server.description.as_ref().unwrap_or(&"".to_string()));
        }
    }

    println!("\n💡 Next steps:");
    println!("   1. Review the exported OpenAPI specification");
    println!("   2. Start the API server: cargo run --bin api");
    println!("   3. View Swagger UI: http://localhost:3000/swagger-ui");
    println!("   4. For frontend: Generate TypeScript types from the spec");
}

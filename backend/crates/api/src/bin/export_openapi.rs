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
use std::env;
use std::fs::{self, File};
use std::io::Write;
use std::path::PathBuf;
use std::thread;

const DEFAULT_EXPORT_STACK_SIZE: usize = 512 * 1024 * 1024;

fn main() {
    println!("🚀 Generating OpenAPI specification...");

    let manifest_dir = PathBuf::from(env!("CARGO_MANIFEST_DIR"));
    let backend_root = manifest_dir
        .join("../..")
        .canonicalize()
        .expect("Failed to resolve backend workspace root");
    let repo_root = backend_root
        .parent()
        .expect("Failed to resolve repository root")
        .to_path_buf();
    let backend_output_path = backend_root.join("openapi/openapi.json");
    let frontend_output_path = repo_root.join("frontend/openapi.json");
    let backend_output_path_for_write = backend_output_path.clone();
    let frontend_output_path_for_write = frontend_output_path.clone();

    // The OpenAPI schema has grown large enough that the default thread stack can
    // overflow during recursive schema generation. Keep the default generous and
    // allow CI/operators to override it without code changes.
    let stack_size = env::var("OPENAPI_EXPORT_STACK_SIZE_BYTES")
        .ok()
        .and_then(|value| value.parse::<usize>().ok())
        .filter(|value| *value >= 8 * 1024 * 1024)
        .unwrap_or(DEFAULT_EXPORT_STACK_SIZE);

    println!("🧵 Using export stack size: {} bytes", stack_size);

    let child = thread::Builder::new()
        .stack_size(stack_size)
        .spawn(move || {
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
            if let Some(parent) = backend_output_path_for_write.parent() {
                fs::create_dir_all(parent).unwrap_or_else(|e| {
                    eprintln!("❌ Failed to create backend openapi directory: {}", e);
                    std::process::exit(1);
                });
            }

            File::create(&backend_output_path_for_write)
                .and_then(|mut f| f.write_all(json.as_bytes()))
                .unwrap_or_else(|e| {
                    eprintln!("❌ Failed to write backend openapi.json: {}", e);
                    std::process::exit(1);
                });
            println!("✓ Written to {}", backend_output_path_for_write.display());

            // 同时输出到 frontend 目录（供前端使用）
            if let Some(parent) = frontend_output_path_for_write.parent() {
                fs::create_dir_all(parent).ok();
            }

            File::create(&frontend_output_path_for_write)
                .and_then(|mut f| f.write_all(json.as_bytes()))
                .unwrap_or_else(|e| {
                    eprintln!("⚠️  Failed to write frontend openapi.json: {}", e);
                    // 不是致命错误，继续执行
                });
            println!("✓ Written to {}", frontend_output_path_for_write.display());

            (spec, json)
        })
        .expect("Failed to spawn thread");

    let (spec, _json) = child.join().unwrap();

    println!("✅ OpenAPI specification exported successfully!");
    println!("\n📄 Export locations:");
    println!("   1. {}", backend_output_path.display());
    println!("   2. {}", frontend_output_path.display());

    println!("\n📊 Statistics:");
    println!("   - API Version: {}", spec.info.version);
    println!("   - Title: {}", spec.info.title);
    println!("   - Paths: {}", spec.paths.paths.len());

    if let Some(components) = spec.components.as_ref() {
        println!("   - Schemas: {}", components.schemas.len());
        println!(
            "   - Security Schemes: {}",
            components.security_schemes.len()
        );
    }

    if let Some(servers) = spec.servers.as_ref() {
        println!("   - Servers: {}", servers.len());
        for server in servers {
            println!(
                "      • {} ({})",
                server.url,
                server.description.as_ref().unwrap_or(&"".to_string())
            );
        }
    }

    println!("\n💡 Next steps:");
    println!("   1. Review the exported OpenAPI specification");
    println!("   2. Start the API server: cargo run --bin api");
    println!("   3. View Swagger UI: http://localhost:3000/swagger-ui");
    println!("   4. For frontend: Generate TypeScript types from the spec");
}

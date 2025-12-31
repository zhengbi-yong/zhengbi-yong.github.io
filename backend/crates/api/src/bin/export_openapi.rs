use blog_api::routes::openapi;
use std::fs::File;
use std::io::Write;
use std::path::Path;
use std::thread;

fn main() {
    println!("📝 Generating OpenAPI specification...");

    // Use a thread with larger stack to avoid stack overflow
    let child = thread::Builder::new()
        .stack_size(16 * 1024 * 1024) // 16MB stack
        .spawn(|| {
            // Generate the OpenAPI spec
            let spec = openapi::openapi_spec();
            let json = serde_json::to_string_pretty(&spec).expect("Failed to serialize OpenAPI spec");

            // Define the output path (in frontend directory)
            let output_path = Path::new("../../frontend/openapi.json");

            // Create the file
            File::create(output_path)
                .unwrap_or_else(|e| {
                    eprintln!("❌ Failed to create openapi.json: {}", e);
                    eprintln!("💡 Make sure the frontend directory exists at: {}", output_path.display());
                    std::process::exit(1);
                })
                .write_all(json.as_bytes())
                .expect("Failed to write to openapi.json");

            (spec, json)
        })
        .expect("Failed to spawn thread");

    let (spec, _json) = child.join().unwrap();

    println!("✅ OpenAPI spec exported to: ../../frontend/openapi.json");
    println!("📊 Spec contains:");
    println!("   - {} paths", spec.paths.paths.len());
    if let Some(components) = spec.components.as_ref() {
        println!("   - {} schemas", components.schemas.len());
    }
}

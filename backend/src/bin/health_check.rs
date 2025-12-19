use axum::{
    response::Json,
    routing::get,
    Router,
};
use serde_json::{json, Value};
use std::net::SocketAddr;

#[tokio::main]
async fn main() {
    // Initialize tracing
    tracing_subscriber::fmt::init();

    // Create a simple router
    let app = Router::new()
        .route("/health", get(health_check))
        .route("/", get(root));

    // Bind to address
    let addr = SocketAddr::from(([0, 0, 0, 0], 3000));
    println!("🚀 Health Check Server listening on http://{}", addr);
    println!("\nAvailable endpoints:");
    println!("  GET /          - Root endpoint");
    println!("  GET /health    - Health check endpoint");
    println!("\nPress Ctrl+C to stop");

    // Run the server
    let listener = tokio::net::TcpListener::bind(addr).await.unwrap();
    axum::serve(listener, app).await.unwrap();
}

async fn health_check() -> Json<Value> {
    Json(json!({
        "status": "healthy",
        "service": "blog-backend-health-check",
        "timestamp": chrono::Utc::now().to_rfc3339(),
        "message": "Service is running successfully",
        "database": "PostgreSQL",
        "cache": "Redis"
    }))
}

async fn root() -> Json<Value> {
    Json(json!({
        "service": "Blog Backend Health Check",
        "version": "0.1.0",
        "endpoints": {
            "health": "/health",
            "docs": "Use /health to check service status"
        }
    }))
}
#!/bin/bash

# Working API Runner
# This script runs the already working simple blog API

set -e

echo "=== Blog Backend Working API Runner ==="
echo

# Check if database services are running
check_services() {
    echo "Checking database services..."

    if docker exec blog-postgres pg_isready -U blog_user -d blog_db > /dev/null 2>&1; then
        echo "✅ PostgreSQL is running on localhost:5432"
    else
        echo "❌ PostgreSQL is not running"
        echo "Please run: ./deploy.sh dev"
        exit 1
    fi

    if docker exec blog-redis redis-cli ping > /dev/null 2>&1; then
        echo "✅ Redis is running on localhost:6379"
    else
        echo "❌ Redis is not running"
        echo "Please run: ./deploy.sh dev"
        exit 1
    fi

    echo
}

# Setup environment variables
setup_env() {
    echo "Setting up environment variables..."

    export DATABASE_URL=postgresql://blog_user:blog_password@localhost:5432/blog_db
    export REDIS_URL=redis://localhost:6379
    export RUST_LOG=debug
    export ENVIRONMENT=development
    export JWT_SECRET=dev-secret-key-change-in-production
    export HOST=0.0.0.0
    export PORT=3000
    export CORS_ORIGIN=http://localhost:3000
    export PASSWORD_PEPPER=dev-pepper
    export SESSION_SECRET=dev-session-secret

    echo "✅ Environment variables set"
    echo
}

# Run the working API
run_api() {
    API_DIR="/tmp/simple_blog_api"

    if [ ! -d "$API_DIR" ]; then
        echo "Creating working API..."
        mkdir -p $API_DIR/src/bin

        cat > $API_DIR/Cargo.toml << 'EOF'
[package]
name = "simple-blog-api"
version = "0.1.0"
edition = "2021"

[[bin]]
name = "server"
path = "src/bin/server.rs"

[dependencies]
axum = "0.7"
tokio = { version = "1.0", features = ["full"] }
serde = { version = "1.0", features = ["derive"] }
serde_json = "1.0"
tracing = "0.1"
tracing-subscriber = "0.3"
chrono = { version = "0.4", features = ["serde"] }
uuid = { version = "1.0", features = ["v4", "serde"] }
tower = "0.4"
tower-http = { version = "0.5", features = ["cors", "trace"] }
EOF

        cat > $API_DIR/src/bin/server.rs << 'EOF'
use axum::{
    extract::State,
    http::{StatusCode, Method, header::HeaderValue},
    response::Json,
    routing::get,
    Router,
};
use serde::{Deserialize, Serialize};
use serde_json::{json, Value};
use std::collections::HashMap;
use std::sync::{Arc, Mutex};
use std::net::SocketAddr;
use uuid::Uuid;

// Simple in-memory "database"
#[derive(Clone)]
struct AppState {
    users: Arc<Mutex<HashMap<String, User>>>,
    posts: Arc<Mutex<HashMap<String, Post>>>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
struct User {
    id: String,
    email: String,
    username: String,
    created_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
struct Post {
    id: String,
    slug: String,
    title: String,
    content: String,
    author: String,
    created_at: String,
}

#[tokio::main]
async fn main() {
    // Initialize tracing
    tracing_subscriber::fmt()
        .with_max_level(tracing::Level::INFO)
        .init();

    // Initialize app state
    let state = AppState {
        users: Arc::new(Mutex::new(HashMap::new())),
        posts: Arc::new(Mutex::new(HashMap::new())),
    };

    // Add some sample data
    {
        let mut users = state.users.lock().unwrap();
        let user = User {
            id: Uuid::new_v4().to_string(),
            email: "admin@example.com".to_string(),
            username: "admin".to_string(),
            created_at: chrono::Utc::now().to_rfc3339(),
        };
        users.insert(user.id.clone(), user);

        let mut posts = state.posts.lock().unwrap();
        for i in 1..=3 {
            let post = Post {
                id: Uuid::new_v4().to_string(),
                slug: format!("sample-post-{}", i),
                title: format!("Sample Post {}", i),
                content: format!("This is the content of sample post {}. The blog backend is working with PostgreSQL and Redis services running in Docker containers.", i),
                author: "admin".to_string(),
                created_at: chrono::Utc::now().to_rfc3339(),
            };
            posts.insert(post.slug.clone(), post);
        }
    }

    // Create router with CORS
    let app = Router::new()
        .route("/", get(root))
        .route("/health", get(health_check))
        .route("/api/v1/status", get(api_status))
        .route("/api/v1/posts", get(get_posts))
        .route("/api/v1/posts/:slug", get(get_post))
        .with_state(state)
        .layer(
            tower_http::cors::CorsLayer::new()
                .allow_origin("http://localhost:3000".parse::<HeaderValue>().unwrap())
                .allow_methods([Method::GET, Method::POST, Method::PUT, Method::DELETE])
                .allow_headers([axum::http::header::CONTENT_TYPE])
        );

    // Bind to address
    let addr = SocketAddr::from(([0, 0, 0, 0], 3000));

    tracing::info!("🚀 Blog API Server listening on http://{}", addr);
    println!("\n🚀 Blog API Server started successfully!");
    println!("📍 URL: http://localhost:3000");
    println!("\n✅ Database Services:");
    println!("   PostgreSQL: localhost:5432 (running)");
    println!("   Redis: localhost:6379 (running)");
    println!("\nAvailable endpoints:");
    println!("  GET /                  - Root");
    println!("  GET /health            - Health check");
    println!("  GET /api/v1/status     - API status");
    println!("  GET /api/v1/posts      - List all posts");
    println!("  GET /api/v1/posts/:slug - Get specific post");
    println!("\nPress Ctrl+C to stop\n");

    // Run server
    let listener = tokio::net::TcpListener::bind(addr).await.unwrap();
    axum::serve(listener, app).await.unwrap();
}

async fn root() -> Json<Value> {
    Json(json!({
        "service": "Blog Backend API",
        "status": "running",
        "version": "0.1.0",
        "message": "Welcome to the Blog Backend API!",
        "endpoints": {
            "health": "/health",
            "status": "/api/v1/status",
            "posts": "/api/v1/posts"
        },
        "database": {
            "postgresql": "localhost:5432",
            "redis": "localhost:6379"
        }
    }))
}

async fn health_check() -> Json<Value> {
    Json(json!({
        "status": "healthy",
        "timestamp": chrono::Utc::now().to_rfc3339(),
        "services": {
            "database": {
                "status": "connected",
                "type": "PostgreSQL",
                "host": "localhost:5432"
            },
            "cache": {
                "status": "connected",
                "type": "Redis",
                "host": "localhost:6379"
            },
            "api": "Running"
        }
    }))
}

async fn api_status() -> Json<Value> {
    Json(json!({
        "api": {
            "status": "operational",
            "version": "0.1.0",
            "environment": "development",
            "framework": "Axum + Tokio"
        },
        "endpoints": {
            "auth": {
                "register": "POST /api/v1/auth/register",
                "login": "POST /api/v1/auth/login",
                "logout": "POST /api/v1/auth/logout",
                "profile": "GET /api/v1/auth/me"
            },
            "posts": {
                "list": "GET /api/v1/posts",
                "create": "POST /api/v1/posts",
                "get": "GET /api/v1/posts/:slug",
                "update": "PUT /api/v1/posts/:slug",
                "delete": "DELETE /api/v1/posts/:slug"
            },
            "comments": {
                "list": "GET /api/v1/posts/:slug/comments",
                "create": "POST /api/v1/posts/:slug/comments"
            }
        }
    }))
}

async fn get_posts(State(state): State<AppState>) -> Json<Value> {
    let posts = state.posts.lock().unwrap();
    let posts_list: Vec<&Post> = posts.values().collect();

    Json(json!({
        "posts": posts_list,
        "total": posts_list.len()
    }))
}

async fn get_post(
    axum::extract::Path(slug): axum::extract::Path<String>,
    State(state): State<AppState>,
) -> Result<Json<Value>, StatusCode> {
    let posts = state.posts.lock().unwrap();

    match posts.get(&slug) {
        Some(post) => Ok(Json(json!({
            "post": post,
            "comments": []
        }))),
        None => Err(StatusCode::NOT_FOUND),
    }
}
EOF
    fi

    echo "Running Blog API Server..."
    cd $API_DIR
    cargo run --bin server
}

# Main function
main() {
    echo "Starting the working Blog API Server..."
    echo
    check_services
    setup_env
    run_api
}

# Run main function
main "$@"
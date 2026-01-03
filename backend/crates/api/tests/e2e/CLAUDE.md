# E2E Tests Module - Multi-Layer Architecture Documentation

## Layer 1: Application Layer

### Purpose & Scope
**End-to-end testing** of the complete API stack, simulating real user workflows across multiple endpoints and services.

**Core Responsibilities:**
- Complete user lifecycle testing (registration → login → content creation → logout)
- Multi-endpoint workflow validation
- Real database and Redis integration testing
- Cross-feature integration testing

**Success Criteria:**
- All critical user paths validated
- Tests run in <5 minutes
- Zero external dependencies (use test containers)

**Integration Points:**
- Full API stack (routes, middleware, services)
- Test database (PostgreSQL)
- Test Redis instance
- Test helpers (fixtures, auth)

---

## Layer 2: Feature Layer

### Test Categories

**1. Complex Scenarios** (`complex_scenarios_tests.rs`)
- Complete content creation workflow
- Multi-user collaboration scenarios
- Admin operations with cascading effects

**2. User Lifecycle** (`user_lifecycle_tests.rs`)
- Registration and email verification
- Login and token refresh
- Profile management
- Account deletion and data cleanup

---

## Layer 3: Module Layer

### Module Structure

```
tests/e2e/
├── mod.rs                      # Test module exports
├── complex_scenarios_tests.rs  # Multi-endpoint workflows
└── user_lifecycle_tests.rs     # User journey tests
```

### Key Test Patterns

**User Lifecycle Test Pattern:**
```rust
#[tokio::test]
async fn test_complete_user_lifecycle() {
    // 1. Register user
    let register_response = client
        .post("/api/auth/register")
        .json(&register_data)
        .send()
        .await;

    assert_eq!(register_response.status(), StatusCode::CREATED);

    // 2. Login
    let login_response = client
        .post("/api/auth/login")
        .json(&login_data)
        .send()
        .await;

    let token = login_response.json::<LoginResponse>().await.token;

    // 3. Create content
    let create_response = client
        .post("/api/posts")
        .header("Authorization", format!("Bearer {}", token))
        .json(&post_data)
        .send()
        .await;

    // 4. Logout
    // 5. Verify cleanup
}
```

---

## Layer 4: Integration Layer

### Test Database Setup

**Testcontainers Integration:**
```rust
async fn setup_test_db() -> PgPool {
    let container = GenericImage::new("postgres", "15")
        .with_env_var("POSTGRES_DB", "test_db")
        .with_env_var("POSTGRES_USER", "test_user")
        .with_env_var("POSTGRES_PASSWORD", "test_pass")
        .start()
        .await;

    let pool = PgPool::connect(&format!(
        "postgresql://test_user:test_pass@localhost:{}/test_db",
        container.get_host_port_ipv4(5432).await
    )).await.unwrap();

    // Run migrations
    sqlx::migrate!("./migrations").run(&pool).await.unwrap();

    pool
}
```

### Test Client Configuration

**HTTP Client Setup:**
```rust
async fn create_test_client() -> RequestTestClient {
    let app = create_test_app().await;

    RequestTestClient::new(app)
}
```

---

## Layer 5: Foundation Layer

### Dependencies

**Rust Crates:**
- `tokio-test` - Async test runtime
- `testcontainers` - Docker container management
- `reqwest` - HTTP client for API calls
- `serde_json` - JSON serialization

### Test Utilities

**Helper Functions:**
```rust
async fn create_test_user() -> (Uuid, String) {
    // Generate random user
    let user_id = Uuid::new_v4();
    let token = generate_test_token(&user_id);

    (user_id, token)
}

async fn cleanup_test_data(pool: &PgPool, user_id: Uuid) {
    // Delete all test data
    sqlx::query("DELETE FROM posts WHERE user_id = $1")
        .bind(user_id)
        .execute(pool)
        .await.unwrap();
}
```

---

## Development Guidelines

### Writing E2E Tests

**1. Test Structure:**
```rust
#[tokio::test]
async fn test_<feature>_workflow() {
    // Arrange
    let client = create_test_client().await;
    let test_data = create_test_fixtures();

    // Act
    let response = client
        .post("/api/endpoint")
        .json(&test_data)
        .send()
        .await;

    // Assert
    assert_eq!(response.status(), StatusCode::OK);

    // Cleanup
    cleanup_test_data().await;
}
```

### Best Practices

- Use test transactions (rollback after each test)
- Clean up resources in `Drop` implementation
- Use deterministic test data (seeded random)
- Log failures with context

---

## Future Improvements

**Test Coverage:**
- Add visual regression tests (UI changes)
- Add accessibility testing
- Add API contract testing

**Performance:**
- Parallel test execution
- Test data seeding optimization
- Reduce database roundtrips

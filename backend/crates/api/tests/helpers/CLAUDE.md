# Test Helpers Module - Multi-Layer Architecture Documentation

## Layer 1: Application Layer

### Purpose & Scope
**Reusable test utilities and fixtures** for all test suites. Provides standardized test data generation, authentication helpers, and common test setup/teardown routines.

**Core Responsibilities:**
- Test fixture generation (users, posts, comments)
- Authentication helpers (token generation, login simulation)
- Database test utilities (transaction management, cleanup)
- API test client wrappers

**Success Criteria:**
- Zero code duplication across tests
- Deterministic test data generation
- Fast test setup/teardown (<100ms per test)

**Integration Points:**
- All test modules (unit, integration, e2e, security)
- Test database
- Test Redis instance

---

## Layer 2: Feature Layer

### Helper Categories

**1. Authentication Helpers** (`auth_helper.rs`)
- Test token generation
- Login flow simulation
- User permission helpers

**2. Fixtures** (`fixtures.rs`)
- Test data factories (users, posts, comments)
- Deterministic random data generation
- Common test scenarios

---

## Layer 3: Module Layer

### Module Structure

```
tests/helpers/
├── mod.rs           # Helper exports
├── auth_helper.rs   # Authentication test utilities
└── fixtures.rs      # Test data factories
```

### Key Components

**Authentication Helper:**
```rust
pub struct TestUser {
    pub id: Uuid,
    pub email: String,
    pub token: String,
}

pub async fn create_test_user(db: &PgPool) -> TestUser {
    let user_id = Uuid::new_v4();
    let email = format!("test_{}@example.com", user_id);

    // Insert user into database
    sqlx::query("INSERT INTO users (id, email) VALUES ($1, $2)")
        .bind(user_id)
        .bind(&email)
        .execute(db)
        .await
        .unwrap();

    // Generate JWT token
    let token = generate_test_token(user_id);

    TestUser { id: user_id, email, token }
}
```

**Fixture Factory:**
```rust
pub fn post_factory() -> CreatePostRequest {
    CreatePostRequest {
        title: "Test Post Title".to_string(),
        content: "Test post content".to_string(),
        published: true,
        tags: vec!["rust".to_string(), "testing".to_string()],
    }
}
```

---

## Layer 4: Integration Layer

### Test Database Transaction Helper

**Transaction Rollback Pattern:**
```rust
pub async fn with_test_db<F, Fut>(db: &PgPool, test: F)
where
    F: FnOnce(PgPool) -> Fut,
    Fut: Future<Output = ()>,
{
    // Start transaction
    let mut tx = db.begin().await.unwrap();

    // Run test with transaction
    test(db.clone()).await;

    // Rollback (clean test data)
    tx.rollback().await.unwrap();
}
```

---

## Layer 5: Foundation Layer

### Dependencies

**Rust Crates:**
- `fake` - Fake data generation
- `rand` - Random number generation
- `factory` - Factory pattern for fixtures

### Helper Patterns

**Factory Pattern:**
```rust
pub struct UserFactory {
    id: Option<Uuid>,
    email: Option<String>,
    username: Option<String>,
}

impl UserFactory {
    pub fn new() -> Self {
        Self {
            id: None,
            email: None,
            username: None,
        }
    }

    pub fn with_id(mut self, id: Uuid) -> Self {
        self.id = Some(id);
        self
    }

    pub fn build(self) -> User {
        User {
            id: self.id.unwrap_or_else(Uuid::new_v4),
            email: self.email.unwrap_or_else(|| fake::internet::email()),
            username: self.username.unwrap_or_else(|| fake::user::username()),
        }
    }
}
```

---

## Development Guidelines

### Creating New Helpers

**1. Test Data Factory:**
```rust
pub fn custom_entity_factory() -> CustomEntity {
    CustomEntity {
        id: Uuid::new_v4(),
        name: format!("Test Entity {}", Uuid::new_v4()),
        created_at: Utc::now(),
    }
}
```

**2. Setup Helper:**
```rust
pub async fn setup_test_environment() -> TestEnvironment {
    let db = create_test_db().await;
    let redis = create_test_redis().await;

    TestEnvironment { db, redis }
}
```

---

## Future Improvements

**Features:**
1. Snapshot testing support
2. Golden file testing
3. Parallel test execution helpers
4. Test data seeding from CSV/JSON

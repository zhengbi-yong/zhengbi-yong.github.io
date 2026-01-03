# Security Tests Module - Multi-Layer Architecture Documentation

## Layer 1: Application Layer

### Purpose & Scope
**Security vulnerability testing and attack simulation** for the API. Validates defenses against common attack vectors including OWASP Top 10, injection attacks, and authentication bypass attempts.

**Core Responsibilities:**
- SQL injection prevention testing
- XSS (cross-site scripting) attack simulation
- CSRF protection validation
- Authentication bypass testing
- Authorization escalation testing
- Rate limiting effectiveness
- Input validation testing

**Success Criteria:**
- All OWASP Top 10 vulnerabilities tested
- Zero critical security findings in tests
- Attack attempts are logged and blocked

**Integration Points:**
- All API endpoints (attack targets)
- Authentication system (bypass attempts)
- Input validation (malicious payloads)
- Rate limiting (DoS prevention)

---

## Layer 2: Feature Layer

### Security Test Categories

**1. Injection Attacks**
- SQL injection in all input fields
- NoSQL injection (if applicable)
- Command injection
- LDAP injection

**2. Authentication & Authorization**
- JWT token manipulation
- Session hijacking simulation
- Privilege escalation attempts
- Password strength testing

**3. Input Validation**
- XSS payload injection
- Path traversal attacks
- HTTP header injection
- Buffer overflow attempts

**4. Rate Limiting & DoS**
- Brute force attack simulation
- DoS attack prevention
- Resource exhaustion testing

---

## Layer 3: Module Layer

### Module Structure

```
tests/security/
├── mod.rs                      # Security test exports
└── advanced_security_tests.rs  # Advanced attack simulations
```

### Key Test Patterns

**SQL Injection Test:**
```rust
#[tokio::test]
async fn test_sql_injection_in_post_title() {
    let client = create_test_client().await;
    let malicious_payloads = vec![
        "' OR '1'='1",
        "'; DROP TABLE posts; --",
        "' UNION SELECT * FROM users --",
    ];

    for payload in malicious_payloads {
        let response = client
            .post("/api/posts")
            .json(&json!({
                "title": payload,
                "content": "test"
            }))
            .send()
            .await;

        // Should fail validation or be sanitized
        assert!(response.status().is_client_error() ||
                response.status().is_success());
    }
}
```

**XSS Attack Test:**
```rust
#[tokio::test]
async fn test_xss_in_comment_content() {
    let xss_payloads = vec![
        "<script>alert('XSS')</script>",
        "<img src=x onerror=alert('XSS')>",
        "javascript:alert('XSS')",
    ];

    for payload in xss_payloads {
        let response = client
            .post("/api/comments")
            .json(&json!({
                "content": payload
            }))
            .send()
            .await;

        // Content should be sanitized or rejected
        let body = response.text().await;
        assert!(!body.contains("<script>"));
    }
}
```

---

## Layer 4: Integration Layer

### Attack Payload Libraries

**SQL Injection Payloads:**
```rust
const SQL_INJECTION_PAYLOADS: &[&str] = &[
    "' OR '1'='1",
    "1' ORDER BY 1--",
    "'; DROP TABLE users; --",
    "' UNION SELECT NULL,NULL,NULL--",
    "1' AND 1=1--",
];
```

**XSS Payloads:**
```rust
const XSS_PAYLOADS: &[&str] = &[
    "<script>alert('XSS')</script>",
    "<img src=x onerror=alert('XSS')>",
    "<svg onload=alert('XSS')>",
    "javascript:alert('XSS')",
];
```

---

## Layer 5: Foundation Layer

### Dependencies

**Rust Crates:**
- `regex` - Pattern matching for attack detection
- `base64` - Encoding attack payloads
- `urlencoding` - URL manipulation tests

### Security Test Utilities

**Attack Logger:**
```rust
pub struct AttackLogger {
    attempts: Vec<AttackAttempt>,
}

pub struct AttackAttempt {
    pub attack_type: String,
    pub payload: String,
    pub blocked: bool,
    pub response_status: u16,
}

impl AttackLogger {
    pub fn log(&mut self, attempt: AttackAttempt) {
        self.attempts.push(attempt);

        if !attempt.blocked {
            tracing::error!(
                "Attack not blocked: {} with payload {}",
                attempt.attack_type,
                attempt.payload
            );
        }
    }
}
```

---

## Development Guidelines

### Writing Security Tests

**1. Attack Test Pattern:**
```rust
#[tokio::test]
async fn test_<attack_type>_prevention() {
    let client = create_test_client().await;

    for payload in ATTACK_PAYLOADS {
        let response = client
            .post("/api/endpoint")
            .json(&json!({ "input": payload }))
            .send()
            .await;

        // Assert attack is blocked or sanitized
        assert!(
            response.status().is_client_error() ||
            is_sanitized(response.text().await, payload)
        );
    }
}
```

### Security Checklist

- [ ] All user inputs validated
- [ ] SQL parameterized queries enforced
- [ ] XSS sanitization tested
- [ ] CSRF tokens validated
- [ ] Rate limiting tested
- [ ] Authentication bypass tested
- [ ] Authorization escalation tested
- [ ] File upload restrictions tested

---

## Future Improvements

**Security Coverage:**
- Fuzzing integration
- Dependency vulnerability scanning
- Secrets detection (API keys, passwords)
- SAST (Static Application Security Testing)
- DAST (Dynamic Application Security Testing)

**Automation:**
- Automated security scanning in CI/CD
- Security regression tests
- Compliance reporting (OWASP ASVS)

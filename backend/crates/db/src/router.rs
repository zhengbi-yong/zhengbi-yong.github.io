//! Database router for read-write splitting
//!
//! Routes read queries to replica and write queries to primary.

use sqlx::PgPool;

/// Database router for read-write splitting
///
/// When a replica URL is configured, routes:
/// - Read operations (SELECT) → replica
/// - Write operations (INSERT, UPDATE, DELETE) → primary
///
/// When no replica is configured, both read and write go to primary.
#[derive(Clone)]
pub struct DatabaseRouter {
    primary: PgPool,
    read_replica: Option<PgPool>,
}

impl DatabaseRouter {
    /// Create a new database router
    ///
    /// # Arguments
    /// * `primary` - Primary database pool (all writes go here)
    /// * `read_replica` - Optional read replica pool (reads go here if configured)
    pub fn new(primary: PgPool, read_replica: Option<PgPool>) -> Self {
        Self {
            primary,
            read_replica,
        }
    }

    /// Returns the primary pool (for writes)
    pub fn primary(&self) -> &PgPool {
        &self.primary
    }

    /// Returns the read replica pool, or primary if replica not configured
    pub fn read(&self) -> &PgPool {
        self.read_replica.as_ref().unwrap_or(&self.primary)
    }

    /// Check if a replica is configured
    pub fn has_replica(&self) -> bool {
        self.read_replica.is_some()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_has_replica_false_when_none() {
        // This test would need a mock pool, skipping actual implementation
        // In real tests, you'd use a test database connection
    }
}

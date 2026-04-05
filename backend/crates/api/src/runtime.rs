use anyhow::{anyhow, Context, Result};
use blog_migrator::MIGRATOR;
use blog_shared::{DatabasePoolConfig, RedisPoolConfig};
use sqlx::PgPool;
use std::collections::HashMap;
use std::time::Duration;

pub async fn create_postgres_pool(
    database_url: &str,
    config: &DatabasePoolConfig,
) -> Result<PgPool> {
    sqlx::pool::PoolOptions::<sqlx::Postgres>::new()
        .max_connections(config.max_connections)
        .min_connections(config.min_connections)
        .acquire_timeout(Duration::from_secs(config.acquire_timeout_secs))
        .max_lifetime(Duration::from_secs(config.max_lifetime_secs))
        .idle_timeout(Duration::from_secs(config.idle_timeout_secs))
        .connect(database_url)
        .await
        .context("Failed to create PostgreSQL connection pool")
}

/// Create a PostgreSQL connection pool for read replica
///
/// Uses the same pool configuration as the primary database.
/// The replica URL should point to a PostgreSQL instance configured
/// with streaming replication or logical replication from the primary.
pub async fn create_replica_pool(
    database_replica_url: &str,
    config: &DatabasePoolConfig,
) -> Result<PgPool> {
    tracing::info!("Creating database replica connection pool");
    create_postgres_pool(database_replica_url, config).await
}

pub fn create_redis_pool(
    redis_url: &str,
    config: &RedisPoolConfig,
) -> Result<deadpool_redis::Pool> {
    deadpool_redis::Config::from_url(redis_url)
        .builder()
        .context("Failed to create Redis pool builder")?
        .max_size(config.max_size)
        .timeouts(deadpool_redis::Timeouts {
            wait: Some(Duration::from_secs(config.wait_timeout_secs)),
            create: Some(Duration::from_secs(config.create_timeout_secs)),
            recycle: Some(Duration::from_secs(config.recycle_timeout_secs)),
        })
        .runtime(deadpool_redis::Runtime::Tokio1)
        .build()
        .context("Failed to build Redis connection pool")
}

pub async fn run_migrations(db: &PgPool) -> Result<()> {
    blog_migrator::run_migrations(db).await?;

    tracing::info!(
        applied = MIGRATOR
            .iter()
            .filter(|migration| migration.migration_type.is_up_migration())
            .count(),
        "Database migrations applied successfully"
    );

    Ok(())
}

pub async fn verify_migrations(db: &PgPool) -> Result<()> {
    let required_migrations: Vec<_> = MIGRATOR
        .iter()
        .filter(|migration| migration.migration_type.is_up_migration())
        .collect();

    if required_migrations.is_empty() {
        tracing::warn!("No SQLx migrations were compiled into this binary");
        return Ok(());
    }

    let applied_migrations: Vec<AppliedMigrationRow> = sqlx::query_as(
        r#"
        SELECT version, success, checksum
        FROM _sqlx_migrations
        ORDER BY version ASC
        "#,
    )
    .fetch_all(db)
    .await
    .context(
        "Unable to read _sqlx_migrations. Run `cargo run --bin migrate` before starting services.",
    )?;

    if applied_migrations.is_empty() {
        return Err(anyhow!(
            "No database migrations have been applied. Run `cargo run --bin migrate` first."
        ));
    }

    let failed_versions: Vec<i64> = applied_migrations
        .iter()
        .filter(|migration| !migration.success)
        .map(|migration| migration.version)
        .collect();

    if !failed_versions.is_empty() {
        return Err(anyhow!(
            "Database has failed migrations: {}",
            format_versions(&failed_versions)
        ));
    }

    let mut applied_by_version: HashMap<i64, AppliedMigrationRow> = applied_migrations
        .into_iter()
        .map(|migration| (migration.version, migration))
        .collect();

    let mut missing_versions = Vec::new();
    let mut checksum_mismatches = Vec::new();

    for required in &required_migrations {
        match applied_by_version.remove(&required.version) {
            Some(applied) if applied.checksum == required.checksum.as_ref() => {}
            Some(_) => checksum_mismatches.push(required.version),
            None => missing_versions.push(required.version),
        }
    }

    if !missing_versions.is_empty() {
        return Err(anyhow!(
            "Database is missing required migrations: {}",
            format_versions(&missing_versions)
        ));
    }

    if !checksum_mismatches.is_empty() {
        return Err(anyhow!(
            "Applied migrations do not match this binary for versions: {}",
            format_versions(&checksum_mismatches)
        ));
    }

    let unexpected_versions: Vec<i64> = applied_by_version.into_keys().collect();
    if !unexpected_versions.is_empty() {
        return Err(anyhow!(
            "Database schema is newer than this binary. Unexpected applied versions: {}",
            format_versions(&unexpected_versions)
        ));
    }

    tracing::info!(
        applied = required_migrations.len(),
        "Database migrations verified successfully"
    );

    Ok(())
}

pub async fn shutdown_signal(component: &'static str) {
    let ctrl_c = async {
        tokio::signal::ctrl_c()
            .await
            .expect("Failed to install Ctrl+C handler");
    };

    #[cfg(unix)]
    let terminate = async {
        tokio::signal::unix::signal(tokio::signal::unix::SignalKind::terminate())
            .expect("Failed to install SIGTERM handler")
            .recv()
            .await;
    };

    #[cfg(not(unix))]
    let terminate = std::future::pending::<()>();

    tokio::select! {
        _ = ctrl_c => tracing::info!(component, "Received Ctrl+C, starting graceful shutdown"),
        _ = terminate => tracing::info!(component, "Received SIGTERM, starting graceful shutdown"),
    }
}

fn format_versions(versions: &[i64]) -> String {
    let preview: Vec<String> = versions.iter().take(5).map(i64::to_string).collect();
    let suffix = if versions.len() > 5 {
        format!(" (+{} more)", versions.len() - 5)
    } else {
        String::new()
    };

    format!("{}{}", preview.join(", "), suffix)
}

#[derive(sqlx::FromRow)]
struct AppliedMigrationRow {
    version: i64,
    success: bool,
    checksum: Vec<u8>,
}

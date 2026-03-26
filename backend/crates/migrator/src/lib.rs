use anyhow::{Context, Result};
use sqlx::{migrate::Migrator, PgPool};

pub static MIGRATOR: Migrator = sqlx::migrate!("../../migrations");

pub async fn run_migrations(db: &PgPool) -> Result<()> {
    MIGRATOR
        .run(db)
        .await
        .context("Failed to run database migrations")?;

    Ok(())
}

pub async fn run_migrations_from_env() -> Result<()> {
    if std::env::var("DATABASE_URL").is_err() {
        if let Err(error) = dotenv::dotenv() {
            eprintln!(
                "Unable to load .env automatically: {}. Falling back to process environment.",
                error
            );
        }
    }

    let database_url = database_url_from_env()?;

    eprintln!("Connecting to database...");
    let db = PgPool::connect(&database_url)
        .await
        .context("Failed to connect to PostgreSQL for migrations")?;
    eprintln!("Database connection established");

    eprintln!("Running migrations...");
    run_migrations(&db).await?;
    eprintln!("Database migrations completed successfully");

    Ok(())
}

fn database_url_from_env() -> Result<String> {
    if let Ok(database_url) = std::env::var("DATABASE_URL") {
        if !database_url.trim().is_empty() {
            return Ok(database_url);
        }
    }

    let user = std::env::var("POSTGRES_USER").unwrap_or_else(|_| "blog_user".to_string());
    let password =
        std::env::var("POSTGRES_PASSWORD").unwrap_or_else(|_| "blog_password".to_string());
    let database = std::env::var("POSTGRES_DB").unwrap_or_else(|_| "blog_db".to_string());
    let host = std::env::var("POSTGRES_HOST").unwrap_or_else(|_| "localhost".to_string());
    let port = std::env::var("POSTGRES_PORT").unwrap_or_else(|_| "5432".to_string());

    if user.trim().is_empty() || database.trim().is_empty() {
        return Err(anyhow::anyhow!(
            "DATABASE_URL or POSTGRES_USER/POSTGRES_DB must be configured"
        ));
    }

    Ok(format!(
        "postgresql://{}:{}@{}:{}/{}",
        user, password, host, port, database
    ))
}

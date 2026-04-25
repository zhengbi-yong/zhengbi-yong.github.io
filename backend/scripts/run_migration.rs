// One-shot migration runner: executes the migration SQL directly
// Usage: cargo run --bin run_migration
use sqlx::{postgres::PgPoolOptions, PgPool};

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    let database_url = std::env::var("DATABASE_URL")
        .unwrap_or_else(|_| "postgresql://blog_user:blog_password@localhost:5432/blog_db".to_string());

    println!("Connecting to database...");
    let pool = PgPoolOptions::new()
        .max_connections(1)
        .connect(&database_url)
        .await?;

    println!("Running migration: 2026041601_add_content_tracks");
    let sql = include_str!("../migrations/2026041601_add_content_tracks.sql");

    // Split by statements and execute one by one
    for (i, stmt) in sql.split(";").enumerate() {
        let trimmed = stmt.trim();
        if trimmed.is_empty() || trimmed.starts_with("--") {
            continue;
        }
        println!("  Executing statement {}...", i + 1);
        sqlx::query(trimmed).execute(&pool).await?;
    }

    // Also insert into _sqlx_migrations (fake it so future runs don't complain)
    println!("Recording migration in _sqlx_migrations...");
    let version: i64 = 2026041601;
    let name = "2026041601_add_content_tracks";
    let checksum = format!("{:x}", md5::compute(include_str!("../migrations/2026041601_add_content_tracks.sql")));
    sqlx::query(
        r#"
        INSERT INTO _sqlx_migrations (version, name, checksum, executed_at)
        VALUES ($1, $2, $3, NOW())
        ON CONFLICT (version) DO NOTHING
        "#,
    )
    .bind(version)
    .bind(name)
    .bind(&checksum)
    .execute(&pool)
    .await
    .ok(); // ignore if table doesn't exist

    println!("Migration complete.");
    Ok(())
}

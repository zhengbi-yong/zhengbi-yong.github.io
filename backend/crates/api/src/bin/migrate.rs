use anyhow::Result;

#[tokio::main]
async fn main() -> Result<()> {
    // 加载 .env 文件（如果存在）
    if let Err(e) = dotenv::dotenv() {
        eprintln!("⚠️  无法加载 .env 文件: {}. 将使用系统环境变量。", e);
    }

    // 从环境变量加载数据库 URL
    let database_url = std::env::var("DATABASE_URL")
        .map_err(|_| anyhow::anyhow!("DATABASE_URL environment variable is required"))?;

    eprintln!("Connecting to database...");
    let db = sqlx::PgPool::connect(&database_url).await?;
    eprintln!("Database connection established");

    eprintln!("Running migrations...");
    sqlx::migrate!("../../migrations").run(&db).await?;
    eprintln!("✅ Database migrations completed successfully");

    Ok(())
}

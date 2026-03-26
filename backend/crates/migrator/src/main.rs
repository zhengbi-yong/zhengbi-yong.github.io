#[tokio::main]
async fn main() -> anyhow::Result<()> {
    blog_migrator::run_migrations_from_env().await
}

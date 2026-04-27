//! add_content_columns — 一次性迁移脚本：向 posts 表添加 content_json/content_mdx/content_html 列
//!
//! 执行方式：
//!   cd backend
//!   DATABASE_URL='postgresql://blog_user:blog_pass@localhost:5432/blog_db' \
//!   cargo run --bin add_content_columns --release

use std::env;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    let database_url = env::var("DATABASE_URL")
        .unwrap_or_else(|_| "postgresql://blog_user:blog_pass@localhost:5432/blog_db".to_string());

    println!("连接数据库: {}", database_url.replace("blog_pass", "***"));

    let pool = sqlx::postgres::PgPoolOptions::new()
        .max_connections(1)
        .connect(&database_url)
        .await?;

    // 检查列是否已存在
    let existing: Vec<(String,)> = sqlx::query_as(
        "SELECT column_name FROM information_schema.columns WHERE table_name = 'posts' AND column_name IN ('content_json', 'content_mdx', 'content_html')"
    )
    .fetch_all(&pool)
    .await?;

    let existing_names: Vec<&str> = existing.iter().map(|r| r.0.as_str()).collect();

    for col in ["content_json", "content_mdx", "content_html"] {
        if existing_names.contains(&col) {
            println!("  ✓ {} 已存在，跳过", col);
        } else {
            let sql = match col {
                "content_json" => "ALTER TABLE posts ADD COLUMN content_json JSONB",
                "content_mdx" => "ALTER TABLE posts ADD COLUMN content_mdx TEXT",
                "content_html" => "ALTER TABLE posts ADD COLUMN content_html TEXT",
                _ => continue,
            };
            println!("  + 添加 {} ...", col);
            sqlx::query(sql).execute(&pool).await?;
            println!("  ✓ {} 已添加", col);
        }
    }

    // 验证
    let final_cols: Vec<(String,)> = sqlx::query_as(
        "SELECT column_name FROM information_schema.columns WHERE table_name = 'posts' AND column_name IN ('content_json', 'content_mdx', 'content_html') ORDER BY column_name"
    )
    .fetch_all(&pool)
    .await?;

    println!("\n验证: posts 表现在有 {} 个新列:", final_cols.len());
    for (col,) in &final_cols {
        println!("  - {}", col);
    }

    if final_cols.len() == 3 {
        println!("\n✅ 迁移完成！");
    } else {
        println!("\n⚠️ 警告: 预期 3 个列，实际 {} 个", final_cols.len());
    }

    Ok(())
}

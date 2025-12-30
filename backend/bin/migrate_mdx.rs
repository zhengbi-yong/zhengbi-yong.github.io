use std::path::{Path, PathBuf};
use std::fs;
use std::env;
use sqlx::PgPool;
use chrono::DateTime;
use uuid::Uuid;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    // Get database URL from environment
    let database_url = env::var("DATABASE_URL")
        .unwrap_or_else(|_| "postgresql://blog_user:blog_password@localhost:5432/blog_db".to_string());

    let blog_dir = env::var("FRONTEND_BLOG_DIR")
        .unwrap_or_else(|_| "./frontend/data/blog".to_string());

    println!("================================");
    println!("MDX 文件迁移工具");
    println!("================================");
    println!("数据库: {}", database_url);
    println!("文章目录: {}", blog_dir);
    println!("");

    // Connect to database
    println!("1. 连接数据库...");
    let pool = PgPool::connect(&database_url).await?;
    println!("✓ 数据库连接成功");
    println!("");

    // Count MDX files
    println!("2. 扫描 MDX 文件...");
    let mdx_files = find_mdx_files(&blog_dir)?;
    println!("✓ 找到 {} 个 MDX 文件", mdx_files.len());
    println!("", );

    // Migrate files
    println!("3. 开始迁移...");
    let mut success_count = 0;
    let mut error_count = 0;

    for (i, mdx_path) in mdx_files.iter().enumerate() {
        print!("  [{}/{}] {} ... ", i + 1, mdx_files.len(), mdx_path.display());

        match migrate_file(&pool, &mdx_path).await {
            Ok(_) => {
                println!("✓");
                success_count += 1;
            }
            Err(e) => {
                println!("✗ {}", e);
                error_count += 1;
            }
        }
    }

    println!("");
    println!("================================");
    println!("迁移完成！");
    println!("================================");
    println!("成功: {} 个", success_count);
    println!("失败: {} 个", error_count);
    println!("");

    // Verify results
    println!("4. 验证结果...");
    let categories_count: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM categories")
        .fetch_one(&pool).await?;
    let tags_count: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM tags")
        .fetch_one(&pool).await?;
    let posts_count: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM posts")
        .fetch_one(&pool).await?;

    println!("  - 分类: {}", categories_count);
    println!("  - 标签: {}", tags_count);
    println!("  - 文章: {}", posts_count);
    println!("");

    Ok(())
}

fn find_mdx_files(dir: &str) -> Result<Vec<PathBuf>, Box<dyn std::error::Error>> {
    let mut files = Vec::new();
    let blog_path = Path::new(dir);

    if blog_path.exists() {
        fn visit_dirs(dir: &Path, files: &mut Vec<PathBuf>) {
            if dir.is_dir() {
                for entry in fs::read_dir(dir).unwrap() {
                    let entry = entry.unwrap();
                    let path = entry.path();
                    if path.is_dir() {
                        visit_dirs(&path, files);
                    } else if path.extension().and_then(|s| s.to_str()) == Some("mdx") {
                        files.push(path);
                    }
                }
            }
        }
        visit_dirs(blog_path, &mut files);
        files.sort();
    }

    Ok(files)
}

async fn migrate_file(pool: &PgPool, mdx_path: &Path) -> Result<(), String> {
    // Read file content
    let content = fs::read_to_string(mdx_path)
        .map_err(|e| format!("读取文件失败: {}", e))?;

    // Parse frontmatter and content
    let (title, slug, date, category, summary, body) = parse_mdx(&content, mdx_path)?;

    // Get category ID
    let category_id: Option<Uuid> = sqlx::query_scalar(
        "SELECT id FROM categories WHERE slug = $1 OR name = $1 LIMIT 1"
    )
    .bind(&category)
    .fetch_optional(pool)
    .await
    .map_err(|e| format!("查询分类失败: {}", e))?;

    // Check if post already exists
    let exists: bool = sqlx::query_scalar(
        "SELECT EXISTS(SELECT 1 FROM posts WHERE slug = $1)"
    )
    .bind(&slug)
    .fetch_one(pool)
    .await
    .map_err(|e| format!("检查文章是否存在失败: {}", e))?;

    if exists {
        return Err("文章已存在".to_string());
    }

    // Insert post
    sqlx::query(
        r#"
        INSERT INTO posts (
            slug, title, summary, content, status,
            published_at, category_id, view_count, like_count, comment_count
        ) VALUES ($1, $2, $3, $4, 'published', $5, $6, 0, 0, 0)
        "#
    )
    .bind(&slug)
    .bind(&title)
    .bind(&summary)
    .bind(&body)
    .bind(&date)
    .bind(&category_id)
    .execute(pool)
    .await
    .map_err(|e| format!("插入文章失败: {}", e))?;

    Ok(())
}

fn parse_mdx(content: &str, path: &Path) -> Result<(String, String, DateTime<chrono::Utc>, String, String, String), String> {
    let mut lines = content.lines().peekable();

    // Check for frontmatter delimiter
    if lines.peek() != Some(&"---") {
        return Err("缺少 frontmatter".to_string());
    }
    lines.next();

    // Parse frontmatter
    let mut title = String::new();
    let mut date_str = String::new();
    let mut category = String::new();
    let mut summary = String::new();
    let mut tags = Vec::new();

    loop {
        match lines.next() {
            Some("---") => break,
            Some(line) if line.starts_with("title:") => {
                title = line.replacen("title:", "", 1)
                    .trim().trim_matches('"').trim_matches('\'').to_string();
            }
            Some(line) if line.starts_with("date:") => {
                date_str = line.replacen("date:", "", 1).trim().to_string();
            }
            Some(line) if line.starts_with("category:") => {
                category = line.replacen("category:", "", 1)
                    .trim().trim_matches('"').trim_matches('\'').to_string();
            }
            Some(line) if line.starts_with("summary:") => {
                summary = line.replacen("summary:", "", 1)
                    .trim().trim_matches('"').trim_matches('\'').to_string();
            }
            Some(line) if line.starts_with("tags:") => {
                // Parse tags array - simplified
                let tags_str = line.replacen("tags:", "", 1);
                // TODO: Parse tags properly
            }
            Some(_) => {}
            None => return Err("Frontmatter 未正确关闭".to_string()),
        }
    }

    // Generate defaults
    if title.is_empty() {
        title = path.file_stem()
            .and_then(|s| s.to_str())
            .unwrap_or("untitled")
            .to_string();
    }

    let slug = title.to_lowercase()
        .replace(' ', "-")
        .replace('/', "-")
        .chars()
        .filter(|c| c.is_alphanumeric() || *c == '-' || *c == '_')
        .collect::<String>();

    let date = if date_str.is_empty() {
        chrono::Utc::now()
    } else {
        DateTime::parse_from_rfc3339(&format!("{}T00:00:00Z", date_str))
            .or_else(|_| DateTime::parse_from_rfc3339(&format!("{}T00:00:00+00:00", date_str)))
            .map(|dt| dt.with_timezone(&chrono::Utc))
            .unwrap_or_else(|_| chrono::Utc::now())
    };

    if category.is_empty() {
        category = "computer-science".to_string();
    }

    // Collect body content
    let body = lines.collect::<Vec<&str>>().join("\n");

    Ok((title, slug, date, category, summary, body))
}

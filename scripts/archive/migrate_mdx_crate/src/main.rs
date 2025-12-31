use std::path::{Path, PathBuf};
use std::fs;
use std::collections::HashSet;
use sqlx::{PgPool, Transaction};
use chrono::{DateTime, Utc};
use uuid::Uuid;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    // 加载环境变量
    dotenv::dotenv().ok();

    let database_url = std::env::var("DATABASE_URL")
        .unwrap_or_else(|_| "postgresql://blog_user:blog_password@localhost:5432/blog_db".to_string());

    let blog_dir = std::env::var("FRONTEND_BLOG_DIR")
        .unwrap_or_else(|_| {
            let cwd = std::env::current_dir().unwrap();
            cwd.join("../frontend/data/blog").to_str().unwrap().to_string()
        });

    println!();
    println!("========================================");
    println!("   MDX 文件迁移工具 v2.0");
    println!("========================================");
    println!("📂 文章目录: {}", blog_dir);
    println!("🗄️  数据库: {}", database_url.replace(&format!(":{}@", &database_url.split('@').nth(0).unwrap_or("").split(':').nth(3).unwrap_or("5432")), ":***@"));
    println!();

    // 连接数据库
    print!("1️⃣  连接数据库...");
    let pool = PgPool::connect(&database_url).await?;
    println!(" ✓");

    // 扫描 MDX 文件
    print!("2️⃣  扫描 MDX 文件...");
    let mdx_files = find_mdx_files(&blog_dir)?;
    println!(" ✓ (找到 {} 个文件)", mdx_files.len());
    println!();

    // 显示统计信息
    println!("📊 文件统计:");
    for file in &mdx_files {
        let relative = file.strip_prefix(Path::new(&blog_dir)).unwrap_or(file);
        println!("   - {}", relative.display());
    }

    println!();
    print!("3️⃣  开始迁移...");
    println!();

    // 执行迁移
    let result = migrate_all_files(&pool, &mdx_files).await?;

    println!();
    println!("========================================");
    println!("   迁移完成！");
    println!("========================================");
    println!("✅ 成功: {}", result.success);
    println!("⏭️  跳过: {}", result.skipped);
    println!("❌ 失败: {}", result.failed);
    println!();

    // 显示详细结果
    if !result.failed_files.is_empty() {
        println!("❌ 失败的文件:");
        for (file, error) in &result.failed_files {
            println!("   - {}: {}", file, error);
        }
        println!();
    }

    // 验证结果
    println!("4️⃣  验证结果...");
    let stats = get_stats(&pool).await?;
    println!("   📁 分类: {}", stats.categories);
    println!("   🏷️  标签: {}", stats.tags);
    println!("   📝 文章: {}", stats.posts);
    println!();

    if result.failed > 0 {
        println!("⚠️  部分文件迁移失败，请检查上述错误信息");
        println!("💡 提示: 可以重新运行脚本进行重试");
    } else {
        println!("🎉 所有文件迁移成功！");
    }

    println!();

    Ok(())
}

#[derive(Debug)]
struct MigrationResult {
    success: usize,
    skipped: usize,
    failed: usize,
    failed_files: Vec<(String, String)>,
}

#[derive(Debug)]
struct DatabaseStats {
    categories: i64,
    tags: i64,
    posts: i64,
}

async fn migrate_all_files(pool: &PgPool, files: &[PathBuf]) -> Result<MigrationResult, Box<dyn std::error::Error>> {
    let mut result = MigrationResult {
        success: 0,
        skipped: 0,
        failed: 0,
        failed_files: Vec::new(),
    };

    let total = files.len();

    for (index, mdx_path) in files.iter().enumerate() {
        let filename = mdx_path.file_name()
            .and_then(|s| s.to_str())
            .unwrap_or("unknown");

        let relative_path = mdx_path
            .strip_prefix(Path::new("../frontend/data/blog"))
            .or_else(|_| mdx_path.strip_prefix(Path::new("./frontend/data/blog")))
            .or_else(|_| mdx_path.strip_prefix(Path::new("frontend/data/blog")))
            .unwrap_or(mdx_path)
            .to_str()
            .unwrap_or(filename);

        print!("  [{:3}/{}] {} ... ", index + 1, total, filename);

        // 使用事务确保原子性
        match migrate_single_file(pool, mdx_path).await {
            Ok(MigrationStatus::Success) => {
                println!("✓");
                result.success += 1;
            }
            Ok(MigrationStatus::Skipped(reason)) => {
                println!("⏭️  ({})", reason);
                result.skipped += 1;
            }
            Err(e) => {
                println!("✗");
                eprintln!("     错误: {}", e);
                result.failed += 1;
                result.failed_files.push((relative_path.to_string(), e.to_string()));
            }
        }
    }

    Ok(result)
}

enum MigrationStatus {
    Success,
    Skipped(String),
}

async fn migrate_single_file(pool: &PgPool, mdx_path: &Path) -> Result<MigrationStatus, Box<dyn std::error::Error>> {
    // 读取文件内容
    let content = fs::read_to_string(mdx_path)
        .map_err(|e| format!("读取文件失败: {}", e))?;

    // 解析 MDX
    let parsed = parse_mdx_content(&content, mdx_path)?;

    // 检查是否已存在
    let exists = sqlx::query_scalar::<_, bool>(
        "SELECT EXISTS(SELECT 1 FROM posts WHERE slug = $1)"
    )
    .bind(&parsed.slug)
    .fetch_one(pool)
    .await?;

    if exists {
        return Ok(MigrationStatus::Skipped("文章已存在".to_string()));
    }

    // 开始事务
    let mut tx = pool.begin().await?;

    // 获取或创建分类
    let category_id = get_or_create_category(&mut tx, &parsed.category).await?;

    // 插入文章
    let post_id: Uuid = sqlx::query_scalar(
        r#"
        INSERT INTO posts (
            slug, title, summary, content, status,
            published_at, category_id, view_count, like_count, comment_count
        ) VALUES ($1, $2, $3, $4, 'published', $5, $6, 0, 0, 0)
        ON CONFLICT (slug) DO NOTHING
        RETURNING id
        "#
    )
    .bind(&parsed.slug)
    .bind(&parsed.title)
    .bind(&parsed.summary)
    .bind(&parsed.content)
    .bind(parsed.published_at)
    .bind(category_id)
    .fetch_one(&mut *tx)
    .await
    .map_err(|e| format!("插入文章失败: {}", e))?;

    // 关联标签
    for tag_name in &parsed.tags {
        if let Ok(tag_id) = get_or_create_tag(&mut tx, tag_name).await {
            // 关联文章和标签
            sqlx::query(
                "INSERT INTO post_tags (post_id, tag_id) VALUES ($1, $2) ON CONFLICT DO NOTHING"
            )
            .bind(post_id)
            .bind(tag_id)
            .execute(&mut *tx)
            .await
            .ok(); // 忽略标签关联错误
        }
    }

    // 提交事务
    tx.commit().await?;

    Ok(MigrationStatus::Success)
}

async fn get_or_create_category(tx: &mut Transaction<'_, sqlx::Postgres>, name: &str) -> Result<Option<Uuid>, Box<dyn std::error::Error>> {
    // 标准化分类名
    let normalized_name = name.trim().trim_matches('"').trim_matches('\'');

    // 尝试查找现有分类
    let existing: Option<Uuid> = sqlx::query_scalar(
        "SELECT id FROM categories WHERE slug = $1 OR name = $1 LIMIT 1"
    )
    .bind(normalized_name)
    .fetch_optional(&mut **tx)
    .await?;

    if let Some(id) = existing {
        return Ok(Some(id));
    }

    // 创建新分类
    let slug = normalized_name.to_lowercase()
        .replace(' ', "-")
        .replace('/', "-")
        .chars()
        .filter(|c| c.is_alphanumeric() || *c == '-' || *c == '_')
        .collect::<String>();

    // 尝试插入
    let inserted: Option<Uuid> = sqlx::query_scalar(
        "INSERT INTO categories (slug, name, description, display_order) VALUES ($1, $2, $3, 0) ON CONFLICT (slug) DO NOTHING RETURNING id"
    )
    .bind(&slug)
    .bind(normalized_name)
    .bind(format!("{} articles", normalized_name))
    .fetch_optional(&mut **tx)
    .await?;

    if inserted.is_some() {
        return Ok(inserted);
    }

    // 如果插入失败（可能是并发冲突），再次尝试查询
    let retry: Option<Uuid> = sqlx::query_scalar(
        "SELECT id FROM categories WHERE slug = $1 LIMIT 1"
    )
    .bind(&slug)
    .fetch_optional(&mut **tx)
    .await?;

    Ok(retry)
}

async fn get_or_create_tag(tx: &mut Transaction<'_, sqlx::Postgres>, name: &str) -> Result<Uuid, Box<dyn std::error::Error>> {
    let normalized_name = name.trim().trim_matches('"').trim_matches('\'');

    // 查找现有标签
    let existing: Option<Uuid> = sqlx::query_scalar(
        "SELECT id FROM tags WHERE slug = $1 OR name = $1 LIMIT 1"
    )
    .bind(normalized_name)
    .fetch_optional(&mut **tx)
    .await?;

    if let Some(id) = existing {
        return Ok(id);
    }

    // 创建新标签
    let slug = normalized_name.to_lowercase()
        .replace(' ', "-")
        .chars()
        .filter(|c| c.is_alphanumeric() || *c == '-' || *c == '_')
        .collect::<String>();

    let id: Uuid = sqlx::query_scalar(
        "INSERT INTO tags (slug, name, description) VALUES ($1, $2, $3) ON CONFLICT (slug) DO NOTHING RETURNING id"
    )
    .bind(&slug)
    .bind(normalized_name)
    .bind(format!("{} related", normalized_name))
    .fetch_optional(&mut **tx)
    .await?
    .ok_or_else(|| format!("创建标签失败: {}", normalized_name))?;

    Ok(id)
}

async fn get_stats(pool: &PgPool) -> Result<DatabaseStats, Box<dyn std::error::Error>> {
    let categories: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM categories")
        .fetch_one(pool).await?;
    let tags: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM tags")
        .fetch_one(pool).await?;
    let posts: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM posts")
        .fetch_one(pool).await?;

    Ok(DatabaseStats { categories, tags, posts })
}

fn find_mdx_files(dir: &str) -> Result<Vec<PathBuf>, Box<dyn std::error::Error>> {
    let mut files = Vec::new();
    let dir_path = Path::new(dir);

    if dir_path.exists() {
        fn visit_dirs(path: &Path, files: &mut Vec<PathBuf>) {
            if path.is_dir() {
                if let Ok(entries) = fs::read_dir(path) {
                    for entry in entries {
                        if let Ok(entry) = entry {
                            let entry_path = entry.path();
                            if entry_path.is_dir() {
                                visit_dirs(&entry_path, files);
                            } else if entry_path.extension().and_then(|s| s.to_str()) == Some("mdx") {
                                files.push(entry_path);
                            }
                        }
                    }
                }
            }
        }
        visit_dirs(dir_path, &mut files);
        files.sort();
    }

    Ok(files)
}

#[derive(Debug)]
struct ParsedMdx {
    title: String,
    slug: String,
    summary: String,
    content: String,
    published_at: DateTime<Utc>,
    category: String,
    tags: Vec<String>,
}

fn parse_mdx_content(content: &str, path: &Path) -> Result<ParsedMdx, Box<dyn std::error::Error>> {
    let mut lines = content.lines().collect::<Vec<&str>>();

    // 检查 frontmatter
    if lines.is_empty() || lines[0] != "---" {
        return Err("文件缺少 frontmatter (需要以 --- 开头)".into());
    }

    // 解析 frontmatter
    let mut frontmatter_end = 0;
    let mut title = String::new();
    let mut date_str = String::new();
    let mut category = String::new();
    let mut summary = String::new();
    let mut tags_str = String::new();

    for (i, line) in lines.iter().enumerate().skip(1) {
        if *line == "---" {
            frontmatter_end = i;
            break;
        }

        if let Some(rest) = line.strip_prefix("title:") {
            title = rest.trim().trim_matches('"').trim_matches('\'').to_string();
        } else if let Some(rest) = line.strip_prefix("date:") {
            date_str = rest.trim().to_string();
        } else if let Some(rest) = line.strip_prefix("category:") {
            category = rest.trim().trim_matches('"').trim_matches('\'').to_string();
        } else if let Some(rest) = line.strip_prefix("summary:") {
            summary = rest.trim().trim_matches('"').trim_matches('\'').to_string();
        } else if let Some(rest) = line.strip_prefix("tags:") {
            tags_str = rest.trim().to_string();
        }
    }

    if frontmatter_end == 0 {
        return Err("Frontmatter 未正确关闭 (需要以 --- 结束)".into());
    }

    // 默认值
    if title.is_empty() {
        title = path.file_stem()
            .and_then(|s| s.to_str())
            .unwrap_or("untitled")
            .to_string();
    }

    // 生成 slug
    let slug = title.to_lowercase()
        .replace(' ', "-")
        .replace('/', "-")
        .replace('【', "-")
        .replace('】', "-")
        .replace('（', "-")
        .replace('）', "-")
        .replace('：', "-")
        .chars()
        .filter(|c| c.is_alphanumeric() || *c == '-' || *c == '_')
        .collect::<String>();

    // 解析日期
    let published_at = if date_str.is_empty() {
        Utc::now()
    } else {
        // 尝试多种日期格式
        let clean_date = date_str.trim().trim_matches('"').trim_matches('\'');

        DateTime::parse_from_rfc3339(&format!("{}T00:00:00Z", clean_date))
            .or_else(|_| DateTime::parse_from_rfc3339(&format!("{}T00:00:00+00:00", clean_date)))
            .or_else(|_| DateTime::parse_from_rfc2822(clean_date))
            .map(|dt| dt.with_timezone(&Utc))
            .unwrap_or_else(|_| {
                // 尝试 YYYY-MM-DD 格式
                clean_date.parse::<chrono::NaiveDate>()
                    .ok()
                    .and_then(|d| d.and_hms_opt(0, 0, 0))
                    .map(|dt| DateTime::from_naive_utc_and_offset(dt, Utc))
                    .unwrap_or(Utc::now())
            })
    };

    // 智能分类默认值
    if category.is_empty() {
        // 根据文件路径推断分类
        if let Some(parent) = path.parent() {
            if let Some(folder_name) = parent.file_name().and_then(|s| s.to_str()) {
                if folder_name != "blog" {
                    category = folder_name.to_string();
                }
            }
        }

        if category.is_empty() {
            category = "computer-science".to_string();
        }
    }

    // 解析标签
    let tags = parse_tags(&tags_str);

    // 提取正文内容
    let content = lines[frontmatter_end + 1..].join("\n");

    Ok(ParsedMdx {
        title,
        slug,
        summary,
        content,
        published_at,
        category,
        tags,
    })
}

fn parse_tags(tags_str: &str) -> Vec<String> {
    let mut tags = Vec::new();

    let cleaned = tags_str.trim().trim_matches('[').trim_matches(']');

    if cleaned.is_empty() {
        return tags;
    }

    // 尝试解析为数组
    if let Ok(array) = serde_json::from_str::<Vec<String>>(tags_str) {
        return array;
    }

    // 手动解析 (逗号分隔)
    for part in cleaned.split(',') {
        let tag = part.trim()
            .trim_matches('"')
            .trim_matches('\'')
            .trim()
            .to_string();

        if !tag.is_empty() {
            tags.push(tag);
        }
    }

    tags
}

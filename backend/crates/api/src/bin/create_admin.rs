use blog_core::JwtService;
use sqlx::PgPool;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    let database_url = std::env::var("DATABASE_URL").unwrap_or_else(|_| {
        "postgresql://blog_user:blog_password@localhost:5432/blog_db".to_string()
    });

    println!("Connecting to database...");
    let pool = PgPool::connect(&database_url).await?;

    // Create JWT service for password hashing
    let jwt_service = JwtService::new(
        &std::env::var("JWT_SECRET")
            .unwrap_or_else(|_| "dev-secret-key-for-testing-only-32-chars".to_string()),
    )?;

    // Admin user details
    let email = "admin@test.com";
    let username = "admin";
    let password = "xK9#mP2$vL8@nQ5*wR4";

    println!("Creating admin user: {}", email);

    // Hash password
    let password_hash = jwt_service.hash_password(password)?;

    // Check if user exists
    let existing = sqlx::query_scalar::<_, Option<uuid::Uuid>>(
        "SELECT id FROM users WHERE email = $1 AND deleted_at IS NULL",
    )
    .bind(&email)
    .fetch_optional(&pool)
    .await?;

    match existing {
        Some(user_id) => {
            // Update existing user
            sqlx::query!(
                r#"
                UPDATE users SET
                    role = 'admin',
                    email_verified = true,
                    password_hash = $1
                WHERE id = $2
                "#,
                password_hash,
                user_id
            )
            .execute(&pool)
            .await?;
            println!("✅ 已更新管理员用户: {}", email);
        }
        None => {
            // Insert new admin user
            sqlx::query!(
                r#"
                INSERT INTO users (email, username, password_hash, role, email_verified)
                VALUES ($1, $2, $3, 'admin', true)
                "#,
                email,
                username,
                password_hash
            )
            .execute(&pool)
            .await?;
            println!("✅ 已创建管理员用户: {}", email);
        }
    }
    println!();
    println!("  管理员邮箱: {}", email);
    println!("  用户名: {}", username);
    println!("  Role: admin");
    println!("\nLogin credentials:");
    println!("  Email: {}", email);
    println!("  Password: {}", password);

    Ok(())
}

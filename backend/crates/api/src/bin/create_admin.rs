use sqlx::PgPool;
use blog_core::JwtService;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    let database_url = std::env::var("DATABASE_URL")
        .unwrap_or_else(|_| "postgresql://blog_user:blog_password@localhost:5432/blog_db".to_string());

    println!("Connecting to database...");
    let pool = PgPool::connect(&database_url).await?;

    // Create JWT service for password hashing
    let jwt_service = JwtService::new(
        &std::env::var("JWT_SECRET").unwrap_or_else(|_| "dev-secret-key-for-testing-only-32-chars".to_string())
    )?;

    // Admin user details
    let email = "admin@test.com";
    let username = "admin";
    let password = "xK9#mP2$vL8@nQ5*wR4";

    println!("Creating admin user: {}", email);

    // Hash password
    let password_hash = jwt_service.hash_password(password)?;

    // Insert or update admin user
    let result = sqlx::query!(
        r#"
        INSERT INTO users (email, username, password_hash, role, email_verified)
        VALUES ($1, $2, $3, 'admin', true)
        ON CONFLICT (email) DO UPDATE SET
            role = 'admin',
            email_verified = true,
            password_hash = CASE WHEN $4 THEN EXCLUDED.password_hash ELSE users.password_hash END
        RETURNING id, email, username, role
        "#,
        email,
        username,
        password_hash,
        false  // Don't overwrite existing password
    )
    .fetch_one(&pool)
    .await?;

    println!("✓ Admin user created/updated:");
    println!("  ID: {}", result.id);
    println!("  Email: {}", result.email);
    println!("  Username: {}", result.username);
    println!("  Role: {}", result.role);
    println!("\nLogin credentials:");
    println!("  Email: {}", email);
    println!("  Password: {}", password);

    Ok(())
}

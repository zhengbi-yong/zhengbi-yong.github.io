use serde::Deserialize;
use std::env;

#[derive(Debug, Clone, Deserialize)]
pub struct Settings {
    pub database_url: String,
    pub redis_url: String,
    pub jwt_secret: String,
    pub password_pepper: String,
    pub server_host: String,
    pub server_port: u16,
    pub smtp: SmtpConfig,
    pub cors: CorsConfig,
    pub rate_limit: RateLimitConfig,
}

#[derive(Debug, Clone, Deserialize)]
pub struct SmtpConfig {
    pub host: String,
    pub port: u16,
    pub username: String,
    pub password: String,
    pub from: String,
    pub tls: bool,
}

#[derive(Debug, Clone, Deserialize)]
pub struct CorsConfig {
    pub allowed_origins: Vec<String>,
    pub allowed_methods: Vec<String>,
    pub allowed_headers: Vec<String>,
}

impl CorsConfig {
    /// 验证 CORS 配置
    pub fn validate(&self) -> anyhow::Result<()> {
        for origin in &self.allowed_origins {
            // 不允许通配符 origin
            if origin == "*" {
                anyhow::bail!("CORS: 通配符 origin (*) 不允许在生产环境使用");
            }

            // 验证格式
            if let Err(e) = origin.parse::<axum::http::HeaderValue>() {
                anyhow::bail!("CORS: 无效的 origin '{}': {}", origin, e);
            }

            // 如果是 URL，验证 scheme
            if let Ok(url) = url::Url::parse(origin) {
                // 只允许 http 和 https
                if !matches!(url.scheme(), "http" | "https") {
                    anyhow::bail!("CORS: origin '{}' 的 scheme 无效: {}", origin, url.scheme());
                }

                // 生产环境强制 HTTPS
                if std::env::var("ENVIRONMENT").unwrap_or_default() == "production"
                    && url.scheme() != "https" {
                    tracing::warn!("CORS: 生产环境建议使用 HTTPS origin: {}", origin);
                }
            }
        }

        Ok(())
    }
}

#[derive(Debug, Clone, Deserialize)]
pub struct RateLimitConfig {
    pub auth_rps: u32,    // 认证相关请求每秒限制
    pub auth_rpm: u32,    // 认证相关请求每分钟限制
    pub view_rps: u32,    // 浏览相关请求每秒限制
    pub view_rpm: u32,    // 浏览相关请求每分钟限制
    pub comment_rps: u32, // 评论相关请求每秒限制
    pub comment_rpm: u32, // 评论相关请求每分钟限制
    pub default_rps: u32, // 默认每秒限制
    pub default_rpm: u32, // 默认每分钟限制
}

impl Settings {
    /// 从环境变量加载配置
    pub fn from_env() -> anyhow::Result<Self> {
        let settings = Self {
            database_url: env::var("DATABASE_URL")
                .map_err(|_| anyhow::anyhow!("DATABASE_URL must be set"))?,
            redis_url: env::var("REDIS_URL")
                .map_err(|_| anyhow::anyhow!("REDIS_URL must be set"))?,
            jwt_secret: env::var("JWT_SECRET")
                .map_err(|_| anyhow::anyhow!("JWT_SECRET must be set"))?,
            password_pepper: env::var("PASSWORD_PEPPER")
                .map_err(|_| anyhow::anyhow!("PASSWORD_PEPPER must be set"))?,
            server_host: env::var("SERVER_HOST").unwrap_or_else(|_| "0.0.0.0".to_string()),
            server_port: env::var("SERVER_PORT")
                .unwrap_or_else(|_| "3000".to_string())
                .parse()
                .map_err(|_| anyhow::anyhow!("Invalid SERVER_PORT"))?,
            smtp: SmtpConfig {
                host: env::var("SMTP_HOST").unwrap_or_else(|_| "localhost".to_string()),
                port: env::var("SMTP_PORT")
                    .unwrap_or_else(|_| "587".to_string())
                    .parse()
                    .map_err(|_| anyhow::anyhow!("Invalid SMTP_PORT"))?,
                username: env::var("SMTP_USERNAME")
                    .map_err(|_| anyhow::anyhow!("SMTP_USERNAME must be set"))?,
                password: env::var("SMTP_PASSWORD")
                    .map_err(|_| anyhow::anyhow!("SMTP_PASSWORD must be set"))?,
                from: env::var("SMTP_FROM")
                    .map_err(|_| anyhow::anyhow!("SMTP_FROM must be set"))?,
                tls: env::var("SMTP_TLS")
                    .unwrap_or_else(|_| "true".to_string())
                    .parse()
                    .map_err(|_| anyhow::anyhow!("Invalid SMTP_TLS"))?,
            },
            cors: CorsConfig {
                allowed_origins: env::var("CORS_ALLOWED_ORIGINS")
                    .unwrap_or_else(|_| {
                        "https://yourdomain.com,https://www.yourdomain.com".to_string()
                    })
                    .split(',')
                    .map(|s| s.trim().to_string())
                    .collect(),
                allowed_methods: env::var("CORS_ALLOWED_METHODS")
                    .unwrap_or_else(|_| "GET,POST,PUT,DELETE,OPTIONS".to_string())
                    .split(',')
                    .map(|s| s.trim().to_string())
                    .collect(),
                allowed_headers: env::var("CORS_ALLOWED_HEADERS")
                    .unwrap_or_else(|_| "Authorization,Content-Type,Accept".to_string())
                    .split(',')
                    .map(|s| s.trim().to_string())
                    .collect(),
            },
            rate_limit: RateLimitConfig {
                auth_rps: env::var("RATE_LIMIT_AUTH_RPS")
                    .unwrap_or_else(|_| "5".to_string())
                    .parse()
                    .map_err(|_| anyhow::anyhow!("Invalid RATE_LIMIT_AUTH_RPS"))?,
                auth_rpm: env::var("RATE_LIMIT_AUTH_RPM")
                    .unwrap_or_else(|_| "100".to_string())
                    .parse()
                    .map_err(|_| anyhow::anyhow!("Invalid RATE_LIMIT_AUTH_RPM"))?,
                view_rps: env::var("RATE_LIMIT_VIEW_RPS")
                    .unwrap_or_else(|_| "10".to_string())
                    .parse()
                    .map_err(|_| anyhow::anyhow!("Invalid RATE_LIMIT_VIEW_RPS"))?,
                view_rpm: env::var("RATE_LIMIT_VIEW_RPM")
                    .unwrap_or_else(|_| "1000".to_string())
                    .parse()
                    .map_err(|_| anyhow::anyhow!("Invalid RATE_LIMIT_VIEW_RPM"))?,
                comment_rps: env::var("RATE_LIMIT_COMMENT_RPS")
                    .unwrap_or_else(|_| "2".to_string())
                    .parse()
                    .map_err(|_| anyhow::anyhow!("Invalid RATE_LIMIT_COMMENT_RPS"))?,
                comment_rpm: env::var("RATE_LIMIT_COMMENT_RPM")
                    .unwrap_or_else(|_| "20".to_string())
                    .parse()
                    .map_err(|_| anyhow::anyhow!("Invalid RATE_LIMIT_COMMENT_RPM"))?,
                default_rps: env::var("RATE_LIMIT_DEFAULT_RPS")
                    .unwrap_or_else(|_| "100".to_string())
                    .parse()
                    .map_err(|_| anyhow::anyhow!("Invalid RATE_LIMIT_DEFAULT_RPS"))?,
                default_rpm: env::var("RATE_LIMIT_DEFAULT_RPM")
                    .unwrap_or_else(|_| "6000".to_string())
                    .parse()
                    .map_err(|_| anyhow::anyhow!("Invalid RATE_LIMIT_DEFAULT_RPM"))?,
            },
        };

        // 验证 CORS 配置
        settings.cors.validate()?;

        Ok(settings)
    }

    /// 创建示例 .env 文件内容
    pub fn env_example() -> String {
        r#"# Database
DATABASE_URL=postgresql://user:password@localhost:5432/blog
REDIS_URL=redis://localhost:6379

# JWT
JWT_SECRET=your-super-secret-jwt-key-at-least-32-characters-long

# Password pepper for additional security
PASSWORD_PEPPER=your-password-pepper-string-32-chars

# Server
SERVER_HOST=0.0.0.0
SERVER_PORT=3000

# SMTP (for email notifications)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_FROM=noreply@yourdomain.com
SMTP_TLS=true

# CORS
CORS_ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
CORS_ALLOWED_METHODS=GET,POST,PUT,DELETE,OPTIONS
CORS_ALLOWED_HEADERS=Authorization,Content-Type,Accept

# Rate Limiting (requests per second/minute)
RATE_LIMIT_AUTH_RPS=5
RATE_LIMIT_AUTH_RPM=100
RATE_LIMIT_VIEW_RPS=10
RATE_LIMIT_VIEW_RPM=1000
RATE_LIMIT_COMMENT_RPS=2
RATE_LIMIT_COMMENT_RPM=20
RATE_LIMIT_DEFAULT_RPS=100
RATE_LIMIT_DEFAULT_RPM=6000
"#
        .to_string()
    }
}

// 为了支持配置的 JSON 反序列化，需要添加 serde 依赖
#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_default_values() {
        // 设置测试环境变量
        env::set_var("DATABASE_URL", "postgresql://test@localhost/test");
        env::set_var("REDIS_URL", "redis://localhost");
        env::set_var("JWT_SECRET", "test-secret-key-32-characters-long");
        env::set_var("SMTP_USERNAME", "test@example.com");
        env::set_var("SMTP_PASSWORD", "test-password");
        env::set_var("SMTP_FROM", "test@example.com");

        let settings = Settings::from_env().unwrap();

        assert_eq!(settings.server_host, "0.0.0.0");
        assert_eq!(settings.server_port, 3000);
        assert_eq!(settings.rate_limit.auth_rps, 5);
        assert_eq!(settings.smtp.tls, true);
    }
}
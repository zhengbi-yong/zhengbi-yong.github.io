use serde::Deserialize;
use std::env;

#[derive(Debug, Clone, Deserialize)]
pub struct Settings {
    pub database_url: String,
    pub database_replica_url: Option<String>,
    pub redis_url: String,
    pub jwt_secret: String,
    pub password_pepper: String,
    pub server_host: String,
    pub server_port: u16,
    pub database_pool: DatabasePoolConfig,
    pub redis_pool: RedisPoolConfig,
    pub worker: WorkerConfig,
    pub health: HealthConfig,
    pub smtp: SmtpConfig,
    pub cors: CorsConfig,
    pub rate_limit: RateLimitConfig,
    pub meilisearch: Option<MeilisearchConfig>,
}

#[derive(Debug, Clone, Deserialize)]
pub struct DatabasePoolConfig {
    pub max_connections: u32,
    pub min_connections: u32,
    pub acquire_timeout_secs: u64,
    pub max_lifetime_secs: u64,
    pub idle_timeout_secs: u64,
}

#[derive(Debug, Clone, Deserialize)]
pub struct RedisPoolConfig {
    pub max_size: usize,
    pub wait_timeout_secs: u64,
    pub create_timeout_secs: u64,
    pub recycle_timeout_secs: u64,
}

#[derive(Debug, Clone, Deserialize)]
pub struct WorkerConfig {
    pub poll_interval_secs: u64,
    pub batch_size: u32,
    pub lock_timeout_secs: i32,
}

#[derive(Debug, Clone, Deserialize)]
pub struct HealthConfig {
    pub outbox_pending_warn_threshold: i64,
    pub outbox_pending_fail_threshold: i64,
    pub outbox_oldest_warn_secs: i64,
    pub outbox_oldest_fail_secs: i64,
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
                    && url.scheme() != "https"
                {
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
    pub failure_mode: RateLimitFailureMode,
}

#[derive(Debug, Clone, Deserialize)]
pub struct MeilisearchConfig {
    pub url: String,
    pub master_key: String,
    pub index_name: String,
    pub auto_sync_on_startup: bool,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum RateLimitFailureMode {
    FailOpen,
    FailClosed,
}

impl RateLimitFailureMode {
    fn from_env() -> anyhow::Result<Self> {
        let raw_value =
            env::var("RATE_LIMIT_FAILURE_MODE").unwrap_or_else(|_| "fail_closed".to_string());

        match raw_value.trim().to_ascii_lowercase().as_str() {
            "fail_open" | "open" => Ok(Self::FailOpen),
            "fail_closed" | "closed" => Ok(Self::FailClosed),
            value => anyhow::bail!(
                "Invalid RATE_LIMIT_FAILURE_MODE '{}'. Expected fail_open or fail_closed",
                value
            ),
        }
    }
}

impl Settings {
    /// 从环境变量加载配置
    pub fn from_env() -> anyhow::Result<Self> {
        let settings = Self {
            database_url: env::var("DATABASE_URL")
                .map_err(|_| anyhow::anyhow!("DATABASE_URL must be set"))?,
            database_replica_url: env::var("DATABASE_REPLICA_URL").ok(),
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
            database_pool: DatabasePoolConfig {
                max_connections: env::var("DATABASE_POOL_MAX_CONNECTIONS")
                    .unwrap_or_else(|_| "20".to_string())
                    .parse()
                    .map_err(|_| anyhow::anyhow!("Invalid DATABASE_POOL_MAX_CONNECTIONS"))?,
                min_connections: env::var("DATABASE_POOL_MIN_CONNECTIONS")
                    .unwrap_or_else(|_| "5".to_string())
                    .parse()
                    .map_err(|_| anyhow::anyhow!("Invalid DATABASE_POOL_MIN_CONNECTIONS"))?,
                acquire_timeout_secs: env::var("DATABASE_POOL_ACQUIRE_TIMEOUT_SECS")
                    .unwrap_or_else(|_| "10".to_string())
                    .parse()
                    .map_err(|_| anyhow::anyhow!("Invalid DATABASE_POOL_ACQUIRE_TIMEOUT_SECS"))?,
                max_lifetime_secs: env::var("DATABASE_POOL_MAX_LIFETIME_SECS")
                    .unwrap_or_else(|_| "1800".to_string())
                    .parse()
                    .map_err(|_| anyhow::anyhow!("Invalid DATABASE_POOL_MAX_LIFETIME_SECS"))?,
                idle_timeout_secs: env::var("DATABASE_POOL_IDLE_TIMEOUT_SECS")
                    .unwrap_or_else(|_| "600".to_string())
                    .parse()
                    .map_err(|_| anyhow::anyhow!("Invalid DATABASE_POOL_IDLE_TIMEOUT_SECS"))?,
            },
            redis_pool: RedisPoolConfig {
                max_size: env::var("REDIS_POOL_MAX_SIZE")
                    .unwrap_or_else(|_| "10".to_string())
                    .parse()
                    .map_err(|_| anyhow::anyhow!("Invalid REDIS_POOL_MAX_SIZE"))?,
                wait_timeout_secs: env::var("REDIS_POOL_WAIT_TIMEOUT_SECS")
                    .unwrap_or_else(|_| "5".to_string())
                    .parse()
                    .map_err(|_| anyhow::anyhow!("Invalid REDIS_POOL_WAIT_TIMEOUT_SECS"))?,
                create_timeout_secs: env::var("REDIS_POOL_CREATE_TIMEOUT_SECS")
                    .unwrap_or_else(|_| "5".to_string())
                    .parse()
                    .map_err(|_| anyhow::anyhow!("Invalid REDIS_POOL_CREATE_TIMEOUT_SECS"))?,
                recycle_timeout_secs: env::var("REDIS_POOL_RECYCLE_TIMEOUT_SECS")
                    .unwrap_or_else(|_| "5".to_string())
                    .parse()
                    .map_err(|_| anyhow::anyhow!("Invalid REDIS_POOL_RECYCLE_TIMEOUT_SECS"))?,
            },
            worker: WorkerConfig {
                poll_interval_secs: env::var("WORKER_POLL_INTERVAL_SECS")
                    .unwrap_or_else(|_| "5".to_string())
                    .parse()
                    .map_err(|_| anyhow::anyhow!("Invalid WORKER_POLL_INTERVAL_SECS"))?,
                batch_size: env::var("WORKER_BATCH_SIZE")
                    .unwrap_or_else(|_| "100".to_string())
                    .parse()
                    .map_err(|_| anyhow::anyhow!("Invalid WORKER_BATCH_SIZE"))?,
                lock_timeout_secs: env::var("WORKER_LOCK_TIMEOUT_SECS")
                    .unwrap_or_else(|_| "300".to_string())
                    .parse()
                    .map_err(|_| anyhow::anyhow!("Invalid WORKER_LOCK_TIMEOUT_SECS"))?,
            },
            health: HealthConfig {
                outbox_pending_warn_threshold: env::var("HEALTH_OUTBOX_PENDING_WARN_THRESHOLD")
                    .unwrap_or_else(|_| "1000".to_string())
                    .parse()
                    .map_err(|_| anyhow::anyhow!("Invalid HEALTH_OUTBOX_PENDING_WARN_THRESHOLD"))?,
                outbox_pending_fail_threshold: env::var("HEALTH_OUTBOX_PENDING_FAIL_THRESHOLD")
                    .unwrap_or_else(|_| "5000".to_string())
                    .parse()
                    .map_err(|_| anyhow::anyhow!("Invalid HEALTH_OUTBOX_PENDING_FAIL_THRESHOLD"))?,
                outbox_oldest_warn_secs: env::var("HEALTH_OUTBOX_OLDEST_WARN_SECS")
                    .unwrap_or_else(|_| "60".to_string())
                    .parse()
                    .map_err(|_| anyhow::anyhow!("Invalid HEALTH_OUTBOX_OLDEST_WARN_SECS"))?,
                outbox_oldest_fail_secs: env::var("HEALTH_OUTBOX_OLDEST_FAIL_SECS")
                    .unwrap_or_else(|_| "300".to_string())
                    .parse()
                    .map_err(|_| anyhow::anyhow!("Invalid HEALTH_OUTBOX_OLDEST_FAIL_SECS"))?,
            },
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
                failure_mode: RateLimitFailureMode::from_env()?,
            },
            meilisearch: match env::var("MEILISEARCH_URL") {
                Ok(url) if !url.trim().is_empty() => Some(MeilisearchConfig {
                    url,
                    master_key: env::var("MEILISEARCH_MASTER_KEY").map_err(|_| {
                        anyhow::anyhow!(
                            "MEILISEARCH_MASTER_KEY must be set when MEILISEARCH_URL is configured"
                        )
                    })?,
                    index_name: env::var("MEILISEARCH_INDEX")
                        .unwrap_or_else(|_| "posts".to_string()),
                    auto_sync_on_startup: env::var("MEILISEARCH_AUTO_SYNC")
                        .unwrap_or_else(|_| "false".to_string())
                        .parse()
                        .map_err(|_| anyhow::anyhow!("Invalid MEILISEARCH_AUTO_SYNC"))?,
                }),
                Ok(_) | Err(_) => None,
            },
        };

        // 验证 CORS 配置
        settings.cors.validate()?;
        validate_runtime_config(&settings)?;

        Ok(settings)
    }

    /// 创建示例 .env 文件内容
    pub fn env_example() -> String {
        r#"# Core runtime
ENVIRONMENT=development
RUST_LOG=info
SERVER_HOST=0.0.0.0
SERVER_PORT=3000

# Database
DATABASE_URL=postgresql://blog_user:blog_password@localhost:5432/blog_db
# Optional: replica for read-write splitting (uses same DB if not set)
DATABASE_REPLICA_URL=postgresql://blog_user:blog_password@localhost:5433/blog_db
REDIS_URL=redis://localhost:6379

# Database pool
DATABASE_POOL_MAX_CONNECTIONS=20
DATABASE_POOL_MIN_CONNECTIONS=5
DATABASE_POOL_ACQUIRE_TIMEOUT_SECS=10
DATABASE_POOL_MAX_LIFETIME_SECS=1800
DATABASE_POOL_IDLE_TIMEOUT_SECS=600

# Redis pool
REDIS_POOL_MAX_SIZE=10
REDIS_POOL_WAIT_TIMEOUT_SECS=5
REDIS_POOL_CREATE_TIMEOUT_SECS=5
REDIS_POOL_RECYCLE_TIMEOUT_SECS=5

# Worker
WORKER_POLL_INTERVAL_SECS=5
WORKER_BATCH_SIZE=100
WORKER_LOCK_TIMEOUT_SECS=300

# Health / backlog thresholds
HEALTH_OUTBOX_PENDING_WARN_THRESHOLD=1000
HEALTH_OUTBOX_PENDING_FAIL_THRESHOLD=5000
HEALTH_OUTBOX_OLDEST_WARN_SECS=60
HEALTH_OUTBOX_OLDEST_FAIL_SECS=300

# Auth
JWT_SECRET=replace-with-a-32-byte-secret
PASSWORD_PEPPER=replace-with-a-separate-32-byte-secret

# SMTP
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_FROM=noreply@example.com
SMTP_TLS=true

# CORS
CORS_ALLOWED_ORIGINS=http://localhost:3001
CORS_ALLOWED_METHODS=GET,POST,PUT,DELETE,OPTIONS
CORS_ALLOWED_HEADERS=Authorization,Content-Type,Accept

# Rate limiting
RATE_LIMIT_AUTH_RPS=5
RATE_LIMIT_AUTH_RPM=100
RATE_LIMIT_VIEW_RPS=10
RATE_LIMIT_VIEW_RPM=1000
RATE_LIMIT_COMMENT_RPS=2
RATE_LIMIT_COMMENT_RPM=20
RATE_LIMIT_DEFAULT_RPS=100
RATE_LIMIT_DEFAULT_RPM=6000
RATE_LIMIT_FAILURE_MODE=fail_open

# Storage backend
STORAGE_BACKEND=local
STORAGE_LOCAL_PATH=./uploads
STORAGE_LOCAL_URL=/uploads

# MinIO / S3-compatible storage
MINIO_ENDPOINT=http://localhost:9000
MINIO_PUBLIC_URL=http://localhost:9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=change-me
MINIO_BUCKET=blog-uploads
MINIO_REGION=us-east-1

# Meilisearch
MEILISEARCH_URL=http://localhost:7700
MEILISEARCH_MASTER_KEY=change-me-in-production
MEILISEARCH_INDEX=posts
MEILISEARCH_AUTO_SYNC=false

# OpenTelemetry
OTEL_ENABLED=false
OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4318
OTEL_SERVICE_NAME=blog-api
OTEL_SERVICE_VERSION=0.1.0
"#
        .to_string()
    }
}

fn validate_runtime_config(settings: &Settings) -> anyhow::Result<()> {
    if settings.database_pool.max_connections == 0 {
        anyhow::bail!("DATABASE_POOL_MAX_CONNECTIONS must be greater than 0");
    }

    if settings.database_pool.min_connections > settings.database_pool.max_connections {
        anyhow::bail!(
            "DATABASE_POOL_MIN_CONNECTIONS must be less than or equal to DATABASE_POOL_MAX_CONNECTIONS"
        );
    }

    if settings.redis_pool.max_size == 0 {
        anyhow::bail!("REDIS_POOL_MAX_SIZE must be greater than 0");
    }

    if settings.worker.poll_interval_secs == 0 {
        anyhow::bail!("WORKER_POLL_INTERVAL_SECS must be greater than 0");
    }

    if settings.worker.batch_size == 0 {
        anyhow::bail!("WORKER_BATCH_SIZE must be greater than 0");
    }

    if settings.worker.lock_timeout_secs <= 0 {
        anyhow::bail!("WORKER_LOCK_TIMEOUT_SECS must be greater than 0");
    }

    for (name, value) in [
        ("RATE_LIMIT_AUTH_RPS", settings.rate_limit.auth_rps),
        ("RATE_LIMIT_AUTH_RPM", settings.rate_limit.auth_rpm),
        ("RATE_LIMIT_VIEW_RPS", settings.rate_limit.view_rps),
        ("RATE_LIMIT_VIEW_RPM", settings.rate_limit.view_rpm),
        ("RATE_LIMIT_COMMENT_RPS", settings.rate_limit.comment_rps),
        ("RATE_LIMIT_COMMENT_RPM", settings.rate_limit.comment_rpm),
        ("RATE_LIMIT_DEFAULT_RPS", settings.rate_limit.default_rps),
        ("RATE_LIMIT_DEFAULT_RPM", settings.rate_limit.default_rpm),
    ] {
        if value == 0 {
            anyhow::bail!("{name} must be greater than 0");
        }
    }

    if settings.health.outbox_pending_warn_threshold > settings.health.outbox_pending_fail_threshold
    {
        anyhow::bail!(
            "HEALTH_OUTBOX_PENDING_WARN_THRESHOLD must be less than or equal to HEALTH_OUTBOX_PENDING_FAIL_THRESHOLD"
        );
    }

    if settings.health.outbox_oldest_warn_secs > settings.health.outbox_oldest_fail_secs {
        anyhow::bail!(
            "HEALTH_OUTBOX_OLDEST_WARN_SECS must be less than or equal to HEALTH_OUTBOX_OLDEST_FAIL_SECS"
        );
    }

    Ok(())
}

// 为了支持配置的 JSON 反序列化，需要添加 serde 依赖
#[cfg(test)]
mod tests {
    use super::*;
    use std::sync::{Mutex, OnceLock};

    fn env_lock() -> std::sync::MutexGuard<'static, ()> {
        static ENV_LOCK: OnceLock<Mutex<()>> = OnceLock::new();
        ENV_LOCK
            .get_or_init(|| Mutex::new(()))
            .lock()
            .expect("env test lock should not be poisoned")
    }

    #[test]
    fn test_default_values() {
        let _guard = env_lock();
        // 设置测试环境变量
        env::remove_var("RATE_LIMIT_FAILURE_MODE");
        env::set_var("DATABASE_URL", "postgresql://test@localhost/test");
        env::set_var("REDIS_URL", "redis://localhost");
        env::set_var("JWT_SECRET", "test-secret-key-32-characters-long");
        env::set_var("PASSWORD_PEPPER", "test-pepper-32-characters-long-!!");
        env::set_var("SMTP_USERNAME", "test@example.com");
        env::set_var("SMTP_PASSWORD", "test-password");
        env::set_var("SMTP_FROM", "test@example.com");

        let settings = Settings::from_env().unwrap();

        assert_eq!(settings.server_host, "0.0.0.0");
        assert_eq!(settings.server_port, 3000);
        assert_eq!(settings.database_pool.max_connections, 20);
        assert_eq!(settings.redis_pool.max_size, 10);
        assert_eq!(settings.worker.batch_size, 100);
        assert_eq!(settings.health.outbox_pending_warn_threshold, 1000);
        assert_eq!(settings.rate_limit.auth_rps, 5);
        assert_eq!(
            settings.rate_limit.failure_mode,
            RateLimitFailureMode::FailClosed
        );
        assert!(settings.smtp.tls);
    }

    #[test]
    fn test_rate_limit_failure_mode_can_be_configured() {
        let _guard = env_lock();
        env::set_var("DATABASE_URL", "postgresql://test@localhost/test");
        env::set_var("REDIS_URL", "redis://localhost");
        env::set_var("JWT_SECRET", "test-secret-key-32-characters-long");
        env::set_var("PASSWORD_PEPPER", "test-pepper-32-characters-long-!!");
        env::set_var("SMTP_USERNAME", "test@example.com");
        env::set_var("SMTP_PASSWORD", "test-password");
        env::set_var("SMTP_FROM", "test@example.com");
        env::set_var("RATE_LIMIT_FAILURE_MODE", "fail_open");

        let settings = Settings::from_env().unwrap();

        assert_eq!(
            settings.rate_limit.failure_mode,
            RateLimitFailureMode::FailOpen
        );

        env::remove_var("RATE_LIMIT_FAILURE_MODE");
    }
}

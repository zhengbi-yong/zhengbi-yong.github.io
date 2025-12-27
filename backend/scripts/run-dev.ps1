# 开发环境启动脚本 (PowerShell)

Write-Host "🚀 启动后端开发服务器..." -ForegroundColor Cyan
Write-Host ""

# 检查 .env 文件是否存在
$envFile = Join-Path $PSScriptRoot "..\.env"
if (-not (Test-Path $envFile)) {
    Write-Host "📝 创建 .env 文件..." -ForegroundColor Yellow
    $exampleFile = Join-Path $PSScriptRoot "..\.env.example"
    if (Test-Path $exampleFile) {
        Copy-Item $exampleFile $envFile
        Write-Host "✅ .env 文件已创建（从 .env.example）" -ForegroundColor Green
    } else {
        Write-Host "⚠️  .env.example 文件不存在，请手动创建 .env 文件" -ForegroundColor Yellow
    }
}

# 设置环境变量（作为备用，dotenv 会优先加载 .env 文件）
$env:DATABASE_URL = "postgresql://blog_user:blog_password@localhost:5432/blog_db"
$env:REDIS_URL = "redis://localhost:6379"
$env:JWT_SECRET = "dev-secret-key-for-testing-only-32-chars-long"
$env:PASSWORD_PEPPER = "dev-password-pepper-for-testing-32-chars"
$env:SMTP_USERNAME = "dev@example.com"
$env:SMTP_PASSWORD = "dev-password"
$env:SMTP_FROM = "noreply@example.com"
$env:SMTP_HOST = "smtp.gmail.com"
$env:SMTP_PORT = "587"
$env:SMTP_TLS = "true"
$env:SERVER_HOST = "0.0.0.0"
$env:SERVER_PORT = "3000"
$env:RUST_LOG = "debug"

Write-Host ""
Write-Host "📦 运行后端服务..." -ForegroundColor Yellow
Write-Host ""

# 运行后端
cargo run


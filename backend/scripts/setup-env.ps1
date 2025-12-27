# 设置环境变量脚本 (PowerShell)
# 用于快速设置开发环境变量

Write-Host "🔧 设置后端开发环境变量..." -ForegroundColor Cyan
Write-Host ""

# 检查 .env 文件是否存在
$envFile = Join-Path $PSScriptRoot "..\.env"
if (-not (Test-Path $envFile)) {
    Write-Host "📝 创建 .env 文件..." -ForegroundColor Yellow
    Copy-Item (Join-Path $PSScriptRoot "..\.env.example") $envFile -ErrorAction SilentlyContinue
}

# 设置环境变量
Write-Host "📦 设置环境变量..." -ForegroundColor Yellow

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

Write-Host "✅ 环境变量设置完成" -ForegroundColor Green
Write-Host ""
Write-Host "现在可以运行: cargo run" -ForegroundColor Cyan


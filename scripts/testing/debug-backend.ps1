# 调试后端启动脚本
# 用于获取详细的错误信息

Write-Host "🔍 调试后端启动..." -ForegroundColor Cyan
Write-Host ""

$backendPath = Join-Path $PSScriptRoot ".." "backend"
Push-Location $backendPath

# 设置环境变量
$env:DATABASE_URL = "postgresql://blog_user:blog_password@localhost:5432/blog_db"
$env:REDIS_URL = "redis://localhost:6379"
$env:JWT_SECRET = "dev-secret-key-for-testing-only-x"
$env:PASSWORD_PEPPER = "dev-pepper"
$env:SMTP_HOST = "localhost"
$env:SMTP_PORT = "587"
$env:SMTP_USERNAME = "noreply@example.com"
$env:SMTP_PASSWORD = "dev-password"
$env:SMTP_FROM = "noreply@example.com"
$env:SMTP_TLS = "false"
$env:CORS_ALLOWED_ORIGINS = "http://localhost:3000,http://localhost:3001,http://localhost:3002,http://localhost:3003"
$env:RUST_LOG = "debug"

Write-Host "环境变量已设置" -ForegroundColor Green
Write-Host ""

Write-Host "正在启动后端（将显示所有输出）..." -ForegroundColor Yellow
Write-Host "按 Ctrl+C 停止" -ForegroundColor Gray
Write-Host ""

# 直接运行，显示所有输出
cargo run --bin api

Pop-Location


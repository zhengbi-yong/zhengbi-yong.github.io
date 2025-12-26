# 测试后端配置脚本
# 用于验证环境变量是否正确设置

Write-Host "🔍 测试后端配置..." -ForegroundColor Cyan
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
$env:RUST_LOG = "error"  # 只显示错误，减少输出

Write-Host "环境变量已设置:" -ForegroundColor Yellow
Write-Host "  DATABASE_URL: $env:DATABASE_URL" -ForegroundColor Gray
Write-Host "  REDIS_URL: $env:REDIS_URL" -ForegroundColor Gray
Write-Host "  JWT_SECRET: $env:JWT_SECRET" -ForegroundColor Gray
Write-Host "  SMTP_FROM: $env:SMTP_FROM" -ForegroundColor Gray
Write-Host "  SMTP_TLS: $env:SMTP_TLS" -ForegroundColor Gray
Write-Host ""

Write-Host "正在启动后端（5秒后自动停止）..." -ForegroundColor Yellow
Write-Host ""

# 启动后端并在5秒后停止
$job = Start-Job -ScriptBlock {
    param($path)
    Set-Location $path
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
    $env:RUST_LOG = "error"
    cargo run --bin api 2>&1
} -ArgumentList $backendPath

Start-Sleep -Seconds 8
Stop-Job $job
$output = Receive-Job $job
Remove-Job $job

# 检查输出
if ($output -match "Server listening") {
    Write-Host "✅ 后端启动成功！" -ForegroundColor Green
    Write-Host ""
    Write-Host "输出片段:" -ForegroundColor Yellow
    $output | Select-String -Pattern "Server listening|error|Error|Failed" | Select-Object -First 5
} elseif ($output -match "error|Error|Failed|Invalid") {
    Write-Host "❌ 后端启动失败" -ForegroundColor Red
    Write-Host ""
    Write-Host "错误信息:" -ForegroundColor Yellow
    $output | Select-String -Pattern "error|Error|Failed|Invalid" | Select-Object -First 10
} else {
    Write-Host "⚠️  无法确定状态" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "输出:" -ForegroundColor Gray
    $output | Select-Object -Last 10
}

Pop-Location


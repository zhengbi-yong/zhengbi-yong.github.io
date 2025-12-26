# 管理后台启动脚本 (PowerShell)
# 用于启动数据库、后端 API 和前端开发服务器

param(
    [switch]$SkipDatabase = $false,
    [switch]$SkipBackend = $false,
    [switch]$SkipFrontend = $false
)

Write-Host "🚀 启动管理后台服务" -ForegroundColor Cyan
Write-Host "====================" -ForegroundColor Cyan
Write-Host ""

$ErrorActionPreference = "Stop"

# 检查 Docker 是否运行
function Test-Docker {
    try {
        docker ps | Out-Null
        return $true
    } catch {
        return $false
    }
}

# 启动数据库
if (-not $SkipDatabase) {
    Write-Host "1️⃣  启动数据库服务..." -ForegroundColor Yellow
    
    if (-not (Test-Docker)) {
        Write-Host "❌ Docker 未运行，请先启动 Docker Desktop" -ForegroundColor Red
        exit 1
    }
    
    $backendPath = Join-Path $PSScriptRoot ".." "backend"
    Push-Location $backendPath
    
    try {
        Write-Host "   正在启动 PostgreSQL 和 Redis..." -ForegroundColor Gray
        & .\deploy.sh dev 2>&1 | Out-Null
        
        # 等待数据库启动
        Write-Host "   等待数据库就绪..." -ForegroundColor Gray
        Start-Sleep -Seconds 5
        
        Write-Host "✅ 数据库服务已启动" -ForegroundColor Green
    } catch {
        Write-Host "⚠️  数据库可能已经在运行中" -ForegroundColor Yellow
    } finally {
        Pop-Location
    }
    Write-Host ""
}

# 启动后端 API
if (-not $SkipBackend) {
    Write-Host "2️⃣  启动后端 API..." -ForegroundColor Yellow
    
    $backendPath = Join-Path $PSScriptRoot ".." "backend"
    Push-Location $backendPath
    
    # 检查后端是否已在运行
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:3000/v1/health" -Method Get -TimeoutSec 2 -UseBasicParsing -ErrorAction SilentlyContinue
        if ($response.StatusCode -eq 200) {
            Write-Host "⚠️  后端 API 已在运行 (http://localhost:3000)" -ForegroundColor Yellow
        }
    } catch {
        # 后端未运行，启动它
        Write-Host "   正在启动后端 API..." -ForegroundColor Gray
        
        $env:DATABASE_URL = "postgresql://blog_user:blog_password@localhost:5432/blog_db"
        $env:REDIS_URL = "redis://localhost:6379"
        
        # 在新窗口中启动后端（设置所有必要的环境变量）
        Start-Process powershell -ArgumentList @(
            "-NoExit",
            "-Command",
            "cd '$backendPath'; `$env:DATABASE_URL='postgresql://blog_user:blog_password@localhost:5432/blog_db'; `$env:REDIS_URL='redis://localhost:6379'; `$env:JWT_SECRET='dev-secret-key-for-testing-only-x'; `$env:PASSWORD_PEPPER='dev-pepper'; `$env:SMTP_HOST='localhost'; `$env:SMTP_PORT='587'; `$env:SMTP_USERNAME='noreply@example.com'; `$env:SMTP_PASSWORD='dev-password'; `$env:SMTP_FROM='noreply@example.com'; `$env:SMTP_TLS='false'; `$env:CORS_ALLOWED_ORIGINS='http://localhost:3000,http://localhost:3001,http://localhost:3002,http://localhost:3003'; `$env:RUST_LOG='debug'; `$env:ENVIRONMENT='development'; Write-Host '🚀 启动后端 API...' -ForegroundColor Cyan; cargo run --bin api"
        )
        
        Write-Host "✅ 后端 API 启动中 (新窗口)" -ForegroundColor Green
        Write-Host "   等待后端就绪..." -ForegroundColor Gray
        Start-Sleep -Seconds 10
    } finally {
        Pop-Location
    }
    Write-Host ""
}

# 启动前端
if (-not $SkipFrontend) {
    Write-Host "3️⃣  启动前端开发服务器..." -ForegroundColor Yellow
    
    $frontendPath = Join-Path $PSScriptRoot ".." "frontend"
    Push-Location $frontendPath
    
    # 检查前端是否已在运行（检查多个可能的端口）
    $frontendPorts = @(3000, 3001, 3002, 3003)
    $frontendRunning = $false
    $detectedPort = $null
    
    foreach ($port in $frontendPorts) {
        try {
            $response = Invoke-WebRequest -Uri "http://localhost:$port" -Method Get -TimeoutSec 2 -UseBasicParsing -ErrorAction SilentlyContinue
            if ($response.StatusCode -eq 200) {
                $frontendRunning = $true
                $detectedPort = $port
                Write-Host "⚠️  前端已在运行 (http://localhost:$port)" -ForegroundColor Yellow
                break
            }
        } catch {
            # 继续检查下一个端口
        }
    }
    
    if (-not $frontendRunning) {
        # 前端未运行，启动它
        Write-Host "   正在启动前端..." -ForegroundColor Gray
        
        # 检查是否有锁文件，如果有则删除
        $lockFile = Join-Path $frontendPath ".next\dev\lock"
        if (Test-Path $lockFile) {
            Write-Host "   检测到锁文件，正在清理..." -ForegroundColor Yellow
            Remove-Item $lockFile -Force -ErrorAction SilentlyContinue
        }
        
        # 在新窗口中启动前端
        Start-Process powershell -ArgumentList @(
            "-NoExit",
            "-Command",
            "cd '$frontendPath'; Write-Host '🚀 启动前端开发服务器...' -ForegroundColor Cyan; pnpm dev"
        )
        
        Write-Host "✅ 前端开发服务器启动中 (新窗口)" -ForegroundColor Green
        Write-Host "   等待前端就绪..." -ForegroundColor Gray
        Start-Sleep -Seconds 5
        $detectedPort = if ($env:FRONTEND_PORT) { $env:FRONTEND_PORT } else { "3000" }
    }
    
    # 保存检测到的端口供后续使用
    $script:FrontendPort = $detectedPort
    Pop-Location
    Write-Host ""
}

# 总结
Write-Host "====================" -ForegroundColor Cyan
Write-Host "✅ 启动完成！" -ForegroundColor Green
Write-Host "====================" -ForegroundColor Cyan
Write-Host ""
$finalFrontendPort = if ($script:FrontendPort) { $script:FrontendPort } else { if ($env:FRONTEND_PORT) { $env:FRONTEND_PORT } else { "3000" } }

Write-Host "📋 服务状态:" -ForegroundColor Cyan
Write-Host "   - 数据库: http://localhost:5432" -ForegroundColor White
Write-Host "   - 后端 API: http://localhost:3000" -ForegroundColor White
Write-Host "   - 前端: http://localhost:$finalFrontendPort" -ForegroundColor White
Write-Host ""
Write-Host "🌐 访问管理后台:" -ForegroundColor Cyan
Write-Host "   http://localhost:$finalFrontendPort/admin" -ForegroundColor White
Write-Host ""
Write-Host "🔑 默认管理员账号:" -ForegroundColor Cyan
Write-Host "   邮箱: demo2024@test.com" -ForegroundColor White
Write-Host "   密码: demo123456" -ForegroundColor White
Write-Host ""
Write-Host "💡 提示:" -ForegroundColor Cyan
Write-Host "   - 运行测试脚本检查服务状态: .\scripts\test-admin.ps1" -ForegroundColor Gray
Write-Host "   - 停止服务: 关闭对应的 PowerShell 窗口" -ForegroundColor Gray
Write-Host ""


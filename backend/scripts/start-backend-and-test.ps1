# 启动后端服务并运行测试的脚本

Write-Host "========================================" -ForegroundColor Blue
Write-Host "    启动后端并运行测试" -ForegroundColor Blue
Write-Host "========================================" -ForegroundColor Blue
Write-Host ""

# 检查后端是否已运行
Write-Host "🔍 检查后端服务状态..." -ForegroundColor Cyan
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000/healthz" -Method GET -TimeoutSec 3 -ErrorAction SilentlyContinue
    if ($response.StatusCode -eq 200) {
        Write-Host "✅ 后端服务已在运行" -ForegroundColor Green
        Write-Host ""
        Write-Host "直接运行测试..." -ForegroundColor Yellow
        & "$PSScriptRoot\run-stress-tests.ps1"
        exit $LASTEXITCODE
    }
} catch {
    Write-Host "⚠️  后端服务未运行" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "📋 前置条件检查..." -ForegroundColor Cyan

# 检查 Docker Compose
Write-Host "   检查 Docker Compose..." -ForegroundColor Gray
if (Get-Command docker-compose -ErrorAction SilentlyContinue) {
    Write-Host "   ✓ Docker Compose 可用" -ForegroundColor Green
    
    # 检查服务是否运行
    $services = docker-compose ps --services --filter "status=running" 2>$null
    if ($services -match "postgres|redis") {
        Write-Host "   ✓ 数据库和Redis服务运行中" -ForegroundColor Green
    } else {
        Write-Host "   ⚠️  数据库和Redis可能未运行" -ForegroundColor Yellow
        Write-Host "   启动数据库和Redis..." -ForegroundColor Yellow
        docker-compose up -d postgres redis
        Write-Host "   等待服务就绪..." -ForegroundColor Yellow
        Start-Sleep -Seconds 5
    }
} else {
    Write-Host "   ⚠️  Docker Compose 不可用，请手动启动数据库和Redis" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "🚀 启动后端服务..." -ForegroundColor Cyan
Write-Host "   注意: 后端服务将在后台运行" -ForegroundColor Yellow
Write-Host "   按 Ctrl+C 可以停止服务" -ForegroundColor Yellow
Write-Host ""

# 启动后端服务（后台运行）
$backendProcess = Start-Process -FilePath "cargo" -ArgumentList "run" -WorkingDirectory (Join-Path $PSScriptRoot "..") -NoNewWindow -PassThru

Write-Host "   等待后端服务启动..." -ForegroundColor Yellow

# 等待服务启动（最多等待30秒）
$maxWait = 30
$waited = 0
$isReady = $false

while ($waited -lt $maxWait -and -not $isReady) {
    Start-Sleep -Seconds 2
    $waited += 2
    
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:3000/healthz" -Method GET -TimeoutSec 3 -ErrorAction SilentlyContinue
        if ($response.StatusCode -eq 200) {
            $isReady = $true
            Write-Host "   ✅ 后端服务已启动！" -ForegroundColor Green
        }
    } catch {
        Write-Host "   ." -NoNewline -ForegroundColor Gray
    }
}

if (-not $isReady) {
    Write-Host ""
    Write-Host "❌ 后端服务启动超时" -ForegroundColor Red
    Write-Host "   请检查后端日志查看错误信息" -ForegroundColor Yellow
    Stop-Process -Id $backendProcess.Id -Force -ErrorAction SilentlyContinue
    exit 1
}

Write-Host ""
Write-Host "🧪 运行测试..." -ForegroundColor Cyan
Write-Host ""

# 运行测试
& "$PSScriptRoot\run-stress-tests.ps1"
$testExitCode = $LASTEXITCODE

Write-Host ""
Write-Host "🛑 停止后端服务..." -ForegroundColor Yellow
Stop-Process -Id $backendProcess.Id -Force -ErrorAction SilentlyContinue
Write-Host "   ✅ 后端服务已停止" -ForegroundColor Green

exit $testExitCode


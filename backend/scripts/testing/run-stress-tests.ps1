# 运行后端压力测试脚本 (PowerShell)

Write-Host "🧪 运行后端压力测试和边界情况测试..." -ForegroundColor Cyan
Write-Host ""
Write-Host "⚠️  注意: 运行测试前请确保后端服务正在运行！" -ForegroundColor Yellow
Write-Host "   如果未运行，请先执行: cd backend && cargo run" -ForegroundColor Yellow
Write-Host ""

# 检查后端是否运行
Write-Host "🔍 检查后端服务状态..." -ForegroundColor Cyan

$baseUrl = "http://localhost:3000"
$maxRetries = 5
$retryCount = 0
$isRunning = $false
$retryDelay = 2  # 秒

# 首先检查端口是否被占用
Write-Host "   检查端口 3000..." -ForegroundColor Gray
try {
    $connection = Test-NetConnection -ComputerName localhost -Port 3000 -WarningAction SilentlyContinue -ErrorAction SilentlyContinue
    if (-not $connection.TcpTestSucceeded) {
        Write-Host "   ⚠️  端口 3000 未被占用" -ForegroundColor Yellow
    }
} catch {
    Write-Host "   ⚠️  无法检查端口状态" -ForegroundColor Yellow
}

while ($retryCount -lt $maxRetries -and -not $isRunning) {
    try {
        # 增加超时时间到10秒，并添加重试延迟
        $response = Invoke-WebRequest -Uri "$baseUrl/healthz" -Method GET -TimeoutSec 10 -ErrorAction Stop
        if ($response.StatusCode -eq 200) {
            $isRunning = $true
            Write-Host "✅ 后端服务运行中 (状态码: $($response.StatusCode))" -ForegroundColor Green
            
            # 尝试解析响应内容
            try {
                $healthData = $response.Content | ConvertFrom-Json
                if ($healthData.status) {
                    Write-Host "   服务状态: $($healthData.status)" -ForegroundColor Gray
                }
            } catch {
                # 忽略JSON解析错误
            }
        }
    } catch {
        $retryCount++
        $errorMsg = $_.Exception.Message
        
        # 检查是否是连接错误
        if ($errorMsg -like "*无法连接*" -or $errorMsg -like "*拒绝连接*" -or $errorMsg -like "*Connection refused*") {
            Write-Host "   ⚠️  连接被拒绝 - 后端服务可能未启动" -ForegroundColor Yellow
        } elseif ($errorMsg -like "*超时*" -or $errorMsg -like "*timeout*" -or $errorMsg -like "*Timeout*") {
            Write-Host "   ⚠️  请求超时 - 后端服务可能响应缓慢" -ForegroundColor Yellow
        } else {
            Write-Host "   ⚠️  错误: $errorMsg" -ForegroundColor Yellow
        }
        
        if ($retryCount -lt $maxRetries) {
            Write-Host "   重试 $retryCount/$maxRetries (等待 ${retryDelay}秒)..." -ForegroundColor Yellow
            Start-Sleep -Seconds $retryDelay
            $retryDelay = [Math]::Min($retryDelay + 1, 5)  # 递增延迟，最多5秒
        } else {
            Write-Host ""
            Write-Host "❌ 无法连接到后端服务" -ForegroundColor Red
            Write-Host ""
            Write-Host "诊断信息:" -ForegroundColor Yellow
            Write-Host "  - 尝试连接的URL: $baseUrl/healthz" -ForegroundColor Gray
            Write-Host "  - 重试次数: $maxRetries" -ForegroundColor Gray
            Write-Host "  - 最后错误: $errorMsg" -ForegroundColor Gray
            Write-Host ""
            Write-Host "可能的解决方案:" -ForegroundColor Yellow
            Write-Host "  1. 确保后端服务正在运行:" -ForegroundColor White
            Write-Host "     cd backend" -ForegroundColor Cyan
            Write-Host "     cargo run" -ForegroundColor Cyan
            Write-Host ""
            Write-Host "  2. 检查后端是否在其他端口运行:" -ForegroundColor White
            Write-Host "     查看后端日志或配置文件中的端口设置" -ForegroundColor Gray
            Write-Host ""
            Write-Host "  3. 检查防火墙设置:" -ForegroundColor White
            Write-Host "     确保端口 3000 未被防火墙阻止" -ForegroundColor Gray
            Write-Host ""
            Write-Host "  4. 检查环境变量:" -ForegroundColor White
            Write-Host "     确保 .env 文件中的配置正确" -ForegroundColor Gray
            Write-Host ""
            Write-Host "  5. 手动测试连接:" -ForegroundColor White
            Write-Host "     curl http://localhost:3000/healthz" -ForegroundColor Cyan
            Write-Host "     或" -ForegroundColor Gray
            Write-Host "     Invoke-WebRequest -Uri http://localhost:3000/healthz" -ForegroundColor Cyan
            Write-Host ""
            exit 1
        }
    }
}

Write-Host ""

# 运行压力测试
Write-Host "📦 运行压力测试..." -ForegroundColor Yellow
cargo test --test stress_tests --release -- --nocapture
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ 压力测试失败" -ForegroundColor Red
    exit 1
}
Write-Host ""

# 运行安全性测试
Write-Host "🔐 运行安全性测试..." -ForegroundColor Yellow
cargo test --test security_tests --release -- --nocapture
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ 安全性测试失败" -ForegroundColor Red
    exit 1
}
Write-Host ""

# 运行集成测试
Write-Host "🔗 运行集成测试..." -ForegroundColor Yellow
cargo test --test integration_tests --release -- --nocapture
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ 集成测试失败" -ForegroundColor Red
    exit 1
}
Write-Host ""

Write-Host "✅ 所有测试完成！" -ForegroundColor Green


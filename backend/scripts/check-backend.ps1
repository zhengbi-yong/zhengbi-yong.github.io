# 检查后端服务状态的独立脚本

param(
    [string]$Url = "http://localhost:3000",
    [int]$Timeout = 10,
    [int]$MaxRetries = 5
)

Write-Host "🔍 检查后端服务状态..." -ForegroundColor Cyan
Write-Host "   URL: $Url" -ForegroundColor Gray
Write-Host ""

$retryCount = 0
$retryDelay = 2
$isRunning = $false

# 检查端口
$port = if ($Url -match ':\d+') {
    ($Url -split ':')[2] -split '/' | Select-Object -First 1
} else {
    "3000"
}

Write-Host "   检查端口 $port..." -ForegroundColor Gray
try {
    $connection = Test-NetConnection -ComputerName localhost -Port $port -WarningAction SilentlyContinue -ErrorAction SilentlyContinue
    if ($connection.TcpTestSucceeded) {
        Write-Host "   ✓ 端口 $port 正在监听" -ForegroundColor Green
    } else {
        Write-Host "   ⚠️  端口 $port 未被占用" -ForegroundColor Yellow
    }
} catch {
    Write-Host "   ⚠️  无法检查端口状态" -ForegroundColor Yellow
}

Write-Host ""

# 尝试连接健康检查端点
while ($retryCount -lt $MaxRetries -and -not $isRunning) {
    try {
        $healthUrl = "$Url/healthz"
        Write-Host "   尝试连接: $healthUrl (超时: ${Timeout}秒)..." -ForegroundColor Gray
        
        $response = Invoke-WebRequest -Uri $healthUrl -Method GET -TimeoutSec $Timeout -ErrorAction Stop
        
        if ($response.StatusCode -eq 200) {
            $isRunning = $true
            Write-Host ""
            Write-Host "✅ 后端服务运行正常！" -ForegroundColor Green
            Write-Host "   状态码: $($response.StatusCode)" -ForegroundColor Gray
            
            # 解析响应
            try {
                $healthData = $response.Content | ConvertFrom-Json
                Write-Host "   服务状态: $($healthData.status)" -ForegroundColor Gray
                if ($healthData.version) {
                    Write-Host "   版本: $($healthData.version)" -ForegroundColor Gray
                }
                if ($healthData.uptime_seconds) {
                    $uptime = [TimeSpan]::FromSeconds($healthData.uptime_seconds)
                    Write-Host "   运行时间: $($uptime.ToString('hh\:mm\:ss'))" -ForegroundColor Gray
                }
            } catch {
                Write-Host "   响应: $($response.Content.Substring(0, [Math]::Min(100, $response.Content.Length)))" -ForegroundColor Gray
            }
            
            return 0
        }
    } catch {
        $retryCount++
        $errorMsg = $_.Exception.Message
        
        Write-Host "   ✗ 连接失败" -ForegroundColor Red
        
        if ($errorMsg -like "*无法连接*" -or $errorMsg -like "*拒绝连接*" -or $errorMsg -like "*Connection refused*") {
            Write-Host "   原因: 连接被拒绝 - 后端服务可能未启动" -ForegroundColor Yellow
        } elseif ($errorMsg -like "*超时*" -or $errorMsg -like "*timeout*" -or $errorMsg -like "*Timeout*") {
            Write-Host "   原因: 请求超时 - 后端服务可能响应缓慢或未启动" -ForegroundColor Yellow
        } else {
            Write-Host "   原因: $errorMsg" -ForegroundColor Yellow
        }
        
        if ($retryCount -lt $MaxRetries) {
            Write-Host "   等待 ${retryDelay}秒后重试 ($retryCount/$MaxRetries)..." -ForegroundColor Yellow
            Start-Sleep -Seconds $retryDelay
            $retryDelay = [Math]::Min($retryDelay + 1, 5)
        }
    }
}

# 如果所有重试都失败
Write-Host ""
Write-Host "❌ 无法连接到后端服务" -ForegroundColor Red
Write-Host ""
Write-Host "诊断信息:" -ForegroundColor Yellow
Write-Host "  - URL: $Url" -ForegroundColor Gray
Write-Host "  - 端口: $port" -ForegroundColor Gray
Write-Host "  - 重试次数: $MaxRetries" -ForegroundColor Gray
Write-Host ""
Write-Host "解决方案:" -ForegroundColor Yellow
Write-Host "  1. 启动后端服务:" -ForegroundColor White
Write-Host "     cd backend" -ForegroundColor Cyan
Write-Host "     cargo run" -ForegroundColor Cyan
Write-Host ""
Write-Host "  2. 检查端口是否被占用:" -ForegroundColor White
Write-Host "     netstat -ano | findstr :$port" -ForegroundColor Cyan
Write-Host ""
Write-Host "  3. 检查环境变量配置:" -ForegroundColor White
Write-Host "     确保 .env 文件存在且配置正确" -ForegroundColor Gray
Write-Host ""
Write-Host "  4. 手动测试:" -ForegroundColor White
Write-Host "     Invoke-WebRequest -Uri $Url/healthz" -ForegroundColor Cyan
Write-Host ""

return 1


# 管理后台测试脚本 (PowerShell)
# 用于测试所有服务是否正常运行

param(
    [switch]$Detailed = $false
)

Write-Host "🧪 管理后台测试脚本" -ForegroundColor Cyan
Write-Host "====================" -ForegroundColor Cyan
Write-Host ""

$ErrorActionPreference = "Continue"
$allTestsPassed = $true

# 颜色定义
function Write-Success { param($msg) Write-Host "✅ $msg" -ForegroundColor Green }
function Write-Error { param($msg) Write-Host "❌ $msg" -ForegroundColor Red }
function Write-Warning { param($msg) Write-Host "⚠️  $msg" -ForegroundColor Yellow }
function Write-Info { param($msg) Write-Host "ℹ️  $msg" -ForegroundColor Gray }

# 测试服务连接
function Test-ServiceConnection {
    param(
        [string]$Name,
        [string]$Url,
        [string]$Method = "Get"
    )
    
    try {
        $response = Invoke-WebRequest -Uri $Url -Method $Method -TimeoutSec 3 -UseBasicParsing -ErrorAction Stop
        Write-Success "$Name 连接正常 ($Url)"
        if ($Detailed) {
            Write-Info "   状态码: $($response.StatusCode)"
        }
        return $true
    } catch {
        Write-Error "$Name 连接失败 ($Url)"
        if ($Detailed) {
            Write-Info "   错误: $($_.Exception.Message)"
        }
        return $false
    }
}

# 1. 测试数据库连接
Write-Host "1️⃣  测试数据库连接..." -ForegroundColor Yellow
try {
    $dbTest = docker exec blog-postgres psql -U blog_user -d blog_db -c "SELECT 1;" 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Success "PostgreSQL 数据库连接正常"
    } else {
        Write-Error "PostgreSQL 数据库连接失败"
        $script:allTestsPassed = $false
    }
} catch {
    Write-Error "无法连接到数据库容器"
    Write-Info "   请确保 Docker 正在运行且数据库容器已启动"
    $script:allTestsPassed = $false
}
Write-Host ""

# 2. 测试后端 API
Write-Host "2️⃣  测试后端 API..." -ForegroundColor Yellow
# 尝试多个健康检查端点
$healthEndpoints = @(
    "http://localhost:3000/healthz",
    "http://localhost:3000/v1/health",
    "http://localhost:3000/health"
)
$backendOk = $false
$lastError = $null
foreach ($endpoint in $healthEndpoints) {
    try {
        $response = Invoke-WebRequest -Uri $endpoint -Method Get -TimeoutSec 5 -UseBasicParsing -ErrorAction Stop
        if ($response.StatusCode -eq 200) {
            Write-Success "后端 API 连接正常 ($endpoint)"
            if ($Detailed) {
                Write-Info "   状态码: $($response.StatusCode)"
            }
            $backendOk = $true
            break
        }
    } catch {
        $lastError = $_.Exception.Message
        if ($Detailed) {
            Write-Info "   尝试 $endpoint 失败: $lastError"
        }
        # 继续尝试下一个端点
        continue
    }
}
if (-not $backendOk) {
    Write-Error "后端 API 连接失败"
    if ($Detailed -and $lastError) {
        Write-Info "   最后错误: $lastError"
    }
    Write-Info "   提示: 运行 .\scripts\start-admin.ps1 启动后端"
    $script:allTestsPassed = $false
}
Write-Host ""

# 3. 测试前端（检查多个可能的端口）
Write-Host "3️⃣  测试前端..." -ForegroundColor Yellow
$frontendPorts = @(3000, 3001, 3002, 3003)
$frontendOk = $false
$detectedFrontendPort = $null

foreach ($port in $frontendPorts) {
    if (Test-ServiceConnection "前端 (端口 $port)" "http://localhost:$port") {
        $frontendOk = $true
        $detectedFrontendPort = $port
        break
    }
}

if (-not $frontendOk) {
    Write-Info "   提示: 运行 .\scripts\start-admin.ps1 启动前端"
    $script:allTestsPassed = $false
    $detectedFrontendPort = if ($env:FRONTEND_PORT) { $env:FRONTEND_PORT } else { "3000" }
} else {
    Write-Host "✅ 检测到前端运行在端口 $detectedFrontendPort" -ForegroundColor Green
}
Write-Host ""

# 4. 测试登录 API
if ($backendOk) {
    Write-Host "4️⃣  测试登录 API..." -ForegroundColor Yellow
    try {
        $loginBody = @{
            email = "demo2024@test.com"
            password = "demo123456"
        } | ConvertTo-Json
        
        $loginResponse = Invoke-RestMethod -Uri "http://localhost:3000/v1/auth/login" `
            -Method Post `
            -ContentType "application/json" `
            -Body $loginBody `
            -ErrorAction Stop
        
        if ($loginResponse.access_token) {
            Write-Success "登录 API 正常"
            $script:token = $loginResponse.access_token
            if ($Detailed) {
                Write-Info "   Token: $($script:token.Substring(0, [Math]::Min(30, $script:token.Length)))..."
            }
        }
    } catch {
        Write-Error "登录 API 失败"
        if ($Detailed) {
            Write-Info "   错误: $($_.Exception.Message)"
        }
        $script:allTestsPassed = $false
    }
    Write-Host ""
}

# 5. 测试管理员 API
if ($backendOk -and $script:token) {
    Write-Host "5️⃣  测试管理员 API..." -ForegroundColor Yellow
    
    $adminApis = @(
        @{ Name = "统计数据"; Url = "http://localhost:3000/v1/admin/stats" }
    )
    
    foreach ($api in $adminApis) {
        try {
            $headers = @{
                "Authorization" = "Bearer $($script:token)"
            }
            
            $response = Invoke-RestMethod -Uri $api.Url -Method Get -Headers $headers -ErrorAction Stop
            
            Write-Success "$($api.Name) API 正常"
            if ($Detailed -and $api.Name -eq "统计数据") {
                Write-Info "   总用户数: $($response.total_users)"
                Write-Info "   总评论数: $($response.total_comments)"
                Write-Info "   待审核评论: $($response.pending_comments)"
            }
        } catch {
            Write-Error "$($api.Name) API 失败"
            if ($Detailed) {
                Write-Info "   错误: $($_.Exception.Message)"
            }
            $script:allTestsPassed = $false
        }
    }
    Write-Host ""
}

# 6. 测试管理后台页面
if ($frontendOk) {
    Write-Host "6️⃣  测试管理后台页面..." -ForegroundColor Yellow
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:$frontendPort/admin" -Method Get -TimeoutSec 5 -UseBasicParsing -ErrorAction Stop
        if ($response.StatusCode -eq 200) {
            Write-Success "管理后台页面可访问"
            if ($Detailed) {
                Write-Info "   页面大小: $($response.Content.Length) 字节"
            }
        }
    } catch {
        Write-Warning "管理后台页面需要登录才能访问（这是正常的）"
        if ($Detailed) {
            Write-Info "   状态码: $($_.Exception.Response.StatusCode.value__)"
        }
    }
    Write-Host ""
}

# 总结
Write-Host "====================" -ForegroundColor Cyan
Write-Host "📋 测试总结" -ForegroundColor Cyan
Write-Host "====================" -ForegroundColor Cyan
Write-Host ""

$finalPort = if ($detectedFrontendPort) { $detectedFrontendPort } else { if ($env:FRONTEND_PORT) { $env:FRONTEND_PORT } else { "3000" } }

if ($script:allTestsPassed -and $backendOk -and $frontendOk) {
    Write-Host "✅ 所有测试通过！" -ForegroundColor Green
    Write-Host ""
    Write-Host "🌐 访问管理后台:" -ForegroundColor Cyan
    Write-Host "   http://localhost:$finalPort/admin" -ForegroundColor White
    Write-Host ""
    Write-Host "🔑 默认管理员账号:" -ForegroundColor Cyan
    Write-Host "   邮箱: demo2024@test.com" -ForegroundColor White
    Write-Host "   密码: demo123456" -ForegroundColor White
    Write-Host ""
    Write-Host "📖 详细测试指南: docs/admin_testing_guide.md" -ForegroundColor Gray
} else {
    Write-Host "⚠️  部分测试失败" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "💡 建议操作:" -ForegroundColor Cyan
    Write-Host "   1. 运行启动脚本: .\scripts\start-admin.ps1" -ForegroundColor White
    Write-Host "   2. 等待所有服务启动完成" -ForegroundColor White
    Write-Host "   3. 再次运行测试脚本" -ForegroundColor White
    Write-Host ""
    Write-Host "📖 故障排查: docs/admin_testing_guide.md" -ForegroundColor Gray
}

Write-Host ""

# 严格测试运行脚本
# 运行所有严格测试套件

Write-Host "========================================" -ForegroundColor Blue
Write-Host "    后端严格测试套件" -ForegroundColor Blue
Write-Host "========================================" -ForegroundColor Blue
Write-Host ""

# 检查后端服务是否运行
Write-Host "检查后端服务状态..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000/healthz" -TimeoutSec 5 -ErrorAction Stop
    Write-Host "✓ 后端服务正在运行" -ForegroundColor Green
} catch {
    Write-Host "✗ 后端服务未运行，请先启动后端服务" -ForegroundColor Red
    Write-Host "  运行命令: cd backend && cargo run" -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "开始运行严格测试..." -ForegroundColor Yellow
Write-Host ""

# 运行不同类型的测试
$testSuites = @(
    @{Name="集成测试"; Test="integration_tests"},
    @{Name="安全性测试"; Test="security_tests"},
    @{Name="压力测试"; Test="stress_tests"},
    @{Name="数据一致性测试"; Test="data_consistency_tests"},
    @{Name="性能基准测试"; Test="performance_benchmarks"},
    @{Name="模糊测试"; Test="fuzzing_tests"}
)

$results = @()

foreach ($suite in $testSuites) {
    Write-Host "运行 $($suite.Name)..." -ForegroundColor Cyan
    $startTime = Get-Date
    
    $output = cargo test --test $suite.Test --release 2>&1 | Out-String
    
    $endTime = Get-Date
    $duration = $endTime - $startTime
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ $($suite.Name) 通过 (耗时: $($duration.TotalSeconds.ToString('F2'))秒)" -ForegroundColor Green
        $results += @{Name=$suite.Name; Status="通过"; Duration=$duration}
    } else {
        Write-Host "✗ $($suite.Name) 失败" -ForegroundColor Red
        $results += @{Name=$suite.Name; Status="失败"; Duration=$duration}
    }
    Write-Host ""
}

# 显示总结
Write-Host "========================================" -ForegroundColor Blue
Write-Host "    测试结果总结" -ForegroundColor Blue
Write-Host "========================================" -ForegroundColor Blue
Write-Host ""

foreach ($result in $results) {
    $statusColor = if ($result.Status -eq "通过") { "Green" } else { "Red" }
    Write-Host "$($result.Name): " -NoNewline
    Write-Host "$($result.Status)" -ForegroundColor $statusColor -NoNewline
    Write-Host " (耗时: $($result.Duration.TotalSeconds.ToString('F2'))秒)"
}

Write-Host ""

# 极端测试提示
Write-Host "注意: 以下测试需要手动运行（使用 --ignored 标志）:" -ForegroundColor Yellow
Write-Host "  - 极端压力测试: cargo test --test extreme_stress_tests -- --ignored --release" -ForegroundColor Yellow
Write-Host "  - 混沌工程测试: cargo test --test chaos_engineering_tests -- --ignored --release" -ForegroundColor Yellow
Write-Host "  - 长时间性能测试: cargo test --test performance_benchmarks -- --ignored --release" -ForegroundColor Yellow
Write-Host ""

$allPassed = ($results | Where-Object { $_.Status -ne "通过" }).Count -eq 0

if ($allPassed) {
    Write-Host "✓ 所有测试通过！" -ForegroundColor Green
    exit 0
} else {
    Write-Host "✗ 部分测试失败" -ForegroundColor Red
    exit 1
}


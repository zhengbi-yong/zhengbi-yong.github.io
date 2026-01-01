# 等待服务启动并测试脚本
# 用法: .\scripts\wait-and-test.ps1 [等待秒数]

param(
    [int]$WaitSeconds = 30
)

Write-Host "⏳ 等待服务启动..." -ForegroundColor Cyan
Write-Host "   等待时间: $WaitSeconds 秒" -ForegroundColor Gray
Write-Host ""

# 倒计时
for ($i = $WaitSeconds; $i -gt 0; $i--) {
    Write-Host "`r   剩余时间: $i 秒" -NoNewline -ForegroundColor Gray
    Start-Sleep -Seconds 1
}
Write-Host "`r   剩余时间: 0 秒" -ForegroundColor Gray
Write-Host ""

Write-Host "🧪 开始测试..." -ForegroundColor Cyan
Write-Host ""

# 运行测试脚本
& "$PSScriptRoot\test-admin.ps1"


# Refine 集成测试脚本 (PowerShell)

Write-Host "🧪 运行 Refine 集成测试..." -ForegroundColor Cyan
Write-Host ""

# 运行 Data Provider 测试
Write-Host "📦 测试 Data Provider..." -ForegroundColor Yellow
pnpm test tests/lib/providers/refine-data-provider.test.ts --run

# 运行 Auth Provider 测试
Write-Host ""
Write-Host "🔐 测试 Auth Provider..." -ForegroundColor Yellow
pnpm test tests/lib/providers/refine-auth-provider.test.ts --run

# 运行页面组件测试
Write-Host ""
Write-Host "📄 测试页面组件..." -ForegroundColor Yellow
pnpm test tests/app/admin --run

Write-Host ""
Write-Host "✅ 测试完成！" -ForegroundColor Green


# Refine 压力测试脚本
# 运行所有压力测试和边界情况测试

Write-Host "🧪 运行 Refine 压力测试和边界情况测试..." -ForegroundColor Cyan
Write-Host ""

# 测试 Data Provider 压力测试
Write-Host "📦 测试 Data Provider 压力测试..." -ForegroundColor Yellow
pnpm test tests/lib/providers/refine-data-provider-stress.test.ts --run
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Data Provider 压力测试失败" -ForegroundColor Red
    exit 1
}
Write-Host ""

# 测试 Auth Provider 压力测试
Write-Host "🔐 测试 Auth Provider 压力测试..." -ForegroundColor Yellow
pnpm test tests/lib/providers/refine-auth-provider-stress.test.ts --run
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Auth Provider 压力测试失败" -ForegroundColor Red
    exit 1
}
Write-Host ""

# 测试集成测试
Write-Host "🔗 测试集成测试..." -ForegroundColor Yellow
pnpm test tests/app/admin/integration.test.tsx tests/lib/providers/refine-provider-integration.test.tsx --run
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ 集成测试失败" -ForegroundColor Red
    exit 1
}
Write-Host ""

Write-Host "✅ 所有压力测试完成！" -ForegroundColor Green


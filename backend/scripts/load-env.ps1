# 加载环境变量脚本 (PowerShell)
# 从 .env 文件加载环境变量

$envFile = Join-Path $PSScriptRoot "..\.env"

if (Test-Path $envFile) {
    Write-Host "📝 从 .env 文件加载环境变量..." -ForegroundColor Cyan
    
    Get-Content $envFile | ForEach-Object {
        if ($_ -match '^\s*([^#][^=]*)=(.*)$') {
            $key = $matches[1].Trim()
            $value = $matches[2].Trim()
            
            # 移除引号（如果有）
            $value = $value -replace '^["''](.*)["'']$', '$1'
            
            [Environment]::SetEnvironmentVariable($key, $value, "Process")
            Write-Host "  ✓ $key" -ForegroundColor Green
        }
    }
    
    Write-Host "✅ 环境变量加载完成" -ForegroundColor Green
} else {
    Write-Host "⚠️  .env 文件不存在，使用默认值" -ForegroundColor Yellow
    Write-Host "   请复制 .env.example 到 .env 并配置" -ForegroundColor Yellow
}


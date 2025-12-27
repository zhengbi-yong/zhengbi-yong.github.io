# 确保 .env 文件存在

$envFile = Join-Path $PSScriptRoot "..\.env"
$exampleFile = Join-Path $PSScriptRoot "..\.env.example"

if (-not (Test-Path $envFile)) {
    if (Test-Path $exampleFile) {
        Copy-Item $exampleFile $envFile
        Write-Host "✅ .env 文件已创建（从 .env.example）" -ForegroundColor Green
    } else {
        Write-Host "❌ .env.example 文件不存在" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "✅ .env 文件已存在" -ForegroundColor Green
}


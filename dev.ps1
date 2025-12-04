# 设置控制台输出编码为 UTF-8，避免 Unicode 字符显示乱码
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8
# 设置 Windows 控制台代码页为 UTF-8 (65001)
chcp 65001 | Out-Null

# 辅助函数：输出错误信息
function Write-ErrorMsg {
    param([string]$Message)
    Write-Host "❌ 错误: $Message" -ForegroundColor Red
}

# 辅助函数：输出成功信息
function Write-Success {
    param([string]$Message)
    Write-Host "✅ $Message" -ForegroundColor Green
}

# 辅助函数：输出步骤信息
function Write-Step {
    param([string]$Message)
    Write-Host "`n📋 $Message" -ForegroundColor Cyan
}

corepack enable
$env:PWD = $(Get-Location).Path
# 抑制 Node.js v23.8.0 的 source map 警告（这些警告不影响功能）
$env:NODE_OPTIONS = "--no-warnings"
# Windows 文件监听配置：启用 chokidar 轮询模式以解决文件变更检测问题
$env:CHOKIDAR_USEPOLLING = "true"

# 步骤 1: 运行 contentlayer 生成文章文件
Write-Step "步骤 1/2: 生成 Contentlayer 文件"
Write-Host "正在运行 pnpm contentlayer..." -ForegroundColor Gray

try {
    # 运行 contentlayer，捕获所有输出
    $contentlayerOutput = pnpm contentlayer 2>&1
    
    # 将输出转换为字符串用于检查
    $outputString = $contentlayerOutput | Out-String
    
    # 检查退出码
    $exitCode = $LASTEXITCODE
    if ($exitCode -ne 0 -and $exitCode -ne $null) {
        Write-ErrorMsg "Contentlayer 生成失败！退出代码: $exitCode"
        Write-Host $outputString -ForegroundColor Red
        Write-Host "`n请检查:" -ForegroundColor Yellow
        Write-Host "  1. 文章文件的 frontmatter 格式是否正确" -ForegroundColor Yellow
        Write-Host "  2. 是否有 YAML 解析错误" -ForegroundColor Yellow
        Write-Host "  3. 文章文件路径是否符合配置 (data/blog/**/*.mdx)" -ForegroundColor Yellow
        exit 1
    }
    
    # 检查输出中是否有错误或警告（更严格的检查）
    if ($outputString -match "failed with|Error:|ERROR|YAMLParseError|Invalid markdown") {
        Write-ErrorMsg "Contentlayer 生成过程中发现错误！"
        Write-Host $outputString -ForegroundColor Red
        Write-Host "`n请修复上述错误后重试" -ForegroundColor Yellow
        exit 1
    }
    
    # 检查是否有 "Skipping documents" 警告（这表示有文件被跳过）
    if ($outputString -match "Skipping documents|problems in.*documents") {
        Write-ErrorMsg "Contentlayer 发现文档问题，部分文件被跳过！"
        Write-Host $outputString -ForegroundColor Red
        Write-Host "`n请修复上述问题后重试" -ForegroundColor Yellow
        exit 1
    }
    
    Write-Success "Contentlayer 命令执行完成"
    
    # 显示 contentlayer 的输出（如果有）
    if ($outputString.Trim()) {
        Write-Host $outputString -ForegroundColor Gray
    }
}
catch {
    Write-ErrorMsg "运行 contentlayer 时出错: $_"
    exit 1
}

# 步骤 2: 验证生成的文件
Write-Step "步骤 2/2: 验证生成的文件"

# 检查关键文件是否存在
$requiredFiles = @(
    ".contentlayer/generated/Blog/_index.mjs",
    ".contentlayer/generated/Blog/_index.json",
    ".contentlayer/generated/index.mjs"
)

$missingFiles = @()
foreach ($file in $requiredFiles) {
    if (-not (Test-Path $file)) {
        $missingFiles += $file
    }
}

if ($missingFiles.Count -gt 0) {
    Write-ErrorMsg "缺少必需的生成文件:"
    foreach ($file in $missingFiles) {
        Write-Host "  - $file" -ForegroundColor Red
    }
    Write-Host "`n请检查 contentlayer 配置和文章文件格式" -ForegroundColor Yellow
    exit 1
}

# 检查 _index.mjs 文件是否包含文章数据
try {
    $indexContent = Get-Content ".contentlayer/generated/Blog/_index.mjs" -Raw
    if (-not $indexContent -or $indexContent -notmatch "allBlogs") {
        Write-ErrorMsg "生成的文件格式不正确，allBlogs 未找到"
        exit 1
    }
    
    # 检查是否有文章被导入
    $importCount = ([regex]::Matches($indexContent, "import.*from")).Count
    if ($importCount -eq 0) {
        Write-ErrorMsg "没有找到任何文章导入，请检查文章文件是否存在"
        Write-Host "`n请确认 data/blog/ 目录下有 .mdx 文件" -ForegroundColor Yellow
        exit 1
    }
    
    Write-Success "验证通过 (找到 $importCount 个文章导入)"
}
catch {
    Write-ErrorMsg "验证生成文件时出错: $_"
    exit 1
}

# 步骤 3: 启动开发服务器
Write-Step "启动开发服务器"
Write-Host "`n正在启动 Next.js 开发服务器..." -ForegroundColor Gray
Write-Host "Contentlayer 文件已成功生成，开发服务器将自动监听文件变化`n" -ForegroundColor Green

# 启动开发服务器，过滤掉 source map 相关的警告和错误
# 使用 ForEach-Object 过滤输出，保持交互性
pnpm dev 2>&1 | ForEach-Object {
    if ($_ -notmatch "Invalid source map" -and 
        $_ -notmatch "sourceMapURL could not be parsed" -and
        $_ -notmatch "--no-source-maps is not allowed") {
        $_
    }
}
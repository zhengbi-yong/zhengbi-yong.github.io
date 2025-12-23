# ============================================
# 博客部署脚本 - 优化版本
# 功能：代码检查 -> 构建 -> 同步到远程服务器
# ============================================

# 设置错误处理：遇到错误立即停止
$ErrorActionPreference = "Stop"

# 颜色输出函数
function Write-Step {
    param([string]$Message)
    Write-Host "`n[步骤] $Message" -ForegroundColor Cyan
}

function Write-Success {
    param([string]$Message)
    Write-Host "[成功] $Message" -ForegroundColor Green
}

function Write-ErrorMsg {
    param([string]$Message)
    Write-Host "[错误] $Message" -ForegroundColor Red
}

function Write-WarningMsg {
    param([string]$Message)
    Write-Host "[警告] $Message" -ForegroundColor Yellow
}

# 获取脚本所在目录和项目根目录
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$projectRoot = Split-Path -Parent $scriptDir
$frontendDir = Join-Path $projectRoot "frontend"

# 配置变量
$sourceFolder = Join-Path $frontendDir "out"
$remoteUser = "ubuntu"
$remoteIP = "152.136.43.194"
$remotePort = 22
$remotePath = "/home/ubuntu/PersonalBlog/out/"

# 强制覆盖选项：如果设置为 $true，将忽略时间戳和内容比较，强制传输所有文件
# 如果网站没有更新，可以尝试将此选项设置为 $true
$forceOverwrite = $false

# 切换到前端目录
Write-Step "切换到前端目录: $frontendDir"
Push-Location $frontendDir

# 检查必需的工具
Write-Step "检查必需的工具..."

$requiredTools = @(
    @{ Name = "pnpm"; Path = "pnpm" },
    @{ Name = "corepack"; Path = "corepack" },
    @{ Name = "cygpath"; Path = "C:\cygwin64\bin\cygpath.exe" },
    @{ Name = "rsync"; Path = "C:\cygwin64\bin\rsync.exe" },
    @{ Name = "sshpass"; Path = "C:\cygwin64\bin\sshpass.exe" },
    @{ Name = "ssh"; Path = "C:\cygwin64\bin\ssh.exe" }
)

foreach ($tool in $requiredTools) {
    if ($tool.Path -eq "pnpm" -or $tool.Path -eq "corepack") {
        $command = Get-Command $tool.Name -ErrorAction SilentlyContinue
        if (-not $command) {
            Write-ErrorMsg "$($tool.Name) 未找到，请确保已安装 Node.js 和 pnpm"
            exit 1
        }
    }
    else {
        if (-not (Test-Path $tool.Path)) {
            Write-ErrorMsg "$($tool.Name) 未找到: $($tool.Path)"
            exit 1
        }
    }
}

Write-Success "所有必需的工具都已找到"

# 步骤 1: 代码检查
# 注意：Next.js 16 的 lint 命令不支持 --fix 选项
# 如需自动修复，可手动运行: npx eslint --fix
Write-Step "步骤 1/4: 运行代码检查 (pnpm lint)"
try {
    $lintResult = pnpm lint 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-WarningMsg "代码检查发现一些问题，但继续执行..."
        Write-Host $lintResult
    }
    else {
        Write-Success "代码检查通过"
    }
}
catch {
    Write-ErrorMsg "代码检查失败: $_"
    exit 1
}

# 步骤 2: 构建项目
Write-Step "步骤 2/4: 构建项目 (pnpm build)"

# 设置环境变量
corepack enable
$env:PWD = $frontendDir
$env:EXPORT = "1"
# 静态导出模式下必须设置 UNOPTIMIZED=1，否则 Next.js Image 组件无法正确处理图片路径
# 注意：静态导出模式下 Next.js 图片优化器不可用，必须禁用优化
$env:UNOPTIMIZED = "1"

# 生产环境优化配置
$env:NODE_ENV = "production"
$env:NEXT_TELEMETRY_DISABLED = "1"  # 禁用遥测以加快构建速度

Write-Host "环境变量设置:" -ForegroundColor Gray
Write-Host "  PWD = $env:PWD" -ForegroundColor Gray
Write-Host "  EXPORT = $env:EXPORT" -ForegroundColor Gray
Write-Host "  UNOPTIMIZED = $env:UNOPTIMIZED" -ForegroundColor Gray
Write-Host "  NODE_ENV = $env:NODE_ENV" -ForegroundColor Gray
Write-Host "  NEXT_TELEMETRY_DISABLED = $env:NEXT_TELEMETRY_DISABLED" -ForegroundColor Gray
Write-Host "  静态导出模式: 已启用（UNOPTIMIZED=1，图片优化已禁用）" -ForegroundColor Green

try {
    Write-Host "开始构建..." -ForegroundColor Gray
    $buildResult = pnpm build 2>&1
    
    # 检查构建是否成功
    if ($LASTEXITCODE -ne 0) {
        Write-ErrorMsg "构建失败！退出代码: $LASTEXITCODE"
        Write-Host $buildResult
        exit 1
    }
    
    Write-Success "构建完成"
}
catch {
    Write-ErrorMsg "构建过程出错: $_"
    exit 1
}

# 步骤 3: 验证构建结果
Write-Step "步骤 3/4: 验证构建结果"

if (-not (Test-Path $sourceFolder)) {
    Write-ErrorMsg "构建输出目录不存在: $sourceFolder"
    Write-Host "请检查构建是否成功完成" -ForegroundColor Yellow
    exit 1
}

# 检查目录是否为空
$fileCount = (Get-ChildItem -Path $sourceFolder -Recurse -File | Measure-Object).Count
if ($fileCount -eq 0) {
    Write-ErrorMsg "构建输出目录为空: $sourceFolder"
    Write-Host "请检查构建配置和日志" -ForegroundColor Yellow
    exit 1
}

Write-Success "构建验证通过 (找到 $fileCount 个文件)"

# 检查关键文件
$keyFiles = @("index.html", "_next")
$missingFiles = @()
foreach ($file in $keyFiles) {
    $filePath = Join-Path $sourceFolder $file
    if (-not (Test-Path $filePath)) {
        $missingFiles += $file
    }
}

if ($missingFiles.Count -gt 0) {
    Write-WarningMsg "缺少关键文件: $($missingFiles -join ', ')"
    Write-Host "构建可能不完整，但继续执行同步..." -ForegroundColor Yellow
}
else {
    Write-Success "关键文件检查通过"
}

# 步骤 4: 同步到远程服务器
Write-Step "步骤 4/4: 同步到远程服务器"

# 转换路径为 Cygwin 格式
try {
    $cygwinSource = (& "C:\cygwin64\bin\cygpath.exe" -u $sourceFolder).Trim()
    # 确保源路径末尾有 /，这样 rsync 会同步目录内容而不是目录本身
    if (-not $cygwinSource.EndsWith("/")) {
        $cygwinSource = $cygwinSource + "/"
    }
    Write-Host "源路径 (Windows): $sourceFolder" -ForegroundColor Gray
    Write-Host "源路径 (Cygwin): $cygwinSource" -ForegroundColor Gray
}
catch {
    Write-ErrorMsg "路径转换失败: $_"
    exit 1
}

# 检查 SSH 连接（可选，但有助于调试）
Write-Host "测试 SSH 连接..." -ForegroundColor Gray
try {
    $sshTest = & "C:\cygwin64\bin\sshpass.exe" -p 'YzBxxM2000818.P' "C:\cygwin64\bin\ssh.exe" -p $remotePort -o ConnectTimeout=5 -o StrictHostKeyChecking=no -o UserKnownHostsFile=/cygdrive/c/Users/Sisyphus/.ssh/known_hosts "${remoteUser}@${remoteIP}" "echo 'SSH connection test'" 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Success "SSH 连接测试成功"
    }
    else {
        Write-WarningMsg "SSH 连接测试失败，但继续执行同步..."
        Write-Host $sshTest
    }
}
catch {
    Write-WarningMsg "SSH 连接测试出错，但继续执行同步: $_"
}

# 执行 rsync 同步
Write-Host "开始同步文件..." -ForegroundColor Gray
Write-Host "  源: $cygwinSource" -ForegroundColor Gray
Write-Host "  目标: ${remoteUser}@${remoteIP}:${remotePath}" -ForegroundColor Gray

try {
    # rsync 参数说明：
    # -a: archive 模式（保留权限、符号链接等，但不保留时间戳）
    # -v: verbose（详细输出）
    # -z: 压缩传输
    # -P: 显示进度并支持断点续传
    # --delete: 删除目标目录中源目录不存在的文件
    # --checksum: 基于文件内容而不是时间戳和大小比较（强制检查文件是否真的相同）
    # --ignore-times: 忽略时间戳，总是传输文件（强制覆盖模式）
    # --stats: 显示统计信息
    # 注意：移除了 -t 参数（保留时间戳），因为这会阻止文件覆盖
    
    # 构建 rsync 参数数组（扁平化，避免嵌套数组问题）
    $rsyncArgs = @(
        "-avzP",
        "--delete",
        "--stats",
        "--verbose"   # 更详细的输出，便于调试
    )
    
    # 根据强制覆盖选项选择不同的比较方式
    if ($forceOverwrite) {
        Write-WarningMsg "使用强制覆盖模式（--ignore-times），将传输所有文件"
        $rsyncArgs += "--ignore-times"
    }
    else {
        Write-Host "使用内容比较模式（--checksum），只传输有变化的文件" -ForegroundColor Gray
        $rsyncArgs += "--checksum"
    }
    
    # 添加 SSH 命令和路径参数
    $rsyncArgs += "-e"
    $rsyncArgs += "C:\cygwin64\bin\sshpass.exe -p 'YzBxxM2000818.P' C:\cygwin64\bin\ssh.exe -p $remotePort -o UserKnownHostsFile=/cygdrive/c/Users/Sisyphus/.ssh/known_hosts"
    $rsyncArgs += $cygwinSource
    $rsyncArgs += "${remoteUser}@${remoteIP}:${remotePath}"
    
    Write-Host "执行 rsync 命令..." -ForegroundColor Gray
    Write-Host "参数: $($rsyncArgs -join ' ')" -ForegroundColor Gray
    
    # 使用 @rsyncArgs 展开数组参数
    $rsyncOutput = & "C:\cygwin64\bin\rsync.exe" @rsyncArgs 2>&1
    
    # 显示完整的 rsync 输出（用于调试）
    Write-Host "`nrsync 完整输出:" -ForegroundColor Cyan
    Write-Host $rsyncOutput
    
    if ($LASTEXITCODE -ne 0) {
        Write-ErrorMsg "rsync 同步失败！退出代码: $LASTEXITCODE"
        Write-Host "`n请检查:" -ForegroundColor Yellow
        Write-Host "  1. SSH 连接是否正常" -ForegroundColor Yellow
        Write-Host "  2. 远程目录权限是否正确" -ForegroundColor Yellow
        Write-Host "  3. 远程路径是否存在" -ForegroundColor Yellow
        exit 1
    }
    
    Write-Success "文件同步完成"
    
    # 显示同步统计信息
    $stats = $rsyncOutput | Select-String -Pattern "Number of files|Total file size|sent|received|Total transferred"
    if ($stats) {
        Write-Host "`n同步统计:" -ForegroundColor Cyan
        Write-Host $stats
    }
    
    # 检查是否有文件被传输
    $filesTransferred = $rsyncOutput | Select-String -Pattern "Number of regular files transferred: (\d+)"
    if ($filesTransferred) {
        $fileCount = [int]($filesTransferred.Matches[0].Groups[1].Value)
        if ($fileCount -eq 0) {
            Write-WarningMsg "没有文件被传输！这可能意味着："
            Write-Host "  - 所有文件已经是最新的（基于内容比较）" -ForegroundColor Yellow
            Write-Host "  - 或者文件路径不正确" -ForegroundColor Yellow
            Write-Host "`n建议：如果网站没有更新，尝试使用 --ignore-times 参数强制传输所有文件" -ForegroundColor Yellow
        }
        else {
            Write-Success "已传输 $fileCount 个文件"
        }
    }
    
}
catch {
    Write-ErrorMsg "rsync 执行出错: $_"
    exit 1
}

# 验证同步结果（可选）
Write-Host "`n验证同步结果..." -ForegroundColor Gray
try {
    $verifyCommand = "test -d ${remotePath} && echo 'Directory exists' || echo 'Directory not found'"
    $verifyResult = & "C:\cygwin64\bin\sshpass.exe" -p 'YzBxxM2000818.P' "C:\cygwin64\bin\ssh.exe" -p $remotePort -o UserKnownHostsFile=/cygdrive/c/Users/Sisyphus/.ssh/known_hosts "${remoteUser}@${remoteIP}" $verifyCommand 2>&1
    
    if ($verifyResult -match "Directory exists") {
        Write-Success "远程目录验证通过"
    }
    else {
        Write-WarningMsg "远程目录验证失败，但文件可能已同步"
    }
    
    # 验证关键目录和文件是否存在
    Write-Host "`n验证关键资源文件..." -ForegroundColor Gray
    $keyDirs = @("assets", "static", "_next")
    foreach ($dir in $keyDirs) {
        $checkCommand = "test -d ${remotePath}${dir} && echo 'exists' || echo 'missing'"
        $checkResult = & "C:\cygwin64\bin\sshpass.exe" -p 'YzBxxM2000818.P' "C:\cygwin64\bin\ssh.exe" -p $remotePort -o UserKnownHostsFile=/cygdrive/c/Users/Sisyphus/.ssh/known_hosts "${remoteUser}@${remoteIP}" $checkCommand 2>&1
        
        if ($checkResult -match "exists") {
            Write-Success "目录 ${dir} 存在"
        }
        else {
            Write-WarningMsg "目录 ${dir} 不存在或无法访问"
        }
    }
    
    # 检查图片文件数量
    $imageCountCommand = "find ${remotePath}assets ${remotePath}static -type f \( -iname '*.jpg' -o -iname '*.png' -o -iname '*.webp' -o -iname '*.svg' -o -iname '*.gif' \) 2>/dev/null | wc -l"
    $imageCountResult = & "C:\cygwin64\bin\sshpass.exe" -p 'YzBxxM2000818.P' "C:\cygwin64\bin\ssh.exe" -p $remotePort -o UserKnownHostsFile=/cygdrive/c/Users/Sisyphus/.ssh/known_hosts "${remoteUser}@${remoteIP}" $imageCountCommand 2>&1
    
    if ($imageCountResult -match "^\d+$") {
        $count = [int]$imageCountResult.Trim()
        if ($count -gt 0) {
            Write-Success "找到 $count 个图片文件"
        }
        else {
            Write-WarningMsg "未找到图片文件，这可能是问题所在！"
        }
    }
}
catch {
    Write-WarningMsg "无法验证远程目录: $_"
}

# 完成
Write-Host "`n" -NoNewline
Write-Success "============================================"
Write-Success "部署完成！"
Write-Success "============================================"
Write-Host "`n网站应该已经更新。如果网站没有更新，请检查:" -ForegroundColor Yellow
Write-Host "  1. 远程服务器的 Web 服务器配置" -ForegroundColor Yellow
Write-Host "  2. 远程目录权限是否正确" -ForegroundColor Yellow
Write-Host "  3. Web 服务器是否已重启或重新加载配置" -ForegroundColor Yellow
Write-Host "  4. 浏览器缓存（尝试强制刷新 Ctrl+F5）" -ForegroundColor Yellow
Write-Host '  5. 如果仍然没有更新，尝试将脚本中的 $forceOverwrite = $false 改为 $forceOverwrite = $true' -ForegroundColor Yellow

# 恢复工作目录
Pop-Location

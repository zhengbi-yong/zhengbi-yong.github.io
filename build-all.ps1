# =============================================================================
# 本地构建所有 Docker 镜像 - Windows PowerShell 版本
# =============================================================================

# 错误时停止
$ErrorActionPreference = "Stop"

# 颜色输出函数
function Write-ColorOutput($ForegroundColor) {
    $fc = $host.UI.RawUI.ForegroundColor
    $host.UI.RawUI.ForegroundColor = $ForegroundColor
    if ($args) {
        Write-Output $args
    }
    $host.UI.RawUI.ForegroundColor = $fc
}

function Write-Info {
    Write-ColorOutput Green "[INFO] $args"
}

function Write-Warn {
    Write-ColorOutput Yellow "[WARN] $args"
}

function Write-Error {
    Write-ColorOutput Red "[ERROR] $args"
}

Write-Output "========================================"
Write-Output "  本地构建所有 Docker 镜像 (Windows)"
Write-Output "========================================"
Write-Output ""

# 获取脚本所在目录
$SCRIPT_DIR = Split-Path -Parent $MyInvocation.MyCommand.Path
$PROJECT_ROOT = $SCRIPT_DIR
Set-Location $PROJECT_ROOT

# 1. 检查 Docker
Write-Info "步骤 1/4: 检查 Docker 环境..."

try {
    docker --version | Out-Null
    Write-Info "Docker 环境检查通过 ✓"
} catch {
    Write-Error "Docker 未安装或不在 PATH 中"
    Write-Output "请安装 Docker Desktop: https://www.docker.com/products/docker-desktop"
    exit 1
}

# 2. 拉取基础镜像
Write-Output ""
Write-Info "步骤 2/4: 拉取所有基础镜像..."
Write-Output "正在拉取:"
Write-Output "  - postgres:17-alpine"
Write-Output "  - redis:7.4-alpine"
Write-Output "  - nginx:1.27-alpine"
Write-Output "  - rustlang/rust:nightly-slim"
Write-Output "  - node:22-alpine"
Write-Output "  - debian:bookworm-slim"
Write-Output ""

$jobs = @()
$jobs += Start-Job -ScriptBlock { docker pull postgres:17-alpine }
$jobs += Start-Job -ScriptBlock { docker pull redis:7.4-alpine }
$jobs += Start-Job -ScriptBlock { docker pull nginx:1.27-alpine }
$jobs += Start-Job -ScriptBlock { docker pull rustlang/rust:nightly-slim }
$jobs += Start-Job -ScriptBlock { docker pull node:22-alpine }
$jobs += Start-Job -ScriptBlock { docker pull debian:bookworm-slim }

$jobs | Wait-Job | Receive-Job
$jobs | Remove-Job

Write-Info "所有基础镜像拉取完成 ✓"
Write-Output ""

# 3. 构建 Backend 镜像
Write-Info "步骤 3/4: 构建 Backend 镜像..."
Set-Location backend
docker build -t blog-backend:local -t blog-backend:latest -f Dockerfile .
if ($LASTEXITCODE -eq 0) {
    Write-Info "Backend 镜像构建完成 ✓"
} else {
    Write-Error "Backend 镜像构建失败"
    Set-Location $PROJECT_ROOT
    exit 1
}
Set-Location $PROJECT_ROOT
Write-Output ""

# 4. 构建 Frontend 镜像
Write-Info "步骤 4/4: 构建 Frontend 镜像..."
Set-Location frontend
docker build -t blog-frontend:local -t blog-frontend:latest -f Dockerfile .
if ($LASTEXITCODE -eq 0) {
    Write-Info "Frontend 镜像构建完成 ✓"
} else {
    Write-Error "Frontend 镜像构建失败"
    Set-Location $PROJECT_ROOT
    exit 1
}
Set-Location $PROJECT_ROOT
Write-Output ""

# 5. 显示构建的镜像
Write-Info "构建完成！正在显示镜像信息..."
Write-Output ""
Write-Output "构建的镜像:"
docker images | Select-String "blog-"

Write-Output ""
Write-Info "镜像信息:"
docker images blog-backend:local --format "  blog-backend: {{.Tag}} - {{.Size}}"
docker images blog-frontend:local --format "  blog-frontend: {{.Tag}} - {{.Size}}"
Write-Output ""

Write-Info "本地构建完成！"
Write-Output ""
Write-Output "下一步操作:"
Write-Output "  1. 测试镜像: .\test-local.ps1"
Write-Output "  2. 推送到仓库: .\push-images.ps1"
Write-Output "  3. 导出镜像: .\export-images.ps1"
Write-Output ""

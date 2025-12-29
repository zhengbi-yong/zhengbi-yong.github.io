# =============================================================================
# 导出所有镜像为 tar 文件 - Windows PowerShell 版本
# =============================================================================

$ErrorActionPreference = "Stop"

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

# 获取脚本所在目录
$SCRIPT_DIR = Split-Path -Parent $MyInvocation.MyCommand.Path
$PROJECT_ROOT = $SCRIPT_DIR
Set-Location $PROJECT_ROOT

# 创建导出目录
$EXPORT_DIR = "$PROJECT_ROOT\docker-images-export"
if (-not (Test-Path $EXPORT_DIR)) {
    New-Item -ItemType Directory -Path $EXPORT_DIR | Out-Null
}

Write-Output "========================================"
Write-Output "  导出所有 Docker 镜像 (Windows)"
Write-Output "========================================"
Write-Output ""
Write-Info "导出目录: $EXPORT_DIR"
Write-Output ""

# 1. 导出基础镜像
Write-Info "步骤 1/3: 导出基础镜像..."
docker save postgres:17-alpine -o "$EXPORT_DIR\postgres-17-alpine.tar"
docker save redis:7.4-alpine -o "$EXPORT_DIR\redis-7.4-alpine.tar"
docker save nginx:1.27-alpine -o "$EXPORT_DIR\nginx-1.27-alpine.tar"
Write-Info "基础镜像导出完成 ✓"
Write-Output ""

# 2. 导出应用镜像
Write-Info "步骤 2/3: 导出应用镜像..."
docker save blog-backend:local -o "$EXPORT_DIR\blog-backend-local.tar"
docker save blog-frontend:local -o "$EXPORT_DIR\blog-frontend-local.tar"
Write-Info "应用镜像导出完成 ✓"
Write-Output ""

# 3. 显示文件信息
Write-Info "步骤 3/3: 导出文件信息:"
Write-Output ""
Write-Output "导出的文件:"
Get-ChildItem $EXPORT_DIR -Filter "*.tar" | ForEach-Object {
    $size = [math]::Round($_.Length / 1MB, 2)
    Write-Output "  $($_.Name) - ${size} MB"
}

Write-Output ""

# 计算总大小
$totalSize = (Get-ChildItem $EXPORT_DIR -Filter "*.tar" | Measure-Object -Property Length -Sum).Sum
$totalSizeMB = [math]::Round($totalSize / 1MB, 2)
Write-Info "总大小: $totalSizeMB MB"
Write-Output ""

# 创建导入脚本（bash 格式，供 Linux 服务器使用）
$importScript = @"
#!/usr/bin/env bash
# 在服务器上导入所有镜像

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
NC='\033[0m'

log_info() { echo -e "`${GREEN}[INFO]`${NC} `$$1"; }

SCRIPT_DIR="\`$(cd "\`$(dirname "\`$0")" && pwd)"
cd "\`$SCRIPT_DIR"

echo "=========================================="
echo "  导入 Docker 镜像"
echo "=========================================="
echo ""

log_info "步骤 1/2: 导入基础镜像..."
docker load -i postgres-17-alpine.tar &
docker load -i redis-7.4-alpine.tar &
docker load -i nginx-1.27-alpine.tar &
wait
log_info "基础镜像导入完成 ✓"
echo ""

log_info "步骤 2/2: 导入应用镜像..."
docker load -i blog-backend-local.tar &
docker load -i blog-frontend-local.tar &
wait
log_info "应用镜像导入完成 ✓"
echo ""

log_info "所有镜像导入完成！"
echo ""
echo "查看镜像: docker images | grep -E 'postgres|redis|nginx|blog-'"
echo ""
"@

$importScript | Out-File -FilePath "$EXPORT_DIR\import-images.sh" -Encoding utf8
Write-Info "导入脚本已创建 ✓"
Write-Output ""

# 创建 README
$readme = @"
# Docker 镜像导出包

本目录包含了所有构建好的 Docker 镜像。

## 文件说明

- \`postgres-17-alpine.tar\` - PostgreSQL 数据库镜像
- \`redis-7.4-alpine.tar\` - Redis 缓存镜像
- \`nginx-1.27-alpine.tar\` - Nginx 反向代理镜像
- \`blog-backend-local.tar\` - 后端 API 镜像
- \`blog-frontend-local.tar\` - 前端应用镜像

## 在服务器上部署

### 1. 上传到服务器

**从 Windows 上传:**
\`\`\`powershell
# 使用 PowerShell
scp -r docker-images-export\ user@server:/path/to/project/

# 或使用 WinSCP、FileZilla 等工具
\`\`\`

**从 Linux/macOS 上传:**
\`\`\`bash
scp -r docker-images-export/ user@server:/path/to/project/
\`\`\`

### 2. 导入镜像

\`\`\`bash
cd docker-images-export
bash import-images.sh
\`\`\`

### 3. 部署应用

确保项目的 \`docker-compose.yml\` 配置为使用本地镜像：

\`\`\`bash
cd /path/to/project
docker compose up -d
\`\`\`

## 清理

部署完成后可以删除导出目录：

\`\`\`bash
rm -rf docker-images-export
\`\`\`

## 文件大小

总大小: $totalSizeMB MB
"@

$readme | Out-File -FilePath "$EXPORT_DIR\README.md" -Encoding utf8
Write-Info "README.md 已创建 ✓"
Write-Output ""

Write-Info "导出完成！"
Write-Output ""
Write-Output "下一步操作:"
Write-Output "  1. 将 docker-images-export\ 目录上传到服务器"
Write-Output "  2. 在服务器上运行: cd docker-images-export && bash import-images.sh"
Write-Output ""

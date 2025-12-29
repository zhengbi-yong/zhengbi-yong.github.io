# =============================================================================
# 推送镜像到 Docker Hub 或阿里云 - Windows PowerShell 版本
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

function Write-Warn {
    Write-ColorOutput Yellow "[WARN] $args"
}

function Write-Error {
    Write-ColorOutput Red "[ERROR] $args"
}

# 获取脚本所在目录
$SCRIPT_DIR = Split-Path -Parent $MyInvocation.MyCommand.Path
$PROJECT_ROOT = $SCRIPT_DIR
Set-Location $PROJECT_ROOT

# 读取或创建配置
$CONFIG_FILE = ".docker-registry"

if (Test-Path $CONFIG_FILE) {
    Get-Content $CONFIG_FILE | ForEach-Object {
        if ($_ -match "REGISTRY=(.+)") {
            $REGISTRY = $matches[1]
        }
    }
} else {
    Write-Output "========================================"
    Write-Output "  配置 Docker 镜像仓库"
    Write-Output "========================================"
    Write-Output ""
    Write-Output "选择镜像仓库:"
    Write-Output "  1) Docker Hub (https://hub.docker.com)"
    Write-Output "  2) 阿里云容器镜像服务"
    Write-Output "  3) 其他私有仓库"
    Write-Output ""

    $choice = Read-Host "请选择 [1-3]"

    switch ($choice) {
        "1" {
            $DOCKER_USERNAME = Read-Host "请输入 Docker Hub 用户名"
            $REGISTRY = "docker.io/$DOCKER_USERNAME"
        }
        "2" {
            $ALIYUN_NAMESPACE = Read-Host "请输入阿里云命名空间"
            $REGISTRY = "registry.cn-hangzhou.aliyuncs.com/$ALIYUN_NAMESPACE"
        }
        "3" {
            $REGISTRY = Read-Host "请输入仓库地址"
        }
        default {
            Write-Error "无效选择"
            exit 1
        }
    }

    # 保存配置
    "REGISTRY=$REGISTRY" | Out-File -FilePath $CONFIG_FILE -Encoding utf8
    Write-Output ""
    Write-Info "配置已保存到 $CONFIG_FILE"
    Write-Output ""
}

Write-Output "========================================"
Write-Output "  推送镜像到仓库 (Windows)"
Write-Output "========================================"
Write-Output ""
Write-Info "目标仓库: $REGISTRY"
Write-Output ""

# 获取版本号
if (Test-Path "VERSION") {
    $VERSION = Get-Content "VERSION" -First 1
} else {
    $VERSION = "latest"
    Write-Warn "VERSION 文件不存在，使用 'latest' 作为版本号"
}

# 获取时间戳
$TIMESTAMP = Get-Date -Format "yyyyMMddHHmmss"

# 1. 标记镜像
Write-Info "步骤 1/2: 标记镜像..."

# Backend
docker tag blog-backend:local "$REGISTRY/blog-backend:$VERSION"
docker tag blog-backend:local "$REGISTRY/blog-backend:$TIMESTAMP"
docker tag blog-backend:latest "$REGISTRY/blog-backend:latest"
Write-Info "Backend 镜像标记完成 ✓"

# Frontend
docker tag blog-frontend:local "$REGISTRY/blog-frontend:$VERSION"
docker tag blog-frontend:local "$REGISTRY/blog-frontend:$TIMESTAMP"
docker tag blog-frontend:latest "$REGISTRY/blog-frontend:latest"
Write-Info "Frontend 镜像标记完成 ✓"

Write-Output ""
Write-Info "步骤 2/2: 推送镜像到仓库..."
Write-Output ""

# 检查登录状态
$info = docker info 2>&1
if ($info -notmatch "Username") {
    Write-Warn "未检测到 Docker 登录状态"
    docker login
}

# 推送镜像
Write-Output "正在推送 blog-backend:$VERSION..."
docker push "$REGISTRY/blog-backend:$VERSION"

Write-Output "正在推送 blog-frontend:$VERSION..."
docker push "$REGISTRY/blog-frontend:$VERSION"

Write-Output ""
Write-Output "正在推送 latest 标签..."
docker push "$REGISTRY/blog-backend:latest"
docker push "$REGISTRY/blog-frontend:latest"

Write-Info "所有镜像推送完成 ✓"
Write-Output ""

Write-Output "推送的镜像:"
Write-Output "  $REGISTRY/blog-backend:$VERSION"
Write-Output "  $REGISTRY/blog-backend:$TIMESTAMP"
Write-Output "  $REGISTRY/blog-backend:latest"
Write-Output "  $REGISTRY/blog-frontend:$VERSION"
Write-Output "  $REGISTRY/blog-frontend:$TIMESTAMP"
Write-Output "  $REGISTRY/blog-frontend:latest"
Write-Output ""

Write-Info "推送完成！"
Write-Output ""
Write-Output "在服务器上部署:"
Write-Output "  bash deploy-server.sh $REGISTRY $VERSION"
Write-Output ""

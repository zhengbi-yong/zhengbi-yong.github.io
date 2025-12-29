# 博客系统Docker一键部署脚本 (Windows PowerShell)

$ErrorActionPreference = "Stop"

function Write-ColorOutput {
    param(
        [string]$Message,
        [string]$Color = "White"
    )
    Write-Host $Message -ForegroundColor $Color
}

function Write-Info {
    param([string]$Message)
    Write-ColorOutput "[INFO] $Message" Green
}

function Write-Warn {
    param([string]$Message)
    Write-ColorOutput "[WARN] $Message" Yellow
}

function Write-Error {
    param([string]$Message)
    Write-ColorOutput "[ERROR] $Message" Red
}

# 检查依赖
function Test-Dependencies {
    Write-Info "检查依赖..."

    try {
        $null = Get-Command docker -ErrorAction Stop
        $null = docker compose version
        Write-Info "依赖检查通过 ✓"
        return $true
    }
    catch {
        Write-Error "Docker或Docker Compose未安装，请先安装Docker Desktop"
        return $false
    }
}

# 生成安全密钥
function New-Secrets {
    Write-Info "生成安全密钥..."

    $jwtSecret = -join ((48..57) + (65..90) + (97..122) | Get-Random -Count 32 | % {[char]$_})
    $passwordPepper = -join ((48..57) + (65..90) + (97..122) | Get-Random -Count 32 | % {[char]$_})
    $sessionSecret = -join ((48..57) + (65..90) + (97..122) | Get-Random -Count 32 | % {[char]$_})
    $postgresPassword = -join ((48..57) + (65..90) + (97..122) | Get-Random -Count 16 | % {[char]$_})

    Write-Info "密钥已生成 ✓"
    return @{
        JWT_SECRET = $jwtSecret
        PASSWORD_PEPPER = $passwordPepper
        SESSION_SECRET = $sessionSecret
        POSTGRES_PASSWORD = $postgresPassword
    }
}

# 配置环境变量
function Initialize-Environment {
    Write-Info "配置环境变量..."

    if (!(Test-Path .env)) {
        if (Test-Path .env.docker.example) {
            Copy-Item .env.docker.example .env
            Write-Info "已创建.env文件"

            $secrets = New-Secrets

            # 更新安全密钥
            (Get-Content .env) -replace 'your_jwt_secret.*', $secrets.JWT_SECRET |
                Set-Content .env
            (Get-Content .env) -replace 'your_password_pepper.*', $secrets.PASSWORD_PEPPER |
                Set-Content .env
            (Get-Content .env) -replace 'your_session_secret.*', $secrets.SESSION_SECRET |
                Set-Content .env
            (Get-Content .env) -replace 'your_secure_postgres_password_here', $secrets.POSTGRES_PASSWORD |
                Set-Content .env

            Write-Info "已更新安全配置 ✓"
            Write-Warn "请编辑.env文件配置其他选项（如域名、邮箱等）"
        }
        else {
            Write-Error "未找到.env.docker.example模板文件"
            return $false
        }
    }
    else {
        Write-Info ".env文件已存在，跳过"
    }

    return $true
}

# 创建必要目录
function Initialize-Directories {
    Write-Info "创建必要目录..."

    $null = New-Item -ItemType Directory -Force -Path nginx\ssl
    $null = New-Item -ItemType Directory -Force -Path backups

    Write-Info "目录创建完成 ✓"
}

# 停止旧服务
function Stop-OldServices {
    Write-Info "停止旧服务..."

    # 停止backend docker-compose服务（如果存在）
    if (Test-Path backend\docker-compose.yml) {
        Push-Location backend
        docker compose down 2>$null | Out-Null
        Pop-Location
    }

    # 停止主服务
    docker compose down 2>$null | Out-Null

    Write-Info "旧服务已停止 ✓"
}

# 构建镜像
function Build-Images {
    Write-Info "构建Docker镜像（这可能需要几分钟）..."

    docker compose build --no-cache

    Write-Info "镜像构建完成 ✓"
}

# 启动服务
function Start-Services {
    Write-Info "启动所有服务..."

    docker compose up -d

    Write-Info "服务启动完成 ✓"
}

# 等待服务健康
function Wait-ForHealth {
    Write-Info "等待服务健康检查..."

    $maxAttempts = 60
    $attempt = 0

    while ($attempt -lt $maxAttempts) {
        $status = docker compose ps
        if ($status -match "healthy") {
            Write-Info "服务已健康 ✓"
            return
        }

        $attempt++
        Write-Host "." -NoNewline
        Start-Sleep -Seconds 2
    }

    Write-Host ""
    Write-Warn "部分服务可能还在启动中，请稍后检查"
}

# 显示状态
function Show-Status {
    Write-Host ""
    Write-Info "服务状态："
    docker compose ps

    Write-Host ""
    Write-Info "访问地址："
    Write-Host "  前端: http://localhost:3001"
    Write-Host "  后端: http://localhost:3000/v1/"
    Write-Host "  Nginx: http://localhost"

    Write-Host ""
    Write-Info "查看日志："
    Write-Host "  docker compose logs -f"

    Write-Host ""
    Write-Info "停止服务："
    Write-Host "  docker compose down"
}

# 主函数
function Main {
    Write-Host "======================================" -ForegroundColor Cyan
    Write-Host "  博客系统 Docker 一键部署脚本" -ForegroundColor Cyan
    Write-Host "======================================" -ForegroundColor Cyan
    Write-Host ""

    # 检查是否在项目根目录
    if (!(Test-Path docker-compose.yml)) {
        Write-Error "请在项目根目录运行此脚本"
        exit 1
    }

    # 执行部署步骤
    if (!(Test-Dependencies)) {
        exit 1
    }

    Initialize-Directories

    if (!(Initialize-Environment)) {
        exit 1
    }

    Write-Warn "即将停止旧服务并启动新服务..."
    $confirm = Read-Host "是否继续? (y/n)"

    if ($confirm -eq 'y' -or $confirm -eq 'Y') {
        Stop-OldServices
        Build-Images
        Start-Services
        Wait-ForHealth
        Show-Status

        Write-Host ""
        Write-Info "部署完成！🎉"
        Write-Host ""
        Write-Warn "首次访问可能较慢，因为需要初始化数据库..."
    }
    else {
        Write-Info "部署已取消"
        exit 0
    }
}

# 运行主函数
Main

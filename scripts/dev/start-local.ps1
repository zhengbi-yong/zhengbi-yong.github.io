#!/usr/bin/env pwsh
# 本地部署启动脚本
# 使用预构建的 Docker 镜像启动博客系统

Write-Host "=== 启动本地博客系统 ===" -ForegroundColor Green

# 检查镜像是否存在
$backendImage = docker images -q blog-backend:local
$frontendImage = docker images -q blog-frontend:local

if ([string]::IsNullOrEmpty($backendImage)) {
    Write-Host "错误: blog-backend:local 镜像不存在" -ForegroundColor Red
    Write-Host "请先运行: .\build-all.ps1" -ForegroundColor Yellow
    exit 1
}

if ([string]::IsNullOrEmpty($frontendImage)) {
    Write-Host "错误: blog-frontend:local 镜像不存在" -ForegroundColor Red
    Write-Host "请先运行: .\build-all.ps1" -ForegroundColor Yellow
    exit 1
}

Write-Host "✓ Docker 镜像检查通过" -ForegroundColor Green

# 检查并停止旧容器
Write-Host "检查旧容器..." -ForegroundColor Cyan
$oldContainers = @("blog-postgres", "blog-redis", "blog-backend", "blog-frontend", "blog-nginx")
foreach ($container in $oldContainers) {
    $existing = docker ps -a -q -f name=$container
    if (-not [string]::IsNullOrEmpty($existing)) {
        Write-Host "  停止并删除旧容器: $container" -ForegroundColor Yellow
        docker stop $container 2>$null | Out-Null
        docker rm $container 2>$null | Out-Null
    }
}
Write-Host "✓ 旧容器已清理" -ForegroundColor Green

# 检查 .env 文件
if (-not (Test-Path .env)) {
    Write-Host "创建 .env 文件..." -ForegroundColor Yellow
    Copy-Item .env.local.example .env
    Write-Host "✓ .env 文件已创建（使用默认配置）" -ForegroundColor Green
}

# 启动服务
Write-Host "启动 Docker 服务..." -ForegroundColor Cyan
docker compose -f docker-compose.local.yml up -d

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n=== 服务启动成功 ===" -ForegroundColor Green
    Write-Host "前端: http://localhost:3001" -ForegroundColor Cyan
    Write-Host "后端: http://localhost:3000" -ForegroundColor Cyan
    Write-Host "`n查看日志:" -ForegroundColor Yellow
    Write-Host "  docker compose -f docker-compose.local.yml logs -f" -ForegroundColor White
    Write-Host "`n停止服务:" -ForegroundColor Yellow
    Write-Host "  docker compose -f docker-compose.local.yml down" -ForegroundColor White
} else {
    Write-Host "`n启动失败，请检查错误信息" -ForegroundColor Red
    exit 1
}

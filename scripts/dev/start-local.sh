#!/bin/bash
# 本地部署启动脚本
# 使用预构建的 Docker 镜像启动博客系统

set -e

echo "=== 启动本地博客系统 ==="

# 检查镜像是否存在
BACKEND_IMAGE=$(docker images -q blog-backend:local)
FRONTEND_IMAGE=$(docker images -q blog-frontend:local)

if [ -z "$BACKEND_IMAGE" ]; then
    echo "错误: blog-backend:local 镜像不存在"
    echo "请先运行: ./build-all.sh"
    exit 1
fi

if [ -z "$FRONTEND_IMAGE" ]; then
    echo "错误: blog-frontend:local 镜像不存在"
    echo "请先运行: ./build-all.sh"
    exit 1
fi

echo "✓ Docker 镜像检查通过"

# 检查并停止旧容器
echo "检查旧容器..."
old_containers=("blog-postgres" "blog-redis" "blog-backend" "blog-frontend" "blog-nginx")
for container in "${old_containers[@]}"; do
    existing=$(docker ps -a -q -f name="$container")
    if [ -n "$existing" ]; then
        echo "  停止并删除旧容器: $container"
        docker stop "$container" >/dev/null 2>&1
        docker rm "$container" >/dev/null 2>&1
    fi
done
echo "✓ 旧容器已清理"

# 检查 .env 文件
if [ ! -f .env ]; then
    echo "创建 .env 文件..."
    cp .env.local.example .env
    echo "✓ .env 文件已创建（使用默认配置）"
fi

# 启动服务
echo "启动 Docker 服务..."
docker compose -f docker-compose.local.yml up -d

if [ $? -eq 0 ]; then
    echo ""
    echo "=== 服务启动成功 ==="
    echo "前端: http://localhost:3001"
    echo "后端: http://localhost:3000"
    echo ""
    echo "查看日志:"
    echo "  docker compose -f docker-compose.local.yml logs -f"
    echo ""
    echo "停止服务:"
    echo "  docker compose -f docker-compose.local.yml down"
else
    echo ""
    echo "启动失败，请检查错误信息"
    exit 1
fi

#!/usr/bin/env bash
# 测试并找到可用的 Docker 镜像版本

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() { echo -e "${GREEN}[INFO]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }

echo "=========================================="
echo "  Docker 镜像版本测试"
echo "=========================================="
echo ""

# 定义要测试的镜像和可能的版本
declare -A images
# PostgreSQL 版本
images[postgres]="16-alpine 15-alpine 14-alpine alpine latest"
# Redis 版本
images[redis]="7-alpine 7.2-alpine 6-alpine alpine latest"
# Nginx 版本（已确认可用）
images[nginx]="alpine latest"

found_versions=()

for service in "${!images[@]}"; do
    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE}测试 $service 镜像${NC}"
    echo -e "${BLUE}========================================${NC}"

    versions=${images[$service]}
    found=false

    for version in $versions; do
        image="$service:$version"
        echo -n "  测试 $image ... "

        if sudo docker pull "$image" > /dev/null 2>&1; then
            echo -e "${GREEN}✓ 成功${NC}"
            found_versions[$service]=$version
            found=true
            break
        else
            echo -e "${RED}✗ 失败${NC}"

            # 尝试国内镜像源
            cn_image="registry.cn-hangzhou.aliyuncs.com/library/$image"
            echo -n "    尝试阿里云: $cn_image ... "

            if sudo docker pull "$cn_image" > /dev/null 2>&1; then
                echo -e "${GREEN}✓ 成功${NC}"
                found_versions[$service]="阿里云: $cn_image"
                found=true
                break
            else
                echo -e "${RED}✗ 失败${NC}"
            fi
        fi
    done

    echo ""

    if [ "$found" = false ]; then
        log_error "$service: 没有找到可用的版本！"
    else
        log_info "$service: 可用版本 → ${found_versions[$service]}"
    fi

    echo ""
done

echo "=========================================="
echo "  测试结果汇总"
echo "=========================================="
echo ""

for service in "${!found_versions[@]}"; do
    echo -e "${GREEN}✓${NC} $service: ${found_versions[$service]}"
done

echo ""
log_info "正在更新 docker-compose.yml ..."

# 备份原文件
cp docker-compose.yml docker-compose.yml.backup

# 根据测试结果更新镜像版本
if [[ ${found_versions[postgres]} == *"阿里云:"* ]]; then
    postgres_image="${found_versions[postgres]#阿里云: }"
else
    postgres_image="postgres:${found_versions[postgres]}"
fi

if [[ ${found_versions[redis]} == *"阿里云:"* ]]; then
    redis_image="${found_versions[redis]#阿里云: }"
else
    redis_image="redis:${found_versions[redis]}"
fi

# 更新 docker-compose.yml
sed -i "s|image: postgres:.*|image: $postgres_image|g" docker-compose.yml
sed -i "s|image: redis:.*|image: $redis_image|g" docker-compose.yml

echo "已更新以下镜像:"
echo "  PostgreSQL: $postgres_image"
echo "  Redis: $redis_image"
echo "  Nginx: nginx:alpine (已确认可用)"
echo ""
echo "备份文件: docker-compose.yml.backup"
echo ""

# 验证更新后的配置
echo "=========================================="
echo "  验证更新后的配置"
echo "=========================================="
echo ""

grep "image:" docker-compose.yml | head -5

echo ""
log_info "配置更新完成！现在可以运行部署了："
echo ""
echo "  bash deploy-simple.sh"
echo ""

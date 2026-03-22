#!/usr/bin/env bash
# 测试所有 Docker 镜像是否可以成功拉取

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log_info() { echo -e "${GREEN}[INFO]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }

echo "=========================================="
echo "  Docker 镜像拉取测试"
echo "=========================================="
echo ""

# 测试镜像列表
images=(
    "redis:7.2-alpine"
    "postgres:16-alpine"
    "nginx:alpine"
)

success_count=0
fail_count=0

for image in "${images[@]}"; do
    echo -n "测试 $image ... "

    if sudo docker pull "$image" > /dev/null 2>&1; then
        echo -e "${GREEN}✓ 成功${NC}"
        ((success_count++))
    else
        echo -e "${RED}✗ 失败${NC}"
        ((fail_count++))

        # 尝试备用镜像
        log_warn "尝试使用备用镜像源..."

        case "$image" in
            redis*)
                if sudo docker pull "registry.cn-hangzhou.aliyuncs.com/library/$image" > /dev/null 2>&1; then
                    echo -e "  ${YELLOW}→ 阿里云镜像可用${NC}"
                fi
                ;;
            postgres*)
                if sudo docker pull "registry.cn-hangzhou.aliyuncs.com/library/$image" > /dev/null 2>&1; then
                    echo -e "  ${YELLOW}→ 阿里云镜像可用${NC}"
                fi
                ;;
            nginx*)
                if sudo docker pull "registry.cn-hangzhou.aliyuncs.com/library/$image" > /dev/null 2>&1; then
                    echo -e "  ${YELLOW}→ 阿里云镜像可用${NC}"
                fi
                ;;
        esac
    fi
done

echo ""
echo "=========================================="
echo "  测试结果汇总"
echo "=========================================="
echo -e "成功: ${GREEN}$success_count${NC}"
echo -e "失败: ${RED}$fail_count${NC}"
echo ""

if [ $fail_count -eq 0 ]; then
    log_info "所有镜像测试通过！可以开始部署了。"
    echo ""
    echo "运行部署命令:"
    echo "  bash scripts/deployment/deploy-compose-stack.sh --env-file .env.production"
    exit 0
else
    log_error "部分镜像测试失败！请查看上面的错误信息。"
    echo ""
    echo "建议操作:"
    echo "  1. 配置 Docker 镜像加速器（阿里云）"
    echo "  2. 或更新 docker-compose.production.yml 中的镜像来源"
    exit 1
fi

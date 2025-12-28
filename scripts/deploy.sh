#!/bin/bash
# 博客系统Docker一键部署脚本（增强版）
# 包含完整的异常处理和端口管理

set -e  # 遇到错误立即退出
# set -x  # 调试模式（取消注释以启用）

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

# 项目根目录
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_ROOT"

# 日志函数
print_info() { echo -e "${GREEN}[INFO]${NC} $1"; }
print_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
print_error() { echo -e "${RED}[ERROR]${NC} $1"; }
print_debug() { echo -e "${BLUE}[DEBUG]${NC} $1"; }
print_step() { echo -e "${CYAN}[STEP]${NC} $1"; }

# 错误处理
error_exit() {
    print_error "$1"
    exit 1
}

# 检查命令是否存在
check_command() {
    if ! command -v $1 &> /dev/null; then
        return 1
    fi
    return 0
}

# ========================================
# 步骤1: 环境检查
# ========================================
check_environment() {
    print_step "检查部署环境..."

    # 检查操作系统
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        OS="linux"
    elif [[ "$OSTYPE" == "darwin"* ]]; then
        OS="macos"
    else
        error_exit "不支持的操作系统: $OSTYPE"
    fi

    print_info "操作系统: $OS"

    # 检查Docker
    if ! check_command docker; then
        error_exit "Docker未安装，请先安装Docker"
    fi

    DOCKER_VERSION=$(docker --version | awk '{print $3}' | tr -d ',')
    print_info "Docker版本: $DOCKER_VERSION"

    # 检查Docker Compose
    if docker compose version &> /dev/null; then
        COMPOSE_CMD="docker compose"
    elif check_command docker-compose; then
        COMPOSE_CMD="docker-compose"
    else
        error_exit "Docker Compose未安装，请先安装Docker Compose"
    fi

    COMPOSE_VERSION=$($COMPOSE_CMD version --short 2>/dev/null || echo "unknown")
    print_info "Docker Compose版本: $COMPOSE_VERSION"

    # 检查Docker守护进程
    if ! docker info &> /dev/null; then
        error_exit "Docker守护进程未运行，请启动Docker"
    fi

    # 检查磁盘空间
    AVAILABLE_DISK=$(df -BG "$PROJECT_ROOT" | tail -1 | awk '{print $4}' | tr -d 'G')
    if [ "$AVAILABLE_DISK" -lt 10 ]; then
        print_warn "磁盘空间不足10GB，可能影响部署"
    else
        print_info "可用磁盘空间: ${AVAILABLE_DISK}GB"
    fi

    # 检查内存
    if [ "$OS" == "linux" ]; then
        TOTAL_MEM=$(free -g | awk '/^Mem:/{print $2}')
        if [ "$TOTAL_MEM" -lt 2 ]; then
            print_warn "内存不足2GB，可能影响性能"
        else
            print_info "总内存: ${TOTAL_MEM}GB"
        fi
    fi

    print_info "环境检查完成 ✓"
}

# ========================================
# 步骤2: 配置管理
# ========================================
setup_configuration() {
    print_step "配置管理..."

    # 检查配置文件
    if [ ! -f "config.yml" ]; then
        error_exit "配置文件config.yml不存在"
    fi

    print_info "找到config.yml配置文件"

    # 检查配置管理脚本
    if [ -f "scripts/config-manager.sh" ]; then
        CONFIG_MANAGER="scripts/config-manager.sh"
    elif [ -f "scripts/config-manager.py" ]; then
        CONFIG_MANAGER="python3 scripts/config-manager.py"
    else
        error_exit "找不到配置管理脚本"
    fi

    # 生成.env文件
    print_info "生成.env文件..."

    if [ "$AUTO_CLEANUP" = "true" ]; then
        $CONFIG_MANAGER generate auto-cleanup || error_exit "配置生成失败"
    else
        $CONFIG_MANAGER generate || error_exit "配置生成失败"
    fi

    if [ ! -f ".env" ]; then
        error_exit ".env文件未生成"
    fi

    print_info "配置文件已生成 ✓"
}

# ========================================
# 步骤3: 停止旧服务
# ========================================
stop_old_services() {
    print_step "停止旧服务..."

    # 检查是否有运行中的容器
    RUNNING_CONTAINERS=$(docker ps -q --filter "name=blog-" 2>/dev/null || true)

    if [ -n "$RUNNING_CONTAINERS" ]; then
        print_warn "发现运行中的服务容器"

        # 显示运行中的容器
        docker ps --filter "name=blog-" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

        read -p "是否停止这些服务? (y/n) " -n 1 -r
        echo ""

        if [[ $REPLY =~ ^[Yy]$ ]]; then
            $COMPOSE_CMD down 2>/dev/null || true
            print_info "旧服务已停止 ✓"
        else
            error_exit "用户取消，无法继续部署"
        fi
    else
        print_info "没有运行中的服务"
    fi

    # 清理旧的后端服务（如果存在）
    if [ -f "backend/docker-compose.yml" ]; then
        cd backend
        $COMPOSE_CMD down 2>/dev/null || true
        cd "$PROJECT_ROOT"
        print_info "后端服务已停止"
    fi
}

# ========================================
# 步骤4: 清理网络和卷（可选）
# ========================================
cleanup_resources() {
    if [ "$CLEANUP" = "true" ]; then
        print_step "清理旧资源..."

        # 询问用户
        read -p "是否清理旧的网络和卷? 这将删除所有数据! (y/n) " -n 1 -r
        echo ""

        if [[ $REPLY =~ ^[Yy]$ ]]; then
            $COMPOSE_CMD down -v 2>/dev/null || true
            print_info "旧资源已清理 ✓"
        fi
    fi
}

# ========================================
# 步骤5: 拉取镜像
# ========================================
pull_images() {
    print_step "拉取Docker镜像（这可能需要几分钟）..."

    # 创建镜像列表
    IMAGES=(
        "postgres:15-alpine"
        "redis:7-alpine"
        "nginx:alpine"
    )

    for image in "${IMAGES[@]}"; do
        print_info "拉取镜像: $image"
        if ! docker pull "$image"; then
            print_warn "拉取镜像失败: $image，稍后将在构建时重试"
        fi
    done

    print_info "镜像拉取完成 ✓"
}

# ========================================
# 步骤6: 构建镜像
# ========================================
build_images() {
    print_step "构建应用镜像（这可能需要几分钟）..."

    # 构建前端
    print_info "构建前端镜像..."
    if ! $COMPOSE_CMD build --no-cache frontend; then
        error_exit "前端镜像构建失败"
    fi

    # 构建后端
    print_info "构建后端镜像..."
    if ! $COMPOSE_CMD build --no-cache backend; then
        error_exit "后端镜像构建失败"
    fi

    print_info "镜像构建完成 ✓"
}

# ========================================
# 步骤7: 启动服务
# ========================================
start_services() {
    print_step "启动所有服务..."

    # 使用docker-compose启动
    if ! $COMPOSE_CMD up -d; then
        error_exit "服务启动失败"
    fi

    print_info "服务启动完成 ✓"
}

# ========================================
# 步骤8: 等待服务健康
# ========================================
wait_for_health() {
    print_step "等待服务健康检查..."

    local max_attempts=120
    local attempt=0
    local healthy_count=0
    local total_services=5  # postgres, redis, backend, frontend, nginx

    while [ $attempt -lt $max_attempts ]; do
        # 检查健康状态
        HEALTHY=$($COMPOSE_CMD ps --format "{{.Service}}: {{.Health}}" | grep -c "healthy" || true)

        if [ "$HEALTHY" -ge "$total_services" ]; then
            print_info "所有服务已健康 ✓"
            return 0
        fi

        # 显示进度
        attempt=$((attempt + 1))
        progress=$((attempt * 100 / max_attempts))
        echo -ne "\r进度: ${progress}% (${HEALTHY}/${total_services} 服务健康)"

        sleep 2
    done

    echo ""
    print_warn "部分服务可能还未完全启动，请稍后检查"

    # 显示服务状态
    echo ""
    $COMPOSE_CMD ps
}

# ========================================
# 步骤9: 验证部署
# ========================================
verify_deployment() {
    print_step "验证部署..."

    local errors=0

    # 检查前端
    print_info "检查前端服务..."
    FRONTEND_PORT=$(grep "FRONTEND_PORT" .env | cut -d '=' -f2)
    if curl -sf "http://localhost:${FRONTEND_PORT}" > /dev/null; then
        print_info "前端服务 ✓"
    else
        print_error "前端服务 ✗"
        errors=$((errors + 1))
    fi

    # 检查后端
    print_info "检查后端服务..."
    BACKEND_PORT=$(grep "BACKEND_PORT" .env | cut -d '=' -f2)
    if curl -sf "http://localhost:${BACKEND_PORT}/health" > /dev/null 2>&1; then
        print_info "后端服务 ✓"
    else
        print_warn "后端服务健康检查失败（可能正常，继续检查）"
    fi

    # 检查数据库
    print_info "检查数据库连接..."
    if $COMPOSE_CMD exec -T postgres pg_isready -U blog_user > /dev/null 2>&1; then
        print_info "数据库连接 ✓"
    else
        print_error "数据库连接 ✗"
        errors=$((errors + 1))
    fi

    # 检查Redis
    print_info "检查Redis连接..."
    if $COMPOSE_CMD exec -T redis redis-cli ping > /dev/null 2>&1; then
        print_info "Redis连接 ✓"
    else
        print_error "Redis连接 ✗"
        errors=$((errors + 1))
    fi

    if [ $errors -eq 0 ]; then
        print_info "部署验证完成 ✓"
        return 0
    else
        print_error "部署验证失败，发现 ${errors} 个错误"
        return 1
    fi
}

# ========================================
# 步骤10: 显示部署信息
# ========================================
show_deployment_info() {
    echo ""
    echo "======================================"
    print_info "部署完成！🎉"
    echo "======================================"
    echo ""

    # 读取端口配置
    FRONTEND_PORT=$(grep "FRONTEND_PORT" .env | cut -d '=' -f2)
    BACKEND_PORT=$(grep "BACKEND_PORT" .env | cut -d '=' -f2)
    DOMAIN=$(grep "NEXT_PUBLIC_SITE_URL" .env | cut -d '=' -f2)

    echo "服务状态："
    $COMPOSE_CMD ps
    echo ""

    echo "访问地址："
    echo "  前端: $DOMAIN"
    echo "  后端: ${DOMAIN}/v1/"
    echo "  管理面板: ${DOMAIN}/admin/"
    echo ""

    echo "本地访问："
    echo "  前端: http://localhost:${FRONTEND_PORT}"
    echo "  后端: http://localhost:${BACKEND_PORT}/v1/"
    echo ""

    echo "常用命令："
    echo "  查看日志: $COMPOSE_CMD logs -f"
    echo "  查看状态: $COMPOSE_CMD ps"
    echo "  重启服务: $COMPOSE_CMD restart [service]"
    echo "  停止服务: $COMPOSE_CMD down"
    echo ""

    echo "故障排查："
    echo "  查看日志: $COMPOSE_CMD logs -f [service]"
    echo "  进入容器: $COMPOSE_CMD exec [service] sh"
    echo "  重启配置: ./scripts/deploy.sh rebuild"
    echo ""

    if [ "$OS" == "linux" ]; then
        print_warn "首次访问可能较慢，因为需要初始化数据库"
    fi
}

# ========================================
# 帮助信息
# ========================================
show_help() {
    echo "博客系统Docker一键部署脚本"
    echo ""
    echo "用法: $0 [选项]"
    echo ""
    echo "选项:"
    echo "  --auto-cleanup    自动清理端口占用"
    echo "  --cleanup         清理旧的网络和卷（会删除数据）"
    echo "  --no-build        跳过镜像构建"
    echo "  --no-cache         构建时不使用缓存"
    echo "  --rebuild         重新构建所有镜像"
    echo "  --skip-pull       跳过镜像拉取"
    echo "  --skip-health     跳过健康检查"
    echo "  --skip-verify     跳过部署验证"
    echo "  -h, --help        显示此帮助信息"
    echo ""
    echo "示例:"
    echo "  $0                    # 正常部署"
    echo "  $0 --auto-cleanup    # 自动清理端口并部署"
    echo "  $0 --rebuild         # 重新构建并部署"
    echo ""
}

# ========================================
# 主函数
# ========================================
main() {
    echo "======================================"
    echo "  博客系统 Docker 一键部署脚本"
    echo "  版本: 2.0.0"
    echo "======================================"
    echo ""

    # 解析命令行参数
    AUTO_CLEANUP="false"
    CLEANUP="false"
    NO_BUILD="false"
    NO_CACHE=""
    SKIP_PULL="false"
    SKIP_HEALTH="false"
    SKIP_VERIFY="false"

    while [[ $# -gt 0 ]]; do
        case $1 in
            --auto-cleanup)
                AUTO_CLEANUP="true"
                shift
                ;;
            --cleanup)
                CLEANUP="true"
                shift
                ;;
            --no-build)
                NO_BUILD="true"
                shift
                ;;
            --no-cache)
                NO_CACHE="--no-cache"
                shift
                ;;
            --rebuild)
                NO_BUILD="false"
                NO_CACHE="--no-cache"
                shift
                ;;
            --skip-pull)
                SKIP_PULL="true"
                shift
                ;;
            --skip-health)
                SKIP_HEALTH="true"
                shift
                ;;
            --skip-verify)
                SKIP_VERIFY="true"
                shift
                ;;
            -h|--help)
                show_help
                exit 0
                ;;
            *)
                print_error "未知选项: $1"
                show_help
                exit 1
                ;;
        esac
    done

    # 执行部署步骤
    check_environment
    setup_configuration
    stop_old_services
    cleanup_resources

    if [ "$SKIP_PULL" = "false" ]; then
        pull_images
    fi

    if [ "$NO_BUILD" = "false" ]; then
        build_images
    fi

    start_services

    if [ "$SKIP_HEALTH" = "false" ]; then
        wait_for_health
    fi

    if [ "$SKIP_VERIFY" = "false" ]; then
        verify_deployment
    fi

    show_deployment_info
}

# 捕获错误
trap 'print_error "部署过程中发生错误，请检查日志"; exit 1' ERR

# 运行主函数
main "$@"

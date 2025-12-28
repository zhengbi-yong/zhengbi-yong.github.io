#!/bin/bash
# 博客系统Docker一键部署脚本

set -e  # 遇到错误立即退出

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 打印带颜色的消息
print_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 检查依赖
check_dependencies() {
    print_info "检查依赖..."

    if ! command -v docker &> /dev/null; then
        print_error "Docker未安装，请先安装Docker"
        exit 1
    fi

    if ! command -v docker compose &> /dev/null && ! docker compose version &> /dev/null; then
        print_error "Docker Compose未安装，请先安装Docker Compose"
        exit 1
    fi

    print_info "依赖检查通过 ✓"
}

# 生成安全密钥
generate_secrets() {
    print_info "生成安全密钥..."

    JWT_SECRET=$(openssl rand -base64 32 | tr -d '/+=')
    PASSWORD_PEPPER=$(openssl rand -base64 32 | tr -d '/+=')
    SESSION_SECRET=$(openssl rand -base64 32 | tr -d '/+=')
    POSTGRES_PASSWORD=$(openssl rand -base64 16 | tr -d '/+=')

    print_info "密钥已生成 ✓"
}

# 配置环境变量
setup_env() {
    print_info "配置环境变量..."

    if [ ! -f .env ]; then
        if [ -f .env.docker.example ]; then
            cp .env.docker.example .env
            print_info "已创建.env文件"

            # 替换安全密钥
            generate_secrets
            sed -i "s/your_jwt_secret.*/$JWT_SECRET/" .env
            sed -i "s/your_password_pepper.*/$PASSWORD_PEPPER/" .env
            sed -i "s/your_session_secret.*/$SESSION_SECRET/" .env
            sed -i "s/your_secure_postgres_password_here/$POSTGRES_PASSWORD/" .env

            print_info "已更新安全配置 ✓"
            print_warn "请编辑.env文件配置其他选项（如域名、邮箱等）"
        else
            print_error "未找到.env.docker.example模板文件"
            exit 1
        fi
    else
        print_info ".env文件已存在，跳过"
    fi
}

# 创建必要目录
setup_directories() {
    print_info "创建必要目录..."

    mkdir -p nginx/ssl
    mkdir -p backups

    print_info "目录创建完成 ✓"
}

# 停止旧服务
stop_old_services() {
    print_info "停止旧服务..."

    # 停止并删除旧的backend docker-compose服务（如果存在）
    if [ -f backend/docker-compose.yml ]; then
        cd backend
        docker compose down 2>/dev/null || true
        cd ..
    fi

    # 停止主服务
    docker compose down 2>/dev/null || true

    print_info "旧服务已停止 ✓"
}

# 构建镜像
build_images() {
    print_info "构建Docker镜像（这可能需要几分钟）..."

    docker compose build --no-cache

    print_info "镜像构建完成 ✓"
}

# 启动服务
start_services() {
    print_info "启动所有服务..."

    docker compose up -d

    print_info "服务启动完成 ✓"
}

# 等待服务健康
wait_for_health() {
    print_info "等待服务健康检查..."

    local max_attempts=60
    local attempt=0

    while [ $attempt -lt $max_attempts ]; do
        if docker compose ps | grep -q "healthy"; then
            print_info "服务已健康 ✓"
            return 0
        fi

        attempt=$((attempt + 1))
        echo -n "."
        sleep 2
    done

    echo ""
    print_warn "部分服务可能还在启动中，请稍后检查"
}

# 显示状态
show_status() {
    echo ""
    print_info "服务状态："
    docker compose ps

    echo ""
    print_info "访问地址："
    echo "  前端: http://localhost:3001"
    echo "  后端: http://localhost:3000/v1/"
    echo "  Nginx: http://localhost"

    echo ""
    print_info "查看日志："
    echo "  docker compose logs -f"

    echo ""
    print_info "停止服务："
    echo "  docker compose down"
}

# 主函数
main() {
    echo "======================================"
    echo "  博客系统 Docker 一键部署脚本"
    echo "======================================"
    echo ""

    # 检查是否在项目根目录
    if [ ! -f "docker-compose.yml" ]; then
        print_error "请在项目根目录运行此脚本"
        exit 1
    fi

    # 执行部署步骤
    check_dependencies
    setup_directories
    setup_env

    print_warn "即将停止旧服务并启动新服务..."
    read -p "是否继续? (y/n) " -n 1 -r
    echo ""

    if [[ $REPLY =~ ^[Yy]$ ]]; then
        stop_old_services
        build_images
        start_services
        wait_for_health
        show_status

        echo ""
        print_info "部署完成！🎉"
        echo ""
        print_warn "首次访问可能较慢，因为需要初始化数据库..."
    else
        print_info "部署已取消"
        exit 0
    fi
}

# 运行主函数
main

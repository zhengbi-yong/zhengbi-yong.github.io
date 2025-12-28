#!/bin/bash
# 配置管理脚本 - 读取config.yml并生成配置文件

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# 项目根目录
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
CONFIG_FILE="$PROJECT_ROOT/config.yml"
ENV_FILE="$PROJECT_ROOT/.env"
BACKUP_DIR="$PROJECT_ROOT/backups/config"

# 日志函数
log_info() { echo -e "${GREEN}[INFO]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }
log_debug() { echo -e "${BLUE}[DEBUG]${NC} $1"; }

# 检查依赖
check_dependencies() {
    log_info "检查依赖..."

    if ! command -v yq &> /dev/null; then
        log_warn "未找到yq工具，将使用基础解析"

        # 检查Python
        if command -v python3 &> /dev/null; then
            log_info "使用Python解析YAML"

            # 安装PyYAML
            if ! python3 -c "import yaml" 2>/dev/null; then
                log_info "安装PyYAML..."
                pip3 install pyyaml -q
            fi
        else
            log_error "需要Python或yq工具来解析YAML"
            exit 1
        fi
    fi
}

# 生成随机密钥
generate_secret() {
    openssl rand -base64 32 | tr -d '/+='
}

# 读取YAML配置
read_config() {
    local key=$1
    local default=$2

    if command -v yq &> /dev/null; then
        value=$(yq e "$key" "$CONFIG_FILE" 2>/dev/null || echo "$default")
    else
        # 使用Python读取
        value=$(python3 << EOF
import yaml
try:
    with open('$CONFIG_FILE', 'r') as f:
        config = yaml.safe_load(f)
    keys = '$key'.split('.')
    value = config
    for k in keys:
        value = value.get(k, {})
    print(value if value else '$default')
except:
    print('$default')
EOF
)
    fi

    echo "$value"
}

# 检查端口占用
check_port() {
    local port=$1
    local service=$2

    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1 || \
       netstat -an 2>/dev/null | grep ":$port " | grep LISTEN >/dev/null || \
       ss -ln 2>/dev/null | grep ":$port " >/dev/null; then
        log_warn "端口 $port ($service) 已被占用"
        return 1
    fi

    return 0
}

# 获取占用端口的进程
get_port_process() {
    local port=$1

    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
        lsof -Pi :$port -sTCP:LISTEN | tail -n +2
    elif command -v netstat &> /dev/null; then
        netstat -tlnp 2>/dev/null | grep ":$port " | grep LISTEN
    elif command -v ss &> /dev/null; then
        ss -lntp 2>/dev/null | grep ":$port "
    fi
}

# 清理端口占用
cleanup_port() {
    local port=$1
    local service=$2

    log_warn "正在清理端口 $port ($service)..."

    # 获取占用进程
    local processes=$(get_port_process "$port")

    if [ -z "$processes" ]; then
        log_info "端口 $port 已自动释放"
        return 0
    fi

    # 提取PID
    local pids=$(echo "$processes" | awk '{print $2}' | sort -u)

    log_warn "发现以下进程占用端口："
    echo "$processes"

    # 询问是否终止
    read -p "是否终止这些进程? (y/n) " -n 1 -r
    echo

    if [[ $REPLY =~ ^[Yy]$ ]]; then
        for pid in $pids; do
            log_info "终止进程 $pid..."
            kill -9 "$pid" 2>/dev/null || true

            # 等待进程完全退出
            local count=0
            while kill -0 "$pid" 2>/dev/null && [ $count -lt 10 ]; do
                sleep 1
                count=$((count + 1))
            done

            if kill -0 "$pid" 2>/dev/null; then
                log_error "无法终止进程 $pid"
                return 1
            fi
        done

        log_info "端口 $port 已释放"
        return 0
    else
        log_error "用户取消，端口 $port 仍被占用"
        return 1
    fi
}

# 验证配置
validate_config() {
    log_info "验证配置..."

    # 检查配置文件
    if [ ! -f "$CONFIG_FILE" ]; then
        log_error "配置文件不存在: $CONFIG_FILE"
        exit 1
    fi

    # 读取端口配置
    local frontend_port=$(read_config '.ports.frontend' '3001')
    local backend_port=$(read_config '.ports.backend' '3000')
    local postgres_port=$(read_config '.ports.postgres' '5432')
    local redis_port=$(read_config '.ports.redis' '6379')
    local nginx_http=$(read_config '.ports.nginx_http' '80')
    local nginx_https=$(read_config '.ports.nginx_https' '443')

    # 验证端口范围
    for port in $frontend_port $backend_port $postgres_port $redis_port $nginx_http $nginx_https; do
        if [ "$port" -lt 1024 ] || [ "$port" -gt 65535 ]; then
            log_error "无效的端口号: $port"
            exit 1
        fi
    done

    # 检查端口冲突
    local ports=($frontend_port $backend_port $postgres_port $redis_port)
    local unique_ports=$(echo "${ports[@]}" | tr ' ' '\n' | sort -u | wc -l)

    if [ "$unique_ports" -lt "${#ports[@]}" ]; then
        log_error "发现重复的端口配置"
        exit 1
    fi

    log_info "配置验证通过 ✓"
}

# 备份现有配置
backup_config() {
    if [ -f "$ENV_FILE" ]; then
        mkdir -p "$BACKUP_DIR"
        local backup_file="$BACKUP_DIR/env.backup.$(date +%Y%m%d_%H%M%S)"
        cp "$ENV_FILE" "$backup_file"
        log_info "已备份现有配置到: $backup_file"

        # 只保留最近10个备份
        ls -t "$BACKUP_DIR"/env.backup.* 2>/dev/null | tail -n +11 | xargs rm -f 2>/dev/null || true
    fi
}

# 生成.env文件
generate_env() {
    log_info "生成.env文件..."

    # 读取配置
    local environment=$(read_config '.system.environment' 'production')
    local frontend_port=$(read_config '.ports.frontend' '3001')
    local backend_port=$(read_config '.ports.backend' '3000')
    local postgres_port=$(read_config '.ports.postgres' '5432')
    local redis_port=$(read_config '.ports.redis' '6379')

    local db_name=$(read_config '.database.postgres.name' 'blog_db')
    local db_user=$(read_config '.database.postgres.user' 'blog_user')
    local db_password=$(read_config '.database.postgres.password' '')

    local redis_password=$(read_config '.database.redis.password' '')

    local jwt_secret=$(read_config '.security.jwt_secret' '')
    local password_pepper=$(read_config '.security.password_pepper' '')
    local session_secret=$(read_config '.security.session_secret' '')
    local cors_origins=$(read_config '.security.cors_origins' 'http://localhost:3001')

    local rate_limit=$(read_config '.security.rate_limit.requests_per_minute' '60')

    local domain=$(read_config '.domain.main' 'localhost')
    local server_ip=$(read_config '.domain.server_ip' '')

    local smtp_enabled=$(read_config '.email.enabled' 'false')
    local smtp_host=$(read_config '.email.smtp_host' '')
    local smtp_port=$(read_config '.email.smtp_port' '587')
    local smtp_username=$(read_config '.email.smtp_username' '')
    local smtp_password=$(read_config '.email.smtp_password' '')
    local smtp_from=$(read_config '.email.from_address' '')

    # 生成自动密钥（如果为空）
    [ -z "$db_password" ] && db_password=$(generate_secret)
    [ -z "$jwt_secret" ] && jwt_secret=$(generate_secret)
    [ -z "$password_pepper" ] && password_pepper=$(generate_secret)
    [ -z "$session_secret" ] && session_secret=$(generate_secret)

    # 生成.env文件
    cat > "$ENV_FILE" << EOF
# ========================================
# 自动生成的配置文件
# 来源: config.yml
# 生成时间: $(date '+%Y-%m-%d %H:%M:%S')
# ========================================

# 系统配置
ENVIRONMENT=$environment
TZ=$(read_config '.system.timezone' 'Asia/Shanghai')
RUST_LOG=$(read_config '.system.log_level' 'info')

# 端口配置
FRONTEND_PORT=$frontend_port
BACKEND_PORT=$backend_port
POSTGRES_PORT=$postgres_port
REDIS_PORT=$redis_port

# 数据库配置
POSTGRES_USER=$db_user
POSTGRES_PASSWORD=$db_password
POSTGRES_DB=$db_name

# Redis配置
REDIS_PASSWORD=$redis_password

# 安全配置
JWT_SECRET=$jwt_secret
PASSWORD_PEPPER=$password_pepper
SESSION_SECRET=$session_secret

# CORS配置
CORS_ALLOWED_ORIGINS=$cors_origins

# 限流配置
RATE_LIMIT_PER_MINUTE=$rate_limit

# 域名配置
NEXT_PUBLIC_SITE_URL=$([ "$environment" = "production" ] && echo "https://$domain" || echo "http://localhost")
NEXT_PUBLIC_API_URL=http://localhost:$backend_port
SERVER_IP=$server_ip

# 邮件配置
$([ "$smtp_enabled" = "true" ] && cat << MAIL
SMTP_HOST=$smtp_host
SMTP_PORT=$smtp_port
SMTP_USERNAME=$smtp_username
SMTP_PASSWORD=$smtp_password
SMTP_FROM=$smtp_from
MAIL
)

# SSL配置
FORCE_HTTPS=$(read_config '.domain.force_https' 'false')

# 备份配置
BACKUP_ENABLED=$(read_config '.backup.enabled' 'true')
BACKUP_DIRECTORY=$(read_config '.backup.directory' './backups')
BACKUP_RETENTION_DAYS=$(read_config '.backup.retention_days' '30')
EOF

    log_info ".env文件已生成 ✓"
}

# 显示配置摘要
show_summary() {
    log_info "配置摘要："
    echo ""

    printf "%-20s: %s\n" "环境" "$(read_config '.system.environment')"
    printf "%-20s: %s\n" "域名" "$(read_config '.domain.main')"
    echo ""
    echo "端口配置："
    printf "%-20s: %s\n" "前端" "$(read_config '.ports.frontend')"
    printf "%-20s: %s\n" "后端" "$(read_config '.ports.backend')"
    printf "%-20s: %s\n" "数据库" "$(read_config '.ports.postgres')"
    printf "%-20s: %s\n" "Redis" "$(read_config '.ports.redis')"
    echo ""

    local security_configured=$(read_config '.security.jwt_secret')
    if [ -n "$security_configured" ]; then
        log_info "安全配置: ✓ 已配置"
    else
        log_warn "安全配置: ⚠ 使用自动生成的密钥"
    fi
}

# 主函数
main() {
    echo "======================================"
    echo "  配置管理脚本"
    echo "======================================"
    echo ""

    # 解析命令行参数
    local action=${1:-generate}
    local auto_cleanup=${2:-false}

    case $action in
        validate)
            check_dependencies
            validate_config
            ;;

        check-ports)
            log_info "检查端口占用..."
            echo ""

            check_port $(read_config '.ports.frontend' '3001') "前端" || true
            check_port $(read_config '.ports.backend' '3000') "后端" || true
            check_port $(read_config '.ports.postgres' '5432') "数据库" || true
            check_port $(read_config '.ports.redis' '6379') "Redis" || true
            check_port 80 "Nginx HTTP" || true
            check_port 443 "Nginx HTTPS" || true
            ;;

        cleanup-ports)
            log_info "清理端口占用..."
            echo ""

            cleanup_port $(read_config '.ports.frontend' '3001') "前端"
            cleanup_port $(read_config '.ports.backend' '3000') "后端"
            cleanup_port $(read_config '.ports.postgres' '5432') "数据库"
            cleanup_port $(read_config '.ports.redis' '6379') "Redis"
            cleanup_port 80 "Nginx HTTP"
            cleanup_port 443 "Nginx HTTPS"
            ;;

        generate)
            check_dependencies
            validate_config

            # 自动清理端口（如果启用）
            if [ "$auto_cleanup" = "true" ]; then
                log_info "启用自动端口清理..."
                "$0" cleanup-ports
            else
                # 检查端口并询问
                log_info "检查端口占用..."
                local ports_conflicted=false

                check_port $(read_config '.ports.frontend' '3001') "前端" || ports_conflicted=true
                check_port $(read_config '.ports.backend' '3000') "后端" || ports_conflicted=true
                check_port $(read_config '.ports.postgres' '5432') "数据库" || ports_conflicted=true
                check_port $(read_config '.ports.redis' '6379') "Redis" || ports_conflicted=true
                check_port 80 "Nginx HTTP" || ports_conflicted=true
                check_port 443 "Nginx HTTPS" || ports_conflicted=true

                if [ "$ports_conflicted" = "true" ]; then
                    echo ""
                    read -p "是否自动清理端口占用? (y/n) " -n 1 -r
                    echo ""

                    if [[ $REPLY =~ ^[Yy]$ ]]; then
                        "$0" cleanup-ports || exit 1
                    else
                        log_error "端口冲突未解决，无法继续"
                        exit 1
                    fi
                fi
            fi

            backup_config
            generate_env
            show_summary

            log_info "配置生成完成！"
            echo ""
            log_info "下一步："
            echo "  1. 检查生成的 .env 文件"
            echo "  2. 如需修改，编辑 config.yml 后重新运行此脚本"
            echo "  3. 运行部署脚本: ./deploy-docker.sh"
            ;;

        *)
            echo "用法: $0 {validate|check-ports|cleanup-ports|generate} [auto-cleanup]"
            echo ""
            echo "命令："
            echo "  validate         验证配置文件"
            echo "  check-ports      检查端口占用"
            echo "  cleanup-ports    清理端口占用"
            echo "  generate         生成.env文件（默认）"
            echo ""
            echo "选项："
            echo "  auto-cleanup     在generate时自动清理端口"
            exit 1
            ;;
    esac
}

# 运行主函数
main "$@"

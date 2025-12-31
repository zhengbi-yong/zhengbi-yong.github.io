#!/bin/bash
# ============================================
# MDX 文件同步脚本
# ============================================
# 用途：将frontend/data/blog中的MDX文件同步到数据库
# 使用：./sync-mdx.sh [--force]
# ============================================

set -e  # 遇到错误立即退出

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 配置
BACKEND_URL="${BACKEND_URL:-http://localhost:3000}"
SYNC_ENDPOINT="${BACKEND_URL}/v1/sync/mdx/public"  # 使用公开端点（临时测试）
FRONTEND_BLOG_DIR="${FRONTEND_BLOG_DIR:-../frontend/data/blog}"

# 解析参数
FORCE=false
if [[ "$1" == "--force" ]]; then
    FORCE=true
fi

# ============================================
# 函数定义
# ============================================

print_header() {
    echo ""
    echo -e "${BLUE}============================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}============================================${NC}"
    echo ""
}

print_success() {
    echo -e "${GREEN}✓${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

print_info() {
    echo -e "${YELLOW}ℹ${NC} $1"
}

# 检查依赖
check_dependencies() {
    print_header "检查依赖"

    if ! command -v curl &> /dev/null; then
        print_error "curl 未安装，请先安装 curl"
        exit 1
    fi
    print_success "curl 已安装"

    # 检查后端是否运行
    print_info "检查后端服务..."
    if ! curl -s -f "${BACKEND_URL}/v1/posts" > /dev/null 2>&1; then
        print_error "后端服务未运行或无法访问 (${BACKEND_URL})"
        print_info "请先启动后端服务："
        echo "  cd backend && cargo run"
        exit 1
    fi
    print_success "后端服务运行中"
}

# 统计MDX文件
count_mdx_files() {
    local count=0
    if [ -d "$FRONTEND_BLOG_DIR" ]; then
        count=$(find "$FRONTEND_BLOG_DIR" -name "*.mdx" -type f | wc -l | tr -d ' ')
    fi
    echo $count
}

# 同步MDX文件
sync_mdx() {
    print_header "开始同步"

    # 显示配置
    echo "后端地址: ${BACKEND_URL}"
    echo "MDX目录: ${FRONTEND_BLOG_DIR}"
    echo "强制模式: ${FORCE}"
    echo ""

    # 检查MDX目录
    if [ ! -d "$FRONTEND_BLOG_DIR" ]; then
        print_error "MDX目录不存在: ${FRONTEND_BLOG_DIR}"
        exit 1
    fi

    # 统计文件
    local mdx_count=$(count_mdx_files)
    print_info "找到 ${mdx_count} 个 MDX 文件"
    echo ""

    # 构建请求体
    local request_body='{"force":'
    if [ "$FORCE" = true ]; then
        request_body+='true'
    else
        request_body+='false'
    fi
    request_body+='}'

    # 调用同步API
    print_info "正在同步..."

    local response=$(curl -s -X POST "${SYNC_ENDPOINT}" \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer ${SYNC_TOKEN:-}" \
        -d "$request_body" \
        -w "\n%{http_code}" 2>&1)

    local http_code=$(echo "$response" | tail -n1)
    local body=$(echo "$response" | head -n -1)

    # 检查HTTP状态码
    if [ "$http_code" -eq 200 ] || [ "$http_code" -eq 201 ]; then
        # 解析JSON响应
        if command -v jq &> /dev/null; then
            echo "$body" | jq '.'
        else
            echo "$body"
        fi

        # 提取统计数据
        if command -v jq &> /dev/null; then
            local total=$(echo "$body" | jq -r '.total // 0')
            local created=$(echo "$body" | jq -r '.created // 0')
            local updated=$(echo "$body" | jq -r '.updated // 0')
            local unchanged=$(echo "$body" | jq -r '.unchanged // 0')
            local failed=$(echo "$body" | jq -r '.failed // 0')

            echo ""
            print_header "同步结果"
            print_success "总数: ${total}"
            print_success "创建: ${created}"
            print_success "更新: ${updated}"
            print_success "未变化: ${unchanged}"

            if [ "$failed" -gt 0 ]; then
                print_error "失败: ${failed}"
                echo ""
                print_info "错误详情:"
                echo "$body" | jq -r '.errors[]?' | sed 's/^/  - /'
            fi
        fi

        echo ""
        print_success "同步完成！"
    elif [ "$http_code" -eq 401 ]; then
        print_error "认证失败，请检查 SYNC_TOKEN 环境变量"
        exit 1
    elif [ "$http_code" -eq 404 ]; then
        print_error "同步端点不存在，请确认后端已正确配置"
        exit 1
    else
        print_error "同步失败 (HTTP ${http_code})"
        echo "$body"
        exit 1
    fi
}

# ============================================
# 主程序
# ============================================

main() {
    print_header "MDX 文件同步工具"

    # 检查依赖
    check_dependencies

    # 执行同步
    sync_mdx

    echo ""
    print_success "所有操作已完成！"
    echo ""
}

# 运行主程序
main

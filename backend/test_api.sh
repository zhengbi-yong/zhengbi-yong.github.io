#!/bin/bash
# 后端API测试脚本

API_BASE="http://localhost:3000"
export ACCESS_TOKEN=""
export REFRESH_TOKEN=""

# 颜色定义
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_test() {
    echo -e "${BLUE}测试: $1${NC}"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_info() {
    echo -e "${YELLOW}→ $1${NC}"
}

# 通用HTTP请求函数 - 同时获取状态码和响应体
# 用法: http_request METHOD URL [EXTRA_CURL_ARGS]
# 返回: HTTP_STATUS_CODE 和 RESPONSE_BODY
http_request() {
    local method="$1"
    local url="$2"
    shift 2
    local extra_args=("$@")

    # 使用 curl 获取响应和状态码
    # -w "%{http_code}" 输出状态码到 stdout
    # -o /dev/null 将响应体保存到临时文件
    local tmp_file=$(mktemp)
    local http_code=$(curl -s -w "%{http_code}" -o "$tmp_file" -X "$method" "$url" "${extra_args[@]}" 2>/dev/null)
    local response=$(cat "$tmp_file")
    rm -f "$tmp_file"

    # 确保 http_code 是纯数字（去掉可能的额外字符）
    http_code=$(echo "$http_code" | tr -d '[:space:]' | grep -o '^[0-9]*$' | head -1)

    echo "$http_code|$response"
}

# 测试健康检查
test_health() {
    print_test "健康检查"
    local result=$(http_request "GET" "$API_BASE/healthz")
    local http_code="${result%%|*}"
    local response="${result#*|}"

    if [ "$http_code" = "200" ] && echo "$response" | grep -q "healthy"; then
        print_success "健康检查通过 (HTTP $http_code)"
        echo "响应: $response"
    else
        print_error "健康检查失败 (HTTP $http_code)"
        echo "响应: $response"
        return 1
    fi
}

# 测试详细健康检查
test_detailed_health() {
    print_test "详细健康检查"
    local result=$(http_request "GET" "$API_BASE/healthz/detailed")
    local http_code="${result%%|*}"
    local response="${result#*|}"

    if [ "$http_code" = "200" ] && echo "$response" | grep -q "status"; then
        print_success "详细健康检查通过 (HTTP $http_code)"
        echo "响应: $response" | head -c 200
        echo "..."
    else
        print_error "详细健康检查失败 (HTTP $http_code)"
    fi
}

# 用户注册
test_register() {
    print_test "用户注册"
    local email="test_$(date +%s)@example.com"
    local username="testuser_$(date +%s)"

    local result=$(http_request "POST" "$API_BASE/v1/auth/register" \
        -H "Content-Type: application/json" \
        -d "{
            \"email\": \"$email\",
            \"username\": \"$username\",
            \"password\": \"password123\"
        }")

    local http_code="${result%%|*}"
    local response="${result#*|}"

    if [ "$http_code" = "200" ] && echo "$response" | grep -q "access_token"; then
        print_success "用户注册成功 (HTTP $http_code)"
        export ACCESS_TOKEN=$(echo "$response" | grep -o '"access_token":"[^"]*' | cut -d'"' -f4)
        print_info "访问令牌已获取"
    else
        print_error "用户注册失败 (HTTP $http_code)"
        echo "响应: $response"
    fi
}

# 用户登录
test_login() {
    print_test "用户登录"
    local result=$(http_request "POST" "$API_BASE/v1/auth/login" \
        -H "Content-Type: application/json" \
        -d '{
            "email": "test@example.com",
            "password": "password123"
        }')

    local http_code="${result%%|*}"
    local response="${result#*|}"

    if [ "$http_code" = "200" ] && echo "$response" | grep -q "access_token"; then
        print_success "用户登录成功 (HTTP $http_code)"
        export ACCESS_TOKEN=$(echo "$response" | grep -o '"access_token":"[^"]*' | cut -d'"' -f4)
        print_info "访问令牌已获取"
        echo "令牌前20字符: ${ACCESS_TOKEN:0:20}..."
    else
        print_error "用户登录失败 (HTTP $http_code)"
        echo "响应: $response"
    fi
}

# 获取当前用户信息
test_me() {
    print_test "获取当前用户信息"
    if [ -z "$ACCESS_TOKEN" ]; then
        print_error "需要先登录获取访问令牌"
        return 1
    fi

    local result=$(http_request "GET" "$API_BASE/v1/auth/me" \
        -H "Authorization: Bearer $ACCESS_TOKEN")

    local http_code="${result%%|*}"
    local response="${result#*|}"

    if [ "$http_code" = "200" ] && echo "$response" | grep -q "username"; then
        print_success "获取用户信息成功 (HTTP $http_code)"
        echo "响应: $response"
    else
        print_error "获取用户信息失败 (HTTP $http_code)"
        echo "响应: $response"
    fi
}

# 获取文章统计
test_post_stats() {
    print_test "获取文章统计 (slug: hello-world)"
    local result=$(http_request "GET" "$API_BASE/v1/posts/hello-world/stats")
    local http_code="${result%%|*}"
    local response="${result#*|}"

    if [ "$http_code" = "200" ] && echo "$response" | grep -q "view_count\|like_count"; then
        print_success "获取文章统计成功 (HTTP $http_code)"
        echo "响应: $response"
    else
        print_error "文章不存在或获取失败 (HTTP $http_code)"
        echo "响应: $response"
    fi
}

# 记录文章浏览
test_post_view() {
    print_test "记录文章浏览 (slug: hello-world)"
    local result=$(http_request "POST" "$API_BASE/v1/posts/hello-world/view")
    local http_code="${result%%|*}"
    local response="${result#*|}"

    if [ "$http_code" = "200" ]; then
        print_success "记录浏览成功 (HTTP $http_code)"
        if [ -n "$response" ]; then
            echo "响应: $response"
        else
            echo "响应: (空响应 - 成功)"
        fi
    else
        print_error "记录浏览失败 (HTTP $http_code)"
        echo "响应: $response"
    fi
}

# 点赞文章
test_like_post() {
    print_test "点赞文章 (slug: hello-world)"
    if [ -z "$ACCESS_TOKEN" ]; then
        print_error "需要先登录获取访问令牌"
        return 1
    fi

    local result=$(http_request "POST" "$API_BASE/v1/posts/hello-world/like" \
        -H "Authorization: Bearer $ACCESS_TOKEN")

    local http_code="${result%%|*}"
    local response="${result#*|}"

    if [ "$http_code" = "200" ]; then
        print_success "点赞成功 (HTTP $http_code)"
        if [ -n "$response" ]; then
            echo "响应: $response"
        else
            echo "响应: (空响应 - 成功)"
        fi
    elif [ "$http_code" = "409" ]; then
        print_info "已经点赞过 (HTTP $http_code)"
        echo "响应: $response"
    elif [ "$http_code" = "404" ]; then
        print_error "文章不存在 (HTTP $http_code)"
        echo "响应: $response"
    else
        print_error "点赞失败 (HTTP $http_code)"
        echo "响应: $response"
    fi
}

# 取消点赞文章
test_unlike_post() {
    print_test "取消点赞文章 (slug: hello-world)"
    if [ -z "$ACCESS_TOKEN" ]; then
        print_error "需要先登录获取访问令牌"
        return 1
    fi

    local result=$(http_request "DELETE" "$API_BASE/v1/posts/hello-world/like" \
        -H "Authorization: Bearer $ACCESS_TOKEN")

    local http_code="${result%%|*}"
    local response="${result#*|}"

    if [ "$http_code" = "200" ]; then
        print_success "取消点赞成功 (HTTP $http_code)"
        if [ -n "$response" ]; then
            echo "响应: $response"
        else
            echo "响应: (空响应 - 成功)"
        fi
    elif [ "$http_code" = "409" ]; then
        print_info "未点赞过 (HTTP $http_code)"
        echo "响应: $response"
    else
        print_error "取消点赞失败 (HTTP $http_code)"
        echo "响应: $response"
    fi
}

# 获取评论列表
test_list_comments() {
    print_test "获取评论列表 (slug: hello-world)"
    local result=$(http_request "GET" "$API_BASE/v1/posts/hello-world/comments")
    local http_code="${result%%|*}"
    local response="${result#*|}"

    if [ "$http_code" = "200" ]; then
        print_success "获取评论列表成功 (HTTP $http_code)"
        echo "响应: $response"
    else
        print_error "获取评论列表失败 (HTTP $http_code)"
        echo "响应: $response"
    fi
}

# 创建评论
test_create_comment() {
    print_test "创建评论 (slug: hello-world)"
    if [ -z "$ACCESS_TOKEN" ]; then
        print_error "需要先登录获取访问令牌"
        return 1
    fi

    local result=$(http_request "POST" "$API_BASE/v1/posts/hello-world/comments" \
        -H "Authorization: Bearer $ACCESS_TOKEN" \
        -H "Content-Type: application/json" \
        -d '{
            "content": "这是一条测试评论！"
        }')

    local http_code="${result%%|*}"
    local response="${result#*|}"

    if [ "$http_code" = "200" ] || [ "$http_code" = "201" ]; then
        if echo "$response" | grep -q "id\|content"; then
            print_success "创建评论成功 (HTTP $http_code)"
            echo "响应: $response"
        else
            print_info "评论已创建，等待审核 (HTTP $http_code)"
            echo "响应: $response"
        fi
    else
        print_error "创建评论失败 (HTTP $http_code)"
        echo "响应: $response"
    fi
}

# 运行所有测试
run_all_tests() {
    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE}    后端API功能测试${NC}"
    echo -e "${BLUE}========================================${NC}\n"

    # 1. 健康检查测试
    echo -e "\n${YELLOW}--- 健康检查 ---${NC}\n"
    test_health
    test_detailed_health

    # 2. 认证测试
    echo -e "\n${YELLOW}--- 用户认证 ---${NC}\n"
    print_info "尝试登录已有用户..."
    test_login

    if [ -z "$ACCESS_TOKEN" ]; then
        print_info "登录失败，尝试注册新用户..."
        test_register
    fi

    if [ -n "$ACCESS_TOKEN" ]; then
        test_me
    fi

    # 3. 文章功能测试
    echo -e "\n${YELLOW}--- 文章功能 ---${NC}\n"
    test_post_stats
    test_post_view

    if [ -n "$ACCESS_TOKEN" ]; then
        test_like_post
        sleep 1
        test_unlike_post
    fi

    # 4. 评论功能测试
    echo -e "\n${YELLOW}--- 评论功能 ---${NC}\n"
    test_list_comments

    if [ -n "$ACCESS_TOKEN" ]; then
        test_create_comment
    fi

    echo -e "\n${BLUE}========================================${NC}"
    echo -e "${GREEN}    测试完成！${NC}"
    echo -e "${BLUE}========================================${NC}\n"
}

# 交互式菜单
show_menu() {
    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE}    后端API测试工具${NC}"
    echo -e "${BLUE}========================================${NC}\n"
    echo "1. 运行所有测试"
    echo "2. 健康检查"
    echo "3. 用户登录"
    echo "4. 用户注册"
    echo "5. 获取用户信息"
    echo "6. 获取文章统计"
    echo "7. 记录文章浏览"
    echo "8. 点赞文章"
    echo "9. 取消点赞文章"
    echo "10. 获取评论列表"
    echo "11. 创建评论"
    echo "0. 退出"
    echo -ne "\n请选择: "
}

# 主程序
main() {
    # 检查后端是否运行
    if ! curl -s "$API_BASE/healthz" > /dev/null 2>&1; then
        echo -e "${RED}错误: 后端服务未运行，请先启动后端${NC}"
        echo "运行命令: cd backend && cargo run"
        exit 1
    fi

    # 如果有参数，直接运行对应测试
    if [ $# -gt 0 ]; then
        case $1 in
            all) run_all_tests ;;
            health) test_health ;;
            login) test_login ;;
            register) test_register ;;
            me) test_me ;;
            stats) test_post_stats ;;
            view) test_post_view ;;
            like) test_like_post ;;
            unlike) test_unlike_post ;;
            comments) test_list_comments ;;
            create-comment) test_create_comment ;;
            *) echo "用法: $0 [all|health|login|register|me|stats|view|like|unlike|comments|create-comment]" ;;
        esac
        exit 0
    fi

    # 交互式菜单
    while true; do
        show_menu
        read -r choice
        case $choice in
            1) run_all_tests ;;
            2) test_health ;;
            3) test_login ;;
            4) test_register ;;
            5) test_me ;;
            6) test_post_stats ;;
            7) test_post_view ;;
            8) test_like_post ;;
            9) test_unlike_post ;;
            10) test_list_comments ;;
            11) test_create_comment ;;
            0) echo "退出"; break ;;
            *) echo -e "${RED}无效选择${NC}" ;;
        esac
        echo ""
        read -p "按回车继续..."
    done
}

main "$@"

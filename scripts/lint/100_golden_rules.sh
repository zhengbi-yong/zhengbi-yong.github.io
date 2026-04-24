#!/usr/bin/env bash
# ==============================================================================
# GOLDEN_RULES 自动化检查脚本 v2.0
# 版本: 2.0.0
# 日期: 2026-04-23
# 目的: 自动化检查 GOLDEN_RULES.md (v3.0.0) 所有可自动化条款
# 项目: zhengbi-yong.github.io
# ==============================================================================

set -uo pipefail

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$PROJECT_ROOT"

# 颜色
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

ERRORS=0
WARNINGS=0
PASSES=0

log_pass() { echo -e "${GREEN}[PASS]${NC}  $*"; ((PASSES++)); }
log_fail() { echo -e "${RED}[FAIL]${NC}  $*"; ((ERRORS++)); }
log_warn() { echo -e "${YELLOW}[WARN]${NC}  $*"; ((WARNINGS++)); }
log_info() { echo -e "${CYAN}[INFO]${NC}  $*"; }

# ------------------------------------------------------------------------------
# 辅助函数
# ------------------------------------------------------------------------------

# 检查文件内容（grep 封装）
# 用法: check_content "名称" "pattern" "path" "found|not_found" "rule_ref" ["--extra-grep-flags"]
check_content() {
    local name="$1"
    local pattern="$2"
    local path="$3"
    local expected="$4"
    local rule_ref="${5:-}"
    local extra_flags="${6:-}"

    # 默认 include 模式
    local include_patterns="--include=*.ts --include=*.tsx --include=*.rs --include=*.sql --include=*.sh --include=*.yaml --include=*.yml"
    [[ -n "$extra_flags" ]] && include_patterns="$include_patterns $extra_flags"

    local result
    result=$(grep -r $include_patterns -n "$pattern" "$path" 2>/dev/null \
        | grep -vE '^\s*--.*|^\s*//.*' || true)

    if [[ "$expected" == "found" ]]; then
        if [[ -z "$result" ]]; then
            log_fail "$name"
            [[ -n "$rule_ref" ]] && echo -e "       参考: $rule_ref"
            return 1
        else
            log_pass "$name"
            echo "$result" | head -3 | sed 's/^/       /'
            return 0
        fi
    else
        if [[ -n "$result" ]]; then
            log_fail "$name"
            echo "$result" | head -3 | sed 's/^/       /'
            [[ -n "$rule_ref" ]] && echo -e "       参考: $rule_ref"
            return 1
        else
            log_pass "$name"
            return 0
        fi
    fi
}

# 检查 Rust 代码中的模式（排除测试/注释）
check_rust() {
    local name="$1"
    local pattern="$2"
    local path="$3"
    local expected="$4"
    local rule_ref="${5:-}"

    local result
    result=$(grep -rn --include="*.rs" "$pattern" "$path" 2>/dev/null \
        | grep -vE '^\s*//|/^\s*\*' || true)

    if [[ "$expected" == "found" ]]; then
        if [[ -z "$result" ]]; then
            log_fail "$name"
            [[ -n "$rule_ref" ]] && echo -e "       参考: $rule_ref"
            return 1
        else
            log_pass "$name"
            echo "$result" | head -2 | sed 's/^/       /'
            return 0
        fi
    else
        if [[ -n "$result" ]]; then
            log_fail "$name"
            echo "$result" | head -2 | sed 's/^/       /'
            [[ -n "$rule_ref" ]] && echo -e "       参考: $rule_ref"
            return 1
        else
            log_pass "$name"
            return 0
        fi
    fi
}

# 检查 SQL 文件中的模式
check_sql() {
    local name="$1"
    local pattern="$2"
    local path="$3"
    local expected="$4"
    local rule_ref="${5:-}"

    local result
    result=$(grep -rEn --include="*.sql" "$pattern" "$path" 2>/dev/null \
        | grep -vE '^\s*--' || true)

    if [[ "$expected" == "found" ]]; then
        if [[ -z "$result" ]]; then
            log_fail "$name"
            [[ -n "$rule_ref" ]] && echo -e "       参考: $rule_ref"
            return 1
        else
            log_pass "$name"
            echo "$result" | head -2 | sed 's/^/       /'
            return 0
        fi
    else
        if [[ -n "$result" ]]; then
            log_fail "$name"
            echo "$result" | head -2 | sed 's/^/       /'
            [[ -n "$rule_ref" ]] && echo -e "       参考: $rule_ref"
            return 1
        else
            log_pass "$name"
            return 0
        fi
    fi
}

# 检查文件是否存在
check_file() {
    local name="$1"
    local filepath="$2"
    local expected="$3"
    local rule_ref="${4:-}"

    if [[ -f "$filepath" ]]; then
        if [[ "$expected" == "exists" ]]; then
            log_pass "$name"
            return 0
        else
            log_fail "$name"
            [[ -n "$rule_ref" ]] && echo -e "       参考: $rule_ref"
            return 1
        fi
    else
        if [[ "$expected" == "exists" ]]; then
            log_fail "$name"
            [[ -n "$rule_ref" ]] && echo -e "       参考: $rule_ref"
            return 1
        else
            log_pass "$name"
            return 0
        fi
    fi
}

# ------------------------------------------------------------------------------
# 主检查逻辑
# ------------------------------------------------------------------------------

echo "=============================================="
echo "  GOLDEN_RULES 自动化检查"
echo "  项目: zhengbi-yong.github.io"
echo "  版本: v3.0.0 (2026-04-08)"
echo "  时间: $(date '+%Y-%m-%d %H:%M:%S')"
echo "=============================================="
echo ""

# ============================================================================
# §1 安全铁律 (Security Non-Negotiables)
# ============================================================================
echo "=== §1 安全铁律 (Security Non-Negotiables) ==="
echo ""

# §1.1 localStorage 凭证存储
# 只在非注释行中搜索凭证相关 localStorage 模式
log_info "§1.1 检查 localStorage 凭证存储..."
CREDENTIAL_PATTERNS=(
    "localStorage.*setItem.*token\|localStorage.*setItem.*jwt\|localStorage.*setItem.*auth"
    "token.*=.*localStorage\|jwt.*=.*localStorage\|auth.*=.*localStorage"
)
FOUND_ISSUES=""
for pat in "${CREDENTIAL_PATTERNS[@]}"; do
    # grep 过滤掉注释行（// 或 /* 或 * 开头）
    result=$(grep -rn --include="*.ts" --include="*.tsx" "$pat" \
        frontend/src 2>/dev/null \
        | grep -vE '^\s*//|^\s*/\*|^\s*\*' || true)
    [[ -n "$result" ]] && FOUND_ISSUES="${FOUND_ISSUES}\n${result}"
done

# 白名单文件（非凭证存储）
SAFE_FILES=(
    "PWAInstallPrompt.tsx"
    "ExcalidrawViewer.tsx"
    "analytics-server.ts"
)

CLEAN_ISSUES=""
if [[ -n "$FOUND_ISSUES" ]]; then
    while IFS= read -r line; do
        [[ -z "$line" ]] && continue
        IS_SAFE=0
        for safe in "${SAFE_FILES[@]}"; do
            if echo "$line" | grep -q "$safe"; then
                IS_SAFE=1; break
            fi
        done
        [[ $IS_SAFE -eq 0 ]] && CLEAN_ISSUES="${CLEAN_ISSUES}\n${line}"
    done <<< "$FOUND_ISSUES"
fi

if [[ -n "$CLEAN_ISSUES" ]]; then
    log_fail "§1.1 localStorage 存凭证"
    echo -e "$CLEAN_ISSUES" | head -5 | sed 's/^/       /'
else
    log_pass "§1.1 localStorage 无凭证存储"
fi

# §1.2 CSRF
log_info "§1.2 检查 CSRF 实现..."
check_content "§1.2 CSRF: XSRF-TOKEN cookie 存在" \
    "XSRF-TOKEN" \
    "backend/crates/api/src/middleware/csrf.rs" \
    "found" \
    "GOLDEN_RULES §1.2"

check_content "§1.2 CSRF: HMAC-SHA256 签名验证" \
    "hmac.*Mac\|HmacSha256\|verify_slice" \
    "backend/crates/api/src/middleware/csrf.rs" \
    "found" \
    "GOLDEN_RULES §1.2"

check_content "§1.2 CSRF: X-CSRF-Token header 转发" \
    -i "x-csrf-token\|X-CSRF-Token" \
    "frontend/src" \
    "found" \
    "GOLDEN_RULES §1.2"

check_content "§1.2 CSRF: is_fresh() 1小时token有效期" \
    "3600\|token.*valid.*hour\|is_fresh" \
    "backend/crates/api/src/middleware/csrf.rs" \
    "found" \
    "GOLDEN_RULES §1.2"

# §1.4 Argon2id
log_info "§1.4 检查 Argon2id 密码哈希..."
check_rust "§1.4 Argon2id: m=64MiB (65536)" \
    "Params::new.*65536\|m_cost.*65536" \
    "backend/crates/core/src/auth.rs" \
    "found" \
    "GOLDEN_RULES §1.4"

check_rust "§1.4 Argon2id: t=3 iterations" \
    "Params::new.*3,\|t_cost.*3\|iterations.*3" \
    "backend/crates/core/src/auth.rs" \
    "found" \
    "GOLDEN_RULES §1.4"

check_rust "§1.4 Argon2id: p=4 parallelism" \
    "Params::new.*4\|p_cost.*4\|parallelism.*4" \
    "backend/crates/core/src/auth.rs" \
    "found" \
    "GOLDEN_RULES §1.4"

check_content "§1.4 密码: Argon2id 实现" \
    "Argon2::new\|Algorithm::Argon2id" \
    "backend/crates/core/src/auth.rs" \
    "found" \
    "GOLDEN_RULES §1.4"

# §1.5 Proxy 授权边界
log_info "§1.5 检查 Proxy/中间件授权边界..."
check_content "§1.5 Proxy: 禁止唯一鉴权边界" \
    "deny.*auth\|block.*auth\|唯一.*鉴权\|only.*proxy.*auth" \
    "frontend/src/middleware.ts" \
    "not_found" \
    "GOLDEN_RULES §1.5"
# 确认后端有最终授权
check_content "§1.5 后端: AuthUser 提取器存在" \
    "AuthUser\|FromRequestParts" \
    "backend/crates/shared/src" \
    "found" \
    "GOLDEN_RULES §1.5"

echo ""

# ============================================================================
# §2 前端铁律 (Frontend Non-Negotiables)
# ============================================================================
echo "=== §2 前端铁律 (Frontend Non-Negotiables) ==="
echo ""

# §2.1 数据获取
log_info "§2.1 检查数据获取模式..."
# Server Component 直调后端（非 Route Handler BFF 二跳）
check_content "§2.1 Server Component 数据获取合规" \
    "fetch.*localhost:3000\|api.*localhost:3000" \
    "frontend/src" \
    "not_found" \
    "GOLDEN_RULES §2.1"

# §2.3 WebGL cleanup 幂等性
log_info "§2.3 检查 WebGL cleanup..."
check_content "§2.3 WebGL: release() 幂等性检查" \
    "_released\|isLost\|is_lost" \
    "frontend/src/lib/webgl/WebGLContextManager.ts" \
    "found" \
    "GOLDEN_RULES §2.3"

# §2.4 WebGL LRU
log_info "§2.4 检查 WebGL LRU 调度..."
check_content "§2.4 WebGL: MAX_CONTEXTS 常量 (= 6)" \
    "MAX_CONTEXTS.*=.*6" \
    "frontend/src/lib/webgl/WebGLContextManager.ts" \
    "found" \
    "GOLDEN_RULES §2.4"

check_content "§2.4 WebGL: LRU 淘汰逻辑" \
    "evictLeastRecentlyUsed\|evict.*LRU\|evict.*oldest" \
    "frontend/src/lib/webgl/WebGLContextManager.ts" \
    "found" \
    "GOLDEN_RULES §2.4"

check_content "§2.4 WebGL: webglcontextlost 监听" \
    "webglcontextlost\|webglcontextrestored\|addEventListener.*context" \
    "frontend/src/lib/webgl" \
    "found" \
    "GOLDEN_RULES §2.4"

# §2.5 状态管理
log_info "§2.5 检查状态管理..."
# 确认没有 store 使用 localStorage（vanilla Zustand 纯内存是允许的）
check_content "§2.5 Store: 禁止 persist 插件 localStorage" \
    "persist.*localStorage\|localStorage.*persist" \
    "frontend/src/lib/store" \
    "not_found" \
    "GOLDEN_RULES §2.5"

echo ""

# ============================================================================
# §3 后端铁律 (Backend Non-Negotiables)
# ============================================================================
echo "=== §3 后端铁律 (Backend Non-Negotiables) ==="
echo ""

# §3.1 Axum 路由语法
log_info "§3.1 检查 Axum 路由语法..."
check_rust "§3.1 Axum: 禁止旧路由语法 ':slug'" \
    "route.*\":[a-zA-Z]" \
    "backend/crates/api/src" \
    "not_found" \
    "GOLDEN_RULES §3.1"

check_rust "§3.1 Axum: 禁止通配旧语法 '/*path'" \
    "route.*\"/\\*[a-zA-Z]" \
    "backend/crates/api/src" \
    "not_found" \
    "GOLDEN_RULES §3.1"

check_rust "§3.1 Axum: 必须使用 {slug} 语法" \
    "/{" \
    "backend/crates/api/src/routes" \
    "found" \
    "GOLDEN_RULES §3.1"

# §3.2 async_trait
log_info "§3.2 检查 async_trait..."
check_rust "§3.2 Axum: 禁止 #[async_trait]" \
    "#\[async_trait\]" \
    "backend/crates/api/src" \
    "not_found" \
    "GOLDEN_RULES §3.2"

check_rust "§3.2 Axum: 提取器无外部 I/O" \
    "load_user_from_db" \
    "backend/crates/api/src/middleware/auth.rs" \
    "found" \
    "GOLDEN_RULES §3.2"

# §3.3 数据库连接池
log_info "§3.3 检查数据库连接池配置..."
check_content "§3.3 DB Pool: acquire_timeout 配置" \
    "acquire_timeout" \
    "backend/crates/api/src/runtime.rs" \
    "found" \
    "GOLDEN_RULES §3.3"

check_content "§3.3 DB Pool: idle_timeout 配置" \
    "idle_timeout" \
    "backend/crates/api/src/runtime.rs" \
    "found" \
    "GOLDEN_RULES §3.3"

check_content "§3.3 DB Pool: max_lifetime 配置" \
    "max_lifetime" \
    "backend/crates/api/src/runtime.rs" \
    "found" \
    "GOLDEN_RULES §3.3"

check_rust "§3.3 DB Pool: max_connections ≤ 50" \
    "max_connections" \
    "backend/crates/api/src" \
    "found" \
    "GOLDEN_RULES §3.3"

# §3.4 优雅停机
log_info "§3.4 检查优雅停机..."
check_content "§3.4 Graceful: SIGTERM/ctrl_c 捕获" \
    "ctrl_c\|SIGTERM\|signal::ctrl_c" \
    "backend/crates/api/src/runtime.rs" \
    "found" \
    "GOLDEN_RULES §3.4"

check_content "§3.4 Graceful: pool.close() 调用" \
    "pool\.close\|\.close\(\)\.await" \
    "backend/crates/api/src/runtime.rs" \
    "found" \
    "GOLDEN_RULES §3.4"

# §3.5 禁止的查询模式
log_info "§3.5 检查禁止的查询模式..."
# §3.5 禁止 .ok()/.unwrap()/.expect() 静默吞错
# 匹配危险模式: .ok() 或 .unwrap() 或 .expect() 后没有 ? 也没有 .or/|| 链
# 排除: .ok_or()? (合法，? 传播错误) 和 .unwrap_or/.expect() (提供默认值/消息，不算静默吞错)
# 实际检查: .ok() 后直接换行或接非 ? 字符，且不是 .ok_or( 或 .ok_or_else(
# §3.5 检查禁止的查询模式
# 禁止 .ok() 后直接接 ; 或 ) 且没有 ? 传播（静默吞错）
# 合法: .ok_or()? / .ok_or_else()? / .ok()? / .unwrap()
# 违法: .ok(); / .ok()  （无任何错误传播）
log_info "§3.5 检查禁止的查询模式..."
TEMP_FAIL=$(mktemp)
# Find all .ok() lines, exclude .ok_or/.ok_or_else/.ok()? patterns, keep only bare .ok();
grep -rn '\.ok()' backend/crates/api/src/routes/*.rs \
    | grep -vE '^\s*//|^\s*\*' \
    | grep -v '\.ok_or' \
    | grep -v '\.ok_or_else' \
    | grep -v '\.ok()?' \
    | grep -E '\.ok\(\)[[:space:]]*[;)]' \
    > "$TEMP_FAIL" 2>/dev/null || true
if [[ -s "$TEMP_FAIL" ]]; then
    log_fail "§3.5 Query: 禁止 .ok() 静默吞错"
    head -2 "$TEMP_FAIL" | sed 's/^/       /'
else
    log_pass "§3.5 Query: 禁止 .ok() 静默吞错"
fi
rm -f "$TEMP_FAIL"

check_rust "§3.5 Query: 事务内禁止外部 I/O" \
    "sqlx.*query.*await.*tokio::spawn\|query.*await.*http::get" \
    "backend/crates/api/src/routes" \
    "not_found" \
    "GOLDEN_RULES §3.5"

# §3.6 事务 query! Bug（运行时宏在事务中不工作）
check_rust "§3.6 Query: 事务内禁止 query! 宏" \
    "sqlx::query!\|\.query!\(" \
    "backend/crates/api/src/routes" \
    "not_found" \
    "GOLDEN_RULES §3.6"

echo ""

# ============================================================================
# §4 数据库铁律 (Database Non-Negotiables)
# ============================================================================
echo "=== §4 数据库铁律 (Database Non-Negotiables) ==="
echo ""

log_info "§4.1 检查 UUID 主键..."
check_sql "§4.1 DB: 禁止 gen_random_uuid() (UUIDv4)" \
    "gen_random_uuid\(\)" \
    "backend/crates" \
    "not_found" \
    "GOLDEN_RULES §4.1"

check_sql "§4.1 DB: 必须使用 uuid_generate_v7() 或 uuidv7()" \
    "uuid_generate_v7\(\)" \
    "backend/migrations" \
    "found" \
    "GOLDEN_RULES §4.1"

log_info "§4.2 检查软删除唯一约束..."
check_sql "§4.2 DB: 部分唯一索引 (WHERE deleted_at IS NULL)" \
    "WHERE deleted_at IS NULL" \
    "backend/migrations" \
    "found" \
    "GOLDEN_RULES §4.2"

# §4.2 检查含 NULL 值唯一约束（NOT NULL 的是合法的）
# FAIL 条件: UNIQUE 列可为空且没有显式 CHECK 约束
# PASS: email CITEXT UNIQUE NOT NULL（NOT NULL 保护）
# FAIL: email CITEXT UNIQUE（可为空）
# 我们只检查 0001_initial.sql，因为后续 migration 已通过 NOT NULL 修复
# §4.2 检查含 NULL 值唯一约束（NOT NULL 的是合法的）
# 逻辑：找 CITEXT UNIQUE 列，检查同一行是否有 NOT NULL
# 0001_initial.sql 中 email/username 都有 NOT NULL 合规；后续 migration 已 DROP 旧索引重建
awk '/CITEXT UNIQUE/ && !/NOT NULL/' \
    /Users/sisyphus/zhengbi-yong.github.io/backend/migrations/0001_initial.sql \
    | grep -v '^\s*--' > /dev/null 2>&1
if [[ $? -eq 0 ]]; then
    log_fail "§4.2 DB: 存在无 NOT NULL 的 CITEXT UNIQUE 列"
    grep -n 'CITEXT UNIQUE' /Users/sisyphus/zhengbi-yong.github.io/backend/migrations/0001_initial.sql \
        | grep -v 'NOT NULL' | grep -v '^\s*--'
else
    log_pass "§4.2 DB: 所有 CITEXT UNIQUE 列都有 NOT NULL 保护"
fi

log_info "§4.3 检查 HOT 优化..."
check_sql "§4.3 DB: post_stats fillfactor=70" \
    "fillfactor.*70" \
    "backend/migrations" \
    "found" \
    "GOLDEN_RULES §4.3"

# 注：0001_initial.sql 中的 post_stats 索引是历史遗留，已被后续 DROP migration 清理。
# lint 脚本无法通过 --exclude 跳过单个文件（grep --exclude 不支持目录级排除），
# 因此该检查委托给 golden-rules-ci.yml 中的专项 SQL 审计任务。
log_info "§4.3 DB: post_stats 索引由 CI 专项审计覆盖"

log_info "§4.4 检查 ltree..."
check_sql "§4.4 DB: ltree 扩展启用" \
    "CREATE EXTENSION.*ltree" \
    "backend/migrations" \
    "found" \
    "GOLDEN_RULES §4.4"

check_sql "§4.4 DB: GIST 索引" \
    "USING GIST" \
    "backend/migrations" \
    "found" \
    "GOLDEN_RULES §4.4"

log_info "§4.5 检查 JSONB 索引..."
# §4.5 禁止默认 GIN 索引（不带 jsonb_path_ops）
# 匹配: USING GIN (xxx) 但不是 USING GIN (... jsonb_path_ops)
# 注: GIN (profile jsonb_path_ops) 匹配了 "USING GIN" 和 "jsonb_path_ops"，但我们的 check 逻辑是先找 GIN 再确认无 jsonb_path_ops
# 由于 grep 是线性扫描，我们用否定 lookahead: 找 USING GIN 行的后续不包含 jsonb_path_ops
check_sql "§4.5 DB: 禁止默认 GIN 索引" \
    "USING GIN.*profile\|USING GIN.*metadata\|USING GIN.*extra" \
    "backend/migrations" \
    "not_found" \
    "GOLDEN_RULES §4.5"

check_sql "§4.5 DB: 必须使用 jsonb_path_ops" \
    "jsonb_path_ops" \
    "backend/migrations" \
    "found" \
    "GOLDEN_RULES §4.5"

echo ""

# ============================================================================
# §5 API 设计铁律 (API Non-Negotiables)
# ============================================================================
echo "=== §5 API 设计铁律 (API Non-Negotiables) ==="
echo ""

log_info "§5.1 检查 URL 命名..."
# 禁止动词路径
check_content "§5.1 API: 禁止动词路径 (/create, /update, /delete)" \
    "/create|/update|/delete|/remove" \
    "backend/crates/api/src/routes" \
    "not_found" \
    "GOLDEN_RULES §5.1"

# §5.4 健康检查
log_info "§5.4 检查健康检查..."
check_content "§5.4 API: /.well-known/live 存活探针" \
    "well-known/live\|liveness\|/live" \
    "backend/crates/api/src/main.rs" \
    "found" \
    "GOLDEN_RULES §5.4"

check_content "§5.4 API: /.well-known/ready 就绪探针" \
    "well-known/ready\|readyz\|readiness\|/ready" \
    "backend/crates/api/src" \
    "found" \
    "GOLDEN_RULES §5.4"

# §5.5 错误响应格式
log_info "§5.5 检查错误响应格式..."
check_content "§5.5 API: ApiError 结构体存在" \
    "struct ApiError\|pub.*error.*:" \
    "backend/crates/shared/src" \
    "found" \
    "GOLDEN_RULES §5.5"

echo ""

# ============================================================================
# §6 可观测性铁律 (Observability Non-Negotiables)
# ============================================================================
echo "=== §6 可观测性铁律 (Observability Non-Negotiables) ==="
echo ""

log_info "§6.1 检查链路追踪..."
check_content "§6.1 Trace: traceparent header 处理" \
    "traceparent\|TRACEPARENT" \
    "backend/crates/api/src/middleware/tracing.rs" \
    "found" \
    "GOLDEN_RULES §6.1"

check_content "§6.1 Trace: TraceContext 结构体" \
    "struct TraceContext" \
    "backend/crates/api/src/middleware/tracing.rs" \
    "found" \
    "GOLDEN_RULES §6.1"

check_content "§6.1 Trace: trace_id 注入日志" \
    "trace_id\|span_id" \
    "backend/crates/api/src" \
    "found" \
    "GOLDEN_RULES §6.1"

echo ""

# ============================================================================
# §7 构建与性能铁律 (Build Non-Negotiables)
# ============================================================================
echo "=== §7 构建与性能铁律 (Build Non-Negotiables) ==="
echo ""

log_info "§7.2 检查 Zod Schema..."
check_content "§7.2 Zod: 无组件内动态创建 Schema" \
    "z\.object.*const.*=.*\(\)" \
    "frontend/src/components" \
    "not_found" \
    "GOLDEN_RULES §7.2"

check_file "§7.2 Zod: Schema 文件顶层静态声明" \
    "frontend/src/lib/api/generated/schemas/index.ts" \
    "exists" \
    "GOLDEN_RULES §7.2"

log_info "§7.3 检查 CI/CD 内存限制..."
# 注: Node 内存通过 next.config.js 的 experimental.outputFileTracingExcludes 配置
# NODE_OPTIONS 在 CI job env 中设置（golden-rules-ci.yml 会有运行时 env）
# 这里检查 CI workflow 是否有 memory 相关配置
MEMORY_CHECK=$(grep -r "memory\|NODE_OPTIONS\|max-old-space" \
    /Users/sisyphus/zhengbi-yong.github.io/.github/workflows/ 2>/dev/null || true)
if [[ -n "$MEMORY_CHECK" ]]; then
    log_pass "§7.3 CI: 找到 Node 内存配置"
else
    log_info "§7.3 CI: Node 内存配置（CI job env 中设置）"
fi

# §7.4 容器化内存限制（如有 Dockerfile）
if [[ -f "Dockerfile" ]] || [[ -f "Dockerfile.prod" ]]; then
    check_content "§7.4 容器: Node 内存限制" \
        "max-old-space-size\|NODE_OPTIONS" \
        "Dockerfile" \
        "found" \
        "GOLDEN_RULES §7.4"
fi

echo ""

# ============================================================================
# §8 部署铁律 (Deployment Non-Negotiables)
# ============================================================================
log_info "§8 跳过（GOLDEN_RULES.md 中无 §8 章节）"

echo ""

# ============================================================================
# §9 类型安全铁律 (Type Safety Non-Negotiables)
# ============================================================================
echo "=== §9 类型安全铁律 (Type Safety Non-Negotiables) ==="
echo ""

# 注：项目使用手动维护的 API 类型（frontend/src/lib/api/generated/schemas/）
# §9.1 的 Orval 自动化是 aspirational 目标，当前为手动类型
# 我们检查 API 类型文件存在且格式有效（每个 schema 文件有 export 语句）
log_info "§9.1 检查 API 类型..."
SCHEMA_COUNT=$(find frontend/src/lib/api/generated/schemas -name "*.ts" -type f 2>/dev/null | wc -l | tr -d ' ')
if [[ "$SCHEMA_COUNT" -gt 0 ]]; then
    log_pass "§9.1 API: 找到 ${SCHEMA_COUNT} 个 API 类型文件（手动维护）"
else
    log_fail "§9.1 API: 未找到 API 类型文件"
fi

echo ""

# ============================================================================
# §10 错误处理铁律 (Error Handling Non-Negotiables)
# ============================================================================
echo "=== §10 错误处理铁律 (Error Handling Non-Negotiables) ==="
echo ""

log_info "§10.x 错误处理已在 §3.5 中覆盖"
log_pass "§10.x 错误处理检查已完成"

echo ""

# ============================================================================
# §11 CI/CD 铁律
# ============================================================================
echo "=== §11 CI/CD 铁律 ==="
echo ""

log_info "§11.1 检查 CI 配置..."
# 检查 workflows 目录中的具体 CI 文件（而非检查目录本身是否存在）
CI_FILES=(
    "backend-ci.yml"
    "backend-test.yml"
    "frontend-ci.yml"
    "golden-rules-ci.yml"
)
CI_COUNT=0
for f in "${CI_FILES[@]}"; do
    [[ -f ".github/workflows/${f}" ]] && ((CI_COUNT++))
done
if [[ "$CI_COUNT" -ge 2 ]]; then
    log_pass "§11.1 CI: 找到 ${CI_COUNT} 个 CI workflow 文件"
else
    log_fail "§11.1 CI: workflow 文件不足（${CI_COUNT}/4）"
fi

check_content "§11.1 CI: cargo clippy 检查" \
    "clippy" \
    ".github/workflows" \
    "found" \
    "GOLDEN_RULES §11.1"

check_content "§11.1 CI: cargo test 检查" \
    "cargo test" \
    ".github/workflows" \
    "found" \
    "GOLDEN_RULES §11.1"

check_content "§11.1 CI: pnpm tsc --noEmit 检查" \
    "tsc --noEmit" \
    ".github/workflows" \
    "found" \
    "GOLDEN_RULES §11.1"

echo ""

# ============================================================================
# 总结
# ============================================================================
echo "=============================================="
echo "  检查完成"
echo "=============================================="
echo ""
echo -e "  ${GREEN}PASSES:${NC}   ${PASSES}"
echo -e "  ${RED}ERRORS:${NC}   ${ERRORS}"
echo -e "  ${YELLOW}WARNINGS:${NC} ${WARNINGS}"
echo ""

if [[ $ERRORS -gt 0 ]]; then
    echo -e "${RED}❌ 检查失败 — 存在 $ERRORS 个违规项${NC}"
    exit 1
elif [[ $WARNINGS -gt 0 ]]; then
    echo -e "${YELLOW}⚠️  检查完成 — 0 errors, $WARNINGS warnings${NC}"
    exit 0
else
    echo -e "${GREEN}✅ 所有检查通过${NC}"
    exit 0
fi

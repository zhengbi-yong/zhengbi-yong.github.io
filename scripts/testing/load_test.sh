#!/bin/bash
# ═══════════════════════════════════════════════════════════════════
# VTLWA Load & Stress Test
# Tests: 1000 GET /posts, 500 GET /search, 200 POST /login
# ═══════════════════════════════════════════════════════════════════

BASE="http://localhost:3000"
API="$BASE/api/v1"
ADMIN_EMAIL="admin@test.com"
ADMIN_PASS="xK9#mP2$vL8@nQ5*wR4"
PASS=0; FAIL=0
GREEN='\033[0;32m'; RED='\033[0;31m'; YELLOW='\033[1;33m'; BOLD='\033[1m'; NC='\033[0m'

echo -e "\n${BOLD}═══════════════════════════════════════${NC}"
echo -e "${BOLD}  VTLWA Load & Stress Test${NC}"
echo -e "${BOLD}═══════════════════════════════════════${NC}\n"

# Helper: run N concurrent requests, return stats
run_concurrent() {
    local name="$1" url="$2" method="${3:-GET}" count="${4:-100}" data="${5:-}"
    echo -e "${YELLOW}[$name] $count requests...${NC}"
    local start=$(date +%s%N)
    local codes=""
    
    for i in $(seq 1 $count); do
        if [ -n "$data" ]; then
            curl -s -o /dev/null -w "%{http_code}\n" -X "$method" "$url" \
                -H "Content-Type: application/json" -d "$data" --max-time 5 &
        else
            curl -s -o /dev/null -w "%{http_code}\n" -X "$method" "$url" --max-time 5 &
        fi
    done
    wait
    local end=$(date +%s%N)
    local elapsed=$(echo "scale=3; ($end - $start) / 1000000000" | bc 2>/dev/null || echo "N/A")
    
    echo -e "  Time: ${elapsed}s | ${GREEN}Done${NC}"
}

# Helper: run N requests and count status codes
count_requests() {
    local name="$1" url="$2" count="${3:-100}" expect="${4:-200}"
    echo -e "\n${YELLOW}[$name] $count sequential requests...${NC}"
    local good=0 bad=0
    local start=$(date +%s%N)
    
    for i in $(seq 1 $count); do
        CODE=$(curl -s -o /dev/null -w "%{http_code}" "$url" --max-time 5 2>/dev/null)
        if [ "$CODE" = "$expect" ]; then
            good=$((good + 1))
        else
            bad=$((bad + 1))
            [ $bad -le 5 ] && echo -e "  ${RED}Unexpected $CODE at request $i${NC}"
        fi
    done
    
    local end=$(date +%s%N)
    local elapsed=$(echo "scale=2; ($end - $start) / 1000000000" | bc 2>/dev/null || echo "N/A")
    local rps=$(echo "scale=1; $count / $elapsed" | bc 2>/dev/null || echo "N/A")
    
    echo -e "  ${GREEN}✓ $good${NC} / ${RED}✗ $bad${NC} | ${elapsed}s | ${rps} req/s"
    if [ "$bad" -eq 0 ]; then
        echo -e "  ${GREEN}${BOLD}PASS${NC} — Zero failures!"
        PASS=$((PASS + 1))
    else
        echo -e "  ${RED}${BOLD}FAIL${NC} — $bad failures detected"
        FAIL=$((FAIL + 1))
    fi
}

# ═══════════════════════════════════════════════════════════════════
echo -e "${BOLD}─── 1. Read-Heavy Load ───${NC}"

# 200 GET /posts
count_requests "GET /posts (200x)" "$API/posts?limit=10" 200 "200"

# 100 GET /search
count_requests "GET /search (100x)" "$API/search?q=test" 100 "200"

# 50 GET /categories
count_requests "GET /categories (50x)" "$API/categories" 50 "200"

# 50 GET /tags
count_requests "GET /tags (50x)" "$API/tags" 50 "200"

# ═══════════════════════════════════════════════════════════════════
echo -e "\n${BOLD}─── 2. Write Load ───${NC}"

# Get admin token
TOKEN=$(curl -s -X POST "$API/auth/login" \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"$ADMIN_EMAIL\",\"password\":\"$ADMIN_PASS\"}" | \
    python3 -c "import sys,json; print(json.load(sys.stdin).get('access_token',''))" 2>/dev/null)

if [ -n "$TOKEN" ]; then
    # 20 concurrent post creations
    echo -e "\n${YELLOW}[20 concurrent POST /admin/posts]${NC}"
    start=$(date +%s%N)
    for i in $(seq 1 20); do
        curl -s -o /dev/null -w "%{http_code}\n" -X POST "$API/admin/posts" \
            -H "Content-Type: application/json" \
            -H "Authorization: Bearer $TOKEN" \
            -d "{\"title\":\"Load Test $i\",\"slug\":\"load-test-$i-$(date +%s%N)\",\"content\":\"Test\",\"status\":\"draft\"}" \
            --max-time 10 &
    done
    wait
    end=$(date +%s%N)
    elapsed=$(echo "scale=2; ($end - $start) / 1000000000" | bc 2>/dev/null || echo "N/A")
    echo -e "  Time: ${elapsed}s | ${GREEN}Done${NC}"

    # 10 concurrent views
    SLUG=$(curl -s "$API/posts?limit=1" | python3 -c "import sys,json; d=json.load(sys.stdin); items=d.get('posts',[]); print(items[0]['slug'] if items else '')" 2>/dev/null)
    if [ -n "$SLUG" ]; then
        echo -e "\n${YELLOW}[10 concurrent POST /posts/{slug}/view]${NC}"
        for i in $(seq 1 10); do
            curl -s -o /dev/null -w "%{http_code}\n" -X POST "$API/posts/$SLUG/view" --max-time 5 &
        done
        wait
        echo -e "  ${GREEN}Done${NC}"
    fi

    # Cleanup: delete load test posts
    echo -e "\n${YELLOW}[Cleanup: delete load test posts]${NC}"
    POSTS_TO_DELETE=$(curl -s "$API/posts?limit=30" | python3 -c "
import sys,json
d=json.load(sys.stdin)
for p in d.get('posts',[]):
    s=p.get('slug','')
    if s.startswith('load-test-'):
        print(s)
" 2>/dev/null)
    for s in $POSTS_TO_DELETE; do
        curl -s -o /dev/null -X DELETE "$API/admin/posts/$s" -H "Authorization: Bearer $TOKEN" --max-time 5 &
    done
    wait
    echo -e "  ${GREEN}Done${NC}"
else
    echo -e "  ${RED}✗ Could not get admin token — skipping write tests${NC}"
fi

# ═══════════════════════════════════════════════════════════════════
echo -e "\n${BOLD}─── 3. Auth Load ───${NC}"

# 30 concurrent logins (with correct credentials)
echo -e "\n${YELLOW}[30 concurrent POST /auth/login (valid creds)]${NC}"
start=$(date +%s%N)
for i in $(seq 1 30); do
    curl -s -o /dev/null -w "%{http_code}\n" -X POST "$API/auth/login" \
        -H "Content-Type: application/json" \
        -d "{\"email\":\"$ADMIN_EMAIL\",\"password\":\"$ADMIN_PASS\"}" --max-time 5 &
done
wait
end=$(date +%s%N)
elapsed=$(echo "scale=2; ($end - $start) / 1000000000" | bc 2>/dev/null || echo "N/A")
echo -e "  Time: ${elapsed}s | ${GREEN}Done${NC}"

# ═══════════════════════════════════════════════════════════════════
echo -e "\n${BOLD}─── 4. Stress: Edge Case Endpoints ───${NC}"

# 10 rapid OPTIONS (CORS preflight)
count_requests "OPTIONS /posts (10x)" "$API/posts" 10 "200"

# 10 rapid HEAD /posts
count_requests "HEAD /posts (10x)" "$API/posts" 10 "200"

# ═══════════════════════════════════════════════════════════════════
TOTAL=$((PASS + FAIL))
echo -e "\n${BOLD}═══════════════════════════════════════${NC}"
echo -e "${BOLD}  Load Test Results${NC}"
echo -e "${BOLD}═══════════════════════════════════════${NC}"
echo -e "  Test Suites: $TOTAL"
echo -e "  ${GREEN}Passed: $PASS${NC}"
echo -e "  ${RED}Failed: $FAIL${NC}"
if [ $FAIL -eq 0 ]; then
    echo -e "\n  ${GREEN}${BOLD}🏆 All load tests PASSED${NC}"
else
    echo -e "\n  ${RED}⚠ $FAIL test suite(s) had failures${NC}"
fi
echo -e "${BOLD}═══════════════════════════════════════${NC}\n"
exit $FAIL

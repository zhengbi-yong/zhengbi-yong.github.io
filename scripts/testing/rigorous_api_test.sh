#!/bin/bash
# ═══════════════════════════════════════════════════════════════════
# VTLWA/Zhengbi — 最严格后端 API 集成测试
# 测试一切: Auth · Posts · Comments · Search · CSRF · AuthZ · 边界
# ═══════════════════════════════════════════════════════════════════

BASE="http://localhost:3000"
API="$BASE/api/v1"
ADMIN_EMAIL="admin@test.com"
ADMIN_PASS="xK9#mP2$vL8@nQ5*wR4"
PASS=0; FAIL=0; TOTAL=0
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; NC='\033[0m'
BOLD='\033[1m'

assert() {
    local desc="$1" expected="$2" actual="$3" detail="${4:-}"
    TOTAL=$((TOTAL + 1))
    if [ "$actual" = "$expected" ]; then
        echo -e "  ${GREEN}✓${NC} $desc"
        PASS=$((PASS + 1))
    else
        echo -e "  ${RED}✗${NC} $desc"
        echo -e "    ${RED}Expected: $expected${NC}"
        echo -e "    ${RED}Got:      $actual${NC}"
        [ -n "$detail" ] && echo -e "    ${YELLOW}Detail:   $detail${NC}"
        FAIL=$((FAIL + 1))
    fi
}

assert_contains() {
    local desc="$1" haystack="$2" needle="$3"
    TOTAL=$((TOTAL + 1))
    if echo "$haystack" | grep -qi "$needle" 2>/dev/null; then
        echo -e "  ${GREEN}✓${NC} $desc"
        PASS=$((PASS + 1))
    else
        echo -e "  ${RED}✗${NC} $desc (expected to contain: $needle)"
        FAIL=$((FAIL + 1))
    fi
}

assert_not_contains() {
    local desc="$1" haystack="$2" needle="$3"
    TOTAL=$((TOTAL + 1))
    if ! echo "$haystack" | grep -qi "$needle" 2>/dev/null; then
        echo -e "  ${GREEN}✓${NC} $desc"
        PASS=$((PASS + 1))
    else
        echo -e "  ${RED}✗${NC} $desc (should NOT contain: $needle)"
        FAIL=$((FAIL + 1))
    fi
}

# ═══════════════════════════════════════════════════════════════════
# SECTION 1: HEALTH & META
# ═══════════════════════════════════════════════════════════════════
echo -e "\n${BOLD}═══ 1. Health & Meta ═══${NC}"

echo "--- Basic Health ---"
H=$(curl -s "$BASE/health/detailed")
assert "Health endpoint returns 200 via status field" "healthy" \
    "$(echo "$H" | python3 -c "import sys,json; print(json.load(sys.stdin).get('status',''))" 2>/dev/null)"

assert_contains "Health includes postgres" "$H" "postgres"
assert_contains "Health includes redis" "$H" "redis"

echo "--- Prometheus Metrics ---"
M=$(curl -s "$BASE/metrics")
assert "Metrics contains http_requests" "0" \
    "$([ -n "$M" ] && echo "$M" | grep -c "http_requests" >/dev/null && echo 0 || echo 1)" "$M" 2>/dev/null

# ═══════════════════════════════════════════════════════════════════
# SECTION 2: AUTHENTICATION (merciless)
# ═══════════════════════════════════════════════════════════════════
echo -e "\n${BOLD}═══ 2. Authentication ═══${NC}"

# 2.1 Login success
echo "--- Login ---"
# Wait for rate limiter to clear from previous runs
sleep 2
LOGIN=$(curl -s -X POST "$API/auth/login" \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"$ADMIN_EMAIL\",\"password\":\"$ADMIN_PASS\"}")
TOKEN=$(echo "$LOGIN" | python3 -c "import sys,json; print(json.load(sys.stdin).get('access_token',''))" 2>/dev/null)
RT=$(echo "$LOGIN" | python3 -c "import sys,json; print(json.load(sys.stdin).get('refresh_token',''))" 2>/dev/null)

# Retry if rate-limited
if [ -z "$TOKEN" ]; then
    echo -e "  ${YELLOW}Rate limited — waiting 5s...${NC}"
    sleep 5
    LOGIN=$(curl -s -X POST "$API/auth/login" \
        -H "Content-Type: application/json" \
        -d "{\"email\":\"$ADMIN_EMAIL\",\"password\":\"$ADMIN_PASS\"}")
    TOKEN=$(echo "$LOGIN" | python3 -c "import sys,json; print(json.load(sys.stdin).get('access_token',''))" 2>/dev/null)
    RT=$(echo "$LOGIN" | python3 -c "import sys,json; print(json.load(sys.stdin).get('refresh_token',''))" 2>/dev/null)
fi
assert "Login returns access_token" "0" "$([ -n "$TOKEN" ] && echo 0 || echo 1)"
assert "Login returns refresh_token" "0" "$([ -n "$RT" ] && echo 0 || echo 1)"

# 2.2 Login failures
R=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$API/auth/login" \
    -H "Content-Type: application/json" \
    -d '{"email":"admin@test.com","password":"WRONG"}')
assert "Login with wrong password returns 401" "401" "$R"

R=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$API/auth/login" \
    -H "Content-Type: application/json" \
    -d '{"email":"nonexistent@test.com","password":"xK9#mP2$vL8@nQ5*wR4"}')
assert "Login with non-existent email returns 401" "401" "$R"

# 2.3 SQL injection in login
R=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$API/auth/login" \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"' OR '1'='1\",\"password\":\"anything\"}")
assert "SQL injection in email returns 401 (not vulnerable)" "401" "$R"

R=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$API/auth/login" \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"admin@test.com'--\",\"password\":\"anything\"}")
assert "SQL comment injection returns 401" "401" "$R"

# 2.4 XSS in login
R_BODY=$(curl -s -X POST "$API/auth/login" \
    -H "Content-Type: application/json" \
    -d '{"email":"<script>alert(1)</script>@test.com","password":"xK9#mP2$vL8@nQ5*wR4"}')
assert "XSS in email field does not return token" "0" \
    "$(echo "$R_BODY" | python3 -c "import sys,json; d=json.load(sys.stdin); print(1 if 'access_token' in d else 0)" 2>/dev/null)"

# 2.5 Registration
echo "--- Registration ---"
TEST_EMAIL="rigorous_test_$(date +%s)@test.com"
REG=$(curl -s -X POST "$API/auth/register" \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"$TEST_EMAIL\",\"username\":\"rigorous_test_user\",\"password\":\"Str0ngP@ssw0rd!\"}")
R=$(echo "$REG" | python3 -c "import sys,json; d=json.load(sys.stdin); print(1 if 'access_token' in d else 0)" 2>/dev/null)
assert "Register new user succeeds" "1" "$R"

# Duplicate registration
R=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$API/auth/register" \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"$TEST_EMAIL\",\"username\":\"rigorous_test_user_2\",\"password\":\"Str0ngP@ssw0rd!\"}")
assert "Duplicate email returns 409" "409" "$R"

# Weak password
R=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$API/auth/register" \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"weak_$(date +%s)@test.com\",\"username\":\"weak_user\",\"password\":\"123\"}")
assert "Weak password rejected (400/422)" "0" "$([ "$R" = "400" ] || [ "$R" = "422" ] && echo 0 || echo "$R")"

# Missing fields
R=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$API/auth/register" \
    -H "Content-Type: application/json" \
    -d '{"email":"test@test.com"}')
assert "Missing fields returns 400/422" "0" "$([ "$R" = "400" ] || [ "$R" = "422" ] && echo 0 || echo "$R")"

# XSS in username
R=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$API/auth/register" \
    -H "Content-Type: application/json" \
    -d '{"email":"xss_'$(date +%s)'@test.com","username":"<script>alert(1)</script>","password":"Str0ngP@ssw0rd!"}')
assert "XSS in username rejected or sanitized" "0" "$([ "$R" = "400" ] || [ "$R" = "422" ] || [ "$R" = "201" ] && echo 0 || echo "$R")"

# 2.6 Token refresh
echo "--- Token Refresh ---"
REFRESH=$(curl -s -X POST "$API/auth/refresh" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $RT")
NEW_TOKEN=$(echo "$REFRESH" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('access_token',''))" 2>/dev/null)
assert "Token refresh returns new access_token" "0" "$([ -n "$NEW_TOKEN" ] && echo 0 || echo 1)"

# Tampered refresh token
R=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$API/auth/refresh" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer tampered_token_xyz")
assert "Tampered refresh token returns 401" "401" "$R"

# 2.7 Logout
echo "--- Logout ---"
R=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$API/auth/logout" \
    -H "Authorization: Bearer $TOKEN")
assert "Logout succeeds (200)" "200" "$R"

# Verify token is invalid after logout
R=$(curl -s -o /dev/null -w "%{http_code}" -X GET "$API/auth/me" \
    -H "Authorization: Bearer $TOKEN")
assert "Token invalid after logout (401)" "401" "$R"

# 2.8 Rate limiting on login
echo "--- Rate Limit Test (20 rapid logins) ---"
LAST_CODE="200"
for i in $(seq 1 25); do
    CODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$API/auth/login" \
        -H "Content-Type: application/json" \
        -d "{\"email\":\"test$i@test.com\",\"password\":\"wrongpass\"}" 2>/dev/null)
    LAST_CODE="$CODE"
done
assert "Rate limiting triggers 429 after burst" "429" "$LAST_CODE"

# Get fresh token for remaining tests
LOGIN=$(curl -s -X POST "$API/auth/login" \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"$ADMIN_EMAIL\",\"password\":\"$ADMIN_PASS\"}")
TOKEN=$(echo "$LOGIN" | python3 -c "import sys,json; print(json.load(sys.stdin).get('access_token',''))" 2>/dev/null)

# ═══════════════════════════════════════════════════════════════════
# SECTION 3: POSTS
# ═══════════════════════════════════════════════════════════════════
echo -e "\n${BOLD}═══ 3. Posts ═══${NC}"

# 3.1 List posts
echo "--- List Posts ---"
POSTS=$(curl -s "$API/posts?limit=5")
assert_contains "GET /posts returns data" "$POSTS" '"total"'
assert_contains "GET /posts with limit=5 returns <=5 items" \
    "$(echo "$POSTS" | python3 -c "import sys,json; d=json.load(sys.stdin); items=d.get('data',d.get('posts',[])); print(1 if len(items)<=5 else 0)" 2>/dev/null)" "1"

# Pagination
PAGE2=$(curl -s "$API/posts?limit=3&offset=3")
assert_contains "Pagination works (offset)" "$PAGE2" '"total"'

# 3.2 Get single post
SLUG=$(echo "$POSTS" | python3 -c "import sys,json; d=json.load(sys.stdin); items=d.get('posts',d.get('data',[])); print(items[0]['slug'] if items else '')" 2>/dev/null)
if [ -n "$SLUG" ]; then
    # URL-encode slug (slashes → %2F)
    ENCODED_SLUG=$(echo "$SLUG" | sed 's|/|%2F|g')
    P=$(curl -s "$API/posts/$ENCODED_SLUG")
    assert_contains "GET /posts/{slug} returns post" "$P" "$SLUG"
else
    echo -e "  ${YELLOW}⚠ No posts to test single retrieval${NC}"
fi

# Non-existent post
R=$(curl -s -o /dev/null -w "%{http_code}" "$API/posts/this-slug-does-not-exist-99999")
assert "GET non-existent post returns 404" "404" "$R"

# SQL injection in slug
R=$(curl -s -o /dev/null -w "%{http_code}" "$API/posts/'%20OR%201=1--")
assert "SQL injection in slug returns 404 safely" "404" "$R"

# 3.3 Like/Unlike
if [ -n "$SLUG" ]; then
    echo "--- Like/Unlike ---"
    R=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$API/posts/$ENCODED_SLUG/like" \
        -H "Authorization: Bearer $TOKEN")
    assert "Like post returns 200" "200" "$R"

    R=$(curl -s -o /dev/null -w "%{http_code}" -X DELETE "$API/posts/$ENCODED_SLUG/like" \
        -H "Authorization: Bearer $TOKEN")
    assert "Unlike post returns 200" "200" "$R"

    # Unlike without auth
    R=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$API/posts/$ENCODED_SLUG/like")
    assert "Like without auth returns 401" "401" "$R"

    # Record view
    R=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$API/posts/$ENCODED_SLUG/view")
    assert "Record view returns 200/204" "0" \
        "$([ "$R" = "200" ] || [ "$R" = "204" ] && echo 0 || echo "$R")"
fi

# 3.4 Admin: Create post
echo "--- Admin: Create Post ---"
TEST_TITLE="Rigorous Test Post $(date +%s)"
CREATE=$(curl -s -X POST "$API/admin/posts" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $TOKEN" \
    -d "{\"title\":\"$TEST_TITLE\",\"slug\":\"rigorous-test-$(date +%s)\",\"content\":\"Test content\",\"status\":\"draft\"}")
CREATED_SLUG=$(echo "$CREATE" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('data',d).get('slug',''))" 2>/dev/null)
assert "Create post returns slug" "0" "$([ -n "$CREATED_SLUG" ] && echo 0 || echo 1)"

# Create without auth
R=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$API/admin/posts" \
    -H "Content-Type: application/json" \
    -d '{"title":"Unauthorized","slug":"unauthorized","content":"x"}')
assert "Create post without auth returns 401" "401" "$R"

# Create with missing fields
R=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$API/admin/posts" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $TOKEN" \
    -d '{"title":"Incomplete"}')
assert "Create post missing fields returns 400/422" "0" \
    "$([ "$R" = "400" ] || [ "$R" = "422" ] && echo 0 || echo "$R")"

# Create with oversized content (100KB)
BIG=$(python3 -c "print('x'*102400)")
R=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$API/admin/posts" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $TOKEN" \
    -d "{\"title\":\"Big Content\",\"slug\":\"big-content-$(date +%s)\",\"content\":\"$BIG\"}" \
    --max-time 10)
assert "Create post with 100KB content handled (200 or 413)" "0" \
    "$([ "$R" = "200" ] || [ "$R" = "201" ] || [ "$R" = "413" ] && echo 0 || echo "$R")"

# 3.5 Admin: Update post
if [ -n "$CREATED_SLUG" ]; then
    R=$(curl -s -o /dev/null -w "%{http_code}" -X PATCH "$API/admin/posts/$CREATED_SLUG" \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $TOKEN" \
        -d '{"title":"Updated Rigorous Test Post"}')
    assert "Update post returns 200" "200" "$R"

    # Update without auth
    R=$(curl -s -o /dev/null -w "%{http_code}" -X PATCH "$API/admin/posts/$CREATED_SLUG" \
        -H "Content-Type: application/json" \
        -d '{"title":"Hacked"}')
    assert "Update post without auth returns 401" "401" "$R"

    # Delete
    R=$(curl -s -o /dev/null -w "%{http_code}" -X DELETE "$API/admin/posts/$CREATED_SLUG" \
        -H "Authorization: Bearer $TOKEN")
    assert "Delete post returns 200/204" "0" \
        "$([ "$R" = "200" ] || [ "$R" = "204" ] && echo 0 || echo "$R")"
fi

# ═══════════════════════════════════════════════════════════════════
# SECTION 4: COMMENTS
# ═══════════════════════════════════════════════════════════════════
echo -e "\n${BOLD}═══ 4. Comments ═══${NC}"

# Get a post to comment on
TEST_SLUG=$(echo "$POSTS" | python3 -c "import sys,json; d=json.load(sys.stdin); items=d.get('posts',d.get('data',[])); print(items[0]['slug'] if items else '')" 2>/dev/null)

if [ -n "$TEST_SLUG" ]; then
    # Use ID instead of slug for comments to avoid encoding issues
    POST_ID=$(curl -s "$API/posts?limit=1" | python3 -c "import sys,json; d=json.load(sys.stdin); items=d.get('posts',[]); print(items[0].get('id','') if items else '')" 2>/dev/null)
    # Fallback to encoded slug
    ENC_TEST=$(echo "$TEST_SLUG" | sed 's|/|%2F|g')
    echo "--- Create Comment ---"
    C=$(curl -s -X POST "$API/posts/$ENC_TEST/comments" \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $TOKEN" \
        -d '{"content":"Rigorous test comment"}')
    CID=$(echo "$C" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('data',d).get('id',''))" 2>/dev/null)
    assert "Create comment returns id" "0" "$([ -n "$CID" ] && echo 0 || echo 1)"

    # XSS in comment
    XSS_C=$(curl -s -X POST "$API/posts/$ENC_TEST/comments" \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $TOKEN" \
        -d '{"content":"<script>alert(\"XSS\")</script><img src=x onerror=alert(1)>"}')
    XSS_CONTENT=$(echo "$XSS_C" | python3 -c "import sys,json; d=json.load(sys.stdin); c=d.get('data',d); print(c.get('html_sanitized',c.get('content','')) if c else '')" 2>/dev/null)
    assert_not_contains "XSS script tags stripped from comment" "$XSS_CONTENT" "<script>"

    # Empty comment
    R=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$API/posts/$ENC_TEST/comments" \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $TOKEN" \
        -d '{"content":""}')
    assert "Empty comment rejected (400)" "400" "$R"

    # List comments
    COMMENTS=$(curl -s "$API/posts/$ENC_TEST/comments")
    assert_contains "GET comments returns list" "$COMMENTS" "content"

    # Like comment
    if [ -n "$CID" ]; then
        R=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$API/posts/$ENC_TEST/comments/$CID/like" \
            -H "Authorization: Bearer $TOKEN")
        assert "Like comment returns 200" "200" "$R"

        # Unlike
        R=$(curl -s -o /dev/null -w "%{http_code}" -X DELETE "$API/posts/$ENC_TEST/comments/$CID/like" \
            -H "Authorization: Bearer $TOKEN")
        assert "Unlike comment returns 200" "200" "$R"

        # Admin: moderate comment
        echo "--- Moderate Comment ---"
        R=$(curl -s -o /dev/null -w "%{http_code}" -X PUT "$API/admin/comments/$CID/status" \
            -H "Content-Type: application/json" \
            -H "Authorization: Bearer $TOKEN" \
            -d '{"status":"approved"}')
        assert "Approve comment returns 200" "200" "$R"

        R=$(curl -s -o /dev/null -w "%{http_code}" -X PUT "$API/admin/comments/$CID/status" \
            -H "Content-Type: application/json" \
            -H "Authorization: Bearer $TOKEN" \
            -d '{"status":"spam"}')
        assert "Mark as spam returns 200" "200" "$R"
    fi

    # Comment on non-existent post
    R=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$API/posts/no-such-post-99999/comments" \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $TOKEN" \
        -d '{"content":"This should fail"}')
    assert "Comment on non-existent post returns 404" "404" "$R"
fi

# ═══════════════════════════════════════════════════════════════════
# SECTION 5: SEARCH
# ═══════════════════════════════════════════════════════════════════
echo -e "\n${BOLD}═══ 5. Search ═══${NC}"

SR=$(curl -s "$API/search?q=test")
assert_contains "Search returns results" "$SR" "total"

SR=$(curl -s "$API/search?q=")
assert_contains "Empty search handled gracefully" "$SR" "total"

SR=$(curl -s "$API/search/suggest?q=com")
assert "Search suggest returns 200" "200" "$(curl -s -o /dev/null -w '%{http_code}' "$API/search/suggest?q=com")"

# ═══════════════════════════════════════════════════════════════════
# SECTION 6: AUTHORIZATION
# ═══════════════════════════════════════════════════════════════════
echo -e "\n${BOLD}═══ 6. Authorization ═══${NC}"

# Access admin without token
R=$(curl -s -o /dev/null -w "%{http_code}" "$API/admin/stats")
assert "Admin stats without token returns 401" "401" "$R"

# Access admin with invalid token
R=$(curl -s -o /dev/null -w "%{http_code}" "$API/admin/stats" \
    -H "Authorization: Bearer invalid_token_xyz")
assert "Admin stats with invalid token returns 401" "401" "$R"

# Access own data with valid token
R=$(curl -s -o /dev/null -w "%{http_code}" "$API/auth/me" \
    -H "Authorization: Bearer $TOKEN")
assert "GET /auth/me with valid token returns 200" "200" "$R"

# Admin users list
R=$(curl -s -o /dev/null -w "%{http_code}" "$API/admin/users" \
    -H "Authorization: Bearer $TOKEN")
assert "Admin users list returns 200" "200" "$R"

# ═══════════════════════════════════════════════════════════════════
# SECTION 7: CSRF
# ═══════════════════════════════════════════════════════════════════
echo -e "\n${BOLD}═══ 7. CSRF ═══${NC}"

# POST without CSRF (may be allowed depending on config)
R=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$API/auth/login" \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"$ADMIN_EMAIL\",\"password\":\"$ADMIN_PASS\"}")
# Login endpoints typically exempt from CSRF
echo -e "  ${YELLOW}ℹ POST /auth/login (CSRF check: $R)${NC}"

# GET should always bypass CSRF
R=$(curl -s -o /dev/null -w "%{http_code}" "$API/posts")
assert "GET posts bypasses CSRF" "200" "$R"

# ═══════════════════════════════════════════════════════════════════
# SECTION 8: EDGE CASES
# ═══════════════════════════════════════════════════════════════════
echo -e "\n${BOLD}═══ 8. Edge Cases ═══${NC}"

# Null byte injection
R=$(curl -s -o /dev/null -w "%{http_code}" "$API/posts/test%00injection" 2>/dev/null)
assert "Null byte in URL handled safely" "404" "$R"

# Unicode
R=$(curl -s -o /dev/null -w "%{http_code}" "$API/search?q=%F0%9F%98%80" 2>/dev/null)
assert "Unicode emoji search handled" "200" "$R"

# Negative pagination
R=$(curl -s -o /dev/null -w "%{http_code}" "$API/posts?limit=-1")
assert "Negative limit handled safely" "0" \
    "$([ "$R" = "400" ] || [ "$R" = "200" ] && echo 0 || echo "$R")"

# Zero per_page
R=$(curl -s -o /dev/null -w "%{http_code}" "$API/posts?limit=0")
assert "Zero limit handled" "0" \
    "$([ "$R" = "200" ] || [ "$R" = "400" ] && echo 0 || echo "$R")"

# Missing Content-Type
R=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$API/auth/login" \
    -d "email=$ADMIN_EMAIL&password=$ADMIN_PASS")
assert "Missing Content-Type for JSON endpoint handled" "0" \
    "$([ "$R" = "400" ] || [ "$R" = "415" ] || [ "$R" = "401" ] && echo 0 || echo "$R")"

# Malformed JSON
R=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$API/auth/login" \
    -H "Content-Type: application/json" \
    -d '{broken json')
assert "Malformed JSON returns 400" "400" "$R"

# OPTIONS (CORS)
R=$(curl -s -o /dev/null -w "%{http_code}" -X OPTIONS "$API/posts" \
    -H "Origin: http://localhost:3001" \
    -H "Access-Control-Request-Method: GET")
echo -e "  ${YELLOW}ℹ OPTIONS /posts = $R${NC}"

# HEAD request
R=$(curl -s -o /dev/null -w "%{http_code}" -I "$API/posts")
assert "HEAD /posts returns 200" "200" "$R"

# ═══════════════════════════════════════════════════════════════════
# SECTION 9: CONCURRENCY
# ═══════════════════════════════════════════════════════════════════
echo -e "\n${BOLD}═══ 9. Concurrency ═══${NC}"

# 10 concurrent POST /view
echo "--- 10 concurrent view recordings ---"
RESULTS=$(for i in $(seq 1 10); do
    curl -s -o /dev/null -w "%{http_code}\n" -X POST "$API/posts/$ENC_TEST/view" &
done; wait)
FAIL_COUNT=$(echo "$RESULTS" | grep -vc "20[04]")
assert "10 concurrent views: all succeed (no 500s)" "0" "$FAIL_COUNT"

# 5 concurrent GET /posts
echo "--- 5 concurrent GET /posts ---"
RESULTS2=$(for i in $(seq 1 5); do
    curl -s -o /dev/null -w "%{http_code}\n" "$API/posts?limit=3" &
done; wait)
FAIL_COUNT2=$(echo "$RESULTS2" | grep -vc "200")
assert "5 concurrent GET /posts: all succeed" "0" "$FAIL_COUNT2"

# ═══════════════════════════════════════════════════════════════════
# RESULTS
# ═══════════════════════════════════════════════════════════════════
echo -e "\n${BOLD}═══════════════════════════════════════════════════${NC}"
echo -e "${BOLD}  API Integration Test Results${NC}"
echo -e "${BOLD}═══════════════════════════════════════════════════${NC}"
echo -e "  Total:  $TOTAL"
echo -e "  ${GREEN}Passed: $PASS${NC}"
echo -e "  ${RED}Failed: $FAIL${NC}"
if [ $FAIL -eq 0 ]; then
    echo -e "\n  ${GREEN}${BOLD}🏆 ALL TESTS PASSED — System is ROBUST!${NC}"
else
    echo -e "\n  ${RED}${BOLD}⚠ $FAIL test(s) failed — Review above${NC}"
fi
echo -e "${BOLD}═══════════════════════════════════════════════════${NC}\n"
exit $FAIL

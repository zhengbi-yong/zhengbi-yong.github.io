#!/bin/bash
# Comprehensive Backend API Test Script
# Tests all endpoints systematically

BASE_URL="http://0.0.0.0:3000"
API_BASE="$BASE_URL/api/v1"
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "=========================================="
echo "   BACKEND API COMPREHENSIVE TEST"
echo "=========================================="
echo "Base URL: $BASE_URL"
echo ""

# Test helper function
test_endpoint() {
    local name="$1"
    local method="$2"
    local endpoint="$3"
    local expected_status="$4"
    local data="$5"

    TOTAL_TESTS=$((TOTAL_TESTS + 1))

    echo -n "Testing $name... "

    local status_code
    local response

    if [ -n "$data" ]; then
        response=$(curl -s -w "\n%{http_code}" -X "$method" -H "Content-Type: application/json" -d "$data" "$endpoint" 2>/dev/null)
    else
        response=$(curl -s -w "\n%{http_code}" -X "$method" "$endpoint" 2>/dev/null)
    fi

    status_code=$(echo "$response" | tail -n1)

    if [ "$status_code" -eq "$expected_status" ]; then
        echo -e "${GREEN}✓ PASS${NC} (HTTP $status_code)"
        PASSED_TESTS=$((PASSED_TESTS + 1))
        return 0
    else
        echo -e "${RED}✗ FAIL${NC} (Expected $expected_status, got $status_code)"
        FAILED_TESTS=$((FAILED_TESTS + 1))
        echo "Response: $(echo "$response" | head -n -1)"
        return 1
    fi
}

# Test with JWT token
test_auth_endpoint() {
    local name="$1"
    local method="$2"
    local endpoint="$3"
    local expected_status="$4"
    local data="$5"

    TOTAL_TESTS=$((TOTAL_TESTS + 1))

    echo -n "Testing $name (auth)... "

    local status_code
    local response

    if [ -n "$data" ]; then
        response=$(curl -s -w "\n%{http_code}" -X "$method" \
            -H "Content-Type: application/json" \
            -H "Authorization: Bearer $JWT_TOKEN" \
            -d "$data" "$endpoint" 2>/dev/null)
    else
        response=$(curl -s -w "\n%{http_code}" -X "$method" \
            -H "Authorization: Bearer $JWT_TOKEN" \
            "$endpoint" 2>/dev/null)
    fi

    status_code=$(echo "$response" | tail -n1)

    if [ "$status_code" -eq "$expected_status" ]; then
        echo -e "${GREEN}✓ PASS${NC} (HTTP $status_code)"
        PASSED_TESTS=$((PASSED_TESTS + 1))
        return 0
    else
        echo -e "${RED}✗ FAIL${NC} (Expected $expected_status, got $status_code)"
        FAILED_TESTS=$((FAILED_TESTS + 1))
        echo "Response: $(echo "$response" | head -n -1)"
        return 1
    fi
}

# ==================== 1. HEALTH & MONITORING ====================
echo ""
echo -e "${YELLOW}=== 1. HEALTH & MONITORING ===${NC}"

test_endpoint "Health Check" "GET" "$BASE_URL/health" 200
test_endpoint "Detailed Health" "GET" "$BASE_URL/health/detailed" 200
test_endpoint "Readiness Check" "GET" "$BASE_URL/ready" 200
test_endpoint "Metrics" "GET" "$BASE_URL/metrics" 200

# ==================== 2. POSTS (PUBLIC) ====================
echo ""
echo -e "${YELLOW}=== 2. POSTS (PUBLIC) ===${NC}"

test_endpoint "List Posts" "GET" "$API_BASE/posts?page=1&limit=10" 200
test_endpoint "Get Post by ID" "GET" "$API_BASE/posts/id/00000000-0000-0000-0000-000000000001" 404
test_endpoint "Get Post Stats" "GET" "$API_BASE/posts/test-post/stats" 200
test_endpoint "Related Posts" "GET" "$API_BASE/posts/test-post/related" 200
test_endpoint "Record View" "POST" "$API_BASE/posts/test-post/view" 200

# ==================== 3. CATEGORIES (PUBLIC) ====================
echo ""
echo -e "${YELLOW}=== 3. CATEGORIES (PUBLIC) ===${NC}"

test_endpoint "List Categories" "GET" "$API_BASE/categories" 200
test_endpoint "Category Tree" "GET" "$API_BASE/categories/tree" 200
test_endpoint "Get Category" "GET" "$API_BASE/categories/technology" 404

# ==================== 4. TAGS (PUBLIC) ====================
echo ""
echo -e "${YELLOW}=== 4. TAGS (PUBLIC) ===${NC}"

test_endpoint "List Tags" "GET" "$API_BASE/tags" 200
test_endpoint "Popular Tags" "GET" "$API_BASE/tags/popular" 200
test_endpoint "Tag Autocomplete" "GET" "$API_BASE/tags/autocomplete?q=ru" 200
test_endpoint "Get Tag" "GET" "$API_BASE/tags/rust" 404

# ==================== 5. SEARCH (PUBLIC) ====================
echo ""
echo -e "${YELLOW}=== 5. SEARCH (PUBLIC) ===${NC}"

test_endpoint "Search Posts" "GET" "$API_BASE/search?q=test&limit=5" 200
test_endpoint "Search Suggestions" "GET" "$API_BASE/search/suggest?q=rust&limit=5" 200
test_endpoint "Trending Keywords" "GET" "$API_BASE/search/trending" 200

# ==================== 6. AUTHENTICATION ====================
echo ""
echo -e "${YELLOW}=== 6. AUTHENTICATION ===${NC}"

# Register new user
REGISTER_DATA='{
    "email": "testuser@example.com",
    "username": "testuser_api_test",
    "password": "TestPassword123!",
    "password_confirm": "TestPassword123!"
}'
test_endpoint "Register User" "POST" "$API_BASE/auth/register" 201 "$REGISTER_DATA"

# Login
LOGIN_DATA='{
    "email": "testuser@example.com",
    "password": "TestPassword123!"
}'
LOGIN_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST \
    -H "Content-Type: application/json" \
    -d "$LOGIN_DATA" "$API_BASE/auth/login" 2>/dev/null)
LOGIN_STATUS=$(echo "$LOGIN_RESPONSE" | tail -n1)

if [ "$LOGIN_STATUS" -eq "200" ]; then
    JWT_TOKEN=$(echo "$LOGIN_RESPONSE" | head -n -1 | jq -r '.access_token // empty')
    if [ -n "$JWT_TOKEN" ] && [ "$JWT_TOKEN" != "null" ]; then
        echo -e "${GREEN}✓ PASS${NC} Login successful, got JWT token"
        PASSED_TESTS=$((PASSED_TESTS + 1))
        TOTAL_TESTS=$((TOTAL_TESTS + 1))
    else
        echo -e "${RED}✗ FAIL${NC} Login failed to extract token"
        FAILED_TESTS=$((FAILED_TESTS + 1))
        TOTAL_TESTS=$((TOTAL_TESTS + 1))
    fi
else
    echo -e "${RED}✗ FAIL${NC} Login failed (HTTP $LOGIN_STATUS)"
    FAILED_TESTS=$((FAILED_TESTS + 1))
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    JWT_TOKEN=""
fi

# Get current user (requires auth)
test_auth_endpoint "Get Current User" "GET" "$API_BASE/auth/me" 200

# Refresh token (with cookie - simplified test)
test_endpoint "Refresh Token" "POST" "$API_BASE/auth/refresh" 401

# Logout (requires auth)
test_auth_endpoint "Logout" "POST" "$API_BASE/auth/logout" 200

# ==================== 7. POSTS (AUTHENTICATED) ====================
echo ""
echo -e "${YELLOW}=== 7. POSTS (AUTHENTICATED) ===${NC}"

if [ -n "$JWT_TOKEN" ] && [ "$JWT_TOKEN" != "" ] && [ "$JWT_TOKEN" != "null" ]; then
    test_auth_endpoint "Like Post" "POST" "$API_BASE/posts/test-post/like" 200
    test_auth_endpoint "Unlike Post" "DELETE" "$API_BASE/posts/test-post/like" 404

    # Get comments for a post
    test_endpoint "Get Post Comments" "GET" "$API_BASE/posts/test-post/comments" 200
else
    echo -e "${YELLOW}Skipping authenticated post tests (no JWT token)${NC}"
fi

# ==================== 8. COMMENTS (PUBLIC & AUTH) ====================
echo ""
echo -e "${YELLOW}=== 8. COMMENTS ===${NC}"

# Public: list comments (already tested above)
# Authenticated: create comment
if [ -n "$JWT_TOKEN" ] && [ "$JWT_TOKEN" != "" ] && [ "$JWT_TOKEN" != "null" ]; then
    COMMENT_DATA='{
        "content": "This is a test comment",
        "author_name": "Test User",
        "author_email": "test@example.com"
    }'
    test_auth_endpoint "Create Comment" "POST" "$API_BASE/posts/test-post/comments" 400  # Should fail if post doesn't exist

    # Like/unlike comment (will fail without real comment ID)
    test_auth_endpoint "Like Comment" "POST" "$API_BASE/comments/1/like" 404
    test_auth_endpoint "Unlike Comment" "POST" "$API_BASE/comments/1/unlike" 404
else
    echo -e "${YELLOW}Skipping authenticated comment tests (no JWT token)${NC}"
fi

# ==================== 9. ADMIN & PROTECTED ENDPOINTS ====================
echo ""
echo -e "${YELLOW}=== 9. ADMIN & PROTECTED ENDPOINTS ===${NC}"

if [ -n "$JWT_TOKEN" ] && [ "$JWT_TOKEN" != "" ] && [ "$JWT_TOKEN" != "null" ]; then
    # These should fail with 403 or 404 as test user is not admin
    test_auth_endpoint "Get Admin Stats" "GET" "$API_BASE/admin/stats" 403
    test_auth_endpoint "List Users" "GET" "$API_BASE/admin/users" 403
    test_auth_endpoint "List Comments Admin" "GET" "$API_BASE/admin/comments" 403
else
    echo -e "${YELLOW}Skipping admin tests (no JWT token)${NC}"
fi

# ==================== 10. READING PROGRESS (AUTHENTICATED) ====================
echo ""
echo -e "${YELLOW}=== 10. READING PROGRESS ===${NC}"

if [ -n "$JWT_TOKEN" ] && [ "$JWT_TOKEN" != "" ] && [ "$JWT_TOKEN" != "null" ]; then
    PROGRESS_DATA='{
        "progress": 50,
        "scroll_percentage": 0.5
    }'
    test_auth_endpoint "Get Reading Progress" "GET" "$API_BASE/posts/test-post/reading-progress" 404
    test_auth_endpoint "Update Reading Progress" "POST" "$API_BASE/posts/test-post/reading-progress" 400 "$PROGRESS_DATA"
    test_auth_endpoint "Delete Reading Progress" "DELETE" "$API_BASE/posts/test-post/reading-progress" 404
    test_auth_endpoint "Get Reading History" "GET" "$API_BASE/reading-progress/history" 200
else
    echo -e "${YELLOW}Skipping reading progress tests (no JWT token)${NC}"
fi

# ==================== SUMMARY ====================
echo ""
echo "=========================================="
echo "           TEST SUMMARY"
echo "=========================================="
echo -e "Total Tests:   $TOTAL_TESTS"
echo -e "${GREEN}Passed:         $PASSED_TESTS${NC}"
echo -e "${RED}Failed:         $FAILED_TESTS${NC}"

if [ $FAILED_TESTS -eq 0 ]; then
    echo ""
    echo -e "${GREEN}✓ ALL TESTS PASSED!${NC}"
    exit 0
else
    echo ""
    echo -e "${RED}✗ SOME TESTS FAILED${NC}"
    exit 1
fi

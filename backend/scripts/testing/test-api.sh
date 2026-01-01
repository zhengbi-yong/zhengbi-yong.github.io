#!/bin/bash

# Test the Blog API endpoints

API_URL="http://localhost:3000"

echo "=== Testing Blog API ==="
echo "API URL: $API_URL"
echo

# Function to test endpoint
test_endpoint() {
    local endpoint=$1
    local description=$2

    echo "Testing: $description"
    echo "GET $API_URL$endpoint"

    response=$(curl -s -w "\nHTTP Status: %{http_code}\n" "$API_URL$endpoint")

    # Check if response contains JSON (valid response)
    if echo "$response" | grep -q "HTTP Status: 200"; then
        echo "✅ Success"
        echo "$response" | grep -v "HTTP Status:" | jq . 2>/dev/null || echo "$response" | grep -v "HTTP Status:"
    else
        echo "❌ Failed"
        echo "$response"
    fi

    echo "----------------------------------------"
    echo
}

# Check if server is running
echo "Checking if server is running..."
if curl -s "$API_URL/health" > /dev/null 2>&1; then
    echo "✅ Server is running"
    echo
else
    echo "❌ Server is not running"
    echo "Please run: make quick-start"
    exit 1
fi

# Test endpoints
test_endpoint "/" "Root endpoint"
test_endpoint "/health" "Health check"
test_endpoint "/api/v1/status" "API status"
test_endpoint "/api/v1/posts" "List all posts"
test_endpoint "/api/v1/posts/sample-post-1" "Get specific post"
test_endpoint "/api/v1/posts/non-existent" "Get non-existent post (should fail)"

echo "=== Test Summary ==="
echo "If all tests show ✅ Success, your API is working correctly!"
echo
echo "You can now:"
echo "1. Use this API for your frontend development"
echo "2. Connect to the database directly"
echo "3. Extend the API with more endpoints"
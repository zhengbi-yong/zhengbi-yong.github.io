#!/bin/bash
# Export OpenAPI spec from running backend server
# Usage: ./scripts/export_openapi.sh [port]

PORT=${1:-3000}
OUTPUT_FILE="../../frontend/openapi.json"

echo "📝 Fetching OpenAPI spec from http://localhost:${PORT}/api-docs/openapi.json..."

# Check if server is running
if ! curl -s "http://localhost:${PORT}/health" > /dev/null 2>&1; then
    echo "❌ Backend server is not running on port ${PORT}"
    echo "💡 Please start the backend first:"
    echo "   cd backend && cargo run --bin api"
    exit 1
fi

# Fetch the OpenAPI spec
if curl -s "http://localhost:${PORT}/api-docs/openapi.json" -o "$OUTPUT_FILE"; then
    echo "✅ OpenAPI spec exported to: $OUTPUT_FILE"

    # Count and display info
    PATHS=$(jq '.paths | length' "$OUTPUT_FILE")
    SCHEMAS=$(jq '.components.schemas | length' "$OUTPUT_FILE")

    echo "📊 Spec contains:"
    echo "   - $PATHS paths"
    echo "   - $SCHEMAS schemas"
else
    echo "❌ Failed to fetch OpenAPI spec"
    exit 1
fi

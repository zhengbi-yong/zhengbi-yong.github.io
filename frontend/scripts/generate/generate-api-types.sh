#!/usr/bin/env bash
# Generate TypeScript types from the frontend OpenAPI snapshot.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

cd "$PROJECT_ROOT"
node ./scripts/generate/generate-api-types.js

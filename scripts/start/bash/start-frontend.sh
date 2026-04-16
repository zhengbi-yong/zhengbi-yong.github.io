#!/bin/bash
# 启动前端服务器

set -e

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$PROJECT_ROOT/frontend"

echo "=== 启动前端服务器 ==="
echo ""

pnpm dev

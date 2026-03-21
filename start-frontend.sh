#!/bin/bash
# 启动前端服务器

set -e

PROJECT_ROOT="/home/Sisyphus/zhengbi-yong.github.io"
cd "$PROJECT_ROOT/frontend"

echo "=== 启动前端服务器 ==="
echo ""

pnpm dev

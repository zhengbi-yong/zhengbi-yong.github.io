#!/bin/bash
# 启动 Prism Mock Server

set -e

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${BLUE}🚀 Starting Prism Mock Server...${NC}"

# 获取脚本目录
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# OpenAPI 规范路径
OPENAPI_SPEC="$PROJECT_ROOT/openapi.json"

# 检查 OpenAPI 规范是否存在
if [ ! -f "$OPENAPI_SPEC" ]; then
    echo -e "${YELLOW}⚠️  OpenAPI spec not found at: $OPENAPI_SPEC${NC}"
    echo -e "${YELLOW}💡 Run 'cargo run --bin export_openapi' in backend directory first${NC}"
    echo -e "${YELLOW}   Or generate it from the backend using the export_openapi tool${NC}"
    exit 1
fi

echo -e "${BLUE}📄 Using OpenAPI spec: $OPENAPI_SPEC${NC}"

# 启动 Prism
# 使用 pnpm exec 确保使用本地安装的 prism
pnpm exec prism mock "$OPENAPI_SPEC" -p 4010

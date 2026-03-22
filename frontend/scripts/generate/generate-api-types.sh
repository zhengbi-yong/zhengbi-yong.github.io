#!/usr/bin/env bash
# 从 OpenAPI 规范生成 TypeScript 类型

set -euo pipefail

# 颜色定义
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔧 Generating TypeScript types from OpenAPI specification...${NC}"

# 获取脚本所在目录
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

# OpenAPI 规范路径
OPENAPI_SPEC="$PROJECT_ROOT/openapi.json"

# 输出文件路径
OUTPUT_FILE="$PROJECT_ROOT/src/lib/types/openapi-generated.ts"

# 检查 OpenAPI 规范是否存在
if [ ! -f "$OPENAPI_SPEC" ]; then
    echo -e "${YELLOW}⚠️  OpenAPI spec not found at: $OPENAPI_SPEC${NC}"
    echo -e "${YELLOW}💡 Run 'cargo run --bin export_openapi' in backend directory first${NC}"
    exit 1
fi

# 生成类型
echo -e "${BLUE}📝 Reading OpenAPI spec from: $OPENAPI_SPEC${NC}"

(
    cd "$PROJECT_ROOT"
    pnpm exec openapi-typescript "$OPENAPI_SPEC" -o "$OUTPUT_FILE"
)

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ TypeScript types generated successfully!${NC}"
    echo -e "${GREEN}📄 Output: $OUTPUT_FILE${NC}"
    
    # 显示生成的类型数量
    if command -v wc &> /dev/null; then
        LINES=$(wc -l < "$OUTPUT_FILE")
        echo -e "${BLUE}📊 Generated $LINES lines of TypeScript types${NC}"
    fi
    
    echo -e "\n${BLUE}💡 Usage:${NC}"
    echo -e "   import { paths, components, operations } from '@/lib/types/openapi-generated'"
else
    echo -e "${YELLOW}❌ Failed to generate types${NC}"
    exit 1
fi

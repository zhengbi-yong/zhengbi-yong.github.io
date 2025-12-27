#!/bin/bash

echo "🔍 Starting bundle analysis..."

# 确保脚本在错误时退出
set -e

# 构建项目并分析
echo "Building project with bundle analysis..."
ANALYZE=true pnpm build

# 检查 .next/analyze 目录是否存在
if [ -d ".next/analyze" ]; then
    echo "✅ Bundle analysis complete!"
    echo "📊 Open .next/analyze/client.html in your browser to view the report"

    # 获取 bundle 大小信息
    echo ""
    echo "📦 Bundle Summary:"

    # 如果有 .next/static/chunks 目录，显示主要 chunk 的大小
    if [ -d ".next/static/chunks" ]; then
        echo ""
        echo "Main chunks:"
        ls -lh .next/static/chunks/*.js | head -10
    fi

    # 显示页面信息
    if [ -f ".next/build-manifest.json" ]; then
        echo ""
        echo "Pages generated:"
        cat .next/build-manifest.json | jq -r '.pages | keys[]' | head -10
    fi
else
    echo "❌ Bundle analysis failed - no report generated"
    exit 1
fi

# 检查 bundle 是否过大
LARGE_CHUNK_THRESHOLD=100000  # 100KB

echo ""
echo "⚠️  Large chunks check:"
for file in .next/static/chunks/*.js; do
    if [ -f "$file" ]; then
        size=$(stat -f%z "$file" 2>/dev/null || stat -c%s "$file" 2>/dev/null)
        if [ "$size" -gt "$LARGE_CHUNK_THRESHOLD" ]; then
            filename=$(basename "$file")
            size_kb=$((size / 1024))
            echo "  - $filename: ${size_kb}KB (consider splitting)"
        fi
    fi
done

echo ""
echo "✨ Analysis complete!"
#!/bin/bash
# Refine 集成测试脚本

echo "🧪 运行 Refine 集成测试..."
echo ""

# 运行 Data Provider 测试
echo "📦 测试 Data Provider..."
pnpm test tests/lib/providers/refine-data-provider.test.ts --run

# 运行 Auth Provider 测试
echo ""
echo "🔐 测试 Auth Provider..."
pnpm test tests/lib/providers/refine-auth-provider.test.ts --run

# 运行页面组件测试
echo ""
echo "📄 测试页面组件..."
pnpm test tests/app/admin --run

echo ""
echo "✅ 测试完成！"


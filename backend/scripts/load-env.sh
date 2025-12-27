#!/bin/bash
# 加载环境变量脚本
# 从 .env 文件加载环境变量

ENV_FILE="$(dirname "$0")/../.env"

if [ -f "$ENV_FILE" ]; then
    echo "📝 从 .env 文件加载环境变量..."
    
    # 读取 .env 文件并导出环境变量
    set -a
    source "$ENV_FILE"
    set +a
    
    echo "✅ 环境变量加载完成"
else
    echo "⚠️  .env 文件不存在，使用默认值"
    echo "   请复制 .env.example 到 .env 并配置"
fi


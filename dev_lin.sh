#!/usr/bin/env zsh
# 设置环境变量
export NODE_OPTIONS="--no-warnings"
export CHOKIDAR_USEPOLLING="true"

# 确保 PATH 包含 Node.js 的 bin 目录
node_bin_path="/home/sisyphus/.nvm/versions/node/v24.11.1/bin"
if [[ ":$PATH:" != *":$node_bin_path:"* ]]; then
    export PATH="$node_bin_path:$PATH"
fi

# 启用 corepack
corepack enable >/dev/null 2>&1

# 检查并安装依赖
if [ ! -d "node_modules" ]; then
    echo "\n📋 正在安装依赖..."
    pnpm install
fi

# 生成 Contentlayer 文件
echo "\n📋 生成 Contentlayer 文件..."
npx contentlayer2 build

# 启动开发服务器
echo "\n📋 启动开发服务器...\n"
pnpm dev

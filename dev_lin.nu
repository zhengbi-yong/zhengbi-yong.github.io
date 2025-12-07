# 设置环境变量
$env.NODE_OPTIONS = "--no-warnings"
$env.CHOKIDAR_USEPOLLING = "true"

# 确保 PATH 包含 Node.js 的 bin 目录
let node_bin_path = "/home/sisyphus/.nvm/versions/node/v24.11.1/bin"
if not ($env.PATH | any {|p| $p == $node_bin_path}) {
    $env.PATH = ($env.PATH | prepend $node_bin_path)
}

# 启用 corepack
^corepack enable | ignore

# 检查并安装依赖
if not ("node_modules" | path exists) {
    print "\n📋 正在安装依赖..."
    ^pnpm install
}

# 生成 Contentlayer 文件
print "\n📋 生成 Contentlayer 文件..."
^npx contentlayer2 build

# 启动开发服务器
print "\n📋 启动开发服务器...\n"
^pnpm dev

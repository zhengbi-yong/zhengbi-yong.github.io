# 获取脚本所在目录和项目根目录
# 使用兼容方式：检查当前目录结构来确定项目根目录
let current_dir = $env.PWD
let project_root = (if (($current_dir | path join "frontend" | path exists) or ($current_dir | path join "scripts" | path exists)) {
    # 如果当前目录有 frontend 或 scripts 目录，说明当前目录就是项目根目录
    $current_dir
} else {
    # 否则，假设脚本在 scripts/ 目录下，项目根目录是父目录
    ($current_dir | path dirname)
})
let frontend_dir = ($project_root | path join "frontend")

# 设置环境变量
$env.NODE_OPTIONS = "--no-warnings"
$env.CHOKIDAR_USEPOLLING = "true"

# 确保 PATH 包含 Node.js 的 bin 目录
let node_bin_path = "/home/sisyphus/.nvm/versions/node/v24.11.1/bin"
if not ($env.PATH | any {|p| $p == $node_bin_path}) {
    $env.PATH = ($env.PATH | prepend $node_bin_path)
}

# 切换到前端目录
print $"\n📋 切换到前端目录: ($frontend_dir)"
cd $frontend_dir

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

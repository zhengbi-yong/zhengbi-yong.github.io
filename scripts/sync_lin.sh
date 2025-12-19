#!/usr/bin/env zsh
# ============================================
# 博客部署脚本 - zsh 版本
# 功能：代码检查 -> 构建 -> 同步到远程服务器
# ============================================

# 辅助函数：输出步骤信息
write-step() {
    echo "\n\033[36m[步骤] $1\033[0m"
}

# 辅助函数：输出成功信息
write-success() {
    echo "\033[32m[成功] $1\033[0m"
}

# 辅助函数：输出错误信息
write-error-msg() {
    echo "\033[31m[错误] $1\033[0m"
}

# 辅助函数：输出警告信息
write-warning-msg() {
    echo "\033[33m[警告] $1\033[0m"
}

# 确保 PATH 包含 Node.js 的 bin 目录（Ubuntu/Linux 版本）
node_bin_path="/home/sisyphus/.nvm/versions/node/v24.11.1/bin"
if [[ ":$PATH:" != *":$node_bin_path:"* ]]; then
    export PATH="$node_bin_path:$PATH"
fi

# 配置变量
source_folder="$(pwd)/out"

# 从环境变量读取配置（如果存在），否则使用默认值
# 使用系统默认的 SSH 配置（假设已配置 SSH 密钥认证）
remote_user="${DEPLOY_REMOTE_USER:-ubuntu}"
remote_ip="${DEPLOY_REMOTE_IP:-152.136.43.194}"
remote_port="${DEPLOY_REMOTE_PORT:-22}"
remote_path="${DEPLOY_REMOTE_PATH:-/home/ubuntu/PersonalBlog/out/}"

# 强制覆盖选项：如果设置为 true，将忽略时间戳和内容比较，强制传输所有文件
# 如果网站没有更新，可以尝试将此选项设置为 true
force_overwrite=false

# 检查必需的工具（Ubuntu/Linux 版本）
write-step "检查必需的工具..."

# 检查必需的工具（只使用 SSH 密钥认证，不需要 sshpass）
required_tools=("pnpm" "corepack" "rsync" "ssh")

for tool in "${required_tools[@]}"; do
    if ! command -v "$tool" >/dev/null 2>&1; then
        write-error-msg "$tool 未找到，请确保已安装 Node.js 和 pnpm"
        exit 1
    fi
done

write-success "所有必需的工具都已找到"

# 步骤 1: 代码检查（带超时，避免卡住）
write-step "步骤 1/4: 运行代码检查 (pnpm lint)"

if timeout 30 pnpm lint 2>&1; then
    write-success "代码检查通过"
else
    lint_exit_code=$?
    if [ $lint_exit_code -eq 124 ]; then
        write-warning-msg "代码检查超时，跳过检查继续执行..."
    else
        write-warning-msg "代码检查发现问题，但继续执行..."
    fi
fi

# 步骤 2: 构建项目
write-step "步骤 2/4: 构建项目 (pnpm build)"

# 设置环境变量
corepack enable
export EXPORT="1"
# 静态导出模式下必须设置 UNOPTIMIZED=1，否则 Next.js Image 组件无法正确处理图片路径
# 注意：静态导出模式下 Next.js 图片优化器不可用，必须禁用优化
export UNOPTIMIZED="1"

# 生产环境优化配置
export NODE_ENV="production"
export NEXT_TELEMETRY_DISABLED="1"  # 禁用遥测以加快构建速度

echo "环境变量设置:"
echo "  EXPORT = $EXPORT"
echo "  UNOPTIMIZED = $UNOPTIMIZED"
echo "  NODE_ENV = $NODE_ENV"
echo "  NEXT_TELEMETRY_DISABLED = $NEXT_TELEMETRY_DISABLED"
echo "\033[32m  静态导出模式: 已启用（UNOPTIMIZED=1，图片优化已禁用）\033[0m"

echo "开始构建..."
if pnpm build; then
    write-success "构建完成"
else
    build_exit_code=$?
    write-error-msg "构建失败！退出代码: $build_exit_code"
    exit 1
fi

# 步骤 3: 验证构建结果
write-step "步骤 3/4: 验证构建结果"

if [ ! -d "$source_folder" ]; then
    write-error-msg "构建输出目录不存在: $source_folder"
    echo "\033[33m请检查构建是否成功完成\033[0m"
    exit 1
fi

# 检查目录是否为空
file_count=$(find "$source_folder" -mindepth 1 -maxdepth 1 2>/dev/null | wc -l)
if [ "$file_count" -eq 0 ]; then
    write-error-msg "构建输出目录为空: $source_folder"
    echo "\033[33m请检查构建配置和日志\033[0m"
    exit 1
fi

write-success "构建验证通过 (找到 $file_count 个文件)"

# 检查关键文件
key_files=("index.html" "_next")
missing_files=()

for file in "${key_files[@]}"; do
    file_path="$source_folder/$file"
    if [ ! -e "$file_path" ]; then
        missing_files+=("$file")
    fi
done

if [ ${#missing_files[@]} -gt 0 ]; then
    missing_str=$(IFS=', '; echo "${missing_files[*]}")
    write-warning-msg "缺少关键文件: $missing_str"
    echo "\033[33m构建可能不完整，但继续执行同步...\033[0m"
else
    write-success "关键文件检查通过"
fi

# 步骤 4: 同步到远程服务器
write-step "步骤 4/4: 同步到远程服务器"

# 确保源路径末尾有 /，这样 rsync 会同步目录内容而不是目录本身
if [[ "$source_folder" != */ ]]; then
    rsync_source="$source_folder/"
else
    rsync_source="$source_folder"
fi

echo "源路径: $rsync_source"

# 检查 SSH 连接（可选，但有助于调试）
echo "测试 SSH 连接..."
if ssh -p "$remote_port" -o ConnectTimeout=5 -o StrictHostKeyChecking=no "$remote_user@$remote_ip" "echo 'SSH connection test'" >/dev/null 2>&1; then
    write-success "SSH 连接测试成功"
else
    write-warning-msg "SSH 连接测试失败，但继续执行同步..."
fi

# 执行 rsync 同步
echo "开始同步文件..."
echo "  源: $rsync_source"
echo "  目标: $remote_user@$remote_ip:$remote_path"

# rsync 参数说明：
# -a: archive 模式（保留权限、符号链接等，但不保留时间戳）
# -v: verbose（详细输出）
# -z: 压缩传输
# -P: 显示进度并支持断点续传
# --delete: 删除目标目录中源目录不存在的文件
# --checksum: 基于文件内容而不是时间戳和大小比较（强制检查文件是否真的相同）
# --ignore-times: 忽略时间戳，总是传输文件（强制覆盖模式）
# --stats: 显示统计信息
# 注意：移除了 -t 参数（保留时间戳），因为这会阻止文件覆盖

# 构建 rsync 参数
rsync_args=("-avzP" "--delete" "--stats" "--verbose")

# 根据强制覆盖选项选择不同的比较方式
if [ "$force_overwrite" = true ]; then
    write-warning-msg "使用强制覆盖模式（--ignore-times），将传输所有文件"
    rsync_args+=("--ignore-times")
else
    echo "使用内容比较模式（--checksum），只传输有变化的文件"
    rsync_args+=("--checksum")
fi

# 添加 SSH 命令和路径参数（Ubuntu/Linux 版本）
# 使用系统默认的 SSH 配置
ssh_command="ssh -p $remote_port -o StrictHostKeyChecking=no"

echo "执行 rsync 命令..."

# 执行 rsync 命令（Ubuntu/Linux 版本）
rsync_target="$remote_user@$remote_ip:$remote_path"

echo "执行命令: rsync ${rsync_args[*]} -e \"$ssh_command\" $rsync_source $rsync_target"

# 执行 rsync 命令并捕获输出
rsync_output=$(rsync "${rsync_args[@]}" -e "$ssh_command" "$rsync_source" "$rsync_target" 2>&1)
rsync_exit_code=$?

# 显示完整的 rsync 输出（用于调试）
echo "\nrsync 完整输出:"
echo "$rsync_output"

if [ $rsync_exit_code -ne 0 ]; then
    write-error-msg "rsync 同步失败！退出代码: $rsync_exit_code"
    echo "\n\033[33m请检查:\033[0m"
    echo "\033[33m  1. SSH 连接是否正常\033[0m"
    echo "\033[33m  2. 远程目录权限是否正确\033[0m"
    echo "\033[33m  3. 远程路径是否存在\033[0m"
    exit 1
fi

write-success "文件同步完成"

# 显示同步统计信息
stats_patterns=("Number of files" "Total file size" "sent" "received" "Total transferred")
stats_lines=$(echo "$rsync_output" | grep -E "$(IFS='|'; echo "${stats_patterns[*]}")" || true)

if [ -n "$stats_lines" ]; then
    echo "\n同步统计:"
    echo "$stats_lines"
fi

# 检查是否有文件被传输
files_transferred_line=$(echo "$rsync_output" | grep "Number of regular files transferred:" || true)

if [ -n "$files_transferred_line" ]; then
    file_count=$(echo "$files_transferred_line" | grep -oE '[0-9]+' | head -1)
    if [ -z "$file_count" ] || [ "$file_count" -eq 0 ]; then
        write-warning-msg "没有文件被传输！这可能意味着："
        echo "\033[33m  - 所有文件已经是最新的（基于内容比较）\033[0m"
        echo "\033[33m  - 或者文件路径不正确\033[0m"
        echo "\n\033[33m建议：如果网站没有更新，尝试使用 --ignore-times 参数强制传输所有文件\033[0m"
    else
        write-success "已传输 $file_count 个文件"
    fi
fi

# 验证同步结果（可选）
echo "\n验证同步结果..."
verify_command="test -d $remote_path && echo 'Directory exists' || echo 'Directory not found'"
verify_output=$(ssh -p "$remote_port" -o StrictHostKeyChecking=no "$remote_user@$remote_ip" "$verify_command" 2>&1)

if echo "$verify_output" | grep -q "Directory exists"; then
    write-success "远程目录验证通过"
else
    write-warning-msg "远程目录验证失败，但文件可能已同步"
fi

# 验证关键目录和文件是否存在
echo "\n验证关键资源文件..."
key_dirs=("assets" "static" "_next")
for dir in "${key_dirs[@]}"; do
    check_command="test -d ${remote_path}${dir} && echo 'exists' || echo 'missing'"
    check_output=$(ssh -p "$remote_port" -o StrictHostKeyChecking=no "$remote_user@$remote_ip" "$check_command" 2>&1)
    
    if echo "$check_output" | grep -q "exists"; then
        write-success "目录 $dir 存在"
    else
        write-warning-msg "目录 $dir 不存在或无法访问"
    fi
done

# 检查图片文件数量
# 使用字符串拼接来避免转义问题
image_count_command="find ${remote_path}assets ${remote_path}static -type f \\( -iname '*.jpg' -o -iname '*.png' -o -iname '*.webp' -o -iname '*.svg' -o -iname '*.gif' \\) 2>/dev/null | wc -l"
image_count_output=$(ssh -p "$remote_port" -o StrictHostKeyChecking=no "$remote_user@$remote_ip" "$image_count_command" 2>&1)

trimmed_count=$(echo "$image_count_output" | tr -d '[:space:]')
if [ -n "$trimmed_count" ] && [ "$trimmed_count" -gt 0 ] 2>/dev/null; then
    write-success "找到 $trimmed_count 个图片文件"
else
    write-warning-msg "未找到图片文件，这可能是问题所在！"
fi

# 完成
echo ""
write-success "============================================"
write-success "部署完成！"
write-success "============================================"
echo "\n\033[33m网站应该已经更新。如果网站没有更新，请检查:\033[0m"
echo "\033[33m  1. 远程服务器的 Web 服务器配置\033[0m"
echo "\033[33m  2. 远程目录权限是否正确\033[0m"
echo "\033[33m  3. Web 服务器是否已重启或重新加载配置\033[0m"
echo "\033[33m  4. 浏览器缓存（尝试强制刷新 Ctrl+F5）\033[0m"
echo "\033[33m  5. 如果仍然没有更新，尝试将脚本中的 force_overwrite = false 改为 force_overwrite = true\033[0m"

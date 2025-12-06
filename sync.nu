# ============================================
# 博客部署脚本 - Nushell 版本
# 功能：代码检查 -> 构建 -> 同步到远程服务器
# ============================================

# 辅助函数：输出步骤信息
def write-step [message: string] {
    print $"\n(ansi cyan)[步骤] ($message)(ansi reset)"
}

# 辅助函数：输出成功信息
def write-success [message: string] {
    print $"(ansi green)[成功] ($message)(ansi reset)"
}

# 辅助函数：输出错误信息
def write-error-msg [message: string] {
    print $"(ansi red)[错误] ($message)(ansi reset)"
}

# 辅助函数：输出警告信息
def write-warning-msg [message: string] {
    print $"(ansi yellow)[警告] ($message)(ansi reset)"
}

# 配置变量
let source_folder = ("out" | path expand)
let remote_user = "ubuntu"
let remote_ip = "152.136.43.194"
let remote_port = 22
let remote_path = "/home/ubuntu/PersonalBlog/out/"

# 强制覆盖选项：如果设置为 true，将忽略时间戳和内容比较，强制传输所有文件
# 如果网站没有更新，可以尝试将此选项设置为 true
let force_overwrite = false

# 检查必需的工具
write-step "检查必需的工具..."

let required_tools = [
    {name: "pnpm", path: "pnpm", is_command: true},
    {name: "corepack", path: "corepack", is_command: true},
    {name: "cygpath", path: "C:\\cygwin64\\bin\\cygpath.exe", is_command: false},
    {name: "rsync", path: "C:\\cygwin64\\bin\\rsync.exe", is_command: false},
    {name: "sshpass", path: "C:\\cygwin64\\bin\\sshpass.exe", is_command: false},
    {name: "ssh", path: "C:\\cygwin64\\bin\\ssh.exe", is_command: false}
]

for $tool in $required_tools {
    if $tool.is_command {
        # which 是内置命令，返回命令路径列表
        let command_paths = (which $tool.name)
        if ($command_paths | length) == 0 {
            write-error-msg $"($tool.name) 未找到，请确保已安装 Node.js 和 pnpm"
            exit 1
        }
    } else {
        if not ($tool.path | path exists) {
            write-error-msg $"($tool.name) 未找到: ($tool.path)"
            exit 1
        }
    }
}

write-success "所有必需的工具都已找到"

# 步骤 1: 代码检查
# 注意：Next.js 16 的 lint 命令不支持 --fix 选项
# 如需自动修复，可手动运行: npx eslint --fix
write-step "步骤 1/4: 运行代码检查 (pnpm lint)"

try {
    let lint_result = (^pnpm lint | complete)
    if $lint_result.exit_code != 0 {
        write-warning-msg "代码检查发现一些问题，但继续执行..."
        if ($lint_result.stdout | describe | str contains "list") {
            print ($lint_result.stdout | str join "")
        } else {
            print ($lint_result.stdout | into string)
        }
        if ($lint_result.stderr | describe | str contains "list") {
            print ($lint_result.stderr | str join "")
        } else {
            print ($lint_result.stderr | into string)
        }
    } else {
        write-success "代码检查通过"
    }
} catch {
    write-error-msg $"代码检查失败: ($in)"
    exit 1
}

# 步骤 2: 构建项目
write-step "步骤 2/4: 构建项目 (pnpm build)"

# 设置环境变量
^corepack enable
# 注意：PWD 在 nushell 中是自动管理的，不需要手动设置
$env.EXPORT = "1"
# 静态导出模式下必须设置 UNOPTIMIZED=1，否则 Next.js Image 组件无法正确处理图片路径
# 注意：静态导出模式下 Next.js 图片优化器不可用，必须禁用优化
$env.UNOPTIMIZED = "1"

# 生产环境优化配置
$env.NODE_ENV = "production"
$env.NEXT_TELEMETRY_DISABLED = "1"  # 禁用遥测以加快构建速度

print "环境变量设置:"
print $"  EXPORT = ($env.EXPORT)"
print $"  UNOPTIMIZED = ($env.UNOPTIMIZED)"
print $"  NODE_ENV = ($env.NODE_ENV)"
print $"  NEXT_TELEMETRY_DISABLED = ($env.NEXT_TELEMETRY_DISABLED)"
print $"(ansi green)  静态导出模式: 已启用（UNOPTIMIZED=1，图片优化已禁用）(ansi reset)"

try {
    print "开始构建..."
    let build_result = (^pnpm build | complete)
    
    # 检查构建是否成功
    if $build_result.exit_code != 0 {
        write-error-msg $"构建失败！退出代码: ($build_result.exit_code)"
        if ($build_result.stdout | describe | str contains "list") {
            print ($build_result.stdout | str join "")
        } else {
            print ($build_result.stdout | into string)
        }
        if ($build_result.stderr | describe | str contains "list") {
            print ($build_result.stderr | str join "")
        } else {
            print ($build_result.stderr | into string)
        }
        exit 1
    }
    
    write-success "构建完成"
} catch {
    write-error-msg $"构建过程出错: ($in)"
    exit 1
}

# 步骤 3: 验证构建结果
write-step "步骤 3/4: 验证构建结果"

if not ($source_folder | path exists) {
    write-error-msg $"构建输出目录不存在: ($source_folder)"
    print $"(ansi yellow)请检查构建是否成功完成(ansi reset)"
    exit 1
}

# 检查目录是否为空
# 使用 ls 命令检查目录内容
# 注意：这里只检查顶层文件，因为递归检查在 nushell 中比较复杂
# 如果目录存在且有内容，通常表示构建成功
let dir_items = (ls -a $source_folder)
let file_count = ($dir_items | length)
if $file_count == 0 {
    write-error-msg $"构建输出目录为空: ($source_folder)"
    print $"(ansi yellow)请检查构建配置和日志(ansi reset)"
    exit 1
}

let success_msg = "构建验证通过 (找到 " + ($file_count | into string) + " 个文件)"
write-success $success_msg

# 检查关键文件
let key_files = ["index.html", "_next"]
mut missing_files = []

for $file in $key_files {
    let file_path = ($source_folder | path join $file)
    if not ($file_path | path exists) {
        $missing_files = ($missing_files | append $file)
    }
}

if ($missing_files | length) > 0 {
    let missing_str = ($missing_files | str join ", ")
    write-warning-msg $"缺少关键文件: ($missing_str)"
    print $"(ansi yellow)构建可能不完整，但继续执行同步...(ansi reset)"
} else {
    write-success "关键文件检查通过"
}

# 步骤 4: 同步到远程服务器
write-step "步骤 4/4: 同步到远程服务器"

# 转换路径为 Cygwin 格式
let cygwin_source = (try {
    let cygwin_source_output = (^C:\cygwin64\bin\cygpath.exe -u $source_folder | complete)
    let result = ($cygwin_source_output.stdout | into string | str trim)
    # 确保源路径末尾有 /，这样 rsync 会同步目录内容而不是目录本身
    if not ($result | str ends-with "/") {
        $result + "/"
    } else {
        $result
    }
} catch {
    write-error-msg $"路径转换失败: ($in)"
    exit 1
})

print ("源路径 (Windows): " + $source_folder)
print ("源路径 (Cygwin): " + $cygwin_source)

# 检查 SSH 连接（可选，但有助于调试）
print "测试 SSH 连接..."
try {
    let ssh_test = (^C:\cygwin64\bin\sshpass.exe -p 'YzBxxM2000818.P' C:\cygwin64\bin\ssh.exe -p $remote_port -o ConnectTimeout=5 -o StrictHostKeyChecking=no -o UserKnownHostsFile=/cygdrive/c/Users/Sisyphus/.ssh/known_hosts $"($remote_user)@($remote_ip)" "echo 'SSH connection test'" | complete)
    if $ssh_test.exit_code == 0 {
        write-success "SSH 连接测试成功"
    } else {
        write-warning-msg "SSH 连接测试失败，但继续执行同步..."
        if ($ssh_test.stdout | describe | str contains "list") {
            print ($ssh_test.stdout | str join "")
        } else {
            print ($ssh_test.stdout | into string)
        }
        if ($ssh_test.stderr | describe | str contains "list") {
            print ($ssh_test.stderr | str join "")
        } else {
            print ($ssh_test.stderr | into string)
        }
    }
} catch {
    write-warning-msg $"SSH 连接测试出错，但继续执行同步: ($in)"
}

# 执行 rsync 同步
print "开始同步文件..."
print $"  源: ($cygwin_source)"
print $"  目标: ($remote_user)@($remote_ip):($remote_path)"

try {
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
    
    # 构建 rsync 参数数组
    mut rsync_args = [
        "-avzP",
        "--delete",
        "--stats",
        "--verbose"
    ]
    
    # 根据强制覆盖选项选择不同的比较方式
    if $force_overwrite {
        write-warning-msg "使用强制覆盖模式（--ignore-times），将传输所有文件"
        $rsync_args = ($rsync_args | append "--ignore-times")
    } else {
        print "使用内容比较模式（--checksum），只传输有变化的文件"
        $rsync_args = ($rsync_args | append "--checksum")
    }
    
    # 添加 SSH 命令和路径参数
    # 注意：-e 选项的参数需要被引号包裹，因为它包含空格
    let ssh_command = $"C:\\cygwin64\\bin\\sshpass.exe -p 'YzBxxM2000818.P' C:\\cygwin64\\bin\\ssh.exe -p ($remote_port | into string) -o UserKnownHostsFile=/cygdrive/c/Users/Sisyphus/.ssh/known_hosts"
    
    print "执行 rsync 命令..."
    
    # 执行 rsync 命令
    # 使用 PowerShell 来执行，因为它可以更好地处理参数和引号
    let rsync_cmd = "C:\\cygwin64\\bin\\rsync.exe"
    
    # 构建参数部分
    let base_args_str = ($rsync_args | str join " ")
    
    # 构建完整的命令字符串
    # 添加 -e 选项和路径参数
    let base_args_str = ($rsync_args | str join " ")
    let full_cmd_str = $base_args_str + " -e \"" + $ssh_command + "\" " + $cygwin_source + " " + $remote_user + "@" + $remote_ip + ":" + $remote_path
    
    print $"完整命令: ($rsync_cmd) ($full_cmd_str)"
    
    # 使用完整路径的 PowerShell 执行命令
    # PowerShell 可以更好地处理参数和引号
    let ps_cmd = $"& '($rsync_cmd)' ($base_args_str) -e \"($ssh_command)\" ($cygwin_source) ($remote_user)@($remote_ip):($remote_path)"
    let ps_exe = "C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe"
    let rsync_output = (^$ps_exe -Command $ps_cmd | complete)
    
    # 显示完整的 rsync 输出（用于调试）
    print "\nrsync 完整输出:"
    if ($rsync_output.stdout | describe | str contains "list") {
        print ($rsync_output.stdout | str join "")
    } else {
        print ($rsync_output.stdout | into string)
    }
    if ($rsync_output.stderr | describe | str contains "list") {
        print ($rsync_output.stderr | str join "")
    } else {
        print ($rsync_output.stderr | into string)
    }
    
    if $rsync_output.exit_code != 0 {
        write-error-msg $"rsync 同步失败！退出代码: ($rsync_output.exit_code)"
        print "\n(ansi yellow)请检查:(ansi reset)"
        print $"(ansi yellow)  1. SSH 连接是否正常(ansi reset)"
        print $"(ansi yellow)  2. 远程目录权限是否正确(ansi reset)"
        print $"(ansi yellow)  3. 远程路径是否存在(ansi reset)"
        exit 1
    }
    
    write-success "文件同步完成"
    
    # 显示同步统计信息
    let output_text = (if ($rsync_output.stdout | describe | str contains "list") {
        $rsync_output.stdout | str join ""
    } else {
        $rsync_output.stdout | into string
    })
    
    let stats_patterns = ["Number of files", "Total file size", "sent", "received", "Total transferred"]
    let stats_lines = ($output_text | split row (char nl) | where {|line|
        $stats_patterns | any {|pattern| $line | str contains $pattern}
    })
    
    if ($stats_lines | length) > 0 {
        print "\n同步统计:"
        for $line in $stats_lines {
            print $line
        }
    }
    
    # 检查是否有文件被传输
    let files_transferred_lines = ($output_text | split row (char nl) | where {|line|
        $line | str contains "Number of regular files transferred:"
    })
    
    if ($files_transferred_lines | length) > 0 {
        let files_transferred_line = ($files_transferred_lines | first)
        # 提取数字
        let file_count_match = ($files_transferred_line | parse -r 'Number of regular files transferred: (\d+)')
        if ($file_count_match | length) > 0 {
            let file_count = ($file_count_match | get 0 | get capture0 | into int)
            if $file_count == 0 {
                write-warning-msg "没有文件被传输！这可能意味着："
                print $"(ansi yellow)  - 所有文件已经是最新的（基于内容比较）(ansi reset)"
                print $"(ansi yellow)  - 或者文件路径不正确(ansi reset)"
                print $"\n(ansi yellow)建议：如果网站没有更新，尝试使用 --ignore-times 参数强制传输所有文件(ansi reset)"
            } else {
                write-success $"已传输 ($file_count | into string) 个文件"
            }
        }
    }
    
} catch {
    write-error-msg $"rsync 执行出错: ($in)"
    exit 1
}

# 验证同步结果（可选）
print "\n验证同步结果..."
try {
    let verify_command = $"test -d ($remote_path) && echo 'Directory exists' || echo 'Directory not found'"
    let verify_result = (^C:\cygwin64\bin\sshpass.exe -p 'YzBxxM2000818.P' C:\cygwin64\bin\ssh.exe -p $remote_port -o UserKnownHostsFile=/cygdrive/c/Users/Sisyphus/.ssh/known_hosts $"($remote_user)@($remote_ip)" $verify_command | complete)
    
    let verify_output = (if ($verify_result.stdout | describe | str contains "list") {
        $verify_result.stdout | str join ""
    } else {
        $verify_result.stdout | into string
    })
    
    if ($verify_output | str contains "Directory exists") {
        write-success "远程目录验证通过"
    } else {
        write-warning-msg "远程目录验证失败，但文件可能已同步"
    }
    
    # 验证关键目录和文件是否存在
    print "\n验证关键资源文件..."
    let key_dirs = ["assets", "static", "_next"]
    for $dir in $key_dirs {
        let check_command = $"test -d ($remote_path)($dir) && echo 'exists' || echo 'missing'"
        let check_result = (^C:\cygwin64\bin\sshpass.exe -p 'YzBxxM2000818.P' C:\cygwin64\bin\ssh.exe -p $remote_port -o UserKnownHostsFile=/cygdrive/c/Users/Sisyphus/.ssh/known_hosts $"($remote_user)@($remote_ip)" $check_command | complete)
        
        let check_output = (if ($check_result.stdout | describe | str contains "list") {
            $check_result.stdout | str join ""
        } else {
            $check_result.stdout | into string
        })
        
        if ($check_output | str contains "exists") {
            write-success $"目录 ($dir) 存在"
        } else {
            write-warning-msg $"目录 ($dir) 不存在或无法访问"
        }
    }
    
    # 检查图片文件数量
    # 使用字符串拼接来避免转义问题
    let image_count_command = "find " + $remote_path + "assets " + $remote_path + "static -type f \\( -iname '*.jpg' -o -iname '*.png' -o -iname '*.webp' -o -iname '*.svg' -o -iname '*.gif' \\) 2>/dev/null | wc -l"
    let image_count_result = (^C:\cygwin64\bin\sshpass.exe -p 'YzBxxM2000818.P' C:\cygwin64\bin\ssh.exe -p $remote_port -o UserKnownHostsFile=/cygdrive/c/Users/Sisyphus/.ssh/known_hosts $"($remote_user)@($remote_ip)" $image_count_command | complete)
    
    let image_count_output = (if ($image_count_result.stdout | describe | str contains "list") {
        $image_count_result.stdout | str join ""
    } else {
        $image_count_result.stdout | into string
    })
    
    let trimmed_count = ($image_count_output | str trim)
    if ($trimmed_count | str length) > 0 {
        let count = (try {
            $trimmed_count | into int
        } catch {
            0
        })
        if $count > 0 {
            write-success $"找到 ($count | into string) 个图片文件"
        } else {
            write-warning-msg "未找到图片文件，这可能是问题所在！"
        }
    }
} catch {
    write-warning-msg $"无法验证远程目录: ($in)"
}

# 完成
print ""
write-success "============================================"
write-success "部署完成！"
write-success "============================================"
print "\n(ansi yellow)网站应该已经更新。如果网站没有更新，请检查:(ansi reset)"
print $"(ansi yellow)  1. 远程服务器的 Web 服务器配置(ansi reset)"
print $"(ansi yellow)  2. 远程目录权限是否正确(ansi reset)"
print $"(ansi yellow)  3. Web 服务器是否已重启或重新加载配置(ansi reset)"
print $"(ansi yellow)  4. 浏览器缓存（尝试强制刷新 Ctrl+F5）(ansi reset)"
print $"(ansi yellow)  5. 如果仍然没有更新，尝试将脚本中的 force_overwrite = false 改为 force_overwrite = true(ansi reset)"


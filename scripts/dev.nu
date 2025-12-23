# 设置 UTF-8 编码（nushell 默认支持 UTF-8）
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
# 注意：PWD 在 nushell 中是自动管理的，不需要手动设置
$env.NODE_OPTIONS = "--no-warnings"
$env.CHOKIDAR_USEPOLLING = "true"

# 辅助函数：输出错误信息
def write-error-msg [message: string] {
    print $"(ansi red)❌ 错误: ($message)(ansi reset)"
}

# 辅助函数：输出成功信息
def write-success [message: string] {
    print $"(ansi green)✅ ($message)(ansi reset)"
}

# 辅助函数：输出步骤信息
def write-step [message: string] {
    print $"\n(ansi cyan)📋 ($message)(ansi reset)"
}

# 切换到前端目录
write-step $"切换到前端目录: ($frontend_dir)"
cd $frontend_dir

# 启用 corepack
^corepack enable

# 步骤 1: 运行 contentlayer 生成文章文件
write-step "步骤 1/2: 生成 Contentlayer 文件"
print "正在运行 pnpm contentlayer..."

try {
    # 运行 contentlayer，捕获输出
    let contentlayer_output = (^pnpm contentlayer | complete)
    
    # 检查退出码
    if $contentlayer_output.exit_code != 0 {
        write-error-msg $"Contentlayer 生成失败！退出代码: ($contentlayer_output.exit_code)"
        if ($contentlayer_output.stdout | str length) > 0 {
            print $contentlayer_output.stdout
        }
        if ($contentlayer_output.stderr | str length) > 0 {
            print $contentlayer_output.stderr
        }
        print $"\n(ansi yellow)请检查:(ansi reset)"
        print $"(ansi yellow)  1. 文章文件的 frontmatter 格式是否正确(ansi reset)"
        print $"(ansi yellow)  2. 是否有 YAML 解析错误(ansi reset)"
        print $"(ansi yellow)  3. 文章文件路径是否符合配置 (data/blog/**/*.mdx)(ansi reset)"
        exit 1
    }
    
    # 合并 stdout 和 stderr 用于检查
    # complete 返回的 stdout/stderr 通常是字符串列表
    let stdout_str = (if ($contentlayer_output.stdout | describe | str contains "list") {
        $contentlayer_output.stdout | str join ""
    } else {
        $contentlayer_output.stdout | into string
    })
    let stderr_str = (if ($contentlayer_output.stderr | describe | str contains "list") {
        $contentlayer_output.stderr | str join ""
    } else {
        $contentlayer_output.stderr | into string
    })
    let output_string = ($stdout_str + $stderr_str)
    
    # 检查输出中是否有错误或警告
    let error_patterns = ["failed with", "Error:", "ERROR", "YAMLParseError", "Invalid markdown"]
    let has_error = ($error_patterns | any {|pattern| $output_string | str contains $pattern})
    if $has_error {
        write-error-msg "Contentlayer 生成过程中发现错误！"
        print $output_string
        print $"\n(ansi yellow)请修复上述错误后重试(ansi reset)"
        exit 1
    }
    
    # 检查是否有 "Skipping documents" 警告
    let warning_patterns = ["Skipping documents", "problems in"]
    let has_warning = ($warning_patterns | any {|pattern| $output_string | str contains $pattern})
    if $has_warning {
        write-error-msg "Contentlayer 发现文档问题，部分文件被跳过！"
        print $output_string
        print $"\n(ansi yellow)请修复上述问题后重试(ansi reset)"
        exit 1
    }
    
    write-success "Contentlayer 命令执行完成"
    
    # 显示 contentlayer 的输出（如果有）
    let trimmed_output = ($output_string | str trim)
    if ($trimmed_output | str length) > 0 {
        print $trimmed_output
    }
} catch {
    write-error-msg $"运行 contentlayer 时出错: ($in)"
    exit 1
}

# 步骤 2: 验证生成的文件
write-step "步骤 2/2: 验证生成的文件"

# 检查关键文件是否存在
# 注意：由于已经切换到前端目录，使用相对路径
let required_files = [
    ".contentlayer/generated/Blog/_index.mjs",
    ".contentlayer/generated/Blog/_index.json",
    ".contentlayer/generated/index.mjs"
]

let missing_files = ($required_files | where {|file| not ($file | path exists)})

if ($missing_files | length) > 0 {
    write-error-msg "缺少必需的生成文件:"
    for $file in $missing_files {
        print $"(ansi red)  - ($file)(ansi reset)"
    }
    print $"\n(ansi yellow)请检查 contentlayer 配置和文章文件格式(ansi reset)"
    exit 1
}

# 检查 _index.mjs 文件是否包含文章数据
try {
    let index_content = (open ".contentlayer/generated/Blog/_index.mjs" | str join "")
    let content_length = ($index_content | str length)
    let has_allblogs = ($index_content | str contains "allBlogs")
    if ($content_length == 0) {
        write-error-msg "生成的文件格式不正确，allBlogs 未找到"
        exit 1
    }
    if (not $has_allblogs) {
        write-error-msg "生成的文件格式不正确，allBlogs 未找到"
        exit 1
    }
    
    # 检查是否有文章被导入（统计 import 语句）
    # 使用 split 和 where 来统计包含 "import" 和 "from" 的行
    let import_lines = ($index_content | split row (char nl) | where {|line| 
        let conditions = [
            ($line | str contains "import"),
            ($line | str contains "from")
        ]
        $conditions | all {|cond| $cond == true}
    })
    let import_count = ($import_lines | length)
    if $import_count == 0 {
        write-error-msg "没有找到任何文章导入，请检查文章文件是否存在"
        print $"\n(ansi yellow)请确认 data/blog/ 目录下有 .mdx 文件(ansi reset)"
        exit 1
    }
    
    let success_msg = "验证通过 (找到 " + ($import_count | into string) + " 个文章导入)"
    write-success $success_msg
} catch {
    write-error-msg $"验证生成文件时出错: ($in)"
    exit 1
}

# 步骤 3: 启动开发服务器
write-step "启动开发服务器"
print "\n正在启动 Next.js 开发服务器..."
print $"(ansi green)Contentlayer 文件已成功生成，开发服务器将自动监听文件变化\n(ansi reset)"

# 启动开发服务器，过滤掉 source map 相关的警告和错误
# 注意：nushell 中流式输出处理可能需要使用不同的方式
# 这里使用 ^pnpm 来避免 nushell 的别名解析
let filter_patterns = ["Invalid source map", "sourceMapURL could not be parsed", "--no-source-maps is not allowed"]
try {
    ^pnpm dev | lines | where {|line| 
        let should_filter = ($filter_patterns | any {|pattern| $line | str contains $pattern})
        not $should_filter
    } | each {|line| print $line}
} catch {
    # 恢复工作目录
    cd $project_root
    exit 1
}

# 恢复工作目录
cd $project_root


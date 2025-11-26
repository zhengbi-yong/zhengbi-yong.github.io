# 设置控制台输出编码为 UTF-8，避免 Unicode 字符显示乱码
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8
# 设置 Windows 控制台代码页为 UTF-8 (65001)
chcp 65001 | Out-Null

corepack enable
$env:PWD = $(Get-Location).Path
# 抑制 Node.js v23.8.0 的 source map 警告（这些警告不影响功能）
$env:NODE_OPTIONS = "--no-warnings"
# 启动开发服务器，过滤掉 source map 相关的警告和错误
# 使用 ForEach-Object 过滤输出，保持交互性
yarn dev 2>&1 | ForEach-Object {
    if ($_ -notmatch "Invalid source map" -and 
        $_ -notmatch "sourceMapURL could not be parsed" -and
        $_ -notmatch "--no-source-maps is not allowed") {
        $_
    }
}
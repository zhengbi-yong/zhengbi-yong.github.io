corepack enable
$env:PWD = $(Get-Location).Path
# 抑制 Node.js v23.8.0 的 source map 警告（这些警告不影响功能）
# 在 PowerShell 中直接设置环境变量，避免 cross-env 的引号处理问题
$env:NODE_OPTIONS = "--no-warnings"
yarn dev
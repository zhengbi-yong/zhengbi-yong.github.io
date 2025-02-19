# 检查项目的语法
yarn lint --fix

# 构建项目
corepack enable
$env:PWD = $(Get-Location).Path
$env:EXPORT = 1
$env:UNOPTIMIZED = 1
yarn build

# 开始同步
$sourceFolder = "C:\blog\out\"
$remoteUser = "ubuntu"    
$remoteIP = "152.136.43.194"     
$remotePort = 22                   
$remotePath = "/home/ubuntu/PersonalBlog/out/"
$cygwinSource = (C:\cygwin64\bin\cygpath.exe -u $sourceFolder).Trim()
if (-not (Test-Path $sourceFolder)) {
    Write-Host "错误：Windows路径不存在" -ForegroundColor Red
    exit 1
}
& "C:\cygwin64\bin\rsync.exe" -avztP --delete  `
    -e "C:\cygwin64\bin\sshpass.exe -p 'YzBxxM2000818.P' C:\cygwin64\bin\ssh.exe -p $remotePort -o UserKnownHostsFile=/cygdrive/c/Users/Sisyphus/.ssh/known_hosts" `
    $cygwinSource `
    ${remoteUser}@${remoteIP}:${remotePath}
# Windows 本地开发环境部署指南

**适用版本**: v1.8.0+
**操作系统**: Windows 10/11
**预计时间**: 20-30 分钟
**难度等级**: ⭐⭐ (中等)

---

## 📋 目录

1. [部署方式选择](#部署方式选择)
2. [方式 A: 使用 WSL2（推荐）](#方式-a-使用-wsl2推荐)
3. [方式 B: 原生 Windows 部署](#方式-b-原生-windows-部署)
4. [IDE 配置](#ide-配置)
5. [常见问题](#常见问题)

---

## 部署方式选择

在 Windows 上有两种部署方式：

| 特性 | WSL2 | 原生 Windows |
|------|------|-------------|
| **兼容性** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| **性能** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| **易用性** | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| **推荐度** | ✅ 强烈推荐 | ✅ 推荐 |

**选择建议**:
- 如果你的项目部署目标服务器是 Linux → 使用 **WSL2**
- 如果你需要 Windows 原生工具集成 → 使用 **原生 Windows**

---

## 方式 A: 使用 WSL2（推荐）

WSL2（Windows Subsystem for Linux 2）提供完整的 Linux 兼容性，是推荐的 Windows 开发环境。

### 步骤 1: 安装 WSL2

#### 1.1 启用 WSL

**以管理员身份打开 PowerShell**:

```powershell
# 启用 WSL
wsl --install

# 重启计算机
Restart-Computer
```

**重启后**, WSL 会自动安装 Ubuntu。

**或者手动安装 Ubuntu**:

```powershell
# 查看可用的 Linux 发行版
wsl --list --online

# 安装 Ubuntu 22.04 LTS
wsl --install -d Ubuntu-22.04
```

#### 1.2 验证安装

```powershell
# 打开 WSL
wsl

# 查看版本
wsl --version
```

**预期输出**:
```
WSL 版本: 2.x.x.x
内核版本: 5.x.x.x
WSLg 版本: 1.x.x.x
```

### 步骤 2: 在 WSL2 中安装依赖

#### 2.1 更新系统

```bash
# 在 WSL 终端中执行
sudo apt update && sudo apt upgrade -y
```

#### 2.2 安装基础工具

```bash
# 安装必要工具
sudo apt install -y \
    git \
    curl \
    wget \
    vim \
    unzip \
    build-essential \
    pkg-config \
    libssl-dev
```

#### 2.3 安装 Node.js 和 pnpm

```bash
# 安装 Node.js 20 LTS
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# 验证安装
node --version
# 应显示: v20.x.x

npm --version
# 应显示: 10.x.x

# 安装 pnpm
npm install -g pnpm

# 验证安装
pnpm --version
# 应显示: 10.x.x
```

#### 2.4 安装 Rust

```bash
# 安装 Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source $HOME/.cargo/env

# 验证安装
rustc --version
# 应显示: rustc 1.7x.x

cargo --version
# 应显示: cargo 1.7x.x
```

#### 2.5 安装 Docker

```bash
# 安装 Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# 将当前用户添加到 docker 组
sudo usermod -aG docker $USER

# 重新登录或运行
newgrp docker

# 验证安装
docker --version
docker compose version
```

### 步骤 3: 克隆项目

```bash
# 克隆项目到 WSL 文件系统（重要！）
cd ~
git clone https://github.com/zhengbi-yong/zhengbi-yong.github.io.git
cd zhengbi-yong.github.io
```

**⚠️ 重要**: 不要将项目放在 `/mnt/c/`（Windows 文件系统）中，否则会严重影响性能。

### 步骤 4: 启动开发环境

#### 4.1 使用 Docker 快速启动

```bash
# 复制环境变量模板
cp .env.docker.example .env

# 编辑环境变量（可选）
nano .env

# 启动所有服务
docker compose up -d

# 查看服务状态
docker compose ps

# 查看日志
docker compose logs -f
```

#### 4.2 传统方式启动（前后端分离）

**启动前端**:

```bash
cd frontend
pnpm install
pnpm dev
```

前端将在 **http://localhost:3001** 启动

**启动后端**:

```bash
# 在新终端窗口
cd ~/zhengbi-yong.github.io/backend
./deploy.sh dev

# 等待数据库启动完成后
export DATABASE_URL=postgresql://blog_user:blog_password@localhost:5432/blog_db
export REDIS_URL=redis://localhost:6379
cargo run
```

后端 API 将在 **http://localhost:3000** 启动

### 步骤 5: 访问应用

在 Windows 浏览器中访问：

- **前端**: http://localhost:3001
- **后端 API**: http://localhost:3000
- **健康检查**: http://localhost:3000/health

### 步骤 6: 使用 VS Code 开发

#### 6.1 安装 VS Code

下载并安装 [VS Code](https://code.visualstudio.com/)

#### 6.2 安装 WSL 扩展

在 VS Code 中安装扩展：
- **WSL** (Microsoft)
- **Remote - WSL** (Microsoft)

#### 6.3 在 WSL 中打开项目

```bash
# 在 WSL 终端中
cd ~/zhengbi-yong.github.io
code .
```

VS Code 将在 WSL 环境中打开项目。

#### 6.4 推荐扩展

在 VS Code 中安装：

**前端开发**:
- ESLint
- Prettier
- Tailwind CSS IntelliSense
- MDX

**后端开发**:
- Rust Analyzer
- Even Better TOML
- CodeLLDB (调试器)

**通用**:
- GitLens
- Material Icon Theme
- Error Lens

---

## 方式 B: 原生 Windows 部署

如果不使用 WSL2，也可以在原生 Windows 上部署。

### 步骤 1: 安装必要软件

#### 1.1 安装 Git

下载并安装 [Git for Windows](https://git-scm.com/download/win)

**安装选项**:
- 默认编辑器: VS Code
- PATH 环境: 选择 "Git from the command line and also from 3rd-party software"
- 行尾转换: 选择 "Checkout Windows-style, commit Unix-style line endings"

**验证安装**:
```powershell
git --version
```

#### 1.2 安装 Node.js 和 pnpm

**下载 Node.js**:
- 访问 https://nodejs.org/
- 下载 **LTS** 版本（推荐 20.x）
- 运行安装程序（使用默认设置）

**验证安装**:
```powershell
node --version
npm --version
```

**安装 pnpm**:
```powershell
npm install -g pnpm
pnpm --version
```

#### 1.3 安装 Rust

**下载并安装 rustup**:
- 访问 https://rustup.rs/
- 下载 rustup-init.exe
- 运行安装程序（使用默认选项）

**验证安装**:
```powershell
rustc --version
cargo --version
```

#### 1.4 安装 Docker Desktop

**下载 Docker Desktop**:
- 访问 https://www.docker.com/products/docker-desktop/
- 下载 Windows 版本
- 运行安装程序

**安装选项**:
- ✅ Use WSL 2 based engine (推荐)
- ✅ Add shortcut to desktop

**验证安装**:
```powershell
docker --version
docker compose version
```

### 步骤 2: 克隆项目

```powershell
# 克隆项目
cd D:\YZB
git clone https://github.com/zhengbi-yong/zhengbi-yong.github.io.git
cd zhengbi-yong.github.io
```

### 步骤 3: 启动开发环境

#### 3.1 使用 Docker 快速启动

```powershell
# 复制环境变量模板
copy .env.docker.example .env

# 编辑环境变量（使用 VS Code 或记事本）
notepad .env

# 启动所有服务
docker compose up -d

# 查看服务状态
docker compose ps

# 查看日志
docker compose logs -f
```

#### 3.2 传统方式启动

**启动前端**:

```powershell
cd frontend
pnpm install
pnpm dev
```

**启动后端**:

```powershell
# 在新终端窗口
cd backend
.\deploy.sh dev

# 设置环境变量（PowerShell）
$env:DATABASE_URL="postgresql://blog_user:blog_password@localhost:5432/blog_db"
$env:REDIS_URL="redis://localhost:6379"
cargo run
```

### 步骤 4: 访问应用

- **前端**: http://localhost:3001
- **后端 API**: http://localhost:3000
- **健康检查**: http://localhost:3000/health

---

## IDE 配置

### VS Code

#### 推荐扩展

**前端**:
```json
{
  "recommendations": [
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode",
    "bradlc.vscode-tailwindcss",
    "silvenon.mdx",
    "ms-vscode.vscode-typescript-next"
  ]
}
```

**后端**:
```json
{
  "recommendations": [
    "rust-lang.rust-analyzer",
    "tamasfe.even-better-toml",
    "vadimcn.vscode-lldb",
    "serayuzgur.crates"
  ]
}
```

#### 工作区配置

创建 `.vscode/settings.json`:

```json
{
  "[typescript]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  },
  "[javascript]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  },
  "[rust]": {
    "editor.defaultFormatter": "rust-lang.rust-analyzer",
    "editor.formatOnSave": true
  },
  "tailwindCSS.experimental.classRegex": [
    ["cn\\(([^)]*)\\)", "[\"'`]([^\"'`]*).*?[\"'`]"]
  ]
}
```

### JetBrains IDE

**IntelliJ IDEA / WebStorm / RustRover**:

1. 安装 **Rust 插件**
2. 配置 **Node.js** 路径
3. 启用 **Prettier** 作为格式化工具

---

## 常见问题

### WSL2 相关问题

#### 问题 1: WSL 安装失败

**症状**: 运行 `wsl --install` 后报错

**解决方案**:

1. **启用 Windows 虚拟化**:
   ```powershell
   # 以管理员身份运行 PowerShell
   dism.exe /online /enable-feature /featurename:Microsoft-Windows-Subsystem-Linux /all /norestart
   dism.exe /online /enable-feature /featurename:VirtualMachinePlatform /all /norestart
   Restart-Computer
   ```

2. **更新 BIOS 设置**:
   - 启用 **虚拟化技术 (VT-x)**
   - 启用 **Intel VT-d** 或 **AMD IOMMU**

3. **手动安装 WSL**:
   - 下载 WSL2 Linux 内络更新包: https://aka.ms/wsl2kernel

#### 问题 2: WSL 中无法访问 localhost

**症状**: 在 WSL 中启动服务，Windows 浏览器无法访问

**解决方案**:

WSL2 会自动转发端口，如果无法访问，使用以下命令：

```bash
# 在 WSL 中获取 Windows IP
cat /etc/resolv.conf
# 使用显示的 IP 代替 localhost
# 例如: http://172.x.x.x:3001
```

#### 问题 3: 文件系统性能慢

**症状**: 在 `/mnt/c/` 中运行项目非常慢

**解决方案**:

**始终将项目放在 WSL 文件系统中**:
```bash
# ❌ 错误: 放在 Windows 文件系统
cd /mnt/c/Users/YourName/projects

# ✅ 正确: 放在 WSL 文件系统
cd ~/projects
```

### 原生 Windows 问题

#### 问题 4: PowerShell 执行策略错误

**症状**: 运行脚本时出现 "cannot be loaded because running scripts is disabled"

**解决方案**:

```powershell
# 查看当前策略
Get-ExecutionPolicy

# 临时允许（推荐）
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser

# 或临时绕过
powershell -ExecutionPolicy Bypass -File .\script.ps1
```

#### 问题 5: Windows 路径过长

**症状**: 安装依赖时出现 "path too long" 错误

**解决方案**:

**方法 1**: 启用长路径支持
```powershell
# 以管理员身份运行
New-ItemProperty -Path "HKLM:\SYSTEM\CurrentControlSet\Control\FileSystem" `
    -Name "LongPathsEnabled" -Value 1 -PropertyType DWORD -Force
```

**方法 2**: 使用短路径
```powershell
# 不要使用
C:\Users\YourName\Documents\GitHub\zhengbi-yong.github.io

# 而是使用
C:\dev\blog
```

#### 问题 6: Rust 编译错误

**症状**: `cargo build` 失败

**解决方案**:

```powershell
# 安装 C++ Build Tools
# 下载并安装: https://visualstudio.microsoft.com/visual-cpp-build-tools/
# 选择 "Desktop development with C++"

# 或使用 Chocolatey
choco install llvm
```

### Docker 问题

#### 问题 7: Docker Desktop 无法启动

**症状**: Docker Desktop 启动后立即关闭

**解决方案**:

1. **检查 Hyper-V 和 WSL2**:
   ```powershell
   # 启用必要的功能
   dism.exe /online /enable-feature /featurename:Microsoft-Windows-Subsystem-Linux /all /norestart
   dism.exe /online /enable-feature /featurename:VirtualMachinePlatform /all /norestart
   ```

2. **重置 Docker Desktop**:
   - 设置 → Reset → Clean to factory defaults

#### 问题 8: Docker 容器无法访问网络

**症状**: 容器内无法访问外网

**解决方案**:

```powershell
# 重启 Docker 网络
docker network prune

# 或重启 Docker Desktop
```

### 开发工具问题

#### 问题 9: VS Code 无法连接到 WSL

**症状**: 安装 WSL 扩展后仍无法连接

**解决方案**:

```bash
# 在 WSL 中
sudo apt update
sudo apt install -y wget ca-certificates

# 下载并安装 VS Code Server
# VS Code 会自动处理，如果失败，手动下载
```

#### 问题 10: 热重载不工作

**症状**: 修改代码后页面不自动刷新

**解决方案**:

**前端**:
```bash
# 清除 Next.js 缓存
cd frontend
rm -rf .next
pnpm dev
```

**后端**:
```bash
# Rust 需要重新编译
cargo run
# 或使用 cargo-watch
cargo install cargo-watch
cargo watch -x run
```

---

## 性能优化

### WSL2 性能优化

#### 1. 增加 WSL2 内存

创建 `%UserProfile%\.wslconfig`:

```ini
[wsl2]
memory=8GB
processors=4
swap=2GB
swapFile=C:\\temp\\wsl-swap.vhdx
```

#### 2. 移动 Docker Desktop 数据

Docker Desktop 设置 → Resources → Advanced → Disk image location:

```
D:\DockerData
```

### Windows 性能优化

#### 1. 配置 Windows Defender 排除

添加到 Windows Defender 排除项:
- 项目目录: `D:\YZB\zhengbi-yong.github.io`
- Node.js 目录: `%AppData%\npm`
- Cargo 目录: `%USERPROFILE%\.cargo`

#### 2. 使用快速启动

```powershell
# 启用 Windows 快速启动
powercfg /h on
```

---

## 下一步

开发环境配置完成后：

1. 📖 阅读 [环境配置](environment-setup.md) 了解详细配置
2. ✍️ 查看 [内容管理](../guides/content-management.md) 学习如何创建文章
3. 🎨 探索 [写作指南](../guides/writing-guide.md) 了解 MDX 组件使用
4. 🚀 参考 [Docker 部署](../deployment/docker.md) 准备生产环境

---

## 获取帮助

如果遇到问题：

1. 查看 [故障排查](troubleshooting.md)
2. 搜索 [GitHub Issues](https://github.com/zhengbi-yong/zhengbi-yong.github.io/issues)
3. 创建新 Issue 寻求帮助

---

**文档版本**: 1.0.0
**最后更新**: 2025-12-29
**维护者**: Zhengbi Yong

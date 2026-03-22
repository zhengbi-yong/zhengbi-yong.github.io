# macOS 本地开发环境部署指南

**适用版本**: v1.8.0+
**操作系统**: macOS 11+ (Big Sur 或更高版本)
**预计时间**: 15-25 分钟
**难度等级**: ⭐⭐ (简单)

---

## 📋 目录

1. [前置要求](#前置要求)
2. [安装 Homebrew](#安装-homebrew)
3. [安装开发工具](#安装开发工具)
4. [克隆项目](#克隆项目)
5. [启动开发环境](#启动开发环境)
6. [IDE 配置](#ide-配置)
7. [常见问题](#常见问题)

---

## 前置要求

### 系统要求

- **操作系统**: macOS 11 (Big Sur) 或更高版本
- **处理器**: Intel x86_64 或 Apple Silicon (M1/M2/M3)
- **内存**: 8 GB RAM (推荐 16 GB)
- **磁盘**: 5 GB 可用空间
- **网络**: 稳定的互联网连接

### 管理员权限

安装某些软件需要管理员权限（需要 `sudo`）。

---

## 安装 Homebrew

Homebrew 是 macOS 上最流行的包管理器，我们将使用它来安装所有开发工具。

### 安装 Homebrew

**打开终端**（Applications → Utilities → Terminal）并执行：

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

**安装过程**:
1. 按提示输入管理员密码
2. 按回车键继续安装
3. 等待安装完成（约 5-10 分钟）

### 配置 Homebrew

**Intel Mac**:
```bash
# Homebrew 会自动配置，无需额外操作
```

**Apple Silicon Mac (M1/M2/M3)**:
```bash
# 将 Homebrew 添加到 PATH
echo 'eval "$(/opt/homebrew/bin/brew shellenv)"' >> $HOME/.zprofile
eval "$(/opt/homebrew/bin/brew shellenv)"
```

### 验证安装

```bash
brew --version
# 应显示: Homebrew 4.x.x
```

---

## 安装开发工具

### 步骤 1: 安装基础工具

```bash
# 安装常用工具
brew install git wget vim
```

### 步骤 2: 安装 Node.js 和 pnpm

```bash
# 安装 Node.js 20 LTS
brew install node@20

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

### 步骤 3: 安装 Rust

```bash
# 安装 Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# 配置当前 shell
source $HOME/.cargo/env

# 验证安装
rustc --version
# 应显示: rustc 1.7x.x

cargo --version
# 应显示: cargo 1.7x.x
```

### 步骤 4: 安装 Docker

```bash
# 安装 Docker Desktop
brew install --cask docker

# 或下载安装包
# https://www.docker.com/products/docker-desktop/
```

**安装 Docker Desktop**:
1. 打开 Applications → Docker
2. 首次启动时会提示输入管理员密码
3. 等待 Docker 启动完成（菜单栏会出现 Docker 图标）

**验证安装**:
```bash
docker --version
# 应显示: Docker version 24.x.x

docker compose version
# 应显示: Docker Compose version v2.x.x
```

### 步骤 5: 安装数据库工具（可选）

```bash
# PostgreSQL 客户端
brew install postgresql

# Redis 客户端
brew install redis
```

---

## 克隆项目

### 使用 Git 克隆

```bash
# 克隆项目
cd ~
git clone https://github.com/zhengbi-yong/zhengbi-yong.github.io.git
cd zhengbi-yong.github.io
```

### 使用 GitHub CLI（推荐）

```bash
# 安装 GitHub CLI
brew install gh

# 登录 GitHub
gh auth login

# 克隆项目
gh repo clone zhengbi-yong/zhengbi-yong.github.io
cd zhengbi-yong.github.io
```

---

## 启动开发环境

你有两种方式启动开发环境：

### 方式 A: Docker 快速启动（推荐）

这是最简单的方式，适合快速开始开发。

#### 1. 配置环境变量

```bash
# 复制环境变量模板
cp .env.docker.example .env

# 编辑环境变量（可选，开发环境可以使用默认值）
nano .env
# 或使用 VS Code
code .env
```

**开发环境可以使用默认配置**，但生产环境**必须修改**以下配置：

```bash
# ⚠️ 生产环境必须修改
JWT_SECRET=your_jwt_secret_at_least_32_characters_long
PASSWORD_PEPPER=your_password_pepper_at_least_32_characters_long
SESSION_SECRET=your_session_secret_at_least_32_characters_long
POSTGRES_PASSWORD=your_secure_postgres_password
```

#### 2. 启动所有服务

```bash
# 启动所有服务（前端、后端、数据库）
docker compose up -d

# 查看服务状态
docker compose ps

# 查看日志
docker compose logs -f
```

**预期输出**:
```
NAME                IMAGE                      STATUS
blog-postgres       postgres:17-alpine         Up (healthy)
blog-redis          redis:7.4-alpine           Up (healthy)
blog-backend        blog-backend:latest        Up (healthy)
blog-frontend       blog-frontend:latest       Up (healthy)
blog-nginx          nginx:1.27-alpine          Up
```

#### 3. 访问应用

打开浏览器访问：

- **前端**: http://localhost:3001
- **后端 API**: http://localhost:3000
- **通过 Nginx**: http://localhost

#### 4. 停止服务

```bash
# 停止所有服务
docker compose down

# 停止并删除数据卷（清空数据库）
docker compose down -v
```

---

### 方式 B: 传统方式（前后端分离）

这种方式适合需要单独调试前端或后端的场景。

#### 1. 启动数据库

```bash
# 启动 PostgreSQL 和 Redis
cd backend
./scripts/deployment/deploy.sh dev
```

#### 2. 启动后端

**打开新终端窗口**:

```bash
cd ~/zhengbi-yong.github.io/backend

# 设置环境变量
export DATABASE_URL=postgresql://blog_user:blog_password@localhost:5432/blog_db
export REDIS_URL=redis://localhost:6379

# 启动后端 API
cargo run
```

后端将在 **http://localhost:3000** 启动

**使用 cargo-watch 自动重启**:

```bash
# 安装 cargo-watch
cargo install cargo-watch

# 自动监控文件变化并重启
cargo watch -x run
```

#### 3. 启动前端

**打开另一个新终端窗口**:

```bash
cd ~/zhengbi-yong.github.io/frontend

# 安装依赖（首次）
pnpm install

# 启动开发服务器
pnpm dev
```

前端将在 **http://localhost:3001** 启动

#### 4. 访问应用

- **前端**: http://localhost:3001
- **后端 API**: http://localhost:3000
- **健康检查**: http://localhost:3000/health

---

## IDE 配置

### VS Code

#### 安装 VS Code

```bash
# 使用 Homebrew 安装
brew install --cask visual-studio-code

# 或下载安装包
# https://code.visualstudio.com/
```

#### 推荐扩展

打开 VS Code，按 `Cmd+Shift+X` 打开扩展面板，安装以下扩展：

**前端开发**:
- **ESLint** (dbaeumer.vscode-eslint)
- **Prettier** (esbenp.prettier-vscode)
- **Tailwind CSS IntelliSense** (bradlc.vscode-tailwindcss)
- **MDX** (silvenon.mdx)

**后端开发**:
- **Rust Analyzer** (rust-lang.rust-analyzer)
- **Even Better TOML** (tamasfe.even-better-toml)
- **CodeLLDB** (vadimcn.vscode-lldb)

**通用**:
- **GitLens** (eamodio.gitlens)
- **Material Icon Theme** (PKief.material-icon-theme)
- **Error Lens** (usernamehw.errorlens)

#### 配置设置

创建 `.vscode/settings.json`:

```json
{
  "[typescript]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode",
    "editor.formatOnSave": true
  },
  "[javascript]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode",
    "editor.formatOnSave": true
  },
  "[rust]": {
    "editor.defaultFormatter": "rust-lang.rust-analyzer",
    "editor.formatOnSave": true
  },
  "tailwindCSS.experimental.classRegex": [
    ["cn\\(([^)]*)\\)", "[\"'`]([^\"'`]*).*?[\"'`]"]
  ],
  "files.watcherExclude": {
    "**/target/**": true,
    "**/node_modules/**": true
  }
}
```

#### 在 VS Code 中打开项目

```bash
# 在终端中
cd ~/zhengbi-yong.github.io
code .
```

### IntelliJ IDEA / WebStorm / RustRover

如果使用 JetBrains IDE：

1. **安装插件**:
   - Rust (for RustRover/IntelliJ)
   - Node.js (for WebStorm)

2. **配置 Node.js**:
   - Settings → Languages & Frameworks → Node.js
   - 设置 Node.js 路径: `/opt/homebrew/bin/node` (Apple Silicon) 或 `/usr/local/bin/node` (Intel)

3. **配置 Prettier**:
   - Settings → Languages & Frameworks → JavaScript → Prettier
   - 启用 "On save" reformat

---

## 常见问题

### Homebrew 相关问题

#### 问题 1: Homebrew 安装失败

**症状**: 运行 Homebrew 安装脚本时报错

**解决方案**:

```bash
# 1. 更新系统
softwareupdate --all --install --force

# 2. 安装 Xcode Command Line Tools
xcode-select --install

# 3. 重新安装 Homebrew
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

#### 问题 2: brew command not found

**症状**: 安装 Homebrew 后运行 `brew` 命令找不到

**解决方案**:

**Apple Silicon Mac**:
```bash
# 添加到 PATH
echo 'eval "$(/opt/homebrew/bin/brew shellenv)"' >> $HOME/.zprofile
eval "$(/opt/homebrew/bin/brew shellenv)"
```

**Intel Mac**:
```bash
# Homebrew 应该已经自动配置
# 如果仍有问题，重启终端
```

### Node.js 问题

#### 问题 3: Node.js 版本不匹配

**症状**: 运行 `pnpm install` 时提示 Node.js 版本不兼容

**解决方案**:

```bash
# 使用 nvm 管理多个 Node 版本
brew install nvm

# 配置 nvm
mkdir -p ~/.nvm
echo 'export NVM_DIR="$HOME/.nvm"' >> ~/.zshrc
echo '[ -s "/opt/homebrew/opt/nvm/nvm.sh" ] && \. "/opt/homebrew/opt/nvm/nvm.sh"' >> ~/.zshrc

# 重新加载 shell
source ~/.zshrc

# 安装 Node.js 20
nvm install 20
nvm use 20
```

#### 问题 4: pnpm 安装失败

**症状**: 运行 `npm install -g pnpm` 报错

**解决方案**:

```bash
# 使用 Homebrew 安装
brew install pnpm

# 或使用安装脚本
curl -fsSL https://get.pnpm.io/install.sh | sh -
```

### Rust 问题

#### 问题 5: Rust 编译错误

**症状**: 运行 `cargo build` 时编译失败

**解决方案**:

```bash
# 1. 更新 Rust
rustup update

# 2. 清理构建缓存
cargo clean

# 3. 重新编译
cargo build
```

**如果缺少系统库**:
```bash
# 安装 Xcode Command Line Tools
xcode-select --install

# 或安装完整的 Xcode (从 App Store)
```

#### 问题 6: cargo 权限错误

**症状**: 安装 crate 时提示权限不足

**解决方案**:

```bash
# 修复 cargo 目录权限
sudo chown -R $USER:$(id -gn $USER) ~/.cargo

# 或使用 Homebrew 安装的 Rust
brew install rust
```

### Docker 问题

#### 问题 7: Docker Desktop 无法启动

**症状**: Docker Desktop 启动后立即退出

**解决方案**:

1. **检查系统版本**:
   ```bash
   sw_vers
   # 确保 macOS 版本 >= 11.0
   ```

2. **重置 Docker Desktop**:
   - 菜单 → Troubleshoot → Clean/Purge data
   - 重启 Docker Desktop

3. **检查虚拟化**:
   ```bash
   sysctl -a | grep -i machdep.cpu.features
   # 确保输出包含 VMX (Intel) 或 GFP (Apple Silicon)
   ```

#### 问题 8: Docker 容器无法访问网络

**症状**: 容器内无法访问外网

**解决方案**:

```bash
# 重启 Docker Desktop
# 或重置网络
docker network prune
```

#### 问题 9: Docker 内存不足

**症状**: 容器频繁重启，日志显示 OOM

**解决方案**:

Docker Desktop → Settings → Resources → Advanced:

- Memory: 8 GB (或更多)
- Swap: 2 GB
- Disk image size: 64 GB

---

## 性能优化

### 文件监控优化

macOS 对文件监控数量有限制，可能导致热重载失败。

**增加文件监控限制**:

```bash
# 创建 launchd 配置
sudo vim /Library/LaunchDaemons/limit.maxfiles.plist
```

添加以下内容:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
  <dict>
    <key>Label</key>
    <string>limit.maxfiles</string>
    <key>ProgramArguments</key>
    <array>
      <string>launchctl</string>
      <string>limit</string>
      <string>maxfiles</string>
      <string>65536</string>
      <string>200000</string>
    </array>
    <key>RunAtLoad</key>
    <true/>
    <key>ServiceIPC</key>
    <false/>
  </dict>
</plist>
```

```bash
# 加载配置
sudo launchctl load -w /Library/LaunchDaemons/limit.maxfiles.plist

# 重启系统
```

### Docker 性能优化

**配置 Docker Desktop**:

1. **内存**: 8 GB+
2. **CPU**: 4 核心以上
3. **磁盘**: SSD
4. **文件共享**:
   - 只共享必要的目录
   - 避免共享 `node_modules`

### 编译性能优化

**Rust 编译优化**:

```bash
# 使用增量编译
export CARGO_INCREMENTAL=1

# 使用更少的并行编译任务
export CARGO_BUILD_JOBS=2

# 编译发布版本
cargo build --release
```

**Next.js 构建优化**:

```bash
# 使用 SWC 编译器（默认启用）
# 无需额外配置

# 启用 Turbopack（实验性）
pnpm dev --turbo
```

---

## Apple Silicon 特别说明

如果你使用的是 M1/M2/M3 Mac，请注意以下几点：

### Rosetta 2

某些工具可能需要 Rosetta 2:

```bash
# 安装 Rosetta 2
softwareupdate --install-rosetta
```

### 架构兼容性

**检查架构**:

```bash
uname -m
# x86_64 = Intel
# arm64 = Apple Silicon
```

**Docker 镜像**:

大多数 Docker 镜像已经支持多架构，无需担心。

**Node.js 依赖**:

某些原生模块可能需要重新编译:

```bash
cd frontend
rm -rf node_modules
pnpm install
```

---

## 快速命令参考

### 前端开发

```bash
cd frontend

# 安装依赖
pnpm install

# 启动开发服务器
pnpm dev

# 构建生产版本
pnpm build

# 运行测试
pnpm test

# 代码检查
pnpm lint

# 格式化代码
pnpm format
```

### 后端开发

```bash
cd backend

# 启动开发数据库
./scripts/deployment/deploy.sh dev

# 运行 API 服务
export DATABASE_URL=postgresql://blog_user:blog_password@localhost:5432/blog_db
export REDIS_URL=redis://localhost:6379
cargo run

# 自动重启
cargo watch -x run

# 运行测试
cargo test

# 代码检查
cargo clippy

# 格式化代码
cargo fmt
```

### Docker 命令

```bash
# 启动所有服务
docker compose up -d

# 查看服务状态
docker compose ps

# 查看日志
docker compose logs -f

# 停止服务
docker compose down

# 重启服务
docker compose restart

# 重新构建并启动
docker compose up -d --build
```

---

## 下一步

开发环境配置完成后：

1. 📖 阅读 [环境配置](environment-setup.md) 了解详细配置
2. ✍️ 查看 [内容管理](../guides/content-management.md) 学习如何创建文章
3. 🎨 探索 [写作指南](../guides/writing-guide.md) 了解 MDX 组件使用
4. 🚀 参考 [服务器部署](../deployment/guides/server/quick-deployment.md) 准备生产环境

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

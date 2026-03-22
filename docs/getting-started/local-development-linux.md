# Linux 本地开发环境部署指南

**适用版本**: v1.8.0+
**操作系统**: Ubuntu 20.04+, Debian 11+, Fedora 35+, Arch Linux
**预计时间**: 15-30 分钟
**难度等级**: ⭐⭐ (简单)

---

## 📋 目录

1. [系统要求](#系统要求)
2. [Ubuntu/Debian 安装](#ubuntudebian-安装)
3. [Fedora 安装](#fedora-安装)
4. [Arch Linux 安装](#arch-linux-安装)
5. [通用配置步骤](#通用配置步骤)
6. [IDE 配置](#ide-配置)
7. [常见问题](#常见问题)

---

## 系统要求

### 最低要求

- **操作系统**: Ubuntu 20.04+ / Debian 11+ / Fedora 35+ / Arch Linux
- **内存**: 8 GB RAM (推荐 16 GB)
- **磁盘**: 5 GB 可用空间
- **CPU**: 2 核心或以上
- **网络**: 稳定的互联网连接

### 检查系统信息

```bash
# 检查发行版
cat /etc/os-release

# 检查内存
free -h

# 检查磁盘空间
df -h

# 检查 CPU
nproc
```

---

## Ubuntu/Debian 安装

### 步骤 1: 更新系统

```bash
# Ubuntu
sudo apt update && sudo apt upgrade -y

# Debian
sudo apt update && sudo apt upgrade -y
```

### 步骤 2: 安装基础工具

```bash
sudo apt install -y \
    git \
    curl \
    wget \
    vim \
    build-essential \
    pkg-config \
    libssl-dev \
    ca-certificates \
    gnupg \
    lsb-release
```

### 步骤 3: 安装 Node.js 和 pnpm

**使用 NodeSource 仓库安装 Node.js 20 LTS**:

```bash
# 添加 NodeSource 仓库
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -

# 安装 Node.js
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

### 步骤 4: 安装 Rust

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

### 步骤 5: 安装 Docker

```bash
# 添加 Docker 官方 GPG 密钥
sudo mkdir -p /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg

# 设置 Docker 仓库
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# 更新包索引
sudo apt update

# 安装 Docker
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

# 启动 Docker
sudo systemctl start docker
sudo systemctl enable docker

# 将当前用户添加到 docker 组（避免使用 sudo）
sudo usermod -aG docker $USER

# 重新登录或运行
newgrp docker

# 验证安装
docker --version
docker compose version
```

---

## Fedora 安装

### 步骤 1: 更新系统

```bash
sudo dnf update -y
```

### 步骤 2: 安装基础工具

```bash
sudo dnf install -y \
    git \
    curl \
    wget \
    vim \
    gcc \
    gcc-c++ \
    make \
    pkg-config \
    openssl-devel
```

### 步骤 3: 安装 Node.js 和 pnpm

```bash
# 安装 Node.js 20
sudo dnf module enable nodejs:20 -y
sudo dnf install -y nodejs npm

# 验证安装
node --version
npm --version

# 安装 pnpm
npm install -g pnpm

# 验证安装
pnpm --version
```

### 步骤 4: 安装 Rust

```bash
# 安装 Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source $HOME/.cargo/env

# 验证安装
rustc --version
cargo --version
```

### 步骤 5: 安装 Docker

```bash
# 添加 Docker 仓库
sudo dnf -y install dnf-plugins-core
sudo dnf config-manager --add-repo https://download.docker.com/linux/fedora/docker-ce.repo

# 安装 Docker
sudo dnf install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

# 启动 Docker
sudo systemctl start docker
sudo systemctl enable docker

# 将当前用户添加到 docker 组
sudo usermod -aG docker $USER
newgrp docker

# 验证安装
docker --version
docker compose version
```

---

## Arch Linux 安装

### 步骤 1: 更新系统

```bash
sudo pacman -Syu
```

### 步骤 2: 安装基础工具

```bash
sudo pacman -S --needed \
    git \
    curl \
    wget \
    vim \
    base-devel \
    openssl
```

### 步骤 3: 安装 Node.js 和 pnpm

```bash
# 安装 Node.js 和 npm
sudo pacman -S nodejs npm

# 验证安装
node --version
npm --version

# 安装 pnpm
npm install -g pnpm

# 验证安装
pnpm --version
```

### 步骤 4: 安装 Rust

```bash
# 安装 Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source $HOME/.cargo/env

# 验证安装
rustc --version
cargo --version
```

### 步骤 5: 安装 Docker

```bash
# 安装 Docker
sudo pacman -S docker docker-compose

# 启动 Docker
sudo systemctl start docker
sudo systemctl enable docker

# 将当前用户添加到 docker 组
sudo usermod -aG docker $USER
newgrp docker

# 验证安装
docker --version
docker compose version
```

---

## 通用配置步骤

无论你使用哪种 Linux 发行版，以下步骤是通用的。

### 步骤 1: 克隆项目

```bash
# 克隆项目
cd ~
git clone https://github.com/zhengbi-yong/zhengbi-yong.github.io.git
cd zhengbi-yong.github.io
```

### 步骤 2: 配置环境变量

```bash
# 复制环境变量模板
cp .env.docker.example .env

# 编辑环境变量
nano .env
# 或使用 vim
vim .env
```

**开发环境可以使用默认配置**，生产环境**必须修改**以下配置：

```bash
# ⚠️ 生产环境必须修改
JWT_SECRET=your_jwt_secret_at_least_32_characters_long
PASSWORD_PEPPER=your_password_pepper_at_least_32_characters_long
SESSION_SECRET=your_session_secret_at_least_32_characters_long
POSTGRES_PASSWORD=your_secure_postgres_password
```

**生成安全密钥**:

```bash
# 生成 JWT_SECRET
openssl rand -base64 32

# 生成 PASSWORD_PEPPER
openssl rand -base64 32

# 生成 SESSION_SECRET
openssl rand -base64 32
```

### 步骤 3: 启动开发环境

#### 方式 A: Docker 快速启动（推荐）

```bash
# 启动所有服务
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

#### 方式 B: 传统方式（前后端分离）

**启动数据库**:

```bash
cd backend
./scripts/deployment/deploy.sh dev
```

**启动后端**:

```bash
# 打开新终端
cd ~/zhengbi-yong.github.io/backend

# 设置环境变量
export DATABASE_URL=postgresql://blog_user:blog_password@localhost:5432/blog_db
export REDIS_URL=redis://localhost:6379

# 启动 API
cargo run
```

**启动前端**:

```bash
# 打开另一个新终端
cd ~/zhengbi-yong.github.io/frontend

# 安装依赖
pnpm install

# 启动开发服务器
pnpm dev
```

### 步骤 4: 访问应用

- **前端**: http://localhost:3001
- **后端 API**: http://localhost:3000
- **通过 Nginx**: http://localhost
- **健康检查**: http://localhost:3000/health

---

## IDE 配置

### VS Code

#### 安装 VS Code

**Ubuntu/Debian**:
```bash
# 下载并安装
wget -qO- https://packages.microsoft.com/keys/microsoft.asc | gpg --dearmor > packages.microsoft.gpg
sudo install -o root -g root -m 644 packages.microsoft.gpg /etc/apt/trusted.gpg.d/

sudo sh -c 'echo "deb [arch=amd64,arm64,armhf signed-by=/etc/apt/trusted.gpg.d/packages.microsoft.gpg] https://packages.microsoft.com/repos/code stable main" > /etc/apt/sources.list.d/vscode.list'

sudo apt update
sudo apt install code
```

**Fedora**:
```bash
sudo rpm --import https://packages.microsoft.com/keys/microsoft.asc
sudo dnf config-manager --add-repo https://packages.microsoft.com/yumrepos/vscode
sudo dnf install code
```

**Arch Linux**:
```bash
yay -S visual-studio-code-bin
# 或
pacman -S visual-studio-code-bin
```

#### 推荐扩展

打开 VS Code，按 `Ctrl+Shift+X` 打开扩展面板，安装：

**前端开发**:
- ESLint (dbaeumer.vscode-eslint)
- Prettier (esbenp.prettier-vscode)
- Tailwind CSS IntelliSense (bradlc.vscode-tailwindcss)
- MDX (silvenon.mdx)

**后端开发**:
- Rust Analyzer (rust-lang.rust-analyzer)
- Even Better TOML (tamasfe.even-better-toml)
- CodeLLDB (vadimcn.vscode-lldb)

**通用**:
- GitLens (eamodio.gitlens)
- Material Icon Theme (PKief.material-icon-theme)
- Error Lens (usernamehw.errorlens)

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
cd ~/zhengbi-yong.github.io
code .
```

### JetBrains IDE

**IntelliJ IDEA / WebStorm / RustRover**:

#### 安装

**Ubuntu/Debian**:
```bash
# 下载 Toolbox
wget https://download.jetbrains.com/toolbox/jetbrains-toolbox-xxx.tar.gz

# 解压并运行
tar -xzf jetbrains-toolbox-xxx.tar.gz
./jetbrains-toolbox-xxx/jetbrains-toolbox
```

#### 配置

1. **安装插件**:
   - Rust (for RustRover/IntelliJ)
   - Node.js (for WebStorm)

2. **配置 Node.js**:
   - Settings → Languages & Frameworks → Node.js
   - 设置 Node.js 路径: `/usr/bin/node`

3. **配置 Prettier**:
   - Settings → Languages & Frameworks → JavaScript → Prettier
   - 启用 "On save" reformat

### Vim/Neovim

**安装 vim-plug**:

```bash
curl -fLo ~/.vim/autoload/plug.vim --create-dirs \
    https://raw.githubusercontent.com/junegunn/vim-plug/master/plug.vim
```

**配置 ~/.vimrc**:

```vim
call plug#begin('~/.vim/plugged')

" 前端
Plug 'pangloss/vim-javascript'
Plug 'leafgarland/typescript-vim'
Plug 'peitalin/vim-jsx-typescript'
Plug 'digitaltoad/vim-pug'

" 后端
Plug 'rust-lang/rust.vim'

" 通用
Plug 'preservim/nerdtree'
Plug 'vim-airline/vim-airline'
Plug 'tpope/vim-fugitive'

call plug#end()
```

---

## 常见问题

### 包管理器问题

#### 问题 1: apt install 失败

**症状**: `apt install` 时出现依赖错误

**解决方案**:

```bash
# 修复损坏的依赖
sudo apt --fix-broken install

# 更新包列表
sudo apt update

# 升级系统
sudo apt upgrade -y

# 重新安装
sudo apt install <package>
```

#### 问题 2: dnf lock 被占用

**症状**: Fedora 上 `dnf install` 时提示锁被占用

**解决方案**:

```bash
# 查找占用 dnf 的进程
ps aux | grep dnf

# 等待进程完成或强制终止
sudo killall dnf

# 清理缓存
sudo dnf clean all

# 重新安装
sudo dnf install <package>
```

#### 问题 3: pacman key 错误

**症状**: Arch Linux 上 `pacman -S` 时提示密钥错误

**解决方案**:

```bash
# 初始化密钥环
sudo pacman-key --init
sudo pacman-key --populate archlinux

# 更新系统
sudo pacman -Syu

# 重新安装
sudo pacman -S <package>
```

### Docker 问题

#### 问题 4: docker permission denied

**症状**: 运行 `docker ps` 时提示权限不足

**解决方案**:

```bash
# 将用户添加到 docker 组
sudo usermod -aG docker $USER

# 重新登录或运行
newgrp docker

# 验证
docker ps
```

#### 问题 5: Docker 服务未启动

**症状**: `docker ps` 时提示 "Cannot connect to the Docker daemon"

**解决方案**:

```bash
# Ubuntu/Debian/Fedora
sudo systemctl start docker
sudo systemctl enable docker

# 验证状态
sudo systemctl status docker
```

#### 问题 6: Docker 网络问题

**症状**: 容器无法访问外网

**解决方案**:

```bash
# 重启 Docker 网络
docker network prune

# 重启 Docker 服务
sudo systemctl restart docker
```

### Node.js 问题

#### 问题 7: Node.js 版本过低

**症状**: 运行项目时提示 Node.js 版本不兼容

**解决方案**:

```bash
# 使用 nvm 管理版本
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
source ~/.bashrc

# 安装 Node.js 20
nvm install 20
nvm use 20

# 设置为默认版本
nvm alias default 20
```

#### 问题 8: pnpm 找不到

**症状**: 运行 `pnpm` 时提示命令未找到

**解决方案**:

```bash
# 重新安装 pnpm
npm install -g pnpm

# 检查 PATH
echo $PATH | grep -o "$HOME/.npm-global/bin"

# 如果没有，添加到 PATH
echo 'export PATH="$HOME/.npm-global/bin:$PATH"' >> ~/.bashrc
source ~/.bashrc
```

### Rust 问题

#### 问题 9: Rust 编译错误

**症状**: `cargo build` 时编译失败

**解决方案**:

```bash
# 更新 Rust
rustup update

# 清理构建缓存
cargo clean

# 重新编译
cargo build
```

**如果缺少系统库**:

```bash
# Ubuntu/Debian
sudo apt install -y build-essential pkg-config libssl-dev

# Fedora
sudo dnf install -y gcc gcc-c++ make pkg-config openssl-devel

# Arch Linux
sudo pacman -S base-devel openssl
```

#### 问题 10: cargo 权限错误

**症状**: 安装 crate 时提示权限不足

**解决方案**:

```bash
# 修复 cargo 目录权限
sudo chown -R $USER:$USER ~/.cargo

# 或重新安装 Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
```

### 端口占用问题

#### 问题 11: 端口已被占用

**症状**: 启动服务时提示端口已被使用

**解决方案**:

```bash
# 查找占用端口的进程
sudo lsof -i :3000
sudo lsof -i :3001

# 终止进程
kill -9 <PID>

# 或使用 fuser
sudo fuser -k 3000/tcp
sudo fuser -k 3001/tcp
```

### 内存不足问题

#### 问题 12: 编译时内存不足

**症状**: Rust 编译时系统卡死或 OOM

**解决方案**:

```bash
# 增加 swap 空间
sudo fallocate -l 4G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile

# 永久生效
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab

# 限制并发编译任务
export CARGO_BUILD_JOBS=2
```

---

## 性能优化

### 系统优化

#### 1. 增加文件监控限制

```bash
# 临时增加
sudo sysctl fs.inotify.max_user_watches=524288

# 永久生效
echo fs.inotify.max_user_watches=524288 | sudo tee -a /etc/sysctl.conf
sudo sysctl -p
```

#### 2. 优化内存使用

```bash
# 清理缓存
sudo sync && echo 3 | sudo tee /proc/sys/vm/drop_caches

# 查看内存使用
free -h

# 查看进程内存使用
ps aux --sort=-%mem | head
```

### Docker 优化

#### 1. 限制 Docker 资源

编辑 `/etc/docker/daemon.json`:

```json
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  },
  "storage-driver": "overlay2"
}
```

重启 Docker:

```bash
sudo systemctl restart docker
```

#### 2. 清理 Docker 资源

```bash
# 清理未使用的镜像
docker image prune -a

# 清理未使用的容器
docker container prune

# 清理未使用的卷
docker volume prune

# 清理所有未使用的资源
docker system prune -a
```

### 编译优化

#### 1. Rust 编译优化

```bash
# 使用增量编译
export CARGO_INCREMENTAL=1

# 使用更少的并行任务
export CARGO_BUILD_JOBS=2

# 使用编译缓存
cargo install sccache
export RUSTC_WRAPPER=sccache
```

#### 2. Next.js 构建优化

```bash
# 使用 SWC（默认启用）
# 无需额外配置

# 启用 Turbopack（实验性）
cd frontend
pnpm dev --turbo
```

---

## 快速命令参考

### 系统管理

```bash
# 更新系统
# Ubuntu/Debian
sudo apt update && sudo apt upgrade -y

# Fedora
sudo dnf update -y

# Arch Linux
sudo pacman -Syu

# 查看系统信息
neofetch
# 或
screenfetch
```

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

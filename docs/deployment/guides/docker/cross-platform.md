# 跨平台 Docker 部署完整指南

本指南支持 **Windows、Linux、macOS** 三种平台，本地构建后部署到 Ubuntu 服务器。

## 目录

- [快速开始](#快速开始)
- [平台特性](#平台特性)
- [方法一：使用 Node.js 工具（推荐）](#方法一使用-node-js-工具推荐)
- [方法二：Windows 使用 PowerShell](#方法二-windows-使用-powershell)
- [方法三：Linux/macOS 使用 Bash](#方法三linuxmacos-使用-bash)
- [服务器部署（Ubuntu）](#服务器部署ubuntu)
- [故障排查](#故障排查)

---

## 快速开始

### 选择你的平台

| 本地平台 | 推荐方法 | 命令 |
|---------|---------|------|
| **Windows** | Node.js 或 PowerShell | `npm run build` 或 `.\build-all.ps1` |
| **Linux** | Node.js 或 Bash | `npm run build` 或 `bash build-all.sh` |
| **macOS** | Node.js 或 Bash | `npm run build` 或 `bash build-all.sh` |

### 三步完成部署

```bash
# 1. 本地构建（选择适合你平台的方法）
npm run build          # Node.js（所有平台）
# 或
bash build-all.sh      # Linux/macOS
# 或
.\build-all.ps1        # Windows PowerShell

# 2. 推送镜像
npm run push

# 3. 服务器部署
bash deploy-server.sh <registry> <version>
```

---

## 平台特性

### Windows

- ✅ 支持 PowerShell (.ps1)
- ✅ 支持 Git Bash
- ✅ 支持 WSL (Windows Subsystem for Linux)
- ✅ 支持 Node.js（推荐）

### Linux

- ✅ 原生支持 Bash
- ✅ 支持 Node.js
- ✅ 最佳性能

### macOS

- ✅ 原生支持 Bash (Zsh 也可以)
- ✅ 支持 Node.js
- ✅ 与 Linux 类似的体验

### Ubuntu 服务器

- ✅ 使用 Bash 脚本
- ✅ Docker Compose V2
- ✅ 标准的 Linux 环境

---

## 方法一：使用 Node.js 工具（推荐）

**优势**：跨平台统一命令，Windows/Linux/macOS 完全一致

### 前置要求

所有平台都需要：
- Node.js 18+ (安装: https://nodejs.org)
- Docker (安装: https://www.docker.com/products/docker-desktop)

### Windows 用户

```powershell
# 1. 确保 Node.js 已安装
node --version

# 2. 构建镜像
npm run build

# 3. 推送镜像
npm run push

# 4. 导出镜像（可选，用于离线部署）
npm run export
```

### Linux/macOS 用户

```bash
# 1. 确保 Node.js 已安装
node --version

# 2. 构建镜像
npm run build

# 3. 推送镜像
npm run push

# 4. 导出镜像（可选）
npm run export
```

### 可用命令

| 命令 | 功能 |
|------|------|
| `npm run build` | 构建所有 Docker 镜像 |
| `npm run push` | 推送镜像到仓库 |
| `npm run export` | 导出镜像为 tar 文件 |

---

## 方法二：Windows 使用 PowerShell

### 前置要求

- Windows 10/11
- PowerShell 5.1+
- Docker Desktop for Windows

### 使用方法

```powershell
# 1. 打开 PowerShell（管理员模式）
# 右键点击开始菜单 -> Windows PowerShell (管理员)

# 2. 进入项目目录
cd D:\YZB\zhengbi-yong.github.io

# 3. 检查 Docker
docker --version

# 4. 构建镜像
.\build-all.ps1

# 如果遇到执行策略错误，先运行：
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser

# 5. 测试镜像（可选）
.\test-local.ps1

# 6. 推送镜像
.\push-images.ps1

# 7. 导出镜像（可选）
.\export-images.ps1
```

### PowerShell 常见问题

**问题**: 无法加载脚本，因为在此系统上禁止执行脚本

**解决**:
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

**问题**: Docker 命令不可用

**解决**:
1. 确保 Docker Desktop 正在运行
2. 重启 PowerShell
3. 检查环境变量

---

## 方法三：Linux/macOS 使用 Bash

### 前置要求

- **Linux**: Ubuntu, Debian, CentOS, Fedora 等
- **macOS**: macOS 10.15+
- **Bash** 或 **Zsh**
- Docker Engine

### Linux 用户

```bash
# 1. 确保 Docker 已安装并运行
sudo docker --version
sudo systemctl status docker

# 2. 给脚本添加执行权限（首次）
chmod +x build-all.sh push-images.sh export-images.sh

# 3. 构建镜像
bash build-all.sh
# 或
./build-all.sh

# 4. 测试镜像（可选）
bash test-local.sh

# 5. 推送镜像
bash push-images.sh

# 6. 导出镜像（可选）
bash export-images.sh
```

### macOS 用户

```bash
# 1. 确保 Docker Desktop 已安装并运行
docker --version

# 2. 给脚本添加执行权限（首次）
chmod +x build-all.sh push-images.sh export-images.sh

# 3. 构建镜像
bash build-all.sh

# 4. 推送镜像
bash push-images.sh

# 5. 导出镜像（可选）
bash export-images.sh
```

### 使用 WSL (Windows Subsystem for Linux)

如果你在 Windows 上安装了 WSL，也可以使用 Bash 脚本：

```bash
# 在 WSL (Ubuntu/Debian) 中
cd /mnt/d/YZB/zhengbi-yong.github.io

# 确保可以访问 Docker Desktop
docker --version

# 构建镜像
bash build-all.sh
```

**注意**: WSL 需要配置才能访问 Windows 的 Docker Desktop：
1. 在 Docker Desktop 中启用 "Use the WSL 2 based engine"
2. 或在 `~/.bashrc` 中添加：`export DOCKER_HOST=tcp://localhost:2375`

---

## 服务器部署（Ubuntu）

### 方法一：使用镜像仓库（推荐）

```bash
# 1. SSH 登录服务器
ssh user@your-server-ip

# 2. 克隆项目（如果还没有）
git clone https://github.com/zhengbi-yong/zhengbi-yong.github.io.git
cd zhengbi-yong.github.io

# 3. 部署
bash deploy-server.sh <registry> <version>

# 示例：
# Docker Hub:
bash deploy-server.sh docker.io/username v1.8.2

# 阿里云:
bash deploy-server.sh registry.cn-hangzhou.aliyuncs.com/namespace v1.8.2
```

### 方法二：使用导出的镜像

**从本地上传**:

```bash
# Windows (PowerShell)
scp -r docker-images-export\ user@server:/path/to/project/

# Linux/macOS (Bash)
scp -r docker-images-export/ user@server:/path/to/project/

# 或使用图形化工具：
# - WinSCP (Windows)
# - FileZilla (跨平台)
```

**服务器上导入并部署**:

```bash
# 1. 进入目录
cd docker-images-export

# 2. 导入镜像
bash import-images.sh

# 3. 返回项目目录
cd ..

# 4. 修改 deployments/docker/compose-files/docker-compose.yml 使用本地镜像
# 将 backend 和 frontend 的 image 改为：
#   backend:
#     image: blog-backend:local
#   frontend:
#     image: blog-frontend:local

# 5. 启动服务
docker compose up -d
```

### 方法三：服务器直接构建

```bash
# 1. 克隆项目
git clone https://github.com/zhengbi-yong/zhengbi-yong.github.io.git
cd zhengbi-yong.github.io

# 2. 一键部署
bash deploy-simple.sh
```

---

## 故障排查

### Windows 问题

#### 1. PowerShell 执行策略

**错误**: 无法加载文件 xxx.ps1，因为在此系统上禁止执行脚本

**解决**:
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

#### 2. Docker 未运行

**错误**: error during connect: This error may indicate that the docker daemon is not running

**解决**:
1. 启动 Docker Desktop
2. 等待 Docker 完全启动（任务栏图标不再跳动）
3. 重启 PowerShell

#### 3. 路径包含空格

**错误**: 文件名、目录名或卷标语法不正确

**解决**: 使用引号包裹路径
```powershell
cd "D:\YZB\zhengbi yong\zhengbi-yong.github.io"
```

#### 4. Git Bash 路径问题

在使用 Git Bash 时，Windows 路径需要转换：
```bash
# Windows 路径
D:\YZB\zhengbi-yong.github.io

# Git Bash 路径
cd /d/YZB/zhengbi-yong.github.io
```

### Linux/macOS 问题

#### 1. 权限被拒绝

**错误**: bash: ./build-all.sh: Permission denied

**解决**:
```bash
chmod +x build-all.sh
```

#### 2. Docker 需要 sudo

**错误**: permission denied while trying to connect to the Docker daemon

**解决**:
```bash
# 方法 1: 使用 sudo
sudo docker pull postgres:17-alpine

# 方法 2: 将用户添加到 docker 组（推荐）
sudo usermod -aG docker $USER
newgrp docker
```

#### 3. macOS Docker Desktop 未启动

**错误**: Cannot connect to the Docker daemon

**解决**:
1. 启动 Docker Desktop
2. 等待完全启动（菜单栏图标显示 "Docker Desktop is running"）

### 通用问题

#### 1. 镜像拉取失败

**错误**: Error response from daemon: pull access denied

**原因**:
- 网络问题
- 镜像不存在
- 未登录

**解决**:
```bash
# 检查网络
ping docker.io

# 登录 Docker Hub
docker login

# 使用阿里云镜像加速（中国用户）
# 编辑 /etc/docker/daemon.json (Linux)
# 或 Docker Desktop 设置 (Windows/macOS)
{
  "registry-mirrors": [
    "https://docker.mirrors.ustc.edu.cn"
  ]
}
```

#### 2. 端口被占用

**错误**: port is already allocated

**解决**:
```bash
# Linux/macOS
lsof -i :3000
kill -9 <PID>

# Windows (PowerShell)
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

#### 3. 内存不足

**错误**: no space left on device

**解决**:
```bash
# 清理未使用的镜像
docker image prune -a

# 清理未使用的容器
docker container prune -f

# 清理未使用的卷
docker volume prune -f
```

#### 4. Node.js 脚本失败

**错误**: Cannot find module 'xxx'

**解决**:
```bash
# 重新安装依赖（如果项目有 package.json）
npm install

# 或者直接使用 Bash/PowerShell 脚本
```

---

## 平台特定优化

### Windows 优化

1. **使用 WSL2 后端**
   - Docker Desktop 设置 -> General -> Use the WSL 2 based engine
   - 提升性能和兼容性

2. **分配足够资源**
   - Docker Desktop 设置 -> Resources
   - 建议: 4GB+ 内存, 2+ CPU

3. **启用文件共享**
   - Docker Desktop 设置 -> Resources -> File Sharing
   - 添加项目目录

### Linux 优化

1. **使用非 root 用户**
   ```bash
   sudo usermod -aG docker $USER
   ```

2. **配置日志大小**
   ```bash
   # 编辑 /etc/docker/daemon.json
   {
     "log-driver": "json-file",
     "log-opts": {
       "max-size": "10m",
       "max-file": "3"
     }
   }
   ```

3. **启用 BuildKit**
   ```bash
   # ~/.bashrc 或 ~/.zshrc
   export DOCKER_BUILDKIT=1
   ```

### macOS 优化

1. **增加 Docker 内存**
   - Docker Desktop -> Settings -> Resources -> Memory
   - 建议: 4GB+

2. **使用专用磁盘**
   - Docker Desktop -> Settings -> Resources -> Disk image size
   - 建议: 64GB+

---

## 验证部署

### 本地验证

```bash
# 检查镜像是否构建成功
docker images | grep blog-

# 查看镜像大小
docker images blog-backend:local
docker images blog-frontend:local

# 测试运行（需要数据库等依赖）
# 使用 npm run test:local 或 bash test-local.sh
```

### 服务器验证

```bash
# 检查容器状态
docker compose ps

# 检查健康状态
docker compose exec postgres pg_isready -U blog_user
docker compose exec redis redis-cli ping
curl http://localhost:3000/health

# 查看日志
docker compose logs -f
```

---

## 最佳实践

### 开发环境

1. **本地开发**：使用 `npm run dev` 或 `pnpm dev`
2. **本地测试**：构建镜像后使用 `test-local.sh/ps1`
3. **版本管理**：使用 Git 标签标记版本

### 生产部署

1. **使用镜像仓库**：Docker Hub 或阿里云
2. **版本化镜像**：每次构建使用版本标签
3. **离线备份**：导出镜像作为备份
4. **监控日志**：使用 `docker compose logs -f`

### 安全建议

1. **密钥管理**：不要提交 `.env` 和 `.docker-registry`
2. **最小权限**：容器使用非 root 用户运行
3. **定期更新**：及时更新基础镜像
4. **启用 HTTPS**：生产环境必须使用 SSL

---

## 总结

| 场景 | 推荐方法 |
|------|---------|
| **Windows 开发** | Node.js 或 PowerShell |
| **Linux/macOS 开发** | Node.js 或 Bash |
| **快速构建** | Node.js (`npm run build`) |
| **生产部署** | 使用镜像仓库 |
| **离线部署** | 导出 tar 文件 |
| **CI/CD** | Node.js 脚本或 Docker Compose |

---

## 需要帮助？

- 查看日志: `docker compose logs -f`
- 检查配置: `docker compose config`
- 提交 Issue: https://github.com/zhengbi-yong/zhengbi-yong.github.io/issues

---

**版本**: v1.8.2
**更新**: 2025-12-28

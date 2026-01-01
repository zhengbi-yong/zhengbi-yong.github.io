# 平台快速参考卡片

## Windows 用户

### PowerShell (推荐)

```powershell
# 进入项目目录
cd D:\YZB\zhengbi-yong.github.io

# 允许执行脚本（首次运行）
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser

# 构建镜像
.\build-all.ps1

# 推送镜像
.\push-images.ps1

# 导出镜像
.\export-images.ps1
```

### Node.js (统一命令)

```powershell
# 安装 Node.js 后，所有平台命令一致
npm run build
npm run push
npm run export
```

### Git Bash

```bash
# 在 Git Bash 中使用 Linux 命令
bash build-all.sh
bash push-images.sh
bash export-images.sh
```

---

## Linux 用户

### Bash (推荐)

```bash
# 给脚本添加执行权限（首次）
chmod +x build-all.sh push-images.sh export-images.sh

# 构建镜像
bash build-all.sh
# 或
./build-all.sh

# 推送镜像
bash push-images.sh

# 导出镜像
bash export-images.sh
```

### Node.js (统一命令)

```bash
npm run build
npm run push
npm run export
```

---

## macOS 用户

### Bash/Zsh (推荐)

```bash
# 给脚本添加执行权限（首次）
chmod +x build-all.sh push-images.sh export-images.sh

# 构建镜像
bash build-all.sh

# 推送镜像
bash push-images.sh

# 导出镜像
bash export-images.sh
```

### Node.js (统一命令)

```bash
npm run build
npm run push
npm run export
```

---

## Ubuntu 服务器

### 使用镜像仓库

```bash
# 部署到服务器
bash deploy-server.sh docker.io/username v1.8.2
# 或阿里云
bash deploy-server.sh registry.cn-hangzhou.aliyuncs.com/namespace v1.8.2
```

### 使用导出的镜像

```bash
# 1. 导入镜像
cd docker-images-export
bash import-images.sh

# 2. 修改 deployments/docker/compose-files/docker-compose.yml 使用本地镜像

# 3. 启动服务
docker compose up -d
```

### 一键部署

```bash
bash deploy-simple.sh
```

---

## 常见问题速查

### Windows

| 问题 | 解决方案 |
|------|---------|
| 脚本无法执行 | `Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser` |
| Docker 未运行 | 启动 Docker Desktop |
| 路径有空格 | 使用引号: `cd "path with spaces"` |

### Linux/macOS

| 问题 | 解决方案 |
|------|---------|
| 权限被拒绝 | `chmod +x *.sh` |
| Docker 需要 sudo | `sudo usermod -aG docker $USER` 然后重新登录 |
| 端口被占用 | `lsof -i :3000` 然后 `kill -9 <PID>` |

### 通用

| 问题 | 解决方案 |
|------|---------|
| 镜像拉取失败 | 检查网络，使用镜像加速 |
| 端口被占用 | 停止占用进程或修改端口 |
| 内存不足 | `docker system prune -a` |

---

## 完整工作流示例

### Windows → Ubuntu

```powershell
# === Windows (PowerShell) ===

# 1. 构建
.\build-all.ps1

# 2. 推送到 Docker Hub
.\push-images.ps1
# 输入: docker.io/yourname
```

```bash
# === Ubuntu 服务器 ===

# 3. 部署
bash deploy-server.sh docker.io/yourname v1.8.2
```

### Linux → Ubuntu

```bash
# === Linux ===

# 1. 构建
bash build-all.sh

# 2. 推送
bash push-images.sh
```

```bash
# === Ubuntu 服务器 ===

# 3. 部署
bash deploy-server.sh docker.io/yourname v1.8.2
```

### macOS → Ubuntu (离线)

```bash
# === macOS ===

# 1. 构建
bash build-all.sh

# 2. 导出
bash export-images.sh

# 3. 上传
scp -r docker-images-export/ user@server:/path/
```

```bash
# === Ubuntu 服务器 ===

# 4. 导入
cd docker-images-export
bash import-images.sh

# 5. 部署
cd ..
docker compose up -d
```

---

## 文件清单

### 根目录脚本

| 文件 | 平台 | 功能 |
|------|------|------|
| `build-all.sh` | Linux/macOS | Bash 构建脚本 |
| `build-all.ps1` | Windows | PowerShell 构建脚本 |
| `push-images.sh` | Linux/macOS | Bash 推送脚本 |
| `push-images.ps1` | Windows | PowerShell 推送脚本 |
| `export-images.sh` | Linux/macOS | Bash 导出脚本 |
| `export-images.ps1` | Windows | PowerShell 导出脚本 |
| `deploy-server.sh` | Ubuntu | 服务器部署脚本 |
| `deploy-simple.sh` | Ubuntu | 一键部署脚本 |

### Node.js 脚本

| 文件 | 功能 |
|------|------|
| `scripts/build.js` | 跨平台构建 |
| `scripts/push.js` | 跨平台推送 |
| `scripts/export.js` | 跨平台导出 |

### 配置文件

| 文件 | 说明 |
|------|------|
| `package.json` | Node.js 脚本配置 |
| `.docker-registry` | 镜像仓库配置（自动生成） |
| `VERSION` | 版本号 |

### 文档

| 文件 | 说明 |
|------|------|
| `CROSS_PLATFORM_docs/deployment/QUICK_DEPLOYMENT.md` | 跨平台完整指南 |
| `docs/deployment/QUICK_DEPLOYMENT.md` | 部署详细说明 |
| `DOCKER_UPGRADE_SUMMARY.md` | 镜像升级总结 |

---

## 选择建议

| 场景 | 推荐方案 |
|------|---------|
| **Windows 新用户** | PowerShell 脚本 |
| **Windows 开发者** | Node.js（如果已安装 Node.js） |
| **Linux 服务器管理员** | Bash 脚本 |
| **macOS 开发者** | Bash 或 Node.js |
| **多平台开发** | Node.js（统一命令） |
| **生产环境** | 镜像仓库部署 |
| **无网络环境** | 导出 tar 文件 |

---

## 版本信息

- **项目版本**: v1.8.2
- **更新日期**: 2025-12-28
- **支持平台**: Windows 10+, Ubuntu 18.04+, macOS 10.15+

---

**提示**: 首次使用建议阅读 [跨平台部署指南](CROSS_PLATFORM_docs/deployment/QUICK_DEPLOYMENT.md) 获取详细说明。

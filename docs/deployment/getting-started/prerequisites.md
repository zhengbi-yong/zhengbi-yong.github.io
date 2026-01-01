# Prerequisites / 系统要求

Everything you need before deploying / 部署前需要的一切。

---

## 📋 Overview / 概述

Before deploying, ensure your system meets these requirements.
/ 在部署之前，请确保您的系统满足这些要求。

**Requirements vary by deployment method** / 要求因部署方式而异:
- **Local Development / 本地开发**: Minimal requirements / 最小要求
- **Server Deployment / 服务器部署**: Server-specific requirements / 服务器特定要求
- **Low Resource Deployment / 低配置部署**: Optimized requirements / 优化要求

---

## 🏠 Local Development / 本地开发

### Software Requirements / 软件要求

**Required / 必需**:
- ✅ **Docker** 20.10+ or Docker Desktop
  ```bash
  docker --version
  # Docker version 20.10.0 or higher
  ```

- ✅ **Docker Compose** V2+
  ```bash
  docker compose version
  # Docker Compose version v2.0.0 or higher
  ```

- ✅ **Git** 2.0+
  ```bash
  git --version
  # git version 2.0.0 or higher
  ```

**Recommended / 推荐**:
- 📱 **VSCode** - Code editor / 代码编辑器
- 🔧 **Make** - Build automation (on Linux/macOS)

### Hardware Requirements / 硬件要求

| Component / 组件 | Minimum / 最低 | Recommended / 推荐 |
|-----------------|---------------|-------------------|
| **RAM / 内存** | 8GB | 16GB |
| **Disk Space / 磁盘空间** | 10GB free / 10GB可用 | 20GB free / 20GB可用 |
| **CPU / 处理器** | Any modern CPU / 任何现代处理器 | 4+ cores / 核心 |

### Operating System / 操作系统

**Supported / 支持的系统**:
- ✅ **Windows 10/11** (with Docker Desktop or WSL2)
- ✅ **macOS** 11+ (Big Sur or later)
- ✅ **Linux** (Ubuntu 20.04+, Debian 11+, Fedora, Arch)

**Platform-specific guides / 平台特定指南**:
- [Cross-Platform Guide](../guides/docker/cross-platform.md)

---

## 🖥️ Server Deployment / 服务器部署

### Server Requirements / 服务器要求

#### Minimum Requirements (Single Server) / 最低要求（单服务器）

| Component / 组件 | Minimum / 最低 | Recommended / 推荐 |
|-----------------|---------------|-------------------|
| **RAM / 内存** | 2GB | 4-8GB |
| **Disk Space / 磁盘空间** | 20GB SSD | 40GB+ SSD |
| **CPU / 处理器** | 1 core | 2-4 cores |
| **Bandwidth / 带宽** | 10 Mbps | 100 Mbps |

#### Production Server Requirements / 生产服务器要求

| Component / 组件 | Minimum / 最低 | Recommended / 推荐 |
|-----------------|---------------|-------------------|
| **RAM / 内存** | 4GB | 8GB+ |
| **Disk Space / 磁盘空间** | 40GB SSD | 80GB+ SSD |
| **CPU / 处理器** | 2 cores | 4+ cores |
| **Bandwidth / 带宽** | 50 Mbps | 100 Mbps+ |

### Operating System / 操作系统

**Supported / 支持的系统**:
- ✅ **Ubuntu** 20.04 LTS, 22.04 LTS (Recommended / 推荐)
- ✅ **Debian** 11+, 12+
- ✅ **CentOS** 8+, Stream
- ✅ **Fedora** 35+
- ✅ **RHEL** 8+, 9+

**Note / 注意**:
- Ubuntu/Debian recommended for ease of use
  / 推荐使用Ubuntu/Debian，因为易于使用
- Ensure OS is up-to-date: `sudo apt update && sudo apt upgrade -y`
  / 确保操作系统是最新的

### Software Requirements / 软件要求

**Required / 必需** (will be installed during deployment / 部署期间将安装):
- ✅ **Docker** 24.0+
- ✅ **Docker Compose** V2+
- ✅ **Git** 2.0+
- ✅ **Nginx** (for reverse proxy / 用于反向代理)

**Optional / 可选**:
- 📊 **PostgreSQL Client** - For database access / 数据库访问
- 🔧 **htop** - System monitoring / 系统监控
- 📝 **nano** or **vim** - Text editor / 文本编辑器

### Network Requirements / 网络要求

**Required Ports / 必需端口**:
- ✅ **Port 80** (HTTP) - Must be open / 必须开放
- ✅ **Port 443** (HTTPS) - For SSL certificates / 用于SSL证书

**Firewall Configuration / 防火墙配置**:
```bash
# Allow HTTP and HTTPS / 允许HTTP和HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Enable firewall / 启用防火墙
sudo ufw enable

# Check status / 检查状态
sudo ufw status
```

---

## 💰 Low Resource Deployment / 低配置部署

### Optimized Requirements / 优化要求

**Specifically optimized for 2GB RAM servers / 专门为2GB内存服务器优化**:

| Component / 组件 | Requirement / 要求 |
|-----------------|------------------|
| **RAM / 内存** | 2GB (exact / 精确) |
| **Disk Space / 磁盘空间** | 20GB SSD |
| **CPU / 处理器** | 1-2 cores |
| **Swap / 交换空间** | 2GB recommended / 推荐 |

**Critical Requirements / 关键要求**:
- ⚠️ **SSD is required** / **必须使用SSD** (HDD will be too slow / HDD会太慢)
- ⚠️ **No other major services** / **不要运行其他主要服务**
- ⚠️ **Optimized configuration required** / **需要优化配置**

**Get Started / 开始**:
- [Low Resource Quick Start](../guides/low-resource/quick-start.md)
- [Performance Tuning](../reference/performance-tuning.md)

---

## 🔧 Software Installation / 软件安装

### Docker Installation / Docker安装

**Linux / Linux系统**:

```bash
# Uninstall old versions / 卸载旧版本
sudo apt remove docker docker-engine docker.io containerd runc

# Install dependencies / 安装依赖
sudo apt update
sudo apt install -y ca-certificates curl gnupg lsb-release

# Add Docker's official GPG key / 添加Docker官方GPG密钥
sudo mkdir -p /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg

# Set up Docker repository / 设置Docker仓库
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Install Docker Engine / 安装Docker Engine
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

# Start Docker / 启动Docker
sudo systemctl start docker
sudo systemctl enable docker

# Verify installation / 验证安装
docker --version
docker compose version
```

**macOS / Mac系统**:
- Download [Docker Desktop for Mac](https://www.docker.com/products/docker-desktop)
- Install and follow setup instructions / 安装并按照设置说明操作

**Windows / Windows系统**:
- Download [Docker Desktop for Windows](https://www.docker.com/products/docker-desktop)
- Ensure WSL2 is enabled during installation / 确保安装期间启用WSL2

---

## 🔍 Verification / 验证

### Check Your Setup / 检查设置

**1. Verify Docker / 验证Docker**:
```bash
docker --version
docker compose version
docker ps
```

**2. Verify System Resources / 验证系统资源**:
```bash
# Check RAM / 检查内存
free -h

# Check disk space / 检查磁盘空间
df -h

# Check CPU / 检查CPU
nproc
```

**3. Verify Network / 验证网络**:
```bash
# Check internet connectivity / 检查互联网连接
ping -c 4 google.com

# Check DNS / 检查DNS
nslookup google.com
```

**4. Verify Git / 验证Git**:
```bash
git --version
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"
```

---

## 📝 Preparation Checklist / 准备清单

### Before You Begin / 开始之前

Use this checklist to ensure you're ready to deploy:
/ 使用此清单确保您准备好部署：

**For Local Development / 本地开发**:
- [ ] Docker installed and running / Docker已安装并运行
- [ ] Git installed / Git已安装
- [ ] 8GB RAM available / 8GB内存可用
- [ ] 10GB disk space available / 10GB磁盘空间可用
- [ ] Read [Quick Start](quick-start.md) / 阅读[快速开始]

**For Server Deployment / 服务器部署**:
- [ ] Server provisioned / 服务器已配置
- [ ] SSH access working / SSH访问正常
- [ ] OS is up-to-date / 操作系统是最新的
- [ ] Ports 80 and 443 open / 端口80和443已开放
- [ ] Domain DNS configured (if using custom domain) / 域名DNS已配置（如果使用自定义域名）
- [ ] Read [Production Server Guide](../guides/server/production-server.md) / 阅读[生产服务器指南]

**For Low Resource Deployment / 低配置部署**:
- [ ] 2GB RAM server / 2GB内存服务器
- [ ] SSD disk / SSD磁盘
- [ ] No other services running / 没有其他服务运行
- [ ] Swap configured (2GB) / 交换空间已配置（2GB）
- [ ] Read [Low Resource Guide](../guides/low-resource/quick-start.md) / 阅读[低资源指南]

---

## 🛠️ System Configuration / 系统配置

### Recommended System Settings / 推荐的系统设置

**File Descriptors / 文件描述符** (Linux):
```bash
# Check current limit / 检查当前限制
ulimit -n

# Increase limit (optional, for high traffic) / 增加限制（可选，用于高流量）
echo "* soft nofile 65536" | sudo tee -a /etc/security/limits.conf
echo "* hard nofile 65536" | sudo tee -a /etc/security/limits.conf
```

**Swap Space / 交换空间** (Low Resource servers / 低配置服务器):
```bash
# Create 2GB swap file / 创建2GB交换文件
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile

# Make permanent / 永久生效
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

---

## 📖 Next Steps / 下一步

### Once Prerequisites Are Met / 满足前提条件后

**For Local Development / 本地开发**:
1. [Quick Start](quick-start.md) - 5-minute setup / 5分钟设置
2. [Choosing Your Approach](choosing-your-approach.md) - Select deployment method

**For Server Deployment / 服务器部署**:
1. [Production Server Guide](../guides/server/production-server.md) - Complete walkthrough
2. [Configuration Checklist](../reference/configuration-checklist.md) - Pre-deployment checks

**For Low Resource / 低配置**:
1. [Low Resource Quick Start](../guides/low-resource/quick-start.md) - 3-step deployment

---

## ❓ Need Help? / 需要帮助？

### Common Issues / 常见问题

**Docker won't start? / Docker无法启动？**
- Check Docker Desktop is running / 检查Docker Desktop是否运行
- Verify Docker service: `sudo systemctl status docker`
- 查看[Docker Troubleshooting](../getting-started/troubleshooting-common.md)

**Out of disk space? / 磁盘空间不足？**
- Clean up Docker images: `docker system prune -a`
- Remove old Docker volumes / 删除旧的Docker卷
- 删除不必要的文件

**Permission denied? / 权限被拒绝？**
- Add user to docker group: `sudo usermod -aG docker $USER`
- Logout and login again / 注销并重新登录
- Or use sudo with each command / 或者每个命令使用sudo

### Full Documentation / 完整文档

- [Architecture Overview](../concepts/architecture.md) - Understand system requirements
- [Troubleshooting](../getting-started/troubleshooting-common.md) - Common issues and solutions
- [Deployment Options](../concepts/deployment-options.md) - Compare all deployment methods

---

## ✅ Ready to Deploy? / 准备部署？

Once you've verified all prerequisites, you're ready to go!
/ 验证所有前提条件后，您就可以开始了！

**Choose your path / 选择您的路径**:

- **Local Development / 本地开发**: [Quick Start](quick-start.md)
- **Production Server / 生产服务器**: [Production Server](../guides/server/production-server.md)
- **Low Budget / 低预算**: [Low Resource](../guides/low-resource/quick-start.md)

---

**Version**: 2.0 (World-Class Deployment Documentation)
**Last Updated**: 2026-01-01
**Maintained By**: Deployment Team

🤖 Generated with [Claude Code](https://claude.com/claude-code)

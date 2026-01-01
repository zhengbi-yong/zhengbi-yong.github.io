# Deployment Scripts / 部署脚本

Automated deployment scripts and procedures.
/ 自动化部署脚本和流程。

---

## 📚 Available Scripts / 可用脚本

All scripts are located in `/scripts/deployment/` at the project root.
/ 所有脚本位于项目根目录的`/scripts/deployment/`。

### Quick Deploy / 快速部署
**[quick-deploy.sh](../../../../scripts/deployment/quick-deploy.sh)**

Automated deployment script that:
/ 自动化部署脚本，可以：
- Generates security keys / 生成安全密钥
- Configures environment / 配置环境
- Builds Docker images / 构建Docker镜像
- Starts all services / 启动所有服务

**Usage / 使用**:
```bash
bash scripts/deployment/quick-deploy.sh your-domain.com
```

### SSL Setup / SSL设置
**[setup-ssl.sh](../../../../scripts/deployment/setup-ssl.sh)**

Automated SSL certificate setup with Let's Encrypt.
/ 使用Let's Encrypt的自动化SSL证书设置。

**Usage / 使用**:
```bash
bash scripts/deployment/setup-ssl.sh your-domain.com email@example.com
```

### Verify Deployment / 验证部署
**[verify-deployment.sh](../../../../scripts/deployment/verify-deployment.sh)**

Comprehensive deployment verification.
/ 全面的部署验证。

**Usage / 使用**:
```bash
bash scripts/deployment/verify-deployment.sh https://your-domain.com
```

---

## 🚀 Quick Start / 快速开始

### Using Scripts / 使用脚本

```bash
# 1. Clone repository
git clone https://github.com/zhengbi-yong/zhengbi-yong.github.io.git
cd zhengbi-yong.github.io

# 2. Quick deploy
bash scripts/deployment/quick-deploy.sh your-domain.com

# 3. Setup SSL
bash scripts/deployment/setup-ssl.sh your-domain.com admin@yourdomain.com

# 4. Verify
bash scripts/deployment/verify-deployment.sh https://yourdomain.com
```

---

## ⚠️ Requirements / 要求

- Docker installed / 已安装Docker
- Docker Compose installed / 已安装Docker Compose
- Domain DNS configured / 域名DNS已配置
- Ports 80 and 443 open / 端口80和443已开放

---

## 📖 Related Documentation / 相关文档

- [Production Server Guide](../server/production-server.md) - Manual deployment
- [SSL Setup Guide](../reference/ports-and-networking.md#ssl-tls-configuration) - SSL details
- [Troubleshooting](../../getting-started/troubleshooting-common.md) - Common issues

---

**Version**: 2.0 (World-Class Deployment Documentation)

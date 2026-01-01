# Reference Documentation / 参考文档

Complete reference for configuration, commands, and optimization.
/ 配置、命令和优化的完整参考。

---

## 📖 Overview / 概述

Reference documents provide detailed, technical information for specific tasks and configurations. Use these when you need quick access to commands, configuration options, or technical specifications.
/ 参考文档为特定任务和配置提供详细的技术信息。当您需要快速访问命令、配置选项或技术规范时使用这些文档。

---

## 📚 Available References / 可用参考

### Configuration Checklist / 配置清单 ⭐⭐⭐⭐⭐

**[configuration-checklist.md](./configuration-checklist.md)**

Pre-deployment checklist to ensure everything is configured correctly.
/ 部署前清单，确保一切配置正确。

- Environment variables / 环境变量
- Security settings / 安全设置
- Network configuration / 网络配置
- Database setup / 数据库设置
- Verification steps / 验证步骤

**Use When / 使用时机**: Before deploying to production / 在部署到生产环境之前

---

### Environment Variables / 环境变量 ⭐⭐⭐⭐⭐

**[environment-variables.md](./environment-variables.md)**

Complete reference for all environment variables.
/ 所有环境变量的完整参考。

- Database configuration / 数据库配置
- Redis settings / Redis设置
- Authentication secrets / 认证密钥
- Server configuration / 服务器配置
- Security options / 安全选项
- Monitoring settings / 监控设置

**Key Sections / 关键部分**:
- Generate strong secrets / 生成强密钥
- Default values and validation / 默认值和验证
- Security best practices / 安全最佳实践
- Secret rotation procedures / 密钥轮换流程

**Use When / 使用时机**: Configuring `.env` file / 配置`.env`文件

---

### Commands Reference / 命令参考 ⭐⭐⭐⭐

**[commands.md](./commands.md)**

Essential commands for deployment, management, and troubleshooting.
/ 部署、管理和故障排查的必备命令。

**Covers / 涵盖**:
- Docker commands / Docker命令
- Docker Compose commands / Docker Compose命令
- PostgreSQL commands / PostgreSQL命令
- Redis commands / Redis命令
- Network commands / 网络命令
- System commands / 系统命令
- Quick workflows / 快速工作流

**Use When / 使用时机**: Running commands or troubleshooting / 运行命令或故障排查

---

### Ports and Networking / 端口和网络 ⭐⭐⭐⭐

**[ports-and-networking.md](./ports-and-networking.md)**

Understanding network topology, port mappings, and firewall configuration.
/ 理解网络拓扑、端口映射和防火墙配置。

**Topics / 主题**:
- Port reference (all ports used) / 端口参考（所有使用的端口）
- Network architecture diagram / 网络架构图
- Firewall configuration (UFW, iptables) / 防火墙配置（UFW、iptables）
- Docker networking / Docker网络
- Network security / 网络安全

**Use When / 使用时机**: Configuring firewall or troubleshooting network / 配置防火墙或故障排查网络

---

### Performance Tuning / 性能优化 ⭐⭐⭐

**[performance-tuning.md](./performance-tuning.md)**

Optimization techniques for improving performance.
/ 提高性能的优化技术。

**Optimization Areas / 优化领域**:
- Docker resource limits / Docker资源限制
- PostgreSQL tuning / PostgreSQL调优
- Redis optimization / Redis优化
- Application-level optimization / 应用级优化
- Nginx optimization / Nginx优化
- Monitoring performance / 监控性能

**Use When / 使用时机**: Performance issues or resource constraints / 性能问题或资源限制

---

## 🎯 Quick Reference / 快速参考

### Common Tasks / 常见任务

| Task / 任务 | Reference / 参考 |
|-----------|-----------------|
| **Configure .env / 配置.env** | [Environment Variables](./environment-commands.md) |
| **Setup firewall / 设置防火墙** | [Ports and Networking](./ports-and-networking.md) |
| **Run commands / 运行命令** | [Commands Reference](./commands.md) |
| **Pre-deployment check / 部署前检查** | [Configuration Checklist](./configuration-checklist.md) |
| **Optimize performance / 优化性能** | [Performance Tuning](./performance-tuning.md) |

---

## 🔗 Related Documentation / 相关文档

- [Quick Start](../getting-started/quick-start.md) - Initial setup
- [Production Server Guide](../guides/server/production-server.md) - Detailed deployment
- [Best Practices](../best-practices/) - Security, monitoring, backups
- [Troubleshooting](../getting-started/troubleshooting-common.md) - Common issues

---

## 📖 When to Use Reference Docs / 何时使用参考文档

### During Setup / 设置期间

- [Environment Variables](./environment-commands.md) - Configure `.env`
- [Configuration Checklist](./configuration-checklist.md) - Verify setup

### During Operation / 运行期间

- [Commands Reference](./commands.md) - Daily operations
- [Ports and Networking](./ports-and-networking.md) - Network issues

### For Optimization / 优化

- [Performance Tuning](./performance-tuning.md) - Improve performance
- [Configuration Checklist](./configuration-checklist.md) - Review settings

---

**Version**: 2.0 (World-Class Deployment Documentation)
**Last Updated**: 2026-01-01
**Maintained By**: Deployment Team

🤖 Generated with [Claude Code](https://claude.com/claude-code)

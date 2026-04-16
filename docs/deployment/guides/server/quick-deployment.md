# 快速部署指南

这是单机部署的最快路径，目标是把运维输入压缩到最少。

## 最少输入的自动部署

```bash
bash scripts/deployment/provision-compose-host.sh --target ubuntu@203.0.113.10
```

这条命令会自动完成：

1. 生成生产环境文件和随机安全密钥
2. 在远程主机安装 Docker Engine 与 Docker Compose
3. 上传标准 Compose 运行时包
4. 远程执行数据库迁移和服务启动

默认站点地址会从 SSH 目标推导为 `http://203.0.113.10`。
默认只有边缘代理对公网监听；前端、后端、数据库、Redis 和 Mailpit 默认绑定到 `127.0.0.1`。

## 无需镜像仓库的一键部署

如果你希望直接从当前仓库构建并推送到服务器，不依赖远端拉取镜像：

```bash
bash scripts/deployment/provision-compose-host.sh \
  --target ubuntu@203.0.113.10 \
  --image-source local \
  --configure-firewall
```

这条命令会在本机构建 `blog-backend:local` 和 `blog-frontend:local`，再通过 SSH 直接加载到服务器。

## 推荐的生产命令

```bash
bash scripts/deployment/provision-compose-host.sh \
  --target ubuntu@203.0.113.10 \
  --site-url https://blog.example.com \
  --release-version 1.8.2 \
  --enable-bundled-meilisearch \
  --enable-bundled-minio
```

## 已有系统 nginx 时的生产切换

如果服务器已经由系统 nginx 接管 `80/443`，直接让部署脚本在服务启动后完成切流：

```bash
bash scripts/deployment/provision-compose-host.sh \
  --target ubuntu@203.0.113.10 \
  --site-url https://blog.example.com \
  --cutover-system-nginx
```

这一模式会自动把 Compose edge 默认改成 `127.0.0.1:18080`，避免和系统 nginx 抢占端口。

如需显式回滚：

```bash
bash scripts/deployment/rollback-system-nginx.sh \
  --target ubuntu@203.0.113.10
```

## 分阶段使用

如果你希望拆成几个更可控的步骤：

```bash
# 1. 生成可审查的生产 env
bash scripts/deployment/generate-production-env.sh \
  --public-host 203.0.113.10 \
  --release-version 1.8.2 \
  --smtp-mode mailpit \
  --enable-bundled-mailpit \
  --compose-project-name blog-platform \
  --output .env.production

# 2. 引导服务器
bash scripts/deployment/bootstrap-remote-host.sh \
  --target ubuntu@203.0.113.10 \
  --configure-firewall

# 3. 部署到服务器
bash scripts/deployment/deploy-remote-compose.sh \
  --target ubuntu@203.0.113.10 \
  --env-file .env.production
```

## 并行 staging/canary

如果同一台机器要再起一套隔离环境，直接覆写项目名和端口：

```bash
bash scripts/deployment/provision-compose-host.sh \
  --target ubuntu@203.0.113.10 \
  --remote-dir /opt/blog-platform-staging \
  --site-url http://203.0.113.10:18080 \
  --compose-project-name blog-platform-staging \
  --set-env EDGE_HTTP_PORT=18080 \
  --set-env FRONTEND_PORT=13101 \
  --set-env BACKEND_PORT=13100 \
  --set-env POSTGRES_PORT=25432 \
  --set-env REDIS_PORT=26379 \
  --image-source local \
  --configure-firewall
```

## 服务器前置条件

- 能通过 SSH 登录远程主机
- 远程用户是 `root`，或具备无密码 `sudo`
- 服务器可以访问 Docker 安装源和镜像仓库
- 云防火墙或安全组至少开放：
  - `22/tcp`
  - `80/tcp`
  - `443/tcp`（如果站点放在 HTTPS 反向代理后）
  - 任何自定义边缘端口，例如 `18080/tcp`（用于 staging/canary）

## 访问方式

- 默认边缘代理开启时：`http://<your-host>`
- 如启用了自定义边缘端口：`http://<your-host>:<EDGE_HTTP_PORT>`
- 前端、后端、数据库、Redis、Mailpit 默认仅绑定本机回环地址，不直接暴露到公网

## 维护命令

```bash
# 重新部署当前 env
bash scripts/deployment/deploy-remote-compose.sh \
  --target ubuntu@203.0.113.10 \
  --env-file .env.production

# 本地先做打包/校验，不真正 SSH
bash scripts/deployment/provision-compose-host.sh \
  --target ubuntu@203.0.113.10 \
  --dry-run
```

## 规范文档

- [Automated Compose Deploy](../../../../../../../docs/deployment/guides/server/automated-compose-deploy.md)
- [System Nginx Cutover](../../../../../../../docs/deployment/guides/server/system-nginx-cutover.md)
- [Compose Production Stack](../../../../../../../docs/deployment/guides/compose/production-stack.md)

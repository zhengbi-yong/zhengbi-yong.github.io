#!/usr/bin/env node
/**
 * 打包部署文件
 * 将必要的部署文件打包，上传到服务器
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
};

const log = {
  info: (msg) => console.log(`${colors.green}[INFO]${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}[ERROR]${colors.reset} ${msg}`),
  output: (msg) => console.log(msg),
};

const projectRoot = path.resolve(__dirname, '..');
const DEPLOY_DIR = path.join(projectRoot, 'deployment-package');

console.log('========================================');
console.log('  打包部署文件');
console.log('========================================');
console.log('');

// 清理并创建部署目录
if (fs.existsSync(DEPLOY_DIR)) {
  fs.rmSync(DEPLOY_DIR, { recursive: true, force: true });
}
fs.mkdirSync(DEPLOY_DIR, { recursive: true });

log.info('步骤 1/3: 复制必要文件...');

// 复制 docker-compose 配置
fs.copyFileSync(
  path.join(projectRoot, 'docker-compose.server.yml'),
  path.join(DEPLOY_DIR, 'docker-compose.yml')
);

// 复制环境变量模板
fs.copyFileSync(
  path.join(projectRoot, '.env.server.example'),
  path.join(DEPLOY_DIR, '.env.example')
);

// 复制部署脚本
fs.copyFileSync(
  path.join(projectRoot, 'deploy-server.sh'),
  path.join(DEPLOY_DIR, 'deploy.sh')
);

// 创建 nginx 配置目录
fs.mkdirSync(path.join(DEPLOY_DIR, 'nginx', 'conf.d'), { recursive: true });
fs.mkdirSync(path.join(DEPLOY_DIR, 'nginx', 'ssl'), { recursive: true });

// 创建 README
const readme = `# 博客系统部署包

本目录包含了在服务器上部署博客系统所需的文件。

## 文件说明

- docker-compose.yml - Docker Compose 配置文件
- .env.example - 环境变量模板
- deploy.sh - 部署脚本
- nginx/ - Nginx 配置目录

## 部署步骤

### 1. 上传文件到服务器

将整个目录上传到服务器，例如 ~/blog/

### 2. 配置环境变量

\`\`\`bash
cd ~/blog
cp .env.example .env
nano .env  # 或使用 vim 编辑
# 修改以下必须的安全配置:
# - JWT_SECRET
# - PASSWORD_PEPPER
# - SESSION_SECRET
# - NEXT_PUBLIC_SITE_URL (你的域名)
# - CORS_ALLOWED_ORIGINS (你的域名)
\`\`\`

### 3. 运行部署脚本

\`\`\`bash
chmod +x deploy.sh
bash deploy.sh
\`\`\`

### 4. 配置域名和 SSL (可选)

如果需要使用域名和 HTTPS:

\`\`\`bash
# 安装 certbot
sudo apt update
sudo apt install certbot

# 生成 SSL 证书
sudo certbot certonly --standalone -d yourdomain.com

# 证书会生成在 /etc/letsencrypt/live/yourdomain.com/
# 创建软链接到 nginx 目录
ln -s /etc/letsencrypt/live/yourdomain.com/fullchain.pem ~/blog/nginx/ssl/fullchain.pem
ln -s /etc/letsencrypt/live/yourdomain.com/privkey.pem ~/blog/nginx/ssl/privkey.pem
\`\`\`

### 5. 启用 Nginx

\`\`\`bash
docker compose --profile with-nginx up -d
\`\`\`

## 服务访问

- 前端: http://your-server-ip:3001
- 后端: http://your-server-ip:3000
- 通过 Nginx: http://your-domain.com (如果配置)

## 常用命令

\`\`\`bash
# 查看服务状态
docker compose ps

# 查看日志
docker compose logs -f

# 重启服务
docker compose restart

# 停止服务
docker compose down
\`\`\`

## 故障排查

如果遇到问题:

1. 检查日志: docker compose logs -f
2. 检查服务状态: docker compose ps
3. 检查环境变量: cat .env
4. 检查端口占用: netstat -tlnp | grep -E '3000|3001|80|443'
`;

fs.writeFileSync(path.join(DEPLOY_DIR, 'README.md'), readme);

log.info('文件复制完成 ✓');
console.log('');

log.info('步骤 2/3: 创建 tar.gz 压缩包...');
const tarFile = path.join(projectRoot, 'blog-deployment-package.tar.gz');
execSync(`tar -czf "${tarFile}" -C "${projectRoot}" deployment-package`, {
  stdio: 'inherit',
  shell: true,
});
log.info('压缩包创建完成 ✓');
console.log('');

log.info('步骤 3/3: 显示文件信息...');
const stats = fs.statSync(tarFile);
const sizeMB = (stats.size / (1024 * 1024)).toFixed(2);
log.output(`压缩包大小: ${sizeMB} MB`);
log.output(`位置: ${tarFile}`);
console.log('');

log.info('打包完成！');
console.log('');
log.output('下一步操作:');
log.output('  1. 上传压缩包到服务器:');
log.output(`     scp blog-deployment-package.tar.gz ubuntu@152.136.43.194:~/`);
log.output('');
log.output('  2. 在服务器上解压:');
log.output('     ssh ubuntu@152.136.43.194');
log.output('     cd ~');
log.output('     tar -xzf blog-deployment-package.tar.gz');
log.output('     cd deployment-package');
log.output('     bash deploy.sh');
console.log('');

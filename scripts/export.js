#!/usr/bin/env node
/**
 * 跨平台镜像导出工具
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
};

const log = {
  info: (msg) => console.log(`${colors.green}[INFO]${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}[ERROR]${colors.reset} ${msg}`),
  output: (msg) => console.log(msg),
};

const isWindows = process.platform === 'win32';
const docker = isWindows ? 'docker' : 'sudo docker';

function exec(command) {
  try {
    execSync(command, { stdio: 'inherit', shell: true });
  } catch (error) {
    log.error(`命令执行失败: ${command}`);
    throw error;
  }
}

const projectRoot = path.resolve(__dirname, '..');
process.chdir(projectRoot);

const EXPORT_DIR = path.join(projectRoot, 'docker-images-export');
if (!fs.existsSync(EXPORT_DIR)) {
  fs.mkdirSync(EXPORT_DIR, { recursive: true });
}

console.log('========================================');
console.log('  导出所有 Docker 镜像');
console.log('========================================');
console.log('');
log.info(`导出目录: ${EXPORT_DIR}`);
console.log('');

// 1. 导出基础镜像
log.info('步骤 1/3: 导出基础镜像...');
exec(`${docker} save postgres:17-alpine -o "${path.join(EXPORT_DIR, 'postgres-17-alpine.tar')}"`);
exec(`${docker} save redis:7.4-alpine -o "${path.join(EXPORT_DIR, 'redis-7.4-alpine.tar')}"`);
exec(`${docker} save nginx:1.27-alpine -o "${path.join(EXPORT_DIR, 'nginx-1.27-alpine.tar')}"`);
log.info('基础镜像导出完成 ✓');
console.log('');

// 2. 导出应用镜像
log.info('步骤 2/3: 导出应用镜像...');
exec(`${docker} save blog-backend:local -o "${path.join(EXPORT_DIR, 'blog-backend-local.tar')}"`);
exec(`${docker} save blog-frontend:local -o "${path.join(EXPORT_DIR, 'blog-frontend-local.tar')}"`);
log.info('应用镜像导出完成 ✓');
console.log('');

// 3. 显示文件信息
log.info('步骤 3/3: 导出文件信息:');
console.log('');
log.output('导出的文件:');

const files = fs.readdirSync(EXPORT_DIR).filter((f) => f.endsWith('.tar'));
let totalSize = 0;

files.forEach((file) => {
  const filePath = path.join(EXPORT_DIR, file);
  const stats = fs.statSync(filePath);
  const sizeMB = (stats.size / (1024 * 1024)).toFixed(2);
  totalSize += stats.size;
  log.output(`  ${file} - ${sizeMB} MB`);
});

console.log('');
log.info(`总大小: ${(totalSize / (1024 * 1024)).toFixed(2)} MB`);
console.log('');

// 创建导入脚本
const importScript = `#!/usr/bin/env bash
# 在服务器上导入所有镜像

set -e

RED='\\033[0;31m'
GREEN='\\033[0;32m'
NC='\\033[0m'

log_info() { echo -e "\${GREEN}[INFO]\${NC} \$$1"; }

SCRIPT_DIR="\`$(cd "\`$(dirname "\`$0")" && pwd)"
cd "\$SCRIPT_DIR"

echo "=========================================="
echo "  导入 Docker 镜像"
echo "=========================================="
echo ""

log_info "步骤 1/2: 导入基础镜像..."
docker load -i postgres-17-alpine.tar &
docker load -i redis-7.4-alpine.tar &
docker load -i nginx-1.27-alpine.tar &
wait
log_info "基础镜像导入完成 ✓"
echo ""

log_info "步骤 2/2: 导入应用镜像..."
docker load -i blog-backend-local.tar &
docker load -i blog-frontend-local.tar &
wait
log_info "应用镜像导入完成 ✓"
echo ""

log_info "所有镜像导入完成！"
echo ""
echo "查看镜像: docker images | grep -E 'postgres|redis|nginx|blog-'"
echo ""
`;

fs.writeFileSync(path.join(EXPORT_DIR, 'import-images.sh'), importScript, {
  mode: 0o755,
});
log.info('导入脚本已创建 ✓');
console.log('');

// 创建 README
const readme = `# Docker 镜像导出包

本目录包含了所有构建好的 Docker 镜像。

## 文件说明

- \`postgres-17-alpine.tar\` - PostgreSQL 数据库镜像
- \`redis-7.4-alpine.tar\` - Redis 缓存镜像
- \`nginx-1.27-alpine.tar\` - Nginx 反向代理镜像
- \`blog-backend-local.tar\` - 后端 API 镜像
- \`blog-frontend-local.tar\` - 前端应用镜像

## 在服务器上部署

### 1. 上传到服务器

**从 Windows 上传:**
\`\`\`powershell
# 使用 SCP
scp -r docker-images-export/ user@server:/path/to/project/

# 或使用图形化工具: WinSCP, FileZilla 等
\`\`\`

**从 Linux/macOS 上传:**
\`\`\`bash
scp -r docker-images-export/ user@server:/path/to/project/
\`\`\`

### 2. 导入镜像

\`\`\`bash
cd docker-images-export
bash import-images.sh
\`\`\`

### 3. 部署应用

确保项目的 \`docker-compose.yml\` 配置为使用本地镜像：

\`\`\`bash
cd /path/to/project
docker compose up -d
\`\`\`

## 清理

部署完成后可以删除导出目录：

\`\`\`bash
rm -rf docker-images-export
\`\`\`
`;

fs.writeFileSync(path.join(EXPORT_DIR, 'README.md'), readme);
log.info('README.md 已创建 ✓');
console.log('');

log.info('导出完成！');
console.log('');
log.output('下一步操作:');
log.output('  1. 将 docker-images-export 目录上传到服务器');
log.output('  2. 在服务器上运行: cd docker-images-export && bash import-images.sh');
console.log('');

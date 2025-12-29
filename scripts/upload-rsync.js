#!/usr/bin/env node
/**
 * 使用 rsync 上传 Docker 镜像到服务器
 * 支持 Windows (Git Bash/WSL/Cygwin), Linux, macOS
 */

const { execSync, spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
};

const log = {
  info: (msg) => console.log(`${colors.green}[INFO]${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}[ERROR]${colors.reset} ${msg}`),
  warn: (msg) => console.log(`${colors.yellow}[WARN]${colors.reset} ${msg}`),
  output: (msg) => console.log(msg),
};

const isWindows = process.platform === 'win32';
const projectRoot = path.resolve(__dirname, '..');
const EXPORT_DIR = path.join(projectRoot, 'docker-images-export');

// 检测 rsync 可用性
function findRsync() {
  const rsyncPaths = isWindows
    ? [
        'rsync', // Git Bash / Cygwin
        '/usr/bin/rsync', // WSL
        'C:\\Program Files\\Git\\usr\\bin\\rsync.exe',
        'C:\\msys64\\usr\\bin\\rsync.exe',
      ]
    : ['rsync', '/usr/bin/rsync', '/usr/local/bin/rsync'];

  for (const rsyncPath of rsyncPaths) {
    try {
      execSync(`"${rsyncPath}" --version`, { stdio: 'pipe', shell: true });
      return rsyncPath;
    } catch (e) {
      // continue
    }
  }
  return null;
}

// 执行 rsync
function rsync(source, destination, options = []) {
  const rsyncCmd = findRsync();
  if (!rsyncCmd) {
    throw new Error('rsync 未找到。请安装 Git Bash 或 WSL');
  }

  const args = [
    '-avz', // 归档模式、详细输出、压缩传输
    '--progress', // 显示进度
    '--partial', // 支持断点续传
    ...options,
    source,
    destination,
  ];

  log.output(`执行: ${rsyncCmd} ${args.join(' ')}`);

  return new Promise((resolve, reject) => {
    const proc = spawn(rsyncCmd, args, {
      stdio: 'inherit',
      shell: true,
    });

    proc.on('close', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`rsync 退出码: ${code}`));
    });
  });
}

// 主函数
async function main() {
  console.log('========================================');
  console.log('  使用 rsync 上传 Docker 镜像');
  console.log('========================================');
  console.log('');
  log.info(`平台: ${process.platform} (${isWindows ? 'Windows' : 'Unix-like'})`);
  console.log('');

  // 检查导出目录
  if (!fs.existsSync(EXPORT_DIR)) {
    log.error('导出目录不存在，请先运行: npm run export');
    process.exit(1);
  }

  // 检查 rsync
  log.info('步骤 1/3: 检查 rsync...');
  const rsyncCmd = findRsync();
  if (!rsyncCmd) {
    log.error('rsync 未安装或不在 PATH 中');
    console.log('');
    log.output('Windows 用户请安装以下之一:');
    log.output('  1. Git for Windows (包含 rsync): https://git-scm.com/download/win');
    log.output('  2. WSL (Windows Subsystem for Linux)');
    log.output('  3. Cygwin: https://www.cygwin.com/');
    console.log('');
    process.exit(1);
  }
  log.info(`找到 rsync: ${rsyncCmd} ✓`);
  console.log('');

  // 获取服务器信息
  log.info('步骤 2/3: 配置服务器连接...');
  console.log('');

  // 从命令行参数或环境变量读取
  let server = process.argv[2];
  let remotePath = process.argv[3] || '~/blog-deployment';

  if (!server) {
    // 尝试从配置文件读取
    const configFile = path.join(projectRoot, 'deploy.config.json');
    if (fs.existsSync(configFile)) {
      const config = JSON.parse(fs.readFileSync(configFile, 'utf-8'));
      server = config.server;
      remotePath = config.remotePath || remotePath;
    }
  }

  if (!server) {
    log.error('请提供服务器地址');
    console.log('');
    log.output('使用方法:');
    log.output('  npm run upload-rsync <user@server> [remote-path]');
    log.output('');
    log.output('示例:');
    log.output('  npm run upload-rsync user@192.168.1.100');
    log.output('  npm run upload-rsync user@192.168.1.100 ~/blog');
    log.output('  npm run upload-rsync root@example.com:/var/www/blog');
    console.log('');
    log.output('或者创建 deploy.config.json:');
    log.output(JSON.stringify({ server: 'user@192.168.1.100', remotePath: '~/blog-deployment' }, null, 2));
    console.log('');
    process.exit(1);
  }

  log.output(`服务器: ${server}`);
  log.output(`远程路径: ${remotePath}`);
  console.log('');

  // 执行上传
  log.info('步骤 3/3: 上传镜像文件...');
  console.log('');

  try {
    const source = isWindows
      ? EXPORT_DIR.replace(/\\/g, '/') + '/'
      : EXPORT_DIR + '/';
    const destination = `${server}:${remotePath}`;

    await rsync(source, destination, [
      '--delete', // 删除目标目录中不存在于源目录的文件
    ]);

    console.log('');
    log.info('上传完成! ✓');
    console.log('');
    log.output('下一步操作:');
    log.output(`  1. SSH 登录服务器: ssh ${server}`);
    log.output(`  2. 进入目录: cd ${remotePath}/docker-images-export`);
    log.output('  3. 导入镜像: bash import-images.sh');
    console.log('');

  } catch (error) {
    log.error('上传失败: ' + error.message);
    process.exit(1);
  }
}

// 运行
main().catch((error) => {
  log.error(error.message);
  process.exit(1);
});

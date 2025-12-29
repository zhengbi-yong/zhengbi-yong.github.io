#!/usr/bin/env node
/**
 * 跨平台镜像推送工具
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');
const readline = require('readline');

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
};

const log = {
  info: (msg) => console.log(`${colors.green}[INFO]${colors.reset} ${msg}`),
  warn: (msg) => console.log(`${colors.yellow}[WARN]${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}[ERROR]${colors.reset} ${msg}`),
  output: (msg) => console.log(msg),
};

const isWindows = process.platform === 'win32';
const docker = isWindows ? 'docker' : 'sudo docker';

function exec(command) {
  try {
    return execSync(command, { encoding: 'utf-8', shell: true }).trim();
  } catch (error) {
    return null;
  }
}

const projectRoot = path.resolve(__dirname, '..');
process.chdir(projectRoot);

const CONFIG_FILE = path.join(projectRoot, '.docker-registry');
let REGISTRY = '';

// 读取配置
if (fs.existsSync(CONFIG_FILE)) {
  const content = fs.readFileSync(CONFIG_FILE, 'utf-8');
  const match = content.match(/REGISTRY=(.+)/);
  if (match) REGISTRY = match[1].trim();
}

// 询问配置
async function askRegistry() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const question = (prompt) =>
    new Promise((resolve) => rl.question(prompt, resolve));

  console.log('========================================');
  console.log('  配置 Docker 镜像仓库');
  console.log('========================================');
  console.log('');
  console.log('选择镜像仓库:');
  console.log('  1) Docker Hub (https://hub.docker.com)');
  console.log('  2) 阿里云容器镜像服务');
  console.log('  3) 其他私有仓库');
  console.log('');

  const choice = await question('请选择 [1-3]: ');

  switch (choice.trim()) {
    case '1':
      const username = await question('请输入 Docker Hub 用户名: ');
      REGISTRY = `docker.io/${username}`;
      break;
    case '2':
      const namespace = await question('请输入阿里云命名空间: ');
      REGISTRY = `registry.cn-hangzhou.aliyuncs.com/${namespace}`;
      break;
    case '3':
      REGISTRY = await question('请输入仓库地址: ');
      break;
    default:
      log.error('无效选择');
      rl.close();
      process.exit(1);
  }

  rl.close();

  // 保存配置
  fs.writeFileSync(CONFIG_FILE, `REGISTRY=${REGISTRY}`, 'utf-8');
  console.log('');
  log.info(`配置已保存到 ${CONFIG_FILE}`);
  console.log('');
}

async function main() {
  if (!REGISTRY) {
    await askRegistry();
  }

  console.log('========================================');
  console.log('  推送镜像到仓库');
  console.log('========================================');
  console.log('');
  log.info(`目标仓库: ${REGISTRY}`);
  console.log('');

  // 获取版本号
  let VERSION = 'latest';
  const versionFile = path.join(projectRoot, 'VERSION');
  if (fs.existsSync(versionFile)) {
    VERSION = fs.readFileSync(versionFile, 'utf-8').trim().split('\n')[0];
  } else {
    log.warn("VERSION 文件不存在，使用 'latest' 作为版本号");
  }

  // 时间戳
  const TIMESTAMP = new Date()
    .toISOString()
    .replace(/[:.]/g, '-')
    .replace(/\.\d+Z/, '')
    .slice(0, 15);

  // 1. 标记镜像
  log.info('步骤 1/2: 标记镜像...');

  const tags = [
    `${docker} tag blog-backend:local ${REGISTRY}/blog-backend:${VERSION}`,
    `${docker} tag blog-backend:local ${REGISTRY}/blog-backend:${TIMESTAMP}`,
    `${docker} tag blog-backend:latest ${REGISTRY}/blog-backend:latest`,
    `${docker} tag blog-frontend:local ${REGISTRY}/blog-frontend:${VERSION}`,
    `${docker} tag blog-frontend:local ${REGISTRY}/blog-frontend:${TIMESTAMP}`,
    `${docker} tag blog-frontend:latest ${REGISTRY}/blog-frontend:latest`,
  ];

  for (const tag of tags) {
    exec(tag);
  }

  log.info('所有镜像标记完成 ✓');
  console.log('');

  // 2. 推送镜像
  log.info('步骤 2/2: 推送镜像到仓库...');
  console.log('');

  // 检查登录状态
  const info = exec(`${docker} info`);
  if (!info || !info.includes('Username')) {
    log.warn('未检测到 Docker 登录状态');
    exec(`${docker} login`);
  }

  // 推送
  log.output(`正在推送 blog-backend:${VERSION}...`);
  exec(`${docker} push ${REGISTRY}/blog-backend:${VERSION}`);

  log.output(`正在推送 blog-frontend:${VERSION}...`);
  exec(`${docker} push ${REGISTRY}/blog-frontend:${VERSION}`);

  console.log('');
  log.output('正在推送 latest 标签...');
  exec(`${docker} push ${REGISTRY}/blog-backend:latest`);
  exec(`${docker} push ${REGISTRY}/blog-frontend:latest`);

  log.info('所有镜像推送完成 ✓');
  console.log('');

  console.log('推送的镜像:');
  console.log(`  ${REGISTRY}/blog-backend:${VERSION}`);
  console.log(`  ${REGISTRY}/blog-backend:${TIMESTAMP}`);
  console.log(`  ${REGISTRY}/blog-backend:latest`);
  console.log(`  ${REGISTRY}/blog-frontend:${VERSION}`);
  console.log(`  ${REGISTRY}/blog-frontend:${TIMESTAMP}`);
  console.log(`  ${REGISTRY}/blog-frontend:latest`);
  console.log('');

  log.info('推送完成！');
  console.log('');
  log.output('在服务器上部署:');
  log.output(`  bash deploy-server.sh ${REGISTRY} ${VERSION}`);
  console.log('');
}

main().catch((error) => {
  log.error(error.message);
  process.exit(1);
});

#!/usr/bin/env node
/**
 * 跨平台 Docker 镜像构建工具
 * 支持 Windows、Linux、macOS
 */

const { execSync, spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// 颜色输出
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
};

const log = {
  info: (msg) => console.log(`${colors.green}[INFO]${colors.reset} ${msg}`),
  warn: (msg) => console.log(`${colors.yellow}[WARN]${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}[ERROR]${colors.reset} ${msg}`),
  output: (msg) => console.log(msg),
};

// 检测是否为 Windows
const isWindows = process.platform === 'win32';

// Docker 命令
const docker = isWindows ? 'docker' : 'sudo docker';

// 执行命令
function exec(command, description) {
  try {
    log.output(`执行: ${description || command}`);
    const output = execSync(command, {
      stdio: 'inherit',
      shell: true,
    });
    return output;
  } catch (error) {
    log.error(`命令执行失败: ${command}`);
    throw error;
  }
}

// 并行执行多个命令
function execParallel(commands) {
  return Promise.all(
    commands.map(
      (cmd) =>
        new Promise((resolve, reject) => {
          const parts = isWindows ? ['cmd', '/c', cmd] : ['bash', '-c', cmd];
          const proc = spawn(parts[0], parts.slice(1), {
            stdio: 'inherit',
            shell: true,
          });

          proc.on('close', (code) => {
            if (code === 0) resolve();
            else reject(new Error(`Command failed with code ${code}`));
          });
        })
    )
  );
}

// 获取项目根目录
const projectRoot = path.resolve(__dirname, '..');

async function main() {
  console.log('========================================');
  console.log('  本地构建所有 Docker 镜像');
  console.log('========================================');
  console.log('');
  log.info(`平台: ${process.platform} (${isWindows ? 'Windows' : 'Unix-like'})`);
  console.log('');

  // 1. 检查 Docker
  log.info('步骤 1/4: 检查 Docker 环境...');

  try {
    execSync(`${docker} --version`, { stdio: 'pipe' });
    log.info('Docker 环境检查通过 ✓');
  } catch (error) {
    log.error('Docker 未安装或不在 PATH 中');
    log.output('请安装 Docker: https://www.docker.com/products/docker-desktop');
    process.exit(1);
  }

  console.log('');

  // 2. 拉取基础镜像
  log.info('步骤 2/4: 拉取所有基础镜像...');
  log.output('正在拉取:');
  log.output('  - postgres:17-alpine');
  log.output('  - redis:7.4-alpine');
  log.output('  - nginx:1.27-alpine');
  log.output('  - rustlang/rust:nightly-slim');
  log.output('  - node:22-alpine');
  log.output('  - debian:bookworm-slim');
  console.log('');

  try {
    await execParallel([
      `${docker} pull postgres:17-alpine`,
      `${docker} pull redis:7.4-alpine`,
      `${docker} pull nginx:1.27-alpine`,
      `${docker} pull rustlang/rust:nightly-slim`,
      `${docker} pull node:22-alpine`,
      `${docker} pull debian:bookworm-slim`,
    ]);
    log.info('所有基础镜像拉取完成 ✓');
  } catch (error) {
    log.error('基础镜像拉取失败');
    process.exit(1);
  }

  console.log('');

  // 3. 构建 Backend 镜像
  log.info('步骤 3/4: 构建 Backend 镜像...');

  try {
    const backendDir = path.join(projectRoot, 'backend');
    process.chdir(backendDir);
    exec(`${docker} build -t blog-backend:local -t blog-backend:latest -f Dockerfile .`, '构建 Backend');
    log.info('Backend 镜像构建完成 ✓');
  } catch (error) {
    log.error('Backend 镜像构建失败');
    process.chdir(projectRoot);
    process.exit(1);
  }

  process.chdir(projectRoot);
  console.log('');

  // 4. 构建 Frontend 镜像
  log.info('步骤 4/4: 构建 Frontend 镜像...');

  try {
    const frontendDir = path.join(projectRoot, 'frontend');
    process.chdir(frontendDir);
    exec(`${docker} build -t blog-frontend:local -t blog-frontend:latest -f Dockerfile .`, '构建 Frontend');
    log.info('Frontend 镜像构建完成 ✓');
  } catch (error) {
    log.error('Frontend 镜像构建失败');
    process.chdir(projectRoot);
    process.exit(1);
  }

  process.chdir(projectRoot);
  console.log('');

  // 5. 显示构建的镜像
  log.info('构建完成！正在显示镜像信息...');
  console.log('');
  log.output('构建的镜像:');

  try {
    const images = execSync(`${docker} images | findstr "blog-"`, {
      encoding: 'utf-8',
      shell: true,
    });
    log.output(images);
  } catch (error) {
    // findstr 可能失败，使用 grep
    try {
      const images = execSync(`${docker} images | grep blog-`, {
        encoding: 'utf-8',
        shell: true,
      });
      log.output(images);
    } catch (e) {
      log.warn('无法获取镜像列表');
    }
  }

  console.log('');
  log.info('镜像信息:');

  try {
    const backendInfo = execSync(
      `${docker} images blog-backend:local --format "blog-backend: {{.Tag}} - {{.Size}}"`,
      { encoding: 'utf-8', shell: true }
    );
    log.output(`  ${backendInfo.trim()}`);
  } catch (error) {
    // ignore
  }

  try {
    const frontendInfo = execSync(
      `${docker} images blog-frontend:local --format "blog-frontend: {{.Tag}} - {{.Size}}"`,
      { encoding: 'utf-8', shell: true }
    );
    log.output(`  ${frontendInfo.trim()}`);
  } catch (error) {
    // ignore
  }

  console.log('');
  log.info('本地构建完成！');
  console.log('');
  log.output('下一步操作:');
  log.output('  1. 推送到仓库: npm run push');
  log.output('  2. 导出镜像: npm run export');
  log.output('  3. 测试镜像: npm run test:local (如果配置了)');
  console.log('');
}

// 运行
main().catch((error) => {
  log.error(error.message);
  process.exit(1);
});

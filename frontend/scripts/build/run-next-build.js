const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const frontendRoot = path.resolve(__dirname, '..', '..');
const nextCli = path.join(frontendRoot, 'node_modules', 'next', 'dist', 'bin', 'next');

if (!fs.existsSync(nextCli)) {
  console.error(`Next.js CLI not found at: ${nextCli}`);
  console.error('Run `pnpm install` in the frontend first.');
  process.exit(1);
}

const args = ['build'];

if (process.platform === 'win32') {
  args.push('--webpack');
  console.log('Running Next.js production build with the Windows webpack fallback...');
} else {
  console.log('Running Next.js production build...');
}

const result = spawnSync(process.execPath, [nextCli, ...args], {
  cwd: frontendRoot,
  stdio: 'inherit',
});

if (result.error) {
  throw result.error;
}

if (result.status !== 0) {
  process.exit(result.status ?? 1);
}

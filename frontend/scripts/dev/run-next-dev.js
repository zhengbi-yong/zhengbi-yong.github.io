const { spawn } = require('node:child_process');

const nextBinary = require.resolve('next/dist/bin/next');
const port = process.env.PORT || '3001';
const host = process.env.HOST || '0.0.0.0';

const args = [nextBinary, 'dev', '-p', port, '-H', host];

// Next.js dev defaults to Turbopack, which is still flaky on Windows in this repo.
if (process.platform === 'win32') {
  args.push('--webpack');
}

const child = spawn(process.execPath, args, {
  stdio: 'inherit',
  env: process.env,
});

child.on('exit', (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }

  process.exit(code ?? 0);
});

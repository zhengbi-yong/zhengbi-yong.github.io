const { spawn } = require('node:child_process');

const nextBinary = require.resolve('next/dist/bin/next');
const port = process.env.PORT || '3001';
const host = process.env.HOST || '0.0.0.0';

const args = [nextBinary, 'dev', '-p', port, '-H', host];

// Next.js dev defaults to Turbopack, which has known issues with reactjs-tiptap-editor's
// conditional exports (some subpath exports resolve to undefined in Turbopack bundles).
// Force Webpack on all platforms for stability.
args.push('--webpack');

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

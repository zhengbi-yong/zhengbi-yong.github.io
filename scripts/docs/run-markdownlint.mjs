import { spawn } from 'node:child_process'
import path from 'node:path'
import { collectMaintainedDocs, repoRoot } from './maintained-docs.mjs'

const docs = await collectMaintainedDocs()
const relativeDocs = docs.map((filePath) => path.relative(repoRoot, filePath))

if (relativeDocs.length === 0) {
  console.error('No maintained markdown documents were found.')
  process.exit(1)
}

const args = ['--config', '.markdownlint-cli2.jsonc', ...relativeDocs]
const command = process.platform === 'win32' ? 'markdownlint-cli2.cmd' : 'markdownlint-cli2'
const child = spawn(command, args, {
  cwd: repoRoot,
  stdio: 'inherit',
})

child.on('exit', (code) => {
  process.exit(code ?? 1)
})

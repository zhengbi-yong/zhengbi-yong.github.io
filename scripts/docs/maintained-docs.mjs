import { access, readdir } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const scriptDir = path.dirname(fileURLToPath(import.meta.url))
export const repoRoot = path.resolve(scriptDir, '..', '..')

const rootFiles = [
  'README.md',
  'AGENTS.md',
  'backend/README.md',
  'deployments/README.md',
  'frontend/README.md',
  'frontend/AGENTS.md',
  'scripts/README_ADMIN.md',
  'docs/README.md',
  'docs/INDEX.md',
  'docs/quick-start.md',
  'docs/configuration/config-guide.md',
]

const recursiveDirectories = ['docs/features', 'docs/deployment', 'docs/getting-started']

const ignoredBaseNames = new Set(['CLAUDE.md'])
const ignoredDirectoryNames = new Set(['archive'])

async function fileExists(filePath) {
  try {
    await access(filePath)
    return true
  } catch {
    return false
  }
}

async function walkMarkdownFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true })
  const files = []

  for (const entry of entries) {
    if (entry.isDirectory()) {
      if (ignoredDirectoryNames.has(entry.name)) {
        continue
      }

      files.push(...(await walkMarkdownFiles(path.join(directory, entry.name))))
      continue
    }

    if (!entry.isFile() || path.extname(entry.name) !== '.md') {
      continue
    }

    if (ignoredBaseNames.has(entry.name)) {
      continue
    }

    files.push(path.join(directory, entry.name))
  }

  return files
}

export async function collectMaintainedDocs() {
  const docs = new Set()

  for (const relativePath of rootFiles) {
    const absolutePath = path.join(repoRoot, relativePath)
    if (await fileExists(absolutePath)) {
      docs.add(absolutePath)
    }
  }

  for (const relativeDirectory of recursiveDirectories) {
    const absoluteDirectory = path.join(repoRoot, relativeDirectory)
    if (!(await fileExists(absoluteDirectory))) {
      continue
    }

    for (const filePath of await walkMarkdownFiles(absoluteDirectory)) {
      docs.add(filePath)
    }
  }

  return [...docs].sort()
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  const docs = await collectMaintainedDocs()
  process.stdout.write(`${docs.join('\n')}\n`)
}

import { access, readFile, stat } from 'node:fs/promises'
import path from 'node:path'
import { collectMaintainedDocs, repoRoot } from './maintained-docs.mjs'

const legacyRepoRoot = '/home/Sisyphus/zhengbi-yong.github.io'
const ignoredHttpPatterns = [
  /^mailto:/i,
  /^https?:\/\/localhost(?::\d+)?/i,
  /^https?:\/\/127\.0\.0\.1(?::\d+)?/i,
  /^https?:\/\/(?:www\.)?example\.com/i,
  /^https?:\/\/blog\.example\.com/i,
  /^https?:\/\/yourdomain\.com/i,
  /^https?:\/\/github\.com\/zhengbi-yong\/zhengbi-yong\.github\.io\/(?:issues|issues\/new|discussions)/i,
]

function stripCodeBlocks(content) {
  return content.replace(/```[\s\S]*?```/g, '').replace(/~~~[\s\S]*?~~~/g, '')
}

function normalizeMarkdownDestination(rawDestination) {
  const trimmed = rawDestination.trim()
  const withoutAngleBrackets =
    trimmed.startsWith('<') && trimmed.endsWith('>') ? trimmed.slice(1, -1) : trimmed
  const titleMatch = withoutAngleBrackets.match(/^(\S+)(?:\s+["'(].*)?$/)
  return titleMatch ? titleMatch[1] : withoutAngleBrackets
}

function extractMarkdownLinks(content) {
  const stripped = stripCodeBlocks(content)
  const links = []
  const inlineLinkPattern = /!?\[[^\]]*]\(([^)]+)\)/g

  for (const match of stripped.matchAll(inlineLinkPattern)) {
    const destination = normalizeMarkdownDestination(match[1])
    if (destination) {
      links.push(destination)
    }
  }

  return links
}

function slugifyHeading(text, counts) {
  const base = text
    .trim()
    .toLowerCase()
    .replace(/\p{Extended_Pictographic}/gu, '')
    .replace(/\uFE0F/gu, '')
    .replace(/[`*_~]/g, '')
    .replace(/[^\p{Letter}\p{Number}\p{Script=Han}\s-]/gu, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')

  const count = counts.get(base) ?? 0
  counts.set(base, count + 1)
  return count === 0 ? base : `${base}-${count}`
}

async function getAnchors(markdownPath, cache) {
  if (cache.has(markdownPath)) {
    return cache.get(markdownPath)
  }

  const content = await readFile(markdownPath, 'utf8')
  const counts = new Map()
  const anchors = new Set()

  for (const line of content.split('\n')) {
    const headingMatch = line.match(/^#{1,6}\s+(.+?)\s*#*\s*$/)
    if (!headingMatch) {
      continue
    }

    anchors.add(slugifyHeading(headingMatch[1], counts))
  }

  cache.set(markdownPath, anchors)
  return anchors
}

async function pathExists(targetPath) {
  try {
    await access(targetPath)
    return true
  } catch {
    return false
  }
}

async function resolveFileTarget(currentFile, rawTarget) {
  if (rawTarget.startsWith(legacyRepoRoot)) {
    return path.join(repoRoot, rawTarget.slice(legacyRepoRoot.length))
  }

  if (rawTarget.startsWith('/')) {
    return null
  }

  return path.resolve(path.dirname(currentFile), rawTarget)
}

async function verifyLocalLink(currentFile, target, anchor, anchorCache) {
  const resolvedPath = await resolveFileTarget(currentFile, target)
  if (!resolvedPath) {
    return null
  }

  let targetPath = resolvedPath
  if (!(await pathExists(targetPath))) {
    if (await pathExists(`${targetPath}.md`)) {
      targetPath = `${targetPath}.md`
    } else {
      return `missing target: ${target}`
    }
  }

  const targetStat = await stat(targetPath)
  if (targetStat.isDirectory()) {
    return null
  }

  if (!anchor || path.extname(targetPath) !== '.md' || /^L\d+/i.test(anchor)) {
    return null
  }

  const anchors = await getAnchors(targetPath, anchorCache)
  if (!anchors.has(anchor.toLowerCase())) {
    return `missing anchor: ${target}#${anchor}`
  }

  return null
}

async function verifyHttpLink(target) {
  if (ignoredHttpPatterns.some((pattern) => pattern.test(target))) {
    return null
  }

  const timeout = AbortSignal.timeout(15000)

  try {
    let response = await fetch(target, {
      method: 'HEAD',
      redirect: 'follow',
      signal: timeout,
      headers: { 'user-agent': 'repo-docs-link-check' },
    })

    if (!response.ok && (response.status === 403 || response.status === 405)) {
      response = await fetch(target, {
        method: 'GET',
        redirect: 'follow',
        signal: timeout,
        headers: { 'user-agent': 'repo-docs-link-check' },
      })
    }

    if (!response.ok) {
      return `HTTP ${response.status}`
    }

    return null
  } catch (error) {
    return error instanceof Error ? error.message : 'request failed'
  }
}

const docs = await collectMaintainedDocs()
const anchorCache = new Map()
const failures = []

for (const markdownPath of docs) {
  const content = await readFile(markdownPath, 'utf8')
  const links = extractMarkdownLinks(content)

  for (const link of links) {
    const hashIndex = link.indexOf('#')
    const target = hashIndex >= 0 ? link.slice(0, hashIndex).trim() : link.trim()
    const anchor = hashIndex >= 0 ? link.slice(hashIndex + 1).trim() : undefined

    if (!target && anchor) {
      const anchors = await getAnchors(markdownPath, anchorCache)
      if (!anchors.has(anchor.toLowerCase())) {
        failures.push(`${path.relative(repoRoot, markdownPath)} -> #${anchor}: missing anchor`)
      }
      continue
    }

    if (!target) {
      continue
    }

    if (/^https?:\/\//i.test(target)) {
      const error = await verifyHttpLink(target)
      if (error) {
        failures.push(`${path.relative(repoRoot, markdownPath)} -> ${target}: ${error}`)
      }
      continue
    }

    if (ignoredHttpPatterns.some((pattern) => pattern.test(target))) {
      continue
    }

    const error = await verifyLocalLink(markdownPath, target, anchor, anchorCache)
    if (error) {
      failures.push(`${path.relative(repoRoot, markdownPath)} -> ${link}: ${error}`)
    }
  }
}

if (failures.length > 0) {
  console.error('Broken documentation links detected:')
  for (const failure of failures) {
    console.error(`- ${failure}`)
  }
  process.exit(1)
}

console.log(`Checked ${docs.length} maintained markdown documents: no broken links found.`)

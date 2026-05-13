/**
 * Extract Table of Contents from markdown/MDX content.
 *
 * Uses github-slugger for heading ID generation — the same library used by
 * rehype-slug (via next-mdx-remote/serialize), guaranteeing the generated
 * anchor IDs match the actual heading IDs in the rendered DOM.
 *
 * This is a pure-JS implementation that works on both server and client,
 * unlike fumadocs-core's getTableOfContents which depends on remark (Node.js).
 *
 * Only includes h1 (depth 1) and h2 (depth 2) headings.
 */

import GithubSlugger from 'github-slugger'
import type { TOC } from '@/lib/types/toc'

/**
 * Extract TOC items from markdown/MDX content.
 * Only includes h1 (depth 1) and h2 (depth 2) headings.
 *
 * Creates a fresh GithubSlugger per invocation to avoid state leakage
 * between concurrent SSR requests and client-side re-renders.
 */
export function extractTocFromContent(content: string): TOC {
  if (!content) return []

  const headingRegex = /^(#{1,6})\s+(.+)$/gm
  const toc: TOC = []
  const slugger = new GithubSlugger()

  let match: RegExpExecArray | null
  while ((match = headingRegex.exec(content)) !== null) {
    const depth = match[1].length
    // Only include h1 (depth 1) and h2 (depth 2) headings
    if (depth > 2) continue

    const text = match[2].trim()
    const url = `#${slugger.slug(text)}`

    toc.push({
      title: text,
      url,
      depth,
    })
  }

  return toc
}

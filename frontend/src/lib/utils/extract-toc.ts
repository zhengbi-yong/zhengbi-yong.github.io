/**
 * Extract Table of Contents from MDX/Markdown content
 */

import type { TOC } from '@/lib/types/toc'

/**
 * Convert heading text to URL-safe anchor ID
 */
function headingToId(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s\u4e00-\u9fff-]/g, '') // Keep Chinese chars, alphanumeric, spaces, hyphens
    .replace(/\s+/g, '-') // Spaces to hyphens
    .replace(/-+/g, '-') // Multiple hyphens to single
    .replace(/^-|-$/g, '') // Remove leading/trailing hyphens
}

/**
 * Extract TOC items from markdown/MDX content
 * Only includes h1 (depth 1) and h2 (depth 2) headings
 */
export function extractTocFromContent(content: string): TOC {
  const headingRegex = /^(#{1,6})\s+(.+)$/gm
  const toc: TOC = []
  let match

  while ((match = headingRegex.exec(content)) !== null) {
    const depth = match[1].length
    // Only include h1 (depth 1) and h2 (depth 2) headings
    if (depth > 2) continue

    const text = match[2].trim()
    const url = `#${headingToId(text)}`

    toc.push({
      value: text,
      url,
      depth,
    })
  }

  return toc
}
